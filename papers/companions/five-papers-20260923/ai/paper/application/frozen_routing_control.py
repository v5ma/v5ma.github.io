"""Synthetic counterexample: later performance can improve with frozen experts."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import random


ROOT = Path(__file__).resolve().parent
SEEDS = (73101, 73102, 73103, 73104, 73105, 73106, 73107, 73108)
PHASES = 8
EVENTS_PER_PHASE = 24
SIGMA = 0.35
SGD_STEP = 0.25
EXPERTS = (-1.0, 1.0)
ROUTES = ("fixed_mixture", "frozen_route", "single_weight_sgd", "sign_oracle")


def make_stream(seed: int) -> list[dict]:
    rng = random.Random(seed)
    stream = []
    for phase in range(PHASES):
        sign = rng.choice((-1, 1))
        for step in range(EVENTS_PER_PHASE):
            x = rng.choice((-1, 1))
            y = sign * x + rng.gauss(0.0, SIGMA)
            stream.append({"phase": phase, "step": step, "sign": sign,
                           "x": x, "y": y})
    return stream


def mean(values: list[float]) -> float:
    return sum(values) / len(values)


def run_route(route: str, stream: list[dict]) -> dict:
    original_experts = EXPERTS
    errors = []
    first_errors = []
    later_errors = []
    writes = 0
    belief_updates = 0
    current_phase = None
    log_odds = 0.0
    weight = 0.0
    algebra_ok = True
    prequential_ok = True
    for event in stream:
        if event["phase"] != current_phase:
            current_phase = event["phase"]
            log_odds = 0.0
            weight = 0.0
        x, y = event["x"], event["y"]
        if route == "fixed_mixture":
            prediction = 0.5 * EXPERTS[0] * x + 0.5 * EXPERTS[1] * x
        elif route == "frozen_route":
            prior_odds = log_odds
            prediction = x * math.tanh(prior_odds / 2.0)
            prequential_ok &= abs(
                prediction - x * math.tanh(prior_odds / 2.0)) < 1e-12
        elif route == "single_weight_sgd":
            prediction = weight * x
        elif route == "sign_oracle":
            prediction = event["sign"] * x
        else:
            raise ValueError(route)

        error = (y - prediction) ** 2
        errors.append(error)
        (first_errors if event["step"] == 0 else later_errors).append(error)
        if route == "frozen_route":
            direct = ((y + x) ** 2 - (y - x) ** 2) / (2.0 * SIGMA ** 2)
            increment = 2.0 * x * y / (SIGMA ** 2)
            algebra_ok &= abs(direct - increment) < 1e-10
            log_odds += increment
            belief_updates += 1
        elif route == "single_weight_sgd":
            weight += SGD_STEP * (y - prediction) * x
            writes += 1
    return {
        "prequential_mse": mean(errors),
        "first_event_mse": mean(first_errors),
        "later_event_mse": mean(later_errors),
        "parameter_writes": writes,
        "belief_updates": belief_updates,
        "events": len(errors),
        "experts_unchanged": EXPERTS == original_experts,
        "likelihood_ratio_identity": algebra_ok,
        "prediction_precedes_feedback": prequential_ok,
        "finite": all(math.isfinite(v) for v in errors),
    }


def main() -> None:
    per_seed = {}
    checks = {}
    for seed in SEEDS:
        stream = make_stream(seed)
        encoded = json.dumps(stream, sort_keys=True).encode("utf-8")
        digest = hashlib.sha256(encoded).hexdigest()
        repeated = hashlib.sha256(
            json.dumps(make_stream(seed), sort_keys=True).encode("utf-8")).hexdigest()
        checks[f"{seed}_replay"] = digest == repeated
        checks[f"{seed}_stream_count"] = len(stream) == PHASES * EVENTS_PER_PHASE
        checks[f"{seed}_phase_counts"] = all(
            sum(event["phase"] == phase for event in stream) == EVENTS_PER_PHASE
            for phase in range(PHASES))
        runs = {route: run_route(route, stream) for route in ROUTES}
        checks[f"{seed}_shared_event_count"] = all(
            result["events"] == len(stream) for result in runs.values())
        checks[f"{seed}_frozen_experts"] = all(
            result["experts_unchanged"] for result in runs.values())
        checks[f"{seed}_no_frozen_parameter_writes"] = (
            runs["frozen_route"]["parameter_writes"] == 0
            and runs["fixed_mixture"]["parameter_writes"] == 0)
        checks[f"{seed}_posterior_updates"] = (
            runs["frozen_route"]["belief_updates"] == len(stream))
        checks[f"{seed}_sgd_writes"] = (
            runs["single_weight_sgd"]["parameter_writes"] == len(stream))
        checks[f"{seed}_first_event_identity"] = abs(
            runs["frozen_route"]["first_event_mse"]
            - runs["fixed_mixture"]["first_event_mse"]) < 1e-12
        checks[f"{seed}_likelihood_identity"] = (
            runs["frozen_route"]["likelihood_ratio_identity"])
        checks[f"{seed}_prequential"] = (
            runs["frozen_route"]["prediction_precedes_feedback"])
        checks[f"{seed}_finite"] = all(result["finite"] for result in runs.values())
        per_seed[str(seed)] = {
            "stream_sha256": digest,
            "phase_signs": [stream[phase * EVENTS_PER_PHASE]["sign"]
                            for phase in range(PHASES)],
            "routes": runs,
        }
    summary = {route: {
        key: mean([per_seed[str(seed)]["routes"][route][key] for seed in SEEDS])
        for key in ("prequential_mse", "first_event_mse", "later_event_mse",
                    "parameter_writes", "belief_updates")}
        for route in ROUTES}
    improved = sum(
        per_seed[str(seed)]["routes"]["frozen_route"]["prequential_mse"]
        < per_seed[str(seed)]["routes"]["fixed_mixture"]["prequential_mse"]
        for seed in SEEDS)
    out = {
        "scope": "Synthetic expression-versus-write control; fixed preloaded experts, not continual-learning validation",
        "protocol_sha256": hashlib.sha256(
            (ROOT / "FROZEN-ROUTING-CONTROL-PROTOCOL-20260922.md").read_bytes()
        ).hexdigest(),
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "seeds": list(SEEDS), "phases": PHASES,
        "events_per_phase": EVENTS_PER_PHASE, "noise_sigma": SIGMA,
        "per_seed": per_seed, "summary": summary,
        "frozen_route_better_than_fixed_mixture_seed_count": improved,
        "checks": checks, "passed": sum(checks.values()), "total": len(checks),
        "all_pass": all(checks.values()),
    }
    target = ROOT / "results" / "FROZEN-ROUTING-CONTROL-20260922.json"
    target.write_text(json.dumps(out, indent=2, sort_keys=True) + "\n",
                      encoding="utf-8")
    print(json.dumps({
        "all_pass": out["all_pass"], "passed": out["passed"],
        "total": out["total"], "improved_seeds": improved,
        "summary": summary,
    }, indent=2))
    if not out["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
