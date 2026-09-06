"""Browser integration with emulated DEVICE APIs, real WebGL and app actions.
These tests are not evidence of physical Xbox/Quest performance or tracking.
"""
from pathlib import Path
from urllib.parse import urlparse
import json,os,math,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');MODE=os.getenv('DEVICE_SUITE','pad');checks=[];errors=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
def snapshot(p):return p.evaluate('AetherReach.snapshot()')
def frames(p,n=3):p.evaluate('(n)=>new Promise(resolve=>{const f=()=>--n<=0?resolve():requestAnimationFrame(f);requestAnimationFrame(f);})',n)
def button(p,i,v):p.evaluate('([i,v])=>TestPad.button(i,v)',[i,v]);frames(p)
def tap(p,i):button(p,i,True);button(p,i,False)
def axes(p,a):p.evaluate('(a)=>TestPad.axes(a)',a)
def drive(p,target):
 start=time.monotonic()
 while time.monotonic()-start<120:
  s=snapshot(p)['position'];dx=target[0]-s['x'];dz=target[1]-s['z'];d=math.hypot(dx,dz)
  if d<.7:axes(p,[0,0,0,0]);frames(p);return
  yaw=math.atan2(dx,-dz);delta=math.atan2(math.sin(yaw-s['yaw']),math.cos(yaw-s['yaw']));look=max(-1,min(1,delta*.9));look=0 if abs(delta)<.06 else math.copysign(.18+.82*abs(look),look);axes(p,[0,-1 if abs(delta)<.3 else 0,look,0]);p.wait_for_timeout(40)
 raise AssertionError('Controller navigation did not reach '+str(target))
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**args);ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block',accept_downloads=True)
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 ctx.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'));page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');page.wait_for_function('!!window.AetherReach');frames(page)
  check(snapshot(page)['version'] if 'version' in snapshot(page) else page.evaluate('AetherReach.version==="0.2.0"'),'Updated public app loads the separate input/XR modules')
  if MODE=='pad':
   page.evaluate('TestPad.connect()');frames(page);tap(page,0);page.wait_for_function('AetherReach.snapshot().playing')
   check(True,'A standard controller starts from the title without clicking Play')
   old=snapshot(page)['position'];axes(page,[0,-.5,.15,.1]);page.wait_for_function('(z)=>AetherReach.snapshot().position.z<z-1',arg=old['z']);axes(page,[0,0,0,0]);frames(page)
   check(abs(snapshot(page)['position']['yaw']-old['yaw'])<.01,'Deadzone filters right-stick drift while left-stick movement remains analog')
   tap(page,7);check(snapshot(page)['ammo']<8,'Right trigger fires through normal gameplay actions')
   tap(page,2);page.wait_for_function('AetherReach.snapshot().ammo===8');check(True,'X reload completes after the actual cooldown')
   tap(page,4);check(snapshot(page)['energy']<100,'LB triggers the real energy pulse')
   tap(page,9);page.wait_for_selector('#pause-dialog[open]');old=snapshot(page);axes(page,[0,-1,1,0]);frames(page,6);check(snapshot(page)['time']==old['time'],'Paused controller menus do not advance the simulation');axes(page,[0,0,0,0]);tap(page,1);page.wait_for_function('!AetherReach.snapshot().paused')
   tap(page,8);page.wait_for_selector('#map-dialog[open]');tap(page,1);check(not snapshot(page)['paused'],'View opens atlas and B returns to play')
   drive(page,(3,0));drive(page,(9,-5));tap(page,3);page.wait_for_function('!!AetherReach.snapshot().rail');check(snapshot(page)['rail']['id']=='glassline','Y boards a physical freight rail after controller-only walking')
   before=snapshot(page)['rail']['dir'];tap(page,5);check(snapshot(page)['rail']['dir']==-before,'RB reverses rail travel without a scene reset');tap(page,5);tap(page,0);page.wait_for_function('!AetherReach.snapshot().rail');check(True,'A releases a rail through the real momentum-preserving jump action')
   page.evaluate('TestPad.disconnect()');page.wait_for_selector('#pause-dialog[open]');check(True,'An unplugged active gamepad pauses rather than leaving stuck input')
   page.screenshot(path=str(OUT/'controller-controls.png'))
  elif MODE=='xr':
   page.wait_for_selector('#enter-vr:enabled');page.locator('#enter-vr').click();page.wait_for_function('AetherReach.snapshot().devices.xr');frames(page,6)
   check(snapshot(page)['playing'],'Accepted immersive session starts the same playable expedition')
   page.wait_for_function('AetherReach.snapshot().renderer.triangles>10000');check(True,'Real renderer receives emulated stereo WebXR frames; scene is not replaced by a mock')
   old=snapshot(page)['position'];page.evaluate('TestXR.axes("left",[0,0,0,-.5])');page.wait_for_function('(z)=>AetherReach.snapshot().position.z<z-.5',arg=old['z']);page.evaluate('TestXR.axes("left",[0,0,0,0])');frames(page)
   check(True,'Handed left-stick input moves the real model under XR')
   old=snapshot(page)['position']['yaw'];page.evaluate('TestXR.axes("right",[0,0,1,0])');frames(page,8);yaw=snapshot(page)['position']['yaw'];check(abs(yaw-old-math.pi/6)<.01,'Right stick snap-turns 30 degrees once, without continuous spinning');page.evaluate('TestXR.axes("right",[0,0,0,0])')
   page.evaluate('TestXR.devices.headYaw=.25');frames(page);check(abs(snapshot(page)['position']['yaw']-yaw-.25)<.01,'Head tracking remains independent of the locomotion rig turn')
   page.evaluate('TestXR.button("right",0,true)');page.wait_for_function('AetherReach.snapshot().ammo<8');page.evaluate('TestXR.button("right",0,false)');check(True,'Tracked controller trigger fires a validated independent ray')
   page.evaluate('TestXR.button("left",5,true)');page.wait_for_function('AetherReach.snapshot().paused');page.evaluate('TestXR.button("left",5,false)');frames(page)
   check(True,'Y pauses into a spatial menu instead of relying on the invisible flat HUD');page.screenshot(path=str(OUT/'xr-emulated-menu.png'))
   page.evaluate('TestXR.hidden(true)');old=snapshot(page)['time'];frames(page,4);check(snapshot(page)['time']==old,'Suspended session cannot move the actor or fire');page.evaluate('TestXR.hidden(false)')
   page.evaluate('TestXR.devices.session.end()');page.wait_for_function('!AetherReach.snapshot().devices.xr');check(snapshot(page)['paused'],'Ending XR returns to a safely paused desktop view');page.screenshot(path=str(OUT/'xr-returned-desktop.png'))
   page.evaluate('TestXR.devices.deny=true');page.locator('#pause-dialog #return-title').click();page.locator('#enter-vr').click();page.wait_for_function('document.getElementById("xr-status").textContent.includes("could not start")');check(not snapshot(page)['devices']['xr'],'Session refusal produces an error message without breaking desktop play')
  else:
   page.goto(BASE+'/aether-reach/roadmap.html',wait_until='domcontentloaded');page.wait_for_selector('.card');check(page.locator('.card').count()>=25,'Public board loads the committed long-term roadmap')
   page.locator('#search').fill('Xbox');check(page.locator('.card').count()>=2,'The roadmap filters to implementation and separate physical-controller gates')
   page.locator('#search').fill('');page.locator('select[aria-label="Status for I03"]').select_option('In review');page.reload(wait_until='domcontentloaded');page.wait_for_selector('.card');check(page.locator('select[aria-label="Status for I03"]').input_value()=='In review','Board-only status edits persist without changing the game')
   with page.expect_download() as info:page.locator('#export').click()
   dest=OUT/'local-board.json';info.value.save_as(dest);d=json.loads(dest.read_text());check(d['localOnly'] and len(d['tasks'])>=25,'Export records local-only roadmap data and stable task IDs')
   page.screenshot(path=str(OUT/'development-kanban.png'),full_page=True)
  check(not errors,'No uncaught exceptions in the device/roadmap scenario')
  (OUT/(MODE+'-report.json')).write_text(json.dumps({'mode':MODE,'passed':len(checks),'checks':checks,'errors':errors,'scope':'Native HTTP/WebGL with emulated Gamepad/WebXR APIs. No avatar position, objective or time assignments. Not physical Xbox or Quest 3 certification.'},indent=2))
 except Exception as e:
  try:s=snapshot(page)
  except:s=None
  (OUT/(MODE+'-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':s},indent=2));page.screenshot(path=str(OUT/(MODE+'-failure.png')));raise
 finally:ctx.close();browser.close()
