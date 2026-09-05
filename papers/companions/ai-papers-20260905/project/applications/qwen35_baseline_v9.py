"""Prepare before inference; smoke-test native state; run four small development batches."""
import argparse
import json
from pathlib import Path
import traceback
from qwen35_adapter_v9 import (ROOT, MODEL, STATE_NAMES, Decoder, ResourceGuard,
    render, sha, state_digest, write)
import numpy as np
from tokenizers import Tokenizer

PROTOCOL = ROOT / 'applications/PROTOCOL-QWEN35-BASELINE-09.json'
PREPARED = ROOT / 'results/qwen35-baseline-09-prepared'
SMOKE = ROOT / 'results/qwen35-baseline-09-smoke'

def inputs():
    paths = [PROTOCOL, Path(__file__), ROOT / 'applications/qwen35_adapter_v9.py',
        MODEL / 'GRAPH-INTAKE-RECEIPT.json', MODEL / 'WEIGHTS-INTAKE-RECEIPT.json',
        ROOT / 'runtime-dependencies/onnxruntime-1.29.0/INTAKE-RECEIPT.json']
    return {p.relative_to(ROOT).as_posix(): sha(p) for p in paths}

def prepare():
    protocol = json.loads(PROTOCOL.read_text())
    tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
    rows = []
    for story in protocol['stories']:
        for query, question in protocol['questions'].items():
            text = render(protocol['system'], story['story'] + '\n' + question)
            ids = tokenizer.encode(text, add_special_tokens=False).ids
            assert 1 <= len(ids) <= 160 and tokenizer.token_to_id('<|im_end|>') in ids
            rows.append({'id': story['id'] + ':' + query, 'story_id': story['id'],
                'query': query, 'prompt': text, 'tokens': ids, 'expected': story[query]})
    assert len(rows) == 12
    PREPARED.mkdir()
    write(PREPARED / 'FIXTURES.json', rows)
    write(PREPARED / 'INPUT-FREEZE.json', inputs())
    write(PREPARED / 'PREPARATION-RECEIPT.json', {'status': 'PREPARED_BEFORE_MODEL_INFERENCE',
        'fixtures_sha256': sha(PREPARED / 'FIXTURES.json'), 'input_freeze_sha256': sha(PREPARED / 'INPUT-FREEZE.json'),
        'cases': len(rows), 'min_tokens': min(len(r['tokens']) for r in rows),
        'max_tokens': max(len(r['tokens']) for r in rows), 'model_inference': False})
    print((PREPARED / 'PREPARATION-RECEIPT.json').read_text())

def execute(mode, batch):
    assert json.loads((PREPARED / 'INPUT-FREEZE.json').read_text()) == inputs()
    protocol = json.loads(PROTOCOL.read_text())
    rows = json.loads((PREPARED / 'FIXTURES.json').read_text())
    output = SMOKE if mode == 'smoke' else ROOT / f'results/qwen35-baseline-09-batch-{batch}'
    if mode != 'smoke':
        assert json.loads((SMOKE / 'EXECUTION-RECEIPT.json').read_text())['status'] == 'PASS_SMOKE_ONLY'
    output.mkdir()
    write(output / 'INPUT-FREEZE.json', inputs())
    guard = ResourceGuard(output)
    try:
        decoder = Decoder()
        if mode == 'smoke':
            case = rows[0]; ids = case['tokens']; middle = len(ids) // 2
            full_logits, full_state = decoder.advance(ids)
            _, partial = decoder.advance(ids[:middle])
            split_logits, split_state = decoder.advance(ids[middle:], partial)
            differences = {n: float(np.max(np.abs(full_state[n] - split_state[n]))) for n in STATE_NAMES}
            check = {'case': case['id'], 'prompt_tokens': len(ids), 'split_at': middle,
                'max_absolute_logit_error': float(np.max(np.abs(full_logits - split_logits))),
                'max_absolute_state_error': max(differences.values()), 'state_errors': differences,
                'full_top_token_id': int(np.argmax(full_logits)), 'split_top_token_id': int(np.argmax(split_logits)),
                'full_top_token': decoder.tokenizer.decode([int(np.argmax(full_logits))], skip_special_tokens=False),
                'expected_complete_answer': case['expected'], 'full_state_sha256': state_digest(full_state),
                'split_state_sha256': state_digest(split_state)}
            check['pass'] = (check['max_absolute_logit_error'] <= 0.005
                and check['max_absolute_state_error'] <= 0.005
                and check['full_top_token_id'] == check['split_top_token_id'])
            write(output / 'SMOKE.json', check)
            status = 'PASS_SMOKE_ONLY' if check['pass'] else 'FAIL_SPLIT_PREFIX_INTEGRITY'
            print(json.dumps({k: v for k, v in check.items() if k not in
                ('state_errors', 'full_state_sha256', 'split_state_sha256')}, indent=2), flush=True)
        else:
            story = protocol['stories'][batch]['id']
            selected = [r for r in rows if r['story_id'] == story]
            answers = []
            for row in selected:
                result = decoder.generate(row['tokens'])
                answer = dict(result, case_id=row['id'], expected=row['expected'],
                    correct=result['answer'] == row['expected'], query=row['query'])
                answers.append(answer)
                write(output / (row['query'] + '-READOUT.json'), answer)
                print(row['id'], repr(answer['answer']), answer['correct'], flush=True)
            status = 'EXECUTED_DEVELOPMENT_NOT_CONFIRMATORY'
        resource = guard.finish()
        assert sum(p.stat().st_size for p in output.iterdir() if p.is_file()) < 2000000
        write(output / 'EXECUTION-RECEIPT.json', {'status': status, 'mode': mode,
            'batch': batch if mode != 'smoke' else None, 'resource': resource,
            'native_decoder_calls': decoder.calls, 'processed_tokens': decoder.tokens,
            'source_hashes_unchanged': inputs() == json.loads((PREPARED / 'INPUT-FREEZE.json').read_text()),
            'files': {p.name: sha(p) for p in output.iterdir() if p.is_file()}})
        print((output / 'EXECUTION-RECEIPT.json').read_text(), flush=True)
    except Exception:
        write(output / 'EXECUTION-FAILURE.json', {'status': 'FAILED_PRESERVED',
            'traceback': traceback.format_exc(), 'resource': guard.finish()})
        raise

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['prepare', 'smoke', 'run'])
    parser.add_argument('--batch', type=int, choices=range(4), default=0)
    args = parser.parse_args()
    if args.mode == 'prepare':
        prepare()
    else:
        execute(args.mode, args.batch)
