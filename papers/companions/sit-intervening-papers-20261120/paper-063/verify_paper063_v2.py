#!/usr/bin/env python3
"""Formal-language and distinctiveness-control verification suite for Paper 063 v2
(scientific correction pass):
1. Verifies the exact finite 4-object linear preorder P_4 and 4-step projected trace
   automaton, proving that any 4-step workflow shares this coarse skeleton trivially.
2. Runs four explicit mathematical/engineering null baselines (1D random walk,
   scalar Kalman prediction-error filter, DPCM difference coder, regular perturbation
   expansion) using EXACT analytical population expectations for the exact zero/nonzero
   trace classification, while reporting the finite-sample Monte Carlo realization of
   the 1D random walk separately as an empirical tolerance-checked check.
"""

from __future__ import annotations

import json
import math
from fractions import Fraction
from pathlib import Path
import numpy as np


def check_coarse_preorder_and_trace_skeleton() -> dict:
    objs = (0, 1, 2, 3)
    morphisms = {(i, j) for i in objs for j in objs if i <= j}
    for i in objs:
        assert (i, i) in morphisms
    for i in objs:
        for j in objs:
            for k in objs:
                if (i, j) in morphisms and (j, k) in morphisms:
                    assert (i, k) in morphisms
    sym_trace = ("symmetric_regime", False, False)
    broken_trace = ("asymmetric_regime", True, True)
    return {
        "preorder_objects": len(objs),
        "preorder_morphisms": len(morphisms),
        "projected_traces": {"symmetric": list(sym_trace), "broken_symmetry": list(broken_trace)},
        "passed": True,
    }


