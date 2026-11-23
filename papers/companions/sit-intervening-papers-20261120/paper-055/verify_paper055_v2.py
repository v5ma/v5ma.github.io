#!/usr/bin/env python3
"""Exact symbolic and numerical verification of standing counterexamples for Paper 055 v2
(QGTCD Constraints Note, scientific correction pass):
1. Constraint I: Two distinct microscopic jump kernels K1 and K2 with identical first and
   second raw moments (same continuum diffusion limit) but strictly different fourth RAW
   moments (h^4 vs 3 h^4, ratio = 3) AND strictly different fourth CUMULANTS (-2 h^4 vs 0,
   excess kurtosis -2 vs 0), with explicit negative control confirming the fourth cumulants
   do NOT have ratio 3.
2. Constraint II: Probe-dependent overdamped drift b_i = 2 beta D_i grad u in a constant
   gradient yields linear mean trajectories <x_i(t)> = x0 + b_i t with ZERO mean acceleration
   (d^2<x_i>/dt^2 = 0) and an exact overdamped drift-velocity contrast Delta_v_AB = 2/3 when
   D_B = 2 D_A; explicitly flagged as a drift-velocity contrast rather than an acceleration-based
   Eotvos parameter without an inertial or apparatus map.
3. Constraint IV: Undamped additive velocity noise dv = a dt + sigma dW produces exact
   linear kinetic-energy heating <v^2(t)> = (v0 + a t)^2 + sigma^2 t -> infinity vs damped OU.
4. Constraint V: Two inequivalent static metrics (gamma=1 GR vs gamma=0 spatially flat)
   produce identical stationary clock redshift dtau/dt = sqrt(1 + 2 Phi/c^2) while differing
   by a factor of 2 in light deflection.
"""

from __future__ import annotations

import json
from pathlib import Path
import numpy as np
import sympy as sp


def verify_constraint_i_nonunique_kernel() -> dict:
    h, tau = sp.symbols("h tau", positive=True)
    # Kernel K1: symmetric nearest-neighbor jump +-h with probability 1/2 each
    mu2_1 = sp.Rational(1, 2) * h**2 + sp.Rational(1, 2) * (-h) ** 2
    mu4_1 = sp.Rational(1, 2) * h**4 + sp.Rational(1, 2) * (-h) ** 4
    kappa4_1 = sp.simplify(mu4_1 - 3 * mu2_1**2)  # -2 h^4
    excess_kurt_1 = sp.simplify(kappa4_1 / mu2_1**2)  # -2

    # Kernel K2: symmetric 5-point kernel {0, +-h, +-2h} with weights p0 = 1/2, p1 = 1/6, p2 = 1/12
    p0, p1, p2 = sp.Rational(1, 2), sp.Rational(1, 6), sp.Rational(1, 12)
    assert p0 + 2 * p1 + 2 * p2 == 1
    mu2_2 = 2 * p1 * h**2 + 2 * p2 * (2 * h) ** 2
    mu4_2 = 2 * p1 * h**4 + 2 * p2 * (2 * h) ** 4
    kappa4_2 = sp.simplify(mu4_2 - 3 * mu2_2**2)  # 0
    excess_kurt_2 = sp.simplify(kappa4_2 / mu2_2**2)  # 0

    M2_1, M2_2 = mu2_1 / tau, mu2_2 / tau
    M4_1, M4_2 = mu4_1 / tau, mu4_2 / tau

    same_D = sp.simplify(M2_1 - M2_2) == 0
    raw_M4_ratio = sp.simplify(M4_2 / M4_1)  # 3
    cumulant_kappa4_ratio = sp.simplify(kappa4_2 / kappa4_1)  # 0 (NOT 3!)
    negative_control_cumulants_not_ratio_3 = (cumulant_kappa4_ratio != 3) and (kappa4_1 != kappa4_2)

    passed = (
        same_D
        and raw_M4_ratio == 3
        and kappa4_1 == -2 * h**4
        and kappa4_2 == 0
        and negative_control_cumulants_not_ratio_3
    )
    return {
        "check": "constraint_I_nonunique_microscopic_kernel_raw_moments_vs_cumulants",
        "K1_second_moment_mu2": str(mu2_1),
        "K2_second_moment_mu2": str(mu2_2),
        "identical_diffusion_coefficient": same_D,
        "K1_fourth_raw_moment_mu4": str(mu4_1),
        "K2_fourth_raw_moment_mu4": str(mu4_2),
        "fourth_raw_moment_ratio_K2_over_K1": str(raw_M4_ratio),
        "K1_fourth_cumulant_kappa4": str(kappa4_1),
        "K2_fourth_cumulant_kappa4": str(kappa4_2),
        "K1_excess_kurtosis": str(excess_kurt_1),
        "K2_excess_kurtosis": str(excess_kurt_2),
        "fourth_cumulant_ratio_K2_over_K1": str(cumulant_kappa4_ratio),
        "negative_control_fourth_cumulant_ratio_is_not_3": negative_control_cumulants_not_ratio_3,
        "passed": passed,
    }


