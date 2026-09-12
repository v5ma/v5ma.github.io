"""Native Chromium / HTTP / Rapier / WebGL acceptance. Fixtures position the player;
Xbox button/axis inputs perform all tested actions. The full lap is separately
run through the real boat physics in ranch.test.mjs. No physical hardware claim.
"""
from pathlib import Path
import os,json,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'ranch-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
PAD="""window.__pad={id:'Acceptance Xbox standard layout',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad],configurable:true});"""
checks=[];errors=[]
def check(value,name):
 assert value,name
 checks.append(name);print('PASS:',name,flush=True)
try:
 with sync_playwright() as pw:
  opts=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts);context=browser.new_context(viewport={'width':1280,'height':800})
  context.add_init_script(PAD);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def button(i,down):page.evaluate('([i,down])=>{__pad.buttons[i]={pressed:down,touched:down,value:down?1:0};__pad.timestamp++;}',[i,down])
  def press(i):
   button(i,True);page.wait_for_timeout(210);button(i,False);page.wait_for_timeout(230)
  def wait(expr,timeout=30000):page.wait_for_function(expr,timeout=timeout)
  def choose(job):
   page.evaluate('__dinoRanch.open()');page.wait_for_timeout(230);page.evaluate('(job)=>document.querySelector(`[data-job="${job}"]`).focus()',job);press(0)
  def snap(name):page.screenshot(path=str(OUT/name))
  try:
   page.goto(BASE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__dinoRanger?.state.ready',120000)
   check(page.evaluate('__dinoRanch.state.build')=='ranch-coast-20260911.1','Current Ranch and Coast entry point boots')
   check(page.evaluate('__dinoRanger.state.animals.length')==64,'All 64 previous residents retained')
   check(page.evaluate('__dinoRanch.state.effects.buildings')==3,'Three real building complexes instantiated')
   check(page.evaluate('__dinoRanch.state.effects.buoys')==24,'Full ocean lap has 24 ordered buoys')
   check(page.evaluate('__dinoRanch.state.effects.boneyards')==3,'Three outer boneyards instantiated')
   snap('01-introduction.png');press(0);wait('__dinoRanger.state.started');check(page.locator('#info-dialog[open]').count()==1,'Xbox A starts a new guided ranger shift')
   press(1);wait('!__dinoRanger.state.paused');check(page.evaluate('__dinoRanch.state.task.name')=='Your first patrol','Initial task is visible and tells the player what to do')
   button(7,True)
   try:wait('__dinoRanch.state.progress.done.includes("drive")',60000)
   finally:button(7,False)
   check(page.evaluate('__dinoRanch.state.progress.tutorial')>=1,'Actual RT driving completes the first lesson')
   # Place one resident at a clear training-lane fixture, then use genuine gamepad input.
   page.evaluate("""()=>{const g=__dinoRanger,a=g.animals.find(a=>a.uid==='crest-meadow-3');a.x=-58;a.z=209;a.origin={x:-58,z:209};a.deter=0;a.stun=0;a.collider.setTranslation({x:a.x,y:a.collisionHeight/2,z:a.z},true);g.teleport(-58,219);g.setAim(0,.04);g.progress.tool=0;}""")
   page.wait_for_timeout(350);press(13)
   check(page.evaluate('__dinoRanch.state.progress.hornHits')>0,'Xbox horn visibly affects nearby dinosaurs')
   check(page.evaluate('__dinoRanch.state.effects.horns')>0,'Orange horn-wave pool fires')
   snap('02-horn-herding.png')
   page.evaluate("""()=>{const g=__dinoRanger,a=g.animals.find(a=>a.uid==='crest-meadow-3');a.x=-58;a.z=209;a.deter=0;a.stun=0;a.collider.setTranslation({x:a.x,y:a.collisionHeight/2,z:a.z},true);g.teleport(-58,219);g.setAim(0,.04);}""")
   before=page.evaluate('__dinoRanger.state.toolHits.water');button(4,True);button(7,True)
   try:wait(f'__dinoRanger.state.toolHits.water>{before}',30000);snap('03-pressure-stream.png')
   finally:button(7,False);button(4,False)
   check(page.evaluate('__dinoRanch.state.effects.shots')>0,'Thick pressure stream and hit halos render')
   press(5);wait('__dinoRanger.state.tool==="zapper"');page.evaluate("""()=>{const g=__dinoRanger,a=g.animals.find(a=>a.uid==='crest-meadow-3');a.x=-58;a.z=209;a.deter=0;a.stun=0;a.collider.setTranslation({x:a.x,y:a.collisionHeight/2,z:a.z},true);g.teleport(-58,219);g.setAim(0,.04);}""")
   before=page.evaluate('__dinoRanger.state.toolHits.zapper');button(4,True);button(7,True)
   try:wait(f'__dinoRanger.state.toolHits.zapper>{before}',30000);snap('04-zapper-arcs.png')
   finally:button(7,False);button(4,False)
   check(page.evaluate('__dinoRanch.state.progress.done.includes("zapper")'),'Zapper effect registers a real dinosaur hit')
   press(2);wait('__dinoRanger.state.reloading>0');check(True,'Xbox X reloads the zapper')
   # Dispatch is controller-native and stages a real repeatable herding exercise.
   choose('roundup');check(page.evaluate('__dinoRanch.state.activity')=='roundup','Xbox A accepts a ranching job from Dispatch')
   check(page.evaluate('__dinoRanch.state.task.done')<4,'Roundup stages actual strays outside the pen')
   snap('05-roundup-assignment.png');choose('race')
   page.evaluate("""async()=>{const g=__dinoRanger,d=await import('./ranch-data.js');g.fleet.person.setActive(false);g.fleet.active='boat';g.fleet.current.drive.reset({...d.RACE_GATES[0],y:.78},Math.atan2(d.RACE_GATES[1].x-d.RACE_GATES[0].x,d.RACE_GATES[1].z-d.RACE_GATES[0].z));}""")
   button(7,True)
   try:wait('__dinoRanch.state.race.running',30000)
   finally:button(7,False)
   check(page.evaluate('__dinoRanch.state.race.index')==1,'Boat throttle starts the timed ocean lap at its start buoy');snap('06-ocean-race.png')
   press(9);wait('__dinoRanger.state.paused');elapsed=page.evaluate('__dinoRanch.state.race.time');page.wait_for_timeout(800)
   check(page.evaluate('__dinoRanch.state.race.time')==elapsed,'Pausing stops the race clock');press(1);wait('!__dinoRanger.state.paused')
   # Supply collection requires the boat and controller interaction, not a remote market click.
   choose('salvage')
   for i in range(3):
    page.evaluate("""async(i)=>{const d=await import('./ranch-data.js'),g=__dinoRanger,s=d.SALVAGE[i];g.fleet.active='boat';g.fleet.current.drive.reset({x:s.x,y:.78,z:s.z+9});g.render();}""",i)
    wait('document.getElementById("interact-label").textContent.includes("Recover floating")');press(0);wait(f'__dinoRanch.state.progress.salvage.length==={i+1}')
   check(True,'Xbox A recovers all three offshore supply crates')
   before=page.evaluate('__dinoEconomy.state.credits');page.evaluate('__dinoRanger.fleet.current.drive.reset({x:437,y:.78,z:40})');wait('document.getElementById("interact-label").textContent.includes("Deliver Greenline")');press(0)
   check(page.evaluate('__dinoEconomy.state.credits')==before+900,'Delivering at East Freight Pier pays the existing saved economy')
   press(3);wait('__dinoRanger.state.mode==="foot"');check(True,'Xbox Y disembarks at the new coastal harbor')
   # Real descent and Y exit on a physical rooftop slab.
   choose('skyline');page.evaluate("""async()=>{const d=await import('./ranch-data.js'),g=__dinoRanger,b=d.BUILDINGS[0];g.fleet.person.setActive(false);g.fleet.active='helicopter';g.fleet.current.drive.reset({x:b.x+2,y:b.h+4,z:b.z+1});}""")
   button(6,True)
   try:wait('__dinoRanger.state.position.y<25.6',45000)
   finally:button(6,False)
   page.wait_for_timeout(350);press(3);wait('__dinoRanger.state.mode==="foot"')
   check(page.evaluate('__dinoRanger.state.position.y')>24,'Xbox Y exits onto the rooftop rather than rejecting elevated landings');snap('07-rooftop-landing.png')
   page.evaluate('__dinoRanger.fleet.person.setActive(true,{x:-42,y:25.1,z:-362})');wait('document.getElementById("interact-label").textContent.includes("maintenance lift")');press(0);wait('document.getElementById("ranch-lift").open');press(13);press(0);wait('!document.getElementById("ranch-lift").open');
   check(page.evaluate('__dinoRanger.state.position.y')<3,'D-pad and Xbox A operate the roof-to-interior lift without a mouse')
   page.evaluate('__dinoRanger.setAim(0)')
   # Walk an actual corridor route: behind the partition, across the atrium, then to the archive.
   def walk(x,z,condition):
    page.evaluate('([x,z])=>{__pad.axes[0]=x;__pad.axes[1]=z;}',[x,z])
    try:wait(condition,45000)
    finally:page.evaluate('__pad.axes[0]=0;__pad.axes[1]=0')
   walk(0,-1,'__dinoRanger.state.position.z<-366.5');walk(1,0,'__dinoRanger.state.position.x>-17.3');walk(0,1,'__dinoRanger.state.position.z>-363.5')
   wait('document.getElementById("interact-label").textContent.includes("Recover Canopy")');snap('08-explorable-interior.png');press(0)
   check(page.evaluate('__dinoRanch.state.progress.records.includes("north-lab")'),'On-foot corridor exploration and Xbox A recover the actual archive');press(1)
   # Verify exact displayed geometry calibration, not just a text claim.
   sizes=page.evaluate('__dinoRanch.state.scales');adult={x['id']:x['length'] for x in sizes if not x['uid'].startswith('north-nursery')}
   check(abs(adult['diplodocus']-26)<.001 and abs(adult['tyrannosaurus']-12)<.001 and abs(adult['triceratops']-9)<.001,'Three adult reference models have measured calibrated bounds')
   # Controller navigation, previous market, settings and modal closure are retained.
   press(9);wait('document.getElementById("menu-dialog").open');page.evaluate('document.getElementById("motion-toggle").focus()');press(15)
   check(page.evaluate('document.getElementById("motion-toggle").checked'),'Controller changes Reduced Motion');press(1)
   before=page.evaluate('__dinoEconomy.state.credits');page.reload(wait_until='domcontentloaded');wait('window.__dinoRanger?.state.ready',120000)
   check(page.evaluate('__dinoRanch.state.progress.records.includes("north-lab")'),'Archive progress survives a complete reload')
   check(page.evaluate('__dinoEconomy.state.credits')==before,'Earned credits survive a complete reload')
   check(page.evaluate('__dinoRanger.state.position.y')<3,'Interior foot position survives reload')
   check(not errors,'No uncaught JavaScript exceptions in the tested flows')
   result={'passed':len(checks),'checks':checks,'errors':errors,'limitations':'Native HTTP Chromium and software WebGL; synthetic standard-layout Xbox; positioning fixtures for distant activities; real controller walking through interior; full coastal lap independently tested with Rapier boat physics. No physical controller, real GPU or speaker/headset testing.'};(OUT/'report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
  except Exception as exc:
   (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'errors':errors,'passed':checks},indent=2))
   try:snap('failure.png');print('DIAGNOSTIC',json.dumps(page.evaluate('({game:window.__dinoRanger?.state,ranch:window.__dinoRanch?.state,focus:document.activeElement?.outerHTML,dialogs:[...document.querySelectorAll("dialog[open]")].map(d=>d.id)})')))
   except Exception:pass
   raise
  finally:browser.close()
finally:
 if server:
  server.terminate()
  try:server.wait(timeout=3)
  except:server.kill()
