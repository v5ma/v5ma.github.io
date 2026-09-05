"""Cloudview: native HTTP render proof and ordinary-input loop flight.
No teleporting, physics-state assignments, or mocked renderers. This checks the
actual application; reference illustrations are not loaded by it.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-output/cloudview';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[];requests=[]
def check(v,name):
 assert v,name
 checks.append(name);print('PASS:',name,flush=True)
with sync_playwright() as p:
 options={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**options)
 context=browser.new_context(viewport={'width':1440,'height':900},record_video_dir=str(OUT/'video'),record_video_size={'width':1440,'height':900},service_workers='block')
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname
 context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('request',lambda r:requests.append(r.url))
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
  page.wait_for_function('!!window.__cloudview&&window.__gpuReady===true',timeout=90000)
  page.screenshot(path=str(OUT/'01-menu.png'),timeout=45000)
  page.locator('[data-course="0"]').click(timeout=90000);page.locator('#cv').focus()
  page.wait_for_function('!!window.__sky?.active()&&window.__cloudview?.stats.rails===4',timeout=30000)
  page.wait_for_function('document.body.classList.contains("cloudview-active")',timeout=30000)
  stats=page.evaluate('__cloudview.stats');check(stats['goldPlates']>80,'Mechanical gold plates replace the bare rails');check(stats['islands']>=8 and stats['waterfalls']>=4,'Floating islands and waterfalls are real scene geometry')
  check(page.evaluate('__cloudview.hero.group.visible&&!__merged.activePose.visible'),'Detailed courier and jet bike replace the original tiny voxel pose')
  check(page.locator('#cloud-hud').is_visible(),'Live arcade HUD is visible')
  check(page.evaluate('document.getElementById("cloud-deliveries").textContent===deliveries+" / "+routeQuota'),'Delivery HUD uses actual game state')
  check(page.evaluate('__merged.gpuLimitAudit().ok'),'GPU instance-buffer limits remain respected')
  finite=page.evaluate('''()=>{let valid=true;__cloudview.root.traverse(o=>{const a=o.geometry?.getAttribute('position')?.array;if(a)for(const x of a)if(!Number.isFinite(x))valid=false;});return valid;}''')
  check(finite,'All generated geometry has finite coordinates')
  page.screenshot(path=str(OUT/'02-playable-world.png'),timeout=45000)
  page.locator('#gl').screenshot(path=str(OUT/'03-real-renderer.png'),timeout=45000)
  im=Image.open(OUT/'03-real-renderer.png').convert('RGB').resize((200,120));check(len(set(im.getdata()))>900,'Actual rendered world has visible multicolor detail')
  page.keyboard.down('KeyD');page.keyboard.down('KeyC');start=time.monotonic();recorded=False;frames=[]
  while time.monotonic()-start<180:
   s=page.evaluate('''()=>{const p=player,t=p.track,k=t?.sky;return {phase:k?(p.trackS/t.len-k.begin)/(k.end-k.begin):-1,armed:__sky.state.armed,transfers:__sky.state.transfers,launches:__sky.state.launches,loops:[...__sky.state.completed],steps:__sky.state.steps,tries,deliveries};}''');frames.append(s)
   if s['transfers']>=1:break
   if s['phase']>=.64 and s['phase']<.96 and not s['armed']:page.keyboard.press('Space',delay=80)
   if s['launches']>=1 and not recorded:
    page.screenshot(path=str(OUT/'04-airborne.png'),timeout=45000);recorded=True
   page.wait_for_timeout(50)
  page.keyboard.up('KeyD');page.keyboard.up('KeyC');page.keyboard.up('Space')
  state=page.evaluate('({loops:[...__sky.state.completed],transfers:__sky.state.transfers,launches:__sky.state.launches,tries,deliveries,three:__merged.get3D(),events:__sky.state.events})')
  check(state['three'] and state['transfers']>=1 and state['tries']==1,'Normal controls complete a lap, launch and receiving-rail catch in the new graphics')
  check(state['deliveries']>=1,'A thrown paper hits the mailbox with the new postal model')
  page.screenshot(path=str(OUT/'05-catch.png'),timeout=45000)
  page.keyboard.press('KeyP');before=page.evaluate('__sky.state.steps');page.wait_for_timeout(400);check(page.evaluate('__sky.state.steps')==before,'Pause still freezes physics');page.locator('#delivery-pause [data-delivery="resume"]').click()
  check(not any('sky_high_delivery' in x or 'imagegen' in x or 'skybound_delivery' in x for x in requests),'No concept image is loaded as a fake game screen')
  check(not errors,'No uncaught exceptions in the new playable graphics')
  fatal=[x for x in console if any(k in x for k in ['GL_INVALID','CommandBuffer','shader error','uniform buffer'])];check(not fatal,'No detected GPU validation errors')
  # Responsive layout with real touch controls retained; no device performance claim.
  page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(500);page.screenshot(path=str(OUT/'06-mobile-layout.png'),timeout=45000)
  check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'HUD and controls fit a 390-pixel viewport')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'stats':stats,'flight':state,'errors':errors,'gpu_errors':fatal,'scope':'Native Chromium HTTP with actual software-WebGL rendering. All flight input is keyboard/button input. Not a hardware frame-rate claim or pixel identity with the concept illustration.'},indent=2))
 except Exception as e:
  diagnostic=None
  try:diagnostic=page.evaluate('({art:window.__cloudview?.stats,sky:window.__sky?.state.steps,gpu:window.__gpuReady,mode:window.__delivery?.state.view})');page.screenshot(path=str(OUT/'failure.png'),timeout=20000)
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console[-20:],'diagnostic':diagnostic},indent=2));raise
 finally:context.close();browser.close()
