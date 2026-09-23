"""Bounded, unfitted source-to-coordinate reconstruction; never imports chreyesees."""
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
OUT = ROOT / 'application/hue-input-contract-v0/results-01'
PLAN = ROOT / 'application/hue-input-contract-v0/PLAN.md'
TRACE = ROOT / 'sources/hue-model-data-intake-35/Figure-3.parquet'
COMPILED = ROOT / 'sources/hue-component-intake-03/download/compiled_data.parquet'
SPECTRA = ROOT / 'sources/hue-transform-route-intake-36/flux_normalized_led_spectra.json'
SENS = ROOT / 'sources/hue-sensitivity-intake-37'
LEDS = ('duv', 'uv', 'violet', 'rblue', 'lime', 'orange')
OPSINS = ('rh3', 'rh4', 'rh5', 'rh6')
EXPECTED = {
    TRACE: '7971711b5283e674f7007c47246b542b6e4f62425c718baa38f7992088eacaf9',
    COMPILED: 'f6524b03d81ef0b20d01e5a8b58b1a3861f893f1f9fce6bad9a4718007d6731c',
    SPECTRA: '7afcc1af55afc5a02ad78a942f30f798066a739a6d45a6b4ca870c412afcd390',
}


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as handle:
        while chunk := handle.read(1048576):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n', encoding='utf-8')


def nearest(candidates, targets):
    """Exact bounded Chebyshev search on deduplicated numeric arrays, not files."""
    points, original = np.unique(candidates, axis=0, return_index=True)
    questions, inverse = np.unique(targets, axis=0, return_inverse=True)
    if len(points) * len(questions) > 8000000:
        raise ValueError('Numeric comparison budget exceeded; do not expand automatically')
    best = np.empty(len(questions))
    where = np.empty(len(questions), dtype=int)
    for start in range(0, len(questions), 64):
        block = questions[start:start+64]
        distances = np.zeros((len(block), len(points)))
        for column in range(4):
            np.maximum(distances, np.abs(block[:, column, None] - points[None, :, column]), out=distances)
        selected = np.argmin(distances, axis=1)
        best[start:start+len(block)] = distances[np.arange(len(block)), selected]
        where[start:start+len(block)] = original[selected]
    return best[inverse], where[inverse]


def sensitivity(name, columns, grid):
    path = SENS / name
    with path.open(encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle)
        assert reader.fieldnames == ['wls', *columns]
        rows = list(reader)
    old = np.array([float(row['wls']) for row in rows])
    values = np.array([[float(row[col]) for col in columns] for row in rows])
    assert np.all(np.isfinite(values)) and np.all(np.diff(old) > 0)
    assert old[0] <= grid[0] and old[-1] >= grid[-1]
    interpolated = np.stack([np.interp(grid, old, values[:, i]) for i in range(len(columns))], axis=1)
    return np.maximum(interpolated, 0), {
        'file': name, 'sha256': digest(path), 'rows': len(rows), 'columns': ['wls', *columns],
        'first_wavelength_nm': float(old[0]), 'last_wavelength_nm': float(old[-1]),
        'negative_interpolated_values_clipped': int(np.sum(interpolated < 0)),
    }


