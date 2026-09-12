"""Real HTTP/WebGL + emulated gamepad. No player, reward, enemy or time writes."""
import json,math,os,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
checks=[];errors=[];native=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS',text,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':1280,'height':800},device_scale_factor=.5,service_workers='block')
 c.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'))
 c.add_init_script("localStorage.setItem('aether-reach.visual.v1',JSON.stringify({mode:'low'}))")
 p=c.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)))
 def dialog(d):native.append(d.type);d.dismiss()
 p.on('dialog',dialog)
 def snap():return p.evaluate('AetherReach.snapshot()')
 def frames(n=3):p.evaluate('(n)=>new Promise(resolve=>{function f(){if(--n<=0)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f)})',n)
 def tap(i):p.evaluate('(i)=>new Promise(resolve=>{TestPad.button(i,true);requestAnimationFrame(()=>{TestPad.button(i,false);requestAnimationFrame(resolve);});})',i)
 def held(i,on):p.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);frames()
 def go(sel):
  for _ in range(100):
   v=p.evaluate('''sel=>{const r=document.getElementById(AetherReach.snapshot().devices.menu),a=[...r.querySelectorAll('button,input:not([type="hidden"]),select,a[href]')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length);return [a.indexOf(document.activeElement),a.indexOf(r.querySelector(sel))]}''',sel)
   assert v[1]>=0,'Unavailable control '+sel
   if v[0]==v[1]:return
   tap(13 if v[0]<v[1] else 12)
  raise AssertionError('Controller focus failed '+sel)
 def choose(sel):go(sel);tap(0)
 def axes(a):p.evaluate('(a)=>TestPad.axes(a)',a)
 def look(yaw,pitch=0):
  start=time.monotonic()
  while time.monotonic()-start<90:
   q=snap()['position'];dy=math.atan2(math.sin(yaw-q['yaw']),math.cos(yaw-q['yaw']));dp=pitch-q['pitch']
   if abs(dy)<.04 and abs(dp)<.025:axes([0,0,0,0]);frames();return
   def axis(v):return 0 if abs(v)<.02 else math.copysign(.18+.82*min(1,abs(v)*1.1)**(1/1.35),v)
   axes([0,0,axis(dy),-axis(dp)]);frames(2)
  raise AssertionError('Controller look did not converge')
 def drive(x,z):
  start=time.monotonic()
  while time.monotonic()-start<130:
   q=snap()['position'];dx=x-q['x'];dz=z-q['z'];d=math.hypot(dx,dz)
   if d<.5:axes([0,0,0,0]);frames();return
   delta=math.atan2(math.sin(math.atan2(dx,-dz)-q['yaw']),math.cos(math.atan2(dx,-dz)-q['yaw']))
   turn=0 if abs(delta)<.04 else math.copysign(.18+.82*min(1,abs(delta)*.8)**(1/1.35),delta)
   axes([0,-min(1,d) if abs(delta)<.2 else 0,turn,0]);frames(2)
  raise AssertionError('Blocked route to '+str((x,z))+' at '+str(snap()['position']))
 try:
  p.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/index.html',wait_until='domcontentloaded')
  p.wait_for_function('!!window.AetherReach');check(p.evaluate('AetherReach.version')=='0.8.0','The actual game boots the new release')
  p.evaluate('TestPad.connect()');frames();tap(0);check(snap()['playing'],'Gamepad A starts without mouse capture')
  check(snap()['renderer']['foundry']['companionVisible'],'The original companion now has a rendered body')
  tap(1);check(snap()['crouched'],'B crouches');tap(1)
  tap(9);choose('#pause-settings');go('#audio-music');old=float(p.locator('#audio-music').input_value());tap(14);check(float(p.locator('#audio-music').input_value())<old,'Music volume is independently adjustable by controller')
  tap(1);check(snap()['devices']['menu']=='pause-dialog','B closes settings back to paused parent');tap(1)
  drive(3,7);tap(15);choose('[data-buy="sniper"][data-kind="weapon"]');check('sniper' in snap()['carried'],'The real outfitter sells a carried sniper for earned credits');tap(1)
  look(1.06,.08)
  held(6,True);frames(25);f4=snap()['fov'];tap(10);frames(25);f8=snap()['fov'];check(f8<f4*.65 and snap()['combat']['zoom']==8,'L3 changes actual telescope magnification from 4x to 8x')
  check(p.locator('#scope-view').is_visible() and not p.locator('#crosswind-scope').is_visible(),'Exactly one telescope mask is visible')
  p.screenshot(path=str(OUT/'foundry-8x-optic.png'));held(6,False);frames(25);check(snap()['fov']>60,'Releasing aim restores the normal camera projection')
  # A normal keyboard gesture separately exercises the browser audio unlock path.
  # It is not represented as gamepad-only autoplay or physical listening QA.
  p.keyboard.press('Shift');frames(20);tap(7);frames(6)
  check(snap()['audio']['state']=='running','The browser audio context runs after normal user activation')
  check(any(abs(v)>1e-8 for v in p.evaluate('AetherReach.audioSample()')),'WebAudio produces nonzero mixed output after user activation')
  look(2.35)
  held(4,True);frames(35);held(4,False);frames(10)
  check(len(snap()['combat']['traps'])==1 and snap()['renderer']['foundry']['dynamicVisible']>=1,'A real charged trap has a visible ground device')
  for x,z in [(3,20),(8,26)]:drive(x,z)
  check(snap()['interactionId']=='arena-customs-yard','The arena has an approachable labeled physical console')
  tap(2);frames(120);check(snap()['combat']['battle']['phase']=='active','X starts actual humanoid arena combat without a patrol crash')
  check(any(e['humanoid'] and e['id'].startswith('arena-') for e in snap()['enemies']),'Actual arena attackers are present')
  look(.97)
  p.screenshot(path=str(OUT/'foundry-customs-combat.png'));tap(9);choose('#pause-journal');p.screenshot(path=str(OUT/'foundry-controller-journal.png'));tap(1);tap(1)
  check(not native,'No native alert/confirm interrupts the game menus');check(not errors,'No uncaught JavaScript errors in the rendered game journey')
  p.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/roadmap.html',wait_until='domcontentloaded');p.wait_for_selector('.card')
  check(p.locator('.card').count()>=50,'The canonical production board includes the updated release and AAA-quality backlog')
  p.screenshot(path=str(OUT/'foundry-roadmap.png'))
  (OUT/'foundry-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'nativeDialogs':native,'scope':'Actual HTTP Chromium software WebGL and emulated Gamepad API. Light profile, half pixel density. Normal play/menu controls; separate keyboard user activation for audio. Not physical Xbox/Quest, listening or frame-rate certification.'},indent=2))
 except Exception as e:
  try:state=snap()
  except:state=None
  (OUT/'foundry-browser-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2))
  try:p.screenshot(path=str(OUT/'foundry-browser-failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
