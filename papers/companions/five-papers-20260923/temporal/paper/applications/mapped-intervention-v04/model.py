"""Exhaustive mapped-intervention countermodel; no biological fit."""

from itertools import combinations, product
import json
from pathlib import Path


ALPHABET = ("A", "B", "C")
N_BRANCHES = 3
HORIZON = 3


def masks():
    labels = range(N_BRANCHES)
    return [tuple(c) for size in range(N_BRANCHES + 1)
            for c in combinations(labels, size)]


def branch_route(sequence, blocked):
    slots = [(t, symbol) for t, symbol in enumerate(sequence)
             if t % N_BRANCHES not in blocked]
    return {"output": "".join(symbol for _, symbol in slots),
            "positions": [t for t, _ in slots],
            "routes": [t % N_BRANCHES for t in range(len(sequence))]}


def indexed_one_unit(sequence, blocked):
    memory = tuple(enumerate(sequence))
    retained = tuple((t, symbol) for t, symbol in memory
                     if t % N_BRANCHES not in blocked)
    return {"output": "".join(symbol for _, symbol in retained),
            "positions": [t for t, _ in retained],
            "routes": [0] * len(sequence)}


def run():
    cases = []
    for sequence in product(ALPHABET, repeat=HORIZON):
        for blocked in masks():
            a = branch_route(sequence, blocked)
            b = indexed_one_unit(sequence, blocked)
            cases.append({"input": "".join(sequence),
                          "blocked": list(blocked),
                          "branch": a["output"],
                          "indexed": b["output"],
                          "branch_positions": a["positions"],
                          "indexed_positions": b["positions"]})

    abc_branch = branch_route("ABC", (1,))
    abc_indexed = indexed_one_unit("ABC", (1,))
    tests = {
        "all_216_cases_enumerated_once": len(cases) == 216 and len({
            (row["input"], tuple(row["blocked"])) for row in cases}) == 216,
        "eight_masks": len(masks()) == 8 and len(set(masks())) == 8,
        "all_mapped_outputs_match": all(row["branch"] == row["indexed"] for row in cases),
        "all_retained_counts_match": all(len(row["branch"]) == len(row["indexed"])
                                         for row in cases),
        "all_retained_positions_match": all(row["branch_positions"] == row["indexed_positions"]
                                            for row in cases),
        "passive_outputs_preserve_inputs": all(row["branch"] == row["input"]
                                               for row in cases if row["blocked"] == []),
        "latent_routes_differ": branch_route("ABC", ())["routes"] !=
                                indexed_one_unit("ABC", ())["routes"],
        "branch_one_example_ac": abc_branch["output"] == abc_indexed["output"] == "AC",
        "single_label_blocks_preserve_two_events": all(len(row["branch"]) == 2 for row in cases
                                                        if len(row["blocked"]) == 1),
        "full_block_is_empty": all(row["branch"] == row["indexed"] == "" for row in cases
                                   if row["blocked"] == [0, 1, 2]),
        "order_survives_label_one_block": branch_route("ABC", (1,))["output"] !=
                                          branch_route("CBA", (1,))["output"],
    }
    result = {
        "scope": "finite logical-position intervention equivalence, not physical branch equivalence",
        "alphabet": ALPHABET,
        "horizon": HORIZON,
        "n_branches": N_BRANCHES,
        "n_cases": len(cases),
        "tests": tests,
        "passed": sum(tests.values()),
        "total": len(tests),
        "all_pass": all(tests.values()),
        "cases": cases,
        "limitations": [
            "The comparator uses an abstract indexed history; its positions are not dendrites.",
            "Matched visible erasure does not match metabolic cost, noise or lesion side effects.",
            "No branch recovery, content trace physiology or consciousness is tested.",
        ],
    }
    target = Path(__file__).resolve().parent / "results" / "RESULT.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{result['passed']}/{result['total']} checks across {len(cases)} cases")
    if not result["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    run()
