"""Finite scheduling witness for the Temporal Ensemble Hypothesis.

This is an abstract model, not a fitted dendrite, a physiological simulation,
or evidence of cellular experience. It distinguishes imposed scheduling,
branch recovery, trace survival, and downstream availability.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass(frozen=True)
class Result:
    symbols: str
    branch_count: int
    spacing: float
    recovery: float
    trace_lifetime: float
    event_times: tuple[float, ...]
    effective_events: tuple[bool, ...]
    final_available_order: str
    full_order_available: bool
    branch_reuse_ready: bool


def run_sequence(
    symbols: str,
    branch_count: int,
    spacing: float,
    recovery: float,
    trace_lifetime: float,
    simultaneous: bool = False,
) -> Result:
    if not symbols or branch_count < 1 or spacing <= 0 or recovery < 0 or trace_lifetime < 0:
        raise ValueError("Invalid sequence or schedule parameters")
    times = tuple(0.0 if simultaneous else index * spacing for index in range(len(symbols)))
    last_activation: dict[int, float] = {}
    effective: list[bool] = []
    events: list[tuple[float, int, str]] = []
    for index, (symbol, time) in enumerate(zip(symbols, times)):
        branch = index % branch_count
        ready = branch not in last_activation or time - last_activation[branch] >= recovery
        effective.append(ready)
        if ready:
            events.append((time, index, symbol))
            last_activation[branch] = time
    final_time = times[-1]
    alive = [event for event in events if final_time - event[0] <= trace_lifetime]
    # Equal timestamps do not carry the order in which the source enumerated them.
    # The readout refuses to invent that temporal relation.
    unambiguous = len({event[0] for event in alive}) == len(alive)
    ordered = "".join(event[2] for event in alive) if unambiguous else "AMBIGUOUS"
    return Result(
        symbols=symbols,
        branch_count=branch_count,
        spacing=spacing,
        recovery=recovery,
        trace_lifetime=trace_lifetime,
        event_times=times,
        effective_events=tuple(effective),
        final_available_order=ordered,
        full_order_available=ordered == symbols,
        branch_reuse_ready=all(effective),
    )


def theorem_condition(branch_count: int, overlap_count: int, recovery: float, trace_lifetime: float) -> bool:
    """Existence of regular spacing under the *declared* hard-window assumptions."""
    if branch_count < 1 or overlap_count < 2 or recovery < 0 or trace_lifetime < 0:
        raise ValueError("Invalid theorem parameters")
    return (
        branch_count >= overlap_count
        and trace_lifetime > 0
        and branch_count * trace_lifetime >= (overlap_count - 1) * recovery
    )


def audit() -> dict:
    feasible = run_sequence("ABCABC", 3, 1.0, 3.0, 2.0)
    short_trace = run_sequence("ABC", 3, 1.0, 3.0, 1.5)
    slow_recovery = run_sequence("ABCABC", 3, 1.0, 4.0, 2.0)
    reversed_order = run_sequence("CBA", 3, 1.0, 3.0, 2.0)
    simultaneous = run_sequence("ABC", 3, 1.0, 3.0, 2.0, simultaneous=True)
    tests = {
        "finite_schedule_feasible": theorem_condition(3, 3, 3.0, 2.0),
        "regular_triplet_available": run_sequence("ABC", 3, 1.0, 3.0, 2.0).full_order_available,
        "short_trace_loses_first_event": short_trace.final_available_order == "BC",
        "slow_recovery_blocks_reuse": not slow_recovery.branch_reuse_ready,
        "reverse_order_preserved": reversed_order.final_available_order == "CBA",
        "rate_only_cannot_distinguish_reversal": sorted("ABC") == sorted("CBA"),
        "simultaneous_order_ambiguous": simultaneous.final_available_order == "AMBIGUOUS",
        "nonoscillatory_history_also_retains_order": tuple("ABC") != tuple("CBA"),
        "necessary_window_fails_when_short": not theorem_condition(3, 3, 3.0, 1.5),
        "zero_lifetime_rejects_positive_spacing": not theorem_condition(3, 3, 0.0, 0.0),
    }
    if not all(tests.values()):
        raise AssertionError(tests)
    return {
        "model_scope": "imposed finite schedule, hard recovery and trace windows; no emergent oscillation",
        "tests": tests,
        "cases": {
            "feasible_six_events": asdict(feasible),
            "short_trace": asdict(short_trace),
            "slow_recovery": asdict(slow_recovery),
            "reversed_order": asdict(reversed_order),
            "simultaneous": asdict(simultaneous),
        },
        "limitations": [
            "The model does not fit or predict biological dendritic activity.",
            "A nonoscillatory ordered state can preserve the same information.",
            "The witness says nothing about phenomenal experience.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    result = audit()
    rendered = json.dumps(result, indent=2, sort_keys=True) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(rendered, encoding="utf-8")
    else:
        print(rendered)


if __name__ == "__main__":
    main()
