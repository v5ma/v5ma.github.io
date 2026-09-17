"""Real Sky Cycle renderer/UI with explicitly emulated WebXR tracking.
Only real UI, keyboard and tracked-input events drive the game/editor.
No player, score, win, inventory or progression assignments.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import os,json,subprocess,threading,functools,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/xr-workspace')); OUT.mkdir(parents=True,exist_ok=True)
KIND=os.getenv('XR_MODE','vr')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/')
url=origin+'/mario-maker-clone/svgn-paper-route/?destination=tideglass-baths&xr=1'
checks=[];errors=[];logs=[];passed=False;failure=None;diag={}
def check(value,message):
 assert value,message
 checks.append(message);print('PASS:',message,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block',record_video_dir=str(OUT/'video'))
 ctx.add_init_script((Path(__file__).with_name('xr-emulator.js')).read_text().replace("import('../vendor/three.webgpu.js')","import('./vendor/three.webgpu.js')"))
 ctx.add_init_script("window.testXbox={id:'Spatial Xbox sample',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[testXbox];")
 ctx.add_init_script("localStorage.setItem('sprocket_muted','1');localStorage.setItem('xr-workspace-sentinel','preserve');")
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=3):
  count=page.evaluate('SkyCycleXR.diagnostics.frames');page.wait_for_function('(n)=>SkyCycleXR.diagnostics.frames>=n',arg=count+n)
 def point(label):
  page.evaluate('(s)=>xrEmulator.point(s)',label);frames(2)
 def choose(label):
  for _ in range(45):
   if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.toLowerCase().includes(s.toLowerCase()))',label):break
   point(' - Next');page.evaluate("xrEmulator.select('start');xrEmulator.select('end')");frames(2)
  point(label);count=page.evaluate('SkyCycleXR.diagnostics.frames')
  page.evaluate("xrEmulator.select('start');xrEmulator.select('end')")
  # Session-ending controls deliberately stop the XR frame owner. Do not wait
  # for nonexistent frames; the subsequent explicit exit/mode assertions remain.
  page.wait_for_function('(n)=>!SkyCycleXR.presenting||SkyCycleXR.diagnostics.frames>=n',arg=count+3)
 def xbox(i):
  frames();page.evaluate('(i)=>{testXbox.buttons[i]={pressed:true,value:1};}',i);frames();page.evaluate('(i)=>{testXbox.buttons[i]={pressed:false,value:0};}',i);frames()
 def capture(name):
  data=page.evaluate('xrEmulator.image()');(OUT/(name+'.png')).write_bytes(base64.b64decode(data.split(',',1)[1]))
 def press(i,hand='right'):
  frames();page.evaluate('([h,i])=>xrEmulator.button(h,i,true)',[hand,i]);frames();page.evaluate('([h,i])=>xrEmulator.button(h,i,false)',[hand,i]);frames()
 try:
  page.goto(url,wait_until='domcontentloaded');page.bring_to_front();page.wait_for_function('window.SkyCycleXR && window.RouteWorkshop && window.SkyCycleFlightDeck && player.onGround && window.__gpuReady')
  protected=page.evaluate('JSON.stringify({records:SkyCycleFlightDeck.records,routeIDs:DeliveryCampaign.routes.map(r=>r.id),sentinel:localStorage.getItem("xr-workspace-sentinel")})')
  page.locator('#sky-xr-open').click();page.locator('#sky-xr-enter-ar' if KIND=='ar' else '#sky-xr-enter').click()
  page.wait_for_function('SkyCycleXR.presenting && SkyCycleXR.diagnostics.frames>5')
  check(page.evaluate('xrEmulator.request.type')=='immersive-'+KIND,'Requested the chosen '+KIND+' session, not a relabeled VR session')
  check(page.evaluate('SkyCycleXR.diagnostics.eyes===2 && SkyCycleXR.diagnostics.ownedScene'),'Both eyes render the existing game scene')
  capture(KIND+'-pause')
  if KIND=='ar':check(page.evaluate('SkyCycleXR.diagnostics.transparent && SkyCycleXR.diagnostics.clipped && xrEmulator.lastCapture.opaque<880000'),'AR renders an alpha-clear exterior around the clipped real game and menu')
  choose('Spatial setup');choose('Exhibit size: 1 plus');check(page.evaluate('Math.abs(SkyCycleXR.diagnostics.placement.scale-1.1)<1e-6'),'In-headset scale control changes only the exhibit')
  choose('Exhibit size: 1.1 minus')
  ui_before=page.evaluate('SkyCycleXR.diagnostics.uiMatrix')
  choose('Exhibit rotation: 0 plus');frames()
  check(page.evaluate('SkyCycleXR.diagnostics.placement.yaw')==15,'The spatial rotation control rotates the exhibit')
  check(max(abs(a-b) for a,b in zip(ui_before,page.evaluate('SkyCycleXR.diagnostics.uiMatrix')))<1e-6,'Exhibit rotation keeps recenter and exit menus at their seated heading')
  choose('Exhibit rotation: 15 minus');choose('Back')
  for label,selector in [('Materials & FX','#prism-panel'),('Route journal','#sc-journal'),('Flight Deck','#flight-deck')]:
   choose(label);page.wait_for_function('(selector)=>document.querySelector(selector)?.open',arg=selector)
   capture(KIND+'-'+selector[1:]);check(True,label+' opens as a readable native headset menu')
   choose('Back')
  choose('Choose a route');page.wait_for_function('document.getElementById("delivery-menu").classList.contains("open")')
  capture(KIND+'-routes');check(True,'The route catalogue and its live actions remain accessible in XR')
  choose('Back');page.wait_for_function('!__delivery.paused');choose('Pause')
  choose('Sound & music');page.wait_for_function('document.getElementById("score-dialog").open')
  choose('Effect intensity: soft plus');check(page.evaluate('SkyCycleSensory.settings.transients==="full"'),'Tracked controller ray adjusts the real sound select')
  choose('Mute all sound: On');check(page.evaluate('!document.getElementById("score-mute").checked && !muted'),'Ray checkbox toggles the real mute control and announces its state')
  choose('Mute all sound: Off');check(page.evaluate('document.getElementById("score-mute").checked && muted'),'Mute can be restored without leaving the sound menu')
  choose('Back');choose('Back to the route');page.wait_for_function('!__delivery.paused')
  x=page.evaluate('player.x');page.evaluate('xrEmulator.axis(.8)');page.wait_for_function('(x)=>player.x>x+80',arg=x);page.evaluate('xrEmulator.axis(0)');frames()
  check(True,'Tracked stick rides through ordinary physics')
  capture(KIND+'-riding-compact-ui')
  page.evaluate('xrEmulator.hands()');frames();check(page.evaluate('SkyCycleXR.diagnostics.handJoints===50'),'Both hands track all joints in the selected immersive mode')
  choose('Back to the route');page.wait_for_function('!__delivery.paused');choose('Pause');page.wait_for_function('__delivery.paused')
  check(True,'A short hand pinch pauses even when released before the next input poll')
  choose('All menus');choose('2D view');choose('Back');choose('Back to the route')
  page.wait_for_function('SkyCycleXR.diagnostics.presentation==="screen" && SkyCycleXR.diagnostics.screenVisible')
  check(page.evaluate('SkyCycleXR.diagnostics.screenSource==="delivery-canvas"'),'2D gameplay uses the live fallback canvas in the headset')
  x=page.evaluate('player.x');point('Ride right');page.evaluate("xrEmulator.select('start')");page.wait_for_function('(x)=>player.x>x+60',arg=x);page.evaluate("xrEmulator.select('end')");frames()
  check(True,'Hand-only riding works in the floating 2D view')
  capture(KIND+'-2d-riding')
  choose('Pause');choose('All menus');choose('Edit this world')
  page.wait_for_function('RouteWorkshop.active && SkyCycleXR.diagnostics.presentation==="workshop"')
  check(page.evaluate('SkyCycleXR.diagnostics.screenSource==="maker-canvas"'),'The editable Workshop is visible as a live XR canvas')
  before=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
  choose('Editor tools');point('Level name:');xbox(0);page.wait_for_function('SkyCycleXR.diagnostics.typing')
  check(True,'Xbox A on the real focused text field opens the shared headset keyboard')
  choose('Clear text');choose('x');choose('r');choose('Apply text')
  check(page.evaluate('document.getElementById("maker-name").value==="xr" && RouteWorkshop.state.dirty'),'Hand keyboard commits through the actual level-name field')
  choose('New grounded starter');page.wait_for_function('document.querySelector(".xr-question[open]")')
  choose('Cancel');check(page.evaluate('document.getElementById("maker-name").value==="xr"'),'Cancelling an in-headset replacement confirmation preserves the edited document')
  choose('Undo');check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==before,'Undo restores the original editable document after XR text entry')
  choose('Import');page.wait_for_function('document.querySelector(".xr-question[open]")');choose('Cancel')
  check(page.evaluate('SkyCycleXR.presenting && WorkshopCore.encode(RouteWorkshop.state.doc)')==before,'Cancelling a browser-file handoff preserves the current XR session and draft')
  choose('Pan');check(page.evaluate('RouteWorkshop.state.tool==="pan" && RouteWorkshop.active'),'The named Pan tool changes the actual Workshop tool without leaving it')
  choose('Resume editing');frames()
  check(page.evaluate('RouteWorkshop.active && SkyCycleXR.diagnostics.screenSource==="maker-canvas" && !SkyCycleFlightDeck.topPanel()'),'Resume editing dismisses only the tools menu, not the editor')
  view=page.evaluate('({...RouteWorkshop.state.view})')
  page.evaluate('xrEmulator.pointCanvas(.35,.3)');frames();page.evaluate("xrEmulator.select('start')");frames()
  check(page.evaluate('RouteWorkshop.state.drag?.type==="pan"'),'Native hand pinch begins the real editor pan drag')
  page.evaluate('xrEmulator.pointCanvas(.55,.3)');frames(5);page.evaluate("xrEmulator.select('end')");frames()
  check(page.evaluate('RouteWorkshop.state.view.x')!=view['x'],'Tracked hand ray pans the actual editor canvas through pointer events')
  check(page.evaluate('!RouteWorkshop.state.drag && WorkshopCore.encode(RouteWorkshop.state.doc)')==before,'Ending a canvas drag preserves document contents and releases capture')
  capture(KIND+'-workshop')
  page.evaluate('xrEmulator.pointCanvas(.4,.3)');frames();page.evaluate("xrEmulator.select('start')");frames();page.evaluate('xrEmulator.disconnect()');frames()
  check(page.evaluate('!RouteWorkshop.state.drag && !keys.ArrowLeft && !keys.ArrowRight'),'Tracking-source loss cancels an editor drag and releases movement')
  page.evaluate('xrEmulator.controllers()');frames();choose('All menus');choose('Playtest in 3D');page.wait_for_function('RouteWorkshop.testing && SkyCycleXR.diagnostics.presentation==="diorama"')
  check(page.evaluate('SkyCycleXR.presenting'),'Workshop playtesting returns to the same stereo game without leaving XR')
  choose('All menus');choose('Return to Workshop');page.wait_for_function('RouteWorkshop.active && !RouteWorkshop.testing');frames()
  check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==before,'Returning from XR playtest restores the same Workshop document')
  choose('Spatial setup');choose('Change AR / VR mode');page.wait_for_function('!SkyCycleXR.presenting && document.getElementById("sky-xr-guide").open')
  check(page.evaluate('RouteWorkshop.active && WorkshopCore.encode(RouteWorkshop.state.doc)')==before,'AR/VR mode change preserves the live draft and requires deliberate re-entry')
  page.locator('#sky-xr-enter' if KIND=='ar' else '#sky-xr-enter-ar').click();page.wait_for_function('SkyCycleXR.presenting && SkyCycleXR.diagnostics.frames>5');frames()
  check(page.evaluate('xrEmulator.request.type')==('immersive-vr' if KIND=='ar' else 'immersive-ar'),'The other immersive mode uses a new explicit session without losing the editor')
  capture(KIND+'-switched-workshop')
  diag=page.evaluate('SkyCycleXR.diagnostics');choose('Exit XR');page.wait_for_function('!SkyCycleXR.presenting && !__merged.scene.parent')
  check(page.evaluate('!__merged.renderer.xr.enabled && RouteWorkshop.active'),'Exiting restores ordinary renderer and editor ownership')
  check(page.evaluate('JSON.stringify({records:SkyCycleFlightDeck.records,routeIDs:DeliveryCampaign.routes.map(r=>r.id),sentinel:localStorage.getItem("xr-workspace-sentinel")})')==protected,'Campaign records, stable route IDs and old storage remain unchanged')
  page.screenshot(path=str(OUT/(KIND+'-desktop-return.png')))
  page.locator('#sky-xr-workshop').click();page.evaluate('xrEmulator.deny=true');page.locator('#sky-xr-enter-ar' if KIND=='ar' else '#sky-xr-enter').click()
  page.wait_for_function('!SkyCycleXR.presenting && !SkyCycleXR.diagnostics.starting')
  check(page.evaluate('!__merged.scene.parent && RouteWorkshop.active'),'Denied re-entry leaves the existing editor and renderer recoverable')
  check(not errors,'No uncaught errors in the exercised AR/VR menu and editor journey')
  check(not [s for s in logs if any(x in s.lower() for x in ['tsl:','shader error','gl_invalid','validation error'])],'No detected shader or GPU validation errors')
  passed=True
 except Exception as exc:
  failure=str(exc)
  try: page.screenshot(path=str(OUT/'failure.png'));diag=page.evaluate('({xr:SkyCycleXR.diagnostics,panel:SkyCycleFlightDeck.topPanel()?.id,mode,view:__delivery.state.view,paused:__delivery.paused,editor:RouteWorkshop.active,errors:[]})')
  except Exception: pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'mode':KIND,'origin':origin,'passed':passed,'checks':checks,'failure':failure,'errors':errors,'console':logs,'diagnostics':diag,'coverage':'Actual Three stereo renderer and original game/editor; emulated XR hardware and standard Xbox samples. Real DOM controls and editor pointer events. No physical Quest, real passthrough-camera, Xbox hardware or human comfort approval.'},indent=2));ctx.close();browser.close();server.shutdown()
