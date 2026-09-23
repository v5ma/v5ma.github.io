"""Separate scalar/XML audit of the spectral surrogate and saved closed loops.

This is a second computational path by the same agent, not independent review.
Never imports the spectral application's forward transform or metric functions.
"""
import os
for key in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'): os.environ[key]='1'
import copy
import hashlib
import json
import math
from pathlib import Path
import time
import xml.etree.ElementTree as ET
from zipfile import ZipFile
from run_phase_receiver_case import low_priority

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'application/spectral-receiver-bridge-v0'
N=0


def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def check(condition,message):
    global N
    N+=1
    if not condition: raise AssertionError(message)


def close(a,b,tol=1e-10):
    return math.isfinite(a) and math.isfinite(b) and abs(a-b)<=tol


def xml_cells(path):
    ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with ZipFile(path) as z:
        root=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        result={}
        for c in root.findall('.//x:c',ns):
            if c.find('x:f',ns) is not None: raise AssertionError('Unexpected source formula')
            v=c.find('x:v',ns)
            if v is not None and c.get('t') not in ('s','str','b','e'):
                result[c.attrib['r']]=float(v.text)
    return result


def source_check(curves,raw):
    check(len(curves['curves'])==7,'Seven distinct source curves')
    count=0
    for curve in curves['curves']:
        check(curve['reportedAnimalsPerCurve']==6,'Reported n, not invented observations')
        first,last=curve['wavelengthRangeNm']
        check([p['wavelengthNm'] for p in curve['points']]==list(range(first,last+1,5)),'Source grid')
        for p in curve['points']:
            for field,cell in [('wavelengthNm','wavelength'),('meanMv','mean'),('sdMv','sd')]:
                check(close(p[field],raw[p['cells'][cell]],1e-14),'Excel XML differs at '+p['cells'][cell])
            count+=1
    check(count==342,'342 preserved mean/SD pairs')
    check(curves['rawAnimalRecordsAvailable'] is False,'No invented raw records')
    return count


def inspect_episode(ep,env,model,S):
    seed=ep['metrics']['seed']; scenario=ep['metrics']['scenario']
    side=-1 if seed%4==3 else 1
    positions=[side*(env['targetDistanceBase']+0.05*(seed%5)),
               -side*(env['otherDistanceBase']+0.05*(seed%3))]
    reflectances=[model['targetReflectance'],model['otherReflectance']]
    pos=0.0; gain=env['initialGainEstimate']
    modes=[]; observed_errors=[]; prior_errors=[]; return_errors=[]
    counts=dict(observed=0,inferred=0,unresolved=0)
    captures=0; unexpected=0
    check(len(ep['events'])==env['steps'],'Episode length')
    for t,event in enumerate(ep['events']):
        check(event['step']==t and event['observation']['time']==t,'Clock')
        obs=event['observation']
        check(set(obs)=={'time','bands','samples'},'No hidden observation fields')
        check(obs['bands'] in ([0,1,2],[0,1,2,3]),'Declared access mask')
        if t:
            expected_bands=env['fullBands'] if modes[-1]=='full' else env['coarseBands']
            check(obs['bands']==expected_bands,'Requested mask reaches next observation')
        E=[1.0]*4
        if t>=env['illuminationChangeTime']:
            if scenario=='uniform_illumination_gain': E=env['uniformIlluminant']
            if scenario=='adverse_colour_shift': E=env['adverseColouredIlluminant']
        hidden=scenario in ('occlusion','occlusion_gain','uniform_illumination_gain','adverse_colour_shift') and t in env['occlusionTimes']
        expected_items=[1] if hidden else [0,1]
        check(len(obs['samples'])==len(expected_items),'Occlusion sample count')
        seen=[]
        for sample in obs['samples']:
            check(set(sample)=={'signed_range','captures'},'Sample allowlist')
            which=[i for i in expected_items if close(sample['signed_range'],positions[i]-pos)]
            check(len(which)==1,'Physical sample position')
            i=which[0]; seen.append(i)
            check(len(sample['captures'])==len(obs['bands']),'Capture dimensions')
            for channel,value in zip(obs['bands'],sample['captures'],strict=True):
                expected=sum(S[channel][j]*E[j]*reflectances[i][j] for j in range(4))/4
                check(close(value,expected),'Spectral forward map')
            captures+=len(sample['captures'])
        check(sorted(seen)==expected_items,'Each visible object occurs once')
        actual_gain=env['changedGain'] if scenario in ('gain_change','occlusion_gain','uniform_illumination_gain','adverse_colour_shift') and t>=env['gainChangeTime'] else 1.0
        before=event['evaluatorBefore']; after=event['evaluatorAfter']
        check(close(before['position'],pos) and close(before['target_relative'],positions[0]-pos),'Evaluator prior position')
        check(close(before['actual_gain'],actual_gain),'Evaluator actuator gain')
        relation=event['relation']; state=event['stateAfterObservation']; action=event['action']
        check(relation['status'] in counts,'Declared status')
        counts[relation['status']]+=1
        check(relation['status']==state['status'] and relation['relative_target']==state['target_relation'],'Relation used by controller')
        if relation['status']=='observed':
            err=abs(relation['relative_target']-(positions[0]-pos)); observed_errors.append(err)
            check(close(event['observedRelationError'],err),'Observed-error audit')
        else: check(event['observedRelationError'] is None,'Unobserved not scored as observed')
        if event['priorState']['target_relation'] is not None:
            err=abs(event['priorState']['target_relation']-(positions[0]-pos)); prior_errors.append(err)
            check(close(event['priorRelationError'],err),'Prior relation error')
        else: check(event['priorRelationError'] is None,'Missing prior stays missing')
        age=None if relation['last_observed'] is None else t-relation['last_observed']
        usable=relation['relative_target'] is not None and age is not None and age<=env['maxInferredAgeForMovement']
        expected_command=0.0 if not usable else math.copysign(min(env['maxCommand'],max(abs(relation['relative_target'])-env['desiredStandoff'],0)/gain),relation['relative_target'])
        check(close(action['command'],expected_command),'Action follows internal relation and learned gain')
        modes.append(action['sampling_mode'])
        if abs(action['command'])>1e-12 and not usable: unexpected+=1
        body=event['bodyReturn']; measured=actual_gain*action['command']
        check(close(event['bodyPayload']['command'],action['command']) and close(event['bodyPayload']['measured_displacement'],measured),'Actual body payload')
        check(close(body['measured_displacement'],measured) and close(body['used_displacement'],measured),'Actual return used')
        check(close(body['predicted_displacement'],gain*action['command']) and close(body['gain_before'],gain),'Prediction before learning')
        return_errors.append(abs(body['predicted_displacement']-measured))
        if abs(action['command'])>1e-12:
            gain=min(2.0,max(0.1,(1-env['calibrationRate'])*gain+env['calibrationRate']*actual_gain))
        check(close(body['gain_after'],gain) and close(event['stateAfterReturn']['retained_gain'],gain),'Retained calibration')
        if relation['relative_target'] is not None:
            check(close(event['stateAfterReturn']['target_relation'],relation['relative_target']-measured),'Relation updates from actual return')
        pos+=measured
        check(close(after['position'],pos) and close(after['target_relative'],positions[0]-pos),'World consequence')
    mean=lambda xs:sum(xs)/len(xs) if xs else None
    calc=dict(meanPriorRelationError=mean(prior_errors),maximumObservedRelationError=max(observed_errors,default=None),
              meanReturnPredictionError=mean(return_errors),finalStandoffError=abs(abs(positions[0]-pos)-env['desiredStandoff']),
              observedSteps=counts['observed'],inferredSteps=counts['inferred'],unresolvedSteps=counts['unresolved'],
              captures=captures,commandsWithoutUsableRelation=unexpected,finalGain=gain)
    for k,v in calc.items():
        check(ep['metrics'][k] is None if v is None else close(ep['metrics'][k],v),'Metric recomputation: '+k)
    return calc


