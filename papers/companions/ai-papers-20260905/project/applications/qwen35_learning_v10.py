"""Prospective, train-only kernel repair of native hybrid-model attention state."""
import argparse
import hashlib
import json
from pathlib import Path
import traceback
from qwen35_adapter_v9 import (ROOT, MODEL, STATE_NAMES, Decoder, ResourceGuard,
    render, sha, state_digest, write, np, Tokenizer)
from qwen35_hybrid_v9 import answer_from_state, annotate, hashlib_array
from commitment_lab import CommitmentStore, Update, sign_update

PROTOCOL = ROOT / 'applications/PROTOCOL-QWEN35-LEARNING-10.json'
PREP = ROOT / 'results/qwen35-learning-10-prepared'
FIT = ROOT / 'results/qwen35-learning-10-fit'
KV = tuple(n for n in STATE_NAMES if n.startswith('past_key_values.'))
ARMS = ('original', 'linear_ridge', 'rbf_ridge', 'yoked_ridge', 'slot_swap',
        'oracle_kv', 'full_donor', 'text_instruction')
LEARNED = ('linear_ridge', 'rbf_ridge', 'yoked_ridge')
WINDOW = 9

def inputs():
    paths = [PROTOCOL, Path(__file__), ROOT / 'applications/test_qwen35_learning_v10.py',
        ROOT / 'sources/QWEN35-LEARNED-REPAIR-METHODS-10.md',
        ROOT / 'applications/qwen35_adapter_v9.py', ROOT / 'applications/qwen35_hybrid_v9.py',
        ROOT / 'applications/commitment_lab.py',
        MODEL / 'GRAPH-INTAKE-RECEIPT.json', MODEL / 'WEIGHTS-INTAKE-RECEIPT.json',
        ROOT / 'runtime-dependencies/onnxruntime-1.29.0/INTAKE-RECEIPT.json']
    return {p.relative_to(ROOT).as_posix(): sha(p) for p in paths}

def save_array(path, values):
    with Path(path).open('xb') as stream:
        np.save(stream, values, allow_pickle=False)

def save_model(path, arrays):
    with Path(path).open('xb') as stream:
        np.savez(stream, **arrays)

def build_cases(protocol, split, tokenizer):
    cases = []
    for context_index, context in enumerate(protocol[split + '_contexts']):
        for pair_index, names in enumerate(protocol[split + '_name_pairs']):
            family = f'{split}/context-{context_index}/pair-{pair_index}'
            for color in protocol[split + '_colors']:
                for direction in (0, 1):
                    giver, recipient = names[direction], names[1-direction]
                    story = protocol['story_template'].format(**context, giver=giver,
                        recipient=recipient, color=color)
                    branches = {}; prefix = None
                    for query, question in protocol['questions'].items():
                        full = render(protocol['system'], story + '\n' + question)
                        cut = full.index(question)
                        p = full[:cut]; suffix = full[cut:]
                        pids = tokenizer.encode(p, add_special_tokens=False).ids
                        sids = tokenizer.encode(suffix, add_special_tokens=False).ids
                        assert tokenizer.encode(full, add_special_tokens=False).ids == pids + sids
                        assert len(pids) + len(sids) < 150
                        assert prefix is None or prefix == p
                        prefix = p
                        branches[query] = {'ids': sids, 'text': suffix}
                    encoding = tokenizer.encode(prefix, add_special_tokens=False)
                    positions = []
                    for name in (giver, recipient):
                        start = prefix.index(story) + story.index(name)
                        end = start + len(name)
                        hits = [i for i, (a, b) in enumerate(encoding.offsets) if a < end and b > start]
                        assert len(hits) == 1
                        positions.append(hits[0])
                    assert len(encoding.ids) - positions[0] == WINDOW
                    assert positions[1] - positions[0] == 6
                    instruction_user = story + '\n' + protocol['text_instruction'] + '\n'
                    text_full = render(protocol['system'], instruction_user + protocol['questions']['giver'])
                    text_prefix = text_full[:text_full.index(protocol['questions']['giver'])]
                    text_ids = tokenizer.encode(text_prefix, add_special_tokens=False).ids
                    for branch in branches.values():
                        assert tokenizer.encode(text_prefix + branch['text'], add_special_tokens=False).ids == text_ids + branch['ids']
                        assert len(text_ids) + len(branch['ids']) < 150
                    cases.append({'id': f'{family}/{color}/{direction}', 'split': split, 'family': family,
                        'context': context, 'names': names, 'color': color, 'direction': direction,
                        'giver': giver, 'recipient': recipient, 'story': story, 'prefix': prefix,
                        'prefix_ids': encoding.ids, 'name_positions': positions, 'window_start': positions[0],
                        'branches': branches, 'text_prefix': text_prefix, 'text_prefix_ids': text_ids,
                        'opposite': f'{family}/{color}/{1-direction}'})
    return cases

