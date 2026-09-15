"""Real HTTP application. Explicit synthetic XR inputs, not hardware certification."""
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
 b=pw.chromium.launch(**args);c=b.new_context(viewport={'width':960,'height':640},device_scale_factor=.75,service_workers='block')
 c.add_init_script(path=str(ROOT/'aether-reach/tests/fake-devices.js'));c.add_init_script(path=str(ROOT/'aether-reach/tests/hand-devices.js'))
 c.add_init_script("""if(location.protocol.startsWith('http'))localStorage.setItem('aether-reach.visual.v1',JSON.stringify({mode:'low'}));
 navigator.xr.isSessionSupported=async mode=>['immersive-vr','immersive-ar'].includes(mode);
 const request=navigator.xr.requestSession.bind(navigator.xr);navigator.xr.requestSession=async(mode,opts)=>{TestXR.devices.requestedMode=mode;const s=await request(mode,opts);s.environmentBlendMode=mode==='immersive-ar'?'alpha-blend':'opaque';return s;};""")
 p=c.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:shader.append(m.text) if m.type=='error' and any(s in m.text for s in ['Shader Error','WebGLProgram','VALIDATE_STATUS']) else None)
 def snap():return p.evaluate('AetherReach.snapshot()')
 def frames(n=3):p.evaluate('(n)=>new Promise(r=>{function f(){if(--n<=0)r();else requestAnimationFrame(f)}requestAnimationFrame(f)})',n)
 # One sampled physical press; multi-frame holds correctly auto-repeat on a slow software GPU.
 def tap(i):p.evaluate('(i)=>new Promise(resolve=>{TestPad.button(i,true);requestAnimationFrame(()=>{TestPad.button(i,false);requestAnimationFrame(()=>resolve());});})',i)
 def choose(sel):
  for _ in range(24):
   a,t=p.evaluate('''sel=>{const r=document.getElementById(AetherReach.snapshot().devices.menu),items=[...r.querySelectorAll('button,input:not([type="hidden"]),select,a[href]')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length);return[items.indexOf(document.activeElement),items.indexOf(r.querySelector(sel))]}''',sel)
   assert t>=0,sel
   if a==t:tap(0);return
   tap(13 if a<t else 12)
  raise AssertionError('Controller cannot reach '+sel)
 def pin(side,x,y):
  p.evaluate('([s,x,y])=>{TestXR.point(s,x,y);TestXR.pinch(s,false)}',[side,x,y]);frames()
  p.evaluate('(s)=>TestXR.pinch(s,true)',side);frames();p.evaluate('(s)=>TestXR.pinch(s,false)',side);frames()
 def hand_choose(sel):
  for _ in range(20):
   a,t=p.evaluate('''sel=>{const r=document.getElementById(AetherReach.snapshot().devices.menu),items=[...r.querySelectorAll('button,input:not([type="hidden"]),select,a[href]')].filter(e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getClientRects().length);return[items.indexOf(document.activeElement),items.indexOf(r.querySelector(sel))]}''',sel)
   assert t>=0,sel
   if a//5==t//5:pin('right',450,315+t%5*60);return
   pin('left',180 if a//5>t//5 else 500,633)
  raise AssertionError('Hand cannot reach '+sel)
 def close_to(a,b,eps=.08):return sum((a[k]-b[k])**2 for k in ['x','y','z'])**.5<eps
 try:
  p.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach')
  check(p.evaluate('AetherReach.version')=='0.12.0','The actual application boots the authored chapter release')
  p.evaluate('TestPad.connect()');frames();choose('#presentation-button');check(snap()['devices']['menu']=='presentation-dialog','Xbox reaches the presentation menu from the title without a mouse')
  choose('#diorama-preview');p.wait_for_function('AetherReach.snapshot().devices.presentation.avatar==="ready"');frames(8)
  s=snap();check(s['playing'] and s['devices']['presentation']['preview'],'Desktop preview starts the existing expedition with a real third-person courier')
  check(s['devices']['presentation']['clippedMaterials']>10 and s['devices']['presentation']['avatarHeight']==1.76,'World geometry is clipped into the enclosure and the animated courier has calibrated scale')
  p.screenshot(path=str(OUT/'diorama-desktop.png'))
  before=s['position'];p.evaluate('TestPad.axes([.5,0,0,0])');frames(12);p.evaluate('TestPad.axes([0,0,0,0])');frames();check(not close_to(before,snap()['position']),'Xbox moves the courier in the playable desktop diorama')
  tap(9);choose('#pause-presentation')
  for opening in ['top','front','both']:
   p.locator('#diorama-opening').select_option(opening);frames();d=snap()['devices']['presentation'];check(d['topOpen'] or d['frontOpen'],'Enclosure remains open in configuration '+opening)
   p.locator('#presentation-back').click();p.locator('#resume').click();frames(8);p.screenshot(path=str(OUT/('diorama-'+opening+'.png')));tap(9);choose('#pause-presentation')
  persisted=p.evaluate('localStorage.getItem("aether-reach.expedition.v1")');choose('#diorama-flat');frames();check(not snap()['devices']['presentation']['active'],'Returning to first-person restores the normal renderer without reinitializing the expedition')
  check(p.evaluate('localStorage.getItem("aether-reach.expedition.v1")')==persisted,'Presentation changes do not replace the expedition save')
  # Explicit VR entry is a real DOM user gesture; tracking and movement are synthetic device inputs.
  tap(9);choose('#pause-presentation');p.locator('#xr-presentation').select_option('diorama-vr');p.locator('#presentation-back').click();p.locator('#return-title').click();p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr');frames(15)
  check(p.evaluate('TestXR.devices.requestedMode')=='immersive-vr' and snap()['devices']['presentation']['active'],'Third-person VR requests an immersive VR session and uses the diorama rig')
  p.evaluate('TestPad.disconnect()');frames();# Disconnect safely pauses; resume with the real visible dialog.
  if snap()['paused']:p.locator('#resume').click()
  frames();before=snap()['position'];p.evaluate('TestXR.devices.headX=.24;TestXR.devices.headYaw=.25');frames(10)
  check(close_to(before,snap()['position']) and abs(before['yaw']-snap()['position']['yaw'])<.01,'Looking and leaning around the diorama never moves or turns the courier')
  p.evaluate('TestXR.devices.headX=0;TestXR.devices.headYaw=0');frames();p.evaluate('TestXR.axes("left",[0,0,.5,0])');frames(12);p.evaluate('TestXR.axes("left",[0,0,0,0])');frames();check(not close_to(before,snap()['position']),'Tracked left-controller movement drives the courier, independent of head pose')
  p.evaluate('TestPad.connect()');frames();before=snap()['position'];p.evaluate('TestPad.axes([-.5,0,0,0])');frames(12);p.evaluate('TestPad.axes([0,0,0,0])');frames();check(snap()['devices']['standardXR'] and not close_to(before,snap()['position']),'An Xbox-compatible pad can control the same expedition inside XR')
  p.evaluate('TestPad.axes([0,0,.6,0])');frames(12);p.evaluate('TestPad.axes([0,0,0,0])');frames();yaw=snap()['position']['yaw'];p.wait_for_timeout(1100);frames();check(abs(yaw-snap()['position']['yaw'])<.01,'Idle tracked controllers do not steal aiming after the last Xbox action')
  p.evaluate('TestPad.disconnect();TestXR.useHands()');frames(12);check(snap()['paused'],'Hands-only acquisition opens safe UI instead of creating unintended locomotion')
  hand_choose('#pause-presentation');hand_choose('#diorama-scale');old=snap()['devices']['presentation']['scale'];pin('left',500,691);check(snap()['devices']['presentation']['scale']>old,'Tracked hands reach and adjust the actual diorama scale slider')
  hand_choose('#diorama-opening');frames();d=snap()['devices']['presentation'];check(d['topOpen'] or d['frontOpen'],'Hand selection of enclosure openings retains the visibility invariant')
  p.screenshot(path=str(OUT/'diorama-vr-hands.png'));pin('right',830,691);p.wait_for_function('!AetherReach.snapshot().devices.xr')
  check(snap()['paused'] and not snap()['devices']['presentation']['active'],'Spatial Exit restores the safely paused first-person desktop renderer')
  # AR is explicitly selected, not silently substituted by VR.
  if snap()['devices']['menu']=='presentation-dialog':p.locator('#presentation-back').click()
  if snap()['devices']['menu']!='pause-dialog':p.keyboard.press('Escape')
  p.locator('#pause-presentation').click();p.locator('#xr-presentation').select_option('diorama-ar');p.locator('#presentation-back').click();p.locator('#return-title').click();p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr');frames(12)
  check(p.evaluate('TestXR.devices.requestedMode')=='immersive-ar' and snap()['devices']['presentation']['mode']=='diorama-ar','Passthrough diorama explicitly requests immersive AR')
  check(snap()['devices']['presentation']['topOpen'] or snap()['devices']['presentation']['frontOpen'],'AR uses the same non-sealed enclosure contract');p.screenshot(path=str(OUT/'diorama-ar.png'))
  p.evaluate('TestXR.hidden(true)');frames();check(snap()['paused'],'A hidden AR session pauses safely');p.evaluate('TestXR.hidden(false)');frames();p.locator('#exit-vr').click();p.wait_for_function('!AetherReach.snapshot().devices.xr')
  # Re-entry to the original first-person path remains independent of the table.
  if snap()['devices']['menu']!='pause-dialog':p.keyboard.press('Escape')
  p.locator('#pause-presentation').click();p.locator('#xr-presentation').select_option('first-person-vr');p.locator('#presentation-back').click();p.locator('#return-title').click();p.locator('#enter-vr').click();p.wait_for_function('AetherReach.snapshot().devices.xr');frames(8)
  check(not snap()['devices']['presentation']['active'],'Original first-person XR remains selectable after AR and third-person sessions')
  p.evaluate('TestPad.connect()');frames(10);before=snap()['position']['yaw'];p.evaluate('TestPad.axes([0,0,1,0])');frames(10);after=snap()['position']['yaw'];p.evaluate('TestPad.axes([0,0,0,0])');frames();check(abs(abs(after-before)-.5235987756)<.01,'Holding Xbox snap turn produces one comfortable turn, not one turn per XR frame')
  p.locator('#exit-vr').click();p.wait_for_function('!AetherReach.snapshot().devices.xr');check(not errors and not shader,'No application or shader errors across desktop, stereo VR, hand UI, AR and first-person restoration')
  (OUT/'diorama-browser.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'shaderErrors':shader,'scope':'Actual HTTP software WebGL app with synthetic Xbox and XR controller/hand poses. No physical Quest passthrough, tracking, comfort or performance claim.'},indent=2))
 except Exception as e:
  try:state=snap()
  except:state=None
  (OUT/'diorama-browser-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'shaderErrors':shader,'snapshot':state},indent=2))
  try:p.screenshot(path=str(OUT/'diorama-browser-failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
