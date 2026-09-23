"""Read-only checks of frozen applications; only the named new JSON is written.

No fitting, test selection, downloads, directory scans or source mutation.
Use a new output filename for every invocation; existing results are not replaced.
"""
from pathlib import Path
import hashlib
import importlib
import json
import os
import sys
import time

sys.dont_write_bytecode = True
for key in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[key] = "1"

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
ACTIVE = ROOT / "applications/active-episode-tree-v01"
CONTEXT = ROOT / "applications/context-episode-v03"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(condition, message):
    if not bool(condition):
        raise AssertionError(message)


def frozen_inputs():
    paths = [
        ROOT / "drafts/FINAL-DRAFT-PRIVATE-HIGHER-TIER-REVIEW-20260923.md",
        ROOT / "output/pdf/composition-granularity-final-draft-private-review-20260923.pdf",
        ROOT / "applications/ordered-event-benchmark-v03/check-01/episodes.csv",
        ACTIVE / "fit-01/FROZEN.json",
        ACTIVE / "heldout-01/RESULT.json",
        ACTIVE / "heldout-01/predictions.npz",
    ]
    active = read(ACTIVE / "fit-01/FROZEN.json")
    for name, expected in active["source_hashes"].items():
        path = ACTIVE / name
        check(sha(path) == expected, "Changed frozen active source: " + name)
        paths.append(path)
    for model in active["models"]:
        if model["family"] == "paired":
            path = ACTIVE / "fit-01" / model["name"]
            check(sha(path) == model["sha256"], "Changed frozen paired model")
            paths.append(path)
    result = read(ACTIVE / "heldout-01/RESULT.json")
    check(sha(ACTIVE / "heldout-01/predictions.npz") == result["files"]["predictions.npz"]["sha256"],
          "Changed historical evaluation archive")
    for seed in (1729, 3253, 7919):
        folder = CONTEXT / ("fit-" + str(seed) + "-additive")
        receipt = read(folder / "FROZEN.json")
        paths.extend((folder / "FROZEN.json", folder / "selected.npz"))
        check(sha(folder / "selected.npz") == receipt["files"]["selected.npz"]["sha256"],
              "Changed selected additive weights")
        for name, expected in receipt["source_hashes"].items():
            path = CONTEXT / name
            check(sha(path) == expected, "Changed frozen context source: " + name)
            paths.append(path)
    return sorted(set(paths))


def active_request_contract():
    sys.path.insert(0, str(ACTIVE))
    common = importlib.import_module("common")
    agent_module = importlib.import_module("agent")
    np = common.np
    priority = common.low_priority()
    fixtures = []
    for seed in (1543, 4253, 8089):
        models = read(ACTIVE / "fit-01" / ("s" + str(seed) + "-paired.json"))["trees"]
        check(models[5]["features"] == [8, 21], "Unexpected frozen relation root")
        for present in (False, True):
            agent = agent_module.Agent(models, "paired")
            agent.switch()
            if present:
                agent.reference[4] = (1, 0)
            calls = []

            def observe(index, granularity):
                calls.append([index, granularity])
                return 3

            _, detail = agent.query(5, observe)
            actions = [list(a) for a in detail["actions"]]
            expected = [[8, 1, 0], [21, 0, 3]] if present else [[8, 2, -1]]
            check(actions == expected, "Request trace violates declared availability contract")
            check(calls == ([[4, 2]] if present else []), "Wrong observation calls")
            check(detail["counts"]["sampling_bits"] == (2 if present else 0), "Wrong acquired-bit cost")
            check(detail["counts"]["samples"] == int(present), "Wrong sample count")
            check(detail["counts"]["retrievals"] == int(present), "Wrong retrieval count")
            check(detail["counts"]["unavailable"] == int(not present), "Wrong unavailable count")
            fixtures.append({"seed": seed, "old_coarse_present": present, "actions": actions,
                             "sensor_calls": calls, "counts": detail["counts"]})

    result = read(ACTIVE / "heldout-01/RESULT.json")
    ci = result["conditions"].index("paired")
    count_names = result["count_columns"]
    with np.load(ACTIVE / "heldout-01/predictions.npz", allow_pickle=False) as archive:
        meta, counts, actions = (archive[name] for name in ("meta", "counts", "actions"))
        temporal = (meta[:, 1] == ci) & (meta[:, 5] == 1) & (meta[:, 6] == 5)
        missing = temporal & (counts[:, count_names.index("unavailable")] == 1)
        check(int(temporal.sum()) == 384 and int(missing.sum()) == 240, "Unexpected historical counts")
        missing_actions = actions[missing]
        check(np.all(missing_actions[:, 0] == np.array([8, 2, -1])), "Unexpected first action")
        check(np.all(missing_actions[:, 1:, 0] == -1), "A second request occurred after unavailability")
        check(np.all(counts[missing, count_names.index("sampling_bits")] == 0), "Unavailable cases acquired bits")
        metrics = {}
        for condition in ("paired", "fine"):
            subset = (meta[:, 1] == result["conditions"].index(condition)) & (meta[:, 5] == 1)
            metrics[condition] = {
                "records": int(subset.sum()),
                "accuracy": float((meta[subset, 7] == meta[subset, 8]).mean()),
                "nominal_acquired_bits": float(counts[subset, count_names.index("sampling_bits")].mean()),
            }
    sys.path.pop(0)
    for name in ("common", "agent", "tree"):
        sys.modules.pop(name, None)
    return {"priority": priority, "fixtures": fixtures, "temporal_query_two_records": 384,
            "unavailable_first_view_records": 240, "historical_metrics": metrics,
            "interpretation": "Sequential requests abort on unavailable first view; no second acquisition cost is incurred."}


