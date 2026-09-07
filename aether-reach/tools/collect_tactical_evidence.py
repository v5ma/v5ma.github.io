"""Archive only native tactical artifacts whose public hashes match this release."""
from pathlib import Path
import hashlib,json,os,re,subprocess,zipfile
source=os.environ['SOURCE'];repo=os.environ['GH_REPO'];assert re.fullmatch('[0-9a-f]{40}',source)
def get(path):return json.loads(subprocess.check_output(['gh','api',path],text=True))
pr=next(p for p in get(f'repos/{repo}/commits/{source}/pulls') if p.get('merged_at') and p.get('merge_commit_sha')==source and p['base']['ref']=='master')
head=pr['head']['sha'];assert re.fullmatch('[0-9a-f]{40}',head)
runs=get(f'repos/{repo}/actions/runs?head_sha={head}&event=pull_request&status=success&per_page=30')['workflow_runs']
run=next(r for r in runs if r['path']=='.github/workflows/aether-tactics.yml' and r['head_sha']==head and r['conclusion']=='success')
version=json.loads(Path('aether-reach/release.json').read_text())['version'];out=Path('/tmp/aether-release');out.mkdir(exist_ok=True)
with zipfile.ZipFile(out/f'Aether-Reach-v{version}-native-tactical-evidence.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for mode in ['tools','recovery']:
  folder=Path('/tmp/aether-tactical-evidence')/mode
  subprocess.run(['gh','run','download',str(run['id']),'--name','aether-tactical-'+mode,'--dir',str(folder)],check=True)
  assert not (folder/'uncommitted-diff.txt').read_text().strip()
  manifest=json.loads((folder/'runtime-manifest.json').read_text())
  for name,sha in manifest['files'].items():assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==sha,name
  report=json.loads((folder/(mode+'-tactics-report.json')).read_text());assert report['passed']>=15 and not report['errors']
  for p in folder.iterdir():
   if p.suffix in ['.png','.json','.txt']:archive.write(p,mode+'/'+p.name)
 archive.writestr('scope.json',json.dumps({'source':source,'head':head,'workflow':run['id'],'scope':'Real HTTP/software-WebGL tactical playthroughs with ordinary input. Model tests are separately seeded. No physical hardware or enjoyment certification.'},indent=2))
print('Archived source-matching native tactical evidence from',run['id'])
