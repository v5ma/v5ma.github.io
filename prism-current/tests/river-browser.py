"""Accessible text-control compatibility playthrough; rotunda-browser covers the new main entry. Synthetic inputs, never direct score/state writes.
One renderer at a time; full songs at real audio speed. Physical-device QA is separate."""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/river';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[];results={}
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS',text,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
 c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block');c.add_init_script("for(const k of ['prism-current.v1.records','prism-current.v1.practice','prism-current.v1.lessons','prism-current.v1.water-mission'])if(!localStorage.getItem(k))localStorage.setItem(k,'{\"sentinel\":true}');")
 p=c.new_page();p.set_default_timeout(45000)
 def watch(page):
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 watch(p)
 try:
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2')
  check(p.evaluate('River.snapshot().chapter')=='duck-armada','The untouched public entry selects Duck Armada, not a block track')
  check(p.locator('#play').is_visible(),'The explicit F2 text-control alternative exposes the retained Play button')
  check(p.locator('#classic').get_attribute('href')=='./rhythm.html','Original tracks, lessons and practice have a retained entry')
  for chapter,button in [('duck-armada','duck'),('mothership','space')]:
   if chapter=='mothership':p.locator('#results-back').click();p.locator('#space').click()
   p.locator('#play').click();p.wait_for_function("River.snapshot().phase==='playing'")
   p.mouse.move(640,500);p.mouse.down();p.evaluate((ROOT/'prism-current/tests/river-driver.js').read_text());p.evaluate('startRiverDriver()')
   p.wait_for_function('River.snapshot().result.slices>0',timeout=18000)
   check(p.evaluate('River.snapshot().result.slices')>0,chapter+': actual moving-pointer blade slices arrowed fruit')
   if chapter=='duck-armada':
    p.keyboard.press('KeyP');p.wait_for_function("River.snapshot().phase==='paused'");t=p.evaluate('River.snapshot().time');p.wait_for_timeout(250)
    check(p.evaluate('River.snapshot().time')==t,'Pause freezes music-relative combat and water phases')
    check(not p.locator('#scene-wrap').evaluate('(e)=>e.hasPointerCapture(1)'),'Pause releases the held canvas pointer before modal interaction')
    p.mouse.up();p.locator('#resume').click();p.wait_for_function("River.snapshot().phase==='playing'");p.mouse.move(640,500);p.mouse.down()
   p.wait_for_function("River.snapshot().section==='High Tide Airshow'||River.snapshot().section==='Shield Break'||River.snapshot().phase==='failed'",timeout=70000)
   p.wait_for_function("River.snapshot().water>.3||River.snapshot().phase==='failed'",timeout=5000)
   check(p.evaluate('River.snapshot().water')>.3,chapter+': water advances into a higher gameplay phase')
   p.wait_for_function("['complete','failed','escaped'].includes(River.snapshot().phase)",timeout=65000)
   r=p.evaluate('River.snapshot().result');results[chapter]=r
   check(r['complete'],chapter+': full unaccelerated battle ends with the boss defeated')
   check(r['slices']>=5 and r['shotHits']>=10 and r['blocks']>0,chapter+': slicing, aimed lasers and shield interception all contribute')
   check(p.evaluate('River.snapshot().stats.active')<=80,'Rendering stays inside the entity bound')
   p.mouse.up();p.evaluate('stopRiverDriver()');p.screenshot(path=str(OUT/(chapter+'-result.png')))
  for k in ['prism-current.v1.records','prism-current.v1.practice','prism-current.v1.lessons','prism-current.v1.water-mission']:
   check(p.evaluate('(k)=>localStorage.getItem(k)',k)=='{"sentinel":true}','Unchanged legacy storage: '+k)
  p.reload(wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2');check(len(p.evaluate('River.snapshot().records'))==2,'Both chapter clears persist in the new isolated namespace')
  p.locator('#classic').click();p.wait_for_function('window.Prism?.snapshot().ready');check(p.evaluate('Prism.snapshot().track')=='undertow','The retained rhythm entry still boots Undertow and the old implementation')
  c.close()
  gc=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125);gc.add_init_script(path=str(ROOT/'prism-current/tests/standard-pad.js'));p=gc.new_page();watch(p)
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready&&River.snapshot().controller');p.keyboard.press('F2');p.bring_to_front();p.keyboard.press('Shift')
  p.evaluate('PrismTestPad.press(9)');p.wait_for_function("River.snapshot().phase==='playing'")
  check(p.evaluate('River.snapshot().mode')=='gamepad','Menu starts normal gamepad combat from the main entry')
  p.evaluate('testPad.axes[2]=.7;testPad.axes[0]=.6');p.wait_for_timeout(400);p.evaluate('testPad.axes[2]=0;testPad.axes[0]=0')
  check(p.evaluate('River.snapshot().aim[0]')>.1 and p.evaluate('River.snapshot().body[0]')>.05,'Right stick aims independently; left stick dodges')
  p.evaluate('testPad.buttons[6]={pressed:true,value:1};testPad.buttons[7]={pressed:true,value:1}');p.wait_for_timeout(500)
  check(p.evaluate('River.snapshot().result.shots')>=2,'Both standard triggers fire actual laser attempts')
  p.evaluate('testPad.buttons[4]={pressed:true,value:1};testPad.buttons[5]={pressed:true,value:1}');p.wait_for_timeout(250);before=p.evaluate('River.snapshot().result.shots');p.wait_for_timeout(350)
  check(p.evaluate('River.snapshot().shields.every(s=>s.active)') and p.evaluate('River.snapshot().result.shots')==before,'Holding shoulder shields blocks shooting from the same hands')
  p.evaluate('window.testPad=null');p.wait_for_function("River.snapshot().phase==='paused'");check('disconnected' in p.evaluate('River.snapshot().message'),'Controller loss pauses with an explicit recovery message')
  p.evaluate((ROOT/'prism-current/tests/standard-pad.js').read_text());p.wait_for_function('River.snapshot().controller');p.wait_for_timeout(180);check(p.evaluate('River.snapshot().phase')=='paused','Reconnect never resumes on its own');p.evaluate('PrismTestPad.press(9)');p.wait_for_function("River.snapshot().phase==='playing'");gc.close()
  xc=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125);xc.add_init_script(path=str(ROOT/'prism-current/tests/river-fake-xr.js'));p=xc.new_page();watch(p)
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready&&!document.getElementById("enter-vr").disabled');p.keyboard.press('F2');p.locator('#enter-vr').click();p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated')
  def button(hand,i,on):p.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[hand,i,on])
  p.wait_for_timeout(350);p.evaluate("i=>{const T=AFRAME.THREE,m=AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu');m.updateWorldMatrix(true,false);const x=(i%2?631:56)+256.5,y=306+Math.floor(i/2)*122+45,p=new T.Vector3((x/1200-.5)*1.68,(.5-y/814)*1.14,0).applyMatrix4(m.matrixWorld);TestXR.pose('left',[p.x,p.y,-.4]);}",0);button('left',0,False);p.wait_for_timeout(120);button('left',0,True);p.wait_for_timeout(150);button('left',0,False);p.wait_for_function("River.snapshot().phase==='playing'")
  p.evaluate("""async()=>{let target;await new Promise((resolve,reject)=>{const began=performance.now(),timer=setInterval(()=>{const s=River.snapshot();target=s.entities.find(n=>n.type==='fruit');if(s.result?.slices>0){clearInterval(timer);resolve();return;}if(s.phase!=='playing'||performance.now()-began>20000){clearInterval(timer);reject(Error('Tracked slice did not connect: '+JSON.stringify(s)));return;}if(!target)return;const p=target.position,v=RiverCore.DIRS[target.dir],f=Math.max(0,Math.min(1,(p[2]+1.9)/1.35)),d=(f-.5)*.75;TestXR.pose(target.hand?'right':'left',[p[0]+v[0]*d,p[1]+v[1]*d,-.4]);},5);});}""")
  check(p.evaluate('River.snapshot().result.slices')>0,'A tracked-controller blade physically slices fruit in VR')
  p.evaluate('TestXR.pose("left",[-.3,1.36,-.4]);TestXR.pose("right",[.3,1.36,-.4])');button('left',1,True);button('right',1,True);p.wait_for_timeout(150)
  check(p.evaluate('River.snapshot().shields.every(s=>s.active)'),'Both grips become oriented shields rather than pausing the game')
  before=p.evaluate('River.snapshot().result.shots');button('right',0,True);p.wait_for_timeout(350);check(p.evaluate('River.snapshot().result.shots')==before,'Shielded XR saber cannot shoot')
  button('right',1,False);p.wait_for_timeout(400);check(p.evaluate('River.snapshot().result.shots')>before,'Releasing grip returns the same hand to trigger-laser operation')
  button('right',0,False);button('right',1,True);p.wait_for_function('River.snapshot().result.blocks>0',timeout=20000)
  check(p.evaluate('River.snapshot().result.blocks')>0,'A real incoming projectile intersects the tracked shield')
  button('right',5,True);p.wait_for_timeout(150);button('right',5,False);p.wait_for_function("River.snapshot().phase==='paused'")
  check(True,'B/Y opens the spatial menu during battle')
  p.wait_for_timeout(350);p.evaluate('TestXR.state.handMode=true;TestXR.state.pinch=false');p.evaluate("i=>{const T=AFRAME.THREE,m=AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu');m.updateWorldMatrix(true,false);const x=(i%2?631:56)+256.5,y=306+Math.floor(i/2)*122+45,p=new T.Vector3((x/1200-.5)*1.68,(.5-y/814)*1.14,0).applyMatrix4(m.matrixWorld);TestXR.pose('left',[p.x,p.y,-.4]);}",1);p.wait_for_timeout(200);p.evaluate('TestXR.state.pinch=true');p.wait_for_timeout(250)
  check(p.evaluate('River.snapshot().chapter')=='mothership','A tracked hand pinch selects the other chapter in the paused menu')
  p.evaluate('TestXR.state.session.end()');p.wait_for_function('!River.snapshot().immersive');p.locator('#enter-ar').click();p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated')
  check(p.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==0,'AR uses transparent clear alpha rather than an opaque fake passthrough')
  p.evaluate('TestXR.state.session.end()');xc.close()
  vc=b.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1);p=vc.new_page();p.set_default_timeout(60000);watch(p);p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2');p.wait_for_timeout(700);p.screenshot(path=str(OUT/'river-menu-1440.png'));p.locator('#play').click();p.wait_for_function("River.snapshot().phase==='playing'");p.wait_for_timeout(4200);p.keyboard.press('KeyP');p.screenshot(path=str(OUT/'river-gameplay-1440.png'));vc.close()
  check(not errors,'No captured uncaught script or shader errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'results':results,'errors':errors,'scope':'Two real-time desktop chapter clears through pointer/keyboard input; actual gamepad mapping/disconnect paths and emulated WebXR blade/shield/laser/menu paths. No stage, health, score or actor-state writes. Reduced software-rendered input tests and separate 1440x1000 captures; not physical headset/controller or enjoyment certification.'},indent=2))
 except Exception as e:
  try:snapshot=p.evaluate('window.River?.snapshot()||window.Prism?.snapshot()')
  except:snapshot={}
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'results':results,'errors':errors,'snapshot':snapshot},indent=2))
  try:p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:b.close()
