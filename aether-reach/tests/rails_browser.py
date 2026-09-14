"""Real HTTP/WebGL rail journey. Ordinary keyboard input only; no pose writes."""
import os,json,time,math
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from graphics_driver import balanced_graphics
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
def snap(page):return page.evaluate('AetherReach.snapshot()')
def walk(page,points):
 held=set()
 def keys(new):
  nonlocal held
  for k in held-new:page.keyboard.up(k)
  for k in new-held:page.keyboard.down(k)
  held=new
 try:
  for x,z in points:
   begin=time.monotonic()
   while time.monotonic()-begin<120:
    s=snap(page)['position'];d=math.hypot(x-s['x'],z-s['z']);delta=math.atan2(math.sin(math.atan2(x-s['x'],-(z-s['z']))-s['yaw']),math.cos(math.atan2(x-s['x'],-(z-s['z']))-s['yaw']))
    if d<.8:break
    k=set()
    if abs(delta)>.055:k.add('ArrowRight' if delta>0 else 'ArrowLeft')
    if abs(delta)<.22:k.add('KeyW')
    keys(k);page.wait_for_timeout(35)
   else:raise AssertionError('Walking did not reach '+str((x,z))+' from '+str(s))
   keys(set())
 finally:keys(set())
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw);ctx=browser.new_context(viewport={'width':960,'height':640},service_workers='block');host=urlparse(BASE).hostname
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort());page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');page.wait_for_function('window.AetherReach');balanced_graphics(page);page.locator('#start').click();page.wait_for_function('AetherReach.snapshot().playing')
  expected=json.loads((ROOT/'aether-reach/release.json').read_text())['version'];check(page.evaluate('AetherReach.version')==expected,'The upgraded real application is running')
  walk(page,[(3,0),(9,-5)]);page.keyboard.press('KeyE',delay=100);page.wait_for_function('AetherReach.snapshot().rail?.id==="glassline"')
  page.keyboard.down('KeyW');page.wait_for_function('AetherReach.snapshot().rail?.s>16');before=snap(page)
  page.keyboard.down('ArrowRight');page.wait_for_function('(y)=>AetherReach.snapshot().target?.id==="gale-loop"&&Math.abs(AetherReach.snapshot().position.yaw-y)>.25',arg=before['position']['yaw']);page.keyboard.up('ArrowRight');page.keyboard.up('KeyW');ready=snap(page)
  check(ready['rail']['s']>before['rail']['s'] and ready['target']['id']=='gale-loop','Free-look acquires a different rail while travel continues independently')
  page.screenshot(path=str(OUT/'free-look-transfer.png'));page.keyboard.press('Space');page.wait_for_function('!AetherReach.snapshot().rail')
  released=snap(page);pos=released['position'];finite=all(math.isfinite(pos[k]) for k in ['x','y','z','yaw','pitch']);check(finite and released['stats']['rescues']==0,'Jump release preserves a valid carried state without rescue or scripted recovery')
  # The browser journey verifies the live release path and landing. Detailed
  # cross-rail catch timing is exercised deterministically in combat.test.mjs:
  # both directions, five windows each, plus twenty-one release/delay variants.
  page.wait_for_function('AetherReach.snapshot().grounded||AetherReach.snapshot().rail',timeout=120000)
  if snap(page).get('rail'):
   page.keyboard.down('KeyW');page.wait_for_function('!AetherReach.snapshot().rail',timeout=120000);page.keyboard.up('KeyW')
  land=snap(page);check(land['stats']['rescues']==0 and land['grounded'],'Released travel reaches a physical district without a rescue shortcut')
  if land['position']['x']<40:walk(page,[(0,-15),(0,-36),(8,-42),(49,-28),(65,-26)])
  else:walk(page,[(65,-26)])
  walk(page,[(78,-25)]);page.keyboard.press('KeyE',delay=100);page.wait_for_function('AetherReach.snapshot().owned.includes("carbine")');check(True,'The garden supply cache unlocks a weapon after actual rail exploration')
  page.screenshot(path=str(OUT/'glasshouse-diversity.png'));check(not errors,'No uncaught JavaScript errors in the rail journey')
  (OUT/'rails-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'snapshot':snap(page),'scope':'Native HTTP software WebGL. Ordinary keyboard input and read-only snapshots; no actor, economy, rail or mission state injection. Detailed rail-transfer timing remains covered by deterministic model tests.'},indent=2))
 except Exception as e:
  try:state=snap(page)
  except:state=None
  (OUT/'rails-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'snapshot':state},indent=2));page.screenshot(path=str(OUT/'rails-failure.png'));raise
 finally:ctx.close();browser.close()
