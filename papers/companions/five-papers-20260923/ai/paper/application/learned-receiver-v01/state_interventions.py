"""Reconstruct exact retained states from fixed event receipts; no new fits."""
from pathlib import Path
import json
import sys

sys.dont_write_bytecode = True
import experiment as e
import numpy as np

ROOT = Path(__file__).resolve().parent


def main():
    out = ROOT/'state-interventions'
    if out.exists():
        raise FileExistsError(out)
    fit = json.loads((ROOT/'development/FITTED.json').read_text(encoding='utf-8'))
    pre = np.asarray(fit['pretrained_receiver'])
    checks, records = {}, []
    for family, seeds in ((0, range(1000, 1004)), (1, range(2000, 2004))):
        for seed in seeds:
            data = e.setup(seed, family, pre)
            for arm in e.ARMS:
                rows = json.loads((ROOT/'evaluation'/f'events-{seed}-{arm}.json').read_text(encoding='utf-8'))
                w, before_last, history = data['w'].copy(), data['w'].copy(), []
                for event, row in zip(data['stream'], rows):
                    e.guard()
                    assert e.arrhash(w) == row['pre_hash']
                    x, y = event['x'], event['y']
                    c = e.pack_history(history, 4)
                    if row['accepted']:
                        g = e.gradient(w, x, c, y)
                        if arm in ('agem', 'replay'):
                            ref = e.gradient(w, data['a'][0], np.zeros((16, e.C)), data['a'][1])
                            g = e.project(g, ref) if arm == 'agem' else .5*(g+ref)
                        before_last = w.copy()
                        w = e.step(w, g)
                    assert e.arrhash(w) == row['post_hash']
                    history.append((x.copy(), y)); history = history[-16:]
                prefix = f'{seed}/{arm}'
                checks[prefix+'/all_state_hashes_reconstructed'] = True
                final = w.copy()
                effects = {}
                for name, (x, y) in data['probes'].items():
                    zero = np.zeros((len(x), e.C))
                    carried = np.tile(e.pack_history(history, 4), (len(x), 1))
                    final_predictions, _ = e.forward(w, x, zero)
                    transient_predictions, _ = e.forward(w, x, carried)
                    removed = before_last.copy()
                    restored = final.copy()
                    rescued_predictions, _ = e.forward(restored, x, zero)
                    checks[prefix+'/'+name+'/exact_prediction_rescue'] = np.array_equal(final_predictions, rescued_predictions)
                    effects[name] = {
                        'initial_zero_history_mse': e.loss(data['w'], x, y),
                        'final_zero_history_mse': e.loss(final, x, y),
                        'last_write_removed_zero_history_mse': e.loss(removed, x, y),
                        'restored_zero_history_mse': e.loss(restored, x, y),
                        'final_carried_history_mse': e.loss(final, x, y, carried),
                        'history_only_prediction_rms': float(np.sqrt(np.mean((final_predictions[:, -1]-transient_predictions[:, -1])**2)))}
                e.write(out/f'state-{seed}-{arm}.json', {'initial': data['w'].tolist(), 'final': final.tolist(),
                        'before_last_accepted': before_last.tolist(), 'final_hash': e.arrhash(final),
                        'history_input': e.pack_history(history, 4).tolist(), 'parameters': e.N})
                records.append({'seed': seed, 'family': family, 'arm': arm, 'effects': effects})
    receipt = {'scope': 'Post-result state-location verification, not a new independent performance test',
               'all_pass': all(checks.values()), 'passed': sum(checks.values()), 'total': len(checks),
               'checks': checks, 'records': records, 'script_sha256': e.sha(Path(__file__)),
               'experiment_sha256': e.sha(ROOT/'experiment.py')}
    e.write(out/'RESULT.json', receipt)
    print(json.dumps({'passed': receipt['passed'], 'total': receipt['total'], 'all_pass': receipt['all_pass']}))
    if not receipt['all_pass']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
