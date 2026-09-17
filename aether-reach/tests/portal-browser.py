"""Ordinary DOM/Gamepad actions on the real app; XR poses are synthetic.
No player, mission, inventory, health or save is assigned by this test."""
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
 b=pw.chromium.launch(**args);c=b.new_context(viewport={'width':960,'height':640},device_scale_factor=1,service_workers='block')
 c.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'));c.add_init_script(path=str(ROOT/'aether-reach/tests/hand-devices.js'))
 c.add_init_script("""navigator.xr.isSessionSupported=async m=>['immersive-vr','immersive-ar'].includes(m);const req=navigator.xr.requestSession.bind(navigator.xr);navigator.xr.requestSession=async(m,o)=>{TestXR.devices.requestedMode=m;const s=await req(m,o);s.environmentBlendMode=m==='immersive-ar'?'alpha-blend':'opaque';return s;};""")
 p=c.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:shader.append(m.text) if m.type=='error' and any(x in m.text for x in ['Shader Error','WebGLProgram','VALIDATE_STATUS']) else None)
 def snap():return p.evaluate('AetherReach.snapshot()')
 def frames(n=3):p.evaluate('(n)=>new Promise(r=>{function f(){if(--n<=0)r();else requestAnimationFrame(f)}requestAnimationFrame(f)})',n)
 def tap(i):p.evaluate('(i)=>new Promise(r=>{TestPad.button(i,true);requestAnimationFrame(()=>{TestPad.button(i,false);requestAnimationFrame(r)})})',i)
 def presentation():
  if not snap()['paused']:tap(9);frames()
  p.locator('#pause-presentation').click()
 def enter(mode):
  presentation();p.locator('#xr-presentation').select_option(mode);p.locator('#presentation-back').click();p.locator('#return-title').click();p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr');frames(8)
 def exit_spatial():
  # A modal intentionally blocks the desktop header. Exit through the genuine
  # in-headset action, including after a visibility-loss pause.
  p.evaluate('TestXR.hidden(false);TestPad.disconnect();TestXR.useHands()');frames(6)
  p.evaluate('TestXR.point("right",830,691);TestXR.pinch("right",false)');frames()
  p.evaluate('TestXR.pinch("right",true)');frames();p.wait_for_function('!AetherReach.snapshot().devices.xr')
  p.evaluate('TestXR.pinch("right",false)')
 def centered():
  s=snap();return all(abs(s['position'][k]-s['devices']['presentation']['focus'][k])<1e-6 for k in ['x','y','z'])
 try:
  p.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/');p.wait_for_function('!!window.AetherReach');p.locator('#settings-button').click();p.locator('#visual-quality').select_option('low');p.locator('#settings-dialog form button').click();p.locator('#start').click();p.evaluate('TestPad.connect()');frames(5)
  check(p.evaluate('AetherReach.version')==json.loads((ROOT/'aether-reach/release.json').read_text())['version'],'Release identity matches checked-out source')
  tap(8);frames();check(snap()['devices']['menu']=='map-dialog','Xbox View opens the existing map');p.screenshot(path=str(OUT/'portal-goal-map.png'));tap(1);frames()
  check(bool(snap()['navigation']['name']) and snap()['navigation']['distance']>=0,'Read-only navigation exposes the actual tracked goal and distance')
  presentation();p.locator('#diorama-preview').click();p.wait_for_function('AetherReach.snapshot().devices.presentation.avatar==="ready"');frames(5)
  d=snap()['devices']['presentation'];check(d['fullDepth'] and d['portalMaterials']>10,'Live game uses depth-preserving aperture across loaded materials');check(centered(),'Courier begins exactly at the portal center')
  before=snap()['position'];p.evaluate('TestPad.axes([.45,0,0,0])');frames(15);p.evaluate('TestPad.axes([0,0,0,0])');frames();check(abs(snap()['position']['x']-before['x'])+abs(snap()['position']['z']-before['z'])>.1 and centered(),'Ordinary movement scrolls the world around the centered courier')
  p.evaluate('TestPad.axes([0,0,.6,0])');frames(12);p.evaluate('TestPad.axes([0,0,0,0])');frames();check(centered() and abs(snap()['devices']['presentation']['viewYaw']-snap()['position']['yaw'])<.01,'Behind-character camera follows deliberate look without center lag');p.screenshot(path=str(OUT/'portal-desktop.png'))
  saved=p.evaluate('localStorage.getItem("aether-reach.expedition.v1")');presentation();p.locator('#diorama-flat').click();frames();check(not snap()['devices']['presentation']['active'],'Returning to desktop restores the existing first-person scene');check(p.evaluate('localStorage.getItem("aether-reach.expedition.v1")')==saved,'Presentation does not replace saved expedition data')
  enter('diorama-ar');d=snap()['devices']['presentation'];check(p.evaluate('TestXR.devices.requestedMode')=='immersive-ar' and d['active'],'Portal AR requests immersive-ar explicitly');check(d['hudDocked'] and not d['uiHeadLocked'],'Diorama status is anchored to the box, not attached to the head')
  before=snap()['position'];anchor=d['anchor'];dock=d['hudStage'];p.evaluate('TestXR.devices.headX=.25;TestXR.devices.headYaw=.3;TestXR.devices.headRoll=.4');frames(10);s=snap();d=s['devices']['presentation'];check(all(abs(before[k]-s['position'][k])<.01 for k in ['x','y','z','yaw']),'Head lean, yaw and roll do not move or turn the courier');check(d['anchor']==anchor and d['hudStage']==dock,'Portal and status dock stay fixed through head motion');check(not d['menuVisible'],'No persistent menu plane obstructs portal gameplay');p.screenshot(path=str(OUT/'portal-head-roll.png'))
  p.evaluate('TestXR.devices.headX=0;TestXR.devices.headYaw=0;TestXR.devices.headRoll=0');frames();tap(9);frames();before=snap()['devices']['presentation']['menuStage'];p.evaluate('TestXR.devices.headRoll=.25;TestXR.devices.headX=.1');frames();check(before==snap()['devices']['presentation']['menuStage'],'Explicit diorama menu does not follow head roll or lean')
  p.evaluate('TestXR.devices.headX=0;TestXR.devices.headRoll=0;TestPad.disconnect();TestXR.useHands()');frames(6);check(snap()['devices']['xrTracking']['trackedHands']==2 and snap()['paused'],'Both tracked hands acquire safe spatial UI without gameplay movement')
  # Hand pinch uses the genuine ray hit and neutral gate at the now room-fixed menu.
  p.evaluate('TestXR.point("right",450,315);TestXR.pinch("right",false)');frames();p.evaluate('TestXR.pinch("right",true)');frames();p.evaluate('TestXR.pinch("right",false)');frames();check(snap()['devices']['xrTracking']['selections']>0,'Measured hand pinch operates the room-fixed menu')
  exit_spatial();p.evaluate('TestPad.connect()');frames()
  # Exit may retain a child dialog; unwind through real controls.
  for _ in range(4):
   if snap()['devices']['menu']=='pause-dialog':break
   p.keyboard.press('Escape');frames()
  enter('first-person-ar');d=snap()['devices']['presentation'];check(p.evaluate('TestXR.devices.requestedMode')=='immersive-ar' and not d['active'] and d['firstPersonAR']['active'],'First-person AR is life-size, not the miniature view');check(d['firstPersonAR']['alpha']==0,'First-person AR clears to transparent passthrough');before=snap()['position'];p.evaluate('TestPad.axes([0,-.4,0,0])');frames(12);p.evaluate('TestPad.axes([0,0,0,0])');frames();check(abs(snap()['position']['x']-before['x'])+abs(snap()['position']['z']-before['z'])>.05,'Xbox movement remains available in first-person AR');p.screenshot(path=str(OUT/'portal-first-person-ar.png'))
  p.evaluate('TestXR.hidden(true)');frames();check(snap()['paused'],'Hidden first-person AR pauses safely');exit_spatial();check(not snap()['devices']['presentation']['firstPersonAR']['active'],'AR exit restores non-AR rendering')
  check(not errors and not shader,'No application or shader errors across portal, head roll, hand UI and first-person AR')
  (OUT/'portal-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'shaderErrors':shader,'scope':'Actual application with DOM and synthetic Gamepad/XR inputs, supported Light graphics selected through Settings, 960x640 full pixel density. No physical-device or human-quality certification.'},indent=2))
 except Exception as e:
  (OUT/'portal-browser-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'shaderErrors':shader,'snapshot':snap()},indent=2));p.screenshot(path=str(OUT/'portal-browser-failure.png'));raise
 finally:c.close();b.close()
