"""Bounded exact replay of seven deterministic active-receiver artifacts."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--output", required=True)
args = parser.parse_args()
output = Path(args.output).resolve()
if not output.is_relative_to(ROOT / "results") or output.exists():
    raise SystemExit("Use a fresh directory in this paper's results folder")
source = ROOT / "results/active-receiver-04"
freeze = json.loads((source / "INPUT-FREEZE.json").read_text())
def sha(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()
assert all(sha(ROOT / path) == expected for path, expected in freeze.items())
completed = subprocess.run([sys.executable, str(ROOT / "applications/active_receiver_v4.py"), "--output", str(output)], capture_output=True, text=True, timeout=40)
if completed.returncode:
    raise SystemExit(completed.stdout + completed.stderr)
names = ["INPUT-FREEZE.json", "TRAINING-SCHEDULE.json", "feedback-events.csv", "evaluation-events.csv", "attack-events.csv", "metrics.csv", "LEARNER-STATES.json"]
matches = {name: {"source": sha(source / name), "replay": sha(output / name)} for name in names}
assert all(value["source"] == value["replay"] for value in matches.values())
receipt = dict(status="PASS", matched_artifacts=len(matches), artifacts=matches,
               replay_wrapper_sha256=sha(Path(__file__)), same_runtime=True, independent_replication=False)
(output / "REPLAY-RECEIPT.json").write_text(json.dumps(receipt, indent=2)+"\n", encoding="utf-8")
print(json.dumps({"status": "PASS", "matched_artifacts": len(matches), "independent_replication": False}, indent=2))
