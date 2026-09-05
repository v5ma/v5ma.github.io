"""Separate recount and native reconstruction; same authoring agent, not independent review."""
import argparse
import hashlib
import hmac
import json
import subprocess
import sys
from qwen35_adapter_v9 import ROOT, MODEL, STATE_NAMES, Decoder, ResourceGuard, sha, write, np
from tokenizers import Tokenizer

OUT = ROOT / 'reviews/qwen35-hybrid-09'
PREP = ROOT / 'results/qwen35-hybrid-09-prepared'
ARM_GROUPS = {'original': (), 'full_donor': ('conv', 'recurrent', 'kv'), 'conv_donor': ('conv',),
    'recurrent_donor': ('recurrent',), 'kv_donor': ('kv',), 'conv_recurrent_donor': ('conv', 'recurrent')}

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def family_of(name):
    return 'conv' if name.startswith('past_conv.') else 'recurrent' if name.startswith('past_recurrent.') else 'kv'

def check_freeze():
    freeze = read(PREP / 'INPUT-FREEZE.json')
    for p, digest in freeze.items():
        assert sha(ROOT / p) == digest, p
    assert sha(PREP / 'CASES.json') == read(PREP / 'PREPARATION-RECEIPT.json')['case_sha256']
    return freeze

def trace():
    OUT.mkdir(exist_ok=True)
    assert not (OUT / 'TRACE-AND-METRIC-AUDIT.json').exists()
    freeze = check_freeze(); cases = read(PREP / 'CASES.json')
    tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
    rows = []; receipts = []; supports = 0; input_hashes = dict(freeze)
    for index, case in enumerate(cases):
        folder = ROOT / f'results/qwen35-hybrid-09-case-{index}'
        receipt = read(folder / 'EXECUTION-RECEIPT.json'); receipts.append(receipt)
        assert receipt['case'] == case['id'] and receipt['answer_readouts'] == 18
        assert receipt['resource']['numerical_threads'] == 1 and receipt['resource']['elapsed_seconds'] < 75
        assert receipt['resource']['peak_commit_bytes'] < 5500000000 and receipt['native_decoder_calls'] < 160
        for name, digest in receipt['files'].items():
            assert sha(folder / name) == digest
            input_hashes[(folder / name).relative_to(ROOT).as_posix()] = digest
        input_hashes[(folder / 'EXECUTION-RECEIPT.json').relative_to(ROOT).as_posix()] = sha(folder / 'EXECUTION-RECEIPT.json')
        prefix = read(folder / 'PREFIX-STATE.json')
        assert set(prefix['original']) == set(prefix['donor_hashes']) == set(STATE_NAMES)
        for row in read(folder / 'STATE-SUPPORT.json'):
            n = row['tensor']; donor = family_of(n) in ARM_GROUPS[row['arm']]
            assert row['origin'] == ('donor' if donor else 'original')
            assert row['sha256'] == prefix['donor_hashes' if donor else 'original'][n]
            assert row['bytes'] == prefix['tensor_bytes'][n]
            assert row['max_abs_difference_from_original'] == (prefix['max_abs_differences'][n] if donor else 0)
            supports += 1
        answers = read(folder / 'ANSWERS.json')
        assert len({(r['arm'], r['query']) for r in answers}) == 18
        for r in answers:
            assert r['case'] == case['id'] and r['first_token_id'] == r['generated_ids'][0]
            assert 1 <= len(r['generated_ids']) <= 4
            assert r['answer'] == tokenizer.decode(r['generated_ids'], skip_special_tokens=True).strip()
            assert r['stopped_on_eos'] == (r['generated_ids'][-1] in (248044, 248046))
            for key in ('original', 'swapped'):
                target = case[r['query']] if key == 'original' or r['query'] == 'color' else (
                    case['recipient'] if r['query'] == 'giver' else case['giver'])
                assert r[key + '_target'] == target
                assert r[key + '_score'] == {'correct': r['answer'].strip().casefold() == target.casefold(),
                    'exact_case_correct': r['answer'].strip() == target}
            for n in STATE_NAMES:
                donor = family_of(n) in ARM_GROUPS[r['arm']]
                assert r['input_state_hashes'][n] == prefix['donor_hashes' if donor else 'original'][n]
            rows.append(r)
    by_key = {(r['case'], r['arm'], r['query']): r for r in rows}
    for case in cases:
        for query in ('giver', 'recipient', 'color'):
            a = by_key[(case['id'], 'full_donor', query)]
            b = by_key[(case['opposite'], 'original', query)]
            assert (a['first_logit_sha256'], a['generated_ids']) == (b['first_logit_sha256'], b['generated_ids'])
    folder = ROOT / 'results/qwen35-hybrid-09-case-0'
    events = read(folder / 'AUTHORITY-EVENTS.json'); workflow = read(folder / 'WORKFLOW-ANSWERS.json')
    revision = -1; scope = []; fresh = 0
    for event in events:
        message = json.dumps([event['update_revision'], sorted(event['update_scope'])], separators=(',', ':')).encode()
        signature = hmac.new(b'public-development-fixture-not-a-production-secret', message, 'sha256').hexdigest()
        accepted = hmac.compare_digest(signature, event['signature']) and event['update_revision'] > revision
        assert accepted == event['accepted']
        if accepted:
            revision, scope = event['update_revision'], event['update_scope']
        assert event['store_revision'] == revision and event['store_scope'] == scope
        command = scope[0][1]
        arm = {'swap': 'full_donor', 'stop_future_edits': 'full_donor',
            'restore_kv': 'conv_recurrent_donor', 'restore_all': 'original'}[command]
        assert event['selected_arm'] == arm
        selected = [r for r in workflow if r['arm'] == event['stage']]
        assert len(selected) == (3 if accepted else 0)
        assert event['fresh_decoder_calls'] == event['calls_after'] - event['calls_before']
        assert (event['fresh_decoder_calls'] > 0) == accepted
        fresh += len(selected)
        for row in selected:
            control = by_key[(cases[0]['id'], arm, row['query'])]
            assert row['authority_revision'] == revision and row['selected_state_arm'] == arm
            assert (row['first_logit_sha256'], row['generated_ids']) == (control['first_logit_sha256'], control['generated_ids'])
    metrics = []; joints = []; strata = []
    for arm in ARM_GROUPS:
        for query in ('giver', 'recipient', 'color'):
            selected = [r for r in rows if r['arm'] == arm and r['query'] == query]
            metrics.append({'arm': arm, 'query': query, 'n': len(selected),
                'original_correct': sum(r['original_score']['correct'] for r in selected),
                'swapped_correct': sum(r['swapped_score']['correct'] for r in selected),
                'exact_case_original': sum(r['original_score']['exact_case_correct'] for r in selected),
                'exact_case_swapped': sum(r['swapped_score']['exact_case_correct'] for r in selected),
                'mean_max_abs_logit_change': float(np.mean([r['max_abs_logit_change_from_original'] for r in selected])),
                'different_full_logit_hash': sum(r['first_logit_sha256'] != by_key[(r['case'], 'original', query)]['first_logit_sha256'] for r in selected)})
        for family in sorted({r['family'] for r in rows}):
            for color in ('green', 'yellow'):
                selected = [r for r in rows if r['arm'] == arm and r['family'] == family and r['color'] == color]
                assert len(selected) == 6
                joints.append({'arm': arm, 'family': family, 'color': color,
                    'all_six_swapped': all(r['swapped_score']['correct'] for r in selected),
                    'all_six_original': all(r['original_score']['correct'] for r in selected)})
            selected = [r for r in rows if r['arm'] == arm and r['family'] == family]
            strata.append({'arm': arm, 'family': family, 'n': len(selected),
                'swapped_correct': sum(r['swapped_score']['correct'] for r in selected),
                'original_correct': sum(r['original_score']['correct'] for r in selected)})
    commands = [(['test_labs', 'test_protocol_v2', 'test_context_provenance_v3', 'test_active_receiver_v4',
        'test_gpt2_v5', 'test_gpt2_learning_v6', 'test_gpt2_intent_v7', 'test_gpt2_continuation_v8'], 61, 'PRIOR-TESTS.log'),
        (['test_qwen35_v9', 'test_qwen35_hybrid_v9'], 15, 'QWEN-TESTS.log')]
    for names, count, logname in commands:
        result = subprocess.run([sys.executable, '-m', 'unittest', '-v'] + names,
            cwd=ROOT / 'applications', text=True, capture_output=True, timeout=45)
        log = result.stdout + result.stderr
        with (OUT / logname).open('x', encoding='utf-8') as stream:
            stream.write(log)
        assert result.returncode == 0 and f'Ran {count} tests' in log and '\nOK' in log
    write(OUT / 'METRICS.json', metrics); write(OUT / 'JOINT-DETAIL.json', joints)
    write(OUT / 'FAMILY-STRATA.json', strata); write(OUT / 'AUDIT-INPUTS.json', input_hashes)
    receipt = {'status': 'PASS', 'independent_review': False, 'auditor_sha256': sha(__file__),
        'answer_rows': len(rows), 'fresh_workflow_answer_rows': fresh, 'state_support_rows': supports,
        'authority_events': len(events), 'tests': 76, 'native_decoder_calls_in_original_runs': sum(r['native_decoder_calls'] for r in receipts),
        'native_prefix_readouts': 32, 'total_original_elapsed_seconds': sum(r['resource']['elapsed_seconds'] for r in receipts),
        'max_peak_commit_bytes': max(r['resource']['peak_commit_bytes'] for r in receipts),
        'family_count': 4, 'strata_note': 'Two settings crossed with two name pairs; descriptive strata, not four independently sampled populations.',
        'all_full_donor_opposite_original_controls_exact': True,
        'native_reconstruction': 'Separate native case audits required; not implied by this recount'}
    write(OUT / 'TRACE-AND-METRIC-AUDIT.json', receipt)
    print(json.dumps(receipt, indent=2))
    print(json.dumps(metrics, indent=2))

