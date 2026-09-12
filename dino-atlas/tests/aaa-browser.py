"""Native HTTP/WebGL acceptance for AAA Vertical Slice 01.
Distant travel uses explicit test fixtures; mission selection, vehicle exits and
all mission interactions use the production standard-layout Xbox input path.
No physical-controller or real-GPU certification is claimed.
"""
from pathlib import Path
import json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'aaa-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
PAD="""window.__pad={id:'AAA acceptance Xbox',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad],configurable:true});try{localStorage.setItem('dino-atlas.frontier.v2',JSON.stringify({version:2,settings:{low:true}}));}catch{}"""
checks=[];errors=[]
def check(v,label):
 assert v,label;checks.append(label);print('PASS:',label,flush=True)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  ctx=browser.new_context(viewport={'width':1100,'height':760});ctx.add_init_script(PAD)
  page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def wait(expr,timeout=90000):page.wait_for_function(expr,timeout=timeout)
  def button(i,on):page.evaluate('([i,on])=>{__pad.buttons[i]={pressed:on,touched:on,value:on?1:0};__pad.timestamp++;}',[i,on])
  def press(i):button(i,True);page.wait_for_timeout(240);button(i,False);page.wait_for_timeout(280)
  def snap(name):page.screenshot(path=str(OUT/name),timeout=45000,animations='disabled')
  page.goto(BASE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__dinoRanger?.state.ready&&window.__dinoAAA?.state',120000)
  check(page.evaluate('__dinoRanger.state.build')=='aaa-vslice-storm-20260911.1','AAA Vertical Slice build is the active runtime')
  check(page.evaluate('__dinoRanger.state.animals.length')==64,'Existing 64-resident reserve is preserved')
  snap('01-aaa-intro.png')
  press(0);wait('__dinoRanger.state.started')
  if page.locator('#info-dialog[open]').count():press(1)
  wait('!__dinoRanger.state.paused')
  press(9);wait('document.getElementById("menu-dialog").open')
  page.evaluate('document.getElementById("menu-aaa-director").focus()');press(0);wait('document.getElementById("aaa-director-dialog").open')
  page.evaluate('document.getElementById("aaa-director-start").focus()');press(0);wait('__dinoAAA.state.state.active==="storm-response"')
  wait('__dinoAAA.state.stormMix>.15',30000)
  check(page.evaluate('__dinoAAA.state.task.name.includes("Mobilize")'),'Xbox launches the directed Storm Response mission')
  check(page.evaluate('__dinoAAA.state.stormMix')>.15,'Storm weather blends into the live scene')
  snap('02-storm-start.png')
  # Stage 0: travel fixture; production director advances on proximity in a real ground vehicle.
  page.evaluate('__dinoRanger.teleport(340,-78)');wait('__dinoAAA.state.state.stage===1')
  check(True,'Ground response reaches Meridian and advances the mission')
  press(3);wait('__dinoRanger.state.mode==="foot"')
  page.evaluate('__dinoRanger.fleet.person.setActive(true,{x:353,y:1.1,z:-104})');wait('document.getElementById("interact-label").textContent.includes("generator")')
  press(0);wait('__dinoAAA.state.state.stage===2')
  check(True,'Xbox A restores Meridian backup power inside the building')
  # Northstar roof: fixture moves helicopter near landing; Y performs the real safe rooftop exit.
  page.evaluate("""async()=>{const d=await import('./ranch-data.js'),g=__dinoRanger,b=d.BUILDINGS.find(x=>x.id==='north-lab'),v=g.fleet.vehicles.find(v=>v.type==='helicopter');g.fleet.person.setActive(false);g.fleet.active=v.id;v.drive.reset({x:b.x+2,y:b.h+1.1,z:b.z+1});}""")
  page.wait_for_timeout(500);press(3);wait('__dinoRanger.state.mode==="foot"&&__dinoAAA.state.state.stage===3')
  check(page.evaluate('__dinoRanger.state.position.y')>24,'Xbox Y exits onto the Northstar rooftop and advances the mission')
  page.evaluate('__dinoRanger.fleet.person.setActive(true,{x:-20,y:25.1,z:-345})');wait('document.getElementById("interact-label").textContent.includes("storm beacon")')
  press(0);wait('__dinoAAA.state.state.stage===4')
  check(True,'Xbox A calibrates the rooftop storm beacon')
  snap('03-northstar-beacon.png')
  # South roof and telemetry.
  page.evaluate("""async()=>{const d=await import('./ranch-data.js'),g=__dinoRanger,b=d.BUILDINGS.find(x=>x.id==='south-lab'),v=g.fleet.vehicles.find(v=>v.type==='helicopter');g.fleet.person.setActive(false);g.fleet.active=v.id;v.drive.reset({x:b.x+2,y:b.h+1.1,z:b.z+1});}""")
  page.wait_for_timeout(500);press(3);wait('__dinoRanger.state.mode==="foot"&&__dinoAAA.state.state.stage===5')
  check(True,'Second rooftop landing connects the helicopter to the authored mission path')
  page.evaluate('__dinoRanger.fleet.person.setActive(true,{x:123,y:1.1,z:345})');wait('document.getElementById("interact-label").textContent.includes("marine telemetry")')
  press(0);wait('__dinoAAA.state.state.stage===6')
  check(True,'On-foot interior interaction recovers the marine telemetry case')
  # Boat launch/delivery.
  page.evaluate("""async()=>{const d=await import('./ranch-data.js'),g=__dinoRanger,h=d.HARBORS.find(x=>x.id==='south'),v=g.fleet.vehicles.find(v=>v.type==='boat');g.fleet.person.setActive(false);g.fleet.active=v.id;v.drive.reset({...h.boat,y:.78});}""")
  wait('__dinoAAA.state.state.stage===7')
  check(True,'Boat launch advances the same multi-vehicle story mission')
  page.evaluate("""async()=>{const d=await import('./ranch-data.js'),g=__dinoRanger,h=d.HARBORS.find(x=>x.id==='east'),v=g.fleet.current;v.drive.reset({...h.boat,y:.78});}""")
  wait('document.getElementById("interact-label").textContent.includes("Deliver storm telemetry")');press(0)
  wait('__dinoAAA.state.state.active===null')
  check(page.evaluate('__dinoAAA.state.state.completed.includes("storm-response")'),'Xbox A completes the full directed story mission')
  check(page.locator('#info-dialog[open]').count()==1,'Completion uses a controller-native in-game dialog')
  snap('04-storm-complete.png');press(1)
  page.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide"))');page.reload(wait_until='domcontentloaded');wait('window.__dinoAAA?.state&&window.__dinoRanger?.state.ready',120000)
  check(page.evaluate('__dinoAAA.state.state.completed.includes("storm-response")'),'Vertical-slice completion survives a real reload')
  check(not errors,'No uncaught JavaScript errors in the AAA story journey')
  result={'passed':len(checks),'checks':checks,'errors':errors,'limitations':'Native Chromium over HTTP with software WebGL and synthetic standard Xbox input. Long-distance travel uses explicit test fixtures. Physical controller, speaker/headset and real GPU testing are not claimed.'};(OUT/'report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
  browser.close()
finally:
 if server:
  server.terminate()
  try:server.wait(timeout=3)
  except:server.kill()
