"""A real-key flight from Glasshouse rail to Garden ground. No state injection."""
import json,math,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173');checks=[];errors=[]
def snap(p):return p.evaluate('AetherReach.snapshot()')
def check(v,label):
 assert v,label
 checks.append(label);print('PASS',label,flush=True)
def travel(page,target,air=False):
 held=set();start=time.monotonic()
 try:
  while time.monotonic()-start<150:
   s=snap(page);p=s['position'];dx=target[0]-p['x'];dz=target[1]-p['z'];d=math.hypot(dx,dz)
   if (not air and d<.7) or (air and not s['glider']['active']):return s
   delta=math.atan2(math.sin(math.atan2(dx,-dz)-p['yaw']),math.cos(math.atan2(dx,-dz)-p['yaw']))
   keys=set()
   if abs(delta)>.055:keys.add('ArrowRight' if delta>0 else 'ArrowLeft')
   if air:keys.add('KeyS' if d<18 else 'KeyW')
   elif abs(delta)<.3:keys.add('KeyW')
   for k in held-keys:page.keyboard.up(k)
   for k in keys-held:page.keyboard.down(k)
   held=keys;page.wait_for_timeout(30)
  raise AssertionError('Navigation timed out '+json.dumps(snap(page)))
 finally:
  for k in held:page.keyboard.up(k)
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**kw);ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');page.wait_for_function('!!window.AetherReach');page.locator('#start').click()
  page.keyboard.press('KeyG');check(not snap(page)['glider']['active'],'A foldwing cannot be used as a ground takeoff engine')
  travel(page,(3,0));travel(page,(9,-5));page.keyboard.press('KeyE');page.wait_for_function('AetherReach.snapshot().rail?.id==="glassline"');page.wait_for_function('AetherReach.snapshot().rail.s>=38')
  page.keyboard.press('Space');page.keyboard.press('KeyG');page.wait_for_function('AetherReach.snapshot().glider.active')
  check(snap(page)['rail'] is None,'The foldwing opens after a real rail release, not while attached')
  page.keyboard.press('KeyP');page.wait_for_selector('#pause-dialog[open]');before=snap(page);page.wait_for_timeout(250)
  check(snap(page)['glider']==before['glider'] and snap(page)['position']==before['position'],'Pausing freezes both flight and canopy charge')
  page.locator('#resume').click();page.wait_for_function('!AetherReach.snapshot().paused');page.locator('#world').focus()
  page.screenshot(path=str(OUT/'foldwing-from-rail.png'))
  end=travel(page,(69,-18),air=True)
  check(end['stats']['rescues']==0 and end['stats']['glideDistance']>15,'A full controlled glide reaches the garden without rescue or player-position assignments')
  check(abs(end['position']['y']-6)<.05 and 47<=end['position']['x']<=83 and -42<=end['position']['z']<=-10,'The landing happens on actual garden terrain')
  check(not end['glider']['active'],'The canopy folds automatically on landing')
  old=end['glider']['charge'];page.wait_for_function('(n)=>AetherReach.snapshot().glider.charge>n',arg=old);check(True,'Charge replenishes on the ground rather than continuously in free fall')
  travel(page,(64,-29));page.keyboard.press('KeyE');page.wait_for_function('AetherReach.snapshot().relays.includes("garden")');check(True,'A restored relay remains reachable after the gliding route')
  page.screenshot(path=str(OUT/'glider-garden-landing.png'))
  check(not errors,'No uncaught exceptions in the native flight scenario')
  (OUT/'glide-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'state':snap(page),'errors':errors,'scope':'Native HTTP software WebGL; keyboard and UI inputs only. No physical Quest or Xbox certification.'},indent=2))
 except Exception as e:
  (OUT/'glide-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'state':snap(page),'errors':errors},indent=2));page.screenshot(path=str(OUT/'glide-failure.png'));raise
 finally:ctx.close();browser.close()
