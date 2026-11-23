#!/usr/bin/env python3
"""Build upgraded Paper 003 v4 Markdown from immutable July 2026 baseline donor
and compile Hydrogen house-style PDF via shared/build_paper.py.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "shared"))
import build_paper  # noqa: E402

DONOR = ROOT.parent / "78-paper-house-style-release-20260729" / "build" / "public-markdown" / "Z21231155.md"
OUT_DIR = ROOT / "paper-003"


def build_paper_003_v4() -> dict:
    md = DONOR.read_text(encoding="utf-8").replace("\r\n", "\n")

    assert "{\\small July 2026\\par}" in md
    md = md.replace(
        "{\\small July 2026\\par}",
        "{\\small November 20, 2026 (Version 4 Successor Candidate to DOI 10.5281/zenodo.21693868)\\par}",
        1,
    )

    # Keep Section 5 heading and short Equation (11) block together on page 5 rather than splitting Eq. (11)
    sec5_marker = "# 5. Null Recovery Benchmark"
    assert sec5_marker in md
    md = md.replace(sec5_marker, "\\newpage\n\n" + sec5_marker, 1)

    # Clarify Section 5 Null Recovery Benchmark so the added condensate portal is explicitly zeroed too
    old_null = (
        "```text\n"
        "beta_tau = beta_sigma = xi_tau = xi_sigma = 0,\n"
        "Omega = 1,\n"
        "f_EM = 1.                                                       (11)\n"
        "```"
    )
    assert old_null in md
    new_null = (
        "```text\n"
        "beta_tau = beta_sigma = xi_tau = xi_sigma = 0,\n"
        "g_Q = 0   (or L_Q omitted / n_0 = 0),\n"
        "Omega = 1,\n"
        "f_EM = 1.                                                       (11)\n"
        "```\n\n"
        "(Setting `g_Q = 0`, or equivalently omitting the laboratory extension (3) or evaluating on `n_0 = 0`, is required "
        "alongside `beta_tau = beta_sigma = xi_tau = xi_sigma = 0` so that the condensate-density portal in (10) vanishes "
        "together with the ordinary matter and Maxwell couplings; the historical baseline script `model/validate_benchmark.py` "
        "evaluated the pure scalar potential prior to adding `L_Q`.)"
    )
    md = md.replace(old_null, new_null, 1)

    new_sec = r"""
# 11.5 Microscopic Two-Fluid Matter Model, Canonical Source Normalization, and Conservation Equations (November 2026)

## Architectural decision relative to the November 2026 authoritative SIT action

An explicit model-continuity decision is required so that a phenomenological condensate-source proposal is never mistaken for an automatic consequence of the November 2026 authoritative SIT continuum action (`M_NOV2026_AUTH_EFT_V1`, canon `v1_1`, in the separate SIT Version 81 monograph lane). In `M_NOV2026_AUTH_EFT_V1`, the constitutive factor $f_{\mathrm{SM}}(R_{\mathrm{coh}}) = 1 + R_{\mathrm{coh}}^2/(2 M_{\mathrm{sym}}^2)$ multiplies the entire local Standard Model matter Lagrangian $\mathcal{L}_{\mathrm{matter}}$ uniformly. In the nonrelativistic reduction of a weakly interacting Bose gas of $N$ atoms of mass $m_a$ and $s$-wave scattering length $a_s$ ($g_{\mathrm{int}} = 4\pi\hbar^2 a_s / m_a$), the leading rest-mass contribution $-m_a c^2 (n_0 + n_{\mathrm{th}}) = -m_a c^2 n$ depends solely on the total atom number density $n = n_0 + n_{\mathrm{th}}$ and is completely blind to the Penrose--Onsager condensate fraction $f_c = N_0/N$ at fixed $N$.