def main():
    start=time.perf_counter(); priority=low_priority()
    plan=json.loads((APP/'ANALYSIS-PLAN.json').read_text('utf-8'))
    env=json.loads((ROOT/'application/embodied-reference-v0/ANALYSIS-PLAN.json').read_text('utf-8'))
    model=json.loads((APP/'model-01/MODEL.json').read_text('utf-8'))
    curves=json.loads((APP/'source-extraction-01/CURVES.json').read_text('utf-8'))
    check(digest(ROOT/plan['source']['path'])==plan['source']['sha256'],'Source hash')
    raw=xml_cells(ROOT/plan['source']['path'])
    source_count=source_check(curves,raw)
    S=[]
    for row,col in enumerate(('G','I','K','M')):
        peak=max(raw[col+str(r)] for r in range(3,51))
        check(close(peak,model['normalizationMaximaMv'][row]),'Normalization explicitly common window')
        values=[]
        for j,w in enumerate(plan['frontEnd']['stimulusWavelengthsNm']):
            cell=col+str(3+(w-315)//5)
            check(model['sourceMeanCells'][row][j]==cell,'Exact source cell')
            value=raw[cell]/peak
            check(close(value,model['matrix'][row][j]),'Source-shaped matrix')
            values.append(value)
        S.append(values)
    v=model['nullDirection']
    null=max(abs(sum(S[i][j]*v[j] for j in range(4))) for i in range(3))
    check(null<1e-12,'Coarse nullspace')
    for name in ('target','other'):
        r=model[name+'Reflectance']; q=model[name+'PublicCapture']
        check(all(0<=x<=1 for x in r),'Physical reflectance range')
        for i in range(4): check(close(q[i],sum(S[i][j]*r[j] for j in range(4))/4),'Public familiarization capture')
    cases={}; rows=[]
    for case in plan['cases']:
        p=APP/'run-01'/case['id']; data=json.loads((p/'EPISODES.json').read_text('utf-8'))
        receipt=json.loads((p/'EXECUTION.json').read_text('utf-8'))
        check(receipt['episodesSha256']==digest(p/'EPISODES.json'),'Saved case hash')
        check(receipt['planSha256']==digest(APP/'ANALYSIS-PLAN.json'),'Plan before case')
        check(receipt['modelSha256']==digest(APP/'model-01/MODEL.json'),'Frozen model')
        for f,sha in receipt['codeSha256'].items(): check(digest(ROOT/'tools'/f)==sha,'Unchanged executed code')
        check(receipt['numericalThreads']==1 and 'verified' in receipt['priority'] and receipt['elapsedSeconds']<40,'Resource limits')
        check([(e['metrics']['scenario'],e['metrics']['seed']) for e in data['episodes']]==[(s,k) for s in env['scenarios'] for k in env['seeds']],'Full declared case grid')
        vals=[inspect_episode(e,env['configuration'],model,S) for e in data['episodes']]
        cases[case['id']]=data
        rows.append(dict(case=case['id'],maxStandoffError=max(v['finalStandoffError'] for v in vals),
                         maxObservedError=max(v['maximumObservedRelationError'] for v in vals if v['maximumObservedRelationError'] is not None),
                         observed=sum(v['observedSteps'] for v in vals),inferred=sum(v['inferredSteps'] for v in vals),
                         unresolved=sum(v['unresolvedSteps'] for v in vals),captures=sum(v['captures'] for v in vals),
                         elapsedSeconds=receipt['elapsedSeconds'],metrics=vals))
    reference=cases['spectral-phase']['episodes']
    twin=cases['spectral-coordinate']['episodes']
    twin_difference=0; signal_difference=0
    for left,right in zip(reference,twin,strict=True):
        for a,b in zip(left['events'],right['events'],strict=True):
            d=abs(a['action']['command']-b['action']['command']); twin_difference=max(twin_difference,d)
            check(d<1e-10,'Coordinate-equivalent actions')
            for sa,sb in zip(a['relation']['receiver'],b['relation']['receiver'],strict=True):
                for ua,ub in zip(sa['signal'],sb['signal'],strict=True):
                    signal_difference=max(signal_difference,max(abs(x-y) for x,y in zip(ua,ub,strict=True)))
    r=model['targetReflectance']; E=env['configuration']['adverseColouredIlluminant']
    correct=[sum(S[i][j]*E[j]*r[j] for j in range(4))/4 for i in range(4)]
    wrong=[E[i]*sum(S[i][j]*r[j] for j in range(4))/4 for i in range(4)]
    order_error=max(abs(a-b) for a,b in zip(correct,wrong,strict=True))
    check(order_error>1e-6,'Synthetic counterexample to interchanging spectrum and receptor gains')
    mutations=[]
    base=reference[0]
    for label,change in (
        ('capture',lambda e:e['events'][1]['observation']['samples'][0]['captures'].__setitem__(0,9.0)),
        ('body return',lambda e:e['events'][2]['bodyPayload'].__setitem__('measured_displacement',9.0)),
        ('action',lambda e:e['events'][2]['action'].__setitem__('command',-9.0)),
        ('reported metric',lambda e:e['metrics'].__setitem__('captures',-1)),
        ('hidden observation field',lambda e:e['events'][1]['observation'].__setitem__('target_identity','target'))):
        bad=copy.deepcopy(base); change(bad)
        try: inspect_episode(bad,env['configuration'],model,S)
        except AssertionError: mutations.append(label)
        else: raise AssertionError('Mutation escaped: '+label)
    altered=copy.deepcopy(curves); altered['curves'][0]['points'][0]['meanMv']+=1
    try: source_check(altered,raw)
    except AssertionError: mutations.append('source cell')
    else: raise AssertionError('Source mutation escaped')
    out=APP/'checks-01'; out.mkdir(exist_ok=False)
    evidence=dict(summary=rows,coordinateActionMaxDifference=twin_difference,
                  coordinateSignalMaxDifference=signal_difference,coarseNullResidual=null,
                  illuminationOrderCounterexample=dict(correct=correct,wrongAfterMixing=wrong,maxDifference=order_error),
                  developmentOnly=True,independentReview=False)
    (out/'RESULTS.json').write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf-8')
    receipt=dict(status='passed',assertionsIncludingMutationAttempts=N,acceptedMeanSdPairs=source_count,
                 mainEpisodes=120,mainEvents=2880,detectedMutations=mutations,
                 elapsedSeconds=time.perf_counter()-start,priority=priority,numericalThreads=1,
                 checkerSha256=digest(Path(__file__)),resultsSha256=digest(out/'RESULTS.json'),
                 planSha256=digest(APP/'ANALYSIS-PLAN.json'),modelSha256=digest(APP/'model-01/MODEL.json'),
                 sourceExtractionSha256=digest(APP/'source-extraction-01/CURVES.json'))
    assert receipt['elapsedSeconds']<45
    (out/'CHECKS.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(receipt))
    print(json.dumps([{k:v for k,v in row.items() if k!='metrics'} for row in rows]))
    print(json.dumps({k:v for k,v in evidence.items() if k!='summary'}))


if __name__=='__main__': main()
