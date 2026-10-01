"""Frozen inference and train/dev-selected affine probes; no recurrent fitting."""
from net import np
from world import config, load, inputs, fingerprint, VARIANTS
from support import ROOT, SOURCES, lower_priority, sha, save, predict, metrics
from collections import Counter, defaultdict
import argparse
import json
import time


def freeze_check(cfg):
    models = []
    for seed in cfg['fit_seeds']:
        initials = []
        for condition in cfg['conditions']:
            folder = ROOT/f'fit-{seed}-{condition}'
            r = json.loads((folder/'FROZEN.json').read_text(encoding='utf-8'))
            if not r['complete'] or not r['frozen_for_test'] or r['completed_epochs'] != cfg['epochs']:
                raise ValueError('An incomplete model is not eligible')
            if r['updates'] != 960 or r['training_episode_presentations'] != 122880:
                raise ValueError('Unmatched fitting budget')
            if any(sha(ROOT/n) != value for n,value in r['source_hashes'].items()):
                raise ValueError('A pre-fit source changed')
            if any(sha(folder/n) != value['sha256'] for n,value in r['files'].items()):
                raise ValueError('A fitted artifact changed')
            logs = [json.loads(line) for line in (folder/'epochs.jsonl').read_text(encoding='utf-8').splitlines()]
            chosen = max(logs,key=lambda row:(row['development']['final_balanced_accuracy'],-row['development']['final_nll']))
            if len(logs) != cfg['epochs'] or chosen['epoch'] != r['selected_epoch']:
                raise ValueError('Development checkpoint choice differs from the plan')
            before = json.loads((folder/'BEFORE.json').read_text(encoding='utf-8'))
            with np.load(folder/'initial.npz',allow_pickle=False) as a:
                initials.append({k:a[k].copy() for k in a.files})
            with np.load(folder/'selected.npz',allow_pickle=False) as a:
                p = {k:a[k].copy() for k in a.files}
            if sum(v.size for v in p.values()) != 14141 or before['active_parameters'] != 14141:
                raise ValueError('Parameter count changed')
            receipt = {'seed':seed,'condition':condition,'folder':folder.name,
                'frozen_sha256':sha(folder/'FROZEN.json'),'selected_sha256':sha(folder/'selected.npz'),
                'selected_epoch':r['selected_epoch'],'train':before['train'],'dev':before['dev']}
            models.append((seed,condition,p,receipt))
        if initials[0].keys() != initials[1].keys() or not all(np.array_equal(initials[0][k],initials[1][k]) for k in initials[0]):
            raise ValueError('Paired initial parameters differ')
    return models


def prior_fit(data):
    result = np.ones((2,6,16))
    for stage in range(2):
        for task in range(6):
            mask = data['tasks'][:,stage] == task
            result[stage,task] += np.bincount(data['y'][mask,stage],minlength=16)
    return result/result.sum(axis=-1,keepdims=True)


def restricted_ceilings(data):
    """Exact empirical oracle bound using actual allowed inputs, not model predictions."""
    selected = np.flatnonzero(data['tasks'][:,1]==5)
    results = {}
    for variant in VARIANTS[1:6]:
        x,q,y = inputs(data,variant)
        cells = defaultdict(Counter)
        for i in selected:
            # Reset removes the entire earlier hidden state; no answer writeback.
            available = x[i,6:] if variant=='reset_at_switch' else x[i]
            key = available.tobytes()+q[i,1].tobytes()
            cells[key][int(y[i,1])] += 1
        successes = sum(max(count.values()) for count in cells.values())
        results[variant] = {'correct_max':successes,'total':len(selected),
            'accuracy_max':successes/len(selected),'input_classes':len(cells),
            'each_class_balanced':all(count.get(0,0)==count.get(1,0) for count in cells.values())}
    return results


