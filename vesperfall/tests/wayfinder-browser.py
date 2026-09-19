"""Complete the first generated chapter without keyboard/game-state interaction.
Only device buttons, sticks and poses are generated. No actor or objective writes.
"""
from pathlib import Path
import os,json,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
MODE=os.getenv('XR_MODE','vr')
OUT=ROOT/'test-output'/('wayfinder-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[];routes=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1100,'height':800},device_scale_factor=.4,service_workers='block')
 ctx.add_init_script('window.TEST_XR_PIXEL_SCALE=.15;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text())
 page=ctx.new_page();page.set_default_timeout(120000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def frame():
  n=page.evaluate('Vesperfall.component.goldwind.state.frames');wait('n=>Vesperfall.component.goldwind.state.frames>n',n)
 def button(h,i,on):page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[h,i,on]);frame()
 def neutral():
  page.evaluate("()=>{for(const h of ['left','right']){for(let i=0;i<6;i++)TestXR.button(h,i,false);TestXR.axes(h,0,0);}}")
  wait('Vesperfall.component.goldwind.state.ready')
 def menu(text):
  wait('Vesperfall.component.dominionControls.state.xrNeutral')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');i=next(i for i,r in enumerate(rows) if text.lower() in r.lower());cur=page.evaluate('Vesperfall.component.menuSelection')
  for _ in range((i-cur+len(rows))%len(rows) or len(rows)):
   page.evaluate("TestXR.axes('left',0,1)");wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  button('right',0,True);button('right',0,False)
 def walk(target):
  result=page.evaluate("""async target=>{const C=VesperCore,T=AFRAME.THREE,start=performance.now(),startTime=Vesperfall.state.time;let distance=0,last=[...Vesperfall.state.p];return await new Promise((resolve,reject)=>{
   const watchdog=setTimeout(()=>{TestXR.axes('left',0,0);TestXR.state.inputFrame=null;reject(Error('XR frame watchdog expired'));},155000);
   TestXR.state.inputFrame=()=>{const g=Vesperfall.component,s=g.game,dx=target[0]-s.p[0],dz=target[2]-s.p[2],d=Math.hypot(dx,dz);distance+=C.len(C.sub(s.p,last));last=[...s.p];
    const f=new T.Vector3(0,0,-1).applyQuaternion(g.head.object3D.getWorldQuaternion(new T.Quaternion()));f.y=0;f.normalize();const r=new T.Vector3(-f.z,0,f.x),v=new T.Vector3(dx,0,dz).normalize();
    TestXR.axes('left',v.dot(r),-v.dot(f));
    if(d<.20||s.phase!=='playing'||performance.now()-start>150000){TestXR.axes('left',0,0);TestXR.state.inputFrame=null;clearTimeout(watchdog);d<.20?resolve({target,end:[...s.p],distance,seconds:s.time-startTime,health:s.health}):reject(Error('XR walk blocked '+JSON.stringify({target,p:s.p,phase:s.phase,health:s.health})));}
   };});}""",target)
  routes.append(result);(OUT/'routes.json').write_text(json.dumps(routes,indent=2));print('XR WALK',target,result['health'],flush=True)
 def path(points):
  for p in points:walk(p)
 def grip(hand='left'):
  wait('!!Vesperfall.component.wayfinder.current()')
  if hand=='right':
   page.evaluate("""()=>{const g=Vesperfall.component,T=g.T,c=g.wayfinder.current(),origin=new T.Vector3(...TestXR.state.hands.right).applyMatrix4(g.rig.matrixWorld),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),new T.Vector3(...c.point).sub(origin).normalize());q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation('right',q.toArray());}""")
  wait('Vesperfall.component.wayfinder.panel.mesh.visible');n=page.evaluate('Vesperfall.component.wayfinder.state.uses')
  button(hand,1,True);wait('n=>Vesperfall.component.wayfinder.state.uses===n+1',n);frame();frame()
  check(page.evaluate('n=>Vesperfall.component.wayfinder.state.uses===n+1',n),'A held '+hand+' grip activates the mechanism once')
  button(hand,1,False)
 try:
  page.goto(BASE+'/vesperfall/?journey=wayfinder-'+MODE,wait_until='domcontentloaded');wait('window.Vesperfall?.component.wayfinder&&Vesperfall.component.stats.drawCalls>0')
  page.locator('#locomotion').select_option('smooth');page.locator('#start').click();page.keyboard.press('KeyP')
  page.locator('#mission-ar' if MODE=='ar' else '#menu-vr').click();wait('Vesperfall.component.xr')
  if MODE=='ar':menu('Back to menu')
  menu('Resume');neutral()
  check(page.evaluate('Vesperfall.state.pilgrimage.stage===0&&Vesperfall.component.goldwind.enabled()'),'The normal Goldwind campaign runs in '+MODE)
  page.evaluate("TestXR.orientation('right',[0,0,-Math.SQRT1_2,Math.SQRT1_2])");wait('Vesperfall.component.ritual.panel.mesh.visible');wait('Vesperfall.component.wayfinder.wrist.mesh.visible')
  check(page.evaluate('Vesperfall.component.wayfinder.state.wristText.includes("0/2")'),'The default palm mode shows the real required objectives, not a hidden HUD')
  bounds=page.evaluate("""()=>{const g=Vesperfall.component,T=g.T,m=g.wayfinder.wrist.mesh;m.updateMatrixWorld(true);const w=m.geometry.parameters.width/2,h=m.geometry.parameters.height/2;return g.scene.renderer.xr.getCamera().cameras.map(c=>[[-w,-h],[w,-h],[-w,h],[w,h]].map(([x,y])=>m.localToWorld(new T.Vector3(x,y,0)).project(c).toArray()));}""")
  (OUT/'wrist-eye-bounds.json').write_text(json.dumps(bounds,indent=2))
  check(len(bounds)==2 and all(abs(p[0])<.97 and abs(p[1])<.97 and -1<p[2]<1 for eye in bounds for p in eye),'The whole objective card fits both eyes at the unchanged default hand pose')
  texture=page.evaluate('Vesperfall.component.wayfinder.wrist.canvas.toDataURL()')
  (OUT/'objective-texture.png').write_bytes(base64.b64decode(texture.split(',')[1]))
  page.screenshot(path=str(OUT/'wrist-objectives.png'));page.evaluate("TestXR.orientation('right',[0,0,0,1])")
  if os.getenv('WAYFINDER_VIEW_ONLY')=='1':
   check(not errors and not console,'No runtime or console errors in view review')
   (OUT/'view-review.json').write_text(json.dumps({'base':BASE,'mode':MODE,'passed':len(checks),'checks':checks,'scope':'View-only review, not a complete chapter journey. Production texture and eye geometry at unchanged simulated hand poses. Not physical hardware.'},indent=2))
   raise SystemExit(0)
  modules=page.evaluate('Vesperfall.state.world.pipeline.modules')
  for m in modules:
   path(page.evaluate('Vesperfall.state.world.pipeline.connector') if m['slot'] else [m['front']])
   path(m['paths']['gallery'][1:3]);walk(m['winch']);grip('left');wait('i=>Vesperfall.state.pilgrimage.shutters[i]',m['slot'])
   grip('right');wait('i=>!Vesperfall.state.pilgrimage.shutters[i]',m['slot'])
   check(page.evaluate('!Vesperfall.component.goldwind.state.flight'),'Using a winch with free-hand grip does not throw a disk')
   path(m['paths']['gallery'][3:5]);grip('left');wait('i=>Vesperfall.state.targets.has(i)',m['slot'])
   check(page.evaluate('i=>Vesperfall.state.targets.has(i)',m['slot']),'A grip lights actual relay '+str(m['slot']+1))
   path(m['paths']['gallery'][5:7]);walk(m['latch']);grip('left');wait('i=>Vesperfall.state.pilgrimage.gates[i]',m['slot'])
   path([[m['latch'][0],0,m['z']+12],m['front'],*m['paths']['bypass'][1:]])
  check(page.evaluate('Vesperfall.state.portalReady&&Vesperfall.component.wayfinder.state.next.text.includes("EXIT READY")'),'Both relays unlock the exit and the objective changes to EXIT READY')
  walk(page.evaluate('Vesperfall.state.world.pipeline.controls.find(c=>c.kind==="exit").p'))
  texture=page.evaluate('Vesperfall.component.wayfinder.panel.canvas.toDataURL()')
  (OUT/'exit-texture.png').write_bytes(base64.b64decode(texture.split(',')[1]))
  page.screenshot(path=str(OUT/'ready-exit.png'));grip('right');wait('Vesperfall.state.phase==="reward"')
  check(page.evaluate('Vesperfall.state.sectors===1&&Vesperfall.state.kills<6'),'Gripping the beacon completes the level without a kill-all requirement')
  page.screenshot(path=str(OUT/'continue-blessing.png'));menu('Vitality');wait('Vesperfall.state.pilgrimage?.stage===1&&Vesperfall.state.phase==="playing"')
  check(page.evaluate('Vesperfall.state.world.depth===2&&Vesperfall.state.sectors===1&&Vesperfall.component.xr'),'A headset blessing selection continues into the next chapter without leaving '+MODE)
  check(page.evaluate('!Vesperfall.component.goldwind.state.flight&&!Vesperfall.component.wayfinder.state.held'),'Chapter transition leaves no held interaction or disk')
  check(not errors,'No runtime exceptions');check(not console,'No captured console or shader errors')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'mode':MODE,'passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console,'scope':'Production movement and interactions with simulated XR inputs, not physical device certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'state':page.evaluate('window.Vesperfall?.snapshot()'),'wayfinder':page.evaluate('window.Vesperfall?.component.wayfinder?.state.next')},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:ctx.close();b.close()
