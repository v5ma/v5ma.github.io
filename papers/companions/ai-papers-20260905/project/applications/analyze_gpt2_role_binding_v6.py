"""Explicitly post-hoc paired-role diagnostic; does not change frozen endpoints."""
import csv
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/"results/gpt2-learning-eval-06/evaluation-events.csv"
OUT=ROOT/"reviews/gpt2-learning-06"
with SOURCE.open(newline="") as stream:rows=[r for r in csv.DictReader(stream) if r["split"]=="heldout"]
details=[];summary=[]
for arm in sorted({r["arm"] for r in rows}):
    current=[]
    for family in sorted({r["family"] for r in rows}):
        pair=[r for r in rows if r["arm"]==arm and r["family"]==family]
        assert len(pair)==2 and pair[0]["expected"]==pair[1]["other"] and pair[1]["expected"]==pair[0]["other"]
        same=pair[0]["recipient"]==pair[1]["recipient"]!="INVALID"
        correct=sum(int(r["target_top1"]) for r in pair)
        record=dict(arm=arm,family=family,correct=correct,both_roles_correct=int(correct==2),
                    same_named_output=int(same),correct_in_collapsed_pair=correct if same else 0,
                    expected_1=pair[0]["expected"],output_1=pair[0]["recipient"],
                    expected_2=pair[1]["expected"],output_2=pair[1]["recipient"])
        current.append(record);details.append(record)
    summary.append(dict(arm=arm,families=8,correct_tokens=sum(r["correct"] for r in current),
                        both_roles_correct=sum(r["both_roles_correct"] for r in current),
                        same_named_output_families=sum(r["same_named_output"] for r in current),
                        successes_in_collapsed_pairs=sum(r["correct_in_collapsed_pair"] for r in current)))
for name,data in (("ROLE-PAIR-DETAIL.csv",details),("ROLE-PAIR-SUMMARY.csv",summary)):
    with (OUT/name).open("w",newline="") as stream:
        writer=csv.DictWriter(stream,fieldnames=list(data[0]));writer.writeheader();writer.writerows(data)
receipt=dict(status="PASS",analysis_type="Post-hoc diagnostic, not a preregistered endpoint",source_sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
             script_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),rows_checked=240,family_arm_pairs=120,
             original_endpoints_unchanged=True,independent_review=False)
(OUT/"ROLE-PAIR-RECEIPT.json").write_text(json.dumps(receipt,indent=2)+"\n")
print(json.dumps(summary,indent=2))
