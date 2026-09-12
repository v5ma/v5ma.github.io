"""Northstar signature-facility acceptance using rendered WebGL and synthetic standard Xbox input.
Distant repositioning is limited to reaching the facility; doorway walking, the service ascent,
roof airlock, circuit interactions, controller UI and persistence use production behavior.
"""
from pathlib import Path
import json,math,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'northstar-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
PAD="""window.__pad={id:'Northstar Xbox acceptance',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad],configurable:true});try{if(!localStorage.getItem('dino-atlas.frontier.v2'))localStorage.setItem('dino-atlas.frontier.v2',JSON.stringify({version:2,settings:{low:true}}));}catch{}"""
checks=[];errors=[]
def check(v,name):
 assert v,name;checks.append(name);print('PASS:',name,flush=True)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  ctx=browser.new_context(viewport={'width':1180,'height':840});ctx.add_init_script(PAD);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def wait(expr,timeout=90000):page.wait_for_function(expr,timeout=timeout)
  def button(i,on):page.evaluate('([i,on])=>{__pad.buttons[i]={pressed:on,touched:on,value:on?1:0};__pad.timestamp++;}',[i,on])
  def press(i):button(i,True);page.wait_for_timeout(220);button(i,False);page.wait_for_timeout(240)
  def choose(id):
   for _ in range(80):
    if page.evaluate('document.activeElement?.id')==id:press(0);return
    press(13)
   raise AssertionError('Controller cannot reach '+id)
  def snap(name):page.screenshot(path=str(OUT/name),timeout=45000)
  def set_foot(x,y,z):page.evaluate('([x,y,z])=>{const f=__dinoRanger.fleet;f.person.setActive(false);f.active="foot";f.person.setActive(true,{x,y,z});__dinoRanger.setAim(0);}',[x,y,z]);page.wait_for_timeout(300)
  def axes(x=0,y=0):page.evaluate('([x,y])=>{__pad.axes[0]=x;__pad.axes[1]=y;__pad.timestamp++;}',[x,y])
  def move_to(x,z,tol=1.35,limit=900):
   for _ in range(limit):
    p=page.evaluate('__dinoRanger.state.position');dx=x-p['x'];dz=z-p['z'];d=math.hypot(dx,dz)
    if d<tol:axes();page.wait_for_timeout(120);return p
    axes(dx/d,dz/d);page.wait_for_timeout(55)
   axes();raise AssertionError(f'Could not walk to {(x,z)} from {page.evaluate("__dinoRanger.state.position")}')
  try:
   page.goto(BASE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__dinoNorthstar?.state&&window.__dinoRanger?.state.ready',120000)
   check(page.evaluate('__dinoRanger.state.signatureBuild')=='northstar-signature-20260912.1','Northstar signature build boots over HTTP/WebGL')
   check(page.evaluate('__dinoRanger.state.animals.length')==64,'All 64 residents remain')
   snap('01-northstar-canopy-overview.png');press(0);wait('__dinoRanger.state.started')
   if page.locator('#info-dialog[open]').count():press(1);wait('!__dinoRanger.state.paused')
   press(9);wait('document.getElementById("menu-dialog").open');choose('menu-northstar');wait('document.getElementById("northstar-dialog").open');check(True,'Xbox reaches the Northstar activity without mouse focus');snap('02-canopy-circuit-menu.png');choose('northstar-start');wait('__dinoNorthstar.state.state.active')
   # Stage 0: explicit distant fixture to the facility entrance, then production A interaction.
   set_foot(-35,1.1,-331);wait('document.getElementById("interact-label").textContent.includes("Canopy Circuit")');press(0);wait('__dinoNorthstar.state.state.stage===1')
   check(True,'Entrance console starts the five-stage circuit with A')
   # Walk through the real 1.7 m Northstar doorway and switchback corridor.
   set_foot(-30,1.1,-330);move_to(-30,-343);move_to(-17,-343);move_to(-17,-363);wait('document.getElementById("interact-label").textContent.includes("seed-vault")');snap('03-seed-vault-interior.png');press(0);wait('__dinoNorthstar.state.state.stage===2');check(True,'Actual doorway and corridor walking reaches the seed-vault relay')
   # Climb both physical exterior stair flights with the synthetic Xbox left stick.
   x1=-3.8;x2=.2;zF=-335;zB=-366;set_foot(x1,1.1,zF);move_to(x1,zB,1.4,1100);move_to(x2,zB,1.4,500);move_to(x2,zF,1.4,1200)
   check(page.evaluate('__dinoRanger.state.position.y')>24,'Exterior service ascent physically reaches roof height')
   wait('document.getElementById("interact-label").textContent.includes("roof service airlock")');snap('04-service-ascent.png');press(0);wait('__dinoNorthstar.state.state.lastRoute==="service"');check(True,'A opens the roof service airlock without bypassing the safety rail')
   move_to(-38,-345);wait('document.getElementById("interact-label").textContent.includes("roof wind sensor")');press(0);wait('__dinoNorthstar.state.state.stage===3');check(True,'Roof wind sensor advances the circuit')
   move_to(-38,-361);wait('document.getElementById("interact-label").textContent.includes("canopy spine")');snap('05-canopy-observatory.png');press(0);wait('__dinoNorthstar.state.state.stage===4');check(True,'Canopy spine reset uses the rooftop observatory')
   # Return through the same service airlock and physically descend both flights.
   move_to(-14,-341);wait('document.getElementById("interact-label").textContent.includes("service descent")');press(0);wait('__dinoRanger.state.position.x> -2');move_to(x2,zB,1.5,1200);move_to(x1,zB,1.5,500);move_to(x1,zF,1.5,1200);check(page.evaluate('__dinoRanger.state.position.y')<3,'Service ascent is reversible on foot')
   move_to(-35,-331,1.6,900);wait('document.getElementById("interact-label").textContent.includes("File Canopy Circuit")');before=page.evaluate('__dinoEconomy.state.credits');press(0);wait('document.getElementById("info-dialog").open');check(page.evaluate('__dinoEconomy.state.credits')==before+750,'First Canopy Circuit completion pays exactly 750 credits');check(page.evaluate('__dinoNorthstar.state.state.completed')==1,'Circuit completion is recorded');snap('06-canopy-circuit-complete.png');press(1)
   page.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide"))');page.reload(wait_until='domcontentloaded');wait('window.__dinoNorthstar?.state&&window.__dinoRanger?.state.ready',120000)
   check(page.evaluate('__dinoNorthstar.state.state.completed')==1,'Northstar completion survives reload');check(page.evaluate('__dinoEconomy.state.credits')==before+750,'Northstar credits survive reload');check(not page.evaluate('__dinoEconomy.grant(750,"aaa:northstar-canopy")'),'Saved reward ledger rejects a duplicate Northstar payout')
   check(not errors,'No uncaught JavaScript errors in the Northstar journey')
   report={'build':'northstar-signature-20260912.1','passed':len(checks),'checks':checks,'errors':errors,'limitations':'Native software WebGL and synthetic Xbox. One distant fixture reaches Northstar; doorway walking, both service-stair flights, airlock crossing, roof interactions, completion and reload use production behavior. Not a human art review, physical-controller certification or consumer-GPU performance measurement.'};(OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
  except Exception as exc:
   diagnostic={}
   try:diagnostic=page.evaluate('({northstar:window.__dinoNorthstar?.state,game:window.__dinoRanger?.state,dialogs:[...document.querySelectorAll("dialog[open]")].map(d=>d.id),focus:document.activeElement?.id,label:document.getElementById("interact-label")?.textContent})');snap('failure.png')
   except Exception:pass
   (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'passed':checks,'errors':errors,'diagnostic':diagnostic},indent=2));print('FAIL',str(exc),flush=True);raise
  finally:browser.close()
finally:
 if server:server.terminate()
