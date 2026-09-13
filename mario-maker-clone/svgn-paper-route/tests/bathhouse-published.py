"""Read-only verification of all owned runtime files on GitHub Pages."""
import hashlib,json,os,time,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=Path('/tmp/sky-cycle-bathhouse');out.mkdir(parents=True,exist_ok=True)
files=['bathhouse-core.mjs','bathhouse-art.js','bathhouse.js','bathhouse.css','delivery-upgrade.js','prismatic-renderer.js','sunrise.js','release-status.js','release.json','sw.js']
expected={f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in files};report={'commit':os.getenv('GITHUB_SHA'),'verified':False,'expected':expected,'attempts':[]}
try:
 for i in range(50):
  found={}
  for f in files:
   try:
    req=urllib.request.Request('https://v5ma.github.io/mario-maker-clone/svgn-paper-route/'+f+'?tideglass='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=15) as r:found[f]=hashlib.sha256(r.read()).hexdigest()
   except Exception as exc:found[f]=str(exc)
  report['attempts'].append(found);report['verified']=found==expected;(out/'publication.json').write_text(json.dumps(report,indent=2));print('Live matches',sum(found[f]==expected[f] for f in files),'/',len(files),flush=True)
  if report['verified']:break
  time.sleep(12)
 if not report['verified']:raise RuntimeError('Public runtime does not yet match source')
finally:(out/'publication.json').write_text(json.dumps(report,indent=2))
