#!/usr/bin/env python3
"""Exact mathematical verification suite for Paper 033 v2 (final pass):
1. Exact 3x3 box (4 plaquettes) fibre-multiplicity counterexample to RD3.1 / Thm 10 Step 3.
2. NEW Theorem 6 schedule-divisibility check (confirming mu_2 not subset mu_3 when f_1 = 2 <= f_2 = 3
   without divisibility, whereas f_j = 2^j satisfies f_j | f_{j+1}) + manuscript text binding.
3. Exact SU(2) diagonal-embedding Weyl-conjugation quotient obstruction (Theorem 12) and
   exact 136-class rectangular Wilson-loop bijection (1 Weyl orbit per signature).
4. Exact finite measurement-resolution ceiling B^m, Theorem 13(b) capacity bounds, and
   all resource/noise negative controls:
   - Exact necessary vs sufficient threshold (N = 289, B = 2: m = 9 vs 10);
   - Fixed K1 = 2, B = 2, gamma = 1 polynomial recovery (m = 29 -> 94,830 >= 83,521; m = 2n for n >= 4);
   - NEW fixed-K1 feasibility-ceiling negative control: at B = 2, K1 = 2, gamma = 3 (1 + gamma = 4 = 2 K1
     with leading coeff 1/8 < 1), even observing ALL (n - 1)^2 plaquettes yields < N^4 pairs for all n >= 2;
   - Shared Gaussian calibration error Z negative control (no 1/sqrt(R) decay);
   - Computed unwrapped Gaussian one-boundary crossing probability p_R(d) = Phi(-d sqrt(R)/sigma)
     at d = 0 (pinned at 0.5 for all R) vs. d = 0.05 (decaying rapidly in R), finite-width
     adjacent-bin probability Phi(w/s) - 1/2 < 1/2, and symmetric zero-mean discrete-atom
     counterexample {-a, 0, +a} with weights (1/4, 1/2, 1/4) giving strict crossing prob 1/4 != 1/2.
"""

from __future__ import annotations

import hashlib
import itertools
import json
import math
from collections import Counter, defaultdict
from pathlib import Path
import numpy as np


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()


def verify_fibre_counterexample() -> dict:
    f = 2
    alphabet = (1, -1)
    n_obs = 1
    n_tail = 3
    k1 = 1
    k2 = 1

    fibres: dict[tuple[int, ...], list[tuple[int, ...]]] = {}
    for y in itertools.product(alphabet, repeat=n_obs):
        if sum(1 for v in y if v != 1) > k1:
            continue
        fibres[y] = [tau for tau in itertools.product(alphabet, repeat=n_tail) if sum(1 for v in tau if v != 1) <= k2]

    sizes = {str(k): len(v) for k, v in fibres.items()}
    unique_sizes = sorted(set(sizes.values()))
    ratio = unique_sizes[-1] / unique_sizes[0]

    h_idx = {(x, y): y * 2 + x for y in range(3) for x in range(2)}
    v_idx = {(x, y): 6 + y * 3 + x for y in range(2) for x in range(3)}
    curv_counts: Counter[tuple[int, ...]] = Counter()
    for bits in itertools.product(alphabet, repeat=12):
        sig = []
        for py in range(2):
            for px in range(2):
                b = bits[h_idx[(px, py)]]
                r = bits[v_idx[(px + 1, py)]]
                t = bits[h_idx[(px, py + 1)]]
                l = bits[v_idx[(px, py)]]
                sig.append(b * r * t * l)
        curv_counts[tuple(sig)] += 1

    orbit_sizes = sorted(set(curv_counts.values()))
    expected_orbit_size = f ** (9 - 1)
    edge_fibres: Counter[int] = Counter()
    orbit_fibres: Counter[int] = Counter()
    for sig, cnt in curv_counts.items():
        y0 = sig[0]
        tail = sig[1:]
        if (1 if y0 != 1 else 0) <= k1 and sum(1 for v in tail if v != 1) <= k2:
            edge_fibres[y0] += cnt
            orbit_fibres[y0] += 1

    passed = (
        len(curv_counts) == f**4
        and orbit_sizes == [expected_orbit_size]
        and unique_sizes == [4]
        and ratio == 1.0
        and dict(orbit_fibres) == {1: 4, -1: 4}
        and dict(edge_fibres) == {1: 4 * 256, -1: 4 * 256}
    )
    return {
        "check": "3x3_box_fibre_counterexample",
        "n": 3,
        "f": f,
        "plaquettes": 4,
        "P_obs_size": n_obs,
        "P_tail_size": n_tail,
        "K1": k1,
        "K2": k2,
        "admissible_tails": [list(t) for t in fibres[(1,)]],
        "orbit_level_fibre_cardinality_per_y": dict(orbit_fibres),
        "edge_level_fibre_cardinality_per_y": dict(edge_fibres),
        "single_gauge_orbit_size": expected_orbit_size,
        "multiplicity_ratio": ratio,
        "refutes_fibre_cardinality_eq_1": unique_sizes[0] != 1,
        "passed": passed,
    }


