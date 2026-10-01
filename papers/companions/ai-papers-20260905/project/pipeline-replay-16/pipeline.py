"""Fixed 49-step offline replay controller; one explicit operation per invocation."""

import argparse
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time


HERE = Path(__file__).resolve().parent
ANCHOR = "PACKAGE-MANIFEST-FIT-REPRODUCTION-15.json"
ANCHOR_SHA = "f37ce90d2f51b6016725d14864b16b51f6ad23e03a1e9a128124c18c10c4f36e"
HELPER_SHA = "d7712e17c4bd26ee69cd326634bec5201f63b18c58021d3c9c763dc0b611476a"
helper_path = HERE / "native_launcher.py"
if not helper_path.is_file():
    helper_path = HERE.parent / "native-replay-12/attempt-02/replay.py"
import hashlib
with helper_path.open("rb") as stream:
    if hashlib.file_digest(stream, "sha256").hexdigest() != HELPER_SHA:
        raise ValueError("Original replay utility identity changed")
spec = importlib.util.spec_from_file_location("native_launcher_frozen", helper_path)
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)

PREP = "results/qwen35-learning-10-prepared"
FIT = "results/qwen35-learning-10-fit"
REVIEW = "reviews/qwen35-learning-10"
APP = "applications/qwen35_learning_v10.py"
AUDITOR = "applications/audit_qwen35_learning_v10.py"
REQUIRED = [AUDITOR, "applications/test_qwen35_v9.py", "applications/test_qwen35_hybrid_v9.py",
            "applications/PROTOCOL-QWEN35-BASELINE-09.json", "applications/PROTOCOL-QWEN35-HYBRID-09.json",
            h.MODEL_REL + "/GRAPH-INSPECTION.json"]


def recipe():
    steps = [{"kind": "tests", "command": ["-m", "unittest", "test_qwen35_v9", "test_qwen35_hybrid_v9", "test_qwen35_learning_v10", "-v"]},
             {"kind": "prepare", "command": [APP, "prepare"], "output": PREP}]
    steps += [{"kind": "train", "index": i, "command": [APP, "train", "--index", str(i)],
               "output": f"results/qwen35-learning-10-train-{i}"} for i in range(6)]
    steps += [{"kind": "fit", "command": [APP, "fit"], "output": FIT},
              {"kind": "fit_audit", "command": [AUDITOR, "fit"], "output": REVIEW + "/FIT-EQUATION-AUDIT.json"}]
    steps += [{"kind": "test", "index": i, "command": [APP, "test", "--index", str(i)],
               "output": f"results/qwen35-learning-10-test-{i}"} for i in range(16)]
    steps += [{"kind": "trace", "command": [AUDITOR, "trace"], "output": REVIEW + "/TRACE-AUDIT.json"}]
    for split, count in (("train", 6), ("test", 16)):
        steps += [{"kind": "native_audit", "split": split, "index": i,
                   "command": [AUDITOR, "native", "--split", split, "--index", str(i)],
                   "output": f"{REVIEW}/native-{split}-{i}"} for i in range(count)]
    return [{"step": i, **step} for i, step in enumerate(steps)]


