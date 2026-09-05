"""Prospective intent and attribute assay of frozen GPT-2 correction states."""
import argparse
import gc
import hashlib
import json
from pathlib import Path
import time
from gpt2_adapter_v5 import ROOT, DEPENDENCY, MODEL, Decoder, Tokenizer, np, sha
from gpt2_learning_v6 import edit, digest
from gpt2_receiver_v5 import write_json, write_csv
from commitment_lab import CommitmentStore, Update, Proposal, sign_update

PROTOCOL = ROOT / 'applications/PROTOCOL-GPT2-INTENT-07.json'
PREPARED = ROOT / 'results/gpt2-intent-07-prepared'
TRAIN = ROOT / 'results/gpt2-learning-06'
ARMS = ('no_edit', 'd6_internal', 'd6_task', 'd6_yoked', 'd6_ridge', 'reflection', 'reflection_capped', 'intent_blind_reflection', 'wrong_intent_reflection', 'current_donor_oracle', 'textual_update', 'revoked_reflection')
INPUTS = ('applications/PROTOCOL-GPT2-INTENT-07.json', 'applications/gpt2_intent_v7.py',
          'applications/test_gpt2_intent_v7.py',
          'applications/gpt2_adapter_v5.py', 'applications/gpt2_learning_v6.py', 'applications/gpt2_receiver_v5.py',
          'applications/commitment_lab.py', 'results/gpt2-learning-06/INPUT-FREEZE.json',
          'results/gpt2-learning-06/basis.npz', 'results/gpt2-learning-06/learned-parameters.npz',
          'results/gpt2-learning-06/TRAINING-RECEIPT.json')

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))

def create_output(path):
    result = Path(path).resolve()
    assert result.is_relative_to(ROOT / 'results')
    result.mkdir(parents=True, exist_ok=False)
    return result

def prepare():
    p = read(PROTOCOL)
    assert tuple(p['arms']) == ARMS
    tokenizer = Tokenizer.from_file(str(DEPENDENCY / 'tokenizer.json'))
    def ids(text):
        return tokenizer.encode(text).ids
    old_names = set()
    for family in read(ROOT / 'results/gpt2-receiver-05/FAMILIES.json'):
        old_names.update(family['names'])
    for pair in read(ROOT / 'applications/PROTOCOL-GPT2-LEARNING-06.json')['heldout_name_pairs']:
        old_names.update(pair)
    assert not old_names.intersection(name for pair in p['name_pairs'] for name in pair)
    families = []
    for ti, template in enumerate(p['templates']):
        for pair in p['name_pairs']:
            a, b = pair
            family = {'id': f'J{len(families):02d}', 'template': ti, 'names': pair, 'cases': []}
            for gi, giver in enumerate(pair):
                recipient = pair[1-gi]
                for ci, color in enumerate(p['colors']):
                    stem = template.format(a=a, b=b, giver=giver, color=color)
                    for query in p['queries']:
                        prompt = stem if query == 'recipient' else stem + p['color_completion'].format(recipient=recipient)
                        tokens = ids(prompt)
                        words = pair if query == 'recipient' else p['colors']
                        word_ids = [ids(' ' + name) for name in words]
                        assert all(len(token) == 1 for token in word_ids)
                        assert 2 <= len(tokens) <= 48
                        family['cases'].append({'id': f'{family["id"]}_g{gi}_c{ci}_{query}', 'family': family['id'], 'names': pair,
                            'giver': giver, 'recipient': recipient, 'color': color, 'query': query, 'text': prompt,
                            'ids': tokens, 'words': words, 'word_ids': [token[0] for token in word_ids],
                            'opposite': f'{family["id"]}_g{1-gi}_c{ci}_{query}'})
            for case in family['cases']:
                opposite = next(c for c in family['cases'] if c['id'] == case['opposite'])
                assert len(case['ids']) == len(opposite['ids'])
                assert case['ids'][-1] == opposite['ids'][-1]
            families.append(family)
    assert len(families) == 8 and sum(len(f['cases']) for f in families) == 64
    out = create_output(PREPARED)
    write_json(out / 'INPUT-FREEZE.json', {path: sha(ROOT / path) for path in INPUTS})
    write_json(out / 'FAMILIES.json', families)
    receipt = {'status': 'PREPARED_WITHOUT_MODEL_INFERENCE', 'families': 8, 'prompts': 64, 'cue_query_cases_per_arm': 128,
               'arms': list(ARMS), 'new_names_disjoint': True, 'token_lengths': sorted({len(c['ids']) for f in families for c in f['cases']}),
               'model_sha256': sha(MODEL), 'family_manifest_sha256': sha(out / 'FAMILIES.json'), 'frozen_before_evaluation': True}
    write_json(out / 'PREPARATION-RECEIPT.json', receipt)
    print(json.dumps(receipt, indent=2))

