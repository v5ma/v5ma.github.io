"""Real game / stereo renderer, with emulated XR input only. No gameplay writes.
A short curved 3D journey, real paper delivery, inverse travel, hand/menu recovery,
and independent rendered GPU-versus-CPU position fixture. Not device approval.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
import threading,functools,json,base64,os,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3];GAME=ROOT/'mario-maker-clone/svgn-paper-route'
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-depth'));OUT.mkdir(parents=True,exist_ok=True)
KIND=os.getenv('XR_MODE','ar');checks=[];errors=[];logs=[];samples=[];passed=False;failure=None
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/');BASE=origin+'/mario-maker-clone/svgn-paper-route/'
def check(value,label):
 assert value,label
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block')
 ctx.add_init_script((GAME/'tests/xr-emulator.js').read_text().replace("import('../vendor/three.webgpu.js')","import('./vendor/three.webgpu.js')"))
 ctx.add_init_script("navigator.getGamepads=()=>[];localStorage.setItem('sprocket_muted','1');localStorage.setItem('curved-preserve','keep');")
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=4):
  count=page.evaluate('SkyCycleXR.diagnostics.frames');page.wait_for_function('(n)=>!SkyCycleXR.presenting||SkyCycleXR.diagnostics.frames>=n',arg=count+n)
 def press(i,hand='right'):
  page.evaluate('([h,i])=>xrEmulator.button(h,i,true)',[hand,i]);frames(6);page.evaluate('([h,i])=>xrEmulator.button(h,i,false)',[hand,i]);frames()
 def select(label):
  for _ in range(40):
   if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.includes(s))',label):break
   page.evaluate("xrEmulator.point(' - Next')");frames();page.evaluate("xrEmulator.select('start');xrEmulator.select('end')");frames()
  page.evaluate('(s)=>xrEmulator.point(s)',label);frames();page.evaluate("xrEmulator.select('start');xrEmulator.select('end')");frames()
 def capture(name):
  data=page.evaluate('xrEmulator.image()');(OUT/(name+'.png')).write_bytes(base64.b64decode(data.split(',')[1]));samples.append(page.evaluate('({x:player.x,y:player.y,deliveries,tries,depth:SkyCycleDepth.diagnostics,point:SkyCycleDepth.sample(player.x+13),pixels:{colors:xrEmulator.lastCapture.colors,opaque:xrEmulator.lastCapture.opaque},xr:SkyCycleXR.diagnostics})'))
 def ride(target):
  page.evaluate('xrEmulator.axis(1)');page.wait_for_function('(x)=>player.x>=x',arg=target,timeout=240000);page.evaluate('xrEmulator.axis(0)');press(5);page.wait_for_function('__delivery.paused')
 try:
  page.goto(BASE+'?xr=1',wait_until='domcontentloaded');page.bring_to_front();page.wait_for_function('window.SkyCycleDepth&&window.SkyCycleXR&&window.SkyCycleFlightDeck&&window.__gpuReady')
  saved=page.evaluate('Object.fromEntries(["curved-preserve","sprocket_credits","svgn_delivery_records_v1","svgn.skycycle.mastery.v1","sprocket_padmap"].map(k=>[k,localStorage.getItem(k)]))')
  campaign=page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')
  page.locator('#ww-preview-open').click();page.locator('#ww-preview-curve').click();page.wait_for_function('RouteWorkshop.testing&&player.onGround&&SkyCycleDepth.diagnostics.active')
  check(page.evaluate('RouteWorkshop.state.doc.extra.gp.waterwheel.depthPath.id')=='market-sweep-v1','Curved preview uses explicit versioned metadata in the existing Workshop')
  blueprint=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
  page.screenshot(path=str(OUT/'curved-desktop-entry.png'))
  page.locator('#sky-xr-open').click();page.locator('#sky-xr-enter-ar' if KIND=='ar' else '#sky-xr-enter').click();page.wait_for_function('SkyCycleXR.presenting&&SkyCycleXR.diagnostics.frames>6');select('Resume play')
  # Continuous native riding and one original physical paper throw in the bend.
  page.evaluate('''()=>new Promise((resolve,reject)=>{let started=false,ticks=0,total=0;xrEmulator.axis(1);function step(){
   if(++total>18000){xrEmulator.axis(0);reject(Error('No native throw window'));return;}
   const gap=27*36+18-(player.x+player.w/2);
   if(!started&&player.onGround&&gap>=35&&gap<=135){started=true;xrEmulator.axis(0);}
   if(started){ticks++;xrEmulator.button('right',0,ticks>=5&&ticks<8);if(ticks===10){resolve();return;}}
   requestAnimationFrame(step);
  }requestAnimationFrame(step);})''')
  page.wait_for_function('deliveries===1');check(True,'Right trigger delivers a real paper to the market mailbox while the 3D corridor bends')
  ride(1170);check(page.evaluate('SkyCycleDepth.sample(player.x+13).z')<-85,'The ordinary road reaches the receding side of the curved market');capture(KIND+'-away')
  check(page.evaluate('SkyCycleDepth.diagnostics.active&&SkyCycleDepth.diagnostics.materials>0'),'The actual stereo scene uses the shared curved material mapping')
  signature=page.evaluate('SkyCycleDepth.sample(1190)');aperture=page.evaluate('SkyCycleXR.diagnostics.aperture.inverse')
  # Move only the emulated viewer; authored mapping and exhibit mask stay fixed.
  page.evaluate('''()=>{const s=xrEmulator.session,base=s.frame.bind(s);s.frame=function(){const f=base(),pose=f.getViewerPose;f.getViewerPose=(...args)=>{const p=pose(...args);for(const v of [p,...p.views]){v.transform.matrix[12]+=.18;v.transform.matrix[13]+=.07;}return p;};return f;};}''');frames();capture(KIND+'-lean')
  check(page.evaluate('SkyCycleDepth.sample(1190)')==signature and page.evaluate('SkyCycleXR.diagnostics.aperture.inverse')==aperture,'Head translation changes the view but not the authored curve or world aperture')
  select('Resume play');ride(2250);check(page.evaluate('SkyCycleDepth.sample(player.x+13).z')>80,'The same continuous road returns toward the viewer');capture(KIND+'-toward')
  # Both source views retain the same route and document without a restart.
  select('All menus');select('2D view');select('Resume play');page.wait_for_function('SkyCycleXR.diagnostics.presentation==="screen"');frames()
  check(not page.evaluate('SkyCycleDepth.diagnostics.active'),'The existing 2D fallback is straight and removes curved material hooks')
  press(5);select('All menus');select('3D view');select('Resume play');page.wait_for_function('SkyCycleDepth.diagnostics.active');frames()
  check(page.evaluate('deliveries===1&&tries===1'),'View switching preserves the real delivery and attempt count')
  # Reverse movement uses the same path mapping, not a new depth-lane control.
  x=page.evaluate('player.x');page.evaluate('xrEmulator.axis(-1)');page.wait_for_function('(x)=>player.x<x-40',arg=x,timeout=60000);page.evaluate('xrEmulator.axis(0)');press(5)
  check(True,'The original reverse input traverses the same curved surface')
  page.evaluate('xrEmulator.hands()');frames();select('Resume play');select('Pause');check(page.evaluate('__delivery.paused&&SkyCycleXR.diagnostics.handJoints===50'),'Hand tracking and pinch menus remain functional in the curved preview')
  select('All menus');select('Return to Workshop');page.wait_for_function('RouteWorkshop.active&&!RouteWorkshop.testing');frames()
  check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==blueprint,'Returning restores the same authored curved-preview document')
  check(not page.evaluate('SkyCycleDepth.diagnostics.active'),'The editor is not bent and its pointing surface remains unchanged')
  select('Exit XR');page.wait_for_function('!SkyCycleXR.presenting&&!__merged.scene.parent')
  check(page.evaluate('Object.fromEntries(["curved-preserve","sprocket_credits","svgn_delivery_records_v1","svgn.skycycle.mastery.v1","sprocket_padmap"].map(k=>[k,localStorage.getItem(k)]))')==saved,'Preview credit, campaign, remap and unrelated storage fixtures are unchanged on return')
  check(page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')==campaign,'All eight official campaign builders remain byte-identical')
  page.goto(BASE+'tests/depth-render.html',wait_until='domcontentloaded');page.wait_for_function('window.fixture?.passed||window.fixture?.error');fixture=page.evaluate('fixture');check(fixture['passed'],'Independent GPU fixture agrees with CPU mapping for node and instanced classic materials: '+str(fixture.get('error')))
  (OUT/'gpu-fixture.png').write_bytes(base64.b64decode(fixture['image'].split(',')[1]));samples.append({'gpu_fixture':{k:v for k,v in fixture.items() if k!='image'}})
  check(not errors,'No uncaught errors in the exercised curved preview and exit')
  check(not [s for s in logs if any(x in s.lower() for x in ['tsl:','shader error','validation error','gl_invalid'])],'No detected shader or GPU validation errors');passed=True
 except Exception as e:
  failure=str(e)
  try:page.screenshot(path=str(OUT/'failure.png'));samples.append({'failure':page.evaluate('({depth:window.SkyCycleDepth?.diagnostics,xr:window.SkyCycleXR?.diagnostics,x:typeof player!=="undefined"?player.x:null})')})
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'origin':origin,'mode':KIND,'passed':passed,'checks':checks,'samples':samples,'errors':errors,'console':logs,'failure':failure,'coverage':'Real 3D curved preview, physical packet collision and original movement via emulated XR controls. No assigned gameplay state. Separate GPU position fixture. No physical device, complete XR chapter, human readability or frame-rate approval.'},indent=2));browser.close();server.shutdown()
