import os
for name in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'):
    os.environ[name]='1'
import argparse
import ctypes
from fractions import Fraction as F
import hashlib
import itertools
import json
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parent
PAPER=ROOT.parents[1]
PM={-2:F(1,10),-1:F(2,10),0:F(4,10),1:F(2,10),2:F(1,10)}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def observers(obs,mu):
    likelihood=[]
    for sign in (-1,1):
        m=mu[(sign+1)//2]
        likelihood.append(PM.get(obs[0]-m,F(0))*PM.get(obs[1]-m,F(0)))
    total=sum(likelihood)
    if not total:raise AssertionError('Observed impossible evidence')
    posterior=likelihood[1]/total
    admissible=[s for s,l in zip((-1,1),likelihood) if l>0]
    conservative=admissible[0] if len(admissible)==1 else 0
    bayes=1 if posterior>F(3,4) else (-1 if posterior<F(1,4) else 0)
    return conservative,bayes,posterior

def run():
    src=PAPER/'sources/visual-memory-input-intake-45'
    name='Data/VPN_LVIN_KC_connectivity_revisions.npy'
    intake=json.loads((src/'INTAKE.json').read_text(encoding='utf-8'))
    digest=sha(src/name)
    item=next(x for x in intake['sources'] if x['path'].replace('\\','/')==name)
    if digest.lower()!=item['sha256'].lower():raise SystemExit('Source changed')
    raw=np.load(src/name,allow_pickle=False)
    if raw.shape!=(79,147):raise SystemExit('Source shape')
    conditions=('selective_pre','common_post','fixed','request_denied')
    rows,checks,descriptions=[],[],[]
    for witness,i,j,notebook in [('count_equal_routes',22,23,False),('notebook_equal_routes',28,32,True),('notebook_zero_route',22,None,True)]:
        w=(raw[:,1:]>5).T.astype(float) if notebook else raw.T.astype(float)
        base=np.divide(w,w.sum(axis=1,keepdims=True),out=np.zeros_like(w),where=w.sum(axis=1,keepdims=True)!=0)
        v=np.zeros(79);v[i]=1
        if j is not None:v[j]=-1
        patterns=np.stack([np.ones(79)-.2*v,np.ones(79)+.2*v])
        changed=base.copy();changed[:,i]*=2
        changed*=np.linalg.norm(base)/np.linalg.norm(changed)
        lessons=patterns@changed.T
        difference=lessons[1]-lessons[0]
        gap=float(np.linalg.norm(difference))
        if gap>1e-10:
            axis=difference/gap;scale=gap/2
        else:
            axis=np.eye(base.shape[0])[0];scale=.001
        descriptions.append({'witness':witness,'selected_port':i,'contrast':v.tolist(),'source_hash':digest,'selective_separation':gap,'baseline_separation':float(np.linalg.norm(patterns@base.T,axis=1).max()) if False else float(np.linalg.norm(base@(patterns[1]-patterns[0]))),'noise_scale':scale})
        checks.append(np.linalg.norm(base@v)<1e-10)
        for condition in conditions:
            profile=changed if condition=='selective_pre' else (2*base if condition=='common_post' else base)
            prototypes=patterns@profile.T
            center=prototypes.mean(axis=0)
            mu=[int(round(float((p-center)@axis/scale))) for p in prototypes]
            if condition!='selective_pre' or j is None:checks.append(mu==[0,0])
            else:checks.append(mu==[-1,1])
            for sign,z0,z1 in itertools.product((-1,1),PM,PM):
                observed=[]
                for z in (z0,z1):
                    y=profile@patterns[(sign+1)//2]+float(z)*scale*axis
                    scalar=float((y-center)@axis/scale)
                    code=int(round(scalar))
                    checks.append(abs(scalar-code)<1e-8)
                    observed.append(code)
                conservative,bayes,post=observers(observed,mu)
                weight=PM[z0]*PM[z1]/2
                for observer,decision in [('set',conservative),('bayes',bayes)]:
                    cost=F(1,4) if decision==0 else F(int(decision!=sign))
                    movements=[]
                    for gain in (.8,1.2):
                        command=float(decision)
                        first=gain*command
                        estimate=1 if command==0 else .5+.5*(first/command)
                        second=gain*decision/estimate
                        checks.append(decision==0 or abs(second-decision)<abs(first-decision))
                        movements.append({'true_gain':gain,'first_command':command,'first_movement':first,'new_estimate':estimate,'second_command':decision/estimate,'second_movement':second})
                    rows.append({'witness':witness,'condition':condition,'actual_profile':condition if condition!='request_denied' else 'fixed','observer':observer,'sign':sign,'noise':[z0,z1],'received':observed,'prototype_codes':mu,'posterior_plus':str(post),'decision':decision,'weight':str(weight),'loss':str(cost),'movements':movements})
    summaries=[]
    for d in descriptions:
        for condition,observer in itertools.product(conditions,('set','bayes')):
            group=[r for r in rows if r['witness']==d['witness'] and r['condition']==condition and r['observer']==observer]
            checks.append(sum(F(r['weight']) for r in group)==1)
            summary={'witness':d['witness'],'condition':condition,'observer':observer}
            for key,predicate in [('correct',lambda r:r['decision']==r['sign']),('wrong',lambda r:r['decision']!=0 and r['decision']!=r['sign']),('abstain',lambda r:r['decision']==0)]:
                summary[key]=str(sum(F(r['weight']) for r in group if predicate(r)))
            summary['expected_loss']=str(sum(F(r['weight'])*F(r['loss']) for r in group))
            summaries.append(summary)
    return {'protocol_sha256':sha(ROOT/'PROTOCOL.md'),'code_sha256':sha(Path(__file__)),'scope':'Source-constrained synthetic receiving/action diagnostic; no fitted or physiological result','witnesses':descriptions,'summary':summaries,'cases':rows,'checks':{'passed':sum(bool(x) for x in checks),'total':len(checks)}}

if __name__=='__main__':
    if os.name=='nt':ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(),0x4000)
    p=argparse.ArgumentParser();p.add_argument('--output',required=True,choices=('run','replay'));args=p.parse_args()
    out=ROOT/args.output;out.mkdir(exist_ok=False)
    result=run();data=json.dumps(result,indent=2)+'\n'
    if len(data)>5*1024*1024:raise SystemExit('Size cap')
    (out/'RESULT.json').write_text(data,encoding='utf-8')
    print(json.dumps({'checks':result['checks'],'selected':[x for x in result['summary'] if x['condition']=='selective_pre']}))
