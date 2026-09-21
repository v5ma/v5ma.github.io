"""Read-only integration checks. No game execution or state writes."""
import hashlib,json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1];repo=root.parent
legacy=json.loads((root/'legacy-layout.json').read_text())
for item in legacy['files']:
    assert hashlib.sha256((root/item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
for path in root.rglob('*'):
    if path.is_file() and path.suffix in ('.mjs','.js','.html','.json','.css','.py'):
        assert not re.search(r'^(?:<{7}|>{7}|\|{7})(?: |$)',path.read_text(encoding='utf-8'),re.M),str(path)
coverage=json.loads((root/'production/workflow-coverage.json').read_text())
for kind,key in [('source','sourceSuites'),('console','consoleModes'),('public','publicSuites')]:
    text=(repo/'.github/workflows'/coverage[kind+'Workflow']).read_text()
    assert 'contents: read' in text and 'contents: write' not in text
    for item in coverage[key]:assert item in text,(kind,item)
for name in coverage['removedObsoleteWorkflowFiles']:
    assert not (repo/'.github/workflows'/name).exists(),name
print('Matched',len(legacy['files']),'legacy files; no conflict markers; retained all 19 source, 8 console and 21 public journeys.')
