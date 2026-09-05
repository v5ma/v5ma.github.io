"""Read-only assertions, ordinary keyboard/buttons for edits and gameplay.
The model witnesses are a separate test; these runs do not inject rider state.
"""
import os,json,time,math
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('FLOW_SUITE','editor');ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output'/('flow-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[]
def check(v,text):
 assert v,text
 checks.append(text);print('PASS: '+text,flush=True)
def code(page):return page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
def st(page):
 return page.evaluate('()=>{const p=player;return {x:p.x,y:p.y,vx:p.vx,vy:p.vy,won,tries,score,deliveries,steps:__ground.state.steps,track:p.track?.sky.id,phase:p.track?p.trackS/p.track.len:0,peg:p.peg?{x:p.peg.x,y:p.peg.y,loops:p.peg.loops}:null,releases:__grapple.state.releases,visits:[...__network.state.visits],chain:__network.state.bestChain,airTicks:p._airTicks||0,events:__network.state.events};}')
def editor_action(page,name):page.locator('#route-workshop [data-mk="'+name+'"]').click()
def analyse(page):
 page.locator('#flow-analyze').click()
 page.wait_for_function('RouteFlowEditor.state.report&&!RouteFlowEditor.state.stale&&!RouteFlowEditor.state.busy',timeout=120000)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1440,'height':900},service_workers='block',record_video_dir=str(OUT/'videos'),accept_downloads=True)
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname
 context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=context.new_page();page.set_default_timeout(90000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 try:
  if MODE=='board':
   page.goto(BASE+'/mario-maker-clone/svgn-paper-route/planning/index.html',wait_until='networkidle')
   page.wait_for_selector('.card')
   check(page.locator('.card').count()==26,'The durable roadmap contains all 26 explicitly scoped tasks')
   check(page.locator('.audit-card').count()==3,'Before/after layout audits cover all three chapters')
   page.locator('#search').fill('peg-to-peg')
   check(page.locator('.card').count()>=1,'Kanban search finds future grapple planning work')
   page.locator('#search').fill('');page.locator('#graph-node').select_option('flow-11')
   check('flow-11' in page.locator('#graph-description').inner_text(),'Selecting a graph node exposes its composed motion witness')
   page.screenshot(path=str(OUT/'planning-board.png'),full_page=True)
   with page.expect_download() as d:page.locator('#export-roadmap').click()
   payload=json.loads(Path(d.value.path()).read_text());check(len(payload['tasks'])==26,'Roadmap JSON export preserves its dependency records')
   # The workbook is separately hash-tested after its final artifact export.
   page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'planning-mobile.png'),full_page=True)
   check(not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),'The plan and graph fit a narrow viewport')
  else:
   page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
   page.wait_for_function('window.RouteWorkshop&&window.RouteFlowEditor&&window.__gpuReady===true')
   legacy=page.evaluate('levelCode()')
   if MODE=='editor':
    page.locator('#delivery-header [data-delivery="editor"]').click()
    page.wait_for_function('RouteWorkshop.active&&RouteWorkshop.state.doc.paths.length===30')
    original=code(page)
    check(page.evaluate('RouteWorkshop.state.doc.extra.gp.cast.length>0'),'The fitted world retains neighbors and the complete editor document')
    analyse(page)
    result=page.evaluate('({issues:RouteFlowEditor.state.report.audit.issues.length,unproven:RouteFlowEditor.state.report.witnesses.unproven.length,states:RouteFlowEditor.state.report.witnesses.states,truncated:RouteFlowEditor.state.report.witnesses.truncated})')
    check(result['issues']==0 and result['unproven']==0 and not result['truncated'],'The actual browser worker composes access to all 30 surfaces with no clearance conflicts')
    page.locator('#maker-outline [data-track="1"]').click();editor_action(page,'focus')
    page.screenshot(path=str(OUT/'flow-overlay.png'))
    editor_action(page,'duplicate')
    check(page.evaluate('RouteFlowEditor.state.stale'),'A geometry edit invalidates the previous analysis rather than retaining green routes')
    analyse(page)
    check(page.evaluate('RouteFlowEditor.state.report.audit.issues.length>0'),'A close duplicate is detected as a real clearance conflict')
    editor_action(page,'undo');check(code(page)==original,'Undo restores the exact full world after the invalid edit')
    editor_action(page,'starter');page.locator('#maker-outline [data-track="0"]').click()
    before=code(page);page.locator('#flow-fit').click()
    page.wait_for_function('!!RouteFlowEditor.state.proposal||!!RouteFlowEditor.state.error',timeout=120000)
    check(page.evaluate('!!RouteFlowEditor.state.proposal'),'The receiver solver finds a clear corridor using the selected rail physics')
    check(code(page)==before,'A previewed receiver does not alter the document')
    samples=page.evaluate('RouteFlowEditor.state.proposal.evidence.speeds.length')
    check(samples>=3,'Receiver proposal succeeds at at least three of four tested input speeds')
    page.screenshot(path=str(OUT/'receiver-proposal.png'))
    page.locator('#flow-accept').click()
    check(page.evaluate('RouteWorkshop.state.doc.paths.length===3'),'Accept creates an actual third roadway in the editable document')
    editor_action(page,'undo');check(code(page)==before,'Accepting a solver proposal is one undoable change')
    page.locator('#maker-outline [data-track="0"]').click();page.locator('#flow-fit').click();page.wait_for_function('!!RouteFlowEditor.state.proposal||!!RouteFlowEditor.state.error')
    page.locator('#flow-cancel').click();check(code(page)==before,'Discarding a proposal leaves the draft untouched')
    # Continue through actual 3D preview and back, without changing game records.
    records=page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')
    editor_action(page,'test');page.wait_for_function('RouteWorkshop.testing&&mode==="play"&&player.onGround')
    check(page.evaluate('__merged.camera.isPerspectiveCamera'),'Authoring still previews in the actual perspective renderer')
    page.locator('#cv').focus();x=page.evaluate('player.x');page.keyboard.down('KeyD');page.wait_for_function('(x)=>player.x>x+50',arg=x);page.keyboard.up('KeyD')
    page.locator('#maker-return').click();page.wait_for_function('RouteWorkshop.active&&!RouteWorkshop.testing')
    check(code(page)==before,'Returning from playtest preserves the exact draft')
    check(page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')==records,'Preview does not modify campaign medal records')
   else:
    page.locator('[data-course="4"]').click();page.wait_for_function('__ground.active()&&player.onGround')
    check(page.evaluate('tracks.length===30&&__ground.meta.flow.version===1'),'The real campaign loads the compiled fitted plan')
    check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'Gameplay remains real perspective 3D')
    page.locator('#cv').focus();page.keyboard.down('KeyD')
    if MODE!='road':
     page.wait_for_function('player.x>=600',timeout=120000);page.keyboard.down('Space')
     page.wait_for_function('player.track?.sky.id==="loop-0"',timeout=40000);page.keyboard.up('Space')
     check(True,'An ordinary road jump enters the retained main route')
     if MODE=='branch':
      page.wait_for_function('player.track?.sky.id==="loop-1"',timeout=120000)
      page.wait_for_function('player.track?.sky.id==="loop-1"&&player.trackS/player.track.len>=.55',timeout=120000)
      page.keyboard.down('Space');page.wait_for_function('!player.track');page.keyboard.up('Space')
      page.wait_for_function('__network.state.visits.has("flow-11")',timeout=120000)
      check(True,'A real early jump reaches the solver-fitted swooping branch')
      page.screenshot(path=str(OUT/'fitted-branch.png'))
     elif MODE=='peg':
      page.wait_for_function('player.x>1550&&__grapple.state.target',timeout=120000)
      page.keyboard.down('KeyZ');page.wait_for_function('!!player.peg',timeout=30000)
      check(True,'The actual whip catches a newly fitted peg')
      # Release using the same physical full-windup condition as the compiler,
      # not a pose/velocity injection.
      page.wait_for_function('player.peg&&player.peg.loops>=1&&player.vx>7&&player.vy<-3',timeout=180000)
      page.screenshot(path=str(OUT/'fitted-peg.png'));page.keyboard.up('KeyZ');page.wait_for_function('!player.peg')
      check(st(page)['releases']>0,'A real Z release preserves the physical wind-up')
      page.wait_for_function('!!player.track||player.onGround',timeout=120000)
      check(st(page)['tries']==1,'Peg release recovers in the same live attempt')
      page.screenshot(path=str(OUT/'peg-recovery.png'))
    page.wait_for_function('won',timeout=720000)
    end=st(page);page.keyboard.up('KeyD')
    if page.locator('#stay-results').count() and page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
    check(end['won'] and end['tries']==1,'The chosen route reaches the actual finish without a retry')
    if MODE=='road':check(not end['visits'] and end['deliveries']==0,'The lower road still finishes without compulsory aerial moves or mail')
    if MODE=='spine':check(end['chain']>=6,'The retained high-speed backbone spans six actual catches')
    if MODE=='branch':check('flow-11' in end['visits'],'Branch discovery survives onward travel to the finish')
    page.screenshot(path=str(OUT/'finish.png'))
    (OUT/'run.json').write_text(json.dumps(end,indent=2))
   check(not errors,'No uncaught error during the actual editor or gameplay flow')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'console_errors':console,'scope':'Native HTTP software WebGL; ordinary UI/key inputs. State reads are assertions, not player-state assignments. Limited selected routes, not every branch.'},indent=2))
 except Exception as e:
  try:debug=st(page)
  except:debug=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console_errors':console[-20:],'state':debug},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'),full_page=True)
  except:pass
  raise
 finally:context.close();browser.close()
