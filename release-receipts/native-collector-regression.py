"""Offline integrity fixtures for the Aether native-release evidence collector.
These tests do not contact GitHub, run the game, or certify a browser journey.
Run from the repository: python release-receipts/native-collector-regression.py
"""
from pathlib import Path
import hashlib
import io
import json
import sys
import textwrap
import unittest
import warnings
import zipfile

workflow = Path(sys.argv.pop(1)) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / '.github/workflows/aether-release-backup.yml'
text = workflow.read_text()
marker = '          """Collect native review artifacts by creation time and verify their identities."""'
start = text.index(marker)
end = text.index('\n          PY', start)
namespace = {'__name__': 'collector_fixture'}
exec(compile(textwrap.dedent(text[start:end]), str(workflow), 'exec'), namespace)
choose = namespace['choose_artifact']
inspect = namespace['inspect_artifact']
HEAD = 'a' * 40
EXPECTED = {'aether-reach/example.mjs': 'b' * 64}

def artifact(ident, created, *, expired=False, head=HEAD):
    return {'id': ident, 'name': 'suite', 'created_at': created, 'updated_at': created,
            'expired': expired, 'workflow_run': {'head_sha': head}}

def archive(overrides=None):
    members = {'uncommitted-diff.txt': '', 'runtime-manifest.json': json.dumps({'files': EXPECTED}),
               'tested-commit.txt': HEAD, 'report.json': json.dumps({'passed': 2, 'checks': ['fixture one', 'fixture two'], 'errors': []})}
    members.update(overrides or {})
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w') as z:
        for name, data in members.items():
            z.writestr(name, data)
    return output.getvalue()

def inspect_fixture(raw, minimum=2):
    selected = artifact(8, '2026-09-16T19:00:00Z')
    selected['digest'] = 'sha256:' + hashlib.sha256(raw).hexdigest()
    return inspect(raw, selected, EXPECTED, 'report.json', minimum)

class CollectorIntegrity(unittest.TestCase):
    def test_creation_time_wins_over_numerical_id(self):
        old = artifact(999, '2026-09-16T10:00:00Z')
        new = artifact(1, '2026-09-16T11:00:00Z')
        self.assertEqual(choose([old, new], 'suite', HEAD)['id'], 1)
        self.assertEqual(choose([new, old], 'suite', HEAD)['id'], 1)

    def test_expired_or_other_head_does_not_replace_valid_artifact(self):
        good = artifact(1, '2026-09-16T10:00:00Z')
        bad = [artifact(2, '2026-09-16T12:00:00Z', expired=True), artifact(3, '2026-09-16T13:00:00Z', head='c' * 40)]
        self.assertEqual(choose([good] + bad, 'suite', HEAD)['id'], 1)
        with self.assertRaises(ValueError):
            choose(bad, 'suite', HEAD)

    def test_valid_fixture_records_actual_digest_and_tested_identity(self):
        raw = archive()
        files, receipt = inspect_fixture(raw)
        self.assertEqual(receipt['sha256'], hashlib.sha256(raw).hexdigest())
        self.assertEqual(receipt['testedCommit'], HEAD)
        self.assertEqual(receipt['passed'], 2)
        self.assertIn('report.json', files)

    def test_wrong_digest_is_rejected(self):
        selected = artifact(8, '2026-09-16T19:00:00Z')
        selected['digest'] = 'sha256:' + '0' * 64
        with self.assertRaises(ValueError):
            inspect(archive(), selected, EXPECTED, 'report.json', 2)

    def test_partial_manifest_and_uncommitted_changes_are_rejected(self):
        for change in ({'runtime-manifest.json': '{"files":{}}'}, {'uncommitted-diff.txt': 'one changed file'}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                inspect_fixture(archive(change))

    def test_errors_and_inconsistent_or_incomplete_check_counts_are_rejected(self):
        for report in ({'passed': 2, 'checks': ['one', 'two'], 'errors': ['failure']},
                       {'passed': 2, 'checks': ['one', 'two'], 'shaderErrors': ['failure']},
                       {'passed': 2, 'checks': ['one', 'two'], 'nativeDialogs': ['alert']},
                       {'passed': 2, 'checks': ['one']}, {'passed': 1, 'checks': ['one']}):
            with self.subTest(report=report), self.assertRaises(ValueError):
                inspect_fixture(archive({'report.json': json.dumps(report)}))

    def test_invalid_tested_revision_is_rejected(self):
        with self.assertRaises(ValueError):
            inspect_fixture(archive({'tested-commit.txt': 'not-a-commit'}))

    def test_traversal_paths_and_symlinks_are_rejected(self):
        for name in ('../escape.txt', '/absolute.txt', 'dir\\escape.txt'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                inspect_fixture(archive({name: 'unsafe'}))
        stream = io.BytesIO(archive())
        with zipfile.ZipFile(stream, 'a') as z:
            link = zipfile.ZipInfo('symlink.txt')
            link.external_attr = 0o120777 << 16
            z.writestr(link, '../target')
        with self.assertRaises(ValueError):
            inspect_fixture(stream.getvalue())

    def test_duplicate_members_are_rejected(self):
        stream = io.BytesIO(archive())
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', UserWarning)
            with zipfile.ZipFile(stream, 'a') as z:
                z.writestr('tested-commit.txt', HEAD)
        with self.assertRaises(ValueError):
            inspect_fixture(stream.getvalue())

if __name__ == '__main__':
    unittest.main(verbosity=2)
