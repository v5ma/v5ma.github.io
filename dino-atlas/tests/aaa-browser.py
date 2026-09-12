"""Native HTTP/WebGL with synthetic Xbox. Distant trips use ?test=1 fixtures;
UI, transfers, walking, boarding, descent, lifts and handoffs use actual input.
The full story sea route is also tested with real Rapier physics in Node.
"""
from pathlib import Path
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aaa-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
PAD="""window.__pad={id:'Storm acceptance Xbox',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad],configurable:true});try{if(!localStorage.getItem('dino-atlas.frontier.v2'))localStorage.setItem('dino-atlas.frontier.v2',JSON.stringify({version:2,settings:{low:true}}));}catch{}"""
checks=[];errors=[]
def check(v,label):
 assert v,label
 checks.append(label);print('PASS:',label,flush=True)
try:
 with sync_playwright() as pw:
  opts=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1100,'height':820});ctx.add_init_script(PAD)
  page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def wait(expr,timeout=60000):page.wait_for_function(expr,timeout=timeout)
  def button(i,on):page.evaluate('([i,on])=>{__pad.buttons[i]={pressed:on,touched:on,value:on?1:0};__pad.timestamp++;}',[i,on])
  def press(i):
   # Observe the actual independent Gamepad API poller instead of assuming a
   # software-rendered frame plus a button edge will complete within 220 ms.
   page.wait_for_function('!__dinoRanger.director.ctx.input.neutral',timeout=30000)
   button(i,True)
   try:page.wait_for_function('(i)=>__dinoRanger.director.ctx.input.previous[i]===true',arg=i,timeout=30000)
   finally:button(i,False)
   page.wait_for_function('(i)=>__dinoRanger.director.ctx.input.previous[i]===false&&!__dinoRanger.director.ctx.input.neutral',arg=i,timeout=30000)

  def choose(id):
   for _ in range(65):
    if page.evaluate('document.activeElement?.id')==id:press(0);return
    press(13)
   raise AssertionError('Xbox focus cannot reach '+id)
  def snap(name):page.screenshot(path=str(OUT/name),timeout=45000,animations='disabled')
  def walk(x,z,condition):
   page.evaluate('([x,z])=>{__pad.axes[0]=x;__pad.axes[1]=z;}',[x,z])
   try:wait(condition,90000)
   finally:page.evaluate('__pad.axes[0]=0;__pad.axes[1]=0')
  def open_story():
   press(9);wait('document.getElementById("menu-dialog").open');choose('menu-aaa-director');wait('document.getElementById("aaa-director-dialog").open')
  def intro():
   press(0);wait('__dinoRanger.state.started')
   if page.locator('#info-dialog[open]').count():press(1)
   wait('!__dinoRanger.state.paused')
  try:
   page.goto(BASE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__dinoRanger?.state.ready&&window.__dinoAAA?.state',120000)
   check(page.evaluate('__dinoRanger.state.storyBuild||__dinoRanger.state.build')=='aaa-vslice-storm-20260911.2','Correct Storm Response release boots over HTTP/WebGL')
   check(page.evaluate('__dinoRanger.state.animals.length')==64,'All 64 existing residents retained')
   snap('01-storm-intro.png');intro()
   press(9);wait('document.getElementById("menu-dialog").open');choose('menu-aaa-roadmap');wait('document.getElementById("aaa-roadmap-dialog").open')
   check(True,'D-pad and A reach the in-game roadmap without scripted DOM focus');snap('02-roadmap-in-game.png');press(1);wait('!__dinoRanger.state.paused')
   open_story();choose('aaa-director-start');wait('__dinoAAA.state.state.active==="storm-response"');wait('__dinoAAA.state.stormMix>.3')
   check(True,'Xbox launches the directed mission and storm weather');check(page.evaluate('__dinoAAA.state.flash')==0,'Storm flashes are off by default');snap('03-storm-response.png')
   # Road travel fixture stops outside the actual arrival trigger.
   page.evaluate('__dinoRanger.teleport(340,-50,Math.PI)');page.wait_for_timeout(300);button(7,True)
   try:wait('__dinoRanger.state.position.z<-57')
   finally:button(7,False)
   button(1,True)
   try:wait('__dinoAAA.state.state.stage===1&&Math.abs(__dinoRanger.state.speed)<.8')
   finally:button(1,False)
   check(page.evaluate('__dinoRanger.state.position.z')>-74,'Actual RT driving reaches the parking bay OUTSIDE the building')
   press(3);wait('__dinoRanger.state.mode==="foot"')
   # Exterior start fixture; the doorway and corridor are then walked with the stick.
   page.evaluate('__dinoRanger.teleport(340,-70);__dinoRanger.setAim(0)')
   walk(0,-1,'__dinoRanger.state.position.z<-84');walk(1,0,'__dinoRanger.state.position.x>353');walk(0,-1,'__dinoRanger.state.position.z<-103.5')
   wait('document.getElementById("interact-label").textContent.includes("generator")');press(0);wait('__dinoAAA.state.state.stage===2')
   check(True,'Real doorway/corridor walking and A restore Meridian power');check(not page.evaluate('__dinoRanger.director.rain.visible'),'Rain is hidden inside the building')
   # Only the ranger is repositioned; the transfer action must relocate the helicopter.
   page.evaluate('__dinoRanger.teleport(369,-65)');wait('document.getElementById("interact-label").textContent.includes("Request helicopter")');prior=page.evaluate('__dinoRanger.state.position');press(0)
   check(page.evaluate('__dinoRanger.state.vehicles.find(v=>v.id==="helicopter").position.x')>370,'A requests the original helicopter at Meridian')
   check(page.evaluate('__dinoRanger.state.mode')=='foot' and abs(page.evaluate('__dinoRanger.state.position.x')-prior['x'])<.2,'Transfer does not teleport or board the ranger')
   press(3);wait('__dinoRanger.state.mode==="helicopter"');button(7,True)
   try:wait('__dinoRanger.state.position.y>5')
   finally:button(7,False)
   check(page.evaluate('__dinoAAA.state.task.target.x')==-30,'Y boards and RT takes off; the objective switches to Northstar')
   # Long flight fixture; LT and Y perform the final roof landing and exit.
   page.evaluate('__dinoRanger.fleet.current.drive.reset({x:-28,y:28,z:-352},Math.PI)');button(6,True)
   try:wait('__dinoRanger.state.position.y<25.6')
   finally:button(6,False)
   press(3);wait('__dinoRanger.state.mode==="foot"&&__dinoAAA.state.state.stage===3');page.evaluate('__dinoRanger.setAim(0)')
   walk(1,0,'__dinoRanger.state.position.x>-20.2');walk(0,1,'__dinoRanger.state.position.z>-345.3')
   wait('document.getElementById("interact-label").textContent.includes("storm beacon")');press(0);wait('__dinoAAA.state.state.stage===4')
   check(True,'LT landing, Y exit, rooftop walking and A calibrate Northstar');snap('04-northstar-beacon.png')
   open_story();choose('aaa-director-abandon');wait('__dinoAAA.state.state.suspended')
   check(page.evaluate('__dinoAAA.state.state.stage')==4,'Suspend preserves the mission checkpoint')
   page.reload(wait_until='domcontentloaded');wait('window.__dinoAAA?.state&&window.__dinoRanger?.state.ready',120000);intro();open_story()
   check(not page.locator('#aaa-director-resume').is_disabled(),'Suspended story remains resumable after reload');choose('aaa-director-resume');wait('__dinoAAA.state.state.active==="storm-response"')
   check(page.evaluate('__dinoAAA.state.state.stage')==4,'Continue resumes rather than restarting')
   open_story();choose('aaa-director-recover');wait('!__dinoRanger.state.paused')
   check(page.evaluate('__dinoRanger.state.position.y')>24 and page.evaluate('__dinoAAA.state.state.stage')==4,'Checkpoint recovery safely restores the rooftop without skipping a stage')
   page.evaluate('__dinoRanger.setAim(0)');walk(1,0,'__dinoRanger.state.position.x>-33.5');press(3);wait('__dinoRanger.state.mode==="helicopter"')
   page.evaluate('__dinoRanger.fleet.current.drive.reset({x:112,y:25,z:356},Math.PI)');button(6,True)
   try:wait('__dinoRanger.state.position.y<22.6')
   finally:button(6,False)
   press(3);wait('__dinoRanger.state.mode==="foot"&&__dinoAAA.state.state.stage===5');page.evaluate('__dinoRanger.setAim(0)')
   walk(-1,0,'__dinoRanger.state.position.x<98.2');walk(0,-1,'__dinoRanger.state.position.z<346.5')
   wait('document.getElementById("interact-label").textContent.includes("maintenance lift")');press(0);wait('document.getElementById("ranch-lift").open');press(13);press(0);wait('!__dinoRanger.state.paused')
   check(page.evaluate('__dinoRanger.state.position.y')<3,'A and D-pad operate the South Coast roof-to-ground lift')
   walk(0,-1,'__dinoRanger.state.position.z<341.5');walk(1,0,'__dinoRanger.state.position.x>122.8');walk(0,1,'__dinoRanger.state.position.z>344.6')
   wait('document.getElementById("interact-label").textContent.includes("marine telemetry")');snap('05-telemetry-interior.png');press(0);wait('__dinoAAA.state.state.stage===6')
   check(True,'Real interior walking recovers marine telemetry')
   page.evaluate('__dinoRanger.teleport(0,401)');wait('document.getElementById("interact-label").textContent.includes("Request boat")');press(0)
   check(page.evaluate('__dinoRanger.state.vehicles.find(v=>v.id==="boat").position.z')>435,'A transfers the original boat to South Rescue Pier')
   check(page.evaluate('__dinoRanger.state.mode')=='foot','Boat transfer keeps the ranger ashore until Y is pressed')
   press(3);wait('__dinoRanger.state.mode==="boat"&&__dinoAAA.state.state.stage===7');button(7,True)
   try:wait('__dinoRanger.state.position.x>4')
   finally:button(7,False)
   check(True,'Y and RT launch the actual boat for the coastal leg');snap('06-coastal-response.png')
   press(9);wait('__dinoRanger.state.paused');elapsed=page.evaluate('__dinoAAA.state.state.elapsed');page.wait_for_timeout(550)
   check(page.evaluate('__dinoAAA.state.state.elapsed')==elapsed,'Story clock freezes while the menu is open');press(1)
   page.evaluate('__dinoRanger.fleet.current.drive.reset({x:437,y:.78,z:70},Math.PI)');button(7,True)
   try:wait('__dinoRanger.state.position.z<59')
   finally:button(7,False)
   button(1,True)
   try:wait('Math.abs(__dinoRanger.state.speed)<.5')
   finally:button(1,False)
   wait('Math.abs(__dinoRanger.state.speed)<.5&&!document.getElementById("interact-button").disabled&&document.getElementById("interact-label").textContent.includes("Deliver storm telemetry")')
   before=page.evaluate('__dinoEconomy.state.credits');press(0);wait('__dinoAAA.state.state.completed.includes("storm-response")')
   check(page.evaluate('__dinoEconomy.state.credits')==before+1800,'Completion pays exactly 1,800 credits into the existing economy')
   check(page.locator('#info-dialog[open]').count()==1,'Completion uses a controller-closeable in-game panel');snap('07-story-complete.png');press(1);wait('!__dinoRanger.state.paused')
   page.reload(wait_until='domcontentloaded');wait('window.__dinoAAA?.state&&window.__dinoRanger?.state.ready',120000)
   check(page.evaluate('__dinoAAA.state.state.completed.includes("storm-response")'),'Completion survives reload');check(page.evaluate('__dinoEconomy.state.credits')==before+1800,'Earned credits survive reload')
   check(not page.evaluate('__dinoEconomy.grant(1800,"aaa:storm-response")'),'Saved ledger rejects a duplicate reward after reload');check(not errors,'No uncaught JavaScript errors in the tested story journey')
   result={'build':'aaa-vslice-storm-20260911.2','passed':len(checks),'checks':checks,'errors':errors,'limitations':'Native Chromium HTTP and software WebGL; synthetic Xbox. Distant travel uses explicit position fixtures. No scripted DOM focus. Doorways, corridors, transfers, boarding, landing, lifts, UI, completion and reload use production behavior. Full sea route also passes a real Rapier test. Physical controller/audio hardware and consumer-GPU performance are untested.'}
   (OUT/'report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True)
  except Exception as exc:
   result={'error':str(exc),'checks':checks,'errors':errors}
   try:result['state']=page.evaluate('({story:__dinoAAA.state,game:__dinoRanger.state,focus:document.activeElement?.id,dialogs:[...document.querySelectorAll("dialog[open]")].map(d=>d.id),prompt:document.getElementById("interact-label").textContent,input:{previous:__dinoRanger.director.ctx.input.previous,neutral:__dinoRanger.director.ctx.input.neutral}})');snap('failure.png')
   except Exception:pass
   (OUT/'failure.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True);raise
  finally:browser.close()
finally:
 if server:
  server.terminate()
  try:server.wait(timeout=3)
  except subprocess.TimeoutExpired:server.kill()
