"""One-thread bounded runner. Creates new result directories; never overwrites a run."""
from __future__ import annotations
import os
for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[key] = "1"
import argparse
import csv
import hashlib
import json
from pathlib import Path
import platform
import time
import commitment_lab
import causal_lab


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_json(path, value):
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def save_csv(path, rows):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run", required=True)
    args = parser.parse_args()
    if not args.run or any(c not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_" for c in args.run):
        raise ValueError("Use a simple bounded run label")
    source = Path(__file__).resolve().parent
    destination = source.parent / "results" / args.run
    destination.mkdir(parents=True, exist_ok=False)
    protocol_file = source / "PROTOCOL-DEV-01.json"
    config = json.loads(protocol_file.read_text(encoding="utf-8"))
    inputs = {p.name: digest(p) for p in (protocol_file, source/"commitment_lab.py", source/"causal_lab.py", source/"run_development.py")}
    save_json(destination/"INPUT-FREEZE.json", {"hashes": inputs, "protocol": config, "python": platform.python_version(), "numpy": causal_lab.np.__version__})
    start = time.monotonic()
    try:
        ca, events = commitment_lab.evaluate(config["ca"])
        save_csv(destination/"commitment-metrics.csv", ca)
        save_json(destination/"commitment-events.json", events)
        mi, predictions, models, split = causal_lab.evaluate(config["mi"], config["resources"])
        save_csv(destination/"causal-metrics.csv", mi)
        save_csv(destination/"causal-predictions.csv", predictions)
        save_json(destination/"models.json", models)
        save_json(destination/"world-splits.json", split)
        elapsed = time.monotonic()-start
        size = sum(p.stat().st_size for p in destination.iterdir() if p.is_file())
        if elapsed > config["resources"]["max_total_seconds"] or size > config["resources"]["max_result_bytes"]:
            raise RuntimeError("Declared resource ceiling exceeded; do not promote this run")
        summary = {"execution": "PASS", "scientific_promotion": "DEVELOPMENT_ONLY",
            "ca_conditions": len(ca), "ca_events": len(events), "mi_trained_models": len(models),
            "mi_metric_rows": len(mi), "mi_intervention_rows": len(predictions),
            "seconds": elapsed, "bytes_before_summary": size, "all_input_hashes_unchanged": all(digest(source/k) == v for k,v in inputs.items()),
            "interpretation": "Runtime gates are engineered. Neural mechanisms are learned in a small two-hidden-layer network; no LLM, human or biological evaluation has run."}
        save_json(destination/"SUMMARY.json", summary)
        print(json.dumps(summary, indent=2))
    except Exception as exc:
        save_json(destination/"FAILURE.json", {"type": type(exc).__name__, "message": str(exc), "elapsed_seconds": time.monotonic()-start})
        raise


if __name__ == "__main__":
    main()