Consequently, **unchanged `M_NOV2026_AUTH_EFT_V1` does not produce an $O(1)$ rest-mass condensate-fraction contrast**. The only ordinary difference entering $\mathcal{L}_{\mathrm{matter}}$ between a condensed and thermal cloud at fixed $N$ comes from thermal kinetic, trap, and Hartree--Fock exchange-interaction energies (factor-of-2 direct-plus-exchange vs. pure-direct interaction energy). **Explicit declaration:** the condensate-selective source $J_Q(\mathbf{x}) = -(g_Q m_a / M_{\mathrm{Pl}})\,n_0(\mathbf{x})$ of Level 0 SIT is classified strictly as an **additional phenomenological matter-source model (`M_LEVEL0_CONDENSATE`)** carrying its own independent coupling and apparatus-frame closure, rather than a proved theorem of `M_NOV2026_AUTH_EFT_V1`.

## Canonical scalar normalization, conservative GP limit, and open ZNG-type particle exchange

To match Section 3 Equations (2)--(3) and Section 4 Equation (10) with exact dimensional and variational consistency (in four-dimensional natural units $\hbar = c = 1$ where $[\sigma] = 1$, $[n_0] = 3$, $[\rho] = 4$, and $[m_a] = [M_{\mathrm{Pl}}] = 1$, keeping $\hbar$ explicit in the nonrelativistic matter derivative conventions when convenient), define the **dimensionless** condensate portal coupling

\[
\lambda_Q := \frac{g_Q m_a}{M_{\mathrm{Pl}}}, \qquad [\lambda_Q] = 0,
\]

so the interaction Lagrangian (3) is $\mathcal{L}_Q = -\lambda_Q \sigma(\mathbf{x}, t) |\Phi_0(\mathbf{x}, t)|^2$ ($[\mathcal{L}_Q] = 4$). Combining $\mathcal{L}_Q$ with the canonical static scalar Lagrangian $-\frac{1}{2}|\nabla\sigma|^2 - \frac{1}{2}m_\sigma^2\sigma^2 - (\beta_\sigma / M_{\mathrm{Pl}})\rho\,\sigma$ of Section 4 gives by Euler--Lagrange variation with respect to $\sigma$ the exact static field equation matching Equation (10) (`verify_paper003_v4.py`):

\[
(\nabla^2 - m_\sigma^2)\sigma(\mathbf{x}) = \frac{\beta_\sigma}{M_{\mathrm{Pl}}}\,\rho(\mathbf{x}) + \lambda_Q\,n_0(\mathbf{x}),
\qquad
(\nabla^2 - m_\sigma^2)\delta\sigma_Q(\mathbf{x}) = \lambda_Q\,n_0(\mathbf{x}),
\]

where $\delta\sigma_Q := \sigma - \sigma_{\mathrm{ord}}$ denotes the **background-subtracted condensate-induced scalar response** above the ordinary-matter background $(\nabla^2 - m_\sigma^2)\sigma_{\mathrm{ord}} = (\beta_\sigma / M_{\mathrm{Pl}})\rho$ (equivalently satisfied by the full field $\sigma$ on the isolated condensate-source slice $\beta_\sigma = 0$). Both sides carry exact mass dimension $3$; no extra mass-squared denominator divides $\lambda_Q n_0$ for canonically normalized $\sigma$.

Under the Hartree--Fock--Bogoliubov (Popov) decomposition $\hat{\Psi}(\mathbf{x}, t) = \Phi_0(\mathbf{x}, t) + \hat{\delta}(\mathbf{x}, t)$, the one-body density matrix $\rho_1(\mathbf{x}, \mathbf{x}') = \langle \hat{\Psi}^\dagger(\mathbf{x}')\hat{\Psi}(\mathbf{x})\rangle = \Phi_0^*(\mathbf{x}')\Phi_0(\mathbf{x}) + \rho_1^{\mathrm{th}}(\mathbf{x}, \mathbf{x}')$ isolates $n_0(\mathbf{x}, t) = |\Phi_0(\mathbf{x}, t)|^2$ and $n_{\mathrm{th}}(\mathbf{x}, t) = \langle \hat{\delta}^\dagger \hat{\delta} \rangle$. Varying the same interaction $-\lambda_Q\sigma|\Phi_0|^2$ with respect to $\Phi_0^*$, we explicitly separate two dynamical regimes:

