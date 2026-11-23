#!/usr/bin/env python3
"""Independent Pass-2 Structural Retention, Source-to-PDF Provenance, Required-Verifier
Execution, and Regression Audit across all 11 upgraded SIT portfolio papers.

Honest scope declaration:
This script verifies structural, provenance, execution, and regression properties;
it is NOT a substitute for independent scientific peer review. Specifically, it:
1. Enforces an explicit 10-entry REQUIRED_VERIFIERS registry (plus Paper 028 documented
   in INTENTIONAL_NO_VERIFIER): every required verifier script must exist, match its
   manifest SHA-256, and (under --execute-verifiers) execute fresh with exit code 0 inside
   a clean isolated temporary directory containing no pre-existing JSON outputs (preserving
   committed paperXXX_*_verification_results.json untouched so harmless 1e-15 cross-platform
   float roundoff never breaks subsequent offline integrity checks), producing all expected
   check IDs with passed=True and verifiers_executed_count == 10.
2. Independently recomputes SHA-256 digests of every Candidate.md, .tex, .pdf, verifier
   script, and committed verification JSON on disk and cross-checks them against both
   PAPER-XXX-BUILD-RECEIPT.json and PORTFOLIO-UPGRADE-MANIFEST.json, plus any
   manuscript_sha256_verified fields inside verification JSON outputs (closing stale-PDF
   and unverified-manuscript-edit gaps). By default neither committed verification JSONs
   nor PORTFOLIO-PASS2-AUDIT-RECEIPT.json are modified during replay (pass --write-receipt
   only when intentionally refreshing the committed receipt, or --report-out <path> to
   write a separate replay report).
3. Independently inspects every PDF's byte count, page count (pypdf & PDFium), US Letter
   dimensions, Times New Roman font embedding, and full-text PDFium extraction.
4. Performs genuine H1/H2 donor section-heading retention checks when the external July
   2026 donor archive is available, and records standalone_checkout mode otherwise.
5. Enforces the internal-identity firewall and targeted regression guards covering all
   three scientific review passes.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
import pypdfium2 as pdfium
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
DONOR_DIR = ROOT.parent / "78-paper-house-style-release-20260729" / "build" / "public-markdown"

EXPECTED_PAPERS = ("002", "003", "007", "014", "028", "033", "034", "048", "055", "062", "063")

DONOR_MAP = {
    "002": "Z18133332",
    "003": "Z21231155",
    "007": "Z16922502",
    "014": "Z21231163",
    "028": "Z21231165",
    "033": "Z21231875",
    "034": "Z21231146",
    "048": "NP07",
    "055": "NP13",
    "062": "NP20",
    "063": "NP21",
}

# Explicit, mandatory verifier registry: missing or renamed scripts fail closed immediately.
REQUIRED_VERIFIERS: dict[str, dict] = {
    "002": {
        "script": "paper-002/verify_paper002_v2.py",
        "results": "paper-002/paper002_v2_verification_results.json",
        "expected_checks": [
            "conformal_vs_multiplicative_non_interchangeability",
            "unital_vs_nonunital_purity_monotonicity",
            "observational_reference_cases_A_B_C",
            "unified_anomalous_clock_redshift_dictionary",
        ],
    },
    "003": {
        "script": "paper-003/verify_paper003_v4.py",
        "results": "paper-003/paper003_v4_verification_results.json",
        "expected_checks": [
            "two_fluid_gp_madelung_conservation_and_full_potential_energy_balance_sympy",
            "canonical_scalar_source_normalization_null_condition_and_manuscript_binding",
            "rb87_microscopic_energy_and_spatial_confounder_budget",
        ],
    },
    "007": {
        "script": "paper-007/verify_paper007_v2.py",
        "results": "paper-007/paper007_v2_verification_results.json",
        "expected_checks": [
            "static_schur_elimination_vs_dynamical_momentum_reduction",
            "clock_dictionary_and_dead_time_renewal_calibration",
        ],
    },
    "014": {
        "script": "paper-014/verify_paper014_v3.py",
        "results": "paper-014/paper014_v3_verification_results.json",
        "expected_checks": [
            "config_a_synthetic_raman_interferometer_identifiability_and_multivariable_eiv",
            "config_b_declared_bec_source_configuration_sensitivity",
        ],
    },
    "033": {
        "script": "paper-033/verify_paper033_v2.py",
        "results": "paper-033/paper033_v2_verification_results.json",
        "expected_checks": [
            "3x3_box_fibre_counterexample",
            "thm6_schedule_divisibility_and_manuscript_binding",
            "su2_diagonal_weyl_quotient_obstruction_and_exact_136_wilson_bijection",
            "finite_measurement_resolution_ceiling_exact_necessity_and_negative_controls",
        ],
    },
    "034": {
        "script": "paper-034/verify_paper034_v2.py",
        "results": "paper-034/paper034_v2_verification_results.json",
        "expected_checks": [
            "u1_gauge_invariance_dressed_vs_bare_phase",
            "transient_fokker_planck_pi_symmetry_theorem",
        ],
    },
    "048": {
        "script": "paper-048/verify_paper048_v2.py",
        "results": "paper-048/paper048_v2_verification_results.json",
        "expected_checks": [
            "november_auth_eft_exact_potential_interacting_dirac_and_current_norm",
        ],
    },
    "055": {
        "script": "paper-055/verify_paper055_v2.py",
        "results": "paper-055/paper055_v2_verification_results.json",
        "expected_checks": [
            "constraint_I_nonunique_microscopic_kernel_raw_moments_vs_cumulants",
            "constraint_II_overdamped_drift_velocity_contrast_vs_acceleration",
            "constraint_IV_undamped_noise_heating_vs_damped_equilibrium",
            "constraint_V_clock_match_underdetermines_spatial_metric",
        ],
    },
    "062": {
        "script": "paper-062/verify_paper062_v2.py",
        "results": "paper-062/paper062_v2_verification_results.json",
        "expected_checks": [
            "conditional_thermal_calibration_corrected_decoherence_and_regime_audit",
        ],
    },
    "063": {
        "script": "paper-063/verify_paper063_v2.py",
        "results": "paper-063/paper063_v2_verification_results.json",
        "mode": "top_level_keys",
        "expected_checks": [
            "skeleton_check",
            "distinctiveness_controls",
        ],
    },
}

INTENTIONAL_NO_VERIFIER: dict[str, str] = {
    "028": (
        "Portfolio governance and cross-disciplinary translation index; contains no "
        "independent mathematical model beyond the 10 verifier-backed portfolio papers."
    ),
}

# Explicit, auditable map of donor headings intentionally updated during the upgrade pass
DOCUMENTED_HEADING_RENAMES: dict[str, dict[str, str]] = {
    "002": {
        "# Release status": "# Release status and version lineage",
    },
    "003": {
        "# Approval Gate": "# Version Lineage and Release Status",
    },
    "014": {
        "# Release Boundary": "# Version Lineage and Release Status",
    },
    "048": {
        "# Status Note": "# Status Note and Version Lineage",
    },
    "055": {
        "# Data and code availability": "# Version lineage, data, and code availability",
    },
    "063": {
        "# 6. Category-theory and process-equivalence translations": "# 6. Proposed schematic categorical and process representations (revised formal status)",
        "## 6.1 Category map": "## 6.1 Schematic categorical representation (and exact trivial-skeleton boundary)",
        "## 6.2 Process map": "## 6.2 Schematic process representation",
    },
}

INTERNAL_ID_RE = re.compile(r"\b(?:NP\d{2}|Z\d{8})\b")
PRIVATE_PATH_RE = re.compile(r"(?i)(?:[A-Z]:\\(?:Users|micahone)\\|/D:/micahone/|C:\\Users\\micah\\)")
HEADING_RE = re.compile(r"^(#{1,2})\s+(.+?)\s*$", re.M)

STALE_PHRASES = (
    "Public action authorized: no.",
    "Public deposit remains a separate author / repository release.",
    "No Zenodo version, OSF change, GitHub push, journal submission, or experimental outreach action has yet been performed.",
    "The manuscript and its exact provider package are ready for Micah Blumberg's final authorization; this file does not itself perform or authorize a Zenodo or OSF mutation.",
)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text_lf(path: Path) -> str:
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def extract_h1_h2_headings(md_text: str) -> list[str]:
    return [f"{m.group(1)} {m.group(2).strip()}" for m in HEADING_RE.finditer(md_text)]


def resolve_pkg_path(rel_or_abs: str) -> Path:
    p = Path(rel_or_abs)
    return p if p.is_absolute() else (ROOT / p)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--execute-verifiers",
        action="store_true",
        help="Execute all 10 required scientific verification scripts fresh inside isolated temporary directories (leaving committed JSON receipts untouched).",
    )
    ap.add_argument(
        "--write-receipt",
        action="store_true",
        help="Write/refresh the committed PORTFOLIO-PASS2-AUDIT-RECEIPT.json (off by default so replay never dirties committed receipts).",
    )
    ap.add_argument(
        "--report-out",
        type=Path,
        default=None,
        help="Optional path to write the full JSON audit/replay report separately from the committed receipt.",
    )
    args = ap.parse_args()

    manifest = json.loads((ROOT / "PORTFOLIO-UPGRADE-MANIFEST.json").read_text(encoding="utf-8"))
    donors_available = DONOR_DIR.is_dir()

    manifest_nums = tuple(e["paper_number"] for e in manifest["entries"])
    manifest_roster_ok = (
        manifest_nums == EXPECTED_PAPERS
        and set(REQUIRED_VERIFIERS.keys()) | set(INTENTIONAL_NO_VERIFIER.keys()) == set(EXPECTED_PAPERS)
        and len(REQUIRED_VERIFIERS) == 10
    )

    executed_verifiers: list[str] = []
    verifier_execution_errors: dict[str, str] = {}
    fresh_ver_data: dict[str, dict] = {}
    fresh_exact_byte_match_vs_committed: dict[str, bool] = {}

    if args.execute_verifiers:
        entry_by_num = {e["paper_number"]: e for e in manifest["entries"]}
        for num, spec in REQUIRED_VERIFIERS.items():
            sc = resolve_pkg_path(spec["script"])
            committed_res = resolve_pkg_path(spec["results"])
            if not sc.is_file():
                verifier_execution_errors[num] = f"Missing required verifier script: {spec['script']}"
                continue
            # Run inside a clean isolated temp directory containing NO prior JSON so stale outputs can never mask failure,
            # while leaving committed paperXXX_*_verification_results.json intact against cross-platform 1e-15 float roundoff.
            with tempfile.TemporaryDirectory(prefix=f"sit_replay_{num}_") as tmp_str:
                tmp_dir = Path(tmp_str)
                tmp_sc = tmp_dir / sc.name
                shutil.copy2(sc, tmp_sc)
                entry_md_rel = entry_by_num.get(num, {}).get("markdown")
                if entry_md_rel:
                    md_src = resolve_pkg_path(entry_md_rel)
                    if md_src.is_file():
                        shutil.copy2(md_src, tmp_dir / md_src.name)
                proc = subprocess.run(
                    [sys.executable, str(tmp_sc)],
                    cwd=str(tmp_dir),
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                if proc.returncode != 0:
                    verifier_execution_errors[num] = (
                        f"Verifier {spec['script']} exited with code {proc.returncode}: "
                        f"{(proc.stderr or proc.stdout).strip()[-600:]}"
                    )
                    continue
                tmp_res = tmp_dir / committed_res.name
                if not tmp_res.is_file():
                    verifier_execution_errors[num] = (
                        f"Verifier {spec['script']} exited 0 but failed to write {committed_res.name}"
                    )
                    continue
                fresh_ver_data[num] = json.loads(tmp_res.read_text(encoding="utf-8"))
                fresh_exact_byte_match_vs_committed[num] = (
                    committed_res.is_file()
                    and sha256_text_lf(tmp_res) == sha256_text_lf(committed_res)
                )
                executed_verifiers.append(spec["script"])

    verifier_suite_complete = (
        (len(executed_verifiers) == len(REQUIRED_VERIFIERS) == 10 and len(verifier_execution_errors) == 0)
        if args.execute_verifiers
        else True
    )

    results = []
    all_ok = manifest_roster_ok and verifier_suite_complete

    for entry in manifest["entries"]:
        num = entry["paper_number"]
        pdir = ROOT / f"paper-{num}"
        build_receipt = json.loads((pdir / f"PAPER-{num}-BUILD-RECEIPT.json").read_text(encoding="utf-8"))

        # Resolve and verify Candidate.md, .tex, and .pdf existence + SHA-256 provenance chain
        md_path = resolve_pkg_path(build_receipt["markdown"])
        tex_path = resolve_pkg_path(build_receipt["tex"])
        pdf_path = resolve_pkg_path(entry["pdf"])

        md_exists = md_path.is_file()
        tex_exists = tex_path.is_file()
        pdf_exists = pdf_path.is_file()

        recomputed_md_sha = sha256_text_lf(md_path) if md_exists else ""
        recomputed_tex_sha = sha256_text_lf(tex_path) if tex_exists else ""
        recomputed_pdf_sha = sha256_file(pdf_path) if pdf_exists else ""
        recomputed_pdf_bytes = pdf_path.stat().st_size if pdf_exists else -1

        cand_md = md_path.read_text(encoding="utf-8") if md_exists else ""
        cand_headings = set(extract_h1_h2_headings(cand_md))

        # 1. Genuine structural section-heading retention check (when local donor archive exists)
        donor_info: dict = {"donor_comparison_executed": donors_available}
        heading_retention_ok = True
        if donors_available:
            donor_md = (DONOR_DIR / f"{DONOR_MAP[num]}.md").read_text(encoding="utf-8").replace("\r\n", "\n")
            donor_headings = extract_h1_h2_headings(donor_md)
            rename_map = DOCUMENTED_HEADING_RENAMES.get(num, {})
            retained_verbatim = []
            documented_renamed = []
            missing_unexpected = []
            for h in donor_headings:
                if h in cand_headings:
                    retained_verbatim.append(h)
                elif h in rename_map and rename_map[h] in cand_headings:
                    documented_renamed.append({"from": h, "to": rename_map[h]})
                else:
                    missing_unexpected.append(h)
            heading_retention_ok = (len(missing_unexpected) == 0) and (len(cand_md) > len(donor_md))
            donor_info.update({
                "donor_chars": len(donor_md),
                "upgraded_chars": len(cand_md),
                "donor_h1_h2_headings_total": len(donor_headings),
                "retained_verbatim_count": len(retained_verbatim),
                "documented_renamed_count": len(documented_renamed),
                "documented_renames": documented_renamed,
                "unexpected_missing_headings": missing_unexpected,
                "heading_retention_ok": heading_retention_ok,
            })

        # 2. Independent PDF inspection (hash, bytes, pages, box, font, PDFium full-text firewall)
        reader = PdfReader(str(pdf_path))
        pypdf_pages = len(reader.pages)
        box = reader.pages[0].mediabox
        is_letter = abs(float(box.width) - 612.0) < 1.0 and abs(float(box.height) - 792.0) < 1.0
        fonts = set()
        for page in reader.pages:
            res_dict = page.get("/Resources")
            if res_dict and "/Font" in res_dict:
                for _, v in res_dict["/Font"].items():
                    fonts.add(str(v.get_object().get("/BaseFont", "")))
        has_times = any("TimesNewRoman" in f for f in fonts)

        doc = pdfium.PdfDocument(str(pdf_path))
        pdfium_pages = len(doc)
        page_texts = [doc[i].get_textpage().get_text_range() for i in range(pdfium_pages)]
        full_text = "\n".join(page_texts)
        blank_pages = [i + 1 for i, t in enumerate(page_texts) if len(t.strip()) == 0]
        pdf_ids = INTERNAL_ID_RE.findall(full_text)
        pdf_paths = PRIVATE_PATH_RE.findall(full_text)
        has_qmarks = "??" in full_text
        stale_hits = [s for s in STALE_PHRASES if s in cand_md]

        # 3. Full source-to-PDF provenance hash match (Markdown + TeX + PDF across disk, receipt, and manifest)
        md_hash_match = (
            md_exists
            and bool(recomputed_md_sha)
            and build_receipt.get("markdown") == entry.get("markdown")
            and build_receipt.get("markdown_sha256") == recomputed_md_sha == entry.get("markdown_sha256")
        )
        tex_hash_match = (
            tex_exists
            and bool(recomputed_tex_sha)
            and build_receipt.get("tex") == entry.get("tex")
            and build_receipt.get("tex_sha256") == recomputed_tex_sha == entry.get("tex_sha256")
        )
        pdf_hash_match = (
            pdf_exists
            and build_receipt.get("pdf_sha256") == recomputed_pdf_sha == entry.get("pdf_sha256")
            and build_receipt.get("pdf_bytes") == recomputed_pdf_bytes == entry.get("pdf_bytes")
            and build_receipt.get("pages") == pypdf_pages == pdfium_pages == entry.get("pdf_pages")
            and build_receipt.get("pass") is True
        )
        receipt_hash_match = md_hash_match and tex_hash_match and pdf_hash_match

        # 4. Required-verifier script hash, fresh execution status, expected check IDs, and manuscript binding
        ver_ok = False
        ver_checks_count = 0
        ver_script_hash_match = False
        ver_manuscript_binding_match = True
        ver_error = verifier_execution_errors.get(num)

        if num in INTENTIONAL_NO_VERIFIER:
            ver_script_hash_match = (
                entry.get("verifier_script") is None
                and entry.get("verifier_sha256") is None
                and entry.get("verification_file") is None
            )
            ver_ok = ver_script_hash_match and (ver_error is None)
        elif num in REQUIRED_VERIFIERS:
            spec = REQUIRED_VERIFIERS[num]
            sc_path = resolve_pkg_path(spec["script"])
            ver_path = resolve_pkg_path(spec["results"])
            sc_exists = sc_path.is_file()
            ver_exists = ver_path.is_file()
            recomputed_sc_sha = sha256_text_lf(sc_path) if sc_exists else ""

            ver_script_hash_match = (
                sc_exists
                and entry.get("verifier_script") == spec["script"]
                and entry.get("verification_file") == spec["results"]
                and entry.get("verifier_sha256") == recomputed_sc_sha
            )
            committed_json_sha_ok = ver_exists and (sha256_text_lf(ver_path) == entry.get("verification_sha256"))
            fresh_ok = (num in fresh_ver_data) if args.execute_verifiers else True

            if ver_exists and ver_script_hash_match and committed_json_sha_ok and fresh_ok and (ver_error is None):
                ver_data = fresh_ver_data[num] if args.execute_verifiers else json.loads(ver_path.read_text(encoding="utf-8"))
                if spec.get("mode") == "top_level_keys":
                    expected_keys = spec["expected_checks"]
                    ver_checks_count = len(expected_keys)
                    ver_ok = ver_data.get("overall_passed") is True and all(
                        isinstance(ver_data.get(k), dict) and ver_data[k].get("passed") is True
                        for k in expected_keys
                    )
                else:
                    checks_list = ver_data.get("checks", [])
                    observed_ids = [c.get("check") for c in checks_list]
                    ver_checks_count = len(checks_list)
                    # Check any embedded manuscript_sha256_verified fields against current Candidate.md hash
                    for c in checks_list:
                        if "manuscript_sha256_verified" in c:
                            if c["manuscript_sha256_verified"] != recomputed_md_sha:
                                ver_manuscript_binding_match = False
                    ver_ok = (
                        ver_data.get("overall_passed") is True
                        and observed_ids == spec["expected_checks"]
                        and all(c.get("passed") is True for c in checks_list)
                        and ver_manuscript_binding_match
                    )

        # 5. Targeted scientific-review regression guards across all 3 review passes
        regression_ok = True
        if num == "002":
            regression_ok = (
                "1 + \\delta\\alpha_\\Phi" in cand_md
                and "separately specified two-$U(1)$ visible/hidden kinetic-mixing extension" in cand_md
                and "4D non-Weyl-invariant matter sectors containing terms of distinct conformal weights" in cand_md
                and "total $\\mathcal{L}_m = 0$ for free ($\\mathcal{L}_{\\mathrm{Dirac}} = 0$) and $n=1$ bilinear ($\\mathcal{L}_{\\mathrm{Dirac}} = -\\mathcal{L}_{\\mathrm{int}}$)" in cand_md
            )
        elif num == "003":
            regression_ok = (
                "Conservative, separately number-conserving collisionless limit ($\\Gamma_{12} = 0$)" in cand_md
                and cand_md.count(r"-\frac{\hbar^2}{2 m_a}\nabla^2 + V_{\mathrm{eff}}(\mathbf{x}, t)") == 2
                and r"+\frac{\hbar^2}{2 m_a}\nabla^2" not in cand_md
                and r"\lambda_Q := \frac{g_Q m_a}{M_{\mathrm{Pl}}}" in cand_md
                and r"(\nabla^2 - m_\sigma^2)\delta\sigma_Q(\mathbf{x}) = \lambda_Q\,n_0(\mathbf{x})" in cand_md
                and "M_{\\mathrm{eff}}" not in cand_md
                and "M_eff" not in cand_md
                and "g_Q = 0" in cand_md
                and "\\frac{\\hbar\\,\\Gamma_{12}(\\mathbf{x}, t)}{2 n_0(\\mathbf{x}, t)}" in cand_md
                and "n_0\\,\\partial_t\\bigl(V_{\\mathrm{trap}}(\\mathbf{x}, t) + U(\\mathbf{x}, t)\\bigr)" in cand_md
            )
        elif num == "007":
            regression_ok = (
                "0.697224" in cand_md
                and "F_{\\mathrm{renewal}} = \\frac{1}{(1 + \\lambda_{\\mathrm{true}}\\tau_{\\mathrm{dead}})^2}" in cand_md
                and "1 + \\delta\\alpha_\\Phi" in cand_md
            )
        elif num == "014":
            regression_ok = (
                "0.619141" in cand_md
                and "38.09\\%" in cand_md
                and "synthetic conditional design calculations" in cand_md
                and "separately assumed universal mass-coupled Yukawa model" in cand_md
                and "common session-wide additive offset" in cand_md
                and "4.91" in cand_md
            )
        elif num == "033":
            regression_ok = (
                "each value has fibre multiplicity exactly 1" not in cand_md
                and "realized with fibre multiplicity exactly 1" not in cand_md
                and "recovery requires growing `m_j` and `K₁(j)`" not in cand_md
                and "with both parameters nondecreasing: holonomy channels survive refinement" not in cand_md
                and "landing in the adjacent bin under any symmetric zero-mean finite-shot noise" not in cand_md
                and r"satisfying $n_j \le n_{j+1}$ and $f_j \mid f_{j+1}$" in cand_md
                and "1 + \\gamma < 2 K_1" in cand_md
                and "eventually (asymptotically) impossible whenever $1 + \\gamma > 2 K_1$" in cand_md
                and "\\delta_{\\mathrm{margin}} > 0" in cand_md
                and "continuous symmetric unwrapped errors" in cand_md
                and "p_R(d) = \\Phi(-d\\sqrt{R}/\\sigma_\\phi)" in cand_md
                and "exact necessary capacity condition" in cand_md
                and "m = 9` succeeds" in cand_md
                and "94{,}830" in cand_md
                and "exact bijective recovery" in cand_md
            )
        elif num == "048":
            regression_ok = (
                "\\sqrt{\\lambda_{\\mathrm{portal}}}" in cand_md
                and "(1 - n)\\mathcal{L}_{\\mathrm{int}}" in cand_md
                and "-f'_{\\mathrm{SM}}(v_0)\\,\\mathcal{L}_{\\mathrm{int}}" in cand_md
                and "f_0 q_\\Psi \\bar{\\Psi}\\gamma^\\mu\\Psi" in cand_md
                and "q_\\Psi\\bar{\\tilde{\\Psi}}\\gamma^\\mu\\tilde{\\Psi}" in cand_md
            )
        elif num == "055":
            regression_ok = (
                "fourth raw moments" in cand_md
                and "\\kappa_4(K_1) = -2h^4" in cand_md
                and "overdamped drift-velocity contrast" in cand_md
                and "exact Eotvos violation" not in cand_md
            )
        elif num == "062":
            regression_ok = (
                "\\frac{k_B T}{\\mu \\hbar^2}(\\Delta x)^2" in cand_md
                and "3.09 \\times 10^{17}" in cand_md
                and "7{,}855" in cand_md
                and "\\tau_p = m\\mu" in cand_md
            )
        elif num == "063":
            regression_ok = (
                "proposed schematic categorical representation of a bounded four-stage analogy" in cand_md
                and "exact analytical population expectations" in cand_md
            )

        ok = (
            heading_retention_ok
            and receipt_hash_match
            and ver_ok
            and is_letter
            and has_times
            and len(blank_pages) == 0
            and len(stale_hits) == 0
            and len(pdf_ids) == 0
            and len(pdf_paths) == 0
            and not has_qmarks
            and regression_ok
        )
        if not ok:
            all_ok = False

        results.append({
            "paper": num,
            "pages": pdfium_pages,
            "recomputed_markdown_sha256": recomputed_md_sha,
            "recomputed_tex_sha256": recomputed_tex_sha,
            "recomputed_pdf_sha256": recomputed_pdf_sha,
            "markdown_hash_match": md_hash_match,
            "tex_hash_match": tex_hash_match,
            "pdf_hash_match": pdf_hash_match,
            "receipt_and_manifest_hash_match": receipt_hash_match,
            "verifier_script_hash_match": ver_script_hash_match,
            "verifier_manuscript_binding_match": ver_manuscript_binding_match,
            "verifier_error": ver_error,
            "is_us_letter": is_letter,
            "has_times_new_roman": has_times,
            "blank_pages": blank_pages,
            "verification_json_independent_pass": ver_ok,
            "verification_checks_validated": ver_checks_count,
            "donor_section_retention": donor_info,
            "stale_phrase_hits": stale_hits,
            "pdfium_id_hits": pdf_ids,
            "pdfium_path_hits": pdf_paths,
            "regression_guard_pass": regression_ok,
            "pass2_ok": ok,
        })

    report = {
        "schema": "sit.intervening_papers.pass2_audit.v5",
        "audit_mode": "full_with_local_donors" if donors_available else "standalone_checkout",
        "manifest_roster_ok": manifest_roster_ok,
        "required_verifiers_expected": len(REQUIRED_VERIFIERS),
        "intentional_no_verifier_papers": INTENTIONAL_NO_VERIFIER,
        "verifiers_executed_fresh": bool(args.execute_verifiers),
        "verifiers_executed_in_isolated_tempdir": bool(args.execute_verifiers),
        "verifiers_executed_count": len(executed_verifiers),
        "verifier_suite_complete": verifier_suite_complete,
        "verifier_execution_errors": verifier_execution_errors,
        "fresh_replay_exact_json_match_vs_committed": fresh_exact_byte_match_vs_committed,
        "audit_scope_note": (
            "Independent structural section-heading retention (when local donors exist), "
            "full Markdown/TeX/PDF/verifier/receipt SHA-256 provenance recomputation across disk, "
            "build receipts, and manifest, non-destructive isolated-directory execution of all 10 "
            "required verifiers (--execute-verifiers; leaving committed JSON receipts untouched so "
            "harmless 1e-15 cross-platform float roundoff never breaks subsequent offline integrity checks), "
            "and selected regression guards across review passes. Automated checks and selected regression "
            "guards are not a substitute for independent scientific peer review."
        ),
        "papers_audited": len(results),
        "total_pages": sum(r["pages"] for r in results),
        "all_pass2_passed": all_ok,
        "results": results,
    }
    if args.write_receipt:
        (ROOT / "PORTFOLIO-PASS2-AUDIT-RECEIPT.json").write_text(
            json.dumps(report, indent=2) + "\n", encoding="utf-8", newline="\n"
        )
    if args.report_out is not None:
        args.report_out.parent.mkdir(parents=True, exist_ok=True)
        args.report_out.write_text(
            json.dumps(report, indent=2) + "\n", encoding="utf-8", newline="\n"
        )
    print(json.dumps({
        "audit_mode": report["audit_mode"],
        "verifiers_executed_fresh": report["verifiers_executed_fresh"],
        "verifiers_executed_in_isolated_tempdir": report["verifiers_executed_in_isolated_tempdir"],
        "verifiers_executed_count": report["verifiers_executed_count"],
        "required_verifiers_expected": report["required_verifiers_expected"],
        "verifier_suite_complete": report["verifier_suite_complete"],
        "verifier_execution_errors": report["verifier_execution_errors"],
        "papers_audited": report["papers_audited"],
        "total_pages": report["total_pages"],
        "all_pass2_passed": report["all_pass2_passed"],
        "per_paper_summary": [
            {
                "paper": r["paper"],
                "pages": r["pages"],
                "hash_match": r["receipt_and_manifest_hash_match"],
                "ver_ok": r["verification_json_independent_pass"],
                "headings_missing": r["donor_section_retention"].get("unexpected_missing_headings", "skipped"),
                "reg_ok": r["regression_guard_pass"],
                "pass2_ok": r["pass2_ok"],
            }
            for r in results
        ],
    }, indent=2))
    return 0 if all_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
