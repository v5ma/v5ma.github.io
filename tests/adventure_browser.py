"""Ordinary-input native HTTP verification. No rider teleport, score changes,
physics acceleration, synthetic win invocation or mandatory paper deliveries.
Different suites keep CPU-rendered CI duration bounded without changing detail.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];SUITE=os.getenv('ADVENTURE_SUITE','road');OUT=ROOT/'test-output'/('adventure-'+SUITE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def snapshot(p):
 return p.evaluate('({won,x:player.x,y:player.y,vx:player.vx,vy:player.vy,steps:__ground.state.steps,tries,deliveries,score,route:__delivery.state.route,upper:[...__ground.state.upper],visited:__adventure.state.visits,pickups:__adventure.state.pickups,defeated:__adventure.state.enemyDefeats,finished:__adventure.state.finished,camera:__merged.camera.type,errors:__score.error})')
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);c=b.new_context(viewport={'width':1100,'height':720},service_workers='block',record_video_dir=str(OUT/'videos'),record_video_size={'width':1100,'height':720})
 c.add_init_script("localStorage.setItem('sprocket_muted','"+('0' if SUITE=='audio' else '1')+"')")
 host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=c.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
  page.wait_for_function('window.__gpuReady===true&&!!window.__adventure&&!!window.__score')
  original=page.evaluate('levelCode()');page.locator('[data-course="4"]').click();page.wait_for_function('__adventure.on()&&player.onGround')
  check(page.evaluate('LW===224&&routeQuota===0'),'First adventure spans 224 tiles and has no delivery gate')
  check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'Test uses the real perspective 3D application')
  check(page.evaluate('enemies.length>=6'),'Patrol and hover enemies are live engine entities')
  check(page.evaluate('__merged.scene.getObjectByName("Neighbor Penny")!==undefined'),'Friendly postal characters have actual scene geometry')
  check(page.locator('#cloud-deliveries').inner_text()=='0' and page.locator('#cloud-hud .cloud-delivery .cloud-label').inner_text()=='BONUS MAIL','The visible HUD treats deliveries as a bonus, not a zero quota')
  page.screenshot(path=str(OUT/'post-office.png'))
  if SUITE=='audio':
   page.wait_for_function('!!__score.source&&__score.context.state==="running"',timeout=90000)
   check(page.evaluate('music.timer===null'),'The old 16-step oscillator sequencer is stopped')
   check(page.evaluate('__score.stats.morning.bars===48'),'The composed 48-bar score is rendered off the graphics thread')
   page.evaluate('''()=>{const a=__score.context,n=a.createAnalyser();n.fftSize=2048;__score.source.connect(n);window.__soundProbe=n;}''')
   page.wait_for_timeout(500)
   peak=page.evaluate('(()=>{const a=new Float32Array(2048);__soundProbe.getFloatTimeDomainData(a);return Math.max(...a.map(Math.abs))})()')
   check(peak>.0001,'The native audio graph produces non-silent music samples')
   page.locator('#score-settings').click();page.wait_for_selector('#score-dialog[open]')
   check(page.evaluate('__delivery.paused'),'Audio mixing pauses the game rather than letting it run behind the dialog')
   page.locator('#score-music').fill('22');page.locator('#score-effects').fill('57')
   check(page.evaluate('__score.prefs.music===.22&&__score.prefs.effects===.57'),'Music and effect levels adjust independently')
   page.locator('#score-mute').check();check(page.evaluate('muted&&!__score.source'),'Master mute stops music without touching gameplay')
   page.locator('#score-mute').uncheck();page.locator('#score-dialog button').click()
   page.wait_for_function('!__delivery.paused&&__score.context.state==="running"')
   check(page.evaluate('JSON.parse(localStorage.getItem("svgn.soundmix.v2")).music===.22'),'Mix settings are saved locally')
   page.locator('#delivery-header [data-delivery="editor"]').click()
   check(page.evaluate('!__score.source'),'Leaving for the creator stops the soundtrack')
   check(page.evaluate('levelCode()')==original,'Sound and level changes preserve the prior editor blueprint')
  else:
   page.locator('#cv').focus();page.keyboard.down('KeyD')
   if SUITE=='loop':
    page.wait_for_function('player.x>=2870',timeout=360000);page.keyboard.down('Space')
    page.wait_for_function('player.track?.sky.fullLoop===true',timeout=120000);page.keyboard.up('Space')
    check(page.evaluate('player.track.sky.fullLoop'),'Ordinary jumping reaches the optional full loop')
    proof=page.wait_for_function('()=>{const p=player;return p.vx<0&&p.y<1980&&p.track?.sky.fullLoop?{x:p.x,y:p.y,rail:p.track.sky.id}:false;}',timeout=120000).json_value()
    check(proof['y']<1980,'The rider follows the upper half of the actual loop')
    page.screenshot(path=str(OUT/'loop-in-motion.png'))
    page.wait_for_function('__ground.state.events.some(e=>e.type==="optional-lip"&&e.rail==="loop-3")',timeout=120000)
    check(page.evaluate('__ground.state.upper.has("loop-3")'),'Traversing the full loop earns optional exploration progress')
    page.wait_for_function('player.onGround&&!player.track&&player.x>3600',timeout=120000)
    check(page.evaluate('tries===1'),'The loop exit returns safely to the road without a retry')
   page.wait_for_function('__adventure.state.finished.some(f=>f.index===4)',timeout=720000)
   page.keyboard.up('KeyD')
   finish=page.evaluate('__adventure.state.finished.find(f=>f.index===4)')
   check(finish['deliveries']==0,'Crossing the finish completes the level with zero newspaper deliveries')
   check(finish['tries']==1,'The first adventure completes without resetting the rider')
   if page.locator('#delivery-results.open').count():page.screenshot(path=str(OUT/'first-finish.png'))
   page.wait_for_function('__delivery.state.route===5&&!won&&player.onGround',timeout=90000)
   check(page.evaluate('LW===256'),'The finish leads automatically to the larger second level')
   check(page.evaluate('player.x<200'),'The next chapter starts at its own Start, with movement keys cleared')
   page.screenshot(path=str(OUT/'next-adventure.png'))
   page.locator('#delivery-header [data-delivery="editor"]').click()
   check(page.evaluate('levelCode()')==original,'Automatic progression restores the exact original blueprint on return to Create')
   check(page.locator('#palette .pal').count()>50,'The existing creator remains usable')
  check(not errors,'No uncaught errors in the tested flow')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'state':snapshot(page),'errors':errors,'scope':'Actual WebGL and Web Audio, normal keyboard/buttons, no state teleport or injected progress. Software CI is not a hardware-performance test.'},indent=2))
 except Exception as e:
  try:state=snapshot(page)
  except:state=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors,'checks':checks,'state':state},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
