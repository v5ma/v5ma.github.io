"""One exact leased Lean check; immutable attempt capture, no search or network.

Uses the installed shared wrapper, so only its transient compiler lease/schedule
may change outside this paper. No shared source or build target is changed.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

ROOT = Path(__file__).resolve().parent
WRAPPER = Path(r"D:\micahone\vscode v5ma\v5ma.github.io\scripts\sit_uv\Invoke-LeanWithLease.ps1")
PACKAGE = Path(r"D:\micahone\vscode v5ma\v5ma.github.io\production-canon\formal-specs\mathlib-hsit-tail")
SOURCE = ROOT / "AssemblyInformation.lean"


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
    completed = subprocess.run(command, cwd=ROOT, capture_output=True, timeout=55,
                               creationflags=subprocess.BELOW_NORMAL_PRIORITY_CLASS if os.name == "nt" else 0)
    elapsed = time.perf_counter() - start
    stdout = completed.stdout.decode("utf-8", errors="replace")
    stderr = completed.stderr.decode("utf-8", errors="replace")
    (out / "stdout.txt").write_text(stdout, encoding="utf-8")
    (out / "stderr.txt").write_text(stderr, encoding="utf-8")
    receipt = {**before, "command": command, "exit_code": completed.returncode,
               "elapsed_seconds": elapsed, "source_unchanged": sha(SOURCE) == source_sha,
               "stdout_sha256": sha(out / "stdout.txt"), "stderr_sha256": sha(out / "stderr.txt"),
               "independent_review": False, "biological_verification": False}
    (out / "CHECK.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"attempt": args.attempt, "exit_code": completed.returncode,
                      "elapsed_seconds": round(elapsed, 3), "source_unchanged": receipt["source_unchanged"]}))
    print(stdout)
    if stderr:
        print(stderr)
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
