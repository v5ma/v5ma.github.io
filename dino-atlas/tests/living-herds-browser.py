"""Rendered software WebGL and synthetic Xbox. Explicit fixtures accelerate distant
travel and position existing residents in a clear lane; actions use the production input path.
"""
from pathlib import Path
import json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'herds-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
PAD="""window.__pad={id:'Living Herds Xbox acceptance',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad],configurable:true});try{if(!localStorage.getItem('dino-atlas.frontier.v2'))localStorage.setItem('dino-atlas.frontier.v2',JSON.stringify({version:2,settings:{low:true}}));}catch{}"""
checks=[];errors=[]
def check(v,name):
 assert v,name
 checks.append(name);print('PASS:',name,flush=True)
try:
 with sync_playwright() as pw:
  opts=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1100,'height':820});ctx.add_init_script(PAD)
  page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def wait(expr,timeout=60000):page.wait_for_function(expr,timeout=timeout)
  def button(i,on):page.evaluate('([i,on])=>{__pad.buttons[i]={pressed:on,touched:on,value:on?1:0};__pad.timestamp++;}',[i,on])
  def press(i):button(i,True);page.wait_for_timeout(250);button(i,False);page.wait_for_timeout(250)
  def choose(id):
   for _ in range(60):
    if page.evaluate('document.activeElement?.id')==id:press(0);return
    press(13)
   raise AssertionError('Controller cannot reach '+id)
  def snap(name):page.screenshot(path=str(OUT/name),timeout=45000)
  def train_target(uid,kind):
   page.evaluate("""([uid,kind])=>{const g=__dinoRanger,a=g.animals.find(a=>a.uid===uid);a.x=80;a.z=80;a.origin={x:80,z:80};a.pen=null;a.angle=Math.PI;a.deter=0;a.stun=0;a.life=null;a.collider.setTranslation({x:80,y:a.collisionHeight/2,z:80},true);g.teleport(80,94,Math.PI);g.setAim(0,.10);g.progress.tool=kind;g.tools.refill();g.herds.captureBaseline();}""",[uid,kind]);page.wait_for_timeout(400)
  try:
   page.goto(BASE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__dinoHerds&&window.__dinoRanger?.state.ready',120000)
   check(page.evaluate('__dinoRanger.state.build')=='living-herds-20260912.1','Living Herds boots over HTTP/WebGL')
   check(page.evaluate('__dinoHerds.state.animals.length')==64,'All 64 residents retained')
   check(page.evaluate('new Set(__dinoHerds.state.animals.map(a=>a.group)).size')==6,'Six behavior families active')
   snap('01-living-herds-intro.png');press(0);wait('__dinoRanger.state.started')
   if page.locator('#info-dialog[open]').count():press(1)
   wait('!__dinoRanger.state.paused');z=page.evaluate('__dinoRanger.state.position.z');button(7,True)
   try:wait(f'__dinoRanger.state.position.z<{z-2}')
   finally:button(7,False)
   check(True,'Xbox RT drives the actual jeep')
   press(9);wait('document.getElementById("menu-dialog").open');choose('menu-living-herds');wait('document.getElementById("living-herds-dialog").open')
   check(True,'D-pad and A reach study without scripted DOM focus');snap('02-field-study-menu.png');choose('herds-study-start');wait('__dinoHerds.state.study.active')
   train_target('legacy-2',0);wait('__dinoHerds.state.study.stage===1');check(True,'Quiet grazer observation advances live study');snap('03-articulated-triceratops.png')
   button(4,True);button(7,True)
   try:wait('__dinoHerds.state.study.stage===2')
   finally:button(7,False);button(4,False)
   check(True,'Water changes real dinosaur response and advances study')
   press(2);wait('__dinoRanger.state.reloading>0');check(True,'Xbox X reload remains mapped')
   press(9);wait('__dinoRanger.state.paused');before=page.evaluate('__dinoRanger.state.reloading');page.wait_for_timeout(700);check(page.evaluate('__dinoRanger.state.reloading')==before,'Pause freezes reload')
   choose('menu-living-herds');choose('herds-cue-density');press(15);check(page.evaluate('document.getElementById("herds-cue-density").value') in ['quiet','off'],'Controller adjusts wildlife cue density')
   press(1);wait('!__dinoRanger.state.paused');train_target('wild-forest',1);wait('__dinoHerds.state.study.stage===3')
   check(page.evaluate('__dinoHerds.state.animals.find(a=>a.uid==="wild-forest").warningCount')>0,'Predator warns before charging');snap('04-warning-posture.png')
   button(4,True);button(7,True)
   try:wait('__dinoHerds.state.study.stage===4')
   finally:button(7,False);button(4,False)
   check(True,'Xbox zapper interrupts real warning or charge');snap('05-interrupted-charge.png')
   check(page.evaluate('__dinoRanger.animals.every(a=>a.model.userData.rig?.limbs.length>=2)'),'All rendered residents have jointed-leg rigs')
   check(page.evaluate('__dinoRanger.animals.find(a=>a.uid==="wild-forest").model.userData.rig.head.rotation.x')!=0,'Predator head changes pose')
   page.evaluate('__dinoRanger.teleport(0,55)');wait('document.getElementById("interact-label").textContent.includes("File Living Herds")');before=page.evaluate('__dinoEconomy.state.credits');press(0);wait('document.getElementById("info-dialog").open')
   check(page.evaluate('__dinoEconomy.state.credits')==before+450,'Report pays existing economy once');check(page.evaluate('__dinoHerds.state.study.complete'),'Completion recorded');press(1);wait('!__dinoRanger.state.paused');snap('06-report-complete.png')
   page.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide"))');page.reload(wait_until='domcontentloaded');wait('window.__dinoHerds&&window.__dinoRanger?.state.ready',120000)
   check(page.evaluate('__dinoHerds.state.study.complete'),'Completion survives reload');check(page.evaluate('__dinoEconomy.state.credits')==before+450,'Reload does not duplicate credits')
   press(0);wait('__dinoRanger.state.started');press(9);wait('document.getElementById("menu-dialog").open');choose('menu-aaa-roadmap');wait('document.getElementById("aaa-roadmap-dialog").open')
   check('Living Herds' in page.locator('#aaa-roadmap-dialog').inner_text(),'In-game roadmap explains this pass and remaining gates');press(1);wait('!__dinoRanger.state.paused');check(True,'Xbox B closes roadmap without a mouse')
   check(not errors,'No uncaught JavaScript errors in tested journey')
   report={'build':'living-herds-20260912.1','passed':len(checks),'checks':checks,'errors':errors,'limitations':'Native software WebGL and synthetic Xbox. Explicit clear-lane fixtures reposition existing animals and player. Not a human playtest, physical-controller test or consumer-GPU performance measurement.'};(OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
  except Exception as exc:
   diagnostic={}
   try:diagnostic=page.evaluate('({herds:window.__dinoHerds?.state,game:window.__dinoRanger?.state,dialogs:[...document.querySelectorAll("dialog[open]")].map(d=>d.id),focus:document.activeElement?.id})');snap('failure.png')
   except Exception:pass
   (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'passed':checks,'errors':errors,'diagnostic':diagnostic},indent=2));print('FAIL',str(exc),flush=True);raise
  finally:browser.close()
finally:
 if server:server.terminate()
