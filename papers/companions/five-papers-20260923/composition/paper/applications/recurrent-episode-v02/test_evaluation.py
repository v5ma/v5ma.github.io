"""Post-fit, pre-heldout evaluation tests using only training and development."""
from net import np
from world import make_id
from support import ROOT,metrics,sha,save_json,lower_priority
from evaluate import freeze_check,prior_fit,queried_prob,probe_fit,probe_read
import argparse
import json
import time


def run():
    lower_priority()
    config=json.loads((ROOT/'CONFIG.json').read_text(encoding='utf-8'))
    checks=[]
    def check(name,passed):
        checks.append({'name':name,'passed':bool(passed)})
    models=freeze_check(config)
    check('all_six_main_fits_frozen_and_hash_verified',len(models)==6)
    check('one_shared_training_dataset',len({m[3]['train_sha256'] for m in models})==1)
    check('one_shared_development_dataset',len({m[3]['dev_sha256'] for m in models})==1)
    train=make_id(config,'train')
    dev=make_id(config,'dev')
    prior=prior_fit(train)
    check('prior_all_classes_positive',bool((prior>0).all()))
    check('prior_probabilities_normalized',np.allclose(prior.sum(axis=-1),1,atol=1e-12))
    prob=queried_prob(prior,dev['tasks'])
    check('prior_predictions_ignore_scene',all(np.unique(prob[dev['tasks'][:,s]==t,s],axis=0).shape[0]==1
          for s in range(2) for t in range(6) if (dev['tasks'][:,s]==t).any()))
    measured=metrics(prob,dev['y'],dev['tasks'])
    check('ten_task_stage_cells',len(measured['cells'])==10)
    check('cells_partition_all_queries',sum(c['n'] for c in measured['cells'])==2*len(dev['y']))
    check('summary_accuracy_recomputes_from_counts',abs(measured['accuracy']-
        sum(c['correct'] for c in measured['cells'])/(2*len(dev['y'])))<1e-12)
    check('balanced_accuracy_is_cell_mean',abs(measured['balanced_accuracy']-
        sum(c['correct']/c['n'] for c in measured['cells'])/10)<1e-12)
    onehot=np.eye(4)[train['worlds'].reshape(-1,12)].reshape(-1,48)
    dev_hot=np.eye(4)[dev['worlds'].reshape(-1,12)].reshape(-1,48)
    params,selected=probe_fit(onehot,train,dev_hot,dev,config['probe_penalties'])
    pred,base,result=probe_read(params,dev_hot,dev)
    check('affine_probe_recovers_explicitly_supplied_coordinates',np.array_equal(pred,dev['worlds'].reshape(-1,12)))
    check('probe_predictions_have_declared_shape',pred.shape==(len(dev['y']),12))
    check('probe_grid_selection_obeys_development_rule',all(
        s['penalty']==max(s['grid'],key=lambda z:z['development_accuracy'])['penalty'] for s in selected))
    check('probe_has_one_readout_per_task',len(params)==6)
    zeros=np.zeros_like(onehot)
    dev_zeros=np.zeros_like(dev_hot)
    params0,selected0=probe_fit(zeros,train,dev_zeros,dev,config['probe_penalties'])
    pred0,base0,result0=probe_read(params0,dev_zeros,dev)
    check('zero_information_probe_equals_training_mode',np.array_equal(pred0,base0))
    check('probe_never_modifies_its_input',not zeros.any() and not dev_zeros.any())
    check('old_current_accuracy_partitions_probe_score',abs(result0['accuracy']-
        (result0['old_accuracy']+result0['current_accuracy'])/2)<1e-12)
    check('probe_cells_partition_episodes',sum(c['n'] for c in result0['cells'])==len(dev['y']))
    return checks


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True)
    args=parser.parse_args()
    out=ROOT/args.out
    if out.parent.resolve()!=ROOT or out.exists():
        raise ValueError('Use a fresh receipt filename.')
    start=time.perf_counter()
    checks=run()
    result={'passed':all(c['passed'] for c in checks),'checks':checks,'count':len(checks),
        'passed_count':sum(c['passed'] for c in checks),'seconds':time.perf_counter()-start,
        'heldout_episodes_generated':False,'source_hashes':{n:sha(ROOT/n) for n in
        ('CONFIG.json','PROTOCOL.md','EVALUATION-PLAN.md','net.py','world.py','support.py','evaluate.py','test_evaluation.py')}}
    save_json(out,result)
    print(json.dumps({k:result[k] for k in ('passed','count','passed_count','seconds')}))
    if not result['passed']:
        print(json.dumps([c for c in checks if not c['passed']]))
        raise SystemExit(1)
