"""Native HTTP/WebGL visual review, with ordinary gameplay input.
The camera-only architecture plate is a separate renderer fixture, not gameplay
progress evidence. Matched gameplay images use the same default spawn and look.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,math,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');OLD=os.getenv('BEFORE_BASE_URL','http://127.0.0.1:4174').rstrip('/');checks=[];errors=[];reports={}
def check(ok,name):
 assert ok,name
 checks.append(name);print('PASS',name,flush=True)
def snap(page):return page.evaluate('AetherReach.snapshot()')
def look(page,yaw,pitch):
 for _ in range(30):
  p=snap(page)['position'];dy=math.atan2(math.sin(yaw-p['yaw']),math.cos(yaw-p['yaw']));dp=pitch-p['pitch']
  if abs(dy)<.003 and abs(dp)<.003:return
  dx=max(-200,min(200,dy/.004));dz=max(-180,min(180,-dp/.004));page.mouse.move(600,490);page.mouse.down();page.mouse.move(600+dx,490+dz,steps=2);page.mouse.up();page.wait_for_timeout(60)
 raise AssertionError('Look input did not settle')
def walk(page,x,z):
 held=set();start=time.monotonic()
 try:
  while time.monotonic()-start<100:
   p=snap(page)['position'];d=math.hypot(x-p['x'],z-p['z'])
   if d<.8:return
   target=math.atan2(x-p['x'],-(z-p['z']));dy=math.atan2(math.sin(target-p['yaw']),math.cos(target-p['yaw']));new=set()
   if abs(dy)>.07:new.add('ArrowRight' if dy>0 else 'ArrowLeft')
   if abs(dy)<.3:new.add('KeyW')
   for k in held-new:page.keyboard.up(k)
   for k in new-held:page.keyboard.down(k)
   held=new;page.wait_for_timeout(35)
  raise AssertionError('Walk failed '+str((x,z)))
 finally:
  for k in held:page.keyboard.up(k)
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**args)
 def context(mobile=False,blocked=False):
  c=browser.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':960},has_touch=mobile,is_mobile=mobile,service_workers='block')
  host=urlparse(BASE).hostname
  c.route('**/*',lambda r:r.abort() if blocked and '/art/' in r.request.url else r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
  return c
 try:
  for variant,url in [('before',OLD),('after',BASE)]:
   c=context();page=c.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(url+'/aether-reach/index.html',wait_until='domcontentloaded');page.wait_for_function('!!window.AetherReach')
   if variant=='after':
    page.wait_for_function('AetherReach.snapshot().renderer.art?.settled');a=snap(page)['renderer']['art'];check(len(a['loaded'])==6 and not a['errors'],'All six real artwork groups load from local public files');check(a['profile']=='desktop','Desktop uses its intended detailed assets')
   page.locator('#start').click();page.wait_for_function('AetherReach.snapshot().playing&&!AetherReach.snapshot().paused');page.locator('#world').focus()
   initial=snap(page)
   for label,yaw,pitch in [('street',0,.04),('facade',-1.95,.25),('customs',.55,.22),('paving',0,-.47)]:
    look(page,yaw,pitch);page.screenshot(path=str(OUT/(variant+'-'+label+'.png')));reports[variant+'-'+label]=snap(page)['renderer']
   check(math.hypot(snap(page)['position']['x']-initial['position']['x'],snap(page)['position']['z']-initial['position']['z'])<.01,'Matched '+variant+' captures leave the real rider at the same spawn')
   if variant=='after':
    page.keyboard.press('KeyB');page.wait_for_selector('#shop-dialog[open]');check(page.locator('[data-kind="weapon"]').count()==3,'The existing weapon shop remains usable after the art replacement');page.locator('#shop-dialog form button').click();page.wait_for_function('!AetherReach.snapshot().paused')
    page.locator('#world').focus();walk(page,3,4);walk(page,7,4);page.keyboard.press('KeyE',delay=100);page.wait_for_selector('#field-dialog[open]');check(snap(page)['tactics']['learned'],'The original field mission is reachable through unchanged map space');page.locator('#field-close').click();page.wait_for_function('!AetherReach.snapshot().paused');page.locator('#world').focus();walk(page,3,0);walk(page,9,-5);page.keyboard.press('KeyE',delay=100);page.wait_for_function('!!AetherReach.snapshot().rail');check(snap(page)['rail']['id']=='glassline' and snap(page)['stats']['rescues']==0,'A real walking route reaches the original Glasshouse rail without clipping or rescue');page.screenshot(path=str(OUT/'after-rail-entry.png'))
   c.close()
  # Render-only comparison is explicitly not a claim of reaching this camera by play.
  for variant,url in [('before',OLD),('after',BASE)]:
   c=context();page=c.new_page();page.set_default_timeout(90000)
   page.goto(url+'/aether-reach/tests/quay-plate.html',wait_until='domcontentloaded');page.wait_for_function('window.PlateReady===true');page.screenshot(path=str(OUT/(variant+'-architecture-plate.png')));reports[variant+'-plate']=page.evaluate('PlateStats');c.close()
  c=context(mobile=True);page=c.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');page.wait_for_function('window.AetherReach&&AetherReach.snapshot().renderer.art?.settled');a=snap(page)['renderer']['art'];check(a['profile']=='mobile' and len(a['loaded'])==6 and not a['errors'],'The low-width profile loads smaller model and texture variants successfully');page.locator('#start').tap();page.screenshot(path=str(OUT/'after-mobile.png'));check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The artwork does not break mobile HUD width');c.close()
  c=context(blocked=True);page=c.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');page.wait_for_function('window.AetherReach&&AetherReach.snapshot().renderer.art?.settled');check(len(snap(page)['renderer']['art']['errors'])==6,'Unavailable optional assets are reported and keep their original fallback scenery');page.locator('#start').click();page.keyboard.down('KeyW');page.wait_for_function('AetherReach.snapshot().position.z<3');page.keyboard.up('KeyW');check(True,'Asset download failure does not disable the existing playable game');c.close()
  check(not errors,'No uncaught exceptions in successful or fallback art loading')
  (OUT/'quay-art-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'views':reports,'errors':errors,'scope':'Actual HTTP software-WebGL. Matching first-person captures use normal input; architecture plates are separate identical-camera renderer fixtures. No hardware-performance or artistic-approval claim.'},indent=2))
 except Exception as e:
  (OUT/'quay-art-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'views':reports,'errors':errors},indent=2))
  try:page.screenshot(path=str(OUT/'quay-art-failure.png'))
  except:pass
  raise
 finally:browser.close()
