"""Collect exact-source native evidence; a pull request is optional, never required.

Network access is confined to the command-line entry point and the existing gh
credential context. Merely importing this module performs no writes or requests.
"""
from pathlib import Path, PurePosixPath
import hashlib
import io
import json
import os
import re
import subprocess
import zipfile

SHA = re.compile(r'[0-9a-f]{40}')
WORKFLOW = '.github/workflows/aether-rotunda.yml'
SUITES = {
    'rotunda': ('rotunda-browser.json', 34),
    'window': ('window-browser.json', 59),
    'portal': ('portal-browser.json', 23),
    'render': ('portal-render.json', 9),
    'grounded': ('grounded-browser.json', 21),
    'controller': ('controller-journey-report.json', 29),
}


def accepted_heads(source, pulls):
    """Prefer direct source; retain only the exact old merge's reviewed head."""
    if not isinstance(source, str) or not SHA.fullmatch(source):
        raise ValueError('Invalid source identity')
    heads = [source]
    for pr in pulls:
        head = pr.get('head', {}).get('sha', '')
        if (pr.get('merged_at') and pr.get('merge_commit_sha') == source
                and pr.get('base', {}).get('ref') == 'master'
                and isinstance(head, str) and SHA.fullmatch(head) and head not in heads):
            heads.append(head)
    return heads


def choose_run(runs, heads, repo):
    for head in heads:
        candidates = [r for r in runs if r.get('head_sha') == head
                      and r.get('path') == WORKFLOW
                      and r.get('status') == 'completed' and r.get('conclusion') == 'success'
                      and r.get('event') in ('push', 'workflow_dispatch')
                      and r.get('repository', {}).get('full_name') == repo
                      and r.get('head_repository', {}).get('full_name') == repo]
        if candidates:
            return max(candidates, key=lambda r: (r['updated_at'], r['id']))
    raise ValueError('Native evidence is pending: no successful exact-source Aether run')


def choose_artifact(items, name, head):
    candidates = [a for a in items if a.get('name') == name and not a.get('expired', True)
                  and a.get('workflow_run', {}).get('head_sha') == head]
    if not candidates:
        raise ValueError('Missing matching unexpired artifact: ' + name)
    return max(candidates, key=lambda a: (a['created_at'], a['updated_at'], a['id']))


def inspect_artifact(raw, selected, expected, head, report_name, minimum):
    if len(raw) > 32 * 1024 * 1024:
        raise ValueError('Artifact exceeds compressed-size limit')
    digest = hashlib.sha256(raw).hexdigest()
    if selected.get('digest') != 'sha256:' + digest:
        raise ValueError('Artifact digest mismatch')
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        members = archive.infolist()
        names = [i.filename for i in members]
        if len(names) != len(set(names)) or len(names) > 1000:
            raise ValueError('Duplicate or excessive archive members')
        if sum(i.file_size for i in members) > 128 * 1024 * 1024:
            raise ValueError('Expanded artifact exceeds size limit')
        for item in members:
            path = PurePosixPath(item.filename)
            if (path.is_absolute() or '..' in path.parts or '\\' in item.filename
                    or (item.external_attr >> 16) & 0o170000 == 0o120000):
                raise ValueError('Unsafe artifact member')
        if archive.read('uncommitted-diff.txt').strip():
            raise ValueError('Uncommitted source changes')
        tested = archive.read('tested-commit.txt').decode().strip()
        if tested != head:
            raise ValueError('Tested commit differs from accepted source')
        if json.loads(archive.read('runtime-manifest.json'))['files'] != expected:
            raise ValueError('Native runtime contract differs from publication')
        report = json.loads(archive.read(report_name))
        passed = report.get('passed')
        checks = report.get('checks')
        if (type(passed) is not int or passed < minimum or not isinstance(checks, list)
                or len(checks) != passed or report.get('errors')
                or report.get('shaderErrors') or report.get('nativeDialogs')):
            raise ValueError('Incomplete or unsuccessful native report: ' + report_name)
        files = {n: archive.read(n) for n in names
                 if len(PurePosixPath(n).parts) == 1
                 and PurePosixPath(n).suffix in {'.json', '.png', '.txt', '.log'}}
    return files, {'artifact': selected['id'], 'createdAt': selected['created_at'],
                   'sha256': digest, 'testedCommit': tested, 'passed': passed}


def validate_existing_archive(manifest, version, expected):
    source = manifest.get('source', '')
    if (manifest.get('project') != 'Aether Reach' or manifest.get('version') != version
            or manifest.get('format') != 1 or not isinstance(source, str) or not SHA.fullmatch(source)):
        raise ValueError('Invalid existing release identity')
    files = manifest.get('files', {})
    if any(files.get(name, {}).get('sha256') != digest for name, digest in expected.items()):
        raise ValueError('Existing version has different runtime bytes; choose a new version')
    return source


