"""Copy only source-matching, successful public artwork review into the release."""
from pathlib import Path
import hashlib,json,os,re,subprocess,zipfile
source=os.environ['SOURCE'];repo=os.environ['GH_REPO'];assert re.fullmatch('[0-9a-f]{40}',source)
def get(path):return json.loads(subprocess.check_output(['gh','api',path],text=True))
pr=next(p for p in get(f'repos/{repo}/commits/{source}/pulls') if p.get('merged_at') and p.get('merge_commit_sha')==source and p['base']['ref']=='master')
head=pr['head']['sha'];assert re.fullmatch('[0-9a-f]{40}',head)
runs=get(f'repos/{repo}/actions/runs?head_sha={head}&event=pull_request&status=success&per_page=30')['workflow_runs']
run=next(r for r in runs if r['path']=='.github/workflows/aether-art.yml' and r['head_sha']==head and r['conclusion']=='success')
version=json.loads(Path('aether-reach/release.json').read_text())['version'];out=Path('/tmp/aether-release');out.mkdir(exist_ok=True)
with zipfile.ZipFile(out/f'Aether-Reach-v{version}-native-art-evidence.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for mode in ['plate','runtime']:
  folder=Path('/tmp/aether-art-evidence')/mode
  subprocess.run(['gh','run','download',str(run['id']),'--name','aether-quay-'+mode,'--dir',str(folder)],check=True)
  assert not (folder/'uncommitted-diff.txt').read_text().strip()
  manifest=json.loads((folder/'runtime-manifest.json').read_text())
  for name,sha in manifest['files'].items():assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==sha,name
  if mode=='runtime':
   report=json.loads((folder/'quay-runtime-report.json').read_text());assert report['passed']>=10 and not report['errors']
  else:
   report=json.loads((folder/'plate-report.json').read_text());assert len(report['views'])==12;assert not report['views']['after-hero']['art']['errors']
  for p in folder.iterdir():
   if p.suffix in ['.png','.json','.txt']:archive.write(p,mode+'/'+p.name)
 archive.writestr('scope.json',json.dumps({'source':source,'head':head,'workflow':run['id'],'scope':'Actual source renderer and HTTP gameplay. Matched plates use identical fixture cameras, not simulated progress. Runtime uses normal keys and UI. No physical GPU/headset performance or player art-approval claim.'},indent=2))
print('Archived source-matching Quay art comparison from',run['id'])