def reflection(h, basis, capped=False):
    vector = h.reshape(768).astype(np.float64)
    delta = -2 * (basis['R'].T @ (basis['R'] @ (vector - basis['mean'])))
    norm = float(np.linalg.norm(delta))
    assert np.all(np.isfinite(delta)) and norm < 10000
    scale = min(1., float(basis['cap']) / max(norm, 1e-12)) if capped else 1.
    value = (vector + scale * delta).astype(np.float32).reshape(1, 1, 768)
    return value, float(np.linalg.norm(value - h)), int(scale < 1.)

def authority(case, intent):
    store = CommitmentStore()
    current = sign_update(1, frozenset({(case['id'], intent)}))
    opposite = 'swap' if intent == 'keep' else 'keep'
    updates = [('current', current), ('forged_opposite', Update(2, frozenset({(case['id'], opposite)}), 'forged')),
               ('revoke', sign_update(2, frozenset())), ('old_replay', current)]
    rows = []; operation = None; revoked = None
    for stage, update in updates:
        accepted = store.accept(update)
        selected = 'swap' if (case['id'], 'swap') in store.scope else ('keep' if (case['id'], 'keep') in store.scope else 'none')
        if stage == 'forged_opposite':
            operation = selected
        if stage == 'old_replay':
            revoked = selected
        rows.append({'case': case['id'], 'intent': intent, 'stage': stage, 'update_revision': update.revision,
            'update_scope': json.dumps(sorted(update.scope)), 'signature': update.signature, 'accepted': int(accepted),
            'store_revision': store.revision, 'store_scope': json.dumps(sorted(store.scope)), 'operation': selected})
    assert operation == intent and revoked == 'none'
    return operation, revoked, rows

def select(arm, operation):
    if arm == 'revoked_reflection' or arm == 'no_edit':
        return 'none'
    if arm == 'intent_blind_reflection':
        return 'reflection'
    if arm == 'wrong_intent_reflection':
        return 'reflection' if operation == 'keep' else 'none'
    if operation != 'swap':
        return 'none'
    return {'current_donor_oracle': 'donor', 'textual_update': 'textual'}.get(arm, arm)

def measurement(decoder, result, case, name, norm=0., capped=0):
    z = result['logits'].astype(np.float64)
    lognorm = float(np.max(z)) + float(np.log(np.exp(z - np.max(z)).sum()))
    a, b = case['word_ids']
    top = int(np.argmax(z))
    return {'id': case['id'] + '/' + name, 'case': case['id'], 'family': case['family'], 'query': case['query'],
        'candidate': name, 'top_id': top, 'top_text': decoder.tokenizer.decode([top]),
        'word_a': case['words'][0], 'word_b': case['words'][1], 'word_a_id': a, 'word_b_id': b,
        'word_a_logit': float(z[a]), 'word_b_logit': float(z[b]), 'word_a_probability': float(np.exp(z[a]-lognorm)),
        'word_b_probability': float(np.exp(z[b]-lognorm)), 'edit_norm': norm, 'capped': capped}

def outcome(case, intent, arm, measured):
    expected = case['color'] if case['query'] == 'color' else (case['recipient'] if intent == 'keep' else case['giver'])
    index = measured['word_a'] == expected
    target_id = measured['word_a_id'] if index else measured['word_b_id']
    other_id = measured['word_b_id'] if index else measured['word_a_id']
    correct = measured['top_id'] == target_id
    invalid = measured['top_id'] not in (target_id, other_id)
    proposed = measured['top_text'].strip()
    store = CommitmentStore()
    scope = frozenset({(expected, 'send')})
    assert store.accept(sign_update(1, scope))
    # Only a recipient query proposes an action. Color is an off-target readout.
    executed = False if case['query'] != 'recipient' else store.commit(Proposal(store.revision, (proposed, 'send'), scope))
    prohibited = case['query'] == 'recipient' and not invalid and not correct
    return {'case': case['id'], 'family': case['family'], 'giver': case['giver'], 'color': case['color'], 'query': case['query'],
        'intent': intent, 'arm': arm, 'measurement_id': measured['id'], 'expected': expected, 'top_id': measured['top_id'],
        'top_text': measured['top_text'], 'correct': int(correct), 'invalid': int(invalid),
        'target_probability': measured['word_a_probability'] if index else measured['word_b_probability'],
        'contrast': (measured['word_a_logit']-measured['word_b_logit']) * (1 if index else -1),
        'edit_norm': measured['edit_norm'], 'capped': measured['capped'], 'prohibited_proposal': int(prohibited),
        'useful_execution': int(executed and correct), 'unauthorized_execution': int(executed and not correct)}

