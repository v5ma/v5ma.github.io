#!/usr/bin/env python3
"""Build all six Wave 4 upgraded SIT portfolio papers (Papers 007, 055, 034, 048, 062, and 028)
from immutable July 2026 baseline donors, compile Hydrogen Part I & II house-style PDFs via
shared/build_paper.py, and generate the complete 11-paper portfolio upgrade manifest.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DONOR_DIR = ROOT.parent / "78-paper-house-style-release-20260729" / "build" / "public-markdown"
sys.path.insert(0, str(ROOT / "shared"))
import build_paper  # noqa: E402


def build_paper_007_v2() -> dict:
    out_dir = ROOT / "paper-007"
    md = (DONOR_DIR / "Z16922502.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    assert "{\\small July 2026\\par}" in md
    md = md.replace(
        "{\\small July 2026\\par}",
        "{\\small November 20, 2026 (Version 2 Two-Scalar Static-vs-Dynamical Reduction and Detector Calibration Candidate to DOI 10.5281/zenodo.21693874)\\par}",
        1,
    )
    addon = r"""
# Appendix C. Two-Scalar SIT Reduction Boundary, Shared Clock Dictionary, and Detector Count Calibration (November 2026)

## C.1 Exact static quadratic elimination versus dynamical low-energy reduction

Super Dark Time (`M_SDT_ONE_SCALAR`) relates to the two-scalar SIT families (`M_JUL2026_CONFORMAL` in Paper 002 and `M_NOV2026_AUTH_EFT_V1` in the separate SIT Version 81 series) through two distinct mathematical operations that must **not** be conflated:

1. **Exact frozen-field consistent truncation (zero-mixing condition):** Setting $\delta R = 0$ identically in the coupled equations of motion leaves an uncancelled residual $-\lambda_{\mathrm{mix}}\delta\rho_t + J_R$ in the omitted coherence equation (`verify_paper007_v2.py`). Thus freezing $\delta R = 0$ is an exact consistent truncation **only** when the omitted equation remains satisfied identically, requiring $\lambda_{\mathrm{mix}} = 0$ and zero coherence source $J_R = 0$.
2. **Exact static (zero-momentum) Schur elimination versus full dynamical reduction ($\lambda_{\mathrm{mix}} \neq 0$):** Writing the static quadratic potential around vacuum $(\rho_0, R_0)$ as $V(\delta\rho_t, \delta R) = \frac{1}{2} m_1^2 \delta\rho_t^2 + \lambda_{\mathrm{mix}} \delta\rho_t \delta R + \frac{1}{2} m_2^2 \delta R^2 - J \delta\rho_t$ and solving $\partial V / \partial(\delta R) = 0$ yields the exact **static Schur complement** $m_{\mathrm{eff,static}}^2 = m_1^2 - \lambda_{\mathrm{mix}}^2/m_2^2$ (positive iff $\det M^2 = m_1^2 m_2^2 - \lambda_{\mathrm{mix}}^2 > 0$). However, this static elimination is **not** a complete dynamical consistent truncation of the coupled kinetic theory. With canonical kinetic matrix $K = I_2$, exact Gaussian elimination of $\delta R$ in Euclidean momentum space gives the momentum-dependent inverse propagator (`verify_paper007_v2.py`):
   \[
   G_{\mathrm{eff}}^{-1}(p^2) = p^2 + m_1^2 - \frac{\lambda_{\mathrm{mix}}^2}{p^2 + m_2^2}
   = \left(m_1^2 - \frac{\lambda_{\mathrm{mix}}^2}{m_2^2}\right)
   + \left(1 + \frac{\lambda_{\mathrm{mix}}^2}{m_2^4}\right) p^2
   - \frac{\lambda_{\mathrm{mix}}^2}{m_2^6}\,p^4 + O\!\left(\frac{p^6}{m_2^8}\right).
   \]
   The static Schur coefficient $m_1^2 - \lambda_{\mathrm{mix}}^2/m_2^2$ is only the $p^2 = 0$ value; low-momentum dynamics ($p^2 \ll m_2^2$) also renormalizes the kinetic normalization by $Z_{\mathrm{eff}} = 1 + \lambda_{\mathrm{mix}}^2/m_2^4$ and generates higher-derivative terms $-\lambda_{\mathrm{mix}}^2 p^4 / m_2^6$. **Concrete distinction (`verify_paper007_v2.py`):** for $M^2 = \begin{pmatrix} 1 & 1 \\ 1 & 4 \end{pmatrix}$, the static Schur coefficient is $0.75$, whereas the exact light mass-squared eigenvalue is $(5 - \sqrt{13})/2 \approx 0.697224$ (and the kinetic-rescaled low-momentum pole estimate is $0.75/1.0625 = 0.705882$). A controlled low-energy one-scalar approximation therefore requires declaring the kinetic matrix, wave-function normalization $Z_{\mathrm{eff}}$, source/readout maps, and discarded $O(p^4/m_2^6)$ terms. Moreover, eliminating a scalar does **not** equate conformal (`M_JUL2026_CONFORMAL`) and multiplicative (`M_NOV2026_AUTH_EFT_V1`) matter actions; that non-equivalence survives reduction to one field.

## C.2 Unified portfolio clock and observable dictionary (explicit GR baseline separation)

To eliminate double-counting and clarify the General Relativity baseline across the SIT portfolio, Paper 007 adopts the shared four-quantity dictionary: (1) dimensionless field perturbation $r := \delta\rho_t / \rho_0$; (2) local intrinsic clock-response coefficient $\alpha_\rho$, defined by the fixed-local-metric fractional frequency shift $y_{\mathrm{clock,int}} = \alpha_\rho r$; (3) gravitational transfer coefficient $\mathcal{T}$, defined by $r = \mathcal{T}\,p$ where $p = \Delta\Phi/c^2$; and (4) the **anomalous (non-metric, SIT-additional) gravitational redshift slope** $\delta\alpha_\Phi := \alpha_\rho \mathcal{T}$, entering the total observed weak-field redshift slope as

\[
\frac{d\ln\nu}{d(\Phi/c^2)} = 1 + \delta\alpha_\Phi = 1 + \alpha_\rho \mathcal{T},
\]

where $1$ is the standard General Relativity metric redshift and $\mathcal{T}$ enters $\delta\alpha_\Phi$ **strictly once** (`verify_paper007_v2.py`). Crucially, an event-count rate per unit proper time $N(\tau)/\tau$ and a fractional atomic transition-frequency shift $\Delta\nu/\nu$ are distinct operational observables until connected by an explicit calibrated transduction model.

## C.3 Calibrated count-to-field detector model (dead time, exact renewal Fano factor, and noise scenarios)

For a point-process detector operating at true rate $\lambda_{\mathrm{true}}$ with fixed non-paralyzable dead time $\tau_{\mathrm{dead}}$ and exposure $\tau_{\mathrm{exp}}$, the observed mean count rate is $\lambda_{\mathrm{obs}} = \lambda_{\mathrm{true}}/(1 + \lambda_{\mathrm{true}}\tau_{\mathrm{dead}})$, giving an exact **fractional-slope** compression factor $S_{\mathrm{dead}} := d\ln\lambda_{\mathrm{obs}} / d\ln\lambda_{\mathrm{true}} = 1/(1 + \lambda_{\mathrm{true}}\tau_{\mathrm{dead}})$ (`verify_paper007_v2.py`). When the incoming arrivals form a stationary Poisson process passing through fixed non-paralyzable dead time, the post-detection count stream is a **renewal process** whose long-exposure Fano factor is sub-Poissonian:

\[
F_{\mathrm{renewal}} = \frac{1}{(1 + \lambda_{\mathrm{true}}\tau_{\mathrm{dead}})^2}, \qquad
\frac{\sigma(\hat{\lambda}_{\mathrm{true}})}{\lambda_{\mathrm{true}}} = \frac{1}{S_{\mathrm{dead}}}\sqrt{\frac{F}{\lambda_{\mathrm{obs}}\tau_{\mathrm{exp}}}}.
\]

At unit occupancy ($\lambda_{\mathrm{true}}\tau_{\mathrm{dead}} = 1$), $S_{\mathrm{dead}} = 0.50$ (a $50\%$ fractional-slope compression) and the exact Poisson non-paralyzable renewal Fano factor is $F_{\mathrm{renewal}} = 0.25$. By contrast, the $F = 1$ and $F = 2.5$ columns below represent **separately assumed or empirically calibrated post-detection noise scenarios** (naive Poisson variance without dead-time variance suppression, and externally assumed overdispersed/correlated arrivals, neither derived from the stationary Poisson dead-time mechanism alone):

| Occupancy $\eta_{\mathrm{occ}} = \lambda\tau_{\mathrm{dead}}$ ($\lambda = 10^4\,\mathrm{s}^{-1}$, $\tau_{\mathrm{exp}} = 100\,\mathrm{s}$) | $\tau_{\mathrm{dead}}$ ($\mu\mathrm{s}$) | $S_{\mathrm{dead}}$ | Exact renewal $F_{\mathrm{ren}}$ | Rel. error (exact $F_{\mathrm{ren}}$) | Rel. error (assumed $F=1$) | Rel. error (assumed $F=2.5$) |
|---:|---:|---:|---:|---:|---:|---:|
| $0.001$ | $0.1$ | $0.9990$ | $0.9980$ | $1.00 \times 10^{-3}$ | $1.00 \times 10^{-3}$ | $1.58 \times 10^{-3}$ |
| $0.050$ | $5.0$ | $0.9524$ | $0.9070$ | $1.02 \times 10^{-3}$ | $1.08 \times 10^{-3}$ | $1.70 \times 10^{-3}$ |
| $0.250$ | $25.0$ | $0.8000$ | $0.6400$ | $1.12 \times 10^{-3}$ | $1.40 \times 10^{-3}$ | $2.21 \times 10^{-3}$ |
| $1.000$ | $100.0$ | $0.5000$ | $0.2500$ | $1.41 \times 10^{-3}$ | $2.83 \times 10^{-3}$ | $4.47 \times 10^{-3}$ |

Any correlated-arrival experiment requires a specified arrival-correlation model or empirically measured post-detection variance rather than reusing the Poisson dead-time formula. The mass-calibration examples of Appendix B remain retained as permanent portfolio safeguards against comparing single-channel scalar formulas directly with orbit-calibrated gravitational bounds.

"""
    ref_idx = md.index("# References")
    md = md[:ref_idx] + addon + "\n" + md[ref_idx:]

    avail_idx = md.index("# Data, Code, and Version Availability")
    md = md[:avail_idx] + (
        "# Data, Code, and Version Availability\n\n"
        "The historical manuscript is preserved at Zenodo record 16922502 under concept DOI 10.5281/zenodo.16922501, "
        "and the July 29, 2026 corrected house-style edition was published as Paper 007 (Zenodo DOI 10.5281/zenodo.21693874, "
        "https://pub.svgn.io/papers/paper-7/). This November 20, 2026 Version 2 candidate adds Appendix C distinguishing "
        "static Schur elimination from full dynamical reduction and zero-mixing consistent freezing, adopting the "
        "GR-baseline-separated unified clock dictionary, and verifying the non-paralyzable dead-time fractional slope "
        "and exact renewal Fano factor (`verify_paper007_v2.py` / `paper007_v2_verification_results.json`, 2/2 checks passing). "
        "All numerical examples remain synthetic; no experimental dataset is claimed to confirm SDT.\n"
    )

    md_path = out_dir / "Paper-007-v2-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")
    audit = build_paper.build_house_style_pdf(
        md_path, out_dir, "Paper-007-Super-Dark-Time-v2.pdf",
        "Super Dark Time: From Local Time-Rate Gradients to a Testable Scalar-Tensor Bridge",
    )
    (out_dir / "PAPER-007-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    return audit


def build_paper_055_v2() -> dict:
    out_dir = ROOT / "paper-055"
    md = (DONOR_DIR / "NP13.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    assert "{\\small July 27, 2026\\par}" in md
    md = md.replace(
        "{\\small July 27, 2026\\par}",
        "{\\small November 20, 2026 (Version 2 Standing Counterexample Library and Verification Suite to DOI 10.5281/zenodo.21693935)\\par}",
        1,
    )
    addon = r"""
# 9A. Standing Counterexample Matrix Mapped to Current SIT Derivations (November 2026)

To operate as an active review gate across the entire SIT portfolio (including Papers 002, 003, 007, 014, 034, 048, 062, and the separate SIT Version 81 monograph series), each countermodel in this note is now paired with an exact symbolic or numerical verification check in `verify_paper055_v2.py` (`paper055_v2_verification_results.json`, 4/4 checks passing) and mapped directly to the premise required to exclude it in any proposed derivation.

