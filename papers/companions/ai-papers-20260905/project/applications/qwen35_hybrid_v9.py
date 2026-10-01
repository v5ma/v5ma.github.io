"""Native Qwen hybrid-state interchange and actual post-update continuation."""
import argparse
import json
from pathlib import Path
import traceback
from qwen35_adapter_v9 import (ROOT, MODEL, STATE_NAMES, Decoder, ResourceGuard,
    render, sha, state_digest, write, np)
from tokenizers import Tokenizer
from commitment_lab import CommitmentStore, Update, sign_update

PROTOCOL = ROOT / 'applications/PROTOCOL-QWEN35-HYBRID-09.json'
PREP = ROOT / 'results/qwen35-hybrid-09-prepared'
ARMS = ('original', 'full_donor', 'conv_donor', 'recurrent_donor', 'kv_donor', 'conv_recurrent_donor')

def group(name):
    if name.startswith('past_conv.'):
        return 'conv'
    if name.startswith('past_recurrent.'):
        return 'recurrent'
    assert name.startswith('past_key_values.')
    return 'kv'

def groups_for(arm):
    return {'original': set(), 'full_donor': {'conv', 'recurrent', 'kv'},
        'conv_donor': {'conv'}, 'recurrent_donor': {'recurrent'}, 'kv_donor': {'kv'},
        'conv_recurrent_donor': {'conv', 'recurrent'}}[arm]

def mix(original, donor, arm):
    selected = groups_for(arm)
    return {n: donor[n] if group(n) in selected else original[n] for n in STATE_NAMES}

def score(answer, expected):
    return {'correct': answer.strip().casefold() == expected.casefold(),
            'exact_case_correct': answer.strip() == expected}

def frozen_inputs():
    files = [PROTOCOL, Path(__file__), ROOT / 'applications/qwen35_adapter_v9.py',
        ROOT / 'applications/commitment_lab.py', ROOT / 'applications/test_qwen35_hybrid_v9.py',
        ROOT / 'reviews/qwen35-baseline-09/BASELINE-DECISION.md',
        MODEL / 'GRAPH-INTAKE-RECEIPT.json', MODEL / 'WEIGHTS-INTAKE-RECEIPT.json',
        ROOT / 'runtime-dependencies/onnxruntime-1.29.0/INTAKE-RECEIPT.json']
    return {p.relative_to(ROOT).as_posix(): sha(p) for p in files}

def prepare():
    protocol = json.loads(PROTOCOL.read_text())
    assert protocol['arms'] == list(ARMS)
    tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
    cases = []
    for setting in protocol['settings']:
        for pair_index, names in enumerate(protocol['name_pairs']):
            family = f'{setting}-pair-{pair_index}'
            for color in protocol['colors']:
                for direction in (0, 1):
                    giver, recipient = names[direction], names[1 - direction]
                    story = protocol['story_template'].format(setting=setting, giver=giver,
                        recipient=recipient, color=color)
                    branches = {}; prefix = None; prefix_ids = None
                    for query, question in protocol['questions'].items():
                        full = render(protocol['system'], story + '\n' + question)
                        start = full.index(question)
                        current_prefix = full[:start]
                        ids = tokenizer.encode(current_prefix, add_special_tokens=False).ids
                        suffix = full[start:]
                        tail = tokenizer.encode(suffix, add_special_tokens=False).ids
                        assert tokenizer.encode(full, add_special_tokens=False).ids == ids + tail
                        assert len(ids) + len(tail) <= 160
                        if prefix is not None:
                            assert current_prefix == prefix and ids == prefix_ids
                        prefix, prefix_ids = current_prefix, ids
                        branches[query] = {'text': suffix, 'ids': tail}
                    cases.append({'id': f'{family}/{color}/{direction}', 'family': family,
                        'direction': direction, 'names': names, 'giver': giver, 'recipient': recipient,
                        'color': color, 'prefix': prefix, 'prefix_ids': prefix_ids,
                        'branches': branches, 'opposite': f'{family}/{color}/{1-direction}'})
    assert len(cases) == 16
    by_id = {c['id']: c for c in cases}
    for case in cases:
        opposite = by_id[case['opposite']]
        assert len(case['prefix_ids']) == len(opposite['prefix_ids'])
        assert case['branches'] == opposite['branches']
    PREP.mkdir()
    write(PREP / 'CASES.json', cases)
    write(PREP / 'INPUT-FREEZE.json', frozen_inputs())
    write(PREP / 'PREPARATION-RECEIPT.json', {'status': 'FROZEN_BEFORE_FOLLOWUP_INFERENCE',
        'case_count': 16, 'family_count': 4, 'planned_arm_answers': 288,
        'planned_fresh_workflow_answers': 12, 'case_sha256': sha(PREP / 'CASES.json'),
        'input_sha256': sha(PREP / 'INPUT-FREEZE.json'), 'new_model_fitting': False})
    print((PREP / 'PREPARATION-RECEIPT.json').read_text())

