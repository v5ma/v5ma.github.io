"""Bounded pre-fit tests. No held-out performance is computed."""
from net import np, initialize, forward, loss_grad, adam_step, CONDITIONS
from gru_core import loss_grad as core_loss_grad
from world import config, load, inputs, labels, fingerprint, VARIANTS
from support import ROOT, SOURCES, lower_priority, sha, save, metrics
from evaluate import restricted_ceilings, prior_fit, probe_fit, probe_read
import argparse
import io
import json
import os
import time

CHECKS = []


def check(name,passed,detail=None):
    CHECKS.append({'name':name,'passed':bool(passed),'detail':detail})
    if not passed:
        raise AssertionError(name)


def exercise():
    cfg = config()
    check('preserved_GRU_source',sha(ROOT/'gru_core.py')=='8cc58515ebb283749069e91493410b44aaf4fac21273f4ddb73b8e15ffb463d4')
    check('single_thread_environment',all(os.environ.get(k)=='1' for k in ('OPENBLAS_NUM_THREADS','MKL_NUM_THREADS','OMP_NUM_THREADS')))
    data = {s:load(s) for s in ('training','development','heldout')}
    for split,n,blocks in (('training',3072,64),('development',768,16),('heldout',1536,32)):
        d = data[split]
        check(split+'_counts',len(d['y'])==n and len(set(d['blocks']))==blocks)
        check(split+'_paired_final_roles',np.array_equal(d['tasks'][:,1],np.tile(np.arange(6),n//6)))
        check(split+'_role_cue_no_focal_leak',all(len(set(d['tasks'][d['blocks']==b,0]))==1 for b in set(d['blocks'])))
        expected = np.zeros_like(d['y'])
        for i,(w,q) in enumerate(zip(d['worlds'],d['tasks'])):
            for s in (0,1):
                code = [w[s,0],w[s,4],4*(w[s,0]//2)+2*(w[s,2]//2)+w[s,5]//2,
                        4*w[s,1]+w[s,3],4*w[0,0]+w[0,5],int((int(w[1,4])-int(w[0,4]))%4==1)]
                expected[i,s] = code[q[s]]
        check(split+'_labels_independent_formula',np.array_equal(expected,d['y']))
        check(split+'_first_task_available',bool(np.all(d['tasks'][:,0]<5)))
        ceilings = restricted_ceilings(d)
        check(split+'_five_actual_input_ceilings',all(v['accuracy_max']==.5 and v['each_class_balanced'] for v in ceilings.values()),ceilings)
    check('split_backgrounds_disjoint',all(not(set(data[a]['blocks']) & set(data[b]['blocks'])) for a,b in
        (('training','development'),('training','heldout'),('development','heldout'))))
    train = data['training']
    check('data_reproducible',fingerprint(train)==fingerprint(load('training')))
    x,q,y = inputs(train)
    check('input_shapes',x.shape==(3072,12,17) and q.shape==(3072,2,6) and y.shape==(3072,2))
    check('physical_coordinate_ids',np.array_equal(x[0,:,:6],np.tile(np.eye(6),(2,1))))
    check('phase_coding',np.array_equal(x[0,:,10],np.repeat([0,1],6)))
    check('fine_value_encoding',np.array_equal(x[:,:,6:10].argmax(axis=-1),train['worlds'].reshape(-1,12)) and np.all(x[:,:,6:10].sum(axis=-1)==1))
    check('current_cues_only',np.array_equal(x[:,:,11:],np.repeat(q,6,axis=1)))
    changed = {k:v.copy() for k,v in train.items()}
    changed['blocks'] += 100000
    changed['y'][:] = 15
    zx,zq,_ = inputs(changed)
    check('ids_and_answer_labels_not_input',np.array_equal(zx,x) and np.array_equal(zq,q))
    _,_,rev_y = inputs(train,'reverse_retargeted')
    order = train['tasks'][:,1]==5
    check('reversal_flips_temporal_target',np.array_equal(rev_y[order,1],1-y[order,1]))
    for variant in VARIANTS[1:6]:
        _,_,vy = inputs(train,variant)
        check(variant+'_keeps_original_targets',np.array_equal(vy,y))
    # Network checks use only 18 training rows from three background blocks.
    idx = np.r_[np.arange(6),np.arange(48,54),np.arange(144,150)]
    xx,qq,yy = x[idx],q[idx],y[idx]
    p = initialize(401)
    check('14141_parameters_15_tensors',sum(a.size for a in p.values())==14141 and len(p)==15)
    ap,_,ah = forward(p,xx,qq,'additive')
    mp,_,mh = forward(p,xx,qq,'multiplicative')
    check('paired_initial_predictions_states',np.array_equal(ap,mp) and np.array_equal(ah,mh))
    check('probabilities_normalized',np.allclose(ap.sum(axis=-1),1) and np.isfinite(ap).all())
    # Zero adapter recovers all original GRU derivatives for both conditions.
    small = initialize(419,hidden=4,readout=5)
    baseline = {k:v.copy() for k,v in small.items() if k not in ('Wadapter','badapter')}
    cl,cg = core_loss_grad(baseline,xx,qq,yy)
    for condition in CONDITIONS:
        nl,ng = loss_grad(small,xx,qq,yy,condition)
        check(condition+'_core_gradient_equivalence',cl==nl and all(np.array_equal(cg[k],ng[k]) for k in cg))
    rng = np.random.default_rng(811)
    small['Wadapter'][:] = rng.normal(0,.1,small['Wadapter'].shape)
    small['badapter'][:] = rng.normal(0,.1,small['badapter'].shape)
    points = []
    for condition in CONDITIONS:
        loss,gradient = loss_grad(small,xx,qq,yy,condition)
        for key,array in small.items():
            # Include the largest gradient to avoid certifying inactive tensors only.
            flat_indices = sorted(set([int(np.abs(gradient[key]).argmax()),0,array.size-1]))
            errors = []
            for flat in flat_indices:
                index = np.unravel_index(flat,array.shape)
                old = float(array[index]); eps = 1e-5
                array[index] = old+eps; plus = loss_grad(small,xx,qq,yy,condition)[0]
                array[index] = old-eps; minus = loss_grad(small,xx,qq,yy,condition)[0]
                array[index] = old
                numeric = (plus-minus)/(2*eps)
                error = abs(numeric-float(gradient[key][index]))
                errors.append(error)
                points.append({'condition':condition,'tensor':key,'flat':flat,'absolute_error':error})
            check(condition+'_gradient_'+key,max(errors)<2e-7 and np.max(np.abs(gradient[key]))>1e-10,max(errors))
    check('all_gradient_points',all(v['absolute_error']<2e-7 for v in points),{'count':len(points),'max_error':max(v['absolute_error'] for v in points)})
    for condition in CONDITIONS:
        prob,_,state = forward(small,xx,qq,condition)
        later = xx.copy(); later[:,6:,6:10] = 0
        fp,_,fs = forward(small,later,qq,condition)
        check(condition+'_future_value_causality',np.array_equal(prob[:,0],fp[:,0]) and np.array_equal(state[:,0],fs[:,0]))
        rp,_,rs = forward(small,xx,qq,condition,True)
        check(condition+'_reset_does_not_rewrite_past',np.array_equal(prob[:,0],rp[:,0]) and np.array_equal(state[:,0],rs[:,0]))
        other = xx.copy(); other[:,:6,6:10] = other[:,:6,6:10][:,:,::-1]
        op,_,ost = forward(small,other,qq,condition,True)
        check(condition+'_reset_removes_old_values',np.array_equal(rp[:,1],op[:,1]) and np.array_equal(rs[:,1],ost[:,1]))
        loss,g = loss_grad(small,xx,qq,yy,condition)
        copy = {k:v.copy() for k,v in small.items()}
        adam_step(copy,g,{k:np.zeros_like(v) for k,v in copy.items()},
                  {k:np.zeros_like(v) for k,v in copy.items()},1,.0001,5,0)
        check(condition+'_small_descent_step',loss_grad(copy,xx,qq,yy,condition)[0]<loss)
    a,b = io.BytesIO(),io.BytesIO()
    np.savez(a,**p); np.savez(b,**p)
    check('numeric_archive_deterministic',a.getvalue()==b.getvalue())
    a.seek(0)
    with np.load(a,allow_pickle=False) as restored:
        check('numeric_serialization_exact',all(np.array_equal(p[k],restored[k]) for k in p))
    # Probe bookkeeping tests use explicit training/dev symbolic one-hot features,
    # not a held-out model score. This catches axis and role-transfer mistakes.
    dev = data['development']
    th = np.eye(4)[train['worlds'].reshape(-1,12)].reshape(-1,48)
    dh = np.eye(4)[dev['worlds'].reshape(-1,12)].reshape(-1,48)
    weights,choices = probe_fit(th,train,dh,dev,cfg['probe_penalties'])
    prediction,measure = probe_read(weights,dh,dev)
    check('cross_role_probe_axes',prediction.shape==(6,768,12) and weights.shape==(6,49,48))
    check('probe_recovers_explicit_coordinate_features',measure['diagonal_accuracy']==1 and measure['off_diagonal_accuracy']==1)
    check('probe_grid_ties_first_entry',all(c['penalty']==cfg['probe_penalties'][0] for c in choices))
    prior = prior_fit(train)
    check('training_prior_normalized',prior.shape==(2,6,16) and np.allclose(prior.sum(axis=-1),1))
    perfect = np.eye(16)[yy]
    mm = metrics(perfect,yy,train['tasks'][idx])
    check('perfect_metrics',mm['final_balanced_accuracy']==1 and mm['final_nll']==0 and mm['first_accuracy']==1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--out',default='TESTS-01.json')
    args = parser.parse_args()
    out = ROOT/args.out
    if out.parent.resolve()!=ROOT or out.exists():
        raise ValueError('Use a fresh direct-child test receipt')
    priority = lower_priority(); started = time.perf_counter(); error = None
    try:
        exercise()
    except Exception as exc:
        error = type(exc).__name__+': '+str(exc)
    receipt = {'passed':error is None,'error':error,'checks':CHECKS,
        'checks_completed':len(CHECKS),'seconds':time.perf_counter()-started,
        'priority':priority,'heldout_performance_computed':False,
        'heldout_note':'Held-out labels inspected solely for deterministic balance/input tests, never for fitting or model selection.',
        'source_hashes':{n:sha(ROOT/n) for n in SOURCES}}
    save(out,receipt)
    print(json.dumps({k:receipt[k] for k in ('passed','error','checks_completed','seconds')}))
    if error:
        raise SystemExit(1)