def prepare():
    p = json.loads(PROTOCOL.read_text())
    assert p['arms'] == list(ARMS)
    tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
    train = build_cases(p, 'train', tokenizer); test = build_cases(p, 'test', tokenizer)
    assert len(train) == 24 and len(test) == 16
    assert set(sum(p['train_name_pairs'], [] )).isdisjoint(sum(p['test_name_pairs'], []))
    assert set(p['train_colors']).isdisjoint(p['test_colors'])
    for cases in (train, test):
        by_id = {c['id']: c for c in cases}
        for case in cases:
            other = by_id[case['opposite']]
            assert case['name_positions'] == other['name_positions']
            assert case['branches'] == other['branches']
            assert len(case['prefix_ids']) == len(other['prefix_ids'])
    permutation = np.random.Generator(np.random.PCG64(20260905)).permutation(24).tolist()
    PREP.mkdir()
    write(PREP / 'TRAIN-CASES.json', train); write(PREP / 'TEST-CASES.json', test)
    write(PREP / 'YOKED-PERMUTATION.json', permutation)
    write(PREP / 'INPUT-FREEZE.json', inputs())
    write(PREP / 'PREPARATION-RECEIPT.json', {'status': 'FROZEN_BEFORE_TRAINING_AND_TEST_INFERENCE',
        'training_prefixes': 24, 'test_prefixes': 16, 'primary_test_answers': 384,
        'fresh_workflow_answers': 9, 'window_shape': [12, 9, 512],
        'files': {x.name: sha(x) for x in PREP.iterdir() if x.is_file()}})
    print((PREP / 'PREPARATION-RECEIPT.json').read_text(), flush=True)

def verify_prepared():
    assert inputs() == json.loads((PREP / 'INPUT-FREEZE.json').read_text())
    receipt = json.loads((PREP / 'PREPARATION-RECEIPT.json').read_text())
    assert all(sha(PREP / name) == digest for name, digest in receipt['files'].items())

def extract(state, start):
    assert all(state[n].shape == (1, 2, start + WINDOW, 256) for n in KV)
    return np.stack([state[n][0, :, start:, :].transpose(1, 0, 2).reshape(WINDOW, 512) for n in KV])

def replace_window(original, start, window):
    assert window.shape == (12, WINDOW, 512) and np.isfinite(window).all()
    current = dict(original)
    for i, name in enumerate(KV):
        current[name] = original[name].copy()
        current[name][0, :, start:, :] = window[i].reshape(WINDOW, 2, 256).transpose(1, 0, 2)
        assert np.array_equal(current[name][:, :, :start, :], original[name][:, :, :start, :])
    return current

def train_batch(index):
    verify_prepared()
    all_cases = json.loads((PREP / 'TRAIN-CASES.json').read_text())
    cases = all_cases[index*4:index*4+4]
    assert len(cases) == 4
    output = ROOT / f'results/qwen35-learning-10-train-{index}'
    output.mkdir(); guard = ResourceGuard(output)
    try:
        decoder = Decoder(); values = []; states = []; answers = []
        for case in cases:
            logits, original = decoder.advance(case['prefix_ids'])
            values.append(extract(original, case['window_start']))
            states.append({'case': case['id'], 'state_hashes': state_digest(original),
                'prefix_logit_sha256': hashlib_array(logits), 'window_sha256': hashlib_array(values[-1])})
            for query, branch in case['branches'].items():
                result, _ = answer_from_state(decoder, original, branch['ids'])
                answers.append(annotate(result, case, query, 'original'))
        save_array(output / 'WINDOWS.npy', np.stack(values))
        write(output / 'PREFIXES.json', states); write(output / 'ANSWERS.json', answers)
        verify_prepared()
        write(output / 'RECEIPT.json', {'status': 'TRAINING_FEATURES_COLLECTED_NOT_TESTED',
            'batch': index, 'case_ids': [c['id'] for c in cases],
            'prepared_receipt_sha256': sha(PREP / 'PREPARATION-RECEIPT.json'),
            'native_calls': decoder.calls, 'tokens': decoder.tokens, 'answers': len(answers),
            'resource': guard.finish(), 'files': {x.name: sha(x) for x in output.iterdir() if x.is_file()}})
        print(json.dumps({'batch': index, 'calls': decoder.calls,
            'correct_training_answers': sum(r['original_score']['correct'] for r in answers),
            'total_training_answers': len(answers)}), flush=True)
    except Exception:
        write(output / 'FAILURE.json', {'traceback': traceback.format_exc(), 'resource': guard.finish()})
        raise

