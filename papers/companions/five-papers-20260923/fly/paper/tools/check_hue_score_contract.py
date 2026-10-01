"""Test isolated, text-reviewed pure score functions, without importing the project."""
import ast
import datetime as dt
import hashlib
import json
import math
import os
from pathlib import Path
import xml.etree.ElementTree as ET

for name in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'NUMEXPR_NUM_THREADS'):
    os.environ[name] = '1'
if os.name == 'nt':
    import ctypes
    ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'application/hue-input-contract-v0'
OUT = BASE / 'score-checks-01'
SOURCE = ROOT / 'sources/hue-transform-route-intake-36/utils.py'
PAPER = ROOT / 'sources/hue-model-intake-02/download/christenson-2024.xml'
NAMES = ('get_module', '_r2er_score', 'r2er_score', 'nan_r2er_score', 'r2er_n2m')


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def scalar(y, prediction, weights, variance):
    triples = [(w, v, p) for w, v, p in zip(weights, y, prediction) if math.isfinite(v) and math.isfinite(p)]
    dot = math.fsum(w*v*p for w, v, p in triples)
    yy = math.fsum(w*v*v for w, v, p in triples)
    pp = math.fsum(w*p*p for w, v, p in triples)
    signed = dot**3/max(abs(dot), 1e-8)/max(yy*pp, 1e-8)
    # This follows the source's count-array convention, including for missing-y cases.
    average_count = math.fsum(weights)/len(weights)
    total_count = math.fsum(weights)
    corrected = (dot*dot-variance/average_count*pp)/(yy*pp-(total_count-1)*variance/average_count*pp)
    center = math.fsum(w*v for w, v, p in triples)/math.fsum(w for w, v, p in triples)
    denominator = math.fsum(w*(v-center)**2 for w, v, p in triples)
    ordinary = 1-math.fsum(w*(v-p)**2 for w, v, p in triples)/denominator
    cosine = dot/math.sqrt(yy*pp)
    return signed, corrected, ordinary, -cosine


def main():
    assert sha(SOURCE) == 'b18d13418d2760553d6fcaca765ef87c2d34e6018c204abab2bebf38a8e9100d'
    source_text = SOURCE.read_text(encoding='utf-8')
    tree = ast.parse(source_text)
    functions = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in NAMES]
    assert len(functions) == len(NAMES) and set(node.name for node in functions) == set(NAMES)
    # Only these five reviewed function definitions execute. No imports, top-level
    # expressions, database initialization or directory creation from author code.
    module = ast.Module(body=functions, type_ignores=[])
    namespace = {'np': np, '__builtins__': {'isinstance': isinstance, 'hasattr': hasattr, 'ValueError': ValueError}}
    exec(compile(module, str(SOURCE)+'::five_pure_score_functions', 'exec'), namespace)
    cases = [
        ('identical', [1., 2.], [1., 2.], [1., 1.], 0.),
        ('positive_gain_only', [1., 2.], [2., 4.], [1., 1.], 0.),
        ('negative_prediction', [1., 2.], [-1., -2.], [1., 1.], 0.),
        ('additive_offset', [1., 2.], [2., 3.], [1., 1.], 0.),
        ('unequal_counts_and_noise', [-1., .5, 2.], [-.8, .7, 1.8], [2., 3., 4.], .03),
        ('missing_observation', [-1., float('nan'), 2.], [-.8, .7, 1.8], [2., 3., 4.], .03),
        ('clipping_scale', [1e-6, 2e-6], [1e-6, 2e-6], [1., 1.], 0.),
    ]
    results = []
    for name, yy, pp, ww, var in cases:
        y, prediction, weights = np.array(yy), np.array(pp), np.array(ww)
        signed = float(namespace['nan_r2er_score'](y.copy(), prediction.copy(), counts=weights, module='numpy', clamps=None))
        corrected = float(namespace['r2er_n2m'](y.copy(), prediction.copy(), var=var, n=weights))
        reference_signed, reference_corrected, ordinary, loss = scalar(yy, pp, ww, var)
        assert math.isclose(signed, reference_signed, rel_tol=2e-13, abs_tol=1e-15)
        assert math.isclose(corrected, reference_corrected, rel_tol=2e-13, abs_tol=1e-15)
        results.append({'case': name, 'y': [v if math.isfinite(v) else None for v in yy],
                        'prediction': pp, 'counts': ww, 'declared_synthetic_variance': var,
                        'source_signed_noncentered_r2er': signed,
                        'source_noise_corrected_r2er_n2m': corrected,
                        'ordinary_weighted_r2_reference': ordinary,
                        'single_population_negative_cosine_reference': loss,
                        'two_source_function_scalar_checks_passed': True})
    xml = ET.parse(PAPER).getroot()
    eq7 = next(el for el in xml.iter('disp-formula') if el.findtext('label') == '7')
    tex = next(el.text for el in eq7.iter('tex-math'))
    # Pin the actual rendered-equation alternative being discussed, not an OCR guess.
    assert '{\\sum }_{i}{m}_{i}{\\left(\\;{y}_{i}{v}_{i}\\right)}^{2}' in tex
    discrepancy = {'scope': 'Recovered publisher equation-7 TeX/XML versus pinned utils.py; PDF typography not newly inspected',
                   'zero_noise_test_y_and_prediction': [1, 2], 'weights': [1, 1],
                   'recovered_equation_sum_of_weighted_squared_products': 17/25,
                   'source_function_square_of_weighted_product_sum': 1.0,
                   'not_a_biological_score': True, 'original_fitting_call_not_recovered': True}
    assert results[0]['source_noise_corrected_r2er_n2m'] == 1.0
    assert results[1]['source_signed_noncentered_r2er'] == 1.0
    assert results[1]['ordinary_weighted_r2_reference'] == -9.0
    assert results[2]['source_signed_noncentered_r2er'] == -1.0
    assert results[2]['source_noise_corrected_r2er_n2m'] == 1.0
    assert results[6]['source_signed_noncentered_r2er'] < 1e-12
    OUT.mkdir(parents=True, exist_ok=False)
    (OUT / 'RECOVERED-EQUATION-7.xml').write_text(ET.tostring(eq7, encoding='unicode')+'\n', encoding='utf-8')
    report = {'created_utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'passed': True,
              'source_sha256': sha(SOURCE), 'paper_sha256': sha(PAPER), 'checker_sha256': sha(Path(__file__)),
              'plan_sha256': sha(BASE / 'PLAN.md'), 'function_names': NAMES,
              'project_imported': False, 'author_function_definitions_executed_in_isolation': True,
              'database_access': False, 'synthetic_cases': results, 'source_vs_scalar_comparisons': 14,
              'additional_distinction_assertions': 6, 'equation_difference': discrepancy,
              'new_biological_model_scores': 0, 'noise_variance_inferred_from_intervals': False,
              'equation_excerpt_sha256': sha(OUT / 'RECOVERED-EQUATION-7.xml')}
    (OUT / 'SCORE-CONTRACT.json').write_text(json.dumps(report, indent=2, allow_nan=False)+'\n', encoding='utf-8')
    print(json.dumps({'passed': True, 'synthetic_cases': len(results),
                      'source_vs_scalar_comparisons': 14, 'equation_difference': discrepancy}, indent=2))


if __name__ == '__main__':
    main()
