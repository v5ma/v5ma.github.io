"""Production mask GPU fixture, not a gameplay completion or physical XR test."""
from pathlib import Path
import base64,json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'portal-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None;errors=[];results=[]
try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  options=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**options)
  try:
   page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
   page.goto(BASE+'tests/portal-render-fixture.html',wait_until='domcontentloaded');page.wait_for_function('window.fixtureReady',timeout=60000)
   for name,eye in [('front',[0,1.6,4]),('rear',[0,1.6,-4]),('left',[-4,1.6,0]),('right',[4,1.6,0]),('above',[.2,4,.2]),('inside',[0,.5,.1])]:
    r=page.evaluate('(eye)=>runPortalFixture(eye,true)',eye);(OUT/('mask-'+name+'.png')).write_bytes(base64.b64decode(r.pop('image')));results.append(r)
    assert r['inside']>20 and r['perEye'][0]>0 and r['perEye'][1]>0,r
    assert r['leaks']==0 and r['missing']==0 and r['foreground']==0 and r['glError']==0,r
    assert all(c[0]>190 and c[3]>240 for c in r['centers']),r
    print('PASS: per-eye aperture, distant depth, no foreground or external leak, automatic shell transparency:',name,flush=True)
   assert not errors,errors
   (OUT/'mask-report.json').write_text(json.dumps({'base':BASE,'passed':len(results),'results':results,'errors':errors,'limits':'Synthetic two-eye ArrayCamera and explicit geometric fixtures using production shader. Not physical headset, passthrough, gameplay completion or performance approval.'},indent=2))
  except Exception as e:
   (OUT/'mask-failure.json').write_text(json.dumps({'error':str(e),'results':results,'errors':errors},indent=2));raise
  finally:browser.close()
finally:
 if server:server.terminate()