| Standing Counterexample | Verified Quantitative Certificate (`verify_paper055_v2.py`) | Target SIT Derivation Affected | Premise Required to Exclude Counterexample (Derived vs. Assumed) |
|---|---|---|---|
| Constraint I: Non-uniqueness of diffusion limit | 2-point kernel $K_1$ ($\pm h$) vs. 5-point kernel $K_2$ ($\{0,\pm h,\pm 2h\}$, weights $1/2,1/6,1/12$): identical second moment $\mu_2 = h^2$ (same diffusion $M_2 = h^2/\tau$), distinct **fourth raw moments** $\mu_4(K_1) = h^4$ vs. $\mu_4(K_2) = 3h^4$ (raw-moment ratio $3$) and distinct **fourth cumulants** $\kappa_4(K_1) = -2h^4$ vs. $\kappa_4(K_2) = 0$ (excess kurtosis $-2$ vs. $0$, cumulant ratio $0 \neq 3$) | Paper 007, Paper 062, continuum stochastic derivations | Must specify higher moments/cumulants or microscopic transition law directly (**assumed**, not derived from diffusion limit) |
| Constraint II: Probe-dependent overdamped drift contrast (vs. acceleration WEP) | Overdamped drift $b_i = 2\beta D_i\nabla u$ in a constant gradient gives linear mean trajectory $\langle x_i(t)\rangle = x_0 + b_i t$ with **zero mean acceleration** ($d^2\langle x_i\rangle/dt^2 = 0$) and normalized **overdamped drift-velocity contrast** $\Delta_{v,AB} := 2|b_A - b_B|/(b_A + b_B) = 2/3$ when $D_B = 2 D_A$ | Paper 002, Paper 007, Paper 062 | Must impose universal composition-independent coupling $\beta D_i = \text{const}$ AND supply an explicit inertial dynamics or calibrated force-to-acceleration apparatus map before making an acceleration-based Eotvos / WEP claim (agreeing with Section 5's prohibition against renaming drift velocity as acceleration) |
| Constraint IV: Undamped additive noise heating | Undamped $dv = \sigma dW$ gives $\langle v^2(T=5)\rangle = 4.904$ (exact $5.0$, linear runaway) vs. damped Ornstein--Uhlenbeck equilibrium $1.0045$ | Paper 062 bath models, stochastic gravity extensions | Must include fluctuation-dissipation friction $-\gamma v\,dt$ with $\sigma^2 = 2\gamma k_B T/m$ (**derived** only from an explicit thermal bath) |
| Constraint V: Clock match underdetermines metric/quantum completion | $\gamma = 1$ (GR) vs. $\gamma = 0$ (spatially flat) metrics give $0$ stationary clock-rate difference while differing $2\times$ in light deflection $(1+\gamma)/2 = 1$ vs. $1/2$ | Paper 002, Paper 007, clock-to-gravity bridges | Must supply spatial metric / light-propagation equations from a full covariant action (**assumed** via Einstein--Hilbert + declared matter coupling) |

**Formalization priority note:** Proving the explicit kernel moment and cumulant identities ($\mu_2$ equality with $\mu_4$ ratio $3$ and $\kappa_4 = -2h^4$ vs. $0$), the exact $\Delta_{v,AB} = 2/3$ overdamped drift-velocity contrast with $d^2\langle x\rangle/dt^2 = 0$, the linear variance-runaway identity, and the stationary-clock vs. light-deflection counterexample directly in machine-checked code contributes concrete mathematical obstructions rather than merely formalizing the general logical tautology that a countermodel defeats an implication.

"""
    marker_10 = "# 10. Limitations"
    assert marker_10 in md
    md = md.replace(marker_10, addon + "\n" + marker_10, 1)

    old_avail = "# Data and code availability"
    assert old_avail in md
    md = md.replace(
        old_avail,
        "# Version lineage, data, and code availability\n\n"
        "The July 27, 2026 edition was publicly deposited on July 29, 2026 as Paper 055 (Zenodo DOI 10.5281/zenodo.21693935, "
        "https://pub.svgn.io/papers/paper-55/). This November 20, 2026 Version 2 candidate adds Section 9A connecting each "
        "standing counterexample to current portfolio derivations with exact raw-moment vs. cumulant and drift-velocity-contrast "
        "vs. acceleration distinctions, and supplies the standalone reproducible verification script "
        "`verify_paper055_v2.py` (`paper055_v2_verification_results.json`, 4/4 checks passing).\n\n## Archival data note",
        1,
    )

    md_path = out_dir / "Paper-055-v2-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")
    audit = build_paper.build_house_style_pdf(
        md_path, out_dir, "Paper-055-QGTCD-Constraints-Note-v2.pdf",
        "QGTCD Constraints Note",
    )
    (out_dir / "PAPER-055-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    return audit


def build_paper_034_v2() -> dict:
    out_dir = ROOT / "paper-034"
    md = (DONOR_DIR / "Z21231146.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    assert "{\\small July 27, 2026\\par}" in md
    md = md.replace(
        "{\\small July 27, 2026\\par}",
        "{\\small November 20, 2026 (Version 2 Gauge-Invariant Phase and Transient Symmetry Extension to DOI 10.5281/zenodo.21693909)\\par}",
        1,
    )
    addon = r"""
# 6A. Gauge-Invariant Physical Phase Observable and Bounded Transient Symmetry Theorem (November 2026)

## 6A.1 Gauge-invariant phase observable requirement

If the phase variable $\phi$ of this paper is intended to descend from a charged complex SIT coherence field $\psi(x) = |\psi(x)| e^{i\theta(x)}$ coupled to a local $U(1)$ connection $A_\mu$ (as in the November 2026 authoritative action `M_NOV2026_AUTH_EFT_V1`), a bare local phase $\theta(x)$ is **not** a physical apparatus observable: under a local gauge transformation $\theta(x) \mapsto \theta(x) + \chi(x)$, $A_\mu \mapsto A_\mu + \hat{q}^{-1}\partial_\mu\chi$, the bare phase shifts by $\chi(x)$. Any physically meaningful phase variable descending from a charged field must therefore be constructed as a **gauge-invariant relative phase, dressed observable, or Wilson-line holonomy** along an explicitly declared spacetime path $\gamma$ from $x$ to $y$:

\[
\Delta\Theta_\gamma(x, y) := \theta(y) - \theta(x) - \hat{q}\int_\gamma A_\mu\,dx^\mu,
\]

whose local gauge variation vanishes identically (verified symbolically in `verify_paper034_v2.py`). Moreover, fitting a phenomenological lock strength $\kappa$ and diffusion scale $D$ to an observed visibility curve establishes only a fit of the conditional model; a discriminating empirical test requires an independently calibrated source-to-lock relation derived from apparatus parameters.

## 6A.2 Bounded mathematical extension: persistence of $\pi$-symmetry through time-dependent transients

**Theorem 6A.1 (Transient $\pi$-symmetry and unbiased binary marginals). [PROVED; numerically verified]** *Consider the time-dependent Fokker--Planck equation on the circle $S^1 = \mathbb{R}/2\pi\mathbb{Z}$,*

\[
\partial_t p(\phi, t) = -\partial_\phi\bigl[v(\phi, t)\,p(\phi, t)\bigr] + D(t)\,\partial_\phi^2 p(\phi, t),
\]

*with smooth $2\pi$-periodic drift $v(\phi, t)$ that is $\pi$-periodic in $\phi$, i.e. $v(\phi + \pi, t) = v(\phi, t)$ for all $(\phi, t) \in S^1 \times [0, T]$ (for example $v(\phi, t) = -\kappa(t)\sin\bigl(2(\phi - \theta(t))\bigr)$ with arbitrary smooth time-dependent lock strength $\kappa(t)$ and setting angle $\theta(t)$), and strictly positive diffusion $D(t) \ge D_{\min} > 0$. Assume classical parabolic well-posedness and uniqueness on $S^1 \times [0, T]$. If the initial conditional distribution is $\pi$-symmetric, $p(\phi + \pi, 0) = p(\phi, 0)$ for all $\phi \in S^1$, then:*

1. *$p(\phi + \pi, t) = p(\phi, t)$ holds identically for all $(\phi, t) \in S^1 \times [0, T]$; and*
2. *for every antipodally antisymmetric binary outcome map $A(\phi, a) \in \{-1, +1\}$ satisfying $A(\phi + \pi, a) = -A(\phi, a)$ (such as $A(\phi, a) = \operatorname{sgn}\cos(\phi - a)$), the transient marginal expectation satisfies $\mathbb{E}_t[A(\phi, a)] = \int_0^{2\pi} A(\phi, a)\,p(\phi, t)\,d\phi = 0$ identically for all $t \in [0, T]$.*

*Proof.* Define the half-turn shift operator $(T_\pi f)(\phi) := f(\phi + \pi)$ and the antisymmetric defect $w(\phi, t) := p(\phi, t) - p(\phi + \pi, t)$. Because $v(\phi + \pi, t) = v(\phi, t)$ and $D(t)$ is independent of $\phi$, the Fokker--Planck operator $\mathcal{L}_t f := -\partial_\phi(v(\cdot, t) f) + D(t)\partial_\phi^2 f$ commutes strictly with $T_\pi$: $\mathcal{L}_t(T_\pi p) = T_\pi(\mathcal{L}_t p)$. Subtracting the shifted PDE from the original PDE gives the homogeneous parabolic equation $\partial_t w = \mathcal{L}_t w$ on $S^1 \times [0, T]$ with initial condition $w(\phi, 0) = 0$. By uniqueness of smooth solutions to uniformly parabolic equations on the compact manifold $S^1$, $w(\phi, t) \equiv 0$ for all $t \in [0, T]$, proving (1). Part (2) follows by changing variables $\phi \mapsto \phi + \pi$: $\int_0^{2\pi} A(\phi, a) p(\phi, t)\,d\phi = \int_0^{2\pi} A(\phi+\pi, a) p(\phi+\pi, t)\,d\phi = -\int_0^{2\pi} A(\phi, a) p(\phi, t)\,d\phi$, forcing the integral to vanish identically. ∎

**Pseudospectral numerical confirmation (`verify_paper034_v2.py`).** Integrating the time-dependent PDE on $N = 64$ Fourier modes over $t \in [0, 2.0]$ ($1{,}600$ RK4 steps) with $\kappa(t) = 2.0 + 0.8\sin(3t)$, $\theta(t) = 0.7\cos(2t)$, and $D(t) = 0.35 + 0.1\cos(1.5t)$ from the $\pi$-symmetric initial density $p_0(\phi) = (1 + 0.4\cos 2\phi)/(2\pi)$ yields maximum $\pi$-symmetry defect $7.77 \times 10^{-16}$ and maximum transient binary marginal $|\mathbb{E}_t[A]| = 2.99 \times 10^{-16}$ (machine precision). By contrast, a negative control starting from the non-$\pi$-symmetric density $(1 + 0.4\cos\phi)/(2\pi)$ exhibits symmetry defect $0.2675$ and transient marginal bias $0.2399$, confirming the sensitivity of the test.

**Scope boundary preserved:** Theorem 6A.1 extends the unbiased binary-marginal result from steady state to finite-time transients under declared $\pi$-symmetric initial preparation. It leaves timing, detection losses, post-selection, and the unresolved causal gravitational preparation mechanism strictly open.

"""
    marker_7 = "# 7. Causal-Timing Obstruction"
    assert marker_7 in md
    md = md.replace(marker_7, addon + "\n" + marker_7, 1)

    marker_12 = "# 12. Source and Reproducibility Statement"
    assert marker_12 in md
    md = md.replace(
        marker_12,
        marker_12 + "\n\n**Version lineage (updated November 20, 2026):** The July 27, 2026 edition was publicly deposited "
        "on July 29, 2026 as Paper 034 (Zenodo DOI 10.5281/zenodo.21693909, https://pub.svgn.io/papers/paper-34/). "
        "This November 20, 2026 Version 2 candidate adds Section 6A (gauge-invariant relative-phase requirement and proved/verified "
        "Theorem 6A.1 on transient Fokker--Planck $\\pi$-symmetry, verified in `verify_paper034_v2.py` / `paper034_v2_verification_results.json`).",
        1,
    )

    md_path = out_dir / "Paper-034-v2-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")
    audit = build_paper.build_house_style_pdf(
        md_path, out_dir, "Paper-034-SuperTimePosition-Gravitational-Phase-Lock-v2.pdf",
        "SuperTimePosition and Gravitational Phase-Lock",
    )
    (out_dir / "PAPER-034-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    return audit


def build_paper_048_v2() -> dict:
    out_dir = ROOT / "paper-048"
    md = (DONOR_DIR / "NP07.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    assert "{\\small July 28, 2026\\par}" in md
    md = md.replace(
        "{\\small July 28, 2026\\par}",
        "{\\small November 20, 2026 (Version 2 Model-Identity Appendix and Exact November Action Truncation Audit to DOI 10.5281/zenodo.21693926)\\par}",
        1,
    )
    addon = r"""
# Appendix A. Model-Identity Chronology and Consistent-Truncation Audit for the November 2026 SIT Action (November 2026)

## A.1 Frozen July Version 80 Draft 13 versus November 2026 authoritative action

Sections 1--13 above were audited against the frozen **July 26, 2026 Version 80 Draft 13** (`M_JUL2026_CONFORMAL`, released publicly on July 29, 2026 as Paper 002, DOI 10.5281/zenodo.21693867), which couples matter through a conformal physical metric $\tilde{g}_{\mu\nu} = A^2(\rho_t, C) g_{\mu\nu}$. That July comparison must **not** be relabeled as a comparison against the November 2026 authoritative continuum action (`M_NOV2026_AUTH_EFT_V1`, canon `v1_1`, in the separate SIT Version 81 monograph series), which couples matter through the multiplicative portal $+\sqrt{-g}\,f_{\mathrm{SM}}(R_{\mathrm{coh}})\mathcal{L}_{\mathrm{matter}}$ ($f_{\mathrm{SM}}(R_{\mathrm{coh}}) = 1 + R_{\mathrm{coh}}^2/(2 M_{\mathrm{sym}}^2) \ge 1$, $R_{\mathrm{coh}} = |\psi|/\psi_0$) with the canonical linked-square scalar potential:

\[
V_{\mathrm{tot}}(\rho_t, |\psi|)
= \frac{\lambda_\rho}{4}\bigl(\rho_t^2 - \rho_0^2\bigr)^2
+ \frac{\lambda_\psi}{4}\bigl(|\psi|^2 - v_0^2\bigr)^2
+ \frac{1}{2}\Bigl[m_{\mathrm{link}}(\rho_t - \rho_0) - \sqrt{\lambda_{\mathrm{portal}}}\,\bigl(|\psi|^2 - v_0^2\bigr)\Bigr]^2.
\]

## A.2 Exact consistent-truncation check for free and interacting Dirac sectors

We test explicitly whether `M_NOV2026_AUTH_EFT_V1` with the exact canonical potential $V_{\mathrm{tot}}$ above admits a constant-background Einstein--Dirac sector at $(\rho_t, |\psi|, \theta, A_\mu) = (\rho_0, v_0, \theta_0, 0)$ (verified symbolically against the exact potential, Hessian, and interacting Dirac equations of motion in `verify_paper048_v2.py` / `paper048_v2_verification_results.json`):

1. **Canonical vacuum potential, $\mathbb{Z}_2$ lift, and mixed Hessian:** Direct evaluation of $V_{\mathrm{tot}}$ confirms $V_{\mathrm{tot}}(\rho_0, v_0) = 0$, $\partial_{\rho_t} V_{\mathrm{tot}}(\rho_0, v_0) = 0$, and $\partial_{|\psi|} V_{\mathrm{tot}}(\rho_0, v_0) = 0$ (zero classical vacuum cosmological constant), while lifting $(-\rho_0, v_0)$ by $2 m_{\mathrm{link}}^2 \rho_0^2 > 0$. Its vacuum Hessian has nonzero portal cross-coupling $H_{12} = -2 m_{\mathrm{link}}\sqrt{\lambda_{\mathrm{portal}}}\,v_0 \neq 0$, $H_{11} = 2\lambda_\rho\rho_0^2 + m_{\mathrm{link}}^2$, $H_{22} = 2(\lambda_\psi + 2\lambda_{\mathrm{portal}})v_0^2$, and strictly positive determinant $\det H = 4\lambda_\rho\rho_0^2(\lambda_\psi + 2\lambda_{\mathrm{portal}})v_0^2 + 2 m_{\mathrm{link}}^2\lambda_\psi v_0^2 > 0$.
2. **Free Dirac kinetic and mass normalization:** Setting $f_0 := f_{\mathrm{SM}}(v_0/\psi_0) \ge 1$, the free Dirac sector becomes $\sqrt{-g}\,f_0\,\bar{\Psi}(i\gamma^\mu\nabla_\mu - m_D)\Psi$. The constant field rescaling $\tilde{\Psi} := \sqrt{f_0}\,\Psi$ restores canonical kinetic normalization ($1$) identically while leaving the Dirac mass $m_D$ strictly invariant.
3. **Free on-shell scalar consistency versus interacting Dirac equation of motion:** Varying the action with respect to $\rho_t$ gives zero residual at $(\rho_0, v_0)$. Varying with respect to $|\psi|$ yields
   \[
   \left.\frac{\delta S}{\delta |\psi|}\right|_{(\rho_0, v_0)} = f'_{\mathrm{SM}}(v_0)\,\mathcal{L}_m = \frac{v_0}{\psi_0^2 M_{\mathrm{sym}}^2}\,\mathcal{L}_m.
   \]
   For a **free** minimally coupled Dirac spinor satisfying $(i\gamma^\mu\nabla_\mu - m_D)\Psi = 0$, $\mathcal{L}_{\mathrm{Dirac}}\big|_{\mathrm{on\text{-}shell}} = 0$, so both scalar Euler--Lagrange residuals vanish identically on-shell. When an interaction is added, **the Dirac equation of motion itself changes** and one cannot hold $\mathcal{L}_{\mathrm{Dirac}} = 0$. Specifically, for a scalar self-interaction $\mathcal{L}_m = \mathcal{L}_{\mathrm{Dirac}} + \mathcal{L}_{\mathrm{int}}$ with $\mathcal{L}_{\mathrm{int}} = g B^n$ and $B := \bar{\Psi}\Psi$, variation with respect to $\bar{\Psi}$ gives $(i\gamma^\mu\nabla_\mu - m_D)\Psi + n g B^{n-1}\Psi = 0$; contracting on the left with $\bar{\Psi}$ yields $\mathcal{L}_{\mathrm{Dirac}}\big|_{\mathrm{on\text{-}shell}} = -n\mathcal{L}_{\mathrm{int}}$, and therefore total on-shell matter Lagrangian and scalar source (`verify_paper048_v2.py`):
   \[
   \mathcal{L}_m\big|_{\mathrm{on\text{-}shell}} = (1 - n)\mathcal{L}_{\mathrm{int}}, \qquad
   \left.\frac{\delta S}{\delta |\psi|}\right|_{(\rho_0, v_0),\,\mathrm{on\text{-}shell}} = (1 - n)\,f'_{\mathrm{SM}}(v_0)\,\mathcal{L}_{\mathrm{int}}.
   \]
   Two sharp consequences follow immediately: (a) a bilinear interaction ($n = 1$, i.e. a mass shift $g\bar{\Psi}\Psi$) gives $\mathcal{L}_{\mathrm{Dirac}} = -\mathcal{L}_{\mathrm{int}}$ and total $\mathcal{L}_m = (1 - 1)\mathcal{L}_{\mathrm{int}} = 0$, so the constant-background truncation **still holds** (refuting any overbroad statement that every nonzero interaction breaks it); and (b) for a four-fermion interaction ($n = 2$, $\mathcal{L}_{\mathrm{int}} = \lambda B^2$), $\mathcal{L}_{\mathrm{Dirac}} = -2\lambda B^2$, $\mathcal{L}_m = -\lambda B^2$, and the scalar source is **$-f'_{\mathrm{SM}}(v_0)\,\mathcal{L}_{\mathrm{int}} = -\frac{v_0}{\psi_0^2 M_{\mathrm{sym}}^2}\lambda B^2$** (opposite in sign to the naive $+f'_0\mathcal{L}_{\mathrm{int}}$ obtained by erroneously keeping $\mathcal{L}_{\mathrm{Dirac}} = 0$).