**1. Conservative, separately number-conserving collisionless limit ($\Gamma_{12} = 0$).** In the apparatus rest frame (four-velocity $u^\mu$), the Hermitian Gross--Pitaevskii (GP) equation is:

\[
i\hbar \partial_t \Phi_0
= \left[ -\frac{\hbar^2}{2 m_a}\nabla^2 + V_{\mathrm{eff}}(\mathbf{x}, t) \right]\Phi_0,
\qquad
V_{\mathrm{eff}} := V_{\mathrm{trap}}(\mathbf{x}, t) + m_a \Phi_N(\mathbf{x}) + g_{\mathrm{int}}\bigl(n_0 + 2 n_{\mathrm{th}}\bigr) + \lambda_Q \sigma(\mathbf{x}, t).
\]

Because $V_{\mathrm{eff}}$ is real and the kinetic operator is Hermitian, substituting the Madelung representation $\Phi_0 = \sqrt{n_0}\,\exp(i S / \hbar)$ with $\mathbf{v}_0 = \nabla S / m_a$ and quantum pressure $Q_{\mathrm{Bohm}} = -(\hbar^2/2m_a)\nabla^2\sqrt{n_0}/\sqrt{n_0}$ yields **strictly zero condensate particle source** together with the exact Hamilton--Jacobi / Euler equation (verified symbolically with zero residual, and with a negative-control test confirming that nonzero $\Gamma_{12}$ cannot follow from the conservative GP equation, in `verify_paper003_v4.py`):

\[
\partial_t n_0 + \nabla\cdot(n_0 \mathbf{v}_0) = 0, \qquad
\partial_t S + \frac{|\nabla S|^2}{2 m_a} + V_{\mathrm{eff}} + Q_{\mathrm{Bohm}} = 0.
\]

Taking the gradient of the phase equation yields the condensate force-balance equation derived from the same interaction $-\lambda_Q\sigma|\Phi_0|^2$:

\[
m_a n_0 \bigl(\partial_t \mathbf{v}_0 + (\mathbf{v}_0\cdot\nabla)\mathbf{v}_0\bigr)
= -n_0 \nabla\bigl(V_{\mathrm{trap}} + m_a\Phi_N + g_{\mathrm{int}}(n_0 + 2 n_{\mathrm{th}}) + Q_{\mathrm{Bohm}}\bigr) - \lambda_Q n_0 \nabla\sigma.
\]

**2. Open finite-temperature particle-exchange regime ($\Gamma_{12} \neq 0$, Zaremba--Nikuni--Griffin structure).** Particle exchange between condensate and thermal cloud is **additional collisional kinetic structure** beyond the conservative GP equation (as in finite-temperature ZNG two-fluid theory, Zaremba, Nikuni, and Griffin 1999). On any open domain where $n_0(\mathbf{x}, t) > 0$, introducing the explicit non-Hermitian collisional transfer term $-i\hbar\,\Gamma_{12}(\mathbf{x}, t)\,\Phi_0 / (2 n_0)$ into the GP right-hand side,

\[
i\hbar \partial_t \Phi_0
= \left[ -\frac{\hbar^2}{2 m_a}\nabla^2 + V_{\mathrm{eff}}(\mathbf{x}, t) - i\frac{\hbar\,\Gamma_{12}(\mathbf{x}, t)}{2 n_0(\mathbf{x}, t)} \right]\Phi_0,
\]

yields by exact Madelung substitution (`verify_paper003_v4.py`) the condensate number balance $\partial_t n_0 + \nabla\cdot(n_0 \mathbf{v}_0) = -\Gamma_{12}$ while leaving the real Hamilton--Jacobi phase equation unmodified. Total atom-number conservation does **not** follow from the condensate GP equation alone; it holds only when paired with a separately specified thermal kinetic continuity equation $\partial_t n_{\mathrm{th}} + \nabla\cdot\mathbf{j}_{\mathrm{th}} = +\Gamma_{12}$ obtained by integrating the Boltzmann--ZNG collision integral $C_{12}[f_{\mathrm{th}}, \Phi_0]$ over thermal momenta, yielding $\partial_t(n_0 + n_{\mathrm{th}}) + \nabla\cdot(n_0\mathbf{v}_0 + \mathbf{j}_{\mathrm{th}}) = 0$.

