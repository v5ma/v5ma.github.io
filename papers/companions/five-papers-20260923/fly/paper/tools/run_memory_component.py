# SPDX-License-Identifier: GPL-3.0-or-later
# Model adapted from Luo, Huang and Schnitzer (2024), pinned source in ATTRIBUTION.md.
# Local adaptation and checks, 19 September 2026. No warranty. No author endorsement.
"""Small no-refit replay; never overwrite a prior result directory."""
import os
for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[key] = "1"
import ctypes
import csv
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import sys
import time
import numpy as np

if os.name == "nt":
    ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)
ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "application/memory-component-v0"
BASE = np.array([0.,0.,0.,35.2,9.,11.2])
MAXIMUM = BASE[3:] + np.array([36.46,8.9,19.96])
SHOCK = np.array([27.85,0.,11.38,0.,0.,0.])
DEADLINE = math.inf


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def json_out(path, value):
    with path.open("x",encoding="utf-8") as stream:
        json.dump(value,stream,indent=2,allow_nan=False)


def make_protocol(kind):
    """Literal defaults plus the modifications of each of the two source scripts."""
    rests = {"fitting_script":[3600,6950,75100],
             "figure_5c_script":[3050,6950,75350]}[kind]
    sessions = ["imaging","training","imaging","training","imaging",
                "rest","imaging","rest","imaging","rest","imaging"]
    events = []
    rest = 0
    for session in sessions:
        if session == "rest":
            events.append({"name":session,"sub":"rest","duration":rests[rest],
                           "odor":[0,0],"punishment":0,"imaging":0})
            rest += 1
            continue
        training = session == "training"
        durations = [30,135,30,135] if training else [5,120,5,120]
        for repeat in range(3 if training else 1):
            for sub,duration,odor,pun,imaging in zip(
                ["CS+","ISI","CS-","ISI"],durations,[[1,0],[0,0],[0,1],[0,0]],
                [int(training),0,0,0],[0,0,0,0] if training else [1,0,2,0]):
                events.append({"name":session,"sub":sub,"duration":duration,
                               "odor":odor,"punishment":pun,"imaging":imaging})
    if kind == "figure_5c_script":
        for index in (3,15,19,31):
            events[index]["duration"] = 300
    elapsed = 0
    for index,event in enumerate(events):
        event["eventOneBased"] = index+1
        event["startSeconds"] = elapsed
        elapsed += event["duration"]
        event["endSeconds"] = elapsed
    return events


def activate(x):
    return np.concatenate((x[:3],np.minimum(np.maximum(x[3:],0.),MAXIMUM)))


def direct_activity(u, weights):
    """Independent scalar topological evaluation, without iteration or matrix inverse.

    For this source graph only: gamma MBON -> alpha MBONs -> DANs.
    Source edges violating this order are rejected, not silently ignored.
    """
    order = [3,4,5,0,1,2]
    position = {cell:i for i,cell in enumerate(order)}
    for pre in range(6):
        for post in range(6):
            if weights[pre,post] != 0 and position[pre] >= position[post]:
                raise ValueError("Topological oracle is invalid for this edge")
    answer = [0.]*6
    for post in order:
        current = float(u[post])+float(BASE[post])+math.fsum(
            float(weights[pre,post])*answer[pre] for pre in range(6))
        if post >= 3:
            current = min(max(current,0.),float(MAXIMUM[post-3]))
        answer[post] = current-float(BASE[post])
    return np.array(answer)


def original_activity(u, weights):
    # The source initial inverse is not transposed; ten subsequent updates are.
    x = np.linalg.solve(np.eye(6)-weights,u)
    for _ in range(10):
        delta = activate(u+BASE+weights.T@x)-BASE-x
        x = delta+x
    residual = activate(u+BASE+weights.T@x)-BASE-x
    oracle = direct_activity(u,weights)
    return x,float(np.max(np.abs(residual))),float(np.max(np.abs(x-oracle)))


