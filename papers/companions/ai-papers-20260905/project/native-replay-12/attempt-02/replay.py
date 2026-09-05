# Revision 02: preserve original site-package behavior; verify native child startup before inference.
"""Explicit, offline, exclusive-create Windows replay of one frozen Qwen case.

Plan/stage/check never import a model. Only run --execute launches inference.
No recursion, automatic downloads, old-script edits, or existing-output reuse.
"""
from __future__ import annotations

import argparse
import ctypes
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path, PurePosixPath
import platform
import shutil
import subprocess
import sys

MANIFEST_NAME = 'PACKAGE-MANIFEST-RELEASE-PREP-11.json'
MANIFEST_SHA = '3e7ddb90140c713b23f91a583f387b3614a1ac2187e2d0d8a9115b19055af452'
MODEL_REL = 'model-dependencies/qwen35-onnx-opt-fafab72d'
RUNTIME_REL = 'runtime-dependencies/onnxruntime-1.29.0'
ENVIRONMENT = {'python': '3.12.14', 'numpy': '2.4.6', 'tokenizers': '0.22.2',
               'flatbuffers': '25.12.19', 'packaging': '26.0', 'protobuf': '6.33.6'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def relative(name):
    require(isinstance(name, str) and name and name == name.strip(), 'Invalid relative path')
    require(not any(c in name for c in ('\\', ':', '*', '?', '\x00', '\n', '\r')), 'Unsafe relative path')
    parts = name.split('/')
    require(all(p and p not in ('.', '..') and not p.endswith((' ', '.')) for p in parts), 'Unsafe relative component')
    p = PurePosixPath(name)
    require(not p.is_absolute(), 'Absolute member path')
    return p


def at(root, name):
    relative(name)
    root = Path(root).resolve()
    candidate = (root / name).resolve()
    require(candidate.is_relative_to(root), 'Member escapes its explicit root')
    return candidate


def digest(p):
    with Path(p).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def load(p):
    require(Path(p).stat().st_size < 2_000_000, 'JSON size ceiling')
    return json.loads(Path(p).read_text(encoding='utf-8'))


def save(p, value):
    with Path(p).open('x', encoding='utf-8', newline='\n') as stream:
        stream.write(json.dumps(value, indent=2) + '\n')


def matches(p, row, full=True):
    require(Path(p).is_file() and Path(p).stat().st_size == row['bytes'], 'Missing/changed size: ' + str(p))
    if full:
        require(digest(p) == row['sha256'], 'Changed bytes: ' + str(p))


def build_plan(project, model, runtime, study, index):
    require(study in ('transfer', 'learned') and type(index) is int and 0 <= index < 16, 'Invalid study/case')
    roots = {key: str(Path(value).resolve()) for key, value in
             (('project', project), ('model', model), ('runtime', runtime))}
    manifest_path = at(roots['project'], MANIFEST_NAME)
    require(digest(manifest_path) == MANIFEST_SHA, 'Project manifest differs from reviewed snapshot')
    manifest = load(manifest_path)
    old = {r['path']: r for r in manifest['files']}
    require(len(old) == 918, 'Unexpected reviewed manifest count')
    selected = {}

    def add(group, source, dest, row):
        relative(source); relative(dest)
        require(type(row['bytes']) is int and 0 <= row['bytes'] <= 500_000_000, 'Invalid member size')
        require(len(row['sha256']) == 64 and all(c in '0123456789abcdef' for c in row['sha256']), 'Invalid member hash')
        item = {'group': group, 'source': source, 'path': dest, 'bytes': row['bytes'], 'sha256': row['sha256']}
        if dest in selected:
            require(selected[dest]['sha256'] == item['sha256'] and selected[dest]['bytes'] == item['bytes'], 'Conflicting destination')
        else:
            selected[dest] = item

    def project_file(name, dest=None):
        require(name in old, 'Input absent from reviewed manifest: ' + name)
        add('project', name, dest or name, old[name])
        return at(roots['project'], name)

    def project_json(name):
        p = project_file(name)
        matches(p, old[name])
        return load(p)

    prep = 'results/qwen35-learning-10-prepared' if study == 'learned' else 'results/qwen35-hybrid-09-prepared'
    inputs = project_json(prep + '/INPUT-FREEZE.json')
    require(len(inputs) <= 16, 'Unexpected input closure size')
    for name, expected in inputs.items():
        require(old[name]['sha256'] == expected, 'Input freeze differs from reviewed manifest')
        project_file(name)
    prepared = project_json(prep + '/PREPARATION-RECEIPT.json')
    if study == 'learned':
        for name, expected in prepared['files'].items():
            p = prep + '/' + name
            require(old[p]['sha256'] == expected, 'Prepared identity mismatch')
            project_file(p)
        fit = 'results/qwen35-learning-10-fit'
        fitted = project_json(fit + '/RECEIPT.json')
        require(fitted['prepared_receipt_sha256'] == old[prep + '/PREPARATION-RECEIPT.json']['sha256'], 'Fit ancestry mismatch')
        for name, expected in fitted['files'].items():
            p = fit + '/' + name
            require(old[p]['sha256'] == expected, 'Fitted-file identity mismatch')
            project_file(p)
        cases_name = prep + '/TEST-CASES.json'
        output = 'results/qwen35-learning-10-test-' + str(index)
        command = ['applications/qwen35_learning_v10.py', 'test', '--index', str(index)]
    else:
        cases_name = prep + '/CASES.json'
        require(old[cases_name]['sha256'] == prepared['case_sha256'], 'Prepared cases mismatch')
        project_file(cases_name)
        output = 'results/qwen35-hybrid-09-case-' + str(index)
        command = ['applications/qwen35_hybrid_v9.py', 'run', '--case', str(index)]
    cases = project_json(cases_name)
    require(len(cases) == 16, 'Unexpected case count')
    project_file(output + '/ANSWERS.json', 'reference/ANSWERS.json')
    if index == 0:
        project_file(output + '/WORKFLOW-ANSWERS.json', 'reference/WORKFLOW-ANSWERS.json')
    for receipt_name in ('GRAPH-INTAKE-RECEIPT.json', 'WEIGHTS-INTAKE-RECEIPT.json'):
        receipt = project_json(MODEL_REL + '/' + receipt_name)
        require(len(receipt['files']) <= 16, 'Model manifest size ceiling')
        for row in receipt['files']:
            add('model', row['path'], MODEL_REL + '/' + row['path'], row)
    runtime_receipt = project_json(RUNTIME_REL + '/INTAKE-RECEIPT.json')
    require(runtime_receipt['isolated_runtime_version'] == '1.29.0', 'Wrong runtime')
    require(len(runtime_receipt['extracted_files']) == 323, 'Unexpected runtime file closure')
    for row in runtime_receipt['extracted_files']:
        add('runtime', row['path'], RUNTIME_REL + '/' + row['path'], row)
    rows = sorted(selected.values(), key=lambda r: r['path'])
    require(len(rows) < 400 and sum(r['bytes'] for r in rows) < 800_000_000, 'Replay resource ceiling')
    require(output not in selected and not any(r['path'].startswith(output + '/') for r in rows), 'Original outputs selected as writable destination')
    missing = []
    for row in rows:
        p = at(roots[row['group']], row['source'])
        if not p.is_file() or p.stat().st_size != row['bytes']:
            missing.append(row['path'])
    return {'schema': 'san-native-replay-plan/v1', 'status': 'PLAN_NOT_HASH_OR_EXECUTION_PROOF',
            'study': study, 'case_index': index, 'case_id': cases[index]['id'], 'source_roots': roots,
            'source_manifest_sha256': MANIFEST_SHA, 'files': rows, 'missing_or_size_mismatch': missing,
            'command': command, 'output': output, 'expected_environment': ENVIRONMENT,
            'total_referenced_bytes': sum(r['bytes'] for r in rows),
            'project_copy_bytes': sum(r['bytes'] for r in rows if r['group'] == 'project'),
            'model_runs': 0, 'limits': 'One Windows case from frozen preparation/fitted maps; not fresh fitting, all studies, independent replication or release clearance'}


def validate_plan(plan):
    require(plan['schema'] == 'san-native-replay-plan/v1' and plan['source_manifest_sha256'] == MANIFEST_SHA, 'Unknown plan')
    require(plan['expected_environment'] == ENVIRONMENT, 'Environment contract changed')
    study = plan['study']; i = plan['case_index']
    require(study in ('transfer', 'learned') and type(i) is int and 0 <= i < 16, 'Invalid planned study/case')
    expected_command = (['applications/qwen35_learning_v10.py', 'test', '--index', str(i)] if study == 'learned'
                        else ['applications/qwen35_hybrid_v9.py', 'run', '--case', str(i)])
    expected_output = ('results/qwen35-learning-10-test-' if study == 'learned' else 'results/qwen35-hybrid-09-case-') + str(i)
    require(plan['command'] == expected_command and plan['output'] == expected_output, 'Arbitrary execution or output request rejected')
    rows = plan['files']
    require(0 < len(rows) < 400 and sum(r['bytes'] for r in rows) < 800_000_000, 'Plan bounds')
    require(len({r['path'] for r in rows}) == len(rows), 'Duplicate destination')
    for row in rows:
        relative(row['source']); relative(row['path'])
        require(row['group'] in ('project', 'model', 'runtime'), 'Unexpected source group')
        require(type(row['bytes']) is int and 0 <= row['bytes'] <= 500_000_000, 'Invalid member size')
        require(isinstance(row['sha256'], str) and len(row['sha256']) == 64 and
                all(c in '0123456789abcdef' for c in row['sha256']), 'Invalid member hash')
    return rows


def stage(plan, destination, dependency_mode='link'):
    rows = validate_plan(plan)
    require(dependency_mode in ('link', 'copy'), 'Unknown dependency mode')
    destination = Path(destination).resolve()
    require(not destination.exists() and destination.parent.is_dir(), 'Replay needs a new directory under an existing parent')
    roots = {k: Path(v).resolve() for k, v in plan['source_roots'].items()}
    require(all(destination != root and not root.is_relative_to(destination) for root in roots.values()), 'Replay may not contain/replace source roots')
    # Before writing, require the plan to equal a fresh manifest-derived plan.
    fresh = build_plan(roots['project'], roots['model'], roots['runtime'], plan['study'], plan['case_index'])
    require(plan == fresh and not fresh['missing_or_size_mismatch'], 'Stale, incomplete or changed plan')
    for row in rows:
        source = at(roots[row['group']], row['source'])
        matches(source, row)
        if dependency_mode == 'link' and row['group'] != 'project':
            require(source.stat().st_dev == destination.parent.stat().st_dev, 'Hard links need the same volume; choose explicit copy mode')
    destination.mkdir()
    save(destination / 'PLAN.json', plan)
    with at(roots['project'], MANIFEST_NAME).open('rb') as original, \
         (destination / MANIFEST_NAME).open('xb') as target:
        shutil.copyfileobj(original, target)
    # Failures intentionally leave the separate stage for inspection. Never delete,
    # merge, repair in place, or replace files in a previously created stage.
    for row in rows:
        source = at(roots[row['group']], row['source'])
        target = at(destination, row['path'])
        target.parent.mkdir(parents=True, exist_ok=True)
        if dependency_mode == 'link' and row['group'] != 'project':
            os.link(source, target)
        else:
            with source.open('rb') as source_stream, target.open('xb') as out:
                shutil.copyfileobj(source_stream, out, length=1024 * 1024)
        matches(target, row)
    record = {'status': 'STAGED_HASH_VERIFIED_NOT_EXECUTED', 'files': len(rows),
              'dependency_mode': dependency_mode, 'plan_sha256': digest(destination / 'PLAN.json'),
              'launcher_sha256': digest(__file__), 'native_runs': 0,
              'shared_dependency_bytes': dependency_mode == 'link',
              'limits': 'Hard-linked dependencies share source bytes; never edit them. No portability/inference acceptance yet.'}
    save(destination / 'STAGE-RECEIPT.json', record)
    return record


def environment():
    found = {'python': platform.python_version()}
    for name in ENVIRONMENT:
        if name != 'python':
            try:
                found[name] = importlib.metadata.version(name)
            except importlib.metadata.PackageNotFoundError:
                found[name] = None
    return {'platform': sys.platform, 'machine': platform.machine(), 'versions': found,
            'expected': ENVIRONMENT, 'version_match': found == ENVIRONMENT,
            'windows_x64': sys.platform == 'win32' and platform.machine().upper() in ('AMD64', 'X86_64'),
            'model_imported': False, 'native_runs': 0, 'assertions_enabled': sys.flags.optimize == 0}


def check_stage(destination):
    destination = Path(destination).resolve()
    plan = load(destination / 'PLAN.json'); rows = validate_plan(plan)
    receipt = load(destination / 'STAGE-RECEIPT.json')
    require(receipt['plan_sha256'] == digest(destination / 'PLAN.json') and
            receipt['launcher_sha256'] == digest(__file__), 'Stage or launcher identity changed')
    require(digest(destination / MANIFEST_NAME) == MANIFEST_SHA, 'Staged source anchor changed')
    # Re-derive the exact closure from pinned staged receipts, not a freely editable
    # expected-hash list. Old reference answers live under reference/, so the
    # planning-only missing list may name their original output paths here.
    derived = build_plan(destination, destination / MODEL_REL, destination / RUNTIME_REL,
                         plan['study'], plan['case_index'])
    require(derived['files'] == rows and derived['case_id'] == plan['case_id'], 'Staged plan differs from pinned evidence closure')
    for row in rows:
        matches(at(destination, row['path']), row)
    require(not at(destination, plan['output']).exists(), 'Case output already exists; preserve it')
    require(not (destination / 'RUN-REQUEST.json').exists(), 'Stage already attempted; preserve it')
    return plan


class WindowsSerialLease:
    """One launcher-owned process at a time per interactive Windows session."""
    def __enter__(self):
        require(sys.platform == 'win32', 'Frozen resource guard requires Windows')
        from ctypes import wintypes
        self.kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        self.kernel.CreateMutexW.argtypes = (ctypes.c_void_p, wintypes.BOOL, wintypes.LPCWSTR)
        self.kernel.CreateMutexW.restype = wintypes.HANDLE
        self.kernel.WaitForSingleObject.argtypes = (wintypes.HANDLE, wintypes.DWORD)
        self.kernel.WaitForSingleObject.restype = wintypes.DWORD
        self.kernel.ReleaseMutex.argtypes = (wintypes.HANDLE,)
        self.kernel.CloseHandle.argtypes = (wintypes.HANDLE,)
        self.handle = self.kernel.CreateMutexW(None, False, 'Local\\SAN_Native_Replay_12')
        require(self.handle, 'Cannot create serial replay lease')
        result = self.kernel.WaitForSingleObject(self.handle, 0)
        if result not in (0, 0x80):
            self.kernel.CloseHandle(self.handle)
            raise ValueError('Another native replay owns this launcher lease')
        return self

    def __exit__(self, *unused):
        self.kernel.ReleaseMutex(self.handle)
        self.kernel.CloseHandle(self.handle)


def compare_answers(current, reference):
    require(len(current) == len(reference), 'Answer count changed')
    def index(rows):
        result = {(r['case'], r['arm'], r['query']): r for r in rows}
        require(len(result) == len(rows), 'Duplicate answer identity')
        return result
    got, expected = index(current), index(reference)
    require(set(got) == set(expected), 'Answer coverage changed')
    fields = ('answer', 'generated_ids', 'stopped_on_eos', 'original_target', 'swapped_target',
              'original_score', 'swapped_score', 'first_logit_sha256')
    differences = [{'case': key[0], 'arm': key[1], 'query': key[2],
                    'different_fields': [f for f in fields if got[key][f] != expected[key][f]]}
                   for key in sorted(got) if any(got[key][f] != expected[key][f] for f in fields)]
    return {'answers': len(got), 'matched_selected_fields': not differences, 'differences': differences,
            'comparison_fields': list(fields), 'full_artifact_byte_equivalence': False}


def child_environment(env):
    """Probe exactly the interpreter startup used by the future native child."""
    command = [sys.executable, '-B', str(Path(__file__).resolve()), 'environment']
    p = subprocess.run(command, env=env, capture_output=True, text=True, timeout=15,
                       check=False, creationflags=subprocess.CREATE_NO_WINDOW)
    require(p.returncode == 0 and not p.stderr and len(p.stdout) < 20_000, 'Child environment probe failed')
    found = json.loads(p.stdout)
    require(found['windows_x64'] and found['version_match'] and found['assertions_enabled'],
            'Native child cannot reproduce the recorded environment')
    return found


def run_case(destination, execute=False):
    require(execute, 'Inference requires the explicit --execute flag')
    current_env = environment()
    require(current_env['windows_x64'] and current_env['version_match'], 'Recorded Windows/Python/dependency environment required')
    require(sys.flags.optimize == 0 and not os.environ.get('PYTHONOPTIMIZE'), 'Do not disable frozen assertion checks')
    destination = Path(destination).resolve()
    with WindowsSerialLease():
        plan = check_stage(destination)
        save(destination / 'RUN-REQUEST.json', {'environment': current_env, 'plan_sha256': digest(destination / 'PLAN.json'),
             'launcher_sha256': digest(__file__), 'explicit_execution': True, 'new_training_requested': False})
        env = dict(os.environ)
        for name in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'NUMEXPR_NUM_THREADS'):
            env[name] = '1'
        env['PYTHONDONTWRITEBYTECODE'] = '1'; env['TOKENIZERS_PARALLELISM'] = 'false'
        # Original experiments used the recorded interpreter's normal site packages.
        # Do not silently substitute the different no-user-site installation.
        env.pop('PYTHONNOUSERSITE', None)
        env.pop('PYTHONPATH', None); env.pop('PYTHONOPTIMIZE', None)
        child_env = child_environment(env)
        save(destination / 'CHILD-ENVIRONMENT.json', child_env)
        command = [sys.executable, '-B', str(at(destination, plan['command'][0]))] + plan['command'][1:]
        with (destination / 'PROCESS-STDOUT.txt').open('x', encoding='utf-8') as stdout, \
             (destination / 'PROCESS-STDERR.txt').open('x', encoding='utf-8') as stderr:
            try:
                done = subprocess.run(command, cwd=destination, env=env, stdout=stdout, stderr=stderr,
                                      timeout=100, check=False, creationflags=subprocess.CREATE_NO_WINDOW)
            except subprocess.TimeoutExpired:
                save(destination / 'LAUNCH-FAILURE.json', {'status': 'OUTER_TIMEOUT', 'seconds': 100,
                     'preserve_partial_stage': True, 'native_completion': False})
                raise
        require(done.returncode == 0, 'Native case failed; preserve process logs and partial outputs')
        folder = at(destination, plan['output'])
        result = compare_answers(load(folder / 'ANSWERS.json'), load(destination / 'reference/ANSWERS.json'))
        if plan['case_index'] == 0:
            result['workflow'] = compare_answers(load(folder / 'WORKFLOW-ANSWERS.json'),
                                                  load(destination / 'reference/WORKFLOW-ANSWERS.json'))
        save(destination / 'REPLAY-COMPARISON.json', result)
        # A mismatch is evidence, not an instruction to retry or tune on the exposed case.
        require(result['matched_selected_fields'] and result.get('workflow', {}).get('matched_selected_fields', True),
                'Selected answer/logit fields differ; retained for investigation')
        return {'status': 'ONE_NATIVE_CASE_SELECTED_FIELDS_MATCH', 'study': plan['study'], 'case': plan['case_id'],
                'comparison': result, 'independent_replication': False, 'fresh_fit': False,
                'limits': 'One frozen-model case only; native resource and execution receipts remain separate'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='mode', required=True)
    p = commands.add_parser('plan')
    for name in ('project', 'model', 'runtime'):
        p.add_argument('--' + name, required=True)
    p.add_argument('--study', choices=('transfer', 'learned'), required=True)
    p.add_argument('--case', type=int, choices=range(16), required=True)
    p.add_argument('--save')
    p = commands.add_parser('stage'); p.add_argument('--plan', required=True); p.add_argument('--destination', required=True)
    p.add_argument('--dependency-mode', choices=('link', 'copy'), default='link')
    p = commands.add_parser('check'); p.add_argument('--destination', required=True)
    p = commands.add_parser('run'); p.add_argument('--destination', required=True); p.add_argument('--execute', action='store_true')
    commands.add_parser('environment')
    args = parser.parse_args()
    if args.mode == 'plan':
        result = build_plan(args.project, args.model, args.runtime, args.study, args.case)
        if args.save:
            save(args.save, result)
        result = {k: v for k, v in result.items() if k != 'files'} | {'planned_files': len(result['files']),
                    'full_list_saved': bool(args.save)}
    elif args.mode == 'stage':
        result = stage(load(args.plan), args.destination, args.dependency_mode)
    elif args.mode == 'check':
        p = check_stage(args.destination)
        result = {'status': 'STAGED_INPUT_HASHES_MATCH_NOT_EXECUTED', 'files': len(p['files']), 'environment': environment()}
    elif args.mode == 'run':
        result = run_case(args.destination, args.execute)
    else:
        result = environment()
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
