"""Ride Lab native UI and guide acceptance. Editor scenarios use explicit model
seeds; the actual 3D ride is driven only by keys. No gameplay-state injection.
"""
import os,json,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('LAB_SUITE','editor');ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output'/('ride-lab-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def code(page):return page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
def point(page,p):
 v=page.evaluate('RouteWorkshop.state.view');b=page.locator('#maker-canvas').bounding_box();return (b['x']+(p[0]-v['x'])*v['zoom'],b['y']+(p[1]-v['y'])*v['zoom'])
def act(page,name):page.locator('#route-workshop [data-mk="'+name+'"]').click()
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**args);ctx=b.new_context(viewport={'width':1440,'height':960},service_workers='block',accept_downloads=True,record_video_dir=str(OUT/'video'))
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort());ctx.add_init_script("localStorage.setItem('sprocket_muted','1')")
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.__gpuReady===true&&window.RideLabReady===true')
  check(page.evaluate('PaperDeliveryRelease.version')==json.loads((ROOT/'mario-maker-clone/svgn-paper-route/release.json').read_text())['version'],'The running build matches the committed release manifest')
  page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active');page.locator('#rail-yard').click();original=code(page)
  check(page.evaluate('RouteWorkshop.state.doc.paths[2].points[0][0]===1760'),'The yard uses the clearance-corrected receiving lip')
  if MODE=='editor':
   page.locator('#maker-outline [data-track="0"]').click();page.locator('#ride-lab-toggle').click();page.locator('#lab-nitro').check()
   settings=page.evaluate('({mode:RailGripCore.mode,events:RailGripCore.history.length,records:localStorage.getItem("svgn_delivery_records_v1")})')
   page.locator('#lab-run').click();page.wait_for_function('!!RideLab.result')
   result=page.evaluate('RideLab.result.traces[0]')
   check(result['status']=='terrain-landing','The private rehearsal ends safely on terrain without a clearance warning')
   check([e['face'] for e in result['events'] if e['type']=='catch']==[-1,1],'The modeled route carries state through underside and top receiving contacts')
   check(code(page)==original,'Running a rehearsal leaves the complete draft unchanged')
   check(page.evaluate('({mode:RailGripCore.mode,events:RailGripCore.history.length,records:localStorage.getItem("svgn_delivery_records_v1")})')==settings,'Worker simulations cannot alter live grip settings, contact history or campaign records')
   page.locator('#lab-frame').click();page.screenshot(path=str(OUT/'carried-state-rehearsal.png'))
   page.locator('#lab-time').focus();page.keyboard.press('Home');check(page.locator('#lab-time').input_value()=='0','The route can be scrubbed back to its explicit initial state');page.keyboard.press('End')
   page.locator('#lab-compare').click();page.wait_for_function('RideLab.result?.traces.length===5')
   check(page.locator('#lab-case option').count()==5,'Five distinct initial speeds are compared rather than relabeled as one certified path')
   with page.expect_download() as ev:page.locator('#lab-export').click()
   file=OUT/'trace.json';ev.value.save_as(file);data=json.loads(file.read_text());check(data['document']==original and len(data['traces'])==5,'The exported model includes its exact source document and assumptions')
   page.locator('#maker-x').fill('668');page.locator('#maker-x').press('Tab');page.wait_for_function('!RideLab.result')
   check('invalid' in page.locator('#lab-status').inner_text().lower() or 'changed' in page.locator('#lab-status').inner_text().lower(),'Editing a curve invalidates its previous rehearsal')
   act(page,'undo');check(code(page)==original,'Undo restores the full yard, independent of rehearsal state')
   page.locator('#ride-lab-toggle').click();act(page,'fit');page.wait_for_timeout(150)
   p0=page.evaluate('RouteWorkshop.state.doc.paths[0].points[18]');p1=page.evaluate('RouteWorkshop.state.doc.paths[1].points[22]')
   page.mouse.click(*point(page,p0));page.keyboard.down('Shift');page.mouse.click(*point(page,p1));page.keyboard.up('Shift')
   check(page.evaluate('RouteWorkshop.state.selected.size===2'),'Two pieces can be selected directly on the canvas')
   page.locator('#lab-smooth-join').click()
   check(page.evaluate('RouteWorkshop.state.doc.paths.length===2&&!!RouteWorkshop.state.doc.paths[0].bezier'),'Smooth join creates one editable continuous cubic roadway instead of a disconnected connector')
   act(page,'undo');check(code(page)==original,'One undo restores both original rails and all their metadata')
   act(page,'redo');joined=code(page);act(page,'save')
   with page.expect_download() as ev:act(page,'export')
   route=OUT/'joined.route';ev.value.save_as(route);check(route.read_text()==joined,'The smooth joined roadway exports with its independent handles')
   act(page,'undo');page.locator('#maker-file').set_input_files(str(route));page.wait_for_function('(c)=>WorkshopCore.encode(RouteWorkshop.state.doc)===c',arg=joined)
   check(code(page)==joined,'Import restores the joined geometry and handles exactly')
   page.locator('#ride-lab-toggle').click();page.locator('#maker-outline [data-track="0"]').click();page.locator('#lab-run').click();page.locator('#lab-cancel').click();page.wait_for_timeout(200)
   check(page.evaluate('!RideLab.busy&&!RideLab.result'),'Cancel prevents a late worker response from restoring a stale trace')
   page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'mobile-ride-lab.png'))
   check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Ride Lab remains within a phone-width editor')
  else:
   records=page.evaluate('localStorage.getItem("svgn_delivery_records_v1")');act(page,'test');page.wait_for_function('mode==="play"&&player.onGround');page.locator('#ride-guide-toggle').click()
   check(page.evaluate('RideGuide.enabled'),'The optional guide can be enabled during a real playtest')
   page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('player.x>=550',timeout=180000);page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="grip-0"&&player.nitro===1',timeout=60000);page.keyboard.down('KeyX');page.keyboard.up('Space');page.wait_for_function('player.nitroT>0');page.keyboard.up('KeyX')
   page.wait_for_function('player.track?.sky.id==="grip-1"&&player._railFace===-1',timeout=180000)
   page.wait_for_function('!!RideGuide.result',timeout=15000);page.screenshot(path=str(OUT/'underside-with-guide.png'))
   check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'Guide annotations are projected through the actual 3D play camera')
   check(page.locator('#ride-guide').is_visible(),'The guide is rendered in the running game, not only in the editor')
   page.wait_for_function('RailGripCore.history.some(e=>e.id==="grip-2"&&e.face===1)',timeout=180000)
   history=page.evaluate('RailGripCore.history');check([e['face'] for e in history[:3]]==[1,-1,1],'Ordinary jump/nitro inputs traverse top, underside and top after the receiver correction')
   check(len(history)==3,'Guide predictions do not create fake contacts in live telemetry')
   page.keyboard.press('KeyG');check(not page.evaluate('RideGuide.enabled'),'G turns the guide off without changing the route')
   page.wait_for_function('won',timeout=240000);page.keyboard.up('KeyD');check(page.evaluate('tries===1&&deliveries===0'),'The actual guided practice run finishes first attempt without deliveries')
   check(page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')==records,'The completed rehearsal playtest writes no campaign medal')
   page.locator('#maker-return').click();check(code(page)==original,'Return to Workshop restores the untouched construction document')
   page.screenshot(path=str(OUT/'returned-draft.png'))
  check(not errors,'No uncaught browser exceptions in the verified flow')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'scope':'Native HTTP Chromium/software WebGL. Real authoring actions and ordinary gameplay keys. Models are separate, explicitly seeded predictions; no gameplay position or progress assignments.'},indent=2))
 except Exception as e:
  try:debug=page.evaluate('({labReady:window.RideLabReady,status:document.getElementById("lab-status")?.textContent,guide:document.getElementById("ride-guide-note")?.textContent,player:player?{x:player.x,y:player.y,rail:player.track?.sky.id,nitro:player.nitro,face:player._railFace}:null,history:window.RailGripCore?.history})')
  except:debug=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'debug':debug},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();b.close()
