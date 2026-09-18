"""Real game with emulated XR tracking, hidden document, held grips and moving head.
No rider, inventory, progression, score or win assignments. Not physical hardware.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
import threading,functools,json,base64,os,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3];GAME=ROOT/'mario-maker-clone/svgn-paper-route'
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-recovery'));OUT.mkdir(parents=True,exist_ok=True)
KIND=os.getenv('XR_MODE','ar');checks=[];errors=[];logs=[];passed=False;failure=None;samples=[]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/')
def check(value,message):
 assert value,message
 checks.append(message);print('PASS',message,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block')
 ctx.add_init_script((GAME/'tests/xr-emulator.js').read_text().replace("import('../vendor/three.webgpu.js')","import('./vendor/three.webgpu.js')"))
 ctx.add_init_script("navigator.getGamepads=()=>[];window.fixturePageHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>fixturePageHidden});localStorage.setItem('xr-recovery-sentinel','preserve');")
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=4):
  count=page.evaluate('SkyCycleXR.diagnostics.frames');page.wait_for_function('(n)=>!SkyCycleXR.presenting||SkyCycleXR.diagnostics.frames>=n',arg=count+n)
 def press(index,hand='right'):
  page.evaluate('([h,i])=>xrEmulator.button(h,i,true)',[hand,index]);frames(8);page.evaluate('([h,i])=>xrEmulator.button(h,i,false)',[hand,index]);frames()
 def point(label):page.evaluate('(s)=>xrEmulator.point(s)',label);frames(2)
 def select(label):
  for _ in range(40):
   if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.includes(s))',label):break
   point(' - Next');page.evaluate("xrEmulator.select('start');xrEmulator.select('end')");frames()
  point(label)
  page.evaluate("if(xrEmulator.session.inputSources.find(s=>s.handedness==='right').gamepad)xrEmulator.button('right',0,true);xrEmulator.select('start')");frames()
  page.evaluate("if(xrEmulator.session.inputSources.find(s=>s.handedness==='right').gamepad)xrEmulator.button('right',0,false);xrEmulator.select('end')");frames()
 def capture(name):
  image=page.evaluate('xrEmulator.image()');(OUT/(name+'.png')).write_bytes(base64.b64decode(image.split(',')[1]));samples.append({'name':name,'xr':page.evaluate('SkyCycleXR.diagnostics'),'pixels':page.evaluate('({opaque:xrEmulator.lastCapture.opaque,colors:xrEmulator.lastCapture.colors})')})
 try:
  page.goto(origin+'/mario-maker-clone/svgn-paper-route/?xr=1&destination=tideglass-baths',wait_until='domcontentloaded')
  page.wait_for_function('window.SkyCycleXR&&window.SkyCycleFlightDeck&&window.__gpuReady&&player.onGround')
  protected=page.evaluate('JSON.stringify({records:SkyCycleFlightDeck.records,ids:DeliveryCampaign.routes.map(r=>r.id),sentinel:localStorage.getItem("xr-recovery-sentinel")})')
  page.locator('#sky-xr-open').click();page.locator('#sky-xr-enter-ar' if KIND=='ar' else '#sky-xr-enter').click();page.wait_for_function('SkyCycleXR.presenting&&SkyCycleXR.diagnostics.frames>5')
  page.evaluate("fixturePageHidden=true;document.hasFocus=()=>false;xrEmulator.button('left',1,true);xrEmulator.button('right',1,true);xrEmulator.visibility('visible-blurred');xrEmulator.visibility('visible')");frames()
  check(page.evaluate('document.hidden&&SkyCycleXR.inputVisible'),'A visible immersive session is independent of HTML visibility and focus')
  press(5);check(page.evaluate('!__delivery.paused&&!SkyCycleFlightDeck.topPanel()'),'Held B closes the initial menu once while both grips stay held')
  frames(12);check(page.evaluate('!__delivery.paused&&!SkyCycleXR.diagnostics.uiVisible'),'Controller riding has no persistent menu plane and does not reopen the menu')
  press(5);check(page.evaluate('__delivery.paused&&SkyCycleFlightDeck.topPanel().id==="delivery-pause"'),'B can reopen pause even while grip neutral gating is active')
  for hand in ['left','right']:
   before=page.evaluate('document.activeElement?.outerHTML')
   page.evaluate('(h)=>{xrEmulator.session.inputSources.find(s=>s.handedness===h).gamepad.axes[3]=.8}',hand);frames(8)
   page.evaluate('(h)=>{xrEmulator.session.inputSources.find(s=>s.handedness===h).gamepad.axes[3]=0}',hand);frames()
   check(page.evaluate('document.activeElement?.outerHTML')!=before,hand+' stick moves menu focus without releasing either grip')
  select('Sound & music');check(page.evaluate('document.getElementById("score-dialog").open'),'A real depressed trigger and select event open the pointed sound menu')
  capture(KIND+'-controller-menu')
  press(5);check(page.evaluate('!document.getElementById("score-dialog").open&&__delivery.paused'),'Held B closes only the nested sound menu, without cascading')
  select('Resume play');check(page.evaluate('!__delivery.paused'),'Direct Resume play dismisses menus without an approval or mode change')
  page.evaluate("xrEmulator.button('left',1,false);xrEmulator.button('right',1,false)");frames()
  x=page.evaluate('player.x');page.evaluate('xrEmulator.axis(.8)');page.wait_for_function('(x)=>player.x>x+50',arg=x);page.evaluate('xrEmulator.axis(0)');frames()
  check(True,'Ordinary riding advances while the HTML page is hidden')
  page.evaluate('''async()=>{window.XR_T=await import('./vendor/three.webgpu.js');window.headPose={x:0,y:1.6,z:0,yaw:0,pitch:0};const s=xrEmulator.session,original=s.frame.bind(s);s.frame=function(){const f=original();f.getViewerPose=()=>{const T=XR_T,h=headPose,q=new T.Quaternion().setFromEuler(new T.Euler(h.pitch,h.yaw,0,'YXZ')),m=new T.Matrix4().compose(new T.Vector3(h.x,h.y,h.z),q,new T.Vector3(1,1,1));const tr=m=>({matrix:new Float32Array(m.elements),position:{x:m.elements[12],y:m.elements[13],z:m.elements[14],w:1},orientation:{x:q.x,y:q.y,z:q.z,w:q.w}});return {transform:tr(m),views:['left','right'].map((eye,i)=>({eye,transform:tr(m.clone().multiply(new T.Matrix4().makeTranslation(i?.032:-.032,0,0))),projectionMatrix:new Float32Array(new T.PerspectiveCamera(65,550/800,.05,30).projectionMatrix.elements)})),emulatedPosition:false};};return f;};}''')
  inverse=page.evaluate('SkyCycleXR.diagnostics.aperture.inverse')
  for name,pose in [('neutral',{}),('look-up',{'pitch':.3}),('lean-left',{'x':-.3,'z':-.12,'pitch':0,'yaw':.15}),('lean-right',{'x':.3,'y':1.8,'z':.1,'pitch':-.1,'yaw':-.15})]:
   page.evaluate('(v)=>Object.assign(headPose,v)',pose);frames();capture(KIND+'-'+name)
   check(page.evaluate('!SkyCycleXR.diagnostics.uiVisible&&!SkyCycleXR.diagnostics.screenVisible'),'No menu or fallback screen slab during '+name)
   check(page.evaluate('SkyCycleXR.diagnostics.aperture.inverse')==inverse,'Head movement does not move the aperture during '+name)
  if KIND=='ar':check(page.evaluate('SkyCycleXR.diagnostics.aperture.active&&SkyCycleXR.diagnostics.aperture.materials>0&&xrEmulator.lastCapture.opaque<880000'),'AR uses a world-space fragment mask with transparent exterior')
  page.evaluate('xrEmulator.visibility("visible-blurred")');frames();press(5)
  check(page.evaluate('__delivery.paused&&!SkyCycleXR.inputVisible'),'System-owned blurred session blocks all gameplay and recovery input')
  page.evaluate('xrEmulator.visibility("visible")');frames();press(5);check(page.evaluate('!__delivery.paused'),'B recovers after system UI closes')
  page.evaluate('xrEmulator.hands()');frames();select('Resume play')
  check(page.evaluate('SkyCycleXR.diagnostics.uiVisible&&SkyCycleXR.diagnostics.handJoints===50'),'Switching to hands exposes the reachable hand action bar')
  select('Pause');check(page.evaluate('__delivery.paused'),'Hand pinch still opens pause');capture(KIND+'-hand-menu')
  page.evaluate('xrEmulator.controllers()');frames();press(5);press(5);select('Spatial setup')
  point('Exit XR');press(4);page.wait_for_function('!SkyCycleXR.presenting&&!__merged.scene.parent')
  check(page.evaluate('!__merged.renderer.xr.enabled'),'Controller A exits XR through the focused menu button')
  check(page.evaluate('JSON.stringify({records:SkyCycleFlightDeck.records,ids:DeliveryCampaign.routes.map(r=>r.id),sentinel:localStorage.getItem("xr-recovery-sentinel")})')==protected,'Campaign IDs, progress and unrelated saved data remain unchanged')
  check(not errors,'No uncaught errors in the headset-state regression')
  check(not [x for x in logs if any(t in x.lower() for t in ['shader error','tsl:','validation error','gl_invalid'])],'No detected shader/GPU validation errors')
  passed=True
 except Exception as exc:
  failure=str(exc)
  try:page.screenshot(path=str(OUT/'failure.png'));samples.append({'failure_state':page.evaluate('SkyCycleXR.diagnostics')})
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'origin':origin,'mode':KIND,'passed':passed,'failure':failure,'checks':checks,'errors':errors,'console':logs,'samples':samples,'coverage':'Actual game/renderer with emulated XR poses, input sources, document visibility and standard button states. No physical headset, passthrough camera, controller ergonomics or frame-rate qualification.'},indent=2));browser.close();server.shutdown()