def answer_from_state(decoder, state, suffix):
    before = state_digest(state)
    logits, current = decoder.advance(suffix, state)
    first = logits.copy(); tokens = []
    for j in range(4):
        token = int(np.argmax(logits)); tokens.append(token)
        if token in decoder.eos_ids or j == 3:
            break
        logits, current = decoder.advance([token], current)
    assert state_digest(state) == before
    top = int(np.argmax(first)); ranks = np.argsort(first)[-5:][::-1]
    result = {'generated_ids': tokens,
        'answer': decoder.tokenizer.decode(tokens, skip_special_tokens=True).strip(),
        'stopped_on_eos': tokens[-1] in decoder.eos_ids, 'first_token_id': top,
        'first_token': decoder.tokenizer.decode([top], skip_special_tokens=False),
        'first_logit_sha256': hashlib_array(first),
        'first_top5': [{'id': int(i), 'text': decoder.tokenizer.decode([int(i)], skip_special_tokens=False),
                       'logit': float(first[i])} for i in ranks]}
    return result, first

def hashlib_array(array):
    import hashlib
    return hashlib.sha256(np.ascontiguousarray(array).tobytes()).hexdigest()

def annotate(result, case, query, arm):
    original = case[query]
    swapped = case['recipient'] if query == 'giver' else case['giver'] if query == 'recipient' else case['color']
    return dict(result, case=case['id'], family=case['family'], direction=case['direction'],
        color=case['color'], query=query, arm=arm, original_target=original, swapped_target=swapped,
        original_score=score(result['answer'], original), swapped_score=score(result['answer'], swapped))

def select_authorized(store, case_id, original, donor):
    allowed = [command for obj, command in store.scope if obj == case_id]
    assert len(allowed) == 1
    command = allowed[0]
    arm = {'swap': 'full_donor', 'stop_future_edits': 'full_donor',
           'restore_kv': 'conv_recurrent_donor', 'restore_all': 'original'}[command]
    return mix(original, donor, arm), arm