def adapter_contract():
    sys.path.insert(0, str(CONTEXT))
    net = importlib.import_module("net")
    core = importlib.import_module("gru_core")
    world = importlib.import_module("world")
    np = net.np
    data = world.load("training")
    data = {name: value[:8] for name, value in data.items()}
    x, q, _ = world.inputs(data)
    modes = {"recorded_one_hot_roles": x.copy(), "all_zero_roles": x.copy(), "mixed_zero_and_one_hot": x.copy()}
    modes["all_zero_roles"][:, :, 11:] = 0
    modes["mixed_zero_and_one_hot"][:, ::2, 11:] = 0
    records = []
    for seed in (1729, 3253, 7919):
        path = CONTEXT / ("fit-" + str(seed) + "-additive") / "selected.npz"
        with np.load(path, allow_pickle=False) as archive:
            p = {key: archive[key].copy() for key in archive.files}
        folded = {key: value.copy() for key, value in p.items() if key not in ("Wadapter", "badapter")}
        a0 = 0.5 * np.tanh(p["badapter"])
        ag = 0.5 * np.tanh(p["Wadapter"] + p["badapter"])
        for gate in ("z", "r", "n"):
            physical = p["W" + gate][:11]
            folded["W" + gate][11:] += (ag - a0) @ physical
            folded["b" + gate] += a0 @ physical
        for name, value in modes.items():
            for reset in (False, True):
                original, _, state_original = net.forward(p, value, q, "additive", reset)
                absorbed, _, state_absorbed = core.forward(folded, value, q, reset)
                probability_error = float(np.max(np.abs(original - absorbed)))
                state_error = float(np.max(np.abs(state_original - state_absorbed)))
                check(probability_error < 1e-12 and state_error < 1e-12, "Absorption diagnostic failed")
                check(np.array_equal(original.argmax(axis=-1), absorbed.argmax(axis=-1)), "Changed class decision")
                records.append({"seed": seed, "role_tokens": name, "reset_at_switch": reset,
                                "max_probability_difference": probability_error, "max_snapshot_difference": state_error})
        check(sum(v.size for v in p.values()) == 14141, "Unexpected allocated count")
        check(sum(v.size for v in folded.values()) == 14064, "Unexpected no-adapter count")
    sys.path.pop(0)
    return {"records": records, "models": 3, "input_episodes_per_mode": 8,
            "forward_comparisons": len(records), "parameters_before": 14141, "parameters_after": 14064,
            "max_probability_difference": max(r["max_probability_difference"] for r in records),
            "max_snapshot_difference": max(r["max_snapshot_difference"] for r in records),
            "scope": "Fixed-weight functional equivalence on zero or one-hot role tokens; not equality of optimization paths or a new learned baseline."}


def main():
    if len(sys.argv) != 2 or Path(sys.argv[1]).name != sys.argv[1] or not sys.argv[1].endswith(".json"):
        raise SystemExit("Use a new output filename.json in this diagnostic directory")
    out = HERE / sys.argv[1]
    if out.exists():
        raise SystemExit("Refusing to replace an existing diagnostic result")
    started = time.perf_counter()
    paths = frozen_inputs()
    before = {str(path.relative_to(ROOT)).replace("\\", "/"): sha(path) for path in paths}
    active = active_request_contract()
    adapter = adapter_contract()
    after = {str(path.relative_to(ROOT)).replace("\\", "/"): sha(path) for path in paths}
    check(before == after, "An original file changed during the diagnostic")
    output = {"complete": True, "script_sha256": sha(Path(__file__)), "seconds": time.perf_counter() - started,
              "request_contract": active, "adapter_contract": adapter, "original_file_hashes": before,
              "originals_unchanged": before == after, "scope": "Bounded diagnostic; no training or new scientific performance evaluation."}
    with out.open("x", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2, allow_nan=False)
        handle.write("\n")
    print(json.dumps({"output": str(out), "seconds": output["seconds"], "fixtures": len(active["fixtures"]),
                      "forward_comparisons": adapter["forward_comparisons"],
                      "max_probability_difference": adapter["max_probability_difference"],
                      "max_snapshot_difference": adapter["max_snapshot_difference"],
                      "originals_unchanged": True}, indent=2))


if __name__ == "__main__":
    main()
