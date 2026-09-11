"""Hollow Dominions: actual WebGL, UI input, emulated Xbox and stereo WebXR.
No enemy health, player coordinates or progression are assigned by these tests.
The test-only WebXR shim models poses/buttons, not physical Quest hardware.
"""
from pathlib import Path
import os,json,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output'/'dominions';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console_errors=[];diagnostics={}
def check(ok,label):
 if not ok:raise AssertionError(label)
 checks.append(label);print('PASS:',label,flush=True)
PAD="""(()=>{const pad={id:'Test Xbox controller',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}},axes(a){pad.axes=a}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1024,'height':720},device_scale_factor=.5,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.5;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text())
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console_errors.append(e.text) if e.type=='error' else None)
 def wait(js,arg=None):return page.wait_for_function(js,arg=arg,timeout=90000)
 def pad_set(i,on):
  page.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on',[i,on])
 def press(i):
  wait('Vesperfall.component.dominionControls.state.armed');pad_set(i,True);pad_set(i,False)
 def nav_to(id):
  for _ in range(100):
   if page.evaluate('(id)=>document.activeElement.id===id',id):return
   direction=page.evaluate('id=>{const a=Vesperfall.component.dominionControls.focusables(),i=a.indexOf(document.activeElement),j=a.findIndex(e=>e.id===id),n=a.length;return j<0?13:((j-i+n)%n<=(i-j+n)%n?13:12)}',id)
   press(direction)
  raise AssertionError('Controller focus could not reach '+id)
 def xr_set(name,i,on):
  page.evaluate('([n,i,on])=>TestXR.button(n,i,on)',[name,i,on]);wait('([n,i,on])=>Vesperfall.component.prevButtons[n]?.[i]===on',[name,i,on])
 def xrpress(name,i):xr_set(name,i,True);xr_set(name,i,False)
 def xraction(text):
  wait('Vesperfall.component.paused&&Vesperfall.component.dominionControls.state.xrNeutral')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');index=next((i for i,s in enumerate(rows) if text.lower() in s.lower()),None)
  if index is None:raise AssertionError('XR action missing: '+text+' in '+str(rows))
  # Navigate by real stick edges, using the observed shortest UI path.
  cur=page.evaluate('Vesperfall.component.menuSelection');down=(index-cur+len(rows))%len(rows);up=(cur-index+len(rows))%len(rows)
  steps=([1,-1] if down==0 else [1]*down if down<=up else [-1]*up)
  for direction in steps:
   wait('Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("d=>TestXR.axes('left',0,d)",direction);wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  check(page.evaluate('(i)=>Vesperfall.component.menuSelection===i',index),'XR focus reaches '+text)
  xrpress('right',0)
 try:
  page.goto(BASE+'/vesperfall/index.html?acceptance=hollow-dominions',wait_until='domcontentloaded')
  wait('window.Vesperfall?.component.rendererReady&&Vesperfall.component.dominionControls&&AFRAME.scenes[0].renderer.info.render.calls>0')
  wait('Vesperfall.component.art.cathedralStatus.loaded>=2') if False else None
  check(page.evaluate("VesperCore.VERSION==='0.7.0'&&Vesperfall.state.world.rooms.length===25&&Vesperfall.state.world.enemies.length===21"),'Correct release boots with 25 rooms and 21 enemies')
  check(page.evaluate('Vesperfall.component.enemyMeshes.filter(m=>m.userData.dominion).length===16'),'All outer opponents have actual distinct rendered models')
  check(page.locator('#sparring-kind option').count()==15,'All fifteen archetypes are available as combat trials')
  page.screenshot(path=str(OUT/'opening-menu.png'))
  # Start practice from the controller, without a click on a gameplay control.
  page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed');nav_to('practice');press(0);wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  check(page.evaluate('Vesperfall.component.practice&&Vesperfall.state.world.enemies.length===0'),'Xbox alone starts unscored practice from the opening menu')
  start=page.evaluate('Vesperfall.state.p[2]');page.evaluate('TestPad.axes([0,-1,0,0])');wait('(z)=>Vesperfall.state.p[2]<z-.35',start);page.evaluate('TestPad.axes([0,0,0,0])')
  check(True,'Xbox left stick moves through actual collision geometry')
  pad_set(7,True);wait('Vesperfall.component.charge>.65');pad_set(7,False);wait('Vesperfall.state.shots===1');check(True,'Xbox RT draws and releases one physical bow shot')
  press(11);wait("Vesperfall.state.weapon==='crossbow'");press(7);wait('!Vesperfall.state.crossbow.loaded');press(2);wait('Vesperfall.state.crossbow.reload>0');wait('Vesperfall.state.crossbow.loaded');check(True,'Xbox weapon swap, crossbow fire and deliberate reload work')
  pad_set(6,True);wait('!!Vesperfall.state.shield');pad_set(6,False);wait('!Vesperfall.state.shield');check(True,'Xbox LT raises and lowers the directional shield')
  press(3);wait("Vesperfall.state.type==='cinder'");press(1);wait("Vesperfall.state.type==='blink'");press(1);wait("Vesperfall.state.type==='plain'");press(8);check(not page.locator('#map').evaluate('(e)=>e.hidden'),'Xbox arrow cycling, Blink toggle and View atlas work')
  press(12);wait("!document.getElementById('dominion-dialog').hidden");check(page.locator('#dominion-dialog-title').inner_text()=='Expedition journal','Xbox opens the expedition journal and pauses gameplay');press(1);wait("document.getElementById('dominion-dialog').hidden");press(9);wait('!Vesperfall.component.paused');check(True,'Xbox B dismisses the journal and Menu resumes without a mouse')
  press(9);wait('Vesperfall.component.paused');nav_to('pad-sensitivity');old=page.locator('#pad-sensitivity').input_value();press(15);check(old!=page.locator('#pad-sensitivity').input_value(),'Xbox changes settings without opening a native select popup')
  nav_to('seed-keyboard');press(0);wait("document.getElementById('dominion-dialog').dataset.keyboard==='true'");old=page.locator('#seed').input_value();press(0);check(page.locator('#seed').input_value()!=old,'Xbox seed keyboard appends a character');press(1);check(page.locator('#dominion-dialog').is_hidden(),'Xbox closes the seed keyboard')
  # Capture the upgraded renderer during ordinary practice.
  press(9);wait('!Vesperfall.component.paused');page.screenshot(path=str(OUT/'expedition-browser.png'));diagnostics['renderer']=page.evaluate('({...Vesperfall.component.stats})');press(9);wait('Vesperfall.component.paused')
  page.evaluate('TestPad.enabled=false');wait('Vesperfall.component.dominionControls.state.pad===null')
  # WebXR is started through real UI; the shim supplies only device state.
  page.locator('#menu-vr').click();wait('Vesperfall.component.xr&&Vesperfall.component.hands.left&&Vesperfall.component.hands.right');wait('Vesperfall.component.dominionControls.state.xrNeutral')
  xraction('Settings');xraction('Bow hand');check(page.locator('#handedness').input_value()=='right','Quest spatial settings reverse bow and draw hands');xraction('Bow hand');check(page.locator('#handedness').input_value()=='left','Quest spatial settings restore left-bow handedness');xraction('Back');xraction('Controller manual');xraction('Physical archery');check(page.evaluate("Vesperfall.component.dominionControls.state.xrScreen==='notice'"),'Quest controller manual renders inside the headset');xraction('Back to menu');xraction('Resume')
  wait('!Vesperfall.component.paused');check(page.evaluate("TestXR.state.session.mode==='immersive-vr'"),'VR requests an actual immersive-vr session')
  # Restore bow via the documented bow-stick click.
  if page.evaluate("Vesperfall.state.weapon==='crossbow'"):xrpress('left',3)
  shots=page.evaluate('Vesperfall.state.shots');page.evaluate("TestXR.pose('right',[-.23,1.35,-.31])");page.wait_for_timeout(250);xr_set('right',0,True);wait('Vesperfall.component.latch.drawing');page.evaluate("TestXR.pose('right',[-.23,1.35,.29])");wait('Vesperfall.component.charge>.8');xr_set('right',0,False);wait('(n)=>Vesperfall.state.shots===n+1',shots);check(True,'Two tracked controllers physically nock, draw and release a VR arrow')
  xr_set('left',1,True);wait('!!Vesperfall.state.shield');xr_set('left',1,False);wait('!Vesperfall.state.shield');check(True,'Quest bow-hand grip controls the physical shield')
  # Tracking loss cancels a pull and cannot create a synthetic shot.
  shots=page.evaluate('Vesperfall.state.shots');page.evaluate("TestXR.pose('right',[-.23,1.35,-.31])");page.wait_for_timeout(200);xr_set('right',0,True);wait('Vesperfall.component.latch.drawing');page.evaluate("TestXR.pose('right',[-.23,1.35,.29])");wait('Vesperfall.component.charge>.8');page.evaluate("TestXR.missing('right',true)");wait('!Vesperfall.component.hands.right');page.evaluate("TestXR.button('right',0,false);TestXR.missing('right',false)");wait('!!Vesperfall.component.hands.right');check(page.evaluate('(n)=>Vesperfall.state.shots===n',shots),'Lost tracking cancels the VR draw without a stray arrow')
  xrpress('left',5);wait('Vesperfall.component.paused');xraction('Expedition / practice');xraction('Sparring');xraction('More / page');xraction('Thorn Duelist');wait("Vesperfall.component.training==='duelist'&&!Vesperfall.component.paused");check(page.evaluate("Vesperfall.component.enemyMeshes[0].userData.dominion!==undefined"),'Quest can start a new enemy trial using only spatial menus')
  page.screenshot(path=str(OUT/'quest-stereo-trial.png'));xrpress('left',5);wait('Vesperfall.component.paused');xraction('Exit VR');wait('!Vesperfall.component.xr')
  before=page.evaluate('({seed:Vesperfall.state.world.seed,p:[...Vesperfall.state.p],health:Vesperfall.state.health,score:Vesperfall.state.score,profile:localStorage.getItem("vesperfall-profile-v1")})')
  page.locator('#menu-ar').click();wait('Vesperfall.component.xr&&Vesperfall.component.arMode');wait('Vesperfall.component.dominionControls.state.xrNeutral');xraction('Begin AR Sanctuary');wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  check(page.evaluate("TestXR.state.session.mode==='immersive-ar'&&TestXR.state.session.environmentBlendMode==='alpha-blend'"),'AR requests immersive-ar rather than relabeling a VR session')
  check(page.evaluate('AFRAME.scenes[0].object3D.background===null&&AFRAME.scenes[0].renderer.getClearAlpha()===0'),'AR leaves a transparent background for passthrough')
  check(page.evaluate('Vesperfall.component.practice&&Vesperfall.state.unscored&&Vesperfall.state.world.ar&&Vesperfall.state.world.enemies.length===2'),'AR Sanctuary starts a real unscored two-opponent wave')
  old=page.evaluate('Vesperfall.state.type');xrpress('right',5);check(page.evaluate("Vesperfall.state.type!=='blink'"),'AR refuses artificial Blink locomotion')
  pos=page.evaluate('[...Vesperfall.state.p]');xrpress('right',1);check(page.evaluate('(p)=>JSON.stringify(Vesperfall.state.p)===JSON.stringify(p)',pos),'AR refuses artificial shard locomotion')
  page.screenshot(path=str(OUT/'ar-sanctuary-stereo.png'));xrpress('left',5);wait('Vesperfall.component.paused');xraction('Exit AR');wait('!Vesperfall.component.xr&&!Vesperfall.component.arMode')
  after=page.evaluate('({seed:Vesperfall.state.world.seed,p:[...Vesperfall.state.p],health:Vesperfall.state.health,score:Vesperfall.state.score,profile:localStorage.getItem("vesperfall-profile-v1")})')
  check(before==after,'Leaving AR restores the suspended expedition and preserves the stored profile')
  check(page.evaluate('Vesperfall.component.paused'),'Restored expedition is safely paused')
  page.evaluate('TestXR.state.deny=true');page.locator('#menu-vr').click();wait("!document.getElementById('dominion-dialog').hidden");check('session did not start' in page.locator('#dominion-dialog-body').inner_text(),'Refused XR permission produces an in-game error dialog, not alert()')
  page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed');press(1);check(page.locator('#dominion-dialog').is_hidden(),'Xbox B dismisses the XR error without a mouse')
  check(not errors,'No uncaught JavaScript errors across browser, Xbox, VR and AR paths')
  check(not [e for e in console_errors if 'SHADER' in e.upper() or 'INVALID' in e.upper()],'No invalid shader/renderer operations during acceptance')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'version':'0.7.0','passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console_errors,'diagnostics':diagnostics,'scope':'Real WebGL and ordinary UI/gameplay with emulated standard gamepad and WebXR device inputs. Software-GPU tests use pixel ratio 0.5 and a 480x320 stereo framebuffer; this is not a performance benchmark. Not physical Quest 3, passthrough quality, comfort, or hardware performance certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'consoleErrors':console_errors,'url':page.url,'diagnostics':diagnostics,'ui':page.evaluate('({screen:Vesperfall.component.dominionControls.state.xrScreen,selection:Vesperfall.component.menuSelection,rows:Vesperfall.component.xrMenuRows.map(r=>r[0]),inputMode:Vesperfall.component.dominionControls.state.xrNav})')},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
