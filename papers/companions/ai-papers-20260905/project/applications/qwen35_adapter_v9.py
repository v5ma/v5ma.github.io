"""Original pinned ONNX text decoder with its complete hybrid state; no graph edits."""
import os
for _key in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'NUMEXPR_NUM_THREADS'):
    os.environ[_key] = '1'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
import ctypes
from ctypes import wintypes
import hashlib
import json
from pathlib import Path
import sys
import threading
import time

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / 'model-dependencies/qwen35-onnx-opt-fafab72d'
sys.path.insert(0, str(ROOT / 'runtime-dependencies/onnxruntime-1.29.0'))
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

LINEAR = tuple(i for i in range(24) if i % 4 != 3)
ATTENTION = tuple(i for i in range(24) if i % 4 == 3)
STATE_NAMES = tuple(n for i in range(24) for n in
    ((f'past_conv.{i}', f'past_recurrent.{i}') if i in LINEAR else
     (f'past_key_values.{i}.key', f'past_key_values.{i}.value')))

def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def write(path, data):
    with Path(path).open('x', encoding='utf-8') as stream:
        json.dump(data, stream, indent=2)
        stream.write('\n')

def render(system, user):
    # Exact restricted two-message, plain-string, no-tools, nonthinking template branch.
    assert isinstance(system, str) and isinstance(user, str)
    assert system.strip() and user.strip()
    for marker in ('<|im_start|>', '<|im_end|>'):
        assert marker not in system and marker not in user
    return ('<|im_start|>system\n' + system.strip() + '<|im_end|>\n'
        + '<|im_start|>user\n' + user.strip() + '<|im_end|>\n'
        + '<|im_start|>assistant\n<think>\n\n</think>\n\n')

class MemoryStatus(ctypes.Structure):
    _fields_ = [('dwLength', wintypes.DWORD), ('dwMemoryLoad', wintypes.DWORD)] + [
        (n, ctypes.c_ulonglong) for n in ('ullTotalPhys', 'ullAvailPhys', 'ullTotalPageFile',
        'ullAvailPageFile', 'ullTotalVirtual', 'ullAvailVirtual', 'ullAvailExtendedVirtual')]

class ProcessMemory(ctypes.Structure):
    _fields_ = [('cb', wintypes.DWORD), ('PageFaultCount', wintypes.DWORD)] + [
        (n, ctypes.c_size_t) for n in ('PeakWorkingSetSize', 'WorkingSetSize',
        'QuotaPeakPagedPoolUsage', 'QuotaPagedPoolUsage', 'QuotaPeakNonPagedPoolUsage',
        'QuotaNonPagedPoolUsage', 'PagefileUsage', 'PeakPagefileUsage', 'PrivateUsage')]

def memory():
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    psapi = ctypes.WinDLL('psapi', use_last_error=True)
    kernel.GetCurrentProcess.restype = wintypes.HANDLE
    psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.POINTER(ProcessMemory), wintypes.DWORD]
    status = MemoryStatus(); status.dwLength = ctypes.sizeof(status)
    process = ProcessMemory(); process.cb = ctypes.sizeof(process)
    assert kernel.GlobalMemoryStatusEx(ctypes.byref(status))
    assert psapi.GetProcessMemoryInfo(kernel.GetCurrentProcess(), ctypes.byref(process), process.cb)
    return {'available_ram_bytes': status.ullAvailPhys, 'process_commit_bytes': process.PrivateUsage,
            'peak_process_commit_bytes': process.PeakPagefileUsage,
            'working_set_bytes': process.WorkingSetSize}

class ResourceGuard:
    """Monitors only this process, once per second; stops it on a declared bound."""
    def __init__(self, output, seconds=75, commit=5500000000):
        self.output = Path(output); self.seconds = seconds; self.commit = commit
        self.started = time.monotonic(); self.stop = threading.Event()
        self.initial = memory(); self.peak = self.initial['peak_process_commit_bytes']
        assert self.initial['available_ram_bytes'] >= 8000000000
        self.thread = threading.Thread(target=self.watch, daemon=True)
        self.thread.start()

    def watch(self):
        while not self.stop.wait(1):
            sample = memory(); self.peak = max(self.peak, sample['peak_process_commit_bytes'])
            elapsed = time.monotonic() - self.started
            if elapsed > self.seconds or sample['process_commit_bytes'] > self.commit:
                write(self.output / 'RESOURCE-FAILURE.json', {'status': 'STOPPED_RESOURCE_LIMIT',
                    'elapsed_seconds': elapsed, 'sample': sample, 'bounds':
                    {'seconds': self.seconds, 'commit_bytes': self.commit}})
                print('Stopped this model process at its declared resource limit.', file=sys.stderr, flush=True)
                os._exit(124)

    def finish(self):
        self.stop.set(); self.thread.join(timeout=2)
        final = memory()
        return {'elapsed_seconds': time.monotonic() - self.started, 'initial': self.initial,
            'final': final, 'peak_commit_bytes': max(self.peak, final['peak_process_commit_bytes']),
            'numerical_threads': 1, 'resource_guard': 'Own-process one-second watchdog'}