def source_root():
    supplied = os.environ.get('AETHER_SOURCE_ROOT')
    return Path(supplied).resolve() if supplied else Path(__file__).resolve().parents[2]


def main():
    root = source_root()
    source = os.environ['SOURCE']
    repo = os.environ['GH_REPO']
    if repo != 'v5ma/v5ma.github.io' or not SHA.fullmatch(source):
        raise ValueError('Unexpected repository or source')
    version = json.loads((root / 'aether-reach/release.json').read_text())['version']
    if not re.fullmatch(r'\d+\.\d+\.\d+', version) or tuple(map(int, version.split('.'))) < (0, 15, 0):
        raise ValueError('Use the historical revision collector for releases before 0.15.0')
    expected = json.loads((root / 'aether-reach/test-output/runtime-manifest.json').read_text())['files']
    for name, digest in expected.items():
        if hashlib.sha256((root / name).read_bytes()).hexdigest() != digest:
            raise ValueError('Source changed after manifest creation: ' + name)

    def api(path):
        return json.loads(subprocess.check_output(['gh', 'api', path], text=True))

    # Direct commits do not query or depend on pull-request metadata. Legacy
    # fallback is consulted only if this exact source has no accepted native run.
    runs = api(f'repos/{repo}/actions/runs?head_sha={source}&status=success&per_page=100')['workflow_runs']
    try:
        run = choose_run(runs, [source], repo)
    except ValueError:
        heads = accepted_heads(source, api(f'repos/{repo}/commits/{source}/pulls'))
        for head in heads[1:]:
            runs += api(f'repos/{repo}/actions/runs?head_sha={head}&status=success&per_page=100')['workflow_runs']
        try:
            run = choose_run(runs, heads, repo)
        except ValueError:
            # A later sibling-only Pages publication can reuse native evidence
            # only when the whole Aether source/test tree and entry files agree.
            recent = api(f'repos/{repo}/actions/workflows/aether-rotunda.yml/runs?status=success&per_page=100')['workflow_runs']
            compatible = []
            for item in recent:
                candidate = item.get('head_sha', '')
                if not SHA.fullmatch(candidate):
                    continue
                ancestor = subprocess.run(['git', 'merge-base', '--is-ancestor', candidate, source], cwd=root, capture_output=True)
                same = subprocess.run(['git', 'diff', '--quiet', candidate, source, '--', 'aether-reach', 'index.html', 'projects.css', WORKFLOW], cwd=root, capture_output=True)
                if ancestor.returncode == 0 and same.returncode == 0:
                    compatible.append(candidate)
            run = choose_run(recent, compatible, repo)
    head = run['head_sha']
    pages = json.loads(subprocess.check_output(
        ['gh', 'api', '--paginate', '--slurp', f"repos/{repo}/actions/runs/{run['id']}/artifacts?per_page=100"], text=True))
    items = [a for page in pages for a in page['artifacts']]
    selections = {}
    contents = {}
    for suite, (report_name, minimum) in SUITES.items():
        selected = choose_artifact(items, 'aether-rotunda-' + suite, head)
        if selected['size_in_bytes'] > 32 * 1024 * 1024:
            raise ValueError('Artifact exceeds compressed-size limit')
        raw = subprocess.check_output(['gh', 'api', f"repos/{repo}/actions/artifacts/{selected['id']}/zip"])
        files, receipt = inspect_artifact(raw, selected, expected, head, report_name, minimum)
        selections[suite] = receipt
        if suite == 'rotunda' and tuple(map(int, version.split('.'))) >= (0, 15, 1):
            _, guide_receipt = inspect_artifact(raw, selected, expected, head, 'field-guide-browser.json', 24)
            selections['field-guide'] = guide_receipt
        contents.update({suite + '/' + name: data for name, data in files.items()})
    # No evidence archive is written before every required suite validates.
    out = Path('/tmp/aether-release')
    out.mkdir(exist_ok=True)
    scope = {'source': source, 'head': head, 'workflow': run['id'], 'artifacts': selections,
             'scope': 'Exact-source native software tests. Public bytes are independently checked. Synthetic devices are not physical Quest/Xbox or human-quality approval.'}
    with zipfile.ZipFile(out / f'Aether-Reach-v{version}-native-grounded-evidence.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
        for name, raw in contents.items():
            archive.writestr(name, raw)
        archive.writestr('scope.json', json.dumps(scope, indent=2))
    (out / 'native-artifact-selection.json').write_text(json.dumps(scope, indent=2) + '\n')
    print('Archived six validated Aether suites from', run['id'], 'tested at', head)


if __name__ == '__main__':
    main()
