"""Predeclared synthetic learned-gate test; not a continual-learning benchmark."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import random


ROOT = Path(__file__).resolve().parent
TRAIN_SEED = 41329
TEST_SEED = 90731
TRAIN_COUNT = 2400
TEST_COUNT = 800
NOISE_SD = 1.25
EPOCHS = 200
LEARNING_RATE = 0.1
L2 = 0.01


def sigmoid(value: float) -> float:
    if value >= 0:
        decay = math.exp(-value)
        return 1.0 / (1.0 + decay)
    rise = math.exp(value)
    return rise / (1.0 + rise)


def episode(rng: random.Random) -> dict:
    beta = rng.choice((-2, -1, 0, 1, 2))
    history = [beta + rng.gauss(0, NOISE_SD) for _ in range(4)]
    x = rng.choice((-1, 1))
    current_y = beta * x + rng.gauss(0, NOISE_SD)
    signed_current = current_y * x
    candidate = 0.5 * signed_current
    benefit = beta * beta - (beta - candidate) ** 2
    return {
        "beta": beta,
        "history": history,
        "signed_current": signed_current,
        "candidate": candidate,
        "benefit": benefit,
        "label": int(benefit > 0.0),
    }


def features(row: dict, route: str) -> list[float]:
    current = row["signed_current"]
    if route == "scalar":
        return [current, 0.0, 0.0, 0.0, 0.0]
    if route == "full_history":
        return [current, *row["history"]]
    if route == "trajectory":
        rate = 0.2 + 0.5 * sigmoid(sum(row["history"]) / 4.0)
        residual = current
        output = [current]
        for _ in range(4):
            residual *= 1.0 - rate
            output.append(residual)
        return output
    raise ValueError(f"Unknown route: {route}")


def reconstruct_from_history(row: dict) -> list[float]:
    """Independent closed-form trace from the permitted scalar and history."""
    current = row["signed_current"]
    rate = 0.2 + 0.5 * sigmoid(sum(row["history"]) / 4.0)
    return [current * (1.0 - rate) ** k for k in range(5)]


def standardizer(rows: list[list[float]]) -> tuple[list[float], list[float]]:
    means = [sum(row[j] for row in rows) / len(rows) for j in range(5)]
    scales = []
    for j in range(5):
        variance = sum((row[j] - means[j]) ** 2 for row in rows) / len(rows)
        scales.append(math.sqrt(variance) if variance > 1e-12 else 1.0)
    return means, scales


def transform(rows: list[list[float]], means: list[float], scales: list[float]) -> list[list[float]]:
    return [[(row[j] - means[j]) / scales[j] for j in range(5)] for row in rows]


def fit_logistic(inputs: list[list[float]], labels: list[int]) -> tuple[list[float], float]:
    weights = [0.0] * 5
    intercept = 0.0
    count = len(inputs)
    for _ in range(EPOCHS):
        gradient = [0.0] * 5
        intercept_gradient = 0.0
        for row, label in zip(inputs, labels):
            estimate = sigmoid(intercept + sum(w * x for w, x in zip(weights, row)))
            error = estimate - label
            intercept_gradient += error
            for j in range(5):
                gradient[j] += error * row[j]
        for j in range(5):
            weights[j] -= LEARNING_RATE * (gradient[j] / count + L2 * weights[j])
        intercept -= LEARNING_RATE * intercept_gradient / count
    return weights, intercept


def scores(labels: list[int], estimates: list[float]) -> dict:
    count = len(labels)
    positives = sum(labels)
    classifications = [int(p >= 0.5) for p in estimates]
    return {
        "accuracy": sum(a == b for a, b in zip(classifications, labels)) / count,
        "brier": sum((p - y) ** 2 for p, y in zip(estimates, labels)) / count,
        "cross_entropy": -sum(
            y * math.log(max(1e-12, min(1 - 1e-12, p)))
            + (1 - y) * math.log(max(1e-12, min(1 - 1e-12, 1 - p)))
            for p, y in zip(estimates, labels)
        ) / count,
        "proposal_fraction": sum(classifications) / count,
        "positive_rate": positives / count,
    }


def write_figure(evaluations: dict) -> None:
    """Render the computed metrics, not a conceptual or illustrative curve."""
    routes = (
        ("Scalar", "scalar", "#555555"),
        ("Raw history", "full_history", "#376a91"),
        ("Trajectory", "trajectory", "#3a7d57"),
        ("History replay", "full_history_reconstructed_trajectory", "#7a622e"),
        ("Prevalence", "development_prevalence", "#9272a0"),
    )
    panels = (("Accuracy (higher is better)", "accuracy", 0, 1),
              ("Brier score (lower is better)", "brier", 400, 0.35))
    marks = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="850" height="500" viewBox="0 0 850 500" role="img" aria-label="Held-out synthetic gate accuracy and Brier score">',
        '<rect width="850" height="500" fill="white"/>',
        '<text x="32" y="38" font-family="Arial" font-size="22" font-weight="bold">Synthetic learned-gate preflight</text>',
        '<text x="32" y="62" font-family="Arial" font-size="14">2,400 development episodes; 800 held-out episodes; no durable updates</text>',
    ]
    for title, metric, offset, maximum in panels:
        marks.append(f'<text x="{32 + offset}" y="103" font-family="Arial" font-size="16" font-weight="bold">{title}</text>')
        for index, (label, key, color) in enumerate(routes):
            y = 124 + index * 62
            value = evaluations[key][metric]
            width = 220 * value / maximum
            marks.append(f'<text x="{32 + offset}" y="{y + 17}" font-family="Arial" font-size="13">{label}</text>')
            marks.append(f'<rect x="{142 + offset}" y="{y}" width="220" height="24" fill="#eeeeee"/>')
            marks.append(f'<rect x="{142 + offset}" y="{y}" width="{width:.3f}" height="24" fill="{color}"/>')
            marks.append(f'<text x="{148 + offset}" y="{y + 17}" font-family="Arial" font-size="13" fill="black">{value:.4f}</text>')
    marks.append('<text x="32" y="475" font-family="Arial" font-size="12">Trajectory and history-replay are exact ties; this is not a continual-learning result.</text>')
    marks.append('</svg>')
    (ROOT / "results" / "LEARNED-GATE-PREFLIGHT.svg").write_text(
        "\n".join(marks) + "\n", encoding="utf-8"
    )


def run() -> None:
    assert TRAIN_SEED != TEST_SEED
    development_rng = random.Random(TRAIN_SEED)
    development = [episode(development_rng) for _ in range(TRAIN_COUNT)]
    development_labels = [row["label"] for row in development]
    trained = {}
    for route in ("scalar", "full_history", "trajectory"):
        raw = [features(row, route) for row in development]
        assert all(len(row) == 5 for row in raw)
        means, scales = standardizer(raw)
        weights, intercept = fit_logistic(transform(raw, means, scales), development_labels)
        trained[route] = {
            "means": means,
            "scales": scales,
            "weights": weights,
            "intercept": intercept,
        }

    # The held-out episodes and their labels do not exist until every gate is fit.
    test_rng = random.Random(TEST_SEED)
    held_out = [episode(test_rng) for _ in range(TEST_COUNT)]
    held_out_labels = [row["label"] for row in held_out]
    evaluations = {}
    for route, model in trained.items():
        raw = [features(row, route) for row in held_out]
        normalized = transform(raw, model["means"], model["scales"])
        probabilities = [
            sigmoid(model["intercept"] + sum(w * x for w, x in zip(model["weights"], row)))
            for row in normalized
        ]
        evaluations[route] = scores(held_out_labels, probabilities)

    trajectory_model = trained["trajectory"]
    reconstructed_inputs = transform(
        [reconstruct_from_history(row) for row in held_out],
        trajectory_model["means"], trajectory_model["scales"]
    )
    reconstructed_probabilities = [
        sigmoid(trajectory_model["intercept"] + sum(
            w * x for w, x in zip(trajectory_model["weights"], row)
        )) for row in reconstructed_inputs
    ]
    evaluations["full_history_reconstructed_trajectory"] = scores(
        held_out_labels, reconstructed_probabilities
    )

    majority = int(sum(development_labels) * 2 >= TRAIN_COUNT)
    evaluations["development_majority"] = scores(
        held_out_labels, [float(majority)] * TEST_COUNT
    )
    development_prevalence = sum(development_labels) / TRAIN_COUNT
    evaluations["development_prevalence"] = scores(
        held_out_labels, [development_prevalence] * TEST_COUNT
    )
    reconstruction_matches = all(
        all(abs(a - b) <= 1e-12 for a, b in zip(
            reconstruct_from_history(row), features(row, "trajectory")
        ))
        for row in held_out
    )
    checks = {
        "independent_random_seeds": TRAIN_SEED != TEST_SEED,
        "development_count": len(development) == TRAIN_COUNT,
        "held_out_count": len(held_out) == TEST_COUNT,
        "no_hidden_beta_in_gate_inputs": all(len(features(row, route)) == 5 for row in held_out
                                             for route in ("scalar", "full_history", "trajectory")),
        "full_history_exactly_reconstructs_trajectory": reconstruction_matches,
        "reconstructed_full_history_gate_ties_trajectory": all(
            abs(evaluations["trajectory"][name]
                - evaluations["full_history_reconstructed_trajectory"][name]) <= 1e-12
            for name in evaluations["trajectory"]
        ),
        "benefit_label_from_hidden_relation": all(
            row["label"] == int(row["beta"] ** 2 - (row["beta"] - row["candidate"]) ** 2 > 0)
            for row in held_out
        ),
        "finite_metrics": all(math.isfinite(value) for route in evaluations.values()
                              for value in route.values()),
        "valid_proposal_fractions": all(0 <= route["proposal_fraction"] <= 1
                                        for route in evaluations.values()),
    }
    out = {
        "scope": "Synthetic learned-gate preflight; no persistent learner or biological claim",
        "protocol_sha256": hashlib.sha256((ROOT / "LEARNED-GATE-PREFLIGHT-PROTOCOL-20260922.md").read_bytes()).hexdigest(),
        "source_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "train_seed": TRAIN_SEED,
        "test_seed": TEST_SEED,
        "train_count": TRAIN_COUNT,
        "test_count": TEST_COUNT,
        "metrics": evaluations,
        "checks": checks,
        "passed": sum(checks.values()),
        "total": len(checks),
        "all_pass": all(checks.values()),
        "not_claimed": ["continual-learning superiority", "new Shannon information",
                        "biological PWD", "plasticity retention", "consciousness"],
    }
    target = ROOT / "results" / "LEARNED-GATE-PREFLIGHT.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    write_figure(evaluations)
    print(json.dumps({"all_pass": out["all_pass"], "passed": out["passed"],
                      "total": out["total"], "metrics": evaluations}, indent=2))
    if not out["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    run()
