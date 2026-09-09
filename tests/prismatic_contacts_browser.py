"""Normal-input 3D sparkles and gameplay. No player, physics or award writes."""
import json,os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('PRISM_CONTACT','relay');OUT=Path('test-output')/('prism-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def state(page):return page.evaluate('({won,tries,deliveries,x:player.x,y:player.y,face:player._railFace,nitro:player.nitro,prism:Prismatic.stats,railHistory:RailGripCore.history,relay:window.SkyRelay?.state})')
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**kw);c=b.new_context(viewport={'width':1440,'height':940},service_workers='block')
 host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 c.add_init_script("localStorage.setItem('sprocket_muted','1')")
 page=c.new_page();page.set_default_timeout(180000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.PrismaticReady&&window.SkyRelayReady&&window.__gpuReady&&window.RideLabReady')
  if MODE=='grip':
   page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active');page.locator('#rail-yard').click();draft=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)');records=page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')
   page.locator('[data-mk="test"]').click();page.wait_for_function('player.onGround&&Prismatic.stats.active');page.locator('#cv').focus();page.keyboard.down('KeyD')
   page.wait_for_function('player.x>=550');page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="grip-0"&&player.nitro===1')
   page.keyboard.down('KeyX');page.keyboard.up('Space');page.wait_for_function('player.nitroT>0');page.keyboard.up('KeyX');page.wait_for_function('player.track?.sky.id==="grip-1"&&player._railFace===-1')
   page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused');page.locator('#flow-study-toggle').click()
   check(page.evaluate('Prismatic.stats.effects.nitro===1&&player.nitro===0'),'A real collected nitro is consumed once and creates one cosmetic boost event')
   check(page.evaluate('Prismatic.stats.effects.railCatch>=2'),'Top and underside catches trigger physical-contact accents')
   check(page.evaluate('Prismatic.stats.particles>0&&Prismatic.stats.particles<=PrismCore.LIMITS.particles'),'The live boost and catch use a bounded visible particle batch')
   page.screenshot(path=str(OUT/'nitro-underside.png'));page.locator('#delivery-pause [data-delivery="resume"]').click();page.locator('#cv').focus();page.keyboard.down('KeyD')
   page.wait_for_function('won',timeout=400000);page.keyboard.up('KeyD');result=state(page)
   check([e['face'] for e in result['railHistory'][:3]]==[1,-1,1],'Polished surfaces retain the uninterrupted top/underside/top route')
   check(result['tries']==1 and result['deliveries']==0,'The actual yard finishes first attempt without a delivery requirement')
   page.locator('#maker-return').click();check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==draft,'The edited level is unchanged on return from the effects playtest')
   check(page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')==records,'Cosmetic effects in preview never award campaign medals')
  else:
   page.locator('[data-course="4"]').click();page.wait_for_function('player.onGround&&Prismatic.stats.draws>0');page.locator('#cv').focus();page.keyboard.down('KeyD')
   if MODE=='road':
    page.wait_for_function('player.shield&&Prismatic.root.getObjectByName("Reactive glass shield").visible');page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused');page.locator('#flow-study-toggle').click()
    check(page.evaluate('Prismatic.stats.effects.shield>=1'),'The glass shield appears only after collecting the real shield pickup')
    page.screenshot(path=str(OUT/'reactive-glass-shield.png'));page.locator('#delivery-pause [data-delivery="resume"]').click();page.locator('#cv').focus();page.keyboard.down('KeyD')
   else:
    page.wait_for_function('player.x>=320');page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="m0"');page.keyboard.up('Space');page.wait_for_function('player.track?.sky.id==="m5"',timeout=480000)
    page.keyboard.down('KeyZ');page.wait_for_function('player.peg?.id===SkyRelay.PEG.id');page.wait_for_function('player.peg?.loops>=1');page.screenshot(path=str(OUT/'prismatic-whip-windup.png'))
    check(page.evaluate('Prismatic.stats.effects.whipCatch===1'),'The jeweled peg sparkle is caused by the actual Z-key catch')
    check(page.evaluate('__grapple.graphics.ropeDraw.peg===SkyRelay.PEG.id'),'The existing tether still reaches the real renderer')
    page.wait_for_function('SkyRelay.releaseWindow(player)');page.keyboard.up('KeyZ');page.wait_for_function('SkyRelay.state.reached')
    check(page.evaluate('Prismatic.stats.effects.whipRelease===1'),'The release burst observes one real whip release, not an automatic transfer')
    check(page.evaluate('SkyRelay.state.awarded'),'The optional 400-point connection is still earned through its normal rule')
   page.wait_for_function('won',timeout=900000);page.keyboard.up('KeyD');page.keyboard.up('KeyZ');result=state(page)
   if page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
   check(result['won'] and result['tries']==1 and result['deliveries']==0,'The complete '+MODE+' run reaches the finish first attempt with no required deliveries')
   if MODE=='road':check(page.evaluate('__network.state.visits.size===0&&__grapple.state.hooks===0'),'The populated street remains a complete route without upper rails or grappling')
   page.screenshot(path=str(OUT/'finish.png'))
  check(result['prism']['active'] and result['prism']['draws']>0,'The effects layer was actually rendered throughout the playthrough')
  check(not result['prism']['errors'] and not errors,'No suppressed material-initialization failure or uncaught exception')
  (OUT/'report.json').write_text(json.dumps({'mode':MODE,'passed':len(checks),'checks':checks,'errors':errors,'result':result,'scope':'Actual HTTP software WebGL with ordinary UI/key input. No live position, velocity, catch or reward assignments. Not a physical-device performance benchmark.'},indent=2))
 except Exception as e:
  try:last=state(page)
  except:last=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':last},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
