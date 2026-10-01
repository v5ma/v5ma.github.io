"""Independent score arithmetic, paired audits, in-memory replay and readout diagnostic."""
from collections import Counter, defaultdict
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
import sys
import time

sys.dont_write_bytecode = True
import episode_application as app

ROOT = app.HERE
OUT = ROOT / "evaluation-01"


def read_json(path):
    return json.loads(path.read_text("utf-8"))


def unpack(n):
    values = []
    for _ in range(6):
        n, remainder = divmod(n, 4)
        values.append(remainder)
    return values


def external_truth(row):
    old, new = [unpack(i) for i in row["world_ids"]]
    cur = old if row["stage"] == 0 else new
    task = row["task"]
    if task < 2:
        return cur[[0, 5][task]]
    if task == 2:
        return sum((cur[c] >= 2) * w for c, w in zip((2, 3, 4), (4, 2, 1)))
    if task == 3:
        return cur[1] * 4 + cur[3]
    if task == 4:
        return old[0] * 4 + old[5]
    return 0 if cur[4] < old[4] else (1 if cur[4] == old[4] else 2)


def variable_spec(task, tick):
    if task < 2:
        return [(tick, (0, 5)[task])]
    if task == 2:
        return [(tick, c) for c in (2, 3, 4)]
    if task == 3:
        return [(tick, c) for c in (1, 3)]
    if task == 4:
        return [(0, c) for c in (0, 5)]
    return [(0, 4), (tick, 4)]


def candidate_answer(task, values):
    if task < 2:
        return values[0]
    if task == 2:
        return 4 * (values[0] >= 2) + 2 * (values[1] >= 2) + (values[2] >= 2)
    if task in (3, 4):
        return 4 * values[0] + values[1]
    return 0 if values[1] < values[0] else (1 if values[1] == values[0] else 2)


def completion_probe(row):
    """Post-hoc fixed-binding MAP readout under a declared independent uniform prior.

    Not the true evaluation-pool posterior; not an information-theoretic ceiling
    for an observer who knows the intervention's inverse binding transformation.
    """
    records = {(r["time"], r["coord"]): r for r in row["assembly_after"]}
    options = []
    for key in variable_spec(row["task"], row["stage"]):
        r = records.get(key)
        if r is None:
            options.append(range(4))
        elif r["fine"]:
            options.append((r["value"],))
        else:
            options.append((2 * r["value"], 2 * r["value"] + 1))
    possibilities = Counter(candidate_answer(row["task"], values) for values in product(*options))
    answer = min(possibilities, key=lambda a: (-possibilities[a], a))
    return answer, possibilities[answer] / sum(possibilities.values())


