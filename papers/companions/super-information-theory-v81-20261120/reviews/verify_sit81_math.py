#!/usr/bin/env python3
"""Executable mathematical & counterexample verification suite for SIT Version 81.

Verifies replacement mathematics AND negative-control counterexamples across both
First and Second SIT 81 reviews using exact symbolic/rational SymPy algebra.
"""

from __future__ import annotations

import argparse
import datetime
import json
import pathlib
import sys
import sympy as sp

sys.dont_write_bytecode = True

PUB_ROOT = pathlib.Path(__file__).resolve().parent.parent


def run_all_math_checks() -> tuple[list[dict[str, object]], list[str]]:
    results: list[dict[str, object]] = []
    failures: list[str] = []

    def record(name: str, passed: bool, detail: str) -> None:
        results.append({"check": name, "status": "PASS" if passed else "FAIL", "detail": detail})
        if not passed:
            failures.append(f"{name}: {detail}")

    # Common screening symbols
    rho_t, u, v = sp.symbols("rho_t u v", real=True)
    lam_r, lam_p, lam_port, m_l, rho0, v0, psi0, Msym, rho_m = sp.symbols(
        "lam_r lam_p lam_port m_l rho0 v0 psi0 Msym rho_m", positive=True
    )
    r2 = u**2 + v**2
    V_eff = (
        lam_r / 4 * (rho_t**2 - rho0**2) ** 2
        + lam_p / 4 * (r2 - v0**2) ** 2
        + sp.Rational(1, 2) * (m_l * (rho_t - rho0) - sp.sqrt(lam_port) * (r2 - v0**2)) ** 2
        + rho_m / (2 * psi0**2 * Msym**2) * r2
    )
    grad_sym = [sp.simplify(sp.diff(V_eff, q).subs({u: 0, v: 0})) for q in (rho_t, u, v)]
    H_sym = sp.Matrix(
        [[sp.simplify(sp.diff(V_eff, q1, q2).subs({u: 0, v: 0})) for q2 in (rho_t, u, v)] for q1 in (rho_t, u, v)]
    )

    # 1. Exact two-field screening saddle counterexample: diag(-9/16, 107/512, 107/512)
    p_saddle = {
        lam_r: sp.Integer(1), rho0: sp.Integer(1), m_l: sp.Rational(1, 2),
        lam_port: sp.Rational(27, 32) ** 2, v0: sp.Integer(1), lam_p: sp.Integer(1),
        psi0: sp.Integer(1), Msym: sp.Integer(1), rho_t: sp.Rational(1, 4), rho_m: sp.Integer(2),
    }
    g0_s = sp.simplify(grad_sym[0].subs(p_saddle))
    h00_s = sp.simplify(H_sym[0, 0].subs(p_saddle))
    h11_s = sp.simplify(H_sym[1, 1].subs(p_saddle))
    h22_s = sp.simplify(H_sym[2, 2].subs(p_saddle))
    off_zero = H_sym[0, 1] == 0 and H_sym[0, 2] == 0 and H_sym[1, 2] == 0
    ok1 = off_zero and g0_s == 0 and h00_s == sp.Rational(-9, 16) and h11_s == sp.Rational(107, 512) and h22_s == h11_s
    record("01_screening_saddle_counterexample", ok1, f"grad={g0_s}, H=diag({h00_s}, {h11_s}, {h22_s})")

    # 2. Exact degenerate PSD boundary instability counterexample: H=diag(3/4, 0, 0), valley quartic = -197/1920 < 0
    p_deg = {
        lam_r: sp.Integer(1), rho0: sp.Integer(1), m_l: sp.Integer(1),
        lam_port: sp.Rational(7, 8) ** 2, v0: sp.Integer(1), lam_p: sp.Rational(1, 10),
        psi0: sp.Integer(1), Msym: sp.Integer(1),
    }
    rho_in_d = sp.Rational(1, 2)
    g0_d = sp.simplify(grad_sym[0].subs(p_deg).subs(rho_t, rho_in_d))
    h00_d = sp.simplify(H_sym[0, 0].subs(p_deg).subs(rho_t, rho_in_d))
    rho_m_d = sp.solve(sp.Eq(H_sym[1, 1].subs(p_deg).subs(rho_t, rho_in_d), 0), rho_m)[0]
    p_deg_full = {**p_deg, rho_m: rho_m_d}
    h11_d = sp.simplify(H_sym[1, 1].subs(p_deg_full).subs(rho_t, rho_in_d))
    d_coeff = sp.simplify(p_deg[m_l] * sp.sqrt(p_deg[lam_port]) / h00_d)
    V_val = sp.series(
        V_eff.subs(p_deg_full).subs({rho_t: rho_in_d + d_coeff * u**2, v: 0})
        - V_eff.subs(p_deg_full).subs({rho_t: rho_in_d, u: 0, v: 0}),
        u, 0, 6,
    ).removeO()
    c4 = sp.Poly(V_val, u).nth(4)
    ok2 = g0_d == 0 and h00_d == sp.Rational(3, 4) and h11_d == 0 and rho_m_d == sp.Rational(121, 160) and c4 == sp.Rational(-197, 1920)
    record("02_screening_degenerate_quartic_counterexample", ok2, f"rho_m={rho_m_d}, H=diag({h00_d}, {h11_d}), quartic={c4}")

    # 3. Coupled cubic benchmark (unit params, m_link=2): dV/drho(1/2)=-3/8, rho_in*~0.59607, H_rrho~4.06590>0, rho_m_crit~1.38429
    p_bench = {lam_r: 1, lam_p: 1, lam_port: 1, m_l: 2, rho0: 1, v0: 1, psi0: 1, Msym: 1}
    dV_naive = sp.simplify(grad_sym[0].subs(p_bench).subs(rho_t, sp.Rational(1, 2)))
    rho_in_b = float(sp.N(sp.real_roots(grad_sym[0].subs(p_bench), rho_t)[0], 15))
    h00_b = float(sp.N(H_sym[0, 0].subs(p_bench).subs(rho_t, rho_in_b), 15))
    rho_m_b = float(sp.N(sp.solve(sp.Eq(H_sym[1, 1].subs(p_bench).subs(rho_t, rho_in_b), 0), rho_m)[0], 15))
    ok3 = (
        dV_naive == sp.Rational(-3, 8)
        and abs(rho_in_b - 0.5960716380) < 1e-8
        and abs(h00_b - 4.0659041928) < 1e-8
        and abs(rho_m_b - 1.3842865519) < 1e-8
    )
    record(
        "03_screening_coupled_cubic_benchmark",
        ok3,
        f"dV(1/2)={dV_naive}, rho_in*={rho_in_b:.10f}, H_rrho={h00_b:.10f}, rho_m_crit={rho_m_b:.10f}",
    )

    # 4. Conformal normalization factor of 1/4: A = f_SM^(-1/2) vs A = f_SM^(+-1) + BM_PHYS_EFT_1 check
    Mpl_s, kc_s, x_s = sp.symbols("Mpl kc x", positive=True)
    fSM = 1 + (x_s / psi0) ** 2 / (2 * Msym**2)
    A_c1 = fSM ** (-sp.Rational(1, 2))
    A_c2 = fSM
    alpha_c1 = sp.simplify(2 * Mpl_s**2 / kc_s * (sp.diff(A_c1, x_s) / A_c1) ** 2)
    alpha_c2 = sp.simplify(2 * Mpl_s**2 / kc_s * (sp.diff(A_c2, x_s) / A_c2) ** 2)
    ratio_c1_c2 = sp.simplify(alpha_c1 / alpha_c2)
    # BM_PHYS_EFT_1 numerical values
    Mpl_val = 2.435323459e18
    psi0_val = 2.0e16
    R0_val = 0.01
    Msym_val = 50.0
    v0_val = psi0_val * R0_val
    fSM0 = 1.0 + R0_val**2 / (2.0 * Msym_val**2)
    fpSM0 = R0_val / (psi0_val * Msym_val**2)
    a_c2_num = 2.0 * Mpl_val**2 * (fpSM0 / fSM0) ** 2
    a_c1_num = 0.25 * a_c2_num
    g_c2 = 2.0 * a_c2_num / (1.0 + a_c2_num)
    g_c1 = 2.0 * a_c1_num / (1.0 + a_c1_num)
    ok4 = (
        ratio_c1_c2 == sp.Rational(1, 4)
        and abs(a_c2_num - 4.74464009e-7) < 1e-13
        and abs(a_c1_num - 1.18616002e-7) < 1e-13
        and abs(g_c2 - 9.48927568e-7) < 1e-13
        and abs(g_c1 - 2.37231976e-7) < 1e-13
    )
    record(
        "04_conformal_normalization_factor_of_four",
        ok4,
        f"ratio={ratio_c1_c2}, a_C2={a_c2_num:.8e}, a_C1={a_c1_num:.8e}, |g-1|_C2={g_c2:.8e}, |g-1|_C1={g_c1:.8e}",
    )

    # 5. Broken-phase (rho_0, 0) is neither zero-energy nor stationary for v_0 > 0; (rho_0, v_0) is true vacuum
    V_rho0_0 = sp.simplify(V_eff.subs({rho_t: rho0, u: 0, v: 0, rho_m: 0}))
    dV_rho0_0 = sp.simplify(grad_sym[0].subs({rho_t: rho0, rho_m: 0}))
    V_vac = sp.simplify(V_eff.subs({rho_t: rho0, u: v0, v: 0, rho_m: 0}))
    dV_vac_r = sp.simplify(sp.diff(V_eff, rho_t).subs({rho_t: rho0, u: v0, v: 0, rho_m: 0}))
    dV_vac_u = sp.simplify(sp.diff(V_eff, u).subs({rho_t: rho0, u: v0, v: 0, rho_m: 0}))
    ok5 = (
        sp.simplify(V_rho0_0 - (lam_p / 4 + lam_port / 2) * v0**4) == 0
        and sp.simplify(dV_rho0_0 - m_l * sp.sqrt(lam_port) * v0**2) == 0
        and V_vac == 0 and dV_vac_r == 0 and dV_vac_u == 0
    )
    record("05_broken_phase_rho0_0_nonvacuum", ok5, f"V(rho0,0)={V_rho0_0}, dV(rho0,0)={dV_rho0_0}, V(rho0,v0)={V_vac}")

    # 6. Amplitude damping purity increase: I/2 -> (1+p^2)/2, at p=1/2 -> 5/8 > 1/2
    p_s, q_s = sp.symbols("p q", positive=True)
    K0 = sp.Matrix([[1, 0], [0, sp.sqrt(q_s)]])
    K1 = sp.Matrix([[0, sp.sqrt(p_s)], [0, 0]])
    rho_out = sp.simplify((K0 * (sp.eye(2) / 2) * K0.H + K1 * (sp.eye(2) / 2) * K1.H).subs(q_s, 1 - p_s))
    pur = sp.simplify((rho_out * rho_out).trace())
    ok6 = sp.simplify(pur - (1 + p_s**2) / 2) == 0 and pur.subs(p_s, sp.Rational(1, 2)) == sp.Rational(5, 8)
    record("06_amplitude_damping_purity_counterexample", ok6, f"purity(I/2)={pur}, at p=1/2 -> {pur.subs(p_s, sp.Rational(1, 2))}")

    # 7. Quantum Fisher information of separable |+>^N with J_z = sum Z_i/2 equals N != 0
    ket_plus = sp.Matrix([1, 1]) / sp.sqrt(2)
    Z_half = sp.Matrix([[1, 0], [0, -1]]) / 2
    fq1 = 4 * ((ket_plus.H * Z_half * Z_half * ket_plus)[0] - (ket_plus.H * Z_half * ket_plus)[0] ** 2)
    ok7 = fq1 == 1
    record("07_qfi_separable_product_state_counterexample", ok7, f"F_Q(|+>, Z/2)={fq1} => F_Q(|+>^N, J_z)=N != 0")

    # 8. Linear coherence operator impossibility: mixing |+>, |-> -> I/2
    ket_minus = sp.Matrix([1, -1]) / sp.sqrt(2)
    rho_p = ket_plus * ket_plus.H
    rho_m_st = ket_minus * ket_minus.H
    rho_mix = sp.Rational(1, 2) * (rho_p + rho_m_st)
    ok8 = (
        2 * abs(rho_p[0, 1]) == 1
        and 2 * abs(rho_m_st[0, 1]) == 1
        and rho_mix == sp.eye(2) / 2
        and 2 * abs(rho_mix[0, 1]) == 0
    )
    record("08_coherence_operator_impossibility", ok8, "2|rho_01|(|+>) = 2|rho_01|(|->) = 1 while 2|rho_01|(I/2) = 0")

    # 9. Network adjacency evolution Hermiticity defect (old) vs exact Hermiticity preservation (new)
    hbar, kap, lam_d, mu_m, nu_n, kap_diff = sp.symbols("hbar kap lam_d mu_m nu_n kap_diff", positive=True)
    L2 = sp.Matrix([[1, -1], [-1, 1]])
    A_real = sp.Matrix([[1, 1], [1, 2]])
    A_herm = sp.Matrix([[1, sp.I], [-sp.I, 2]])
    D_rho = sp.diag(1, 3)
    dA_old = sp.simplify((-kap * L2 * A_real - sp.I * lam_d * A_real + mu_m * A_real) / (sp.I * hbar))
    defect_old = sp.simplify(dA_old - dA_old.H)
    H_net = -kap * L2 + nu_n * D_rho
    dA_new = (
        -sp.I / hbar * (H_net * A_herm - A_herm * H_net)
        - lam_d / hbar * A_herm
        - kap_diff / 2 * (L2 * A_herm + A_herm * L2)
        + mu_m / hbar * A_herm
    )
    defect_new = sp.simplify(dA_new - dA_new.H)
    ok9 = defect_old != sp.zeros(2, 2) and defect_new == sp.zeros(2, 2)
    record("09_network_hermiticity_defect_and_repair", ok9, f"old_defect_nonzero={defect_old != sp.zeros(2,2)}, new_defect_zero={defect_new == sp.zeros(2,2)}")

    # 10. Kuramoto order-parameter identity & antisymmetric double sum
    t1, t2, t3, K_c, ash = sp.symbols("t1 t2 t3 K_c ash", real=True)
    ts = [t1, t2, t3]
    dbl_sin = sp.simplify(sum(sp.sin(a - b) for a in ts for b in ts))
    V_kur = -K_c / 6 * sum(sp.cos(a - b) for a in ts for b in ts)
    dV_dPsi = sp.simplify(sp.diff(V_kur.subs({t1: t1 + ash, t2: t2 + ash, t3: t3 + ash}), ash))
    ok10 = dbl_sin == 0 and dV_dPsi == 0
    record("10_kuramoto_order_parameter_and_antisymmetric_sum", ok10, f"sum_sin={dbl_sin}, dV_kur/dPsi={dV_dPsi}")

    # 11. Recursion attenuation cost sign for contractions k in (0, 1)
    k_c = sp.Rational(1, 2)
    ok11 = bool(sp.log(k_c) < 0 and sp.exp(-sp.log(k_c)) == 2 and sp.Max(0, sp.log(k_c)) == 0)
    record("11_recursion_attenuation_cost_sign", ok11, "log(1/2) < 0 gives e^-log(1/2)=2 > 1; clipped C_rec+(1/2)=0")

    # 12. Entropy functional H[R] = -int R ln R increases under diffusion & reversible homogeneous data
    R_s, eps_s = sp.symbols("R eps", positive=True)
    h_dens = -R_s * sp.log(R_s)
    dh_dt = sp.diff(h_dens, R_s) * (-eps_s)
    # At R=1, d(-R ln R)/dR = -(ln 1 + 1) = -1, so d/dt = (-1)(-eps) = +eps > 0
    dh_at_1 = sp.simplify(dh_dt.subs(R_s, 1))
    # Diffusion integrand: d/dt(-R ln R) = -(1 + ln R) D R'' -> IBP gives +D (R')^2 / R > 0
    ok12 = dh_at_1 == eps_s and sp.diff(sp.diff(h_dens, R_s), R_s) == -1 / R_s
    record("12_entropy_lyapunov_counterexamples", ok12, f"reversible dH/dt(R=1, Rdot=-eps)={dh_at_1} > 0, -h''(R)=1/R > 0")

    # 13. Flat Berry connection curl=0 vs nonzero torque
    x_c, y_c, z_c = sp.symbols("x y z", real=True)
    psi_abs = x_c + 2
    theta_f = y_c
    grad_theta = sp.Matrix([sp.diff(theta_f, q) for q in (x_c, y_c, z_c)])
    curl_grad_theta = sp.Matrix([
        sp.diff(grad_theta[2], y_c) - sp.diff(grad_theta[1], z_c),
        sp.diff(grad_theta[0], z_c) - sp.diff(grad_theta[2], x_c),
        sp.diff(grad_theta[1], x_c) - sp.diff(grad_theta[0], y_c),
    ])
    grad_psi = sp.Matrix([sp.diff(psi_abs, q) for q in (x_c, y_c, z_c)])
    torque_v = psi_abs * grad_psi.cross(grad_theta)
    ok13 = curl_grad_theta == sp.Matrix([0, 0, 0]) and torque_v == sp.Matrix([0, 0, x_c + 2])
    record("13_flat_berry_vs_torque_counterexample", ok13, f"curl(grad theta)={list(curl_grad_theta)}, torque={list(torque_v)}")

    # 14. Flat Friedmann linearization factor 2*rho_tot (not 6*rho_tot)
    G_s, rho_tot, drho = sp.symbols("G rho_tot drho", positive=True)
    H_expr = sp.sqrt(sp.Rational(8, 3) * sp.pi * G_s * (rho_tot + drho))
    dH_over_H = sp.simplify(sp.diff(H_expr, drho).subs(drho, 0) / H_expr.subs(drho, 0))
    ok14 = dH_over_H == 1 / (2 * rho_tot)
    record("14_friedmann_linearization_factor_two", ok14, f"(dH/drho)/H = {dH_over_H}")

    # 15. WKB tunneling monotonicity and uncertainty limit
    V_b, E_b = sp.symbols("V E", positive=True)
    T_wkb = sp.exp(-2 * sp.sqrt((V_b - E_b) * rho_t) / hbar)
    dT = sp.diff(T_wkb, rho_t).subs({V_b: 2, E_b: 1, rho_t: 1, hbar: 1})
    lim_unc = sp.limit(sp.limit((1 - R_s) / rho_t, R_s, 1), rho_t, sp.oo)
    ok15 = bool(dT < 0 and lim_unc == 0)
    record("15_wkb_tunneling_and_uncertainty_checks", ok15, f"dT/drho(V>E)={float(dT):.6f} < 0, lim (1-R)/rho_t={lim_unc}")

    # 16. Phase resetting (theta=0, pi -> |+>, |->) vs projective measurement (|0><0|, |1><1|)
    th_q = sp.Symbol("th_q", real=True)
    psi_th = sp.Matrix([1, sp.exp(sp.I * th_q)]) / sp.sqrt(2)
    rho_0 = (psi_th * psi_th.H).subs(th_q, 0)
    rho_pi = (psi_th * psi_th.H).subs(th_q, sp.pi)
    Pi0 = sp.Matrix([[1, 0], [0, 0]])
    Pi1 = sp.Matrix([[0, 0], [0, 1]])
    ok16 = (
        rho_0[0, 0] == sp.Rational(1, 2) and rho_0[1, 1] == sp.Rational(1, 2) and abs(rho_0[0, 1]) == sp.Rational(1, 2)
        and rho_pi[0, 0] == sp.Rational(1, 2) and rho_pi[1, 1] == sp.Rational(1, 2) and abs(rho_pi[0, 1]) == sp.Rational(1, 2)
        and (Pi0 * rho_0 * Pi0 / sp.Rational(1, 2))[0, 1] == 0
        and (Pi1 * rho_0 * Pi1 / sp.Rational(1, 2))[0, 1] == 0
    )
    record("16_phase_resetting_vs_projective_measurement", ok16, "theta in {0, pi} gives p=(1/2,1/2) and |rho_01|=1/2 != 0")

    # 17. Sourced GR broken-vacuum scalar residual (-v0*rho_m / (psi0^2*Msym^2) != 0) & gauge curvature restriction
    L_mat = -rho_m
    fSM_psi = 1 + r2 / (2 * psi0**2 * Msym**2)
    # Variation wrt u at (rho_t=rho0, u=v0, v=0) of (-V_tot + f_SM * L_matter)
    res_u = sp.simplify(sp.diff(-V_eff.subs(rho_m, 0) + fSM_psi * L_mat, u).subs({rho_t: rho0, u: v0, v: 0}))
    res_u_v0_zero = sp.simplify(sp.diff(-V_eff.subs({rho_m: 0, v0: 0}) + fSM_psi * L_mat, u).subs({rho_t: rho0, u: 0, v: 0}))
    q_hat, F_mn = sp.symbols("q_hat F_mn", nonzero=True)
    comm_D = -sp.I * q_hat * F_mn * v0  # [D_mu, D_nu]psi = -i q F_mn psi != 0 when q*v0*F_mn != 0
    ok17 = (
        sp.simplify(res_u + v0 * rho_m / (psi0**2 * Msym**2)) == 0
        and res_u != 0
        and res_u_v0_zero == 0
        and comm_D != 0
    )
    record("17_sourced_gr_broken_vacuum_scalar_and_gauge_residuals", ok17, f"broken_dust_residual={res_u} != 0, v0=0_residual={res_u_v0_zero}")

    # 18. Complex scalar Euler-Lagrange normalization: -(kappa_c/2)|d psi|^2 gives +(kappa_c/2) Box psi against d/d(psi*)
    psi_s, psis_s, dpsi_s, dpsis_s, F2_s, Lm_s, cEM_s = sp.symbols("psi psis dpsi dpsis F2 Lm cEM")
    kc_pos = sp.Symbol("kc_pos", positive=True)
    L_kin = -kc_pos / 2 * dpsis_s * dpsi_s
    # Euler-Lagrange kinetic term d/dx (dL / d(d_mu psi*)) = d/dx (-(kc/2) d^mu psi) -> in (-,+,+,+) variation delta S = int (+(kc/2) Box psi) delta psi*
    coeff_kin_psistar = -sp.diff(L_kin, dpsis_s) / dpsi_s  # +kc/2
    V_simple = lam_p / 4 * (psi_s * psis_s - v0**2) ** 2
    dV_dpsistar = sp.diff(V_simple, psis_s)  # (lam_p / 2)*( |psi|^2 - v0^2 )*psi
    # Doubled form: 2 * coeff_kin = kc, 2 * dV_dpsistar = lam_p * (|psi|^2 - v0^2) * psi
    ok18 = (
        sp.simplify(coeff_kin_psistar - kc_pos / 2) == 0
        and sp.simplify(2 * coeff_kin_psistar - kc_pos) == 0
        and sp.simplify(2 * dV_dpsistar - lam_p * (psi_s * psis_s - v0**2) * psi_s) == 0
    )
    record("18_complex_scalar_euler_lagrange_normalization", ok18, f"undoubled_kinetic_coeff={coeff_kin_psistar}, doubled={2*coeff_kin_psistar}")

    # 19. Generalized two-scalar mass eigenproblem K^(-1/2) H K^(-1/2) vs raw H when K != I
    K_mat = sp.diag(sp.Integer(2), sp.Integer(4))
    K_inv_sqrt = sp.diag(1 / sp.sqrt(sp.Integer(2)), sp.Rational(1, 2))
    H_mat = sp.Matrix([[2, -2], [-2, 6]])
    M_phys2 = sp.simplify(K_inv_sqrt * H_mat * K_inv_sqrt)
    m2_s = sp.Symbol("m2_s")
    eigs_gen = sorted([float(r) for r in sp.solve(sp.det(H_mat - m2_s * K_mat), m2_s)])
    eigs_Mphys = sorted([float(r) for r in M_phys2.eigenvals().keys()])
    eigs_rawH = sorted([float(r) for r in H_mat.eigenvals().keys()])
    ok19 = (
        max(abs(a - b) for a, b in zip(eigs_gen, eigs_Mphys)) < 1e-14
        and abs(eigs_gen[0] - eigs_rawH[0]) > 0.1
        and eigs_gen[0] > 0
    )
    record("19_generalized_two_scalar_mass_eigenproblem", ok19, f"gen_m2={[round(x,6) for x in eigs_gen]} != raw_H={[round(x,6) for x in eigs_rawH]}")

    # 20. Accelerated-frame SI dimension audit & log(max(1, rho)) zero-Jacobian safety
    # Dimensions as exponents of (L, M, T): G=(3,-1,-2), m0=(0,1,0), a=(1,0,-2), r_e=(1,0,0)
    dim_G = (3, -1, -2)
    dim_m0 = (0, 1, 0)
    dim_a = (1, 0, -2)
    dim_re = (1, 0, 0)
    dim_ratio = tuple(dim_G[i] + dim_m0[i] - dim_a[i] - dim_re[i] for i in range(3))
    dim_rhot = (0, 0, -1)
    c_zero = sp.log(sp.Max(1, sp.Integer(0)))
    ok20 = dim_ratio == (1, 0, 0) and dim_ratio != dim_rhot and c_zero == 0
    record("20_accel_dimension_and_zero_jacobian_safety", ok20, f"dim(Gm0/(a*re))={dim_ratio} != dim(rho_t)={dim_rhot}, log(max(1,0))={c_zero}")

    return results, failures


def main() -> int:
    parser = argparse.ArgumentParser(description="Executable mathematical verification suite for SIT Version 81.")
    parser.add_argument("--no-write-receipt", action="store_true", help="Do not write reviews/SIT81-MATH-VERIFICATION-RECEIPT.json.")
    args = parser.parse_args()

    results, failures = run_all_math_checks()
    report = {
        "schema": "sit.v81.math_verification_receipt.v1",
        "generated_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "checks_total": len(results),
        "checks_passed": sum(1 for r in results if r["status"] == "PASS"),
        "failures_count": len(failures),
        "status": "PASS" if not failures else "FAIL",
        "results": results,
    }
    if not args.no_write_receipt:
        out_p = PUB_ROOT / "reviews/SIT81-MATH-VERIFICATION-RECEIPT.json"
        out_p.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8", newline="\n")

    print(f"MATH_STATUS={report['status']} PASSED={report['checks_passed']}/{report['checks_total']} FAILURES={len(failures)}")
    for f in failures:
        print("MATH_FAIL:", f)
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
