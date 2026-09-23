"""Separate scalar check of saved multiview receiver/query/body traces.

Does not import the new model or policy implementation. Same authoring agent,
not independent scientific review. Exact named cases only, no broad search.
"""
import os
for key in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'): os.environ[key]='1'
from pathlib import Path
from hashlib import sha256
import copy
import json
import math
import time
from run_phase_receiver_case import low_priority

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'application/multiview-query-v0'
ASSERTIONS=0


def read(path):
    assert path.stat().st_size<5_000_000
    return json.loads(path.read_text('utf-8'))
def sha(path): return sha256(path.read_bytes()).hexdigest()
def require(value,label):
    global ASSERTIONS
    ASSERTIONS+=1
    if not value: raise AssertionError(label)
def close(a,b,tol=1e-10):
    if isinstance(a,list) and isinstance(b,list): return len(a)==len(b) and all(close(x,y,tol) for x,y in zip(a,b))
    return math.isfinite(a) and math.isfinite(b) and abs(a-b)<=tol
def norm(x):
    y=[max(v,0.) for v in x]; s=sum(y)
    return [v/s for v in y] if s>1e-12 else [0.]*4
def distance(a,b): return math.sqrt(sum((x-y)**2 for x,y in zip(a,b,strict=True)))
def multiply(row,matrix): return [sum(x*matrix[i][j] for i,x in enumerate(row)) for j in range(len(matrix[0]))]


def receiver(old,q,s,condition):
    values=list(old)
    if condition=='cell-clamped': values[4]=s['clampDeviation']
    c=0. if condition=='output-cut' else s['c']
    h=0. if condition=='ort-removed' else s['h']
    for _ in range(s['substeps']):
        p=values[:4]; d=values[4]
        other=(2,3,0,1)
        new=[p[i]+s['step']*(-p[i]+q[i]-s['his']*p[other[i]]+c*d) for i in range(4)]
        dd=(-d+s['e']*(p[0]+p[1])/2-h*sum(p)/4)/s['tauD']
        values=new+[d if condition=='cell-clamped' else d+s['step']*dd]
    return values


def optics(kind,view,illumination,matrix):
    family=kind//2; key=kind%2
    if (family==0 and view==1) or (family==1 and view==2):
        refl=[.3,.3,.4,.2+.6*key] if family==0 else [.7,.25,.25,.2+.6*key]
    else: refl=[.8,.2,.3,.3] if family==0 else [.2,.7,.5,.2]
    return [sum(row[j]*refl[j]*illumination[j] for j in range(4))/4 for row in matrix]


def risks(candidates,view,prototypes,tol):
    groups=[]
    for i in candidates:
        for g in groups:
            if distance(prototypes[i][view],prototypes[g[0]][view])<=tol:
                g.append(i); break
        else: groups.append([i])
    n=len(candidates); n1=sum(i%2 for i in candidates)
    old=min(n1,n-n1)/n
    remaining=sum(min(sum(i%2 for i in g),len(g)-sum(i%2 for i in g)) for g in groups)/n
    require(-1e-12<=old-remaining<=old+1e-12,'finite partition risk bound')
    return old-remaining,groups


