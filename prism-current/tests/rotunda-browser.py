"""Actual in-canvas clicks and native-shaped emulated XR input. No game-state writes."""
from pathlib import Path
import json,os,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/rotunda';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[];results={}
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS',text,flush=True)
POINT="""(i)=>{const T=AFRAME.THREE,s=AFRAME.scenes[0],m=s.object3D.getObjectByName('river-xr-menu');m.updateWorldMatrix(true,false);const rects=[...Array.from({length:8},(_,i)=>({x:i%2?631:56,y:306+Math.floor(i/2)*122,w:513,h:90})),...Array.from({length:4},(_,i)=>({x:32+i*292,y:209,w:268,h:63})),{x:924,y:30,w:244,h:59},{x:924,y:101,w:244,h:59}],r=rects[i];return new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld).toArray();}"""
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts)
 def watch(p):
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader Error' in m.text else None)
 def worldpoint(p,i):return p.evaluate(POINT,i)
 def click(p,i):
  pos=worldpoint(p,i)
  xy=p.evaluate("p=>{const v=new AFRAME.THREE.Vector3(...p).project(AFRAME.scenes[0].camera),r=document.getElementById('scene-wrap').getBoundingClientRect();return [r.x+(v.x*.5+.5)*r.width,r.y+(-v.y*.5+.5)*r.height];}",pos)
  p.mouse.click(*xy);p.wait_for_timeout(200)
 def snapshot():return p.evaluate('River.snapshot()')
 try:
  c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block');p=c.new_page();p.set_default_timeout(45000);watch(p)
  c.add_init_script("localStorage.setItem('prism-current.v1.records','{\"sentinel\":true}');")
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open');p.bring_to_front();p.keyboard.press('Shift')
  check(p.evaluate("getComputedStyle(document.getElementById('menu')).opacity==='0'"),'Untouched main entry uses rendered scene controls, not the HTML overlay')
  check(snapshot()['version']=='0.11.0','New rotunda runtime identifies the actual version')
  click(p,9);check(snapshot()['rotunda']['page']=='layout','Canvas tab opens placement controls')
  for i in [0,2,4,7]:click(p,i)
  prefs=snapshot()['rotunda']['preferences'];check(prefs['size']>.86 and prefs['yaw']>0,'Raise, move, resize and rotate are live controls')
  click(p,12);check(abs(snapshot()['rotunda']['preferences']['size']-.86)<.001,'Reset placement remains reachable on the transformed panel')
  click(p,8);click(p,4);p.wait_for_function("River.snapshot().phase==='playing'")
  check(True,'Duck Armada starts through an actual 3D screen-play button')
  p.mouse.move(640,500);p.mouse.down();p.evaluate((ROOT/'prism-current/tests/river-driver.js').read_text());p.evaluate('startRiverDriver()')
  p.wait_for_function('River.snapshot().result.slices>0',timeout=18000)
  p.keyboard.press('KeyP');p.wait_for_function("River.snapshot().phase==='paused'");p.mouse.up();p.wait_for_timeout(350);before=snapshot();
  click(p,10);click(p,1);check(snapshot()['time']==before['time'] and snapshot()['result']==before['result'],'Changing music in the rotunda preserves the exact paused battle')
  click(p,8);click(p,0);p.wait_for_function("River.snapshot().phase==='playing'");p.mouse.move(640,500);p.mouse.down()
  p.wait_for_function("['complete','failed','escaped'].includes(River.snapshot().phase)",timeout=110000);p.mouse.up();p.evaluate('stopRiverDriver()');results['duck-armada']=snapshot()['result']
  check(results['duck-armada']['complete'],'Full Duck Armada survives an in-scene sound adjustment and completes normally')
  click(p,1);p.wait_for_timeout(300);click(p,5);p.wait_for_function("River.snapshot().phase==='playing'")
  p.mouse.move(640,500);p.mouse.down();p.evaluate('startRiverDriver()');p.wait_for_function("['complete','failed','escaped'].includes(River.snapshot().phase)",timeout=110000);p.mouse.up();p.evaluate('stopRiverDriver()');results['mothership']=snapshot()['result']
  check(results['mothership']['complete'],'Mothership also completes through the unchanged combat handlers')
  check(p.evaluate("localStorage.getItem('prism-current.v1.records')")=='{"sentinel":true}','Old rhythm records are not touched')
  check(len(snapshot()['records'])==2,'Both completed battles save independently')
  c.close()
  for mode in ['ar','vr']:
   c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block');c.add_init_script((ROOT/'prism-current/tests/river-fake-xr.js').read_text()+'\n'+(ROOT/'prism-current/tests/river-strict-xr.js').read_text());p=c.new_page();p.set_default_timeout(45000);watch(p)
   p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open');p.wait_for_function("!document.getElementById('enter-ar').disabled")
   p.evaluate("()=>{const S=TestXR.state,T=AFRAME.THREE;S.head=[2.7,1.21,-1.6];S.yaw=.83;for(const hand of ['left','right']){S.rotate[hand]=[0,.83,0];S.hands[hand]=new T.Vector3(hand==='left'?-.23:.23,-.3,-.4).applyAxisAngle(new T.Vector3(0,1,0),S.yaw).add(new T.Vector3(...S.head)).toArray();}}")
   click(p,0 if mode=='ar' else 2);p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated&&River.snapshot().rotunda.progress>.99')
   check(not p.evaluate('Array.isArray(TestXR.state.session.inputSources)'),mode+': AR/VR launch uses the native-shaped input collection')
   def aim(i):
    p.evaluate('p=>TestXR.point("left",p)',worldpoint(p,i));p.wait_for_function('(i)=>River.snapshot().xrUI.hover[0]===i',arg=i,timeout=10000)
   def select(i):
    aim(i);p.evaluate('TestXR.select("left",true)');p.wait_for_timeout(180);p.evaluate('TestXR.select("left",false)');p.wait_for_timeout(180)
   def button(hand,i):
    p.evaluate('([h,i])=>TestXR.button(h,i,true)',[hand,i]);p.wait_for_timeout(150);p.evaluate('([h,i])=>TestXR.button(h,i,false)',[hand,i]);p.wait_for_timeout(150)
   for i in range(14):aim(i)
   check(True,mode+': all rendered buttons, tabs, reset and HUD controls accept the ray')
   select(9)
   for i in [0,2,4,7]:select(i)
   for i in range(14):aim(i)
   check(True,mode+': targets remain aligned after moving, resizing and rotating the panel')
   matrix=p.evaluate("AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu').matrixWorld.toArray()")
   p.evaluate('TestXR.state.head[0]+=.25;TestXR.state.yaw+=.25');p.wait_for_timeout(220)
   check(p.evaluate("AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu').matrixWorld.toArray()") == matrix,mode+': head turn and tilt do not drag or tip the placed rotunda')
   select(10);select(4);prefs=snapshot()['rotunda']['preferences'];check(prefs['opacity']<.38,mode+': saved opacity control adjusts actual water settings')
   select(12);select(8);p.evaluate('TestXR.away()');button('right',5);p.wait_for_function("River.snapshot().phase==='playing'")
   p.wait_for_function('River.snapshot().rotunda.progress<.01');check(not snapshot()['rotunda']['open'],mode+': B/Y starts without a ray and the rotunda folds out of play')
   check(snapshot()['rotunda']['hudVisible'] and not snapshot()['rotunda']['headAttached'],mode+': score, hull and combo use a controller-mounted scene display')
   p.evaluate('TestXR.state.head[0]+=1.6;TestXR.state.head[2]+=1.1;for(const h of ["left","right"]){TestXR.state.hands[h][0]+=1.6;TestXR.state.hands[h][2]+=1.1;}');p.wait_for_timeout(550)
   check(snapshot()['phase']=='playing',mode+': sidestepping beyond the old arbitrary rectangle does not pause the game')
   button('right',5);p.wait_for_function("River.snapshot().phase==='paused'");p.wait_for_timeout(300);before=snapshot()
   select(10);select(0);check(snapshot()['result']==before['result'] and snapshot()['time']==before['time'],mode+': music change does not clear progress or restart sound time')
   select(8);select(3);p.wait_for_function('!River.snapshot().immersive');check(snapshot()['phase']=='paused' and snapshot()['result']==before['result'],mode+': ending XR returns to a usable browser page with this battle still paused')
   p.wait_for_timeout(300);click(p,0);p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated');p.wait_for_timeout(300);check(snapshot()['phase']=='paused' and snapshot()['result']==before['result'],mode+': re-entry recovers the same run without automatically resuming')
   button('left',5);p.wait_for_function("River.snapshot().phase==='playing'");p.evaluate('TestXR.hide(true)');p.wait_for_function("River.snapshot().phase==='paused'");p.evaluate('TestXR.hide(false)');p.wait_for_timeout(200)
   check(snapshot()['phase']=='paused',mode+': genuine headset visibility loss still pauses safely')
   select(8);select(13);check(snapshot()['rotunda']['preferences']['hud']=='floor',mode+': wrist display has an accessible floor-mounted alternative')
   data=p.evaluate("AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu').material.map.image.toDataURL()")
   (OUT/(mode+'-rotunda-texture.png')).write_bytes(base64.b64decode(data.split(',')[1]));p.screenshot(path=str(OUT/(mode+'-view.png')))
   select(3);p.wait_for_function('!River.snapshot().immersive');p.reload(wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open')
   check(snapshot()['rotunda']['preferences']['hud']=='floor' and snapshot()['rotunda']['preferences']['opacity']<.38,mode+': UI preferences persist independently across reload')
   c.close()
  c=b.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,service_workers='block');p=c.new_page();p.set_default_timeout(60000);watch(p);p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open');p.wait_for_timeout(800);p.screenshot(path=str(OUT/'rotunda-1440.png'));p.keyboard.press('F2');check(p.locator('#play').is_visible(),'F2 retains a usable semantic text-control alternative');c.close()
  check(not errors,'No uncaught JavaScript or shader errors in exercised new UI paths')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'results':results,'errors':errors,'scope':'Actual rendered controls, two complete real-time battles, native-shaped emulated AR/VR menu inputs and room movement; no actor/score/health/clock assignments. Small software gameplay buffers, separate full-resolution scene capture. Physical Quest, Xbox and touch acceptance remain open.'},indent=2))
 except Exception as e:
  try:state=p.evaluate('window.River?.snapshot()')
  except:state={}
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'results':results,'errors':errors,'snapshot':state},indent=2))
  try:p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:b.close()
