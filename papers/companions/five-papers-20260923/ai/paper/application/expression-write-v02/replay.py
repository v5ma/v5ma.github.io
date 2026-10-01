"""Bounded correction of the route/write input generator; originals read-only."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import math
from pathlib import Path
import random
from types import SimpleNamespace
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent
ORIGINAL = ROOT.parent / "expression_write_equivalence.py"
ORIGINAL_SHA = "4ae6f92966871e5673ae64f88473f079716bb078c9fc7e6dd978072ec9c16817"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_original():
    if sha(ORIGINAL) != ORIGINAL_SHA:
        raise RuntimeError("Pinned evaluator changed; review before reuse")
    spec = importlib.util.spec_from_file_location("preserved_equivalence", ORIGINAL)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def make_stream(seed, sigma, signs, rng=None):
    rng = random.Random(seed) if rng is None else rng
    stream = []
    for sign in signs:
        x = rng.choice((-1, 1))
        y = sign * x + rng.gauss(0.0, sigma)
        stream.append((x, y))
    return stream


class ControlledSource:
    def __init__(self):
        self.input_calls = 0
        self.noise_calls = 0

    def choice(self, values):
        value = values[self.input_calls % len(values)]
        self.input_calls += 1
        return value

    def gauss(self, mean, sigma):
        self.noise_calls += 1
        return 0.0


def main():
    old = load_original()
    checks = {}
    rows = {}
    for seed in old.SEEDS:
        for sigma in old.SIGMAS:
            key = f"{seed}-{sigma}"
            stream = make_stream(seed, sigma, old.SIGNS)
            reference_rng = random.Random(seed)
            reference = []
            for sign in old.SIGNS:
                x = reference_rng.choice((-1, 1))
                noise = reference_rng.gauss(0.0, sigma)
                reference.append((x, sign * x + noise))
            checks[key + "_single_input_contract"] = stream == reference
            result = old.run_stream(stream, sigma)
            result["stream"] = stream
            result["stream_sha256"] = hashlib.sha256(
                json.dumps(stream, separators=(",", ":")).encode()).hexdigest()
            rows[key] = result
            checks[key + "_event_count"] = result["events"] == 12
            checks[key + "_prediction_equivalence"] = result["max_prediction_gap"] <= old.TOL
            checks[key + "_state_equivalence"] = result["max_state_gap"] <= old.TOL
            checks[key + "_different_write_provenance"] = (
                result["route_expert_coefficients"] == [1.0, -1.0]
                and result["route_expert_parameter_writes"] == 0
                and result["route_posterior_state_updates"] == 12
                and result["writer_scalar_parameter_writes"] >= 1
            )
    examples = {}
    for sigma in (0.75, 1.25, 2.0):
        prediction = math.tanh(1.0 / (sigma * sigma))
        error = (1.0 - prediction) ** 2
        examples[str(sigma)] = {"next_prediction": prediction, "next_error": error}
        checks[f"noiseless_{sigma}_improves"] = 0.0 < prediction < 1.0 and error < 1.0
    fixture = ControlledSource()
    controlled = make_stream(0, 1.0, old.SIGNS, rng=fixture)
    checks["one_input_draw_per_event"] = fixture.input_calls == len(old.SIGNS)
    checks["one_noise_draw_per_event"] = fixture.noise_calls == len(old.SIGNS)
    checks["controlled_likelihood_contract"] = all(
        y == sign * x for sign, (x, y) in zip(old.SIGNS, controlled))
    mutant_fixture = ControlledSource()
    original_random_binding = old.random
    try:
        old.random = SimpleNamespace(Random=lambda seed: mutant_fixture)
        mutant = old.make_stream(0, 1.0)
    finally:
        old.random = original_random_binding
    mutant_mismatches = sum(
        y != sign * x for sign, (x, y) in zip(old.SIGNS, mutant))
    checks["historical_double_draw_mutant_rejected"] = (
        mutant_mismatches == 12 and mutant_fixture.input_calls == 24)
    checks["all_streams_deterministically_replay"] = all(
        make_stream(seed, sigma, old.SIGNS) == rows[f"{seed}-{sigma}"]["stream"]
        for seed in old.SEEDS for sigma in old.SIGMAS)
    result = {
        "version": 2,
        "scope": "Corrected finite likelihood fixture, not scientific validation or a new learning benchmark",
        "original_evaluator_sha256": sha(ORIGINAL),
        "script_sha256": sha(Path(__file__)),
        "protocol_sha256": sha(ROOT / "PROTOCOL.md"),
        "streams": rows,
        "noiseless_examples": examples,
        "historical_mutant_control_mismatches": mutant_mismatches,
        "checks": checks,
        "passed": sum(checks.values()),
        "total": len(checks),
        "all_pass": all(checks.values()),
        "max_prediction_gap": max(r["max_prediction_gap"] for r in rows.values()),
        "max_state_gap": max(r["max_state_gap"] for r in rows.values()),
    }
    (ROOT / "RESULT.json").write_text(
        json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({k: result[k] for k in
                      ("all_pass", "passed", "total", "max_prediction_gap", "max_state_gap")}))
    if not result["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
