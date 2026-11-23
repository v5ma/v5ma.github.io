#!/usr/bin/env python3
"""Conditional thermal-calibration, corrected spatial-decoherence normalization,
and physical-regime validity verifier for Paper 062 v2 (scientific correction pass):
1. Exact SymPy derivation: b = 2 beta D_x grad u, b = mu F (friction zeta = 1/mu),
   D_x = mu k_B T, F = c_A grad u => c_A = 2 beta k_B T.
2. Consistent Brownian-motion momentum diffusion D_pp = zeta k_B T = k_B T / mu
   gives off-diagonal density-matrix AMPLITUDE spatial decoherence rate:
      Gamma_dec(dx) = D_pp * dx^2 / hbar^2 = k_B T * dx^2 / (mu hbar^2)
                    = 2 beta (k_B T)^2 |grad u| dx^2 / (b0 hbar^2),
   with explicit absolute value assertions AND negative control rejecting the erroneous
   2x factor (note squared-coherence |rho|^2 decays at 2 * Gamma_dec separately).
3. Physical-regime diagnostics:
   - Compares Gamma_dec against the thermal bath rate omega_th = k_B T / hbar
     (at 300 K, Gamma_dec / omega_th ~ 7,855 >> 1 -> naive short-time Markov formula
     is outside its validity window without bath cutoff/memory/interval specification);
   - Computes momentum relaxation time tau_p = m * mu across all temperature benchmarks
     to bound the observation protocol t_obs >> tau_p required for terminal drift.
"""

from __future__ import annotations

import json
from pathlib import Path
import sympy as sp


