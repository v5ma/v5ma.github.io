"""Intrinsic readiness/competition toy. No fitted biology or experience claim."""

import json
from pathlib import Path


def simulate(symbols="ABCABC", n=3, recovery=1/3, threshold=2/3,
             fatigue=True, competition=True, blocked=()):
    if n < 1 or recovery <= 0 or threshold < 0 or threshold > 1:
        raise ValueError("Invalid model parameters")
    readiness = [1.0] * n
    selected = []
    trace = []
    for time, symbol in enumerate(symbols):
        eligible = [i for i in range(n) if i not in blocked and readiness[i] + 1e-12 >= threshold]
        if competition:
            winner = max(eligible, key=lambda i: (readiness[i], -i)) if eligible else None
            active = [] if winner is None else [winner]
        else:
            active = eligible
        selected.append(active)
        for branch in active:
            trace.append({"time": time, "branch": branch, "symbol": symbol})
        if fatigue:
            readiness = [0.0 if i in active else min(1.0, q + recovery)
                         for i, q in enumerate(readiness)]
    return {"selected": selected, "trace": trace, "final_readiness": readiness}


def available_order(trace, final_time, lifetime):
    alive = [e for e in trace if 0 <= final_time - e["time"] <= lifetime]
    if len({e["time"] for e in alive}) != len(alive):
        return "CONCURRENT"
    return "".join(e["symbol"] for e in alive)


def run():
    baseline = simulate()
    no_fatigue = simulate(fatigue=False)
    no_competition = simulate(competition=False)
    blocked = simulate(blocked=(1,))
    restored = simulate()
    baseline_seq = [step[0] if step else None for step in baseline["selected"]]
    blocked_seq = [step[0] if step else None for step in blocked["selected"]]
    tests = {
        "endogenous_selection_alternates": baseline_seq == [0, 1, 2, 0, 1, 2],
        "one_activity_per_step": all(len(step) == 1 for step in baseline["selected"]),
        "no_fatigue_same_branch": [step[0] for step in no_fatigue["selected"]] == [0] * 6,
        "same_event_budget_in_no_fatigue_control": len(no_fatigue["trace"]) == len(baseline["trace"]),
        "no_competition_has_concurrency": len(no_competition["selected"][0]) == 3,
        "blocked_branch_changes_timing": blocked_seq != baseline_seq,
        "blocked_branch_causes_pause": None in blocked_seq,
        "restoration_replays_baseline": restored["selected"] == baseline["selected"],
        "baseline_third_step_has_abc": available_order(baseline["trace"], 2, 2) == "ABC",
        "short_trace_loses_earliest": available_order(baseline["trace"], 2, 1) == "BC",
        "nonalternating_control_also_has_abc": available_order(no_fatigue["trace"], 2, 2) == "ABC",
        "concurrent_readout_not_assigned_false_order": available_order(no_competition["trace"], 0, 2) == "CONCURRENT",
    }
    result = {"scope": "engineered readiness/competition toy; no biological fit, emergent neural oscillation, or phenomenal test",
              "parameters": {"recovery_per_step": 1/3, "threshold": 2/3, "constant_drive": 1},
              "tests": tests, "passed": sum(tests.values()), "total": len(tests),
              "all_pass": all(tests.values()),
              "baseline": baseline, "no_fatigue": no_fatigue,
              "no_competition": no_competition, "blocked_branch_1": blocked}
    target = Path(__file__).resolve().parent / "results" / "RESULT.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"{result['passed']}/{result['total']} checks; all_pass={result['all_pass']}")
    if not result["all_pass"]:
        raise SystemExit(1)


if __name__ == "__main__":
    run()
