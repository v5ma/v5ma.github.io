"""Cache-busted, read-only verification of the actual public release bytes."""
import hashlib,json,time,urllib.request,subprocess,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];GAME=ROOT/'mario-maker-clone/svgn-paper-route'
FILES=['waterwheel-whip-core.mjs','currentworks-environment.mjs','currentworks-core.mjs','vendor/currentworks/toon.js','vendor/currentworks/cloudlets.js','vendor/currentworks/islands.js','depth-path-core.mjs','depth-path.mjs','waterwheel-fork-core.mjs','route-entry-core.mjs','route-entry.js','route-entry.css','xr-menu-input.mjs','xr-world-aperture.mjs','xr-ui-core.mjs','xr-spatial-core.mjs','xr-workspace.css','route-workshop.js','index.html','release.json','release-status.js','sw.js','bathhouse.js','bathhouse.css','portal-network-core.mjs','portal-network.js','cloudview-assets.js','cloudview-world.js','cloudview-ui.js','rider-motion-core.mjs','rider-motion.js','flight-deck.js','xr-input-core.mjs','xr-play.js','xr-webgl-compat.mjs','soundtrack.js','sensory-core.mjs','sensory.js','sensory.css','water-audio.mjs','delivery-upgrade.js','waterwheel-layout-core.mjs','waterwheel-preview.js','waterwheel-preview-art.mjs','waterwheel-preview.css','xr-overlay.mjs']
expected={name:hashlib.sha256((GAME/name).read_bytes()).hexdigest() for name in FILES}
url='https://v5ma.github.io/mario-maker-clone/svgn-paper-route/'
out=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-cycle-spatial-public'));out.mkdir(parents=True,exist_ok=True)
report={'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'expected':expected,'attempts':[],'passed':False}
try:
 for attempt in range(60):
  values={}
  for name in FILES:
   try:
    req=urllib.request.Request(url+name+'?verify='+str(time.time_ns()),headers={'Cache-Control':'no-cache','User-Agent':'Sky-Cycle-spatial-check'})
    with urllib.request.urlopen(req,timeout=12) as response:values[name]=hashlib.sha256(response.read()).hexdigest()
   except Exception as exc:values[name]='ERROR: '+str(exc)
  matches={name:values.get(name)==digest for name,digest in expected.items()}
  report['attempts'].append({'utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'actual':values,'matches':matches})
  print('Public file matches:',sum(matches.values()),'/',len(FILES),flush=True)
  if all(matches.values()):report['passed']=True;break
  time.sleep(12)
 assert report['passed'],'Public runtime did not match the accepted source'
finally:(out/'public-report.json').write_text(json.dumps(report,indent=2))
