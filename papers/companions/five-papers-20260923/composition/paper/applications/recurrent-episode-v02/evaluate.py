"""Post-freeze held-out inference and restricted probes; no recurrent training."""
from net import np
from world import make_id,make_challenge,inputs,fingerprint,split_pools,CONDITIONS
from support import ROOT,lower_priority,sha,save_json,predict,metrics
import argparse
import json
import time

VARIANTS=('intact','reset_at_switch','corrupt_old_values','corrupt_current_values')


def freeze_check(config):
    models=[]
    for seed in config['fit_seeds']:
        for condition in CONDITIONS:
            folder=ROOT/('fit-'+str(seed)+'-'+condition)
            r=json.loads((folder/'FROZEN.json').read_text(encoding='utf-8'))
            if not r['complete'] or not r['frozen_for_test'] or r['pilot']:
                raise ValueError('Only complete main-fit checkpoints are eligible.')
            if r['completed_epochs']!=config['epochs'] or r['updates']!=640:
                raise ValueError('Unexpected training budget.')
            if any(sha(folder/n)!=v['sha256'] for n,v in r['files'].items()):
                raise ValueError('Fit file hash mismatch.')
            if any(sha(ROOT/n)!=value for n,value in r['source_hashes'].items()):
                raise ValueError('Fitted source changed before evaluation.')
            logs=[json.loads(line) for line in (folder/'epochs.jsonl').read_text(encoding='utf-8').splitlines()]
            selected=max(logs,key=lambda row:(row['development']['balanced_accuracy'],-row['development']['nll']))
            if selected['epoch']!=r['selected_epoch']:
                raise ValueError('Checkpoint selection differs from the protocol.')
            with np.load(folder/'selected.npz',allow_pickle=False) as archive:
                p={k:archive[k].copy() for k in archive.files}
            models.append((seed,condition,p,{'folder':folder.name,'frozen_receipt_sha256':sha(folder/'FROZEN.json'),
                'selected_sha256':sha(folder/'selected.npz'),'selected_epoch':r['selected_epoch'],
                'train_sha256':json.loads((folder/'BEFORE.json').read_text(encoding='utf-8'))['train']['sha256'],
                'dev_sha256':json.loads((folder/'BEFORE.json').read_text(encoding='utf-8'))['dev']['sha256']}))
    for seed in config['fit_seeds']:
        with np.load(ROOT/('fit-'+str(seed)+'-'+CONDITIONS[0])/'initial.npz',allow_pickle=False) as a:
            with np.load(ROOT/('fit-'+str(seed)+'-'+CONDITIONS[1])/'initial.npz',allow_pickle=False) as b:
                if a.files!=b.files or not all(np.array_equal(a[k],b[k]) for k in a.files):
                    raise ValueError('Paired initial weights differ.')
    return models


def prior_fit(train):
    prior=np.ones((2,6,16))
    for stage in range(2):
        for task in range(6):
            selected=train['tasks'][:,stage]==task
            prior[stage,task]+=np.bincount(train['y'][selected,stage],minlength=16)
    return prior/prior.sum(axis=-1,keepdims=True)


def queried_prob(prior,tasks):
    return prior[np.arange(2)[None,:],tasks]


def response_arrays(archive,prefix,prob,data):
    target_probability=prob[np.arange(len(prob))[:,None],np.arange(2)[None,:],data['y']]
    archive[prefix+'__prediction']=prob.argmax(axis=-1).astype(np.int16)
    archive[prefix+'__target_probability']=target_probability