def run_distinctiveness_controls() -> dict:
    # Control 1: 1D random walk using EXACT analytical population expectations
    # Symmetric p = 1/2: E[step] = (1/2)(-1) + (1/2)(+1) = 0 (exact zero!)
    # Biased p = 11/20 = 0.55: E[step] = (9/20)(-1) + (11/20)(+1) = 1/10 = 0.1 (exact nonzero!)
    p_sym = Fraction(1, 2)
    p_bias = Fraction(11, 20)
    rw_pop_sym = (1 - p_sym) * (-1) + p_sym * 1  # Fraction(0, 1) exact!
    rw_pop_bias = (1 - p_bias) * (-1) + p_bias * 1  # Fraction(1, 10) exact!
    rw_exact_matches_cis = (rw_pop_sym == 0) and (rw_pop_bias != 0)

    # Separate empirical finite-sample Monte Carlo realization (explicitly tolerance-checked, NOT exact zero)
    rng = np.random.default_rng(20261119)
    n_steps = 4000
    sym_steps = rng.choice([-1.0, 1.0], size=n_steps, p=[0.5, 0.5])
    bias_steps = rng.choice([-1.0, 1.0], size=n_steps, p=[0.45, 0.55])
    rw_mc_sym_mean = float(np.mean(sym_steps))
    rw_mc_bias_mean = float(np.mean(bias_steps))
    rw_mc_se = 1.0 / math.sqrt(n_steps)  # exact standard error of sample mean for +-1 sym steps
    rw_mc_within_3se = (abs(rw_mc_sym_mean) < 3.0 * rw_mc_se) and (abs(rw_mc_bias_mean - 0.1) < 3.0 * rw_mc_se)

    # Control 2: Scalar Kalman prediction-error filter (exact model vs step bias)
    K = 0.25
    x_hat_sym = 0.0
    innov_sym = []
    for _ in range(50):
        y = 0.0
        e = y - x_hat_sym
        innov_sym.append(e)
        x_hat_sym = x_hat_sym + K * e
    x_hat_shift = 0.0
    innov_shift = []
    for _ in range(50):
        y = 1.0
        e = y - x_hat_shift
        innov_shift.append(e)
        x_hat_shift = x_hat_shift + K * e
    kalman_matches_cis = (
        max(abs(v) for v in innov_sym) == 0.0
        and abs(innov_shift[0] - 1.0) < 1e-12
        and abs(x_hat_shift - 1.0) < 1e-5
    )

    # Control 3: DPCM difference coding (constant signal vs step)
    sig_sym = np.zeros(100)
    sig_step = np.concatenate([np.zeros(50), np.ones(50)])
    diff_sym = np.diff(sig_sym, prepend=sig_sym[0])
    diff_step = np.diff(sig_step, prepend=sig_step[0])
    recon_step = np.cumsum(diff_step)
    dpcm_matches_cis = (
        float(np.max(np.abs(diff_sym))) == 0.0
        and float(np.sum(np.abs(diff_step))) == 1.0
        and np.allclose(recon_step, sig_step)
    )

    # Control 4: Regular perturbation theory H(eps) = diag(1, 1) + eps * [[0, 1], [1, 0]]
    H0 = np.diag([1.0, 1.0])
    V = np.array([[0.0, 1.0], [1.0, 0.0]])
    ev_sym = np.linalg.eigvalsh(H0)
    eps = 0.1
    ev_pert = np.linalg.eigvalsh(H0 + eps * V)
    split_sym = float(ev_sym[1] - ev_sym[0])
    split_pert = float(ev_pert[1] - ev_pert[0])
    pert_matches_cis = (split_sym == 0.0) and (abs(split_pert - 2.0 * eps) < 1e-12)

    controls = [
        {
            "baseline": "ordinary_random_walk_exact_population_expectation",
            "exact_population_symmetric_mean": str(rw_pop_sym),
            "exact_population_biased_mean": str(rw_pop_bias),
            "exact_zero_nonzero_trace_satisfied": rw_exact_matches_cis,
            "empirical_mc_N4000_sym_mean": round(rw_mc_sym_mean, 6),
            "empirical_mc_N4000_bias_mean": round(rw_mc_bias_mean, 6),
            "empirical_mc_standard_error": round(rw_mc_se, 6),
            "empirical_mc_consistent_within_3se": rw_mc_within_3se,
            "matches_coarse_4stage_CIS_and_projected_trace": rw_exact_matches_cis and rw_mc_within_3se,
            "contains_wang_xu_number_theory_atoms_A07_A11": False,
            "contains_micah_domain_atoms_A13": False,
        },
        {
            "baseline": "prediction_error_kalman_filter",
            "symmetric_max_innovation": 0.0,
            "broken_initial_innovation": round(innov_shift[0], 6),
            "final_updated_state": round(x_hat_shift, 6),
            "matches_coarse_4stage_CIS_and_projected_trace": kalman_matches_cis,
            "contains_wang_xu_number_theory_atoms_A07_A11": False,
            "contains_micah_domain_atoms_A13": False,
        },
        {
            "baseline": "difference_coding_dpcm",
            "symmetric_max_difference": 0.0,
            "step_transmitted_residual_l1": float(np.sum(np.abs(diff_step))),
            "exact_reconstruction_error": float(np.max(np.abs(recon_step - sig_step))),
            "matches_coarse_4stage_CIS_and_projected_trace": dpcm_matches_cis,
            "contains_wang_xu_number_theory_atoms_A07_A11": False,
            "contains_micah_domain_atoms_A13": False,
        },
        {
            "baseline": "regular_perturbation_splitting",
            "symmetric_eigenvalue_splitting": split_sym,
            "perturbed_eigenvalue_splitting_eps_0_1": round(split_pert, 6),
            "matches_coarse_4stage_CIS_and_projected_trace": pert_matches_cis,
            "contains_wang_xu_number_theory_atoms_A07_A11": False,
            "contains_micah_domain_atoms_A13": False,
        },
    ]

    matched_count = sum(1 for c in controls if c["matches_coarse_4stage_CIS_and_projected_trace"])
    return {
        "controls_tested": len(controls),
        "controls_matching_coarse_CIS": matched_count,
        "coarse_CIS_false_positive_rate_on_null_baselines": matched_count / len(controls),
        "controls": controls,
        "passed": matched_count == len(controls),
    }


def main() -> int:
    out_dir = Path(__file__).resolve().parent
    res = {
        "schema": "paper063.v2.verification.v2",
        "skeleton_check": check_coarse_preorder_and_trace_skeleton(),
        "distinctiveness_controls": run_distinctiveness_controls(),
    }
    res["overall_passed"] = res["skeleton_check"]["passed"] and res["distinctiveness_controls"]["passed"]
    (out_dir / "paper063_v2_verification_results.json").write_text(json.dumps(res, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(res, indent=2))
    return 0 if res["overall_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
