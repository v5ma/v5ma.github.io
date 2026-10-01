"""Separate source/array arithmetic check; imports no builder or author project."""
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
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'application/hue-input-contract-v0'
OUT = BASE / 'checks-01'
RESULT = BASE / 'results-01/INPUT-CONTRACT.json'
ARRAYS = BASE / 'results-01/INPUT-CONTRACT-ARRAYS.npz'
SENS = ROOT / 'sources/hue-sensitivity-intake-37'
OPSINS = ('rh3', 'rh4', 'rh5', 'rh6')


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1048576), b''):
            h.update(chunk)
    return h.hexdigest()


def csv_grid(name, fields):
    with (SENS / name).open(encoding='utf-8', newline='') as handle:
        rows = list(csv.DictReader(handle))
    by_wavelength = {float(row['wls']): row for row in rows}
    assert len(by_wavelength) == len(rows) == 400
    return [[max(0.0, float(by_wavelength[float(w)][field])) for field in fields]
            for w in range(300, 700)]


def integrate(values):
    return math.fsum((values[i] + values[i+1]) * 0.5 for i in range(399))


def distances(candidates, targets):
    # Alternative broadcasting implementation, deduplicated by exact tuples.
    unique = np.array(sorted(set(map(tuple, candidates.tolist()))))
    queries = sorted(set(map(tuple, targets.tolist())))
    if len(unique) * len(queries) > 8000000:
        raise ValueError('Independent numeric comparison cap exceeded')
    lookup = {}
    for start in range(0, len(queries), 32):
        block = np.array(queries[start:start+32])
        delta = np.abs(block[:, None, :] - unique[None, :, :]).max(axis=2)
        minima = delta.min(axis=1)
        multiplicity = (delta <= 1e-6).sum(axis=1)
        for q, d, m in zip(queries[start:start+32], minima, multiplicity):
            lookup[q] = (float(d), int(m))
    return np.array([lookup[tuple(q)][0] for q in targets]), np.array([lookup[tuple(q)][1] for q in targets])


def assert_close(a, b, atol=2e-12):
    if not np.allclose(a, b, rtol=0, atol=atol, equal_nan=True):
        raise AssertionError('Numerical mismatch')


def assert_neighbor(candidates, targets, indices, minima, candidate_types=None, target_types=None):
    if np.any(indices < 0) or np.any(indices >= len(candidates)):
        raise AssertionError('Index outside candidate set')
    if candidate_types is not None and np.any(candidate_types[indices] != target_types):
        raise AssertionError('Cell-type mismatch')
    actual = np.max(np.abs(candidates[indices] - targets), axis=1)
    assert_close(actual, minima)