def run(index):
    assert frozen_inputs() == json.loads((PREP / 'INPUT-FREEZE.json').read_text())
    assert sha(PREP / 'CASES.json') == json.loads((PREP / 'PREPARATION-RECEIPT.json').read_text())['case_sha256']
    cases = json.loads((PREP / 'CASES.json').read_text()); case = cases[index]
    opposite = next(c for c in cases if c['id'] == case['opposite'])
    output = ROOT / f'results/qwen35-hybrid-09-case-{index}'
    output.mkdir(); write(output / 'INPUT-FREEZE.json', frozen_inputs())
    guard = ResourceGuard(output)
    try:
        decoder = Decoder()
        original_logits, original = decoder.advance(case['prefix_ids'])
        donor_logits, donor = decoder.advance(opposite['prefix_ids'])
        original_hashes, donor_hashes = state_digest(original), state_digest(donor)
        differences = {n: float(np.max(np.abs(original[n] - donor[n]))) for n in STATE_NAMES}
        write(output / 'PREFIX-STATE.json', {'case': case['id'], 'donor': opposite['id'],
            'prefix_tokens': len(case['prefix_ids']), 'original': original_hashes, 'donor_hashes': donor_hashes,
            'max_abs_differences': differences, 'tensor_bytes': {n: original[n].nbytes for n in STATE_NAMES},
            'original_prefix_logit_sha256': hashlib_array(original_logits),
            'donor_prefix_logit_sha256': hashlib_array(donor_logits)})
        baseline = {}; measured = {}; support = []; answers = []
        for arm in ARMS:
            current = mix(original, donor, arm)
            for n in STATE_NAMES:
                from_donor = group(n) in groups_for(arm)
                support.append({'case': case['id'], 'arm': arm, 'tensor': n, 'group': group(n),
                    'origin': 'donor' if from_donor else 'original',
                    'sha256': donor_hashes[n] if from_donor else original_hashes[n],
                    'bytes': current[n].nbytes,
                    'max_abs_difference_from_original': differences[n] if from_donor else 0.0})
            for query, branch in case['branches'].items():
                result, logits = answer_from_state(decoder, current, branch['ids'])
                if arm == 'original':
                    baseline[query] = logits
                result['max_abs_logit_change_from_original'] = float(np.max(np.abs(logits - baseline[query])))
                row = annotate(result, case, query, arm)
                row['input_state_hashes'] = state_digest(current)
                answers.append(row); measured[(arm, query)] = result
                assert decoder.calls < 160
        write(output / 'ANSWERS.json', answers)
        write(output / 'STATE-SUPPORT.json', support)
        events = []; workflow = []
        if index == 0:
            store = CommitmentStore(); obj = case['id']
            stop = sign_update(2, frozenset({(obj, 'stop_future_edits')}))
            sequence = [('swap', sign_update(1, frozenset({(obj, 'swap')}))),
                ('stop_future_edits', stop),
                ('forged_restore_all', Update(3, frozenset({(obj, 'restore_all')}), 'forged')),
                ('restore_kv', sign_update(3, frozenset({(obj, 'restore_kv')}))),
                ('restore_all', sign_update(4, frozenset({(obj, 'restore_all')}))),
                ('old_stop_replay', stop)]
            for stage, update in sequence:
                accepted = store.accept(update)
                current, selected_arm = select_authorized(store, obj, original, donor)
                before_calls = decoder.calls
                if accepted:
                    for query, branch in case['branches'].items():
                        result, logits = answer_from_state(decoder, current, branch['ids'])
                        assert result['first_logit_sha256'] == measured[(selected_arm, query)]['first_logit_sha256']
                        row = annotate(result, case, query, stage)
                        row.update(authority_revision=store.revision, selected_state_arm=selected_arm,
                            same_state_control=selected_arm, first_logit_equals_control=True,
                            input_state_hashes=state_digest(current))
                        workflow.append(row)
                events.append({'stage': stage, 'update_revision': update.revision,
                    'update_scope': sorted(update.scope), 'signature': update.signature,
                    'accepted': accepted, 'store_revision': store.revision, 'store_scope': sorted(store.scope),
                    'selected_arm': selected_arm, 'calls_before': before_calls,
                    'calls_after': decoder.calls, 'fresh_decoder_calls': decoder.calls - before_calls})
            assert [e['accepted'] for e in events] == [True, True, False, True, True, False]
            write(output / 'AUTHORITY-EVENTS.json', events)
            write(output / 'WORKFLOW-ANSWERS.json', workflow)
        assert state_digest(original) == original_hashes and state_digest(donor) == donor_hashes
        assert decoder.calls < 160
        assert frozen_inputs() == json.loads((PREP / 'INPUT-FREEZE.json').read_text())
        resource = guard.finish()
        assert sum(p.stat().st_size for p in output.iterdir() if p.is_file()) < 3000000
        receipt = {'status': 'EXECUTED_PROSPECTIVE_TRANSFER_NOT_INDEPENDENTLY_REVIEWED',
            'case_index': index, 'case': case['id'], 'family': case['family'],
            'answer_readouts': len(answers), 'fresh_workflow_answers': len(workflow),
            'authority_events': len(events), 'native_decoder_calls': decoder.calls,
            'processed_tokens': decoder.tokens, 'prefix_readouts': 2,
            'all_supplied_states_unmutated': True, 'resource': resource,
            'files': {p.name: sha(p) for p in output.iterdir() if p.is_file()}}
        write(output / 'EXECUTION-RECEIPT.json', receipt)
        print(json.dumps({'case': case['id'], 'seconds': resource['elapsed_seconds'],
            'native_calls': decoder.calls, 'peak_commit_bytes': resource['peak_commit_bytes'],
            'answers': {a: [r['answer'] for r in answers if r['arm'] == a] for a in ARMS}}, indent=2), flush=True)
    except Exception:
        write(output / 'EXECUTION-FAILURE.json', {'traceback': traceback.format_exc(), 'resource': guard.finish()})
        raise

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('mode', choices=['prepare', 'run'])
    parser.add_argument('--case', type=int, choices=range(16), default=0)
    args = parser.parse_args()
    if args.mode == 'prepare':
        prepare()
    else:
        run(args.case)
