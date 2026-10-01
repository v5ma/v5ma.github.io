"""No-fit comparison of two identified public-export observables."""
import csv
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import time

for name in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'NUMEXPR_NUM_THREADS'):
    os.environ[name] = '1'
if os.name == 'nt':
    import ctypes
    ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)
import duckdb
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'application/hue-input-contract-v0'
OUT = BASE / 'response-01'
AGG = ROOT / 'application/hue-recording-readback-v0/results-01/AMPLITUDE-AGGREGATES.json'
COMPILED = ROOT / 'sources/hue-component-intake-03/download/compiled_data.parquet'
LEDS = ('duv', 'uv', 'violet', 'rblue', 'lime', 'orange')


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    started = time.monotonic()
    assert sha(AGG) == '33fa4ab865679284992d2a3cb5b8bd66cb2616f8ef0092d0adf4f138ce90c098'
    ir = json.loads((BASE / 'results-01/INPUT-CONTRACT.json').read_text(encoding='utf-8'))
    cr = json.loads((BASE / 'checks-01/CHECKS.json').read_text(encoding='utf-8'))
    assert cr['passed'] and cr['result_sha256'] == sha(BASE / 'results-01/INPUT-CONTRACT.json')
    assert sha(BASE / 'results-01/INPUT-CONTRACT-ARRAYS.npz') == ir['arrays_sha256']
    a = np.load(BASE / 'results-01/INPUT-CONTRACT-ARRAYS.npz', allow_pickle=False)
    aggregates = [r for r in json.loads(AGG.read_text(encoding='utf-8')) if r['policy'] == 'all_complete_windows']
    keyed = {(r['cell_type'], *(r[k] for k in LEDS)): r for r in aggregates}
    assert len(keyed) == len(aggregates) == len(a['contrasts']) == 4137
    ordered = [keyed[(str(label), *c)] for label, c in zip(a['cell_types'], a['contrasts'])]
    candidates = a['govardoskii__conditional_minimum_integer_grid_log_coordinate']
    OUT.mkdir(parents=True, exist_ok=False)
    con = duckdb.connect(':memory:', config={'threads': '1', 'memory_limit': '64MB',
            'temp_directory': str(OUT / 'scratch'), 'autoinstall_known_extensions': 'false', 'autoload_known_extensions': 'false'})
    compiled = con.execute('SELECT rh3,rh4,rh5,rh6,cell_type,r,counts FROM read_parquet(?)', [str(COMPILED)]).fetchall()
    con.close()
    assert np.array_equal(np.array([r[:4] for r in compiled]), a['compiled_x'])
    assert np.array_equal(np.array([r[4] for r in compiled]), a['compiled_cell_types'])
    rows = []
    for ordinal, (r3, r4, r5, r6, label, response, count) in enumerate(compiled):
        target = np.array([r3, r4, r5, r6])
        ids = np.flatnonzero((a['cell_types'] == label) & (np.abs(candidates-target).max(axis=1) <= 1e-6))
        row = {'compiled_row_ordinal': ordinal, 'cell_type': label, 'compiled_response': response,
               'compiled_count': count, 'candidate_led_group_count': len(ids),
               'candidate_led_group_ordinals': json.dumps(ids.tolist()),
               'comparison': 'unavailable_same_type', 'derived_response': None,
               'complete_window_count': None, 'response_abs_difference': None,
               'amplitude_agrees': None, 'count_agrees': None,
               'candidate_mean_min': None, 'candidate_mean_max': None}
        if len(ids):
            groups = [ordered[int(i)] for i in ids]
            n = sum(g['contributing_rows'] for g in groups)
            value = sum(g['sum_amplitude'] for g in groups)/n
            difference = abs(value-response)
            row.update({'comparison': 'one_led_group' if len(ids) == 1 else 'conditional_pooled_led_groups',
                        'derived_response': value, 'complete_window_count': n,
                        'response_abs_difference': difference,
                        'amplitude_agrees': difference <= 1e-10 + 1e-10*abs(response),
                        'count_agrees': n == count,
                        'candidate_mean_min': min(g['mean_amplitude'] for g in groups),
                        'candidate_mean_max': max(g['mean_amplitude'] for g in groups)})
        rows.append(row)
    with (OUT / 'ROW-COMPARISONS.csv').open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    groups = []
    for label in sorted(set(r['cell_type'] for r in rows)):
        subset = [r for r in rows if r['cell_type'] == label]
        observed = [r for r in subset if r['derived_response'] is not None]
        groups.append({'cell_type': label, 'compiled_rows': len(subset), 'comparable_rows': len(observed),
                       'single_led_group_rows': sum(r['candidate_led_group_count'] == 1 for r in subset),
                       'multiple_led_group_rows': sum(r['candidate_led_group_count'] > 1 for r in subset),
                       'amplitude_agreement_rows': sum(r['amplitude_agrees'] is True for r in subset),
                       'count_agreement_rows': sum(r['count_agrees'] is True for r in subset),
                       'maximum_amplitude_abs_difference': max((r['response_abs_difference'] for r in observed), default=None)})
    report = {'created_utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'plan_sha256': sha(BASE / 'RESPONSE-BRIDGE-PLAN.md'),
              'tool_sha256': sha(Path(__file__)), 'aggregate_sha256': sha(AGG),
              'compiled_sha256': sha(COMPILED), 'input_contract_sha256': sha(BASE / 'results-01/INPUT-CONTRACT.json'),
              'input_checks_sha256': sha(BASE / 'checks-01/CHECKS.json'),
              'row_comparisons_sha256': sha(OUT / 'ROW-COMPARISONS.csv'),
              'groups': groups, 'compiled_rows': len(rows),
              'comparable_rows': sum(g['comparable_rows'] for g in groups),
              'amplitude_agreement_rows': sum(g['amplitude_agreement_rows'] for g in groups),
              'count_agreement_rows': sum(g['count_agreement_rows'] for g in groups),
              'multiple_led_group_rows': sum(g['multiple_led_group_rows'] for g in groups),
              'calibration_parameters_fitted': 0, 'animal_ids_recovered': False,
              'noise_variance_inferred_from_intervals': False, 'threads': 1,
              'elapsed_seconds': round(time.monotonic()-started, 4)}
    (OUT / 'RESPONSE-BRIDGE.json').write_text(json.dumps(report, indent=2, allow_nan=False)+'\n', encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
