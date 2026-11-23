#!/usr/bin/env python3
"""Verification suite for Paper 007 v2 (Super Dark Time, scientific correction pass):
1. SymPy distinction between exact static (zero-momentum) Schur-complement elimination
   and full dynamical momentum-dependent reduction with canonical kinetic terms:
   - Exact Euclidean inverse propagator p^2 + m1^2 - lmix^2 / (p^2 + m2^2);
   - Low-momentum expansion showing kinetic renormalization Z_eff = 1 + lmix^2/m2^4
     and higher-derivative -lmix^2/m2^6 p^4 term;
   - Concrete counterexample M^2 = [[1,1],[1,4]]: Schur = 0.75 vs exact light
     eigenvalue (5 - sqrt(13))/2 = 0.697224 (strictly distinct quantities);
   - Exact freezing consistency condition (dR = 0 requires lmix = 0 and J_R = 0).
2. Unified anomalous clock-redshift dictionary (d ln nu / d(Phi/c^2) = 1 + delta_alpha_Phi,
   delta_alpha_Phi = alpha_rho * T_grav) and nonparalyzable dead-time count calibration
   including exact Poisson renewal Fano factor F_renewal = 1 / (1 + eta_occ)^2 (= 0.25
   at unit occupancy) contrasted with separately assumed F = 1 and F = 2.5 noise scenarios.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
import sympy as sp


def verify_static_elimination_vs_dynamical_reduction() -> dict:
    drho, dR, m1, m2, lmix, J, J_R, p2 = sp.symbols("drho dR m1 m2 lmix J J_R p2", real=True)

    # 1. Exact static (zero-momentum) quadratic elimination
    L_static = -sp.Rational(1, 2) * m1**2 * drho**2 - lmix * drho * dR - sp.Rational(1, 2) * m2**2 * dR**2 + J * drho + J_R * dR
    dR_sol_static = sp.solve(sp.diff(L_static, dR).subs(J_R, 0), dR)[0]
    L_eff_static = sp.simplify(L_static.subs({dR: dR_sol_static, J_R: 0}))
    m_eff_static_sq = sp.simplify(-sp.diff(L_eff_static, drho, 2))
    expected_schur = m1**2 - lmix**2 / m2**2
    schur_diff = sp.simplify(m_eff_static_sq - expected_schur)

    # 2. Exact freezing consistency: setting dR = 0 leaves omitted EOM residual -lmix*drho + J_R
    omitted_eom_at_frozen = sp.simplify(sp.diff(L_static, dR).subs(dR, 0))
    freezing_requires_zero_mixing = (omitted_eom_at_frozen == -lmix * drho + J_R) and (
        omitted_eom_at_frozen.subs({lmix: 0, J_R: 0}) == 0
    )

    # 3. Dynamical Euclidean inverse propagator with canonical kinetic terms:
    # K = I_2, M^2 = [[m1^2, lmix], [lmix, m2^2]] => G_eff^(-1)(p^2) = p^2 + m1^2 - lmix^2/(p^2 + m2^2)
    G_eff_inv = p2 + m1**2 - lmix**2 / (p2 + m2**2)
    series_low_p = sp.series(G_eff_inv, p2, 0, 3).removeO()
    c0 = sp.simplify(series_low_p.subs(p2, 0))
    Z_eff = sp.simplify(sp.diff(series_low_p, p2).subs(p2, 0))
    c4 = sp.simplify(sp.diff(series_low_p, p2, 2).subs(p2, 0) / 2)
    expected_Z_eff = 1 + lmix**2 / m2**4
    expected_c4 = -lmix**2 / m2**6

    # 4. Concrete numerical counterexample: M^2 = [[1, 1], [1, 4]]
    M_ex = sp.Matrix([[1, 1], [1, 4]])
    schur_ex = float(1 - 1**2 / 4)  # 0.75
    eigs_ex = sorted(float(ev.evalf()) for ev in M_ex.eigenvals().keys())
    light_eig_ex = eigs_ex[0]  # (5 - sqrt(13))/2 = 0.697224362268...
    Z_eff_ex = float(1 + 1**2 / 4**2)  # 1.0625
    kinetic_rescaled_pole_approx = schur_ex / Z_eff_ex  # 0.705882...
    negative_control_schur_ne_eigenvalue = abs(schur_ex - light_eig_ex) > 0.05

    passed = (
        schur_diff == 0
        and freezing_requires_zero_mixing
        and sp.simplify(c0 - expected_schur) == 0
        and sp.simplify(Z_eff - expected_Z_eff) == 0
        and sp.simplify(c4 - expected_c4) == 0
        and negative_control_schur_ne_eigenvalue
        and abs(light_eig_ex - (5.0 - math.sqrt(13.0)) / 2.0) < 1e-12
    )
    return {
        "check": "static_schur_elimination_vs_dynamical_momentum_reduction",
        "dR_static_elimination": str(dR_sol_static),
        "static_schur_m_eff_squared": str(m_eff_static_sq),
        "euclidean_inverse_propagator": str(G_eff_inv),
        "low_momentum_kinetic_renormalization_Z_eff": str(Z_eff),
        "low_momentum_quartic_derivative_coeff": str(c4),
        "omitted_dR_eom_residual_when_frozen": str(omitted_eom_at_frozen),
        "freezing_consistent_iff_lmix_and_JR_vanish": freezing_requires_zero_mixing,
        "diagnostic_example_M2_1_1_1_4": {
            "schur_zero_momentum_coeff": schur_ex,
            "exact_light_eigenvalue": round(light_eig_ex, 9),
            "kinetic_Z_eff": Z_eff_ex,
            "rescaled_low_momentum_pole_approx": round(kinetic_rescaled_pole_approx, 9),
            "negative_control_schur_strictly_distinct_from_eigenvalue": negative_control_schur_ne_eigenvalue,
        },
        "passed": passed,
    }


def verify_count_to_field_detector_calibration() -> dict:
    # Unified clock dictionary with explicit GR metric baseline separation:
    # Total observed gravitational redshift slope: d ln(nu) / d(Phi/c^2) = 1 + delta_alpha_Phi
    # Anomalous (SIT-additional, fixed-metric) redshift slope: delta_alpha_Phi = alpha_rho * T_grav
    alpha_rho, T_grav, p = sp.symbols("alpha_rho T_grav p", real=True)
    r = T_grav * p
    y_total = p + alpha_rho * r
    total_slope = sp.diff(y_total, p)
    anomalous_slope = sp.simplify(total_slope - 1)
    assert sp.simplify(anomalous_slope - alpha_rho * T_grav) == 0

    # Non-paralyzable dead-time detector model:
    # lambda_obs = lambda_true / (1 + lambda_true * tau_dead)
    # Fractional slope compression: S_dead = d ln(lambda_obs) / d ln(lambda_true) = 1 / (1 + eta_occ)
    # Exact long-exposure renewal Fano factor for Poisson input through fixed nonparalyzable dead time:
    # F_renewal = 1 / (1 + eta_occ)^2 (sub-Poissonian; equals 0.25 at eta_occ = 1).
    lam, tau_d = sp.symbols("lam tau_d", positive=True)
    lam_obs = lam / (1 + lam * tau_d)
    S_dead_sym = sp.simplify((lam / lam_obs) * sp.diff(lam_obs, lam))
    assert sp.simplify(S_dead_sym - 1 / (1 + lam * tau_d)) == 0

    lam_val = 1.0e4
    tau_exp = 100.0
    rows = []
    for eta_occ in (0.001, 0.05, 0.25, 1.0):
        tau_dead_us = (eta_occ / lam_val) * 1e6
        s_dead = 1.0 / (1.0 + eta_occ)
        lam_obs_val = lam_val * s_dead
        f_renewal = 1.0 / ((1.0 + eta_occ) ** 2)
        rel_err_renewal = (1.0 / s_dead) * math.sqrt(f_renewal / (lam_obs_val * tau_exp))
        rel_err_assumed_f1 = (1.0 / s_dead) * math.sqrt(1.0 / (lam_obs_val * tau_exp))
        rel_err_assumed_f25 = (1.0 / s_dead) * math.sqrt(2.5 / (lam_obs_val * tau_exp))
        rows.append({
            "dead_time_occupancy_lam_tau": eta_occ,
            "tau_dead_us": round(tau_dead_us, 3),
            "compression_factor_S_dead": round(s_dead, 6),
            "naive_fractional_slope_underestimate_percent": round((1.0 - s_dead) * 100.0, 3),
            "exact_poisson_nonparalyzable_renewal_Fano": round(f_renewal, 6),
            "rel_field_err_exact_renewal_F": float(f"{rel_err_renewal:.4e}"),
            "rel_field_err_separately_assumed_F1": float(f"{rel_err_assumed_f1:.4e}"),
            "rel_field_err_separately_assumed_F2p5": float(f"{rel_err_assumed_f25:.4e}"),
        })

    passed = (
        abs(rows[-1]["compression_factor_S_dead"] - 0.5) < 1e-12
        and abs(rows[-1]["exact_poisson_nonparalyzable_renewal_Fano"] - 0.25) < 1e-12
        and rows[-1]["rel_field_err_exact_renewal_F"] < rows[-1]["rel_field_err_separately_assumed_F1"]
        and rows[-1]["rel_field_err_separately_assumed_F2p5"] > rows[-1]["rel_field_err_separately_assumed_F1"]
    )
    return {
        "check": "clock_dictionary_and_dead_time_renewal_calibration",
        "total_observed_redshift_slope": str(total_slope),
        "anomalous_SIT_redshift_slope_delta_alpha_Phi": str(anomalous_slope),
        "dead_time_sensitivity_formula": str(S_dead_sym),
        "exact_nonparalyzable_renewal_Fano_formula": "1 / (1 + lam * tau_d)**2",
        "detector_operating_points": rows,
        "passed": passed,
    }


def main() -> int:
    out_dir = Path(__file__).resolve().parent
    res = {
        "schema": "paper007.v2.verification.v2",
        "checks": [
            verify_static_elimination_vs_dynamical_reduction(),
            verify_count_to_field_detector_calibration(),
        ],
    }
    res["overall_passed"] = all(c["passed"] for c in res["checks"])
    (out_dir / "paper007_v2_verification_results.json").write_text(json.dumps(res, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(res, indent=2))
    return 0 if res["overall_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
