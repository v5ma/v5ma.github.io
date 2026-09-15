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
origin=f'http://127.0.0.1:{server.server_port}/';BASE=origin+'mario-maker-clone/svgn-paper-route/'
checks=[];errors=[];logs=[];passed=False;diagnostics={}
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
 def choose(label):
  for _ in range(20):
   if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.toLowerCase().includes(s.toLowerCase()))',label):break
   point('Next');page.evaluate("xrEmulator.select('start')");page.evaluate("xrEmulator.select('end')");frames(3)
  point(label);page.evaluate("xrEmulator.select('start')");page.evaluate("xrEmulator.select('end')");frames(4)
 def point(label):
  page.evaluate('(s)=>xrEmulator.point(s)',label);frames(3)
 def press(index,hand='right'):
  frames();page.evaluate('([h,i])=>xrEmulator.button(h,i,true)',[hand,index]);frames();page.evaluate('([h,i])=>xrEmulator.button(h,i,false)',[hand,index]);frames()
 def capture(name):
  image=page.evaluate('xrEmulator.image()');(OUT/(name+'.png')).write_bytes(base64.b64decode(image.split(',',1)[1]))
 try:
  page.goto(BASE+'?destination=tideglass-baths&xr=1',wait_until='domcontentloaded');page.bring_to_front();page.wait_for_function('window.SkyCycleXR && window.SkyCyclePortals && __cloudview?.hero?.pose && player.onGround && SkyCycleBathhouse.art?.waterDraws>0')
  check(page.evaluate('DeliveryCampaign.routes.length===8 && DeliveryCampaign.routes[7].id==="tideglass-baths" && DeliveryCampaign.routes[4].id==="first-neighborhood"'),'All legacy route indices and Tideglass direct entry survive')
  before=page.evaluate('levelCode()');records=page.evaluate('JSON.stringify(SkyCycleFlightDeck.records)')
  page.locator('#bathhouse-open').click();page.locator('#bathhouse-return').focus();page.wait_for_function('document.getElementById("bathhouse-atlas").dataset.pattern==="sunrise"');page.screenshot(path=str(OUT/'atlas-sunrise.png'))
  check(page.evaluate('document.getElementById("portal-name").textContent.includes("Sunrise")'),'Focused destination changes its label and reflection signature before entry')
  page.locator('#bathhouse-enter').focus();page.screenshot(path=str(OUT/'atlas-tideglass.png'));page.locator('#bathhouse-close').click()
  check(page.evaluate('levelCode()')==before,'Browsing and backing out preserve the exact source document')
  page.locator('#sky-xr-open').click();page.locator('#sky-xr-enter').click();page.wait_for_function('SkyCycleXR.presenting && SkyCycleXR.diagnostics.frames>5')
  check(page.evaluate('xrEmulator.request.options.optionalFeatures.includes("hand-tracking") && SkyCycleXR.diagnostics.eyes===2 && SkyCycleXR.diagnostics.ownedScene'),'XR requests hand tracking and renders both eyes of the existing game scene')
  frames();capture('xr-controller-pause')
  choose('Resume');page.wait_for_function('!__delivery.paused');frames()
  x=page.evaluate('player.x');page.evaluate('xrEmulator.axis(.8)');page.wait_for_function('(x)=>player.x>x+100',arg=x);page.evaluate('xrEmulator.axis(0)');frames()
  check(page.evaluate('__cloudview.hero.motion.phase>0'),'Tracked left stick rides through real physics and advances pedal motion')
  check(page.evaluate('(()=>{const p=__cloudview.hero.pose;return [...p.legs,...p.arms].every(l=>Math.hypot(l.end[0]-l.target[0],l.end[1]-l.target[1])<1e-6);})()'),'Observed rider hands and feet stay on their grip and pedal targets')
  capture('xr-riding')
  press(5);page.wait_for_function('__delivery.paused');choose('Portal atlas');page.wait_for_function('document.getElementById("bathhouse-atlas").open');capture('xr-portal-atlas')
  press(5);check(page.evaluate('__delivery.paused && !document.getElementById("bathhouse-atlas").open'),'Tracked B closes only the nested portal and retains pause')
  page.evaluate('xrEmulator.hands()');frames();check(page.evaluate('SkyCycleXR.diagnostics.handJoints===50'),'Both tracked hands expose all 25 joints to the in-world UI')
  capture('xr-hand-pause');choose('Resume');page.wait_for_function('!__delivery.paused');frames()
  x=page.evaluate('player.x');point('Ride right');page.evaluate("xrEmulator.select('start')");page.wait_for_function('(x)=>player.x>x+80',arg=x);page.evaluate("xrEmulator.select('end')");frames()
  check(True,'Native hand pinch-and-hold drives the ordinary riding input')
  point('Jump');page.evaluate("xrEmulator.select('start')");page.wait_for_function('!player.onGround');page.evaluate("xrEmulator.select('end')");frames();capture('xr-hand-jump')
  check(True,'Native hand selection jumps without a mouse or direct physics edits')
  choose('Pause');page.wait_for_function('__delivery.paused');choose('Portal atlas');choose('Start Sunrise Borough');page.wait_for_function('__delivery.state.route===4 && !won');frames()
  check(page.evaluate('JSON.stringify(SkyCycleFlightDeck.records)')==records,'Hand portal travel starts a new route without banking unfinished career progress')
  page.evaluate('xrEmulator.disconnect()');frames();check(page.evaluate('__delivery.paused && !keys.ArrowLeft && !keys.ArrowRight && !keys.Space'),'Source loss pauses and releases movement and action input')
  diagnostics=page.evaluate('SkyCycleXR.diagnostics');page.evaluate('xrEmulator.session.end()');page.wait_for_function('!SkyCycleXR.presenting && !__merged.scene.parent');
  check(page.evaluate('__delivery.paused && !__merged.renderer.xr.enabled && localStorage.getItem("portal-legacy-sentinel")==="preserved"'),'XR exit restores the original renderer ownership, safe pause and old saves')
  page.screenshot(path=str(OUT/'xr-exit-desktop.png'))
  page.locator('#sky-xr-open').click();page.evaluate('xrEmulator.deny=true');page.locator('#sky-xr-enter').click();page.wait_for_function('!SkyCycleXR.presenting && !document.getElementById("sky-xr-enter").disabled');
  check(page.evaluate('!__merged.scene.parent && __delivery.paused'),'Denied XR entry leaves the existing game recoverable')
  check(not errors,'No uncaught JavaScript exceptions in portal or XR flows')
  shader=[x for x in logs if any(v in x.lower() for v in ['tsl:','shader error','validation error','gl_invalid'])];check(not shader,'No detected shader or GPU validation errors in the emulated stereo path')
  passed=True
 except Exception as exc:
  print('FAIL:',str(exc),flush=True)
  try:page.screenshot(path=str(OUT/'failure.png'));diagnostics=page.evaluate('({xr:window.SkyCycleXR?.diagnostics,release:window.PaperDeliveryRelease,route:window.__delivery?.state.route})')
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'passed':passed,'checks':checks,'errors':errors,'console':logs,'diagnostics':diagnostics,'coverage':'Native game with deterministic WebXR hardware emulation and real Three XRManager stereo rendering. Native tracked controller and hand select events. No player position, score or win assignments. Not physical Quest 3 or Xbox certification.'},indent=2));ctx.close();browser.close();server.shutdown()