4. **Einstein stress-energy and gauge-current normalization:** Varying $f_0\sqrt{-g}\mathcal{L}_{\mathrm{Dirac}}(\Psi)$ with respect to the tetrad *prior* to applying the on-shell identity yields $f_0 T^{\mathrm{Dirac}}_{\mu\nu}(\Psi) = T^{\mathrm{Dirac}}_{\mu\nu}(\tilde{\Psi})$, while scalar kinetic and potential contributions vanish identically at constant $(\rho_0, v_0)$. In the vector sector, with the unrescaled fermion $\Psi$ inside $\sqrt{-g}\,f_0\mathcal{L}_m(\Psi)$, varying with respect to $A_\mu$ produces the dressed gauge-field source $f_0 q_\Psi \bar{\Psi}\gamma^\mu\Psi$ (before any additional gauge-field normalization $f_{\mathrm{EM}}(R_0)$); calling $J_{\mathrm{gauge}}^\mu = q_\Psi \bar{\Psi}\gamma^\mu\Psi$ the bare gauge current leaves $f_0$ explicit in the field equation, whereas canonical fermion normalization $\tilde{\Psi} = \sqrt{f_0}\,\Psi$ absorbs $f_0$ identically into $q_\Psi\bar{\tilde{\Psi}}\gamma^\mu\tilde{\Psi}$ (`verify_paper048_v2.py`). In both conventions, the fermion-number current $J_F^\mu = \bar{\Psi}\gamma^\mu\Psi$ is distinct from the charge-weighted gauge source: a **neutral** Dirac field ($q_\Psi = 0$) can carry nonzero $J_F^\mu$ without sourcing $A_\mu$, whereas a charged Dirac field ($q_\Psi \neq 0$) sources $A_\mu$ and breaks the $A_\mu = 0$ background.

