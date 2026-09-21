"""Full application with ordinary UI/Touch/hand input and read-only observations.
No writes to player, inventory, health, mission, save or clock. Not hardware QA.
"""
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
 b=pw.chromium.launch(**args);ctx=b.new_context(viewport={'width':960,'height':640},device_scale_factor=1,service_workers='block')
 ctx.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'));ctx.add_init_script(path=str(ROOT/'aether-reach/tests/hand-devices.js'))
 ctx.add_init_script('''navigator.xr.isSessionSupported=async m=>['immersive-vr','immersive-ar'].includes(m);const req=navigator.xr.requestSession.bind(navigator.xr);navigator.xr.requestSession=async(m,o)=>{const s=await req(m,o);s.environmentBlendMode=m==='immersive-ar'?'alpha-blend':'opaque';s.inputSources.forEach(i=>i.gamepad.buttons=i.gamepad.buttons.slice(0,6));return s;};''')
 p=ctx.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:shader.append(m.text) if m.type=='error' and any(s in m.text for s in ['Shader Error','WebGLProgram','VALIDATE_STATUS']) else None)
 def snap():return p.evaluate('AetherReach.snapshot()')
 def work():return snap()['devices']['presentation']['workspace']
 def frames(n=3):p.evaluate('(n)=>new Promise(r=>{function f(){if(--n<=0)r();else requestAnimationFrame(f)}requestAnimationFrame(f)})',n)
 def settled():p.wait_for_function('AetherReach.snapshot().devices.presentation.workspace.progress>.995')
 def tap(side,i):
  p.evaluate('([s,i])=>TestXR.button(s,i,true)',[side,i]);frames(2);p.evaluate('([s,i])=>TestXR.button(s,i,false)',[side,i]);frames(2)
 def pin(x,y,side='right'):
  settled();p.evaluate('([s,x,y])=>{TestXR.point(s,x,y);TestXR.pinch(s,false)}',[side,x,y]);frames(2);p.evaluate('s=>TestXR.pinch(s,true)',side);frames(2);p.evaluate('s=>TestXR.pinch(s,false)',side);frames(2)
 def indices(selector):return p.evaluate('''sel=>{const r=document.getElementById(AetherReach.snapshot().devices.menu),a=[...r.querySelectorAll('button,input:not([type="hidden"]),select,textarea,a[href],summary')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getAttribute('aria-disabled')!=='true'&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');return [a.indexOf(document.activeElement),a.indexOf(r.querySelector(sel))]}''',selector)
 def choose(selector):
  for _ in range(12):
   active,target=indices(selector);assert target>=0,selector
   if active//5==target//5:pin(450,315+(target%5)*60);return
   pin(180 if active//5>target//5 else 500,633)
  raise AssertionError('Unreachable menu item '+selector)
 try:
  url=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/'
  p.goto(url);p.wait_for_function('!!window.AetherReach');p.locator('#settings-button').click();p.locator('#visual-quality').select_option('low');p.locator('#settings-dialog form button').click()
  version=json.loads((ROOT/'aether-reach/release.json').read_text())['version'];check(p.evaluate('AetherReach.version')==version,'Ordinary launcher serves the expected playtest version')
  p.locator('#presentation-button').click();p.locator('#xr-presentation').select_option('diorama-ar');p.locator('#presentation-back').click();p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr');frames(8)
  s=snap();saved=p.evaluate('localStorage.getItem("aether-reach.expedition.v1")');w=work()
  check(w['active'] and not w['open'] and w['interactiveButtons']==0,'Rotunda starts stowed with no invisible menu hit targets')
  check(w['hudDock']=='left' and not w['headLocked'] and not w['attachedToWindow'],'Status starts beside the controller, not on the head or diorama border')
  check(s['devices']['presentation']['hudBackgroundAlpha']==0,'Compact status has no opaque background plane')
  p.evaluate('TestXR.axes("right",[0,0,.65,.12]);TestXR.button("right",0,true)');frames(10)
  shot=snap();p.evaluate('TestXR.axes("right",[0,0,0,0]);TestXR.button("right",0,false)');frames(2)
  check(shot['position']['yaw']>s['position']['yaw'] and abs(shot['position']['pitch'])<=abs(s['position']['pitch'])+.001,'Guided sweep turns horizontally without small vertical thumb drift')
  check(shot['stats']['shots']>s['stats']['shots'] and shot['renderer']['shotFeedback']['events']>0,'Real trigger shots produce visible-feedback events')
  check(shot['renderer']['shotFeedback']['last']['origin'] is not None and shot['renderer']['shotFeedback']['visualOnly'],'Feedback records the real shot origin and endpoint without extra damage')
  p.evaluate('TestXR.button("left",0,true);TestXR.axes("right",[0,0,0,-.6])');frames(6);elevated=snap();p.evaluate('TestXR.button("left",0,false);TestXR.axes("right",[0,0,0,0])');frames(2)
  check(elevated['position']['pitch']>shot['position']['pitch'],'Fine aim retains deliberate upward targeting')
  tap('right',5);p.wait_for_function('AetherReach.snapshot().reload===0');check(snap()['ammo']==s['ammo'],'Existing starter recharge replenishes shots without purchases or new ammo rules')
  tap('left',5);settled();w=work();check(snap()['paused'] and w['open'] and w['interactiveButtons']>0,'Y opens the actual raised menu and pauses visibly')
  check(w['progress']>.995 and w['panelRoomPosition']['y']>.9,'Workspace rises to its configured physical working height')
  before=w['anchor'];p.evaluate('TestXR.devices.headX=.2;TestXR.devices.headRoll=.4;TestXR.devices.headPitch=-.3');frames(6)
  check(work()['anchor']==before,'Head lean and tilt do not drag the raised workspace through the scene')
  p.screenshot(path=str(OUT/'rotunda-raised-ar.png'))
  p.evaluate('TestXR.devices.headX=0;TestXR.devices.headRoll=0;TestXR.devices.headPitch=0;TestXR.useHands()');frames(6)
  choose('#pause-workspace');check(snap()['devices']['menu']=='workspace-dialog','Real hand pointing reaches rotunda preferences through the full pause menu')
  choose('#workspace-height');old=work()['config']['height'];pin(500,691);check(work()['config']['height']>old,'Hand adjustment raises the workspace without changing the game window')
  choose('#workspace-scale');old=work()['config']['scale'];pin(500,691);check(work()['config']['scale']>old,'Resizing the panel through its actual spatial controls remains selectable')
  choose('#workspace-distance');old=work()['config']['distance'];pin(180,691);check(work()['config']['distance']<old,'Distance can be adjusted after resizing through the same hit regions')
  choose('#workspace-yaw');old=work()['config']['yaw'];pin(500,691);check(work()['config']['yaw']>old,'Rotating the workspace preserves working spatial selection')
  choose('#workspace-guidedAim');check(not work()['config']['guidedAim'],'Guided third-person aim is optional and can be disabled in headset')
  choose('#workspace-motion');check(not work()['config']['motion'],'Motion can be disabled without native browser controls')
  p.screenshot(path=str(OUT/'rotunda-adjusted-hand-ui.png'));configured=work()['config'];check(p.evaluate('localStorage.getItem("aether-reach.expedition.v1")')==saved,'Workspace changes do not replace expedition saves')
  pin(830,633);check(snap()['devices']['menu']=='pause-dialog','Spatial Back returns to the visible paused parent')
  choose('#resume');frames(3);check(not work()['open'] and work()['interactiveButtons']==0,'Dismissing the rotunda removes all menu hit targets')
  p.evaluate('TestXR.useControllers();TestXR.devices.rays={};TestXR.axes("left",[0,0,.5,0])');frames(8);moved=snap();p.evaluate('TestXR.axes("left",[0,0,0,0])');frames(2)
  check(not moved['paused'] and abs(moved['position']['x']-shot['position']['x'])+abs(moved['position']['z']-shot['position']['z'])>.01,'Gameplay movement resumes after hand menu transforms without reset')
  tap('left',5);settled();p.evaluate('TestXR.useHands()');frames(4);pin(830,691);p.wait_for_function('!AetherReach.snapshot().devices.xr');check(not work()['active'],'Hand Exit actually ends XR and removes the workspace')
  p.reload();p.wait_for_function('!!window.AetherReach');check(work()['config']==configured,'Reload preserves workspace preferences separately from the expedition')
  check(p.evaluate('localStorage.getItem("aether-reach.expedition.v1")')==saved,'Reload keeps the same expedition storage record')
  p.locator('#workspace-button').click();p.locator('#workspace-reset').click();check(work()['config']['height']==1.12,'Workspace reset only restores bounded UI preferences')
  check(p.evaluate('localStorage.getItem("aether-reach.expedition.v1")')==saved,'Workspace reset never clears saved gameplay')
  check(not errors and not shader,'No application or shader errors during combat, transformations, hand menus, exit or reload')
  (OUT/'rotunda-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'shaderErrors':shader,'scope':'Actual HTTP/HTTPS full application, supported low graphics, full pixel density 960x640, synthetic Touch/hand input. No physical headset or human-usability approval. No game-state injection.'},indent=2))
 except Exception as e:
  (OUT/'rotunda-browser-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'shaderErrors':shader,'snapshot':snap()},indent=2))
  try:p.screenshot(path=str(OUT/'rotunda-browser-failure.png'))
  except Exception:pass
  raise
 finally:ctx.close();b.close()