def probe_fit(h,data,dh,dev,penalties):
    weights,choices = [],[]
    truth,devtruth = data['worlds'].reshape(-1,12),dev['worlds'].reshape(-1,12)
    for role in range(6):
        mask,dmask = data['tasks'][:,1]==role,dev['tasks'][:,1]==role
        x = np.column_stack((h[mask],np.ones(mask.sum())))
        dx = np.column_stack((dh[dmask],np.ones(dmask.sum())))
        y = np.eye(4)[truth[mask]].reshape(-1,48)
        penalty = np.eye(x.shape[1]); penalty[-1,-1] = 0
        best,grid = None,[]
        for lam in penalties:
            w = np.linalg.solve(x.T@x+lam*penalty,x.T@y)
            pred = (dx@w).reshape(-1,12,4).argmax(axis=-1)
            score = float((pred==devtruth[dmask]).mean())
            grid.append({'penalty':lam,'development_coordinate_accuracy':score})
            if best is None or score>best[0]:
                best = (score,w,lam)
        weights.append(best[1])
        choices.append({'source_role':role,'penalty':best[2],'development_accuracy':best[0],
            'grid':grid,'train_n':int(mask.sum()),'dev_n':int(dmask.sum())})
    return np.stack(weights),choices


def probe_read(weights,h,data):
    x = np.column_stack((h,np.ones(len(h))))
    truth = data['worlds'].reshape(-1,12)
    pred = np.stack([(x@w).reshape(-1,12,4).argmax(axis=-1) for w in weights]).astype(np.int16)
    cells = np.zeros((6,6,12))
    for source in range(6):
        for dest in range(6):
            mask = data['tasks'][:,1]==dest
            cells[source,dest] = (pred[source,mask]==truth[mask]).mean(axis=0)
    matrix = cells.mean(axis=-1)
    diag = cells[np.arange(6),np.arange(6)]
    return pred,{'source_by_destination_accuracy':matrix.tolist(),
        'source_by_destination_by_coordinate':cells.tolist(),
        'diagonal_accuracy':float(np.diag(matrix).mean()),
        'off_diagonal_accuracy':float(matrix[~np.eye(6,dtype=bool)].mean()),
        'diagonal_old_accuracy':float(diag[:,:6].mean()),
        'diagonal_current_accuracy':float(diag[:,6:].mean())}