def squared_distances(left, right):
    return np.maximum(0, (np.sum(left*left, axis=1)[:, None]
        + np.sum(right*right, axis=1)[None, :] - 2 * left @ right.T) / left.shape[1])

def fit_arrays(raw, opposite, permutation, ridge=0.001):
    x = raw.reshape(len(raw), -1).astype(np.float64)
    target = x[opposite]
    mu = x.mean(axis=0)
    centered = (x - mu).reshape(len(raw), 12, WINDOW, 512)
    scales = np.maximum(1e-8, np.sqrt(np.mean(centered*centered, axis=(0, 2, 3))))
    scale = np.repeat(scales, WINDOW*512)
    z = (x-mu) / scale
    y = (target-x) / scale
    gram = (z @ z.T) / z.shape[1]
    distances = squared_distances(z, z)
    bandwidth2 = float(np.median(distances[distances > 1e-12]))
    assert bandwidth2 > 0
    rbf = np.exp(-distances / (2*bandwidth2))
    identity = np.eye(len(raw))
    linear_a = np.linalg.solve(gram + ridge*identity, y)
    rbf_a = np.linalg.solve(rbf + ridge*identity, y)
    yoked_a = np.linalg.solve(gram + ridge*identity, y[permutation])
    cap = float(2*np.max(np.linalg.norm(y, axis=1)))
    model = {'mu': mu, 'scales': scales, 'z': z, 'linear_a': linear_a,
        'rbf_a': rbf_a, 'yoked_a': yoked_a, 'bandwidth2': np.asarray(bandwidth2),
        'cap': np.asarray(cap), 'permutation': np.asarray(permutation, dtype=np.int64)}
    stats = {'feature_dimension': x.shape[1], 'training_rows': len(raw),
        'scale_values': scales.tolist(), 'bandwidth_squared': bandwidth2,
        'ridge_lambda': ridge, 'standardized_cap': cap,
        'raw_mean_delta_norm': float(np.linalg.norm((target-x).mean(axis=0))),
        'mean_delta_symmetry_max_abs': float(np.max(np.abs((target-x).mean(axis=0)))),
        'linear_training_delta_rmse': float(np.sqrt(np.mean((gram@linear_a-y)**2))),
        'rbf_training_delta_rmse': float(np.sqrt(np.mean((rbf@rbf_a-y)**2))),
        'yoked_training_to_true_delta_rmse': float(np.sqrt(np.mean((gram@yoked_a-y)**2))),
        'stored_float64_scalars': sum(a.size for a in model.values() if a.dtype == np.float64),
        'new_native_calls_during_fit': 0}
    return model, stats

def fit():
    verify_prepared()
    cases = json.loads((PREP / 'TRAIN-CASES.json').read_text())
    raw = []; source_receipts = {}
    for i in range(6):
        folder = ROOT / f'results/qwen35-learning-10-train-{i}'
        receipt = json.loads((folder / 'RECEIPT.json').read_text())
        assert receipt['prepared_receipt_sha256'] == sha(PREP / 'PREPARATION-RECEIPT.json')
        assert all(sha(folder / name) == digest for name, digest in receipt['files'].items())
        assert receipt['case_ids'] == [c['id'] for c in cases[i*4:i*4+4]]
        source_receipts[str(folder.relative_to(ROOT)) + '/RECEIPT.json'] = sha(folder / 'RECEIPT.json')
        raw.append(np.load(folder / 'WINDOWS.npy', allow_pickle=False))
    indices = {c['id']: i for i, c in enumerate(cases)}
    opposite = [indices[c['opposite']] for c in cases]
    permutation = json.loads((PREP / 'YOKED-PERMUTATION.json').read_text())
    FIT.mkdir(); guard = ResourceGuard(FIT)
    try:
        model, stats = fit_arrays(np.concatenate(raw), opposite, permutation)
        save_model(FIT / 'MODEL.npz', model); write(FIT / 'FIT-STATISTICS.json', stats)
        write(FIT / 'TRAINING-INPUTS.json', source_receipts)
        verify_prepared()
        write(FIT / 'RECEIPT.json', {'status': 'FROZEN_LEARNED_MAPS_BEFORE_HELDOUT_INFERENCE',
            'prepared_receipt_sha256': sha(PREP / 'PREPARATION-RECEIPT.json'),
            'resource': guard.finish(), 'test_case_semantics_used_by_fit': [],
            'test_case_file_hash_checked_for_freeze_integrity': True,
            'native_inference_during_fit': 0,
            'files': {x.name: sha(x) for x in FIT.iterdir() if x.is_file()}})
        print(json.dumps(stats), flush=True)
    except Exception:
        write(FIT / 'FAILURE.json', {'traceback': traceback.format_exc(), 'resource': guard.finish()})
        raise

