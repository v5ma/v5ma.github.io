"""Conditional intervention witness: exact linear solution plus scalar RK4.

This is not a calibrated fly circuit, temporal parameter fit or SAN simulation.
The numerical methods share the declared equations but not a derivative function.
"""
import os
for name in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[name] = "1"
import hashlib
import json
import time
from pathlib import Path
import numpy as np
from run_phase_receiver_case import low_priority

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"application/receiver-intervention-contract-v0"


def exact_trace(parameters, condition, drive, times):
    c,h,e,delta,tp,td=(parameters[k] for k in ("c","h","e","delta","tauP","tauD"))
    if condition=="receptor-input-removed": h=0.0
    if condition=="output-disconnected": c=0.0
    if condition=="cell-clamped":
        p=drive*(1-np.exp(-times/tp))-c*delta
        return np.column_stack((p,np.full_like(times,-delta))),np.array([drive-c*delta,-delta])
    A=np.array([[-1/tp,c/tp],[(e-h)/td,-1/td]],dtype=float)
    b=np.array([drive/tp,0.0])
    eq=-np.linalg.solve(A,b)
    values,vectors=np.linalg.eig(A)
    assert np.max(values.real)<0
    coeff=np.linalg.solve(vectors,-eq)
    states=eq+(np.exp(np.outer(times,values))*coeff)@vectors.T
    assert np.max(np.abs(states.imag))<1e-12
    return states.real,eq


def scalar_rk4(parameters,condition,drive,step,nsteps):
    # Written separately from the vector generator above, including initialization.
    P,D=0.,0.
    if condition=="cell-clamped":
        P=-parameters["c"]*parameters["delta"]
        D=-parameters["delta"]
    out=[(P,D)]
    def derivative(p,d):
        cp=0. if condition=="output-disconnected" else parameters["c"]
        hp=0. if condition=="receptor-input-removed" else parameters["h"]
        dp=(-p+drive+cp*d)/parameters["tauP"]
        dd=0. if condition=="cell-clamped" else (-d+(parameters["e"]-hp)*p)/parameters["tauD"]
        return dp,dd
    for _ in range(nsteps):
        a,b=derivative(P,D)
        c,d=derivative(P+step*a/2,D+step*b/2)
        e,f=derivative(P+step*c/2,D+step*d/2)
        g,h=derivative(P+step*e,D+step*f)
        P+=step*(a+2*c+2*e+g)/6
        D+=step*(b+2*d+2*f+h)/6
        out.append((P,D))
    return np.array(out)


def main():
    started=time.perf_counter()
    priority=low_priority()
    plan_path=BASE/"ANALYSIS-PLAN.json"
    plan=json.loads(plan_path.read_text(encoding="utf-8"))
    out=BASE/"run-01"
    assert not out.exists(),"Preserve old runs"
    out.mkdir()
    p=plan["parameters"]
    assert p["c"]*p["e"]<1 and p["h"]>p["e"]>=0
    n=round(plan["duration"]/plan["step"])
    times=np.arange(n+1)*plan["step"]
    offset=np.array([p["P0"],p["D0"]])
    rows=[]
    max_error=0.
    by_key={}
    assertions=[]
    def check(label,value):
        assert value,label
        assertions.append(label)
    for drive in plan["inputs"]:
        for cond in plan["conditions"]:
            states,eq=exact_trace(p,cond,drive,times)
            for step in (plan["step"],plan["independentCheckStep"]):
                numeric=scalar_rk4(p,cond,drive,step,round(plan["duration"]/step))
                numeric=numeric[::round(plan["step"]/step)]
                err=float(np.max(np.abs(numeric-states)))
                max_error=max(max_error,err)
                check(f"rk4:{drive}:{cond}:{step}",err<plan["comparisonTolerance"])
            c=0. if cond=="output-disconnected" else p["c"]
            h=0. if cond=="receptor-input-removed" else p["h"]
            if cond=="cell-clamped":
                expected=np.array([drive-c*p["delta"],-p["delta"]])
            else:
                peq=drive/(1+c*(h-p["e"]))
                expected=np.array([peq,(p["e"]-h)*peq])
            check(f"equilibrium:{drive}:{cond}",float(np.max(np.abs(eq-expected)))<1e-12)
            check(f"absolute-states-positive:{drive}:{cond}",float((states+offset).min())>0)
            by_key[(drive,cond)]=states
            rows.append({"drive":drive,"condition":cond,"absoluteStates":(states+offset).tolist(),
                         "equilibriumAbsolute":(eq+offset).tolist(),
                         "initialAbsolute":(states[0]+offset).tolist(),
                         "baselineSubtractedP":(states[:,0]-states[0,0]).tolist()})
        intact=by_key[(drive,"intact")]
        restored=by_key[(drive,"restored")]
        cut=by_key[(drive,"output-disconnected")]
        clamp=by_key[(drive,"cell-clamped")]
        check(f"restoration:{drive}",bool(np.array_equal(intact,restored)))
        check(f"absolute-non-equivalence:{drive}",float(np.max(np.abs(clamp[:,0]-cut[:,0]+p["c"]*p["delta"])))<1e-12)
        check(f"baseline-equivalence:{drive}",float(np.max(np.abs((clamp[:,0]-clamp[0,0])-(cut[:,0]-cut[0,0]))))<1e-12)
    damaged=by_key[(plan["inputs"][0],"intact")].copy()
    damaged[17,0]+=0.01
    ref=scalar_rk4(p,"intact",plan["inputs"][0],plan["independentCheckStep"],round(plan["duration"]/plan["independentCheckStep"]))[::2]
    check("one-saved-point-mutation-rejected",float(np.max(np.abs(ref-damaged)))>plan["comparisonTolerance"])
    trajectory={"times":times.tolist(),"rows":rows,"units":plan["units"]}
    data=(json.dumps(trajectory,separators=(",",":"))+"\n").encode()
    (out/"TRAJECTORIES.json").write_bytes(data)
    receipt={"planSha256":hashlib.sha256(plan_path.read_bytes()).hexdigest(),
             "runnerSha256":hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
             "trajectorySha256":hashlib.sha256(data).hexdigest(),"trajectories":len(rows),
             "timePointsEach":len(times),"checksPassed":len(assertions),"checks":assertions,
             "maxRK4Error":max_error,"absolutePGap":p["c"]*p["delta"],
             "seconds":time.perf_counter()-started,"priority":priority,
             "rawBiologicalData":False,"nativePhysiologyFit":False,"newConnectedEpisodes":0,
             "independentReview":False}
    assert receipt["seconds"]<plan["resourceLimit"]["maxSeconds"]
    (out/"CHECKS.json").write_text(json.dumps(receipt,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in receipt.items() if k!="checks"}))


if __name__=="__main__":main()