**Energy-balance and external-potential work qualification.** Write $U(\mathbf{x}, t) := m_a\Phi_N(\mathbf{x}) + \lambda_Q\sigma(\mathbf{x}, t)$ for the gravitational and scalar potentials appearing in $V_{\mathrm{eff}}$ above, and define the energy flux $\mathbf{J}_E = -(\hbar^2/2m_a)(\partial_t\Phi_0^*\nabla\Phi_0 + \partial_t\Phi_0\nabla\Phi_0^*)$. Even in the collisionless limit ($\Gamma_{12} = 0$, $n_{\mathrm{th}} = 0$), setting $\Gamma_{12} = n_{\mathrm{th}} = 0$ does not eliminate $U$: if one evaluates only the trap-only density $e_0 := (\hbar^2/2m_a)|\nabla\Phi_0|^2 + V_{\mathrm{trap}}|\Phi_0|^2 + (g_{\mathrm{int}}/2)|\Phi_0|^4$ under the full equation with $U \neq 0$, direct substitution gives $\partial_t e_0 + \nabla\cdot\mathbf{J}_E = n_0\,\partial_t V_{\mathrm{trap}} - U\,\partial_t n_0$, leaving a generally nonzero omitted term $-U\,\partial_t n_0$ (`verify_paper003_v4.py`). Including $U n_0$ consistently in the total condensate energy density $e := e_0 + U n_0$ for a prescribed external potential $V_{\mathrm{trap}}(\mathbf{x}, t) + U(\mathbf{x}, t)$ gives the exact local balance (`verify_paper003_v4.py`):

\[
\partial_t e + \nabla\cdot\mathbf{J}_E = n_0\,\partial_t\bigl(V_{\mathrm{trap}}(\mathbf{x}, t) + U(\mathbf{x}, t)\bigr),
\]

which reduces to the trap-only work identity $n_0\,\partial_t V_{\mathrm{trap}}$ when $U = 0$ (or when $U$ is static, $\partial_t U = 0$, with $U n_0$ retained inside $e$). Thus whenever external trap or potential fields are time-dependent, apparatus work $\int n_0\,\partial_t(V_{\mathrm{trap}} + U)\,d^3x$ enters the condensate energy budget; if $\sigma(\mathbf{x}, t)$ is promoted to a dynamical self-consistent scalar field rather than a prescribed external potential, a complete closed-system energy conservation law must additionally include the scalar field's energy density, flux, and condensate--scalar energy exchange, and in the open $\Gamma_{12} \neq 0$ regime full two-fluid momentum and energy exchange requires the coupled ZNG kinetic equations.

