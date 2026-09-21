"""Wait for exact public root runtime files; never rewrite the served game."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,time,urllib.request,subprocess
ROOT=Path(__file__).resolve().parents[1]
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
files=[p for p in ROOT.iterdir() if p.is_file() and p.suffix in {'.html','.js','.mjs','.css','.json','.svg'}]
expected={str(p.relative_to(ROOT.parent)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
found={}
def check(item):
 name,digest=item
 try:
  req=urllib.request.Request('https://v5ma.github.io/'+name+'?desk='+sha[:12],headers={'Cache-Control':'no-cache','User-Agent':'SVGN-public-verification'})
  with urllib.request.urlopen(req,timeout=15) as r:actual=hashlib.sha256(r.read()).hexdigest()
  return name,{'match':actual==digest,'expected':digest,'actual':actual}
 except Exception as e:return name,{'match':False,'error':str(e)}
with ThreadPoolExecutor(max_workers=6) as pool:
 for _ in range(72):
  found.update(pool.map(check,[(n,h) for n,h in expected.items() if not found.get(n,{}).get('match')]))
  if len(found)==len(expected) and all(v['match'] for v in found.values()):break
  time.sleep(5)
record={'source':sha,'files':found,'all_match':len(found)==len(expected) and all(v['match'] for v in found.values())}
Path('desk-public-source.json').write_text(json.dumps(record,indent=2))
assert record['all_match'],'Published desk runtime is not this source'
print('Matched',len(found),'public files')
