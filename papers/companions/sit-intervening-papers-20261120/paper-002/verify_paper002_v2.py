#!/usr/bin/env python3
"""Reproducible verification and observational reference-case suite for Paper 002 v2
(scientific correction pass):
1. Exact SymPy proof of conformal-vs-multiplicative non-interchangeability (A = f_SM = 1)
   making explicit the exact matter-sector assumptions (two non-Weyl-invariant terms of
   distinct 4D conformal weights A^2 kinetic vs A^4 mass/potential at fixed unrescaled
   matter fields, contrasted with a Weyl-invariant Maxwell term of weight A^0 = 1).
2. Unital vs non-unital CPTP quantum-channel purity verification.
3. Three shared observational reference cases (A, B, C) with finite-coupling denominators
   and spherical Fayet form-factor absorption.
4. Unified clock-redshift dictionary check explicitly separating total observed redshift
   slope d ln(nu)/d(Phi/c^2) = 1 + delta_alpha_Phi from the anomalous non-metric SIT slope
   delta_alpha_Phi = alpha_rho * T_grav (T_grav entering strictly once).
"""

from __future__ import annotations

import json
import math
from pathlib import Path
import numpy as np
import sympy as sp


def verify_conformal_vs_multiplicative() -> dict:
    A, f_sm = sp.symbols("A f_sm", positive=True)
    # In 4D under g_tilde_munu = A^2 g_munu at FIXED unrescaled matter fields:
    # - Scalar kinetic term sqrt(-g_tilde) g_tilde^{mu nu} d_mu chi d_nu chi scales by A^4 * A^(-2) = A^2
    # - Scalar mass/potential term sqrt(-g_tilde) m^2 chi^2 scales by A^4
    # - Pure 4D Maxwell term sqrt(-g_tilde) g_tilde^{mu a} g_tilde^{nu b} F_{mu nu} F_{a b} scales by A^4 * A^(-4) = A^0 = 1 (Weyl-invariant!)
    w_kin = A**4 * A ** (-2)
    w_mass = A**4
    w_maxwell = A**4 * A ** (-4)

    # Matching multiplicative f_sm * L_m requires A^2 = f_sm AND A^4 = f_sm simultaneously whenever
    # both kinetic and mass/potential terms are present with fixed unrescaled matter variables.
    sols = sp.solve([sp.Eq(w_kin, f_sm), sp.Eq(w_mass, f_sm)], [A, f_sm], dict=True)

    f0, lam, m = sp.symbols("f0 lam m", positive=True)
    X_kin = sp.simplify(f0 * (f0 ** sp.Rational(-1, 2)) ** 2)
    X_mass = sp.simplify(f0 * m**2 * (f0 ** sp.Rational(-1, 2)) ** 2)
    X_quartic = sp.simplify(f0 * lam * (f0 ** sp.Rational(-1, 2)) ** 4)
    passed = (
        len(sols) == 1
        and sols[0][A] == 1
        and sols[0][f_sm] == 1
        and w_maxwell == 1
        and X_kin == 1
        and X_mass == m**2
        and X_quartic == lam / f0
    )
    return {
        "check": "conformal_vs_multiplicative_non_interchangeability",
        "matter_assumptions": "4D non-Weyl-invariant matter with distinct conformal weights (kinetic A^2 and mass/potential A^4) at fixed unrescaled matter fields",
        "conformal_weights_4D": {"scalar_kinetic": str(w_kin), "scalar_mass_or_potential": str(w_mass), "pure_maxwell_weyl_invariant": str(w_maxwell)},
        "exact_solutions_for_positive_A_and_fSM": [{str(k): str(v) for k, v in s.items()} for s in sols],
        "canonical_rescaling_at_constant_f0": {
            "kinetic_factor": str(X_kin),
            "mass_sq_factor": str(X_mass),
            "quartic_coupling": str(X_quartic),
        },
        "passed": passed,
    }


def verify_quantum_channel_purity() -> dict:
    ket_plus = np.array([[1.0], [1.0]]) / math.sqrt(2.0)
    rho_plus = ket_plus @ ket_plus.conj().T
    I2 = np.eye(2)
    Z = np.array([[1.0, 0.0], [0.0, -1.0]])
    p = 0.3
    rho_deph = (1 - p) * rho_plus + p * (Z @ rho_plus @ Z)
    pur_before_unital = float(np.real(np.trace(rho_plus @ rho_plus)))
    pur_after_unital = float(np.real(np.trace(rho_deph @ rho_deph)))

    rho_mix = 0.5 * I2
    g = 0.5
    K0 = np.array([[1.0, 0.0], [0.0, math.sqrt(1.0 - g)]])
    K1 = np.array([[0.0, math.sqrt(g)], [0.0, 0.0]])
    assert np.allclose(K0.conj().T @ K0 + K1.conj().T @ K1, I2)
    rho_ad = K0 @ rho_mix @ K0.conj().T + K1 @ rho_mix @ K1.conj().T
    pur_before_nonunital = float(np.real(np.trace(rho_mix @ rho_mix)))
    pur_after_nonunital = float(np.real(np.trace(rho_ad @ rho_ad)))

    passed = (
        pur_after_unital < pur_before_unital
        and abs(pur_before_nonunital - 0.5) < 1e-12
        and abs(pur_after_nonunital - 0.625) < 1e-12
        and pur_after_nonunital > pur_before_nonunital
    )
    return {
        "check": "unital_vs_nonunital_purity_monotonicity",
        "unital_dephasing_p03": {"before": round(pur_before_unital, 6), "after": round(pur_after_unital, 6)},
        "nonunital_amplitude_damping_g05_on_mixed": {
            "before": round(pur_before_nonunital, 6),
            "after": round(pur_after_nonunital, 6),
            "purity_increased": pur_after_nonunital > pur_before_nonunital,
        },
        "passed": passed,
    }


