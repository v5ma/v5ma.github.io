"""Small constructive arithmetic fixtures, not a fit or data reanalysis."""
from pathlib import Path
from fractions import Fraction as F
import hashlib
import json
import math
import sys

HERE=Path(__file__).resolve().parent
checks=[]
def check(name,ok,details):
    if not ok:raise ValueError(name)
    checks.append({'name':name,'passed':True,'details':details})
def coefficient(p,gc=F(1),gs=F(1),wc=F(1),ws=F(1)):
    return p*wc*gc-(1-p)*ws*gs

def run():
    baseline=coefficient(F(1,2))
    alternatives=[coefficient(F(3,5)),coefficient(F(1,2),gc=F(7,5)),coefficient(F(1,2),wc=F(7,5))]
    check('Occupancy, encoding and reception can match one pooled effect',baseline==0 and alternatives==[F(1,5)]*3,
          {'baseline':str(baseline),'threeDistinctPostCoefficients':[str(x) for x in alternatives]})
    count=0
    for p0 in (F(1,4),F(1,2),F(3,4)):
        for p1 in (F(1,4),F(1,2),F(3,4)):
            for gc0,gc1,gs0,gs1 in ((F(1),F(7,5),F(1),F(4,5)),(F(3,2),F(1),F(1,2),F(2))):
                exact=coefficient(p1,gc1,gs1)-coefficient(p0,gc0,gs0)
                expanded=(p1-p0)*(gc0+gs0)+p1*(gc1-gc0)-(1-p1)*(gs1-gs0)
                if exact!=expanded:raise ValueError('Finite decomposition identity failed')
                count+=1
    check('Finite pre/post decomposition',count==18,{'exactRationalCases':count,'populationSample':False})
    mu_c=(F(3),F(1));mu_s=(F(1),F(3));mean=tuple((a+b)/2 for a,b in zip(mu_c,mu_s))
    cov=[[F(0) for _ in range(2)]for _ in range(2)]
    for i in range(2):
        for j in range(2):
            cov[i][j]=sum((m[i]-mean[i])*(m[j]-mean[j])/2 for m in (mu_c,mu_s))+(mean[i] if i==j else 0)
    check('Equal pooled rates do not imply equal distributions',mean==(F(2),F(2)) and cov==[[F(3),F(-1)],[F(-1),F(3)]],
          {'pooledMean':[str(v) for v in mean],'mixtureCovariance':[[str(v) for v in r]for r in cov],
           'staticIndependentPoissonCovariance':[[2,0],[0,2]],'totalConditionalRate':4})
    r=(F(3),F(1));w=(F(1),F(0));wp=(F(0),F(1))
    y=sum(a*b for a,b in zip(w,r));yp=sum(a*b for a,b in zip(wp,r));delta=sum((b-a)*c for a,b,c in zip(w,wp,r))
    check('Changing the receiver can leave a source-only decoder untouched',yp-y==delta==F(-2),
          {'sourceBeforeAndAfter':[3,1],'readoutBefore':str(y),'readoutAfter':str(yp),'sourceDecodersChanged':False})
    switch=F(1,4);prob_plus=F(1);corr=[]
    for lag in range(9):
        c=2*prob_plus-1
        if c!=(1-2*switch)**lag:raise ValueError('Exact Markov recurrence failed')
        corr.append(str(c));prob_plus=prob_plus*(1-switch)+(1-prob_plus)*switch
    lam=2.;freqs=(0.,1.,2.,4.,8.);spectrum=[4*lam/(4*lam*lam+w*w) for w in freqs]
    check('Markov alternation is compatible with nonoscillatory correlation',all(spectrum[i]>spectrum[i+1] for i in range(4)),
          {'exactDiscreteCorrelation':corr,'continuousHazardArbitraryUnits':lam,'angularFrequencies':list(freqs),'analyticSpectrumSamples':spectrum,'fittedToBrainData':False})
    tau=1/math.log(2);theta=F(1,4);traces=[F(1,2)**g for g in range(4)]
    cutoff=tau*math.log(4)
    check('Declared decay/threshold readout has the predicted gap boundary',abs(cutoff-2)<1e-12 and [h>=theta for h in traces]==[True,True,True,False],
          {'traceAmplitudes':[str(h) for h in traces],'gapCutoff':cutoff,'phenomenalThresholdClaim':False})
    rows=[{'a':a,'u':u,'y':u,'postSelected':a==u}for a in (0,1)for u in (0,1)]
    full=[F(sum(r['y'] for r in rows if r['a']==a),2)for a in (0,1)]
    selected=[next(F(r['y']) for r in rows if r['a']==a and r['postSelected'])for a in (0,1)]
    check('Post-state conditioning can manufacture a treatment contrast',full==[F(1,2),F(1,2)] and selected==[F(0),F(1)],
          {'allAssignedArmMeans':[str(v) for v in full],'postSelectedArmMeans':[str(v) for v in selected],'individualCausalEffects':[0,0]})
    return {'scope':'Constructed identities and counterexamples only; no neural data, fitting, training or independent peer review.',
            'sourceSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'checks':checks,'passed':True,
            'rawDataReanalysis':False,'newLearnedApplication':False,'existingApplicationResultsAltered':False}

if __name__=='__main__':
    result=run();target=HERE/'state-selection-results-r2.json'
    if sys.argv[1:]==['--record']:
        with target.open('x',encoding='utf-8') as f:json.dump(result,f,indent=2);f.write('\n')
    elif not sys.argv[1:]:
        if json.loads(target.read_text(encoding='utf-8'))!=result:raise ValueError('Saved fixture result differs')
    else:raise ValueError('Use --record once or no arguments for readback')
    print(json.dumps({'passed':True,'checks':len(checks),'finiteDecompositionCases':18,'newModelFits':0}))
