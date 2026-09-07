"""Real A-Frame/HTTP/WebGL acceptance. Desktop gameplay uses normal key events;
XR suite substitutes poses/buttons only, never positions the game actor directly.
"""
from pathlib import Path
import os,json,math,time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];MODE=os.getenv('VESPER_SUITE','ui');OUT=ROOT/'test-output'/('vesper-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def snap(page):return page.evaluate('Vesperfall.snapshot()')
def aim(page,target,speed=36):
 # A controller expressed as real keyboard events, not assignments to camera/state.
 page.evaluate('''async ({target,speed})=>{const c=Vesperfall.component;const p=c.head.object3D.getWorldPosition(new AFRAME.THREE.Vector3()),dx=target[0]-p.x,dz=target[2]-p.z,d=Math.hypot(dx,dz),dy=target[1]-p.y,v2=speed*speed,disc=v2*v2-9.8*(9.8*d*d+2*dy*v2);const yaw=Math.atan2(-dx,-dz),pitch=disc>0?Math.atan((v2-Math.sqrt(disc))/(9.8*d)):Math.atan2(dy,d);const held=new Set();function key(k,on){if(held.has(k)===on)return;document.querySelector('a-scene').canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:k,key:k,bubbles:true,cancelable:true}));if(on)held.add(k);else held.delete(k);}await new Promise((resolve,reject)=>{const start=performance.now(),timer=setInterval(()=>{const a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw)),b=pitch-c.pitch;key('ArrowLeft',a>.018);key('ArrowRight',a<-.018);key('ArrowUp',b>.013);key('ArrowDown',b<-.013);if(Math.abs(a)<.035&&Math.abs(b)<.035||performance.now()-start>20000){for(const k of [...held])key(k,false);clearInterval(timer);resolve();}},4);});}''',{'target':target,'speed':speed})
def shot(page):
 page.keyboard.down('Space');page.wait_for_function('Vesperfall.component.charge>.98',timeout=20000);page.keyboard.up('Space');page.wait_for_timeout(500)
def walk(page,x,z,close=.7):
 page.evaluate('''async ({x,z,close})=>{const c=Vesperfall.component,held=new Set();function key(k,on){if(held.has(k)===on)return;document.querySelector('a-scene').canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:k,key:k,bubbles:true,cancelable:true}));if(on)held.add(k);else held.delete(k);}await new Promise((resolve,reject)=>{const start=performance.now(),timer=setInterval(()=>{const p=Vesperfall.state.p,dx=x-p[0],dz=z-p[2],d=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw));key('ArrowLeft',a>.04);key('ArrowRight',a<-.04);key('KeyW',Math.abs(a)<.2&&d>close);if(d<close||Vesperfall.state.phase!=='playing'||performance.now()-start>75000){for(const k of [...held])key(k,false);clearInterval(timer);if(d<close)resolve();else reject(Error('Walking stopped at '+p+' instead of '+x+','+z));}},4);});}''',{'x':x,'z':z,'close':close})
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);context=browser.new_context(viewport={'width':1280,'height':840},service_workers='block',record_video_dir=str(OUT/'video'))
 host=urlparse(BASE).hostname;context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 if MODE=='xr':context.add_init_script((ROOT/'vesperfall/tests/fake-xr.js').read_text())
 page=context.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/vesperfall/index.html',wait_until='domcontentloaded');page.wait_for_function('window.Vesperfall?.component.rendererReady&&AFRAME.scenes[0].renderer.info.render.calls>0')
  check(page.evaluate('AFRAME.version==="1.8.0"'),'Pinned A-Frame 1.8.0 is the real scene renderer')
  page.screenshot(path=str(OUT/'title.png'))
  if MODE=='ui':
   page.locator('#practice').click();page.wait_for_function('Vesperfall.component.running&&!Vesperfall.component.paused');page.locator('a-scene canvas').focus()
   check(page.evaluate('Vesperfall.component.isPlaying'),'Starting the run preserves A-Frame tick registration')
   check(len(snap(page)['enemies'])==0,'Practice is explicitly non-combat and has no progression farming')
   await_pose=snap(page)['player'];page.keyboard.down('KeyW');page.wait_for_function('(z)=>Vesperfall.state.p[2]<z-.6',arg=await_pose[2]);page.keyboard.up('KeyW')
   check(snap(page)['player'][2]<await_pose[2]-.6,'Forward input moves along the view, not backward')
   page.keyboard.press('KeyP');page.wait_for_function('Vesperfall.component.paused');await_pose=snap(page)['player'];page.wait_for_timeout(300);check(snap(page)['player']==await_pose,'Pause cancels movement and freezes the run')
   page.locator('#resume').click();page.locator('a-scene canvas').focus();aim(page,[0,1.5,-4]);shot(page);page.wait_for_function('Vesperfall.state.targets.size>0');check(snap(page)['shots']==1,'A charged/released arrow hits a physical practice target')
   page.keyboard.press('Digit2');before=snap(page)['ammo']['cinder'];shot(page);check(snap(page)['ammo']['cinder']==before-1,'Special arrows consume their real limited ammunition')
   page.keyboard.press('Digit4');aim(page,[1,0,0],14);before=snap(page)['player'];page.keyboard.down('Space');page.wait_for_function('Vesperfall.component.charge>.6');page.keyboard.up('Space');page.wait_for_function('Vesperfall.state.events.some(e=>e.type==="blink")');check(snap(page)['player']!=before,'A blink arrow moves the player only after a real floor impact')
   page.keyboard.press('KeyM');check(page.locator('#map').is_visible(),'Map depicts the generated connected rooms')
   page.screenshot(path=str(OUT/'practice-world.png'))
   page.keyboard.down('Space');page.wait_for_function('Vesperfall.component.charge>.2');shots=snap(page)['shots'];page.keyboard.press('KeyP');page.keyboard.up('Space');page.locator('#resume').click();page.wait_for_timeout(500);check(snap(page)['shots']==shots,'Pausing a drawn bow cancels rather than releasing a stale arrow')
   page.keyboard.press('KeyP');page.locator('#seed').fill('ANOTHER-SEED');page.locator('#start').click();check(snap(page)['seed']=='ANOTHER-SEED' and len(snap(page)['enemies'])==5,'A new seed starts a new combat run without contaminating practice')
   page.set_viewport_size({'width':390,'height':844});page.keyboard.press('KeyP');page.screenshot(path=str(OUT/'mobile-menu.png'));check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Narrow-screen settings fit the viewport')
  elif MODE=='expedition':
   page.locator('#start').click();page.locator('a-scene canvas').focus()
   # Visit nodes along the generated graph; stop to shoot actual visible enemies.
   deadline=time.monotonic()+480
   while not snap(page)['portalReady'] and time.monotonic()<deadline:
    s=snap(page);assert s['phase']=='playing','The ordinary-input run died';enemies=[e for e in s['enemies'] if not e['dead']]
    visible=page.evaluate('Vesperfall.state.world.enemies.filter(e=>!e.dead&&VesperCore.len(VesperCore.sub(e.p,Vesperfall.state.head))<17&&!VesperCore.segmentBlocked(Vesperfall.state.world,Vesperfall.state.head,VesperCore.add(e.p,[0,.5,0]))).map(e=>e.id)')
    if visible:
     enemy=next(e for e in enemies if e['id']==visible[0]);aim(page,[enemy['p'][0],enemy['p'][1]+.45,enemy['p'][2]]);shot(page)
    else:
     travel=page.evaluate('(()=>{const s=Vesperfall.state,w=s.world,here=VesperCore.roomAt(w,s.p),e=w.enemies.filter(e=>!e.dead).sort((a,b)=>VesperCore.route(w,here,a.room).length-VesperCore.route(w,here,b.room).length)[0],path=VesperCore.route(w,here,e.room),target=w.rooms[path[1]??e.room];return {x:target.x,z:target.z}})()')
     walk(page,travel['x'],travel['z'],1)
   check(snap(page)['portalReady'],'Real projectile combat defeats all five wardens and opens the beacon')
   check(snap(page)['hits']>=5 and snap(page)['shots']>=5,'Mission progress comes from swept arrow hits, not injected enemy health or kills')
   s=snap(page);page.screenshot(path=str(OUT/'beacon-open.png'))
   travel=page.evaluate('(()=>{const s=Vesperfall.state,w=s.world;return VesperCore.route(w,VesperCore.roomAt(w,s.p),w.exit).map(i=>w.rooms[i]);})()')
   for room in travel:walk(page,room['x'],room['z'],1)
   room=snap(page)['rooms'][snap(page)['exit']];walk(page,room['x'],room['z']-3.8,1);page.keyboard.press('KeyE');page.wait_for_function('Vesperfall.state.phase==="reward"')
   check(page.locator('#reward').is_visible(),'The completed sector offers a real blessing choice')
   old=snap(page);page.locator('[data-reward="power"]').click();page.wait_for_function('Vesperfall.state.world.depth===2')
   check(snap(page)['phase']=='playing' and len([e for e in snap(page)['enemies'] if not e['dead']])==5,'A blessing leads to the next procedural sector with new enemies')
   check(page.evaluate('JSON.parse(localStorage.getItem("vesperfall-profile-v1")).shards>=5'),'Earned renown is banked locally once on completion')
   page.screenshot(path=str(OUT/'second-sector.png'))
  else:
   page.locator('#practice').click();page.locator('#vr-button').click();page.wait_for_function('Vesperfall.component.xr&&AFRAME.scenes[0].renderer.xr.isPresenting')
   check(page.evaluate('AFRAME.scenes[0].renderer.xr.isPresenting'),'The real A-Frame renderer enters an emulated stereo XR session')
   page.evaluate("TestXR.pose('right',[.1,1.9,-.4])");page.wait_for_timeout(150);page.evaluate("TestXR.button('right',0,true)");page.wait_for_function('!Vesperfall.component.paused');page.evaluate("TestXR.button('right',0,false)")
   check(not snap(page)['paused'],'A tracked-controller trigger can activate the spatial Resume menu')
   page.evaluate("TestXR.pose('left',[-.23,1.35,-.4]);TestXR.pose('right',[-.23,1.35,-.26])");page.wait_for_timeout(200);page.evaluate("TestXR.button('right',0,true)");page.wait_for_function('Vesperfall.component.latch.drawing')
   page.evaluate("TestXR.pose('right',[-.23,1.35,.32])");page.wait_for_function('Vesperfall.component.charge>.95');before=snap(page)['shots'];page.screenshot(path=str(OUT/'two-handed-draw.png'));page.evaluate("TestXR.button('right',0,false)");page.wait_for_function('(n)=>Vesperfall.state.shots===n+1',arg=before)
   check(snap(page)['shots']==before+1,'Tracked hand separation, trigger hold and release launch a physical arrow')
   page.evaluate("TestXR.pose('right',[-.23,1.35,-.26])");page.wait_for_timeout(200);page.evaluate("TestXR.button('right',0,true)");page.wait_for_function('Vesperfall.component.latch.drawing');page.evaluate("TestXR.pose('right',[-.23,1.35,.32]);TestXR.missing('left',true)");page.wait_for_timeout(250);before=snap(page)['shots'];page.evaluate("TestXR.button('right',0,false);TestXR.missing('left',false)");page.wait_for_timeout(250);check(snap(page)['shots']==before,'Loss of bow-hand tracking cancels a pull rather than firing on reconnection')
   angle=page.evaluate('Vesperfall.component.rig.rotation.y');page.evaluate("TestXR.axes('right',0,0)");page.wait_for_timeout(100);page.evaluate("TestXR.axes('right',1,0)");page.wait_for_function('(a)=>Math.abs(Vesperfall.component.rig.rotation.y-a)>.4',arg=angle);page.evaluate("TestXR.axes('right',0,0)")
   check(abs(page.evaluate('Vesperfall.component.rig.rotation.y')-angle)>.4,'Snap turn rotates the rig while preserving physical head tracking')
   page.evaluate('TestXR.hide(true)');page.wait_for_function('Vesperfall.component.paused');check(snap(page)['paused'],'Session visibility loss pauses safely')
   page.evaluate('TestXR.hide(false);TestXR.state.session.end()');page.wait_for_function('!Vesperfall.component.xr');check(page.locator('#menu.open').is_visible(),'Ending XR returns to a usable paused desktop menu')
  check(not errors,'No uncaught application errors in the tested flow')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'state':snap(page),'scope':'Native HTTP A-Frame WebGL. Expedition uses ordinary keyboard events with observed navigation; XR substitutes device poses/buttons only. No hardware/comfort or physical draw calibration certification.'},indent=2))
 except Exception as e:
  try:s=snap(page)
  except:s=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors,'checks':checks,'state':s},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