def probe_fit(h,data,dev_h,dev,penalties):
    parameters={}
    selected=[]
    target=data['worlds'].reshape(-1,12)
    dev_target=dev['worlds'].reshape(-1,12)
    for task in range(6):
        mask=data['tasks'][:,1]==task
        dmask=dev['tasks'][:,1]==task
        x=np.column_stack((h[mask],np.ones(int(mask.sum()))))
        dx=np.column_stack((dev_h[dmask],np.ones(int(dmask.sum()))))
        y=np.eye(4)[target[mask]].reshape(-1,48)
        penalty=np.eye(x.shape[1])
        penalty[-1,-1]=0
        best=None
        scores=[]
        for lam in penalties:
            weights=np.linalg.solve(x.T@x+lam*penalty,x.T@y)
            pred=(dx@weights).reshape(-1,12,4).argmax(axis=2)
            score=float((pred==dev_target[dmask]).mean())
            scores.append({'penalty':lam,'development_accuracy':score})
            if best is None or score>best[0]:
                best=(score,weights,lam)
        modes=np.array([np.bincount(target[mask,c],minlength=4).argmax() for c in range(12)])
        parameters[task]=(best[1],modes)
        selected.append({'task':task,'penalty':best[2],'development_accuracy':best[0],
                         'train_n':int(mask.sum()),'dev_n':int(dmask.sum()),'grid':scores})
    return parameters,selected


def probe_read(parameters,h,data):
    pred=np.zeros((len(h),12),dtype=np.int16)
    base=np.zeros_like(pred)
    cells=[]
    truth=data['worlds'].reshape(-1,12)
    for task,(weights,modes) in parameters.items():
        mask=data['tasks'][:,1]==task
        x=np.column_stack((h[mask],np.ones(int(mask.sum()))))
        pred[mask]=(x@weights).reshape(-1,12,4).argmax(axis=2)
        base[mask]=modes
        cells.append({'task':task,'n':int(mask.sum()),
            'coordinate_accuracy':(pred[mask]==truth[mask]).mean(axis=0).tolist(),
            'prior_coordinate_accuracy':(base[mask]==truth[mask]).mean(axis=0).tolist()})
    return pred,base,{'cells':cells,'accuracy':float((pred==truth).mean()),
        'prior_accuracy':float((base==truth).mean()),
        'old_accuracy':float((pred[:,:6]==truth[:,:6]).mean()),
        'current_accuracy':float((pred[:,6:]==truth[:,6:]).mean()),
        'balanced_accuracy':float(np.mean([c['coordinate_accuracy'] for c in cells])),
        'balanced_prior_accuracy':float(np.mean([c['prior_coordinate_accuracy'] for c in cells]))}


