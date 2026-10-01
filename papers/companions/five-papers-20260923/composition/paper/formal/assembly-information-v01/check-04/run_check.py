"""One exact leased Lean check; immutable attempt capture, no search or network.

Uses the installed shared wrapper, so only its transient compiler lease/schedule
may change outside this paper. No shared source or build target is changed.
"""
from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent
WRAPPER = Path(r"D:\micahone\vscode v5ma\v5ma.github.io\scripts\sit_uv\Invoke-LeanWithLease.ps1")
PACKAGE = Path(r"D:\micahone\vscode v5ma\v5ma.github.io\production-canon\formal-specs\mathlib-hsit-tail")
SOURCE = ROOT / "AssemblyInformation.lean"
PINNED_BIN = Path(r"C:\Users\micah\.elan\toolchains\leanprover--lean4---v4.30.0\bin")


def own_process_job(process: subprocess.Popen) -> tuple[object, int]:
    """Guard exactly this child and descendants, never other owners' processes."""
    from ctypes import wintypes

    class Basic(ctypes.Structure):
        _fields_ = [("process_time", ctypes.c_longlong), ("job_time", ctypes.c_longlong),
                    ("flags", wintypes.DWORD), ("min_work", ctypes.c_size_t),
                    ("max_work", ctypes.c_size_t), ("active_limit", wintypes.DWORD),
                    ("affinity", ctypes.c_size_t), ("priority", wintypes.DWORD),
                    ("scheduling", wintypes.DWORD)]

    class IO(ctypes.Structure):
        _fields_ = [(name, ctypes.c_ulonglong) for name in
                    ("read_ops", "write_ops", "other_ops", "read_bytes", "write_bytes", "other_bytes")]

    class Extended(ctypes.Structure):
        _fields_ = [("basic", Basic), ("io", IO), ("process_memory", ctypes.c_size_t),
                    ("job_memory", ctypes.c_size_t), ("peak_process_memory", ctypes.c_size_t),
                    ("peak_job_memory", ctypes.c_size_t)]

    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
    kernel.CreateJobObjectW.restype = wintypes.HANDLE
    kernel.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
    kernel.SetInformationJobObject.restype = wintypes.BOOL
    kernel.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
    kernel.AssignProcessToJobObject.restype = wintypes.BOOL
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel.CloseHandle.restype = wintypes.BOOL
    job = kernel.CreateJobObjectW(None, None)
    if not job:
        raise ctypes.WinError(ctypes.get_last_error())
    info = Extended()
    info.basic.flags = 0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    if not kernel.SetInformationJobObject(job, 9, ctypes.byref(info), ctypes.sizeof(info)):
        kernel.CloseHandle(job)
        raise ctypes.WinError(ctypes.get_last_error())
    if not kernel.AssignProcessToJobObject(job, int(process._handle)):
        kernel.CloseHandle(job)
        raise ctypes.WinError(ctypes.get_last_error())
    return kernel, job


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--attempt", required=True)
    args = parser.parse_args()
    if not args.attempt or any(c not in "abcdefghijklmnopqrstuvwxyz0123456789-" for c in args.attempt):
        raise ValueError("Use a short literal lowercase attempt label")
    out = ROOT / args.attempt
    out.mkdir(exist_ok=False)
    shutil.copyfile(SOURCE, out / SOURCE.name)
    shutil.copyfile(Path(__file__), out / "run_check.py")
    # Also identify the executable entry point and exact pinned toolchain.
    shell = shutil.which("powershell.exe")
    if shell is None:
        raise RuntimeError("Windows PowerShell is unavailable")
    source_sha = sha(SOURCE)
    before = {
        "source_sha256": source_sha,
        "wrapper_sha256": sha(WRAPPER),
        "runner_sha256": sha(Path(__file__)),
        "toolchain": (PACKAGE / "lean-toolchain").read_text().strip(),
        "pinned_lean_sha256": sha(PINNED_BIN / "lean.exe"),
        "pinned_lake_sha256": sha(PINNED_BIN / "lake.exe"),
        "pinned_bin_precedes_launchers": str(PINNED_BIN),
        "scope": "One exact external source; Check mode; no aggregate build or downloads requested",
        "expected_external_writes": [str(PACKAGE / ".lake/lean-compiler-schedule.json"),
                                     str(PACKAGE / ".lake/lean-compiler-lease.json")],
    }
    (out / "BEFORE.json").write_text(json.dumps(before, indent=2) + "\n", encoding="utf-8")
    command = [shell, "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File",
               str(WRAPPER), "-Mode", "Check", "-Target", str(SOURCE),
               "-Owner", "nrct-assembly-information-" + args.attempt,
               "-WaitSeconds", "8", "-EstimatedMinutes", "1"]
    start = time.perf_counter()
    environment = dict(os.environ)
    environment["PATH"] = str(PINNED_BIN) + os.pathsep + environment.get("PATH", "")
    timed_out = False
    with (out / "stdout.txt").open("wb") as stdout_file, (out / "stderr.txt").open("wb") as stderr_file:
        process = subprocess.Popen(command, cwd=ROOT, stdout=stdout_file, stderr=stderr_file,
                                   env=environment, creationflags=subprocess.BELOW_NORMAL_PRIORITY_CLASS)
        try:
            kernel, job = own_process_job(process)
        except Exception:
            process.kill()
            process.wait()
            raise
        try:
            try:
                code = process.wait(timeout=45)
            except subprocess.TimeoutExpired:
                timed_out = True
                code = 124
        finally:
            kernel.CloseHandle(job)
            process.wait(timeout=5)
    elapsed = time.perf_counter() - start
    stdout = (out / "stdout.txt").read_bytes().decode("utf-8", errors="replace")
    stderr = (out / "stderr.txt").read_bytes().decode("utf-8", errors="replace")
    receipt = {**before, "command": command, "exit_code": code, "timed_out": timed_out,
               "elapsed_seconds": elapsed, "source_unchanged": sha(SOURCE) == source_sha,
               "stdout_sha256": sha(out / "stdout.txt"), "stderr_sha256": sha(out / "stderr.txt"),
               "independent_review": False, "biological_verification": False}
    (out / "CHECK.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"attempt": args.attempt, "exit_code": code,
                      "elapsed_seconds": round(elapsed, 3), "source_unchanged": receipt["source_unchanged"]}))
    print(stdout)
    if stderr:
        print(stderr)
    return code


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