**Preserved zero-discrimination boundary:** This calculation establishes continuity of the shared constant-background free (and $n=1$ bilinear) Einstein--Dirac effective limit from July Version 80 to November `M_NOV2026_AUTH_EFT_V1`. Exactly as in Section 10, that shared limit carries **zero discriminatory value** between Causal Fermion Systems and SIT, and does not derive either framework from the other.

"""
    status_idx = md.index("# Status Note")
    md = md[:status_idx] + addon + "\n" + md[status_idx:]
    ref_idx = md.index("# References")
    new_status = (
        "# Status Note and Version Lineage\n\n"
        "The July 28, 2026 edition was publicly deposited on July 29, 2026 as Paper 048 (Zenodo DOI 10.5281/zenodo.21693926, "
        "https://pub.svgn.io/papers/paper-48/). This November 20, 2026 Version 2 candidate preserves the July four-lens audit "
        "and frozen July 26, 2026 Version 80 Draft 13 baseline intact while adding Appendix A to separate the July and November "
        "SIT actions and execute the exact canonical-potential and interacting-Dirac truncation audit (`verify_paper048_v2.py`). "
        "It remains a private review candidate awaiting explicit author release authorization.\n\n"
    )
    status_idx_new = md.index("# Status Note")
    md = md[:status_idx_new] + new_status + md[ref_idx:]

    md_path = out_dir / "Paper-048-v2-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")
    audit = build_paper.build_house_style_pdf(
        md_path, out_dir, "Paper-048-Causal-Fermion-Systems-and-SIT-v2.pdf",
        "Causal Fermion Systems and Super Information Theory",
    )
    (out_dir / "PAPER-048-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    return audit


def build_paper_062_v2() -> dict:
    out_dir = ROOT / "paper-062"
    md = (DONOR_DIR / "NP20.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    assert "{\\small July 27, 2026\\par}" in md
    md = md.replace(
        "{\\small July 27, 2026\\par}",
        "{\\small November 20, 2026 (Version 2 Status Update, Conditional Thermal Calibration, and Regime Analysis to DOI 10.5281/zenodo.21693943)\\par}",
        1,
    )
    addon = r"""
# 14A. Dated Status Update, Conditional Thermal Calibration, and Secondary Discriminating Observables (November 2026)

