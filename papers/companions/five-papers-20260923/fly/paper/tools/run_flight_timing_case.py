"""Run exactly one predeclared five-cell timing-component development case."""
import argparse
import ctypes
import hashlib
import json
import os
from pathlib import Path
import sys
import time
import numpy as np
import flight_timing_model as model

ROOT = model.ROOT
APP = ROOT / "application/flight-timing-component-v0"
PLAN_SHA = "c0499a53fb1a711ed033abf9b31f035274b103540baace1d004906ce459c21c1"
MODEL_SHA = "1657583d1c327cc11e54b55a1c1996ae7e7ed46921142c6ef45afa1fd2ea2cc3"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, data):
    with path.open("x", encoding="utf-8") as stream:
        json.dump(data, stream, indent=2, allow_nan=False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("case")
    args = parser.parse_args()
    if os.name == "nt":
        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel.GetCurrentProcess.restype = ctypes.c_void_p
        kernel.SetPriorityClass.argtypes = [ctypes.c_void_p, ctypes.c_uint]
        kernel.SetPriorityClass.restype = ctypes.c_int
        kernel.GetPriorityClass.argtypes = [ctypes.c_void_p]
        kernel.GetPriorityClass.restype = ctypes.c_uint
        handle = kernel.GetCurrentProcess()
        if not kernel.SetPriorityClass(handle, 0x4000) or kernel.GetPriorityClass(handle) != 0x4000:
            raise OSError("Could not select below-normal process priority")
    plan_path = APP / "ANALYSIS-PLAN.json"
    if sha(plan_path) != PLAN_SHA or sha(Path(model.__file__)) != MODEL_SHA:
        raise ValueError("Frozen plan or native-checked model changed")
    audit_path = APP / "native-audit-01/EXECUTION.json"
    audit = json.loads(audit_path.read_text("utf-8"))
    if audit["status"] != "pass" or audit["modelSha256"] != MODEL_SHA or audit["planSha256"] != PLAN_SHA:
        raise ValueError("Native-reference gate has not passed for this code and plan")
    plan = json.loads(plan_path.read_text("utf-8"))
    cases = {case["name"]: case for case in plan["cases"]}
    if args.case not in cases:
        raise ValueError("Not a predeclared case")
    case = cases[args.case]
    out = APP / "network-run-01" / args.case
    out.mkdir(parents=True, exist_ok=False)
    started = time.perf_counter()
    report = {
        "case": case, "planSha256": PLAN_SHA, "modelSha256": MODEL_SHA,
        "runnerSha256": sha(Path(__file__)), "nativeAuditSha256": sha(audit_path),
        "evidenceClass": "published reduced-model development replay, not biological data",
        "coupledNativeTraceComparison": False, "independentReview": False,
        "numpyVersion": np.__version__, "pythonVersion": sys.version.split()[0],
        "workers": 1, "threadEnvironment": {key: os.environ.get(key) for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS")},
        "belowNormalPriorityVerified": os.name == "nt",
    }
    try:
        p = model.parameters(case["regime"])
        initial, selection = model.phase_initial(case["regime"], plan["network"]["phaseFractions"])
        source_gap = float(model.arrays("cfg-ggap_hom.npy", 1)[0])
        strength = {"source_homogeneous": source_gap, "zero": 0.0, "3_nS": 3.0}[case["gap"]]
        n = plan["network"]["neurons"]
        gap = strength * (np.ones((n, n)) - np.eye(n))
        source_paths = [model.SRC / ("cfg-Berger_" + case["regime"] + ".json"),
                        model.REF / ("StMs-initial_" + case["regime"] + "_StM.npy"),
                        model.REF / ("SpMs-initial_" + case["regime"] + "_SpM.npy"),
                        model.REF / "cfg-ggap_hom.npy"]
        report.update(parameters=p, initialState=initial.tolist(), initialSelection=selection,
                      gapStrengthNs=strength, gapMatrixNs=gap.tolist(),
                      sourceHashes={str(path.relative_to(ROOT)).replace("\\", "/"): sha(path) for path in source_paths})
        times, trace, spikes, compute_seconds = model.run_network(
            initial, p, gap, case["dtMs"], plan["network"]["durationMs"],
            plan["network"]["recordMs"], budget=40)
        lo, hi = plan["measurements"]["analysisWindowMs"]
        metrics, phase_times, phases = model.phase_measures(spikes, lo, hi)
        if metrics["status"] != "measured":
            raise ValueError("Incomplete phase measurement: " + metrics["status"])
        if not np.isfinite(trace).all() or not np.all((trace[:, 1:, :] >= -1e-9) & (trace[:, 1:, :] <= 1 + 1e-9)):
            raise ArithmeticError("Saved state bounds failed; no clipping permitted")
        np.savez_compressed(out / "STATES-AND-PHASES.npz", timeMs=times, state=trace,
                            phaseTimeMs=phase_times, phase=phases, gapMatrixNs=gap)
        write_json(out / "SPIKES.json", {"unit": "ms", "label": "start of integration step whose updated state crosses threshold", "cellOrder": list(range(n)), "trains": spikes})
        report.update(status="pass", metrics=metrics, computeSeconds=compute_seconds,
                      samples=len(times), stateValues=trace.size,
                      sampledVoltageRangeMv=[float(trace[:, 0, :].min()), float(trace[:, 0, :].max())],
                      sampledGateRange=[float(trace[:, 1:, :].min()), float(trace[:, 1:, :].max())],
                      artifacts={name: sha(out / name) for name in ("STATES-AND-PHASES.npz", "SPIKES.json")})
    except Exception as error:
        report.update(status="stopped_safely", errorType=type(error).__name__, error=str(error))
    report["seconds"] = time.perf_counter() - started
    write_json(out / "EXECUTION.json", report)
    print(json.dumps({key: report[key] for key in ("case", "status", "seconds")}, indent=2))
    if "metrics" in report:
        print(json.dumps(report["metrics"], indent=2))
    if report["status"] != "pass":
        print(report["error"])
        raise SystemExit(1)


if __name__ == "__main__":
    main()
