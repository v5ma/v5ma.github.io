"""Local equation translation of the published Huerkey et al. motor component.

mV, ms, nS, pA, pF. No Brian/author code execution or symbolic eval.
This is not a SAN, perceptual or whole-connectome implementation.
"""
import ast
import json
import math
from pathlib import Path
import time
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "sources/flight-timing-model-03/download"
REF = ROOT / "sources/flight-timing-reference-04/download"
UNITS = {"mV":1.0,"ms":1.0,"pA":1.0,"nA":1000.0,"nsiemens":1.0,"pfarad":1.0,"nF":1000.0}


def number(expression):
    """Only scalar numeric literals, named units and arithmetic; never eval."""
    if isinstance(expression, (float,int)):
        return float(expression)
    def visit(node):
        if isinstance(node, ast.Constant) and type(node.value) in (int,float):
            return float(node.value)
        if isinstance(node, ast.Name) and node.id in UNITS:
            return UNITS[node.id]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            return -visit(node.operand)
        if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Mult,ast.Div)):
            left,right=visit(node.left),visit(node.right)
            return left*right if isinstance(node.op,ast.Mult) else left/right
        raise ValueError("Unsupported parameter expression")
    return visit(ast.parse(expression,mode="eval").body)


def parameters(regime):
    if regime not in ("SNL","SNIC"):
        raise ValueError("Unknown source regime")
    raw=json.loads((SRC/("cfg-Berger_"+regime+".json")).read_text("utf-8"))
    return {k:number(v) for k,v in raw["parameters"].items()}


def arrays(name,count):
    path=REF/name
    result=[]
    with path.open("rb") as stream:
        for _ in range(count):
            value=np.load(stream,allow_pickle=False)
            if value.dtype.kind not in "fiu" or not np.isfinite(value).all():
                raise ValueError("Unexpected native numeric array")
            result.append(value)
        if stream.read(1):
            raise ValueError("Unexpected trailing native array/data")
    return result


def native(regime):
    t,v,b,h=arrays("StMs-initial_"+regime+"_StM.npy",4)
    spikes,indices=arrays("SpMs-initial_"+regime+"_SpM.npy",2)
    if v.shape != b.shape or v.shape != h.shape or v.shape != (1,len(t)):
        raise ValueError("Unknown native state shape")
    return t*1000,np.vstack((v[0]*1000,h[0],b[0])),spikes*1000,indices


def phase_initial(regime, fractions):
    t,states,spikes,_=native(regime)
    mask=(t>spikes[-2]) & (t<spikes[-1])
    cycle=states[:,mask]
    indices=np.around(cycle.shape[1]*np.asarray(fractions)).astype(int)
    if not np.all((indices>=0)&(indices<cycle.shape[1])):
        raise ValueError("Phase index outside native cycle")
    return cycle[:,indices].copy(), {"nativeCycleSamples":int(cycle.shape[1]),"selectedCycleIndices":indices.tolist(),"bracketingSpikesMs":spikes[-2:].tolist()}


def rhs(state,p,gap_current=0.0):
    v,h,b=state
    ah=p["cQ"]*p["zh"]*(v-p["vh"])
    ab=p["cQ"]*p["zb"]*(v-p["vb"])
    em=np.exp(-p["cQ"]*p["zm"]*(v-p["vm"]))
    eh=np.exp(-ah)
    eb=np.exp(-ab)
    minf=1/(1+em)
    hinf=1/(1+eh)
    binf=1/(1+eb)
    tauh=np.exp(-p["gah"]*ah)/(p["rh"]*(1+eh))
    taub=np.exp(-p["gab"]*ab)/(p["rb"]*(1+eb))
    ion=p["gl"]*(v-p["Ele"])+p["gna"]*minf**3*(1-h)*(v-p["Ena"])+p["gsb"]*b**4*(v-p["Ek"])
    return np.array(((p["I_in"]+gap_current-ion)/p["Cm"],(hinf-h)/tauh,(binf-b)/taub))


def rk4(state,p,dt,gap_current=0.0):
    k1=rhs(state,p,gap_current)
    k2=rhs(state+dt*k1/2,p,gap_current)
    k3=rhs(state+dt*k2/2,p,gap_current)
    k4=rhs(state+dt*k3,p,gap_current)
    return state+dt*(k1+2*k2+2*k3+k4)/6


