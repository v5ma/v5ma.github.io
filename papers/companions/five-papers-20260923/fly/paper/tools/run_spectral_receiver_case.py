"""One create-only source-shaped sensory case; bounded serial foreground work."""
import os
for key in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'): os.environ[key]='1'
import copy
import json
import sys
import time
from run_phase_receiver_case import low_priority
from spectral_receiver_bridge import APP,PLAN,ROOT,construct_model,digest,episode,graph,load_inputs


def main():
    start=time.perf_counter()
    priority=low_priority()
    arg=sys.argv[1]
    if arg=='prepare':
        out=APP/'model-01'
        out.mkdir(exist_ok=False)
        model=construct_model()
        (out/'MODEL.json').write_text(json.dumps(model,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({k:model[k] for k in ('coarseResidual','fullDifference','fullNormalizedL1Separation')}))
        return
    plan,previous,seeds,routes,env,model=load_inputs()
    case=next(c for c in plan['cases'] if c['id']==arg)
    out=APP/'run-01'/arg
    out.mkdir(parents=True,exist_ok=False)
    deadline=start+plan['resourceLimits']['maximumCaseSeconds']
    try:
        settings=copy.deepcopy(previous['receiver'])
        if 'coupling' in case: settings['coupling']=case['coupling']
        if case['implementation']=='reference': adjacency,provenance=None,None
        else: adjacency,provenance=graph(seeds,routes,previous,case)
        episodes=[episode(env['configuration'],model,scenario,seed,case,adjacency,settings,deadline)
                  for scenario in env['scenarios'] for seed in env['seeds']]
        result=dict(case=case,settings=settings,graph=provenance,episodes=episodes)
        p=out/'EPISODES.json'
        p.write_text(json.dumps(result,separators=(',',':'),allow_nan=False)+'\n',encoding='utf-8')
        receipt=dict(status='executed',case=arg,episodes=len(episodes),events=sum(len(e['events']) for e in episodes),
            elapsedSeconds=time.perf_counter()-start,priority=priority,numericalThreads=1,
            planSha256=digest(PLAN),modelSha256=digest(APP/'model-01/MODEL.json'),
            episodesSha256=digest(p),outputBytes=p.stat().st_size,
            codeSha256={n:digest(ROOT/'tools'/n) for n in ('spectral_receiver_bridge.py','run_spectral_receiver_case.py','phase_receiver_bridge.py','embodied_reference.py')})
        assert receipt['elapsedSeconds']<40,'Runtime cap including serialization'
        (out/'EXECUTION.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
        print(json.dumps(receipt))
    except Exception as exc:
        (out/'FAILURE.json').write_text(json.dumps(dict(error=str(exc),elapsedSeconds=time.perf_counter()-start)),encoding='utf-8')
        raise


if __name__=='__main__': main()