def specifications(manifest, read_original):
    old = {r["path"]: r for r in manifest["files"]}
    h.require(len(old) == 1077, "Wrong reviewed source count")
    selected = {}

    def add(group, source, destination, row):
        h.relative(source); h.relative(destination)
        item = {"group": group, "source": source, "path": destination, "bytes": row["bytes"], "sha256": row["sha256"]}
        h.require(0 <= item["bytes"] <= 500000000, "Member size ceiling")
        h.require(destination not in selected or selected[destination] == item, "Conflicting selected member")
        selected[destination] = item

    def project(name, reference=False):
        add("project", name, ("reference/" if reference else "") + name, old[name])

    def reference_folder(folder, receipt_name="RECEIPT.json"):
        name = folder + "/" + receipt_name
        project(name, True)
        receipt = read_original(name)
        h.require(len(receipt["files"]) <= 8, "Unexpected receipt file set size")
        for file, digest in receipt["files"].items():
            path = folder + "/" + file
            h.require(old[path]["sha256"] == digest, "Original receipt/manifest identity mismatch")
            project(path, True)

    frozen = read_original(PREP + "/INPUT-FREEZE.json")
    h.require(len(frozen) == 10, "Unexpected original input closure")
    for name, digest in frozen.items():
        h.require(old[name]["sha256"] == digest, "Original input freeze mismatch")
        project(name)
    for name in REQUIRED:
        project(name)
    reference_folder(PREP, "PREPARATION-RECEIPT.json")
    reference_folder(FIT)
    for i in range(6):
        reference_folder(f"results/qwen35-learning-10-train-{i}")
    for i in range(16):
        reference_folder(f"results/qwen35-learning-10-test-{i}")
    for name in ("FIT-EQUATION-AUDIT.json", "METRICS.json", "GROUPS.json", "STRATA.json", "AUDIT-INPUTS.json", "TRACE-AUDIT.json", "TEST-RECEIPT.json"):
        project(REVIEW + "/" + name, True)
    for split, count in (("train", 6), ("test", 16)):
        for i in range(count):
            project(f"{REVIEW}/native-{split}-{i}/RECEIPT.json", True)
    for receipt in ("GRAPH-INTAKE-RECEIPT.json", "WEIGHTS-INTAKE-RECEIPT.json"):
        for row in read_original(h.MODEL_REL + "/" + receipt)["files"]:
            add("model", row["path"], h.MODEL_REL + "/" + row["path"], row)
    runtime = read_original(h.RUNTIME_REL + "/INTAKE-RECEIPT.json")
    h.require(runtime["isolated_runtime_version"] == "1.29.0" and len(runtime["extracted_files"]) == 323, "Wrong runtime closure")
    for row in runtime["extracted_files"]:
        add("runtime", row["path"], h.RUNTIME_REL + "/" + row["path"], row)
    rows = sorted(selected.values(), key=lambda row: row["path"])
    h.require(len(rows) < 550 and sum(r["bytes"] for r in rows) < 820000000, "Pipeline input ceiling exceeded")
    h.require(not any(r["path"].startswith("results/") or r["path"].startswith("reviews/") for r in rows), "Old result selected into fresh output tree")
    return rows


def make_plan(project, model, runtime):
    roots = {k: str(Path(v).resolve(strict=True)) for k, v in (("project", project), ("model", model), ("runtime", runtime))}
    anchor = h.at(roots["project"], ANCHOR)
    h.require(h.digest(anchor) == ANCHOR_SHA, "Wrong source anchor")
    manifest = h.load(anchor)

    def read_original(name):
        row = next(r for r in manifest["files"] if r["path"] == name)
        h.matches(h.at(roots["project"], name), row)
        return h.load(h.at(roots["project"], name))

    rows = specifications(manifest, read_original)
    for row in rows:
        h.matches(h.at(roots[row["group"]], row["source"]), row, full=False)
    return {"schema": "san-full-learned-pipeline/v1", "source_manifest_sha256": ANCHOR_SHA,
            "source_roots": roots, "files": rows, "steps": recipe(), "expected_environment": h.ENVIRONMENT,
            "controller_sha256": h.digest(__file__), "bootstrap_sha256": h.digest(HERE / "child_bootstrap.py"),
            "utility_sha256": HELPER_SHA, "total_referenced_bytes": sum(r["bytes"] for r in rows),
            "project_copy_bytes": sum(r["bytes"] for r in rows if r["group"] == "project"),
            "native_steps": 44, "numerical_threads": 1, "downloads": 0,
            "purpose": "Complete fixed-study reproduction, not new scientific samples or tuning"}


def metadata(path):
    data = path.stat()
    return [data.st_size, data.st_mtime_ns, data.st_dev, data.st_ino]