def main():
    began = time.monotonic()
    r = json.loads(RESULT.read_text(encoding='utf-8'))
    a = np.load(ARRAYS, allow_pickle=False)
    checks = []
    def check(name, condition):
        if not bool(condition):
            raise AssertionError(name)
        checks.append(name)
    check('array identity', sha(ARRAYS) == r['arrays_sha256'])
    check('plan identity', sha(BASE / 'PLAN.md') == r['plan_sha256'])
    for path, digest in r['source_hashes'].items():
        check('source ' + path, sha(ROOT / path) == digest)
    for row in r['sensitivity_schemas']:
        check('sensitivity ' + row['file'], sha(SENS / row['file']) == row['sha256'])
    check('declared four cases / two domains', len(r['cases']) == 8)
    check('no fitting or response use', r['fit_parameters_optimized'] == 0 and r['response_values_used'] is False)

    spectra = json.loads((ROOT / 'sources/hue-transform-route-intake-36/flux_normalized_led_spectra.json').read_text(encoding='utf-8'))
    # Every requested integer wavelength occurs exactly in the saved 0.5 nm grid.
    wl = {float(w): row for w, row in zip(spectra['index'], spectra['data'])}
    led = [[float(x) for x in wl[float(w)]] for w in range(300, 700)]
    normalization = [integrate([row[i] for row in led]) for i in range(6)]
    led = [[v / normalization[i] for i, v in enumerate(row)] for row in led]
    assert_close(led, a['led_spectra'])
    checks.append('all normalized spectral samples checked by scalar quadrature')
    sense_standard = [csv_grid(op + '_morning.csv', [op]) for op in OPSINS]
    senses = {'standard': [[sense_standard[i][w][0] for i in range(4)] for w in range(400)],
              'govardoskii': csv_grid('govardoskii_morning.csv', list(OPSINS))}
    conditional = []
    for i, row in enumerate(r['integer_grid_candidates']):
        values = sorted(set(a['contrasts'][:, i].tolist()))
        compatible = []
        for bg in range(1, 1001):
            if all(abs((v+1)*bg - round((v+1)*bg)) <= 1e-7 for v in values):
                compatible.append(bg)
        check('complete integer candidate list ' + row['led'], compatible == row['compatible_backgrounds_nE'])
        conditional.append(compatible[0])
    check('conditional minimum sum', sum(conditional) == r['conditional_minimum_background_sum_nE'] == 1000)
    backgrounds = {'published_rounded': [10, 60, 100, 250, 330, 250],
                   'conditional_minimum_integer_grid': conditional}
    fresh = {}
    max_capture_difference = 0.0
    for label, s in senses.items():
        overlap = [[integrate([led[k][i]*s[k][j] for k in range(400)]) for j in range(4)] for i in range(6)]
        assert_close(overlap, a[label + '_overlaps'])
        checks.append('spectral overlaps ' + label)
        for bgname, bg in backgrounds.items():
            name = label + '__' + bgname
            den = [math.fsum(bg[i]*overlap[i][j] for i in range(6)) for j in range(4)]
            transfer = [[bg[i]*overlap[i][j]/den[j] for j in range(4)] for i in range(6)]
            q = np.array([[math.fsum((c[i]+1)*transfer[i][j] for i in range(6)) for j in range(4)] for c in a['contrasts']])
            x = np.array([[math.log((v+0.001)/1.001) for v in row] for row in q])
            assert_close(transfer, a[name + '_transfer'])
            assert_close(q, a[name + '_capture'])
            assert_close(x, a[name + '_log_coordinate'])
            check('unit background response ' + name, all(abs(math.fsum(row[j] for row in transfer)-1) < 2e-14 for j in range(4)))
            max_capture_difference = max(max_capture_difference, float(np.max(np.abs(q-a[name+'_capture']))))
            fresh[name] = (q, x)
    multiplicities = []
    max_matched_source_distance = 0.0
    total_global_rows = 0
    total_same_type_rows = 0
    matched_test_fixture = None
    for row in r['cases']:
        name = row['case']
        if row['domain'] == 'signed_log':
            c = fresh[name][1]
            t = a['compiled_x']
        else:
            c = fresh[name][0]
            t = np.array([[math.exp(v)*1.001-0.001 for v in rr] for rr in a['compiled_x']])
        prefix = name + '__' + row['domain']
        d, mult = distances(c, t)
        assert_close(d, a[prefix + '_global_distance'])
        assert_neighbor(c, t, a[prefix + '_global_neighbor'], d)
        check('global matches ' + prefix, int(np.sum(d <= 1e-6)) == row['global_matches_at_1e_minus_6'])
        total_global_rows += len(d)
        same = np.full(len(t), np.nan)
        same_mult = np.zeros(len(t), dtype=int)
        for bytype in row['by_type']:
            label = bytype['cell_type']
            ci = np.flatnonzero(a['compiled_cell_types'] == label)
            li = np.flatnonzero(a['cell_types'] == label)
            check('type counts ' + prefix + '/' + label, len(ci) == bytype['compiled_rows'] and len(li) == bytype['candidate_led_rows'])
            if len(li):
                dd, mm = distances(c[li], t[ci])
                same[ci] = dd
                same_mult[ci] = mm
                assert_neighbor(c, t[ci], a[prefix + '_same_type_neighbor'][ci], dd,
                                a['cell_types'], a['compiled_cell_types'][ci])
                check('type matches ' + prefix + '/' + label, int(np.sum(dd <= 1e-6)) == bytype['matches_at_1e_minus_6'])
                total_same_type_rows += len(ci)
                if name == 'govardoskii__conditional_minimum_integer_grid' and row['domain'] == 'signed_log':
                    max_matched_source_distance = max(max_matched_source_distance, float(np.max(dd)))
                    matched_test_fixture = (c, t[ci], a[prefix + '_same_type_neighbor'][ci], dd,
                                            a['cell_types'], a['compiled_cell_types'][ci])
        assert_close(same, a[prefix + '_same_type_distance'])
        check('same-type total ' + prefix, int(np.sum(same <= 1e-6)) == row['same_type_matches_at_1e_minus_6'])
        multiplicities.append({'case': name, 'domain': row['domain'],
                               'global_unique_coordinate_match_rows': int(np.sum(mult == 1)),
                               'global_multiple_coordinate_match_rows': int(np.sum(mult > 1)),
                               'same_type_unique_coordinate_match_rows': int(np.sum(same_mult == 1)),
                               'same_type_multiple_coordinate_match_rows': int(np.sum(same_mult > 1)),
                               'meaning': 'Distinct candidate receptor coordinates within tolerance, not recording IDs or unique LED spectra'})
    corruptions = []
    c, t, idx, d, ct, tt = matched_test_fixture
    for name, attempt in (
        ('changed coordinate', lambda: assert_close(a['compiled_x'] + 0.01, a['compiled_x'])),
        ('changed source-derived transfer', lambda: assert_close(a['govardoskii__conditional_minimum_integer_grid_transfer'] + 0.01, a['govardoskii__conditional_minimum_integer_grid_transfer'])),
        ('changed match distance', lambda: assert_neighbor(c, t, idx, d + 0.01)),
        ('out-of-range neighbor', lambda: assert_neighbor(c, t, idx + len(c), d)),
        ('wrong cell type', lambda: assert_neighbor(c, t, idx, d, ct, np.full(len(tt), 'invented_type'))),
        ('swapped opsin columns', lambda: assert_neighbor(c[:, [1, 0, 2, 3]], t, idx, d)),
    ):
        try:
            attempt()
        except AssertionError:
            corruptions.append({'case': name, 'rejected': True})
        else:
            raise AssertionError('Corruption was accepted: ' + name)
    OUT.mkdir(parents=True, exist_ok=False)
    report = {'created_utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'passed': True,
              'result_sha256': sha(RESULT), 'arrays_sha256': sha(ARRAYS), 'checker_sha256': sha(Path(__file__)),
              'check_count': len(checks), 'checks': checks, 'global_row_checks': total_global_rows,
              'same_type_row_checks': total_same_type_rows, 'corruptions': corruptions,
              'max_scalar_capture_difference': max_capture_difference,
              'max_scalar_same_type_matched_log_distance': max_matched_source_distance,
              'match_multiplicities': multiplicities, 'independent_human_review': False,
              'same_agent_separate_implementation': True, 'builder_imported': False,
              'threads': 1, 'elapsed_seconds': round(time.monotonic()-began, 4)}
    (OUT / 'CHECKS.json').write_text(json.dumps(report, indent=2, allow_nan=False)+'\n', encoding='utf-8')
    print(json.dumps({key: report[key] for key in ('passed', 'check_count', 'global_row_checks', 'same_type_row_checks',
                                                  'max_scalar_capture_difference', 'max_scalar_same_type_matched_log_distance', 'elapsed_seconds')}, indent=2))


if __name__ == '__main__':
    main()
