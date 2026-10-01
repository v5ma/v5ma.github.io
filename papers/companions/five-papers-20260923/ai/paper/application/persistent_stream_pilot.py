"""Small synthetic persistent learner; deliberately not a SAN or CL benchmark."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import random

import learned_gate_preflight as first
import strong_history_followup as follow


ROOT = Path(__file__).resolve().parent
SEEDS = (62101, 62102, 62103, 62104, 62105)
THETA = (1.5, -1.0, 2.0)
SQRT2 = math.sqrt(2.0)
CONTEXTS = (
    (1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0),
    (1.0 / SQRT2, 1.0 / SQRT2, 0.0),
    (0.0, 1.0 / SQRT2, 1.0 / SQRT2),
    (1.0 / SQRT2, 0.0, 1.0 / SQRT2),
)
PHASES = (("A_old", (0, 1), 25), ("B_new", (2, 3, 4, 5), 25),
          ("C_revisit", tuple(range(6)), 10))
ROUTES = ("never", "always", "scalar", "raw_history", "trajectory",
          "history_interaction", "analytic")


def dot(left, right) -> float:
    return sum(a * b for a, b in zip(left, right))


def error_triplet(weights: list[float]) -> dict:
    squared = [(dot(THETA, context) - dot(weights, context)) ** 2
               for context in CONTEXTS]
    return {"all": sum(squared) / 6.0,
            "old": sum(squared[:2]) / 2.0,
            "new": sum(squared[2:]) / 4.0}


def make_stream(seed: int) -> list[dict]:
    rng = random.Random(seed)
    stream = []
    for phase_name, context_ids, visits in PHASES:
        for _ in range(visits):
            for context_id in context_ids:
                x = rng.choice((-1, 1))
                y = x * dot(THETA, CONTEXTS[context_id]) + rng.gauss(0, first.NOISE_SD)
                stream.append({"phase": phase_name, "context": context_id,
                               "x": x, "y": y})
    return stream


def train_gates() -> dict:
    rng = random.Random(first.TRAIN_SEED)
    development = [first.episode(rng) for _ in range(first.TRAIN_COUNT)]
    feature_functions = {
        "scalar": lambda row: first.features(row, "scalar"),
        "raw_history": lambda row: first.features(row, "full_history"),
        "trajectory": lambda row: first.features(row, "trajectory"),
        "history_interaction": follow.interaction_features,
    }
    return {route: (follow.fit_route(development, function), function)
            for route, function in feature_functions.items()}


def propose_probability(route: str, row: dict, gates: dict) -> float:
    if route == "always":
        return 1.0
    if route == "never":
        return 0.0
    if route == "analytic":
        return follow.analytic_probability(row)
    model, feature_function = gates[route]
    return follow.predict_route([row], model, feature_function)[0]


def run_route(route: str, stream: list[dict], gates: dict) -> tuple[dict, dict]:
    weights = [0.0, 0.0, 0.0]
    histories = {j: [] for j in range(6)}
    writes = 0
    eligible = 0
    pre_error_sum = {name: 0.0 for name in ("all", "old", "new")}
    phase_results = {}
    checks = {"prior_only": True, "no_early_proposal": True,
              "weight_transition": True, "permitted_gate_row": True,
              "identical_count": len(stream) == 210}
    for index, event in enumerate(stream):
        context_id = event["context"]
        context = CONTEXTS[context_id]
        prior = histories[context_id]
        checks["prior_only"] &= all(prior_index < index for prior_index, _ in prior)
        predicted_coefficient = dot(weights, context)
        signed_current = event["y"] * event["x"] - predicted_coefficient
        before = error_triplet(weights)
        for name in pre_error_sum:
            pre_error_sum[name] += before[name]
        old_weights = weights.copy()
        commit = False
        if len(prior) == 4:
            eligible += 1
            row = {"signed_current": signed_current,
                   "history": [observed - predicted_coefficient for _, observed in prior]}
            checks["permitted_gate_row"] &= set(row) == {"signed_current", "history"}
            probability = propose_probability(route, row, gates)
            commit = probability >= 0.5
            if commit:
                step = 0.5 * signed_current
                weights = [value + step * component
                           for value, component in zip(weights, context)]
                writes += 1
        else:
            checks["no_early_proposal"] &= not commit
        checks["weight_transition"] &= (
            all(abs(a - b) < 1e-12 for a, b in zip(weights, old_weights))
            if not commit else
            all(abs(a - b - 0.5 * signed_current * c) < 1e-12
                for a, b, c in zip(weights, old_weights, context))
        )
        prior.append((index, event["y"] * event["x"]))
        if len(prior) > 4:
            prior.pop(0)
        next_phase = (stream[index + 1]["phase"] if index + 1 < len(stream) else None)
        if next_phase != event["phase"]:
            phase_results[event["phase"]] = {
                "post_error": error_triplet(weights),
                "cumulative_pre_error": {name: value / (index + 1)
                                         for name, value in pre_error_sum.items()},
                "writes_to_date": writes,
            }
    checks["never_stays_initial"] = route != "never" or weights == [0.0, 0.0, 0.0]
    checks["all_finite"] = all(math.isfinite(value)
                               for phase in phase_results.values()
                               for group in ("post_error", "cumulative_pre_error")
                               for value in phase[group].values())
    return {"phases": phase_results, "total_writes": writes,
            "eligible_episodes": eligible, "proposal_fraction": writes / eligible,
            "final_weights": weights}, checks


def mean(values: list[float]) -> float:
    return sum(values) / len(values)


def main() -> None:
    assert all(abs(dot(context, context) - 1.0) < 1e-12 for context in CONTEXTS)
    gates = train_gates()
    per_seed = {}
    checks = {"same_stream_all_routes": True,
              "all_routes_have_same_eligible_count": True}
    for seed in SEEDS:
        stream = make_stream(seed)
        digest = hashlib.sha256(json.dumps(stream, sort_keys=True).encode()).hexdigest()
        runs = {}
        for route in ROUTES:
            result, route_checks = run_route(route, stream, gates)
            runs[route] = result
            checks.update({f"{seed}_{route}_{key}": value
                           for key, value in route_checks.items()})
            checks["same_stream_all_routes"] &= digest == hashlib.sha256(
                json.dumps(stream, sort_keys=True).encode()).hexdigest()
        checks["all_routes_have_same_eligible_count"] &= len({
            run["eligible_episodes"] for run in runs.values()}) == 1
        per_seed[str(seed)] = {"stream_sha256": digest, "routes": runs}
    summary = {}
    for route in ROUTES:
        summary[route] = {"mean_writes": mean([
            per_seed[str(seed)]["routes"][route]["total_writes"] for seed in SEEDS]),
            "phases": {phase_name: {
                metric: {part: mean([
                    per_seed[str(seed)]["routes"][route]["phases"][phase_name][metric][part]
                    for seed in SEEDS]) for part in ("all", "old", "new")}
                for metric in ("post_error", "cumulative_pre_error")}
                for phase_name, _, _ in PHASES}}
    out = {
        "scope": "Synthetic persistent shared-linear-learner pilot; not a SAN or published CL benchmark",
        "protocol_sha256": hashlib.sha256((ROOT / "PERSISTENT-STREAM-PILOT-PROTOCOL-20260922.md").read_bytes()).hexdigest(),
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "seeds": list(SEEDS), "phase_counts": {name: len(ids) * visits for name, ids, visits in PHASES},
        "per_seed": per_seed, "summary": summary, "checks": checks,
        "passed": sum(checks.values()), "total": len(checks),
        "all_pass": all(checks.values()),
    }
    target = ROOT / "results" / "PERSISTENT-STREAM-PILOT.json"
    target.write_text(json.dumps(out, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"all_pass": out["all_pass"], "passed": out["passed"],
                      "total": out["total"], "summary": summary}, indent=2))
    if not out["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
