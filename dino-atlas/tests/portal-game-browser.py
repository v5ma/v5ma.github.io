"""Actual game/controller movement with explicit session/eye fixtures only.
No actor, mission, inventory or physics assignments create acceptance.
"""
from pathlib import Path
import base64,json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'portal-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
SCENE=os.getenv('PORTAL_SCENE','tidegate');assert SCENE in ('tidegate','classic')
KEY='__tidegate' if SCENE=='tidegate' else '__dinoRanger';PAGE='tidegate.html' if SCENE=='tidegate' else 'index.html'
server=None;errors=[];checks=[]
PAD="""window.__pad={id:'Portal synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad],configurable:true});"""
def check(ok,name):
 assert ok,name
 checks.append(name);print('PASS:',name,flush=True)
try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  options=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**options)
  try:
   page=browser.new_page(viewport={'width':1100,'height':820});page.add_init_script(PAD);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('shader' in m.text.lower() or 'webgl' in m.text.lower()) else None)
   page.goto(BASE+PAGE+'?test=1',wait_until='domcontentloaded');page.wait_for_function('window.'+KEY+'?.state.ready',timeout=120000);page.evaluate('window.g=window.'+KEY+';window.input=g.xr.ctx.input;')
   def wait(e,t=90000):page.wait_for_function(e,timeout=t)
   def press(i):
    wait('!input.neutral',30000);page.evaluate('i=>__pad.buttons[i]={pressed:true,value:1}',i)
    try:page.wait_for_function('i=>input.previous[i]===true',arg=i,timeout=30000)
    finally:page.evaluate('i=>__pad.buttons[i]={pressed:false,value:0}',i)
    page.wait_for_function('i=>input.previous[i]===false&&!input.neutral',arg=i,timeout=30000)
   press(0);wait('g.state.started');
   if page.locator('dialog[open]').count():press(1)
   if SCENE=='classic':press(3);wait('g.state.mode==="foot"')
   check(page.evaluate('g.xr.snapshot().portalBuild')=='ranger-portal-20260917.1','Current portal implementation boots in '+SCENE)
   # Entry/pose fixtures replace unavailable XR hardware, never gameplay state.
   page.evaluate('''async()=>{window.T=await import('./vendor/three.module.js');const x=g.xr;Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>true,requestSession:async(mode)=>{window.requested=mode;window.session=new EventTarget();session.inputSources=[];session.visibilityState='visible';session.end=async()=>session.dispatchEvent(new Event('end'));return session;}}});g.renderer.xr.setSession=async()=>{};x.presentation.view='diorama-ar';await x.enter();g.camera.position.set(0,1.65,0);g.camera.quaternion.identity();x.place();}''')
   check(page.evaluate('requested')=='immersive-ar','AR requests actual AR session type')
   before=page.evaluate('({position:g.state.position,anchor:g.xr.anchor.toArray(),width:g.xr.presentation.width,progress:g.state.progress})')
   page.evaluate('__pad.axes[0]=1')
   try:page.wait_for_function('x=>g.state.position.x>x+2',arg=before['position']['x'],timeout=60000)
   finally:page.evaluate('__pad.axes[0]=0')
   wait('!input.neutral');press(9);wait('g.state.paused')
   check(True,'Synthetic Xbox moves the actual ranger with physics while in portal')
   result=page.evaluate('''()=>{const x=g.xr;x.updateStage();const p=new T.Vector3().copy(g.state.position).applyMatrix4(x.displayMatrix),local=p.clone().applyMatrix4(x.stage.matrixWorld.clone().invert());return {local:local.toArray(),height:x.size.height,anchor:x.anchor.toArray(),width:x.presentation.width,scale:x.ctx.worldRoot.scale.x,center:x.center.toArray(),position:g.state.position};}''')
   check(abs(result['local'][0])+abs(result['local'][2])+abs(result['local'][1]-result['height']/2)<1e-6,'Character stays exactly at the box center, not at a fixed map coordinate')
   check(result['anchor']==before['anchor'] and result['width']==before['width'],'Moving through game preserves accepted box size and placement')
   check(result['scale']==1,'Simulation transforms return to original game scale')
   for name,offset in [('front',[0,.5,2.3]),('side',[2.3,.5,0]),('rear',[0,.5,-2.3])]:
    r=page.evaluate('''offset=>{const x=g.xr;g.camera.position.copy(x.anchor).add(new T.Vector3(...offset));g.camera.lookAt(x.anchor.clone().add(new T.Vector3(0,x.size.height/2,0)));x.render();return {image:document.getElementById('park').toDataURL('image/png').split(',')[1],center:x.center.toArray(),calls:g.renderer.info.render.calls,masked:x.materials.size,restored:x.ctx.worldRoot.scale.x===1,active:x.portal.uniforms.dinoPortalEnabled.value};}''',offset)
    (OUT/(SCENE+'-'+name+'-mock-eye.png')).write_bytes(base64.b64decode(r.pop('image')))
    check(r['calls']>10 and r['masked']>5 and r['restored'] and r['active']==0,'Actual '+SCENE+' world renders through '+name+' without persisting presentation transforms')
   # Release and first-person must disable aperture effects on EVERY material.
   page.evaluate('session.end()');wait('!g.xr.active');check(page.evaluate('g.xr.portal.uniforms.dinoPortalEnabled.value===0&&!g.xr.stage.visible'),'Exit disables portal mask and enclosure')
   page.evaluate('''async()=>{g.xr.presentation.view='first-person-vr';await g.xr.enter();g.camera.position.set(0,1.65,0);g.camera.quaternion.identity();}''');check(page.evaluate('!g.xr.diorama&&requested==="immersive-vr"'),'First-person VR remains available in same game')
   pos=page.evaluate('g.state.position');page.evaluate('g.xr.toggleView()');check(page.evaluate('g.xr.diorama'),'Switching within VR returns to character-centered portal');check(page.evaluate('g.state.position')==pos,'Presentation switching does not move the ranger')
   page.evaluate('session.end()');wait('!g.xr.active');press(1);wait('!g.state.paused');press(15);check(page.evaluate('g.xr.ctx.fleet.mode==="foot"') and page.evaluate('g.state.tool' if SCENE=='classic' else 'g.state.progress.tool') in ['zapper',1],'Normal direct tools remain available after exit')
   check(not errors,'No captured JavaScript or shader errors')
   (OUT/(SCENE+'-report.json')).write_text(json.dumps({'build':'ranger-portal-20260917.1','scene':SCENE,'base':BASE,'passed':len(checks),'checks':checks,'framing':result,'errors':errors,'physicalHardwareVerified':False,'limits':'Actual world and movement driven by synthetic Xbox. XR sessions and monocular inspection poses explicitly mocked. No objective/actor assignments. Not physical Quest, stereo compositor, passthrough or human acceptance.'},indent=2))
  except Exception as e:
   try:page.screenshot(path=str(OUT/(SCENE+'-failure.png')),timeout=20000)
   except:pass
   (OUT/(SCENE+'-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2));raise
  finally:browser.close()
finally:
 if server:server.terminate()
