"""Finite check for a declared route-versus-parameter-write identification lemma."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import random


ROOT = Path(__file__).resolve().parent
SEEDS = (2701, 2702, 2703, 2704)
SIGMAS = (1.25, 2.0)
SIGNS = (1,) * 4 + (-1,) * 4 + (1,) * 4
TOL = 1e-12


def make_stream(seed: int, sigma: float) -> list[tuple[int, float]]:
    rng = random.Random(seed)
    return [(rng.choice((-1, 1)), sign * x + rng.gauss(0.0, sigma))
            for sign in SIGNS for x in (rng.choice((-1, 1)),)]


def run_stream(stream: list[tuple[int, float]], sigma: float) -> dict:
    expert_plus = 1.0
    expert_minus = -1.0
    log_odds = 0.0
    weight = 0.0
    max_prediction_gap = 0.0
    max_state_gap = 0.0
    scalar_writes = 0
    for x, y in stream:
        route_prediction = x * math.tanh(log_odds / 2.0)
        written_prediction = x * weight
        max_prediction_gap = max(max_prediction_gap,
                                 abs(route_prediction - written_prediction))
        previous_weight = weight
        log_odds += 2.0 * x * y / (sigma * sigma)
        weight = math.tanh(math.atanh(weight) + x * y / (sigma * sigma))
        scalar_writes += int(weight != previous_weight)
        max_state_gap = max(max_state_gap, abs(weight - math.tanh(log_odds / 2.0)))
    return {
        "events": len(stream),
        "route_expert_coefficients": [expert_plus, expert_minus],
        "route_expert_parameter_writes": 0,
        "route_posterior_state_updates": len(stream),
        "writer_scalar_parameter_writes": scalar_writes,
        "max_prediction_gap": max_prediction_gap,
        "max_state_gap": max_state_gap,
        "final_route_log_odds": log_odds,
        "final_writer_weight": weight,
    }


def main() -> None:
    rows = {}
    checks = {}
    for seed in SEEDS:
        for sigma in SIGMAS:
            key = f"{seed}-{sigma}"
            stream = make_stream(seed, sigma)
            result = run_stream(stream, sigma)
            result["stream_sha256"] = hashlib.sha256(
                json.dumps(stream, separators=(",", ":")).encode()
            ).hexdigest()
            rows[key] = result
            checks[f"{key}_event_count"] = result["events"] == 12
            checks[f"{key}_prediction_equivalence"] = result["max_prediction_gap"] <= TOL
            checks[f"{key}_state_equivalence"] = result["max_state_gap"] <= TOL
            checks[f"{key}_different_write_provenance"] = (
                result["route_expert_coefficients"] == [1.0, -1.0]
                and result["route_expert_parameter_writes"] == 0
                and result["route_posterior_state_updates"] == 12
                and result["writer_scalar_parameter_writes"] >= 1
            )
    examples = {}
    for sigma in (0.75, 1.25, 2.0):
        second_prediction = math.tanh(1.0 / (sigma * sigma))
        later_error = (1.0 - second_prediction) ** 2
        examples[str(sigma)] = {"initial_error": 1.0,
                                "next_prediction": second_prediction,
                                "next_error": later_error}
        checks[f"noiseless_{sigma}_improves"] = 0.0 < second_prediction < 1.0 and later_error < 1.0
    out = {
        "scope": "Finite numerical illustration of an analytic observational-equivalence countermodel; no SAN or continual-learning validation",
        "protocol_sha256": hashlib.sha256((ROOT / "EXPRESSION-WRITE-EQUIVALENCE-PROTOCOL-20260922.md").read_bytes()).hexdigest(),
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "seeds": list(SEEDS), "sigmas": list(SIGMAS),
        "streams": rows, "noiseless_examples": examples,
        "checks": checks, "passed": sum(checks.values()),
        "total": len(checks), "all_pass": all(checks.values()),
    }
    target = ROOT / "results" / "EXPRESSION-WRITE-EQUIVALENCE-20260922.json"
    target.write_text(json.dumps(out, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"all_pass": out["all_pass"], "passed": out["passed"],
                      "total": out["total"],
                      "max_prediction_gap": max(row["max_prediction_gap"] for row in rows.values()),
                      "max_state_gap": max(row["max_state_gap"] for row in rows.values())}, sort_keys=True))
    if not out["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
