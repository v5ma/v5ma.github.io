"""Native HTTP/WebGL, real Rapier movement, synthetic Xbox, explicit XR API mocks.
The main walking tour has no teleports, forced objectives or geometry replacement.
XR fixtures replace device/session APIs only; they do not qualify physical hardware.
"""
from pathlib import Path
import base64,json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'tidegate-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
PAD="""window.__caught=[];addEventListener('error',e=>__caught.push(e.error?.stack||e.message));window.__pad={id:'Tidegate synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad],configurable:true});if(!localStorage.getItem('dino-atlas.progress.v1')){localStorage.setItem('dino-atlas.progress.v1','classic-sentinel');localStorage.setItem('dino-atlas.frontier.v2','frontier-sentinel');}"""
checks=[];errors=[];shader_errors=[];requests=[]
def check(v,name):
 assert v,name
 checks.append(name);print('PASS:',name,flush=True)
try:
 with sync_playwright() as pw:
  opts=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1100,'height':820});ctx.add_init_script(PAD);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(e.stack or str(e)))
  page.on('console',lambda m:shader_errors.append(m.text) if m.type=='error' and ('shader' in m.text.lower() or 'webgl' in m.text.lower()) else None)
  page.on('response',lambda r:requests.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
  def wait(e,t=90000):page.wait_for_function(e,timeout=t)
  def press(i):
   wait('!__tidegate.input.neutral',30000);page.evaluate('(i)=>{__pad.buttons[i]={value:1,pressed:true};}',i)
   try:page.wait_for_function('(i)=>__tidegate.input.previous[i]===true',arg=i,timeout=30000)
   finally:page.evaluate('(i)=>{__pad.buttons[i]={value:0,pressed:false};}',i)
   page.wait_for_function('(i)=>__tidegate.input.previous[i]===false&&!__tidegate.input.neutral',arg=i,timeout=30000)
  def focus(id):
   for _ in range(100):
    if page.evaluate('document.activeElement?.id')==id:return
    press(13)
   raise AssertionError('Xbox cannot reach '+id)
  def choose(id):focus(id);press(0)
  def snap(name):page.screenshot(path=str(OUT/name),timeout=45000)
  def walk(x,z):
   print('WALK:',x,z,flush=True)
   page.evaluate('''([x,z])=>{clearInterval(window.__walkTimer);window.__walkArrived=false;window.__walkTimer=setInterval(()=>{const s=__tidegate.state,p=s.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.75){__pad.axes[0]=__pad.axes[1]=0;__walkArrived=true;clearInterval(__walkTimer);return;}const c=Math.cos(s.yaw),q=Math.sin(s.yaw);__pad.axes[0]=(dx*c-dz*q)/d;__pad.axes[1]=(dx*q+dz*c)/d;},32);}''',[x,z])
   try:
    wait('__walkArrived||__caught.length',120000)
    assert not page.evaluate('__caught'),page.evaluate('__caught')
   finally:page.evaluate('clearInterval(__walkTimer);__pad.axes[0]=__pad.axes[1]=0;')
   page.wait_for_timeout(100)
  def route(points):
   for p in points:walk(*p)
  def xr_ready(source='__right'):wait('__tidegate.xr.context===__tidegate.xr.ctx.modal()&&!__tidegate.xr.gate.neutral.has('+source+')',30000)
  try:
   page.goto(BASE+'tidegate.html?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__tidegate?.state.ready',120000)
   check(page.evaluate('__tidegate.state.build')=='tidegate-20260917.2','Authored Tidegate scene boots with real HTTP and WebGL');snap('01-arrival.png')
   check(page.evaluate('__tidegate.animals.length')==4,'Four purposeful herd actors, not scattered anonymous spawns')
   press(0);wait('__tidegate.state.started');press(15);check(page.evaluate('__tidegate.progress.tool')==1,'Xbox direct zapper');press(14);check(page.evaluate('__tidegate.progress.tool')==0,'Xbox direct water')
   press(9);choose('quality');press(1);wait('!__tidegate.state.paused')
   route([[-34,43],[-25,43],[-25,15],[-48,-12],[-35,-22],[-35,-26]])
   check(page.evaluate('__tidegate.state.position.y')>6,'Real controller movement climbs the observation route');wait('__tidegate.state.candidate==="observe"');press(0);check(page.evaluate('__tidegate.progress.observed'),'In-reach A interaction records useful herd observation');snap('02-overlook.png')
   route([[-35,-30],[-35,-38],[-12,-36],[12,-36],[35,-36],[57,-36],[58,-18],[51,-18]])
   wait('__tidegate.state.candidate==="feed"');press(0);check(page.evaluate('__tidegate.progress.feeder'),'Reachable feeder changes real herd destinations')
   route([[58,-18],[58,20],[48,21],[44,10],[39,10],[30,10],[30,8]])
   check(page.evaluate('__tidegate.state.position.x<42&&__tidegate.state.position.z<16'),'Service approach reaches actual pump-house interior');wait('__tidegate.state.candidate==="repair"');press(0);check(page.evaluate('__tidegate.progress.gearbox'),'Gearbox repaired through original interaction action');snap('03-pump-house.png')
   route([[33,10],[33,19],[18,26]])
   wait('__tidegate.animals.every(a=>Math.hypot(a.x-22,a.z-24)>8+a.radius)',120000)
   wait('__tidegate.state.candidate==="bridge"');press(0);check(page.evaluate('__tidegate.progress.bridge'),'Real herd clearance enables persistent service bridge')
   route([[14,24],[0,24],[-17,24],[-28,27],[-38,31]])
   wait('__tidegate.state.candidate==="report"');press(0);check(page.evaluate('__tidegate.progress.complete&&__tidegate.progress.reportCount===1'),'Recognizable shortcut returns to starting outpost and files report once');snap('04-return-home.png');press(0);check(page.evaluate('__tidegate.progress.reportCount')==1,'Repeated report cannot duplicate completion reward')
   check(page.evaluate('localStorage.getItem("dino-atlas.progress.v1")')=='classic-sentinel' and page.evaluate('localStorage.getItem("dino-atlas.frontier.v2")')=='frontier-sentinel','Tour leaves both Classic Reserve save namespaces unchanged')
   page.evaluate('dispatchEvent(new PageTransitionEvent("pagehide"))');page.reload(wait_until='domcontentloaded');wait('window.__tidegate?.state.ready',120000);check(page.evaluate('__tidegate.progress.bridge&&__tidegate.progress.complete'),'Permanent shortcut and completed report survive reload');press(0);wait('__tidegate.state.started');press(9)
   # Explicit fake session and tracked poses, using the actual renderer/materials,
   # action handlers and raycaster. It does not render headset eye projections.
   page.evaluate('''async()=>{window.__T=await import('./vendor/three.module.js');const g=__tidegate;
    Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>true,requestSession:async mode=>{window.__requested=mode;const s=new EventTarget();s.visibilityState='visible';s.inputSources=[];s.end=async()=>s.dispatchEvent(new Event('end'));window.__session=s;return s;}}});
    g.renderer.xr.setSession=async()=>{};await g.xr.checkSupport();g.xr.presentation.view='diorama-ar';await g.xr.enter();g.camera.position.set(0,1.65,0);g.camera.quaternion.identity();g.xr.place();
    const source=handedness=>({handedness,gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({value:0,pressed:false}))}});window.__left=source('left');window.__right=source('right');__session.inputSources=[__left,__right];
    for(const [i,s] of [[0,__left],[1,__right]]){const e=g.xr.controllers[i];e.ray.visible=true;e.ray.position.set(i?.25:-.25,1.3,-.25);e.ray.updateMatrix();e.ray.dispatchEvent({type:'connected',data:s});}
    window.__rayTile=(predicate,source=__right,release=true)=>{const x=g.xr,e=x.controllers[1];x.positionPanel();x.draw(x.ctx.modal());const t=x.tiles.find(predicate);if(!t)throw Error('Tile missing');const point=new __T.Vector3(((t.x+t.w/2)/1024-.5)*1.45,(.5-(t.y+t.h/2)/1024)*1.45,0);x.panel.localToWorld(point);x.rig.worldToLocal(point);e.ray.quaternion.setFromUnitVectors(new __T.Vector3(0,0,-1),point.sub(e.ray.position).normalize());e.ray.updateMatrix();e.ray.updateWorldMatrix(true,false);if(x.hit(e)?.label!==t.label)throw Error('Mock ray missed '+t.label);e.ray.dispatchEvent({type:'selectstart',data:source});if(release)e.ray.dispatchEvent({type:'selectend',data:source});};
   }''')
   xr_ready();check(page.evaluate('__requested')=='immersive-ar','AR diorama explicitly requests immersive-ar, not silent VR fallback');check(page.evaluate('__tidegate.xr.diorama'),'Third-person miniature session active');page.wait_for_timeout(400);snap('05-ar-diorama-mock.png')
   check(page.evaluate('__tidegate.world.root.scale.x===1&&__tidegate.world.root.position.length()===0'),'Miniature transform restores original simulation scale after rendering')
   page.evaluate('''()=>{const x=__tidegate.xr;x.draw(x.ctx.modal());x.page=Math.floor(x.rows.findIndex(r=>r.element?.id==='xr-aperture')/12);x.draw(x.ctx.modal());}''');xr_ready()
   page.evaluate("__rayTile(t=>t.label?.startsWith('Diorama openings'))");check(page.evaluate('__tidegate.xr.presentation.aperture')=='top','Tracked controller ray selects top-open/front-closed presentation')
   page.evaluate("__rayTile(t=>t.label?.startsWith('Diorama openings'))");check(page.evaluate('__tidegate.xr.presentation.aperture')=='front','Tracked ray selects front-open/top-closed presentation')
   check(page.evaluate('__tidegate.xr.lid.visible&&!__tidegate.xr.frontWall.visible'),'Diorama enclosure has actual lid and open front, not just a label');page.wait_for_timeout(300);snap('06-front-open-mock.png')
   page.evaluate("__rayTile(t=>t.label?.startsWith('Diorama openings'))");check(page.evaluate('__tidegate.xr.presentation.aperture')=='both','Opening control cycles back to both open without sealed state')
   page.evaluate('''()=>{const e=__tidegate.xr.controllers[1];e.ray.dispatchEvent({type:'disconnected'});window.__hand={handedness:'right',hand:new Map()};__session.inputSources=[__left,__hand];e.ray.visible=true;e.ray.dispatchEvent({type:'connected',data:__hand});}''');xr_ready('__hand');page.evaluate("__rayTile(t=>t.label==='Back / B',__hand)");wait('!__tidegate.state.paused');xr_ready('__hand')
   page.evaluate("__rayTile(t=>t.label==='Zapper',__hand)");check(page.evaluate('__tidegate.progress.tool')==1,'Hand selection uses same direct ranger tool action')
   page.evaluate("__rayTile(t=>t.label==='Hold Forward',__hand,false)");page.wait_for_timeout(350);check(page.evaluate('__tidegate.xr.holds.size')==1,'Hand movement hold survives actual diorama-panel placement')
   page.evaluate("__tidegate.xr.controllers[1].ray.dispatchEvent({type:'selectend',data:__hand})");check(page.evaluate('__tidegate.xr.holds.size')==0,'Hand release immediately clears movement')
   page.evaluate("__session.visibilityState='hidden';__session.dispatchEvent(new Event('visibilitychange'))");wait('__tidegate.state.paused');check(page.evaluate('__tidegate.xr.holds.size')==0,'Visibility loss pauses and clears held actions');page.evaluate("__session.visibilityState='visible';__session.dispatchEvent(new Event('visibilitychange'))");page.evaluate('__session.end()');wait('!__tidegate.xr.active')
   page.evaluate('''async()=>{const x=__tidegate.xr;x.presentation.view='first-person-vr';await x.enter();__tidegate.camera.position.set(0,1.65,0);__tidegate.camera.quaternion.identity();}''');check(page.evaluate('__requested')=='immersive-vr' and not page.evaluate('__tidegate.xr.diorama'),'First-person option is retained in a separate immersive VR session')
   before=page.evaluate('__tidegate.state.position');page.evaluate('__tidegate.xr.toggleView()');page.wait_for_timeout(200);check(page.evaluate('__tidegate.xr.diorama'),'VR switches to third-person diorama without restarting game');check(page.evaluate('__tidegate.state.position')==before,'View switching does not move or rescale the physical ranger');page.evaluate('__session.end()');wait('!__tidegate.xr.active');press(1);wait('!__tidegate.state.paused')
   check(not errors,'No uncaught JavaScript errors in tour or explicit XR mock checks');check(not shader_errors,'No captured WebGL or shader compilation errors');check(not [r for r in requests if 'favicon' not in r['url']],'Game modules load without HTTP errors')
   report={'build':'tidegate-20260917.2','base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'shaderErrors':shader_errors,'httpErrors':requests,'physicalHardwareVerified':False,'limitations':'Native software WebGL and synthetic Xbox. Walking tour uses real controls and collisions, no teleport/objective fixtures. XR uses explicit fake sessions, target-ray pose matrices and hand select events, not real headset eye projections, passthrough capture or physical hardware. No human fun/wayfinding/art/comfort/performance certification.'};(OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
  except Exception as e:
   diagnostic={}
   try:diagnostic=page.evaluate('({game:window.__tidegate?.state,focus:document.activeElement?.id})');snap('failure.png')
   except:pass
   (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'shaderErrors':shader_errors,'diagnostic':diagnostic},indent=2));raise
  finally:browser.close()
finally:
 if server:server.terminate()
