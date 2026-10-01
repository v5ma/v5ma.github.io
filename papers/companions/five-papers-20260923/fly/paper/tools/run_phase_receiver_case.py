"""One bounded create-only bridge case; sequential invocation only."""
import os
for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
    os.environ[key] = "1"
import argparse
import ctypes
import json
import sys
import time

from phase_receiver_bridge import APP, PLAN_PATH, ROOT, digest, graph, inputs, run_episode


def low_priority():
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.GetCurrentProcess.restype = ctypes.c_void_p
    kernel.SetPriorityClass.argtypes = [ctypes.c_void_p, ctypes.c_uint]
    kernel.GetPriorityClass.argtypes = [ctypes.c_void_p]
    kernel.GetPriorityClass.restype = ctypes.c_uint
    handle = kernel.GetCurrentProcess()
    if not kernel.SetPriorityClass(handle, 0x4000) or kernel.GetPriorityClass(handle) != 0x4000:
        raise RuntimeError("Below-normal priority not verified")
    return "BELOW_NORMAL_PRIORITY_CLASS, verified"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("case")
    parser.add_argument("--run", default="run-01")
    args = parser.parse_args()
    start = time.perf_counter()
    priority = low_priority()
    plan, seeds, routes, env = inputs()
    case = next(c for c in plan["cases"] if c["id"] == args.case)
    output = APP / args.run / args.case
    output.mkdir(parents=True, exist_ok=False)
    deadline = start + plan["resourceLimits"]["maximumCaseSeconds"]
    try:
        settings = dict(plan["receiver"])
        for key in ("dt", "coupling"):
            if key in case:
                settings[key] = case[key]
        if case["implementation"] == "reference":
            model, provenance = None, None
        else:
            model, provenance = graph(seeds, routes, plan, case)
        episodes = [run_episode(env["configuration"], scenario, seed, case, model, settings, deadline)
                    for scenario in env["scenarios"] for seed in env["seeds"]]
        data = {"case": case, "settings": settings, "graph": provenance, "episodes": episodes}
        data_path = output / "EPISODES.json"
        data_path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n", encoding="utf-8")
        receipt = {"status": "executed", "case": args.case, "episodes": len(episodes),
                   "events": sum(len(e["events"]) for e in episodes), "elapsedSeconds": time.perf_counter()-start,
                   "priority": priority, "numericalThreads": 1,
                   "python": sys.executable, "planSha256": digest(PLAN_PATH),
                   "codeSha256": {n: digest(ROOT/"tools"/n) for n in ("phase_receiver_bridge.py", "run_phase_receiver_case.py", "embodied_reference.py")},
                   "environmentPlanSha256": digest(ROOT/plan["sourceFiles"]["environment"]["path"]),
                   "sourceSha256": {k: plan["sourceFiles"][k]["sha256"] for k in ("seeds", "routes")},
                   "episodesSha256": digest(data_path), "outputBytes": data_path.stat().st_size,
                   "meanStandoffError": sum(e["metrics"]["finalStandoffError"] for e in episodes)/len(episodes),
                   "allAdverseCasesRetained": True}
        if receipt["elapsedSeconds"] > plan["resourceLimits"]["maximumCaseSeconds"]:
            raise TimeoutError("Including serialization, case exceeded declared budget")
        (output/"EXECUTION.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(receipt, indent=2))
    except Exception as error:
        (output/"FAILURE.json").write_text(json.dumps({"type": type(error).__name__, "message": str(error), "elapsedSeconds": time.perf_counter()-start}, indent=2)+"\n", encoding="utf-8")
        raise


if __name__ == "__main__":
    main()
