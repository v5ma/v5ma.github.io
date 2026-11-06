"""Synthetic demonstrations, not a test of Micah's theology or historical data.

Run with Python 3.10+ and the standard library only.
The random seed, data-generating processes, and all rules are fixed here.
"""

from math import comb
import json
from pathlib import Path
from random import Random
from statistics import mean

SEED = 20261105


def main():
    # A fixed probabilistic model can be useful despite substantial irreducible error.
    rng = Random(SEED)
    n = 2000
    labels = [rng.randrange(2) for _ in range(n)]
    forecasts = [0.75 if label else 0.25 for label in labels]
    outcomes = [int(rng.random() < p) for p in forecasts]
    model_brier = mean((p - y) ** 2 for p, y in zip(forecasts, outcomes))
    baseline_brier = mean((0.5 - y) ** 2 for y in outcomes)
    accuracy = mean(int(p >= 0.5) == y for p, y in zip(forecasts, outcomes))

    # Under an intentionally simple null: 16 independent, fair binary features.
    # The event is >=12 matches, NOT exactly 12.
    single_tail = sum(comb(16, k) for k in range(12, 17)) / (2 ** 16)
    scan_results = {
        str(m): 1 - (1 - single_tail) ** m for m in [1, 10, 100]
    }
    rng = Random(SEED + 1)
    trials = 20000
    scanned_hits = 0
    fixed_hits = 0
    holdout_hits = 0
    for _ in range(trials):
        matches = [rng.getrandbits(16).bit_count() for _ in range(100)]
        fixed_hits += matches[0] >= 12
        scanned_hits += max(matches) >= 12
        # Selection on training matches cannot help on independent null test data.
        holdout_hits += rng.getrandbits(16).bit_count() >= 12

    # Two causally related consequences do not provide independent confirmations.
    # Within a hypothetical war cohort, F=food crisis and D=noncombat mortality.
    p_f = 0.6
    p_d_given_f = 0.7
    p_d_given_not_f = 0.1
    p_d = p_f * p_d_given_f + (1 - p_f) * p_d_given_not_f

    result = {
        "status": "synthetic_demonstrations_only_not_historical_validation",
        "seed": SEED,
        "probabilistic_skill": {
            "n": n,
            "true_conditional_probabilities": [0.25, 0.75],
            "observed_classification_accuracy": accuracy,
            "observed_model_brier": model_brier,
            "observed_base_rate_brier": baseline_brier,
            "observed_brier_skill": 1 - model_brier / baseline_brier,
            "theoretical_model_brier": 0.1875,
            "theoretical_base_rate_brier": 0.25,
            "theoretical_brier_skill": 0.25,
        },
        "selection_demo": {
            "features": 16,
            "criterion": "at_least_12_matches",
            "assumption": "independent_fair_binary_features_and_independent_candidates",
            "single_candidate_exact_probability": single_tail,
            "at_least_one_hit_exact_probability_by_candidates": scan_results,
            "monte_carlo_trials": trials,
            "monte_carlo_fixed_candidate_hit_rate": fixed_hits / trials,
            "monte_carlo_best_of_100_hit_rate": scanned_hits / trials,
            "monte_carlo_independent_holdout_hit_rate": holdout_hits / trials,
        },
        "dependent_consequences_demo": {
            "p_food_crisis_given_war": p_f,
            "p_mortality_given_food_crisis_and_war": p_d_given_f,
            "p_mortality_given_no_food_crisis_and_war": p_d_given_not_f,
            "p_mortality_given_war": p_d,
            "correct_joint_probability": p_f * p_d_given_f,
            "incorrect_independence_product": p_f * p_d,
        },
    }
    assert abs(single_tail - 2517 / 65536) < 1e-12
    assert result["selection_demo"]["at_least_one_hit_exact_probability_by_candidates"]["100"] > 0.98
    assert abs(result["dependent_consequences_demo"]["correct_joint_probability"] - 0.42) < 1e-12
    target = Path(__file__).with_name("pattern_validation_demo_results.json")
    target.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
