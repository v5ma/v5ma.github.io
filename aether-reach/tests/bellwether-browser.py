"""Full district route via real Gamepad API events; no simulation/progress writes."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
checks=[];errors=[];native=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':960,'height':640},device_scale_factor=.5,service_workers='block')
 c.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'))
 c.add_init_script("localStorage.setItem('aether-reach.visual.v1',JSON.stringify({mode:'low'}))")
 c.add_init_script(path=str(ROOT/'aether-reach/tests/bellwether-input.js'))
 p=c.new_page();p.set_default_timeout(180000);p.on('pageerror',lambda e:errors.append(str(e)))
 def popup(d):native.append(d.type);d.dismiss()
 p.on('dialog',popup)
 def s():return p.evaluate('AetherReach.snapshot()')
 def tap(i):p.evaluate('(i)=>BlackoutDriver.tap(i)',i)
 def walk(x,z):p.evaluate('([x,z])=>BlackoutDriver.walk(x,z)',[x,z])
 def clear(prefix):p.evaluate('(p)=>BlackoutDriver.clear(p)',prefix)
 def go(sel):
  for _ in range(90):
   v=p.evaluate('''sel=>{const r=document.getElementById(AetherReach.snapshot().devices.menu),a=[...r.querySelectorAll('button,input:not([type="hidden"]),select,a[href]')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length);return[a.indexOf(document.activeElement),a.indexOf(r.querySelector(sel))]}''',sel)
   assert v[1]>=0,'Control missing '+sel
   if v[0]==v[1]:tap(0);return
   tap(13 if v[0]<v[1] else 12)
  raise AssertionError('Cannot reach '+sel)
 def use(expected):
  check(s()['interactionId']==expected,'Reach '+expected+' through physical movement')
  tap(2)
  if p.locator('#record-dialog[open]').count():tap(1)
 try:
  p.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach')
  check(p.evaluate('AetherReach.version')==json.loads((ROOT/'aether-reach/release.json').read_text())['version'],'The real application boots Bellwether Blackout')
  p.evaluate('TestPad.connect()');p.evaluate('BlackoutDriver.neutral()');tap(0)
  tap(9);go('#pause-blackout');check(s()['expedition']['tracked']=='bellwether-blackout','Pause shortcut tracks the district adventure without teleporting or rewarding the player');tap(1);tap(1)
  walk(3,7);tap(15);go('[data-buy="sniper"][data-kind="weapon"]');tap(1)
  check('sniper' in s()['carried'] and s()['credits']==100,'A real kiosk purchase equips the Longglass for the encounter')
  for x,z in [(-10,0),(-16,-6),(-70,-8),(-84,-4)]:walk(x,z)
  use('bell-dispatch');check(s()['bellwether']['stage']==1,'X starts the street encounter')
  clear(['bell-blackout-street','bell-warden','bell-marshal'])
  p.wait_for_function('AetherReach.snapshot().bellwether.stage===2')
  check(s()['stats']['shots']>0,'Actual scoped fire clears the street; no enemy health or mission progress was assigned')
  p.screenshot(path=str(OUT/'blackout-street.png'))
  # Save/continue from the legitimate Bellwether checkpoint, not a fabricated pose.
  tap(9);go('#return-title');go('#continue');check(s()['bellwether']['stage']==2 and s()['checkpoint']=='bellmarket','Save/continue preserves completed street progress and the real district checkpoint')
  for x,z in [(-95,-18),(-103,-21),(-103,-25),(-106.5,-26)]:walk(x,z)
  use('bell-maintenance');check('bell-maintenance' in s()['records'],'The physical maintenance card is recorded and B closes its dialog')
  for x,z in [(-106.5,-30),(-106.5,-32)]:walk(x,z)
  for _ in range(2):use('bell-dial-0')
  for x,z in [(-106.5,-30),(-103,-30),(-103,-32)]:walk(x,z)
  use('bell-dial-1')
  for x,z in [(-103,-30),(-99.5,-30),(-99.5,-32)]:walk(x,z)
  for _ in range(3):use('bell-dial-2')
  for x,z in [(-99.5,-30),(-99,-26)]:walk(x,z)
  p.screenshot(path=str(OUT/'blackout-arcade.png'));use('bell-test');check(s()['bellwether']['stage']==3,'Three independently operated circuits open the rooftop objective')
  for x,z in [(-103,-25),(-103,-21),(-95,-18),(-95,0),(-107,.1)]:walk(x,z)
  use('roof-bell-ladder');p.evaluate('TestPad.axes([0,-1,0,0])');p.wait_for_function('!AetherReach.snapshot().climb&&AetherReach.snapshot().grounded&&AetherReach.snapshot().position.y>27');p.evaluate('BlackoutDriver.neutral()')
  walk(-111,-3);walk(-111,-6);use('bell-signal');clear(['bell-blackout-roof'])
  p.wait_for_function('AetherReach.snapshot().enemies.some(e=>e.id.includes("bell-blackout-guardian")&&e.hp>0)')
  clear(['bell-blackout-guardian']);p.wait_for_function('AetherReach.snapshot().bellwether.stage===5')
  check(s()['bellwetherArt']['restored'],'Defeating the guard and holding the actual receiver restores the market lights')
  p.screenshot(path=str(OUT/'blackout-rooftop.png'))
  walk(-111,-3);walk(-107,-2.1);use('roof-bell-ladder');p.evaluate('TestPad.axes([0,1,0,0])');p.wait_for_function('!AetherReach.snapshot().climb&&AetherReach.snapshot().grounded&&AetherReach.snapshot().position.y<8');p.evaluate('BlackoutDriver.neutral()')
  walk(-95,0);walk(-84,-4);before=s()['credits'];use('bell-dispatch');check(s()['bellwether']['stage']==6 and s()['credits']==before+300,'The return journey awards the single 300-credit completion reward')
  tap(2);check(s()['credits']==before+300,'Repeating the dispatch interaction cannot duplicate payment')
  tap(9);go('#pause-journal');check(p.locator('[data-track="bellwether-blackout"]').is_disabled(),'The journal marks the adventure complete with controller navigation intact')
  p.screenshot(path=str(OUT/'blackout-completed-journal.png'));tap(1);go('#return-title');go('#continue')
  check(s()['bellwether']['stage']==6 and s()['bellwetherArt']['restored'],'The completed mission and repaired lights survive save/continue')
  check(not native,'No native alert or confirm blocks the controller-only journey');check(not errors,'No uncaught application errors through the full street-interior-rooftop loop')
  (OUT/'bellwether-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'nativeDialogs':native,'snapshot':s(),'scope':'Real HTTP Chromium software WebGL with emulated Gamepad API. Light profile at 960x640 CSS, half pixel density. All progression via ordinary controller play. No physical hardware, listening or frame-rate certification.'},indent=2))
 except Exception as e:
  try:state=s()
  except:state=None
  (OUT/'bellwether-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2))
  try:p.screenshot(path=str(OUT/'bellwether-failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
