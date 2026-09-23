"""Native single-cell trace audit, no new fit or author-code execution."""
import ctypes
import hashlib
import json
import os
from pathlib import Path
import time
import numpy as np
import flight_timing_model as model

ROOT=model.ROOT
APP=ROOT/"application/flight-timing-component-v0"
OUT=APP/"native-audit-01"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if os.name=="nt":
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(),0x4000)
    OUT.mkdir(exist_ok=False)
    plan=json.loads((APP/"ANALYSIS-PLAN.json").read_text("utf-8"))
    started=time.perf_counter()
    report={"modelSha256":sha(Path(model.__file__)),"checkerSha256":sha(Path(__file__)),"planSha256":sha(APP/"ANALYSIS-PLAN.json"),"cases":[],"externalCodeExecuted":False,"biologicalDataAnalyzed":False,"independentReview":False}
    try:
        for regime in ("SNL","SNIC"):
            t,truth,spikes,indices=model.native(regime)
            p=model.parameters(regime)
            if not (np.allclose(np.diff(t),0.1,rtol=0,atol=1e-9) and np.all(indices==0)):
                raise ValueError("Unexpected native recording clock/identity")
            defects=[]
            for dt in plan["nativeAudit"]["oneStepSubstepsMs"]:
                state=truth[:,:-1].copy()
                for _ in range(round(0.1/dt)):
                    state=model.rk4(state,p,dt)
                error=np.max(abs(state-truth[:,1:]),axis=1)
                defects.append({"substepMs":dt,"voltageMaxDifferenceMv":float(error[0]),"gateMaxDifference":float(error[1:].max())})
            # Free-running scalar path starts at the source's actual first state,
            # not its unused JSON nominal h/b initial values.
            dt=plan["nativeAudit"]["fullReplayDtMs"]
            stride=round(0.1/dt)
            y=tuple(truth[:,0])
            replay=np.empty_like(truth)
            observed_spikes=[]
            last=-1e9
            for step in range(len(t)*stride):
                if step%stride==0:
                    replay[:,step//stride]=y
                y=model.scalar_step(y,p,dt)
                label=step*dt
                if y[0]>-10 and label-last>=10-1e-10:
                    observed_spikes.append(label)
                    last=label
                if step%5000==0 and time.perf_counter()-started>40:
                    raise TimeoutError("Native audit foreground budget reached")
            error=np.max(abs(replay-truth),axis=1)
            spike_error=max(abs(np.asarray(observed_spikes)-spikes)) if len(observed_spikes)==len(spikes) else None
            passed=bool(error[0]<=plan["nativeAudit"]["maxVoltageDifferenceMv"] and error[1:].max()<=plan["nativeAudit"]["maxGateDifference"] and spike_error is not None and spike_error<1e-8)
            filename=regime+"-NATIVE-REPLAY.npz"
            np.savez_compressed(OUT/filename,timeMs=t,replay=replay,native=truth,spikesMs=np.asarray(observed_spikes),nativeSpikesMs=spikes)
            report["cases"].append({"regime":regime,"nativeSamples":len(t),"comparedStateValues":truth.size,"nativeInitialState":truth[:,0].tolist(),"sourceNominalInitialGates":0.146,"oneStepDefects":defects,"fullReplayDtMs":dt,"fullReplayMaxVoltageDifferenceMv":float(error[0]),"fullReplayMaxGateDifference":float(error[1:].max()),"spikes":len(observed_spikes),"spikeMaxDifferenceMs":None if spike_error is None else float(spike_error),"passedDeclaredTolerance":passed,"output":filename,"outputSha256":sha(OUT/filename),"parameters":p})
        report["status"]="pass" if all(r["passedDeclaredTolerance"] for r in report["cases"]) else "discrepancy_retained"
    except Exception as error:
        report.update(status="stopped_safely",error=str(error))
    report["seconds"]=time.perf_counter()-started
    with (OUT/"EXECUTION.json").open("x",encoding="utf-8") as stream:
        json.dump(report,stream,indent=2,allow_nan=False)
    print(json.dumps(report,indent=2))


if __name__=="__main__":
    main()
