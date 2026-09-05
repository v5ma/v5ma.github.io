"""Native HTTP/3D gameplay and Flow Coach acceptance. Only normal UI and keys
control the app. Rehearsal reads do not set rider state or award success.
"""
import json,os,time,math
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('PHRASE_SUITE','sky');OUT=Path('test-output')/('phrases-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS: '+s,flush=True)
def snapshot(page):
 return page.evaluate('''()=>({x:player.x,y:player.y,vx:player.vx,vy:player.vy,won,tries,deliveries,steps:__ground.state.steps,track:player.track?.sky.id,remaining:player.track?player.track.len-player.trackS:null,peg:player.peg?{x:player.peg.x,y:player.peg.y,th:player.peg.th,loops:player.peg.loops}:null,visited:[...__network.state.visits],events:__network.state.events,brushes:__phrases.state.brushes,hooks:__grapple.state.hooks,releases:__grapple.state.releases})''')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1440,'height':940},service_workers='block',record_video_dir=str(OUT/'video'))
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname;context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.__phrases&&window.FlowCoach&&window.__gpuReady===true')
  before=page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')
  if MODE=='editor':
   page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active')
   check(page.evaluate('RouteWorkshop.state.doc.paths.length===15'),'The existing Workshop opens the complete authored level')
   code=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)');page.locator('#phrase-analyze').click();page.wait_for_function('FlowCoach.state.report&&!FlowCoach.state.busy')
   check(page.evaluate('FlowCoach.state.report.visited.length===10&&FlowCoach.state.report.contacts.length===0'),'Flow Coach replays a complete ten-surface route with carried state')
   check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==code,'Analysis leaves the real document unchanged')
   page.locator('#maker-sector').select_option('1');page.screenshot(path=str(OUT/'clocktower-flow-coach.png'))
   page.locator('#maker-outline [data-track="0"]').click();x=page.locator('#maker-x').input_value();page.locator('#maker-x').fill(str(float(x)+36));page.locator('#maker-x').press('Tab');page.wait_for_function('FlowCoach.state.stale')
   check(page.evaluate('FlowCoach.state.stale'),'Moving a roadway invalidates its old proof immediately')
   page.locator('#route-workshop [data-mk="undo"]').click();check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==code,'Undo restores the full geometry, metadata and soundtrack')
   page.locator('#phrase-route').select_option('canal');page.locator('#phrase-analyze').click();page.wait_for_function('FlowCoach.state.route==="canal"&&!FlowCoach.state.busy')
   check(page.evaluate('FlowCoach.state.report.visited.includes("b0")&&FlowCoach.state.report.visited.includes("b2")'),'The lower line has its own verified carried-state trace')
   page.locator('#maker-sector').select_option('2');page.screenshot(path=str(OUT/'canal-choice-coach.png'))
   with page.expect_download() as info:page.locator('#phrase-export').click()
   info.value.save_as(OUT/'route-rehearsal.json');check(json.loads((OUT/'route-rehearsal.json').read_text())['route']=='canal','A rehearsal exports its evidence with a model-only scope')
   check(page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')==before,'Read-only route analysis does not create campaign records')
  else:
   page.locator('[data-course="4"]').click();page.wait_for_function('__phrases.active()&&player.onGround');page.locator('#cv').focus()
   check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'Gameplay uses the actual perspective renderer')
   check(page.evaluate('tracks.filter(t=>t.sky?.network).length===15'),'The rendered game uses the new collision-backed geometry')
   page.keyboard.down('KeyD')
   if MODE!='road':
    page.wait_for_function('player.x>=245',timeout=120000);page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="m0"',timeout=45000);page.keyboard.up('Space')
    check(True,'A normal ground jump enters the rising runway')
    page.wait_for_function('__network.state.visits.has("m2")',timeout=180000);page.screenshot(path=str(OUT/'clocktower-curl.png'))
    if MODE in ['canal','whip']:
     page.wait_for_function('player.track?.sky.id==="m4"&&player.track.len-player.trackS<200',timeout=180000);page.keyboard.up('KeyD');page.keyboard.down('KeyA')
     page.wait_for_function('!player.track',timeout=45000);page.keyboard.up('KeyA');page.keyboard.down('KeyD')
     page.wait_for_function('player.track?.sky.id==="b0"',timeout=60000);check(True,'Braking deliberately selects the lower collector rather than a scripted lane switch')
    if MODE=='whip':
     page.wait_for_function('player.x>=4480&&__grapple.state.target',timeout=90000);page.keyboard.down('KeyZ');page.wait_for_function('!!player.peg',timeout=15000);check(True,'Z catches the real authored peg')
     page.wait_for_function('player.peg?.loops>=1',timeout=90000)
     page.wait_for_function('player.peg&&((player.peg.th*180/Math.PI)%360+360)%360>=55&&((player.peg.th*180/Math.PI)%360+360)%360<100',timeout=60000)
     page.screenshot(path=str(OUT/'whip-windup.png'));page.keyboard.up('KeyZ');page.wait_for_function('!player.peg')
     check(True,'A player release sends the rider into actual free flight')
    if MODE=='sky':
     page.wait_for_function('player.track?.sky.id==="m6"',timeout=240000);page.screenshot(path=str(OUT/'bellflower-hook.png'))
     page.wait_for_function('player.track?.sky.id==="m7"',timeout=60000);page.screenshot(path=str(OUT/'reverse-catch.png'))
   page.wait_for_function('won',timeout=650000);result=snapshot(page);page.keyboard.up('KeyD');page.keyboard.up('KeyA');page.keyboard.up('KeyZ')
   if page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
   check(result['won'] and result['tries']==1,'The selected route reaches the finish on its first attempt')
   check(result['deliveries']==0,'The normal finish never requires newspaper deliveries')
   if MODE=='road':check(not result['visited'] and result['hooks']==0,'The populated road remains a complete, non-grapple route')
   elif MODE=='sky':
    check(all(i in result['visited'] for i in ['m0','m1','m2','m3','m4','m5','m6','m7','m9','m8']),'The upper run traverses both curls and the reversing cradle in sequence')
    check(not result['brushes'],'The intended upper line does not clip or bounce off any road body')
   elif MODE=='canal':
    check(all(i in result['visited'] for i in ['m0','m1','m2','m3','m4','b0','b1','b2','m8']),'The lower route has a distinct complete sequence of catchers')
    check(not result['brushes'],'The intended canal line does not clip or bounce off any road body')
   elif MODE=='whip':check(result['hooks']>0,'The optional swing remains part of a finishable full run; high reconnection is reported, not assumed')
   page.screenshot(path=str(OUT/'finish.png'))
   (OUT/'run.json').write_text(json.dumps(result,indent=2))
  check(not errors,'No uncaught errors in the tested native flow')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'mode':MODE,'errors':errors,'scope':'Native HTTP software WebGL with ordinary keys, clicks and exports. Model analysis is distinct from native gameplay. No rider-state or progress assignments. Physical-device performance and human fun remain separate.'},indent=2))
 except Exception as e:
  try:state=snapshot(page)
  except:state=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
