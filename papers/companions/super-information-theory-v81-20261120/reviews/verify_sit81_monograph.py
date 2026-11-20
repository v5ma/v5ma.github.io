#!/usr/bin/env python3
"""Fail-closed portable verifier for Super Information Theory: Version 81 (Master Monograph).

Supports:
  python verify_sit81_monograph.py                  # full build-host audit
  python verify_sit81_monograph.py --committed-only # portable fresh-clone audit
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import importlib.util
import json
import pathlib
import re
import subprocess
import sys
from pypdf import PdfReader

sys.dont_write_bytecode = True

PUB_ROOT = pathlib.Path(__file__).resolve().parent.parent
REPO_ROOT = PUB_ROOT.parent.parent

EXPECTED_FROZEN_REFS = {
    "codex/sitproof-stage5-sit80-publications-20261116": "8955eabea1f9876b895fe852431793376149cf6f",
    "research/sit-stage6-functional-response-20261117": "6d34d84eed075cf06136ecba654b159b6c8a82b9",
    "codex/sitproof-stage6-sit80v803-and-lattice-paper-20261118": "d5dc6412da440fc27c1d96c593d522692d51ef9e",
    "codex/sitproof-stage6-sit80v803-hydrogen-style-20261119": "30a71e4ffdda366c8d2489ee553d4a0a8b4c17af",
    "research/sit-stage7-variational-charges-control-20261119": "ee290278fda2cc43f16d086ed2777f2015e98119",
}


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def collect_pdf_fonts(reader: PdfReader) -> list[str]:
    fonts: set[str] = set()
    for page in reader.pages[: min(10, len(reader.pages))]:
        res = page.get("/Resources")
        if not res:
            continue
        font_dict = res.get("/Font")
        if not font_dict:
            continue
        for _, obj in font_dict.items():
            f = obj.get_object()
            base = f.get("/BaseFont")
            if base:
                fonts.add(str(base))
    return sorted(fonts)


def git_out(*args: str, check: bool = True) -> tuple[int, str]:
    r = subprocess.run(["git", *args], cwd=REPO_ROOT, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise subprocess.CalledProcessError(r.returncode, ["git", *args], r.stdout, r.stderr)
    return r.returncode, r.stdout.strip()


def assemble_master_singlefile(master_dir: pathlib.Path) -> str:
    driver = (master_dir / "Super_Information_Theory_81.tex").read_text(encoding="utf-8")

    def expand_input(m: re.Match[str]) -> str:
        rel = m.group(1)
        if not rel.endswith(".tex"):
            rel += ".tex"
        content = (master_dir / rel).read_text(encoding="utf-8")
        return f"% --- BEGIN INPUT {rel} ---\n{content.rstrip()}\n% --- END INPUT {rel} ---"

    return re.sub(r"\\input\{([^}]+)\}", expand_input, driver)


def main() -> int:
    parser = argparse.ArgumentParser(description="Fail-closed auditor for SIT Version 81 Master Monograph.")
    parser.add_argument(
        "--committed-only",
        action="store_true",
        help="Audit committed repository artifacts only (portable across clones without gitignored LaTeX logs).",
    )
    parser.add_argument(
        "--no-write-receipt",
        action="store_true",
        help="Do not overwrite reviews/SIT81-MONOGRAPH-AUDIT-RECEIPT.json.",
    )
    args = parser.parse_args()

    failures: list[str] = []
    report: dict[str, object] = {
        "schema": "sit.v81.monograph_audit_receipt.v1",
        "mode": "committed-only" if args.committed_only else "full-host",
        "generated_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "document": {},
        "checks": {},
    }

    master_dir = PUB_ROOT / "papers/sit81-master-monograph"
    tex_p = master_dir / "Super_Information_Theory_81.tex"
    pdf_p = master_dir / "Super_Information_Theory_81.pdf"
    txt_p = master_dir / "Super_Information_Theory_81.txt"
    log_p = master_dir / "Super_Information_Theory_81.log"
    single_p = master_dir / "Super_Information_Theory_81_singlefile.tex"

    req_files = [tex_p, pdf_p, txt_p, single_p] if args.committed_only else [tex_p, pdf_p, txt_p, single_p, log_p]
    for p in req_files:
        if not p.exists() or p.stat().st_size == 0:
            failures.append(f"Missing or empty artifact: {p.relative_to(PUB_ROOT)}")

    pages = 0
    has_tnr = False
    undef_count: int | None = None
    qmarks = 0
    extracted_norm = ""

    if pdf_p.exists():
        reader = PdfReader(pdf_p)
        pages = len(reader.pages)
        fonts = collect_pdf_fonts(reader)
        has_tnr = any("TimesNewRomanPSMT" in f for f in fonts) and any("TimesNewRomanPS-BoldMT" in f for f in fonts)
        if not has_tnr:
            failures.append(f"TimesNewRomanPS regular+bold font not detected in first 10 pages (found {fonts})")
        mbox = reader.pages[0].mediabox
        if abs(float(mbox.width) - 612.0) > 1.0 or abs(float(mbox.height) - 792.0) > 1.0:
            failures.append(f"Expected US Letter 612x792 pt, got {float(mbox.width)}x{float(mbox.height)}")
        p1_txt = re.sub(r"\s+", " ", reader.pages[0].extract_text() or "").strip()
        p1_txt_kern = re.sub(r"\bV\s+ersion\b", "Version", p1_txt)
        for req_id in (
            "Author: Micah Blumberg",
            "Self Aware Networks Research Institute",
            "https://selfawarenetworks.com",
            "(Version 81)",
            "Version 81 Updated on November 19, 2026",
        ):
            if req_id not in p1_txt_kern:
                failures.append(f"Page 1 missing required SIT 81 Hydrogen house-style token {req_id!r}")

    if tex_p.exists():
        tex_head = tex_p.read_text(encoding="utf-8")[:4000]
        for req_tex in (
            r"\documentclass[american,11pt,letterpaper]{article}",
            r"\setmainfont[]{Times New Roman}",
            "colorlinks=true",
            "linkcolor={blue}",
            "citecolor={blue}",
            "urlcolor={blue}",
            r"\pagestyle{fancy}",
            "(Version 81)",
        ):
            if req_tex not in tex_head:
                failures.append(f"Driver .tex missing required directive {req_tex!r}")

    if log_p.exists():
        log_txt = log_p.read_text(encoding="utf-8", errors="replace")
        undef = re.findall(r"LaTeX Warning:.*(?:undefined|multiply-defined|multiply defined|Rerun to get).*", log_txt)
        undef_count = len(undef)
        if undef:
            failures.append(f"LaTeX warnings in log: {undef[:5]}")

    if txt_p.exists():
        extracted = txt_p.read_text(encoding="utf-8", errors="replace")
        qmarks = len(re.findall(r"\?\?", extracted))
        if qmarks != 0:
            failures.append(f"Found {qmarks} '??' tokens in extracted text")
        extracted_norm = re.sub(r"\s+", " ", extracted)

    # Byte-for-byte assembled-source parity
    singlefile_exact_match = False
    if single_p.exists() and tex_p.exists():
        stxt = single_p.read_text(encoding="utf-8")
        if re.search(r"\\input\{sections/", stxt):
            failures.append("Super_Information_Theory_81_singlefile.tex contains unresolved \\input{sections/...}")
        expected_single = assemble_master_singlefile(master_dir)
        if stxt != expected_single:
            failures.append(
                f"Super_Information_Theory_81_singlefile.tex diverges from assembled sources "
                f"(actual={len(stxt)}, expected={len(expected_single)})"
            )
        else:
            singlefile_exact_match = True

    # Verify quarantined legacy figures absent
    for bad_fig in (
        master_dir / "figures/fig4_cassini_symmetron_exclusion.pdf",
        master_dir / "figures/fig5_clock_bec_sensitivity.pdf",
    ):
        if bad_fig.exists():
            failures.append(f"Quarantined legacy figure present: {bad_fig.name}")

    # Forbidden patterns across all source .tex files (excluding generated singlefile mirror)
    forbidden_patterns = [
        (r"\b(?:NP\d{2}|Z\d{8})\b", "internal workbook identity code (NP## / Z########)"),
        (r"D:\\micahone|C:\\Users\\micah", "private local filesystem path"),
        (r"Stage6Extensions", "wrong Stage 6 namespace Stage6Extensions"),
        (r"690 total", "660+30 conflation '690 total'"),
        (r"\b667\s+(?:total\s+)?(?:\\texttt\{\.lean\}|Lean~4\.30)", "stale 667 .lean file count"),
        (r"41/41\s*\$?\s*Stage-6", "stale 41/41 Stage-6/Addendum theorem count"),
        (r"O\(a\^4\s*\(\\nabla f\)\^2/f\)", "legacy O(a^4) AM-GM error"),
        (r"\\alpha_\{\\mathrm\{eff\}\}(?:\s|\\,|\\;|\\!|\\quad|\\qquad)*\\frac\{\\delta\s*\\rho_t\}\{\\rho_0\}", "double-counted alpha_eff * delta_rho_t/rho_0"),
        (r"\\alpha_\{\\mathrm\{eff\}\}(?:\s|\\,|\\;|\\!)*\\delta\s*\\rho_t", "double-counted alpha_eff * delta_rho_t"),
        (r"\|\\alpha_\{\\mathrm\{eff\}\}\|\s*\\lesssim\s*3\s*\\times\s*10\^\{-8\}\s*\\?\s*\(95\\%\s*CL\)", "unquarantined 3e-8 95% CL claim"),
        (r"\+\\frac\{\\lambda\}\{2\}\s*g\^\{\\mu\\nu\}\s*\\partial_\\mu\s*R_\{\\mathrm\{coh\}\}", "Appendix E wrong-sign kinetic term"),
        (r"\\square\s*\\delta\s*R_\{\\mathrm\{coh\}\}\s*\+\s*\\frac\{m_R\^2\}\{\\lambda\}", "Appendix E wrong-sign Klein-Gordon equation"),
        (r"10\^\{-15\}[^\n]{0,80}non-tunable", "unsupported 1e-15 non-tunable lab forecast"),
        (r"10\^\{-16\}[^\n]{0,80}falsif", "unsupported 1e-16 falsification claim"),
        (r"measurably stronger", "unsupported BEC measurably stronger gravitational pull claim"),
        (r"\\alpha_\{\\mathrm\{eff\}\}\s*\\approx\s*10\^\{-8\}", "unsupported alpha_eff ~ 1e-8 lower bound"),
        (r"f\s*=\s*\\exp\[\\beta\s*\\rho_0", "dimensionally inconsistent f = exp[beta rho_0 (...)]"),
        (r"\\overline\{\\Theta\s*O\}", "OS reflection positivity double-conjugation bug"),
        (r"54-fold\s+symmetric", "erroneous Lee 2020 54-fold symmetric description"),
        (r"platinum,\s*molybdenum,\s*or\s*tantalum", "erroneous Lee 2020 molybdenum/tantalum materials"),
        (r"differs\s+from\s+(?:Model~?L1|S_\{\\mathrm\{L1\}\})\s+(?:\\emph\{)?solely(?:\})?\s+by", "L3 vs L1 'solely by' omission of kappa_t"),
        (r"NIST/BACON[^\n]{0,140}(?:ratio\s+floor|uncertainty\s+floor|precision\s+floor)", "NIST/BACON misstated as universal clock floor"),
        (r"fig4_cassini_symmetron_exclusion", "active reference to retired fig4"),
        (r"\\SITConditionalFigure\{fig5_clock_bec_sensitivity\}", "active figure embedding of retired fig5"),
        (r"Short-Range\s+Tests\s+of\s+the\s+Gravitational\s+Inverse-Square\s+Law", "wrong Lee 2020 dissertation title"),
        (r"Falsifiability\s+Condition", "legacy unsupported forecast table"),
        (r"\\Delta\s*\\nu\s*/\s*\\nu\s*\\sim\s*10\^\{-11\}", "legacy unsupported 10^-11 clock forecast"),
        (r"\\Delta\\Phi/\\Phi\s*\\sim\s*10\^\{-10\}", "legacy unsupported 10^-10 BEC forecast"),
        (r"Relative\s+gravity\s+shift\s*\\lesssim\s*10\^\{-12\}", "legacy unsupported 10^-12 decoherence forecast"),
        (r"free-space", "erroneous NIST/BACON free-space apparatus claim"),
        (r"\\Delta\s*\\phi\s*\\sim\s*10\^\{-3\}\\;\\text\{radians\}", "unsupported cold-atom 10^-3 rad phase forecast"),
        (r"non-tunable\s+perturbation\s+to\s+the\s+gravitational\s+potential", "unsupported synchronized-oscillator gravity claim"),
        (r"\\text\{Deviation:\}\\;1--2\\%", "unsupported 1--2% lensing percentage"),
        (r"guaranteeing\s+consistency\s+with\s+all\s+established\s+experiments", "unsupported universal agreement claim"),
        (r"10\s+picometers\s+over\s+a\s+one-meter\s+baseline", "unsupported 10-picometer cold-atom forecast"),
        (r"necessary\s+form\s+of\s+the\s+connection", "flat-connection claimed as necessary connection"),
        (r"couples\s+to\s+the\s+phase\s+through\s+the\s+gauge\s+connection", "Part I flat-connection two-slit claim"),
        (r"couples\s+minimally\s+through\s+\$A_i=", "Part I flat-connection CPT claim"),
        (r"constrains\s+the\s+product[^\n]{0,40}10\^\{-8\}", "unwithdrawn legacy CRT 10^-8 empirical bound"),
        (r"serves\s+as\s+a\s+calibrated\s+probe", "unwithdrawn legacy CRT calibrated-probe claim"),
        (r"experiments\s+validate\s+SIT\s+coherence\s+principles", "unsupported VR/AR/BCI validation claim"),
        (r"validating\s+coherence\s+theories", "unsupported VR/AR/BCI validation claim"),
        (r"providing\s+biological\s+validation\s+of\s+SIT", "unsupported dendritic biological validation claim"),
        (r"validate\s+SIT's\s+foundational\s+symmetry\s+claims", "unsupported Guff et al. validation claim"),
        (r"SIT\s+generates\s+precise,\s*testable\s+predictions", "unsupported Part III Section 42 prediction overclaim"),
        (r"empirically\s+validating\s+SIT\s+predictions", "unsupported Appendix B empirical-validation wording"),
        (r"remainders\s+contribute\s+equally", "imprecise equal-contribution statement for cross-product remainders"),
        # New SIT Version 81 regression guards:
        (r"\(Version\s+80\.3\s+Working\s+Draft\)", "stale Version 80.3 title/subtitle in SIT 81"),
        (r"is\s+a\s+non-increasing\s+function\s+of\s+time\s+under\s+any\s+CPTP\s+map", "retracted universal CPTP purity-decay theorem"),
        (r"Equality\s+holds\s+if\s+and\s+only\s+if\s+the\s+(?:evolution\s+is\s+unitary|system\s+is\s+closed\s+and\s+evolves\s+unitarily)", "retracted purity equality-iff-unitary claim"),
        (r"For\s+every\s+solution\s+of\s+the\s+field\s+equations\s+the\s+sum\s+\$S_\\mathrm\{coh\}\+S_\\mathrm\{dec\}\$\s+is\s+conserved", "overstated S_coh+S_dec universal conservation claim"),
        (r"millihertz-level\s+clock\s+slow-downs", "ungrounded Version 79 phononic-superlattice numerical forecast"),
        (r"SIT\s+further\s+predicts\s+observational\s+signatures", "unqualified cosmological prediction claim in Section 50"),
        (r"no\s+(?:earlier\s+)?SIT\s+(?:Version\s+)?80\s+before\s+November\s+2026", "incorrect chronology denying July 2026 Version 80 lineage"),
        # Ten-group SIT 81 scientific-consistency regression guards:
        (r"\\hat\{\\mathcal\s*R\}_\{\\mathrm\{coh\}\}\\;\\ket\{\\psi_1\}", "Group 1: impossible linear coherence operator annihilating product states"),
        (r"\\langle\s*\\hat\{\\mathcal\s*R\}_\{\\mathrm\{coh\}\}\\rangle\s*\\;\s*\\equiv\s*\\;\s*2", "Group 1: impossible linear operator assigned nonlinear 2|rho_01|"),
        (r"Energy\s+of\s+Entanglement.*The\s+Coherence\s+Operator", "Group 1: surviving impossible Coherence Operator in Section 12"),
        (r"\\mathcal\{C\}_A\\,\s*\\mathcal\{C\}_B\s*\\gtrsim", "Group 2: retracted universal basis-coherence lower bound"),
        (r"enforces\s+a\s+global\s+conservation\s+of\s+informational\s+entropy", "Group 2: surviving universal informational-entropy conservation claim"),
        (r"The\s+H-Theorem\s+proves\s+that\s+global\s+coherence\s+is\s+non-increasing", "Group 2: surviving universal global-coherence H-theorem claim"),
        (r"trajectories\s+that\s+would\s+raise\s+\\?\(R_\{\\mathrm\{coh\}\}", "Group 2: overattributed Deng-Hani-Ma claim for R_coh"),
        (r"dynamically\s+preferred\s+because\s+\$\(d\\mathcal\s*H/dt\)\\le\s*0\$", "Group 3: retracted universal Lyapunov claim on H[R] = -int R ln R"),
        (r"\\partial_\{t\}R_\{\\mathrm\{coh\}\}\s*\+\\frac\{\\hbar\}\{m\}", "Group 3: amplitude R instead of squared density R^2 in continuity equation"),
        (r"\\mathbf\{A\}_\{\\text\{Berry\}\}\s*\\propto\s*\\nabla\\theta", "Group 4: flat Berry connection grad(theta) claimed to generate nonzero torque"),
        (r"\\frac\{\\tau_\{\\mu\\nu\\rho\}[^\n]{0,30}\}\{\\Box\s*\\rho_\{t\}\}", "Group 4: retracted singular Riemann = const * torque / Box(rho_t) claim"),
        (r"High-density\s+screened\s+interior\s*\(\$\\rho_m\s*\\ge\s*\\lambda_\\psi", "Group 5: naive portal-valley screening threshold ignoring V'(rho_in)"),
        (r"Existing\s+torsion-balance\s+data\s+already\s+impose", "Group 6: unsupported beta < 1e-5 torsion-balance claim in Sec 30"),
        (r"SIT\s+is\s+only\s+viable\s+if\s+these\s+corrections\s+satisfy", "Group 6: invalid Appendix E.1 parameter viability box"),
        (r"Any\s+deviation\s+outside\s+these\s+bounds\s+is\s+empirically\s+excluded", "Group 6: invalid Appendix E.1 universal exclusion claim"),
        (r"reduces\s+to\s+\$-\s*\\frac\{1\}\{2\}\s*g_\{\\mu\\nu\}\s*V\(\\rho_0\)\$", "Group 6: Appendix E.1 missing factor of 2 in constant-field stress tensor"),
        (r"10\^\{-18\}\s*\\,\s*\\mathrm\{eV\}\s*\\lesssim\s*m_\{\\rho\}", "Group 6: retired Appendix E.7 ungrounded parameter box"),
        (r"m\(x\)\s*=\s*\\frac\{\\zeta\}\{c\^2\}", "Group 7: dropped volume in m(x) = zeta/c^2 |psi| rho_t^2"),
        (r"explains\s+Dark\s+Matter\s+as\s+the\s+mass\s+generated", "Group 7: overstated dark-matter derivation from phenomenological energy ansatz"),
        (r"J_\{\\mu\}\^\{\\text\{coh\}\}\s*=\s*\\kappa_\{c\}\\,R_\{\\text\{coh\}\}\\,\\partial_\{\\mu\}\s*\\arg\s*R_\{\\text\{coh\}\}", "Group 8: invalid arg(R_coh) current in neuroscience section"),
        (r"effective\s+time-density\s+dipole", "Group 8: neural-to-spacetime time-density dipole conflation"),
        (r"same\s+renormalisation\s+flow\s+that\s+constrains", "Group 8: synaptic plasticity equated to gravitational RG flow"),
        (r"\\frac\{[^}]*\}\{6\\rho_\{\\mathrm\{tot\}\}\}", "Group 9: wrong factor 6*rho_tot in Friedmann linearization (must be 2*rho_tot)"),
        (r"naturally\s+reproducing\s+the\s+Tully--Fisher\s+relation", "Group 9: single-galaxy flat-curve profile conflated with baryonic Tully-Fisher"),
        (r"replaces\s+unseen\s+dark\s+components", "Group 9: unqualified cosmological dark-matter replacement claim"),
        (r"serving\s+as\s+a\s+powerful\s+independent\s+validation", "Group 10: overstated CFS independent-validation claim"),
        (r"proving\s+their\s+operational\s+equivalence\s+for\s+this\s+fundamental\s+process", "Group 10: overstated CFS two-outcome operational equivalence claim"),
        (r"formally\s+proves\s+that\s+SIT\s+provides\s+a\s+complete\s+semantic\s+interpretation", "Group 10: overstated CFS semantic-embedding claim"),
        (r"formalizes\s+the\s+argument\s+that\s+SIT\s+is\s+strictly\s+more\s+expressive", "Group 10: overstated CFS greater-expressive-power claim"),
        (r"10\\,pm\s+level\s+over\s+a\s+metre\s+baseline", "Sec 14 unsupported 10 pm interferometer forecast"),
        (r"Laboratory\s+torsion-balance\s+data\s+bound\s+\$\|\\beta\|<10\^\{-5\}\$", "Sec 14 unsupported standalone |beta|<10^-5 bound"),
        (r"blocks\s+the\s+formation\s+of\s+true\s+curvature\s+singularities", "Sec 21 unproved informational-horizon singularity avoidance"),
        (r"render\s+the\s+mirror-universe\s+hypothesis\s+superfluous", "Sec 21 overclaim rendering singularity/measurement problems solved"),
        (r"higher\s+time\s+density\s+lower\s+the\s+exponent\s+and\s+enhance\s+tunneling", "Sec 15.1 sign error in WKB tunneling exponent"),
        # Second-review scientific & mathematical regression guards:
        (r"holds\s+iff\s+\$\\partial_\{\|\\psi\|\}\^2\s*V_\{\\mathrm\{eff\}\}", "Review2-1: false 'iff radial >= 0' screening stability claim"),
        (r"hyperbolic\s+wave\s+propagation[^\n]{0,60}exact\s+GR/Maxwell\s+recovery\s+as\s+\$\(\\rho_t,\s*\|\\psi\|\)\s*\\to\s*\(\\rho_0,\s*0\)\$", "Review2-3: broken-phase (rho_0, 0) non-vacuum GR recovery claim"),
        (r"Solar\s+System\s+PPN\s+safety\.", "Review2-3: unqualified positive-parameter Solar System PPN safety claim"),
        (r"\\langle\\hat\{R\}_\{\\mathrm\{coh\}\}\\rangle", "Review2-4: surviving retired Rhat_coh expectation in GP3"),
        (r"uniquely\s+fixed\s+at\s+dimension\s*\\le\s*4", "Review2-8: false action uniqueness claim at dim <= 4"),
        (r"quantum\s+Fisher\s+information\s+relative\s+to\s+a\s+declared\s+generator\)\s+that\s+vanishes\s+on\s+separable", "Review2-6: false claim that ordinary QFI vanishes on separable states"),
        (r"i\\hbar\\,\\partial_\\tau\s+A_\{ij\}\(\\tau\)\s*\n\s*=\s*-\\kappa_\{\\mathrm\{net\}\}\\sum_k\s+L_\{ik\}\s+A_\{kj\}", "Review2-7: non-Hermiticity-preserving network evolution equation"),
        (r"emerges\s+formally\s+as\s+monotonic\s+decay\s+of\s+subsystem\s+purity.*under\s+CPTP\s+Lindblad", "Review2-5: unrestricted CPTP Lindblad purity-decay summary in Appendix W"),
        (r"obeys\s+\\\(\\dot\s*r=-\\partial\\mathcal\s*H", "Review2-10: invalid Kuramoto r_dot = -dH/dPsi identity"),
        (r"\\frac\{d\\rho_t\}\{dt\}\s*=\s*\\alpha_\{\\mathrm\{sync\}\}\\sum_\{i,j\}\\sin", "Review2-10: identically vanishing antisymmetric double sum"),
        (r"\\Gamma\[p\]\s*\\;\s*\\propto\s*\\;\s*\\sup_\{t\}\\,\\log", "Review2-9: unclipped log recursion attenuation cost (negative on contractions)"),
        (r"d\\mathcal\{G\}/dt\s*\\leq\s*0", "Review2-5/9: unrestricted global monotonicity claim in Appendix Q"),
        (r"G_\{\\mathrm\{eff\}\}\s*=\s*\\frac\{G\}\{f\(", "Review2-3: wrong reciprocal G/f in Sec 20"),
        # Upload-readiness third-pass regression guards:
        (r"projects\s+\$\\theta\$\s+to\s+\$0\$\s+or\s+\$\\pi\$\)\.?\s+Operationally,\s+this\s+means\s+the\s+post-measurement\s+state\s+is\s+either", "Review3-1: false phase-fixing = computational projection claim"),
        (r"collapsing\s+the\s+phase\s+fiber\s+to\s+a\s+fixed\s+value\s+and\s+eliminating\s+superposition", "Review3-1: false phase-fixing eliminates superposition claim"),
        (r"^\\kappa_c\\,D_\\mu\s*D\^\\mu\\psi\s*(?:-\s*|&=\s*)\\frac\{\\partial\s*V_\{\\mathrm\{tot\}\}\}\{\\partial\\psi\^\*\}", "Review3-3a: missing 1/2 in summary complex-scalar EOM against undoubled d/dpsi*"),
        (r"constrained\s+by\s+torsion-balance\s+tests\s+to\s+\$\|\\beta\|\s*<\s*10\^\{-5\}\$", "Review3-4: surviving accelerated-frame |beta|<10^-5 claim"),
        (r"\\Delta\\nu/\\nu\\approx\s*5\\times\s*10\^\{-11\}", "Review3-4: surviving unsupported 5e-11 clock forecast in Sec 24"),
        (r"look\s+for\s+the\s+predicted\s+one-percent\s+mass-profile\s+correction", "Review3-4: surviving unsupported 1% cluster mass-profile forecast in Sec 24"),
        (r"local\s+purity\s+of\s+ensemble\s+at", "Review3-5: Appendix E.3 classical R_coh equated to ensemble purity"),
        (r"This\s+completes\s+the\s+explicit\s+demonstration\s+that\s+SIT\s+recovers", "Review3-5: overstated Appendix E completion banner"),
        (r"for\s+in\s+SIT\s+every\s+physical\s+system\s+obeys\s+the\s+same\s+schematic\s+evolution\s+law", "Review3-6: overstated universal diffusion-advection law in Sec 35"),
        (r"concrete\s+laboratory\s+realisation\s+already\s+exists\s+in\s+closed-loop\s+human--AI\s+VR", "Review3-6: uncited existing human-AI VR experiment claim"),
        (r"\\max\\!\\Bigl\(0,\\;\\log\\rho", "Review3-7: unguarded log(0) in recursion cost (use log max(1, rho))"),
    ]

    tabular_checked = 0
    combined_tex = []
    for p in sorted(master_dir.rglob("*.tex")):
        if p.name == "Super_Information_Theory_81_singlefile.tex":
            continue
        raw = p.read_bytes()
        if b"\x00" in raw:
            failures.append(f"NUL byte detected in {p.relative_to(PUB_ROOT)}")
        txt = raw.decode("utf-8", errors="replace")
        combined_tex.append(txt)
        for bad_pat, desc in forbidden_patterns:
            if re.search(bad_pat, txt):
                failures.append(f"{p.relative_to(PUB_ROOT)}: matched forbidden pattern ({desc})")
        for tab_m in re.finditer(r"\\begin\{tabular\}.*?\\end\{tabular\}", txt, re.DOTALL):
            tabular_checked += 1
            tab_txt = tab_m.group(0)
            if re.search(r"Predicted\s+Effect|Estimated\s+Magnitude", tab_txt, re.I) and re.search(
                r"10\^\{-1[012]\}|10\^\{-3\}", tab_txt
            ):
                failures.append(f"{p.relative_to(PUB_ROOT)}: quantitative forecast table retains unsupported amplitude")

    all_tex = "\n".join(combined_tex)
    for req_tok in (
        "Version~81",
        "10.5281/zenodo.21693867",
        "Version~80 Draft~13",
        "July~26, 2026",
        "tab:july-v80-vs-nov-v81",
        "Non-unital amplitude damping increases purity",
        "Non-unitary complete dephasing preserves purity",
        "data-processing inequality",
        "Penrose--Onsager",
        "eq:bec_matched_residual",
        "subsec:identifiability-and-qgtcd-guardrails",
        "QGTCD Constraints Note",
        "Learning to Feel",
        "v1.2",
        "v1.1",
        "$48/48$",
        "Violation of Linearity Under Mixing",
        "Computational Product Basis Forces",
        "Hadamard",
        "Opposite Sign Under Diffusion",
        "eq:exact_coupled_interior_cubic",
        "eq:exact_coupled_screening_threshold",
        "eq:gauge_invariant_torque_def",
        "eq:neural_analytic_signal",
        "eq:signed_cosmic_contrast",
        "eq:hubble_shift_corrected",
        "zero discriminatory value",
        "eq:exact_two_field_sym_hessian",
        "eq:alpha_conf_C1",
        "eq:network_hermiticity_defect",
        "eq:kuramoto_order_param_corrected",
        "eq:nonneg_recursion_cost",
        "-9/16",
        "107/512",
        "-197/1920",
        "2.3723",
        r"\frac{\kappa_c}{2}\,D_\mu D^\mu\psi",
        "K^{-1/2} H K^{-1/2}",
        "Nonzero Dust Scalar Residual",
        "Projective Qubit Measurement vs.\\ Relative Phase Resetting",
        r"\log\max\!\Bigl(1",
        r"\mathcal{F}[p^+, p^-]",
    ):
        if req_tok not in all_tex:
            failures.append(f"SIT 81 .tex sources missing required upgrade token: {req_tok!r}")

    if extracted_norm:
        for req_txt in (
            "10.5281/zenodo.21693867",
            "Draft 13",
            "Model-Continuity Contract",
            "amplitude damping increases purity",
            "complete dephasing preserves purity",
            "data-processing inequality",
            "Penrose",
            "QGTCD Constraints Note",
            "Learning to Feel",
            "48/48",
            "Violation of Linearity Under Mixing",
            "Hadamard",
            "Opposite Sign Under Diffusion",
            "1.38429",
            "zero discriminatory value",
            "107/512",
            "197/1920",
            "5/8",
            "2.3723",
            "Nonzero Dust Scalar Residual",
            "Relative Phase Resetting",
            "Dimensional Inconsistency",
            "two-history",
        ):
            if req_txt.lower() not in extracted_norm.lower():
                failures.append(f"Extracted PDF text missing required SIT 81 upgrade phrase: {req_txt!r}")

    # Live executable mathematical & counterexample verification suite
    math_passed = 0
    math_total = 0
    math_script = PUB_ROOT / "reviews/verify_sit81_math.py"
    if not math_script.exists():
        failures.append("Missing executable math verification suite: reviews/verify_sit81_math.py")
    else:
        spec = importlib.util.spec_from_file_location("verify_sit81_math", str(math_script))
        if spec is None or spec.loader is None:
            failures.append("Unable to load reviews/verify_sit81_math.py")
        else:
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            math_res, math_fails = mod.run_all_math_checks()
            math_total = len(math_res)
            math_passed = sum(1 for r in math_res if r["status"] == "PASS")
            for mf in math_fails:
                failures.append(f"Executable math check failed: {mf}")

    # Verify frozen branch SHAs and untouched prior directories
    frozen_seen: dict[str, str | None] = {}
    for branch, expected_sha in EXPECTED_FROZEN_REFS.items():
        rc, sha = git_out("rev-parse", "--verify", branch, check=False)
        frozen_seen[branch] = sha if rc == 0 else None
        if rc == 0 and sha != expected_sha:
            failures.append(f"Frozen branch {branch} moved: {sha} != {expected_sha}")
        elif rc != 0 and not args.committed_only:
            failures.append(f"Missing local frozen branch ref in full-host mode: {branch}")

    _, status_out = git_out("status", "--porcelain", check=False)
    for line in status_out.splitlines():
        path_part = line[3:].strip()
        for frozen_prefix in (
            "sitproof/stage5-sit80-publications-20261116",
            "sitproof/stage6-functional-response-20261117",
            "sitproof/stage6-sit80-v803-publications-20261118",
        ):
            if path_part.startswith(frozen_prefix):
                failures.append(f"Frozen directory mutated in git status: {line}")

    pycaches = [p for p in PUB_ROOT.rglob("__pycache__")] + [p for p in PUB_ROOT.rglob("*.pyc")]
    if pycaches:
        failures.append(f"Found bytecode artifacts under PUB_ROOT: {[str(p.relative_to(PUB_ROOT)) for p in pycaches]}")

    report["document"] = {
        "tex": "papers/sit81-master-monograph/Super_Information_Theory_81.tex",
        "pdf": "papers/sit81-master-monograph/Super_Information_Theory_81.pdf",
        "singlefile": "papers/sit81-master-monograph/Super_Information_Theory_81_singlefile.tex",
        "pages": pages,
        "pdf_bytes": pdf_p.stat().st_size if pdf_p.exists() else 0,
        "pdf_sha256": sha256(pdf_p) if pdf_p.exists() else None,
        "tex_sha256": sha256(tex_p) if tex_p.exists() else None,
        "txt_sha256": sha256(txt_p) if txt_p.exists() else None,
        "singlefile_sha256": sha256(single_p) if single_p.exists() else None,
        "has_times_new_roman": has_tnr,
        "undef_warnings": undef_count,
        "question_marks": qmarks,
    }
    report["checks"] = {
        "singlefile_exact_assembled_parity": singlefile_exact_match,
        "tabular_blocks_audited": tabular_checked,
        "forbidden_patterns_count": len(forbidden_patterns),
        "live_math_checks_passed": f"{math_passed}/{math_total}",
        "frozen_branches": frozen_seen,
        "failures_count": len(failures),
        "failures": failures,
    }
    report["status"] = "PASS" if not failures else "FAIL"

    if not args.no_write_receipt:
        out_p = PUB_ROOT / "reviews/SIT81-MONOGRAPH-AUDIT-RECEIPT.json"
        out_p.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8", newline="\n")

    print(
        f"STATUS={report['status']} MODE={report['mode']} SIT81_PAGES={pages} "
        f"SINGLEFILE_EXACT={singlefile_exact_match} MATH={math_passed}/{math_total} "
        f"WARN={undef_count} FAILURES={len(failures)}"
    )
    for f in failures:
        print("FAIL:", f)
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
