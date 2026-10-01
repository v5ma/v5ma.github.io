"""Exact observation-design counterexample, not a learned or neural application.

Read the adjacent protocol. Runs serially with the standard library and no search.
Results are small and a pre-existing receipt causes a safe stop, not overwrite.
"""
from collections import Counter, defaultdict
from datetime import datetime, timezone
from fractions import Fraction
from hashlib import sha256
from itertools import product
import json
from pathlib import Path
from time import perf_counter


ROOT = Path(__file__).resolve().parents[1]
PROTOCOL = ROOT / 'applications/IDENTIFIABILITY-PROTOCOL-20260908.md'
OUT = ROOT / 'applications/results-identifiability-20260908'
STATES = tuple(product((0, 1), repeat=3))
ROLES = (0, 1)
HORIZON = 3


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def encode(kind, state, role):
    if kind == 'selective':
        return (state[role],)
    if kind == 'full':
        return state
    if kind == 'recoded_full':
        x, y, z = state
        return (x ^ y, y, z)
    raise ValueError(kind)


def primary_readout(kind, representation, role):
    if kind == 'selective':
        return representation[0]
    if kind == 'full':
        return representation[role]
    if kind == 'recoded_full':
        x_xor_y, y, z = representation
        return (x_xor_y ^ y, y, z)[role]
    raise ValueError(kind)


def frozen_optimal_accuracy(kind, role, target_coordinate):
    # Encode before any probe; the query cannot update this declared state.
    frozen = [(encode(kind, state, role), state[target_coordinate])
              for state in STATES]
    counts = defaultdict(Counter)
    for representation, target in frozen:
        counts[representation][target] += 1
    correct = sum(max(c.values()) for c in counts.values())
    return Fraction(correct, len(STATES)), len(counts)


def require(condition, label, checks):
    checks[label] = bool(condition)
    if not condition:
        raise RuntimeError('Counterexample check failed: ' + label)


def main():
    if OUT.exists():
        raise SystemExit('Existing diagnostic directory preserved: ' + str(OUT))
    start = perf_counter()
    started = datetime.now(timezone.utc).isoformat()
    protocol_hash = digest(PROTOCOL)
    checks = {}
    trajectories = steps = mismatches = 0
    for world_path in product(STATES, repeat=HORIZON):
        for role_path in product(ROLES, repeat=HORIZON):
            trajectories += 1
            for state, role in zip(world_path, role_path):
                steps += 1
                a = primary_readout('selective', encode('selective', state, role), role)
                b = primary_readout('full', encode('full', state, role), role)
                mismatches += not (a == b == state[role])
    require(trajectories == 4096 and steps == 12288, 'complete_trajectory_count', checks)
    require(mismatches == 0, 'all_primary_behavior_identical_and_correct', checks)

    rows = []
    for role in ROLES:
        for kind in ('selective', 'full'):
            for probe, coordinate in (('primary', role), ('other_role', 1-role), ('unused', 2)):
                accuracy, code_values = frozen_optimal_accuracy(kind, role, coordinate)
                expected = Fraction(1) if kind == 'full' or probe == 'primary' else Fraction(1, 2)
                require(accuracy == expected, f'frozen_{role}_{kind}_{probe}', checks)
                rows.append({'role': role, 'encoder': kind, 'probe': probe,
                             'target_coordinate': coordinate, 'accuracy': float(accuracy),
                             'exact_fraction': str(accuracy), 'attainable_codes': code_values})

    recoded_correct = all(primary_readout('recoded_full', encode('recoded_full', s, g), g) == s[g]
                          for s in STATES for g in ROLES)
    require(recoded_correct, 'invertible_recoding_primary_behavior', checks)
    distinct = len({encode('recoded_full', s, 0) for s in STATES})
    require(distinct == len(STATES), 'invertible_recoding_singleton_fibers', checks)
    # Two states with the same selected bit but different unused content.
    witness_a, witness_b = (0, 0, 0), (0, 0, 1)
    require(encode('selective', witness_a, 0) == encode('selective', witness_b, 0)
            and encode('full', witness_a, 0) != encode('full', witness_b, 0),
            'different_representation_fibers_despite_primary_tie', checks)

    retained = ('drafts/DRAFT-01-20260908.md',
                'output/pdf/composition-granularity-draft-01.pdf',
                'applications/assembly_fixture.py',
                'applications/results/summary.json', 'applications/results/conditions.csv',
                'figures/architecture.png', 'figures/results.png',
                'reviews/VALIDATION.json', 'reviews/DRAFT-01-REVIEW.md')
    result = {
        'status': 'PASS_EXACT_IDENTIFIABILITY_COUNTEREXAMPLE',
        'started_utc': started,
        'finished_utc': datetime.now(timezone.utc).isoformat(),
        'elapsed_seconds': perf_counter() - start,
        'code_sha256': digest(Path(__file__)),
        'protocol_sha256': protocol_hash,
        'states': len(STATES), 'roles': list(ROLES), 'horizon': HORIZON,
        'paired_trajectories': trajectories, 'paired_step_comparisons': steps,
        'primary_mismatches': mismatches, 'frozen_probe_conditions': rows,
        'checks': checks, 'checks_passed': sum(checks.values()),
        'checks_total': len(checks),
        'preserved_draft_1_sha256': {name: digest(ROOT/name) for name in retained},
        'scope': 'Analytically designed, exhaustive finite diagnostic. No learning, biological measurements, statistical sampling, or distinctive SAN advantage.'
    }
    OUT.mkdir()
    (OUT/'summary.json').write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({k: result[k] for k in ('status','elapsed_seconds','paired_trajectories',
                     'paired_step_comparisons','primary_mismatches','checks_passed','checks_total')}, indent=2))


if __name__ == '__main__':
    main()
