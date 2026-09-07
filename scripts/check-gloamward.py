"""Build a deterministic receipt from committed public files; optionally verify Pages."""
from pathlib import Path
import hashlib,json,subprocess,sys,time,urllib.request
root=Path(__file__).resolve().parents[1];g=root/'gloamward';out=root/'test-output';out.mkdir(exist_ok=True)
files=['index.html']+['gloamward/'+n for n in ['index.html','loader.js','core.mjs','game.mjs','style.css','roadmap.html','roadmap.json','cover.svg','README.md','release.json','vendor/manifest.json','vendor/aframe-1.8.0.min.js','vendor/AFRAME-LICENSE.txt']]
assert hashlib.sha256((g/'vendor/aframe-1.8.0.min.js').read_bytes()).hexdigest()==json.loads((g/'vendor/manifest.json').read_text())['sha256']
assert 'href="./gloamward/index.html"' in (root/'index.html').read_text()
for n in ['rainward/','aether-reach/','dino-atlas/','mario-maker-clone/','theology-wiki/']:
 assert n in (root/'index.html').read_text(),n
for p in [g/'core.mjs',g/'game.mjs',g/'loader.js',g/'index.html']:
 text=p.read_text()
 for bad in ['v5ma2026','sk-proj-','SUPABASE_SERVICE_ROLE','https://aframe.io/releases/']:
  assert bad not in text,(p,bad)
try:sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
except subprocess.CalledProcessError:sha='local-uncommitted'
hashes={n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in files}
manifest={'source':sha,'version':'0.1.0','files':hashes};(out/'gloamward-source.json').write_text(json.dumps(manifest,indent=2))
if '--published' in sys.argv:
 results={}
 for attempt in range(48):
  for name,expected in hashes.items():
   if results.get(name,{}).get('match'):continue
   try:
    with urllib.request.urlopen('https://v5ma.github.io/'+name+'?gloamward='+sha,timeout=8) as response:
     actual=hashlib.sha256(response.read()).hexdigest();results[name]={'status':response.status,'sha256':actual,'match':actual==expected}
   except Exception as e:results[name]={'match':False,'error':str(e)}
  if len(results)==len(hashes) and all(v['match'] for v in results.values()):break
  time.sleep(5)
 receipt={**manifest,'results':results,'all_match':all(v['match'] for v in results.values())};(out/'gloamward-publication.json').write_text(json.dumps(receipt,indent=2));assert receipt['all_match'],results
print('Gloamward public boundary and',len(hashes),'file hashes checked.')
