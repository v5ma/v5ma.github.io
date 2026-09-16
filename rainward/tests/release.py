"""Hash this public game, homepage, and its own shared-library application record."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,time,urllib.request
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[2];GAME=ROOT/'rainward';OUT=ROOT/'test-output';OUT.mkdir(exist_ok=True)
try:source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
except (OSError,subprocess.CalledProcessError):source=os.getenv('GITHUB_SHA','local')
files=[ROOT/'index.html',ROOT/'level-design-library/RAINWARD-FIREBREAK-REVIEW.md',*[p for p in GAME.iterdir() if p.is_file() and p.suffix in ['.mjs','.html','.css','.svg','.json','.md']],*[p for p in (GAME/'vendor').rglob('*') if p.is_file()],*[p for p in (GAME/'assets').rglob('*') if p.is_file()]]
manifest={'source':source,'version':json.loads((GAME/'release.json').read_text())['version'],'files':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
(OUT/'rainward-source-manifest.json').write_text(json.dumps(manifest,indent=2))
if '--published' in sys.argv:
 result={};base='https://v5ma.github.io/'
 def fetch(item):
  name,expected=item
  try:
   with urllib.request.urlopen(base+name+'?rainward='+manifest['source'][:12],timeout=12) as r:
    digest=hashlib.sha256(r.read()).hexdigest();return name,{'status':r.status,'sha256':digest,'match':digest==expected}
  except Exception as error:return name,{'match':False,'error':str(error)}
 for attempt in range(40):
  pending=[x for x in manifest['files'].items() if not result.get(x[0],{}).get('match')]
  with ThreadPoolExecutor(max_workers=4) as pool:
   for name,value in pool.map(fetch,pending):result[name]=value
  if all(v['match'] for v in result.values()):break
  time.sleep(6)
 receipt={'source':manifest['source'],'version':manifest['version'],'all_match':all(v['match'] for v in result.values()),'files':result}
 (OUT/'rainward-publication.json').write_text(json.dumps(receipt,indent=2))
 assert receipt['all_match'],receipt
