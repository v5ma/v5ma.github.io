"""Independent fixed-ledger accounting. Does not refit or call producer metrics."""
from pathlib import Path
import copy
import hashlib
import json
import math
import statistics

ROOT = Path(__file__).resolve().parent
ARMS = ('trajectory', 'history', 'permuted', 'scalar', 'always', 'replay', 'agem', 'frozen')
SEEDS = (*range(1000, 1004), *range(2000, 2004))


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ledger_failures(rows, initial):
    failed, version, prior = [], 0, initial
    for row in rows:
        if abs(row['error'] - (row['pre_feedback_prediction'] - row['y'])**2) > 1e-12:
            failed.append('error')
        if row['pre_hash'] != prior:
            failed.append('parameter chain')
        version += int(row['accepted'])
        if row['version'] != version:
            failed.append('version')
        if not row['accepted'] and row['pre_hash'] != row['post_hash']:
            failed.append('rejection changed parameters')
        if row['accepted']:
            tx = row['transaction']
            if not (row['proposed'] and tx['new_new'] < tx['old_new']-1e-10
                    and tx['new_anchor'] <= tx['old_anchor']+.0002+1e-12
                    and tx['step_norm'] <= .04+1e-12):
                failed.append('acceptance')
        prior = row['post_hash']
    return failed


def main():
    result = read(ROOT/'evaluation/RESULT.json')
    dev = read(ROOT/'development/FITTED.json')
    seal = read(ROOT/'development/SEAL.json')
    freeze = read(ROOT/'RUN-FREEZE.json')
    checks, ledgers = {}, {}
    checks['sealed_development_identity'] = sha(ROOT/'development/FITTED.json') == seal['fitted_sha256']
    checks['producer_identity'] = sha(ROOT/'experiment.py') == seal['source_hashes']['experiment']
    checks['protocol_identity'] = sha(ROOT/'PROTOCOL.md') == seal['source_hashes']['protocol']
    checks['mathematics_identity'] = sha(ROOT/'MATHEMATICAL-BOUNDARY.md') == seal['source_hashes']['math']
    checks['all_partitions_disjoint'] = len(set(freeze['dev_seeds']+freeze['validation_seeds']+list(SEEDS))) == 24
    checks['fitted_before_final_result'] = (ROOT/'development/SEAL.json').stat().st_mtime_ns < (ROOT/'evaluation/RESULT.json').stat().st_mtime_ns
    checks['result_replays_exactly'] = sha(ROOT/'evaluation/RESULT.json') == sha(ROOT/'replay/RESULT.json')
    bytes_total = sum((ROOT/'evaluation'/f'events-{s}-{a}.json').stat().st_size for s in SEEDS for a in ARMS)
    extra = []
    for seed in SEEDS:
        rows_by_arm = {}
        for arm in ARMS:
            name = f'events-{seed}-{arm}.json'
            rows = read(ROOT/'evaluation'/name)
            summary = next(s for s in result['summaries'] if s['seed'] == seed and s['arm'] == arm)
            rows_by_arm[arm] = rows
            ledgers[(seed, arm)] = rows
            prefix = f'{seed}/{arm}'
            checks[prefix+'/events'] = len(rows) == 220
            checks[prefix+'/chain_and_acceptance'] = not ledger_failures(rows, summary['initial_hash'])
            checks[prefix+'/mse'] = abs(statistics.mean(r['error'] for r in rows)-summary['mse']) < 1e-12
            checks[prefix+'/writes'] = sum(r['accepted'] for r in rows) == summary['writes']
            checks[prefix+'/cap'] = max(r['protected_loss'] for r in rows) <= summary['protected_initial']+.02+1e-12
            checks[prefix+'/replay'] = sha(ROOT/'evaluation'/name) == sha(ROOT/'replay'/name)
            zero_improvement = {k: summary['probes_initial_zero_history'][k]-v for k, v in summary['probes_final_zero_history'].items()}
            last_effect = {k: summary['probes_last_write_removed_zero_history'][k]-v for k, v in summary['probes_final_zero_history'].items()}
            extra.append({'seed': seed, 'arm': arm, 'family': summary['family'],
                          'zero_context_retained_improvement': zero_improvement,
                          'last_write_effect_positive_is_improvement': last_effect,
                          'reactivation_fraction': statistics.mean(r['reactivation'] for r in rows),
                          'mean_abs_initial_residual': statistics.mean(abs(r['residual_initial']) for r in rows),
                          'mean_abs_final_residual': statistics.mean(abs(r['residual_final']) for r in rows)})
        reference = [(r['event'], r['x'], r['y']) for r in rows_by_arm['frozen']]
        checks[f'{seed}/same_observed_stream'] = all(reference == [(r['event'], r['x'], r['y']) for r in rows] for rows in rows_by_arm.values())
        checks[f'{seed}/same_initial_receiver'] = len({s['initial_hash'] for s in result['summaries'] if s['seed'] == seed}) == 1
        checks[f'{seed}/scalar_frozen_prediction_identity'] = all(x['pre_feedback_prediction'] == y['pre_feedback_prediction'] for x, y in zip(rows_by_arm['scalar'], rows_by_arm['frozen']))
    altered = copy.deepcopy(ledgers[(1000, 'always')])
    altered[0]['error'] += 1
    checks['mutation_wrong_error_detected'] = 'error' in ledger_failures(altered, altered[0]['pre_hash'])
    altered = copy.deepcopy(ledgers[(1000, 'frozen')])
    altered[0]['post_hash'] = 'incorrect'
    checks['mutation_hidden_rejected_write_detected'] = 'rejection changed parameters' in ledger_failures(altered, altered[0]['pre_hash'])
    table = {}
    for family in (0, 1):
        table[str(family)] = {}
        for arm in ARMS:
            rows = [s for s in result['summaries'] if s['family'] == family and s['arm'] == arm]
            differences = {}
            for rival in ('history', 'always', 'replay', 'agem'):
                ds = [s['mse']-next(r['mse'] for r in result['summaries'] if r['seed'] == s['seed'] and r['arm'] == rival) for s in rows]
                differences[rival] = {'mean': statistics.mean(ds), 'seed_range': [min(ds), max(ds)],
                                      'lower_mse_count': sum(d < 0 for d in ds), 'n': len(ds)}
            table[str(family)][arm] = {'mean_mse': statistics.mean(s['mse'] for s in rows),
                                      'seed_mse_sd': statistics.stdev(s['mse'] for s in rows),
                                      'paired': differences}
    receipt = {'scope': 'Independent accounting of 64 fixed final event ledgers; not independent scientific replication',
               'checks': checks, 'passed': sum(checks.values()), 'total': len(checks), 'all_pass': all(checks.values()),
               'event_files': 64, 'event_count': 14080, 'event_bytes_per_replay': bytes_total,
               'paired_results': table, 'retained_and_trace_diagnostics': extra,
               'audit_sha256': sha(Path(__file__)), 'result_sha256': sha(ROOT/'evaluation/RESULT.json')}
    path = ROOT/'AUDIT.json'
    if path.exists():
        raise FileExistsError(path)
    path.write_text(json.dumps(receipt, indent=2, sort_keys=True, allow_nan=False)+'\n', encoding='utf-8')
    print(json.dumps({'passed': receipt['passed'], 'total': receipt['total'], 'all_pass': receipt['all_pass'],
                      'event_bytes_per_replay': bytes_total, 'failures': [k for k, v in checks.items() if not v]}, indent=2))
    if not receipt['all_pass']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