def verify_observational_reference_cases() -> dict:
    alpha = 1.0e-3
    r_orb = 1.0
    case_ab_rows = []
    for lam in (0.1, 0.5, 1.0, 10.0):
        b = 0.01
        gamma_loc_b = (1.0 - alpha * math.exp(-b / lam)) / (1.0 + alpha * math.exp(-b / lam))
        f_orb = (1.0 + r_orb / lam) * math.exp(-r_orb / lam)
        gamma_cassini_eff = 2.0 / (1.0 + alpha * f_orb) - 1.0
        case_ab_rows.append({
            "lambda_AU": lam,
            "gamma_loc_at_limb_minus_1": round(gamma_loc_b - 1.0, 9),
            "gamma_cassini_orbit_calibrated_minus_1": round(gamma_cassini_eff - 1.0, 9),
            "ratio_cassini_to_local_deviation": round((gamma_cassini_eff - 1.0) / (gamma_loc_b - 1.0), 6),
        })

    def fayet_phi(x: float) -> float:
        if x < 1e-6:
            return 1.0 + x**2 / 10.0
        return 3.0 * (x * math.cosh(x) - math.sinh(x)) / (x**3)

    alpha_true = 1.0e-5
    case_c_rows = []
    for x in (0.1, 1.0, 3.0, 5.0):
        phi = fayet_phi(x)
        alpha_hat_pt = alpha_true * phi
        case_c_rows.append({
            "R_over_lambda": x,
            "fayet_form_factor": round(phi, 6),
            "alpha_true": alpha_true,
            "alpha_inferred_by_point_source_fit": round(alpha_hat_pt, 10),
            "bias_multiplier": round(alpha_hat_pt / alpha_true, 6),
        })

    passed = (
        abs(case_ab_rows[0]["ratio_cassini_to_local_deviation"]) < 0.01
        and abs(case_ab_rows[-1]["ratio_cassini_to_local_deviation"] - 1.0) < 0.02
        and case_c_rows[2]["bias_multiplier"] > 2.0
    )
    return {
        "check": "observational_reference_cases_A_B_C",
        "cases_A_B_finite_range_and_mass_calibration": case_ab_rows,
        "case_C_fayet_form_factor_absorption": case_c_rows,
        "passed": passed,
    }


def verify_unified_clock_redshift_dictionary() -> dict:
    # Total weak-field gravitational redshift: d ln(nu) / d(Phi/c^2) = 1 + delta_alpha_Phi
    # where 1 is the standard GR metric redshift and delta_alpha_Phi = alpha_rho * T_grav
    # is the anomalous (non-metric / SIT-additional) fractional clock-response slope.
    alpha_rho, T_grav, p = sp.symbols("alpha_rho T_grav p", real=True)
    y_total = p + alpha_rho * (T_grav * p)
    total_slope = sp.diff(y_total, p)
    anomalous_slope = sp.simplify(total_slope - 1)
    passed = sp.simplify(total_slope - (1 + alpha_rho * T_grav)) == 0 and sp.simplify(anomalous_slope - alpha_rho * T_grav) == 0
    return {
        "check": "unified_anomalous_clock_redshift_dictionary",
        "total_observed_redshift_slope": str(total_slope),
        "gr_metric_baseline": 1,
        "anomalous_SIT_redshift_slope_delta_alpha_Phi": str(anomalous_slope),
        "passed": passed,
    }


def main() -> int:
    out_dir = Path(__file__).resolve().parent
    res = {
        "schema": "paper002.v2.verification.v2",
        "checks": [
            verify_conformal_vs_multiplicative(),
            verify_quantum_channel_purity(),
            verify_observational_reference_cases(),
            verify_unified_clock_redshift_dictionary(),
        ],
    }
    res["overall_passed"] = all(c["passed"] for c in res["checks"])
    (out_dir / "paper002_v2_verification_results.json").write_text(json.dumps(res, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(res, indent=2))
    return 0 if res["overall_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
