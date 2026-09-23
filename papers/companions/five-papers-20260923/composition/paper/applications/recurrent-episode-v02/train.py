"""One small, single-thread, time-bounded fit; never constructs held-out episodes."""
from net import np,initialize,loss_grad,adam_step
from world import make_id,inputs,fingerprint,CONDITIONS,DATA_SEEDS
from support import ROOT,lower_priority,sha,save_json,predict,metrics
import argparse
import json
import platform
import time


def run(args):
    priority=lower_priority()
    config=json.loads((ROOT/'CONFIG.json').read_text(encoding='utf-8'))
    test=json.loads((ROOT/'TESTS-01.json').read_text(encoding='utf-8'))
    if not test['passed'] or any(test['source_hashes'][n]!=sha(ROOT/n)
        for n in ('CONFIG.json','PROTOCOL.md','net.py','world.py','test_recurrent.py')):
        raise ValueError('Pre-fit tests must match the current checked sources.')
    if args.pilot:
        if args.seed!=config['pilot_fit_seed']:
            raise ValueError('Pilot seed does not match the protocol.')
        epochs=config['pilot_epochs']
    else:
        if args.seed not in config['fit_seeds']:
            raise ValueError('Fit seed does not match the protocol.')
        epochs=config['epochs']
    name=('pilot-' if args.pilot else 'fit-')+str(args.seed)+'-'+args.condition
    out=ROOT/name
    out.mkdir(exist_ok=False)
    sources={n:sha(ROOT/n) for n in ('CONFIG.json','PROTOCOL.md','net.py','world.py',
        'support.py','train.py','test_recurrent.py','TESTS-01.json')}
    train=make_id(config,'train')
    dev=make_id(config,'dev')
    tx,tq=inputs(train['worlds'],train['tasks'],train['orders'],args.condition)
    dx,dq=inputs(dev['worlds'],dev['tasks'],dev['orders'],args.condition)
    p=initialize(args.seed,hidden=config['hidden_size'],readout=config['readout_size'])
    np.savez(out/'initial.npz',**p)
    manifest={'condition':args.condition,'seed':args.seed,'pilot':args.pilot,
        'planned_epochs':epochs,'source_hashes':sources,'data_seeds':DATA_SEEDS,
        'train':fingerprint(train),'dev':fingerprint(dev),'priority':priority,
        'numpy_version':np.__version__,'python_version':platform.python_version(),
        'allocated_parameters':sum(v.size for v in p.values()),
        'hidden_state_bytes_per_episode':config['hidden_size']*8,
        'initial_parameters_sha256':sha(out/'initial.npz'),
        'heldout_episodes_generated':False,'threads':1}
    save_json(out/'BEFORE.json',manifest)
    initial=metrics(predict(p,dx,dq)[0],dev['y'],dev['tasks'])
    save_json(out/'INITIAL-DEVELOPMENT.json',initial)
    m={k:np.zeros_like(v) for k,v in p.items()}
    v={k:np.zeros_like(value) for k,value in p.items()}
    rng=np.random.default_rng(args.seed+991)
    updates=0
    examples=0
    best=None
    bestkey=(-1.,float('-inf'))
    selected_epoch=None
    logs=[]
    completed=True
    started=time.perf_counter()
    deadline=started+config['maximum_seconds_per_fit']
    epoch=0
    for epoch in range(1,epochs+1):
        order=rng.permutation(len(tx))
        losses=[]
        norms=[]
        for start in range(0,len(tx),config['batch_size']):
            if time.perf_counter()>deadline:
                completed=False
                break
            indices=order[start:start+config['batch_size']]
            loss,grad=loss_grad(p,tx[indices],tq[indices],train['y'][indices])
            if not np.isfinite(loss) or not all(np.isfinite(g).all() for g in grad.values()):
                raise ArithmeticError('Nonfinite training value; keep this attempt for inspection.')
            updates+=1
            examples+=len(indices)
            norm=adam_step(p,grad,m,v,updates,config['learning_rate'],
                config['gradient_clip'],config['weight_decay'])
            losses.append(loss)
            norms.append(norm)
        if not completed:
            break
        prob,_=predict(p,dx,dq)
        measured=metrics(prob,dev['y'],dev['tasks'])
        key=(measured['balanced_accuracy'],-measured['nll'])
        if key>bestkey:
            bestkey=key
            best={k:value.copy() for k,value in p.items()}
            selected_epoch=epoch
        log={'epoch':epoch,'updates':updates,'examples':examples,
            'train_batch_mean_nll':float(np.mean(losses)),
            'max_gradient_norm':max(norms),'development':measured,
            'selected_so_far':selected_epoch,'elapsed_seconds':time.perf_counter()-started}
        logs.append(log)
        with (out/'epochs.jsonl').open('a',encoding='utf-8') as handle:
            handle.write(json.dumps(log,allow_nan=False)+'\n')
    elapsed=time.perf_counter()-started
    np.savez(out/'final.npz',**p)
    if best is not None:
        np.savez(out/'selected.npz',**best)
    receipt={'complete':completed and len(logs)==epochs,'condition':args.condition,
        'seed':args.seed,'pilot':args.pilot,'planned_epochs':epochs,
        'completed_epochs':len(logs),'selected_epoch':selected_epoch,
        'updates':updates,'training_examples_presented':examples,
        'fit_seconds':elapsed,'seconds_per_complete_epoch':elapsed/max(len(logs),1),
        'initial_development_balanced_accuracy':initial['balanced_accuracy'],
        'selected_development':logs[selected_epoch-1]['development'] if selected_epoch else None,
        'final_development':logs[-1]['development'] if logs else None,
        'source_hashes':sources,'heldout_episodes_generated':False,
        'files':{n:{'sha256':sha(out/n),'bytes':(out/n).stat().st_size}
                 for n in ('BEFORE.json','INITIAL-DEVELOPMENT.json','initial.npz','final.npz')},
        'frozen_for_test':not args.pilot and completed and len(logs)==epochs}
    for n in ('selected.npz','epochs.jsonl'):
        if (out/n).exists():
            receipt['files'][n]={'sha256':sha(out/n),'bytes':(out/n).stat().st_size}
    filename='PILOT.json' if args.pilot else 'FROZEN.json' if receipt['frozen_for_test'] else 'PARTIAL.json'
    save_json(out/filename,receipt)
    if not receipt['complete']:
        np.savez(out/'partial-optimizer.npz',**{'m_'+k:a for k,a in m.items()},
                 **{'v_'+k:a for k,a in v.items()})
        save_json(out/'PARTIAL-STATE.json',{'rng':rng.bit_generator.state,'epoch':epoch,
                                         'updates':updates,'examples':examples})
    print(json.dumps({'folder':name,'complete':receipt['complete'],'epochs':len(logs),
        'seconds':elapsed,'selected_epoch':selected_epoch,
        'development_balanced_accuracy':bestkey[0]}))
    return receipt['complete']


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--seed',type=int,required=True)
    parser.add_argument('--condition',choices=CONDITIONS,required=True)
    parser.add_argument('--pilot',action='store_true')
    if not run(parser.parse_args()):
        raise SystemExit(2)
