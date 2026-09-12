"""Actual native A-Frame/WebGL shader and input regression.
No actor, simulation, damage, progression or camera-pose assignment. Pause-menu
visibility is temporarily hidden only for unobstructed matching-frame captures.
"""
from pathlib import Path
import json,os
from PIL import Image,ImageChops,ImageStat
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/rosefire';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[];metrics={}
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
PAD="""(()=>{const pad={id:'Test Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
STATE="""()=>{const s=Vesperfall.state;return JSON.stringify({p:s.p,h:s.health,ammo:s.ammo,score:s.score,kills:s.kills,phase:s.phase,world:[s.world.floors,s.world.solids],enemies:s.world.enemies.map(e=>[e.id,e.p,e.hp]),profile:localStorage.getItem('vesperfall-profile-v1'),checkpoint:localStorage.getItem('vesperfall-expedition-v1')});}"""
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**args);ctx=b.new_context(viewport={'width':1280,'height':800},device_scale_factor=.65,service_workers='block');ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.5;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text());page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def pause():
  if not page.evaluate('Vesperfall.component.paused'):page.keyboard.press('KeyP');wait('Vesperfall.component.paused')
 def mode(value):
  if not page.locator('#rosefire-settings').evaluate('e=>e.open'):page.locator('#rosefire-summary').click()
  page.locator('#rosefire-quality').select_option(value);wait('(v)=>Vesperfall.component.rosefire.current.mode===v',value);page.wait_for_timeout(300)
 def capture(name):
  page.evaluate("document.getElementById('menu').style.visibility='hidden'");page.screenshot(path=str(OUT/name));page.evaluate("document.getElementById('menu').style.visibility=''")
 def press(i):
  wait('Vesperfall.component.dominionControls.state.armed')
  for on in [True,False]:page.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on',[i,on])
 def nav(id):
  for _ in range(120):
   if page.evaluate('id=>document.activeElement.id===id',id):return
   direction=page.evaluate('id=>{const a=Vesperfall.component.dominionControls.focusables(),i=a.indexOf(document.activeElement),j=a.findIndex(e=>e.id===id),n=a.length;if(j<0)throw Error("Not focusable: "+id);return (j-i+n)%n<=(i-j+n)%n?13:12;}',id);press(direction)
  raise AssertionError('Controller did not reach '+id)
 def xrpress(hand,i):
  for on in [True,False]:page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[hand,i,on]);wait('([h,i,on])=>Vesperfall.component.prevButtons[h]?.[i]===on||(!on&&!Vesperfall.component.xr)',[hand,i,on])
 def xraction(label):
  wait('Vesperfall.component.paused&&Vesperfall.component.dominionControls.state.xrNeutral')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');idx=next((i for i,s in enumerate(rows) if label.lower() in s.lower()),None);assert idx is not None,(label,rows)
  cur=page.evaluate('Vesperfall.component.menuSelection');down=(idx-cur+len(rows))%len(rows);up=(cur-idx+len(rows))%len(rows);steps=[1,-1] if down==0 else [1]*down if down<=up else [-1]*up
  for d in steps:
   wait('Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("d=>TestXR.axes('left',0,d)",d);wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  xrpress('right',0)
 try:
  page.goto(BASE+'/vesperfall/?acceptance=rosefire',wait_until='domcontentloaded');wait('window.Vesperfall?.component.rosefire?.started&&Vesperfall.component.rosefire.stats.compiled>0')
  check(page.evaluate('VesperCore.VERSION')==json.loads((ROOT/'vesperfall/release.json').read_text())['version'],'The current release compiles the original floor shader in the real renderer')
  check(page.evaluate('Vesperfall.component.rosefire.patched.size>=4'),'Both instanced cobblestones and outer decorative floors receive the PBR shader')
  page.locator('#practice').click();wait('Vesperfall.component.practice&&!Vesperfall.component.paused');page.locator('a-scene canvas').focus();page.keyboard.down('ArrowDown');wait('Vesperfall.component.pitch<-.30');page.keyboard.up('ArrowDown');pause()
  original=page.evaluate(STATE);mode('off');capture('choir-before.png');mode('balanced');capture('choir-rosefire.png')
  im0=Image.open(OUT/'choir-before.png').convert('RGB');im1=Image.open(OUT/'choir-rosefire.png').convert('RGB');diff=ImageChops.difference(im0,im1);w,h=im0.size;mean=sum(ImageStat.Stat(diff.crop((0,h//2,w,h))).mean)/3;metrics['lowerHalfDifference']=mean
  check(mean>1,'Matching paused frames show a real lower-scene pixel change, not just a renamed menu')
  check(page.evaluate(STATE)==original,'Switching shader profiles does not alter collision, enemies, inventory or saves')
  check(page.evaluate('Vesperfall.component.jewelglass.projections.every(p=>!p.pool.visible)'),'The new floor caustics replace rather than double the previous light pools')
  page.locator('#rosefire-wet').uncheck();wait('!Vesperfall.component.rosefire.current.wet');check(page.evaluate('Vesperfall.component.rosefire.uniforms.uRFWet.value===0'),'Wet stone can be disabled independently')
  page.locator('#rosefire-rose').uncheck();wait('!Vesperfall.component.rosefire.current.rose');check(page.evaluate('Vesperfall.component.jewelglass.projections.every(p=>p.pool.visible)'),'Turning off stained light restores the previous floor projection')
  page.locator('#rosefire-wet').check();page.locator('#rosefire-rose').check();mode('cinematic');capture('choir-cinematic.png');check(page.evaluate('Vesperfall.component.rosefire.uniforms.uRFDetail.value===1'),'Desktop Cinematic enables fine PBR ripple and sky detail')
  page.locator('#resume').click();page.locator('a-scene canvas').focus();page.keyboard.down('KeyH');wait('!!Vesperfall.state.shield');page.screenshot(path=str(OUT/'woven-ward.png'));check(page.evaluate('Vesperfall.component.arsenal.shield.children[0].material===Vesperfall.component.rosefire.ward'),'The woven shader is on the actual directional gameplay shield');page.keyboard.up('KeyH');wait('!Vesperfall.state.shield')
  count=page.evaluate('Vesperfall.component.rosefire.stats.wakes');page.keyboard.press('KeyB');wait('n=>Vesperfall.component.rosefire.stats.wakes>n',count);check(page.evaluate('Vesperfall.component.rosefire.stats.activeWakes>0'),'A successful ordinary-input Shard Step creates a bounded landing echo');page.screenshot(path=str(OUT/'landing-echo.png'));pause()
  if not page.locator('#jewel-settings').evaluate('e=>e.open'):page.locator('#jewel-settings summary').click()
  page.locator('#jewel-reduced').check();wait('!Vesperfall.component.rosefire.current.animated');check(page.evaluate('Vesperfall.component.rosefire.stats.activeWakes===0&&Vesperfall.component.rosefire.sky.uniforms.uCalm.value===1'),'Reduced effects freeze ambient motion and remove landing echoes');page.locator('#jewel-reduced').uncheck()
  page.locator('#jewel-quality').select_option('classic');wait('!Vesperfall.component.rosefire.current.enabled');check(page.evaluate('Vesperfall.component.jewelglass.sky.material===Vesperfall.component.rosefire.originalSky'),'Classic restores the previous material and sky path');page.locator('#jewel-quality').select_option('balanced');wait('Vesperfall.component.rosefire.current.enabled')
  # Rebuild real sectors through the public practice button, without setting actors.
  materialCount=page.evaluate('Vesperfall.component.rosefire.patched.size')
  for i in range(3):
   page.locator('#seed').fill('ROSE-'+str(i));page.locator('#practice').click();wait('(i)=>Vesperfall.component.rosefire.world.seed==="ROSE-"+i',i);pause()
  check(page.evaluate('(n)=>Vesperfall.component.rosefire.patched.size===n&&Vesperfall.component.rosefire.root.children.length===6',materialCount),'Repeated sector rebuilding reuses material hooks and a fixed six-ring pool')
  # Capture the sky with normal look input, not a camera transform assignment.
  page.locator('#resume').click();page.locator('a-scene canvas').focus();page.keyboard.down('ArrowUp');wait('Vesperfall.component.pitch>.92');page.keyboard.up('ArrowUp');pause();capture('twilight-veil.png')
  page.locator('#lighting').select_option('daylight');wait('Vesperfall.component.rosefire.sky.uniforms.uNight.value===0');check(True,'Daylight disables aurora and stars instead of tinting the daylight sky purple');page.locator('#lighting').select_option('twilight')
  mode('balanced');page.locator('#rosefire-summary').click();page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed');nav('rosefire-summary');press(0);wait('document.getElementById("rosefire-settings").open');nav('rosefire-quality');press(15);wait('Vesperfall.component.rosefire.current.mode==="cinematic"');check(True,'Xbox alone expands the shader panel and changes the real profile');nav('rosefire-wet');press(0);wait('!Vesperfall.component.rosefire.current.wet');check(True,'Xbox toggles individual shader options with no native popup or mouse');press(0);page.evaluate('TestPad.enabled=false');wait('Vesperfall.component.dominionControls.state.pad===null')
  page.locator('#menu-vr').click();wait('Vesperfall.component.xr&&Vesperfall.component.hands.left&&Vesperfall.component.hands.right');wait('Vesperfall.component.rosefire.current.roseCount===2');check(page.evaluate('!Vesperfall.component.rosefire.current.cinematic&&Vesperfall.component.rosefire.current.maxWakes===3'),'Real stereo XR renderer receives the capped profile without an extra render target')
  xraction('Settings')
  for _ in range(10):
   if any('Rosefire profile' in s for s in page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])')):break
   xraction('More / page')
  xraction('Rosefire profile');wait('Vesperfall.component.rosefire.current.mode==="off"');check(True,'Quest spatial controls switch the new shaders off inside the headset');xraction('Rosefire profile');wait('Vesperfall.component.rosefire.current.mode==="balanced"');check(True,'Quest spatial controls restore Balanced shaders');page.screenshot(path=str(OUT/'quest-shader-menu.png'));xraction('Back');xraction('Resume');wait('!Vesperfall.component.paused');page.screenshot(path=str(OUT/'quest-stereo-rosefire.png'));xrpress('left',5);wait('Vesperfall.component.paused');xraction('Exit VR');wait('!Vesperfall.component.xr')
  beforeAR=page.evaluate(STATE);page.locator('#menu-ar').click();wait('Vesperfall.component.arMode&&Vesperfall.component.xr');wait('!Vesperfall.component.rosefire.current.world');check(page.evaluate('AFRAME.scenes[0].object3D.background===null&&AFRAME.scenes[0].renderer.getClearAlpha()===0&&!Vesperfall.component.rosefire.root.visible'),'AR keeps transparent passthrough with all new world layers disabled');page.screenshot(path=str(OUT/'ar-safe-menu.png'));xraction('Exit AR');wait('!Vesperfall.component.xr&&!Vesperfall.component.arMode');check(page.evaluate(STATE)==beforeAR,'The complete pre-AR expedition is restored unchanged after shader mode transitions')
  pause();mode('balanced');saved=page.evaluate('localStorage.getItem("vesperfall-rosefire-v1")');page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.rosefire?.started');check(page.evaluate('localStorage.getItem("vesperfall-rosefire-v1")')==saved and page.locator('#rosefire-quality').input_value()=='balanced','Visual preferences survive a real browser reload')
  page.set_viewport_size({'width':390,'height':844});page.locator('#rosefire-summary').click();page.screenshot(path=str(OUT/'phone-shader-settings.png'),full_page=True);check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'New controls remain usable in a narrow browser')
  metrics['shader']=page.evaluate('({...Vesperfall.component.rosefire.stats,errors:Vesperfall.component.rosefire.errors})');check(metrics['shader']['renderTargets']==0,'The extension creates no framebuffer or screen-space reflection pass')
  check(not errors and not metrics['shader']['errors'],'No uncaught application or material-patch errors')
  bad=[s for s in console if any(k in s.upper() for k in ['SHADER ERROR','VALIDATE_STATUS','INVALID_OPERATION','ERROR: 0:'])];check(not bad,'No shader compilation or invalid WebGL operations in checked profiles and modes')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'version':page.evaluate('VesperCore.VERSION'),'passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console,'metrics':metrics,'scope':'Actual Chromium software WebGL, normal UI/keyboard, emulated standard Xbox and WebXR pose/button inputs. 1280x800 CSS at 0.65 pixel ratio; no render decimation in this suite. The pause menu is hidden temporarily for unobstructed native-frame captures. No game/camera-state assignments. Not physical headset performance, comfort, art approval or optical simulation certification.'},indent=2))
 except Exception as e:
  try:info=page.evaluate('({state:window.Vesperfall?.snapshot?.(),rosefire:window.Vesperfall?.component.rosefire?.stats,policy:window.Vesperfall?.component.rosefire?.current,shaderErrors:window.Vesperfall?.component.rosefire?.errors})')
  except:info=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'consoleErrors':console,'info':info},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();b.close()
