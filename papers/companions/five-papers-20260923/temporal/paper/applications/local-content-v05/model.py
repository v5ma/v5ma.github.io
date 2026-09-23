"""Finite local-state diagnostic. No history-list readout or scheduled branches."""
import os
for name in ('OPENBLAS_NUM_THREADS', 'OMP_NUM_THREADS', 'MKL_NUM_THREADS'):
    os.environ[name] = '1'
import argparse
import ctypes
import hashlib
import json
from pathlib import Path
import time
import numpy as np

ROOT = Path(__file__).resolve().parent
DT = .002
TAU = np.array([.4, 1.6])


def dynamics(n, variant):
    a, q = .05 + .01*np.arange(n), np.zeros(n)
    taus = .8*(np.linspace(.8,1.2,n) if variant == 'heterogeneous' else np.ones(n))
    out = []
    for k in range(9001):
        out.append(a.copy())
        inhib = 0 if variant == 'no_coupling' else 2*(a.sum()-a)
        target = np.maximum(0, 1-q-inhib)
        old = a.copy()
        a += DT/.05*(target-a)
        if variant == 'no_adaptation':
            q[:] = 0
        else:
            q += DT/taus*(1.7*old-q)
    out = np.array(out)
    final = out[6000:]
    dominant = final.argmax(axis=1)
    return out, {'dominance_changes': int(np.sum(dominant[1:] != dominant[:-1])),
                 'minimum_activity': float(final.min()), 'maximum_activity': float(final.max()),
                 'mean_simultaneously_above_0_1': float((final>.1).sum(axis=1).mean()),
                 'activation_range_each': np.ptp(final,axis=0).tolist()}


def write_content(h, activation, x):
    w = activation/activation.sum()
    h += w[:,None,None]*x[None,None,:]


def read_order(h):
    total = h.sum(axis=0)
    # Newer content has the less negative fast-minus-slow coefficient here.
    score = total[0]-total[1]
    delta = score[1]-score[0]
    return (0 if abs(delta)<1e-11 else (1 if delta>0 else -1)), float(delta)


def run():
    start = time.monotonic()
    cases, dyn, checks = [], {}, []
    for n in (2,3,4):
        for variant in ('baseline','no_adaptation','no_coupling','heterogeneous'):
            activity, summary = dynamics(n,variant)
            dyn[f'{n}:{variant}'] = summary
            for gap in (0,.15,.3,.6,.9):
                for delay in (0,.1,.2):
                    for order in (1,-1):
                        # Four coordinates: supplied object-feature conjunctions.
                        for binding in (1,-1):
                            ids = [0,3] if binding == 1 else [1,2]
                            if order == -1:
                                ids.reverse()
                            local = np.zeros((n,2,4))
                            aggregate = np.zeros((2,4))
                            for j,idx in enumerate(ids):
                                if j:
                                    decay = np.exp(-gap/TAU)
                                    local *= decay[None,:,None]
                                    aggregate *= decay[:,None]
                                x = np.eye(4)[idx]
                                ai = activity[6000+round(j*gap/DT)]
                                write_content(local,ai,x)
                                aggregate += x[None,:]
                            decay = np.exp(-delay/TAU)
                            local *= decay[None,:,None]
                            aggregate *= decay[:,None]
                            saved = local.copy()
                            # A/B designate the two contents in canonical order.
                            pair = [0,3] if binding == 1 else [1,2]
                            action, margin = read_order(local[:,:,pair])
                            strong, _ = read_order(aggregate[None,:,pair].transpose(0,2,1) if False else aggregate[None,:,:][:,:,pair])
                            summed = local.sum(axis=(0,1))
                            ownership = 1 if summed[[0,3]].sum()>summed[[1,2]].sum() else -1
                            local[:] = 0
                            erased,_ = read_order(local[:,:,pair])
                            local[:] = saved
                            rescued,_ = read_order(local[:,:,pair])
                            error = float(np.max(np.abs(local.sum(axis=0)-aggregate)))
                            # Independent direct sum of the two event kernels.
                            direct = np.stack([np.eye(4)[ids[0]]*np.exp(-(gap+delay)/tau)+np.eye(4)[ids[1]]*np.exp(-delay/tau) for tau in TAU])
                            direct_error = float(np.max(np.abs(direct-aggregate)))
                            checks.extend([error<1e-12,direct_error<1e-12,action==strong,rescued==action,erased==0,ownership==binding])
                            cases.append({'n':n,'variant':variant,'gap':gap,'delay':delay,'order':order,'binding':binding,'action':action,'order_correct': None if gap==0 else action==order,'ambiguous':action==0,'ownership_correct':ownership==binding,'margin':margin,'aggregate_error':error,'erased_action':erased,'rescued_action':rescued,'local_state':saved.tolist()})
            if time.monotonic()-start>180:
                raise SystemExit('Time cap')
    applicable = [c for c in cases if c['gap']>0]
    return {'protocol_sha256':hashlib.sha256((ROOT/'PROTOCOL.md').read_bytes()).hexdigest(), 'code_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'scope':'Synthetic local content and aggregate-equivalence diagnostic, not physiology or experience', 'dynamics':dyn,'cases':cases,'checks':{'passed':sum(bool(x) for x in checks),'total':len(checks)},'summary':{'case_count':len(cases),'sequential_correct':sum(c['order_correct'] for c in applicable),'sequential_total':len(applicable),'simultaneous_ambiguous':sum(c['ambiguous'] for c in cases if c['gap']==0),'simultaneous_total':sum(c['gap']==0 for c in cases),'ownership_correct':sum(c['ownership_correct'] for c in cases),'max_aggregate_error':max(c['aggregate_error'] for c in cases)},'marginal_control':'The two bindings have identical per-object and per-feature counts; these marginals cannot identify ownership.'}


if __name__ == '__main__':
    if os.name=='nt':
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(),0x4000)
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',required=True,choices=('run','replay'))
    args=parser.parse_args()
    output=ROOT/args.output
    output.mkdir(exist_ok=False)
    result=run()
    data=json.dumps(result,indent=2)+'\n'
    if len(data)>5*1024*1024:
        raise SystemExit('Size cap')
    (output/'RESULT.json').write_text(data,encoding='utf-8')
    print(json.dumps({'output':str(output),'summary':result['summary'],'checks':result['checks'],'dynamics':result['dynamics']}))
