"""Published spectral-shape surrogate joined to the existing closed-loop task.

Not calibrated photon catches, native photoreceptor voltage or temporal dynamics.
The only change to the earlier receiver is its sensory input and familiarization
examples. The old receiver and controller files remain unmodified.
"""
import copy
import json
import random
import time
from pathlib import Path

import numpy as np
from embodied_reference import SpectralWorld
from phase_receiver_bridge import (BridgeController, build_controller, digest,
                                   graph, inputs, metrics)

ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/'application/spectral-receiver-bridge-v0'
PLAN=APP/'ANALYSIS-PLAN.json'
CURVES=APP/'source-extraction-01/CURVES.json'


def construct_model():
    plan=json.loads(PLAN.read_text('utf-8'))
    assert digest(ROOT/plan['source']['path'])==plan['source']['sha256']
    data=json.loads(CURVES.read_text('utf-8'))
    curves={c['id']:c for c in data['curves']}
    waves=plan['frontEnd']['stimulusWavelengthsNm']
    raw,scales,cells=[],[],[]
    for rh in plan['frontEnd']['channels']:
        c=curves[rh+'-low']
        points={p['wavelengthNm']:p for p in c['points']}
        raw.append([points[w]['meanMv'] for w in waves])
        scales.append(max(p['meanMv'] for p in c['points']))
        cells.append([points[w]['cells']['mean'] for w in waves])
    matrix=np.array(raw)/np.array(scales)[:,None]
    _,singular,vt=np.linalg.svd(matrix[:3],full_matrices=True)
    v=vt[-1].copy()
    v/=max(abs(v))
    if v[-1]<0: v=-v
    target=0.5+0.25*v
    other=0.5-0.25*v
    qt=matrix@target/4
    qo=matrix@other/4
    assert np.min(target)>=0 and np.max(target)<=1
    assert np.min(other)>=0 and np.max(other)<=1
    return dict(planSha256=digest(PLAN),curvesSha256=digest(CURVES),
                sourceSha256=plan['source']['sha256'],channels=plan['frontEnd']['channels'],
                wavelengthsNm=waves,sourceMeanMv=raw,sourceMeanCells=cells,
                normalizationMaximaMv=scales,matrix=matrix.tolist(),
                singularValuesCoarse=singular.tolist(),nullDirection=v.tolist(),
                targetReflectance=target.tolist(),otherReflectance=other.tolist(),
                targetPublicCapture=qt.tolist(),otherPublicCapture=qo.tolist(),
                coarseResidual=float(np.max(np.abs(matrix[:3]@v))),
                fullDifference=float(np.linalg.norm(qt-qo)),
                fullNormalizedL1Separation=float(np.sum(np.abs(qt/qt.sum()-qo/qo.sum()))),
                sourceScope='aggregate ERG-derived engineering kernel, not native cell physiology')


def load_inputs():
    plan=json.loads(PLAN.read_text('utf-8'))
    previous,seeds,routes,env=inputs()
    inherited=plan['inherited']
    assert digest(ROOT/'application/phase-receiver-bridge-v0/ANALYSIS-PLAN.json')==inherited['bridgePlanSha256']
    assert digest(ROOT/'tools/phase_receiver_bridge.py')==inherited['bridgeCodeSha256']
    assert digest(ROOT/'tools/embodied_reference.py')==inherited['referenceCodeSha256']
    model=json.loads((APP/'model-01/MODEL.json').read_text('utf-8'))
    assert model['planSha256']==digest(PLAN) and model['curvesSha256']==digest(CURVES)
    return plan,previous,seeds,routes,env,model


class SpectralProxyWorld(SpectralWorld):
    def __init__(self,config,scenario,seed,sensor,permuted=False):
        super().__init__(config,scenario,seed,permuted_labels=permuted)
        self.sensor=np.asarray(sensor)

    def observation(self,mode):
        channels=self.c['fullBands'] if mode=='full' else self.c['coarseBands']
        illumination=np.ones(4)
        if self.clock>=self.c['illuminationChangeTime']:
            if self.scenario=='uniform_illumination_gain':
                illumination=np.array(self.c['uniformIlluminant'])
            elif self.scenario=='adverse_colour_shift':
                illumination=np.array(self.c['adverseColouredIlluminant'])
        hidden=self.scenario in ('occlusion','occlusion_gain','uniform_illumination_gain','adverse_colour_shift') and self.clock in self.c['occlusionTimes']
        samples=[]
        for item in self.objects:
            if item['is_target'] and hidden: continue
            captures=self.sensor@(np.array(item['reflectance'])*illumination)/4
            samples.append(dict(signed_range=item['position']-self.position,
                                captures=[float(captures[i]) for i in channels]))
        random.Random(self.seed*1000+self.clock).shuffle(samples)
        if self.permuted: samples.reverse()
        return json.dumps(dict(time=self.clock,bands=channels,samples=samples),allow_nan=False)


def episode(env,model,scenario,seed,case,adjacency,settings,deadline,permuted=False,intervention=None):
    config=copy.deepcopy(env)
    for k in ('targetReflectance','otherReflectance'): config[k]=model[k]
    public=copy.deepcopy(config)
    public['targetReflectance']=model['targetPublicCapture']
    public['otherReflectance']=model['otherPublicCapture']
    world=SpectralProxyWorld(config,scenario,seed,model['matrix'],permuted)
    agent=build_controller(public,case,adjacency,settings,deadline)
    if isinstance(agent,BridgeController): agent.intervention=intervention
    records=[]
    initial=copy.deepcopy(agent.state())
    for step in range(config['steps']):
        if time.perf_counter()>deadline: raise TimeoutError('Case deadline')
        before,prior=world.evaluator_truth(),agent.state()
        payload=world.observation(agent.mode)
        observation=json.loads(payload)
        relation=agent.observe(payload)
        action=agent.act()
        after_observation=agent.state()
        body_payload=world.execute(action)
        body=agent.receive_body_return(body_payload)
        after=world.evaluator_truth()
        records.append(dict(step=step,observation=observation,priorState=prior,
            relation=relation,stateAfterObservation=after_observation,action=action,
            bodyReturn=body,bodyPayload=json.loads(body_payload),stateAfterReturn=agent.state(),
            evaluatorBefore=before,evaluatorAfter=after,
            priorRelationError=None if prior['target_relation'] is None else abs(prior['target_relation']-before['target_relative']),
            observedRelationError=abs(relation['relative_target']-before['target_relative']) if relation['status']=='observed' else None))
    result=dict(metrics=metrics(records,world.evaluator_truth(),config,scenario,seed,case['id']),
                initialState=initial,events=records,controllerFields=sorted(vars(agent)))
    if isinstance(agent,BridgeController):
        result.update(learned=copy.deepcopy(agent.learned),familiarization=agent.familiarization,
                      trainingCounters=agent.training_counters,testCounters=agent.receiver.counters,
                      receiverFields=sorted(vars(agent.receiver)))
    return result
