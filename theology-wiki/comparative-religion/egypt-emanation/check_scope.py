"""Fail on tracked changes outside the exact requested research and navigation scope."""
from pathlib import Path
import json,subprocess
HERE=Path(__file__).resolve().parent
m=json.loads((HERE/'manifest.json').read_text());base=m['base_commit']
changed=subprocess.check_output(['git','diff','--name-only',base],text=True).splitlines()
parent='theology-wiki/comparative-religion/'
report=json.loads((HERE.parent/'build-report.json').read_text())
allowed={parent+n for n in ['build.cjs','README.md','build-report.json']}
allowed.update(parent+f['path'] for f in report['files'] if f['path'].endswith('.html'))
allowed.update(['.github/workflows/theology-egypt-emanation-integration.yml','.github/workflows/theology-egypt-emanation-validation.yml'])
bad=[p for p in changed if not p.startswith(parent+'egypt-emanation/') and p not in allowed]
assert not bad,bad
assert not subprocess.check_output(['git','diff','--name-only','--diff-filter=D',base],text=True).splitlines(),'Unexpected tracked deletion'
print(json.dumps({'status':'passed','base_commit':base,'tracked_paths_checked':len(changed),'scope':'Only new research folder, prior series navigation/HTML hashes and two dedicated workflows may differ.'},indent=2))
