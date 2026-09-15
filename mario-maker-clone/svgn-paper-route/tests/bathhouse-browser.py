"""Play Tideglass with actual simulation, ordinary buttons/keys and sampled Gamepad input.
3D pool rendering, valve operation, live optional rail and genuine route finishes.
No player relocation, forced wins or gameplay-state assignments.
"""
import functools,http.server,json,os,threading,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-cycle-bathhouse'));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/mario-maker-clone/svgn-paper-route/'
PAD="window.testPad={id:'Standard controller input test',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>testPad.connected?[testPad]:[]});"
checks=[];errors=[];logs=[];runs=[];passed=False

def check(v,label):
 assert v,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':800,'height':600})
 ctx.add_init_script(PAD);ctx.add_init_script("if(!localStorage.getItem('bathhouse-preserve')){localStorage.setItem('bathhouse-preserve','keep');localStorage.setItem('svgn.skycycle.sunrise.v1',JSON.stringify({marketPilot:true,finishes:3}));}localStorage.setItem('sprocket_muted','1');")
 local=f'http://127.0.0.1:{server.server_port}/';ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith((local,'blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=2):page.evaluate('(n)=>new Promise(r=>{function next(){if(--n<=0)r();else requestAnimationFrame(next);}requestAnimationFrame(next);})',n)
 def tap(i):
  frames();page.evaluate('(i)=>testPad.buttons[i]={pressed:true,value:1}',i);frames();page.evaluate('(i)=>testPad.buttons[i]={pressed:false,value:0}',i);frames()
 def seek(target):
  for _ in range(30):
   if page.evaluate('(id)=>document.activeElement?.id===id',target):return
   tap(5)
  raise AssertionError('Controller cannot reach '+target)
 def sample():return page.evaluate('({x:player.x,y:player.y,won,tries,route:__delivery.state.route,view:__delivery.state.view,state:SkyCycleBathhouse.state,records:SkyCycleBathhouse.records,art:SkyCycleBathhouse.art,tracks:tracks.map(t=>t.sky?.id),progress:SkyCycleFlightDeck.records})')
 def view(v):
  if page.evaluate('__delivery.state.view')!=v:page.locator('#delivery-header [data-delivery="view"]').click()
 def pause():
  if not page.evaluate('__delivery.paused'):tap(9)
 def resume():
  if page.evaluate('__delivery.paused'):page.locator('#delivery-pause [data-delivery="resume"]').click()
 def finish(label):
  page.wait_for_function('won && __delivery.state.route===SkyCycleBathhouse.index',timeout=180000);page.keyboard.up('KeyD');runs.append({'label':label,**sample()});check(runs[-1]['tries']==1,label+' reaches the genuine finish without retries');page.screenshot(path=str(OUT/(label+'-finish.png')))
 try:
  page.goto(BASE+'?destination=tideglass-baths',wait_until='domcontentloaded');page.bring_to_front();page.wait_for_function('window.SkyCycleBathhouse?.state && player.onGround && SkyCycleBathhouse.art?.waterDraws>0')
  check(page.evaluate('PaperDeliveryRelease.version==="0.23.0" && __delivery.state.route===7'),'Direct destination link starts the appended Tideglass level')
  check(page.evaluate('DeliveryCampaign.routes.length===8 && DeliveryCampaign.routes[4].id==="first-neighborhood"'),'All seven old route indices remain intact')
  check(page.evaluate('SkyCycleBathhouse.art.pools===3 && SkyCycleBathhouse.art.tileDraws>0 && SkyCycleBathhouse.art.portalDraws>0'),'Three pools, tiled surfaces and animated portal materials draw in the real 3D scene')
  check(page.evaluate('!tracks.some(t=>t.sky?.id==="bathhouse-waterline")'),'Closed sluice does not expose the optional collision rail')
  page.wait_for_function('!document.getElementById("bathhouse-objective").hidden')
  # Wait for measured layout, not just visibility; keep the original 5-pixel clearance gate.
  page.wait_for_function('(()=>{const a=document.getElementById("bathhouse-objective").getBoundingClientRect(),b=document.querySelector("#cloud-hud .cloud-flight-status").getBoundingClientRect();return a.height>0&&b.height>0&&a.bottom+5<=b.top;})()',timeout=15000)
  check(True,'Destination objective does not cover existing riding instruments')
  page.screenshot(path=str(OUT/'tideglass-arrival-3d.png'))
  page.set_viewport_size({'width':390,'height':844})
  page.wait_for_function('(()=>{const a=document.getElementById("bathhouse-objective").getBoundingClientRect(),b=document.querySelector("#cloud-hud .cloud-flight-status").getBoundingClientRect();return a.height>0&&a.bottom+5<=b.top;})()')
  check(True,'Mobile objective also clears the raised riding HUD')
  page.screenshot(path=str(OUT/'tideglass-arrival-mobile.png'));page.set_viewport_size({'width':1100,'height':800})
  pause();seek('bathhouse-pause');tap(0);check(page.evaluate('document.getElementById("bathhouse-atlas").open'),'Controller opens Water Portal atlas from pause')
  page.set_viewport_size({'width':390,'height':844});frames();page.screenshot(path=str(OUT/'portal-atlas-mobile.png'))
  check(page.evaluate('(()=>{const r=document.getElementById("bathhouse-atlas").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()'),'Portal atlas fits a narrow viewport')
  page.set_viewport_size({'width':1100,'height':800});tap(1);check(page.evaluate('__delivery.paused && !document.getElementById("bathhouse-atlas").open'),'B returns to the paused parent without resuming')
  view('2d');resume();page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('player.x>=1710 && player.onGround');page.keyboard.up('KeyD');pause();view('3d');page.locator('#flow-study-toggle').click();page.screenshot(path=str(OUT/'mirror-pool-before.png'))
  code=page.evaluate('levelCode()');resume();tap(13);page.wait_for_function('SkyCycleBathhouse.state.opened');check(True,'D-pad Down operates the nearby brass sluice')
  pause();frozen=page.evaluate('SkyCycleBathhouse.state.drain');frames(12);check(page.evaluate('SkyCycleBathhouse.state.drain')==frozen,'Paused game freezes the water-level transition')
  resume();page.wait_for_function('SkyCycleBathhouse.state.drain===150 && SkyCycleBathhouse.art.waterDrop===128');check(page.evaluate('tracks.some(t=>t.sky?.id==="bathhouse-waterline") && SkyCycleBathhouse.art.railVisible'),'Draining the pool reveals the actual rideable waterline rail')
  check(page.evaluate('levelCode()')==code,'Operating the sluice does not rewrite the authored level or Workshop document')
  page.screenshot(path=str(OUT/'mirror-pool-drained.png'))
  view('2d');page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('player.x>=2135 && player.onGround');page.keyboard.down('Space');page.wait_for_function('player.track?.sky?.id==="bathhouse-waterline"');page.keyboard.up('Space');page.wait_for_function('SkyCycleBathhouse.state.rode');
  check(True,'Ordinary riding and jumping completes the waterline discovery')
  page.keyboard.up('KeyD');pause();view('3d');page.locator('#flow-study-toggle').click();page.screenshot(path=str(OUT/'waterline-3d.png'))
  check(page.evaluate('!SkyCycleBathhouse.records.keeper'),'Optional Keeper seal is not banked before finishing')
  view('2d');resume();page.locator('#cv').focus();page.keyboard.down('KeyD');finish('sluice-and-waterline')
  check(page.evaluate('SkyCycleBathhouse.records.keeper && SkyCycleBathhouse.records.visits===1'),'Accepted authored finish banks the Bathhouse Keeper seal')
  page.locator('#delivery-results [data-delivery="retry"]').click();page.wait_for_function('!won && SkyCycleBathhouse.state?.steps>0');check(page.evaluate('!SkyCycleBathhouse.state.opened && !tracks.some(t=>t.sky?.id==="bathhouse-waterline")'),'Replay resets the sluice while preserving banked records')
  page.locator('#cv').focus();page.keyboard.down('KeyD');finish('dry-promenade')
  check(not runs[-1]['state']['opened'] and not runs[-1]['state']['rode'],'The complete dry route works without opening the sluice or riding a rail')
  page.locator('#bathhouse-open').click();seek('bathhouse-return');tap(0);page.wait_for_function('__delivery.state.route===4 && !won');check(True,'Controller portal atlas returns to the existing Sunrise chapter')
  check(page.evaluate('JSON.parse(localStorage.getItem("svgn.skycycle.sunrise.v1")).finishes===3 && localStorage.getItem("bathhouse-preserve")==="keep"'),'Existing Market Pilot progress and unrelated storage survive travel')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.SkyCycleBathhouse?.state && __delivery.state.route===7');check(page.evaluate('SkyCycleBathhouse.records.visits===2 && SkyCycleBathhouse.records.keeper'),'Bathhouse visits and Keeper seal survive a real reload')
  check(not errors,'No uncaught JavaScript exceptions')
  shaderErrors=[x for x in logs if any(v in x.lower() for v in ['tsl:','shader error','validation error','gl_invalid'])];check(not shaderErrors,'No detected shader compilation or GPU validation errors')
  passed=True
 except Exception as exc:
  try:(OUT/'failure.json').write_text(json.dumps({'error':str(exc),'state':sample(),'errors':errors,'console':logs},indent=2));page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'passed':passed,'checks':checks,'runs':runs,'errors':errors,'console':logs,'coverage':'Native 3D pool/portal rendering and sluice operation; supported 2D movement for the full route and optional rail. Real accepted finishes. Sampled standard Gamepad controls, not physical Xbox hardware. No debug movement, teleport, score assignment or forced win.'},indent=2));ctx.close();browser.close();server.shutdown()
