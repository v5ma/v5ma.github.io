"""Bounded, read-only checks of known run inputs; writes a new audit receipt only."""
from __future__ import annotations
import os
for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[key] = "1"
import csv
import hashlib
import io
import json
from pathlib import Path
import unittest
import numpy as np
import test_labs
from causal_lab import worlds

ROOT = Path(__file__).resolve().parent.parent


def main():
    run = ROOT / "results" / "dev-01"
    dest = run / "AUDIT.json"
    if dest.exists():
        raise FileExistsError("Audit receipts are not overwritten")
    output = io.StringIO()
    tests = unittest.TextTestRunner(stream=output, verbosity=2).run(unittest.defaultTestLoader.loadTestsFromModule(test_labs))
    metrics = list(csv.DictReader((run/"commitment-metrics.csv").open(encoding="utf-8")))
    events = json.loads((run/"commitment-events.json").read_text(encoding="utf-8"))
    previous, recounted = {}, {}
    for raw in events:
        row = raw.copy()
        digest = row.pop("hash")
        assert hashlib.sha256(json.dumps(row, sort_keys=True).encode()).hexdigest() == digest
        tag = row["run"]
        assert row["previous_hash"] == previous.get(tag, "0" * 64)
        previous[tag] = digest
        count = recounted.setdefault(tag, {"unauthorized_executions": 0, "eligible_requests": 0, "useful_executions": 0, "rejected_proposals": 0, "events": 0})
        count["events"] += 1
        count["unauthorized_executions"] += int(row["executed"] and not row["truth_allowed"])
        count["eligible_requests"] += int(row["truth_allowed"])
        count["useful_executions"] += int(row["executed"] and row["truth_allowed"])
        count["rejected_proposals"] += int(row["rejected"])
        # World semantics, rather than the runtime's printed permission field.
        assert row["truth_allowed"] == (row["object"] == ("A" if row["authority_revision"] == 0 else "B"))
    aggregate = {}
    for row in metrics:
        tag = "-".join(row[k] for k in ("seed", "horizon", "depth", "policy"))
        for k,v in recounted[tag].items():
            assert v == int(row["horizon"] if k == "events" else row[k])
        acc = aggregate.setdefault(row["policy"], {"conditions": 0, "unauthorized": 0, "useful": 0, "eligible": 0, "rejections": 0})
        acc["conditions"] += 1
        for new,old in (("unauthorized", "unauthorized_executions"),("useful", "useful_executions"),("eligible", "eligible_requests"),("rejections", "rejected_proposals")):
            acc[new] += int(row[old])
    for row in aggregate.values():
        row["useful_completion"] = row["useful"]/row["eligible"]
    split = json.loads((run/"world-splits.json").read_text(encoding="utf-8"))
    membership = {world:name for name,ids in split.items() for world in ids}
    bits, target, _ = worlds()
    crossing = {}
    for name,ids in split.items():
        crossing[name] = {"worlds": len(ids), "positives": int(target[ids].sum()), "donors_outside_context_split": 0, "donor_destinations": {k:0 for k in split}}
        for world in ids:
            selected = int(bits[world,6]>0)
            donor = world ^ (1 << (selected+2))
            crossing[name]["donor_destinations"][membership[donor]] += 1
            crossing[name]["donors_outside_context_split"] += int(membership[donor] != name)
    neural = list(csv.DictReader((run/"causal-metrics.csv").open(encoding="utf-8")))
    neural_summary = {}
    for method in ("global_linear", "matched_polynomial", "receiver_conditioned", "local_jacobian"):
        rows = [r for r in neural if r["split"] == "test" and r["method"] == method]
        neural_summary[method] = {"test_mae_by_seed": [float(r["intervention_mae"]) for r in rows], "mean_test_mae": float(np.mean([float(r["intervention_mae"]) for r in rows]))}
    freeze = json.loads((run/"INPUT-FREEZE.json").read_text(encoding="utf-8"))
    hashes_match = all(hashlib.sha256((ROOT/"applications"/name).read_bytes()).hexdigest() == expected for name,expected in freeze["hashes"].items())
    receipt = {"schema": "san-ca-mi-development-audit/v1", "tests_run": tests.testsRun, "tests_passed": tests.wasSuccessful(), "test_output": output.getvalue(), "input_hashes_match": hashes_match, "event_hash_chains_checked": len(previous), "events_recounted": len(events), "ca_aggregate": aggregate, "mi_summary": neural_summary, "context_donor_split_audit": crossing,
        "reviewer_class": "authoring-agent self-audit, not independent review",
        "scientific_limitations": ["CA depth cells reuse action sequences and are not independent replications.", "CA text-only control is deliberately weak; final-gate is the relevant strong safety comparator.", "MI context partitions are disjoint, but donor states can cross partitions. This run does not satisfy donor-closed holdout.", "All MI methods were specified before this development run, but this is not external preregistration or confirmatory evaluation.", "No learned-model adaptation under runtime revocation and no live-feedback self-regulation experiment have run."]}
    dest.write_text(json.dumps(receipt, indent=2, allow_nan=False)+"\n", encoding="utf-8")
    print(json.dumps({k:v for k,v in receipt.items() if k not in ("test_output", "scientific_limitations")}, indent=2))
    if not (tests.wasSuccessful() and hashes_match):
        raise RuntimeError("Integrity checks failed")


if __name__ == "__main__":
    main()