def verify_thermal_calibration_and_discriminators() -> dict:
    beta, D_x, mu, zeta, k_B, T, c_A, grad_u, dx, hbar, b0_sym = sp.symbols(
        "beta D_x mu zeta k_B T c_A grad_u dx hbar b0", positive=True
    )
    b_qgtcd = 2 * beta * D_x * grad_u
    D_einstein = mu * k_B * T
    b_mobility = mu * (c_A * grad_u)
    sol_cA = sp.solve(sp.Eq(b_qgtcd.subs(D_x, D_einstein), b_mobility), c_A)[0]
    assert sp.simplify(sol_cA - 2 * beta * k_B * T) == 0

    # Consistent friction and momentum diffusion: zeta = 1/mu, D_pp = zeta * k_B * T = k_B * T / mu
    D_pp = (1 / mu) * k_B * T
    # Off-diagonal density-matrix amplitude decay rate: Gamma_dec = D_pp * dx^2 / hbar^2
    Gamma_amp_sym = sp.simplify(D_pp * dx**2 / hbar**2)
    mu_from_b0 = b0_sym / (sol_cA * grad_u)
    Gamma_amp_at_b0 = sp.simplify(Gamma_amp_sym.subs(mu, mu_from_b0))
    expected_Gamma_at_b0 = 2 * beta * (k_B * T) ** 2 * grad_u * dx**2 / (b0_sym * hbar**2)
    assert sp.simplify(Gamma_amp_at_b0 - expected_Gamma_at_b0) == 0

    # Numerical benchmark: mesoscopic silica sphere m = 1e-15 kg, dx = 10 nm,
    # fixed matched mean drift b0 = 1e-6 m/s, |grad u| = 1 m^-1, beta = 1
    # (T and mu vary inversely so that D_x = mu k_B T = b0 / (2 beta |grad u|) stays fixed!)
    kB_val = 1.380649e-23
    hbar_val = 1.054571817e-34
    m_sphere = 1.0e-15  # kg
    dx_val = 10.0e-9  # 10 nm
    b0 = 1.0e-6  # m/s
    grad_u_val = 1.0  # m^-1
    beta_val = 1.0

    rows = []
    for T_val in (0.01, 1.0, 300.0):
        c_A_val = 2.0 * beta_val * kB_val * T_val
        F_val = c_A_val * grad_u_val
        mu_val = b0 / F_val
        zeta_val = 1.0 / mu_val
        D_val = mu_val * kB_val * T_val  # 5.0e-7 m^2/s
        P_diss = F_val * b0  # constant-force terminal-drift power F * b0 = mu F^2
        # Corrected amplitude decoherence rate: Gamma_dec = k_B T dx^2 / (mu hbar^2)
        gamma_amp = (kB_val * T_val * (dx_val**2)) / (mu_val * (hbar_val**2))
        gamma_sq_coh = 2.0 * gamma_amp  # squared-coherence |rho|^2 decay rate (distinct observable)
        omega_th = (kB_val * T_val) / hbar_val
        ratio_to_thermal = gamma_amp / omega_th
        tau_p = m_sphere * mu_val  # momentum relaxation time m / zeta = m * mu
        rows.append({
            "T_K": T_val,
            "c_A_N_m": float(f"{c_A_val:.4e}"),
            "mu_m_per_Ns": float(f"{mu_val:.4e}"),
            "friction_zeta_Ns_per_m": float(f"{zeta_val:.4e}"),
            "D_x_m2_per_s": float(f"{D_val:.4e}"),
            "P_diss_terminal_drift_W": float(f"{P_diss:.4e}"),
            "Gamma_dec_amplitude_per_s": float(f"{gamma_amp:.4e}"),
            "Gamma_squared_coherence_per_s": float(f"{gamma_sq_coh:.4e}"),
            "thermal_rate_kBT_over_hbar_per_s": float(f"{omega_th:.4e}"),
            "ratio_Gamma_dec_over_thermal_rate": round(ratio_to_thermal, 4),
            "markov_initial_decay_valid_without_cutoff": ratio_to_thermal < 0.1,
            "momentum_relaxation_time_tau_p_s": float(f"{tau_p:.4e}"),
        })

    # Verify exact absolute amplitude decoherence rates (NOT just ratios!)
    expected_abs = [3.4282e8, 3.4282e12, 3.0854e17]
    abs_checks_ok = all(
        abs(rows[i]["Gamma_dec_amplitude_per_s"] - expected_abs[i]) / expected_abs[i] < 1e-3
        for i in range(3)
    )

    # Negative control: reject the earlier factor-of-2-too-large rate (6.856e8, 6.856e12, 6.171e17)
    old_wrong_300K = 6.17e17
    negative_control_rejects_factor_of_2_error = (
        abs(rows[2]["Gamma_dec_amplitude_per_s"] - old_wrong_300K) / rows[2]["Gamma_dec_amplitude_per_s"] > 0.9
    )

    # Verify 300 K Markov regime flag (~7,855 * k_B T / hbar >> 1)
    regime_300K_flagged = (
        7800.0 < rows[2]["ratio_Gamma_dec_over_thermal_rate"] < 7900.0
        and not rows[2]["markov_initial_decay_valid_without_cutoff"]
    )

    p_ratio = rows[2]["P_diss_terminal_drift_W"] / rows[0]["P_diss_terminal_drift_W"]
    g_ratio = rows[2]["Gamma_dec_amplitude_per_s"] / rows[0]["Gamma_dec_amplitude_per_s"]
    passed = (
        abs_checks_ok
        and negative_control_rejects_factor_of_2_error
        and regime_300K_flagged
        and abs(p_ratio - 3.0e4) / 3.0e4 < 1e-3
        and abs(g_ratio - 9.0e8) / 9.0e8 < 1e-3
        and abs(rows[0]["D_x_m2_per_s"] - rows[2]["D_x_m2_per_s"]) < 1e-12
    )
    return {
        "check": "conditional_thermal_calibration_corrected_decoherence_and_regime_audit",
        "exact_calibration_c_A": str(sol_cA),
        "amplitude_decoherence_formula": str(Gamma_amp_sym),
        "amplitude_decoherence_at_fixed_b0": str(Gamma_amp_at_b0),
        "held_fixed_parameters": {"b0_m_s": b0, "grad_u_inv_m": grad_u_val, "beta": beta_val, "m_kg": m_sphere, "dx_m": dx_val},
        "varied_parameters_across_rows": "T varied across {0.01, 1.0, 300.0} K with mu adjusted inversely (mu = b0 / (2 beta k_B T |grad u|)) so D_x = 5e-7 m^2/s stays constant",
        "thermal_regimes_at_identical_mean_drift": rows,
        "heating_ratio_300K_over_10mK": round(p_ratio, 2),
        "decoherence_ratio_300K_over_10mK": round(g_ratio, 2),
        "absolute_rate_normalization_verified": abs_checks_ok,
        "negative_control_rejects_factor_of_2_too_large_rate": negative_control_rejects_factor_of_2_error,
        "markov_validity_violation_at_300K_flagged": regime_300K_flagged,
        "passed": passed,
    }


def main() -> int:
    out_dir = Path(__file__).resolve().parent
    res = {
        "schema": "paper062.v2.verification.v2",
        "checks": [verify_thermal_calibration_and_discriminators()],
    }
    res["overall_passed"] = all(c["passed"] for c in res["checks"])
    (out_dir / "paper062_v2_verification_results.json").write_text(json.dumps(res, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(res, indent=2))
    return 0 if res["overall_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
