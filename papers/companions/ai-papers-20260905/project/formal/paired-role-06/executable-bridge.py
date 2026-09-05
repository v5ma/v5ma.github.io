"""Exhaust the nine finite cases and check the fixed paired-output projection."""
import csv
import hashlib
import itertools
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def score(p, q):
    return int(p == 'a') + int(q == 'b')

def main():
    out = HERE / 'EXECUTABLE-BRIDGE.json'
    if out.exists():
        raise FileExistsError('Preserve earlier receipts.')
    table = []
    for p, q in itertools.product(('a', 'b', 'other'), repeat=2):
        s = score(p, q)
        assert (s == 2) == (p == 'a' and q == 'b')
        if p == q:
            assert s <= 1
        table.append({'first': p, 'second': q, 'score': s})
    assert score('a', 'a') == score('b', 'b') == 1
    assert score('b', 'a') == 0
    assert 0 < score('a', 'a') < 2
    detail = ROOT / 'reviews/gpt2-learning-06/ROLE-PAIR-DETAIL.csv'
    summary = ROOT / 'reviews/gpt2-learning-06/ROLE-PAIR-SUMMARY.csv'
    totals = {}
    with detail.open(newline='', encoding='utf-8') as f:
        pairs = list(csv.DictReader(f))
    assert len(pairs) == 120
    for row in pairs:
        a, b = row['expected_1'], row['expected_2']
        assert a != b and 'INVALID' not in (a, b)
        def project(value):
            return 'a' if value == a else ('b' if value == b else 'other')
        p, q = project(row['output_1']), project(row['output_2'])
        assert score(p, q) == int(row['correct'])
        assert (score(p, q) == 2) == bool(int(row['both_roles_correct']))
        collapse = p == q and p != 'other'
        assert collapse == bool(int(row['same_named_output']))
        counts = totals.setdefault(row['arm'], [0, 0, 0, 0, 0])
        values = [1, score(p, q), int(score(p, q) == 2), int(collapse), score(p, q) if collapse else 0]
        for i, value in enumerate(values):
            counts[i] += value
    fields = ('families', 'correct_tokens', 'both_roles_correct', 'same_named_output_families', 'successes_in_collapsed_pairs')
    with summary.open(newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            assert totals[row['arm']] == [int(row[field]) for field in fields]
    receipt = {'status': 'PASS', 'finite_cases': table, 'experimental_pairs_checked': len(pairs), 'formal_python_refinement': False, 'independent_review': False, 'sources': {str(p.relative_to(ROOT)): sha(p) for p in (Path(__file__), HERE / 'PairedRoleMetric.lean', detail, summary)}}
    out.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'PASS', 'finite_cases': 9, 'experimental_pairs': len(pairs)}))

if __name__ == '__main__':
    main()
