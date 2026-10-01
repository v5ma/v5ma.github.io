"""Scalar/bisect check of every response join, including unavailable rows."""
import bisect
import csv
import datetime as dt
import hashlib
import json
import math
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
OUT = BASE / 'response-checks-01'


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def close(x, y):
    if not math.isclose(float(x), float(y), rel_tol=0, abs_tol=1e-12):
        raise AssertionError('value mismatch')


def verify_row(row, reference, source, source_values, ids):
    expected_ids = sorted(ids)
    if sorted(json.loads(row['candidate_led_group_ordinals'])) != expected_ids:
        raise AssertionError('candidate identity mismatch')
    if int(row['candidate_led_group_count']) != len(ids):
        raise AssertionError('candidate count mismatch')
    if row['cell_type'] != source[4]:
        raise AssertionError('source type mismatch')
    close(row['compiled_response'], source[5])
    close(row['compiled_count'], source[6])
    if not ids:
        if row['comparison'] != 'unavailable_same_type' or row['derived_response'] != '':
            raise AssertionError('fabricated unavailable response')
        return None
    groups = [source_values[i] for i in ids]
    n = sum(g['contributing_rows'] for g in groups)
    response = math.fsum(g['sum_amplitude'] for g in groups)/n
    difference = abs(response-source[5])
    if row['comparison'] != ('one_led_group' if len(ids) == 1 else 'conditional_pooled_led_groups'):
        raise AssertionError('pooling label mismatch')
    close(row['derived_response'], response)
    close(row['response_abs_difference'], difference)
    close(row['candidate_mean_min'], min(g['mean_amplitude'] for g in groups))
    close(row['candidate_mean_max'], max(g['mean_amplitude'] for g in groups))
    if int(row['complete_window_count']) != n:
        raise AssertionError('observation count mismatch')
    if (row['amplitude_agrees'] == 'True') != (difference <= 1e-10+1e-10*abs(source[5])):
        raise AssertionError('amplitude status mismatch')
    if (row['count_agrees'] == 'True') != (n == source[6]):
        raise AssertionError('count status mismatch')
    return (difference, n-source[6], response-source[5])


def main():
    started = time.monotonic()
    report_path = BASE / 'response-01/RESPONSE-BRIDGE.json'
    report = json.loads(report_path.read_text(encoding='utf-8'))
    csv_path = BASE / 'response-01/ROW-COMPARISONS.csv'
    assert sha(csv_path) == report['row_comparisons_sha256']
    agg_path = ROOT / 'application/hue-recording-readback-v0/results-01/AMPLITUDE-AGGREGATES.json'
    assert sha(agg_path) == report['aggregate_sha256']
    compiled_path = ROOT / 'sources/hue-component-intake-03/download/compiled_data.parquet'
    assert sha(compiled_path) == report['compiled_sha256']
    assert sha(BASE / 'RESPONSE-BRIDGE-PLAN.md') == report['plan_sha256']
    with csv_path.open(encoding='utf-8', newline='') as handle:
        rows = list(csv.DictReader(handle))
    arr = np.load(BASE / 'results-01/INPUT-CONTRACT-ARRAYS.npz', allow_pickle=False)
    agg = json.loads(agg_path.read_text(encoding='utf-8'))
    names = ('duv','uv','violet','rblue','lime','orange')
    values = {(r['cell_type'], *(r[k] for k in names)): r for r in agg if r['policy'] == 'all_complete_windows'}
    ordered = [values[(str(label), *c)] for label, c in zip(arr['cell_types'], arr['contrasts'])]
    points = arr['govardoskii__conditional_minimum_integer_grid_log_coordinate'].tolist()
    by_type = {}
    for i, label in enumerate(arr['cell_types']):
        by_type.setdefault(str(label), []).append((points[i][0], i))
    for label in by_type:
        by_type[label].sort()
    # No full pairwise file or point search: first-coordinate sorted range, then exact four-axis test.
    con = duckdb.connect(':memory:', config={'threads':'1','memory_limit':'64MB',
            'autoinstall_known_extensions':'false','autoload_known_extensions':'false'})
    source = con.execute('SELECT rh3,rh4,rh5,rh6,cell_type,r,counts FROM read_parquet(?)', [str(compiled_path)]).fetchall()
    con.close()
    assert len(rows) == len(source) == 6205
    details = []
    fixture = None
    for ordinal, (row, src) in enumerate(zip(rows, source)):
        assert int(row['compiled_row_ordinal']) == ordinal
        candidates = by_type.get(src[4], [])
        start = bisect.bisect_left(candidates, (src[0]-1e-6, -1))
        end = bisect.bisect_right(candidates, (src[0]+1e-6, len(points)))
        ids = [i for _, i in candidates[start:end] if all(abs(points[i][j]-src[j]) <= 1e-6 for j in range(4))]
        detail = verify_row(row, report, src, ordered, ids)
        if detail is not None:
            details.append((row, detail))
            fixture = (row, src, ids)
    assert len(details) == report['comparable_rows'] == 3961
    agree = sum(r['amplitude_agrees'] == 'True' for r, _ in details)
    count_agree = sum(r['count_agrees'] == 'True' for r, _ in details)
    assert agree == report['amplitude_agreement_rows'] == 2167
    assert count_agree == report['count_agreement_rows'] == 2167
    subsets_identical = all((r['amplitude_agrees'] == 'True') == (r['count_agrees'] == 'True') for r, _ in details)
    mutations = []
    original, src, ids = fixture
    for name, key, value in (
        ('amplitude change', 'derived_response', str(float(original['derived_response'])+0.01)),
        ('count change', 'complete_window_count', str(int(original['complete_window_count'])+1)),
        ('invented type', 'cell_type', 'invented_type'),
        ('erased candidate identity', 'candidate_led_group_ordinals', '[]'),
        ('false agreement', 'amplitude_agrees', 'False' if original['amplitude_agrees']=='True' else 'True'),
    ):
        changed = dict(original)
        changed[key] = value
        try:
            verify_row(changed, report, src, ordered, ids)
        except AssertionError:
            mutations.append({'case': name, 'rejected': True})
        else:
            raise AssertionError('Corruption accepted: '+name)
    OUT.mkdir(parents=True, exist_ok=False)
    result = {'created_utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'passed': True,
              'report_sha256': sha(report_path), 'row_comparisons_sha256': sha(csv_path),
              'checker_sha256': sha(Path(__file__)), 'source_rows_checked': len(rows),
              'comparable_rows_checked': len(details), 'amplitude_agreement_rows': agree,
              'amplitude_disagreement_rows': len(details)-agree,
              'amplitude_and_count_agreement_select_identical_rows': subsets_identical,
              'derived_count_greater_than_compiled': sum(d[1] > 0 for _, d in details),
              'derived_count_less_than_compiled': sum(d[1] < 0 for _, d in details),
              'largest_abs_amplitude_difference': max(d[0] for _, d in details),
              'largest_agreeing_abs_amplitude_difference': max(d[0] for r, d in details if r['amplitude_agrees']=='True'),
              'corruptions': mutations, 'same_agent_separate_implementation': True,
              'independent_human_review': False, 'threads': 1, 'elapsed_seconds': round(time.monotonic()-started,4)}
    (OUT / 'CHECKS.json').write_text(json.dumps(result, indent=2, allow_nan=False)+'\n', encoding='utf-8')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