def run(batch, output):
    start = time.monotonic()
    assert batch in (0, 1)
    p = read(PROTOCOL)
    for path, value in read(PREPARED / 'INPUT-FREEZE.json').items():
        assert sha(ROOT / path) == value, path
    assert sha(PREPARED / 'FAMILIES.json') == read(PREPARED / 'PREPARATION-RECEIPT.json')['family_manifest_sha256']
    out = create_output(output)
    freeze = {path: sha(ROOT / path) for path in INPUTS}
    freeze.update({str((PREPARED / name).relative_to(ROOT)): sha(PREPARED / name) for name in ('FAMILIES.json', 'INPUT-FREEZE.json', 'PREPARATION-RECEIPT.json')})
    write_json(out / 'INPUT-FREEZE.json', freeze)
    decoder = Decoder(max_seconds=p['resource_limits']['seconds_per_batch'])
    basis = dict(np.load(TRAIN / 'basis.npz'))
    weights = dict(np.load(TRAIN / 'learned-parameters.npz'))
    expected_hashes = read(TRAIN / 'TRAINING-RECEIPT.json')['final_parameter_hashes']
    assert all(digest(value) == expected_hashes[name] for name, value in weights.items())
    families = read(PREPARED / 'FAMILIES.json')[batch*4:batch*4+4]
    measurements = []; outcomes = []; requests = []; controls = []; states = {}
    for family in families:
        cases = family['cases']
        base = {c['id']: decoder.prompt(c['ids']) for c in cases}
        observed = {}
        for case in cases:
            result = base[case['id']]
            row = measurement(decoder, result, case, 'none')
            measurements.append(row); observed[row['id']] = row
            states[row['id'] + '/a9'] = result['hooks']['a9'].copy()
            states[case['id'] + '/r8'] = result['hooks']['r8'].copy()
        for case in cases:
            original = base[case['id']]; h = original['hooks']['r8']
            candidates = {}
            for name, key in [('d6_internal', 'internal'), ('d6_task', 'task'), ('d6_yoked', 'yoked'), ('d6_ridge', 'supervised_ridge')]:
                value, norm, capped = edit(h, weights[key], basis)
                candidates[name] = (value, norm, int(capped))
            candidates['reflection'] = reflection(h, basis)
            candidates['reflection_capped'] = reflection(h, basis, capped=True)
            donor = base[case['opposite']]['hooks']['r8']
            candidates['donor'] = (donor, float(np.linalg.norm(donor-h)), 0)
            double, _, _ = reflection(candidates['reflection'][0], basis)
            h64 = h.reshape(768).astype(np.float64); t64 = candidates['reflection'][0].reshape(768).astype(np.float64)
            project = lambda v: v - basis['R'].T @ (basis['R'] @ v)
            involution_error = float(np.max(np.abs(double - h)))
            orthogonal_error = float(np.max(np.abs(project(t64-basis['mean']) - project(h64-basis['mean']))))
            assert involution_error < .0001 and orthogonal_error < .0001
            controls.append({'case': case['id'], 'double_reflection_max_error': involution_error, 'orthogonal_complement_max_error': orthogonal_error})
            for name, (value, norm, capped) in candidates.items():
                result = decoder.step(case['ids'][-1], original['before'], {'r8': value})
                row = measurement(decoder, result, case, name, norm, capped)
                measurements.append(row); observed[row['id']] = row
                states[row['id'] + '/a9'] = result['hooks']['a9'].copy()
            for intent in p['intents']:
                operation, revoked, events = authority(case, intent)
                requests.extend(events)
                for arm in ARMS:
                    which = select(arm, revoked if arm == 'revoked_reflection' else operation)
                    key = case['opposite'] + '/none' if which == 'textual' else case['id'] + '/' + which
                    outcomes.append(outcome(case, intent, arm, observed[key]))
            assert decoder.calls < p['resource_limits']['decoder_steps_per_batch']
        del base
        gc.collect()
        print('Completed', family['id'], 'steps', decoder.calls, flush=True)
    for path, value in freeze.items():
        assert sha(ROOT / path) == value
    assert all(digest(value) == expected_hashes[name] for name, value in weights.items())
    write_csv(out / 'measurements.csv', measurements)
    write_csv(out / 'outcomes.csv', outcomes)
    write_csv(out / 'request-events.csv', requests)
    write_csv(out / 'reflection-controls.csv', controls)
    np.savez(out / 'states.npz', **states)
    receipt = {'status': 'EXECUTED_NOT_INDEPENDENTLY_REVIEWED', 'batch': batch, 'families': [f['id'] for f in families],
        'base_prompts': 32, 'original_model_measurements': len(measurements), 'cue_arm_outcomes': len(outcomes),
        'request_events': len(requests), 'decoder_steps': decoder.calls, 'elapsed_seconds': time.monotonic()-start,
        'parameter_updates': 0, 'model_sha256': sha(MODEL), 'textual_readouts_reuse_executed_opposite_prompt': True,
        'numerical_threads': 1, 'base_weights_changed': False}
    write_json(out / 'EXECUTION-RECEIPT.json', receipt)
    assert sum(f.stat().st_size for f in out.iterdir() if f.is_file()) < p['resource_limits']['output_bytes_per_batch']
    print(json.dumps(receipt, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='mode', required=True)
    sub.add_parser('prepare')
    runp = sub.add_parser('run'); runp.add_argument('--batch', type=int, choices=(0,1), required=True); runp.add_argument('--output', required=True)
    args = parser.parse_args()
    if args.mode == 'prepare':
        prepare()
    else:
        run(args.batch, args.output)
