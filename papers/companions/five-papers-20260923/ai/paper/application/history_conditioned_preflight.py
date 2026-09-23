"""Finite diagnostic: history-conditioned settling is not independent information.

This is a synthetic identification check, not a trained update controller or a
continual-learning benchmark. The two rates are stipulated to expose the
comparison boundary. It deliberately tests a strong full-history control.
"""

from itertools import product
import json
from pathlib import Path


STEPS = 4
RATE = {0: 0.25, 1: 0.75}


def settle(history_bit: int, prediction: float, verified_outcome: float):
    """Freeze retained parameters and relax an observed outcome discrepancy."""
    z = prediction
    residuals = [verified_outcome - z]
    for _ in range(STEPS):
        z += RATE[history_bit] * (verified_outcome - z)
        residuals.append(verified_outcome - z)
    return tuple(residuals)


def run():
    cases = [
        {"history": h, "prediction": p, "verified_outcome": y,
         "residuals": settle(h, p, y)}
        for h, p, y in product((0, 1), repeat=3)
    ]
    fixed_pair_slow = settle(0, 0.0, 1.0)
    fixed_pair_fast = settle(1, 0.0, 1.0)
    checks = {
        "same_scalar_pair_different_history_changes_trace":
            fixed_pair_slow != fixed_pair_fast,
        "zero_error_does_not_identify_history":
            settle(0, 1.0, 1.0) == settle(1, 1.0, 1.0),
        "all_enumerated_traces_reconstruct_from_full_inputs":
            all(row["residuals"] == settle(row["history"],
                                            row["prediction"],
                                            row["verified_outcome"])
                for row in cases),
        "full_history_matches_trace_on_stipulated_label":
            all(((row["residuals"][1] < 0.5) == bool(row["history"]))
                for row in cases if row["prediction"] == 0 and
                row["verified_outcome"] == 1),
        "fixed_diagnostic_cost": all(len(row["residuals"]) == STEPS + 1
                                     for row in cases),
        "all_cases_enumerated": len(cases) == 8,
    }
    out = {
        "scope": "Synthetic finite identification preflight; stipulated rates and label",
        "claim": "Trace distinguishes matched scalar pairs in one case, but is a deterministic function of full permitted inputs.",
        "not_claimed": ["learned controller", "prospective continual-learning advantage",
                        "extra information beyond full history", "biological mechanism"],
        "rate_by_history": RATE,
        "steps": STEPS,
        "matched_scalar_pair": {"prediction": 0.0, "verified_outcome": 1.0,
                                "slow_trace": fixed_pair_slow,
                                "fast_trace": fixed_pair_fast},
        "checks": checks,
        "passed": sum(checks.values()),
        "total": len(checks),
        "all_pass": all(checks.values()),
        "cases": cases,
    }
    target = Path(__file__).resolve().parent / "results" / "HISTORY-CONDITIONED-PREFLIGHT.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    print(f"{out['passed']}/{out['total']} checks; all_pass={out['all_pass']}")
    if not out["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    run()
