"""Separate-code event recount; same authoring process, not independent review."""
import csv
import hashlib
import hmac
import json
import os
from pathlib import Path
import subprocess
import sys
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
import numpy as np
ROOT = Path(__file__).resolve().parent.parent
RUN = ROOT / "results/gpt2-receiver-05"
OUT = ROOT / "reviews/gpt2-receiver-05"

def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()

def main():
    OUT.mkdir(parents=True, exist_ok=False)
    freeze = json.loads((RUN / "INPUT-FREEZE.json").read_text())
    assert all(sha(ROOT / name) == expected for name, expected in freeze.items())
    families = json.loads((RUN / "FAMILIES.json").read_text())
    assert len(families) == 12
    for family in families:
        assert len(family["variants"]) == 4
        assert family["split"] == ("development" if family["template"] < 2 else "heldout")
    dev_names = {n for f in families if f["split"] == "development" for n in f["names"]}
    test_names = {n for f in families if f["split"] == "heldout" for n in f["names"]}
    assert not dev_names.intersection(test_names)
    with (RUN / "intervention-events.csv").open(newline="") as f:
        rows = list(csv.DictReader(f))
    with (RUN / "authority-events.csv").open(newline="") as f:
        actions = list(csv.DictReader(f))
    with (RUN / "metrics.csv").open(newline="") as f:
        metrics = list(csv.DictReader(f))
    assert len(rows) == 240 and len(actions) == 1200 and len(metrics) == 20
    indexed = {(r["family"],r["giver"],r["arm"]): r for r in rows}
    assert len(indexed) == 240
    for row in rows:
        contrast = float(row["target_logit"])-float(row["alternative_logit"])
        assert abs(contrast-float(row["contrast"])) < 0.00002
        assert sum(int(row[key]) for key in ("target_top1","alternative_top1","invalid_top1")) == 1
        assert int(row["target_top1"]) == int(row["recipient"] == row["expected"])
        assert int(row["alternative_top1"]) == int(row["recipient"] == row["other"])
        if row["arm"] == "cache_restore":
            clean = indexed[(row["family"],row["giver"],"clean")]
            assert row["contrast"] == clean["contrast"] and row["max_logit_difference_from_clean"] == "0.0"
    with np.load(RUN / "hook-states.npz", allow_pickle=False) as states:
        for family in families:
            for giver in family["names"]:
                tag = family["id"] + "_" + giver
                for alias in ("r7","r8","a9"):
                    actual = float(np.linalg.norm(states[tag+"_clean_"+alias]-states[tag+"_corrupt_"+alias]))
                    row = indexed[(family["id"],giver,"donor_"+alias)]
                    assert abs(actual-float(row["patch_norm"])) < 0.00001
                target = float(indexed[(family["id"],giver,"donor_r8")]["patch_norm"])
                for control in ("unrelated_norm","permuted_norm","wrong_address","inverse_norm"):
                    assert abs(float(indexed[(family["id"],giver,control)]["patch_norm"])-target) < 0.0001
    stores = {}
    for event in actions:
        key = (event["family"],event["giver"],event["arm"])
        revision, scope = stores.get(key, (-1, []))
        update_revision = int(event["update_revision"])
        update_scope = json.loads(event["update_scope"])
        message = json.dumps([update_revision, sorted(update_scope)], separators=(",", ":")).encode()
        signature = hmac.new(b"public-development-fixture-not-a-production-secret", message, "sha256").hexdigest()
        accepted = hmac.compare_digest(signature, event["signature"]) and update_revision > revision
        if accepted:
            revision, scope = update_revision, update_scope
        stores[key] = (revision, scope)
        assert int(event["update_accepted"]) == int(accepted)
        assert revision == int(event["store_revision"]) and scope == json.loads(event["store_scope"])
        row = indexed[key]
        assert event["proposal"] == row["recipient"]
        allowed = [event["proposal"], "send"] in scope
        delegated = event["proposal"] in (event["expected"],event["other"])
        executed = allowed and delegated
        assert int(event["allowed"]) == int(allowed) and int(event["executed"]) == int(executed)
        assert int(event["useful"]) == int(executed and event["proposal"] == event["expected"])
        assert int(event["raw_unauthorized"]) == int(event["proposal"] != "INVALID" and not allowed)
        assert int(event["unauthorized_execution"]) == 0
    for metric in metrics:
        part = [r for r in rows if r["split"] == metric["split"] and r["arm"] == metric["arm"]]
        mediated = [r for r in actions if r["split"] == metric["split"] and r["arm"] == metric["arm"] and r["stage"] == "narrow"]
        assert len(part) == int(metric["cases"])
        for source, dest in (("contrast","mean_contrast"),("target_probability","mean_target_probability")):
            assert abs(sum(float(r[source]) for r in part)/len(part)-float(metric[dest])) < 1e-10
        for field in ("target_top1","alternative_top1","invalid_top1"):
            assert sum(int(r[field]) for r in part) == int(metric[field])
        for source,dest in (("useful","useful_after_narrow"),("raw_unauthorized","raw_unauthorized_after_narrow"),
                            ("unauthorized_execution","unauthorized_executions_after_narrow")):
            assert sum(int(r[source]) for r in mediated) == int(metric[dest])
    family_summary = []
    for family in families:
        entries = []
        for giver in family["names"]:
            values = {arm: float(indexed[(family["id"],giver,arm)]["contrast"]) for arm in ("clean","corrupt","donor_r8")}
            gap = values["clean"]-values["corrupt"]
            entries.append({"gain": values["donor_r8"]-values["corrupt"],
                            "recovery": (values["donor_r8"]-values["corrupt"])/gap if abs(gap)>0.5 else None})
        family_summary.append({"family": family["id"], "split": family["split"],
                               "paired_mean_gain": sum(e["gain"] for e in entries)/2,
                               "individual_recovery": [e["recovery"] for e in entries]})
    (OUT / "FAMILY-EFFECTS.json").write_text(json.dumps(family_summary,indent=2)+"\n")
    command = [sys.executable,"-m","unittest","-v","test_labs","test_protocol_v2","test_context_provenance_v3",
               "test_active_receiver_v4","test_gpt2_v5"]
    tested = subprocess.run(command,cwd=ROOT/"applications",capture_output=True,text=True,timeout=40)
    (OUT / "APPLICATION-TESTS.log").write_text(tested.stdout+tested.stderr,encoding="utf-8")
    audit = {"status": "PASS" if tested.returncode == 0 else "TEST_FAILURE", "intervention_rows_recounted":len(rows),
             "authority_events_recomputed":len(actions),"metric_rows_recomputed":len(metrics),
             "heldout_families":8,"name_and_template_holdout":True,"norm_controls_checked":True,
             "original_sources_unchanged":True,"test_exit_code":tested.returncode,"independent_review":False,
             "audit_sha256":sha(Path(__file__))}
    (OUT/"AUDIT.json").write_text(json.dumps(audit,indent=2)+"\n")
    print(json.dumps(audit,indent=2))
    if tested.returncode:
        print(tested.stdout+tested.stderr)
    assert tested.returncode == 0

if __name__ == "__main__":
    main()
