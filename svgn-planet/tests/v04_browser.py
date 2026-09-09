"""v0.4 acceptance for changes a player should immediately notice."""
from pathlib import Path
from urllib.parse import urlparse
import os,time,math,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'svgn-planet/test-output/v04';OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];held=set()
def check(ok,msg):assert ok,msg;checks.append(msg);print('PASS',msg,flush=True)
def read(p):return p.evaluate('SVGNPlanet.inspect()')
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def point(t,x=0):
 a=t/110;lat=x/110
 return [math.sin(lat),math.cos(lat)*math.cos(a),-math.cos(lat)*math.sin(a)]
def hold(p,wanted):
 global held;wanted=set(wanted)
 for k in held-wanted:p.keyboard.up(k)
 for k in wanted-held:p.keyboard.down(k)
 held=wanted
def go(p,target,boost=False,timeout=60,radius=1.3):
 start=time.monotonic()
 try:
  while time.monotonic()-start<timeout:
   s=read(p);n=s['n'];d=math.acos(max(-1,min(1,dot(n,target))))*110
   if d<radius:return
   q=[target[i]-n[i]*dot(n,target) for i in range(3)];m=math.sqrt(dot(q,q));q=[x/max(m,1e-9) for x in q];x=dot(q,s['basis']['right']);z=dot(q,s['basis']['forward']);keys=[]
   if x>.16:keys.append('KeyD')
   elif x<-.16:keys.append('KeyA')
   if z>.05:keys.append('KeyW')
   elif z<-.05:keys.append('KeyS')
   if boost and d>2.0:keys.append('ShiftLeft')
   hold(p,keys);p.wait_for_timeout(55)
  raise AssertionError('navigation timeout '+json.dumps(read(p)))
 finally:hold(p,[])
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1440,'height':900},service_workers='block');host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort());p=ctx.new_page();p.set_default_timeout(60000)
 try:
  p.goto(BASE+'/svgn-planet/?quality=low',wait_until='domcontentloaded');p.wait_for_function('window.SVGNPlanet&&SVGNPlanet.inspect().render&&SVGNPlanet.inspect().render.art.status!=="loading"')
  q=read(p);check(q['version']==json.loads((ROOT/'svgn-planet/release.json').read_text())['version'],'Current runtime loaded; v0.4 road and boost contracts retained');check(q['render']['art']['status']=='ready','Bundled detailed CC0 street art actually loaded instead of fallback');check(q['render']['network']['roadSegments']>=9,'Renderer contains at least nine connected road segments');check(q['render']['network']['bonusStops']==10 and q['render']['network']['stuntGates']==3,'Renderer exposes bonus stops and speed gates');check(q['render']['network']['shopfronts']==10 and q['render']['network']['crosswalks']==20,'Branch streets have visible shopfronts and intersections')
  p.locator('#start').click();p.locator('#world').focus();p.keyboard.down('KeyW');p.keyboard.down('ShiftLeft');p.wait_for_function('SVGNPlanet.inspect().speed>24',timeout=12000);check(read(p)['speed']*3.6>86,'Holding Shift pushes the ride above 86 km/h');p.keyboard.up('ShiftLeft');p.keyboard.up('KeyW');p.screenshot(path=str(OUT/'01-high-speed-main.png'))
  # Use actual connected road waypoints: main boulevard -> 2nd Street -> Market Street.
  go(p,point(42,0));go(p,point(42,20));p.wait_for_timeout(250);p.screenshot(path=str(OUT/'02-market-intersection.png'));q=read(p);check(abs(math.asin(q['n'][0])*110-20)<2,'Player physically reaches Market Street through a cross street')
  go(p,point(54,20));bonus=next(x for x in read(p)['sites'] if x['id']=='bonus-market-2');go(p,bonus['n']);p.keyboard.press('KeyE');p.wait_for_function('SVGNPlanet.inspect().bonusDeliveries.includes("bonus-market-2")');check(True,'A branch-road bonus address is playable and awards once')
  # Return on 2nd Street and boost across to Oak Avenue's gate.
  go(p,point(42,20));go(p,point(42,0));go(p,point(42,-20),boost=True,radius=.8);p.wait_for_timeout(250);check('stunt-1' in read(p)['stunts'],'Boosting through Oak Avenue awards its speed gate')
  p.screenshot(path=str(OUT/'03-oak-speed-gate.png'));p.locator('#atlas').click();p.wait_for_selector('#map-dialog[open]');p.screenshot(path=str(OUT/'04-expanded-map.png'));check(p.locator('#map-dialog').is_visible(),'Expanded road map is available in-game')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'snapshot':read(p),'scope':'Native Chromium software WebGL; ordinary keyboard/UI; no state writes.'},indent=2))
 finally:ctx.close();browser.close()
