"""New immutable same-runtime rerun; compare every deterministic assay artifact."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
from encoder_v3 import digest

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument("--run", required=True)
args = parser.parse_args()
assert args.run and all(c.isalnum() or c in "-_" for c in args.run)
dest = ROOT / "results" / args.run
assert not dest.exists()
job = subprocess.run([sys.executable, str(ROOT / "applications" / "run_context_provenance_v3.py"), "--run", args.run], capture_output=True, text=True, timeout=55)
assert dest.is_dir(), job.stderr
(dest / "REPLAY.log").write_text(job.stdout + job.stderr, encoding="utf-8")
names = ["INPUT-FREEZE.json", "encoder-feedback-vectors.npz", "feedback-events.csv", "feedback-metrics.csv", "feedback-sensitivity.csv", "encoder-scope-vectors.npz", "scope-events.csv", "scope-metrics.csv", "passive-null.csv"]
rows = [{"artifact": n, "reference_sha256": digest(ROOT / "results" / "context-provenance-03" / n), "rerun_sha256": digest(dest / n)} for n in names] if job.returncode == 0 else []
matched = job.returncode == 0 and all(r["reference_sha256"] == r["rerun_sha256"] for r in rows)
receipt = {"status": "PASS" if matched else "FAIL", "process_exit_code": job.returncode, "matched_artifacts": len(rows) if matched else 0, "artifacts": rows, "boundary": "Same-machine, same-code, same-runtime reproducibility; not independent scientific replication or model identity certification"}
(dest / "REPLAY-RECEIPT.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
print(json.dumps(receipt, indent=2))
assert matched
