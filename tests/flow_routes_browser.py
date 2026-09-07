"""Native HTTP/3D route acceptance. Only normal keys, buttons and file export
alter the app; observed rider position, velocity and progress are never assigned.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('FLOW_SUITE','sky');OUT=Path('test-output')/('flow-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def state(page):
 return page.evaluate('''()=>({x:player.x,y:player.y,vx:player.vx,vy:player.vy,won,tries,deliveries,steps:__ground.state.steps,paused:__delivery.paused,right:!!(keys.KeyD||keys.ArrowRight),left:!!(keys.KeyA||keys.ArrowLeft),jump:!!keys.Space,id:player.track?.sky.id,remaining:player.track?player.track.len-player.trackS:null,visits:[...__network.state.visits],events:__network.state.events,hooks:__grapple.state.hooks,history:RailGripCore.history})''')
def capture(page,name):
 page.locator('#cv').focus();page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused')
 page.locator('#flow-study-toggle').click();before=state(page)['steps'];page.wait_for_timeout(200);check(state(page)['steps']==before,'Inspect scene reveals the real world without advancing the rider')
 page.locator('#gl').screenshot(path=str(OUT/name));page.locator('#delivery-pause [data-delivery="resume"]').click();page.wait_for_function('!__delivery.paused');page.locator('#cv').focus();page.keyboard.down('KeyD')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1440,'height':940},record_video_dir=str(OUT/'video'),service_workers='block',accept_downloads=True)
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname;context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("window.__flowTestInput=[];for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{if(!['KeyD','KeyA','Space'].includes(e.code))return;__flowTestInput.push({type,code:e.code,step:window.__ground?.state.steps});if(__flowTestInput.length>100)__flowTestInput.shift();},true);");page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
  page.wait_for_function('window.__flowRoutes&&window.RideLabReady&&window.__gpuReady===true')
  before=page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')
  if MODE=='editor':
   page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active')
   page.locator('#maker-route').select_option('4');page.locator('#route-workshop [data-mk="route"]').click()
   check(page.evaluate('RouteWorkshop.state.doc.paths.length===15&&RouteWorkshop.state.doc.extra.gp.flowRoutes.version===3'),'The real Workshop loads the complete authored first chapter')
   code=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
   page.locator('#maker-sector').select_option('1');page.screenshot(path=str(OUT/'clocktower-editor.png'))
   page.locator('#maker-outline [data-track="0"]').click();page.locator('#maker-x').fill('518');page.locator('#maker-x').press('Tab')
   check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')!=code,'Authored routes remain editable geometry, not locked scene artwork')
   page.locator('#route-workshop [data-mk="undo"]').click();check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==code,'Undo restores the route document and route-choice metadata exactly')
   with page.expect_download() as info:page.locator('#route-workshop [data-mk="export"]').click()
   info.value.save_as(OUT/'authored-world.route');check((OUT/'authored-world.route').read_text()==code,'Export retains the complete authored world including its soundtrack')
   page.locator('#flow-previous-layout').click();check(page.evaluate('RouteWorkshop.state.doc.paths.length===46&&!RouteWorkshop.state.doc.extra.gp.flowRoutes'),'The previous dense world is preserved as an editable copy')
   page.locator('#maker-route').select_option('4');page.locator('#route-workshop [data-mk="route"]').click();check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==code,'Switching between old and new does not mutate either featured layout')
   check(page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')==before,'Authoring and exports do not award campaign medals')
  else:
   page.locator('[data-course="4"]').click();page.wait_for_function('__flowRoutes.active()&&player.onGround');page.locator('#cv').focus()
   check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'The actual perspective renderer is used')
   check(page.evaluate('tracks.filter(t=>t.sky?.authoredFlow).length===15'),'All 15 authored tracks exist in the live collision world')
   if MODE=='sky':
    page.locator('#network-map-button').click();page.wait_for_selector('#sky-network-map[open]');n=state(page)['steps'];page.wait_for_timeout(200)
    check(state(page)['steps']==n,'The route map pauses without changing progress');page.screenshot(path=str(OUT/'whole-level-map.png'));page.locator('#network-map-close').click();page.wait_for_function('!document.getElementById("sky-network-map").open&&!__delivery.paused')
   page.locator('#cv').focus();page.keyboard.down('KeyD')
   if MODE!='road':
    entry='e4' if MODE=='recover' else 'e2' if MODE=='reentry' else 'm0';x=3580 if MODE=='recover' else 2212 if MODE=='reentry' else 320
    page.wait_for_function('(x)=>player.x>=x',arg=x,timeout=480000);page.keyboard.down('Space');page.wait_for_function('(id)=>player.track?.sky.id===id',arg=entry,timeout=45000);page.keyboard.up('Space')
    check(True,'A deliberate road jump enters the selected route')
    if MODE in ['sky','canal']:
     page.wait_for_function('__network.state.visits.has("m2")',timeout=180000)
     if MODE=='sky':capture(page,'clocktower-curl.png')
    if MODE=='canal':
     page.wait_for_function('player.track?.sky.id==="m4"&&player.track.len-player.trackS<150',timeout=180000);page.keyboard.up('KeyD');page.keyboard.down('KeyA')
     page.wait_for_function('!player.track',timeout=60000);page.keyboard.up('KeyA');page.keyboard.down('KeyD');page.wait_for_function('player.track?.sky.id==="b0"',timeout=90000)
     check(True,'Actual braking chooses the canal collector, not a scripted lane switch');capture(page,'canal-collector.png')
    if MODE=='sky':
     page.wait_for_function('player.track?.sky.id==="m6"',timeout=240000);capture(page,'bellflower-open-hook.png')
     page.wait_for_function('player.track?.sky.id==="m7"',timeout=90000)
     check(any(e['type']=='launch' and e.get('from')=='m6' and e.get('vx',0)<-10 for e in state(page)['events']),'The hook really launches leftward into a different receiving cradle')
   page.wait_for_function('won',timeout=650000);result=state(page);page.keyboard.up('KeyD');page.keyboard.up('KeyA')
   if page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
   check(result['won'] and result['tries']==1,'The chosen route reaches the finish on its first attempt')
   check(result['deliveries']==0,'The ordinary finish does not require deliveries')
   if MODE=='road':check(not result['visits'] and not result['hooks'],'The populated road remains a complete non-aerial way to play')
   else:
    expected=page.evaluate('(id)=>FlowRouteData.routes.find(r=>r.id===id).expected',arg='orchard' if MODE=='recover' else MODE)
    check(result['visits']==expected,'The complete authored sequence is traversed in order with no inserted catches')
    check(sum(e['type']=='catch' and e.get('airTicks',0)>=6 for e in result['events'])>=len(expected)-1,'Transfers contain real detached flight rather than rail-to-rail position assignments')
    if MODE=='recover':check(any(e.get('id')=='b2' and e.get('face')==-1 for e in page.evaluate('RailGripCore.history')),'The recovery run catches the underside using actual incoming momentum')
    if MODE=='canal':check('m5' not in result['visits'] and 'm6' not in result['visits'],'The lower route is a genuinely different path through the same level')
    if MODE=='sky':check(any(e['type']=='launch' and e.get('from')=='m7' and e.get('vx',0)>10 for e in result['events']),'The reversing cradle sends the same rider right again')
   page.screenshot(path=str(OUT/'finish.png'));(OUT/'run.json').write_text(json.dumps(result,indent=2))
  check(not errors,'No uncaught errors in the tested authoring and native 3D flow')
  (OUT/'report.json').write_text(json.dumps({'mode':MODE,'passed':len(checks),'checks':checks,'errors':errors,'scope':'Ordinary key/button/file input in native HTTP software WebGL. No player position, velocity, score, rail or progress assignments. Not a physical-device or enjoyment certification.'},indent=2))
 except Exception as e:
  try:detail=state(page)
  except:detail=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'inputs':page.evaluate('window.__flowTestInput||[]'),'state':detail},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
