"""Actual HTTP/WebGL application; synthetic tracked devices, not physical QA."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
checks=[];errors=[];shader=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**args);c=b.new_context(viewport={'width':960,'height':640},device_scale_factor=.5,service_workers='block')
 c.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'));c.add_init_script(path=str(ROOT/'aether-reach/tests/hand-devices.js'))
 c.add_init_script("if(location.protocol.startsWith('http'))localStorage.setItem('aether-reach.visual.v1',JSON.stringify({mode:'low'}))")
 p=c.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('console',lambda m:shader.append(m.text) if m.type=='error' and any(k in m.text for k in ['Shader Error','WebGLProgram','VALIDATE_STATUS']) else None)
 def snap():return p.evaluate('AetherReach.snapshot()')
 def frames(n=6):p.evaluate('(n)=>new Promise(r=>{function f(){if(--n<=0)r();else requestAnimationFrame(f)}requestAnimationFrame(f)})',n)
 def pin(side,x,y):
  p.evaluate('([s,x,y])=>{TestXR.point(s,x,y);TestXR.pinch(s,false)}',[side,x,y]);frames()
  p.evaluate('(s)=>TestXR.pinch(s,true)',side);frames()
  p.evaluate('(s)=>TestXR.pinch(s,false)',side);frames()
 def indices(selector):return p.evaluate('''sel=>{const r=document.getElementById(AetherReach.snapshot().devices.menu),a=[...r.querySelectorAll('button,input:not([type="hidden"]),select,textarea,a[href],summary')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getAttribute('aria-disabled')!=='true'&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');return [a.indexOf(document.activeElement),a.indexOf(r.querySelector(sel)),a.length]}''',selector)
 def choose(selector,side='right'):
  for _ in range(20):
   active,target,total=indices(selector);assert target>=0,selector
   if active//5==target//5:pin(side,450,315+(target%5)*60);return
   pin(side,180 if active//5>target//5 else 500,633)
  raise AssertionError('Could not reach spatial page '+selector)
 try:
  p.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach');p.wait_for_function('Object.values(AetherReach.snapshot().renderer.cast.status).every(v=>v==="ready")')
  p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr');frames(20)
  check('hand-tracking' in p.evaluate('TestXR.devices.requested.optionalFeatures'),'XR requests optional articulated hand tracking without requiring it for controller users')
  check(snap()['devices']['xrTracking']['trackedControllers']==2,'Both tracked controller poses are accepted independently')
  check(snap()['renderer']['cast']['limit']==4,'Immersive rendering retains the four-character budget')
  check(all(a['grounding']['legs']==2 for a in snap()['renderer']['cast']['actors']),'Rendered humanoids expose two grounded leg adapters')
  p.evaluate('TestXR.pinch("right",true);TestXR.useHands()');frames(16)
  check(snap()['paused'],'Switching to hands without controllers safely opens the real pause menu')
  check(snap()['devices']['xrTracking']['trackedHands']==2 and snap()['devices']['xrTracking']['jointCount']==50,'Both hands render measured joints; no controller pose is substituted for joints')
  before=snap()['devices']['xrTracking']['selections'];p.evaluate('TestXR.point("right",450,315)');frames(8)
  check(snap()['devices']['xrTracking']['selections']==before,'A pinch held during hand acquisition cannot activate the newly opened menu')
  ammo=snap()['ammo'];energy=snap()['energy'];choose('#pause-settings')
  check(snap()['devices']['menu']=='settings-dialog','A tracked hand ray and deliberate pinch open actual Settings')
  choose('#controller-look-curve','left');old=float(p.locator('#controller-look-curve').input_value());pin('left',500,691)
  check(float(p.locator('#controller-look-curve').input_value())>old,'The left hand reaches later settings pages and increases a slider without native UI')
  pin('left',180,691);check(abs(float(p.locator('#controller-look-curve').input_value())-old)<.001,'The same slider can be decreased from the in-headset toolbar')
  choose('#visual-quality');old=p.locator('#visual-quality').input_value();pin('right',180,691);check(p.locator('#visual-quality').input_value()!=old,'A select control changes using spatial adjustment, without an invisible OS popup')
  p.screenshot(path=str(OUT/'grounded-hand-settings.png'))
  pin('right',830,633);check(snap()['devices']['menu']=='pause-dialog' and snap()['paused'],'Spatial Back returns to the paused parent rather than live combat')
  choose('#pause-controller');choose('#bind-fire');old=snap()['devices']['profile']['bindings']['fire'];pin('right',180,691)
  check(snap()['devices']['profile']['bindings']['fire']!=old,'Hand UI reaches long controller-binding pages and performs the same safe binding swap')
  # Return the profile to its prior binding through the ordinary inverse adjustment.
  pin('right',500,691);check(snap()['devices']['profile']['bindings']['fire']==old,'Inverse spatial adjustment restores the previous binding without changing save progress')
  pin('right',830,633);choose('#pause-journal');choose('[data-track="open-sky"]','left')
  check(snap()['expedition']['tracked']=='open-sky','Hand paging reaches and tracks an adventure beyond the first page')
  pin('right',830,633);frames();before=snap()['devices']['xrTracking']['selections'];p.evaluate('TestXR.track("right",false);TestXR.track("left",false)');frames()
  check(snap()['devices']['xrTracking']['trackedHands']==0 and snap()['devices']['xrTracking']['jointCount']==0,'Lost joints hide the hands and remove stale selection poses')
  p.evaluate('TestXR.pinch("right",true);TestXR.track("right",true);TestXR.track("left",true)');frames(10)
  check(snap()['devices']['xrTracking']['selections']==before,'Reacquiring a closed hand does not replay its pinch')
  check(snap()['ammo']==ammo and snap()['energy']==energy,'Hand gestures never fire a weapon or cast a gameplay power')
  p.evaluate('TestXR.useControllers();TestXR.button("right",0,true)');frames(10);check(snap()['devices']['xrTracking']['trackedControllers']==2,'Controller tracking resumes after the hand-only menu session')
  p.evaluate('TestXR.button("right",0,false);TestXR.useHands()');frames(10);p.screenshot(path=str(OUT/'grounded-hand-pause.png'))
  pin('right',830,691);p.wait_for_function('!AetherReach.snapshot().devices.xr')
  check(snap()['paused'],'The spatial Exit VR control ends the session and returns to safely paused desktop play')
  check(not errors and not shader,'No application or shader exceptions across controller/hand transitions, menus and exit')
  (OUT/'grounded-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'shaderErrors':shader,'scope':'Actual HTTP Chromium software WebGL application. Synthetic XR controller, hand joints and pinch poses; DOM reads and device inputs only. Not physical Quest 3 tracking/comfort/performance certification.'},indent=2))
 except Exception as e:
  (OUT/'grounded-browser-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'shaderErrors':shader,'state':snap()},indent=2));p.screenshot(path=str(OUT/'grounded-browser-failure.png'));raise
 finally:c.close();b.close()
