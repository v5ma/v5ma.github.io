"""One small foreground, create-only multiview experiment case."""
import os
for key in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'): os.environ[key]='1'
import argparse
import json
import time
import numpy as np
from multiview_query import ROOT,APP,PLAN,digest,episode,fit_public_familiarization
from run_phase_receiver_case import low_priority


def save(path,value):
    with path.open('x',encoding='utf-8') as f:
        json.dump(value,f,separators=(',',':'),allow_nan=False)
        f.write('\n')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('case')
    parser.add_argument('--run',default='run-01')
    args=parser.parse_args()
    allowed='abcdefghijklmnopqrstuvwxyz0123456789-_'
    if not 1<=len(args.run)<=64 or not all(c in allowed for c in args.run): raise ValueError('Simple run name required')
    start=time.perf_counter(); priority=low_priority()
    plan=json.loads(PLAN.read_text('utf-8'))
    assert digest(ROOT/plan['sourceModel'])==plan['sourceModelSha256']
    matrix=np.array(json.loads((ROOT/plan['sourceModel']).read_text('utf-8'))['matrix'])
    code={n:digest(ROOT/'tools'/n) for n in ('multiview_query.py','run_multiview_query.py')}
    if args.case=='prepare':
        out=APP/'familiarization-01'; out.mkdir(exist_ok=False)
        for condition in ('intact','ort-removed'):
            lesson=fit_public_familiarization(plan,matrix,condition)
            save(out/(condition+'.json'),lesson)
        receipt=dict(planSha256=digest(PLAN),sourceModelSha256=plan['sourceModelSha256'],codeSha256=code,
                     files={n:digest(out/n) for n in ('intact.json','ort-removed.json')},
                     seconds=time.perf_counter()-start,priority=priority,syntheticTeaching=True,biologicalData=False)
        save(out/'EXECUTION.json',receipt)
        print(json.dumps(receipt)); return
    case=next(c for c in plan['cases'] if c['id']==args.case)
    training=APP/'familiarization-01'
    receipt=json.loads((training/'EXECUTION.json').read_text('utf-8'))
    assert receipt['planSha256']==digest(PLAN) and receipt['codeSha256']==code,'Freeze plan/code or version training'
    lesson_name='ort-removed.json' if case['receiver']=='ort-reacquired' else 'intact.json'
    assert digest(training/lesson_name)==receipt['files'][lesson_name]
    lesson=json.loads((training/lesson_name).read_text('utf-8'))
    out=APP/args.run/args.case
    assert out.resolve().parent.parent==APP.resolve()
    out.mkdir(parents=True,exist_ok=False)
    try:
        rows=[]
        for scenario in plan['scenarios']:
            for seed in plan['seeds']:
                if time.perf_counter()-start>plan['resources']['maximumCaseSeconds']: raise TimeoutError('Case resource cap')
                rows.append(episode(plan,matrix,lesson,case,scenario,seed))
        save(out/'EPISODES.json',dict(case=case,episodes=rows))
        total=dict(case=case['id'],episodes=len(rows),events=sum(len(e['events']) for e in rows),
                   **{m:sum(e['metrics'][m] for e in rows) for m in ('observed','inferred','unresolved','queries','bindingErrors')},
                   meanFinalStandoffError=sum(e['metrics']['finalStandoffError'] for e in rows)/len(rows),
                   learnedUnchanged=all(e['metrics']['learnedUnchanged'] for e in rows))
        save(out/'SUMMARY.json',total)
        elapsed=time.perf_counter()-start; size=(out/'EPISODES.json').stat().st_size
        assert elapsed<plan['resources']['maximumCaseSeconds'] and size<plan['resources']['maximumCaseBytes']
        done=dict(planSha256=digest(PLAN),codeSha256=code,familiarization=lesson_name,lessonSha256=digest(training/lesson_name),
                  sourceModelSha256=plan['sourceModelSha256'],episodeSha256=digest(out/'EPISODES.json'),summarySha256=digest(out/'SUMMARY.json'),
                  seconds=elapsed,bytes=size,priority=priority,numericalThreads=1,**total)
        save(out/'EXECUTION.json',done)
        print(json.dumps(done))
    except Exception as exc:
        save(out/'FAILURE.json',dict(error=str(exc),seconds=time.perf_counter()-start,codeSha256=code,planSha256=digest(PLAN)))
        raise


if __name__=='__main__': main()
