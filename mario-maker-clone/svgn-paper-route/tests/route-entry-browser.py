"""Original game and stereo renderer, explicit emulated XR input. No gameplay assignments."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
import os,json,subprocess,threading,functools,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3];GAME=ROOT/'mario-maker-clone/svgn-paper-route'
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/route-entry'));OUT.mkdir(parents=True,exist_ok=True)
KIND=os.getenv('XR_MODE','ar');OTHER='vr' if KIND=='ar' else 'ar'
checks=[];errors=[];logs=[];samples=[];passed=False;failure=None
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/');BASE=origin+'/mario-maker-clone/svgn-paper-route/'
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block')
 ctx.add_init_script((GAME/'tests/xr-emulator.js').read_text().replace("import('../vendor/three.webgpu.js')","import('./vendor/three.webgpu.js')"))
 ctx.add_init_script("navigator.getGamepads=()=>[];localStorage.setItem('sprocket_muted','1');localStorage.setItem('route-entry-sentinel','preserve');")
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def wait_ready():page.wait_for_function('window.SkyCycleRouteEntry?.diagnostics.checked && window.__gpuReady && window.SkyCycleFlightDeck')
 def frames(n=4):
  c=page.evaluate('SkyCycleXR.diagnostics.frames');page.wait_for_function('(n)=>!SkyCycleXR.presenting||SkyCycleXR.diagnostics.frames>=n',arg=c+n)
 def press(i,hand='right'):
  page.evaluate('([h,i])=>xrEmulator.button(h,i,true)',[hand,i]);frames(6);page.evaluate('([h,i])=>xrEmulator.button(h,i,false)',[hand,i]);frames()
 def point(label):page.evaluate('(s)=>xrEmulator.point(s)',label);frames(2)
 def choose(label):
  for _ in range(45):
   if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.includes(s))',label):break
   point(' - Next');page.evaluate("xrEmulator.select('start');xrEmulator.select('end')");frames()
  point(label);page.evaluate("xrEmulator.select('start');xrEmulator.select('end')");frames()
 def capture(name):
  data=page.evaluate('xrEmulator.image()');(OUT/(name+'.png')).write_bytes(base64.b64decode(data.split(',')[1]));samples.append({'name':name,'xr':page.evaluate('SkyCycleXR.diagnostics')})
 def routes():
  press(5);page.wait_for_function('__delivery.paused');choose('Choose a route');page.wait_for_function('document.getElementById("delivery-menu").classList.contains("open")')
 try:
  page.goto(BASE+'?xr=1',wait_until='domcontentloaded');page.bring_to_front();wait_ready()
  protected=page.evaluate('JSON.stringify({records:SkyCycleFlightDeck.records,ids:DeliveryCampaign.routes.map(r=>r.id),sentinel:localStorage.getItem("route-entry-sentinel")})')
  campaign=page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')
  check(page.locator('.sc-route-card').count()==8 and page.locator('[data-sc-mode]').count()==24,'Each of the eight existing routes has explicit AR, VR and Screen actions')
  check(page.locator('button button').count()==0,'Mode choices are semantic sibling buttons, never nested buttons')
  check(page.evaluate('xrEmulator.request===null'),'Opening route cards never auto-enters immersion')
  page.screenshot(path=str(OUT/'route-cards-desktop.png'))
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'route-cards-phone.png'))
  check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Route selection has no horizontal overflow on the narrow viewport')
  page.set_viewport_size({'width':1100,'height':800})
  page.locator(f'button[data-sc-route="first-neighborhood"][data-sc-mode="{KIND}"]').click()
  page.wait_for_function('SkyCycleXR.presenting && SkyCycleRouteEntry.diagnostics.lastOutcome==="started" && __delivery.state.route===4 && player.onGround');frames(8)
  check(page.evaluate('xrEmulator.request.type')=='immersive-'+KIND,'The route card requests its explicitly selected immersive mode')
  check(page.evaluate('__delivery.state.view==="3d"&&!__delivery.paused&&!SkyCycleFlightDeck.topPanel()'),'Successful route entry starts the original chapter in unobstructed 3D play')
  capture(KIND+'-sunrise-entry')
  x=page.evaluate('player.x');page.evaluate('xrEmulator.axis(.8)');page.wait_for_function('(x)=>player.x>x+45',arg=x);page.evaluate('xrEmulator.axis(0)');frames()
  check(True,'Tracked controller movement works immediately after route-card entry')
  routes();capture(KIND+'-route-choices')
  choose('Play Waterwheel Boulevard in '+KIND.upper());page.wait_for_function('__delivery.state.route===5&&!__delivery.paused');frames()
  check(page.evaluate('SkyCycleXR.presenting&&xrEmulator.request.type')=='immersive-'+KIND,'Another same-mode card starts the intended original route without replacing the XR session')
  routes();choose('Play Sunrise Borough in '+OTHER.upper());page.wait_for_function('document.getElementById("sc-route-entry").open')
  choose('Back');check(page.evaluate('SkyCycleXR.presenting&&__delivery.state.route===5'),'Cancelling a mode switch preserves both the running chapter and current session')
  choose('Play Sunrise Borough in '+OTHER.upper());choose('Leave current mode')
  page.wait_for_function('!SkyCycleXR.presenting&&document.getElementById("sc-entry-confirm")?.textContent.startsWith("Enter")')
  check(page.evaluate('__delivery.state.route===5&&!__merged.scene.parent'),'Mode switching ends XR safely and waits for a fresh deliberate entry before replacing the route')
  page.locator('#sc-entry-confirm').click();page.wait_for_function('SkyCycleXR.presenting&&__delivery.state.route===4&&!__delivery.paused');frames(8)
  check(page.evaluate('xrEmulator.request.type')=='immersive-'+OTHER,'Fresh confirmation enters the other genuine immersive mode on the chosen route')
  capture(OTHER+'-switch-entry')
  routes();choose('Play Waterwheel Boulevard in Screen');choose('Leave XR and play on screen')
  page.wait_for_function('!SkyCycleXR.presenting&&__delivery.state.route===5&&__delivery.state.view==="2d"&&!__delivery.paused')
  check(page.evaluate('!__merged.scene.parent&&!__merged.renderer.xr.enabled'),'Explicit Screen entry ends XR and restores ordinary renderer ownership')
  page.locator('#delivery-header [data-delivery="routes"]').click();page.evaluate('xrEmulator.deny=true')
  before=page.evaluate('JSON.stringify({route:__delivery.state.route,code:levelCode(),deliveries,tries})')
  page.locator(f'button[data-sc-route="first-neighborhood"][data-sc-mode="{KIND}"]').click()
  page.wait_for_function('SkyCycleRouteEntry.diagnostics.lastOutcome==="denied"')
  check(page.evaluate('JSON.stringify({route:__delivery.state.route,code:levelCode(),deliveries,tries})')==before,'Rejected XR permission neither changes the route nor silently starts screen play')
  check(not page.evaluate('SkyCycleXR.presenting'),'Rejected entry leaves a recoverable normal browser')
  page.locator('#sc-entry-back').click();page.evaluate('xrEmulator.deny=false')
  # Explicit fault injection only for the new independent preference key.
  page.evaluate("(()=>{const set=Storage.prototype.setItem;window.restorePrefStore=()=>{Storage.prototype.setItem=set;};Storage.prototype.setItem=function(k,v){if(k==='svgn.skycycle.launch.v1')throw new DOMException('fixture quota','QuotaExceededError');return set.call(this,k,v);};})()")
  page.locator('button[data-sc-route="first-neighborhood"][data-sc-mode="screen"]').click();page.wait_for_function('__delivery.state.route===4')
  check(page.evaluate('!SkyCycleRouteEntry.diagnostics.saveOK'),'Blocked preference storage is reported honestly as session-only')
  page.locator('#delivery-header [data-delivery="routes"]').click()
  check(page.locator('.sc-route-preference').first.inner_text().endswith('this session only'),'The route card discloses its session-only mode hint')
  page.evaluate('restorePrefStore()');page.locator('button[data-sc-route="canal-choices"][data-sc-mode="screen"]').click()
  check(page.evaluate('SkyCycleRouteEntry.diagnostics.saveOK'),'A successful later preference save restores durable status')
  check(page.evaluate('JSON.stringify({records:SkyCycleFlightDeck.records,ids:DeliveryCampaign.routes.map(r=>r.id),sentinel:localStorage.getItem("route-entry-sentinel")})')==protected,'Career records, stable IDs and old storage survive every entry/cancel/switch')
  check(page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')==campaign,'All original authored campaign builders remain byte-identical')
  page.reload(wait_until='domcontentloaded');wait_ready()
  check(page.evaluate('SkyCycleRouteEntry.diagnostics.preference.mode==="screen"&&xrEmulator.request===null'),'The last-used mode survives reload without auto-starting immersion')
  page.goto(BASE+'?xr=1&scRoute=canal-choices&scMode='+KIND,wait_until='domcontentloaded');wait_ready()
  page.wait_for_function('document.getElementById("sc-entry-confirm")')
  check(page.locator('#sc-entry-title').inner_text()=='Ready for Waterwheel Boulevard' and page.evaluate('xrEmulator.request===null'),'A WebGL handoff URL retains its selected route and still requires a fresh entry gesture')
  page.locator('#sc-entry-back').click();check('scRoute=' not in page.url,'Cancelling a pending handoff consumes only its transient URL parameters')
  # Unsupported hardware is a distinct browser context, not a gameplay mutation.
  unsupported=browser.new_context(viewport={'width':1100,'height':800},service_workers='block')
  unsupported.add_init_script("Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>false}});localStorage.setItem('sprocket_muted','1');")
  p=unsupported.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'?xr=1',wait_until='domcontentloaded');p.wait_for_function('window.SkyCycleRouteEntry?.diagnostics.checked')
  prior=p.evaluate('__delivery.state.route');p.locator(f'button[data-sc-route="first-neighborhood"][data-sc-mode="{KIND}"]').click()
  check('unavailable' in p.locator('#sc-entry-message').inner_text() and p.evaluate('__delivery.state.route')==prior,'Unsupported immersion explains the limitation instead of selecting another mode')
  p.locator('#sc-entry-back').click();p.locator('button[data-sc-route="first-neighborhood"][data-sc-mode="screen"]').click()
  p.wait_for_function('__delivery.state.route===4&&__delivery.state.view==="2d"')
  check(True,'Explicit Screen play remains available on a browser without XR')
  p.screenshot(path=str(OUT/'screen-without-xr.png'));unsupported.close()
  check(not errors,'No uncaught errors in the complete route-entry journey')
  check(not [s for s in logs if any(x in s.lower() for x in ['tsl:','shader error','validation error','gl_invalid'])],'No detected shader or GPU validation errors')
  passed=True
 except Exception as exc:
  failure=str(exc)
  try:page.screenshot(path=str(OUT/'failure.png'));samples.append(page.evaluate('({route:__delivery.state.route,paused:__delivery.paused,panel:SkyCycleFlightDeck.topPanel()?.id,entry:SkyCycleRouteEntry.diagnostics,xr:SkyCycleXR.diagnostics})'))
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'mode':KIND,'origin':origin,'passed':passed,'checks':checks,'failure':failure,'errors':errors,'console':logs,'samples':samples,'coverage':'Actual original game, route UI and Three stereo renderer. Explicit emulated XR hardware; ordinary controller and DOM actions. New-key quota injection and unsupported-browser fixture disclosed. No player, score, win, delivery or campaign assignments. Not physical Quest/Xbox, WebGPU reload hardware, or human comfort qualification.'},indent=2));ctx.close();browser.close();server.shutdown()
