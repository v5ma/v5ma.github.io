"""Actual input/renderer checks. Only the unavailable XR hardware is mocked."""
from pathlib import Path
import base64,json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'spatial-evidence'; OUT.mkdir(exist_ok=True)
SCENE=os.getenv('SPATIAL_SCENE','classic');assert SCENE in ('classic','tidegate')
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
PAGE='index.html' if SCENE=='classic' else 'tidegate.html';KEY='__dinoRanger' if SCENE=='classic' else '__tidegate'
PAD="""window.pad={id:'Spatial synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[pad],configurable:true});"""
checks=[];errors=[];server=None
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  opt={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
  if os.getenv('CHROMIUM_PATH'):opt['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opt);page=browser.new_page(viewport={'width':1100,'height':820});page.add_init_script(PAD);page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 and 'favicon' not in r.url else None)
  def wait(expr,t=60000):page.wait_for_function(expr,timeout=t)
  def press(i):
   wait('!input.neutral');page.evaluate('i=>pad.buttons[i]={value:1,pressed:true}',i)
   try:page.wait_for_function('i=>input.previous[i]===true',arg=i,timeout=30000)
   finally:page.evaluate('i=>pad.buttons[i]={value:0,pressed:false}',i)
   page.wait_for_function('i=>input.previous[i]===false&&!input.neutral',arg=i,timeout=30000)
  def xrready():wait('x.context===x.ctx.modal()&&!x.gate.neutral.has(right)',30000)
  def xrpress(i):
   xrready();page.evaluate('i=>right.gamepad.buttons[i].value=1',i)
   try:page.wait_for_function('i=>x.gate.states.get(right)?.[i]===true',arg=i,timeout=30000)
   finally:page.evaluate('i=>right.gamepad.buttons[i].value=0',i)
   xrready()
  def capture(name):
   data=page.evaluate("()=>{x.render();return g.renderer.domElement.toDataURL('image/png').split(',')[1]}")
   (OUT/(SCENE+'-'+name+'.png')).write_bytes(base64.b64decode(data))
  try:
   page.goto(BASE+PAGE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.'+KEY+'?.state.ready',120000);page.evaluate('window.g=window.'+KEY+';window.x=g.xr;window.input=x.ctx.input;')
   check(page.evaluate('x.console.snapshot().build')=='ranger-spatial-console-20260920.1','Exact spatial console build boots in '+SCENE)
   press(0);wait('g.state.started')
   if page.locator('dialog[open]').count():press(1)
   press(9);page.locator('#quality-select' if SCENE=='classic' else '#quality').select_option('low');press(1)
   if SCENE=='classic':press(3);wait('g.state.mode==="foot"')
   before=page.evaluate('({field:g.state.field.commendations,tool:x.ctx.fleet.state.tool,portal:{...x.presentation}})')
   # This is the hardware boundary: session and tracked poses only, not the game state.
   page.evaluate('''async()=>{window.T=await import('./vendor/three.module.js');const make=handedness=>({handedness,gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({value:0}))}});window.left=make('left');window.right=make('right');window.session=new EventTarget();session.inputSources=[left,right];session.visibilityState='visible';window.ended=0;session.end=async()=>{ended++;session.dispatchEvent(new Event('end'));};Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>true,requestSession:async()=>session}});g.renderer.xr.setSession=async()=>{};await x.checkSupport();}''')
   press(9);page.locator('#xr-presentation').select_option('first-person-vr');page.locator('#xr-enter').click();wait('x.active')
   page.evaluate('''()=>{g.camera.position.set(0,1.65,0);g.camera.quaternion.identity();for(const [i,s] of [[0,left],[1,right]]){const e=x.controllers[i];e.ray.visible=true;e.ray.position.set(i?.25:-.25,1.3,-.25);e.ray.quaternion.identity();e.ray.updateMatrix();e.grip.visible=true;e.grip.position.copy(e.ray.position);e.grip.updateMatrix();e.ray.dispatchEvent({type:'connected',data:s});}}''')
   if page.locator('dialog[open]').count():press(1)
   xrready();wait('!x.console.expanded&&!x.panel.visible')
   check(page.evaluate('x.console.wrist.mesh.visible&&x.console.wrist.mesh.parent===x.controllers[0].grip'),'Compact status attaches to tracked grip, not the head')
   capture('clear-play-view')
   # Move normally; a hidden old field-panel plane must not intercept ordinary play.
   p=page.evaluate('g.state.position');page.evaluate('left.gamepad.axes[2]=1')
   try:page.wait_for_function('p=>Math.hypot(g.state.position.x-p.x,g.state.position.z-p.z)>.5',arg=p,timeout=60000)
   finally:page.evaluate('left.gamepad.axes[2]=0')
   check(not page.evaluate('x.panel.visible'),'Actual gameplay moves with the full field board hidden')
   xrpress(5);wait('g.state.paused&&x.panel.visible&&x.console.expanded');page.wait_for_timeout(350)
   pose=page.evaluate('({p:x.panel.position.toArray(),q:x.panel.quaternion.toArray()})')
   page.evaluate('g.camera.position.x+=.3;g.camera.rotation.y=.5');page.wait_for_timeout(400)
   after=page.evaluate('({p:x.panel.position.toArray(),q:x.panel.quaternion.toArray()})')
   check(max(abs(a-b) for a,b in zip(pose['p'],after['p']))<.002 and pose['q']==after['q'],'Open workspace remains fixed when the tracked head turns and moves')
   page.evaluate('g.camera.position.x-=.3;g.camera.quaternion.identity()')
   # Aim an actual target ray at a rendered surface and dispatch real select events.
   page.evaluate('''()=>{window.tapSurface=(mesh,u,v,release=true)=>{const e=x.controllers[1];mesh.updateWorldMatrix(true,false);const box=mesh.geometry.boundingBox||(mesh.geometry.computeBoundingBox(),mesh.geometry.boundingBox),point=new T.Vector3(box.min.x+(box.max.x-box.min.x)*u,box.min.y+(box.max.y-box.min.y)*v,0);mesh.localToWorld(point);e.ray.parent.worldToLocal(point);e.ray.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),point.sub(e.ray.position).normalize());e.ray.updateMatrix();e.ray.updateWorldMatrix(true,false);e.ray.dispatchEvent({type:'selectstart',data:right});if(release)e.ray.dispatchEvent({type:'selectend',data:right});};window.rail=i=>tapSurface(x.console.rail.mesh,(i+.5)/6,.5);window.tile=label=>{x.draw(x.ctx.modal());const t=x.tiles.find(t=>t.label===label);if(!t)throw Error('No tile '+label);tapSurface(x.panel,(t.x+t.w/2)/1024,1-(t.y+t.h/2)/1024);};}''')
   page.evaluate('rail(4)');wait('document.getElementById("spatial-console-settings").open');xrready()
   check(True,'Pointed Workspace tab opens real adjustable settings without searching long menus')
   # Standard controller focus and adjustment, not setting configuration directly.
   for _ in range(30):
    if page.evaluate('document.activeElement?.id')=='spatial-height':break
    press(13)
   else:raise AssertionError('Controller cannot reach workspace height')
   height=page.evaluate('x.console.cfg.height');press(15);check(page.evaluate('x.console.cfg.height')>height,'Xbox D-pad adjusts the rendered workspace height')
   for _ in range(20):
    if page.evaluate('document.activeElement?.id')=='spatial-scale':break
    press(13)
   scale=page.evaluate('x.console.cfg.scale');press(15);check(page.evaluate('x.console.cfg.scale')>scale,'Xbox D-pad resizes workspace independently of the game')
   check(page.evaluate('x.presentation.width')==before['portal']['width'],'Workspace resizing preserves accepted diorama width')
   capture('raised-workspace');xrready();page.evaluate('rail(1)');wait('document.getElementById("map-dialog").open');xrready();check(page.evaluate('x.panel.visible'),'Direct Map tab displays the actual mission map in the workspace');capture('mission-map')
   page.evaluate('rail(0)');wait('!g.state.paused&&!x.panel.visible');xrready();check(True,'Resume removes the menu hit surface and restores normal play')
   # A controller may disappear while the hand remains a connected input source.
   page.evaluate('''()=>{for(const e of x.controllers)e.ray.dispatchEvent({type:'disconnected'});window.right={handedness:'right',hand:new Map()};session.inputSources=[right];const e=x.controllers[1];e.ray.visible=true;e.grip.visible=false;e.ray.dispatchEvent({type:'connected',data:right});}''');wait('g.state.paused');xrready();page.evaluate('rail(0)');wait('!g.state.paused');xrready()
   wait('x.console.wrist.mesh.visible');page.evaluate('tapSurface(x.console.wrist.mesh,.75,.12)');wait('x.console.trayOpen&&x.panel.visible&&!g.state.paused');xrready()
   check(True,'Hand-only floor slate summons field controls without pausing gameplay')
   page.evaluate('tile("Zapper")');check(page.evaluate('x.ctx.fleet.state.tool')==1,'Hand selection reaches original tool handler')
   p=page.evaluate('g.state.position')
   page.evaluate('''()=>{x.draw(null);const t=x.tiles.find(t=>t.label==='Hold Forward');tapSurface(x.panel,(t.x+t.w/2)/1024,1-(t.y+t.h/2)/1024,false);}''')
   try:page.wait_for_function('p=>Math.hypot(g.state.position.x-p.x,g.state.position.z-p.z)>.25',arg=p,timeout=60000)
   finally:page.evaluate("x.controllers[1].ray.dispatchEvent({type:'selectend',data:right})")
   check(page.evaluate('x.holds.size')==0,'Hand field controls move the actual ranger and stop on release')
   page.evaluate('tile("Hide field controls")');wait('!x.panel.visible&&!x.console.trayOpen');check(True,'Closing the field tray removes its full-size hit area')
   page.evaluate('tapSurface(x.console.wrist.mesh,.25,.12)');wait('g.state.paused');xrready()
   page.evaluate('rail(5)');wait('!x.active');check(page.evaluate('ended')==1 and not page.evaluate('x.console.root.visible||x.console.wrist.mesh.visible'),'Leave XR ends the actual session owner and removes all spatial UI')
   if page.locator('dialog[open]').count():press(1)
   press(14);check(page.evaluate('x.ctx.fleet.state.tool')==0,'Screen/controller play remains usable after XR exit')
   check(page.evaluate('g.state.field.commendations')==before['field'],'UI inspection does not grant or reset mission rewards')
   settings=page.evaluate('x.console.cfg');page.reload(wait_until='domcontentloaded');wait('window.'+KEY+'?.state.ready',120000);page.evaluate('window.g=window.'+KEY+';window.x=g.xr;window.input=x.ctx.input;')
   check(page.evaluate('x.console.cfg')==settings and not page.evaluate('x.console.trayOpen'),'Workspace preferences survive reload without restoring armed menu input')
   check(not errors,'No captured game JavaScript or HTTP errors')
   (OUT/(SCENE+'-report.json')).write_text(json.dumps({'build':'ranger-spatial-console-20260920.1','scene':SCENE,'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'physicalHardwareVerified':False,'limits':'Actual game movement, UI handlers and renderer; synthetic Xbox/Quest values and mocked headset/session/hand poses. Not physical headset, stereo compositor, comfort or human readability acceptance.'},indent=2))
  except Exception as e:
   diag={}
   try:diag=page.evaluate('({state:g?.state,spatial:x?.console?.snapshot(),root:x?.ctx.modal()?.id,focus:document.activeElement?.id})');page.screenshot(path=str(OUT/(SCENE+'-failure.png')),timeout=30000)
   except:pass
   (OUT/(SCENE+'-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'diagnostic':diag},indent=2));raise
  finally:browser.close()
finally:
 if server:server.terminate()
