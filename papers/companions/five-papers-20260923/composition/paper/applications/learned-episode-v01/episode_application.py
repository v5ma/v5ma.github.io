"""Bounded symbolic development application; no external dependencies or data."""
from __future__ import annotations

import argparse
import csv
from dataclasses import asdict, dataclass
from hashlib import sha256
from itertools import combinations
import json
from pathlib import Path
import random
import sys
import time

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
TASK_NAMES = ("focused_0", "focused_5", "broad_coarse", "ordered_binding", "delayed_pair", "temporal_order")


def digest(value):
    return sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_hash(path):
    return sha256(Path(path).read_bytes()).hexdigest()


def state(number):
    return tuple((number // (4 ** i)) % 4 for i in range(6))


def split_states(seed, config):
    ids = list(range(config["state_count"]))
    random.Random(seed).shuffle(ids)
    a = config["train_state_count"]
    b = a + config["development_state_count"]
    return ids[:a], ids[a:b], ids[b:]


def episode_pairs(pool, count, seed):
    rng = random.Random(seed)
    return [tuple(rng.sample(pool, 2)) for _ in range(count)]


@dataclass(frozen=True)
class Record:
    time: int
    coord: int
    fine: bool
    value: int


@dataclass(frozen=True)
class Plan:
    coords: tuple[int, ...]
    mode: str
    fine: bool

    def operations(self):
        return len(self.coords) * (2 if self.mode == "both" else 1)


def plans():
    subsets = [c for n in (1, 2, 3) for c in combinations(range(6), n)] + [tuple(range(6))]
    return [Plan(c, m, f) for c in subsets for m in ("now", "reference", "both")
            for f in (False, True) if len(c) * (2 if m == "both" else 1) <= 6]


class Codebook:
    def __init__(self, seed):
        rng = random.Random(seed + 137)
        codes = rng.sample(range(1000, 9000), 12)
        keys = [(c, f, v) for c in range(2) for f in (False, True)
                for v in range(4 if f else 2)]
        self.codes = dict(zip(keys, codes))

    def encode(self, coord, fine, actual):
        return self.codes[(coord % 2, fine, actual if fine else actual // 2)]


class Receiver:
    """A supervised symbol dictionary, not a learned neural network."""
    def __init__(self):
        self.associations = {}

    def fit(self, observations):
        for channel, fine, symbol, label in observations:
            key = (channel, fine, symbol)
            if key in self.associations and self.associations[key] != label:
                raise ValueError("Inconsistent calibration")
            self.associations[key] = label

    def decode(self, tick, coord, fine, symbol):
        return Record(tick, coord, fine, self.associations[(coord % 2, fine, symbol)])

    def serial(self):
        return [[*key, value] for key, value in sorted(self.associations.items())]


def calibration(pool, book):
    rows = set()
    for number in pool:
        for coord, actual in enumerate(state(number)):
            for fine in (False, True):
                rows.add((coord % 2, fine, book.encode(coord, fine, actual), actual if fine else actual // 2))
        if len(rows) == 12:
            break
    return sorted(rows)


class Environment:
    """Only this object and the external scorer own true world states."""
    def __init__(self, pair, book):
        self.worlds = (state(pair[0]), state(pair[1]))
        self.book = book

    def observe(self, tick, coord, fine):
        return self.book.encode(coord, fine, self.worlds[tick][coord])


class Memory:
    def __init__(self, records=()):
        self.entries = {}
        for record in records:
            self.add(record)

    def add(self, record):
        key = (record.time, record.coord)
        previous = self.entries.get(key)
        if previous is None or record.fine or not previous.fine:
            self.entries[key] = record

    def reference(self, coord):
        return self.entries.get((0, coord))

    def serial(self):
        return [asdict(r) for _, r in sorted(self.entries.items())]


def familiarize(env, receiver):
    return Memory(receiver.decode(0, c, True, env.observe(0, c, True)) for c in range(6))


def coarsen(record):
    return Record(record.time, record.coord, False, record.value // 2) if record.fine else record


def execute(plan, tick, memory, observe, receiver, deny_sampling=False, attention=False):
    """The agent receives a narrow observation callable, never an Environment."""
    selected = []
    actions = []
    sampled = bits = retrieves = 0
    for coord in plan.coords:
        if plan.mode in ("reference", "both"):
            retrieves += 1
            record = memory.reference(coord)
            actions.append(["retrieve", 0, coord, record is not None])
            if record is not None:
                selected.append(record if plan.fine else coarsen(record))
        if plan.mode in ("now", "both"):
            if deny_sampling:
                actions.append(["sampling_denied", tick, coord, plan.fine])
            else:
                symbol = observe(tick, coord, plan.fine)
                record = receiver.decode(tick, coord, plan.fine, symbol)
                memory.add(record)
                selected.append(record)
                sampled += 1
                bits += 2 if plan.fine else 1
                actions.append(["sample", tick, coord, plan.fine, symbol])
    if attention:
        # Equivalent attention interpretation with identical available evidence.
        assembly = {(r.time, r.coord): r for r in selected}
    else:
        assembly = {}
        for record in selected:
            assembly[(record.time, record.coord)] = record
    return assembly, {"samples": sampled, "retrievals": retrieves, "source_bits": bits,
                      "operations": len(actions), "actions": actions}


def retrieve_value(assembly, tick, coord, fine=True):
    record = assembly.get((tick, coord))
    if record is None or (fine and not record.fine):
        return None
    return record.value if fine or not record.fine else record.value // 2


def response(assembly, tick, task):
    """Declared task head. It cannot retrieve from memory or sample the world."""
    if task in (0, 1):
        value = retrieve_value(assembly, tick, 0 if task == 0 else 5)
        return 0 if value is None else value
    if task == 2:
        v = [retrieve_value(assembly, tick, c, False) for c in (2, 3, 4)]
        return 0 if None in v else 4 * v[0] + 2 * v[1] + v[2]
    if task in (3, 4):
        when, coords = (tick, (1, 3)) if task == 3 else (0, (0, 5))
        v = [retrieve_value(assembly, when, c) for c in coords]
        return 0 if None in v else 4 * v[0] + v[1]
    old = retrieve_value(assembly, 0, 4)
    new = retrieve_value(assembly, tick, 4)
    return 0 if old is None or new is None else 1 + (new > old) - (new < old)


def target(worlds, tick, task):
    """Independent scorer: no reuse of assembly or learned receiver functions."""
    now, old = worlds[tick], worlds[0]
    if task == 0:
        return now[0]
    if task == 1:
        return now[5]
    if task == 2:
        return 4 * (now[2] // 2) + 2 * (now[3] // 2) + now[4] // 2
    if task == 3:
        return now[1] * 4 + now[3]
    if task == 4:
        return old[0] * 4 + old[5]
    if now[4] < old[4]:
        return 0
    return 2 if now[4] > old[4] else 1


def assembly_bits(assembly):
    return sum(2 if r.fine else 1 for r in assembly.values())


def perturb(assembly, kind, tick):
    records = list(assembly.values())
    if kind in ("binding_permuted", "binding_inverse_rescue"):
        records = [Record(r.time, (((r.coord // 2) + 1) % 3) * 2 + r.coord % 2, r.fine, r.value) for r in records]
        if kind == "binding_inverse_rescue":
            records = [Record(r.time, (((r.coord // 2) - 1) % 3) * 2 + r.coord % 2, r.fine, r.value) for r in records]
    elif kind == "assembly_coarsened":
        records = [coarsen(r) for r in records]
    elif kind == "current_only_assembly":
        records = [r for r in records if r.time == tick]
    elif kind == "time_order_reversed":
        records = [Record(1 - r.time, r.coord, r.fine, r.value) for r in records]
    return {(r.time, r.coord): r for r in records}


class Controller:
    def __init__(self, candidates, learned=None):
        self.candidates = candidates
        self.learned = {} if learned is None else learned

    def choose(self, tick, task):
        values = self.learned[(tick, task)]
        return max(range(len(values)), key=lambda i: values[i]["utility"])

    def serial(self):
        return {f"{tick}:{task}": values for (tick, task), values in sorted(self.learned.items())}


def fit_controller(pairs, book, receiver, config, deadline):
    candidates = plans()
    controller = Controller(candidates)
    contexts = [(0, task) for task in range(4)] + [(1, task) for task in range(6)]
    # Observed familiarization is cached only across repeated training trials.
    situations = []
    for pair in pairs:
        env = Environment(pair, book)
        situations.append((env, list(familiarize(env, receiver).entries.values())))
    evaluations = 0
    for tick, task in contexts:
        estimates = []
        for plan in candidates:
            if time.perf_counter() > deadline:
                raise TimeoutError("Bounded training deadline exceeded")
            successes = 0
            total = 0.0
            for env, observed in situations:
                memory = Memory(observed)
                assembly, costs = execute(plan, tick, memory, env.observe, receiver)
                correct = int(response(assembly, tick, task) == target(env.worlds, tick, task))
                successes += correct
                total += (correct - config["acquisition_bit_penalty"] * costs["source_bits"]
                          - config["assembly_bit_penalty"] * assembly_bits(assembly)
                          - config["operation_penalty"] * costs["operations"])
                evaluations += 1
            estimates.append({"n": len(pairs), "correct": successes, "utility": total / len(pairs)})
        controller.learned[(tick, task)] = estimates
    return controller, evaluations


def trial(pair, tasks, seed, episode, condition, book, receiver, controller):
    env = Environment(pair, book)
    memory = familiarize(env, receiver)
    rows = []
    for tick, task in enumerate(tasks):
        if tick and condition == "memory_reset_at_switch":
            memory = Memory()
        index = controller.choose(tick, task)
        chosen = controller.candidates[index]
        active = condition if tick else "learned_assembly"
        if condition == "full_record_upper_bound":
            chosen = Plan(tuple(range(6)), "now", True)
        elif condition == "fixed_all_coarse":
            chosen = Plan(tuple(range(6)), "now", False)
        assembly, costs = execute(chosen, tick, memory, env.observe, receiver,
                                  deny_sampling=(active == "no_new_sampling_after_change"),
                                  attention=(condition == "matched_attention"))
        if condition == "full_record_upper_bound":
            assembly = dict(memory.entries)
            costs["retrievals"] += len(memory.entries)
            costs["operations"] += len(memory.entries)
            costs["actions"].append(["full_record_read", len(memory.entries)])
        before = dict(assembly)
        if tick:
            assembly = perturb(assembly, active, tick)
        answer = response(assembly, tick, task)
        truth = target(env.worlds, tick, task)
        probe = []
        for when in sorted({0, tick}):
            for coord in range(6):
                r = assembly.get((when, coord))
                # Probe is inspection of a frozen state, not renewed retrieval.
                probe.append([when, coord, None if r is None or not r.fine else r.value])
        rows.append({"seed": seed, "episode": episode, "condition": condition, "stage": tick,
                     "task": task, "task_name": TASK_NAMES[task], "world_ids": list(pair),
                     "selected_plan_index": index, "executed_plan": asdict(chosen),
                     "response": answer, "target": truth, "correct": int(answer == truth),
                     "source_bits": costs["source_bits"], "samples": costs["samples"],
                     "retrievals": costs["retrievals"], "operations": costs["operations"],
                     "assembly_bits": assembly_bits(assembly), "assembly_entries": len(assembly),
                     "memory_entries": len(memory.entries),
                     "memory_serialized_bytes": len(json.dumps(memory.serial(), separators=(",", ":")).encode()),
                     "assembly_before": [asdict(r) for _, r in sorted(before.items())],
                     "assembly_after": [asdict(r) for _, r in sorted(assembly.items())],
                     "frozen_probe": probe, "actions": costs["actions"], "controller_lookups": 1})
    return rows


def aggregate(rows):
    output = []
    for condition in sorted({r["condition"] for r in rows}):
        for stage in (0, 1):
            for task in sorted({r["task"] for r in rows if r["stage"] == stage}):
                group = [r for r in rows if (r["condition"], r["stage"], r["task"]) == (condition, stage, task)]
                if not group:
                    continue
                row = {"condition": condition, "stage": stage, "task": task, "task_name": TASK_NAMES[task], "n": len(group)}
                for metric in ("correct", "source_bits", "samples", "retrievals", "operations", "assembly_bits", "memory_entries", "memory_serialized_bytes"):
                    row[metric + "_mean"] = sum(r[metric] for r in group) / len(group)
                output.append(row)
    return output


def lower_priority():
    if sys.platform == "win32":
        import ctypes
        kernel = ctypes.windll.kernel32
        kernel.GetCurrentProcess.restype = ctypes.c_void_p
        kernel.SetPriorityClass.argtypes = (ctypes.c_void_p, ctypes.c_uint)
        return bool(kernel.SetPriorityClass(kernel.GetCurrentProcess(), 0x4000))
    return False


def run(out, smoke=False):
    start = time.perf_counter()
    config = json.loads((HERE / "CONFIG.json").read_text("utf-8"))
    if out.exists():
        raise FileExistsError("Preserve earlier executions: choose a fresh output directory")
    if out.parent.resolve() != HERE.resolve():
        raise ValueError("Output must be an immediate child of this application folder")
    out.mkdir()
    hashes = {name: file_hash(HERE / name) for name in ("CONFIG.json", "PROTOCOL.md", "episode_application.py")}
    before = {"input_sha256": hashes, "mode": "development-smoke" if smoke else "synthetic-development-evaluation",
              "priority_lowered": lower_priority(), "scope": "one CPU process; outputs only inside this application"}
    (out / "BEFORE-RUN.json").write_text(json.dumps(before, indent=2) + "\n", encoding="utf-8")
    deadline = start + (10 if smoke else config["maximum_run_seconds"])
    rows, seeds_report, events = [], [], []
    seeds = config["seeds"][:1] if smoke else config["seeds"]
    for seed in seeds:
        train, development, evaluation = split_states(seed, config)
        pool = development if smoke else evaluation
        book = Codebook(seed)
        receiver = Receiver()
        calibration_rows = calibration(train, book)
        receiver.fit(calibration_rows)
        events.append({"event": "calibration", "seed": seed, "n": len(calibration_rows), "training_state_hash": digest(train)})
        train_pairs = episode_pairs(train, 4 if smoke else config["train_episode_pairs_per_plan"], seed + 10000)
        controller, evaluations = fit_controller(train_pairs, book, receiver, config, deadline)
        parameters = {"receiver": receiver.serial(), "controller": controller.serial(),
                      "plans": [asdict(p) for p in controller.candidates]}
        frozen = digest(parameters)
        (out / f"parameters-{seed}.json").write_text(json.dumps(parameters, separators=(",", ":")) + "\n", encoding="utf-8")
        events.append({"event": "training_complete", "seed": seed, "plan_episode_evaluations": evaluations,
                       "training_pair_hash": digest(train_pairs)})
        events.append({"event": "parameters_frozen", "seed": seed, "sha256": frozen})
        # First evaluation sequence construction occurs after the freeze event.
        orders = [(a, b) for a in range(4) for b in range(6) if a != b]
        schedule = orders * (1 if smoke else config["test_repetitions_per_role_pair"])
        pairs = episode_pairs(pool, len(schedule), seed + 20000)
        sequence_hash = digest(list(zip(pairs, schedule)))
        events.append({"event": "first_evaluation_access", "seed": seed, "split": "development" if smoke else "evaluation",
                       "sequence_sha256": sequence_hash, "loaded_parameter_sha256": frozen})
        for episode, (pair, task_pair) in enumerate(zip(pairs, schedule)):
            if time.perf_counter() > deadline:
                raise TimeoutError("Bounded evaluation deadline exceeded")
            for condition in config["conditions"]:
                rows.extend(trial(pair, task_pair, seed, episode, condition, book, receiver, controller))
        after_hash = digest({"receiver": receiver.serial(), "controller": controller.serial(),
                             "plans": [asdict(p) for p in controller.candidates]})
        if after_hash != frozen:
            raise AssertionError("Evaluation changed learned parameters")
        seed_report = {"seed": seed, "parameters_sha256": frozen, "parameters_after_evaluation_sha256": after_hash,
                       "train_states_sha256": digest(train), "development_states_sha256": digest(development),
                       "evaluation_states_sha256": digest(evaluation), "evaluation_sequence_sha256": sequence_hash,
                       "training_pairs": train_pairs, "evaluation_pairs": pairs, "task_order": schedule,
                       "training_plan_episode_evaluations": evaluations, "calibration_rows": calibration_rows,
                       "selected_plans": {f"{t}:{q}": {"index": controller.choose(t, q),
                                                      "plan": asdict(controller.candidates[controller.choose(t, q)])}
                                          for t, q in sorted(controller.learned)}}
        seeds_report.append(seed_report)
    summary = {"status": "executed synthetic development application", "mode": before["mode"],
               "seeds": seeds_report, "plan_count": len(plans()), "query_rows": len(rows),
               "episode_pairs_per_condition": len(rows) // (2 * len(config["conditions"])),
               "conditions": config["conditions"], "aggregates": aggregate(rows),
               "familiarization_per_episode": {"samples": 6, "source_bits": 12},
               "limits": ["task heads and action grammar hand-designed", "supervised symbolic decoder",
                          "matched attention is an equivalent algorithm, not an independent strong model",
                          "held-out combinations in one authored generator", "no neural, biological or phenomenal evidence",
                          "no confidence head or calibration claim", "source-bit counts are not total compute or metabolism"]}
    (out / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    with (out / "queries.jsonl").open("w", encoding="utf-8", newline="\n") as stream:
        for row in rows:
            stream.write(json.dumps(row, separators=(",", ":")) + "\n")
    with (out / "event-ledger.jsonl").open("w", encoding="utf-8", newline="\n") as stream:
        for event in events:
            stream.write(json.dumps(event, separators=(",", ":")) + "\n")
    with (out / "conditions.csv").open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(summary["aggregates"][0]))
        writer.writeheader()
        writer.writerows(summary["aggregates"])
    traces = {}
    for label, correct in (("success", 1), ("failure", 0)):
        candidate = next((r for r in rows if r["stage"] == 1 and r["correct"] == correct), None)
        traces[label] = None if candidate is None else [r for r in rows if (r["seed"], r["episode"], r["condition"]) == (candidate["seed"], candidate["episode"], candidate["condition"])]
    (out / "example-traces.json").write_text(json.dumps(traces, indent=2) + "\n", encoding="utf-8")
    names = ["summary.json", "queries.jsonl", "event-ledger.jsonl", "conditions.csv", "example-traces.json"] + [f"parameters-{s}.json" for s in seeds]
    manifest = {name: file_hash(out / name) for name in names}
    (out / "ARTIFACTS.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"out": str(out), "query_rows": len(rows), "elapsed_seconds": round(time.perf_counter() - start, 3),
                      "result_bytes": sum((out / name).stat().st_size for name in names), "plan_count": len(plans())}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--smoke", action="store_true")
    args = parser.parse_args()
    run(HERE / args.out, args.smoke)
