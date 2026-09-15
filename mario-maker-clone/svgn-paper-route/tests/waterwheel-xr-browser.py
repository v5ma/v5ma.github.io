"""Real game + deterministic XR hardware emulation. Never mutates player/win/score."""
from pathlib import Path
import os,json,subprocess,threading,functools,base64
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.environ.get('ARTIFACT_DIR','/tmp/sky-cycle-portals'));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/')+'/';BASE=origin+'mario-maker-clone/svgn-paper-route/'
checks=[];errors=[];logs=[];passed=False;diagnostics={};failure=None
def check(value,label):
 assert value,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':800,'height':600})
 ctx.add_init_script((Path(__file__).with_name('xr-emulator.js')).read_text().replace("import('../vendor/three.webgpu.js')","import('./vendor/three.webgpu.js')"))
 ctx.add_init_script("localStorage.setItem('sprocket_muted','1');if(!localStorage.getItem('portal-legacy-sentinel'))localStorage.setItem('portal-legacy-sentinel','preserved');")
 ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith((origin,'blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=4):
  start=page.evaluate('SkyCycleXR.diagnostics.frames');page.wait_for_function('(s)=>SkyCycleXR.diagnostics.frames>=s',arg=start+n)
 def choose(label,ending=False):
  for _ in range(20):
   if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.toLowerCase().includes(s.toLowerCase()))',label):break
   point('Next');page.evaluate("xrEmulator.select('start')");page.evaluate("xrEmulator.select('end')");frames(3)
  point(label);page.evaluate("xrEmulator.select('start')");page.evaluate("xrEmulator.select('end')")
  if ending:page.wait_for_function('!SkyCycleXR.presenting')
  else:frames(4)
 def point(label):
  page.evaluate('(s)=>xrEmulator.point(s)',label);frames(3)
 def press(index,hand='right'):
  frames();page.evaluate('([h,i])=>xrEmulator.button(h,i,true)',[hand,index]);frames();page.evaluate('([h,i])=>xrEmulator.button(h,i,false)',[hand,index]);frames()
 def capture(name):
  image=page.evaluate('xrEmulator.image()');(OUT/(name+'.png')).write_bytes(base64.b64decode(image.split(',',1)[1]))
 try:
  page.goto(BASE+'?xr=1',wait_until='domcontentloaded');page.bring_to_front();page.wait_for_function('window.SkyCycleXR && window.SkyCycleWaterwheel && window.__gpuReady && window.PaperDeliveryCampaign?.status==="ready"')
  records=page.evaluate('JSON.stringify(SkyCycleFlightDeck.records)')
  page.locator('#ww-preview-open').click();page.locator('#ww-preview-ride').click();page.wait_for_function('RouteWorkshop.testing && player.onGround && __cloudview?.root?.userData.waterwheelPreview')
  page.locator('#sky-xr-open').click();page.locator('#sky-xr-enter').click();page.wait_for_function('SkyCycleXR.presenting && SkyCycleXR.diagnostics.frames>5')
  check(page.evaluate('SkyCycleXR.diagnostics.eyes===2 && SkyCycleXR.diagnostics.ownedScene && __cloudview.root.userData.waterwheelPreview.revision===2'),'Both stereo eyes render the actual Waterwheel preview scene')
  capture('waterwheel-xr-controller')
  contrast=page.evaluate("""async()=>{const T=await import('./vendor/three.webgpu.js');const d=SkyCycleXR.diagnostics;const rows=d.buttons.filter(b=>['Back to the route','Choose a route','Portal atlas','Flight Deck','Sound & music','Controller guide'].includes(b.label));const img=new Image();img.src=await xrEmulator.image();await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const cx=c.getContext('2d');cx.drawImage(img,0,0);const samples=[];const eyes=__merged.renderer.xr.getCamera().cameras;for(let eye=0;eye<2;eye++)for(const b of rows)for(const t of [.7,.85]){const x=b.x+b.w*t,y=b.y+b.h-12;const v=new T.Vector3((x/1200-.5)*1.5,(.5-y/900)*1.125,0).applyMatrix4(new T.Matrix4().fromArray(d.uiMatrix)).project(eyes[eye]);const px=Math.round(eye*550+(v.x+1)*275),py=Math.round((1-v.y)*400);if(px<eye*550||px>=(eye+1)*550||py<0||py>=800)throw Error('Menu sample outside eye viewport');const rgb=[...cx.getImageData(px,py,1,1).data].slice(0,3);samples.push({eye,label:b.label,px,py,rgb});}return samples;}""")
  diagnostics['menu_pixels']=contrast
  check(len(contrast)==24 and all(max(abs(v-e) for v,e in zip(s['rgb'],[35,66,92]))<=18 for s in contrast),'Both eye views retain opaque readable button backgrounds instead of scenery bleed-through')
  choose('Back to the route');page.wait_for_function('!__delivery.paused');frames()
  x=page.evaluate('player.x');page.evaluate('xrEmulator.axis(.8)');page.wait_for_function('(x)=>player.x>x+100',arg=x);page.evaluate('xrEmulator.axis(0)');frames()
  check(page.evaluate('RouteWorkshop.testing && __delivery.state.route===-1'),'Tracked controller rides while the existing Workshop retains award isolation')
  press(5);page.wait_for_function('__delivery.paused');page.evaluate('xrEmulator.hands()');frames()
  check(page.evaluate('SkyCycleXR.diagnostics.handJoints===50'),'Waterwheel retains two tracked hands in the native XR UI')
  choose('Sound & music');choose('Effect intensity: soft plus');check(page.evaluate('SkyCycleSensory.settings.transients==="full"'),'Hand-selected comfort settings still operate during a Waterwheel preview')
  choose('Back');choose('Back to the route');page.wait_for_function('!__delivery.paused');frames()
  x=page.evaluate('player.x');point('Ride right');page.evaluate("xrEmulator.select('start')");page.wait_for_function('(x)=>player.x>x+80',arg=x);page.evaluate("xrEmulator.select('end')");frames()
  point('Jump');page.evaluate("xrEmulator.select('start')");page.wait_for_function('!player.onGround');page.evaluate("xrEmulator.select('end')");frames();capture('waterwheel-xr-hand-jump')
  check(True,'Hand selection drives real Waterwheel movement and jumping without changing physics state directly')
  choose('Pause');page.wait_for_function('__delivery.paused');capture('waterwheel-xr-hand-pause')
  choose('Exit XR',ending=True);page.wait_for_function('!SkyCycleXR.presenting && !__merged.scene.parent')
  check(page.evaluate('__delivery.paused && !keys.ArrowRight && !keys.Space'),'Hand-operated XR exit restores the safely paused original game and clears held input')
  check(page.evaluate('JSON.stringify(SkyCycleFlightDeck.records)')==records,'Partial XR preview awards no campaign career progress')
  page.locator('#maker-return').click();page.wait_for_function('RouteWorkshop.active && !RouteWorkshop.testing')
  check(page.evaluate('RouteWorkshop.state.doc.extra.gp.waterwheel.revision===2'),'XR preview returns to its unchanged editable blueprint')
  page.screenshot(path=str(OUT/'waterwheel-editor-after-xr.png'))
  check(not errors,'No uncaught exceptions in the Waterwheel tracked-input flow')
  shader=[x for x in logs if any(v in x.lower() for v in ['tsl:','shader error','validation error','gl_invalid'])];check(not shader,'No detected shader errors in the Waterwheel stereo target')
  diagnostics['final']=page.evaluate('SkyCycleXR.diagnostics');passed=True
 except Exception as exc:
  failure=str(exc)
  try:page.screenshot(path=str(OUT/'failure.png'));diagnostics['failure_state']=page.evaluate('({xr:window.SkyCycleXR?.diagnostics,route:window.__delivery?.state.route,testing:window.RouteWorkshop?.testing,capture:window.xrEmulator?.lastCapture})')
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'passed':passed,'failure':failure,'checks':checks,'errors':errors,'console':logs,'diagnostics':diagnostics,'coverage':'Real Waterwheel game scene and Three XRManager with deterministic controller/hand hardware emulation. Ordinary movement and actual nonblank stereo captures; not a full XR chapter finish or physical Quest qualification.'},indent=2));ctx.close();browser.close();server.shutdown()
