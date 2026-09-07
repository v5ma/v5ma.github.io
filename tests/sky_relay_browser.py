"""Real HTTP 3D acceptance. Only ordinary keys, buttons and editor controls
change the live app. Physics model seeds are confined to separate Node tests.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('RELAY_SUITE','ride');OUT=Path('test-output')/('sky-relay-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def state(page):
 return page.evaluate('({x:player.x,y:player.y,vx:player.vx,vy:player.vy,won,tries,deliveries,score,steps:__ground.state.steps,id:player.track?.sky.id,face:player._railFace,peg:player.peg?{id:player.peg.id,r:player.peg.r,loops:player.peg.loops,th:player.peg.th}:null,relay:SkyRelay.state,visits:[...__network.state.visits],events:__network.state.events})')
with sync_playwright() as p:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**args);context=browser.new_context(viewport={'width':1440,'height':940},service_workers='block',record_video_dir=str(OUT/'video'),accept_downloads=True)
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname;context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.SkyRelayReady&&window.__gpuReady===true')
  if MODE=='editor':
   page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active');page.locator('#maker-route').select_option('4');page.locator('[data-mk="route"]').click()
   original=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)');check(page.evaluate('RouteWorkshop.state.doc.paths.length===16&&RouteWorkshop.state.doc.extra.gp.skyRelay.version===1'),'The complete sixteen-surface world and relay metadata load in the real Workshop')
   page.locator('#maker-outline [data-track="15"]').click();page.locator('[data-mk="focus"]').click();page.screenshot(path=str(OUT/'editable-relay.png'))
   page.locator('#maker-x').fill('5268');page.locator('#maker-x').press('Tab');check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')!=original,'The new receiving surface is editable, not locked artwork')
   page.locator('[data-mk="undo"]').click();check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==original,'Undo restores the receiving geometry and metadata exactly')
   with page.expect_download() as ev:page.locator('[data-mk="export"]').click()
   ev.value.save_as(OUT/'Sky-Relay-Sunrise.route');check((OUT/'Sky-Relay-Sunrise.route').read_text()==original,'Export preserves the complete new world')
   page.locator('[data-mk="test"]').click();page.wait_for_function('SkyRelay.active()&&mode==="play"');check(page.evaluate('tracks.some(t=>t.sky.id===SkyRelay.ID)&&__grapple.pegs().some(p=>p.id===SkyRelay.PEG.id)'),'The same physical peg and receiving track exist in 3D playtesting')
   page.locator('#maker-return').click();check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==original,'Returning from 3D playtest preserves the entire draft')
  else:
   page.locator('[data-course="4"]').click();page.wait_for_function('SkyRelay.active()&&player.onGround');page.locator('#cv').focus()
   check(page.evaluate('tracks.length===16&&__grapple.pegs().length===2'),'One real receiving road and peg supplement the existing authored chapter')
   check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'The test uses the actual perspective renderer')
   page.keyboard.down('KeyD');page.wait_for_function('player.x>=320',timeout=120000);page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="m0"',timeout=45000);page.keyboard.up('Space')
   page.wait_for_function('player.track?.sky.id==="m5"',timeout=360000)
   if MODE=='coast':
    page.wait_for_function('won',timeout=480000)
   else:
    page.keyboard.down('KeyZ');page.wait_for_function('player.peg?.id===SkyRelay.PEG.id',timeout=90000)
    check(page.evaluate('player.peg.r>=200&&player.peg.r<=240'),'A normal held whip catches the physical relay peg without relocation')
    page.screenshot(path=str(OUT/'mint-relay-swing.png'))
    page.wait_for_function('SkyRelay.releaseWindow(player)',timeout=180000);page.keyboard.up('KeyZ')
    page.wait_for_function('SkyRelay.state.reached',timeout=180000)
    check(page.evaluate('SkyRelay.state.release.loops>=1&&SkyRelay.state.release.vx>0&&SkyRelay.state.release.vy<0'),'The player winds up and releases real up-right momentum')
    check(page.evaluate('SkyRelay.state.awarded&&SkyRelay.state.events.filter(e=>e.type==="relay").length===1'),'A completed whip-to-balcony connection awards one exploration bonus')
    page.locator('#cv').focus();page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused');page.locator('#flow-study-toggle').click();frozen=state(page)['steps'];page.wait_for_timeout(200)
    check(state(page)['steps']==frozen,'Inspecting the balcony leaves the real rider paused')
    page.locator('#gl').screenshot(path=str(OUT/'cloudpost-balcony.png'));page.locator('#delivery-pause [data-delivery="resume"]').click();page.wait_for_function('!__delivery.paused');page.locator('#cv').focus();page.keyboard.down('KeyD')
    page.wait_for_function('won',timeout=360000)
   result=state(page);page.keyboard.up('KeyD');page.keyboard.up('KeyZ')
   if page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
   check(result['won'] and result['tries']==1,'The complete route finishes on its first attempt using only normal controls')
   check(result['deliveries']==0,'New exploration never makes newspaper delivery mandatory')
   if MODE=='coast':check(not result['relay']['awarded'] and 'cloudpost-relay' not in result['visits'],'Ignoring the relay preserves the complete original Clocktower/Bellflower line')
   else:
    check(result['visits']==['m0','m1','m2','m3','m4','m5','cloudpost-relay','m8'],'The relay reconnects to the Festival glide as one continuous airborne route')
    check(result['relay']['events'].count(next(e for e in result['relay']['events'] if e['type']=='relay'))==1,'The bonus is not awarded repeatedly while riding the balcony')
   (OUT/'run.json').write_text(json.dumps(result,indent=2));page.screenshot(path=str(OUT/'route-finish.png'))
  check(not errors,'No uncaught errors in the tested game and editor flow')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'scope':'Real HTTP/software WebGL; ordinary pointer, keyboard and file actions. No live position, velocity, score or progress assignments; not a physical-device performance certification.'},indent=2))
 except Exception as e:
  try:diagnostic=state(page)
  except:diagnostic=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':diagnostic},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