**Locality and covariance boundary:** Because the Penrose--Onsager condensate number $N_0$ is the largest eigenvalue of the nonlocal operator $\rho_1(\mathbf{x}, \mathbf{x}')$, identifying $n_0(\mathbf{x}) = |\Phi_0(\mathbf{x})|^2$ as a local source in a field equation is valid strictly in the coarse-grained hydrodynamic / broken-symmetry limit ($\ell_{\mathrm{coarse}} \gg \xi_{\mathrm{heal}}$, single macroscopic mode in the apparatus rest frame $u^\mu$). A relativistic covariant completion would require promoting $\Phi_0$ to a local covariant scalar order parameter coupled consistently to the full energy-momentum tensor.

## Quantitative separation of ordinary $^{87}\mathrm{Rb}$ energy and spatial confounders

Evaluating a concrete $^{87}\mathrm{Rb}$ harmonic-trap benchmark ($N = 10^6$ atoms, $a_s = 5.29\,\mathrm{nm}$, isotropic trap $\bar{\omega} = 2\pi \times 50\,\mathrm{Hz}$, verified in `verify_paper003_v4.py` / `paper003_v4_verification_results.json`) separates condensate fraction from ordinary thermodynamic and spatial changes:

| Quantity (for $N = 10^6$ $^{87}\mathrm{Rb}$ atoms, $\bar{\omega}/2\pi = 50\,\mathrm{Hz}$) | Value | Physical implication |
|---|---|---|
| Ideal critical temperature $T_c$ / thermal reference $1.2 T_c$ | $225.68\,\mathrm{nK}$ / $270.82\,\mathrm{nK}$ | Sets evaporative transition window |
| Thomas--Fermi chemical potential $\mu_{\mathrm{TF}}/k_B$ and radius $R_{\mathrm{TF}}$ | $92.39\,\mathrm{nK}$ and $13.38\,\mu\mathrm{m}$ | Compact condensed core ($R_{\mathrm{rms,BEC}} = 8.76\,\mu\mathrm{m}$) |
| Thermal cloud width $\sigma_{\mathrm{th}}$ and RMS radius $R_{\mathrm{rms,th}}$ | $16.20\,\mu\mathrm{m}$ and $28.06\,\mu\mathrm{m}$ | Thermal cloud is $3.20\times$ larger in RMS radius |
| Ordinary total energy shift $\Delta E_{\mathrm{tot}} / (N m_a c^2)$ | $7.97 \times 10^{-22}$ | Negligible relativistic mass-energy difference |
| Ordinary interaction energy shift $\Delta E_{\mathrm{int}} / (N m_a c^2)$ | $2.60 \times 10^{-23}$ | Hartree--Fock exchange shift is 23 orders below rest mass |
| Earth gravity-gradient shift per $1\,\mu\mathrm{m}$ centroid offset ($\Gamma_{zz}\delta z / g$) | $3.15 \times 10^{-13}$ | **$3.95 \times 10^8\times$ larger** than ordinary energy shift |

Any realistic experimental test (developed in Paper 014 v3) must therefore control spatial redistribution, gravity gradients, and temperature-dependent wavefront curvature explicitly rather than treating condensate-vs-thermal energy matching as sufficient.

"""

    marker_conc = "# 12. Conclusion"
    assert marker_conc in md
    md = md.replace(marker_conc, new_sec + "\n" + marker_conc, 1)

    gate_idx = md.index("# Approval Gate")
    new_gate = (
        "# Version Lineage and Release Status\n\n"
        "Version 3 was publicly deposited on July 29, 2026 as Paper 003 (Zenodo DOI 10.5281/zenodo.21693868, "
        "https://pub.svgn.io/papers/paper-3/). This November 20, 2026 Version 4 candidate adds the explicit architectural "
        "separation from the November 2026 authoritative SIT action, reconciles the canonical scalar source normalization "
        "($\\lambda_Q := g_Q m_a / M_{\\mathrm{Pl}}$) and null-recovery condition ($g_Q = 0$), separates conservative GP "
        "($\\Gamma_{12}=0$) from open ZNG-type particle exchange ($-i\\hbar\\Gamma_{12}\\Phi_0/(2n_0)$ paired with thermal "
        "kinetic continuity) and full external-potential energy balance (all verified symbolically in `verify_paper003_v4.py`), "
        "and reports the quantitative $^{87}\\mathrm{Rb}$ energy and spatial-confounder budget. It remains a private review "
        "candidate awaiting explicit author release authorization.\n"
    )
    md = md[:gate_idx] + new_gate

    md_path = OUT_DIR / "Paper-003-v4-Candidate.md"
    md_path.write_text(md, encoding="utf-8", newline="\n")

    audit = build_paper.build_house_style_pdf(
        markdown_path=md_path,
        out_dir=OUT_DIR,
        pdf_filename="Paper-003-Level-0-SIT-Condensate-Source-Contract-v4.pdf",
        public_title="Level 0 SIT: A Physical-Frame Model and Condensate-Source Falsification Contract",
    )
    (OUT_DIR / "PAPER-003-BUILD-RECEIPT.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(audit, indent=2))
    return audit


if __name__ == "__main__":
    build_paper_003_v4()
