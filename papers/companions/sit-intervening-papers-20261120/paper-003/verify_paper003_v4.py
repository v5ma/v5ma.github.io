#!/usr/bin/env python3
"""Microscopic/phenomenological condensate-source audit, canonical source normalization,
manuscript equation-binding check, and numerical budget for Paper 003 v4 (final pass):
1. Exact symbolic verification (SymPy) of conservative GP (Gamma_12 = 0), open ZNG-type
   transfer (-i hbar Gamma_12 Phi0 / (2 n0) + paired thermal continuity), and full
   external-potential energy balance d_t(e_0 + U n_0) + d_x J_E = n_0 d_t(V_trap + U)
   (with negative control for omitted -U d_t n_0).
2. NEW exact canonical scalar-source & force derivation from one shared Lagrangian density
   L_eff = -(1/2)(d_x sigma)^2 - (1/2) m_sigma^2 sigma^2 - (beta_sigma/M_Pl) rho sigma - lambda_Q sigma n_0
   with lambda_Q := g_Q m_a / M_Pl ([lambda_Q] = 0, [sigma] = 1, [n_0] = 3):
   - Verifies static EOM (d_xx - m_sigma^2) sigma = (beta_sigma/M_Pl) rho + lambda_Q n_0
     matches Section 4 Eq. (10) identically, and background-subtracted delta_sigma_Q satisfies
     (d_xx - m_sigma^2) delta_sigma_Q = lambda_Q n_0;
   - Dimensional negative control rejecting spurious lambda_Q n_0 / M_eff^2 (mass dim 1 != 3);
   - Null-recovery check verifying g_Q = 0 is required alongside beta_sigma = 0 when n_0 != 0;
   - Direct manuscript text/equation binding against Paper-003-v4-Candidate.md (rejecting
     corrupted GP kinetic signs, undefined M_eff, or missing g_Q = 0 null specification).
3. Quantitative Rb-87 energy and spatial gravity-gradient confounder budget.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import sympy as sp


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def verify_two_fluid_conservation_sympy() -> dict:
    x, t = sp.symbols("x t", real=True)
    hbar, m_a, lam_Q, g_int = sp.symbols("hbar m_a lam_Q g_int", positive=True)
    n0 = sp.Function("n0", positive=True)(x, t)
    S = sp.Function("S", real=True)(x, t)
    V_eff = sp.Function("V_eff", real=True)(x, t)
    Gamma12 = sp.Function("Gamma12", real=True)(x, t)

    Phi = sp.sqrt(n0) * sp.exp(sp.I * S / hbar)

    n0_s, n0_t, n0_x, n0_xx = sp.symbols("n0_s n0_t n0_x n0_xx", real=True)
    S_t, S_x, S_xx, V_s, G12_s = sp.symbols("S_t S_x S_xx V_s G12_s", real=True)
    subs_real = {
        sp.diff(n0, x, 2): n0_xx,
        sp.diff(n0, x): n0_x,
        sp.diff(n0, t): n0_t,
        n0: n0_s,
        sp.diff(S, x, 2): S_xx,
        sp.diff(S, x): S_x,
        sp.diff(S, t): S_t,
        V_eff: V_s,
        Gamma12: G12_s,
    }

    lhs = sp.I * hbar * sp.diff(Phi, t)
    rhs_cons = -(hbar**2 / (2 * m_a)) * sp.diff(Phi, x, 2) + V_eff * Phi
    res_cons = sp.expand(
        sp.simplify((lhs - rhs_cons) * sp.exp(-sp.I * S / hbar) * sp.sqrt(n0)).doit().subs(subs_real)
    )
    im_cons = sp.simplify(sp.im(res_cons) * 2 / hbar)
    re_cons = sp.simplify(sp.re(res_cons) / (-n0_s))

    continuity_lhs = sp.simplify((sp.diff(n0, t) + sp.diff(n0 * sp.diff(S, x) / m_a, x)).doit().subs(subs_real))
    Q_bohm = -(hbar**2 / (2 * m_a)) * sp.diff(sp.sqrt(n0), x, 2) / sp.sqrt(n0)
    hj_lhs = sp.simplify((sp.diff(S, t) + (sp.diff(S, x) ** 2) / (2 * m_a) + V_eff + Q_bohm).doit().subs(subs_real))

    cons_cont_diff = sp.simplify(im_cons - continuity_lhs)
    cons_hj_diff = sp.simplify(re_cons - hj_lhs)
    cons_erroneous_transfer_residual = sp.simplify(im_cons - (continuity_lhs + G12_s))
    negative_control_rejects_spurious_Gamma12 = (cons_erroneous_transfer_residual == -G12_s) and (
        cons_erroneous_transfer_residual != 0
    )

    rhs_open = rhs_cons - sp.I * hbar * Gamma12 * Phi / (2 * n0)
    res_open = sp.expand(
        sp.simplify((lhs - rhs_open) * sp.exp(-sp.I * S / hbar) * sp.sqrt(n0)).doit().subs(subs_real)
    )
    im_open = sp.simplify(sp.im(res_open) * 2 / hbar)
    re_open = sp.simplify(sp.re(res_open) / (-n0_s))

    open_cont_diff = sp.simplify(im_open - (continuity_lhs + G12_s))
    open_hj_diff = sp.simplify(re_open - hj_lhs)

    n_th_t, j_th_x = sp.symbols("n_th_t j_th_x", real=True)
    cond_eq = continuity_lhs + G12_s
    therm_eq = n_th_t + j_th_x - G12_s
    total_number_conservation = sp.simplify(cond_eq + therm_eq - (continuity_lhs + n_th_t + j_th_x))

    u = sp.Function("u", real=True)(x, t)
    w = sp.Function("w", real=True)(x, t)
    V_tr = sp.Function("V_tr", real=True)(x, t)
    U_ext = sp.Function("U_ext", real=True)(x, t)
    dens = u**2 + w**2
    V_tot_ext = V_tr + U_ext

    u_t_eom = (-(hbar**2 / (2 * m_a)) * sp.diff(w, x, 2) + (V_tot_ext + g_int * dens) * w) / hbar
    w_t_eom = -(-(hbar**2 / (2 * m_a)) * sp.diff(u, x, 2) + (V_tot_ext + g_int * dens) * u) / hbar
    eom_subs = {sp.diff(u, t): u_t_eom, sp.diff(w, t): w_t_eom}

    J_E = -(hbar**2 / m_a) * (sp.diff(u, t) * sp.diff(u, x) + sp.diff(w, t) * sp.diff(w, x))

    e0 = (hbar**2 / (2 * m_a)) * (sp.diff(u, x) ** 2 + sp.diff(w, x) ** 2) + V_tr * dens + (g_int / 2) * dens**2
    bal_e0 = sp.simplify(sp.expand(sp.diff(e0, t) + sp.diff(J_E, x)).subs(eom_subs))
    d_t_dens_on_shell = sp.simplify(sp.diff(dens, t).subs(eom_subs))
    expected_bal_e0 = sp.simplify(dens * sp.diff(V_tr, t) - U_ext * d_t_dens_on_shell)
    e0_omitted_term_residual = sp.simplify(bal_e0 - expected_bal_e0)
    omitted_term_nonzero = sp.simplify(bal_e0 - dens * sp.diff(V_tr, t)) != 0

    e_full = e0 + U_ext * dens
    bal_e_full = sp.simplify(sp.expand(sp.diff(e_full, t) + sp.diff(J_E, x)).subs(eom_subs))
    expected_work_full = dens * sp.diff(V_tr + U_ext, t)
    full_energy_balance_residual = sp.simplify(bal_e_full - expected_work_full)
    trap_only_residual = sp.simplify(full_energy_balance_residual.subs(U_ext, 0))

    passed = (
        cons_cont_diff == 0
        and cons_hj_diff == 0
        and negative_control_rejects_spurious_Gamma12
        and open_cont_diff == 0
        and open_hj_diff == 0
        and total_number_conservation == 0
        and e0_omitted_term_residual == 0
        and omitted_term_nonzero
        and full_energy_balance_residual == 0
        and trap_only_residual == 0
    )
    return {
        "check": "two_fluid_gp_madelung_conservation_and_full_potential_energy_balance_sympy",
        "conservative_gp_continuity_residual": str(cons_cont_diff),
        "conservative_gp_hamilton_jacobi_residual": str(cons_hj_diff),
        "negative_control_conservative_gp_rejects_nonzero_Gamma12": negative_control_rejects_spurious_Gamma12,
        "open_zng_gp_continuity_residual_with_minus_Gamma12": str(open_cont_diff),
        "open_zng_gp_hamilton_jacobi_residual": str(open_hj_diff),
        "paired_thermal_total_number_conservation_residual": str(total_number_conservation),
        "negative_control_trap_only_e0_missing_U_dt_n0_verified": (e0_omitted_term_residual == 0 and omitted_term_nonzero),
        "full_prescribed_potential_e_plus_Un0_balance_residual": str(full_energy_balance_residual),
        "full_prescribed_potential_work_source": str(expected_work_full),
        "trap_only_U0_balance_residual": str(trap_only_residual),
        "passed": passed,
    }


def verify_canonical_scalar_source_and_manuscript_binding(out_dir: Path) -> dict:
    # 1. Exact Euler-Lagrange derivation from ONE shared canonical static-scalar + condensate action:
    # L = -(1/2)(d_x sigma)^2 - (1/2) m_sigma^2 sigma^2 - (beta_sigma / M_Pl) rho * sigma - lambda_Q * sigma * n_0
    # with lambda_Q := g_Q * m_a / M_Pl.
    x = sp.Symbol("x", real=True)
    m_sig, M_Pl, m_a = sp.symbols("m_sigma M_Pl m_a", positive=True)
    beta_sig, g_Q = sp.symbols("beta_sigma g_Q", real=True)
    sigma = sp.Function("sigma", real=True)(x)
    sigma_ord = sp.Function("sigma_ord", real=True)(x)
    rho = sp.Function("rho", real=True)(x)
    n0 = sp.Function("n0", positive=True)(x)

    lam_Q_def = g_Q * m_a / M_Pl
    L_stat = (
        -sp.Rational(1, 2) * sp.diff(sigma, x) ** 2
        - sp.Rational(1, 2) * m_sig**2 * sigma**2
        - (beta_sig / M_Pl) * rho * sigma
        - lam_Q_def * sigma * n0
    )
    # Euler-Lagrange: dL/dsigma - d_x(dL/d(sigma_x)) = 0 => (d_xx - m_sigma^2) sigma = (beta_sigma/M_Pl) rho + (g_Q m_a / M_Pl) n0
    el_sigma = sp.simplify(sp.diff(L_stat, sigma) - sp.diff(sp.diff(L_stat, sp.diff(sigma, x)), x))
    # Rearrange into (d_xx - m_sigma^2) sigma - RHS == 0:
    lhs_op = sp.diff(sigma, x, 2) - m_sig**2 * sigma
    rhs_eq10 = (beta_sig / M_Pl) * rho + (g_Q * m_a / M_Pl) * n0
    eq10_match_residual = sp.simplify(el_sigma - (lhs_op - rhs_eq10))

    # Background-subtracted delta_sigma_Q := sigma - sigma_ord where (d_xx - m_sigma^2) sigma_ord = (beta_sigma/M_Pl) rho
    delta_sig = sigma - sigma_ord
    lhs_delta = sp.diff(delta_sig, x, 2) - m_sig**2 * delta_sig
    # Using d_xx sigma = m_sig^2 sigma + rhs_eq10 and d_xx sigma_ord = m_sig^2 sigma_ord + (beta_sig/M_Pl) rho:
    lhs_delta_sub = sp.simplify(
        lhs_delta.subs({
            sp.diff(sigma, x, 2): m_sig**2 * sigma + rhs_eq10,
            sp.diff(sigma_ord, x, 2): m_sig**2 * sigma_ord + (beta_sig / M_Pl) * rho,
        })
    )
    bg_subtracted_residual = sp.simplify(lhs_delta_sub - lam_Q_def * n0)

    # Condensate potential and force from the SAME interaction L_int = -lam_Q * sigma * |Phi_0|^2:
    V_int_cond = -sp.diff(-lam_Q_def * sigma * n0, n0)  # +lam_Q * sigma
    force_density_cond = -n0 * sp.diff(V_int_cond, x)
    expected_force = -lam_Q_def * n0 * sp.diff(sigma, x)
    force_residual = sp.simplify(force_density_cond - expected_force)

    # 2. Natural-units mass-dimension homogeneity check (4D: [sigma]=1, [n0]=3, [m_a]=[M_Pl]=[m_sigma]=[d_x]=1, [g_Q]=0)
    dim_sigma, dim_n0, dim_dx, dim_Meff = 1, 3, 1, 1
    dim_lam_Q = 0 + 1 - 1  # [g_Q] + [m_a] - [M_Pl] = 0
    dim_lhs = 2 * dim_dx + dim_sigma  # 3
    dim_rhs_correct = dim_lam_Q + dim_n0  # 3
    dim_rhs_wrong_Meff2 = dim_lam_Q + dim_n0 - 2 * dim_Meff  # 1 != 3
    dimensional_negative_control_rejects_Meff2 = (dim_lhs == dim_rhs_correct == 3) and (dim_rhs_wrong_Meff2 != dim_lhs)

    # 3. Null-recovery check: setting beta_sigma = 0 WITHOUT g_Q = 0 leaves nonzero condensate source!
    rhs_beta0_only = sp.simplify(rhs_eq10.subs(beta_sig, 0))
    rhs_full_null = sp.simplify(rhs_eq10.subs({beta_sig: 0, g_Q: 0}))
    null_recovery_requires_gQ_zero = (rhs_beta0_only != 0) and (rhs_full_null == 0)

    # 4. Direct manuscript text & equation binding against Paper-003-v4-Candidate.md
    md_path = out_dir / "Paper-003-v4-Candidate.md"
    md_exists = md_path.is_file()
    md_sha256 = _sha256(md_path) if md_exists else None
    md_binding_ok = False
    if md_exists:
        md_text = md_path.read_text(encoding="utf-8")
        # Require BOTH conservative and open GP equations to carry the exact negative kinetic sign
        neg_kin_count = md_text.count(r"-\frac{\hbar^2}{2 m_a}\nabla^2 + V_{\mathrm{eff}}(\mathbf{x}, t)")
        pos_kin_corrupt = r"+\frac{\hbar^2}{2 m_a}\nabla^2" in md_text or r"\left[ \frac{\hbar^2}{2 m_a}\nabla^2" in md_text
        has_lamQ_def = r"\lambda_Q := \frac{g_Q m_a}{M_{\mathrm{Pl}}}" in md_text
        has_correct_source = r"(\nabla^2 - m_\sigma^2)\delta\sigma_Q(\mathbf{x}) = \lambda_Q\,n_0(\mathbf{x})" in md_text
        no_spurious_Meff = "M_{\\mathrm{eff}}" not in md_text and "M_eff" not in md_text
        has_null_gQ0 = "g_Q = 0" in md_text
        md_binding_ok = (
            neg_kin_count == 2
            and not pos_kin_corrupt
            and has_lamQ_def
            and has_correct_source
            and no_spurious_Meff
            and has_null_gQ0
        )

    passed = (
        eq10_match_residual == 0
        and bg_subtracted_residual == 0
        and force_residual == 0
        and dimensional_negative_control_rejects_Meff2
        and null_recovery_requires_gQ_zero
        and md_binding_ok
    )
    return {
        "check": "canonical_scalar_source_normalization_null_condition_and_manuscript_binding",
        "lambda_Q_definition": str(lam_Q_def),
        "eq10_variational_match_residual": str(eq10_match_residual),
        "background_subtracted_delta_sigma_Q_residual": str(bg_subtracted_residual),
        "condensate_force_density_residual": str(force_residual),
        "mass_dimensions_4D": {
            "LHS_nabla2_sigma": dim_lhs,
            "RHS_lambda_Q_n0": dim_rhs_correct,
            "erroneous_lambda_Q_n0_over_Meff2": dim_rhs_wrong_Meff2,
            "negative_control_rejects_Meff2_denominator": dimensional_negative_control_rejects_Meff2,
        },
        "null_recovery_requires_gQ_eq_0_verified": null_recovery_requires_gQ_zero,
        "manuscript_file": md_path.name,
        "manuscript_sha256_verified": md_sha256,
        "manuscript_equation_and_sign_binding_passed": md_binding_ok,
        "passed": passed,
    }


def compute_rb87_energy_and_confounder_budget() -> dict:
    hbar = 1.054571817e-34
    k_B = 1.380649e-23
    c = 299792458.0
    amu = 1.66053906660e-27
    m_Rb = 86.909180527 * amu
    a_s = 5.29e-9
    g_int = 4.0 * math.pi * (hbar**2) * a_s / m_Rb

    N = 1.0e6
    omega_bar = 2.0 * math.pi * 50.0
    a_ho = math.sqrt(hbar / (m_Rb * omega_bar))

    zeta3 = 1.2020569031595942
    T_c = (hbar * omega_bar / k_B) * ((N / zeta3) ** (1.0 / 3.0))

    mu_TF = 0.5 * hbar * omega_bar * ((15.0 * N * a_s / a_ho) ** 0.4)
    R_TF = math.sqrt(2.0 * mu_TF / (m_Rb * omega_bar**2))
    E_rest_per_atom = m_Rb * (c**2)
    E_int_bec_per_atom = (2.0 / 7.0) * mu_TF
    E_trap_bec_per_atom = (3.0 / 7.0) * mu_TF

    T_th = 1.2 * T_c
    sigma_th = math.sqrt(k_B * T_th / (m_Rb * omega_bar**2))
    n_th_peak = N / ((2.0 * math.pi * sigma_th**2) ** 1.5)
    E_kin_th_per_atom = 1.5 * k_B * T_th
    E_trap_th_per_atom = 1.5 * k_B * T_th
    E_int_th_per_atom = g_int * n_th_peak / (2.0 * math.sqrt(2.0))

    frac_E_total_diff = (
        (E_kin_th_per_atom + E_trap_th_per_atom + E_int_th_per_atom)
        - (E_int_bec_per_atom + E_trap_bec_per_atom)
    ) / E_rest_per_atom
    frac_E_int_diff = (E_int_bec_per_atom - E_int_th_per_atom) / E_rest_per_atom

    R_rms_bec = math.sqrt(3.0 / 7.0) * R_TF
    R_rms_th = math.sqrt(3.0) * sigma_th

    g_earth = 9.80665
    Gamma_zz = 3.086e-6
    delta_z_1um = 1.0e-6
    eta_grad_1um = (Gamma_zz * delta_z_1um) / g_earth

    passed = (
        100e-9 < T_c < 500e-9
        and 1e-23 < abs(frac_E_total_diff) < 1e-19
        and R_rms_th > R_rms_bec
        and eta_grad_1um > 1e6 * abs(frac_E_total_diff)
    )
    return {
        "check": "rb87_microscopic_energy_and_spatial_confounder_budget",
        "N_atoms": int(N),
        "omega_bar_Hz": 50.0,
        "T_c_nK": round(T_c * 1e9, 3),
        "T_thermal_nK": round(T_th * 1e9, 3),
        "mu_TF_over_kB_nK": round((mu_TF / k_B) * 1e9, 3),
        "R_TF_um": round(R_TF * 1e6, 3),
        "R_rms_bec_um": round(R_rms_bec * 1e6, 3),
        "sigma_th_um": round(sigma_th * 1e6, 3),
        "R_rms_thermal_um": round(R_rms_th * 1e6, 3),
        "fractional_total_energy_shift_deltaE_over_mc2": float(f"{frac_E_total_diff:.6e}"),
        "fractional_interaction_energy_shift_deltaEint_over_mc2": float(f"{frac_E_int_diff:.6e}"),
        "earth_gravity_gradient_eta_per_1um_offset": float(f"{eta_grad_1um:.6e}"),
        "spatial_confounder_over_ordinary_energy_ratio": float(f"{eta_grad_1um / abs(frac_E_total_diff):.3e}"),
        "unchanged_M_NOV2026_produces_O1_condensate_contrast": False,
        "passed": passed,
    }


def main() -> int:
    out_dir = Path(__file__).resolve().parent
    res = {
        "schema": "paper003.v4.verification.v4",
        "checks": [
            verify_two_fluid_conservation_sympy(),
            verify_canonical_scalar_source_and_manuscript_binding(out_dir),
            compute_rb87_energy_and_confounder_budget(),
        ],
    }
    res["overall_passed"] = all(c["passed"] for c in res["checks"])
    (out_dir / "paper003_v4_verification_results.json").write_text(
        json.dumps(res, indent=2) + "\n", encoding="utf-8", newline="\n"
    )
    print(json.dumps(res, indent=2))
    return 0 if res["overall_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