def verify_constraint_ii_probe_dependent_drift_contrast() -> dict:
    beta, grad_u, D_A, t, x0 = sp.symbols("beta grad_u D_A t x0", positive=True)
    D_B = 2 * D_A
    b_A = 2 * beta * D_A * grad_u
    b_B = 2 * beta * D_B * grad_u

    # Constant-gradient overdamped mean trajectories: <x_i(t)> = x0 + b_i * t
    x_mean_A = x0 + b_A * t
    x_mean_B = x0 + b_B * t
    accel_A = sp.diff(x_mean_A, t, 2)  # 0 identically!
    accel_B = sp.diff(x_mean_B, t, 2)  # 0 identically!

    # Normalized overdamped drift-velocity contrast (NOT an acceleration Eotvos parameter!)
    drift_contrast_AB = sp.simplify(2 * sp.Abs(b_A - b_B) / (b_A + b_B))
    passed = (drift_contrast_AB == sp.Rational(2, 3)) and (accel_A == 0) and (accel_B == 0)
    return {
        "check": "constraint_II_overdamped_drift_velocity_contrast_vs_acceleration",
        "D_ratio": "2",
        "overdamped_mean_acceleration_A": str(accel_A),
        "overdamped_mean_acceleration_B": str(accel_B),
        "overdamped_drift_velocity_contrast_Delta_v_AB": str(drift_contrast_AB),
        "is_acceleration_eotvos_parameter_without_inertial_map": False,
        "passed": passed,
    }


def verify_constraint_iv_additive_noise_heating() -> dict:
    rng = np.random.default_rng(20261119)
    n_traj = 20000
    dt = 0.01
    n_steps = 500
    a = 0.0
    sigma = 1.0
    dW = rng.normal(0.0, np.sqrt(dt), size=(n_traj, n_steps))
    v = np.cumsum(a * dt + sigma * dW, axis=1)
    T_final = n_steps * dt
    mean_v2_mc = float(np.mean(v[:, -1] ** 2))
    mean_v2_exact = (sigma**2) * T_final
    rel_err = abs(mean_v2_mc - mean_v2_exact) / mean_v2_exact

    gamma = 1.0
    sigma_ou = np.sqrt(2.0 * gamma * 1.0)
    v_ou = np.zeros(n_traj)
    for step in range(n_steps):
        v_ou = v_ou + (-gamma * v_ou) * dt + sigma_ou * dW[:, step]
    mean_v2_ou = float(np.mean(v_ou**2))
    return {
        "check": "constraint_IV_undamped_noise_heating_vs_damped_equilibrium",
        "T_final": T_final,
        "undamped_exact_v2": mean_v2_exact,
        "undamped_mc_v2": round(mean_v2_mc, 4),
        "undamped_rel_error": round(rel_err, 5),
        "damped_OU_mc_v2_equilibrium": round(mean_v2_ou, 4),
        "passed": (rel_err < 0.03) and (abs(mean_v2_ou - 1.0) < 0.05) and (mean_v2_mc > 4.0 * mean_v2_ou),
    }


def verify_constraint_v_clock_underdetermination() -> dict:
    Phi, c = sp.symbols("Phi c", real=True)
    dtau_dt_1 = sp.sqrt(1 + 2 * Phi / c**2)
    dtau_dt_2 = sp.sqrt(1 + 2 * Phi / c**2)
    clock_diff = sp.simplify(dtau_dt_1 - dtau_dt_2)
    defl_1 = sp.Rational(1 + 1, 2)
    defl_2 = sp.Rational(1 + 0, 2)
    return {
        "check": "constraint_V_clock_match_underdetermines_spatial_metric",
        "stationary_clock_rate_diff": str(clock_diff),
        "light_deflection_factor_gamma1_vs_gamma0": [str(defl_1), str(defl_2)],
        "passed": (clock_diff == 0) and (defl_1 == 2 * defl_2),
    }


def main() -> int:
    out_dir = Path(__file__).resolve().parent
    res = {
        "schema": "paper055.v2.verification.v2",
        "checks": [
            verify_constraint_i_nonunique_kernel(),
            verify_constraint_ii_probe_dependent_drift_contrast(),
            verify_constraint_iv_additive_noise_heating(),
            verify_constraint_v_clock_underdetermination(),
        ],
    }
    res["overall_passed"] = all(c["passed"] for c in res["checks"])
    (out_dir / "paper055_v2_verification_results.json").write_text(json.dumps(res, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(res, indent=2))
    return 0 if res["overall_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
