"""Native startup fault injection. Network delivery is controlled, not gameplay
state. Verify delayed campaign content and failed optional tools independently.
"""
import json,os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
OUT=Path('test-output/campaign-loading');OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as p:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**args)
 try:
  for scenario in ['delayed-campaign','optional-tools-fail','campaign-fail']:
   context=browser.new_context(viewport={'width':1280,'height':840},service_workers='block')
   context.add_init_script("localStorage.setItem('sprocket_muted','1')")
   host=urlparse(BASE).hostname
   context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
   held=[]
   def hold(route):held.append(route)
   def abort(route):route.abort()
   if scenario=='delayed-campaign':context.route('**/sky-relay.js',hold)
   elif scenario=='optional-tools-fail':context.route('**/ride-lab-core.js',abort)
   else:context.route('**/sky-relay.js',abort)
   page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
    page.wait_for_function('!!window.PaperDeliveryCampaign')
    if scenario=='delayed-campaign':
     page.wait_for_function('document.getElementById("campaign-load-state").textContent.includes("Preparing")')
     check(page.locator('[data-course="4"]').is_disabled(),'A slow campaign download cannot launch the old first chapter')
     check(page.evaluate('PaperDeliveryCampaign.status==="loading"&&__delivery.state.route===-1'),'Loading does not create a phantom run or choose a route')
     check(page.locator('#delivery-header [data-delivery="editor"]').is_enabled(),'Draft editing remains accessible while campaign content is pending')
     page.screenshot(path=str(OUT/'routes-loading.png'))
     check(len(held)==1,'Campaign content is requested exactly once')
     held.pop().continue_()
    elif scenario=='campaign-fail':
     page.wait_for_function('window.PaperDeliveryCampaign?.status==="error"')
     check(page.locator('#campaign-load-retry').is_visible(),'A failed content download provides an explicit retry action')
     check(page.locator('[data-course="4"]').is_disabled() and page.evaluate('__delivery.state.route===-1'),'Failure never silently starts an obsolete level')
     check(page.locator('#delivery-header [data-delivery="editor"]').is_enabled(),'Authoring access is preserved on a campaign-loading failure')
     page.screenshot(path=str(OUT/'load-failure-recovery.png'))
     context.unroute('**/sky-relay.js',abort)
     page.locator('#campaign-load-retry').click()
    page.wait_for_function('window.PaperDeliveryCampaign?.status==="ready"&&window.__gpuReady===true')
    if scenario=='optional-tools-fail':
     page.wait_for_selector('#ride-lab-failed')
     check(not page.evaluate('!!window.RideLabReady'),'The optional tool failure was actually exercised')
    check(page.locator('[data-course="4"]').is_enabled(),scenario+': the current campaign becomes selectable')
    page.locator('[data-course="4"]').click()
    page.wait_for_function('SkyRelay.active()&&player.onGround')
    check(page.evaluate('tracks.length===16&&tracks.some(t=>t.sky.id===SkyRelay.ID)'),scenario+': the menu starts the same expanded level as the editor')
    check(page.evaluate('__ground.state.events.filter(e=>e.type==="start").length===1'),scenario+': one click spawns exactly one run')
    if scenario=='optional-tools-fail':
     page.locator('#cv').focus();page.keyboard.down('KeyD')
     page.wait_for_function('player.x>220',timeout=30000);page.keyboard.up('KeyD')
     check(page.evaluate('tries===1'),'The game really advances despite a failed optional editor-tool download')
    check(not errors,'No uncaught exception in '+scenario)
   finally:context.close()
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Native HTTP/software WebGL; delayed/failed module delivery and ordinary route buttons. No live player state or progress assignments.'},indent=2))
 except Exception as error:
  (OUT/'failure.json').write_text(json.dumps({'error':str(error),'checks':checks,'errors':errors},indent=2));raise
 finally:browser.close()
