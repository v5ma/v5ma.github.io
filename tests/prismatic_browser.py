"""Actual HTTP renderer: material switches, reduced motion, authoring and a ride.
No writes to player/physics/progress. The showcase is the existing playable scene.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
MODE=os.getenv('PRISM_SUITE','materials');OUT=Path('test-output')/('prismatic-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];gpu=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
def snapshot(page):return page.evaluate('({version:PaperDeliveryRelease.version,prism:Prismatic.stats,settings:Prismatic.settings,steps:__sky.state.steps,tries,won,deliveries,x:player.x,y:player.y,track:player.track?.sky.id,renderer:__merged.renderer.info.render})')
def pose(page):return page.evaluate('JSON.stringify({x:player.x,y:player.y,vx:player.vx,vy:player.vy,steps:__sky.state.steps,score,deliveries,track:player.track?.sky.id})')
def materials(page):return page.evaluate('(()=>{let m=[];__merged.scene.traverse(o=>{if(o.material?.isMeshPhysicalNodeMaterial)m.push({name:o.material.name,roughness:o.material.roughness,metalness:o.material.metalness,iridescence:o.material.iridescence,transmission:o.material.transmission,dispersion:o.material.dispersion});});return m})()')
with sync_playwright() as p:
 options={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**options);c=browser.new_context(viewport={'width':1440,'height':960},service_workers='block',accept_downloads=True)
 c.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=c.new_page();page.set_default_timeout(180000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:gpu.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.__gpuReady&&window.PrismaticReady&&window.SkyRelayReady')
  original=page.evaluate('levelCode()');records=page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')
  page.locator('[data-course="4"]').click();page.wait_for_function('player.onGround&&Prismatic.stats.active&&Prismatic.stats.draws>0')
  check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'Prismatic materials draw in the actual perspective game renderer')
  check(not snapshot(page)['prism']['errors'],'The material pass initialized without a caught construction error')
  data=materials(page);check(any(m['metalness']>.9 for m in data),'Rail inlays use physical polished-metal materials')
  check(any(m['iridescence']>.7 for m in data),'Faceted crystals use actual iridescent physical materials')
  if MODE=='materials':
   page.locator('#cv').focus();page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused');page.locator('#flow-study-toggle').click()
   frozen=pose(page);rails=page.evaluate('JSON.stringify(tracks.map(t=>t.pts))');saved=page.evaluate('levelCode()')
   page.screenshot(path=str(OUT/'prismatic-start.png'));baseline=snapshot(page)
   page.locator('#prism-options').click();page.locator('#prism-look').select_option('classic');page.locator('#prism-close').click()
   check(page.evaluate('__delivery.paused&&!Prismatic.stats.active'),'Classic restores the original scene while preserving an existing pause')
   check(pose(page)==frozen,'Changing materials does not move the rider or advance score')
   page.screenshot(path=str(OUT/'classic-same-view.png'))
   page.locator('#prism-options').click();page.locator('#prism-look').select_option('refraction');page.locator('#prism-close').click();page.wait_for_function('Prismatic.stats.draws>0&&Prismatic.stats.active')
   check(any(m['transmission']>.8 and m['dispersion']>0 for m in materials(page)),'Crystal+ enables real scene transmission and color dispersion')
   page.screenshot(path=str(OUT/'crystal-refraction.png'))
   check(pose(page)==frozen,'The refractive option remains a presentation-only change')
   for _ in range(2):
    page.locator('#prism-options').click();page.locator('#prism-look').select_option('classic');page.locator('#prism-look').select_option('prismatic');page.locator('#prism-close').click();page.wait_for_function('Prismatic.stats.draws>0')
   check(page.evaluate('__merged.scene.getObjectsByProperty("name","Prismatic render-only layer").length===1'),'Repeated look switches keep exactly one effects layer')
   check(page.evaluate('Prismatic.stats.installs-Prismatic.stats.disposed===1'),'Replaced effect layers release their owned resources')
   check(page.evaluate('JSON.stringify(tracks.map(t=>t.pts))')==rails and page.evaluate('levelCode()')==saved,'Material changes preserve every collision point and the complete native document')
   page.emulate_media(reduced_motion='reduce');page.wait_for_function('Prismatic.stats.clock===0');check(page.evaluate('Prismatic.stats.particles===0'),'Reduced motion suppresses shader animation and contact particles')
   page.emulate_media(reduced_motion='no-preference');page.locator('#prism-options').click();page.locator('#prism-motion').uncheck();page.locator('#prism-glow').uncheck();page.locator('#prism-close').click()
   check(page.evaluate('!Prismatic.settings.motion&&!Prismatic.settings.glow'),'Motion and sparkle choices are explicit independent controls')
   page.screenshot(path=str(OUT/'quiet-materials.png'))
   page.locator('#delivery-pause [data-delivery="resume"]').click();page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active')
   check(page.evaluate('levelCode()')==original,'Create still restores the complete previous authoring blueprint')
   check(page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')==records,'Render settings and editing do not award campaign medals')
   page.set_viewport_size({'width':390,'height':844});page.locator('#route-workshop [data-mk="exit"]').click();page.locator('#prism-options').click()
   check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Graphics controls fit a phone-width viewport')
   page.screenshot(path=str(OUT/'materials-mobile.png'));page.locator('#prism-close').click()
   result={'baseline':baseline,'final':snapshot(page),'physicalMaterials':data}
  else:
   page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('player.x>=320',timeout=180000);page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="m0"');page.keyboard.up('Space')
   page.wait_for_function('player.track?.sky.id==="m2"',timeout=300000)
   check(page.evaluate('Prismatic.stats.effects.railCatch>=2'),'Contact sparkles react to real catches along the authored route')
   page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused');page.locator('#flow-study-toggle').click();page.screenshot(path=str(OUT/'prismatic-clocktower.png'))
   frozen=pose(page);clock=page.evaluate('Prismatic.stats.clock');page.wait_for_timeout(250);check(pose(page)==frozen and page.evaluate('Prismatic.stats.clock')==clock,'Pause freezes both gameplay and shader-animation time')
   check(page.evaluate('Prismatic.stats.particles<=PrismCore.LIMITS.particles'),'Special effects stay within the fixed particle budget')
   page.locator('#delivery-pause [data-delivery="resume"]').click();page.locator('#cv').focus();page.keyboard.down('KeyD')
   page.wait_for_function('won',timeout=1000000);page.keyboard.up('KeyD');result=snapshot(page)
   if page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
   check(result['won'] and result['tries']==1 and result['deliveries']==0,'The entire authored high line still finishes first attempt with no required deliveries')
   page.screenshot(path=str(OUT/'prismatic-finish.png'))
  check(not errors,'No uncaught exception in the real browser')
  bad=[m for m in gpu if any(s in m for s in ['GL_INVALID','VALIDATION','Shader Error','shader error','Prismatic render pass:'])]
  check(not bad,'No detected shader compilation or GPU validation errors')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'checks':checks,'passed':len(checks),'errors':errors,'gpuErrors':bad,'result':result,'scope':'Native HTTP/software WebGL. Actual controls, no player/score/physics writes. Not a physical-phone or WebGPU performance certification.'},indent=2))
 except Exception as e:
  try:detail=snapshot(page)
  except:detail=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'gpu':gpu[-20:],'state':detail},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:c.close();browser.close()