def run(out_name):
    priority=lower_priority()
    out=ROOT/out_name
    if out.parent.resolve()!=ROOT or out.exists():
        raise ValueError('Use a fresh direct child evaluation folder.')
    config=json.loads((ROOT/'CONFIG.json').read_text(encoding='utf-8'))
    models=freeze_check(config)
    out.mkdir()
    save_json(out/'BEFORE-HELDOUT.json',{'models':[m[3] for m in models],
        'priority':priority,'source_hashes':{n:sha(ROOT/n) for n in
        ('CONFIG.json','PROTOCOL.md','EVALUATION-PLAN.md','net.py','world.py','support.py','evaluate.py')},
        'heldout_episode_generation_has_started':False})
    started=time.perf_counter()
    train=make_id(config,'train')
    dev=make_id(config,'dev')
    if any(m[3]['train_sha256']!=fingerprint(train)['sha256'] or
           m[3]['dev_sha256']!=fingerprint(dev)['sha256'] for m in models):
        raise ValueError('Fitting datasets differ from evaluation route.')
    datasets={'id':make_id(config,'test',True),'single_entity_edit':make_challenge(config,True)}
    train_ids=set(split_pools(config)['train'].tolist())
    overlap={name:{'old_scene_rows_in_training_pool':sum(int(i) in train_ids for i in data['scene_ids'][:,0]),
                   'current_scene_rows_in_training_pool':sum(int(i) in train_ids for i in data['scene_ids'][:,1]),
                   'current_distinct_training_scenes':len(set(data['scene_ids'][:,1].tolist())&train_ids)}
             for name,data in datasets.items()}
    archive={}
    for name,data in datasets.items():
        for key,value in data.items():
            archive[name+'__data__'+key]=value
    prior=prior_fit(train)
    prior_result={}
    for name,data in datasets.items():
        prob=queried_prob(prior,data['tasks'])
        prior_result[name]=metrics(prob,data['y'],data['tasks'])
        response_arrays(archive,name+'__prior',prob,data)
    donors={name:np.random.default_rng(27001).permutation(len(data['y'])) for name,data in datasets.items()}
    corruption={}
    for name,data in datasets.items():
        donor=donors[name]
        archive[name+'__donors']=donor
        corruption[name]={'fixed_episode_donors':int((donor==np.arange(len(donor))).sum()),
            'unchanged_old_coordinate_values':int((data['worlds'][donor,0]==data['worlds'][:,0]).sum()),
            'unchanged_current_coordinate_values':int((data['worlds'][donor,1]==data['worlds'][:,1]).sum()),
            'coordinates_per_phase':len(donor)*6}
    results=[]
    probe_results=[]
    probe_weights={}
    for seed,condition,p,receipt in models:
        intact_hidden={}
        for name,data in datasets.items():
            for variant in VARIANTS:
                worlds=data['worlds']
                if variant.startswith('corrupt_'):
                    phase=0 if variant=='corrupt_old_values' else 1
                    worlds=worlds.copy()
                    worlds[:,phase]=data['worlds'][donors[name],phase]
                x,q=inputs(worlds,data['tasks'],data['orders'],condition)
                prob,h=predict(p,x,q,variant=='reset_at_switch')
                if variant=='intact':
                    intact_hidden[name]=h[:,1]
                measured=metrics(prob,data['y'],data['tasks'])
                prefix=name+'__'+str(seed)+'__'+condition+'__'+variant
                response_arrays(archive,prefix,prob,data)
                results.append({'dataset':name,'seed':seed,'condition':condition,
                                'variant':variant,**measured})
        tx,tq=inputs(train['worlds'],train['tasks'],train['orders'],condition)
        dx,dq=inputs(dev['worlds'],dev['tasks'],dev['orders'],condition)
        train_h=predict(p,tx,tq)[1][:,1]
        dev_h=predict(p,dx,dq)[1][:,1]
        parameters,selected=probe_fit(train_h,train,dev_h,dev,config['probe_penalties'])
        for task,(weights,modes) in parameters.items():
            key=str(seed)+'__'+condition+'__task'+str(task)
            probe_weights[key+'__weights']=weights
            probe_weights[key+'__prior_modes']=modes
        for name,data in datasets.items():
            pred,base,measured=probe_read(parameters,intact_hidden[name],data)
            key=name+'__'+str(seed)+'__'+condition+'__probe'
            archive[key+'__prediction']=pred
            archive[key+'__prior_prediction']=base
            probe_results.append({'dataset':name,'seed':seed,'condition':condition,
                'selection':selected,**measured})
    np.savez_compressed(out/'predictions.npz',**archive)
    np.savez_compressed(out/'probe-parameters.npz',**probe_weights)
    summary={'complete':True,'mode':'post-freeze synthetic held-out evaluation',
        'priority':priority,'single_thread':True,'datasets':{n:fingerprint(d) for n,d in datasets.items()},
        'scene_overlap':overlap,'corruption':corruption,'prior':prior_result,
        'results':results,'probes':probe_results,'models':[m[3] for m in models],
        'main_query_rows':sum(len(d['y'])*2 for d in datasets.values())*len(models)*len(VARIANTS),
        'main_fits':len(models),'random_initialization_seeds':len(config['fit_seeds']),
        'seconds':time.perf_counter()-started,
        'files':{n:{'sha256':sha(out/n),'bytes':(out/n).stat().st_size} for n in
                 ('BEFORE-HELDOUT.json','predictions.npz','probe-parameters.npz')}}
    save_json(out/'summary.json',summary)
    print(json.dumps({'complete':True,'seconds':summary['seconds'],'query_rows':summary['main_query_rows'],
        'intact':[{'dataset':r['dataset'],'seed':r['seed'],'condition':r['condition'],
                  'balanced_accuracy':r['balanced_accuracy']} for r in results if r['variant']=='intact'],
        'scene_overlap':overlap}))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',required=True)
    run(parser.parse_args().out)