def main():
    started = time.monotonic()
    hashes = {str(path.relative_to(ROOT)): digest(path) for path in EXPECTED}
    for path, expected in EXPECTED.items():
        assert hashes[str(path.relative_to(ROOT))] == expected
    acquisition = json.loads((SENS / 'INTAKE.json').read_text(encoding='utf-8'))
    assert all(row['status'] == 'acquired' and digest(SENS / row['name']) == row['sha256']
               for row in acquisition['sources'])
    OUT.mkdir(parents=True, exist_ok=False)
    con = duckdb.connect(':memory:', config={
        'threads': '1', 'memory_limit': '64MB', 'temp_directory': str(OUT / 'scratch'),
        'autoinstall_known_extensions': 'false', 'autoload_known_extensions': 'false'})
    # Numeric columns and type identity only; do not inspect fluorescence again.
    led_rows = con.execute('SELECT DISTINCT ' + ','.join(LEDS) + ', cell_type FROM read_parquet(?) '
                           'ORDER BY cell_type,' + ','.join(LEDS), [str(TRACE)]).fetchall()
    if len(led_rows) > 10000:
        raise ValueError('Distinct-LED-row cap exceeded')
    small_rows = con.execute('SELECT ' + ','.join(OPSINS) + ', cell_type FROM read_parquet(?)',
                             [str(COMPILED)]).fetchall()
    con.close()
    contrasts = np.array([row[:6] for row in led_rows], dtype=float)
    types = np.array([row[6] for row in led_rows])
    compiled_x = np.array([row[:4] for row in small_rows], dtype=float)
    compiled_types = np.array([row[4] for row in small_rows])
    assert np.all(np.isfinite(contrasts)) and np.min(contrasts) >= -1 - 1e-12
    assert np.all(np.isfinite(compiled_x))
    conditional_bg = []
    grid_checks = []
    for index, name in enumerate(LEDS):
        values = np.unique(contrasts[:, index])
        compatible = []
        max_errors = []
        for b in range(1, 1001):
            intensities = (values + 1) * b
            error = float(np.max(np.abs(intensities - np.rint(intensities))))
            if error <= 1e-7:
                compatible.append(b)
                max_errors.append(error)
        if not compatible:
            raise ValueError('No grid-compatible background; do not guess another transform')
        conditional_bg.append(compatible[0])
        grid_checks.append({'led': name, 'distinct_field_values': len(values),
                            'tested_integer_backgrounds_nE': [1, 1000],
                            'compatible_backgrounds_nE': compatible,
                            'maximum_integer_residuals_nE': max_errors,
                            'selected_for_conditional_case_nE': compatible[0]})

    led_json = json.loads(SPECTRA.read_text(encoding='utf-8'))
    assert led_json['columns'] == list(LEDS)
    old_grid = np.asarray(led_json['index'], dtype=float)
    raw_spectra = np.asarray(led_json['data'], dtype=float)
    grid = np.arange(300, 700, dtype=float)
    assert raw_spectra.shape == (1200, 6) and np.all(np.diff(old_grid) > 0)
    assert np.all(np.isfinite(raw_spectra)) and np.min(raw_spectra) >= 0
    led_spectra = np.stack([np.interp(grid, old_grid, raw_spectra[:, i]) for i in range(6)], axis=1)
    unnormalized_integrals = np.trapezoid(led_spectra, grid, axis=0)
    assert np.min(unnormalized_integrals) > 0
    led_spectra /= unnormalized_integrals
    standard = []
    sensitivity_receipts = []
    # The fifth source curve is checked for schema/identity, not added as a post-hoc predictor.
    _, receipt = sensitivity('rh1_standard.csv', ['rh1'], grid)
    sensitivity_receipts.append(receipt)
    for opsin in OPSINS:
        value, receipt = sensitivity(opsin + '_morning.csv', [opsin], grid)
        standard.append(value[:, 0])
        sensitivity_receipts.append(receipt)
    gov, receipt = sensitivity('govardoskii_morning.csv', list(OPSINS), grid)
    sensitivity_receipts.append(receipt)
    curves = {'standard': np.stack(standard, axis=1), 'govardoskii': gov}
    backgrounds = {'published_rounded': np.array([10, 60, 100, 250, 330, 250]),
                   'conditional_minimum_integer_grid': np.array(conditional_bg)}
    all_cases = []
    arrays = {'wavelength_nm': grid, 'led_spectra': led_spectra,
              'contrasts': contrasts, 'cell_types': types,
              'compiled_x': compiled_x, 'compiled_cell_types': compiled_types}
    compiled_q = np.exp(compiled_x) * 1.001 - 0.001
    # Negative signed x is permitted. Negative inverse captures would be a different failure.
    assert np.min(compiled_q) >= -1e-12
    for set_name, sense in curves.items():
        overlaps = np.trapezoid(led_spectra[:, :, None] * sense[:, None, :], grid, axis=0)
        arrays[set_name + '_sensitivities'] = sense
        arrays[set_name + '_overlaps'] = overlaps
        for bg_name, bg in backgrounds.items():
            case_name = set_name + '__' + bg_name
            denominator = bg @ overlaps
            assert np.min(denominator) > 0
            transfer = bg[:, None] * overlaps / denominator[None, :]
            q = (contrasts + 1) @ transfer
            assert np.min(q) >= -1e-12
            x = np.log((q + 0.001) / 1.001)
            arrays[case_name + '_capture'] = q
            arrays[case_name + '_log_coordinate'] = x
            arrays[case_name + '_transfer'] = transfer
            for domain, candidates, targets in [('signed_log', x, compiled_x), ('inverse_capture', q, compiled_q)]:
                distances, neighbors = nearest(candidates, targets)
                same_type_distances = np.full(len(targets), np.nan)
                same_type_neighbors = np.full(len(targets), -1, dtype=int)
                by_type = []
                for label in sorted(set(compiled_types.tolist())):
                    ci = np.flatnonzero(compiled_types == label)
                    li = np.flatnonzero(types == label)
                    if len(li):
                        dd, nn = nearest(candidates[li], targets[ci])
                        same_type_distances[ci] = dd
                        same_type_neighbors[ci] = li[nn]
                        by_type.append({'cell_type': label, 'compiled_rows': len(ci),
                                        'candidate_led_rows': len(li),
                                        'matches_at_1e_minus_6': int(np.sum(dd <= 1e-6)),
                                        'median_distance': float(np.median(dd)), 'max_distance': float(np.max(dd))})
                    else:
                        by_type.append({'cell_type': label, 'compiled_rows': len(ci),
                                        'candidate_led_rows': 0, 'matches_at_1e_minus_6': 0,
                                        'median_distance': None, 'max_distance': None})
                prefix = case_name + '__' + domain
                arrays[prefix + '_global_distance'] = distances
                arrays[prefix + '_global_neighbor'] = neighbors
                arrays[prefix + '_same_type_distance'] = same_type_distances
                arrays[prefix + '_same_type_neighbor'] = same_type_neighbors
                all_cases.append({'case': case_name, 'domain': domain, 'background_nE': bg.tolist(),
                                  'sensitivity_set': set_name, 'compiled_rows': len(targets),
                                  'global_matches_at_1e_minus_6': int(np.sum(distances <= 1e-6)),
                                  'global_distinct_matched_led_rows': int(len(set(neighbors[distances <= 1e-6].tolist()))),
                                  'global_median_distance': float(np.median(distances)),
                                  'global_max_distance': float(np.max(distances)),
                                  'same_type_matches_at_1e_minus_6': int(np.sum(same_type_distances <= 1e-6)),
                                  'by_type': by_type})
    np.savez_compressed(OUT / 'INPUT-CONTRACT-ARRAYS.npz', **arrays)
    report = {'created_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
              'plan_sha256': digest(PLAN), 'tool_sha256': digest(Path(__file__)), 'source_hashes': hashes,
              'sensitivity_intake_sha256': digest(SENS / 'INTAKE.json'),
              'sensitivity_schemas': sensitivity_receipts, 'distinct_type_led_rows': len(led_rows),
              'compiled_rows': len(small_rows), 'compiled_rows_with_negative_signed_coordinate':
              int(np.sum(np.any(compiled_x < 0, axis=1))), 'minimum_inverse_capture': float(np.min(compiled_q)),
              'integer_grid_candidates': grid_checks, 'conditional_minimum_background_sum_nE': int(sum(conditional_bg)),
              'integration': 'Composite trapezoid on 300..699 nm grid; not claimed as installed author-library parity',
              'led_integrals_before_normalization': unnormalized_integrals.tolist(),
              'cases': all_cases, 'arrays_sha256': digest(OUT / 'INPUT-CONTRACT-ARRAYS.npz'),
              'response_values_used': False, 'fit_parameters_optimized': 0,
              'original_export_call_recovered': False, 'actual_background_metadata_recovered': False,
              'native_model_reproduced': False, 'threads': 1, 'elapsed_seconds': round(time.monotonic() - started, 4)}
    write_json(OUT / 'INPUT-CONTRACT.json', report)
    print(json.dumps({key: report[key] for key in ('distinct_type_led_rows', 'compiled_rows',
                                                  'conditional_minimum_background_sum_nE', 'elapsed_seconds')}, indent=2))
    for row in all_cases:
        print(json.dumps({key: row[key] for key in ('case', 'domain', 'global_matches_at_1e_minus_6',
                                                   'same_type_matches_at_1e_minus_6', 'global_median_distance',
                                                   'global_max_distance')}))


if __name__ == '__main__':
    main()
