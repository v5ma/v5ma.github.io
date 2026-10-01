"""Launcher guard tests with tiny retained fixtures; no numerical/model imports."""
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest
from unittest import mock
import replay

HERE = Path(__file__).resolve().parent
FIXTURES = HERE / 'test-fixtures-attempt-01'


class Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        FIXTURES.mkdir()

    def setUp(self):
        self.home = FIXTURES / self._testMethodName
        self.home.mkdir()

    def fixture(self):
        roots = {}
        for name in ('project', 'model', 'runtime'):
            p = self.home / name; p.mkdir(); roots[name] = str(p)
        original = HERE.parents[1] / replay.MANIFEST_NAME
        (Path(roots['project']) / replay.MANIFEST_NAME).write_bytes(original.read_bytes())
        rows = []
        for group, name, dest, body in (
            ('project', 'applications/qwen35_hybrid_v9.py', 'applications/qwen35_hybrid_v9.py', b'# fixture only\n'),
            ('model', 'tiny.bin', replay.MODEL_REL + '/tiny.bin', b'model fixture, not weights'),
            ('runtime', 'tiny.txt', replay.RUNTIME_REL + '/tiny.txt', b'runtime fixture')):
            p = replay.at(roots[group], name); p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(body)
            rows.append({'group': group, 'source': name, 'path': dest, 'bytes': len(body),
                         'sha256': hashlib.sha256(body).hexdigest()})
        return {'schema': 'san-native-replay-plan/v1', 'source_manifest_sha256': replay.MANIFEST_SHA,
                'study': 'transfer', 'case_index': 0, 'case_id': 'fixture-not-a-model-case',
                'expected_environment': dict(replay.ENVIRONMENT), 'source_roots': roots,
                'command': ['applications/qwen35_hybrid_v9.py', 'run', '--case', '0'],
                'output': 'results/qwen35-hybrid-09-case-0', 'files': rows,
                'missing_or_size_mismatch': []}

    def stage_fixture(self, mode='copy'):
        p = self.fixture(); destination = self.home / 'stage with spaces'
        with mock.patch.object(replay, 'build_plan', return_value=p):
            replay.stage(p, destination, mode)
        return p, destination

    def row(self, **changes):
        value = {'case': 'c', 'arm': 'a', 'query': 'giver', 'answer': 'Name', 'generated_ids': [1, 2],
                 'stopped_on_eos': True, 'original_target': 'X', 'swapped_target': 'Name',
                 'original_score': {'correct': False}, 'swapped_score': {'correct': True},
                 'first_logit_sha256': 'a' * 64}
        value.update(changes); return value

    def test_01_paths_reject_escape(self):
        for name in ('../x', '/x', 'D:/x', 'a\\x', 'a//x', 'a/./x', 'a/../x', 'a/*', 'a?b', 'a\x00b', 'a. '):
            with self.subTest(name=name), self.assertRaises(ValueError): replay.relative(name)

    def test_02_spaces_and_non_ascii(self):
        self.assertEqual(str(replay.relative('data with spaces/μ.json')), 'data with spaces/μ.json')

    def test_03_non_manifest_project(self):
        p = self.home / replay.MANIFEST_NAME; p.write_text('{}', encoding='utf-8')
        with self.assertRaises(ValueError): replay.build_plan(self.home, self.home, self.home, 'transfer', 0)

    def test_04_case_bounds(self):
        for i in (-1, 16, True):
            with self.assertRaises(ValueError): replay.build_plan(self.home, self.home, self.home, 'transfer', i)

    def test_05_arbitrary_command(self):
        p = self.fixture(); p['command'] = ['unrelated.py']
        with self.assertRaises(ValueError): replay.validate_plan(p)

    def test_06_arbitrary_output(self):
        p = self.fixture(); p['output'] = '../existing'
        with self.assertRaises(ValueError): replay.validate_plan(p)

    def test_07_duplicate_rows(self):
        p = self.fixture(); p['files'].append(p['files'][0])
        with self.assertRaises(ValueError): replay.validate_plan(p)

    def test_08_negative_size(self):
        p = self.fixture(); p['files'][0]['bytes'] = -1
        with self.assertRaises(ValueError): replay.validate_plan(p)

    def test_09_malformed_hash(self):
        p = self.fixture(); p['files'][0]['sha256'] = 'q' * 64
        with self.assertRaises(ValueError): replay.validate_plan(p)

    def test_10_stale_plan_before_writes(self):
        p = self.fixture(); q = copy.deepcopy(p); q['case_id'] = 'different'
        dest = self.home / 'new'
        with mock.patch.object(replay, 'build_plan', return_value=q), self.assertRaises(ValueError): replay.stage(p, dest)
        self.assertFalse(dest.exists())

    def test_11_missing_dependency_before_writes(self):
        p = self.fixture(); p['missing_or_size_mismatch'] = ['tiny.bin']
        dest = self.home / 'new'
        with mock.patch.object(replay, 'build_plan', return_value=p), self.assertRaises(ValueError): replay.stage(p, dest)
        self.assertFalse(dest.exists())

    def test_12_altered_source_before_writes(self):
        p = self.fixture(); replay.at(p['source_roots']['model'], 'tiny.bin').write_bytes(b'x' * p['files'][1]['bytes'])
        dest = self.home / 'new'
        with mock.patch.object(replay, 'build_plan', return_value=p), self.assertRaises(ValueError): replay.stage(p, dest)
        self.assertFalse(dest.exists())

    def test_13_copy_stage_and_check(self):
        p, dest = self.stage_fixture()
        with mock.patch.object(replay, 'build_plan', return_value=p):
            self.assertEqual(replay.check_stage(dest)['case_id'], p['case_id'])
        for row in p['files']:
            self.assertFalse(os.path.samefile(replay.at(dest, row['path']), replay.at(p['source_roots'][row['group']], row['source'])))

    def test_14_hardlink_dependencies_only(self):
        p, dest = self.stage_fixture('link')
        for row in p['files']:
            same = os.path.samefile(replay.at(dest, row['path']), replay.at(p['source_roots'][row['group']], row['source']))
            self.assertEqual(same, row['group'] != 'project')

    def test_15_existing_destination_preserved(self):
        p, dest = self.stage_fixture()
        receipt = (dest / 'STAGE-RECEIPT.json').read_bytes()
        with self.assertRaises(ValueError): replay.stage(p, dest)
        self.assertEqual(receipt, (dest / 'STAGE-RECEIPT.json').read_bytes())

    def test_16_changed_stage_rejected(self):
        p, dest = self.stage_fixture()
        replay.at(dest, p['files'][1]['path']).write_bytes(b'x' * p['files'][1]['bytes'])
        with mock.patch.object(replay, 'build_plan', return_value=p), self.assertRaises(ValueError): replay.check_stage(dest)

    def test_17_changed_source_anchor(self):
        p, dest = self.stage_fixture(); (dest / replay.MANIFEST_NAME).write_text('{}', encoding='utf-8')
        with self.assertRaises(ValueError): replay.check_stage(dest)

    def test_18_changed_closure_rejected(self):
        p, dest = self.stage_fixture(); q = copy.deepcopy(p); q['files'] = q['files'][:-1]
        with mock.patch.object(replay, 'build_plan', return_value=q), self.assertRaises(ValueError): replay.check_stage(dest)

    def test_19_existing_case_output(self):
        p, dest = self.stage_fixture(); replay.at(dest, p['output']).mkdir(parents=True)
        with mock.patch.object(replay, 'build_plan', return_value=p), self.assertRaises(ValueError): replay.check_stage(dest)

    def test_20_previous_run_request(self):
        p, dest = self.stage_fixture(); replay.save(dest / 'RUN-REQUEST.json', {'attempt': 'fixture'})
        with mock.patch.object(replay, 'build_plan', return_value=p), self.assertRaises(ValueError): replay.check_stage(dest)

    def test_21_explicit_execution_required(self):
        with mock.patch.object(replay.subprocess, 'run') as child:
            with self.assertRaises(ValueError): replay.run_case(self.home)
            child.assert_not_called()

    def test_22_wrong_platform_no_spawn(self):
        with mock.patch.object(replay, 'environment', return_value={'windows_x64': False, 'version_match': True}), \
             mock.patch.object(replay.subprocess, 'run') as child:
            with self.assertRaises(ValueError): replay.run_case(self.home, True)
            child.assert_not_called()

    def test_23_compare_success_and_failure(self):
        r = self.row()
        self.assertTrue(replay.compare_answers([r], [r])['matched_selected_fields'])
        failure = replay.compare_answers([self.row(answer='Wrong')], [r])
        self.assertFalse(failure['matched_selected_fields'])
        self.assertEqual(failure['differences'][0]['different_fields'], ['answer'])

    def test_24_compare_duplicate_and_coverage(self):
        r = self.row()
        with self.assertRaises(ValueError): replay.compare_answers([r, r], [r, r])
        with self.assertRaises(ValueError): replay.compare_answers([self.row(query='color')], [r])

    def test_25_environment_no_model_import(self):
        before = set(sys.modules)
        result = replay.environment()
        self.assertTrue(result['version_match'])
        self.assertFalse({'numpy', 'tokenizers', 'onnxruntime'}.intersection(set(sys.modules) - before))

    def test_26_lease_blocks_second_process(self):
        child_code = ('import replay\n'
                      'try:\n'
                      ' with replay.WindowsSerialLease(): print("UNEXPECTED_ACQUIRED")\n'
                      'except ValueError: print("EXPECTED_BUSY")\n')
        with replay.WindowsSerialLease():
            child = subprocess.run([sys.executable, '-B', '-c', child_code], cwd=HERE,
                                   capture_output=True, text=True, timeout=10, creationflags=subprocess.CREATE_NO_WINDOW)
        self.assertEqual(child.returncode, 0)
        self.assertEqual(child.stdout.strip(), 'EXPECTED_BUSY')
        with replay.WindowsSerialLease(): pass

    def test_27_native_child_environment_probe(self):
        env = dict(os.environ)
        env.pop('PYTHONPATH', None); env.pop('PYTHONOPTIMIZE', None); env.pop('PYTHONNOUSERSITE', None)
        child = replay.child_environment(env)
        self.assertTrue(child['version_match'])
        self.assertTrue(child['assertions_enabled'])
        self.assertFalse(child['model_imported'])


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(Tests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    replay.save(HERE / 'TEST-RECEIPT-ATTEMPT-01.json', {
        'status': 'PASS' if result.wasSuccessful() else 'FAIL', 'tests': result.testsRun,
        'failures': len(result.failures), 'errors': len(result.errors),
        'fixture_discovery_mocked': True, 'real_dependency_closure_tested_separately': True,
        'real_cross_process_windows_lease_test': True, 'real_child_environment_probe': True, 'model_runs': 0,
        'new_scientific_trials': 0, 'launcher_sha256': replay.digest(HERE / 'replay.py'),
        'test_sha256': replay.digest(__file__), 'limits': 'Launcher guards and tiny fixture file behavior, not native model portability or independent review'})
    sys.exit(0 if result.wasSuccessful() else 1)
