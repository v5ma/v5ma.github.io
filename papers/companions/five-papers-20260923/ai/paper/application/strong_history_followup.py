"""Post-result same-information controls for the synthetic Draft 4 gate."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import random

import learned_gate_preflight as first


ROOT = Path(__file__).resolve().parent


def interaction_features(row: dict) -> list[float]:
    s = row["signed_current"]
    h = sum(row["history"]) / 4.0
    return [s, h, s * h, s * s, h * h]


def fit_route(development: list[dict], feature_function) -> dict:
    raw = [feature_function(row) for row in development]
    means, scales = first.standardizer(raw)
    inputs = first.transform(raw, means, scales)
    weights, intercept = first.fit_logistic(inputs, [row["label"] for row in development])
    return {"means": means, "scales": scales,
            "weights": weights, "intercept": intercept}


def predict_route(rows: list[dict], model: dict, feature_function) -> list[float]:
    raw = [feature_function(row) for row in rows]
    inputs = first.transform(raw, model["means"], model["scales"])
    return [first.sigmoid(model["intercept"] + sum(
        w * x for w, x in zip(model["weights"], features)
    )) for features in inputs]


def analytic_probability(row: dict) -> float:
    s = row["signed_current"]
    h = sum(row["history"]) / 4.0
    c = 0.5 * s
    margin = 2.0 * h * c - c * c
    return first.sigmoid(margin)


def paired_comparison(labels: list[int], left: list[float], right: list[float]) -> dict:
    left_only = 0
    right_only = 0
    both_wrong = 0
    both_right = 0
    disagree = 0
    for label, a, b in zip(labels, left, right):
        a_hit = int(a >= 0.5) == label
        b_hit = int(b >= 0.5) == label
        disagree += int((a >= 0.5) != (b >= 0.5))
        if a_hit and b_hit:
            both_right += 1
        elif a_hit:
            left_only += 1
        elif b_hit:
            right_only += 1
        else:
            both_wrong += 1
    return {"both_right": both_right, "trajectory_only_right": left_only,
            "history_rival_only_right": right_only, "both_wrong": both_wrong,
            "prediction_disagreements": disagree}


def run() -> None:
    development_rng = random.Random(first.TRAIN_SEED)
    development = [first.episode(development_rng) for _ in range(first.TRAIN_COUNT)]
    trajectory_model = fit_route(development, lambda row: first.features(row, "trajectory"))
    interaction_model = fit_route(development, interaction_features)

    # Evaluation examples and hidden labels are generated only after both fits.
    test_rng = random.Random(first.TEST_SEED)
    held_out = [first.episode(test_rng) for _ in range(first.TEST_COUNT)]
    labels = [row["label"] for row in held_out]
    trajectory_prob = predict_route(
        held_out, trajectory_model, lambda row: first.features(row, "trajectory")
    )
    interaction_prob = predict_route(held_out, interaction_model, interaction_features)
    analytic_prob = [analytic_probability(row) for row in held_out]
    metrics = {
        "trajectory_original_fit": first.scores(labels, trajectory_prob),
        "equal_slot_history_interaction": first.scores(labels, interaction_prob),
        "fixed_history_analytic": first.scores(labels, analytic_prob),
    }
    previous = json.loads((ROOT / "results" / "LEARNED-GATE-PREFLIGHT.json").read_text(encoding="utf-8"))
    original = previous["metrics"]["trajectory"]
    exact_replay = all(abs(metrics["trajectory_original_fit"][name] - original[name]) <= 1e-14
                       for name in original)
    comparisons = {
        "interaction_vs_trajectory": paired_comparison(labels, trajectory_prob, interaction_prob),
        "analytic_vs_trajectory": paired_comparison(labels, trajectory_prob, analytic_prob),
    }
    # Perturb fields unavailable to a deployed gate; neither rival may react.
    no_hidden_field_leak = True
    for row in held_out[:5]:
        altered = dict(row)
        altered["beta"] = 10**6
        altered["label"] = 1 - row["label"]
        altered["benefit"] = -10**6
        altered["candidate"] = -10**6
        no_hidden_field_leak &= (
            interaction_features(row) == interaction_features(altered)
            and analytic_probability(row) == analytic_probability(altered)
            and first.features(row, "trajectory") == first.features(altered, "trajectory")
        )
    checks = {
        "previous_trajectory_metrics_exact_replay": exact_replay,
        "same_held_out_count": len(held_out) == first.TEST_COUNT,
        "equal_fitted_feature_slots": all(len(interaction_features(row)) == 5 and
                                          len(first.features(row, "trajectory")) == 5
                                          for row in held_out),
        "paired_counts_cover_every_case": all(sum(v[key] for key in
                                                   ("both_right", "trajectory_only_right",
                                                    "history_rival_only_right", "both_wrong"))
                                            == first.TEST_COUNT for v in comparisons.values()),
        "rivals_use_only_permitted_history_and_current_scalar": no_hidden_field_leak,
    }
    result = {
        "scope": "Post-result synthetic stronger-history follow-up; not a continual-learning result",
        "protocol_sha256": hashlib.sha256((ROOT / "STRONG-HISTORY-FOLLOWUP-PROTOCOL-20260922.md").read_bytes()).hexdigest(),
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "original_result_sha256": hashlib.sha256((ROOT / "results" / "LEARNED-GATE-PREFLIGHT.json").read_bytes()).hexdigest(),
        "train_seed": first.TRAIN_SEED,
        "test_seed": first.TEST_SEED,
        "train_count": first.TRAIN_COUNT,
        "test_count": first.TEST_COUNT,
        "metrics": metrics,
        "paired": comparisons,
        "checks": checks,
        "passed": sum(checks.values()),
        "total": len(checks),
        "all_pass": all(checks.values()),
    }
    target = ROOT / "results" / "STRONG-HISTORY-FOLLOWUP.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"all_pass": result["all_pass"], "passed": result["passed"],
                      "total": result["total"], "metrics": metrics,
                      "paired": comparisons}, indent=2))
    if not result["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    run()
