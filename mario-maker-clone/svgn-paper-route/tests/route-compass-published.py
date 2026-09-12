"""Compare public runtime bytes against the exact checked-out release."""
import hashlib,json,os,time,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
files=['route-compass.js','route-compass-core.mjs','route-compass.css','release-status.js','release.json','sw.js']
expected={f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in files}
out=Path('/tmp/sky-cycle-compass');out.mkdir(parents=True,exist_ok=True)
report={'commit':os.getenv('GITHUB_SHA'),'verified':False,'expected':expected,'attempts':[]}
try:
 for attempt in range(36):
  found={}
  for name in files:
   url='https://v5ma.github.io/mario-maker-clone/svgn-paper-route/'+name+'?compass='+str(time.time_ns())
   try:
    with urllib.request.urlopen(urllib.request.Request(url,headers={'Cache-Control':'no-cache'}),timeout=20) as response:found[name]=hashlib.sha256(response.read()).hexdigest()
   except Exception as error:found[name]=str(error)
  report['attempts'].append(found)
  if found==expected:report['verified']=True;print('PUBLIC RUNTIME VERIFIED:',report['commit'],flush=True);break
  print('Publication attempt',attempt+1,'waiting for matching bytes.',flush=True);time.sleep(15)
 if not report['verified']:raise RuntimeError('Public runtime did not match the exact source.')
finally:(out/'publication.json').write_text(json.dumps(report,indent=2))
