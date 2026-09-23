"""Separate scalar replay, workbook-XML readback and score recomputation.

Does not import the model implementation and does not execute external model code.
This is a second local implementation path, not independent scientific review.
"""
from pathlib import Path
import csv
import hashlib
import json
import math
import sys
import xml.etree.ElementTree as ET
import zipfile

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/"application/memory-component-v0"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    result=APP/sys.argv[1]
    output=result/"SEPARATE-CHECKS.json"
    if output.exists():
        raise FileExistsError(output)
    receipt=json.loads((result/"EXECUTION.json").read_text())
    data=json.loads((APP/"inputs/observations.json").read_text())
    params=json.loads((APP/"inputs/parameters.json").read_text())
    protocols=json.loads((result/"PROTOCOLS.json").read_text())
    runs=json.loads((result/"RUNS.json").read_text())
    metrics=json.loads((result/"METRICS.json").read_text())
    checks=[]
    def check(label,passed,detail=None):
        checks.append({"check":label,"passed":bool(passed),"detail":detail})
    for name,digest in receipt["outputHashes"].items():
        check("output hash "+name,sha(result/name)==digest)
    for name,digest in receipt["inputHashes"].items():
        check("input hash "+name,sha(ROOT/name)==digest)
    check("model script hash",sha(ROOT/"tools/run_memory_component.py")==receipt["scriptSha256"])
    check("plan hash",sha(APP/"ANALYSIS-PLAN.json")==receipt["planSha256"])
    check("original workbook hash",sha(Path(data["path"]))==data["sha256"])
    ns={"s":"http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(data["path"]) as book:
        workbook=ET.fromstring(book.read("xl/workbook.xml"))
        relationships=ET.fromstring(book.read("xl/_rels/workbook.xml.rels"))
        by_id={entry.attrib["Id"]:entry.attrib["Target"] for entry in relationships}
        names={}
        for sheet in workbook.findall("s:sheets/s:sheet",ns):
            rel=sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            target=by_id[rel]
            names[sheet.attrib["name"]]=(target.lstrip("/") if target.startswith("/") else "xl/"+target)
        for name in ("ACVvsETA","OCTvsBEN"):
            xml=ET.fromstring(book.read(names[name]))
            cells={cell.attrib["r"]:cell for cell in xml.findall("s:sheetData/s:row/s:c",ns)}
            agree=True
            count=0
            for record in data["records"]:
                if record["sheet"]!=name:
                    continue
                for key,loc in (("mean","meanCoordinate"),("sem","semCoordinate")):
                    raw=cells.get(record[loc])
                    value=raw.find("s:v",ns) if raw is not None else None
                    numeric=float(value.text) if value is not None else None
                    agree = agree and numeric==record[key]
                    count+=1
            check(name+" exact workbook XML readback",agree,{"cellsComparedIncludingBlanks":count})
    expected_durations=([5,120,5,120]+[30,135,30,135]*3+
                        [5,120,5,120]+[30,135,30,135]*3+[5,120,5,120]+
                        [3600]+[5,120,5,120]+[6950]+[5,120,5,120]+[75100]+[5,120,5,120])
    figure_durations=expected_durations.copy()
    for index in (3,15,19,31):
        figure_durations[index]=300
    figure_durations[36]=3050
    figure_durations[46]=75350
    check("fitting schedule exact durations",[e["duration"] for e in protocols["fitting_script"]]==expected_durations)
    check("figure schedule exact durations",[e["duration"] for e in protocols["figure_5c_script"]]==figure_durations)
    max_state=0.
    # Independent scalar update, topological firing calculation, separate decay factors.
    for run in runs:
        model=next(m for m in params["models"] if m["modules"]==run["modules"])
        c=model["cells"]
        columns=[0,1,2,3,4,5] if run["context"]==0 else [6,7,8,3,4,5]
        base_input=[c[0][0][i] for i in columns]
        weights=[row.copy() for row in c[3]]
        coefficient=c[1][0][0]
        shock_coefficient=c[2][0][0]
        if run["intervention"]=="plasticity_zero":
            coefficient=shock_coefficient=0.
        if run["intervention"]=="gamma_to_DAN_removed":
            weights[3][:3]=[0.,0.,0.]
        adaptation=[1.,1.]
        dw=[[0.,0.,0.],[0.,0.,0.]]
        tau=c[4][0]
        post_training=0.
        maximum=0.
        observed_count=0
        session=0
        for e,logged in zip(protocols[run["protocol"]],run["events"]):
            dt=e["duration"]
            means=[]
            for odor in range(2):
                new=1-(1-adaptation[odor]*math.exp(-.05*dt*e["odor"][odor]))*math.exp(-dt/c[5][0][0])
                means.append((new+adaptation[odor])/2)
                adaptation[odor]=new
            kc=[means[i]*e["odor"][i] for i in range(2)]
            current_input=[[base_input[j]+(dw[i][j-3] if j>=3 else 0.) for j in range(6)] for i in range(2)]
            external=[math.fsum(current_input[i][j]*kc[i] for i in range(2)) for j in range(6)]
            external[0]+=27.85*e["punishment"]
            external[2]+=11.38*e["punishment"]
            baseline=[0.,0.,0.,35.2,9.,11.2]
            caps=[71.66,17.9,31.16]
            activity=[0.]*6
            for target in (3,4,5,0,1,2):
                raw=external[target]+baseline[target]+math.fsum(weights[pre][target]*activity[pre] for pre in range(6))
                activity[target]=(min(max(raw,0.),caps[target-3]) if target>=3 else raw)-baseline[target]
            # The last event of the second training block is number 32.
            previous=post_training
            if e["eventOneBased"]>32:
                post_training+=dt
            early=dt if post_training<=10800 else max(0.,10800-previous)
            late=dt-early
            for source in range(2):
                for target in range(3):
                    pre_odor=math.fsum(current_input[i][target]*kc[i] for i in range(2))
                    feedback=math.fsum(weights[i+3][target]*activity[i+3] for i in range(3))
                    shock=[27.85,0.,11.38][target]
                    delta=kc[source]*(coefficient*dt/90*(pre_odor+feedback)+shock_coefficient*shock*dt/90*e["punishment"])
                    tau_early=tau[0] if target==0 else tau[1]
                    tau_late=tau[0] if target==0 else tau[2]
                    dw[source][target]=(dw[source][target]+delta)*math.exp(-early/tau_early)*math.exp(-late/tau_late)
            differences=[abs(a-b) for a,b in zip(activity,logged["activity"])]+[abs(a-b) for a,b in zip(adaptation,logged["adaptation"])]
            differences += [abs(dw[i][j]-logged["changes"][i][j]) for i in range(2) for j in range(3)]
            maximum=max(maximum,max(differences))
            if e["imaging"]:
                odor=e["imaging"]-1
                maximum=max(maximum,max(abs(activity[j]-run["responses"][j][odor][session]) for j in range(6)))
                observed_count+=1
                session+=int(odor==1)
        key=f"{run['modules']}m/{run['protocol']}/{run['context']}/{run['intervention']}"
        max_state=max(max_state,maximum)
        check("separate scalar replay "+key,maximum<=1e-10 and observed_count==12,maximum)
    with (result/"PREDICTIONS.csv").open(newline="",encoding="utf-8") as stream:
        rows=list(csv.DictReader(stream))
    for metric in metrics:
        selected=[r for r in rows if int(r["modules"])==metric["modules"] and
                  r["protocol"]==metric["protocol"] and int(r["context"])==metric["context"] and
                  r["intervention"]==metric["intervention"] and r["includedInScore"]=="True"]
        residuals=[float(r["predicted"])-float(r["mean"]) for r in selected]
        squared=math.fsum((v/float(r["sem"]))**2 for v,r in zip(residuals,selected))
        rms=math.sqrt(math.fsum(v*v for v in residuals)/len(residuals))
        check("recomputed score "+metric["key"],len(selected)==metric["count"] and
              math.isclose(squared,metric["weightedSquaredError"],rel_tol=1e-13,abs_tol=1e-12) and
              math.isclose(rms,metric["rmseHz"],rel_tol=1e-13,abs_tol=1e-12))
    receipt={"checks":checks,"passed":sum(c["passed"] for c in checks),"total":len(checks),
        "maxSeparateStateDifference":max_state,"checkerSha256":sha(Path(__file__)),
        "originalModelImported":False,"nativeMatlabExecuted":False,"independentHumanReview":False}
    with output.open("x",encoding="utf-8") as stream:
        json.dump(receipt,stream,indent=2,allow_nan=False)
    print(json.dumps({k:v for k,v in receipt.items() if k!="checks"}))
    if not all(c["passed"] for c in checks):
        print(json.dumps([c for c in checks if not c["passed"]]))
        raise SystemExit(1)


if __name__=="__main__":
    main()