def stage(plan, workspace, mode="link"):
    workspace = Path(workspace).resolve()
    h.require(not workspace.exists() and workspace.parent.is_dir(), "Workspace must be a new directory under an existing parent")
    h.require(mode in ("link", "copy"), "Unknown dependency mode")
    roots = {k: Path(v).resolve(strict=True) for k, v in plan["source_roots"].items()}
    h.require(all(workspace != p and not p.is_relative_to(workspace) for p in roots.values()), "Workspace cannot contain original roots")
    h.require(plan == make_plan(roots["project"], roots["model"], roots["runtime"]), "Stale or altered plan")
    required_space = plan["project_copy_bytes"] + 200000000
    if mode == "copy":
        required_space += sum(r["bytes"] for r in plan["files"] if r["group"] != "project")
    h.require(shutil.disk_usage(workspace.parent).free >= required_space, "Insufficient declared-workspace space")
    for row in plan["files"]:
        source = h.at(roots[row["group"]], row["source"])
        h.matches(source, row)
        if mode == "link" and row["group"] != "project":
            h.require(source.stat().st_dev == workspace.parent.stat().st_dev, "Dependency links require same volume")
    workspace.mkdir()
    control = workspace / "control"
    control.mkdir(); (control / "steps").mkdir()
    (workspace / "results").mkdir(); (workspace / "reviews").mkdir()
    h.save(control / "PLAN.json", plan)
    for source, target in ((roots["project"] / ANCHOR, control / "SOURCE-MANIFEST.json"),
                           (Path(__file__), control / "pipeline.py"), (HERE / "child_bootstrap.py", control / "child_bootstrap.py"),
                           (helper_path, control / "native_launcher.py")):
        with source.open("rb") as incoming, target.open("xb") as outgoing:
            shutil.copyfileobj(incoming, outgoing)
    for row in plan["files"]:
        source = h.at(roots[row["group"]], row["source"])
        target = h.at(workspace, row["path"])
        target.parent.mkdir(parents=True, exist_ok=True)
        if mode == "link" and row["group"] != "project":
            os.link(source, target)
        else:
            with source.open("rb") as incoming, target.open("xb") as outgoing:
                shutil.copyfileobj(incoming, outgoing, length=1024*1024)
            h.require(not source.samefile(target), "Project/reference copy aliases original")
        h.matches(target, row)
    stats = {r["path"]: metadata(h.at(workspace, r["path"])) for r in plan["files"] if r["group"] != "project"}
    h.save(control / "DEPENDENCY-METADATA.json", stats)
    receipt = {"status": "STAGED_ALL_INPUT_HASHES_CHECKED_NO_STEPS_RUN", "files": len(plan["files"]),
               "plan_sha256": h.digest(control / "PLAN.json"), "dependency_mode": mode,
               "dependency_metadata_sha256": h.digest(control / "DEPENDENCY-METADATA.json"),
               "controller_sha256": h.digest(__file__), "bootstrap_sha256": h.digest(HERE / "child_bootstrap.py"),
               "source_anchor_sha256": ANCHOR_SHA, "steps_run": 0}
    h.save(control / "STAGE-RECEIPT.json", receipt)
    return receipt


def inputs_ok(workspace, full=False):
    control = workspace / "control"
    plan = h.load(control / "PLAN.json"); receipt = h.load(control / "STAGE-RECEIPT.json")
    h.require(plan["schema"] == "san-full-learned-pipeline/v1" and plan["steps"] == recipe(), "Pipeline recipe changed")
    h.require(plan["expected_environment"] == h.ENVIRONMENT, "Environment contract changed")
    h.require(receipt["plan_sha256"] == h.digest(control / "PLAN.json"), "Plan identity drift")
    h.require(plan["controller_sha256"] == receipt["controller_sha256"] == h.digest(__file__) == h.digest(control / "pipeline.py"), "Controller identity drift")
    h.require(plan["bootstrap_sha256"] == h.digest(control / "child_bootstrap.py"), "Bootstrap identity drift")
    h.require(h.digest(control / "native_launcher.py") == HELPER_SHA, "Utility identity drift")
    h.require(h.digest(control / "SOURCE-MANIFEST.json") == ANCHOR_SHA, "Source anchor drift")
    manifest = h.load(control / "SOURCE-MANIFEST.json")
    def read_original(name):
        return h.load(h.at(workspace, ("reference/" if name.startswith(("results/", "reviews/")) else "") + name))
    h.require(specifications(manifest, read_original) == plan["files"], "Plan differs from pinned input closure")
    h.require(receipt["dependency_metadata_sha256"] == h.digest(control / "DEPENDENCY-METADATA.json"), "Dependency metadata identity drift")
    prior = h.load(control / "DEPENDENCY-METADATA.json")
    for row in plan["files"]:
        path = h.at(workspace, row["path"])
        if full or row["group"] == "project":
            h.matches(path, row)
        else:
            h.require(metadata(path) == prior[row["path"]], "Dependency metadata changed; stop for full inspection")
    return plan


def same_except(got, original, excluded=()):
    h.require(set(got) == set(original), "Result schema changed")
    h.require({k: v for k, v in got.items() if k not in excluded} ==
              {k: v for k, v in original.items() if k not in excluded}, "Unpermitted result content changed")


