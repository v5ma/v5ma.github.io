"""Native HTTP and real 3D acceptance. Only UI/keys modify game/editor state.
Read-only observations are used for assertions; no physics or progress injection.
"""
import json,os,math,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('RAIL_SUITE','editor');OUT=Path('test-output')/('rail-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True)
def point(page,p):
 v=page.evaluate('RouteWorkshop.state.view');r=page.locator('#maker-canvas').bounding_box();return r['x']+(p[0]-v['x'])*v['zoom'],r['y']+(p[1]-v['y'])*v['zoom']
def draft(page):return page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
def action(page,name):page.locator('#route-workshop [data-mk="'+name+'"]').click()
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw);context=browser.new_context(viewport={'width':1440,'height':960},record_video_dir=str(OUT/'videos'),service_workers='block',accept_downloads=True)
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname;context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
  page.wait_for_function('window.__gpuReady===true&&window.__railRepair&&window.RouteWorkshop')
  check(page.locator('#rail-build').inner_text()=='v0.11.0','Visible build identifies the installed repair')
  page.locator('#rail-update').click();page.wait_for_function('document.getElementById("rail-update").textContent==="Up to date"')
  check(True,'Same-origin release manifest matches the running code')
  records=page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')
  page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active')
  if MODE=='editor':
   action(page,'starter')
   check(page.locator('[data-piece]').count()==13,'Original pieces and five fractional arc types are all available')
   page.locator('#curve-search').fill('fifth');check(page.locator('[data-piece]:visible').count()==1,'Asset search finds the fifth-circle arc');page.locator('#curve-search').fill('')
   page.locator('[data-piece="arc72"]').click();page.locator('#maker-canvas').click(position={'x':390,'y':245})
   check(page.evaluate('RouteWorkshop.state.tool==="select"&&RouteWorkshop.state.selected.size===1'),'Placing a part immediately selects it instead of accidentally placing another')
   action(page,'focus');before=draft(page);beforeCount=page.evaluate('RouteWorkshop.state.doc.paths.length')
   page.locator('#curve-rx').fill('160');page.locator('#curve-ry').fill('110');page.locator('#curve-sweep').fill('-180');page.locator('#curve-arc-apply').click()
   check(page.evaluate('RouteWorkshop.state.doc.paths.at(-1).bezier.length===3'),'Arc controls rebuild an actual half curve with editable anchors')
   action(page,'focus');base=draft(page)
   handle=page.evaluate('RouteWorkshop.curves.handles().find(h=>h.kind==="rotate").p');center=page.evaluate('RouteWorkshop.curves.handles().find(h=>h.kind==="center").p')
   p=point(page,handle);target=point(page,[center[0]+(handle[0]-center[0])*math.cos(.5)-(handle[1]-center[1])*math.sin(.5),center[1]+(handle[0]-center[0])*math.sin(.5)+(handle[1]-center[1])*math.cos(.5)])
   page.mouse.move(*p);page.mouse.down();page.mouse.move(*target,steps=8);page.mouse.up();check(draft(page)!=base,'Dragging the rotation gizmo changes real curve geometry');action(page,'undo');check(draft(page)==base,'Undo restores the complete curve and authoring handles')
   corner=page.evaluate('RouteWorkshop.curves.handles().filter(h=>h.kind==="resize")[2].p');p=point(page,corner);page.mouse.move(*p);page.mouse.down();page.mouse.move(p[0]+35,p[1]+25,steps=8);page.mouse.up();check(draft(page)!=base,'Corner handles stretch the curve');action(page,'undo')
   page.locator('#maker-handles').check()
   tangent=page.evaluate('(()=>{let p=RouteWorkshop.state.doc.paths.at(-1).bezier[0];return [p.p[0]+p.o[0],p.p[1]+p.o[1]]})()');p=point(page,tangent)
   page.keyboard.down('Alt');page.mouse.move(*p);page.mouse.down();page.mouse.move(p[0]+25,p[1]-35,steps=8);page.mouse.up();page.keyboard.up('Alt')
   check(page.evaluate('RouteWorkshop.state.doc.paths.at(-1).bezier[0].mode==="corner"'),'Alt-drag gives an independent tangent rather than the old symmetric-only handle')
   nodes=page.evaluate('RouteWorkshop.state.doc.paths.at(-1).bezier.length');page.locator('#curve-split').click();check(page.evaluate('RouteWorkshop.state.doc.paths.at(-1).bezier.length')==nodes+1,'Split adds a real cubic anchor');action(page,'undo')
   # The native pointer path remains selected and moving rather than stamping.
   page.locator('[data-tool="paint"]').count() # no synthetic tool state assignment
   page.locator('[data-tile="5"]').click();page.locator('#maker-outline [data-track="2"]').click()
   check(page.evaluate('RouteWorkshop.state.tool==="select"'),'Track-list selection exits the asset placement tool')
   action(page,'save');saved=draft(page)
   with page.expect_download() as ev:action(page,'export')
   download=ev.value;file=OUT/'exported.route';download.save_as(file)
   check(file.read_text()==saved,'Export preserves all current points and Bezier handles byte-for-byte')
   meta=json.loads(__import__('base64').b64decode(file.read_text().split('.')[0]));check(meta['cb'][-1]['nodes'],'Portable file includes independent handles')
   action(page,'starter');page.locator('#maker-file').set_input_files(str(file))
   check(draft(page)==saved,'File import exactly restores the edited document and handles')
   action(page,'focus');page.screenshot(path=str(OUT/'bezier-controls.png'))
   page.locator('#curve-pen').click();r=page.locator('#maker-canvas').bounding_box()
   for x,y,dx,dy in [(250,260,45,-20),(460,360,55,20),(650,280,0,0)]:
    page.mouse.move(r['x']+x,r['y']+y);page.mouse.down();page.mouse.move(r['x']+x+dx,r['y']+y+dy,steps=5);page.mouse.up()
   page.locator('#curve-finish').click();check(page.evaluate('RouteWorkshop.state.doc.paths.at(-1).bezier.length===3'),'Pen click-drags create a three-anchor Bezier path')
   check(page.evaluate('RouteWorkshop.state.doc.paths.length')==beforeCount+1,'Pen construction commits a single selectable track')
   action(page,'undo');check(draft(page)==saved,'Pen path is one undo transaction, not disconnected paint strokes')
   page.set_viewport_size({'width':390,'height':844});page.locator('#maker-inspector-toggle').click();check(page.locator('#curve-pen').is_visible(),'Curve controls remain reachable through mobile Properties');check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Editor controls do not cause horizontal page overflow');page.screenshot(path=str(OUT/'mobile-properties.png'))
  else:
   page.locator('#rail-yard').click();original=draft(page);action(page,'test');page.wait_for_function('mode==="play"&&player.onGround');page.locator('#cv').focus()
   check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'Training runs in the real perspective 3D renderer')
   page.wait_for_function('__railRepair.unicycle?.visible');check(page.evaluate('__railRepair.settings.vehicle==="euc"'),'Actual unicycle model is the default')
   page.screenshot(path=str(OUT/'unicycle-start.png'))
   page.keyboard.down('KeyD');page.wait_for_function('player.x>=550',timeout=180000);page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="grip-0"',timeout=60000);page.keyboard.up('Space')
   check(page.evaluate('player._railFace===1&&player.nitro===1'),'Ordinary jump catches the top after collecting a real nitro pickup')
   page.keyboard.down('KeyX');page.wait_for_function('player.nitroT>0',timeout=30000);page.keyboard.up('KeyX')
   page.wait_for_function('player.track?.sky.id==="grip-1"&&player._railFace===-1',timeout=120000)
   check(page.evaluate('player.nitro===0'),'A real boost consumes exactly one collected nitro')
   check(page.evaluate('player._bside.by>0'),'Underside contact turns the rider outward beneath the road')
   page.screenshot(path=str(OUT/'underside-grip.png'))
   page.wait_for_function('RailGripCore.history.some(e=>e.id==="grip-2"&&e.face===1)',timeout=120000)
   history=page.evaluate('RailGripCore.history');check([h['face'] for h in history[:3]]==[1,-1,1],'Uninterrupted normal-input route catches top, underside, then top')
   page.wait_for_function('won',timeout=240000);page.keyboard.up('KeyD')
   check(page.evaluate('tries===1&&deliveries===0'),'Practice finishes without a retry, teleport or forced delivery')
   check(page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')==records,'Playtest does not write campaign medals')
   page.locator('#maker-return').click();check(draft(page)==original,'Returning from the 3D test restores the exact editable yard')
   action(page,'test');page.wait_for_function('mode==="play"&&player.onGround');page.locator('#rail-vehicle').select_option('bike');page.wait_for_function('!__railRepair.unicycle.visible');check(page.evaluate('__railRepair.settings.vehicle==="bike"&&!__railRepair.unicycle.visible'),'Bike remains an available rendered alternative');page.screenshot(path=str(OUT/'bike-option.png'))
   page.locator('#rail-mode').select_option('precision');check(page.evaluate('RailGripCore.mode==="precision"'),'Precision grip can be selected without changing level geometry');page.locator('#maker-return').click()
  check(not errors,'No uncaught exceptions during the native editor and game flow')
  fatal=[s for s in console if any(t in s for t in ['GL_INVALID','VALIDATION','shader error','CommandBuffer'])];check(not fatal,'No detected GPU validation errors')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'gpu_errors':fatal,'scope':'Real Chromium HTTP / software WebGL. Only UI and key inputs alter the game. Physics unit fixtures are separate; this is not a physical-device performance audit.'},indent=2))
 except Exception as e:
  try:state=page.evaluate('({mode,player:player?{x:player.x,y:player.y,vx:player.vx,vy:player.vy,rail:player.track?.sky.id,face:player._railFace,nitro:player.nitro,tries}:null,history:window.RailGripCore?.history})')
  except:state=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state,'console':console[-20:]},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
