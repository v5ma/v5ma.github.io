"""Pre-fit independent arithmetic, gradient, leakage and state checks."""
from net import np,initialize,forward,loss_grad
from world import scene_values,scene_ids,split_pools,make_id,inputs,fingerprint
from pathlib import Path
import argparse
import hashlib
import io
import json
import time

ROOT=Path(__file__).resolve().parent


def run():
    config=json.loads((ROOT/'CONFIG.json').read_text(encoding='utf-8'))
    checks=[]
    def check(name,passed,detail=None):
        checks.append({'name':name,'passed':bool(passed),'detail':detail})

    values=scene_values(np.arange(4096))
    check('all_4096_scene_roundtrips',np.array_equal(scene_ids(values),np.arange(4096)))
    pools=split_pools(config)
    poolsets={k:set(v.tolist()) for k,v in pools.items()}
    check('three_scene_pools_disjoint',not(poolsets['train']&poolsets['dev'] or
        poolsets['train']&poolsets['test'] or poolsets['dev']&poolsets['test']))
    check('scene_pools_exhaust_4096',len(set.union(*poolsets.values()))==4096)
    check('declared_split_sizes',all(len(pools[k])==config[k+'_world_count'] for k in pools))
    train=make_id(config,'train')
    dev=make_id(config,'dev')
    check('train_dev_episodes_deterministic',fingerprint(train)==fingerprint(make_id(config,'train'))
          and fingerprint(dev)==fingerprint(make_id(config,'dev')))
    check('train_dev_scenes_stay_in_assigned_pools',all(set(d['scene_ids'].ravel().tolist())<=poolsets[k]
          for k,d in [('train',train),('dev',dev)]))
    try:
        make_id(config,'test')
        gate=False
    except ValueError:
        gate=True
    check('test_generation_requires_explicit_postfreeze_path',gate)
    expected=[]
    for worlds,tasks in zip(dev['worlds'].tolist(),dev['tasks'].tolist()):
        answers=[]
        for stage,task in enumerate(tasks):
            c=worlds[stage]
            if task==0: value=c[0]
            elif task==1: value=c[5]
            elif task==2: value=int(''.join(str(int(c[j]>=2)) for j in (2,3,4)),2)
            elif task==3: value=sum([c[1]*4,c[3]])
            elif task==4: value=worlds[0][0]*4+worlds[0][5]
            elif task==5: value=0 if c[4]<worlds[0][4] else 2 if c[4]>worlds[0][4] else 1
            answers.append(value)
        expected.append(answers)
    check('development_targets_independently_recomputed',np.array_equal(dev['y'],expected))
    check('first_tasks_and_switches_valid',bool((dev['tasks'][:,0]<4).all()) and
          bool((dev['tasks'][:,0]!=dev['tasks'][:,1]).all()))
    x,q=inputs(dev['worlds'],dev['tasks'],dev['orders'],'cue_in_recurrence')
    late,qlate=inputs(dev['worlds'],dev['tasks'],dev['orders'],'cue_at_readout')
    check('declared_input_and_query_shapes',x.shape==(len(dev['y']),12,17) and q.shape==(len(dev['y']),2,6))
    check('all_observation_tokens_decodable',all(
        np.array_equal(x[:,6*s+j,7:11].argmax(axis=1),dev['worlds'][np.arange(len(x)),s,dev['orders'][:,s,j]])
        and np.array_equal(x[:,6*s+j,:3].argmax(axis=1),dev['orders'][:,s,j]//2)
        and np.array_equal(x[:,6*s+j,3:5].argmax(axis=1),dev['orders'][:,s,j]%2)
        for s in range(2) for j in range(6)))
    check('each_coordinate_observed_once_per_scene',bool((np.sort(dev['orders'],axis=2)==np.arange(6)).all()))
    check('conditions_differ_only_by_encoder_cue',np.array_equal(x[:,:,:11],late[:,:,:11]) and
          not late[:,:,11:].any() and np.array_equal(q,qlate))
    tasks2=dev['tasks'].copy()
    tasks2[:,1]=(tasks2[:,1]+1)%6
    future,_=inputs(dev['worlds'],tasks2,dev['orders'],'cue_in_recurrence')
    check('no_future_cue_in_first_scene',np.array_equal(x[:,:6],future[:,:6]))
    p=initialize(101)
    check('allocated_parameters_14064',sum(v.size for v in p.values())==14064)
    before={k:v.copy() for k,v in p.items()}
    probs,_,states=forward(p,x[:8],q[:8])
    check('finite_normalized_positive_probabilities',np.isfinite(probs).all() and
          (probs>0).all() and np.allclose(probs.sum(axis=2),1,atol=1e-12))
    check('forward_does_not_change_parameters',all(np.array_equal(p[k],before[k]) for k in p))
    _,_,qchanged=forward(p,x[:8],q[:8,::-1].copy())
    check('answer_cue_cannot_update_hidden_memory',np.array_equal(states,qchanged))
    altered=x[:8].copy()
    altered[:,:6,7:11]=np.roll(altered[:,:6,7:11],1,axis=2)
    _,_,reset_a=forward(p,x[:8],q[:8],True)
    _,_,reset_b=forward(p,altered,q[:8],True)
    check('switch_reset_removes_prior_hidden_cause',np.array_equal(reset_a[:,1],reset_b[:,1]))
    check('reset_preserves_first_query_state',np.array_equal(reset_a[:,0],states[:,0]))
    stream=io.BytesIO()
    np.savez(stream,**p)
    stream.seek(0)
    with np.load(stream,allow_pickle=False) as loaded:
        restored={k:loaded[k].copy() for k in loaded.files}
    restored_prob,_,_=forward(restored,x[:8],q[:8])
    check('checkpoint_roundtrip_identical_predictions',np.array_equal(probs,restored_prob))

    small=initialize(401,hidden=5,readout=7)
    sample=x[:3]
    query=q[:3]
    targets=dev['y'][:3]
    loss,grad=loss_grad(small,sample,query,targets)
    rng=np.random.default_rng(405)
    gradient_detail=[]
    eps=1e-5
    for key in small:
        errors=[]
        passed=True
        for flat in rng.choice(small[key].size,min(3,small[key].size),replace=False):
            index=np.unravel_index(flat,small[key].shape)
            original=small[key][index]
            small[key][index]=original+eps
            high=loss_grad(small,sample,query,targets)[0]
            small[key][index]=original-eps
            low=loss_grad(small,sample,query,targets)[0]
            small[key][index]=original
            numeric=(high-low)/(2*eps)
            analytic=float(grad[key][index])
            error=abs(numeric-analytic)
            passed=passed and error<1e-7+1e-4*max(abs(numeric),abs(analytic))
            errors.append(error)
        gradient_detail.append({'parameter':key,'samples':len(errors),'max_absolute_error':max(errors)})
        check('finite_difference_'+key,passed,gradient_detail[-1])
    updated={k:small[k]-1e-3*grad[k] for k in small}
    check('gradient_small_step_reduces_loss',loss_grad(updated,sample,query,targets)[0]<loss)
    _,late_grad=loss_grad(small,late[:3],q[:3],targets)
    check('unavailable_encoder_cue_columns_have_zero_gradient',all(
        not late_grad['W'+gate][11:].any() for gate in ('z','r','n')))
    return checks,gradient_detail


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True)
    args=parser.parse_args()
    output=ROOT/args.out
    if output.parent.resolve()!=ROOT or output.exists():
        raise ValueError('Use a fresh exact receipt filename in this application folder.')
    started=time.perf_counter()
    checks,detail=run()
    receipt={'checks':checks,'passed':all(c['passed'] for c in checks),
        'passed_count':sum(c['passed'] for c in checks),'count':len(checks),
        'gradient_samples':sum(c['samples'] for c in detail),
        'seconds':time.perf_counter()-started,
        'source_hashes':{n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest()
                         for n in ('CONFIG.json','PROTOCOL.md','net.py','world.py','test_recurrent.py')}}
    with output.open('x',encoding='utf-8') as handle:
        json.dump(receipt,handle,indent=2)
    print(json.dumps({k:receipt[k] for k in ('passed','passed_count','count','gradient_samples','seconds')}))
    if not receipt['passed']:
        print(json.dumps([c for c in checks if not c['passed']]))
        raise SystemExit(1)