def predict_window(model, window, arm):
    """No case names, query, target, donor state or decoder are accepted here."""
    assert arm in LEARNED and window.shape == (12, WINDOW, 512)
    scale = np.repeat(model['scales'], WINDOW*512)
    flat = window.reshape(-1).astype(np.float64)
    z = (flat-model['mu']) / scale
    if arm == 'rbf_ridge':
        weights = np.exp(-squared_distances(z[None, :], model['z'])[0] / (2*float(model['bandwidth2'])))
        delta = weights @ model['rbf_a']
    else:
        weights = (z @ model['z'].T) / z.size
        delta = weights @ model['linear_a' if arm == 'linear_ridge' else 'yoked_a']
    norm = float(np.linalg.norm(delta)); cap = float(model['cap'])
    factor = min(1.0, cap/max(norm, 1e-300))
    result = (flat + scale*delta*factor).reshape(window.shape).astype(np.float32)
    return result, {'standardized_uncapped_delta_norm': norm, 'cap_multiplier': factor,
        'prediction_sha256': hashlib_array(result), 'kernel_weights_sha256': hashlib_array(weights)}

def verify_fit():
    receipt = json.loads((FIT / 'RECEIPT.json').read_text())
    assert receipt['prepared_receipt_sha256'] == sha(PREP / 'PREPARATION-RECEIPT.json')
    assert all(sha(FIT / name) == digest for name, digest in receipt['files'].items())
    return receipt

