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
 p=c.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
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
  base=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')
  p.goto(base+'/aether-reach/tests/aurora-gallery.html',wait_until='domcontentloaded');p.wait_for_function('window.galleryReady===true');frames(45)
  check(len(p.evaluate('galleryStats()'))==3,'All three independent imported human rigs render in the asset fixture')
  check(not errors,'Human fabric and rift shaders compile in actual WebGL')
  p.screenshot(path=str(OUT/'aurora-human-asset-review.png'))
  p.goto(base+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach');p.wait_for_function('AetherReach.snapshot().renderer.cast.settled')
  check(p.evaluate('AetherReach.version')=='0.10.0','The existing application boots Aurora Cast')
  check(len(snap()['renderer']['cast']['loaded'])==3 and not snap()['renderer']['cast']['errors'],'All three same-origin character assets load successfully')
  p.evaluate('TestPad.connect()');frames();tap(0);frames(15)
  check(any(a['id']=='tavi' for a in snap()['renderer']['cast']['actors']),'Tavi is replaced by the animated courier in ordinary gameplay')
  look(-2.21,-.19);frames(30);p.screenshot(path=str(OUT/'aurora-tavi-in-game.png'))
  tap(9);choose('#pause-settings');go('#cast-characters');tap(0);frames()
  check(not snap()['renderer']['cast']['enabled'],'The controller can switch to the original lightweight human bodies')
  go('#cast-characters');tap(0);go('#cast-effects');tap(0)
  check(not snap()['renderer']['cast']['effects'],'The controller can disable the Aurora shader layer separately')
  tap(0);go('#visual-quality');tap(14);frames()
  check(p.locator('#visual-quality').input_value()=='balanced','Balanced mode enables the richer shader path through controller settings')
  tap(1);check(snap()['devices']['menu']=='pause-dialog','B returns from visual controls to the paused parent');tap(1);frames(20)
  check(snap()['renderer']['cast']['atmosphere']['cloudLayer'],'The bounded high-cloud shader is active outside Light mode')
  p.screenshot(path=str(OUT/'aurora-shader-gameplay.png'))
  # Return to the bounded Light profile for software-GPU gameplay assertions.
  tap(9);choose('#pause-settings');go('#visual-quality');tap(15);tap(1);tap(1)
  for x,z in [(3,7),(3,20),(8,26)]:drive(x,z)
  check(snap()['interactionId']=='arena-customs-yard','Ordinary controller movement reaches the existing Customs combat console')
  tap(2);frames(90)
  cast=snap()['renderer']['cast'];guards=[a for a in cast['actors'] if a['role']=='guard']
  check(len(guards)>0 and all(a['clip'] in ['Idle_Gun_Pointing','Idle_Gun_Shoot','Run_Shoot','HitRecieve','Death'] for a in guards),'Actual arena enemies use authored combat and movement animations')
  check(cast['visible']<=5 and cast['pool']<=10,'Light rendering respects the hard character budget during an arena fight')
  look(.97);frames(20);p.screenshot(path=str(OUT/'aurora-guards-in-combat.png'))
  tap(9);choose('#pause-journal');tap(1);tap(1)
  p.evaluate('TestPad.disconnect()');frames();check(snap()['paused'],'Disconnect still pauses combat after the visual upgrade')
  check(not native,'No native alert or confirm blocks the controller interfaces')
  check(not errors,'No uncaught application errors or shader-compile errors across gallery and live game')
  (OUT/'aurora-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'nativeDialogs':native,'snapshot':snap(),'scope':'Actual HTTP Chromium software WebGL, emulated standard Gamepad API. Gallery is explicitly a test-only asset fixture; gameplay uses normal controls, no player/enemy/progress writes. No physical Xbox/Quest or GPU frame-rate certification.'},indent=2))
 except Exception as e:
  try:state=snap()
  except:state=None
  (OUT/'aurora-browser-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2))
  try:p.screenshot(path=str(OUT/'aurora-browser-failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
