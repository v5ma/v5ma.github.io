"""Real application, synthetic six-button Touch input. No actor/progress edits.
Exercises the reported combination, not four disconnected feature toggles."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
checks=[];errors=[];shader=[];reports=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**args)
 for mode in ['diorama-ar','first-person-ar','diorama-vr']:
  ctx=browser.new_context(viewport={'width':960,'height':640},device_scale_factor=1,service_workers='block')
  ctx.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'));ctx.add_init_script(path=str(ROOT/'aether-reach/tests/hand-devices.js'))
  ctx.add_init_script('''navigator.xr.isSessionSupported=async m=>['immersive-vr','immersive-ar'].includes(m);const request=navigator.xr.requestSession.bind(navigator.xr);navigator.xr.requestSession=async(m,o)=>{const s=await request(m,o);s.environmentBlendMode=m==='immersive-ar'?'alpha-blend':'opaque';s.inputSources.forEach(i=>i.gamepad.buttons=i.gamepad.buttons.slice(0,6));return s;};''')
  p=ctx.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:shader.append(m.text) if m.type=='error' and any(x in m.text for x in ['Shader Error','WebGLProgram','VALIDATE_STATUS']) else None)
  def frames(n=4):p.evaluate('(n)=>new Promise(r=>{function f(){if(--n<=0)r();else requestAnimationFrame(f)}requestAnimationFrame(f)})',n)
  def snap():return p.evaluate('AetherReach.snapshot()')
  def tap(side,i):
   p.evaluate('([s,i])=>TestXR.button(s,i,true)',[side,i]);frames(2);p.evaluate('([s,i])=>TestXR.button(s,i,false)',[side,i]);frames(2)
  try:
   p.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/');p.wait_for_function('!!window.AetherReach')
   p.locator('#settings-button').click();p.locator('#visual-quality').select_option('low');p.locator('#settings-dialog form button').click()
   p.locator('#presentation-button').click();check('right stick aims' in p.locator('#presentation-dialog').inner_text(),mode+': entry explains aim and reload')
   p.locator('#xr-presentation').select_option(mode);p.locator('#presentation-back').click();p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr');frames(8)
   start=snap();saved=p.evaluate('localStorage.getItem("aether-reach.expedition.v1")');d=start['devices']['presentation']
   check(d['active'] and d['shellFaces']==0 and d['backdropSpritesHidden']>0,mode+': no filled enclosure faces or camera-facing cloud sheets')
   check(d['hudBackgroundAlpha']==0 and not d['menuVisible'],mode+': gameplay HUD background is fully transparent')
   check(start['devices']['xrTracking']['aimSource']=='twin-stick',mode+': physical pointing cannot take over combat aim')
   p.evaluate('TestXR.axes("left",[0,0,.35,0]);TestXR.axes("right",[0,0,.3,-.3]);TestXR.button("left",0,true);TestXR.button("right",0,true)');frames(10)
   moving=snap();check(abs(moving['position']['x']-start['position']['x'])+abs(moving['position']['z']-start['position']['z'])>.05,mode+': left stick moves while aiming and firing')
   check(moving['position']['yaw']>start['position']['yaw'] and moving['position']['pitch']>start['position']['pitch'],mode+': right stick aims both horizontally and vertically')
   check(moving['stats']['shots']>start['stats']['shots'] and moving['ammo']<start['ammo'],mode+': trigger fires without pointing into the miniature')
   check(moving['scoped'],mode+': left trigger supplies independent fine aim')
   p.evaluate('TestXR.axes("right",[0,0,0,0]);TestXR.button("right",0,false);TestXR.button("left",0,false);TestXR.button("right",5,true)');frames(2)
   reload=snap();check(reload['reload']>0 and not reload['paused'],mode+': B starts dedicated reload without opening a menu')
   p.evaluate('TestXR.button("right",5,false)');frames(8);p.evaluate('TestXR.axes("left",[0,0,0,0])');frames(3)
   after=snap();check(abs(after['position']['x']-reload['position']['x'])+abs(after['position']['z']-reload['position']['z'])>.03,mode+': movement remains live during reload')
   p.wait_for_function('AetherReach.snapshot().reload===0');check(snap()['ammo']==start['ammo'],mode+': recharge completes through normal game time')
   p.evaluate('TestXR.devices.headPitch=-.42;TestXR.devices.headRoll=.4;TestXR.devices.headX=.2');frames(8)
   tilted=snap();check(abs(tilted['position']['yaw']-after['position']['yaw'])<.001 and abs(tilted['position']['pitch']-after['position']['pitch'])<.001,mode+': head roll/lean/pitch does not aim the player')
   check(tilted['devices']['presentation']['anchor']==d['anchor'] and not tilted['devices']['presentation']['menuVisible'],mode+': aperture stays room-fixed without a following menu')
   p.screenshot(path=str(OUT/(mode+'-clear-window.png')))
   if mode=='first-person-ar':
    check(tilted['devices']['presentation']['cameraWindow'] and not tilted['devices']['presentation']['firstPersonAR']['lifeSize'],mode+': first-person is a window, not room-filling scenery')
   # A real tracked Y press opens pause; restore head before the known menu ray.
   p.evaluate('TestXR.devices.headPitch=0;TestXR.devices.headRoll=0;TestXR.devices.headX=0');frames(3);tap('left',5)
   check(snap()['paused'],mode+': Y pauses with the same controller')
   p.evaluate('TestXR.useHands()');frames(6);check(snap()['devices']['xrTracking']['trackedHands']==2,mode+': both hands retain spatial UI access')
   p.evaluate('TestXR.point("right",830,691);TestXR.pinch("right",false)');frames(3);p.evaluate('TestXR.pinch("right",true)');frames(3);p.wait_for_function('!AetherReach.snapshot().devices.xr')
   check(not snap()['devices']['presentation']['active'],mode+': genuine hand Exit restores the desktop view')
   check(p.evaluate('localStorage.getItem("aether-reach.expedition.v1")')==saved,mode+': mode transitions do not replace the saved expedition')
   check(snap()['stats']['rescues']==0,mode+': combined controls did not require a rescue or reset')
   reports.append({'mode':mode,'start':start,'combat':moving,'reload':reload,'headTilt':tilted,'end':snap()})
  except Exception as e:
   (OUT/'window-browser-failure.json').write_text(json.dumps({'mode':mode,'error':str(e),'checks':checks,'errors':errors,'shaderErrors':shader,'snapshot':snap()},indent=2))
   try:p.screenshot(path=str(OUT/'window-browser-failure.png'))
   except Exception:pass
   raise
  finally:ctx.close()
 check(not errors and not shader,'No application/shader errors in the three combined combat windows')
 (OUT/'window-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'shaderErrors':shader,'modes':reports,'scope':'Native WebGL actual game with ordinary UI and synthetic six-button Touch controllers/hands, not physical-device approval. No actor, health, inventory, mission or save assignment.'},indent=2));browser.close()
