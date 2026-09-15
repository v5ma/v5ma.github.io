"""Native software-WebGL regression with synthetic Xbox and explicit XR API mocks.
XR mocks exercise production lifecycle, action routing and ray UI, not stereo or hardware.
"""
from pathlib import Path
import base64,json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'dino-atlas/verification/grounded-xr';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
PAD="""window.__pad={id:'Grounded synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad],configurable:true});localStorage.setItem('dino-atlas.progress.v1','legacy-sentinel');localStorage.setItem('dino-atlas.frontier.v2',JSON.stringify({version:2,settings:{low:true}}));"""
checks=[];errors=[]
def check(v,name):
 assert v,name
 checks.append(name);print('PASS:',name,flush=True)
try:
 with sync_playwright() as pw:
  options=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**options);context=browser.new_context(viewport={'width':1100,'height':820});context.add_init_script(PAD);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def wait(expr,t=90000):page.wait_for_function(expr,timeout=t)
  def press(i):
   wait('!__dinoRanger.xr.ctx.input.neutral',30000)
   page.evaluate('(i)=>{__pad.buttons[i]={value:1,pressed:true};}',i)
   try:page.wait_for_function('(i)=>__dinoRanger.xr.ctx.input.previous[i]===true',arg=i,timeout=30000)
   finally:page.evaluate('(i)=>{__pad.buttons[i]={value:0,pressed:false};}',i)
   page.wait_for_function('(i)=>__dinoRanger.xr.ctx.input.previous[i]===false&&!__dinoRanger.xr.ctx.input.neutral',arg=i,timeout=30000)
  def choose(id):
   for _ in range(95):
    if page.evaluate('document.activeElement?.id')==id:press(0);return
    press(13)
   raise AssertionError('Xbox focus cannot reach '+id)
  def snap(name):page.screenshot(path=str(OUT/name),timeout=45000)
  def xr_ready(source='__right'):
   wait('__dinoRanger.xr.context===__dinoRanger.xr.ctx.modal()&&!__dinoRanger.xr.gate.neutral.has('+source+')',30000)
  try:
   page.goto(BASE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__dinoGrounded&&__dinoRanger.state.ready',120000)
   check(page.evaluate('__dinoGrounded.state.build')=='grounded-xr-20260914.1','Grounded build boots over HTTP and real WebGL')
   check(page.evaluate('__dinoRanger.animals.length')==64,'All 64 residents retained');snap('01-grounded-intro.png');press(0);wait('__dinoRanger.state.started')
   if page.locator('dialog[open]').count():press(1)
   wait('!__dinoRanger.state.paused');press(15);check(page.evaluate('__dinoRanger.state.tool')=='zapper','Xbox D-pad right selects zapper immediately');press(14);check(page.evaluate('__dinoRanger.state.tool')=='water','Xbox D-pad left selects water immediately')
   press(5);check(page.evaluate('__dinoRanger.state.tool')=='zapper','Xbox RB retains tool cycle');press(9);wait('__dinoRanger.state.paused');choose('quick-tools-toggle');check(not page.evaluate('__dinoGrounded.state.quickTools'),'Xbox toggles legacy D-pad preset');press(1);wait('!__dinoRanger.state.paused');press(15);check(page.evaluate('__dinoRanger.state.tool')=='water','Legacy D-pad cycle wraps from zapper to water');press(14);check(page.evaluate('__dinoRanger.state.tool')=='zapper','Legacy D-pad left cycles back to zapper')
   press(9);choose('quick-tools-toggle');press(1);wait('!__dinoRanger.state.paused');press(14)
   press(3);wait('__dinoRanger.state.mode==="foot"');check(page.evaluate('__dinoRanger.personModel.userData.bodyRig.limbs.length')==2,'Rendered ranger has articulated boots and adult-like proportions');snap('02-grounded-ranger.png')
   before=page.evaluate('__dinoRanger.state.position');page.evaluate('__pad.axes[1]=-1');page.wait_for_timeout(1400);page.evaluate('__pad.axes[1]=0');after=page.evaluate('__dinoRanger.state.position');check(abs(after['z']-before['z'])+abs(after['x']-before['x'])>.2,'Xbox walking drives actual character physics')
   press(9);wait('__dinoRanger.state.paused');check(page.evaluate('localStorage.getItem("dino-atlas.progress.v1")')=='legacy-sentinel','New controls leave old save sentinel unchanged')
   page.evaluate("Object.defineProperty(navigator,'xr',{value:{isSessionSupported:async()=>true,requestSession:async()=>{throw new Error('test rejection')}},configurable:true})")
   page.evaluate('async()=>{await __dinoRanger.xr.checkSupport();await __dinoRanger.xr.enter();}')
   check(not page.evaluate('__dinoGrounded.state.active'),'Rejected XR request leaves desktop active')
   # Explicit lifecycle/pose mock: no hardware, stereo projection, latency or hand pose claim.
   page.evaluate("""async()=>{
    window.__THREE=await import('./vendor/three.module.js');const g=__dinoRanger,x=g.xr;
    const make=handedness=>({handedness,gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({value:0,pressed:false}))}});
    window.__left=make('left');window.__right=make('right');window.__session=new EventTarget();__session.inputSources=[__left,__right];__session.visibilityState='visible';__session.end=async()=>__session.dispatchEvent(new Event('end'));
    navigator.xr.requestSession=async()=>__session;g.renderer.xr.setSession=async()=>{};g.renderer.xr.getCamera=()=>g.camera;
    await x.enter();g.camera.position.set(0,1.65,0);g.camera.quaternion.identity();
    for(const [i,s] of [[0,__left],[1,__right]]){const e=x.controllers[i];e.ray.visible=true;e.ray.position.set(i? .25:-.25,1.3,-.25);e.ray.updateMatrix();e.ray.dispatchEvent({type:'connected',data:s});}
   }""")
   wait('__dinoGrounded.state.active&&__dinoGrounded.state.controllers===2');xr_ready()
   check(True,'Production XR lifecycle accepts two mocked tracked controllers')
   # WebXR target-ray groups have matrixAutoUpdate=false. Supply a mock pose matrix explicitly.
   page.evaluate("""()=>{window.__rayTile=(predicate,source=__right,release=true)=>{
    const T=__THREE,x=__dinoRanger.xr,e=x.controllers[1];x.draw(x.ctx.modal());const t=x.tiles.find(predicate);if(!t)throw Error('XR tile not found');
    const point=new T.Vector3(((t.x+t.w/2)/1024-.5)*1.45,(.5-(t.y+t.h/2)/1024)*1.45,0);x.panel.localToWorld(point);x.rig.worldToLocal(point);e.ray.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),point.sub(e.ray.position).normalize());e.ray.updateMatrix();e.ray.updateWorldMatrix(true,false);
    if(x.hit(e)?.label!==t.label)throw Error('Mock target-ray pose missed '+t.label);
    e.ray.dispatchEvent({type:'selectstart',data:source});if(release)e.ray.dispatchEvent({type:'selectend',data:source});
   };}""")
   page.evaluate("""()=>{const x=__dinoRanger.xr;x.draw(x.ctx.modal());const i=x.rows.findIndex(r=>r.element?.id==='quick-tools-toggle');x.page=Math.floor(i/12);x.draw(x.ctx.modal());}""")
   xr_ready();page.evaluate("__rayTile(t=>t.label?.includes('Direct D-pad tools'))")
   check(not page.evaluate('__dinoGrounded.state.quickTools'),'Tracked ray trigger changes mirrored production checkbox')
   page.evaluate("__right.gamepad.buttons[5].value=1");wait('__dinoRanger.xr.gate.states.get(__right)?.[5]===true',30000);page.evaluate("__right.gamepad.buttons[5].value=0");wait('!__dinoRanger.state.paused');xr_ready()
   check(True,'Quest right B closes real menu without mouse')
   page.evaluate("""()=>{const x=__dinoRanger.xr,e=x.controllers[1];e.ray.dispatchEvent({type:'disconnected'});window.__hand={handedness:'right',hand:new Map()};__session.inputSources=[__left,__hand];e.ray.visible=true;e.ray.dispatchEvent({type:'connected',data:__hand});}""")
   wait('__dinoRanger.state.paused');xr_ready('__hand')
   check(page.evaluate('__dinoGrounded.state.hands')==1,'Switching tracked controller to mocked hand is recognized and pauses')
   page.evaluate("__rayTile(t=>t.label==='Back / B',__hand)");wait('!__dinoRanger.state.paused');xr_ready('__hand')
   page.evaluate("__rayTile(t=>t.label==='Zapper',__hand)");check(page.evaluate('__dinoRanger.state.tool')=='zapper','Hand select event uses same direct tool action')
   page.evaluate("__rayTile(t=>t.label==='Hold Forward',__hand,false)");page.wait_for_timeout(400);check(page.evaluate('__dinoGrounded.state.held')==1,'Hand hold-to-move remains active while pointing at tile')
   page.evaluate("__dinoRanger.xr.controllers[1].ray.dispatchEvent({type:'selectend',data:__hand})");page.wait_for_timeout(100);check(page.evaluate('__dinoGrounded.state.held')==0,'Hand release clears locomotion immediately')
   page.evaluate("__rayTile(t=>t.label==='Hold Fire',__hand,false)");page.wait_for_timeout(200);page.evaluate("__session.visibilityState='hidden';__session.dispatchEvent(new Event('visibilitychange'))");page.wait_for_timeout(200);check(page.evaluate('__dinoGrounded.state.held')==0 and page.evaluate('__dinoRanger.state.paused'),'Visibility loss clears fire and pauses')
   page.evaluate("__session.visibilityState='visible';__session.dispatchEvent(new Event('visibilitychange'))");xr_ready('__hand');snap('03-xr-menu-mock.png')
   (OUT/'03-xr-panel-texture.png').write_bytes(base64.b64decode(page.evaluate("__dinoRanger.xr.canvas.toDataURL('image/png').split(',')[1]")))
   page.evaluate('__session.end()');page.wait_for_timeout(400);check(not page.evaluate('__dinoGrounded.state.active'),'XR end returns to desktop with one animation loop');press(1);wait('!__dinoRanger.state.paused')
   check(not errors,'No uncaught runtime errors in rendered or mocked-XR checks');snap('04-return-to-desktop.png')
   report={'build':'grounded-xr-20260914.1','passed':len(checks),'checks':checks,'errors':errors,'limitations':'Software WebGL; synthetic Xbox; explicit XR lifecycle, target-ray pose matrices and hand select mocks. No physical Quest/Xbox, stereo projection, room-scale collision, performance or human art certification.'};(OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
  except Exception as exc:
   try:snap('failure.png')
   except:pass
   (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors},indent=2));raise
  finally:browser.close()
finally:
 if server:server.terminate()