def run(out_name):
    priority = lower_priority()
    out = ROOT/out_name
    if out.parent.resolve()!=ROOT or out.exists():
        raise ValueError('Use a fresh direct-child output folder')
    cfg = config()
    models = freeze_check(cfg)  # All six models frozen before any held-out forward call.
    out.mkdir()
    source_hashes = {n:sha(ROOT/n) for n in (*SOURCES,'TESTS-01.json')}
    save(out/'BEFORE-HELDOUT.json',{'models':[m[3] for m in models],
        'source_hashes':source_hashes,'priority':priority,'threads':1,
        'heldout_model_inference_started':False})
    started = time.perf_counter()
    train,dev,test = load('training'),load('development'),load('heldout')
    if any(m[3]['train']!=fingerprint(train) or m[3]['dev']!=fingerprint(dev) for m in models):
        raise ValueError('Training/development arrays do not reproduce')
    for left,right in ((train,dev),(train,test),(dev,test)):
        if set(left['blocks'].tolist()) & set(right['blocks'].tolist()):
            raise ValueError('Background block leakage')
    ceilings = restricted_ceilings(test)
    if not all(c['accuracy_max']==.5 and c['each_class_balanced'] for c in ceilings.values()):
        raise ValueError('Declared temporal input ceiling failed')
    tx,tq,_ = inputs(train); dx,dq,_ = inputs(dev)
    archive = {'data__'+k:v for k,v in test.items()}
    probe_archive,probe_coefficients = {},{}
    prior = prior_fit(train)
    prior_prob = prior[np.arange(2)[None,:],test['tasks']]
    archive['prior__probabilities'] = prior_prob
    prior_result = metrics(prior_prob,test['y'],test['tasks'])
    modes = np.array([np.bincount(train['worlds'].reshape(-1,12)[:,i],minlength=4).argmax() for i in range(12)])
    prior_probe_accuracy = float((test['worlds'].reshape(-1,12)==modes).mean())
    results,probes,replays,future_checks = [],[],[],[]
    block_ids = np.unique(test['blocks'])
    block_scores = np.zeros((len(cfg['fit_seeds']),2,len(block_ids)))
    for seed,condition,p,receipt in models:
        prefix = f's{seed}__{condition}'
        first_prob,first_state = None,None
        for variant in VARIANTS:
            x,q,y = inputs(test,variant)
            prob,state = predict(p,x,q,condition,reset=variant=='reset_at_switch')
            archive[prefix+'__'+variant+'__probabilities'] = prob
            archive['targets__'+variant] = y
            result = metrics(prob,y,test['tasks'])
            results.append({'seed':seed,'condition':condition,'variant':variant,**result})
            if variant == 'intact':
                first_prob,first_state = prob,state
                archive[prefix+'__intact__states'] = state
                correct = prob[:,1].argmax(axis=-1)==y[:,1]
                si,ci = cfg['fit_seeds'].index(seed),cfg['conditions'].index(condition)
                block_scores[si,ci] = [correct[test['blocks']==block].mean() for block in block_ids]
            if variant in ('reset_at_switch','erase_current_values'):
                exact = np.array_equal(prob[:,0],first_prob[:,0]) and np.array_equal(state[:,0],first_state[:,0])
                future_checks.append({'seed':seed,'condition':condition,'variant':variant,'exact':exact})
                if not exact:
                    raise ValueError('A future-only perturbation changed the earlier query')
        # Probe selection reads only fitting/development states and coordinate labels.
        train_h = predict(p,tx,tq,condition)[1][:,1]
        dev_h = predict(p,dx,dq,condition)[1][:,1]
        weights,choices = probe_fit(train_h,train,dev_h,dev,cfg['probe_penalties'])
        prediction,measurement = probe_read(weights,first_state[:,1],test)
        probes.append({'seed':seed,'condition':condition,'choices':choices,**measurement})
        probe_archive[prefix+'__predictions'] = prediction
        probe_coefficients[prefix+'__weights'] = weights
        x,q,_ = inputs(test)
        replay_prob,replay_state = predict(p,x,q,condition)
        exact = np.array_equal(replay_prob,first_prob) and np.array_equal(replay_state,first_state)
        replays.append({'seed':seed,'condition':condition,'exact':exact})
        if not exact:
            raise ValueError('Intact deterministic replay changed')
    diffs = block_scores[:,1]-block_scores[:,0]
    paired_blocks = diffs.mean(axis=0)
    rng = np.random.default_rng(cfg['bootstrap_seed'])
    bootstrap = paired_blocks[rng.integers(0,len(block_ids),(cfg['bootstrap_repetitions'],len(block_ids)))].mean(axis=1)
    contrast = {'direction':'multiplicative minus additive',
        'mean':float(paired_blocks.mean()),'paired_seed_differences':diffs.mean(axis=1).tolist(),
        'percentile_interval_95':np.quantile(bootstrap,[.025,.975]).tolist(),
        'background_blocks':len(block_ids),'repetitions':cfg['bootstrap_repetitions'],
        'interpretation':'Descriptive conditional background interval for these three frozen paired models; no population training uncertainty.'}
    archive['block_ids'] = block_ids; archive['block_scores'] = block_scores
    archive['bootstrap_contrasts'] = bootstrap
    np.savez(out/'predictions.npz',**archive)
    np.savez(out/'probes.npz',**probe_archive)
    np.savez(out/'probe-coefficients.npz',**probe_coefficients)
    if any(sha(ROOT/n)!=value for n,value in source_hashes.items()):
        raise ValueError('Evaluation source mutated')
    freeze_check(cfg)
    report = {'complete':True,'data':{name:fingerprint(data) for name,data in
        (('training',train),('development',dev),('heldout',test))},
        'prior':prior_result,'prior_probe_coordinate_accuracy':prior_probe_accuracy,
        'results':results,'probes':probes,'temporal_ceilings':ceilings,
        'paired_contrast':contrast,'intact_replays':replays,'future_causality':future_checks,
        'model_receipts':[m[3] for m in models],'source_hashes':source_hashes,
        'seconds':time.perf_counter()-started,
        'files':{name:{'sha256':sha(out/name),'bytes':(out/name).stat().st_size} for name in
                 ('BEFORE-HELDOUT.json','predictions.npz','probes.npz','probe-coefficients.npz')}}
    save(out/'RESULT.json',report)
    print(json.dumps({'folder':out.name,'complete':True,'seconds':report['seconds'],
        'paired_contrast':contrast,'prior_final_accuracy':prior_result['final_balanced_accuracy'],
        'intact':[{'seed':r['seed'],'condition':r['condition'],'accuracy':r['final_balanced_accuracy']}
                  for r in results if r['variant']=='intact']}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--out',required=True)
    run(parser.parse_args().out)
