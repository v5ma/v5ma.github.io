"""Post-hoc training/development-only diagnosis, with no held-out inference."""
from probes import ROOT,DONOR,np,standardize,fit_mlp,ridge,ridge_predict,forward,relation,component_metrics
from world import load,inputs,config as donor_config,fingerprint
from support import lower_priority,sha,save,predict,metrics
from evaluate import freeze_check
from collections import Counter,defaultdict
import argparse
import json
import time

SOURCES=('CONFIG.json','PROTOCOL.md','probes.py','test_diagnostic.py','run_diagnostic.py')


def get_config():
    return json.loads((ROOT/'CONFIG.json').read_text(encoding='utf-8'))


def allowed_data(split):
    if split not in ('training','development'):
        raise ValueError('This diagnostic prohibits held-out arrays')
    return load(split)


def noise_labels(blocks,seed):
    y=np.empty(len(blocks),dtype=np.int16)
    for b in np.unique(blocks):
        mask=blocks==b
        if mask.sum()!=8:
            raise ValueError('Noise control requires eight complete pairs per background')
        y[mask]=np.random.default_rng(seed+int(b)).permutation(np.repeat([0,1],4))
    return y


def earlier_ceiling(h,y):
    cells=defaultdict(Counter)
    for state,label in zip(h,y):
        cells[state.tobytes()][int(label)]+=1
    return {'maximum_accuracy':sum(max(v.values()) for v in cells.values())/len(y),
            'classes':len(cells),'all_balanced':all(v.get(0,0)==v.get(1,0) for v in cells.values())}


def study_view(name,features,targets,cfg,archive,parameters,rows,clock,control=False):
    if time.perf_counter()-clock>cfg['maximum_seconds_total']:
        raise TimeoutError('Diagnostic total budget exceeded')
    tx,dx,mean,std=standardize(features['training'],features['development'])
    archive[name+'__mean']=mean; archive[name+'__std']=std
    archive[name+'__training_features']=features['training']; archive[name+'__development_features']=features['development']
    ty,dy=targets['training']['label'],targets['development']['label']
    if not control:
        w,choice=ridge(tx,ty,dx,dy,cfg['penalties'],2)
        parameters[name+'__direct_ridge']=w
        row={'view':name,'family':'direct_affine','selection':choice,'features':tx.shape[1]}
        for split,x,y in (('training',tx,ty),('development',dx,dy)):
            pred=ridge_predict(w,x,1,2)[:,0]
            archive[name+'__direct_ridge__'+split]=pred
            row[split]={'accuracy':float((pred==y).mean())}
        rows.append(row)
        w,choice=ridge(tx,targets['training']['pair'],dx,targets['development']['pair'],cfg['penalties'],4)
        parameters[name+'__component_ridge']=w
        row={'view':name,'family':'component_ridge_supplied_relation','selection':choice,'features':tx.shape[1]}
        for split,x in (('training',tx),('development',dx)):
            pred=ridge_predict(w,x,2,4)
            archive[name+'__component_ridge__'+split]=pred
            row[split]=component_metrics(pred,targets[split]['pair'])
        rows.append(row)
    times=[]
    for seed in cfg['probe_seeds']:
        best,final,fit,seconds=fit_mlp(tx,ty,dx,dy,seed,cfg)
        prefix=name+'__mlp'+str(seed)
        parameters.update({prefix+'__selected__'+k:v for k,v in best.items()})
        parameters.update({prefix+'__final__'+k:v for k,v in final.items()})
        archive[prefix+'__training_probabilities']=forward(best,tx)[0]
        archive[prefix+'__development_probabilities']=forward(best,dx)[0]
        rows.append({'view':name,'family':'random_label_tanh' if control else 'direct_tanh',
                     'features':tx.shape[1],**fit})
        times.append(seconds)
    return times


