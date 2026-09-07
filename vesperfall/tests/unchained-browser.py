"""Actual A-Frame browser exercise. Gameplay actions use buttons/keys; XR swaps
only device poses and buttons, never actor, health, kills, progress or clocks.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,time,math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];MODE=os.getenv('UNCHAINED_SUITE','desktop');BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');OUT=ROOT/'test-output'/('unchained-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(value,name):
 assert value,name
 checks.append(name);print('PASS:',name,flush=True)
def state(p):return p.evaluate('Vesperfall.snapshot()')
def focus(p):p.locator('a-scene canvas').focus()
def key_until(p,key,condition):
 p.evaluate('''async({key,condition})=>{const canvas=AFRAME.scenes[0].canvas,check=new Function('return ('+condition+')');canvas.focus();canvas.dispatchEvent(new KeyboardEvent('keydown',{code:key,bubbles:true}));await new Promise((resolve,reject)=>{const start=performance.now(),timer=setInterval(()=>{if(check()||performance.now()-start>60000){canvas.dispatchEvent(new KeyboardEvent('keyup',{code:key,bubbles:true}));clearInterval(timer);check()?resolve():reject(Error('Input timeout '+key));}},2);});}''',{'key':key,'condition':condition})
def shot(p):
 n=state(p)['shots'];p.keyboard.down('Space');p.wait_for_function('Vesperfall.component.charge>.98');p.keyboard.up('Space');p.wait_for_function('(n)=>Vesperfall.state.shots>n',arg=n)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);ctx=b.new_context(viewport={'width':640,'height':480},service_workers='block');host=urlparse(BASE).hostname
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 if MODE=='xr':ctx.add_init_script((ROOT/'vesperfall/tests/fake-xr.js').read_text())
 page=ctx.new_page();page.set_default_timeout(150000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/vesperfall/',wait_until='domcontentloaded');page.wait_for_function('window.Vesperfall?.component.arsenal&&Vesperfall.component.rendererReady&&AFRAME.scenes[0].renderer.info.render.calls>0')
  check('v'+page.evaluate('VesperCore.VERSION') in page.locator('#version').inner_text(),'The actual browser renderer loads the Arrows Unchained upgrade')
  page.locator('#practice').click();page.wait_for_function('Vesperfall.component.running&&!Vesperfall.component.paused');focus(page)
  before_profile=page.evaluate('VesperInput.cleanProfile(Vesperfall.component.profile)')
  if MODE=='desktop':
   page.keyboard.press('KeyV');page.wait_for_function('Vesperfall.state.weapon==="crossbow"&&Vesperfall.component.arsenal.crossbow.visible')
   check(True,'Switching V shows the separate crossbow mesh, not a bow label')
   n=state(page)['shots'];page.keyboard.down('Space');page.wait_for_function('(n)=>Vesperfall.state.shots===n+1',arg=n);page.wait_for_timeout(700)
   check(state(page)['shots']==n+1 and not state(page)['crossbow']['loaded'],'Holding the trigger produces only one loaded bolt')
   page.keyboard.up('Space');page.keyboard.press('KeyR');page.wait_for_function('Vesperfall.state.crossbow.reload>0');page.wait_for_function('Vesperfall.state.crossbow.loaded')
   check(True,'Reload takes actual simulation time and restores one bolt')
   page.screenshot(path=str(OUT/'crossbow-in-the-cloister.png'))
   page.keyboard.down('KeyH');page.wait_for_function('!!Vesperfall.state.shield&&Vesperfall.component.arsenal.shield.visible');n=state(page)['shots'];page.keyboard.press('Space');page.wait_for_timeout(250)
   check(state(page)['shots']==n,'A raised directional shield prevents simultaneous shooting')
   check(page.evaluate('Vesperfall.state.guard<100'),'Holding the shield consumes guard')
   page.screenshot(path=str(OUT/'raised-wardglass.png'));page.keyboard.up('KeyH');page.wait_for_function('!Vesperfall.state.shield')
   old=state(page)['player'];page.keyboard.press('KeyB');page.wait_for_function('Vesperfall.state.shardsUsed===1')
   check(state(page)['shardCharges']==1 and math.dist(old,state(page)['player'])>.7,'Shard step moves the real player along clear ground and spends one charge')
   page.wait_for_function('Vesperfall.state.shardCharges===2');check(True,'Shard charges regenerate instead of enabling unlimited rapid dashes')
   page.keyboard.press('KeyV');page.keyboard.press('Digit5');page.wait_for_function('Vesperfall.state.type==="volley"');ammo=state(page)['ammo']['volley'];n=state(page)['shots'];shot(page)
   check(state(page)['shots']==n+1 and state(page)['ammo']['volley']==ammo-1,'A trial volley consumes one finite charge through the ordinary draw/release')
   check(page.evaluate('Vesperfall.component.profile.stats.kills===0'),'Practice does not farm permanent kills')
   page.keyboard.press('KeyP');page.wait_for_function('Vesperfall.component.paused');page.locator('#practice').click();focus(page)
   # Release at the same green valid-landing cue a player sees, not a
   # hardcoded charge that becomes invalid as the look angle changes. Input is
   # timed inside the browser to avoid renderer/IPC release latency.
   page.keyboard.press('Digit4');key_until(page,'ArrowUp','Vesperfall.component.pitch>=.72');key_until(page,'Space','Vesperfall.component.charge>.08&&Vesperfall.component.blinkTrace?.ok&&Vesperfall.component.blinkTrace.destination[1]>3.19')
   page.wait_for_function('Vesperfall.state.p[1]>3.19')
   check(True,'A real light-draw blink reaches the newly widened 3.2m gallery landing')
   page.wait_for_function('Vesperfall.state.blinkCD===0');page.screenshot(path=str(OUT/'blink-onto-gallery.png'))
   key_until(page,'ArrowDown','Vesperfall.component.pitch<=-.8');key_until(page,'ArrowRight','Vesperfall.component.yaw<=-Math.PI+.03');key_until(page,'Space','Vesperfall.component.charge>.08&&Vesperfall.component.blinkTrace?.ok&&Vesperfall.component.blinkTrace.destination[1]<.01')
   page.wait_for_function('Vesperfall.state.p[1]<.01&&Vesperfall.state.blinks===2')
   check(True,'The same ballistic landing rules return the player to the lower courtyard')
   page.keyboard.press('KeyP');page.wait_for_function('Vesperfall.component.paused');page.locator('#chronicle summary').click()
   check(page.evaluate('VesperInput.cleanProfile(Vesperfall.component.profile)')==before_profile,'Practice, blink, volleys and restart leave permanent progression unchanged')
   page.screenshot(path=str(OUT/'chronicle-menu.png'));page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'mobile-chronicle.png'))
   check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The expanded equipment/menu UI fits a narrow browser')
   page.locator('#resume').click();page.locator('#weapon-toggle').click();page.wait_for_function('Vesperfall.state.weapon==="crossbow"');check(True,'Touch/click-accessible equipment controls reach the same gameplay actions')
   page.locator('#menu-button').click();page.wait_for_function('Vesperfall.component.paused');page.locator('#start').click();page.wait_for_function('Vesperfall.component.running&&!Vesperfall.component.paused')
   check(page.evaluate('!Vesperfall.state.volleyUnlocked&&Vesperfall.state.ammo.volley===0'),'An unearned volley remains locked in a new combat run')
   page.keyboard.press('KeyP');page.wait_for_function('Vesperfall.component.paused');profile=page.evaluate('Vesperfall.component.profile');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.Vesperfall?.component.arsenal')
   check(page.evaluate('Vesperfall.component.profile')==profile,'Migrated local profile remains stable after reload')
  elif MODE=='xr':
   page.locator('#vr-button').click();page.wait_for_function('Vesperfall.component.xr&&Object.keys(Vesperfall.component.hands).length===2');page.evaluate("TestXR.pose('right',[.1,1.9,-.4])");page.wait_for_function('Vesperfall.component.menuSelection===0');page.evaluate("TestXR.button('right',0,true)");page.wait_for_function('!Vesperfall.component.paused');page.evaluate("TestXR.button('right',0,false)");page.wait_for_function('Vesperfall.component.arsenal.state.xrArmed');page.evaluate("TestXR.pose('right',[.23,1.35,-.4])")
   page.evaluate("TestXR.button('left',1,true)");page.wait_for_function('!!Vesperfall.state.shield');check(True,'The tracked bow-hand grip raises a real directional shield')
   page.screenshot(path=str(OUT/'xr-shield.png'));page.evaluate("TestXR.missing('left',true)");page.wait_for_function('!Vesperfall.state.shield');check(True,'Losing the bow controller removes its shield rather than leaving invisible protection')
   page.evaluate("TestXR.button('left',1,false);TestXR.missing('left',false)");page.wait_for_function('!!Vesperfall.component.hands.left')
   page.evaluate("TestXR.button('left',3,true)");page.wait_for_function('Vesperfall.state.weapon==="crossbow"');page.evaluate("TestXR.button('left',3,false)");check(True,'Tracked stick-click switches the real weapon')
   page.wait_for_function('Vesperfall.component.arsenal.state.xrArmed');page.evaluate("TestXR.button('right',0,true)");page.wait_for_function('Vesperfall.state.shots===1');page.wait_for_timeout(250);check(state(page)['shots']==1,'A held XR trigger fires only the loaded crossbow bolt')
   page.evaluate("TestXR.button('right',0,false);TestXR.button('right',3,true)");page.wait_for_function('Vesperfall.state.crossbow.reload>0');page.evaluate("TestXR.button('right',3,false)");page.wait_for_function('Vesperfall.state.crossbow.loaded');check(True,'Controller reload follows the real timed magazine state')
   page.evaluate("TestXR.missing('right',true);TestXR.button('right',0,true)");page.wait_for_function('!Vesperfall.component.arsenal.state.xrArmed');page.evaluate("TestXR.missing('right',false)");page.wait_for_function('!!Vesperfall.component.hands.right');page.wait_for_timeout(400)
   check(state(page)['shots']==1,'A held trigger does not fire after tracking returns')
   page.evaluate("TestXR.button('right',0,false)");page.wait_for_function('Vesperfall.component.arsenal.state.xrArmed');page.evaluate("TestXR.button('right',0,true)");page.wait_for_function('Vesperfall.state.shots===2');page.evaluate("TestXR.button('right',0,false)");check(True,'A deliberate new trigger press fires after reconnect neutral arming')
   page.evaluate("TestXR.button('right',1,true)");page.wait_for_function('Vesperfall.state.shardsUsed===1');page.evaluate("TestXR.button('right',1,false)");check(True,'The draw-hand grip performs one collision-checked shard step')
   page.evaluate('TestXR.hide(true)');page.wait_for_function('Vesperfall.component.paused');check(not page.evaluate('!!Vesperfall.state.shield'),'Hidden sessions pause and discard defensive state')
   page.evaluate('TestXR.hide(false);TestXR.state.session.end()');page.wait_for_function('!Vesperfall.component.xr');check(page.locator('#menu.open').is_visible(),'Exiting immersive mode leaves a usable desktop menu')
   check(page.evaluate('VesperInput.cleanProfile(Vesperfall.component.profile)')==before_profile,'Emulated practice does not grant permanent achievements')
  check(not errors,'No uncaught errors during the verified native flow')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'state':state(page),'scope':'Real HTTP A-Frame WebGL. Input automation sends ordinary keys/buttons; XR changes only emulated device poses/buttons. Not physical Quest/Xbox testing.'},indent=2))
 except Exception as e:
  try:d=page.evaluate('({snapshot:window.Vesperfall?.snapshot(),simulationTime:window.Vesperfall?.state.time,pitch:window.Vesperfall?.component.pitch,yaw:window.Vesperfall?.component.yaw,blink:window.Vesperfall?.component.blinkTrace,status:document.getElementById("status")?.textContent})')
  except:d=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors,'checks':checks,'debug':d},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();b.close()