def verify_event(event,plan,case,lesson,matrix,scenario):
    obs=event['observation']; step=event['step']; prior=event['priorState']; post=event['stateAfterObservation']
    require(set(obs)=={'time','goal_key','samples'},'observation allowlist')
    require(obs['time']==step,'clock')
    require(obs['goal_key']==event['evaluatorBefore']['goal_key'],'actual public goal')
    samples={s['retinal_bin']:s for s in obs['samples']}
    require(len(samples)==len(obs['samples']) and set(samples).issubset({-1,1}),'unique retinal addresses')
    illum=plan['world']['adverseIlluminant'] if scenario=='adverse_illumination' and step>=plan['world']['switchStep'] else [1.]*4
    for b,s in samples.items():
        require(set(s)=={'retinal_bin','view','signed_range','captures'},'sample allowlist')
        objects=[o for o in event['evaluatorBefore']['objects'] if (-1 if o['position']-event['evaluatorBefore']['body_position']<0 else 1)==b]
        require(len(objects)==1,'one object per declared bin')
        obj=objects[0]
        require(close(s['signed_range'],obj['position']-event['evaluatorBefore']['body_position']),'signed range source')
        require(s['view']==event['evaluatorBefore']['views'][str(b)],'actual view not requested prediction')
        require(close(s['captures'],optics(obj['kind'],s['view'],illum,matrix)),'spectral source flow')
    prototypes=lesson['directPrototypes'] if case['perception']=='direct' else lesson['prototypes']
    fresh_keys=0
    for a in event['reconstruction']['receiving']:
        b=a['retinal_bin']; key=str(b); row=samples.get(b); old=prior['receiver'][key]
        require(close(a['receiver']['before'],old),'receiver continuity')
        q=[0.]*4 if row is None else row['captures']
        expected=receiver(old,q,plan['receiver'],a['receiver']['condition'])
        require(close(a['receiver']['after'],expected),'scalar receiver recurrence')
        require(close(post['receiver'][key],expected),'receiver state reaches next operation')
        if row is None: continue
        decoded=q if case['perception']=='direct' else multiply(expected[:4]+old+[1.],lesson['readout'])
        require(close(a['decoded'],decoded),'state-conditioned learned readout')
        ds=[distance(norm(decoded),p[row['view']]) for p in prototypes]
        require(close(ds,a['distances']),'prototype distances')
        compatible=[] if min(ds)>plan['learning']['maximumDistance'] else [i for i,d in enumerate(ds) if d<=min(ds)+plan['learning']['matchingTolerance']]
        require(compatible==a['matchedCandidates'],'observed evidence candidates')
        previous=prior['tracks'][key]['candidates']
        expected_candidates=sorted(set(previous)&set(compatible)) or compatible or [0,1,2,3]
        require(post['tracks'][key]['candidates']==expected_candidates and a['candidates']==expected_candidates,'learned relation update')
        if compatible and len({i%2 for i in compatible})==1: fresh_keys+=1
    expected_choices=[]
    for key,t in post['tracks'].items():
        age=None if t['last_identity'] is None else step-t['last_identity']
        if {i%2 for i in t['candidates']}=={obs['goal_key']} and age is not None and age<=plan['world']['maxEvidenceAge'] and t['range'] is not None:
            expected_choices.append((abs(t['range']),int(key)))
    rel=event['reconstruction']['relation']
    chosen=min(expected_choices)[1] if expected_choices else None
    require(rel['retinal_bin']==chosen,'internally selected relation')
    require(rel['status']==('unresolved' if chosen is None else post['tracks'][str(chosen)]['status']),'relation status')
    command=0.
    if chosen is not None:
        r=post['tracks'][str(chosen)]['range']
        require(close(rel['relative_target'],r),'relation to action path')
        command=math.copysign(min(plan['world']['maxCommand'],max(abs(r)-plan['world']['standoff'],0)/prior['gain']),r)
    require(close(command,event['action']['command']),'movement from reconstructed state')
    scores=[]
    for b in (-1,1):
        tr=post['tracks'][str(b)]
        if tr['range'] is None: continue
        for view in (0,1,2):
            gain,groups=risks(tr['candidates'],view,prototypes,plan['learning']['matchingTolerance'])
            scores.append(dict(retinal_bin=b,view=view,gain=gain,score=gain/(1+abs(tr['range'])),groups=groups))
    require(len(scores)==len(event['queryScores']),'complete query alternatives')
    for a,b in zip(scores,event['queryScores'],strict=True):
        require(a['retinal_bin']==b['retinal_bin'] and a['view']==b['view'] and a['groups']==b['groups'] and close(a['gain'],b['gain']) and close(a['score'],b['score']),'query score from learned relation')
    query=None
    if case['query']=='fixed-cycle' and chosen is None:
        b,v=[(-1,1),(1,1),(-1,2),(1,2)][step%4]; query=dict(retinal_bin=b,view=v)
    elif case['query']!='fixed-cycle' and post['query_enabled'] and chosen is None and scores:
        best=sorted(scores,key=lambda x:(-x['score'],x['retinal_bin'],x['view']))[0]
        if best['gain']>1e-12: query=dict(retinal_bin=best['retinal_bin'],view=best['view'])
    require(query==event['action']['query'],'query actually selected')
    body=event['bodyReturn']; update=event['returnUpdate']; after=event['stateAfterReturn']
    require(set(body)=={'command','measured_displacement','applied_query'},'body allowlist')
    require(close(body['command'],command) and close(body['measured_displacement'],command*event['evaluatorBefore']['gain']),'actual body movement')
    require(body['applied_query']==query,'actual query application')
    used=command if case.get('return')=='command' else body['measured_displacement']
    require(close(update['used_displacement'],used) and close(after['odometry'],prior['odometry']+used),'body return integration')
    require(close(update['predicted_displacement'],prior['gain']*command),'prediction is not returned movement')
    gain=prior['gain']
    if abs(command)>1e-12:
        rate=plan['world']['calibrationRate']; gain=min(2.,max(.1,(1-rate)*gain+rate*body['measured_displacement']/command))
    require(close(gain,after['gain']),'retained calibration update')
    for key,t in post['tracks'].items():
        if t['range'] is not None: require(close(after['tracks'][key]['range'],t['range']-used),'actual return changes relation')
    return fresh_keys