def run(out_name):
    priority=lower_priority(); cfg=get_config()
    out=ROOT/out_name
    if out.parent.resolve()!=ROOT or out.exists():
        raise ValueError('Use a fresh direct-child diagnostic directory')
    tests=json.loads((ROOT/'TESTS-01.json').read_text(encoding='utf-8'))
    if not tests['passed'] or any(tests['source_hashes'][n]!=sha(ROOT/n) for n in SOURCES):
        raise ValueError('Diagnostic sources do not match passed pre-run tests')
    models=freeze_check(donor_config())
    source_hashes={n:sha(ROOT/n) for n in (*SOURCES,'TESTS-01.json')}
    out.mkdir()
    save(out/'BEFORE.json',{'source_hashes':source_hashes,'models':[m[3] for m in models],
         'splits':['training','development'],'new_heldout_inference':False,'priority':priority,'threads':1,
         'scope':'Post-hoc development diagnosis; not a new generalization result.'})
    began=time.perf_counter(); rows=[]; archive={}; parameters={}; times=[]
    data={s:allowed_data(s) for s in cfg['splits']}
    targets={}; masks={}; noise_targets={}
    for split,d in data.items():
        mask=d['tasks'][:,1]==5; masks[split]=mask
        pair=d['worlds'][mask][:,:,4]
        targets[split]={'pair':pair,'label':d['y'][mask,1]}
        noise_targets[split]={'pair':pair,'label':noise_labels(d['blocks'][mask],cfg['label_control_seed'])}
        archive[split+'__pair']=pair; archive[split+'__label']=targets[split]['label']
        archive[split+'__blocks']=d['blocks'][mask]; archive[split+'__noise_label']=noise_targets[split]['label']
    raw={s:np.eye(4)[targets[s]['pair']].reshape(-1,8) for s in cfg['splits']}
    times+=study_view('raw_pair',raw,targets,cfg,archive,parameters,rows,began)
    original=[]; ceilings=[]
    for seed,condition,p,receipt in models:
        name=f's{seed}__{condition}'; states={}
        for split,d in data.items():
            x,q,y=inputs(d)
            prob,state=predict(p,x,q,condition)
            original.append({'encoder':name,'split':split,**metrics(prob,y,d['tasks'])})
            archive[name+'__'+split+'__original_probabilities']=prob
            states[split]=state[masks[split]]
            archive[name+'__'+split+'__states']=states[split]
            ceiling=earlier_ceiling(states[split][:,0],targets[split]['label'])
            if ceiling['maximum_accuracy']!=.5 or not ceiling['all_balanced']:
                raise ValueError('Earlier-only state carries forbidden future information')
            ceilings.append({'encoder':name,'split':split,**ceiling})
        for view in ('earlier','final','both'):
            feats={s:states[s][:,0] if view=='earlier' else states[s][:,1] if view=='final'
                   else states[s].reshape(len(states[s]),-1) for s in cfg['splits']}
            times+=study_view(name+'__'+view,feats,targets,cfg,archive,parameters,rows,began)
        final={s:states[s][:,1] for s in cfg['splits']}
        times+=study_view(name+'__final_noise',final,noise_targets,cfg,archive,parameters,rows,began,True)
        print(json.dumps({'encoder':name,'finished':True,'elapsed_seconds':time.perf_counter()-began}),flush=True)
    np.savez(out/'predictions.npz',**archive)
    np.savez(out/'readout-parameters.npz',**parameters)
    if any(sha(ROOT/n)!=v for n,v in source_hashes.items()):
        raise ValueError('Diagnostic source changed during the run')
    freeze_check(donor_config())
    report={'complete':True,'rows':rows,'original':original,'earlier_ceilings':ceilings,
            'source_hashes':source_hashes,'models':[m[3] for m in models],
            'data':{s:fingerprint(d) for s,d in data.items()},'splits':list(data),
            'mlp_fits':len(times),'query_scope':'training/development only','heldout_inference':False,
            'total_fit_seconds':sum(times),'max_fit_seconds':max(times),'seconds':time.perf_counter()-began,
            'files':{n:{'sha256':sha(out/n),'bytes':(out/n).stat().st_size} for n in ('BEFORE.json','predictions.npz','readout-parameters.npz')}}
    if report['seconds']>cfg['maximum_seconds_total']:
        report['complete']=False
    save(out/('RESULT.json' if report['complete'] else 'PARTIAL.json'),report)
    print(json.dumps({k:report[k] for k in ('complete','mlp_fits','total_fit_seconds','max_fit_seconds','seconds','heldout_inference')}))
    return report['complete']


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--out',required=True)
    if not run(parser.parse_args().out):
        raise SystemExit(2)
