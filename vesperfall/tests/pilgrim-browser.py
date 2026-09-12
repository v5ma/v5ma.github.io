"""Pilgrim's Rest acceptance in the actual A-Frame/WebGL application.
Only ordinary DOM, keyboard, Xbox and XR input fixtures drive the game.
Save-corruption and competing-tab fixtures affect storage, never actors.
"""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output'/'pilgrim';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];diagnostics={}
PAD="""(()=>{const pad={id:'Test Xbox controller',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}},axes(a){pad.axes=a}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1120,'height':800},device_scale_factor=.5,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.5;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text());page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def saved():return page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload)')
 def observed():return page.evaluate('PilgrimSave.capture(Vesperfall.state,Vesperfall.component.checkpoint.state.checkpoint.meta).state')
 def pad_set(i,on):
  page.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on',[i,on])
 def press(i):
  wait('Vesperfall.component.dominionControls.state.armed');pad_set(i,True);pad_set(i,False)
 def nav_to(id):
  for _ in range(130):
   if page.evaluate('id=>document.activeElement.id===id',id):return
   d=page.evaluate('id=>{const a=Vesperfall.component.dominionControls.focusables(),i=a.indexOf(document.activeElement),j=a.findIndex(e=>e.id===id),n=a.length;if(j<0)throw Error("Missing focus target "+id);return (j-i+n)%n<=(i-j+n)%n?13:12}',id);press(d)
  raise AssertionError('Xbox could not reach '+id)
 def xrpress(hand,i):
  for on in (True,False):
   page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[hand,i,on]);wait('([h,i,on])=>Vesperfall.component.prevButtons[h]?.[i]===on||(!on&&!Vesperfall.component.xr)',[hand,i,on])
 def xraction(text):
  wait('Vesperfall.component.paused&&Vesperfall.component.dominionControls.state.xrNeutral');rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');index=next((i for i,s in enumerate(rows) if text.lower() in s.lower()),None)
  assert index is not None,(text,rows)
  cur=page.evaluate('Vesperfall.component.menuSelection');down=(index-cur+len(rows))%len(rows);up=(cur-index+len(rows))%len(rows)
  for direction in ([1,-1] if down==0 else [1]*down if down<=up else [-1]*up):
   wait('Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("d=>TestXR.axes('left',0,d)",direction);wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  xrpress('right',0)
 def ready():wait('window.Vesperfall?.component.checkpoint&&Vesperfall.component.rendererReady&&AFRAME.scenes[0].renderer.info.render.calls>0')
 try:
  page.goto(BASE+'/vesperfall/?acceptance=pilgrim',wait_until='domcontentloaded');ready()
  check(page.evaluate('VesperCore.VERSION')==json.loads((ROOT/'vesperfall/release.json').read_text())['version'],'The actual renderer loads the current Pilgrim release')
  check(not page.evaluate('Vesperfall.component.checkpoint.available'),'A fresh browser has no invented suspended run')
  page.locator('#jewel-settings summary').click();page.locator('#jewel-quality').select_option('classic');page.locator('#cathedral-shadows').uncheck();page.locator('#audio').uncheck();page.locator('#seed').fill('REST-ACCEPT')
  page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed');nav_to('start');press(0);wait('Vesperfall.component.checkpoint.eligible&&!Vesperfall.component.paused')
  check(saved()['checkpoint']['seed']=='REST-ACCEPT','Xbox begins a scored run and creates a real bounded checkpoint')
  before=page.evaluate('Vesperfall.state.p[2]');page.evaluate('TestPad.axes([0,-1,0,0])');wait('z=>Vesperfall.state.p[2]<z-.45',before);page.evaluate('TestPad.axes([0,0,0,0])')
  press(15);wait("Vesperfall.state.type==='cinder'");pad_set(7,True);wait('Vesperfall.component.charge>.6');pad_set(7,False);wait('Vesperfall.state.shots===1');press(9);wait('Vesperfall.component.paused')
  first=saved();check(first['checkpoint']['state']['ammo']['cinder']==3,'Pause persists the actual used ammunition and fired-shot counter')
  check(len(first['checkpoint']['state']['enemies'])==21 and len(first['checkpoint']['state']['pickups'])>25,'The saved model contains all enemy and supply states, not only a seed')
  nav_to('suspend-expedition');press(0);wait('!Vesperfall.component.running&&Vesperfall.component.checkpoint.available')
  checkpoint=saved()['checkpoint'];profile=saved()['profile'];check(checkpoint['state']['p'][2]<before-.45,'Save and title keeps the position reached through real stick movement')
  page.screenshot(path=str(OUT/'saved-expedition-menu.png'))
  page.reload(wait_until='domcontentloaded');ready();page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed');nav_to('continue-expedition');press(0);wait('Vesperfall.component.checkpoint.eligible&&Vesperfall.component.paused')
  restored=observed();expected=checkpoint['state'];check(restored==expected,'Real browser reload and Xbox Continue restore every model-owned mutable field exactly')
  time0=page.evaluate('Vesperfall.state.time');page.wait_for_timeout(700);check(page.evaluate('Vesperfall.state.time')==time0,'Restored enemies, projectiles and cooldowns wait paused instead of advancing while away')
  check(page.evaluate('Vesperfall.component.charge===0&&!Vesperfall.state.shield&&!Vesperfall.component.drawHeld'),'Continue resets drawn strings, guards and held fire inputs')
  check(saved()['profile']==profile,'Continuing an expedition does not duplicate permanent rewards')
  nav_to('resume');press(0);wait('!Vesperfall.component.paused');wait('(t)=>Vesperfall.state.time>t+.08',time0);press(9);wait('Vesperfall.component.paused');now=saved()['checkpoint'];check(now['state']['time']>time0,'Resume continues the saved simulation rather than starting a new seed')
  nav_to('practice');press(0);wait('Vesperfall.component.practice&&!Vesperfall.component.paused');practice_saved=saved()['checkpoint'];check(practice_saved['seed']=='REST-ACCEPT','Practice preserves the separate scored expedition slot')
  press(9);wait('Vesperfall.component.paused');check(saved()['checkpoint']==practice_saved,'Pausing unscored practice does not overwrite or bank the scored run')
  nav_to('start');press(0);wait('!document.getElementById("dominion-dialog").hidden');check(page.locator('#dominion-dialog').inner_text().find('Replace saved expedition')>=0,'Starting over asks before discarding a suspended expedition')
  press(1);wait('document.getElementById("dominion-dialog").hidden');check(saved()['checkpoint']==practice_saved,'Xbox B cancels replacement without touching the saved world')
  nav_to('continue-expedition');press(0);wait('Vesperfall.component.checkpoint.eligible&&Vesperfall.component.paused');nav_to('suspend-expedition');press(0);wait('!Vesperfall.component.running');slot=saved()['checkpoint']
  page.evaluate('TestPad.enabled=false');page.locator('#menu-vr').click();wait('Vesperfall.component.xr&&Vesperfall.component.hands.left&&Vesperfall.component.hands.right');xraction('Continue saved');wait('Vesperfall.component.checkpoint.eligible&&Vesperfall.component.paused')
  check(page.evaluate('Vesperfall.state.world.seed')==slot['seed'] and page.evaluate('Vesperfall.state.shots')==slot['state']['shots'],'Quest spatial Continue restores the same expedition without a mouse')
  xraction('Expedition / practice');xraction('More / page');xraction('Saved expedition');xraction('Save and return');wait('!Vesperfall.component.running')
  check(page.evaluate('Vesperfall.component.xr&&Vesperfall.component.checkpoint.available'),'Quest saves and returns to an in-headset title, without ending the XR session')
  page.screenshot(path=str(OUT/'saved-expedition-stereo.png'))
  # Return to main using the actual controller upper face button, then exit.
  xrpress('left',5);wait("Vesperfall.component.dominionControls.state.xrScreen==='main'");xraction('Exit VR');wait('!Vesperfall.component.xr')
  page.locator('#continue-expedition').click();wait('Vesperfall.component.checkpoint.eligible&&Vesperfall.component.paused');page.locator('#save-expedition').click();pre_ar=saved()['checkpoint']
  page.locator('#menu-ar').click();wait('Vesperfall.component.arMode&&Vesperfall.component.xr');xraction('Resume');wait('!Vesperfall.component.paused');page.wait_for_timeout(250);page.evaluate('TestXR.state.session.end()');wait('!Vesperfall.component.xr&&!Vesperfall.component.arMode')
  check(saved()['checkpoint']['seed']==pre_ar['seed'] and page.evaluate('Vesperfall.state.world.seed')==pre_ar['seed'],'Stationary AR Sanctuary never replaces the persistent scored expedition')
  check(page.evaluate('Vesperfall.state.shots')==pre_ar['state']['shots'],'Leaving AR restores expedition counters without granting free ammunition or kills')
  # A second tab writes normally. The first must yield rather than overwrite it.
  second=ctx.new_page();second.set_default_timeout(90000);second.on('pageerror',lambda e:errors.append(str(e)));second.goto(BASE+'/vesperfall/',wait_until='domcontentloaded');second.wait_for_function('window.Vesperfall?.component.checkpoint&&Vesperfall.component.rendererReady');second.locator('#continue-expedition').click();second.wait_for_function('Vesperfall.component.checkpoint.eligible&&Vesperfall.component.paused');second.locator('#save-expedition').click();wait('Vesperfall.component.checkpoint.state.conflict')
  check(page.locator('#reload-expedition').is_visible() and page.evaluate('Vesperfall.component.paused'),'A competing tab pauses the stale tab and offers recovery instead of overwriting the newer save')
  second.close();page.bring_to_front();page.locator('#reload-expedition').click();ready();check(not page.evaluate('Vesperfall.component.checkpoint.state.conflict'),'Reloading the stale tab reads the new authoritative save')
  page.locator('#discard-expedition').click();wait('!document.getElementById("dominion-dialog").hidden');page.locator('#dominion-dialog button').filter(has_text='Discard saved expedition').click();wait('!Vesperfall.component.checkpoint.available');check(saved()['profile']==profile,'Explicit discard removes only the run and retains the permanent profile')
  # Corrupt storage is a fault-injection fixture, not a gameplay state shortcut.
  page.evaluate("localStorage.setItem(PilgrimSave.KEY,'{broken')");page.reload(wait_until='domcontentloaded');ready();check(page.locator('#checkpoint-status').inner_text()!='' and not page.evaluate('Vesperfall.component.checkpoint.available'),'Damaged storage is reported without breaking game launch')
  page.locator('#discard-expedition').click();page.locator('#dominion-dialog button').filter(has_text='Discard saved expedition').click();wait('!Vesperfall.component.checkpoint.store.error');page.locator('#practice').click();wait('Vesperfall.component.practice&&!Vesperfall.component.paused');check(True,'The player can recover damaged storage and still enter ordinary practice')
  check(not errors,'No uncaught browser errors across saves, reloads, Xbox, VR, AR and recovery')
  diagnostics={'checkpointCharacters':len(json.dumps(checkpoint)),'finalVersion':page.evaluate('VesperCore.VERSION'),'controllerScope':'Xbox gamepad and Quest poses/buttons are emulated. Actual A-Frame and WebGL are not replaced. Physical-device ergonomics and frame rate remain unverified.'}
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'diagnostics':diagnostics},indent=2))
 except Exception as e:
  try:debug=page.evaluate('({snapshot:window.Vesperfall?.snapshot?.(),checkpoint:window.Vesperfall?.component.checkpoint?.state,active:document.activeElement?.id,dialog:document.getElementById("dominion-dialog")?.textContent})')
  except:debug=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'debug':debug},indent=2));
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
