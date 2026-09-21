"""Release selection fixtures only; no network, gameplay or physical-device claim."""
from pathlib import Path
import copy
import hashlib
import importlib.util
import io
import json
import unittest
from unittest.mock import patch
import zipfile

SPEC = importlib.util.spec_from_file_location('evidence', Path(__file__).resolve().parents[1] / 'tools/release_evidence.py')
E = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(E)
SOURCE, LEGACY = 'a' * 40, 'b' * 40
REPO = 'v5ma/v5ma.github.io'
EXPECTED = {'aether-reach/app.mjs': 'c' * 64}


def run(head=SOURCE, **overrides):
    value = dict(id=1, head_sha=head, path=E.WORKFLOW, status='completed', conclusion='success',
                 event='push', updated_at='2026-09-21', repository={'full_name': REPO}, head_repository={'full_name': REPO})
    value.update(overrides)
    return value


def artifact(**overrides):
    value = dict(id=1, name='aether-rotunda-window', expired=False, workflow_run={'head_sha': SOURCE},
                 created_at='2026-09-21', updated_at='2026-09-21')
    value.update(overrides)
    return value


def fixture(**overrides):
    files = {'tested-commit.txt': SOURCE, 'uncommitted-diff.txt': '',
             'runtime-manifest.json': json.dumps({'files': EXPECTED}),
             'window-browser.json': json.dumps({'passed': 59, 'checks': ['fixture'] * 59, 'errors': []})}
    files.update(overrides)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        for name, text in files.items():
            archive.writestr(name, text)
    raw = buffer.getvalue()
    return raw, artifact(digest='sha256:' + hashlib.sha256(raw).hexdigest())


class EvidenceTests(unittest.TestCase):
    def test_existing_release_reuse_requires_complete_identical_runtime(self):
        manifest = {'project': 'Aether Reach', 'format': 1, 'source': LEGACY, 'version': '0.15.0',
                    'files': {n: {'sha256': h} for n, h in EXPECTED.items()}}
        self.assertEqual(E.validate_existing_archive(manifest, '0.15.0', EXPECTED), LEGACY)
        with self.assertRaises(ValueError): E.validate_existing_archive(manifest, '0.15.1', EXPECTED)
        with self.assertRaises(ValueError): E.validate_existing_archive(manifest, '0.15.0', {'missing.mjs': '0' * 64})

    def test_collector_can_run_from_tmp_with_explicit_checkout_root(self):
        with patch.dict(E.os.environ, {'AETHER_SOURCE_ROOT': '/tmp/checked-out-source'}), patch.object(E, '__file__', '/tmp/release_evidence.py'):
            self.assertEqual(E.source_root(), Path('/tmp/checked-out-source'))

    def test_direct_commit_without_pr(self):
        self.assertEqual(E.accepted_heads(SOURCE, []), [SOURCE])
        self.assertEqual(E.choose_run([run()], [SOURCE], REPO)['head_sha'], SOURCE)

    def test_exact_merged_legacy_head_only(self):
        pr = {'merged_at': '2026-09-21', 'merge_commit_sha': SOURCE, 'base': {'ref': 'master'}, 'head': {'sha': LEGACY}}
        self.assertEqual(E.accepted_heads(SOURCE, [pr]), [SOURCE, LEGACY])
        for field, value in [('merged_at', None), ('merge_commit_sha', LEGACY), ('base', {'ref': 'other'})]:
            wrong = copy.deepcopy(pr); wrong[field] = value
            self.assertEqual(E.accepted_heads(SOURCE, [wrong]), [SOURCE])

    def test_direct_evidence_preferred_over_legacy(self):
        self.assertEqual(E.choose_run([run(LEGACY, id=99), run()], [SOURCE, LEGACY], REPO)['id'], 1)

    def test_failed_running_wrong_workflow_and_fork_rejected(self):
        for override in [{'conclusion': 'failure'}, {'status': 'in_progress'}, {'path': '.github/workflows/other.yml'},
                         {'head_repository': {'full_name': 'other/fork'}}, {'event': 'pull_request'}]:
            with self.subTest(override=override), self.assertRaises(ValueError):
                E.choose_run([run(**override)], [SOURCE], REPO)

    def test_latest_created_retry_not_biggest_id(self):
        old = artifact(id=99, created_at='2026-09-20')
        latest = artifact(id=2)
        self.assertEqual(E.choose_artifact([old, latest], latest['name'], SOURCE)['id'], 2)

    def test_expired_or_wrong_source_artifact_rejected(self):
        for override in [{'expired': True}, {'workflow_run': {'head_sha': LEGACY}}]:
            with self.assertRaises(ValueError):
                E.choose_artifact([artifact(**override)], 'aether-rotunda-window', SOURCE)

    def inspect(self, **overrides):
        raw, selected = fixture(**overrides)
        return E.inspect_artifact(raw, selected, EXPECTED, SOURCE, 'window-browser.json', 59)

    def test_complete_artifact(self):
        files, receipt = self.inspect()
        self.assertEqual(receipt['passed'], 59)
        self.assertIn('window-browser.json', files)

    def test_wrong_tested_commit_rejected_even_with_matching_runtime(self):
        with self.assertRaises(ValueError): self.inspect(**{'tested-commit.txt': LEGACY})

    def test_source_modifications_rejected(self):
        with self.assertRaises(ValueError): self.inspect(**{'uncommitted-diff.txt': 'app.mjs changed'})
        with self.assertRaises(ValueError): self.inspect(**{'runtime-manifest.json': json.dumps({'files': {}})})

    def test_errors_and_partial_reports_rejected(self):
        for report in [{'passed': 58, 'checks': ['x'] * 58}, {'passed': 59, 'checks': []},
                       {'passed': 59, 'checks': ['x'] * 59, 'errors': ['oops']},
                       {'passed': 59, 'checks': ['x'] * 59, 'shaderErrors': ['shader']},
                       {'passed': 59, 'checks': ['x'] * 59, 'nativeDialogs': ['unexpected']}]:
            with self.subTest(report=report), self.assertRaises(ValueError):
                self.inspect(**{'window-browser.json': json.dumps(report)})

    def test_digest_and_archive_paths_rejected(self):
        raw, selected = fixture(); selected['digest'] = 'sha256:' + '0' * 64
        with self.assertRaises(ValueError): E.inspect_artifact(raw, selected, EXPECTED, SOURCE, 'window-browser.json', 59)
        for name in ['../escape.txt', '/absolute.txt', 'folder\\escape.txt']:
            with self.assertRaises(ValueError): self.inspect(**{name: 'no'})

    def test_invalid_source_is_not_accepted(self):
        with self.assertRaises(ValueError): E.accepted_heads('master', [])


if __name__ == '__main__':
    unittest.main()
