"""Real HTTP/WebGL water adventure. Only ordinary controller/keyboard input; no simulation writes."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
checks=[];errors=[];shaders=[];native=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as pw:
 kw=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);c=b.new_context(viewport={'width':1280,'height':800},device_scale_factor=.5,service_workers='block')
 c.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'))
 c.add_init_script(path=str(ROOT/'aether-reach/tests/bellwether-input.js'))
 c.add_init_script("if(location.protocol==='http:'||location.protocol==='https:')localStorage.setItem('aether-reach.visual.v1',JSON.stringify({mode:'low'}))")
 p=c.new_page();p.set_default_timeout(180000);p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('console',lambda m:shaders.append(m.text) if ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text or 'WebGLProgram' in m.text and m.type=='error') else None)
 def popup(d):native.append(d.type);d.dismiss()
 p.on('dialog',popup)
 def s():return p.evaluate('AetherReach.snapshot()')
 def tap(i):p.evaluate('(i)=>BlackoutDriver.tap(i)',i)
 def frames(n=4):p.evaluate('(n)=>new Promise(r=>{function f(){if(--n<=0)r();else requestAnimationFrame(f);}requestAnimationFrame(f)})',n)
 def walk(x,z):p.evaluate('([x,z])=>BlackoutDriver.walk(x,z)',[x,z])
 def go(sel):
  for _ in range(120):
   v=p.evaluate('''sel=>{const r=document.getElementById(AetherReach.snapshot().devices.menu),a=[...r.querySelectorAll('button,input:not([type="hidden"]),select,a[href]')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length);return[a.indexOf(document.activeElement),a.indexOf(r.querySelector(sel))]}''',sel)
   assert v[1]>=0,'Unavailable menu control '+sel
   if v[0]==v[1]:return
   tap(13 if v[0]<v[1] else 12)
  raise AssertionError('Cannot reach '+sel)
 def choose(sel):go(sel);tap(0)
 def use(id):
  check(s()['interactionId']==id,'Physical approach to '+id)
  tap(2);frames()
 def look(yaw,pitch=0):
  p.evaluate('''async ([yaw,pitch])=>{const end=performance.now()+90000;while(performance.now()<end){const p=AetherReach.snapshot().position,dy=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw)),dp=pitch-p.pitch;const axis=v=>Math.abs(v)<.025?0:Math.sign(v)*(.18+.82*Math.pow(Math.min(1,Math.abs(v)*1.1),1/1.35));if(Math.abs(dy)<.04&&Math.abs(dp)<.04){await BlackoutDriver.neutral();return;}TestPad.axes([0,0,axis(dy),-axis(dp)]);await new Promise(r=>requestAnimationFrame(r));}throw Error('Look input did not converge');}''',[yaw,pitch])
 try:
  base=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
  p.goto(base+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach')
  expected=json.loads((ROOT/'aether-reach/release.json').read_text())['version'];check(p.evaluate('AetherReach.version')==expected,'The real game boots the current Tideglass release')
  p.evaluate('TestPad.connect()');p.evaluate('BlackoutDriver.neutral()');tap(0)
  tap(9);choose('#pause-tideglass');check(s()['expedition']['tracked']=='tideglass-repair','Controller pause shortcut tracks water missions without moving the player');tap(1);tap(1)
  # Earn an actual safe Garden checkpoint via existing streets and relay interaction.
  for x,z in [(0,-15),(0,-36),(8,-42),(49,-28),(64,-32)]:walk(x,z)
  use('garden');tap(9);choose('#return-title');choose('#continue')
  check('garden' in s()['relays'],'The existing relay campaign remains playable')
  for x,z in [(65,-22),(76,-18),(80,-12),(113,12),(116,12)]:walk(x,z)
  use('tide-desk');check(s()['tideglass']['stage']==1 and s()['checkpoint']=='tideglass','The actual desk starts the mission and records the reservoir checkpoint')
  for x,z in [(118,8),(118,-14)]:walk(x,z)
  use('tide-valve-0');walk(118,-18);walk(148,-18);use('tide-valve-1')
  check(s()['tideglass']['valves']==[True,True],'Two separately reached valves isolate flow')
  for x,z in [(153,-18),(153,3),(143,3),(143,10),(138.4,9.2)]:walk(x,z)
  tap(9);choose('#pause-settings');go('#visual-quality');tap(14);tap(1);tap(1);frames(8)
  check(s()['waterArt']['detail']==1,'Balanced mode renders detailed water at the real basin')
  look(-.53,-.45);p.screenshot(path=str(OUT/'tideglass-pool.png'))
  use('tide-pool-ladder');p.evaluate('TestPad.axes([0,1,0,0])');p.wait_for_function('!AetherReach.snapshot().climb&&AetherReach.snapshot().tideglass.wet.swimming');p.evaluate('BlackoutDriver.neutral()')
  p.wait_for_function('!AetherReach.snapshot().tideglass.wet.submerged')
  check(s()['tideglass']['wet']['swimming'],'Descending the physical ladder transitions into surface swimming')
  tap(1);p.wait_for_function('AetherReach.snapshot().position.y<1.95&&AetherReach.snapshot().tideglass.wet.submerged')
  check(s()['waterArt']['underwater'],'B dives continuously and activates underwater fog')
  ammo=s()['ammo'];tap(7);check(s()['ammo']==ammo,'Submerged trigger presses do not waste ammunition')
  # Audio activation is a separate normal trusted key gesture, not a gamepad-autoplay claim.
  p.keyboard.press('Shift');frames(8);check(s()['audio']['underwater'],'The existing audio engine adopts the submerged filter')
  tap(9);choose('#pause-settings');before=s()['time'];go('#water-effects');tap(0);frames(6)
  check(s()['time']==before and not s()['waterArt']['effects'],'Controller graphics controls work underwater while simulation remains paused')
  tap(0);go('#reduced');tap(0);tap(1);tap(1);frames(8);check(s()['waterArt']['clock']==0,'Reduced motion freezes decorative water animation')
  tap(9);choose('#pause-settings');go('#reduced');tap(0);tap(1);tap(1)
  for x,z in [(134,-7)]:walk(x,z)
  use('tide-regulator');check(s()['tideglass']['stage']==2,'Ordinary swimming and X recover the actual submerged regulator')
  walk(130,-9);use('tide-plate-0');walk(137,3);use('tide-plate-1');look(-.4,.08);p.screenshot(path=str(OUT/'tideglass-underwater.png'))
  tap(0);p.wait_for_function('!AetherReach.snapshot().tideglass.wet.submerged')
  check(s()['tideglass']['wet']['swimming'],'A surfaces without exiting swimming or teleporting')
  walk(138.4,7);use('tide-pool-ladder');p.evaluate('TestPad.axes([0,-1,0,0])');p.wait_for_function('!AetherReach.snapshot().climb&&AetherReach.snapshot().grounded&&AetherReach.snapshot().position.y>5.9');p.evaluate('BlackoutDriver.neutral()')
  check(not s()['tideglass']['wet']['swimming'],'The ladder returns the player to the dry promenade')
  walk(146,12);use('tide-plate-2');check('tideglass-surveyed' in s()['expedition']['flags'],'The third independent survey pays its one-time reward')
  for x,z in [(147,3),(147,-3),(148,-7)]:walk(x,z)
  use('tide-pump');p.wait_for_function('AetherReach.snapshot().tideglass.level<2.26')
  check(s()['waterArt']['level']<2.26,'Pump controls lower the real rendered and simulated water surface')
  walk(144,-10);use('tide-install');p.wait_for_function('AetherReach.snapshot().tideglass.level>5.44')
  check(s()['waterArt']['fountains'],'Installing the regulator refills the basin and starts the return jets')
  for x,z in [(147,-3),(147,3),(147,18),(126,18)]:walk(x,z)
  look(.25,-.4);p.screenshot(path=str(OUT/'tideglass-restored.png'))
  walk(116,18);walk(116,12);before=s()['credits'];use('tide-desk');check(s()['credits']==before+240 and s()['tideglass']['stage']==4,'Returning to dispatch earns exactly the repair reward')
  tap(2);check(s()['credits']==before+240,'Repeated reporting cannot duplicate the repair payment')
  check(s()['stats']['rescues']==0,'The complete reservoir route needed no rescue shortcut')
  tap(9);choose('#pause-journal');check(p.locator('[data-track="tideglass-repair"]').is_disabled() and p.locator('[data-track="tideglass-survey"]').is_disabled(),'Both water adventures are complete in the controller journal')
  p.screenshot(path=str(OUT/'tideglass-journal.png'));tap(1);choose('#return-title');choose('#continue');frames(12)
  check(s()['tideglass']['stage']==4 and s()['waterArt']['fountains'] and s()['checkpoint']=='tideglass','Completed water objectives and restored supply survive save/continue')
  check(not errors and not shaders,'No uncaught errors or shader compiler errors in the actual water adventure')
  check(not native,'No native popup interrupts the controller-driven journey')
  (OUT/'tideglass-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'shaderErrors':shaders,'nativeDialogs':native,'snapshot':s(),'scope':'Actual HTTP/WebGL application; emulated standard Gamepad API; ordinary controls only. No player, health, inventory, water-level or objective injection. Light travel and Balanced pool rendering at 1280x800 CSS, half pixel density. Separate trusted keyboard audio activation. Not physical controller/headset, listening, player-art or consumer-GPU certification.'},indent=2))
 except Exception as e:
  try:state=s()
  except:state=None
  (OUT/'tideglass-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'shaderErrors':shaders,'state':state},indent=2))
  try:p.screenshot(path=str(OUT/'tideglass-failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
