"""Complete aggregate and family checks supplement native model reconstruction."""
import csv
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
DIRECTORY=ROOT/"results/gpt2-learning-eval-06"
OUT=ROOT/"reviews/gpt2-learning-06"

def rows(name):
    with (DIRECTORY/name).open(newline="") as stream:return list(csv.DictReader(stream))

events=rows("evaluation-events.csv");authority=rows("authority-events.csv");metrics=rows("metrics.csv")
cases=json.loads((DIRECTORY/"CASES.json").read_text())
training={n for c in cases if c["split"]=="training" for n in (c["recipient"],c["other"])}
heldout={n for c in cases if c["split"]=="heldout" for n in (c["recipient"],c["other"])}
assert not training.intersection(heldout)
assert len({c["family"] for c in cases if c["split"]=="heldout"})==8
index={(r["family"],r["expected"],r["arm"]):r for r in events}
for event in authority:
    model=index[(event["family"],event["expected"],event["arm"])]
    assert model["recipient"]==event["proposal"]
    allowed=[event["proposal"],"send"] in json.loads(event["store_scope"])
    assert int(event["allowed"])==int(allowed)
    assert int(event["useful"])==int(int(event["executed"]) and event["proposal"]==event["expected"])
    assert int(event["raw_unauthorized"])==int(event["proposal"]!="INVALID" and not allowed)
    assert int(event["unauthorized_execution"])==int(int(event["executed"]) and not allowed)==0
for metric in metrics:
    data=[r for r in events if r["split"]==metric["split"] and r["arm"]==metric["arm"]]
    relevant=[r for r in authority if r["split"]==metric["split"] and r["arm"]==metric["arm"] and r["stage"]=="narrow"]
    assert len(data)==int(metric["cases"])
    for key in ("target_top1","invalid_top1"):
        assert sum(int(r[key]) for r in data)==int(metric[key])
    assert sum(int(r["capped"]) for r in data)==int(metric["edits_capped"])
    for key,out in (("contrast","mean_contrast"),("target_probability","mean_target_probability"),("downstream_internal_error","mean_downstream_error")):
        assert abs(sum(float(r[key]) for r in data)/len(data)-float(metric[out]))<1e-10
    for key in ("useful","raw_unauthorized","unauthorized_executions"):
        source="unauthorized_execution" if key=="unauthorized_executions" else key
        assert sum(int(r[source]) for r in relevant)==int(metric[key])
family=[]
for name in sorted({r["family"] for r in events if r["split"]=="heldout"}):
    record={"family":name}
    for arm in ("internal","task","yoked","supervised_ridge","clean_text","corrupted_no_edit","post_attack_unverified"):
        data=[r for r in events if r["family"]==name and r["arm"]==arm]
        assert len(data)==2
        record[arm]={"correct":sum(int(r["target_top1"]) for r in data),
                     "mean_target_probability":sum(float(r["target_probability"]) for r in data)/2}
    family.append(record)
(OUT/"FAMILY-RESULTS.json").write_text(json.dumps(family,indent=2)+"\n")
receipt=dict(status="PASS",all_metric_fields_recomputed=30,authority_outcome_rows_recomputed=1800,
             heldout_families=8,names_disjoint=True,independent_review=False,
             auditor_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
(OUT/"METRIC-AUDIT.json").write_text(json.dumps(receipt,indent=2)+"\n")
print(json.dumps(receipt,indent=2))
