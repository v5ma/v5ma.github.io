"""Native HTTP, actual WebGL and ordinary keyboard/UI. Observation is read-only.
The full round must physically reach the far hemisphere and come home again.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def read(p):return p.evaluate('LittlePlanet.inspect()')
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);c=b.new_context(viewport={'width':1440,'height':950},record_video_dir=str(OUT/'video'),service_workers='block')
 host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 p=c.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  p.goto(BASE+'/little-planet/',wait_until='domcontentloaded');p.wait_for_function('window.LittlePlanet')
  check(read(p)['render']['triangles']>10000,'The application draws real planet, buildings, characters and trees in WebGL')
  check(read(p)['render']['projection']=='perspective','The world uses a perspective 3D camera')
  p.screenshot(path=str(OUT/'01-whole-planet.png'))
  p.locator('#start').click();p.locator('#world').focus();p.keyboard.press('KeyE');check(any(e['type']=='talk' for e in read(p)['events']),'An ordinary E press talks to the starting neighbor')
  p.keyboard.down('KeyW');p.wait_for_function('LittlePlanet.inspect().distance>3');p.keyboard.up('KeyW');p.wait_for_function('Math.abs(LittlePlanet.inspect().speed)<.2')
  check(read(p)['n'][0]>.07,'Walking changes position along the sphere, not a flat level')
  p.keyboard.press('Space');p.wait_for_function('LittlePlanet.inspect().lift>.2');check(True,'Jump lifts the actual character away from the radial surface');p.wait_for_function('LittlePlanet.inspect().lift===0')
  p.keyboard.press('KeyF');check(read(p)['mode']=='bike','F unfolds a real bicycle in the same spherical world')
  p.screenshot(path=str(OUT/'02-start-exploring.png'))
  min_y=1
  for stop,num in [('stop-1',1),('stop-2',2),('stop-4',3),('stop-6',4),('stop-0',4)]:
   p.locator('#world').focus();p.keyboard.down('KeyW');p.wait_for_function('(id)=>LittlePlanet.inspect().near===id',arg=stop,timeout=220000);p.keyboard.up('KeyW');p.wait_for_function('Math.abs(LittlePlanet.inspect().speed)<.7')
   p.keyboard.press('KeyE');p.wait_for_function('(n)=>LittlePlanet.inspect().delivered.length===n',arg=num)
   state=read(p);min_y=min(min_y,state['n'][1]);check(state['near']==stop,'Physically reached '+stop+' using normal forward riding')
   if stop=='stop-2':p.screenshot(path=str(OUT/'03-windmill-bridge.png'))
   if stop=='stop-4':
    check(state['n'][1]<-.95,'The rider reached the opposite hemisphere without a teleport or scene switch')
    p.keyboard.press('KeyV');p.wait_for_timeout(500);p.screenshot(path=str(OUT/'04-far-side-chase.png'));p.keyboard.press('KeyV');p.wait_for_timeout(500);p.screenshot(path=str(OUT/'05-far-side-planet.png'));p.keyboard.press('KeyV')
  check(read(p)['completed'] and read(p)['visited'] and len(read(p)['visited'])==8,'A complete physical circumnavigation delivers all parcels and discovers eight neighborhoods')
  check(read(p)['distance']>195,'The completed journey is a full spherical-world route rather than moving a backdrop')
  p.screenshot(path=str(OUT/'06-home-again.png'))
  p.locator('#atlas').click();p.wait_for_selector('#atlas-dialog[open]');before=read(p);p.wait_for_timeout(400);check(read(p)['steps']==before['steps'],'The atlas pauses movement without teleporting the player');p.screenshot(path=str(OUT/'07-planet-atlas.png'));p.locator('#close-atlas').click();p.wait_for_function('!LittlePlanet.inspect().paused')
  p.locator('#world').focus();p.keyboard.down('KeyS');p.wait_for_function('LittlePlanet.inspect().speed<-3');p.keyboard.up('KeyS');check(True,'The bicycle can reverse to revisit paths')
  p.locator('#pause').click();p.wait_for_selector('#pause-dialog[open]');q=read(p);p.wait_for_timeout(300);check(read(p)['steps']==q['steps'],'Pause clears held controls and freezes the actual simulation');p.locator('#resume').click();p.wait_for_function('!LittlePlanet.inspect().paused')
  before=read(p);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.LittlePlanet');check(read(p)['completed'] and read(p)['delivered']==before['delivered'],'Delivered parcels and completion survive a real page reload')
  check(p.evaluate('!!localStorage.getItem("svgn.little-planet.v1")'),'Progress uses an isolated Little Planet save namespace')
  p.set_viewport_size({'width':390,'height':844});p.screenshot(path=str(OUT/'08-mobile-title.png'));check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The title and game UI fit a phone-width viewport')
  check(not errors,'No uncaught browser errors during the full round')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'lowestRadialY':min_y,'completedRound':before,'scope':'Native HTTP and software WebGL; ordinary keys/UI, no gameplay state or clock assignments. Physical phone/GPU/controller performance not measured.'},indent=2))
 except Exception as e:
  try:q=read(p)
  except:q=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':q},indent=2))
  try:p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
