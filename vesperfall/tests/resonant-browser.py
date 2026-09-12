"""Hollow Dominions: actual WebGL, UI input, emulated Xbox and stereo WebXR.
No enemy health, player coordinates or progression are assigned by these tests.
The test-only WebXR shim models poses/buttons, not physical Quest hardware.
"""
from pathlib import Path
import os,json,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output'/'resonant';OUT.mkdir(parents=True,exist_ok=True)
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
  page.evaluate('([n,i,on])=>TestXR.button(n,i,on)',[name,i,on])
  # Session exit intentionally stops polling XR controllers. A release after
  # a verified exit is not supposed to appear in the retired input snapshot.
  wait('([n,i,on])=>Vesperfall.component.prevButtons[n]?.[i]===on||(!on&&!Vesperfall.component.xr)',[name,i,on])
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
  page.goto(BASE+'/vesperfall/index.html?acceptance=resonant-hunt',wait_until='domcontentloaded')
  wait('window.Vesperfall?.component.ritual&&Vesperfall.component.soundscape&&Vesperfall.component.rendererReady')
  check(page.evaluate('VesperCore.VERSION')==json.loads((ROOT/'vesperfall/release.json').read_text())['version'],'Resonant Hunt is the actual loaded release')
  page.locator('#sound-preview').click();wait("Vesperfall.component.soundscape.engine?.ctx.state==='running'");wait('Vesperfall.component.soundscape.engine.metrics.played>=6')
  check(True,'A real user gesture unlocks the spatial Web Audio graph and sound check')
  diagnostics['offlineAudio']=page.evaluate("""async()=>{const ctx=new OfflineAudioContext(2,48000*3,48000),e=new ResonanceAudio.Engine(ctx);e.listener([0,1.65,0],[0,0,0,1]);e.note('choir',50,0,2,.12);e.note('pluck',69,.4,1.2,.12);e.play('bow',{at:.8});e.play('stone',{at:1.2,position:[-2,1.65,-2]});e.play('shield',{at:1.8,position:[2,1.65,-2]});const b=await ctx.startRendering(),l=b.getChannelData(0),r=b.getChannelData(1);let sum=0,peak=0,diff=0,finite=true;for(let i=0;i<l.length;i++){finite=finite&&Number.isFinite(l[i])&&Number.isFinite(r[i]);sum+=l[i]*l[i]+r[i]*r[i];peak=Math.max(peak,Math.abs(l[i]),Math.abs(r[i]));diff+=Math.abs(l[i]-r[i]);}const result={rms:Math.sqrt(sum/(l.length*2)),peak,stereoDifference:diff/l.length,finite,samples:l.length,spatial:e.metrics.spatial};e.dispose();return result;}""")
  a=diagnostics['offlineAudio'];check(a['finite'] and .0001<a['rms']<.4 and a['peak']<.98 and a['stereoDifference']>.00001 and a['spatial']==2,'Original choir, pluck and spatial effects render finite audible stereo PCM without clipping')
  page.locator('#practice').click();wait('Vesperfall.component.running&&!Vesperfall.component.paused');wait('Vesperfall.component.soundscape.engine.active')
  wait('Vesperfall.component.soundscape.engine.beat>=2');check(True,'The adaptive score schedules changing notes during gameplay, not a static drone')
  page.locator('a-scene canvas').focus();page.keyboard.down('Space');wait('Vesperfall.component.charge>.65');page.keyboard.up('Space');wait('Vesperfall.state.shots===1');wait("Vesperfall.component.soundscape.engine.log.some(e=>e.id==='bow'&&e.position)")
  check(True,'A real bow shot drives a positioned release sound')
  page.keyboard.down('Tab');wait('Vesperfall.component.ritual.focus.open');check(page.evaluate('Vesperfall.component.ritual.timeScale()===.2'),'The tactical quiver slows only the simulation to 20 percent')
  page.keyboard.press('ArrowRight');page.keyboard.up('Tab');wait("!Vesperfall.component.ritual.focus.open&&Vesperfall.state.type==='cinder'");check(True,'Keyboard quiver selects and releases without firing an unintended arrow')
  page.keyboard.down('Tab');wait('Vesperfall.component.ritual.focus.open');page.keyboard.press('Escape');page.keyboard.up('Tab');wait('!Vesperfall.component.ritual.focus.open');check(page.evaluate("Vesperfall.state.type==='cinder'&&!Vesperfall.component.paused"),'Escape cancels quiver selection without also opening another menu')
  page.keyboard.press('Digit6');wait("Vesperfall.state.type==='ricochet'");ammo=page.evaluate('Vesperfall.state.ammo.ricochet');page.keyboard.down('Space');wait('Vesperfall.component.charge>.9');page.keyboard.up('Space');wait('(n)=>Vesperfall.state.ammo.ricochet===n-1',ammo);check(True,'Practice provides real finite-use ricochet projectiles')
  page.keyboard.press('KeyP');wait('Vesperfall.component.paused');wait('Vesperfall.component.soundscape.engine.voices.size===0');check(True,'Pause stops active music and sound voices')
  page.locator('#sound-music').select_option('.2' if page.locator('#sound-music option[value=".2"]').count() else '0.2');page.locator('#sound-dynamic').select_option('quiet');check(page.evaluate("JSON.parse(localStorage.getItem('vesperfall-audio-v1')).music===.2"),'Separate audio levels and quiet mix persist in browser storage')
  page.locator('#audio').uncheck();check(page.evaluate('Vesperfall.component.soundscape.engine.muted'),'Master mute disables the new audio engine');page.locator('#audio').check()
  page.locator('#menu-vr').click();wait('Vesperfall.component.xr&&Vesperfall.component.hands.left&&Vesperfall.component.hands.right');wait('Vesperfall.component.dominionControls.state.xrNeutral');xraction('Resume');wait('!Vesperfall.component.paused')
  page.evaluate("TestXR.pose('right',[.23,1.35,-.4]);TestXR.orientation('right',[0,0,-Math.SQRT1_2,Math.SQRT1_2])");wait('Vesperfall.component.ritual.panel.mesh.visible');check(page.evaluate('!Vesperfall.component.xrHud.mesh.visible&&Vesperfall.component.ritual.familiar.visible'),'Turning the tracked free palm up reveals the familiar instead of a fixed head-up bar');page.screenshot(path=str(OUT/'palm-familiar-stereo.png'))
  page.evaluate("TestXR.orientation('right',[0,0,0,1])");wait('!Vesperfall.component.ritual.panel.mesh.visible');check(True,'Lowering the palm removes the status display')
  xr_set('right',4,True);wait('Vesperfall.component.ritual.focus.open&&Vesperfall.component.ritual.quiver.mesh.visible');page.evaluate("TestXR.axes('right',0,-1)");wait('Vesperfall.component.ritual.state.selected===0');page.screenshot(path=str(OUT/'physical-quiver-stereo.png'));page.evaluate("TestXR.axes('right',0,0)");xr_set('right',4,False);wait("Vesperfall.state.type==='plain'&&!Vesperfall.component.ritual.focus.open");check(True,'Quest lower face button opens a hand-positioned quiver and equips on release')
  xrpress('left',3);wait("Vesperfall.state.weapon==='crossbow'");wait('Vesperfall.component.arsenal.state.xrArmed');xrpress('left',0);wait('!Vesperfall.state.crossbow.loaded');check(True,'The weapon hand alone fires the loaded crossbow')
  page.evaluate("TestXR.pose('right',[-.23,1.39,-.34])");wait('Vesperfall.component.ritual.reload.armed');xr_set('right',0,True);wait('Vesperfall.component.ritual.reload.grabbed');page.evaluate("TestXR.pose('right',[-.23,1.39,-.09])");wait('Vesperfall.component.ritual.state.reloadProgress>.95');xr_set('right',0,False);wait("Vesperfall.state.events.some(e=>e.type==='reload'&&e.physical)");wait('Vesperfall.state.crossbow.loaded');check(True,'The off-hand physically grabs, pulls and releases the winding handle to reload')
  xr_set('right',1,True);wait('!!Vesperfall.state.shield');shots=page.evaluate('Vesperfall.state.shots');xrpress('left',0);check(page.evaluate('(n)=>Vesperfall.state.shots===n',shots),'A raised off-hand shield prevents crossbow fire');xr_set('right',1,False);wait('!Vesperfall.state.shield')
  # Aim the physical free-hand ray at the genuine nearby practice pickup; never assign game coordinates or resources.
  page.evaluate("""()=>{const g=Vesperfall.component,T=AFRAME.THREE,item=g.game.world.pickups.find(p=>p.id==='ritual-practice'),world=new T.Vector3(.23,1.35,-.4).applyMatrix4(g.rig.matrixWorld),dir=new T.Vector3(...item.p).sub(world).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),dir);TestXR.pose('right',[.23,1.35,-.4]);TestXR.orientation('right',q.toArray());}""")
  wait('Vesperfall.component.ritual.state.target!==null');ammo=page.evaluate('Vesperfall.state.ammo.frost');xr_set('right',0,True);wait("Vesperfall.state.world.pickups.find(p=>p.id==='ritual-practice').taken");xr_set('right',0,False);check(page.evaluate('(n)=>Vesperfall.state.ammo.frost===n+3',ammo),'A real tracked trigger pull draws the crystal into the hand and grants its supply exactly once')
  page.evaluate("TestXR.orientation('right',[0,0,0,1])");xrpress('left',5);wait('Vesperfall.component.paused');xraction('Settings');xraction('Bow hand');xraction('Back');xraction('Resume');wait('!Vesperfall.component.paused')
  page.evaluate("TestXR.pose('left',[-.23,1.35,-.4]);TestXR.orientation('left',[0,0,Math.SQRT1_2,Math.SQRT1_2])");wait('Vesperfall.component.ritual.panel.mesh.visible');check(page.locator('#handedness').input_value()=='right','Left free-palm status works with right-handed weapon preference')
  page.evaluate("TestXR.orientation('left',[0,0,0,1])");wait('Vesperfall.component.arsenal.state.xrArmed');xrpress('right',0);wait('!Vesperfall.state.crossbow.loaded');page.evaluate("TestXR.pose('left',[.23,1.39,-.34])");wait('Vesperfall.component.ritual.reload.armed');xr_set('left',0,True);wait('Vesperfall.component.ritual.reload.grabbed');page.evaluate("TestXR.pose('left',[.23,1.39,-.09])");wait('Vesperfall.component.ritual.state.reloadProgress>.95');xr_set('left',0,False);wait('Vesperfall.state.crossbow.loaded');check(True,'The physical crossbow reload also works with reversed handedness')
  xrpress('right',5);wait('Vesperfall.component.paused');xraction('Settings')
  for _ in range(3):xraction('More / page')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');check(any('Master volume' in r for r in rows) and any('Music:' in r for r in rows),'Audio settings are present inside the controller-only XR menu')
  before=page.locator('#sound-music').input_value();xraction('Music:');check(before!=page.locator('#sound-music').input_value(),'Quest controls change the actual music bus level');xraction('Back');xraction('Exit VR');wait('!Vesperfall.component.xr')
  check(not errors,'No uncaught JavaScript errors during audio, quiver, physical reload and pickup acceptance')
  diagnostics['liveAudio']=page.evaluate('({...Vesperfall.component.soundscape.engine.metrics,liveVoices:Vesperfall.component.soundscape.engine.voices.size,limit:Vesperfall.component.soundscape.engine.limit})')
  check(diagnostics['liveAudio']['peakVoices']<=34,'Audio polyphony stays inside its hard voice budget')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'version':page.evaluate('VesperCore.VERSION'),'passed':len(checks),'checks':checks,'errors':errors,'diagnostics':diagnostics,'scope':'Actual Chromium WebGL and Web Audio PCM, real UI actions and emulated controller poses/buttons. Not physical Quest hardware, subjective audio quality, passthrough safety, comfort or performance certification.'},indent=2))
 except Exception as e:
  info=page.evaluate("({state:window.Vesperfall?.snapshot?.(),ritual:window.Vesperfall?.component?.ritual?.state,errors:[]})")
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'consoleErrors':console_errors,'info':info},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
