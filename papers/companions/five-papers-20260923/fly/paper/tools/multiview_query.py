"""Persistent receiving and learned cross-view query in a synthetic body loop.

Source-motivated signs do not make the linear rates measured fly physiology.
The finite-catalog query planner is a conventional comparison mechanism.
"""
import os
for key in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'): os.environ[key]='1'
import copy
import hashlib
import json
import math
from pathlib import Path
import random
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'application/multiview-query-v0'
PLAN=APP/'ANALYSIS-PLAN.json'


def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def state_digest(value): return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def normalized(q):
    q=np.maximum(np.asarray(q,float),0)
    return q/q.sum() if q.sum()>1e-12 else np.zeros(4)


def reflectance(kind,view):
    """Evaluator/teaching environment only; no policy calls this function."""
    family,key=divmod(kind,2)
    front=np.array([.8,.2,.3,.3]) if family==0 else np.array([.2,.7,.5,.2])
    if (family==0 and view==1) or (family==1 and view==2):
        return np.array([.3,.3,.4,.2+.6*key]) if family==0 else np.array([.7,.25,.25,.2+.6*key])
    return front


class ReceivingBank:
    def __init__(self,settings,condition='intact'):
        self.settings=copy.deepcopy(settings)
        self.condition=condition
        self.x=np.zeros(5)

    def receive(self,q):
        old=self.x.copy()
        s=self.settings
        c=0. if self.condition=='output-cut' else s['c']
        h=0. if self.condition=='ort-removed' else s['h']
        if self.condition=='cell-clamped': self.x[4]=s['clampDeviation']
        for _ in range(s['substeps']):
            p=self.x[:4].copy(); d=float(self.x[4])
            dp=-p+q-s['his']*p[[2,3,0,1]]+c*d
            dd=(-d+s['e']*float(p[:2].mean())-h*float(p.mean()))/s['tauD']
            self.x[:4]+=s['step']*dp
            if self.condition!='cell-clamped': self.x[4]+=s['step']*dd
        # State is never reset between samples; the readout may use its own prior
        # receiving state. No true input, world identity or evaluator data joins it.
        features=np.concatenate((self.x[:4],old,[1.]))
        return features,dict(before=old.tolist(),after=self.x.tolist(),condition=self.condition)


def fit_public_familiarization(plan,matrix,condition='intact'):
    """A teacher presents inputs/types; this function never opens a test world."""
    cfg=plan['learning']; rng=np.random.default_rng(cfg['calibrationSeed'])
    bank=ReceivingBank(plan['receiver'],condition)
    rows=[]; targets=[]
    for _ in range(cfg['calibrationSteps']):
        q=rng.uniform(.01,.55,4)
        x,_=bank.receive(q)
        rows.append(x); targets.append(q)
    X,Y=np.asarray(rows),np.asarray(targets)
    W=np.linalg.solve(X.T@X+cfg['ridge']*np.eye(X.shape[1]),X.T@Y)
    bank=ReceivingBank(plan['receiver'],condition)
    records=[]; learned=np.zeros((4,3,4)); direct=np.zeros_like(learned)
    for kind in cfg['publicTypeIds']:
        for view in cfg['views']:
            for intensity in cfg['teacherIntensities']:
                q=matrix@(reflectance(kind,view)*intensity)/4
                x,trace=bank.receive(q)
                decoded=x@W
                learned[kind,view]+=normalized(decoded)/len(cfg['teacherIntensities'])
                direct[kind,view]+=normalized(q)/len(cfg['teacherIntensities'])
                records.append(dict(public_type=kind,public_key=kind%2,view=view,captures=q.tolist(),features=x.tolist(),decoded=decoded.tolist(),receiver=trace))
    artifact=dict(calibrationInputs=Y.tolist(),calibrationFeatures=X.tolist(),readout=W.tolist(),
                  prototypes=learned.tolist(),directPrototypes=direct.tolist(),teachingRecords=records,
                  calibrationMaxError=float(np.max(np.abs(X@W-Y))),receiverTrainingCondition=condition)
    return artifact


