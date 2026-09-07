"""Preserve public native flight evidence in the release, before CI expires."""
from pathlib import Path
import hashlib, json, os, re, subprocess, zipfile
source=os.environ['SOURCE'];repo=os.environ['GH_REPO']
assert re.fullmatch('[0-9a-f]{40}',source)
def get(path):return json.loads(subprocess.check_output(['gh','api',path],text=True))
prs=get(f'repos/{repo}/commits/{source}/pulls')
pr=next(p for p in prs if p.get('merged_at') and p.get('merge_commit_sha')==source and p['base']['ref']=='master')
head=pr['head']['sha'];assert re.fullmatch('[0-9a-f]{40}',head)
runs=get(f'repos/{repo}/actions/runs?head_sha={head}&event=pull_request&status=success&per_page=30')['workflow_runs']
run=next(r for r in runs if r['path']=='.github/workflows/aether-glide.yml' and r['head_sha']==head and r['conclusion']=='success')
folder=Path('/tmp/aether-native-evidence');subprocess.run(['gh','run','download',str(run['id']),'--name','aether-foldwing-restore','--dir',str(folder)],check=True)
assert not (folder/'uncommitted-diff.txt').read_text().strip()
manifest=json.loads((folder/'runtime-manifest.json').read_text())
for name,h in manifest['files'].items():assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==h,name
report=json.loads((folder/'glide-report.json').read_text());assert report['passed']>=9 and not report['errors']
out=Path('/tmp/aether-release');out.mkdir(exist_ok=True)
version=json.loads(Path('aether-reach/release.json').read_text())['version']
with zipfile.ZipFile(out/f'Aether-Reach-v{version}-native-flight-evidence.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['glide-report.json','foldwing-from-rail.png','glider-garden-landing.png','tested-commit.txt','runtime-manifest.json']:z.write(folder/name,name)
 z.writestr('evidence-scope.json',json.dumps({'releaseSource':source,'testedHead':head,'workflow':run['id'],'scope':'Public HTTP/software-WebGL keyboard flight replay. No physical-device certification. Runtime hashes match the released source.'},indent=2))
print('Archived native flight report and actual captures from',run['id'])