def main():
    app.lower_priority()
    summary = read_json(OUT / "summary.json")
    config = read_json(ROOT / "CONFIG.json")
    rows = [json.loads(line) for line in (OUT / "queries.jsonl").read_text("utf-8").splitlines()]
    events = [json.loads(line) for line in (OUT / "event-ledger.jsonl").read_text("utf-8").splitlines()]
    checks = {}
    checks["all_artifact_hashes_match"] = all(app.file_hash(OUT / name) == h for name, h in read_json(OUT / "ARTIFACTS.json").items())
    checks["all_input_hashes_match"] = all(app.file_hash(ROOT / name) == h for name, h in read_json(OUT / "BEFORE-RUN.json")["input_sha256"].items())
    checks["row_count"] = len(rows) == 5280 == summary["query_rows"]
    checks["independently_recomputed_targets"] = all(external_truth(r) == r["target"] for r in rows)
    checks["independently_recomputed_scores"] = all(int(r["response"] == external_truth(r)) == r["correct"] for r in rows)
    indexed = {(r["seed"], r["episode"], r["condition"], r["stage"]): r for r in rows}
    base = [r for r in rows if r["condition"] == "learned_assembly"]
    counterpart = lambda r, c: indexed[(r["seed"], r["episode"], c, r["stage"])]
    checks["attention_equal_answers_states_and_costs"] = all(all(r[k] == counterpart(r, "matched_attention")[k] for k in ("response", "assembly_after", "source_bits", "actions")) for r in base)
    checks["inverse_binding_rescue_exact"] = all(r["assembly_after"] == counterpart(r, "binding_inverse_rescue")["assembly_after"] for r in base)
    checks["coarsening_does_not_change_acquired_evidence"] = all(r["actions"] == counterpart(r, "assembly_coarsened")["actions"] for r in base)
    checks["full_record_upper_bound_scores_one"] = all(r["correct"] == 1 for r in rows if r["condition"] == "full_record_upper_bound")
    checks["archive_not_deleted_by_horizon_probe"] = all(r["memory_entries"] == counterpart(r, "current_only_assembly")["memory_entries"] for r in base)
    checks["source_bits_match_sample_actions"] = all(r["source_bits"] == sum(2 if action[3] else 1 for action in r["actions"] if action[0] == "sample") for r in rows)
    checks["assembly_bits_match_serialized_state"] = all(r["assembly_bits"] == sum(2 if x["fine"] else 1 for x in r["assembly_after"]) for r in rows)
    checks["denied_sampling_receives_no_new_values"] = all(r["samples"] == 0 for r in rows if r["stage"] == 1 and r["condition"] == "no_new_sampling_after_change")
    checks["every_seed_has_all_task_orders"] = all(len(s["task_order"]) == 80 and len(set(map(tuple, s["task_order"]))) == 20 for s in summary["seeds"])
    checks["task_switch_each_episode"] = all(a != b for s in summary["seeds"] for a, b in s["task_order"])
    split_ok = freeze_ok = replay_ok = learned_ok = True
    replay_rows = []
    deadline = time.perf_counter() + 30
    for s in summary["seeds"]:
        seed = s["seed"]
        train, dev, test = app.split_states(seed, config)
        tr, dv, te = map(set, (train, dev, test))
        split_ok &= not bool(tr & dv or dv & te or tr & te)
        split_ok &= all(a in tr and b in tr for a, b in s["training_pairs"])
        split_ok &= all(a in te and b in te for a, b in s["evaluation_pairs"])
        split_ok &= not bool(set(map(tuple, s["training_pairs"])) & set(map(tuple, s["evaluation_pairs"])))
        e = [x for x in events if x["seed"] == seed]
        names = [x["event"] for x in e]
        freeze_ok &= names.index("parameters_frozen") < names.index("first_evaluation_access")
        parameters = read_json(OUT / f"parameters-{seed}.json")
        freeze_ok &= app.digest(parameters) == s["parameters_sha256"] == s["parameters_after_evaluation_sha256"]
        book, receiver = app.Codebook(seed), app.Receiver()
        receiver.fit(app.calibration(train, book))
        controller, n = app.fit_controller(s["training_pairs"], book, receiver, config, deadline)
        rebuilt = {"receiver": receiver.serial(), "controller": controller.serial(), "plans": [app.asdict(p) for p in controller.candidates]}
        replay_ok &= app.digest(rebuilt) == app.digest(parameters)
        learned_ok &= len(receiver.associations) == 12 and n == 80000
        learned_ok &= any(v["utility"] != 0 for estimates in controller.learned.values() for v in estimates)
        for episode, (pair, tasks) in enumerate(zip(s["evaluation_pairs"], s["task_order"])):
            for condition in config["conditions"]:
                replay_rows.extend(app.trial(pair, tasks, seed, episode, condition, book, receiver, controller))
    checks["training_and_evaluation_states_and_sequences_disjoint"] = bool(split_ok)
    checks["freeze_precedes_access_and_parameters_unchanged"] = bool(freeze_ok)
    checks["learned_associations_and_nonzero_value_estimates"] = bool(learned_ok)
    # JSON arrays deserialize as lists, while live Plan.coords is a tuple.
    # Compare the data in its declared JSON format, not Python container types.
    checks["complete_training_and_evaluation_replay_matches"] = bool(replay_ok and app.digest(replay_rows) == app.digest(rows))
    replay_bytes = "".join(json.dumps(r, separators=(",", ":")) + "\n" for r in replay_rows).encode()
    checks["replay_serialization_matches_exact_bytes"] = sha256(replay_bytes).hexdigest() == app.file_hash(OUT / "queries.jsonl")
    checks["all_aggregates_recomputed"] = app.aggregate(rows) == summary["aggregates"]
    groups = defaultdict(list)
    for row in rows:
        if row["stage"] == 1:
            answer, conditional = completion_probe(row)
            groups[(row["condition"], row["task"])].append((row["correct"], int(answer == row["target"]), conditional))
    diagnostic = []
    for (condition, task), values in sorted(groups.items()):
        n = len(values)
        diagnostic.append({"condition": condition, "task": task, "task_name": app.TASK_NAMES[task], "n": n,
                           "original_head_accuracy": sum(v[0] for v in values) / n,
                           "posthoc_uniform_completion_accuracy": sum(v[1] for v in values) / n,
                           "uniform_prior_conditional_MAP_success_mean": sum(v[2] for v in values) / n})
    # An independent exact computation on all 16 fine old/new values checks the
    # nontrivial coarse temporal-order boundary under the declared uniform prior.
    correct = 0
    for old, new in product(range(4), repeat=2):
        row = {"task": 5, "stage": 1, "assembly_after": [
            {"time": 0, "coord": 4, "fine": False, "value": old // 2},
            {"time": 1, "coord": 4, "fine": False, "value": new // 2}]}
        predicted, _ = completion_probe(row)
        truth = 0 if new < old else (1 if new == old else 2)
        correct += int(predicted == truth)
    checks["coarse_temporal_order_uniform_MAP_is_12_of_16"] = correct == 12
    report = {"checks": checks, "passed": sum(checks.values()), "total": len(checks),
              "query_rows_replayed": len(replay_rows), "replay_query_sha256": sha256(replay_bytes).hexdigest(),
              "posthoc_completion_diagnostic": diagnostic,
              "diagnostic_boundary": "Post-hoc alternate fixed-binding readout, not an independent confirmatory endpoint. Assumes uniform independent coordinates, not the empirical held-out pool. A known invertible binding/time relabeling can instead be undone; fixed-readout failure is not information destruction.",
              "verifier_source_sha256": app.file_hash(__file__)}
    (OUT / "VERIFICATION.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"passed": report["passed"], "total": report["total"], "query_rows_replayed": len(replay_rows),
                      "coarse_temporal_order_uniform_MAP": correct / 16}))
    if not all(checks.values()):
        raise SystemExit("Verification failed: " + ", ".join(k for k, v in checks.items() if not v))


if __name__ == "__main__":
    main()