class QueryController:
    """Owned receiving, relation, acquired knowledge and action/return state."""
    def __init__(self,plan,lesson,case):
        self.rs=copy.deepcopy(plan['receiver'])
        public=('initialGain','maxCommand','standoff','maxEvidenceAge','calibrationRate')
        self.cfg={key:copy.deepcopy(plan['world'][key]) for key in public}
        self.lc=copy.deepcopy(plan['learning'])
        self.W=np.array(lesson['readout'])
        self.prototypes=np.array(lesson['directPrototypes'] if case['perception']=='direct' else lesson['prototypes'])
        self.key_labels=np.array([0,1,0,1])
        self.perception=case['perception']; self.query_policy=case['query']
        self.return_policy=case.get('return','measured')
        self.gain=self.cfg['initialGain']; self.odometry=0.
        self.banks={b:ReceivingBank(self.rs,'ort-removed' if case['receiver']=='ort-reacquired' else 'intact') for b in (-1,1)}
        self.tracks={b:dict(candidates=[0,1,2,3],range=None,last_seen=None,last_identity=None,status='unresolved') for b in (-1,1)}
        self.time=-1; self.goal_key=1; self.query_enabled=self.query_policy not in ('cut','restore')
        self.query_step=0; self.last_query_scores=[]; self.last_relation=None

    def learned_state(self): return dict(readout=self.W.tolist(),prototypes=self.prototypes.tolist(),keys=self.key_labels.tolist())

    @staticmethod
    def decode(payload):
        obs=json.loads(payload)
        if set(obs)!={'time','goal_key','samples'} or type(obs['time']) is not int or obs['goal_key'] not in (0,1): raise ValueError('Observation interface')
        seen=set()
        for row in obs['samples']:
            if set(row)!={'retinal_bin','view','signed_range','captures'}: raise ValueError('Sample interface')
            if row['retinal_bin'] not in (-1,1) or row['retinal_bin'] in seen or row['view'] not in (0,1,2): raise ValueError('Instrument address')
            seen.add(row['retinal_bin'])
            if len(row['captures'])!=4 or any(not math.isfinite(x) or x<0 for x in row['captures']) or not math.isfinite(row['signed_range']): raise ValueError('Instrument values')
        return obs

    def observe(self,payload):
        obs=self.decode(payload)
        if obs['time']<=self.time: raise ValueError('Clock must advance')
        self.time=obs['time']; self.goal_key=obs['goal_key']
        rows={r['retinal_bin']:r for r in obs['samples']}; audit=[]
        for b in (-1,1):
            track=self.tracks[b]; row=rows.get(b)
            q=np.zeros(4) if row is None else np.array(row['captures'])
            features,receive=self.banks[b].receive(q)
            if row is None:
                track['status']='inferred' if track['last_identity'] is not None else 'unresolved'
                audit.append(dict(retinal_bin=b,present=False,receiver=receive)); continue
            decoded=q if self.perception=='direct' else features@self.W
            vector=normalized(decoded)
            distances=np.linalg.norm(self.prototypes[:,row['view']]-vector,axis=1)
            match=[] if float(distances.min())>self.lc['maximumDistance'] else [int(i) for i,d in enumerate(distances) if d<=distances.min()+self.lc['matchingTolerance']]
            prior=list(track['candidates'])
            common=sorted(set(prior)&set(match))
            revised=bool(match) and not common
            track['candidates']=common if common else (match if match else [0,1,2,3])
            track['range']=row['signed_range']; track['last_seen']=self.time
            keys={int(self.key_labels[i]) for i in track['candidates']}
            if len(keys)==1 and match:
                track['status']='observed'; track['last_identity']=self.time
            else:
                track['status']='unresolved'; track['last_identity']=None
            audit.append(dict(retinal_bin=b,present=True,receiver=receive,decoded=decoded.tolist(),distances=distances.tolist(),
                              priorCandidates=prior,matchedCandidates=match,candidates=list(track['candidates']),view=row['view'],revised=revised))
        self.last_relation=self.relation()
        return dict(relation=copy.deepcopy(self.last_relation),receiving=audit)

    def relation(self):
        choices=[]
        for b,t in self.tracks.items():
            keys={int(self.key_labels[i]) for i in t['candidates']}
            age=None if t['last_identity'] is None else self.time-t['last_identity']
            if keys=={self.goal_key} and age is not None and age<=self.cfg['maxEvidenceAge'] and t['range'] is not None:
                choices.append((abs(t['range']),b))
        if not choices: return dict(status='unresolved',retinal_bin=None,relative_target=None)
        b=min(choices)[1]; t=self.tracks[b]
        return dict(status=t['status'],retinal_bin=b,relative_target=t['range'])

    def query_gain(self,b,view):
        candidates=self.tracks[b]['candidates']
        n=len(candidates); groups=[]
        for i in candidates:
            found=False
            for group in groups:
                if np.linalg.norm(self.prototypes[i,view]-self.prototypes[group[0],view])<=self.lc['matchingTolerance']:
                    group.append(i); found=True; break
            if not found: groups.append([i])
        n1=sum(int(self.key_labels[i]) for i in candidates)
        prior=min(n1,n-n1)/n
        remaining=sum(min(sum(int(self.key_labels[i]) for i in g),len(g)-sum(int(self.key_labels[i]) for i in g)) for g in groups)/n
        return float(prior-remaining),groups

    def act(self):
        rel=self.relation(); command=0.
        if rel['relative_target'] is not None:
            r=rel['relative_target']; remaining=max(abs(r)-self.cfg['standoff'],0.)
            command=math.copysign(min(self.cfg['maxCommand'],remaining/self.gain),r)
        scores=[]
        for b,t in self.tracks.items():
            if t['range'] is None: continue
            for view in (0,1,2):
                gain,groups=self.query_gain(b,view)
                scores.append(dict(retinal_bin=b,view=view,gain=gain,score=gain/(1+abs(t['range'])),groups=groups))
        self.last_query_scores=copy.deepcopy(scores)
        query=None
        if self.query_policy=='fixed-cycle' and rel['relative_target'] is None:
            # A competent predetermined survey eventually visits both revealing
            # views, independent of the reconstructed content. It is not a cut.
            order=[(-1,1),(1,1),(-1,2),(1,2)]
            b,v=order[self.query_step%4]; query=dict(retinal_bin=b,view=v)
        elif self.query_policy!='fixed-cycle' and self.query_enabled and rel['relative_target'] is None and scores:
            best=sorted(scores,key=lambda x:(-x['score'],x['retinal_bin'],x['view']))[0]
            if best['gain']>1e-12: query=dict(retinal_bin=best['retinal_bin'],view=best['view'])
        self.query_step+=1
        return dict(command=command,query=query)

    def receive_return(self,payload):
        body=json.loads(payload)
        if set(body)!={'command','measured_displacement','applied_query'}: raise ValueError('Return interface')
        command=body['command']; measured=body['measured_displacement']
        if not math.isfinite(command) or not math.isfinite(measured): raise ValueError('Return values')
        prediction=self.gain*command
        used=command if self.return_policy=='command' else measured
        self.odometry+=used
        for track in self.tracks.values():
            if track['range'] is not None: track['range']-=used
        before=self.gain
        if abs(command)>1e-12:
            rate=self.cfg['calibrationRate']; self.gain=float(np.clip((1-rate)*self.gain+rate*measured/command,.1,2.))
        return dict(predicted_displacement=prediction,used_displacement=used,gain_before=before,gain_after=self.gain)

    def state(self):
        return dict(time=self.time,goal_key=self.goal_key,tracks=copy.deepcopy(self.tracks),
                    receiver={str(b):bank.x.tolist() for b,bank in self.banks.items()},
                    odometry=self.odometry,gain=self.gain,query_enabled=self.query_enabled,query_step=self.query_step)