def replay(cells, context, protocol, intervention="none"):
    cells = [np.array(c,dtype=float,copy=True) for c in cells]
    input_columns = [0,1,2,3,4,5] if context == 0 else [6,7,8,3,4,5]
    input0 = np.repeat(cells[0][:,input_columns],2,axis=0)
    inputs = input0.copy()
    weights = cells[3].copy()
    fw0,fw_dt = float(cells[1][0,0]),float(cells[2][0,0])
    if intervention == "plasticity_zero":
        fw0,fw_dt = 0.,0.
    elif intervention == "gamma_to_DAN_removed":
        weights[3,:3] = 0.
    elif intervention not in ("none","rescue"):
        raise ValueError(intervention)
    tau = cells[4][0]
    tau_odor = float(cells[5][0,0])
    adaptation = np.ones(2)
    changes = np.zeros((2,3))
    last_train = max(i for i,e in enumerate(protocol) if e["name"]=="training")
    cumulative = 0.
    imaging_index = 0
    responses = np.zeros((6,2,6))
    events = []
    residual_max = oracle_max = 0.
    for index,event in enumerate(protocol):
        if time.perf_counter() > DEADLINE:
            raise TimeoutError("Bounded run deadline exceeded")
        odor = np.array(event["odor"],dtype=float)
        duration = float(event["duration"])
        end = adaptation*np.exp(-.05*duration*odor)
        end = 1.-(1.-end)*math.exp(-duration/tau_odor)
        mean = (adaptation+end)/2.
        adaptation = end
        kc = mean*odor
        drive = inputs.T@kc+SHOCK*event["punishment"]
        activity,residual,oracle = original_activity(drive,weights)
        residual_max = max(residual_max,residual)
        oracle_max = max(oracle_max,oracle)
        teaching = fw0*duration/90.*(inputs[:,:3].T@kc+weights[3:,:3].T@activity[3:])
        teaching += fw_dt*SHOCK[:3]*duration/90.*event["punishment"]
        changes += np.outer(kc,teaching)
        if index > last_train:
            cumulative += duration
        if cumulative <= 10800.:
            changes *= np.exp(-duration/tau[[0,1,1]])
        elif 10800. > cumulative-duration:
            before = 10800.-(cumulative-duration)
            changes *= np.exp(-before/tau[[0,1,1]])
            changes *= np.exp(-(duration-before)/tau[[0,2,2]])
        else:
            changes *= np.exp(-duration/tau[[0,2,2]])
        inputs = input0+np.concatenate((np.zeros((2,3)),changes),axis=1)
        if event["imaging"]:
            responses[:,event["imaging"]-1,imaging_index] = activity
            imaging_index += int(event["imaging"]==2)
        assert np.isfinite(activity).all() and np.isfinite(changes).all()
        assert np.all(activity[3:]+BASE[3:] >= -1e-10)
        assert np.all(activity[3:]+BASE[3:] <= MAXIMUM+1e-10)
        assert np.all(adaptation >= 0) and np.all(adaptation <= 1)
        events.append({"eventOneBased":index+1,"adaptation":adaptation.tolist(),
            "kc":kc.tolist(),"activity":activity.tolist(),"changes":changes.tolist(),
            "cumulativeAfterLastTrainingSeconds":cumulative,
            "fixedPointResidualHz":residual,"directOracleDifferenceHz":oracle})
    assert imaging_index == 6
    return {"responses":responses.tolist(),"events":events,
            "maxFixedPointResidualHz":residual_max,"maxDirectOracleDifferenceHz":oracle_max}


