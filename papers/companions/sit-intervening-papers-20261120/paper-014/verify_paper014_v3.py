#!/usr/bin/env python3
"""Synthetic cold-atom BEC gravimeter-interferometer apparatus model,
multivariable errors-in-variables (EIV) attenuation audit, common-offset invariance check,
and source-mass sensitivity check for Paper 014 v3 (finishing correction pass):
1. Configuration A (synthetic conditional design calculation with assigned noise and
   nuisance assumptions): Rb-87 Raman Mach-Zehnder interferometer comparing binary,
   collinear 5-level ramp (VIF = 63.84), and orthogonalized 10-arm (VIF = 1.251) designs.
   Computes BOTH:
     - Naive single-predictor EIV illustration Var(fc)/(Var(fc) + sigma_fc^2);
     - Exact multivariable nuisance-adjusted EIV attenuation via BOTH Frisch-Waugh
       residual variance Var(fc_res)/(Var(fc_res) + sigma_fc^2) AND full population
       normal equations (Sigma_XX + Sigma_EE)^(-1) Sigma_XX;
     - Stated classical within-observation correlated (fc, T) error example (0.8844);
     - NEW negative control: common session-wide additive offsets (f -> f + c, z -> z + d)
       with a fitted intercept leave BOTH slopes strictly invariant (2, 3) and shift ONLY
       the intercept (5 -> 4.91), proving shared additive offsets do not cause slope attenuation.
2. Configuration B: Declared near-field Rb-87 BEC source-mass configuration (10^7 atoms
   at 2 mm), computing exact gravitational-strength phase vs mean shot-noise floor and
   strictly separating that declared-configuration negative result from any separately
   assumed universal mass-coupled Yukawa comparison.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
import numpy as np


def _multivariable_eiv_check(X: np.ndarray, S_eta: float, sigma_fc: float) -> dict:
    n_rows = X.shape[0]
    fc = X[:, 0] / S_eta
    var_fc = float(np.var(fc))

    X_nuis = X[:, 1:]
    beta_aux, *_ = np.linalg.lstsq(X_nuis, fc, rcond=None)
    fc_res = fc - X_nuis @ beta_aux
    var_fc_res = float(np.mean(fc_res**2))
    r2 = 1.0 - var_fc_res / var_fc
    vif = 1.0 / (1.0 - r2)

    att_res = var_fc_res / (var_fc_res + sigma_fc**2)

    Sigma_XX = (X.T @ X) / n_rows
    Sigma_EE = np.zeros_like(Sigma_XX)
    Sigma_EE[0, 0] = (S_eta * sigma_fc) ** 2
    M_att = np.linalg.solve(Sigma_XX + Sigma_EE, Sigma_XX)
    att_normal_eq = float(M_att[0, 0])

    assert abs(att_res - att_normal_eq) < 1e-12, f"Mismatch: {att_res} vs {att_normal_eq}"
    return {
        "var_fc": round(var_fc, 9),
        "var_fc_residual": round(var_fc_res, 9),
        "r2_collinearity": round(r2, 6),
        "vif": round(vif, 4),
        "attenuation_residual_formula": round(att_res, 6),
        "attenuation_normal_equations": round(att_normal_eq, 6),
        "method_discrepancy": float(f"{abs(att_res - att_normal_eq):.3e}"),
        "downward_bias_percent": round((1.0 - att_res) * 100.0, 4),
    }


def run_config_a_identifiability() -> dict:
    lam_laser = 780.241e-9
    k_eff = 4.0 * math.pi / lam_laser
    T_int = 0.25
    g = 9.80665
    k_B = 1.380649e-23
    m_Rb = 86.909180527 * 1.66053906660e-27
    S_eta = k_eff * g * (T_int**2)

    sigma_phi_shot = 3.0e-3
    M_total = 2000

    # Design (i): Binary BEC vs Thermal -> rank 2 < 3
    X_bin = np.array([
        [S_eta * 0.85, 120.0 / 500.0, 1.0],
        [S_eta * 0.00, 260.0 / 500.0, 1.0],
    ])
    rank_bin = int(np.linalg.matrix_rank(X_bin))

    # Design (ii): 5-level evaporative ramp (400 shots/level)
    f_levels = np.array([0.00, 0.25, 0.50, 0.70, 0.85])
    T_c_nK = 226.0
    T_ramp = np.array([1.15 * T_c_nK if f == 0.0 else T_c_nK * ((1.0 - f) ** (1.0 / 3.0)) for f in f_levels])
    R_wf_fixed = np.full_like(f_levels, 500.0)
    X_ramp = np.column_stack([S_eta * f_levels, T_ramp / R_wf_fixed, np.ones_like(f_levels)])
    shots_per_ramp = M_total // len(f_levels)  # 400
    var_ramp = (sigma_phi_shot**2) / shots_per_ramp
    FIM_ramp = (X_ramp.T @ X_ramp) / var_ramp
    cov_ramp = np.linalg.inv(FIM_ramp)
    sigma_eta_ramp = float(math.sqrt(cov_ramp[0, 0]))

    # Design (iii): 10-arm orthogonalized design (200 shots/arm)
    rows_orth = []
    for T_c_arm, R_wf_arm, dz_um in [(226.0, 500.0, 0.0), (340.0, 250.0, 10.0)]:
        for f in f_levels:
            T_val = 1.15 * T_c_arm if f == 0.0 else T_c_arm * ((1.0 - f) ** (1.0 / 3.0))
            dz_signed = dz_um if (int(round(f * 100)) % 2 == 0) else -dz_um
            rows_orth.append([S_eta * f, T_val / R_wf_arm, dz_signed, 1.0])
    X_orth = np.array(rows_orth)
    shots_per_orth = M_total // len(rows_orth)  # 200
    var_orth = (sigma_phi_shot**2) / shots_per_orth
    FIM_orth = (X_orth.T @ X_orth) / var_orth
    cov_orth = np.linalg.inv(FIM_orth)
    sigma_eta_orth = float(math.sqrt(cov_orth[0, 0]))

    # Classical EIV analysis at sigma_fc = 0.03
    sigma_fc = 0.03
    var_fc = float(np.var(f_levels))
    naive_1d_att = var_fc / (var_fc + sigma_fc**2)

    eiv_ramp_arm = _multivariable_eiv_check(X_ramp, S_eta, sigma_fc)
    eiv_orth_arm = _multivariable_eiv_check(X_orth, S_eta, sigma_fc)
    eiv_ramp_avg = _multivariable_eiv_check(X_ramp, S_eta, sigma_fc / math.sqrt(shots_per_ramp))
    eiv_orth_avg = _multivariable_eiv_check(X_orth, S_eta, sigma_fc / math.sqrt(shots_per_orth))

    # Stated classical within-observation correlated (f_c, T) measurement-error example on Design (ii)
    sigma_wf_err = 5.0 / 500.0
    rho_err = -0.7
    Sigma_XX_ramp = (X_ramp.T @ X_ramp) / X_ramp.shape[0]
    Sigma_EE_corr = np.zeros_like(Sigma_XX_ramp)
    Sigma_EE_corr[0, 0] = (S_eta * sigma_fc) ** 2
    Sigma_EE_corr[1, 1] = sigma_wf_err**2
    Sigma_EE_corr[0, 1] = rho_err * (S_eta * sigma_fc) * sigma_wf_err
    Sigma_EE_corr[1, 0] = Sigma_EE_corr[0, 1]
    M_corr = np.linalg.solve(Sigma_XX_ramp + Sigma_EE_corr, Sigma_XX_ramp)

    # NEW Negative control: Common session-wide additive offsets (c = 0.03 on f_c, d = 0.01 on z)
    # on the 5-level design with fitted intercept leave BOTH slopes strictly invariant and shift ONLY intercept!
    z_ramp = T_ramp / R_wf_fixed
    beta_true = np.array([2.0, 3.0, 5.0])  # [beta_f, beta_z, intercept b]
    X_unit = np.column_stack([f_levels, z_ramp, np.ones_like(f_levels)])
    y_exact = X_unit @ beta_true
    c_off, d_off = 0.03, 0.01
    X_shifted = np.column_stack([f_levels + c_off, z_ramp + d_off, np.ones_like(f_levels)])
    beta_hat_shifted, *_ = np.linalg.lstsq(X_shifted, y_exact, rcond=None)
    expected_intercept = float(beta_true[2] - beta_true[0] * c_off - beta_true[1] * d_off)  # 5 - 0.06 - 0.03 = 4.91
    common_offset_invariance_ok = bool(
        abs(float(beta_hat_shifted[0]) - float(beta_true[0])) < 1e-11
        and abs(float(beta_hat_shifted[1]) - float(beta_true[1])) < 1e-11
        and abs(float(beta_hat_shifted[2]) - expected_intercept) < 1e-11
    )

    naive_bias_pct = (1.0 - naive_1d_att) * 100.0
    actual_collinear_bias_pct = eiv_ramp_arm["downward_bias_percent"]
    negative_control_naive_1d_fails_under_vif = (
        abs(eiv_ramp_arm["attenuation_residual_formula"] - 0.61914) < 1e-4
        and actual_collinear_bias_pct > 35.0
        and (actual_collinear_bias_pct / naive_bias_pct) > 35.0
    )

    v_th_sq = k_B * 200e-9 / m_Rb
    phi_wf_200nK = k_eff * v_th_sq * (T_int**2) / 500.0

    gain_from_fim = sigma_eta_ramp / sigma_eta_orth
    gain_from_vif_ratio = math.sqrt(eiv_ramp_arm["vif"] / eiv_orth_arm["vif"])

    passed = (
        rank_bin < 3
        and eiv_ramp_arm["vif"] > 60.0
        and eiv_orth_arm["vif"] < 1.3
        and abs(gain_from_fim - gain_from_vif_ratio) < 1e-3
        and negative_control_naive_1d_fails_under_vif
        and common_offset_invariance_ok
        and eiv_orth_arm["attenuation_residual_formula"] > 0.985
    )
    return {
        "check": "config_a_synthetic_raman_interferometer_identifiability_and_multivariable_eiv",
        "model_status": "synthetic conditional design calculation with assigned noise and nuisance assumptions",
        "k_eff_inv_m": round(k_eff, 2),
        "T_interrogation_s": T_int,
        "scale_factor_S_eta_rad": round(S_eta, 2),
        "single_shot_phase_noise_rad": sigma_phi_shot,
        "total_shots": M_total,
        "typical_200nK_wavefront_phase_rad_at_500m": float(f"{phi_wf_200nK:.4e}"),
        "design_i_binary": {"matrix_rank": rank_bin, "parameters": 3, "identifiable": False},
        "design_ii_5level_ramp_only": {
            "vif_eta0": round(eiv_ramp_arm["vif"], 3),
            "r2_collinearity_with_T": round(eiv_ramp_arm["r2_collinearity"], 5),
            "sigma_eta0_1sigma": float(f"{sigma_eta_ramp:.4e}"),
            "multivariable_eiv_arm_level_sigma_0_03": eiv_ramp_arm,
            "multivariable_eiv_per_shot_averaged_400shots": eiv_ramp_avg,
        },
        "design_iii_10arm_orthogonalized": {
            "vif_eta0": round(eiv_orth_arm["vif"], 3),
            "r2_collinearity_with_nuisances": round(eiv_orth_arm["r2_collinearity"], 5),
            "sigma_eta0_1sigma": float(f"{sigma_eta_orth:.4e}"),
            "sensitivity_gain_over_ramp_only": round(gain_from_fim, 4),
            "sqrt_vif_ratio_check": round(gain_from_vif_ratio, 4),
            "multivariable_eiv_arm_level_sigma_0_03": eiv_orth_arm,
            "multivariable_eiv_per_shot_averaged_200shots": eiv_orth_avg,
        },
        "single_predictor_only_illustration_DO_NOT_USE_UNDER_COLLINEARITY": {
            "var_fc": round(var_fc, 6),
            "naive_attenuation": round(naive_1d_att, 6),
            "naive_bias_percent": round(naive_bias_pct, 4),
            "understatement_factor_vs_collinear_design_ii": round(actual_collinear_bias_pct / naive_bias_pct, 2),
        },
        "classical_within_observation_correlated_fc_T_error_example": {
            "scope": "Classical within-observation error covariance Sigma_EE only (distinct from common additive offsets or between-observation correlation)",
            "sigma_fc": sigma_fc,
            "sigma_T_nK": 5.0,
            "R_wf_m": 500.0,
            "error_correlation_rho": rho_err,
            "attenuation_matrix_00_on_eta0": round(float(M_corr[0, 0]), 6),
            "cross_contamination_01_from_wf_into_eta0_per_S_eta": float(f"{float(M_corr[0, 1]) / S_eta:.4e}"),
        },
        "common_session_additive_offset_negative_control": {
            "true_coeffs_beta_f_beta_z_b": [2.0, 3.0, 5.0],
            "common_offsets_c_d": [c_off, d_off],
            "fitted_coeffs_after_common_offset": [round(float(v), 9) for v in beta_hat_shifted],
            "expected_shifted_intercept": round(expected_intercept, 9),
            "slopes_strictly_invariant_under_common_additive_offset": common_offset_invariance_ok,
        },
        "negative_control_naive_1d_eiv_rejected_under_collinearity": negative_control_naive_1d_fails_under_vif,
        "passed": passed,
    }


def run_config_b_lab_bec_source_mass() -> dict:
    G = 6.67430e-11
    m_Rb = 86.909180527 * 1.66053906660e-27
    lam_laser = 780.241e-9
    k_eff = 4.0 * math.pi / lam_laser
    T_int = 0.25
    sigma_phi_shot = 3.0e-3
    M_total = 2000

    N_src = 1.0e7
    M_src = N_src * m_Rb
    d = 2.0e-3
    g_N_source = G * M_src / (d**2)

    phi_N_source = k_eff * g_N_source * (T_int**2)
    sigma_phi_mean = sigma_phi_shot / math.sqrt(M_total)
    alpha_min_declared_raman_1sigma = sigma_phi_mean / phi_N_source

    a_floor_reference = 1.0e-12
    alpha_min_at_1e_12_floor = a_floor_reference / g_N_source

    passed = (
        abs(g_N_source - 2.408e-23) / 2.408e-23 < 1e-2
        and abs(phi_N_source - 2.424e-17) / 2.424e-17 < 1e-2
        and abs(sigma_phi_mean - 6.7082e-5) / 6.7082e-5 < 1e-3
        and alpha_min_declared_raman_1sigma > 1e12
        and alpha_min_at_1e_12_floor > 1e10
    )
    return {
        "check": "config_b_declared_bec_source_configuration_sensitivity",
        "N_source_atoms": int(N_src),
        "source_mass_kg": float(f"{M_src:.4e}"),
        "separation_m": d,
        "newtonian_acceleration_m_s2": float(f"{g_N_source:.4e}"),
        "gravitational_strength_raman_phase_rad": float(f"{phi_N_source:.4e}"),
        "mean_phase_uncertainty_2000shots_rad": float(f"{sigma_phi_mean:.4e}"),
        "required_alpha_1sigma_declared_raman": float(f"{alpha_min_declared_raman_1sigma:.4e}"),
        "reference_acceleration_floor_m_s2": a_floor_reference,
        "required_alpha_at_reference_floor": float(f"{alpha_min_at_1e_12_floor:.4e}"),
        "declared_configuration_detects_gravitational_strength": False,
        "torsion_balance_comparison_scope": (
            "Applies ONLY under a separately assumed universal mass-coupled Yukawa model; "
            "does NOT automatically exclude a condensate-selective coupling without Section 6 "
            "material-charge, screening, geometry, and likelihood translation, nor all alternative "
            "BEC source configurations."
        ),
        "passed": passed,
    }


def main() -> int:
    out_dir = Path(__file__).resolve().parent
    res = {
        "schema": "paper014.v3.verification.v3",
        "checks": [
            run_config_a_identifiability(),
            run_config_b_lab_bec_source_mass(),
        ],
    }
    res["overall_passed"] = all(c["passed"] for c in res["checks"])
    (out_dir / "paper014_v3_verification_results.json").write_text(json.dumps(res, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(res, indent=2))
    return 0 if res["overall_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