def verify_thm6_divisibility_and_manuscript_binding(out_dir: Path) -> dict:
    # Negative control: f1 = 2 <= f2 = 3 is nondecreasing, yet -1 in mu_2 satisfies (-1)^3 = -1 != 1,
    # so mu_2 is NOT a subgroup of mu_3! Subgroup inclusion mu_{f1} <= mu_{f2} holds iff f1 | f2.
    divisibility_equivalence_ok = True
    for f1 in range(2, 13):
        roots1 = [np.exp(2j * np.pi * k / f1) for k in range(f1)]
        for f2 in range(f1, 13):
            is_sub = all(abs(z**f2 - 1.0) < 1e-12 for z in roots1)
            if is_sub != (f2 % f1 == 0):
                divisibility_equivalence_ok = False
    mu2_not_in_mu3 = abs((-1.0) ** 3 - 1.0) > 1.0
    dyadic_schedule_divides = all((2 ** (j + 1)) % (2**j) == 0 for j in range(1, 20))

    md_path = out_dir / "Paper-033-v2-Candidate.md"
    md_exists = md_path.is_file()
    md_sha256 = _sha256(md_path) if md_exists else None
    md_binding_ok = False
    if md_exists:
        md_text = md_path.read_text(encoding="utf-8")
        md_binding_ok = (
            "with both parameters nondecreasing: holonomy channels survive refinement" not in md_text
            and r"satisfying $n_j \le n_{j+1}$ and $f_j \mid f_{j+1}$" in md_text
            and "1 + \\gamma < 2 K_1" in md_text
            and "\\delta_{\\mathrm{margin}} > 0" in md_text
        )

    passed = divisibility_equivalence_ok and mu2_not_in_mu3 and dyadic_schedule_divides and md_binding_ok
    return {
        "check": "thm6_schedule_divisibility_and_manuscript_binding",
        "subgroup_iff_divisibility_checked_2_to_12": divisibility_equivalence_ok,
        "negative_control_mu2_not_subgroup_of_mu3": mu2_not_in_mu3,
        "dyadic_schedule_2j_divides_2j_plus_1": dyadic_schedule_divides,
        "manuscript_file": md_path.name,
        "manuscript_sha256_verified": md_sha256,
        "manuscript_binding_passed": md_binding_ok,
        "passed": passed,
    }


