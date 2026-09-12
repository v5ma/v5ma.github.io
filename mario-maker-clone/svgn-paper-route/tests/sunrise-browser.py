"""Native input acceptance, not fixture wins. 3D branch + journal inspection,
then complete routes in the game's normal 2D view. No player/score assignments.
"""
import functools,http.server,json,os,threading,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-cycle-sunrise'));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/mario-maker-clone/svgn-paper-route/'
checks=[];errors=[];runs=[];passed=False
PAD="window.testPad={id:'Standard input sample',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>testPad.connected?[testPad]:[]});"
def check(v,label):
 assert v,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':960,'height':720},device_scale_factor=1,service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':640,'height':480})
 context.add_init_script(PAD)
 context.add_init_script("localStorage.setItem('sunrise-preserve','keep');localStorage.setItem('svgn_delivery_records_v1',JSON.stringify({'canal-choices':{medal:'bronze',time:99,score:100}}));localStorage.setItem('sprocket_muted','1');")
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(90000)
 # All game libraries are vendored; optional outside account/font requests are
 # excluded from this offline-compatible browser acceptance environment.
 context.route('**/*',lambda r:r.continue_() if r.request.url.startswith((f'http://127.0.0.1:{server.server_port}/','blob:','data:')) else r.abort())
 def frames(n=2):page.evaluate('(n)=>new Promise(r=>{function tick(){if(--n<=0)r();else requestAnimationFrame(tick);}requestAnimationFrame(tick);})',n)
 def tap(i):
  frames();page.evaluate('(i)=>{testPad.buttons[i]={pressed:true,value:1};}',i);frames();page.evaluate('(i)=>{testPad.buttons[i]={pressed:false,value:0};}',i);frames()
 def seek(predicate):
  for _ in range(18):
   if page.evaluate(predicate):return
   tap(5)
  raise AssertionError('Controller could not reach '+predicate)
 def state():return page.evaluate('({x:player.x,y:player.y,vx:player.vx,vy:player.vy,tries,won,mode,route:__delivery.state.route,view:__delivery.state.view,phase:SkyCycleSunrise.run,seal:SkyCycleSunrise.records,visits:[...__network.state.visits],events:__network.state.events,groundSteps:__ground.state.steps,deliveries})')
 def finish(label):
  page.wait_for_function('won && __delivery.state.route===4',timeout=240000)
  page.keyboard.up('KeyD');page.keyboard.up('Space');page.keyboard.up('KeyA')
  if page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
  result=state();runs.append({'label':label,**result});(OUT/'runs.json').write_text(json.dumps(runs,indent=2))
  check(result['won'] and result['tries']==1,label+' completes without a checkpoint retry')
  page.screenshot(path=str(OUT/(label+'-finish.png')))
 try:
  page.goto(BASE,wait_until='domcontentloaded');page.bring_to_front()
  page.wait_for_function('!!window.SkyCycleCompass && !!window.SkyCycleSunrise && window.PaperDeliveryCampaign?.status==="ready" && window.__gpuReady===true')
  page.locator('[data-course="4"]').click();page.wait_for_function('!!SkyCycleSunrise.run && player.onGround')
  check(page.evaluate('tracks.some(t=>t.sky?.id==="sunrise-market") && tracks.length>=17'),'New practice balcony exists in the real collision world')
  check(page.evaluate('__sky.state.data.gp.sunrise.version===1'),'Existing Sunrise chapter loads the new challenge')
  page.locator('#cv').focus();page.keyboard.down('KeyD')
  page.wait_for_function('player.x>=1630 && player.onGround && !player.track',timeout=180000)
  page.keyboard.down('Space')
  page.wait_for_function('player.track?.sky.id==="sunrise-market"',timeout=45000)
  page.keyboard.up('Space')
  check(True,'A normal road jump reaches the optional market balcony')
  page.screenshot(path=str(OUT/'market-balcony-3d.png'))
  page.wait_for_function('SkyCycleSunrise.run?.landed',timeout=90000)
  check(page.evaluate('!player.track && !player.peg && SkyCycleSunrise.run.landed'),'Real rail momentum returns the rider to the market road')
  page.keyboard.up('KeyD');tap(8)
  seek('document.activeElement.id==="sc-journal-deck"');tap(0)
  check(page.evaluate('document.getElementById("sc-journal").open && __delivery.paused'),'Controller opens the challenge journal with gameplay paused')
  check(page.locator('#sunrise-mission').inner_text().count('DONE /')==2,'Journal shows riding and landing done before the real finish')
  # Observe render calls only; never suppress them or alter simulation.
  page.evaluate('(()=>{const r=__merged.renderer.render;window.sunriseRenderCalls=0;__merged.renderer.render=function(...args){sunriseRenderCalls++;return r.apply(this,args);};})()')
  frames(12);check(page.evaluate('sunriseRenderCalls<=1'),'Paused journal reuses the 3D scene instead of rerendering it every frame')
  seek('document.activeElement.id==="sc-guidance"');tap(0)
  check(page.evaluate('SkyCycleCompass.preference==="compact"'),'Controller reaches guidance before the long discovery list')
  tap(0);tap(0)
  page.screenshot(path=str(OUT/'market-journal.png'))
  page.set_viewport_size({'width':390,'height':844});frames(3)
  check(page.evaluate('(()=>{const r=document.getElementById("sc-journal").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()'),'Challenge journal fits a narrow viewport')
  page.screenshot(path=str(OUT/'market-journal-mobile.png'))
  page.set_viewport_size({'width':960,'height':720});tap(1);tap(1)
  check(page.evaluate('!__delivery.paused && !document.querySelector("dialog[open]")'),'Controller backs out to the same live route')
  page.locator('#delivery-header [data-delivery="view"]').click()
  check(page.evaluate('__delivery.state.view==="2d"'),'Remaining full-route coverage uses the supported 2D view')
  page.locator('#cv').focus();page.keyboard.down('KeyD');finish('market-detour')
  check(page.evaluate('SkyCycleSunrise.records.marketPilot && SkyCycleSunrise.records.finishes===1'),'Accepted native finish banks one Market Pilot seal')
  for label,coast in [('road-direct',False),('road-coasting',True)]:
   page.locator('#delivery-results [data-delivery="retry"]').click();page.wait_for_function('!won && !!SkyCycleSunrise.run');page.locator('#cv').focus();page.keyboard.down('KeyD')
   if coast:
    for _ in range(8):
     page.wait_for_timeout(700);page.keyboard.up('KeyD');page.wait_for_timeout(350);page.keyboard.down('KeyD')
   finish(label)
   check(not runs[-1]['visits'],label+' stays on the original lower road')
  check(page.evaluate('SkyCycleSunrise.records.finishes===1'),'Road-only replays preserve but do not duplicate the optional reward')
  check(page.evaluate('JSON.parse(localStorage.getItem("svgn_delivery_records_v1"))["canal-choices"].time===99 && localStorage.getItem("sunrise-preserve")==="keep"'),'Other route progress and unrelated saved data remain intact')
  # A fresh page must recover the earned seal from the new independent key.
  page.reload(wait_until='domcontentloaded');page.wait_for_function('!!window.SkyCycleSunrise && !!window.SkyCycleCompass')
  check(page.evaluate('SkyCycleSunrise.records.marketPilot && SkyCycleSunrise.records.finishes===1'),'Market Pilot persists across a real page reload')
  check(not errors,'No uncaught JavaScript exceptions');passed=True
 except Exception as e:
  try:(OUT/'failure.json').write_text(json.dumps({'error':str(e),'state':state(),'checks':checks,'errors':errors},indent=2));page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':os.getenv('GITHUB_SHA'),'passed':passed,'checks':checks,'errors':errors,'coverage':'Real 3D branch traversal and controller journal; three complete native-engine routes using supported 2D view for their remainder. Standard Gamepad samples and ordinary keyboard/button input only; no debug wins, player-state or score assignments. Not physical-device or performance certification.'},indent=2))
  context.close();browser.close();server.shutdown()
