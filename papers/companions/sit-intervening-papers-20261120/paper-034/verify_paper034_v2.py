#!/usr/bin/env python3
"""Verification suite for Paper 034 v2 (SuperTimePosition & Gravitational Phase-Lock):
1. Gauge invariance check (SymPy): bare phase theta(x) shifts under local U(1) gauge
   transformation, whereas Wilson-line dressed relative phase Delta_Theta_gamma is strictly invariant.
2. Bounded Transient Theorem (Spectral Fokker-Planck PDE solver on S^1):
   Proves and numerically verifies that under time-dependent pi-periodic drift
   v(phi, t) = -kappa(t) * sin(2*(phi - theta(t))) and positive diffusion D(t) > 0,
   an initially pi-symmetric distribution p(phi+pi, 0) = p(phi, 0) preserves exact
   pi-symmetry p(phi+pi, t) = p(phi, t) and zero antipodal binary marginal E_t[A(phi, a)] = 0
   across ALL finite-time transients (with negative control breaking pi-symmetry at t=0).
"""

from __future__ import annotations

import json
import math
from pathlib import Path
import numpy as np
import sympy as sp


def verify_gauge_invariant_relative_phase() -> dict:
    # Under U(1) transformation: theta(x) -> theta(x) + chi(x), A_s -> A_s + (1/q) d_s chi
    # Wilson-line dressed relative phase along path s in [0, 1] from x to y:
    # Delta_Theta = theta(y) - theta(x) - q * int_0^1 A_s ds
    s, q = sp.symbols("s q", real=True)
    theta_x, theta_y, A_int = sp.symbols("theta_x theta_y A_int", real=True)
    chi_x, chi_y = sp.symbols("chi_x chi_y", real=True)
    # Integral of d_s chi from 0 to 1 is chi_y - chi_x
    bare_shift = (theta_x + chi_x) - theta_x
    dressed_before = theta_y - theta_x - q * A_int
    dressed_after = (theta_y + chi_y) - (theta_x + chi_x) - q * (A_int + (chi_y - chi_x) / q)
    dressed_shift = sp.simplify(dressed_after - dressed_before)
    return {
        "check": "u1_gauge_invariance_dressed_vs_bare_phase",
        "bare_phase_gauge_shift": str(bare_shift),
        "dressed_wilson_line_phase_gauge_shift": str(dressed_shift),
        "passed": (bare_shift != 0) and (dressed_shift == 0),
    }


def solve_fokker_planck_s1(p0: np.ndarray, n_steps: int = 1000, T_final: float = 2.0) -> dict:
    # Pseudospectral RK4 integration of d_t p = -d_phi (v(phi, t) p) + D(t) d_phi^2 p on [0, 2pi)
    N = len(p0)
    phi = np.linspace(0.0, 2.0 * np.pi, N, endpoint=False)
    k = np.fft.fftfreq(N, d=1.0 / N)  # integer wavenumbers 0, 1, ..., N/2-1, -N/2, ...
    ik = 1j * k
    k2 = k**2
    dt = T_final / n_steps

    def rhs(p_vals: np.ndarray, t: float) -> np.ndarray:
        kappa_t = 2.0 + 0.8 * math.sin(3.0 * t)
        theta_t = 0.7 * math.cos(2.0 * t)
        D_t = 0.35 + 0.1 * math.cos(1.5 * t)
        v = -kappa_t * np.sin(2.0 * (phi - theta_t))  # strictly pi-periodic: v(phi+pi, t) = v(phi, t)
        vp_hat = np.fft.fft(v * p_vals)
        p_hat = np.fft.fft(p_vals)
        dp_hat = -ik * vp_hat - D_t * k2 * p_hat
        return np.real(np.fft.ifft(dp_hat))

    p = p0.copy()
    max_sym_defect = 0.0
    max_abs_marginal = 0.0
    half = N // 2
    # Antipodal binary observable A(phi, a) = sign(cos(phi - a)) at setting a = 0.37
    a_setting = 0.37
    A_obs = np.where(np.cos(phi - a_setting) >= 0.0, 1.0, -1.0)
    dphi = 2.0 * np.pi / N

    for step in range(n_steps + 1):
        # Measure pi-symmetry defect: max |p(phi) - p(phi + pi)|
        defect = float(np.max(np.abs(p - np.roll(p, half))))
        marg = float(np.sum(A_obs * p) * dphi)
        max_sym_defect = max(max_sym_defect, defect)
        max_abs_marginal = max(max_abs_marginal, abs(marg))
        if step < n_steps:
            t = step * dt
            k1 = rhs(p, t)
            k2_rk = rhs(p + 0.5 * dt * k1, t + 0.5 * dt)
            k3_rk = rhs(p + 0.5 * dt * k2_rk, t + 0.5 * dt)
            k4_rk = rhs(p + dt * k3_rk, t + dt)
            p = p + (dt / 6.0) * (k1 + 2.0 * k2_rk + 2.0 * k3_rk + k4_rk)

    norm_final = float(np.sum(p) * dphi)
    min_p = float(np.min(p))
    return {
        "max_pi_symmetry_defect": max_sym_defect,
        "max_abs_binary_marginal": max_abs_marginal,
        "final_probability_integral": round(norm_final, 12),
        "final_min_density": round(min_p, 6),
    }


def verify_transient_pi_symmetry_theorem() -> dict:
    N = 64
    phi = np.linspace(0.0, 2.0 * np.pi, N, endpoint=False)
    # Positive case: pi-symmetric initial condition p0(phi) = (1 + 0.4 cos(2 phi)) / (2 pi)
    p0_sym = (1.0 + 0.4 * np.cos(2.0 * phi)) / (2.0 * np.pi)
    res_sym = solve_fokker_planck_s1(p0_sym, n_steps=1600, T_final=2.0)

    # Negative control: non-pi-symmetric initial condition p0(phi) = (1 + 0.4 cos(phi)) / (2 pi)
    p0_asym = (1.0 + 0.4 * np.cos(phi)) / (2.0 * np.pi)
    res_asym = solve_fokker_planck_s1(p0_asym, n_steps=1600, T_final=2.0)

    passed = (
        res_sym["max_pi_symmetry_defect"] < 1e-13
        and res_sym["max_abs_binary_marginal"] < 1e-13
        and abs(res_sym["final_probability_integral"] - 1.0) < 1e-11
        and res_sym["final_min_density"] > 0.0
        and res_asym["max_pi_symmetry_defect"] > 0.1
        and res_asym["max_abs_binary_marginal"] > 0.1
    )
    return {
        "check": "transient_fokker_planck_pi_symmetry_theorem",
        "pi_symmetric_initial_case": res_sym,
        "negative_control_asymmetric_initial_case": res_asym,
        "passed": passed,
    }


def main() -> int:
    out_dir = Path(__file__).resolve().parent
    res = {
        "schema": "paper034.v2.verification.v1",
        "checks": [
            verify_gauge_invariant_relative_phase(),
            verify_transient_pi_symmetry_theorem(),
        ],
    }
    res["overall_passed"] = all(c["passed"] for c in res["checks"])
    (out_dir / "paper034_v2_verification_results.json").write_text(json.dumps(res, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(res, indent=2))
    return 0 if res["overall_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
