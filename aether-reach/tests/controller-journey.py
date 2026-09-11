"""Controller-only browser journeys. Read-only snapshots; no avatar/progress injection.
The emulated standard Gamepad API is not physical Xbox/Quest certification.
"""
from pathlib import Path
import json,math,os,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];native=[]
def check(value,label):
 assert value,label
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);c=b.new_context(viewport={'width':960,'height':640},device_scale_factor=.5,service_workers='block')
 c.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'))
 # Rendering preference only, never a simulation state, position or reward.
 c.add_init_script("if(!localStorage.getItem('aether-reach.visual.v1'))localStorage.setItem('aether-reach.visual.v1',JSON.stringify({mode:'low'}))")
 p=c.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)))
 def on_dialog(d):native.append(d.type);d.dismiss()
 p.on('dialog',on_dialog)
 def snap():return p.evaluate('AetherReach.snapshot()')
 def frames(n=3):p.evaluate('(n)=>new Promise(resolve=>{function f(){if(--n<=0)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f)})',n)
 def button(i,on):p.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);frames(1)
 def tap(i):p.evaluate('(i)=>new Promise(resolve=>{TestPad.button(i,true);requestAnimationFrame(()=>{TestPad.button(i,false);requestAnimationFrame(()=>resolve());});})',i)
 def axes(a):p.evaluate('(a)=>TestPad.axes(a)',a)
 def go(selector):
  # Inspect DOM ordering, then operate ONLY normal gamepad events.
  for _ in range(90):
   info=p.evaluate('''selector=>{const root=document.getElementById(AetherReach.snapshot().devices.menu),items=[...root.querySelectorAll('button,input:not([type="hidden"]),select,a[href]')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length),target=root.querySelector(selector);return{at:items.indexOf(document.activeElement),to:items.indexOf(target),focused:document.activeElement===target};}''',selector)
   assert info['to']>=0,'Missing enabled menu control '+selector
   if info['focused']:return
   tap(13 if info['at']<info['to'] else 12)
  raise AssertionError('Cannot navigate to '+selector)
 def choose(selector):go(selector);tap(0)
 def drive(target,limit=120):
  start=time.monotonic()
  while time.monotonic()-start<limit:
   s=snap();assert not s['paused'],'Unexpected modal while driving';q=s['position'];dx=target[0]-q['x'];dz=target[1]-q['z'];d=math.hypot(dx,dz)
   if d<.45:axes([0,0,0,0]);frames();return
   delta=math.atan2(math.sin(math.atan2(dx,-dz)-q['yaw']),math.cos(math.atan2(dx,-dz)-q['yaw']));look=0 if abs(delta)<.035 else math.copysign(.18+.82*min(1,abs(delta)*.8)**(1/1.35),delta)
   axes([0,-min(1,d) if abs(delta)<.2 else 0,look,0]);frames(2)
  raise AssertionError('Drive timed out '+str(target)+' at '+str(snap()['position']))
 try:
  p.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach');p.evaluate('TestPad.connect()');frames();tap(0);check(snap()['playing'],'A starts without mouse capture or pointer-lock permission')
  tap(9);choose('#pause-settings');go('#fov');value=int(p.locator('#fov').input_value());tap(15);check(int(p.locator('#fov').input_value())==value+1,'D-pad adjusts settings sliders without an OS popup')
  go('#visual-quality');tap(14);check(p.locator('#visual-quality').input_value()=='balanced','Native select is adjusted directly by controller rather than opening a system chooser');tap(15)
  go('#controller-toggle-aim');tap(0);go('#controller-toggle-sprint');tap(0)
  choose('#settings-controller');go('#bind-fire');tap(14);check(snap()['devices']['profile']['bindings']['fire']==6 and snap()['devices']['profile']['bindings']['aim']==7,'Remapping swaps fire and aim without losing either action')
  tap(1);check(snap()['devices']['menu']=='settings-dialog','B returns from bindings to settings, not to live combat');tap(1);check(snap()['devices']['menu']=='pause-dialog' and snap()['paused'],'Nested settings return to the still-paused parent and preserve focus');tap(1)
  ammo=snap()['ammo'];tap(6);check(snap()['ammo']<ammo,'Remapped LT fires through the gameplay action');tap(7);check(snap()['scoped'],'Toggle aim remains active after trigger release');tap(7);check(not snap()['scoped'],'Second aim press leaves the optic without mouse input')
  tap(9);choose('#pause-controller');choose('#controller-defaults');check(snap()['devices']['menu']=='confirm-dialog','Reset confirmation is an in-game navigable dialog');tap(1);check(snap()['devices']['profile']['bindings']['fire']==6,'B cancels a confirmation and preserves remapped controls');choose('#controller-defaults');choose('#confirm-accept');check(snap()['devices']['profile']['bindings']['fire']==7,'A can explicitly confirm a safe controller reset');tap(1);tap(1)
  tap(15);check(snap()['devices']['menu']=='shop-dialog','D-pad right opens the equipment catalogue even away from shops');tap(1)
  # Checkpoint is not fabricated: walk to the actual Quay outfitter and buy.
  drive((3,7));tap(15);choose('[data-buy="carbine"][data-kind="weapon"]');check('carbine' in snap()['owned'] and snap()['credits']==220,'Controller buys an owned weapon with real credits at the real kiosk');frames();check(p.evaluate('document.activeElement.dataset.buy')=='carbine','Shop redraw preserves the focused item instead of jumping to the top');tap(1)
  tap(9);choose('#pause-journal');go('[data-track="roof-beacons"]');tap(0);check(snap()['expedition']['tracked']=='roof-beacons','Adventure tracking works without mouse clicks');go('[data-track="open-sky"]');check(p.locator('[data-track="open-sky"]').evaluate('(e)=>{const r=e.getBoundingClientRect(),d=e.closest("dialog").getBoundingClientRect();return r.top>=d.top&&r.bottom<=d.bottom;}'),'Focus scrolls the last journal task into view');p.screenshot(path=str(OUT/'lumen-controller-journal.png'));tap(1);tap(1)
  tap(8);tap(1);check(not snap()['paused'],'View opens the atlas; B dismisses it and resumes')
  # Visit a real archive to populate the atlas, then inspect nested record UI.
  drive((-7,4));tap(3);p.wait_for_selector('#record-dialog[open]');tap(1);tap(8);choose('#journal button:not(:disabled)');check(snap()['devices']['menu']=='record-dialog','Controller opens an earned archive record from inside the atlas');tap(1);check(snap()['devices']['menu']=='map-dialog' and snap()['paused'],'Closing a record returns to its atlas parent without advancing combat');tap(1)
  # Reach the theatre ladder by existing streets, without changing avatar state.
  for target in [(-10,0),(-16,-6),(-70,-8),(-92,-8),(-92,0),(-107,0.1)]:drive(target)
  tap(3);p.wait_for_function('!!AetherReach.snapshot().climb');axes([0,-1,0,0]);p.wait_for_function('!AetherReach.snapshot().climb&&AetherReach.snapshot().grounded',timeout=90000);axes([0,0,0,0]);frames();check(abs(snap()['position']['y']-27.5)<.05,'Y and left stick climb continuously from the actual theatre street to the rooftop');check(snap()['stats']['rescues']==0,'The controller rooftop journey needs no rescue or teleport');p.screenshot(path=str(OUT/'lumen-theatre-rooftop.png'))
  tap(9);choose('#return-title');choose('#start');check(snap()['devices']['menu']=='confirm-dialog','Starting over protects the actual earned save with an in-game confirmation');tap(1);check('carbine' in json.loads(p.evaluate("localStorage.getItem('aether-reach.expedition.v1')"))['kit']['owns'],'Canceling a new expedition preserves earned equipment');choose('#continue');check('carbine' in snap()['owned'],'Continue reloads the earned equipment and checkpoint')
  p.evaluate('TestPad.disconnect()');frames();check(snap()['paused'],'Disconnect pauses active gameplay');p.evaluate('TestPad.connect();TestPad.button(7,true)');frames();tap(1);ammo=snap()['ammo'];frames(8);check(snap()['ammo']==ammo,'A trigger held across reconnect cannot fire on menu dismissal');button(7,False)
  check(not native,'No native alert, confirm or prompt interrupts the controller journey');check(not errors,'No uncaught exceptions across controller menus, settings, purchases and climbing')
  (OUT/'controller-journey-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'nativeDialogs':native,'scope':'Real HTTP/WebGL application and simulated Gamepad API. Normal controller actions only; no position, time, mission or credit injection. Input checks use a 960x640 CSS viewport at half pixel density. Physical Xbox and Quest QA remains pending.'},indent=2))
 except Exception as e:
  try:s=snap()
  except:s=None
  (OUT/'controller-journey-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':s},indent=2));p.screenshot(path=str(OUT/'controller-journey-failure.png'));raise
 finally:c.close();b.close()
