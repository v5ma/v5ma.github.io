"""One fixed-budget fit. No held-out inference or dataset selection."""
from net import np, initialize, loss_grad, adam_step, CONDITIONS
from world import config, load, inputs, fingerprint
from support import ROOT, SOURCES, lower_priority, sha, save, predict, metrics
import argparse
import json
import platform
import time


def run(seed, condition):
    priority = lower_priority()
    cfg = config()
    if seed not in cfg['fit_seeds'] or condition not in cfg['conditions']:
        raise ValueError('Unplanned fit')
    tests = json.loads((ROOT/'TESTS-01.json').read_text(encoding='utf-8'))
    if not tests['passed'] or any(tests['source_hashes'][n] != sha(ROOT/n) for n in SOURCES):
        raise ValueError('Tests must pass against these exact study sources')
    out = ROOT/f'fit-{seed}-{condition}'
    out.mkdir(exist_ok=False)
    sources = {n:sha(ROOT/n) for n in (*SOURCES,'TESTS-01.json')}
    train, dev = load('training'), load('development')
    tx,tq,ty = inputs(train)
    dx,dq,dy = inputs(dev)
    p = initialize(seed,cfg['hidden_size'],cfg['readout_size'])
    np.savez(out/'initial.npz',**p)
    save(out/'BEFORE.json',{
        'seed':seed,'condition':condition,'source_hashes':sources,
        'train':fingerprint(train),'dev':fingerprint(dev),
        'priority':priority,'threads':1,'numpy':np.__version__,
        'python':platform.python_version(),'active_parameters':sum(v.size for v in p.values()),
        'initial_sha256':sha(out/'initial.npz'),'heldout_model_inference':False,
        'benchmark_integrity_note':'Entire fixed CSV hash checked; only train/dev arrays constructed here.'})
    initial = metrics(predict(p,dx,dq,condition)[0],dy,dev['tasks'])
    save(out/'INITIAL-DEVELOPMENT.json',initial)
    m = {k:np.zeros_like(v) for k,v in p.items()}
    v = {k:np.zeros_like(a) for k,a in p.items()}
    rng = np.random.default_rng(seed+991)
    updates, examples, logs = 0,0,[]
    best, bestkey, selected_epoch = None,(-1.,float('-inf')),None
    started = time.perf_counter()
    deadline = started+cfg['maximum_seconds_per_fit']
    completed = True
    for epoch in range(1,cfg['epochs']+1):
        order = rng.permutation(len(tx))
        losses,norms = [],[]
        for start in range(0,len(tx),cfg['batch_size']):
            if time.perf_counter() >= deadline:
                completed = False
                break
            idx = order[start:start+cfg['batch_size']]
            loss,grad = loss_grad(p,tx[idx],tq[idx],ty[idx],condition)
            if not np.isfinite(loss) or not all(np.isfinite(g).all() for g in grad.values()):
                raise ArithmeticError('Nonfinite fit; retain this failed attempt')
            updates += 1
            examples += len(idx)
            norms.append(adam_step(p,grad,m,v,updates,cfg['learning_rate'],cfg['gradient_clip'],cfg['weight_decay']))
            losses.append(loss)
        if not completed:
            break
        measured = metrics(predict(p,dx,dq,condition)[0],dy,dev['tasks'])
        key = (measured['final_balanced_accuracy'],-measured['final_nll'])
        if key > bestkey:
            bestkey,selected_epoch = key,epoch
            best = {k:value.copy() for k,value in p.items()}
        log = {'epoch':epoch,'updates':updates,'examples':examples,
            'mean_train_batch_nll':float(np.mean(losses)),
            'max_gradient_norm':float(max(norms)),'development':measured,
            'selected_so_far':selected_epoch,'elapsed_seconds':time.perf_counter()-started}
        logs.append(log)
        with (out/'epochs.jsonl').open('a',encoding='utf-8') as handle:
            handle.write(json.dumps(log,allow_nan=False)+'\n')
        if time.perf_counter() >= deadline:
            completed = False
            break
    elapsed = time.perf_counter()-started
    np.savez(out/'final.npz',**p)
    if best is not None:
        np.savez(out/'selected.npz',**best)
    complete = completed and len(logs)==cfg['epochs']
    receipt = {'complete':complete,'frozen_for_test':complete,'seed':seed,'condition':condition,
        'completed_epochs':len(logs),'selected_epoch':selected_epoch,'updates':updates,
        'training_episode_presentations':examples,'fit_seconds':elapsed,
        'selected_development':logs[selected_epoch-1]['development'] if selected_epoch else None,
        'source_hashes':sources,'heldout_model_inference':False,
        'files':{n:{'sha256':sha(out/n),'bytes':(out/n).stat().st_size} for n in
                 ('BEFORE.json','INITIAL-DEVELOPMENT.json','initial.npz','final.npz','selected.npz','epochs.jsonl')
                 if (out/n).is_file()}}
    save(out/('FROZEN.json' if complete else 'PARTIAL.json'),receipt)
    if not complete:
        np.savez(out/'partial-optimizer.npz',**{'m_'+k:a for k,a in m.items()},**{'v_'+k:a for k,a in v.items()})
        save(out/'PARTIAL-STATE.json',{'rng':rng.bit_generator.state,'epoch':epoch,'updates':updates})
    print(json.dumps({'folder':out.name,'complete':complete,'epochs':len(logs),
        'seconds':elapsed,'selected_epoch':selected_epoch,'development_final_accuracy':bestkey[0]}))
    return complete


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--seed',type=int,required=True)
    parser.add_argument('--condition',choices=CONDITIONS,required=True)
    args = parser.parse_args()
    if not run(args.seed,args.condition):
        raise SystemExit(2)