def native(index):
    check_freeze(); cases = read(PREP / 'CASES.json'); case = cases[index]
    opposite = next(c for c in cases if c['id'] == case['opposite'])
    folder = ROOT / f'results/qwen35-hybrid-09-case-{index}'
    output = OUT / f'native-case-{index}'; output.mkdir()
    guard = ResourceGuard(output)
    decoder = Decoder(); root_z, original = decoder.advance(case['prefix_ids'])
    donor_z, donor = decoder.advance(opposite['prefix_ids'])
    prefix = read(folder / 'PREFIX-STATE.json')
    def digest(a):
        return hashlib.sha256(np.ascontiguousarray(a).tobytes()).hexdigest()
    assert digest(root_z) == prefix['original_prefix_logit_sha256']
    assert digest(donor_z) == prefix['donor_prefix_logit_sha256']
    for n in STATE_NAMES:
        assert digest(original[n]) == prefix['original'][n] and digest(donor[n]) == prefix['donor_hashes'][n]
    rows = read(folder / 'ANSWERS.json')
    if index == 0:
        rows += read(folder / 'WORKFLOW-ANSWERS.json')
    for row in rows:
        arm = row.get('selected_state_arm', row['arm'])
        state = {n: donor[n] if family_of(n) in ARM_GROUPS[arm] else original[n] for n in STATE_NAMES}
        z, state = decoder.advance(case['branches'][row['query']]['ids'], state)
        assert digest(z) == row['first_logit_sha256']
        generated = []
        for step in range(4):
            token = int(np.argmax(z)); generated.append(token)
            if token in (248046, 248044) or step == 3:
                break
            z, state = decoder.advance([token], state)
        assert generated == row['generated_ids']
    resource = guard.finish()
    result = {'status': 'PASS_NATIVE_RECONSTRUCTION', 'case_index': index, 'case': case['id'],
        'answer_rows_recomputed': len(rows), 'prefix_outputs_recomputed': 2,
        'all_first_logits_byte_identical': True, 'all_generated_token_sequences_identical': True,
        'all_prefix_states_byte_identical': True, 'native_decoder_calls': decoder.calls,
        'resource': resource, 'auditor_sha256': sha(__file__),
        'shared_adapter_sha256': sha(ROOT / 'applications/qwen35_adapter_v9.py'),
        'scope': 'Different interchange/generation loop; same native graph, adapter, environment and authoring agent. Not independent review or cross-runtime equivalence.'}
    write(output / 'RECEIPT.json', result)
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('mode', choices=['trace', 'native'])
    parser.add_argument('--case', type=int, choices=range(16), default=0)
    args = parser.parse_args()
    if args.mode == 'trace':
        trace()
    else:
        native(args.case)