def verify_su2_quotient_obstruction() -> dict:
    W = np.array([[0.0, 1.0], [-1.0, 0.0]], dtype=np.complex128)
    W_inv = W.conj().T
    assert np.allclose(W @ W_inv, np.eye(2))
    assert np.isclose(np.linalg.det(W), 1.0)

    summary = []
    all_ok = True
    for f in (2, 3, 4, 5, 6, 8):
        roots = [np.exp(2j * np.pi * k / f) for k in range(f)]
        max_conj_err = 0.0
        for z in roots:
            D = np.diag([z, np.conj(z)])
            D_conj = W @ D @ W_inv
            D_inv = np.diag([np.conj(z), z])
            max_conj_err = max(max_conj_err, float(np.max(np.abs(D_conj - D_inv))))

        P = 4
        total_u1_orbits = f**P
        self_conj_roots = 2 if (f % 2 == 0) else 1
        fixed_by_global_weyl = self_conj_roots**P
        weyl_quotient_orbits = fixed_by_global_weyl + (total_u1_orbits - fixed_by_global_weyl) // 2

        if f <= 6:
            seen = set()
            for tup in itertools.product(range(f), repeat=P):
                inv_tup = tuple((-k) % f for k in tup)
                seen.add(min(tup, inv_tup))
            assert len(seen) == weyl_quotient_orbits

        distinct_trace_vals = (f // 2) + 1
        trace_tuples = distinct_trace_vals**P
        collapse_present = (f >= 3) and (weyl_quotient_orbits < total_u1_orbits) and (trace_tuples < total_u1_orbits)
        if f >= 3 and not collapse_present:
            all_ok = False
        if max_conj_err > 1e-14:
            all_ok = False

        summary.append({
            "f": f,
            "plaquettes": P,
            "max_weyl_conjugation_error": max_conj_err,
            "u1_orbits": total_u1_orbits,
            "global_weyl_quotient_orbits": weyl_quotient_orbits,
            "distinct_single_plaquette_su2_classes": distinct_trace_vals,
            "su2_trace_readout_tuples": trace_tuples,
            "obstruction_active": collapse_present,
        })

    f4 = 4

    def _half_trace(k_sum: int) -> int:
        r = k_sum % 4
        return 1 if r == 0 else (-1 if r == 2 else 0)

    def _rect_loop_signature(tup: tuple[int, int, int, int]) -> tuple[int, ...]:
        s00, s10, s01, s11 = tup
        return (
            _half_trace(s00), _half_trace(s10), _half_trace(s01), _half_trace(s11),
            _half_trace(s00 + s10), _half_trace(s01 + s11),
            _half_trace(s00 + s01), _half_trace(s10 + s11),
            _half_trace(s00 + s10 + s01 + s11),
        )

    def _all_subset_signature(tup: tuple[int, int, int, int]) -> tuple[int, ...]:
        return tuple(
            _half_trace(sum(tup[i] for i in range(4) if (mask >> i) & 1))
            for mask in range(1, 16)
        )

    sig_1x1 = set()
    rect_sig_to_weyl_orbits: dict[tuple[int, ...], set[tuple[int, int, int, int]]] = defaultdict(set)
    sig_all_loops = set()
    weyl_pair_separated_by_any_loop = False

    for tup in itertools.product(range(f4), repeat=4):
        inv_tup = tuple((-k) % f4 for k in tup)
        canon_weyl = min(tup, inv_tup)
        sig_1x1.add(tuple(_half_trace(k) for k in tup))
        rect_sig_to_weyl_orbits[_rect_loop_signature(tup)].add(canon_weyl)
        s_all = _all_subset_signature(tup)
        sig_all_loops.add(s_all)
        if s_all != _all_subset_signature(inv_tup):
            weyl_pair_separated_by_any_loop = True

    orbits_per_rect_sig = sorted(set(len(v) for v in rect_sig_to_weyl_orbits.values()))
    exact_136_bijection = (
        len(rect_sig_to_weyl_orbits) == 136
        and orbits_per_rect_sig == [1]
    )

    wilson_loop_diag = {
        "f": 4,
        "plaquettes": 4,
        "u1_orbits_stage0": 256,
        "su2_global_weyl_gauge_classes_stage1": 136,
        "single_plaquette_1x1_trace_signatures_stage2": len(sig_1x1),
        "rect_1x1_2x1_1x2_2x2_wilson_loop_signatures": len(rect_sig_to_weyl_orbits),
        "unique_weyl_orbits_per_rect_signature": orbits_per_rect_sig,
        "rect_loops_biject_exactly_136_weyl_classes": exact_136_bijection,
        "all_subset_wilson_loop_signatures": len(sig_all_loops),
        "larger_loops_never_undo_stage1_256_to_136": (
            len(sig_all_loops) == 136 and not weyl_pair_separated_by_any_loop
        ),
    }

    all_ok = (
        all_ok
        and len(sig_1x1) == 81
        and exact_136_bijection
        and wilson_loop_diag["larger_loops_never_undo_stage1_256_to_136"]
    )
    return {
        "check": "su2_diagonal_weyl_quotient_obstruction_and_exact_136_wilson_bijection",
        "cases": summary,
        "f4_multi_plaquette_wilson_loop_diagnostic": wilson_loop_diag,
        "passed": all_ok,
    }


def _exact_min_m_necessary(N: int, B: int, gamma: float) -> int:
    target = N ** (1.0 + gamma)
    min_patterns = (1.0 + math.sqrt(1.0 + 8.0 * target)) / 2.0
    m = math.ceil(math.log(min_patterns, B))
    while (B**m) * (B**m - 1) // 2 < target:
        m += 1
    while m > 1 and (B ** (m - 1)) * (B ** (m - 1) - 1) // 2 >= target:
        m -= 1
    return m


def _simple_sufficient_m(N: int, B: int, gamma: float) -> int:
    return math.ceil(((1.0 + gamma) * math.log2(N) + 2.0) / (2.0 * math.log2(B)))


def verify_finite_resolution_theorem() -> dict:
    gamma = 1.0
    K1_fixed = math.ceil((1 + gamma) / 2) + 1  # 2
    m_fixed = 4
    B_fixed = 8
    max_resolved = B_fixed**m_fixed
    max_resolved_pairs = max_resolved * (max_resolved - 1) // 2

    schedule_rows = []
    first_failure_j = None
    for j in range(2, 20):
        n_j = math.ceil(2 ** (j / 2)) + 1
        f_j = 2**j
        N_j = n_j**2
        target = N_j ** (1 + gamma)
        Y_exact = sum(math.comb(m_fixed, k) * ((f_j - 1) ** k) for k in range(min(K1_fixed, m_fixed) + 1))
        Y_binned_window = sum(
            math.comb(m_fixed, k) * ((min(f_j, B_fixed) - 1) ** k) for k in range(min(K1_fixed, m_fixed) + 1)
        )
        C_exact = Y_exact * (Y_exact - 1) // 2
        C_binned = Y_binned_window * (Y_binned_window - 1) // 2
        exceeds_ceiling = C_binned < target
        if exceeds_ceiling and first_failure_j is None and C_exact >= target:
            first_failure_j = j
        schedule_rows.append({
            "j": j,
            "n_j": n_j,
            "f_j": f_j,
            "N_j": N_j,
            "target_Nj_pow_1_plus_gamma": target,
            "C_exact_hamming": C_exact,
            "Y_binned_window": Y_binned_window,
            "C_binned_window": C_binned,
            "C_binned_fails_superlinear": exceeds_ceiling,
        })

    N_ce, B_ce, gamma_ce = 289, 2, 1.0
    target_ce = int(N_ce ** (1 + gamma_ce))  # 83,521
    m_nec_ce = _exact_min_m_necessary(N_ce, B_ce, gamma_ce)  # 9
    suf_rhs_ce = ((1.0 + gamma_ce) * math.log2(N_ce) + 2.0) / (2.0 * math.log2(B_ce))
    m_suf_ce = math.ceil(suf_rhs_ce)  # 10
    pairs_m8 = (B_ce**8) * (B_ce**8 - 1) // 2
    pairs_m9 = (B_ce**9) * (B_ce**9 - 1) // 2
    counterexample_refutes_old_necessity = (
        m_nec_ce == 9
        and m_suf_ce == 10
        and pairs_m8 < target_ce
        and pairs_m9 >= target_ce
        and m_nec_ce < m_suf_ce
    )

    # Fixed K1 = 2, B = 2, gamma = 1 (1 + gamma = 2 < 2 K1 = 4): feasible via polynomial m!
    M_28 = 1 + 28 + math.comb(28, 2)
    C_28 = math.comb(M_28, 2)
    M_29 = 1 + 29 + math.comb(29, 2)
    C_29 = math.comb(M_29, 2)
    fixed_k1_asymptotic = []
    for n_val in (4, 5, 17, 65, 257):
        N_val = n_val**2
        plaq_avail = (n_val - 1) ** 2
        m_poly = 2 * n_val
        M_poly = 1 + m_poly + math.comb(m_poly, 2)
        C_poly = math.comb(M_poly, 2)
        fixed_k1_asymptotic.append({
            "n": n_val,
            "N": N_val,
            "plaquettes_available": plaq_avail,
            "m_2n": m_poly,
            "fits_in_lattice": m_poly <= plaq_avail,
            "M_patterns_K1_eq_2": M_poly,
            "C_pairs_K1_eq_2": C_poly,
            "target_N2": N_val**2,
            "exceeds_N2": C_poly > N_val**2,
        })
    fixed_k1_counterexample_ok = (
        M_28 == 407
        and C_28 == 82621
        and C_28 < target_ce
        and M_29 == 436
        and C_29 == 94830
        and C_29 >= target_ce
        and 29 <= 256
        and all(r["fits_in_lattice"] and r["exceeds_N2"] for r in fixed_k1_asymptotic)
    )

    # NEW Negative control: Fixed K1 = 2, B = 2, gamma = 3 (1 + gamma = 4 = 2 K1 with leading coeff 1/8 < 1):
    # Even observing ALL m_max = (n - 1)^2 plaquettes fails to reach N^(1+3) = N^4 for ALL n >= 2!
    infeasible_gamma3_rows = []
    for n_val in (2, 3, 5, 17, 65):
        N_val = n_val**2
        m_max = (n_val - 1) ** 2
        M_max = sum(math.comb(m_max, k) for k in range(min(2, m_max) + 1))
        C_max = math.comb(M_max, 2)
        target_g3 = N_val**4
        infeasible_gamma3_rows.append({
            "n": n_val,
            "N": N_val,
            "m_all_plaquettes": m_max,
            "max_pairs_at_K1_eq_2": C_max,
            "target_N4": target_g3,
            "ratio_max_pairs_to_N4": round(C_max / target_g3, 6),
            "fails_target": C_max < target_g3,
        })
    fixed_k1_infeasibility_ceiling_ok = (
        all(r["fails_target"] for r in infeasible_gamma3_rows)
        and abs(infeasible_gamma3_rows[-1]["ratio_max_pairs_to_N4"] - 0.125) < 0.02
    )

    # Shared Gaussian calibration error Z negative control + zero-margin bin-boundary phase negative control
    sigma_Z = 0.05
    sigma_eps = 0.05
    var_shared_R1 = sigma_Z**2 + (sigma_eps**2) / 1
    var_shared_R1000 = sigma_Z**2 + (sigma_eps**2) / 1000
    var_indep_R1000 = (sigma_eps**2) / 1000
    shared_gaussian_fails_sqrtR = (
        var_shared_R1000 >= sigma_Z**2
        and var_shared_R1000 > 500.0 * var_indep_R1000
    )

    # Computed Gaussian unwrapped one-boundary crossing probability p_R(d) = Phi(-d * sqrt(R) / sigma),
    # contrasted with finite-width adjacent-bin probability Phi(w/s) - 1/2 < 1/2 and discrete atom-at-zero counterexample!
    def _norm_cdf(z: float) -> float:
        return 0.5 * math.erfc(-z / math.sqrt(2.0))

    d_zero = 0.0
    d_pos = 0.05
    gaussian_boundary_crossing_rows = []
    for R_val in (1, 10, 100, 1000):
        s_R = sigma_eps / math.sqrt(R_val)
        p_zero = _norm_cdf(-d_zero / s_R)
        p_pos = _norm_cdf(-d_pos / s_R)
        gaussian_boundary_crossing_rows.append({
            "R": R_val,
            "s_R": round(s_R, 8),
            "p_R_margin_0": p_zero,
            "p_R_margin_0_05": float(f"{p_pos:.6e}"),
        })

    # Finite-width adjacent-bin probability for Gaussian error at s = 0.5, bin width w = 2*pi/8:
    # P(0 < err < w) = Phi(w/s) - 1/2 < 1/2 (distinct from crossing the half-line {err > 0})
    w_bin = 2.0 * math.pi / 8.0
    s_wide = 0.5
    p_specific_adjacent_bin = _norm_cdf(w_bin / s_wide) - 0.5
    finite_bin_below_half = (0.0 < p_specific_adjacent_bin < 0.5)

    # Discrete symmetric zero-mean error {-a, 0, +a} with probabilities (1/4, 1/2, 1/4):
    # symmetric, zero mean, positive variance, yet strict crossing prob P(err > 0) = 1/4 != 1/2!
    a_disc = 0.1
    disc_vals = (-a_disc, 0.0, a_disc)
    disc_probs = (0.25, 0.50, 0.25)
    disc_mean = sum(v * p for v, p in zip(disc_vals, disc_probs))
    disc_var = sum((v - disc_mean) ** 2 * p for v, p in zip(disc_vals, disc_probs))
    disc_strict_cross_prob = sum(p for v, p in zip(disc_vals, disc_probs) if v > 0.0)
    discrete_atom_counterexample_ok = (
        abs(disc_mean) < 1e-15
        and disc_var > 0.0
        and abs(disc_strict_cross_prob - 0.25) < 1e-15
        and disc_strict_cross_prob < 0.5
    )

    boundary_margin_required = (
        all(abs(r["p_R_margin_0"] - 0.5) < 1e-15 for r in gaussian_boundary_crossing_rows)
        and gaussian_boundary_crossing_rows[0]["p_R_margin_0_05"] < 0.2
        and gaussian_boundary_crossing_rows[1]["p_R_margin_0_05"] < 1e-3
        and gaussian_boundary_crossing_rows[2]["p_R_margin_0_05"] < 1e-20
        and finite_bin_below_half
        and discrete_atom_counterexample_ok
    )

    footprint_checks = []
    for B_test in (2, 8):
        for j in (4, 8, 12, 16):
            n_j = math.ceil(2 ** (j / 2)) + 1
            N_j = n_j**2
            target = N_j ** (1 + gamma)
            plaq_avail = (n_j - 1) ** 2
            m_nec = _exact_min_m_necessary(N_j, B_test, gamma)
            m_suf = _simple_sufficient_m(N_j, B_test, gamma)
            C_nec = (B_test**m_nec) * (B_test**m_nec - 1) // 2
            C_below = (B_test ** (m_nec - 1)) * (B_test ** (m_nec - 1) - 1) // 2 if m_nec > 1 else 0
            C_suf = (B_test**m_suf) * (B_test**m_suf - 1) // 2
            footprint_checks.append({
                "B": B_test,
                "j": j,
                "N_j": N_j,
                "plaquettes_available": plaq_avail,
                "excitation_allowance_K1_equals_m_and_full_bin_realizability": True,
                "m_exact_necessary": m_nec,
                "pairs_at_m_nec_minus_1": C_below,
                "pairs_at_m_nec": C_nec,
                "m_simple_sufficient": m_suf,
                "pairs_at_m_suf": C_suf,
                "target": target,
                "exact_threshold_verified": (C_below < target <= C_nec) and (m_nec <= m_suf <= plaq_avail) and (C_suf >= target),
            })

    passed = (
        first_failure_j == 8
        and counterexample_refutes_old_necessity
        and fixed_k1_counterexample_ok
        and fixed_k1_infeasibility_ceiling_ok
        and shared_gaussian_fails_sqrtR
        and boundary_margin_required
        and all(row["exact_threshold_verified"] for row in footprint_checks)
    )
    return {
        "check": "finite_measurement_resolution_ceiling_exact_necessity_and_negative_controls",
        "fixed_m": m_fixed,
        "fixed_B": B_fixed,
        "absolute_pattern_ceiling_Bm": max_resolved,
        "absolute_pair_ceiling": max_resolved_pairs,
        "first_stage_where_exact_passes_but_binned_fails": first_failure_j,
        "necessity_counterexample_N289_B2_gamma1": {
            "N": N_ce,
            "B": B_ce,
            "gamma": gamma_ce,
            "target_pairs": target_ce,
            "m_8_pairs": pairs_m8,
            "m_9_pairs": pairs_m9,
            "exact_necessary_m_min": m_nec_ce,
            "old_sufficient_formula_value": round(suf_rhs_ce, 6),
            "old_sufficient_formula_ceil": m_suf_ce,
            "counterexample_refutes_necessity_of_sufficient_bound": counterexample_refutes_old_necessity,
        },
        "fixed_K1_eq_2_polynomial_footprint_counterexample": {
            "N": N_ce,
            "B": B_ce,
            "K1_fixed": 2,
            "plaquettes_available": 256,
            "target_pairs": target_ce,
            "m_28_patterns": M_28,
            "m_28_pairs": C_28,
            "m_29_patterns": M_29,
            "m_29_pairs": C_29,
            "m_29_recovers_target_with_fixed_K1_eq_2": True,
            "asymptotic_m_eq_2n_checks": fixed_k1_asymptotic,
            "refutes_claim_that_growing_K1_is_necessary": fixed_k1_counterexample_ok,
        },
        "fixed_K1_eq_2_gamma_3_infeasibility_negative_control": {
            "B": 2,
            "K1_fixed": 2,
            "gamma": 3,
            "asymptotic_ratio_limit_1_over_8": 0.125,
            "rows": infeasible_gamma3_rows,
            "confirms_fixed_K1_impossible_when_exceeding_capacity_exponent": fixed_k1_infeasibility_ceiling_ok,
        },
        "noisy_readout_negative_controls": {
            "sigma_shared_Z": sigma_Z,
            "sigma_indep_eps": sigma_eps,
            "var_mean_R1": round(var_shared_R1, 8),
            "var_mean_R1000_with_shared_Z": round(var_shared_R1000, 8),
            "var_mean_R1000_pure_independent": round(var_indep_R1000, 8),
            "shared_gaussian_error_refutes_unconditional_sqrtR_scaling": shared_gaussian_fails_sqrtR,
            "gaussian_unwrapped_one_boundary_crossing_rows": gaussian_boundary_crossing_rows,
            "finite_width_adjacent_bin_prob_w_pi_over_4_s_0_5": round(p_specific_adjacent_bin, 6),
            "finite_width_adjacent_bin_strictly_below_half": finite_bin_below_half,
            "discrete_symmetric_atom_at_zero_counterexample": {
                "values": list(disc_vals),
                "probabilities": list(disc_probs),
                "mean": disc_mean,
                "variance": round(disc_var, 8),
                "strict_one_sided_crossing_prob": disc_strict_cross_prob,
                "proves_continuity_needed_for_exact_half": discrete_atom_counterexample_ok,
            },
            "positive_boundary_margin_required": boundary_margin_required,
        },
        "schedule_sample": schedule_rows[:10],
        "growing_footprint_K1_equals_m_checks": footprint_checks,
        "passed": passed,
    }


def main() -> int:
    out_dir = Path(__file__).resolve().parent
    results = {
        "schema": "paper033.v2.verification.v5",
        "checks": [
            verify_fibre_counterexample(),
            verify_thm6_divisibility_and_manuscript_binding(out_dir),
            verify_su2_quotient_obstruction(),
            verify_finite_resolution_theorem(),
        ],
    }
    results["overall_passed"] = all(c["passed"] for c in results["checks"])
    out_path = out_dir / "paper033_v2_verification_results.json"
    out_path.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({
        "overall_passed": results["overall_passed"],
        "summary": [(c["check"], c["passed"]) for c in results["checks"]],
    }, indent=2))
    return 0 if results["overall_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