def main():
    global DEADLINE
    name = sys.argv[1]
    if not name.startswith("results-") or any(c not in "abcdefghijklmnopqrstuvwxyz0123456789-" for c in name):
        raise ValueError("Use a simple, new results directory name")
    out = APP/name
    out.mkdir(exist_ok=False)
    plan_path = APP/"ANALYSIS-PLAN.json"
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    params = json.loads((APP/"inputs/parameters.json").read_text(encoding="utf-8"))
    data = json.loads((APP/"inputs/observations.json").read_text(encoding="utf-8"))
    for source in params["sources"]+[data]:
        assert sha(Path(source["path"])) == source["sha256"]
    assert data["sha256"] == plan["dataSha256"]
    checks = []
    def check(label, condition, detail=None):
        checks.append({"check":label,"passed":bool(condition),"detail":detail})
    check("86 observed aggregate means, 58 missing",(data["countObserved"],data["countMissing"])==(86,58))
    for model in params["models"]:
        rebuilt = []
        for array,mapping in zip(model["cells"],model["allocation"]):
            flattened=np.array(array).reshape(-1,order="F")
            rebuilt.extend(flattened[mapping["freeIndicesFortranZeroBased"]].tolist())
        check(f"{model['modules']}-module parameter allocation roundtrip",rebuilt==model["parameterVector"])
    protocols = {kind:make_protocol(kind) for kind in plan["protocols"]}
    for kind,events in protocols.items():
        check(kind+" 51 events",len(events)==51)
        check(kind+" six punishment pairings",sum(e["punishment"] for e in events)==6)
        check(kind+" twelve imaging observations",sum(e["imaging"]>0 for e in events)==12)
    start = time.perf_counter()
    DEADLINE = start+plan["resourceLimits"]["maximumSeconds"]
    runs = []
    for model in params["models"]:
        for kind,events in protocols.items():
            for context in range(2):
                result = replay(model["cells"],context,events)
                runs.append({"modules":model["modules"],"protocol":kind,"context":context,
                             "intervention":"none",**result})
    model3 = next(m for m in params["models"] if m["modules"]==3)
    for control in ("plasticity_zero","gamma_to_DAN_removed","rescue"):
        for context in range(2):
            result = replay(model3["cells"],context,protocols["figure_5c_script"],control)
            runs.append({"modules":3,"protocol":"figure_5c_script","context":context,
                         "intervention":control,**result})
    elapsed = time.perf_counter()-start
    rows = []
    metrics = []
    for run in runs:
        key=f"{run['modules']}m/{run['protocol']}/{run['context']}/{run['intervention']}"
        check(key+" equation residual",run["maxFixedPointResidualHz"]<=plan["equationToleranceHz"],run["maxFixedPointResidualHz"])
        check(key+" topological oracle",run["maxDirectOracleDifferenceHz"]<=plan["equationToleranceHz"],run["maxDirectOracleDifferenceHz"])
        predictions = np.array(run["responses"])
        errors = []
        scaled = []
        for observation in data["records"]:
            if observation["context"] != run["context"]:
                continue
            cell,odor,t = observation["cell"],observation["odor"],observation["time"]
            retained = not (run["modules"]==2 and cell in (1,4))
            used = retained and observation["mean"] is not None
            predicted = float(predictions[cell,odor,t])
            residual = predicted-observation["mean"] if used else None
            standardized = residual/observation["sem"] if used else None
            rows.append({"modules":run["modules"],"protocol":run["protocol"],
                "intervention":run["intervention"],**observation,"predicted":predicted,
                "includedInScore":used,"residual":residual,"standardizedResidual":standardized})
            if used:
                errors.append(residual)
                scaled.append(standardized)
        metrics.append({"key":key,"modules":run["modules"],"protocol":run["protocol"],
            "context":run["context"],"intervention":run["intervention"],"count":len(errors),
            "weightedSquaredError":math.fsum(v*v for v in scaled),
            "standardizedRMSE":math.sqrt(math.fsum(v*v for v in scaled)/len(scaled)),
            "rmseHz":math.sqrt(math.fsum(v*v for v in errors)/len(errors))})
        if run["intervention"]=="plasticity_zero":
            check(key+" no learned weight change",all(v==0 for e in run["events"] for row in e["changes"] for v in row))
            check(key+" adaptation retained",any(v!=1 for e in run["events"] for v in e["adaptation"]))
        if run["intervention"]=="rescue":
            reference=next(r for r in runs if r["modules"]==3 and r["context"]==run["context"] and r["protocol"]=="figure_5c_script" and r["intervention"]=="none")
            check(key+" identical rescue",run["responses"]==reference["responses"] and run["events"]==reference["events"])
    check("bounded elapsed time",elapsed<plan["resourceLimits"]["maximumSeconds"],elapsed)
    json_out(out/"PROTOCOLS.json",protocols)
    json_out(out/"RUNS.json",runs)
    json_out(out/"METRICS.json",metrics)
    with (out/"PREDICTIONS.csv").open("x",newline="",encoding="utf-8") as stream:
        writer=csv.DictWriter(stream,fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    json_out(out/"CHECKS.json",checks)
    receipt={"createdUtc":datetime.now(timezone.utc).isoformat(),"seconds":elapsed,
        "runs":len(runs),"eventStates":sum(len(r["events"]) for r in runs),
        "recordedResponseRows":len(rows),"checks":len(checks),
        "checksPassed":sum(c["passed"] for c in checks),"threads":1,"newFits":0,
        "monteCarloSamples":0,"nativeMatlabExecuted":False,"newBiologicalExperiments":0,
        "sourceCommit":plan["sourceCommit"],"planSha256":sha(plan_path),"scriptSha256":sha(Path(__file__)),
        "inputHashes":{str(p.relative_to(ROOT)):sha(p) for p in [APP/"inputs/parameters.json",APP/"inputs/observations.json"]},
        "outputHashes":{p.name:sha(p) for p in [out/"PROTOCOLS.json",out/"RUNS.json",out/"METRICS.json",out/"PREDICTIONS.csv",out/"CHECKS.json"]},
        "status":"LOCAL_PARAMETER_REPLAY_NOT_PUBLISHED_FIGURE_REPRODUCTION"}
    json_out(out/"EXECUTION.json",receipt)
    print(json.dumps(receipt))
    if not all(c["passed"] for c in checks):
        raise SystemExit(1)


if __name__=="__main__":
    main()