def state_digest(state):
    return {n: hashlib.sha256(np.ascontiguousarray(state[n]).tobytes()).hexdigest() for n in STATE_NAMES}

def empty_state():
    return {n: np.zeros((1, 6144, 3) if n.startswith('past_conv.') else
        (1, 16, 128, 128) if n.startswith('past_recurrent.') else (1, 2, 0, 256),
        dtype=np.float32) for n in STATE_NAMES}

def output_to_input(name):
    if name.startswith('present_conv.'):
        return 'past_conv.' + name[len('present_conv.'):]
    if name.startswith('present_recurrent.'):
        return 'past_recurrent.' + name[len('present_recurrent.'):]
    assert name.startswith('present.')
    return 'past_key_values.' + name[len('present.'):]

class Decoder:
    def __init__(self):
        assert ort.__version__ == '1.29.0'
        self.tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
        self.eos_ids = frozenset(json.loads((MODEL / 'generation_config.json').read_text())['eos_token_id'])
        assert self.eos_ids == {248046, 248044}
        options = ort.SessionOptions()
        options.intra_op_num_threads = 1; options.inter_op_num_threads = 1
        options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        options.enable_cpu_mem_arena = False; options.enable_mem_pattern = False
        options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
        self.embedding = ort.InferenceSession(str(MODEL / 'onnx/embed_tokens_q4.onnx'),
            sess_options=options, providers=['CPUExecutionProvider'])
        self.decoder = ort.InferenceSession(str(MODEL / 'onnx/decoder_model_merged_q4.onnx'),
            sess_options=options, providers=['CPUExecutionProvider'])
        assert {v.name for v in self.decoder.get_inputs()} == set(STATE_NAMES) | {
            'inputs_embeds', 'attention_mask', 'position_ids', 'num_logits_to_keep'}
        self.outputs = [v.name for v in self.decoder.get_outputs()]
        assert self.outputs[0] == 'logits' and len(self.outputs) == 49
        self.calls = 0; self.tokens = 0

    def ids(self, text):
        return self.tokenizer.encode(text, add_special_tokens=False).ids

    def advance(self, ids, state=None):
        assert 0 < len(ids) <= 160
        if state is None:
            state = empty_state()
        assert set(state) == set(STATE_NAMES)
        past = state['past_key_values.3.key'].shape[2]
        assert past + len(ids) <= 164
        before = state_digest(state)
        embeddings = self.embedding.run(None, {'input_ids': np.asarray([ids], dtype=np.int64)})[0]
        feeds = dict(state, inputs_embeds=embeddings,
            attention_mask=np.ones((1, past + len(ids)), dtype=np.int64),
            position_ids=np.broadcast_to(np.arange(past, past + len(ids), dtype=np.int64),
                (3, 1, len(ids))).copy(), num_logits_to_keep=np.asarray(1, dtype=np.int64))
        values = self.decoder.run(None, feeds)
        self.calls += 1; self.tokens += len(ids)
        assert before == state_digest(state), 'Native call mutated its supplied state.'
        logits = values[0][0, -1].copy()
        assert logits.shape == (248320,) and np.isfinite(logits).all()
        current = {output_to_input(n): a for n, a in zip(self.outputs[1:], values[1:])}
        assert set(current) == set(STATE_NAMES)
        for n, array in current.items():
            assert array.dtype == np.float32 and np.isfinite(array).all()
            if n.startswith('past_key_values.'):
                assert array.shape == (1, 2, past + len(ids), 256)
            else:
                assert array.shape == state[n].shape
        return logits, current

    def generate(self, ids, limit=4):
        assert 1 <= limit <= 4
        logits, state = self.advance(ids)
        first = logits.copy(); generated = []
        for index in range(limit):
            token = int(np.argmax(logits)); generated.append(token)
            if token in self.eos_ids or index + 1 == limit:
                break
            logits, state = self.advance([token], state)
        ranking = np.argsort(first)[-5:][::-1]
        return {'first_token_id': int(np.argmax(first)),
            'first_token': self.tokenizer.decode([int(np.argmax(first))], skip_special_tokens=False),
            'first_top5': [{'id': int(i), 'text': self.tokenizer.decode([int(i)], skip_special_tokens=False),
                'logit': float(first[i])} for i in ranking],
            'generated_token_ids': generated,
            'answer': self.tokenizer.decode(generated, skip_special_tokens=True).strip(),
            'stopped_on_eos': generated[-1] in self.eos_ids,
            'final_state_sha256': state_digest(state)}
