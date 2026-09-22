"""New owner playtest contracts, using actual scene controls and ordinary input.
No actor, clock, health, completion, score or UI-page writes. Emulated XR is not physical Quest QA.
"""
from pathlib import Path
import os,json,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/playability';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[];outcomes={}
SAVED={'prism-current.river.records.v1':'{"duck-armada/vr/arcade":{"score":1234,"wins":2}}','prism-current.v1.records':'{"sentinel":true}'}
def check(ok,message):
 assert ok,message
 checks.append(message);print('PASS',message,flush=True)
POINT="""i=>{const T=AFRAME.THREE,s=AFRAME.scenes[0],m=s.object3D.getObjectByName('river-xr-menu'),r=RiverRotunda.RECTS[i];m.updateWorldMatrix(true,false);return new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld).toArray();}"""
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts)
 def watch(p):
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 def click(p,i):
  p.wait_for_function('River.snapshot().rotunda.open&&River.snapshot().rotunda.progress>=1')
  q=p.evaluate(POINT,i);xy=p.evaluate('q=>{const v=new AFRAME.THREE.Vector3(...q).project(AFRAME.scenes[0].camera),r=document.getElementById("scene-wrap").getBoundingClientRect();return [r.x+(v.x*.5+.5)*r.width,r.y+(-v.y*.5+.5)*r.height];}',q)
  p.mouse.click(*xy);p.wait_for_timeout(180)
 try:
  c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.25,service_workers='block');c.add_init_script('for(const [k,v]of Object.entries('+json.dumps(SAVED)+'))localStorage.setItem(k,v)');p=c.new_page();p.set_default_timeout(45000);watch(p)
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open')
  check(p.evaluate('River.snapshot().difficulty')=='easy','First play defaults to Easy, even when legacy scores exist')
  click(p,6);p.wait_for_function('River.snapshot().rotunda.page==="difficulty"')
  for i,d in enumerate(['easy','normal','hard','ultra-hard']):
   click(p,i);p.wait_for_function('d=>River.snapshot().difficulty===d',arg=d);check(True,d+': actual in-canvas choice selects this profile')
  p.reload(wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open');check(p.evaluate('River.snapshot().difficulty')=='ultra-hard','Difficulty preference survives a page reload')
  p.add_script_tag(content=(ROOT/'prism-current/tests/frame-trace.js').read_text());p.evaluate("window.playabilityTrace=RiverFrameTrace.install(AFRAME.scenes[0].components['river-game'])")
  click(p,6);click(p,0);click(p,6);click(p,4);p.wait_for_function('River.snapshot().phase==="playing"')
  check(p.evaluate('River.snapshot().difficulty')=='easy','The ordinary screen Start uses the selected Easy encounter')
  p.wait_for_function('River.snapshot().rotunda.hudPrepared');check(True,'Health textures were uploaded during loading before the soundtrack')
  p.wait_for_function('River.snapshot().rotunda.healthGaugeVisible');check(p.evaluate('River.snapshot().result.health')==100,'A labeled persistent health gauge begins at 100')
  check(not p.evaluate('River.snapshot().entities.some(n=>n.type==="boss")'),'No boss exists at the start of a chapter')
  # Read-only observer of boss timing and incoming families through the whole run.
  p.evaluate("window.playabilityObserved={earlyBoss:false,bolt:false,bossArrival:null};window.playabilityObserve=setInterval(()=>{const s=River.snapshot();if(s.entities.some(n=>n.type==='bolt'))playabilityObserved.bolt=true;const boss=s.entities.find(n=>n.type==='boss');if(boss){if(s.time<RiverCore.BOSS_BEAT*RiverCore.BEAT)playabilityObserved.earlyBoss=true;if(playabilityObserved.bossArrival===null)playabilityObserved.bossArrival=s.time;}},20)")
  # Deliberately allow an incoming purple block to hit; health is never assigned.
  p.wait_for_function('River.snapshot().result.health<100',timeout=30000)
  before=p.evaluate('River.snapshot().result');check(before['damage']>0,'An actual incoming block changes the health meter')
  p.add_script_tag(content=(ROOT/'prism-current/tests/playability-driver.js').read_text());p.evaluate('startFriendlyPilot("heal")')
  p.wait_for_function('River.snapshot().result.healed>0',timeout=10000);p.evaluate('stopFriendlyPilot()')
  check(p.evaluate('River.snapshot().result.health')>before['health'],'Shooting an actual supply box restores missing health')
  check(p.evaluate('AFRAME.scenes[0].components["river-game"].state.events.some(e=>e.type==="heal"&&e.reason==="laser")'),'The healing followed a laser intersection, not a forced health assignment')
  p.mouse.move(640,500);p.mouse.down();p.evaluate('startFriendlyPilot("cut-block")');p.wait_for_function('River.snapshot().result.cutBlocks>0',timeout=22000);p.evaluate('stopFriendlyPilot()');p.mouse.up()
  check(True,'The purple incoming blocks can really be sliced with a moving blade')
  hits=p.evaluate('River.snapshot().result.shotHits');p.evaluate('startFriendlyPilot("laser-block")');p.wait_for_function('n=>River.snapshot().result.shotHits>n',arg=hits,timeout=15000);p.evaluate('stopFriendlyPilot()')
  check(p.evaluate('AFRAME.scenes[0].components["river-game"].state.events.some(e=>e.type==="destroy"&&e.kind==="block"&&e.reason==="laser")'),'The same incoming block family can be destroyed with a laser')
  p.keyboard.press('KeyP');p.wait_for_function('River.snapshot().phase==="paused"');before=p.evaluate('River.snapshot().result');click(p,7);click(p,3)
  check(p.evaluate('River.snapshot().difficulty')=='easy' and p.evaluate('River.snapshot().result')==before,'Paused difficulty cannot relabel or reset the ongoing encounter')
  click(p,6);click(p,0);p.wait_for_function('River.snapshot().phase==="playing"')
  p.mouse.move(640,500);p.mouse.down();p.add_script_tag(content=(ROOT/'prism-current/tests/river-driver.js').read_text());p.evaluate('startRiverDriver()')
  p.wait_for_function('River.snapshot().entities.some(n=>n.type==="boss")',timeout=45000)
  observed=p.evaluate('playabilityObserved');check(not observed['earlyBoss'],'The boss first appears in the final phrase, not before it')
  check(p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("river-actor-boss-duck")!==undefined'),'Admiral Quack has a real scene model during his entrance')
  p.wait_for_function('["complete","escaped","failed"].includes(River.snapshot().phase)',timeout=30000);p.mouse.up();p.evaluate('stopRiverDriver();clearInterval(playabilityObserve)')
  result=p.evaluate('River.snapshot().result');outcomes['easy']=result
  check(result['complete'] and result['bossDefeated'],'An Easy run with real damage, healing and block interactions completes the boss')
  check(not p.evaluate('playabilityObserved.bolt'),'No invulnerable red missile was emitted anywhere in the battle')
  check('duck-armada/desktop/easy/arcade' in p.evaluate('River.snapshot().records'),'New clears are separated by difficulty and input mode')
  for k,v in SAVED.items():check(p.evaluate('k=>localStorage.getItem(k)',k)==v,'Old save preserved: '+k)
  c.close()
  # Controller-only menu and stage-anchored health in both immersive modes.
  for mode in ['ar','vr']:
   c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block');c.add_init_script((ROOT/'prism-current/tests/river-fake-xr.js').read_text()+'\n'+(ROOT/'prism-current/tests/river-strict-xr.js').read_text());p=c.new_page();p.set_default_timeout(45000);watch(p)
   p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open');p.keyboard.press('F2');p.wait_for_function('!document.getElementById("enter-'+mode+'").disabled');p.locator('#enter-'+mode).click();p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated')
   def frames():p.evaluate('async()=>{const s=TestXR.state.session;await new Promise(r=>s.requestAnimationFrame(()=>s.requestAnimationFrame(r)));}')
   def select(i):
    p.wait_for_function('River.snapshot().rotunda.open&&River.snapshot().rotunda.progress>=1');p.evaluate('TestXR.select("left",false)');frames();p.wait_for_timeout(140);p.evaluate('q=>TestXR.point("left",q)',p.evaluate(POINT,i));p.wait_for_function('i=>River.snapshot().xrUI.hover[0]===i',arg=i);frames();n=p.evaluate('River.snapshot().xrUI.actions');p.evaluate('TestXR.select("left",true)');p.wait_for_function('n=>River.snapshot().xrUI.actions===n+1',arg=n);p.evaluate('TestXR.select("left",false)');frames()
   select(7);select(1);check(p.evaluate('River.snapshot().difficulty')=='normal',mode+': ray and trigger select Normal from the spatial menu')
   select(0);select(6);select(0);p.wait_for_function('River.snapshot().phase==="playing"&&River.snapshot().rotunda.healthGaugeVisible')
   check(p.evaluate('River.snapshot().difficulty')=='easy',mode+': direct immersive Start uses Easy')
   p.wait_for_timeout(200);m=p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("prism-health-gauge").matrixWorld.toArray()')
   p.evaluate('TestXR.state.yaw+=.3;TestXR.state.head[0]+=.2');frames()
   check(p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("prism-health-gauge").matrixWorld.toArray()')==m,mode+': health gauge is stage-anchored, not attached to the headset')
   image=p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("prism-health-gauge").material.map.image.toDataURL()');(OUT/(mode+'-health.png')).write_bytes(base64.b64decode(image.split(',')[1]));p.screenshot(path=str(OUT/(mode+'-health-view.png')))
   check(p.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==(0 if mode=='ar' else 1),mode+': health does not change compositor transparency')
   p.evaluate('TestXR.state.session.end()');p.wait_for_function('!River.snapshot().immersive');check(p.evaluate('River.snapshot().phase')=='paused',mode+': ending the headset session preserves the selected encounter');c.close()
  check(not errors,'No uncaught script or shader errors in new gameplay/UI paths')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'results':outcomes,'errors':errors,'scope':'Actual input/renderer on selected source or public URL; emulated XR. No gameplay-state assignments. Not a physical Quest or human difficulty evaluation.'},indent=2))
 except Exception as e:
  try:s=p.evaluate('window.River?.snapshot()')
  except:s=None
  try:trace=p.evaluate('window.playabilityTrace?.snapshot()')
  except:trace=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'results':outcomes,'errors':errors,'snapshot':s,'frameTrace':trace},indent=2))
  try:p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:b.close()
