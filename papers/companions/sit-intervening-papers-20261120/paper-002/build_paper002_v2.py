#!/usr/bin/env python3
"""Build upgraded Paper 002 v2 Markdown from immutable July 2026 baseline donor
and compile Hydrogen house-style PDF via shared/build_paper.py.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "shared"))
import build_paper  # noqa: E402

DONOR = ROOT.parent / "78-paper-house-style-release-20260729" / "build" / "public-markdown" / "Z18133332.md"
OUT_DIR = ROOT / "paper-002"


def build_paper_002_v2() -> dict:
    md = DONOR.read_text(encoding="utf-8").replace("\r\n", "\n")

    assert "{\\small July 2026\\par}" in md
    md = md.replace(
        "{\\small July 2026\\par}",
        "{\\small November 20, 2026 (Second Substantive Edition; Successor Candidate to July 29, 2026 Version 80 DOI 10.5281/zenodo.21693867)\\par}",
        1,
    )

    new_section = r"""
# November 2026 Model Continuity, Claim-Level Formal Guide, and Observational Reference Cases

## Edition chronology and scope clarification

This second substantive edition updates Paper 002 so it remains the clearest short entry point into the Super Information Theory portfolio while distinguishing two separate 2026 model lineages:

1. **July 2026 Version 80 compact corrective lineage (this paper's prior edition):** Version 80 Draft 13 (July 26, 2026) and its July 29, 2026 public release as Paper 002 (Zenodo DOI 10.5281/zenodo.21693867, concept DOI 10.5281/zenodo.16922511), explicitly designated as the correction-integrated Version 80 successor to Version 79 (December 18, 2025). It preserves the core correction framework retained intact above: separating the broad research proposal from a specified benchmark, treating electromagnetism as an independent connection rather than a bare scalar phase gradient, separating scalar amplitude, quantum purity, condensate fraction, and interference visibility, and restricting purity monotonicity to unital channels (verified explicitly in `verify_paper002_v2.py`: unital dephasing at $p = 0.3$ lowers pure-state purity from $1.000$ to $0.580$, whereas non-unital amplitude damping at $\gamma = 0.5$ raises maximally mixed purity from $0.500$ to $0.625$).
2. **November 2026 full monograph and formal-development series (renamed SIT Version 81):** The November 2026 six-stage formal monograph suite (developed as Version 80.2 / 80.3 through commits `30a71e4ffdda366c8d2489ee553d4a0a8b4c17af` and `d5dc6412da`, now renamed **SIT Version 81** in its separate monograph lane to eliminate version-number collision with the July 2026 Version 80 edition).

## Explicit comparison: July conformal benchmark versus November authoritative EFT

The July 2026 benchmark (`M_JUL2026_CONFORMAL`) and the November 2026 authoritative continuum action (`M_NOV2026_AUTH_EFT_V1`, canon `v1_1`) share overarching physics questions, but **their actions, field content, and matter couplings are not interchangeable**. Every result carried across editions must state its original action, destination action, background, matter sector, and exact transfer class (exact field redefinition, consistent truncation, controlled approximation, shared quadratic calculation, or unbridged).

| Feature or Result | July 2026 Conformal Benchmark (`M_JUL2026_CONFORMAL`) | November 2026 Authoritative Action (`M_NOV2026_AUTH_EFT_V1`) | Transfer Classification |
|---|---|---|---|
| Scalar and gauge field content | Two neutral real scalars $(\rho_t, C)$ + independent Maxwell $U(1)$ connection $A_\mu$ | Real $\rho_t(x)$ + charged complex coherence field $\psi = \psi_0 R_{\mathrm{coh}} e^{i\theta}$ + local $U(1)$ bundle connection $A_\mu$ | Distinct field content; neutral real benchmark is not an automatic reparameterization of the charged complex bundle |
| Matter coupling | Conformal physical matter metric $\tilde{g}_{\mu\nu} = A^2(\rho_t, C) g_{\mu\nu}$ | Multiplicative portal $+\sqrt{-g}\,f_{\mathrm{SM}}(R_{\mathrm{coh}})\mathcal{L}_{\mathrm{matter}}$, $f_{\mathrm{SM}} = 1 + R_{\mathrm{coh}}^2/(2 M_{\mathrm{sym}}^2) \ge 1$ | **Non-interchangeable under declared matter assumptions.** For 4D non-Weyl-invariant matter containing terms of distinct conformal weights (e.g. scalar kinetic $A^2$ and mass/potential $A^4$) at fixed unrescaled matter variables, matching requires $A = f_{\mathrm{SM}} = 1$ (`verify_paper002_v2.py`) |
| Electromagnetic sector | Independent Maxwell action; no phase-gradient EM identification | $-\frac{1}{4}f_{\mathrm{EM}}(R_{\mathrm{coh}}) F_{\mu\nu}F^{\mu\nu}$, $f_{\mathrm{EM}} = 1 + c_{\mathrm{EM}}R_{\mathrm{coh}}^2 \ge 1$ (single local $U(1)$); any massless visible-photon residue $1/z_v$ belongs to a **separately specified two-$U(1)$ visible/hidden kinetic-mixing extension** | Compatible in forbidding bare phase-gradient EM; explicit visible $U(1)$ photon dictionary remains an open obligation in unchanged `M_NOV2026_AUTH_EFT_V1` |
| Conformal Jordan-frame Cassini & PPN formulas | Valid as model-conditional derivations of `M_JUL2026_CONFORMAL` | **Not automatically valid.** Requires a separate gravitational-response derivation from multiplicative $f_{\mathrm{SM}}\mathcal{L}_{\mathrm{matter}}$ | Attached to `M_JUL2026_CONFORMAL`; unbridged to `M_NOV2026_AUTH_EFT_V1` |
| Quadratic two-mode Yukawa response | Two-mode mass-eigenstate diagonalization around vacuum | Shared canonical generalized eigenproblem $H v = m^2 K_{\mathrm{eff}} v$ with $(p^2 K + H)^{-1}$ propagator | **Shared mathematical calculation** only; matching a quadratic response does not equate full nonlinear actions |
| Constant-background Einstein--Dirac sector | Admitted at constant $(\rho_0, C_0)$ (Paper 048) | Admitted on-shell at vacuum $(\rho_0, v_0)$ with total $\mathcal{L}_m = 0$ for free ($\mathcal{L}_{\mathrm{Dirac}} = 0$) and $n=1$ bilinear ($\mathcal{L}_{\mathrm{Dirac}} = -\mathcal{L}_{\mathrm{int}}$) sectors, breaking at $n \neq 1$ with $\mathcal{L}_m|_{\mathrm{on\text{-}shell}} = (1-n)\mathcal{L}_{\mathrm{int}}$ (Paper 048 v2) | **Consistent truncation** of both actions for free and bilinear Dirac sectors at zero discriminatory value |

**Precise matter assumptions behind the conformal obstruction:** The algebraic impossibility of matching $\sqrt{-g}\,f_{\mathrm{SM}}\mathcal{L}_m$ with a 4D conformal physical metric $\tilde{g}_{\mu\nu} = A^2 g_{\mu\nu}$ for $f_{\mathrm{SM}} \neq 1$ holds specifically for **4D non-Weyl-invariant matter sectors containing terms of distinct conformal weights at fixed unrescaled matter variables** --- for example a massive scalar whose kinetic density $\sqrt{-\tilde{g}}\tilde{g}^{\mu\nu}\partial_\mu\chi\partial_\nu\chi$ scales as $A^2$ while its mass/potential density $\sqrt{-\tilde{g}}m^2\chi^2$ scales as $A^4$ (by contrast, a pure 4D Weyl-invariant Maxwell term scales as $A^4 A^{-4} = A^0 = 1$, verified explicitly in `verify_paper002_v2.py`). This obstruction cuts cleanly in both directions: it does **not** invalidate a July benchmark that explicitly assumes conformal coupling, and conversely, July's conformal scalar-tensor predictions cannot be cited as automatic consequences of the unchanged November action.

## Claim-level guide to November formal results (replacing aggregate theorem counts)

Aggregate Lean theorem counts do not tell a referee whether a matter-source derivation, an interacting quantum continuum limit, or an empirical prediction has been achieved. Readers should map each November mathematical result strictly to the narrow question it answers:

1. **Finite-lattice Model L3 Osterwalder--Schrader reflection positivity:** Establishes positivity of the coupled finite-volume Euclidean lattice measure for compact and Gaussian site priors; does *not* construct the interacting 4D quantum continuum limit or transfer-operator mass gap.
2. **Exact finite-lattice corner Hessian and periodic Fourier eigenvalues:** Establishes exact second-variation cancellation and discrete spectral bounds on $(\mathbb{Z}/l\mathbb{Z})^4$ around a uniform positive background; does *not* solve non-perturbative quantum renormalization.
3. **Classical $C^4$ smooth-torus $O(1/l^2)$ continuum convergence and sharp $\frac{3\beta}{4}$ nonnegative coercivity:** Establishes convergence and coercivity of the classical four-corner AM--GM lattice energy functional; does *not* prove interacting quantum measure convergence or $\Gamma$-convergence compactness without an additional uniform $\sum_x F(x)$ bound.
4. **Stage-6 action-response diagnostics and conditional uniform-slab Eot-Wash non-exclusion:** Establishes non-interchangeability of multiplicative and conformal couplings under fixed non-Weyl-invariant matter variables and evaluates an idealized parallel-slab non-exclusion benchmark under declared matter-charge closures ($q_{\mathrm{eff}} = 1$ dust vs. $q_{\mathrm{eff}} = 0$ free oscillating Klein--Gordon); does *not* derive microscopic composite-material scalar charges or patterned rotating-mass torsion likelihoods.

## Shared clock and observable response dictionary

Across Paper 002, Paper 007 (Super Dark Time), Paper 028, and the November observational track, four distinct quantities are never conflated and the ordinary General Relativity metric redshift baseline is stated explicitly:

1. the dimensionless fractional temporal-density perturbation $r := \delta\rho_t / \rho_0$;
2. the local intrinsic clock-response coefficient $\alpha_\rho$, defined by the fixed-local-metric fractional clock shift $y_{\mathrm{clock,int}} = \alpha_\rho r$;
3. the gravitational transfer coefficient $\mathcal{T}$, defined by $r = \mathcal{T}\,p$ where $p = \Delta\Phi / c^2$; and
4. the **anomalous (non-metric, SIT-additional) gravitational redshift slope** $\delta\alpha_\Phi := \alpha_\rho \mathcal{T}$, which enters the total observed weak-field gravitational redshift slope as
   \[
   \frac{d\ln\nu}{d(\Phi/c^2)} = 1 + \delta\alpha_\Phi = 1 + \alpha_\rho \mathcal{T},
   \]
   where $1$ is the ordinary General Relativity metric redshift contribution and $\delta\alpha_\Phi = \alpha_\rho\mathcal{T}$ is the non-metric redshift-test parameter bounded by clock-redshift experiments, ensuring that the GR baseline is explicitly separated and $\mathcal{T}$ enters $\delta\alpha_\Phi$ **strictly once** (verified symbolically in `verify_paper002_v2.py`).

An event-count rate per unit proper time $N(\tau)/\tau$ and an atomic transition-frequency shift $\Delta\nu/\nu$ remain separate operational observables unless connected by a calibrated microscopic detector/transduction model.

## Reproducible observational reference cases for shared analysis code

To prevent known identification traps from re-entering future empirical fits, the standalone verification script `verify_paper002_v2.py` locks three quantitative reference cases from Paper 002's observational analysis (`paper002_v2_verification_results.json`, 4/4 suites passing):

- **Reference Case A & B (Finite-range local ratio vs. orbit-calibrated Cassini Shapiro shift):** For the conformal benchmark with $\alpha = 10^{-3}$, orbital mass calibration at $r_{\mathrm{orb}} = 1\,\mathrm{AU}$, and solar-limb impact parameter $b = 0.01\,\mathrm{AU}$, the local metric ratio $\gamma_{\mathrm{loc}}(b) - 1 = -1.808 \times 10^{-3}$ at $\lambda = 0.1\,\mathrm{AU}$, whereas the orbit-calibrated Cassini deviation is only $\gamma_{\mathrm{Cassini,eff}} - 1 = -9.99 \times 10^{-7}$ (a suppression ratio of $5.52 \times 10^{-4}$). At $\lambda = 0.5, 1.0, 10.0\,\mathrm{AU}$ the ratio rises to $0.414, 0.743, 0.996$, recovering the standard long-range PPN relation only when $\lambda \gg r_{\mathrm{orb}}$. Light propagation and planetary mass calibration must therefore be fitted jointly.
- **Reference Case C (Fayet spherical form-factor absorption):** For a uniform sphere of radius $R$ and true Yukawa coupling $\alpha_{\mathrm{true}} = 10^{-5}$, the exterior potential carries the hyperbolic form factor $\Phi_{\mathrm{sph}}(R/\lambda) = 3((R/\lambda)\cosh(R/\lambda) - \sinh(R/\lambda))/(R/\lambda)^3$. A naive point-source fit absorbs $\Phi_{\mathrm{sph}}$ into the coupling with zero exterior fit residual, biasing $\hat{\alpha}_{\mathrm{pt}} / \alpha_{\mathrm{true}}$ by $1.001\times$ at $R/\lambda = 0.1$, $1.104\times$ at $R/\lambda = 1.0$, $2.243\times$ at $R/\lambda = 3.0$, and $7.124\times$ at $R/\lambda = 5.0$.

"""

    ref_marker = "# References"
    assert ref_marker in md
    md = md.replace(ref_marker, new_section + "\n" + ref_marker, 1)

    rel_marker = "# Release status"
    assert rel_marker in md
    rel_idx = md.index(rel_marker)
    new_rel = (
        "# Release status and version lineage\n\n"
        "The July 26, 2026 Draft 13 manuscript was publicly released on July 29, 2026 as Paper 002 "
        "(Version 80 compact corrective edition, Zenodo DOI 10.5281/zenodo.21693867, concept DOI 10.5281/zenodo.16922511, "
        "https://pub.svgn.io/papers/paper-2/). This November 20, 2026 second substantive edition candidate preserves "
        "the full July correction architecture intact, clarifies the chronology separating July Version 80 from the "
        "November full monograph series (renamed SIT Version 81), states the exact matter assumptions behind the "
        "conformal-vs-multiplicative boundary and visible-gauge extension, adds a claim-level formal-results guide "
        "and GR-baseline-separated unified clock dictionary, and locks three reproducible observational reference cases "
        "(`verify_paper002_v2.py`). It remains a private review candidate awaiting explicit author release authorization.\n"
    )
    md = md[:rel_idx] + new_rel

    md_path = OUT_DIR / "Paper-002-v2-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")

    audit = build_paper.build_house_style_pdf(
        markdown_path=md_path,
        out_dir=OUT_DIR,
        pdf_filename="Paper-002-Super-Information-Theory-Overview-v2.pdf",
        public_title="Super Information Theory: Coherence, Time Density, Informational Dissipation, and Gravity",
    )
    (OUT_DIR / "PAPER-002-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(audit, indent=2))
    return audit


if __name__ == "__main__":
    build_paper_002_v2()