def checked_receipt(workspace, folder, name="RECEIPT.json"):
    result = h.load(h.at(workspace, folder + "/" + name))
    for file, expected in result["files"].items():
        h.relative(file)
        h.require("/" not in file, "Unexpected nested output artifact")
        h.require(h.digest(h.at(workspace, folder + "/" + file)) == expected, "New receipt does not match its artifacts")
    if "resource" in result:
        r = result["resource"]
        h.require(r["numerical_threads"] == 1 and 0 <= r["elapsed_seconds"] < 75 and
                  r["peak_commit_bytes"] < 5500000000 and r["initial"]["available_ram_bytes"] >= 8000000000,
                  "Original process exceeded its declared resource acceptance")
    return result


def outputs_ok(workspace, step):
    files, exact = [], []
    def add(name):
        h.require(name not in files, "Duplicate result validation path")
        path = h.at(workspace, name)
        h.require(path.is_file(), "Missing step result")
        files.append(name)
    def equal_file(name):
        add(name)
        h.require(h.digest(h.at(workspace, name)) == h.digest(h.at(workspace, "reference/" + name)), "Deterministic artifact changed: " + name)
        exact.append(name)
    def original(name):
        return h.load(h.at(workspace, "reference/" + name))
    def current(name):
        add(name)
        return h.load(h.at(workspace, name))
    def ancestry_map(kind, count, canonical):
        result = {}
        for i in range(count):
            folder = f"results/qwen35-learning-10-{kind}-{i}"
            key = (folder + "/RECEIPT.json") if canonical else (str(Path(folder)) + "/RECEIPT.json" if kind == "train" else str(Path(folder) / "RECEIPT.json"))
            result[key] = h.digest(h.at(workspace, folder + "/RECEIPT.json"))
        return result
    kind = step["kind"]
    if kind == "tests":
        log = (workspace / "control/steps/00/STDERR.txt").read_text(encoding="utf-8")
        h.require("Ran 23 tests" in log and "\nOK" in log, "Qwen test result did not pass 23 tests")
    elif kind == "prepare":
        receipt = checked_receipt(workspace, PREP, "PREPARATION-RECEIPT.json")
        for name in [*receipt["files"], "PREPARATION-RECEIPT.json"]:
            equal_file(PREP + "/" + name)
    elif kind in ("train", "fit", "test"):
        folder = step["output"]
        new = checked_receipt(workspace, folder)
        previous = original(folder + "/RECEIPT.json")
        add(folder + "/RECEIPT.json")
        excluded = {"resource"}
        if kind in ("fit", "test"):
            excluded.add("files")
        if kind == "test":
            excluded.add("fit_receipt_sha256")
            h.require(new["fit_receipt_sha256"] == h.digest(workspace / FIT / "RECEIPT.json"), "Test does not bind new fit")
        same_except(new, previous, excluded)
        h.require(set(new["files"]) == set(previous["files"]), "Artifact coverage changed")
        h.require(new["prepared_receipt_sha256"] == h.digest(workspace / PREP / "PREPARATION-RECEIPT.json"), "New preparation ancestry missing")
        for name in new["files"]:
            path = folder + "/" + name
            if kind == "fit" and name == "TRAINING-INPUTS.json":
                h.require(current(path) == ancestry_map("train", 6, False), "Fit does not bind all new training receipts")
            elif kind == "test" and name == "POLICY-COMMITMENT.json":
                value = current(path)
                same_except(value, original(path), {"fit_receipt_sha256"})
                h.require(value["fit_receipt_sha256"] == h.digest(workspace / FIT / "RECEIPT.json"), "Policy does not bind new fit")
            else:
                equal_file(path)
    elif kind == "fit_audit":
        value = current(step["output"])
        same_except(value, original(step["output"]), {"training_receipts", "fit_receipt_sha256"})
        h.require(value["training_receipts"] == ancestry_map("train", 6, True), "Equation audit training ancestry mismatch")
        h.require(value["fit_receipt_sha256"] == h.digest(workspace / FIT / "RECEIPT.json"), "Equation audit fit ancestry mismatch")
    elif kind == "trace":
        for name in ("METRICS.json", "GROUPS.json", "STRATA.json"):
            equal_file(REVIEW + "/" + name)
        h.require(current(REVIEW + "/AUDIT-INPUTS.json") == ancestry_map("test", 16, False), "Trace does not bind new test receipts")
        value = current(step["output"])
        same_except(value, original(step["output"]), {"summed_model_process_seconds", "max_process_commit_bytes"})
        sources = [h.load(workspace / f"results/qwen35-learning-10-test-{i}/RECEIPT.json") for i in range(16)]
        h.require(value["summed_model_process_seconds"] == sum(r["resource"]["elapsed_seconds"] for r in sources), "Trace time does not match new sources")
        h.require(value["max_process_commit_bytes"] == max(r["resource"]["peak_commit_bytes"] for r in sources), "Trace memory does not match new sources")
    else:
        path = step["output"] + "/RECEIPT.json"
        value = current(path)
        same_except(value, original(path), {"resource", "source_receipt_sha256"})
        source = f"results/qwen35-learning-10-{step['split']}-{step['index']}/RECEIPT.json"
        h.require(value["source_receipt_sha256"] == h.digest(workspace / source), "Native auditor source ancestry mismatch")
        r = value["resource"]
        h.require(r["numerical_threads"] == 1 and r["elapsed_seconds"] < 75 and r["peak_commit_bytes"] < 5500000000,
                  "Native auditor resource bound mismatch")
    return {"validated_files": [{"path": n, "bytes": (workspace / n).stat().st_size, "sha256": h.digest(workspace / n)} for n in files],
            "byte_identical_reference_artifacts": exact, "new_ancestry_checked": True}


