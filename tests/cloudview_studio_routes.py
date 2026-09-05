"""Native HTTP 3D replay. Control uses buttons and DOM keyboard events only.
The input controller reads the rendered-frame state and emits ordinary keyboard
events through the canvas. It never writes position, velocity, keys, tracks,
score or progress. This removes remote-command latency from the detour input.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output'/'cloudview-studio-routes';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
REPLAY_SECONDS=300
checks=[];runs=[];errors=[];console_errors=[];last={}
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def status(page):
 return page.evaluate('''()=>{const s=__sky.state,p=player,t=p?.track,k=t?.sky;return {won,tries,deliveries,routeQuota,stage:k?.stage,phase:k?(p.trackS/t.len-k.begin)/(k.end-k.begin):-1,armed:s.armed,from:s.from,airFrames:s.airFrames,loops:[...s.completed],transfers:s.transfers,launches:s.launches,catches:s.catches,steps:s.steps,dead:p?.dead,menu:__delivery.state.menu,backend:__merged.renderer.backend.constructor.name,three:__merged.get3D(),view:__delivery.state.view};}''')
def start_input(page,route):
 page.evaluate('''route=>{
   window.__skyReplayInput?.stop();
   const target=document.getElementById('cv'),events=[];
   let running=true,braking=false,frame=0;
   const names={KeyD:'d',KeyA:'a',Space:' '};
   function key(code,down){
     target.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,key:names[code],bubbles:true,cancelable:true}));
     events.push({step:__sky.state.steps,code,down});
   }
   function poll(){
     if(!running)return;
     const s=__sky.state,p=player,t=p?.track,k=t?.sky;
     if(__sky.active()&&!__delivery.paused&&!won&&p.dead<=0){
       const brake=route===1&&s.from==='loop-1'&&s.airFrames<55;
       if(brake!==braking){braking=brake;key(brake?'KeyD':'KeyA',false);key(brake?'KeyA':'KeyD',true);}
       const phase=k?(p.trackS/t.len-k.begin)/(k.end-k.begin):-1;
       if(phase>=.64&&phase<.96&&!s.armed){key('Space',true);key('Space',false);}
     }
     frame=requestAnimationFrame(poll);
   }
   window.__skyReplayInput={events,stop(){if(!running)return;running=false;cancelAnimationFrame(frame);key('KeyA',false);key('KeyD',false);key('Space',false);}};
   frame=requestAnimationFrame(poll);
 }''',route)
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
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/cloudview-studio/index.html',wait_until='domcontentloaded');page.wait_for_function('!!window.__sky&&window.__gpuReady===true',timeout=90000)
  check(page.locator('[data-course]').count()==3,'Three loop-first routes appear in the main game menu')
  check('Rocket' in page.locator('#delivery-menu h1').inner_text(),'The default menu presents the sky loop game')
  original=page.evaluate('levelCode()');page.screenshot(path=str(OUT/'menu-3d.png'))
  for route,count in [(0,4),(1,5),(2,6)]:
   if route:page.locator('#delivery-header [data-delivery="routes"]').click()
   page.locator(f'[data-course="{route}"]').click();page.locator('#cv').focus()
   page.wait_for_function('mode==="play"&&player.track?.sky&&__sky.state.steps>0')
   check(page.evaluate('__merged.get3D()&&__delivery.state.view==="3d"'),'Route '+str(route+1)+' stays in the actual 3D renderer')
   check(page.evaluate('!__merged.trackGroup.visible&&!__merged.curveGroup.visible'),'Legacy duplicate rails do not cover the volumetric sky rails')
   start_input(page,route);page.keyboard.down('KeyD');page.keyboard.down('KeyC')
   saved=False;start=time.monotonic();last={};logged=-1
   while time.monotonic()-start<REPLAY_SECONDS:
    st=status(page);last=st
    bucket=int((time.monotonic()-start)//20)
    if bucket!=logged:logged=bucket;print('REPLAY:',route+1,round(time.monotonic()-start,1),json.dumps(st),flush=True)
    if st['won']:break
    if st['transfers']>=1 and not saved:
     page.screenshot(path=str(OUT/f'route-{route+1}-transfer.png'));saved=True
    if st['tries']>2:raise AssertionError('Replay repeatedly missed a receiving rail: '+json.dumps(st))
    page.wait_for_timeout(100)
   page.evaluate('__skyReplayInput.stop()');inputs=page.evaluate('__skyReplayInput.events')
   page.keyboard.up('KeyA');page.keyboard.up('KeyD');page.keyboard.up('KeyC');page.keyboard.up('Space')
   check(last.get('won'),'Route '+str(route+1)+' completes from spawn using keyboard controls')
   check(len(last['loops'])==count and last['transfers']>=count-1,'Route '+str(route+1)+' traverses every loop and its open-air transfers')
   check(last['tries']==1,'Route '+str(route+1)+' completes without a death, checkpoint jump or teleport')
   check(last['deliveries']>=last['routeQuota'],'Route '+str(route+1)+' delivers real projectiles during flight')
   check(page.evaluate('!!JSON.parse(localStorage.getItem("svgn_delivery_records_v1")||"{}")[SkyRoutes.specs[__delivery.state.route].id]'),'Completed sky route saves its medal')
   events=page.evaluate('__sky.state.events')
   if route==1:check(any(e.get('to')=='loop-2-low' for e in events),'The lower detour is traversed and reconnects during a complete 3D run')
   runs.append({'route':route,'wall_seconds':round(time.monotonic()-start,2),'result':last,'events':events,'keyboard_events':inputs});page.screenshot(path=str(OUT/f'route-{route+1}-complete.png'))
   check(all(e['airFrames']>3 for e in events if e['type']=='transfer'),'Transfers include actual detached ballistic frames')
  check(not errors,'No uncaught errors during all three full 3D playthroughs')
  # No replay controller for this negative case: held right alone cannot exit.
  page.locator('#delivery-header [data-delivery="routes"]').click();page.locator('[data-course="0"]').click();page.locator('#cv').focus();page.keyboard.down('KeyD')
  page.wait_for_function('__sky.state.events.filter(e=>e.type==="lap").length>=3',timeout=120000);page.keyboard.up('KeyD')
  st=status(page);check(not st['won'] and st['launches']==0 and len(st['loops'])==1,'Holding right alone cannot leave the loop or win the course')
  page.keyboard.press('KeyP');before=status(page)['steps'];page.wait_for_timeout(350)
  check(status(page)['steps']==before,'Pause freezes loop simulation')
  page.locator('#delivery-pause [data-delivery="resume"]').click()
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
  report={'passed':len(checks),'checks':checks,'runs':runs,'route_wall_limit_seconds':REPLAY_SECONDS,'uncaught_errors':errors,'gpu_errors':fatal,'renderer':'Actual WebGPURenderer, software WebGL backend in CI','scope':'Automated normal-input replay. Buttons and keyboard events use the production event handlers. A frame-synchronized controller emits Space/A/D events to remove remote-command latency. It never assigns player position, velocity, keys, track, score, progress, or calls the simulation step. Input events are recorded per route. The 300-second wall ceiling accommodates software rendering; this is not a hardware/performance benchmark.'}
  (OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps({'passed':len(checks),'routes_completed':len(runs)}))
 except Exception as e:
  inputs=[]
  try:inputs=page.evaluate('__skyReplayInput?.events||[]')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'last_state':last,'keyboard_events':inputs,'checks':checks,'errors':errors,'console_errors':console_errors[-25:],'runs':runs},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:context.close();browser.close()
