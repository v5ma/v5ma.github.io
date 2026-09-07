"""Hash only this public game and the homepage; never export sibling/private data."""
from pathlib import Path
import hashlib,json,os,sys,time,urllib.request
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[2];GAME=ROOT/'rainward';OUT=ROOT/'test-output';OUT.mkdir(exist_ok=True)
files=[ROOT/'index.html',*[p for p in GAME.iterdir() if p.is_file() and p.suffix in ['.mjs','.html','.css','.svg','.json']],GAME/'vendor/LICENSE',GAME/'vendor/three.core.js',GAME/'vendor/three.module.js']
manifest={'source':os.getenv('GITHUB_SHA','local'),'version':json.loads((GAME/'release.json').read_text())['version'],'files':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
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
