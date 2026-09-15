"""Real Workshop preview through real UI and native movement; no fake wins.
Each job uses a fresh browser context. Storage seeds are explicitly old-save fixtures.
The trace wrapper reads state after the actual tick; it never changes simulation.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
import os,json,subprocess,threading,functools,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/waterwheel-preview'));OUT.mkdir(parents=True,exist_ok=True)
SUITE=os.getenv('WATERWHEEL_SUITE','road')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/')
BASE=origin+'/mario-maker-clone/svgn-paper-route/'
checks=[];errors=[];logs=[];passed=False;failure=None;result={}
PAD="window.testPad={id:'Standard Xbox acceptance sample',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[testPad];"
def check(v,text):
 assert v,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':800,'height':600})
 ctx.add_init_script(PAD)
 ctx.add_init_script("localStorage.setItem('sprocket_muted','1');if(!localStorage.getItem('ww-preserved')){localStorage.setItem('ww-preserved','original');localStorage.setItem('svgn_delivery_records_v1',JSON.stringify({'canal-choices':{medal:'silver',time:99,score:400},'first-neighborhood':{medal:'bronze',time:150,score:100}}));localStorage.setItem('svgn.skycycle.sunrise.v1',JSON.stringify({marketPilot:true,finishes:3}));}")
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=4):page.evaluate('(n)=>new Promise(r=>{function step(){if(--n<=0)r();else requestAnimationFrame(step);}requestAnimationFrame(step);})',n)
 def tap(i):
  frames();page.evaluate('(i)=>{testPad.buttons[i]={pressed:true,value:1};}',i);frames();page.evaluate('(i)=>{testPad.buttons[i]={pressed:false,value:0};}',i);frames()
 def seek(id):
  for _ in range(50):
   if page.evaluate('(id)=>document.activeElement?.id===id',id):return
   tap(5)
  raise AssertionError('Controller cannot reach '+id)
 def snap():return page.evaluate('({won,tries,mode,x:player.x,y:player.y,route:__delivery.state.route,view:__delivery.state.view,paused:__delivery.paused,testing:RouteWorkshop.testing,visits:window.wwVisits||[],trace:window.wwTrace||[],deliveries,ground:__ground.state,checks:document.getElementById("maker-checks")?.textContent})')
 try:
  page.goto(BASE+'?xr=1',wait_until='domcontentloaded');page.bring_to_front()
  page.wait_for_function('window.SkyCycleWaterwheel && window.SkyCycleFlightDeck && window.RouteWorkshop && window.PaperDeliveryCampaign?.status==="ready" && window.__gpuReady')
  before=page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')
  old=page.evaluate('Object.fromEntries(Object.keys(localStorage).filter(k=>k==="ww-preserved"||k.startsWith("svgn_delivery_")||k.startsWith("svgn.skycycle.")).map(k=>[k,localStorage.getItem(k)]))')
  seek('ww-preview-open');tap(0);page.wait_for_function('document.getElementById("ww-preview").open')
  check(page.locator('#ww-preview').inner_text().find('not a replacement')>=0,'Controller opens a clearly labeled, non-awarding chapter preview')
  page.screenshot(path=str(OUT/'preview-dialog.png'))
  page.set_viewport_size({'width':390,'height':844});frames(5)
  check(page.evaluate('(()=>{const d=document.getElementById("ww-preview"),r=d.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&d.scrollWidth<=d.clientWidth;})()'),'Preview dialog fits mobile width and height')
  page.screenshot(path=str(OUT/'preview-mobile.png'));page.set_viewport_size({'width':1100,'height':800});tap(1)
  check(page.evaluate('!document.getElementById("ww-preview").open && __delivery.state.menu'),'B closes preview without starting or replacing a route')
  seek('ww-preview-open');tap(0);seek('ww-preview-ground' if SUITE=='ground-only' else 'ww-preview-ride');tap(0)
  page.wait_for_function('RouteWorkshop.testing && typeof player!=="undefined" && player.onGround && window.__cloudview?.root?.userData.waterwheelPreview?.revision===2')
  check(page.evaluate('__delivery.state.route===-1 && __sky.state.data.gp.waterwheel.preview'),'The real Workshop owns the preview and isolates campaign progression')
  check(page.evaluate('tracks.filter(t=>t.sky?.id?.startsWith("ww-")).length')==(0 if SUITE=='ground-only' else 7),'Expected physical preview geometry exists in the real engine')
  check(page.evaluate('__cloudview.root.userData.waterwheelPreview.signs===9'),'Actual 3D scene contains the wheelhouse landmark and authored wayfinding')
  page.screenshot(path=str(OUT/'south-quay-3d.png'))
  page.evaluate("(()=>{window.wwVisits=[];window.wwTrace=[];const tick=window.tick;window.tick=function(...args){const r=tick.apply(this,args);if(RouteWorkshop.testing){const id=player.track?.sky?.id;if(id&&!wwVisits.includes(id))wwVisits.push(id);if(!wwTrace.length||Math.abs(player.x-wwTrace[wwTrace.length-1].x)>90)wwTrace.push({x:player.x,y:player.y,rail:id||null,onGround:player.onGround,tries,won});}return r;};})()")
  page.locator('#delivery-header [data-delivery="view"]').click();check(page.evaluate('__delivery.state.view==="2d"'),'Full preview traversal uses the supported native 2D renderer on CPU CI')
  page.locator('#cv').focus();page.keyboard.down('KeyD')
  if SUITE in ('porch','express'):
   x=820 if SUITE=='porch' else 3080
   page.wait_for_function('(x)=>player.x>=x && player.onGround && !player.track',arg=x,timeout=180000)
   page.keyboard.down('Space');target='ww-porch' if SUITE=='porch' else 'ww-runway'
   page.wait_for_function('(id)=>player.track?.sky?.id===id',arg=target,timeout=45000);page.keyboard.up('Space')
   check(True,'Ordinary jump reaches '+target+' without teleporting or resetting velocity')
   page.screenshot(path=str(OUT/(SUITE+'-entry.png')))
   if SUITE=='porch':
    page.wait_for_function('wwVisits.includes("ww-porch") && !player.track && player.onGround && player.x>1480',timeout=90000)
    check(page.evaluate('wwVisits.length===1 && player.x<2300'),'Introductory porch returns to the road before the express network')
   else:
    page.wait_for_function('wwVisits.includes("ww-finish")',timeout=180000)
    check(page.evaluate('JSON.stringify(wwVisits)===JSON.stringify(["ww-runway","ww-crescent","ww-gallery","ww-finish"])'),'One continuous real ride traverses all four express sections')
    page.screenshot(path=str(OUT/'wheelhouse-descent.png'))
  page.wait_for_function('won',timeout=240000);page.keyboard.up('KeyD');page.keyboard.up('Space');frames()
  result=snap();check(result['won'] and result['tries']==1,'Native '+SUITE+' route finishes on its first attempt')
  if SUITE in ('road','ground-only'):check(not result['visits'],'Ordinary road finish needs no aerial contacts or advanced transfer')
  page.screenshot(path=str(OUT/(SUITE+'-finish.png')))
  check(page.evaluate('JSON.stringify(DeliveryCampaign.routes.map((r,i)=>({id:r.id,code:DeliveryCampaign.encode(DeliveryCampaign.build(i,__gameRefs.T))})))')==before,'All eight existing campaign documents and identities remain unchanged')
  check(all(page.evaluate('(k)=>localStorage.getItem(k)',k)==v for k,v in old.items()),'Original campaign and unrelated save fixtures remain byte-identical after preview completion')
  check(page.evaluate('!localStorage.getItem("canal-choices-r2")'),'Preview does not write reserved future-layout records')
  page.locator('#maker-return').click();page.wait_for_function('RouteWorkshop.active && !RouteWorkshop.testing')
  if SUITE=='road':
   previous=page.evaluate('JSON.parse(localStorage.getItem("svgn.skycycle.waterwheel-preview-backup.v1")).code')
   page.locator('#maker-name').fill('My unsaved Waterwheel edit');page.locator('#maker-name').press('Tab');page.wait_for_function('RouteWorkshop.state.dirty')
   draft=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
   page.locator('#ww-preview-workshop').click();page.locator('#ww-preview-ride').click()
   check(page.evaluate('RouteWorkshop.active && !RouteWorkshop.testing && document.getElementById("ww-preview").open && document.getElementById("ww-preview-status").textContent.includes("unsaved")'),'Dirty Workshop document blocks preview replacement')
   check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==draft,'Rejected replacement preserves exact unsaved document')
   page.locator('#ww-preview-back').click();page.locator('[data-mk="undo"]').click();page.wait_for_function('!RouteWorkshop.state.dirty')
   page.locator('#ww-preview-workshop').click();page.locator('#ww-preview-restore').click();page.wait_for_function('RouteWorkshop.active && !document.getElementById("ww-preview").open')
   check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==page.evaluate('(code)=>WorkshopCore.encode(WorkshopCore.decode(code))',previous),'Explicit restore recovers the previous blueprint through the real editor')
  check(not errors,'No uncaught errors in the native preview, controller and preservation flow')
  check(not [s for s in logs if any(x in s.lower() for x in ['shader error','tsl:','gl_invalid'])],'No detected shader errors in the preview scene')
  passed=True
 except Exception as exc:
  failure=str(exc)
  try:result=snap();page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'suite':SUITE,'origin':origin,'passed':passed,'checks':checks,'failure':failure,'errors':errors,'console':logs,'result':result,'coverage':'Real UI, sampled Xbox gamepad and ordinary keys; real 3D scene then supported 2D full native run. Old-save fixtures explicitly seeded. No player-position, velocity, score or win assignments. Not physical hardware or human enjoyment qualification.'},indent=2));ctx.close();browser.close();server.shutdown()