class QueryWorld:
    def __init__(self,plan,matrix,scenario,seed,permuted=False):
        self.c=copy.deepcopy(plan['world']); self.matrix=matrix
        self.scenario=scenario; self.seed=seed; self.clock=0; self.position=0.; self.permuted=permuted
        # Type = family*2 + key. Layout and key/family assignment are evaluator-only.
        family=seed%2; key=(seed//2)%2
        self.objects=[dict(private_id='x',kind=family*2+key,position=-3.0-.15*seed),
                      dict(private_id='y',kind=(1-family)*2+(1-key),position=3.1+.1*seed)]
        self.views={-1:0,1:0}
        if permuted:
            for i,o in enumerate(self.objects): o['private_id']='arbitrary-'+str(7-i)
            self.objects.reverse()

    def goal(self): return 0 if self.scenario=='task_switch' and self.clock>=self.c['switchStep'] else 1
    def gain(self): return self.c['changedGain'] if self.scenario in ('gain_change','occlusion','binding_swap') and self.clock>=self.c['gainChangeStep'] else 1.
    def hidden(self): return self.scenario in ('occlusion','binding_swap') and self.clock in self.c['occlusionSteps']

    def observation(self):
        rows=[]; illumination=np.ones(4)
        if self.scenario=='adverse_illumination' and self.clock>=self.c['switchStep']: illumination=np.array(self.c['adverseIlluminant'])
        if not self.hidden():
            for obj in self.objects:
                r=obj['position']-self.position; b=-1 if r<0 else 1; view=self.views[b]
                q=self.matrix@(reflectance(obj['kind'],view)*illumination)/4
                rows.append(dict(retinal_bin=b,view=view,signed_range=r,captures=q.tolist()))
        random.Random(self.seed*1000+self.clock).shuffle(rows)
        if self.permuted: rows.reverse()
        return json.dumps(dict(time=self.clock,goal_key=self.goal(),samples=rows),allow_nan=False)

    def execute(self,action):
        if set(action)!={'command','query'} or abs(action['command'])>self.c['maxCommand']+1e-12 or not math.isfinite(action['command']): raise ValueError('Action interface')
        query=action['query']
        if query is not None:
            if set(query)!={'retinal_bin','view'} or query['retinal_bin'] not in (-1,1) or query['view'] not in (0,1,2): raise ValueError('Query interface')
            self.views[query['retinal_bin']]=query['view']
        move=self.gain()*action['command']; self.position+=move; self.clock+=1
        if self.scenario=='binding_swap' and self.clock==6:
            positions=[o['position'] for o in self.objects]
            for o,pos in zip(self.objects,reversed(positions),strict=True): o['position']=pos
        return json.dumps(dict(command=action['command'],measured_displacement=move,applied_query=copy.deepcopy(query)),allow_nan=False)

    def truth(self):
        target=next(o for o in self.objects if o['kind']%2==self.goal())
        return dict(time=self.clock,body_position=self.position,target_relative=target['position']-self.position,
                    target_bin=-1 if target['position']-self.position<0 else 1,goal_key=self.goal(),gain=self.gain(),
                    objects=copy.deepcopy(self.objects),views=copy.deepcopy(self.views))


def episode(plan,matrix,lesson,case,scenario,seed,permuted=False):
    world=QueryWorld(plan,matrix,scenario,seed,permuted)
    agent=QueryController(plan,lesson,case)
    initial_learned=state_digest(agent.learned_state())
    events=[]
    for step in range(plan['world']['steps']):
        if step==plan['interventionStep']:
            mode=case['receiver']
            if mode in ('ort-removed','cell-clamped','output-cut','ort-restore'):
                for bank in agent.banks.values(): bank.condition='ort-removed' if mode=='ort-restore' else mode
        if step==plan['restorationStep']:
            if case['query']=='restore': agent.query_enabled=True
            if case['receiver']=='ort-restore':
                for bank in agent.banks.values(): bank.condition='intact'
        truth=world.truth(); prior=agent.state(); payload=world.observation()
        obs=json.loads(payload); reconstructed=agent.observe(payload)
        action=agent.act(); after_obs=agent.state()
        returned=world.execute(action); body=json.loads(returned); after_return=agent.receive_return(returned)
        events.append(dict(step=step,observation=obs,priorState=prior,reconstruction=reconstructed,
                           stateAfterObservation=after_obs,queryScores=copy.deepcopy(agent.last_query_scores),action=action,
                           bodyReturn=body,returnUpdate=after_return,stateAfterReturn=agent.state(),evaluatorBefore=truth,evaluatorAfter=world.truth()))
    counts={s:sum(e['reconstruction']['relation']['status']==s for e in events) for s in ('observed','inferred','unresolved')}
    errors=[abs(e['reconstruction']['relation']['relative_target']-e['evaluatorBefore']['target_relative']) for e in events if e['reconstruction']['relation']['relative_target'] is not None]
    misbound=sum(e['reconstruction']['relation']['retinal_bin']!=e['evaluatorBefore']['target_bin'] for e in events if e['reconstruction']['relation']['retinal_bin'] is not None)
    last=world.truth()
    metrics=dict(scenario=scenario,seed=seed,case=case['id'],**counts,queries=sum(e['action']['query'] is not None for e in events),
                 bindingErrors=misbound,maxRelationError=max(errors,default=None),finalStandoffError=abs(abs(last['target_relative'])-plan['world']['standoff']),
                 movementPredictionError=sum(abs(e['returnUpdate']['predicted_displacement']-e['bodyReturn']['measured_displacement']) for e in events),
                 learnedUnchanged=state_digest(agent.learned_state())==initial_learned)
    return dict(metrics=metrics,learnedSha256=initial_learned,events=events,controllerFields=sorted(vars(agent)))