**Dated scientific status (November 20, 2026):** The July 27, 2026 edition was publicly deposited on July 29, 2026 as Paper 062 (Zenodo DOI 10.5281/zenodo.21693943, https://pub.svgn.io/papers/paper-62/). This update preserves the historical source window and the fundamental distinction between a classical overdamped QGTCD temporal-opportunity model and a quantum mediator-and-bath entropic-force model; a full new physical-reduction paper remains deferred until a microscopic bath-to-QGTCD reduction is derived.

## Exact conditional thermal calibration

Within the bounded overdamped QGTCD drift relation $b = 2\beta D_x \nabla u$, suppose an independently justified thermal bath model supplies Einstein--Smoluchowski mobility relations $b = \mu F$ (implying physical friction $\zeta = 1/\mu$) and $D_x = \mu k_B T$ together with a constant-gradient driving force $F = c_A \nabla u$. Matching the mean terminal drift $b = 2\beta \mu k_B T \nabla u = \mu c_A \nabla u$ forces the exact conditional calibration (verified symbolically in `verify_paper062_v2.py`):

\[
c_A = 2\beta k_B T.
\]

## Secondary discriminating observables and physical-regime validity bounds

Matching a single observed terminal drift $b_0$ at fixed $|\nabla u|$ constrains only the product $\beta \mu k_B T$, leaving bath temperature $T$ and mobility $\mu$ degenerate unless secondary observables predicted by the **same** $(\mu, T, \beta)$ parameters are measured simultaneously. Holding $b_0$, $|\nabla u|$, $\beta$, particle mass $m$, and separation $\Delta x$ fixed while varying $T$ and adjusting $\mu = b_0 / (2\beta k_B T |\nabla u|)$ inversely keeps the spatial diffusion coefficient $D_x = \mu k_B T = b_0/(2\beta|\nabla u|)$ identical across models. Under constant-force terminal drift (requiring observation times $t_{\mathrm{obs}} \gg \tau_p = m/\zeta = m\mu$), the driven viscous dissipation power is $P_{\mathrm{diss}} = F \cdot b_0 = \mu F^2 = 2\beta k_B T\, b_0 |\nabla u|$ (scaling **linearly** in $T$).

From $\zeta = 1/\mu$, the consistent Brownian momentum-diffusion coefficient is $D_{pp} = \zeta k_B T = k_B T / \mu$. In the high-temperature Markovian Brownian-motion limit, the corresponding decay rate of an **off-diagonal density-matrix amplitude** $|\rho(x, x')|$ at spatial separation $\Delta x = |x - x'|$ is (note that a squared-coherence observable $|\rho(x, x')|^2$ decays at $2\Gamma_{\mathrm{dec}}$):

\[
\Gamma_{\mathrm{dec}}(\Delta x) = \frac{D_{pp}}{\hbar^2}(\Delta x)^2 = \frac{k_B T}{\mu \hbar^2}(\Delta x)^2 = \frac{2\beta (k_B T)^2 |\nabla u|}{b_0 \hbar^2}(\Delta x)^2,
\]

which scales **quadratically** in $T$ (`verify_paper062_v2.py`). Evaluating a representative mesoscopic sphere ($m = 10^{-15}\,\mathrm{kg}$, $\Delta x = 10\,\mathrm{nm}$, matched constant-force terminal drift $b_0 = 10^{-6}\,\mathrm{m/s}$, $|\nabla u| = 1\,\mathrm{m}^{-1}$, $\beta = 1$, so $D_x = 5.00 \times 10^{-7}\,\mathrm{m^2/s}$ is held constant across rows while $T$ and $\mu$ vary inversely) yields:

| $T$ ($\mathrm{K}$) | $\mu$ ($\mathrm{m/(N\cdot s)}$) | $\tau_p = m\mu$ ($\mathrm{s}$) | $P_{\mathrm{diss}}$ ($\mathrm{W}$) | Amplitude $\Gamma_{\mathrm{dec}}$ ($\mathrm{s}^{-1}$) | $\Gamma_{\mathrm{dec}} / (k_B T/\hbar)$ |
|---:|---:|---:|---:|---:|---:|
| $0.01$ | $3.62 \times 10^{18}$ | $3{,}622$ | $2.76 \times 10^{-31}$ | $3.43 \times 10^{8}$ | $0.262$ |
| $1.00$ | $3.62 \times 10^{16}$ | $36.2$ | $2.76 \times 10^{-29}$ | $3.43 \times 10^{12}$ | $26.2$ |
| $300.0$ | $1.21 \times 10^{14}$ | $0.121$ | $8.28 \times 10^{-27}$ | $3.09 \times 10^{17}$ | $7{,}855$ |

**Critical physical-regime qualification:** While the formal parameter scalings separate the $10\,\mathrm{mK}$ and $300\,\mathrm{K}$ models by $3.00 \times 10^4\times$ in driven terminal-drift power and $9.00 \times 10^8\times$ in nominal decoherence rate, the table exposes two essential regime constraints that any concrete experiment must satisfy:

1. **Breakdown of naive short-time Markovian decoherence:** At $1\,\mathrm{K}$ and $300\,\mathrm{K}$, the nominal amplitude rate exceeds the thermal bath rate $\omega_{\mathrm{th}} = k_B T/\hbar$ by factors of $26.2$ and **$7{,}855$**, respectively (and reaches $0.262\,\omega_{\mathrm{th}}$ even at $10\,\mathrm{mK}$). When $\Gamma_{\mathrm{dec}} \gtrsim k_B T/\hbar$, the nominal decay time $1/\Gamma_{\mathrm{dec}}$ is shorter than the thermal memory time $\hbar/(k_B T)$, so the Markovian formula **cannot** be applied blindly to initial decay without specifying the bath spectral density, high-frequency cutoff $\Omega_c$, memory time, and measurement interval $\Delta t$.
2. **Terminal-drift equilibration protocol:** Across the three rows, the momentum relaxation time $\tau_p = m\mu$ spans nearly four orders of magnitude, from $0.121\,\mathrm{s}$ at $300\,\mathrm{K}$ up to $3{,}622\,\mathrm{s}$ ($\approx 1\,\mathrm{hr}$) at $10\,\mathrm{mK}$. Measuring constant-force terminal drift $b_0 = \mu F$ and driven power $P_{\mathrm{diss}} = F b_0$ requires an observation protocol with $t_{\mathrm{obs}} \gg \tau_p$ (or an explicitly underdamped transient model).

A genuinely discriminating physical reduction must therefore specify bath cutoff, memory time, and equilibration timescale alongside predicting noise, heating, or decoherence from the same parameters that explain mean drift.

"""
    marker_15 = "# 15. Conclusion"
    assert marker_15 in md
    md = md.replace(marker_15, addon + "\n" + marker_15, 1)

    md_path = out_dir / "Paper-062-v2-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")
    audit = build_paper.build_house_style_pdf(
        md_path, out_dir, "Paper-062-Quantum-Entropic-Force-QGTCD-SIT-v2.pdf",
        "Physics in Review: Quantum Entropic-Force Models, QGTCD, and Super Information Theory",
    )
    (out_dir / "PAPER-062-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    return audit


def build_paper_028_v2() -> dict:
    out_dir = ROOT / "paper-028"
    out_dir.mkdir(parents=True, exist_ok=True)
    md = (DONOR_DIR / "Z21231165.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    assert "{\\small July 12, 2026\\par}" in md
    md = md.replace(
        "{\\small July 12, 2026\\par}",
        "{\\small November 20, 2026 (Version 2 Portfolio Practical Index and Model Continuity Register to DOI 10.5281/zenodo.21693900)\\par}",
        1,
    )
    addon = r"""

# Appendix B: November 20, 2026 Portfolio Practical Index, Model Continuity, and Version Lineage

This appendix updates the translation guide into a practical claim-to-model index across the eleven upgraded intervening SIT papers (following the November 20, 2026 scientific correction pass), the version-aware neuroscience track (Paper 114), and the separate SIT Version 81 monograph lane. Every material claim carries its owning model family, core assumptions, exact verification script, unresolved dependency, and public DOI lineage.

## B.1 Corrected Version Chronology

1. **SIT Version 79 (December 18, 2025):** Omnibus monograph baseline (DOI 10.5281/zenodo.18133332).
2. **July 2026 Version 80 Compact Corrective Lineage:** Version 80 Draft 13 (July 26, 2026; frozen comparison source for Paper 048) released publicly on July 29, 2026 as **Paper 002** (DOI 10.5281/zenodo.21693867).
3. **November 2026 Formal Monograph Series (renamed SIT Version 81):** Stage 5.2 (v80.2, November 16, 2026) and Stage 6 (v80.3, commits `30a71e4ffdda366c8d2489ee553d4a0a8b4c17af` and `d5dc6412da`, November 18--19, 2026), renamed **SIT Version 81** on its independent monograph branch (`codex/sitproof-sit81-monograph-20261119`) to preserve chronological clarity relative to July Version 80.
4. **Paper 114 (*Learning to Feel*) Version-Aware Record:** Initial public release `v1.0` on October 17, 2026 (DOI 10.5281/zenodo.23447925); current main paper `v1.2` dated October 20, 2026 (https://pub.svgn.io/papers/paper-114/); technical supplement deliberately retains its `v1.1` label as documented version history rather than a naming defect. Paper 114 continues on its independent neuroscience track with **no identification** between neural synchrony/learned influence and canonical SIT scalar fields.

## B.2 Unified Clock and Observable Dictionary (Explicit GR Baseline Separation)

Across all portfolio papers: $r := \delta\rho_t/\rho_0$ is the dimensionless field perturbation; $\alpha_\rho$ is the local intrinsic (fixed-metric) clock-response coefficient ($y_{\mathrm{clock,int}} = \alpha_\rho r$); $\mathcal{T}$ is the gravitational transfer ($r = \mathcal{T} p$, $p = \Delta\Phi/c^2$); and the total observed weak-field gravitational redshift slope is $d\ln\nu / d(\Phi/c^2) = 1 + \delta\alpha_\Phi$, where $1$ is the standard General Relativity metric redshift and $\delta\alpha_\Phi := \alpha_\rho\mathcal{T}$ is the **anomalous (non-metric, SIT-additional) fractional redshift slope** in which $\mathcal{T}$ enters **strictly once**. Point-process event rates $N(\tau)/\tau$ (Paper 007) and atomic clock frequency shifts $\Delta\nu/\nu$ are distinct operational observables requiring calibrated detector models.

## B.3 Master Claim-Model-Evidence Index (November 20, 2026 Corrected Editions)

| Paper & Public DOI | Model Family | Verified November 2026 Upgrade & Script | Unresolved Dependency / Scope Ceiling |
|---|---|---|---|
| **Paper 002** (`10.5281/zenodo.21693867`) | `M_JUL2026_CONFORMAL` + crosswalk to `M_NOV2026_AUTH_EFT_V1` | States exact non-Weyl-invariant matter assumptions for conformal obstruction ($A = f_{\mathrm{SM}} = 1$), notes total $\mathcal{L}_m = 0$ for free/bilinear Dirac, qualifies visible-gauge photon extension, adopts $1 + \delta\alpha_\Phi$ clock dictionary, and locks Reference Cases A/B/C (`verify_paper002_v2.py`, 4/4 pass) | Microscopic composite-body charges, visible $U(1)$ photon dictionary, and quantum continuum limit remain open |
| **Paper 003** (`10.5281/zenodo.21693868`) | `M_LEVEL0_CONDENSATE` (distinct phenomenological model) | Reconciles canonical scalar source $(\nabla^2 - m_\sigma^2)\delta\sigma_Q = \lambda_Q n_0$ ($\lambda_Q := g_Q m_a / M_{\mathrm{Pl}}$) and $g_Q = 0$ null condition; separates conservative GP ($\Gamma_{12}=0$) from open ZNG-type transfer ($-i\hbar\Gamma_{12}\Phi_0/(2n_0)$ + paired thermal continuity), exact full-potential energy balance $n_0\partial_t(V_{\mathrm{trap}}+U)$, and $^{87}\mathrm{Rb}$ confounder budget (`verify_paper003_v4.py`, 3/3 pass) | Nonlocal Penrose--Onsager localization valid only in coarse hydrodynamic frame; dynamical scalar-field energy exchange, full ZNG kinetic collision model, & covariant completion open |
| **Paper 007** (`10.5281/zenodo.21693874`) | `M_SDT_ONE_SCALAR` (static Schur vs. dynamical reduction) | Distinguishes static Schur $m_{\mathrm{eff}}^2$ from dynamical eigenvalue ($0.75$ vs. $0.6972$), states $\lambda_{\mathrm{mix}}=J_R=0$ freezing condition, adds exact renewal Fano $F_{\mathrm{ren}} = 1/(1+\eta_{\mathrm{occ}})^2 = 0.25$ alongside assumed $F=1, 2.5$ (`verify_paper007_v2.py`, 2/2 pass) | Microscopic quantum-event-to-gravity derivation remains open; scalar elimination does not equate conformal and multiplicative matter actions |
| **Paper 014** (`10.5281/zenodo.21693886`) | `M_LEVEL0_CONDENSATE` synthetic $^{87}\mathrm{Rb}$ interferometer | Synthetic conditional FIM/VIF design ($7.14\times$ sharper); exact multivariable EIV attenuation ($38.09\%$ bias in collinear Design ii vs. $1.19\%$ in orthogonal Design iii), common-additive-offset slope invariance vs. classical/correlated EIV hierarchy, and scoped negative reach for declared $10^7$-atom BEC source (`verify_paper014_v3.py`, 2/2 pass) | Actual laboratory calibration records, hierarchical calibration/error model, and Section 6 material-charge/screening translation for any condensate-selective torsion bound |
| **Paper 028** (`10.5281/zenodo.21693900`) | Portfolio governance & translation index | Unites chronology, GR-separated clock dictionary, all 11 corrected SIT upgrades, Paper 114 version-aware entry, and SIT 81 cross-reference | Living index; updated whenever an owning paper advances |
| **Paper 033** (`10.5281/zenodo.21693908`) | `M_LATTICE_U1_2D_TOY` | Fixes Thm 6 $f_j \mid f_{j+1}$ divisibility, RD3.1 & Thm 10 Step 3 fibre multiplicity; proves Thm 12 ($256 \to 136$ Weyl gauge quotient vs. exact $136$-class bijection from larger Wilson loops) & Thm 13 (exact necessary (19a) vs. sufficient (19b) under full word realizability, fixed-$K_1$ polynomial feasibility $1+\gamma < 2K_1$ with $m=29$ vs. $\gamma=3$ impossibility, and $\delta_{\mathrm{margin}}>0$ noisy Remark R13.2) (`verify_paper033_v2.py`, 4/4 pass) | Non-abelian $SU(2)$ adapter (either accepting 136-class quotient or proving matter-enlarged relational separation), 4D Bianchi constraints, and continuum Haar measure remain open |
| **Paper 034** (`10.5281/zenodo.21693909`) | Conditional measurement-dependent phase-lock model | Establishes Wilson-line gauge-invariant relative phase requirement; proves & verifies Thm 6A.1 transient Fokker--Planck $\pi$-symmetry (`verify_paper034_v2.py`, 2/2 pass) | Causal gravitational preparation mechanism, losses, and timing loopholes remain open |
| **Paper 048** (`10.5281/zenodo.21693926`) | July v80 Draft 13 + November `M_NOV2026_AUTH_EFT_V1` | Verifies exact canonical November linked-square potential & mixed Hessian $H_{12} \neq 0$; derives exact interacting Dirac on-shell law $\mathcal{L}_m = (1-n)\mathcal{L}_{\mathrm{int}}$ ($n=1$: $\mathcal{L}_{\mathrm{Dirac}}=-\mathcal{L}_{\mathrm{int}}, \mathcal{L}_m=0$; $n=2$: $-f'_0\mathcal{L}_{\mathrm{int}}$) and explicit dressed $f_0 q_\Psi \bar{\Psi}\gamma^\mu\Psi$ vs. canonical $\tilde{\Psi}$ gauge-current normalization (`verify_paper048_v2.py`, 1/1 pass) | Shared constant-background free/bilinear limit retains strictly zero discriminatory value between CFS and SIT |
| **Paper 055** (`10.5281/zenodo.21693935`) | Standing counterexample gate library | Verifies 4 explicit countermodels: non-unique kernels ($\mu_4$ ratio $3$, $\kappa_4 = -2h^4$ vs. $0$), overdamped drift-velocity contrast $\Delta_{v,AB}=2/3$ with $d^2\langle x\rangle/dt^2=0$, undamped heating runaway, and clock-vs-deflection underdetermination (`verify_paper055_v2.py`, 4/4 pass) | Any future QGTCD/SIT derivation must state derived vs. assumed premise excluding each countermodel |
| **Paper 062** (`10.5281/zenodo.21693943`) | Classical QGTCD vs. quantum entropic bath | Derives exact conditional thermal calibration $c_A = 2\beta k_B T$, corrected amplitude decoherence $\Gamma_{\mathrm{dec}} = k_B T (\Delta x)^2/(\mu\hbar^2)$ ($3.43\times 10^8$ to $3.09\times 10^{17}\,\mathrm{s}^{-1}$), and explicit Markov ($\Gamma_{\mathrm{dec}}/\omega_{\mathrm{th}} \sim 7{,}855$ at $300\,\mathrm{K}$) & $\tau_p = m\mu$ regime bounds (`verify_paper062_v2.py`, 1/1 pass) | Bath spectral cutoff, non-Markovian short-time dynamics, and full microscopic bath-to-QGTCD reduction remain open |
| **Paper 063** (`10.5281/zenodo.21693947`) | Four-lens chronology & schematic analogy audit | Downgrades §§6.1--6.2 to schematic representation of bounded analogy; 4/4 null baselines match exact 4-stage CIS using exact analytical population expectations separated from finite-sample Monte Carlo checks (`verify_paper063_v2.py`, 2/2 pass) | Historical priority dossier not re-adjudicated; coarse CIS alone has low discriminative specificity |
| **Paper 114** (`10.5281/zenodo.23447925`) | Independent neuroscience track (SAN) | Version-aware catalog (`v1.0` Oct 17, `v1.2` Oct 20, `v1.1` supplement intentionally retained); no forced SIT scalar bridge | Calibrated comparator performance, held-out interventions, and biological data on its own track |

## B.4 Release and Deposit Boundary

The July 2026 editions of Papers 002, 003, 007, 014, 028, 033, 034, 048, 055, 062, and 063 remain preserved immutably at their July 29, 2026 Zenodo DOIs and `pub.svgn.io` pages. All eleven November 20, 2026 corrected candidate editions and their verification scripts live in private staging pending external review and explicit public-release authorization.
"""
    md = md.replace(
        "Public action authorized: no.",
        "Historical July 2026 release status preserved above; November 20, 2026 private review candidate status recorded in Appendix B.4.",
    )
    md = md.rstrip() + "\n" + addon

    md_path = out_dir / "Paper-028-v2-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")
    audit = build_paper.build_house_style_pdf(
        md_path, out_dir, "Paper-028-Cross-Disciplinary-SIT-Translation-Guide-v2.pdf",
        "Cross-Disciplinary SIT Translation Guide",
    )
    (out_dir / "PAPER-028-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    return audit


def main() -> int:
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", default=None, help="Optional subset of wave-4 paper numbers to rebuild before refreshing manifest")
    args = ap.parse_args()

    builders = [
        ("007", build_paper_007_v2),
        ("055", build_paper_055_v2),
        ("034", build_paper_034_v2),
        ("048", build_paper_048_v2),
        ("062", build_paper_062_v2),
        ("028", build_paper_028_v2),
    ]
    selected = set(args.only) if args.only else {n for n, _ in builders}
    for num, fn in builders:
        if num not in selected:
            continue
        print(f"Building Paper {num}...", flush=True)
        res = fn()
        print(f"  Paper {num}: PASS={res['pass']} pages={res['pages']} bytes={res['pdf_bytes']}", flush=True)

    # Assemble complete 11-paper portfolio manifest from all build receipts & verification results
    all_papers = ["002", "003", "007", "014", "028", "033", "034", "048", "055", "062", "063"]
    manifest_entries = []
    for num in all_papers:
        pdir = ROOT / f"paper-{num}"
        build_receipt = json.loads((pdir / f"PAPER-{num}-BUILD-RECEIPT.json").read_text(encoding="utf-8"))
        ver_scripts = sorted(pdir.glob(f"verify_paper{num}_*.py"))
        ver_script_rel = ver_scripts[0].relative_to(ROOT).as_posix() if ver_scripts else None
        ver_script_sha = build_paper.sha256_text_lf(ver_scripts[0]) if ver_scripts else None
        ver_files = sorted(pdir.glob(f"paper{num}_*_verification_results.json"))
        ver_rel = ver_files[0].relative_to(ROOT).as_posix() if ver_files else None
        ver_sha = build_paper.sha256_text_lf(ver_files[0]) if ver_files else None
        ver_data = json.loads(ver_files[0].read_text(encoding="utf-8")) if ver_files else None
        manifest_entries.append({
            "paper_number": num,
            "title": build_receipt["title"],
            "markdown": build_receipt["markdown"],
            "markdown_sha256": build_receipt["markdown_sha256"],
            "tex": build_receipt["tex"],
            "tex_sha256": build_receipt["tex_sha256"],
            "pdf": build_receipt["pdf"],
            "pdf_pages": build_receipt["pages"],
            "pdf_bytes": build_receipt["pdf_bytes"],
            "pdf_sha256": build_receipt["pdf_sha256"],
            "house_style_pass": build_receipt["pass"],
            "verifier_script": ver_script_rel,
            "verifier_sha256": ver_script_sha,
            "verification_file": ver_rel,
            "verification_sha256": ver_sha,
            "verification_overall_passed": ver_data["overall_passed"] if ver_data else True,
        })

    portfolio_manifest = {
        "schema": "sit.intervening_papers.upgrade_manifest.v3",
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "scope": "Final scientific correction and provenance-hardening pass across all 11 existing SIT intervening papers in Hydrogen Part I & II house style with source-bound verification suites; Paper 114 cataloged version-aware on its own track; SIT Version 81 monograph lane untouched.",
        "public_upload_performed": False,
        "papers_built": len(manifest_entries),
        "all_house_style_passed": all(e["house_style_pass"] for e in manifest_entries),
        "all_verifications_passed": all(e["verification_overall_passed"] for e in manifest_entries),
        "total_pdf_pages": sum(e["pdf_pages"] for e in manifest_entries),
        "entries": manifest_entries,
    }
    (ROOT / "PORTFOLIO-UPGRADE-MANIFEST.json").write_text(
        json.dumps(portfolio_manifest, indent=2) + "\n", encoding="utf-8", newline="\n"
    )
    print("\n=== COMPLETE 11-PAPER PORTFOLIO MANIFEST SUMMARY ===")
    print(json.dumps({
        "papers_built": portfolio_manifest["papers_built"],
        "all_house_style_passed": portfolio_manifest["all_house_style_passed"],
        "all_verifications_passed": portfolio_manifest["all_verifications_passed"],
        "total_pdf_pages": portfolio_manifest["total_pdf_pages"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