def run(index):
    verify_prepared(); verify_fit()
    cases = json.loads((PREP / 'TEST-CASES.json').read_text()); case = cases[index]
    other = next(c for c in cases if c['id'] == case['opposite'])
    output = ROOT / f'results/qwen35-learning-10-test-{index}'
    output.mkdir(); guard = ResourceGuard(output)
    try:
        with np.load(FIT / 'MODEL.npz', allow_pickle=False) as data:
            model = {n: data[n] for n in data.files}
        decoder = Decoder()
        prefix_logits, original = decoder.advance(case['prefix_ids'])
        window = extract(original, case['window_start'])
        originals = state_digest(original); states = {'original': original}; predictions = {}
        for arm in LEARNED:
            predicted, details = predict_window(model, window, arm)
            states[arm] = replace_window(original, case['window_start'], predicted)
            predictions[arm] = details
        slot_window = window.copy()
        slot_window[:, [0, 6], :] = window[:, [6, 0], :]
        states['slot_swap'] = replace_window(original, case['window_start'], slot_window)
        # Commit learned state identities to disk BEFORE producing test donor or instruction state.
        write(output / 'POLICY-COMMITMENT.json', {'case': case['id'], 'fit_receipt_sha256': sha(FIT / 'RECEIPT.json'),
            'donor_inference_calls_at_commitment': 0, 'native_calls_so_far': decoder.calls,
            'original_prefix_logits_sha256': hashlib_array(prefix_logits),
            'original_state_hashes': originals, 'original_window_sha256': hashlib_array(window),
            'learned_predictions': predictions,
            'learned_state_hashes': {arm: state_digest(states[arm]) for arm in LEARNED}})
        donor_logits, donor = decoder.advance(other['prefix_ids'])
        _, text = decoder.advance(case['text_prefix_ids'])
        states['oracle_kv'] = {n: donor[n] if n in KV else original[n] for n in STATE_NAMES}
        states['full_donor'] = donor; states['text_instruction'] = text
        donor_window = extract(donor, case['window_start'])
        write(output / 'ORACLE-CONTROLS.json', {'donor': other['id'],
            'donor_state_hashes': state_digest(donor), 'donor_prefix_logits_sha256': hashlib_array(donor_logits),
            'text_state_hashes': state_digest(text), 'donor_window_sha256': hashlib_array(donor_window),
            'window_rmse_to_donor': {arm: float(np.sqrt(np.mean((extract(states[arm], case['window_start']).astype(np.float64)-donor_window)**2)))
                for arm in ('original',) + LEARNED + ('slot_swap', 'oracle_kv')}})
        answers = []; measured = {}; baselines = {}; support = []
        for arm in ARMS:
            hashes = state_digest(states[arm])
            for name in STATE_NAMES:
                support.append({'case': case['id'], 'arm': arm, 'tensor': name, 'sha256': hashes[name],
                    'same_as_original': hashes[name] == originals[name], 'bytes': states[arm][name].nbytes})
            if arm in LEARNED + ('slot_swap',):
                assert all(hashes[n] == originals[n] for n in STATE_NAMES if n not in KV)
            for query, branch in case['branches'].items():
                result, logits = answer_from_state(decoder, states[arm], branch['ids'])
                if arm == 'original':
                    baselines[query] = logits
                result['max_abs_logit_change_from_original'] = float(np.max(np.abs(logits-baselines[query])))
                answers.append(annotate(result, case, query, arm)); measured[(arm, query)] = result
                assert decoder.calls < 180
        write(output / 'ANSWERS.json', answers); write(output / 'STATE-SUPPORT.json', support)
        events = []; workflow = []
        if index == 0:
            store = CommitmentStore(); obj = case['id']
            stop = sign_update(2, frozenset({(obj, 'stop_future_edits')}))
            sequence = [('swap', sign_update(1, frozenset({(obj, 'swap')}))),
                ('stop_future_edits', stop),
                ('forged_restore', Update(3, frozenset({(obj, 'restore_all')}), 'forged')),
                ('restore_all', sign_update(3, frozenset({(obj, 'restore_all')}))),
                ('old_stop_replay', stop)]
            for stage, update in sequence:
                accepted = store.accept(update)
                command = next(command for item, command in store.scope if item == obj)
                selected = 'original' if command == 'restore_all' else 'linear_ridge'
                before = decoder.calls
                if accepted:
                    for query, branch in case['branches'].items():
                        result, _ = answer_from_state(decoder, states[selected], branch['ids'])
                        assert result['first_logit_sha256'] == measured[(selected, query)]['first_logit_sha256']
                        assert result['generated_ids'] == measured[(selected, query)]['generated_ids']
                        row = annotate(result, case, query, stage)
                        row.update(selected_state_arm=selected, authority_revision=store.revision)
                        workflow.append(row)
                events.append({'stage': stage, 'accepted': accepted, 'update_revision': update.revision,
                    'store_revision': store.revision, 'selected_state_arm': selected,
                    'fresh_native_calls': decoder.calls-before, 'selected_state_hashes': state_digest(states[selected])})
            assert [e['accepted'] for e in events] == [True, True, False, True, False]
            write(output / 'AUTHORITY-EVENTS.json', events); write(output / 'WORKFLOW-ANSWERS.json', workflow)
        assert state_digest(original) == originals
        verify_prepared(); verify_fit()
        resource = guard.finish()
        assert decoder.calls < 180
        write(output / 'RECEIPT.json', {'status': 'EXECUTED_FROZEN_HELDOUT_DEVELOPMENT',
            'case_index': index, 'case': case['id'], 'family': case['family'],
            'prepared_receipt_sha256': sha(PREP / 'PREPARATION-RECEIPT.json'),
            'fit_receipt_sha256': sha(FIT / 'RECEIPT.json'),
            'primary_answers': len(answers), 'fresh_workflow_answers': len(workflow),
            'authority_events': len(events), 'native_calls': decoder.calls, 'processed_tokens': decoder.tokens,
            'resource': resource, 'files': {x.name: sha(x) for x in output.iterdir() if x.is_file()}})
        print(json.dumps({'case': case['id'], 'seconds': resource['elapsed_seconds'], 'calls': decoder.calls,
            'peak_commit_bytes': resource['peak_commit_bytes'],
            'answers': {arm: [r['answer'] for r in answers if r['arm'] == arm] for arm in ARMS}}), flush=True)
    except Exception:
        write(output / 'FAILURE.json', {'traceback': traceback.format_exc(), 'resource': guard.finish()})
        raise

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['prepare', 'train', 'fit', 'test'])
    parser.add_argument('--index', type=int, default=0)
    args = parser.parse_args()
    if args.mode == 'prepare': prepare()
    elif args.mode == 'train':
        assert 0 <= args.index < 6
        train_batch(args.index)
    elif args.mode == 'fit': fit()
    else:
        assert 0 <= args.index < 16
        run(args.index)