def completed(workspace, plan):
    records = []
    for step in plan["steps"]:
        folder = workspace / "control/steps" / f"{step['step']:02d}"
        if not (folder / "COMPLETE.json").exists():
            break
        record = h.load(folder / "COMPLETE.json")
        h.require(record["step"] == step and record["returncode"] == 0, "Completed step identity changed")
        h.require(record["outputs"] == outputs_ok(workspace, step), "Completed step output drift")
        h.require(record["bootstrap_receipt_sha256"] == h.digest(folder / "BOOTSTRAP-RECEIPT.json"), "Bootstrap receipt drift")
        records.append(record)
    return records


def run_step(workspace, index, execute):
    h.require(execute, "A single pipeline step requires explicit --execute")
    workspace = Path(workspace).resolve(strict=True)
    h.require(type(index) is int and 0 <= index < 49, "Unknown step index")
    env_info = h.environment()
    h.require(env_info["windows_x64"] and env_info["version_match"] and env_info["assertions_enabled"], "Recorded environment required")
    with h.WindowsSerialLease():
        plan = inputs_ok(workspace)
        earlier = completed(workspace, plan)
        h.require(index == len(earlier), "Execute only the first uncompleted step")
        step = plan["steps"][index]
        folder = workspace / "control/steps" / f"{index:02d}"
        h.require(not folder.exists(), "Step already attempted; preserve it and inspect")
        if "output" in step:
            h.require(not (workspace / step["output"]).exists(), "Original-script output already exists")
        folder.mkdir()
        env = dict(os.environ)
        for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
            env[key] = "1"
        env["PYTHONDONTWRITEBYTECODE"] = "1"; env["TOKENIZERS_PARALLELISM"] = "false"
        for key in ("PYTHONPATH", "PYTHONOPTIMIZE", "PYTHONNOUSERSITE"):
            env.pop(key, None)
        h.save(folder / "REQUEST.json", {"step": step, "controller_sha256": h.digest(__file__), "environment": h.child_environment(env), "explicit_execution": True})
        command = [sys.executable, "-B", str(workspace / "control/child_bootstrap.py"), "--workspace", str(workspace), "--step", str(index)]
        started = time.monotonic()
        with (folder / "STDOUT.txt").open("x", encoding="utf-8") as stdout, (folder / "STDERR.txt").open("x", encoding="utf-8") as stderr:
            child = subprocess.Popen(command, cwd=workspace, env=env, stdout=stdout, stderr=stderr, creationflags=subprocess.CREATE_NO_WINDOW)
            h.save(folder / "CHILD-PROCESS.json", {"pid": child.pid, "step": index, "created_unix_seconds": time.time(), "command": command})
            try:
                code = child.wait(timeout=95)
            except subprocess.TimeoutExpired:
                child.kill(); child.wait(timeout=5)
                h.save(folder / "FAILURE.json", {"status": "OUTER_TIMEOUT_CHILD_TERMINATED", "step": index, "seconds": 95})
                raise
        h.require(code == 0, "Original step failed; retain logs and partial outputs")
        bootstrap = h.load(folder / "BOOTSTRAP-RECEIPT.json")
        h.require(bootstrap["status"] == "COMPLETE_ORIGINAL_ENTRY_POINT" and bootstrap["step"] == step, "Bootstrap readback missing")
        record = {"step": step, "returncode": code, "wall_seconds": time.monotonic() - started,
                  "bootstrap_receipt_sha256": h.digest(folder / "BOOTSTRAP-RECEIPT.json"),
                  "outputs": outputs_ok(workspace, step), "independent_review": False}
        h.save(folder / "COMPLETE.json", record)
        return {"step": index, "kind": step["kind"], "status": "VERIFIED_COMPLETE", "elapsed_seconds": record["wall_seconds"],
                "completed_steps": index+1, "total_steps": 49, "byte_identical_artifacts": len(record["outputs"]["byte_identical_reference_artifacts"])}


