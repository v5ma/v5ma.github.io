"""Require byte-for-byte publication of every runtime source and asset."""
from pathlib import Path
import hashlib,json,subprocess,time,urllib.request
root=Path(__file__).resolve().parents[2];app=root/'vesperfall';out=root/'test-output';out.mkdir(exist_ok=True)
paths=[p for p in app.iterdir() if p.suffix in ('.js','.css','.html') or p.name=='release.json']
paths += [p for folder in ['assets','vendor'] for p in (app/folder).rglob('*') if p.is_file()]
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();results={}
for attempt in range(60):
 for name,digest in manifest.items():
  if results.get(name,{}).get('match'):continue
  try:
   req=urllib.request.Request('https://v5ma.github.io/'+name+'?build='+sha,headers={'Cache-Control':'no-cache'})
   with urllib.request.urlopen(req,timeout=12) as r:
    actual=hashlib.sha256(r.read()).hexdigest();results[name]={'status':r.status,'sha256':actual,'match':actual==digest}
  except Exception as e:results[name]={'match':False,'error':str(e)}
 ok=len(results)==len(manifest) and all(r['match'] for r in results.values())
 print('Publication attempt',attempt+1,':',sum(r['match'] for r in results.values()),'/',len(manifest),flush=True)
 if ok:break
 time.sleep(6)
report={'version':json.loads((app/'release.json').read_text())['version'],'commit':sha,'all_match':ok,'files':results}
(out/'dominions-publication.json').write_text(json.dumps(report,indent=2));assert ok,'Public runtime bytes do not yet match this commit'
