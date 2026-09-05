"""Real HTTP, actual 3D, ordinary inputs. Ground completion is a positive test,
not an alleged bypass. Player position/velocity/progress are never assigned.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output/ground';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];runs=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
def state(page):
 return page.evaluate('({x:player.x,y:player.y,vx:player.vx,vy:player.vy,won,tries,deliveries,quota:routeQuota,onGround:player.onGround,track:player.track?.sky?.id,upper:__ground.state.upper.size,hooks:__grapple.state.hooks,steps:__ground.state.steps,ground:__ground.active()})')
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**kw);context=browser.new_context(viewport={'width':1280,'height':800},service_workers='block',record_video_dir=str(OUT/'video'))
 host=urlparse(BASE).hostname
 context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
  page.wait_for_function('!!window.__ground&&window.__gpuReady===true')
  check(page.locator('[data-course]:visible').count()==3,'Three approachable routes are shown before advanced trials')
  check(page.locator('[data-course]:visible').first.get_attribute('data-course')=='4','Level one is the neighborhood, not the expert sky course')
  original=page.evaluate('levelCode()');page.screenshot(path=str(OUT/'menu.png'))
  for i in [4,5,6]:
   if i==4:page.locator('[data-course="4"]').click()
   else:page.locator('#delivery-results [data-delivery="next"]').click()
   page.wait_for_function('(i)=>__delivery.state.route===i&&__ground.active()&&player.onGround',arg=i)
   check(page.evaluate('player.track===null'),'Intro '+str(i-3)+' begins on the road')
   check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'Intro '+str(i-3)+' uses real perspective 3D')
   page.screenshot(path=str(OUT/('start-'+str(i)+'.png')))
   page.locator('#cv').focus();page.keyboard.down('KeyD');page.keyboard.down('KeyC')
   page.wait_for_function('won',timeout=300000)
   page.keyboard.up('KeyD');page.keyboard.up('KeyC');q=state(page)
   check(q['won'] and q['tries']==1,'Intro '+str(i-3)+' finishes through ordinary road riding without a retry')
   check(q['upper']==0 and q['hooks']==0,'Intro '+str(i-3)+' requires neither an upper rail nor a grapple')
   check(q['deliveries']>=q['quota'],'Intro '+str(i-3)+' completes actual paper deliveries from the road')
   runs.append({'course':i,'state':q});page.screenshot(path=str(OUT/('road-'+str(i)+'.png')))
  page.locator('#delivery-header [data-delivery="routes"]').click();page.locator('[data-course="4"]').click();page.locator('#cv').focus()
  page.keyboard.down('KeyD');page.keyboard.down('KeyC');page.wait_for_function('player.x>=550',timeout=90000)
  page.keyboard.down('Space');page.wait_for_function('__ground.state.upper.size>0',timeout=60000);page.keyboard.up('Space')
  check(state(page)['upper']>0,'Jumping deliberately reaches a real optional upper rail')
  page.screenshot(path=str(OUT/'optional-upper.png'))
  page.wait_for_function('player.onGround&&!player.track&&player.x>950',timeout=60000)
  check(state(page)['tries']==1,'Leaving the upper ramp lands safely on the lower road')
  page.keyboard.up('KeyD');page.keyboard.up('KeyC')
  # Wait for the unchanged friction to advance in simulation time. A ten-second
  # wall-clock wait can be too short on software GPU, even when it is working.
  page.wait_for_function('Math.abs(player.vx)<.1',timeout=90000)
  x=state(page)['x'];page.keyboard.down('KeyA');page.wait_for_function('(x)=>player.x<x-40',arg=x);page.keyboard.up('KeyA')
  check(state(page)['x']<x-40,'A player can stop, turn around and explore instead of being forced forward')
  page.keyboard.press('KeyP');n=state(page)['steps'];page.wait_for_timeout(350);check(state(page)['steps']==n,'Pause freezes the introductory route')
  page.locator('#delivery-pause [data-delivery="resume"]').click();page.locator('#cv').focus()
  page.keyboard.down('KeyD');page.keyboard.down('KeyC');page.wait_for_function('won',timeout=180000);page.keyboard.up('KeyD');page.keyboard.up('KeyC')
  check(state(page)['tries']==1 and state(page)['upper']>0,'A run using the optional upper path also reaches the depot without a death')
  page.locator('#delivery-header [data-delivery="routes"]').click();page.locator('[data-course="4"]').click();page.locator('#cv').focus()
  before=state(page);page.keyboard.press('KeyR');page.wait_for_function('(n)=>tries===n+1',arg=before['tries'])
  check(state(page)['deliveries']==before['deliveries'],'Checkpoint retry retains the delivery state')
  page.locator('#delivery-header [data-delivery="editor"]').click();check(page.evaluate('levelCode()')==original,'The preceding full editor blueprint is preserved')
  page.on('dialog',lambda d:d.accept());page.locator('#beginner-blueprint').click()
  check(page.evaluate('mode==="edit"&&grid[60*LW]===T.STEEL&&customTracks.length===1'),'The real editor can start with a complete ground and optional ramp template')
  code=page.evaluate('levelCode()');meta=json.loads(__import__('base64').b64decode(code.split('.')[0]));check(meta['gp']['stages']==0,'Exported beginner level retains optional, not compulsory, upper-route rules')
  page.screenshot(path=str(OUT/'beginner-editor.png'))
  page.locator('#delivery-header [data-delivery="routes"]').click();page.locator('#advanced-routes-toggle').click()
  check(page.locator('[data-course]:visible').count()==7,'All previous advanced courses are still available without a lock')
  page.locator('[data-course="0"]').click();page.wait_for_function('!__ground.active()&&player.track?.sky&&__sky.state.data.stages===4')
  check(page.evaluate('__sky.state.data.stages===4&&routeQuota===2'),'Expert course loads with its own unchanged loop requirements')
  check(not errors,'No uncaught errors in the ground, optional-path, creator and expert-switch flow')
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'passed':len(checks),'runs':runs,'errors':errors,'scope':'Actual perspective WebGL replay using normal keys and UI. No player-state assignments. No physical-device performance claim.'},indent=2))
 except Exception as e:
  try:q=state(page)
  except:q=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':q,'runs':runs},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
