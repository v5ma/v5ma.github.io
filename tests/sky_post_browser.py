"""Real HTTP/software WebGL with ordinary input. No player-state assignment.
Route timing models and the imported preview fixture are separately labeled.
"""
import json,os,time,subprocess
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('POST_SUITE','relay');OUT=Path('test-output')/('sky-post-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173');checks=[];errors=[]
def check(v,text):
 assert v,text
 checks.append(text);print('PASS:',text,flush=True)
def state(page):
 return page.evaluate('''()=>({x:player.x,y:player.y,vx:player.vx,vy:player.vy,tries,won,deliveries,steps:__ground.state.steps,id:player.track?.sky.id,face:player._railFace,peg:player.peg?{id:player.peg.id,th:player.peg.th,r:player.peg.r,loops:player.peg.loops}:null,visits:[...__network.state.visits],events:__network.state.events,hooks:__grapple.state.hooks,releases:__grapple.state.releases,passport:__skyPost.passport,progress:__skyPost.snapshot})''')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1440,'height':940},service_workers='block',record_video_dir=str(OUT/'video'),accept_downloads=True)
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname;context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.__skyPost&&window.__gpuReady&&window.RideLabReady')
  check(page.locator('#rail-build').inner_text()=='v0.14.0','The installed build reports this release')
  page.locator('#route-passport-button').click();page.wait_for_selector('#route-passport[open]')
  check(page.locator('.passport-card').count()==6,'The passport explains six distinct ways to explore, including the road')
  check(page.evaluate('Object.keys(__skyPost.passport.stamps).length')==0,'A new local passport has no fabricated discoveries')
  page.keyboard.press('Escape')
  if MODE=='relay':
   page.locator('[data-course="4"]').click();page.wait_for_function('__skyPost.active()&&player.onGround');page.locator('#cv').focus()
   check(page.evaluate('__merged.camera.isPerspectiveCamera&&tracks.length===16'),'The running 3D chapter contains the preserved 15 surfaces and the new balcony')
   page.keyboard.down('KeyD');page.wait_for_function('player.x>=320',timeout=90000);page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="m0"',timeout=60000);page.keyboard.up('Space')
   page.wait_for_function('player.x+13>=4510&&__grapple.state.target?.id==="peg-124-18"',timeout=480000);page.keyboard.down('KeyZ');page.wait_for_function('player.peg?.id==="peg-124-18"',timeout=30000)
   check(True,'A normal held whip catches the actual violet peg from the High Garden flight')
   page.wait_for_function('!!__skyPost.marker&&__grapple.graphics.ropeMesh.geometry.drawRange.count>0',timeout=30000)
   check(True,'The physical relay marker and attached chain are rendered')
   page.wait_for_function('''()=>{const p=player,a=p.peg;if(!a)return false;const t=((a.th%(2*Math.PI))+2*Math.PI)%(2*Math.PI);return a.loops>=1&&t>=.78&&t<.94&&p.vx>0&&p.vy<-14}''',timeout=240000)
   page.keyboard.up('KeyZ');page.wait_for_function('!player.peg&&__grapple.state.releases>=1',timeout=30000)
   page.wait_for_function('player.track?.sky.id==="sky-post"',timeout=180000)
   check(any(e['type']=='catch' and e.get('to')=='sky-post' and str(e.get('from','')).startswith('peg:') and e.get('airTicks',0)>=6 for e in state(page)['events']),'The released rider crosses real airborne frames and catches the separate upper balcony')
   page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused');page.locator('#flow-study-toggle').click();n=state(page)['steps'];page.wait_for_timeout(150);check(state(page)['steps']==n,'The new route can be inspected with physics frozen');page.screenshot(path=str(OUT/'Sky-Post-Balcony.png'))
   page.locator('#delivery-pause [data-delivery="resume"]').click();page.wait_for_function('!__delivery.paused');page.locator('#cv').focus();page.keyboard.down('KeyD')
   page.wait_for_function('won',timeout=650000);result=state(page);page.keyboard.up('KeyD')
   if page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
   check(result['tries']==1 and result['won'] and result['deliveries']==0,'The full optional relay run finishes first attempt without mandatory mail')
   check(result['visits']==['m0','m1','m2','m3','m4','m5','sky-post','m8'],'The original approach and Festival return are one uninterrupted carried-state sequence')
   check('relay' in result['passport']['stamps'] and 'street' not in result['passport']['stamps'],'A real completed whip line earns only its appropriate route stamp')
   page.locator('#route-passport-button').click();page.screenshot(path=str(OUT/'Earned-Route-Passport.png'))
   with page.expect_download() as event:page.locator('#passport-export').click()
   target=OUT/'Route-Passport.json';event.value.save_as(target);check(json.loads(target.read_text())==result['passport'],'Passport export contains exactly the validated local discoveries')
   page.locator('#passport-close').click();page.reload(wait_until='domcontentloaded');page.wait_for_function('window.__skyPost&&window.__gpuReady');page.locator('#route-passport-button').click()
   check(page.locator('[data-route-stamp="relay"]').get_attribute('class').endswith('stamped'),'A normal reload preserves the earned stamp')
   page.set_viewport_size({'width':390,'height':844});page.locator('#passport-export').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'Passport-Mobile.png'))
   check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The passport stays inside a narrow viewport')
   check(page.locator('#passport-export').is_visible(),'The bottom passport controls remain reachable on a phone-width screen')
   (OUT/'run.json').write_text(json.dumps(result,indent=2))
  else:
   page.locator('[data-course="4"]').click();page.wait_for_function('player.onGround&&__skyPost.active()')
   page.locator('#route-passport-button').click();page.wait_for_selector('#route-passport[open]');s=state(page);page.wait_for_timeout(250)
   check(state(page)['steps']==s['steps'] and state(page)['x']==s['x'],'Opening the passport pauses without relocating the player')
   page.keyboard.press('Escape');page.wait_for_function('!__delivery.paused');page.locator('#cv').focus();page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused');page.locator('#route-passport-button').click();page.locator('#passport-close').click()
   check(page.evaluate('__delivery.paused'),'Closing a passport opened from Pause preserves the existing pause')
   page.locator('#delivery-pause [data-delivery="resume"]').click();page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active')
   page.locator('#maker-route').select_option('4');page.locator('#route-workshop [data-mk="route"]').click();code=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
   check(page.evaluate('RouteWorkshop.state.doc.paths.length===16&&RouteWorkshop.state.doc.extra.gp.skyPost.receiver==="sky-post"'),'The actual Workshop edits the complete relay geometry and its peg metadata')
   page.locator('#maker-outline [data-track="15"]').click();page.locator('#route-workshop [data-mk="focus"]').click();page.locator('#maker-x').fill('4758');page.locator('#maker-x').press('Tab')
   check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')!=code,'The balcony remains movable authored geometry')
   page.locator('#route-workshop [data-mk="undo"]').click();check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==code,'Undo restores the exact route and metadata')
   page.screenshot(path=str(OUT/'Sky-Post-Workshop.png'))
   subprocess.run(['node','tests/build_sky_post_preview.cjs'],check=True)
   page.locator('#maker-file').set_input_files('test-output/sky-post-preview.route');before=page.evaluate('localStorage.getItem(SkyPostProgress.key)')
   page.locator('#route-workshop [data-mk="test"]').click();page.wait_for_function('RouteWorkshop.testing&&player.onGround');page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('won',timeout=120000);page.keyboard.up('KeyD')
   check(page.evaluate('localStorage.getItem(SkyPostProgress.key)')==before,'Finishing an imported relay playtest cannot write campaign route discoveries')
   page.locator('#maker-return').click();check(page.evaluate('RouteWorkshop.active&&RouteWorkshop.state.doc.name==="Sky Post preview isolation check"'),'Preview exit restores the exact imported user-level draft')
  check(not errors,'No uncaught exceptions occurred in the tested real editor and 3D flow')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'scope':'Native Chromium/software WebGL using ordinary keys, buttons and files. No assignments to player motion or progress. Finite model fixtures are separate. No native-device performance certification.'},indent=2))
 except Exception as e:
  try:s=state(page)
  except:s=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':s},indent=2))
  try:page.screenshot(path=str(OUT/'Failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