def scalar_rhs(state,p):
    """A separately evaluated scalar path for native single-cell replay."""
    v,h,b=state
    m=1/(1+math.exp(-p["cQ"]*p["zm"]*(v-p["vm"])))
    z_h=p["cQ"]*p["zh"]*(v-p["vh"])
    z_b=p["cQ"]*p["zb"]*(v-p["vb"])
    h_inf=1/(1+math.exp(-z_h))
    b_inf=1/(1+math.exp(-z_b))
    h_rate=p["rh"]*(1+math.exp(-z_h))/math.exp(-p["gah"]*z_h)
    b_rate=p["rb"]*(1+math.exp(-z_b))/math.exp(-p["gab"]*z_b)
    leak=p["gl"]*(v-p["Ele"])
    sodium=p["gna"]*m*m*m*(1-h)*(v-p["Ena"])
    potassium=p["gsb"]*b*b*b*b*(v-p["Ek"])
    return ((p["I_in"]-leak-sodium-potassium)/p["Cm"],(h_inf-h)*h_rate,(b_inf-b)*b_rate)


def scalar_step(y,p,dt):
    a=scalar_rhs(y,p)
    b=scalar_rhs(tuple(y[i]+dt*a[i]/2 for i in range(3)),p)
    c=scalar_rhs(tuple(y[i]+dt*b[i]/2 for i in range(3)),p)
    d=scalar_rhs(tuple(y[i]+dt*c[i] for i in range(3)),p)
    return tuple(y[i]+dt*(a[i]+2*b[i]+2*c[i]+d[i])/6 for i in range(3))


def run_network(initial,p,gap,dt,duration,record_ms=1.0,budget=40):
    count=round(duration/dt)
    stride=round(record_ms/dt)
    n=initial.shape[1]
    if gap.shape!=(n,n) or not np.allclose(gap,gap.T) or not np.all(gap>=0):
        raise ValueError("Unexpected electrical coupling matrix")
    if abs(count*dt-duration)>1e-9 or abs(stride*dt-record_ms)>1e-9:
        raise ValueError("Incommensurate clocks")
    state=initial.copy()
    trace=np.empty((count//stride+1,3,n))
    times=np.arange(len(trace))*record_ms
    spikes=[[] for _ in range(n)]
    last=np.full(n,-1e9)
    started=time.perf_counter()
    for step in range(count+1):
        if step%stride==0:
            trace[step//stride]=state
        if step==count:
            break
        # Brian's separately summed synaptic variable is held over an intrinsic step.
        current=gap.T@state[0]-gap.sum(axis=0)*state[0]
        state=rk4(state,p,dt,current)
        time_label=step*dt
        fired=(state[0]>-10)&(time_label-last>=10-1e-10)
        for i in np.flatnonzero(fired):
            spikes[i].append(time_label)
            last[i]=time_label
        if step%500==0:
            if time.perf_counter()-started>budget:
                raise TimeoutError("Foreground timing-model budget reached")
            if not np.isfinite(state).all() or not np.all((state[1:]>=-1e-9)&(state[1:]<=1+1e-9)):
                raise ArithmeticError("State left physical/numerical bounds; no clipping applied")
    return times,trace,spikes,time.perf_counter()-started


def phase_measures(spikes,lower=2000,upper=5000):
    trains=[np.asarray(s) for s in spikes]
    if any(len(t)<2 for t in trains):
        return {"status":"insufficient_spikes"},None,None
    lo=max(lower,max(t[0] for t in trains))
    hi=min(upper,min(t[-1] for t in trains))
    times=np.arange(lo,hi,1.0)
    if len(times)==0:
        return {"status":"no_common_phase_window"},None,None
    phases=[]
    for train in trains:
        index=np.searchsorted(train,times,side="right")-1
        phases.append((times-train[index])/(train[index+1]-train[index]))
    phases=np.asarray(phases)
    ordered=np.sort(phases,axis=0)
    gaps=np.vstack((np.diff(ordered,axis=0),1+ordered[0]-ordered[-1]))
    n=len(trains)
    gamma=n/(n-1)*np.sum((gaps-1/n)**2,axis=0)
    score=1-float(np.sqrt(np.mean(gamma)))
    return {"status":"measured","phaseSamples":len(times),"phaseWindowMs":[float(times[0]),float(times[-1])],"splayness":score,"meanFirstHarmonicOrder":float(np.mean(abs(np.mean(np.exp(2j*np.pi*phases),axis=0)))),"medianLateFrequenciesHz":[float(1000/np.median(np.diff(t[t>=lower]))) if len(t[t>=lower])>1 else None for t in trains],"spikeCounts":[len(t) for t in trains]},times,phases