def main():
    start=time.perf_counter(); priority=low_priority(); out=APP/'checks-01'; out.mkdir(exist_ok=False)
    plan=read(APP/'ANALYSIS-PLAN.json'); matrix=read(ROOT/plan['sourceModel'])['matrix']
    summaries=[]; all_metrics=[]; pins={}; previous=None; candidate_actions=[]; direct_actions=[]
    for case in plan['cases']:
        folder=APP/'run-01'/case['id']; rec=read(folder/'EXECUTION.json'); data=read(folder/'EPISODES.json')
        require(sha(APP/'ANALYSIS-PLAN.json')==rec['planSha256'],'frozen plan')
        require(sha(folder/'EPISODES.json')==rec['episodeSha256'],'saved episodes identity')
        require(sha(ROOT/plan['sourceModel'])==rec['sourceModelSha256']==plan['sourceModelSha256'],'unchanged source-shaped input')
        for name,h in rec['codeSha256'].items(): require(sha(ROOT/'tools'/name)==h,'frozen code')
        lesson=read(APP/'familiarization-01'/rec['familiarization'])
        require(sha(APP/'familiarization-01'/rec['familiarization'])==rec['lessonSha256'],'lesson identity')
        require(rec['seconds']<40 and rec['bytes']<5_000_000 and rec['numericalThreads']==1 and 'verified' in rec['priority'],'case resource bounds')
        pins[case['id']]=sha(folder/'EXECUTION.json')
        row=dict(case=case['id'],episodes=len(data['episodes']),events=0,queries=0,currentSampleSteps=0,inferredSteps=0,unresolvedSteps=0,
                 currentSampleBindingErrors=0,inferredBindingErrors=0,freshKeySamples=0,firstQueryCorrectFamily=0,firstQueries=0,meanFinalStandoffError=0.,maxPreObservationRelationError=0.)
        for ep in data['episodes']:
            scenario=ep['metrics']['scenario']; first=True; actions=[]
            for event in ep['events']:
                if time.perf_counter()-start>35: raise TimeoutError('Scalar check resource bound')
                row['events']+=1
                row['freshKeySamples']+=verify_event(event,plan,case,lesson,matrix,scenario)
                rel=event['reconstruction']['relation']; truth=event['evaluatorBefore']; actions.append(event['action'])
                if rel['status']=='observed': row['currentSampleSteps']+=1
                elif rel['status']=='inferred': row['inferredSteps']+=1
                else: row['unresolvedSteps']+=1
                if rel['retinal_bin'] is not None and rel['retinal_bin']!=truth['target_bin']:
                    row['currentSampleBindingErrors' if rel['status']=='observed' else 'inferredBindingErrors']+=1
                if event['action']['query'] is not None:
                    row['queries']+=1
                    if first:
                        first=False; row['firstQueries']+=1; q=event['action']['query']
                        obj=next(o for o in truth['objects'] if (-1 if o['position']-truth['body_position']<0 else 1)==q['retinal_bin'])
                        row['firstQueryCorrectFamily']+=q['view']==obj['kind']//2+1
                prior=event['priorState']
                if event['step']>0:
                    last=ep['events'][event['step']-1]['stateAfterReturn']
                    require(prior['receiver']==last['receiver'],'episode receiver state never reset')
                    require(prior['tracks']==last['tracks'] and close(prior['gain'],last['gain']),'relation and retained state carry')
                prior_choices=[t['range'] for t in prior['tracks'].values() if {i%2 for i in t['candidates']}=={truth['goal_key']} and t['range'] is not None]
                if len(prior_choices)==1: row['maxPreObservationRelationError']=max(row['maxPreObservationRelationError'],abs(prior_choices[0]-truth['target_relative']))
            row['meanFinalStandoffError']+=ep['metrics']['finalStandoffError']/len(data['episodes'])
            require(ep['metrics']['learnedUnchanged'],'frozen learned state')
            all_metrics.append(ep['metrics'])
            if case['id']=='persistent-query': candidate_actions.append(actions)
            if case['id']=='direct-learned-query': direct_actions.append(actions)
        require(row['events']==576 and row['episodes']==24,'complete declared episode grid')
        summaries.append(row)
        if case['id']=='persistent-query': previous=(data,lesson,case)
    require(candidate_actions==direct_actions,'candidate and direct comparator actions identical')
    # Deliberate faults are tested on a known nonempty first event, not silently
    # counted as genuine experiment failures or independent review.
    data,lesson,case=previous; base=data['episodes'][0]['events'][0]
    mutations=[('capture',lambda e:e['observation']['samples'][0]['captures'].__setitem__(0,.99)),
               ('hidden-field',lambda e:e['observation']['samples'][0].__setitem__('key',1)),
               ('state-reset',lambda e:e['reconstruction']['receiving'][0]['receiver']['before'].__setitem__(0,.1)),
               ('receiver-output',lambda e:e['reconstruction']['receiving'][0]['receiver']['after'].__setitem__(0,.1)),
               ('invented-query-gain',lambda e:e['queryScores'][0].__setitem__('gain',.25)),
               ('selected-query',lambda e:e['action'].__setitem__('query',None)),
               ('predicted-view-as-observed',lambda e:e['observation']['samples'][0].__setitem__('view',2)),
               ('false-return',lambda e:e['bodyReturn'].__setitem__('measured_displacement',.1))]
    detected=[]
    for label,mutate in mutations:
        event=copy.deepcopy(base); mutate(event)
        try: verify_event(event,plan,case,lesson,matrix,'visible')
        except AssertionError as exc: detected.append(dict(mutation=label,rejectedBy=str(exc)))
        else: raise AssertionError('Undetected mutation '+label)
    result=dict(summary=summaries,episodeMetrics=all_metrics,directComparatorActionsIdentical=True,
                statusMeaning="observed is a relation supported by a current sample AND retained cross-view knowledge, not necessarily a freshly discriminating key sample",sameAgent=True)
    (out/'RESULTS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    receipt=dict(status='passed',assertionCallsIncludingExpectedMutationFailures=ASSERTIONS,mainEpisodes=264,mainEvents=6336,
                 detectedMutations=detected,caseReceipts=pins,resultsSha256=sha(out/'RESULTS.json'),checkerSha256=sha(Path(__file__)),
                 seconds=time.perf_counter()-start,priority=priority,independentReview=False,newBiologicalAnalysis=False)
    (out/'CHECKS.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in receipt.items() if k not in ('caseReceipts','detectedMutations')}))
    print(json.dumps(summaries))


if __name__=='__main__': main()
