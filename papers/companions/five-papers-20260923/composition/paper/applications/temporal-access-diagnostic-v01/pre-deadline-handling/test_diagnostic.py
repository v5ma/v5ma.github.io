"""Exact synthetic pre-run checks, independent of held-out examples."""
from probes import ROOT,np,standardize,initialize,forward,loss_grad,fit_mlp,ridge,ridge_predict,relation,component_metrics
from run_diagnostic import SOURCES,get_config,allowed_data,noise_labels,earlier_ceiling
from support import lower_priority,sha,save
from world import inputs
import io
import json
import time


def main():
    priority=lower_priority(); began=time.perf_counter(); checks={}
    def ck(name,value):
        checks[name]=bool(value)
        if not value:
            raise AssertionError(name)
    cfg=get_config()
    rng=np.random.default_rng(702)
    x=rng.normal(size=(13,7)); y=rng.integers(0,2,13)
    p=initialize(147,7,5); loss,g=loss_grad(p,x,y)
    errors=[]
    for key,a in p.items():
        for i in sorted(set([0,a.size-1,int(np.abs(g[key]).argmax())])):
            index=np.unravel_index(i,a.shape); original=float(a[index]); epsilon=1e-5
            a[index]=original+epsilon; plus=loss_grad(p,x,y)[0]
            a[index]=original-epsilon; minus=loss_grad(p,x,y)[0]
            a[index]=original
            error=abs((plus-minus)/(2*epsilon)-float(g[key][index])); errors.append(error)
        ck('gradient_'+key,max(errors)<2e-7 and np.max(np.abs(g[key]))>1e-9)
    ck('probabilities_sum_one',np.allclose(forward(p,x)[0].sum(axis=1),1))
    tx=np.array([[1.,2.],[1.,4.],[1.,6.]])
    dx=np.array([[91.,200.]])
    z,dz,mean,std=standardize(tx,dx)
    ck('training_only_normalization',np.array_equal(mean,[1.,4.]) and std[0]==1 and np.allclose(z.mean(axis=0),0) and dz[0,0]==90)
    ck('normalization_development_not_recentered',abs(dz[0,1])>100)
    pairs=np.array([(a,(a+d)%4) for a in range(4) for d in (1,3)],dtype=np.int16)
    labels=np.tile([1,0],4)
    ck('eight_circular_labels',np.array_equal(relation(pairs),labels))
    ck('reverse_changes_labels',np.array_equal(relation(pairs[:,::-1]),1-labels))
    cases=[]
    for true in pairs:
        for a in range(4):
            for b in range(4):
                pred=np.array([[a,b]],dtype=np.int16)
                m=component_metrics(pred,true[None,:]); cases.append(m['union_bound_holds'])
    ck('128_relation_error_implications',len(cases)==128 and all(cases))
    invalid=np.array([[0,0],[0,2],[3,3],[3,1]])
    ck('invalid_pairs_abstain',np.all(relation(invalid)==2))
    ck('earlier_raw_half_ceiling',earlier_ceiling(np.eye(4)[pairs[:,0]],labels)['maximum_accuracy']==.5)
    blocks=np.repeat([1,7],8); noise=noise_labels(blocks,911)
    ck('negative_control_balanced_per_block',all(noise[blocks==b].sum()==4 for b in [1,7]))
    ck('negative_control_deterministic',np.array_equal(noise,noise_labels(blocks,911)))
    try:
        allowed_data('heldout')
        rejected=False
    except ValueError:
        rejected=True
    ck('heldout_access_rejected',rejected)
    train,dev=allowed_data('training'),allowed_data('development')
    ck('split_blocks_disjoint',not(set(train['blocks']) & set(dev['blocks'])))
    ck('temporal_subset_sizes',int((train['tasks'][:,1]==5).sum())==512 and int((dev['tasks'][:,1]==5).sum())==128)
    ck('labels_match_observation_pairs',all(np.array_equal(relation(d['worlds'][d['tasks'][:,1]==5][:,:,4]),d['y'][d['tasks'][:,1]==5,1]) for d in (train,dev)))
    raw=np.eye(4)[pairs].reshape(-1,8)
    w,choice=ridge(raw,pairs,raw,pairs,cfg['penalties'],4)
    ck('component_ridge_axes',w.shape==(9,8))
    ck('component_ridge_exact_explicit_pair',np.array_equal(ridge_predict(w,raw,2,4),pairs))
    ck('ridge_tie_first_grid',choice['penalty']==cfg['penalties'][0])
    # Tiny development-only optimization check; deliberately not the order task.
    sx=np.array([[-1.],[-.5],[.5],[1.]])
    sy=np.array([0,0,1,1]); small=dict(cfg,epochs=10,hidden=4)
    best,final,receipt,_=fit_mlp(sx,sy,sx,sy,2718,small)
    chosen=max(receipt['logs'],key=lambda r:(r['development']['accuracy'],-r['development']['nll']))
    ck('selection_rule_exact',receipt['selected_epoch']==chosen['epoch'])
    ck('ten_epoch_budget',receipt['epochs']==10)
    ck('fit_is_finite',all(np.isfinite(a).all() for a in final.values()))
    ck('fit_reduces_loss',receipt['final_train']['nll']<receipt['logs'][0]['train']['nll'])
    a,b=io.BytesIO(),io.BytesIO(); np.savez(a,**best); np.savez(b,**best)
    ck('deterministic_parameter_archive',a.getvalue()==b.getvalue())
    out=ROOT/'TESTS-01.json'
    save(out,{'passed':all(checks.values()),'checks':checks,'total':len(checks),
        'gradient_samples':len(errors),'max_gradient_error':max(errors),'priority':priority,
        'seconds':time.perf_counter()-began,'source_hashes':{n:sha(ROOT/n) for n in SOURCES},
        'heldout_inference':False})
    print(json.dumps({'passed':sum(checks.values()),'total':len(checks),'gradient_samples':len(errors),'max_gradient_error':max(errors)}))


if __name__=='__main__':
    main()
