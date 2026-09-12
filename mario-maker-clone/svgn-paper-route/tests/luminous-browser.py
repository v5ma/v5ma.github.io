"""Exact-source native shaders, controller controls and live road traversal.
No assignments to player state, geometry, physics, score, or route completion.
A storage failure is injected only in the final explicitly labeled UI check.
"""
import functools,http.server,json,os,threading,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-cycle-luminous'));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/'
PAD="window.testPad={id:'Standard controller test input',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>testPad.connected?[testPad]:[]});"
checks=[];errors=[];console=[];passed=False;samples={}
def check(value,label):
 assert value,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':960,'height':720},service_workers='block')
 context.add_init_script(PAD)
 context.add_init_script("localStorage.setItem('luminous-preserve','keep');localStorage.setItem('sprocket_muted','1');")
 context.route('**/*',lambda r:r.continue_() if r.request.url.startswith((BASE,'data:','blob:')) else r.abort())
 page=context.new_page();page.set_default_timeout(120000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def frames():page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
 def tap(i):
  frames();page.evaluate('(i)=>testPad.buttons[i]={pressed:true,value:1}',i);frames();page.evaluate('(i)=>testPad.buttons[i]={pressed:false,value:0}',i);frames()
 def seek(pred):
  for _ in range(30):
   if page.evaluate(pred):return
   tap(5)
  raise AssertionError('Controller cannot reach '+pred)
 def pose():return page.evaluate('JSON.stringify({x:player.x,y:player.y,vx:player.vx,vy:player.vy,score,deliveries,tries,steps:__sky.state.steps})')
 def stats():return page.evaluate('({prism:Prismatic.stats,prefs:Prismatic.settings,version:PaperDeliveryRelease.version,backend:__merged.renderer.backend.constructor.name})')
 def choose(value):page.locator('#luminous-finish').select_option(value);page.wait_for_function('(v)=>Prismatic.settings.luminous.finish===v',arg=value);frames()
 try:
  page.goto(BASE+'mario-maker-clone/svgn-paper-route/',wait_until='domcontentloaded');page.bring_to_front()
  page.wait_for_function('window.PrismaticReady && window.SkyCycleCompass && PaperDeliveryCampaign.status==="ready" && window.__gpuReady')
  page.locator('[data-course="4"]').click();page.wait_for_function('player.onGround && Prismatic.stats.active && Prismatic.stats.luminous?.draws>0')
  check(page.evaluate('PaperDeliveryRelease.version==="0.19.0" && __delivery.state.view==="3d"'),'v0.19 initializes in the existing native 3D game')
  check(page.evaluate('Prismatic.settings.luminous.finish==="subtle"'),'The default shader finish is Subtle')
  check(page.evaluate('Prismatic.stats.luminous.railMaterials===2 && Prismatic.stats.luminous.skyDraws>0'),'Physical thin-film materials and sky silk render in the real scene')
  page.locator('#cv').focus();page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused')
  frozen=pose();code=page.evaluate('levelCode()');rails=page.evaluate('JSON.stringify(tracks.map(t=>t.pts))');saved=page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')
  page.screenshot(path=str(OUT/'subtle-start.png'));samples['subtle']=stats()
  page.locator('#prism-options').click();choose('vivid');page.screenshot(path=str(OUT/'vivid-settings.png'))
  check(pose()==frozen,'Switching shader finishes preserves position, velocity, score and simulation time')
  check(page.evaluate('Prismatic.stats.luminous.extraDraws<=7'),'The shader layer stays within its seven-object draw budget')
  choose('off');check(page.evaluate('Prismatic.stats.luminous.extraDraws===0 && Prismatic.stats.active'),'Off removes new shaders without removing the previous Prismatic presentation')
  page.locator('#prism-look').select_option('classic');frames();check(page.evaluate('!Prismatic.stats.active && !document.querySelector("#prism-panel").hidden'),'Classic restores original materials')
  page.locator('#prism-look').select_option('prismatic');choose('vivid')
  for _ in range(2):choose('off');choose('vivid')
  check(page.evaluate('__merged.scene.getObjectsByProperty("name","Prismatic render-only layer").length===1 && Prismatic.stats.installs-Prismatic.stats.disposed===1'),'Repeated changes release old resources and keep one effects layer')
  page.locator('#luminous-water').uncheck();frames();check(page.evaluate('Prismatic.stats.luminous.waterCount===0 && Prismatic.stats.luminous.skyCount===1'),'Water can be disabled independently')
  page.locator('#luminous-water').check();page.locator('#luminous-sky').uncheck();frames();check(page.evaluate('Prismatic.stats.luminous.skyCount===0 && Prismatic.stats.luminous.waterCount>0'),'Sky can be disabled independently')
  page.locator('#luminous-sky').check();page.emulate_media(reduced_motion='reduce');page.wait_for_function('Prismatic.stats.clock===0')
  check(page.evaluate('Prismatic.stats.particles===0'),'Reduced motion stops shader animation and contact particles')
  page.emulate_media(reduced_motion='no-preference');page.locator('#prism-motion').uncheck();frames();check(page.evaluate('Prismatic.stats.clock===0'),'The existing motion checkbox also freezes new shaders')
  page.locator('#prism-motion').check();choose('subtle');page.locator('#prism-close').click();check(page.evaluate('__delivery.paused'),'Closing graphics settings retains a pre-existing pause')
  check(page.evaluate('levelCode()')==code and page.evaluate('JSON.stringify(tracks.map(t=>t.pts))')==rails,'All authored data and every collision point are unchanged by shaders')
  check(page.evaluate('localStorage.getItem("svgn_delivery_records_v1")')==saved,'Graphics switches do not award or rewrite delivery progress')
  page.locator('#delivery-header [data-delivery="view"]').click();page.locator('#delivery-pause [data-delivery="resume"]').click()
  page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('player.x>=5650 && player.onGround',timeout=180000);page.keyboard.up('KeyD')
  page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused');page.locator('#delivery-header [data-delivery="view"]').click()
  page.wait_for_function('Prismatic.stats.luminous.waterDraws>0');page.screenshot(path=str(OUT/'canal-subtle.png'));samples['canal']=stats()
  check(page.evaluate('__delivery.state.view==="3d" && Prismatic.stats.luminous.waterDraws>0'),'Procedural water actually draws at the canal reached with native input')
  frozen=pose();tap(8);seek('document.activeElement.id==="prism-deck"');tap(0)
  check(page.evaluate('SkyCycleFlightDeck.topPanel().id==="prism-panel" && __delivery.paused'),'Controller opens Materials & FX as the top nested dialog')
  seek('document.activeElement.id==="luminous-finish"');tap(15)
  check(page.evaluate('Prismatic.settings.luminous.finish==="vivid"'),'Controller adjusts the shader finish using the D-pad')
  before=page.evaluate('Prismatic.stats.draws');frames();check(page.evaluate('Prismatic.stats.draws')>before,'Nested graphics preview keeps rendering beneath the paused parent dialog')
  seek('document.activeElement.id==="luminous-water"');tap(0)
  check(page.evaluate('!Prismatic.settings.luminous.water'),'Controller toggles individual shader effects')
  tap(0);tap(1)
  check(page.evaluate('document.getElementById("flight-deck").open && !document.getElementById("prism-panel").open && __delivery.paused'),'B closes only the graphics dialog and returns to the paused parent')
  tap(1);page.screenshot(path=str(OUT/'canal-vivid.png'));check(pose()==frozen,'Controller graphics navigation never advances the paused route')
  page.locator('#prism-pause').click();page.set_viewport_size({'width':390,'height':844});frames();page.screenshot(path=str(OUT/'graphics-mobile.png'))
  check(page.evaluate('(()=>{const r=document.getElementById("prism-panel").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()'),'Graphics options fit the narrow viewport')
  page.set_viewport_size({'width':960,'height':720});page.locator('#prism-close').click()
  page.locator('#delivery-header [data-delivery="view"]').click();page.locator('#delivery-pause [data-delivery="resume"]').click()
  page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('won',timeout=180000);page.keyboard.up('KeyD')
  if page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
  check(page.evaluate('won && tries===1 && __delivery.state.route===4'),'The native route still completes first attempt after shader and controller changes')
  page.screenshot(path=str(OUT/'finish.png'))
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.PrismaticReady && window.SkyCycleCompass')
  check(page.evaluate('Prismatic.settings.luminous.finish==="vivid" && Prismatic.settings.luminous.water'),'Shader preferences persist across reload')
  check(page.evaluate('localStorage.getItem("luminous-preserve")==="keep"'),'Unrelated stored data remains intact')
  page.locator('#prism-options').click()
  page.evaluate("(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='svgn.skycycle.luminous.v1')throw new DOMException('Test quota','QuotaExceededError');return original.call(this,k,v);};})()")
  choose('subtle');check('session only' in page.locator('#luminous-status').inner_text(),'Injected storage failure is disclosed instead of claiming settings were saved')
  bad=[m for m in console if any(s.lower() in m.lower() for s in ['shader error','validation error','gl_invalid','prismatic render pass:','tsl:'])]
  check(not errors,'No uncaught JavaScript exceptions');check(not bad,'No detected shader compiler or GPU validation errors')
  passed=True
 finally:
  if not passed:
   try:page.screenshot(path=str(OUT/'failure.png'));samples['failure']=stats()
   except Exception:pass
  (OUT/'report.json').write_text(json.dumps({'commit':os.getenv('GITHUB_SHA'),'passed':passed,'checks':checks,'errors':errors,'consoleErrors':console,'samples':samples,'coverage':'Software WebGL shader rendering in native 3D; ordinary 2D movement for complete road coverage. Standard Gamepad samples, not physical Xbox hardware. No native WebGPU or performance certification.'},indent=2))
  context.close();browser.close();server.shutdown()
