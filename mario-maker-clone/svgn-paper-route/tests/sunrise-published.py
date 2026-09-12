"""Read-only exact-commit publication evidence, separate from playability tests."""
import hashlib,json,os,time,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/tmp/sky-cycle-sunrise');OUT.mkdir(parents=True,exist_ok=True)
FILES=['sunrise.js','sunrise-core.mjs','route-compass.js','route-compass.css','release-status.js','release.json','sw.js']
expected={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in FILES}
report={'commit':os.getenv('GITHUB_SHA'),'verified':False,'expected':expected,'attempts':[]}
try:
 for attempt in range(50):
  found={}
  for f in FILES:
   try:
    req=urllib.request.Request('https://v5ma.github.io/mario-maker-clone/svgn-paper-route/'+f+'?sunrise='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=15) as response:found[f]=hashlib.sha256(response.read()).hexdigest()
   except Exception as error:found[f]=str(error)
  report['attempts'].append(found);report['verified']=found==expected
  (OUT/'publication.json').write_text(json.dumps(report,indent=2))
  print('Public byte matches:',sum(found[f]==expected[f] for f in FILES),'/',len(FILES),flush=True)
  if report['verified']:break
  time.sleep(12)
 if not report['verified']:raise RuntimeError('Public runtime has not matched the exact commit.')
finally:(OUT/'publication.json').write_text(json.dumps(report,indent=2))
