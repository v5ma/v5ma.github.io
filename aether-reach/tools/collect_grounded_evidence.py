"""Archive successful, exact-source native reviews for Grounded Cast releases."""
from pathlib import Path
import hashlib,json,os,re,subprocess,zipfile
source=os.environ['SOURCE'];repo=os.environ['GH_REPO']
assert re.fullmatch('[0-9a-f]{40}',source)
def get(path):return json.loads(subprocess.check_output(['gh','api',path],text=True))
pr=next(p for p in get(f'repos/{repo}/commits/{source}/pulls') if p.get('merged_at') and p.get('merge_commit_sha')==source and p['base']['ref']=='master')
head=pr['head']['sha'];assert re.fullmatch('[0-9a-f]{40}',head)
version=json.loads(Path('aether-reach/release.json').read_text())['version'];rewired=tuple(map(int,version.split('.'))) >= (0,12,0)
workflow='.github/workflows/aether-rewired.yml' if rewired else '.github/workflows/aether-grounded.yml'
prefix='aether-rewired-' if rewired else 'aether-grounded-'
runs=get(f'repos/{repo}/actions/runs?head_sha={head}&status=success&per_page=100')['workflow_runs']
run=next(r for r in runs if r['path']==workflow and r['head_sha']==head and r['conclusion']=='success')
reports={'grounded':'grounded-browser.json','xr':'xr-report.json','controller':'controller-journey-report.json','blackout':'bellwether-browser.json','skyglass':'skyglass-browser.json','foundry':'foundry-browser.json','glide':'glide-report.json','tactics-tools':'tools-tactics-report.json','tactics-recovery':'recovery-tactics-report.json'}
if rewired:reports={'diorama':'diorama-browser.json','rewired':'rewired-browser.json','grounded':'grounded-browser.json','controller':'controller-journey-report.json','expedition':'expedition-report.json','glide':'glide-report.json'}
out=Path('/tmp/aether-release');out.mkdir(exist_ok=True)
with zipfile.ZipFile(out/f'Aether-Reach-v{version}-native-grounded-evidence.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for suite,name in reports.items():
  folder=Path('/tmp/aether-grounded-evidence')/suite
  subprocess.run(['gh','run','download',str(run['id']),'--name',prefix+suite,'--dir',str(folder)],check=True)
  assert not (folder/'uncommitted-diff.txt').read_text().strip()
  manifest=json.loads((folder/'runtime-manifest.json').read_text())
  for path,digest in manifest['files'].items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==digest,path
  report=json.loads((folder/name).read_text());assert report['passed']>0 and not report['errors'] and not report.get('shaderErrors')
  for p in folder.iterdir():
   if p.suffix in {'.png','.json','.txt','.log'}:archive.write(p,suite+'/'+p.name)
 archive.writestr('scope.json',json.dumps({'source':source,'head':head,'workflow':run['id'],'suites':reports,'scope':'Actual HTTP software WebGL, normal application inputs and explicitly emulated controller/hand poses. Includes saved Bellwether district progression, original flight and tactical regressions. Not physical Xbox/Quest or player quality approval.'},indent=2))
print('Archived all required exact-source native review suites from',run['id'])
