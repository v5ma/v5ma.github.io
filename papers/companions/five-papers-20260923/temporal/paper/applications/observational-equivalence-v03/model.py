"""Finite I/O equivalence witness; not a fitted neural or consciousness model."""

from itertools import product
import json
from pathlib import Path


ALPHABET = ("A", "B", "C")
HORIZON = 3


def alternating_route(inputs, blocked=()):
    """One scheduled branch per step, with an ordered content trace."""
    trace = []
    routes = []
    for time, symbol in enumerate(inputs):
        branch = time % 3
        routes.append(branch)
        if branch not in blocked:
            trace.append((time, symbol))
    return "".join(symbol for _, symbol in trace), routes


def one_unit_history(inputs):
    """One route stores an ordered history with the same observable readout."""
    history = ()
    for symbol in inputs:
        history = (*history, symbol)
    return "".join(history), [0] * len(inputs)


def run():
    inputs = list(product(ALPHABET, repeat=HORIZON))
    passive_equal = all(alternating_route(x)[0] == one_unit_history(x)[0]
                        for x in inputs)
    abc_alt, abc_routes = alternating_route(("A", "B", "C"))
    abc_one, one_routes = one_unit_history(("A", "B", "C"))
    cba_alt, _ = alternating_route(("C", "B", "A"))
    blocked_alt, _ = alternating_route(("A", "B", "C"), blocked=(1,))
    tests = {
        "all_27_input_sequences_match_passively": passive_equal,
        "latent_routes_differ": abc_routes != one_routes,
        "both_models_keep_abc_order": abc_alt == abc_one == "ABC",
        "both_models_distinguish_reversal": abc_alt != cba_alt and cba_alt == "CBA",
        "branch_specific_intervention_separates_these_models": blocked_alt == "AC" and abc_one == "ABC",
    }
    result = {
        "scope": "constructive passive input-output nonidentifiability on a 3-symbol, 3-step finite domain",
        "alphabet": ALPHABET,
        "horizon": HORIZON,
        "input_cases": len(inputs),
        "tests": tests,
        "passed": sum(tests.values()),
        "total": len(tests),
        "all_pass": all(tests.values()),
        "example": {
            "input": "ABC",
            "alternating_routes": abc_routes,
            "one_unit_routes": one_routes,
            "passive_output": abc_alt,
            "alternating_output_with_branch_1_blocked": blocked_alt,
        },
        "limits": [
            "No equal-capacity, metabolic-cost or noise constraint is asserted.",
            "The branch-specific block distinguishes only these stipulated implementations.",
            "This is not evidence that either route occurs in a biological neuron.",
        ],
    }
    target = Path(__file__).resolve().parent / "results" / "RESULT.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"{result['passed']}/{result['total']} checks; all_pass={result['all_pass']}")
    if not result["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    run()
