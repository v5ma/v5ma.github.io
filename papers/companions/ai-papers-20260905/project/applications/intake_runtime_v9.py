"""Install one hash-pinned wheel in the paper's isolated runtime directory."""
import hashlib
import importlib.metadata
import json
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAME = 'onnxruntime-1.29.0-cp312-cp312-win_amd64.whl'
URL = 'https://files.pythonhosted.org/packages/b4/80/5b28f1f1111210fc4a336ddbc6950f468ebf9a6a265420568f4f43fa33ce/' + NAME
EXPECTED = '4acf2b4948b7ede87221ca6332344b8facdc8059d6ac751a7d367d04532b02dd'
SIZE = 14001407

def main():
    target = (ROOT / 'runtime-dependencies/onnxruntime-1.29.0').resolve()
    assert target.is_relative_to((ROOT / 'runtime-dependencies').resolve())
    assert not target.exists(), 'Do not overwrite an existing runtime.'
    target.mkdir()
    archive = target / NAME
    started = time.monotonic()
    original = importlib.metadata.version('onnxruntime')
    deps = {n: importlib.metadata.version(n) for n in ('numpy', 'flatbuffers', 'packaging', 'protobuf')}
    assert original == '1.20.1'
    n = 0
    digest = hashlib.sha256()
    with urllib.request.urlopen(URL, timeout=20) as response, archive.open('xb') as out:
        while True:
            block = response.read(min(1048576, SIZE - n + 1))
            if not block:
                break
            n += len(block)
            assert n <= SIZE and time.monotonic() - started < 60
            digest.update(block)
            out.write(block)
    assert n == SIZE and digest.hexdigest() == EXPECTED
    extracted = []
    with zipfile.ZipFile(archive) as wheel:
        infos = wheel.infolist()
        assert len(infos) < 2000 and sum(i.file_size for i in infos) < 100000000
        for info in infos:
            destination = (target / info.filename).resolve()
            assert destination.is_relative_to(target) and not destination.exists()
            assert not info.filename.startswith(('/', '\\'))
            wheel.extract(info, target)
            if not info.is_dir():
                with destination.open('rb') as stream:
                    extracted.append({'path': info.filename, 'bytes': info.file_size,
                        'sha256': hashlib.file_digest(stream, 'sha256').hexdigest()})
    sys.path.insert(0, str(target))
    import onnxruntime as ort
    from onnxruntime.capi import _pybind_state
    required = {'LinearAttention', 'CausalConvWithState', 'GroupQueryAttention',
                'MatMulNBits', 'GatherBlockQuantized'}
    cpu = {k.op_name for k in _pybind_state.get_all_opkernel_def()
           if k.provider == 'CPUExecutionProvider'}
    assert ort.__version__ == '1.29.0' and required <= cpu
    assert Path(ort.__file__).resolve().is_relative_to(target)
    receipt = {'status': 'ISOLATED_RUNTIME_CPU_OPERATORS_VERIFIED_NOT_MODEL_INFERENCE',
        'date': '2026-09-05', 'url': URL, 'wheel_bytes': n, 'wheel_sha256': EXPECTED,
        'script_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'original_runtime_version': original, 'isolated_runtime_version': ort.__version__,
        'isolated_runtime_path': ort.__file__, 'shared_install_modified': False,
        'existing_dependencies': deps, 'required_cpu_operations_found': sorted(required),
        'elapsed_seconds': time.monotonic() - started, 'extracted_files': extracted}
    with (target / 'INTAKE-RECEIPT.json').open('x', encoding='utf-8') as out:
        json.dump(receipt, out, indent=2)
        out.write('\n')
    print(json.dumps({k: v for k, v in receipt.items() if k != 'extracted_files'}, indent=2))

if __name__ == '__main__':
    main()
