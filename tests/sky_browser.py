"""Real HTTP / 3D end-to-end input replays, not a teleporting physics fixture.
All game control uses buttons and keyboard events. State is read-only in tests.
External account services are blocked and audio starts muted.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output'/'sky';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];runs=[];errors=[];console_errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def status(page):
 return page.evaluate('''()=>{const s=__sky.state,p=player,t=p?.track,k=t?.sky;return {won,tries,deliveries,routeQuota,stage:k?.stage,phase:k?(p.trackS/t.len-k.begin)/(k.end-k.begin):-1,armed:s.armed,loops:[...s.completed],transfers:s.transfers,launches:s.launches,catches:s.catches,steps:s.steps,dead:p?.dead,menu:__delivery.state.menu,backend:__merged.renderer.backend.constructor.name,three:__merged.get3D(),view:__delivery.state.view};}''')
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**kw)
 context=browser.new_context(viewport={'width':1280,'height':800},record_video_dir=str(OUT/'videos'),record_video_size={'width':1280,'height':800},service_workers='block')
 context.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname
 context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console_errors.append(m.text) if m.type=='error' else None)
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('!!window.__sky&&window.__gpuReady===true',timeout=90000)
  check(page.locator('[data-course]').count()==3,'Three loop-first routes appear in the main game menu')
  check('Rocket' in page.locator('#delivery-menu h1').inner_text(),'The default menu presents the sky loop game')
  original=page.evaluate('levelCode()');page.screenshot(path=str(OUT/'menu-3d.png'))
  for route,count in [(0,4),(1,5),(2,6)]:
   if route:page.locator('#delivery-header [data-delivery="routes"]').click()
   page.locator(f'[data-course="{route}"]').click();page.locator('#cv').focus()
   page.wait_for_function('mode==="play"&&player.track?.sky&&__sky.state.steps>0')
   check(page.evaluate('__merged.get3D()&&__delivery.state.view==="3d"'),'Route '+str(route+1)+' stays in the actual 3D renderer')
   page.keyboard.down('KeyD');page.keyboard.down('KeyC')
   saved=False;start=time.monotonic();last={}
   while time.monotonic()-start<150:
    st=status(page);last=st
    if st['won']:break
    if st['phase']>=.64 and st['phase']<.96 and not st['armed']:
     page.keyboard.press('Space',delay=70)
    if st['transfers']>=1 and not saved:
     page.screenshot(path=str(OUT/f'route-{route+1}-transfer.png'));saved=True
    if st['tries']>2:raise AssertionError('Replay repeatedly missed a receiving rail: '+json.dumps(st))
    page.wait_for_timeout(35)
   page.keyboard.up('KeyD');page.keyboard.up('KeyC');page.keyboard.up('Space')
   check(last.get('won'),'Route '+str(route+1)+' completes from spawn using ordinary controls')
   check(len(last['loops'])==count and last['transfers']>=count-1,'Route '+str(route+1)+' traverses every loop and its open-air transfers')
   check(last['tries']==1,'Route '+str(route+1)+' completes without a death, checkpoint jump or teleport')
   check(last['deliveries']>=last['routeQuota'],'Route '+str(route+1)+' delivers real projectiles during flight')
   events=page.evaluate('__sky.state.events');runs.append({'route':route,'result':last,'events':events});page.screenshot(path=str(OUT/f'route-{route+1}-complete.png'))
   check(all(e['airFrames']>3 for e in events if e['type']=='transfer'),'Transfers include actual detached ballistic frames')
  check(not errors,'No uncaught errors during all three full 3D playthroughs')
  # A right-only run must not bypass the defining launch mechanic.
  page.locator('#delivery-header [data-delivery="routes"]').click();page.locator('[data-course="0"]').click();page.locator('#cv').focus();page.keyboard.down('KeyD')
  page.wait_for_function('__sky.state.events.filter(e=>e.type==="lap").length>=3',timeout=50000);page.keyboard.up('KeyD')
  st=status(page);check(not st['won'] and st['launches']==0 and len(st['loops'])==1,'Holding right alone cannot leave the loop or win the course')
  # Pause must freeze physics; resume must preserve input focus.
  page.keyboard.press('KeyP');before=status(page)['steps'];page.wait_for_timeout(350)
  check(status(page)['steps']==before,'Pause freezes loop simulation')
  page.locator('#delivery-pause [data-delivery="resume"]').click()
  # The full original blueprint must be restored, not just its tile array.
  page.locator('#delivery-header [data-delivery="editor"]').click()
  check(page.evaluate('levelCode()')==original,'Create restores the complete pre-campaign blueprint')
  check(page.locator('#palette .pal').count()>50,'Original curve and tile editor is still available')
  page.locator('#delivery-header [data-delivery="routes"]').click();page.locator('[data-course="0"]').click()
  page.locator('#sky-edit-copy').click()
  check(page.evaluate('mode==="edit"&&customTracks.length===4'),'Edit route copy exposes all four sky rails in the existing editor')
  code=page.evaluate('levelCode()');meta=json.loads(__import__('base64').b64decode(code.split('.')[0]));check(len(meta.get('cm',[]))==4,'Saved sky blueprint retains launch and lap metadata')
  page.screenshot(path=str(OUT/'sky-editor.png'))
  fatal=[s for s in console_errors if any(x in s for x in ['VALIDATION','GL_INVALID','shader error','CommandBuffer','uniform buffer'])]
  check(not fatal,'3D replay emits no detected GPU validation errors')
  report={'passed':len(checks),'checks':checks,'runs':runs,'uncaught_errors':errors,'gpu_errors':fatal,'renderer':'Actual WebGPURenderer, software WebGL backend in CI','scope':'Recorded ordinary keyboard/button input from spawn to depot, without assigning player position, velocity, track, score, or progress. Not a performance benchmark or physical-device/gamepad audit.'}
  (OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps({'passed':len(checks),'routes_completed':len(runs)}))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console_errors':console_errors[-25:],'runs':runs},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:context.close();browser.close()
