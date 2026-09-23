"""Courier's Light: real public WebGL, generated input, no assigned game state.
The separate object fixtures are run first; their success is not a GPU claim.
"""
from pathlib import Path
import os,json,subprocess,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/courier-lantern';OUT.mkdir(parents=True,exist_ok=True)
subprocess.run([sys.executable,str(ROOT/'vesperfall/tests/courier-lantern-objects.py')],check=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[];observations=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
PAD="""(()=>{const pad={id:'Courier Xbox input fixture',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1100,'height':850},device_scale_factor=.4,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.18;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text()+(ROOT/'vesperfall/tests/fake-hands.js').read_text())
 page=ctx.new_page();page.set_default_timeout(150000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def frame():
  n=page.evaluate('Vesperfall.component.courierLantern.state.frames');wait('n=>Vesperfall.component.courierLantern.state.frames>n||!Vesperfall.component.xr',n)
 def button(hand,index,on):
  page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[hand,index,on]);frame()
 def neutral():
  page.evaluate("()=>{for(const h of ['left','right']){for(let i=0;i<6;i++)TestXR.button(h,i,false);TestXR.axes(h,0,0);}}")
  wait('Vesperfall.component.goldwind.state.ready&&Vesperfall.component.fieldKit.state.armed&&Vesperfall.component.courierLantern.state.armed')
 def xrmenu(text):
  wait('Vesperfall.component.dominionControls.state.xrNeutral')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');idx=next(i for i,r in enumerate(rows) if text.lower() in r.lower());cur=page.evaluate('Vesperfall.component.menuSelection')
  for _ in range((idx-cur+len(rows))%len(rows) or len(rows)):
   page.evaluate("TestXR.axes('left',0,1)");wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  button('right',0,True);button('right',0,False)
 def grab_lantern():
  neutral();point=page.evaluate("()=>{const g=Vesperfall.component;g.courierLantern.position();g.rig.updateMatrixWorld(true);return g.rig.worldToLocal(g.courierLantern.point.clone()).toArray();}")
  page.evaluate("p=>TestXR.pose('right',p)",point);frame();button('right',1,True);wait('Vesperfall.component.courierLantern.state.held');return point
 def pause_xr():button('right',3,True);button('right',3,False);wait('Vesperfall.component.paused')
 def pad(i,on):
  page.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on',[i,on])
 def walk(point):
  result=page.evaluate("""async target=>{const trace={distance:0,start:performance.now(),simStart:Vesperfall.state.time};let last=[...Vesperfall.state.p];return await new Promise((resolve,reject)=>{const timer=setInterval(()=>{const g=Vesperfall.component,s=g.game,p=s.p,dx=target[0]-p[0],dz=target[2]-p[2],d=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-g.yaw),Math.cos(yaw-g.yaw));trace.distance+=Math.hypot(p[0]-last[0],p[1]-last[1],p[2]-last[2]);last=[...p];TestPad.pad.axes=[0,d>.18&&Math.abs(a)<.08?-1:0,Math.abs(a)>.025?-Math.sign(a)*(.18+.82*Math.min(1,Math.abs(a)*5)):0,0];TestPad.button(10,true);
   if(d<=.18||s.phase!=='playing'||performance.now()-trace.start>150000){TestPad.pad.axes=[0,0,0,0];TestPad.button(10,false);clearInterval(timer);if(d>.18)reject(Error('Walk failed '+JSON.stringify({target,p,phase:s.phase,paused:g.paused,padArmed:g.dominionControls.state.armed})));else resolve({...trace,simSeconds:s.time-trace.simStart,health:s.health,end:[...p]});}},3);});}""",point)
  observations.append({'target':point,**result});print('WALK',point,'health',result['health'],flush=True)
 try:
  page.goto(BASE+'/vesperfall/?journey=couriers-light',wait_until='domcontentloaded')
  wait('window.Vesperfall?.component.courierLantern&&Vesperfall.component.currentworks.state.ready&&Vesperfall.component.stats.drawCalls>0')
  check(page.evaluate('AFRAME.THREE.REVISION==="184"&&AFRAME.scenes.length===1'),'The existing renderer prepares the library and courier equipment')
  page.locator('#start').click();wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  page.keyboard.press('KeyL');wait('Vesperfall.component.courierLantern.held.visible')
  check(page.evaluate('Vesperfall.component.courierLantern.panel.mesh.parent===Vesperfall.component.courierLantern.held&&Vesperfall.component.courierLantern.light.intensity===2'),'Keyboard L reveals the carried bearing card and bounded virtual light')
  check(page.evaluate('Vesperfall.state.targets.size===0&&Vesperfall.state.shots===0'),'Reading the bearing does not award a signal or a shot')
  page.screenshot(path=str(OUT/'carried-guide-desktop.png'))
  page.keyboard.press('KeyP');check(page.evaluate('!Vesperfall.component.courierLantern.state.desktop'),'Pause safely stows the lantern')
  page.locator('#menu-vr').click();wait('Vesperfall.component.xr');xrmenu('Resume');neutral();grab_lantern()
  check(page.evaluate('!Vesperfall.component.fieldKit.state.held&&!Vesperfall.component.goldwind.gesture.held'),'The lantern grip does not also take a flask or teleport disk')
  before=page.evaluate('Vesperfall.state.shardsUsed');button('right',1,False);neutral()
  check(page.evaluate('n=>!Vesperfall.component.courierLantern.state.held&&Vesperfall.state.shardsUsed===n',before),'Releasing the lantern stows without a disk or consumable cost')
  # Stationary trigger-throw fallback uses the production field-kit input.
  point=page.evaluate("()=>{const g=Vesperfall.component;g.fieldKit.positionBelt();g.rig.updateMatrixWorld(true);return g.rig.worldToLocal(g.fieldKit.slots.find(s=>s.kind==='frost').point.clone()).toArray();}")
  page.evaluate("p=>{TestXR.pose('right',p);TestXR.orientation('right',[0,0,0,1]);}",point);frame();button('right',1,True);wait("Vesperfall.component.fieldKit.state.held==='frost'")
  button('right',0,True);wait('Vesperfall.state.fieldkit.throws===1');frame();frame()
  check(page.evaluate('Vesperfall.state.fieldkit.stock.frost===1&&Vesperfall.state.fieldkit.throws===1'),'A stationary held-frost trigger spends and launches exactly one finite flask')
  button('right',0,False);button('right',1,False);neutral();wait('Vesperfall.state.fieldkit.flights.length===0')
  check(page.evaluate("Vesperfall.state.events.some(e=>e.type==='kit-splash')&&Vesperfall.state.shots===0&&Vesperfall.state.shardsUsed===0"),'The aimed flask lands through actual physics without firing the bow or disk')
  pause_xr();xrmenu('Exit VR');wait('!Vesperfall.component.xr')
  page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed');pad(9,True);pad(9,False);wait('!Vesperfall.component.paused');wait('Vesperfall.component.dominionControls.state.armed')
  pad(4,True);pad(12,True);pad(12,False);pad(4,False);wait('Vesperfall.component.courierLantern.state.desktop')
  check(page.evaluate('!Vesperfall.component.paused'),'Xbox LB+Up equips the lantern without opening the journal')
  m=page.evaluate('Vesperfall.state.world.pipeline.modules[0]')
  for target in [m['front'],m['paths']['gallery'][1],m['paths']['gallery'][2],m['winch']]:walk(target)
  check(page.evaluate('Math.abs(Vesperfall.state.p[1]-3.2)<.08&&!Vesperfall.state.pilgrimage.shutters[0]'),'Ordinary Xbox movement reaches the existing upper winch without changing progress')
  pad(9,True);pad(9,False);wait('Vesperfall.component.paused');page.evaluate('TestPad.enabled=false');wait('Vesperfall.component.dominionControls.state.pad===null')
  page.locator('#menu-vr').click();wait('Vesperfall.component.xr');xrmenu('Resume');neutral();grab_lantern()
  page.evaluate("()=>{const g=Vesperfall.component,T=g.T,c=g.wayfinder.current(),origin=new T.Vector3(...TestXR.state.hands.right).applyMatrix4(g.rig.matrixWorld),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),new T.Vector3(...c.point).sub(origin).normalize());q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation('right',q.toArray());}");frame()
  button('right',0,True);wait('Vesperfall.state.pilgrimage.shutters[0]');frame();frame()
  check(page.evaluate('Vesperfall.component.courierLantern.state.uses===1&&Vesperfall.state.targets.size===0'),'An aimed lantern trigger operates the actual reachable winch once, without awarding a relay')
  page.screenshot(path=str(OUT/'lantern-winch-vr.png'))
  button('right',0,False);button('right',1,False);neutral();grab_lantern();page.evaluate("TestXR.missing('right',true)");frame();frame()
  check(page.evaluate('!Vesperfall.component.courierLantern.state.held'),'Tracking loss stows the held lantern without a stale action')
  page.evaluate("TestXR.missing('right',false)");button('right',1,False)
  if not page.evaluate('Vesperfall.component.paused'):pause_xr()
  xrmenu('Exit VR');wait('!Vesperfall.component.xr');page.locator('#save-expedition').click()
  saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint.state')
  check(saved['pilgrimage']['shutters'][0] and saved['fieldkit']['stock']['frost']==1,'The original save contains the actual opened shutter and spent frost flask')
  page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.courierLantern&&Vesperfall.component.currentworks.state.ready');page.locator('#continue-expedition').click();wait('Vesperfall.component.running&&Vesperfall.component.paused')
  current=page.evaluate('PilgrimSave.capture(Vesperfall.state,{id:"courier-compare",banked:0,receipt:{},yaw:0,pitch:0,focus:1}).state')
  for key in ['p','health','ammo','fieldkit','pilgrimage','enemies','pickups','score','shots','targets','time']:check(saved.get(key)==current.get(key),'Courier continuation preserves saved '+key)
  check(page.evaluate('!Vesperfall.component.courierLantern.state.held&&!Vesperfall.component.courierLantern.state.desktop'),'Continue starts safely paused with the ephemeral lantern stowed')
  page.locator('#mission-ar').click();wait('Vesperfall.component.xr&&Vesperfall.component.arExpedition');xrmenu('Back to menu');xrmenu('Resume');neutral();grab_lantern()
  check(page.evaluate('Vesperfall.component.courierLantern.held.visible&&Vesperfall.component.courierLantern.light.intensity===0&&!Vesperfall.component.currentworks.scene.visible'),'First-person AR retains the compact carried guide without added room illumination or opaque scenery')
  page.evaluate('TestHands.mode(true)');frame();frame();wait('!Vesperfall.component.courierLantern.state.held')
  check(True,'Switching to optical hands cancels controller equipment ownership')
  check(not errors and not console,'No captured application or console errors in the public journey')
  check(page.evaluate('AFRAME.scenes[0].renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable)'),'Compiled gameplay shaders report no runnable failures')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'observations':observations,'origin':BASE,'scope':'Real rendered game, emulated devices. Reduced drawing-buffer captures; not physical Quest/Xbox or sustained-performance approval.'},indent=2))
 except Exception as e:
  try:page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  state=None
  try:state=page.evaluate('window.Vesperfall?{p:Vesperfall.state.p,phase:Vesperfall.state.phase,paused:Vesperfall.component.paused,lantern:Vesperfall.component.courierLantern?.state,fieldkit:Vesperfall.state.fieldkit}:null')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'observations':observations,'state':state},indent=2,default=str));raise
 finally:b.close()
