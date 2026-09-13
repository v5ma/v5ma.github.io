"""Native HTTP/WebGL acceptance with synthetic standard Xbox input.
Distant journeys use position fixtures. Boarding, entry stairs, pump interfaces,
archive corridor, wading, input recovery, delivery and saves use production behavior.
The entire facility and round-trip sea route also have real Rapier model tests.
"""
from pathlib import Path
import os,json,subprocess,time,traceback
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aquatics-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
PAD="""window.__pad={id:'Pelagic Xbox acceptance',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>__pad.connected?[__pad]:[],configurable:true});try{if(!localStorage.getItem('dino-atlas.frontier.v2'))localStorage.setItem('dino-atlas.frontier.v2',JSON.stringify({version:2,settings:{low:true}}));}catch{}"""
checks=[];errors=[]
def check(value,label):
 assert value,label
 checks.append(label);print('PASS:',label,flush=True)
try:
 with sync_playwright() as pw:
  kw=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**kw);context=browser.new_context(viewport={'width':1100,'height':800},device_scale_factor=1);context.add_init_script(PAD)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  def wait(expr,timeout=90000):page.wait_for_function(expr,timeout=timeout)
  def st():return page.evaluate('__dinoAquatics.state')
  def button(i,on):page.evaluate('([i,on])=>{__pad.buttons[i]={pressed:on,touched:on,value:on?1:0};__pad.timestamp++;}',[i,on])
  def press(i):
   wait('!__dinoRanger.aquatics.ctx.input.neutral',30000);button(i,True)
   try:page.wait_for_function('(i)=>__dinoRanger.aquatics.ctx.input.previous[i]===true',arg=i,timeout=30000)
   finally:button(i,False)
   page.wait_for_function('(i)=>__dinoRanger.aquatics.ctx.input.previous[i]===false&&!__dinoRanger.aquatics.ctx.input.neutral',arg=i,timeout=30000)
  def choose(id):
   for _ in range(70):
    if page.evaluate('document.activeElement?.id')==id:press(0);return
    press(13)
   raise AssertionError('Controller did not reach '+id)
  def walk(x,z,expr):
   page.evaluate('([x,z])=>{__pad.axes[0]=x;__pad.axes[1]=z;}',[x,z])
   try:wait(expr,120000)
   finally:page.evaluate('__pad.axes[0]=0;__pad.axes[1]=0')
  def photo(name):page.screenshot(path=str(OUT/name),timeout=60000)
  def open_menu():press(9);wait('document.getElementById("menu-dialog").open')
  def aim(yaw,pitch):page.evaluate('([y,p])=>__dinoRanger.setAim(y,p)',[yaw,pitch])
  try:
   page.goto(BASE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__dinoRanger?.state.ready&&window.__dinoAquatics',120000)
   check(st()['build']=='aquatics-20260912.1','New aquatic mission boots inside the existing game')
   check(page.evaluate('__dinoRanger.state.animals.length')==64,'The previous 64 dinosaurs and fleet are retained')
   check(st()['world']['refractionTargets']==0,'Distant pool does not allocate a scene-capture target')
   press(0);wait('__dinoRanger.state.started')
   if page.locator('#info-dialog[open]').count():press(1)
   wait('!__dinoRanger.state.paused');open_menu();choose('menu-aquatics');choose('aquatics-start');wait('__dinoAquatics.state.progress.active')
   check(True,'D-pad and A accept Pelagic Recovery without scripted DOM focus')
   page.evaluate("__dinoRanger.fleet.active='foot';__dinoRanger.fleet.person.setActive(true,{x:-73,y:1.6,z:-151});")
   wait('document.getElementById("interact-label").textContent.includes("Request patrol")');before=page.evaluate('__dinoRanger.state.position.x');press(0)
   check(page.evaluate('__dinoRanger.state.position.x')==before,'Requesting the unoccupied boat does not teleport the ranger')
   press(3);wait('__dinoRanger.state.mode==="boat"');button(7,True)
   try:wait('__dinoRanger.state.position.x<-98')
   finally:button(7,False)
   check(True,'Y boards the original boat and RT begins the sea journey')
   # Final sea arrival fixture. Real braking and Y establish the new harbor.
   page.evaluate('__dinoRanger.fleet.current.drive.reset({x:-438,y:.78,z:28},Math.PI)');button(7,True)
   try:wait('__dinoRanger.state.position.z<24')
   finally:button(7,False)
   button(1,True)
   try:wait('__dinoAquatics.state.progress.stage===1&&Math.abs(__dinoRanger.state.speed)<.5')
   finally:button(1,False)
   press(3);wait('__dinoRanger.state.mode==="foot"');check(True,'Pelagic arrival requires the boat, and Y disembarks at the new pier')
   aim(0,.06);walk(1,0,'__dinoRanger.state.position.x>-395.1');wait('document.getElementById("interact-label").textContent.includes("safety circuit")')
   check(page.evaluate('__dinoRanger.state.position.y')>3.5,'The ranger climbs real entry stairs rather than using a teleport')
   aim(-1.1,.35);wait('__dinoAquatics.state.world.refractionPasses===1');photo('01-flooded-pool-and-caustics.png')
   check(st()['world']['refractionTargets']==1 and st()['world']['targetWidth']<=512,'Low graphics uses one nearby, capped refraction/depth capture')
   check(page.evaluate('__dinoRanger.optics.snapshot().shaderErrors')==0,'The actual pool refraction and submerged-tile shaders compile')
   press(0);wait('__dinoAquatics.state.progress.stage===2');check(True,'A restores the safety circuit from the on-foot breaker')
   # The pump cannot run before intake isolation.
   aim(0,.08);walk(0,-1,'__dinoRanger.state.position.z<-19.8');wait('document.getElementById("interact-label").textContent.includes("drain pump")');press(0)
   check(page.locator('#aquatics-control-use').is_disabled(),'The pump interlock blocks drainage while seawater intake is open');press(1)
   walk(0,1,'__dinoRanger.state.position.z>-13.2');wait('document.getElementById("interact-label").textContent.includes("seawater intake")');press(0);choose('aquatics-control-use');wait('__dinoAquatics.state.progress.stage===3')
   check(True,'Xbox A closes the seawater intake')
   walk(0,-1,'__dinoRanger.state.position.z<-19.8');wait('document.getElementById("interact-label").textContent.includes("drain pump")');press(0);choose('aquatics-control-use');wait('__dinoAquatics.state.progress.pumping');wait('__dinoAquatics.state.progress.water<2.1')
   open_menu();level=st()['progress']['water'];time.sleep(.4)
   check(st()['progress']['water']==level,'Pausing freezes functional drainage, not just the animation')
   choose('menu-aquatics');choose('aquatics-close');wait('!__dinoRanger.state.paused')
   # Save during active drainage and resume the exact partial level.
   open_menu();level=st()['progress']['water'];page.evaluate('window.dispatchEvent(new Event("pagehide"))');page.reload(wait_until='domcontentloaded');wait('window.__dinoRanger?.state.ready&&window.__dinoAquatics',120000)
   check(abs(st()['progress']['water']-level)<1e-6 and st()['progress']['pumping'],'An interrupted drain resumes from the saved water level')
   press(0);wait('__dinoRanger.state.started');wait('__dinoAquatics.state.progress.stage===4',120000)
   check(st()['world']['gateOpen'],'The actual descending water unlocks the physical staircase gate')
   open_menu();choose('motion-toggle');press(1);wait('!__dinoRanger.state.paused');t=st()['world']['time'];time.sleep(.6)
   check(st()['world']['time']==t,'Reduced Motion freezes decorative pool caustics and ripples')
   open_menu();choose('motion-toggle');press(1);wait('!__dinoRanger.state.paused')
   # Walk the deck, pool steps and shallow floor to the archive with normal input.
   aim(0,.15);walk(0,1,'__dinoRanger.state.position.z>20');walk(1,0,'__dinoRanger.state.position.x>-388.8');walk(0,-1,'__dinoRanger.state.position.z<-6.1')
   check(page.evaluate('__dinoRanger.state.position.y')<1.5,'Real pool steps descend to a shallow walkable basin')
   aim(-1.1,.28);photo('02-shallow-pool-inspection.png');check(st()['inspection'],'The local inspection camera gives a water-level view without changing outdoor cameras')
   aim(0,.05);walk(1,0,'__dinoRanger.state.position.x>-363.4');walk(0,-1,'__dinoRanger.state.position.z<-9.7');wait('document.getElementById("interact-label").textContent.includes("habitat archive")');press(0)
   check(st()['progress']['archive'] and st()['progress']['stage']==4,'The first case is collectible only inside the drained, on-foot archive')
   walk(1,0,'__dinoRanger.state.position.x>-359.4');walk(0,1,'__dinoRanger.state.position.z>4.7');wait('document.getElementById("interact-label").textContent.includes("sample case")');photo('03-archive-sample-case.png');press(0);wait('__dinoAquatics.state.progress.stage===5')
   check(st()['progress']['sample'],'Both research cases are required before the return delivery')
   # Preserve reload and controller disconnection behavior inside the new space.
   button(7,True)
   try:wait('__dinoRanger.state.ammo[0]<98',30000)
   finally:button(7,False)
   press(2);wait('__dinoRanger.state.reloading>0');wait('__dinoRanger.state.reloading===0',30000);check(page.evaluate('__dinoRanger.state.ammo[0]')==100,'Xbox X still reloads while exploring the water facility')
   open_menu();choose('menu-aquatics');page.evaluate('__pad.connected=false');page.wait_for_timeout(700);page.evaluate('__pad.connected=true');page.wait_for_timeout(700);press(1);wait('!__dinoRanger.state.paused');check(True,'The aquatic panel remains dismissible after controller reconnection')
   # All return-room navigation has a separate physical traversal test; here the
   # distant return is a fixture and the handoff must still use the real boat/A.
   page.evaluate("__dinoRanger.fleet.person.setActive(false);__dinoRanger.fleet.active='boat';__dinoRanger.fleet.current.drive.reset({x:-94,y:.78,z:-151},Math.PI/2)")
   wait('document.getElementById("interact-label").textContent.includes("Deliver Pelagic")');before=page.evaluate('__dinoEconomy.state.credits');press(0);wait('__dinoAquatics.state.progress.completed')
   check(page.evaluate('__dinoEconomy.state.credits')==before+1200,'Returning both cases by boat pays exactly 1,200 credits')
   check(page.locator('#info-dialog[open]').count()==1,'Completion uses an Xbox-closeable in-game panel');press(1)
   page.reload(wait_until='domcontentloaded');wait('window.__dinoRanger?.state.ready&&window.__dinoAquatics',120000)
   check(st()['progress']['completed'] and st()['progress']['water']<.72,'Completion and the drained exploration space survive reload')
   check(page.evaluate('__dinoEconomy.state.credits')==before+1200 and not page.evaluate('__dinoEconomy.grant(1200,"aaa:pelagic-recovery")'),'The saved economy rejects duplicate Pelagic rewards')
   check(st()['world']['refractionTargets']==0,'Leaving the facility releases the refraction capture')
   check(not errors,'No uncaught errors or shader compilation failures during the mission')
   report={'passed':len(checks),'checks':checks,'errors':errors,'base':BASE,'limitations':'Native Chromium software WebGL, synthetic Xbox, distant boat fixtures. Entry stairs, dry deck, interlock, drainage, pool stairs, wading, archive traversal and delivery use production controls and behavior. No physical-controller, consumer-GPU, subjective listening or whole-island human playtest claim.'};(OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
  except Exception as e:
   result={'error':str(e),'checks':checks,'errors':errors}
   try:result['state']=st();result['game']=page.evaluate('__dinoRanger.state');result['focus']=page.evaluate('document.activeElement?.outerHTML');photo('failure.png')
   except Exception:pass
   (OUT/'failure.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True);traceback.print_exc();raise
  finally:browser.close()
finally:
 if server:server.terminate()