def finish(workspace):
    workspace = Path(workspace).resolve(strict=True)
    h.require(not (workspace / "control/FINAL-RECEIPT.json").exists(), "Final receipt already exists")
    plan = inputs_ok(workspace, full=True)
    done = completed(workspace, plan)
    h.require(len(done) == 49, "Full pipeline is not complete")
    native = [s for s in plan["steps"] if s["kind"] in ("train", "test", "native_audit")]
    receipts = [h.load(workspace / s["output"] / "RECEIPT.json") for s in native]
    record = {"status": "PASS_FULL_FIXED_LEARNED_PIPELINE_CURRENT_HOST_NOT_INDEPENDENT_REVIEW", "steps": 49,
              "native_model_processes": len(native), "native_decoder_calls": sum(r["native_calls"] for r in receipts),
              "new_training_prefixes_reproduced": 24, "training_answers_reproduced": 72,
              "test_answers_reproduced": 384, "workflow_answers_reproduced": 9,
              "separate_code_reconstructed_answers": sum(r["exact_generated_answers_and_first_logits"] for r in receipts if "exact_generated_answers_and_first_logits" in r),
              "native_seconds": sum(r["resource"]["elapsed_seconds"] for r in receipts),
              "maximum_native_commit_bytes": max(r["resource"]["peak_commit_bytes"] for r in receipts),
              "qwen_construction_tests": 23, "new_scientific_samples": 0, "new_lean_statements": 0,
              "ordinary_research_fits": 1, "small_unit_fixture_fits": 2, "downloads": 0,
              "source_manifest_sha256": ANCHOR_SHA, "controller_sha256": h.digest(__file__),
              "all_declared_dependency_hashes_rechecked": True,
              "independent_review": False, "another_host_or_os": False, "publication": False,
              "limits": "One original fixed learned-Qwen study, not all earlier experiment families or scientific/author/release acceptance"}
    h.save(workspace / "control/FINAL-RECEIPT.json", record)
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="mode", required=True)
    p = sub.add_parser("plan")
    for name in ("project", "model", "runtime", "save"):
        p.add_argument("--"+name, required=True)
    p = sub.add_parser("stage"); p.add_argument("--plan", required=True); p.add_argument("--workspace", required=True)
    p.add_argument("--dependency-mode", choices=("link", "copy"), default="link")
    for mode in ("status", "finish", "step"):
        p = sub.add_parser(mode); p.add_argument("--workspace", required=True)
        if mode == "step":
            p.add_argument("--index", type=int, required=True); p.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    if args.mode == "plan":
        plan = make_plan(args.project, args.model, args.runtime); h.save(args.save, plan)
        result = {k: plan[k] for k in ("total_referenced_bytes", "project_copy_bytes", "native_steps")}
        result.update(files=len(plan["files"]), steps=len(plan["steps"]))
    elif args.mode == "stage":
        result = stage(h.load(args.plan), args.workspace, args.dependency_mode)
    elif args.mode == "step":
        result = run_step(args.workspace, args.index, args.execute)
    elif args.mode == "finish":
        result = finish(args.workspace)
    else:
        work = Path(args.workspace).resolve(strict=True); plan = inputs_ok(work); done = completed(work, plan)
        result = {"completed_steps": len(done), "total_steps": 49,
                  "next_step": plan["steps"][len(done)] if len(done) < 49 else None,
                  "process_state": "Not inferred from files; use an actual running process or terminal handle"}
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
