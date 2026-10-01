"""Resource-bounded invocation of one original staged entry point."""

import argparse
import os
from pathlib import Path
import runpy
import sys
import traceback

import pipeline


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace", type=Path, required=True)
    parser.add_argument("--step", type=int, required=True)
    args = parser.parse_args()
    h = pipeline.h
    workspace = args.workspace.resolve(strict=True)
    h.require(0 <= args.step < 49 and sys.flags.optimize == 0, "Invalid step or disabled assertions")
    step = pipeline.recipe()[args.step]
    folder = workspace / "control/steps" / f"{args.step:02d}"
    request = h.load(folder / "REQUEST.json")
    h.require(request["step"] == step and request["explicit_execution"], "Mismatched execution request")
    h.require(h.digest(workspace / "control/pipeline.py") == request["controller_sha256"], "Controller drift")
    env = h.environment()
    h.require(env["windows_x64"] and env["version_match"] and env["assertions_enabled"], "Actual child environment mismatch")
    for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
        h.require(os.environ.get(key) == "1", "Thread limit missing")
    sys.path.insert(0, str(workspace / "applications"))
    from qwen35_adapter_v9 import ResourceGuard, np, ort
    h.require(np.__version__ == "2.4.6" and ort.__version__ == "1.29.0", "Actual numerical/runtime version mismatch")
    guard = ResourceGuard(folder, seconds=75, commit=5500000000)
    try:
        if step["kind"] == "tests":
            os.chdir(workspace / "applications")
            sys.argv = ["unittest", *step["command"][2:]]
            try:
                runpy.run_module("unittest", run_name="__main__")
            except SystemExit as result:
                h.require(result.code in (None, 0), "Original Qwen tests failed")
        else:
            sys.argv = [str(workspace / step["command"][0]), *step["command"][1:]]
            runpy.run_path(sys.argv[0], run_name="__main__")
        resource = guard.finish()
        h.require(resource["elapsed_seconds"] < 75 and resource["peak_commit_bytes"] < 5500000000,
                  "Completed child exceeded resource acceptance")
        h.save(folder / "BOOTSTRAP-RECEIPT.json", {"status": "COMPLETE_ORIGINAL_ENTRY_POINT", "step": step,
               "environment": env, "numpy": np.__version__, "onnxruntime": ort.__version__,
               "bootstrap_sha256": h.digest(__file__), "resource": resource})
    except BaseException:
        resource = guard.finish()
        h.save(folder / "BOOTSTRAP-FAILURE.json", {"traceback": traceback.format_exc(), "resource": resource})
        raise


if __name__ == "__main__":
    main()
