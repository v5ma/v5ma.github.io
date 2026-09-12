"""Actual HTTP/WebGL shader and Xbox acceptance. Position fixtures accelerate
travel to existing scenes; all controls/menus/reload/wake driving use production input.
No claims about physical hardware, real GPU frame rates or human comfort.
"""
from pathlib import Path
import os,json,subprocess,time,traceback
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'coastal-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None
if BASE.startswith('http://127.0.0.1'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.5)
PAD="""window.__pad={id:'Coastal Light standard Xbox acceptance',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>__pad.connected?[__pad]:[],configurable:true});try{if(!localStorage.getItem('dino-atlas.ranch.v1'))localStorage.setItem('dino-atlas.ranch.v1',JSON.stringify({version:1,welcomed:true,guided:false}));}catch{}"""
checks=[];errors=[]
def check(v,label):
 assert v,label
 checks.append(label);print('PASS',label,flush=True)
try:
 with sync_playwright() as pw:
  opts=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1100,'height':800},device_scale_factor=1);ctx.add_init_script(PAD)
  page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  def wait(expr,timeout=90000):page.wait_for_function(expr,timeout=timeout)
  def state():return page.evaluate('__dinoOptics.state')
  def button(i,on):page.evaluate('([i,on])=>{__pad.buttons[i]={pressed:on,touched:on,value:on?1:0};__pad.timestamp++;}',[i,on])
  def press(i):
   button(i,True)
   try:page.wait_for_function('(i)=>__dinoRanger.optics.ctx.input.previous[i]===true',arg=i,timeout=30000)
   finally:button(i,False)
   page.wait_for_function('(i)=>__dinoRanger.optics.ctx.input.previous[i]===false&&!__dinoRanger.optics.ctx.input.neutral',arg=i,timeout=30000)
   page.wait_for_timeout(100)
  def focus(id):
   for _ in range(70):
    if page.evaluate('document.activeElement?.id')==id:return
    press(13)
   raise AssertionError('D-pad did not reach '+id)
  def choose(id):focus(id);press(0)
  def menu():
   if not page.locator('#menu-dialog[open]').count():press(9)
   wait('document.getElementById("menu-dialog").open')
  def optics():menu();choose('menu-coastal-light');wait('document.getElementById("coastal-light-dialog").open')
  def shot(name):page.screenshot(path=str(OUT/name),timeout=60000)
  try:
   page.goto(BASE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.__dinoOptics&&window.__dinoRanger?.state.ready',120000)
   check(state()['build']=='coastal-light-20260912.1','Coastal Light initializes on the maintained game')
   check(state()['targets']=={'water':6,'canopy':5,'wet':39,'energy':46},'All intended water/canopy/road/pulse surfaces are attached')
   check(page.evaluate('__dinoRanger.state.animals.length')==64,'All 64 previous dinosaurs retained')
   check(state()['effective']=='balanced' and state()['post']['targets']==0,'Balanced starts without postprocessing allocations')
   check(state()['shaderErrors']==0,'Initial real material shader compilation succeeds');shot('01-coastal-light-intro.png')
   press(0);wait('__dinoRanger.state.started');wait('!__dinoRanger.state.paused');optics()
   check(True,'D-pad and Xbox A reach the shader panel without mouse or scripted focus');focus('coastal-preset');press(14)
   wait('__dinoOptics.state.effective==="classic"');check(page.evaluate('__dinoRanger.optics.fx.bindings.every(b=>b.mesh.material===b.original)'),'Classic restores the original materials')
   press(15);wait('__dinoOptics.state.effective==="balanced"');focus('coastal-water');press(0)
   check(page.evaluate('__dinoRanger.optics.fx.bindings.filter(b=>b.kind==="water").every(b=>b.mesh.material===b.original)'),'A disables water without changing other shader families');press(0)
   focus('coastal-bloom');press(15);check(state()['settings']['bloom']>.32,'D-pad adjusts the bloom slider');press(1);wait('!__dinoRanger.state.paused')
   check(True,'Xbox B closes the new shader window')
   # Cinematic is tested paused so software-renderer automatic quality adaptation
   # cannot race the assertion; no physics clock or simulation is accelerated.
   menu();focus('quality-select');press(14)
   if page.locator('#quality-select').input_value()!='high':press(15)
   choose('menu-coastal-light');focus('coastal-preset');press(15)
   wait('__dinoOptics.state.effective==="cinematic"&&__dinoOptics.state.post.targets===3',60000)
   check(state()['post']['passes']==4,'Cinematic renders the scene plus three bounded full-screen passes')
   check(state()['shaderErrors']==0,'Bloom, output tone mapping and custom material shaders compile')
   shot('02-controller-shader-settings.png');press(1)
   page.evaluate("__dinoRanger.fleet.person.setActive(false);__dinoRanger.fleet.active='boat';__dinoRanger.fleet.current.drive.reset({x:-164,y:.78,z:-153},Math.PI/2);__dinoRanger.setAim(.7);")
   page.wait_for_timeout(600);button(7,True)
   try:wait('__dinoOptics.state.wakes>=3',45000);shot('03-lagoon-water-and-wake.png')
   finally:button(7,False)
   check(state()['wakes']>0 and page.evaluate('__dinoRanger.state.speed')>1,'Actual boat driving feeds the bounded water-wake shader')
   menu();focus('night-toggle');press(15);press(1);page.wait_for_timeout(500);shot('04-dusk-lagoon.png')
   check(page.evaluate('__dinoRanger.optics.fx.uniforms.atlasNight.value')==1,'Dusk drives the water color and bioluminescent wake uniforms')
   menu();frozen=state()['clock'];page.wait_for_timeout(700);check(state()['clock']==frozen,'Opening a menu freezes shader time and visual age')
   focus('motion-toggle');press(15);wait('__dinoOptics.state.reduced&&__dinoOptics.state.wakes===0&&__dinoOptics.state.shells===0',30000);press(1);wait('!__dinoRanger.state.paused');frozen=state()['clock'];page.wait_for_timeout(600)
   check(state()['clock']==frozen and state()['wakes']==0 and state()['shells']==0,'Reduced Motion freezes wind/time and clears dynamic wake/shell effects')
   menu();focus('motion-toggle');press(14);focus('night-toggle');press(14);focus('quality-select');press(15)
   if page.locator('#quality-select').input_value()!='low':press(14)
   wait('__dinoOptics.state.effective==="balanced"');check(state()['post']['targets']==0,'Low graphics releases all Cinematic targets and uses Balanced')
   press(1);page.evaluate("__dinoRanger.fleet.active='jeep';__dinoRanger.teleport(0,113,Math.PI);__dinoRanger.setAim(.25);")
   button(7,True)
   try:wait('__dinoOptics.state.events>0',60000);shot('05-sonic-shell.png')
   finally:button(7,False)
   check(state()['events']>0 and page.evaluate('__dinoRanger.state.health')==100,'Crossing the real sonic gate produces harmless luminous shells')
   # Mounted tools still consume and reload finite ammunition.
   page.evaluate('__dinoRanger.jeep.body.setLinvel({x:0,y:0,z:0},true)');button(4,True);button(7,True)
   try:wait('__dinoRanger.state.ammo[0]<98',30000)
   finally:button(7,False);button(4,False)
   press(2);wait('__dinoRanger.state.reloading>0');wait('__dinoRanger.state.reloading===0',30000)
   check(page.evaluate('__dinoRanger.state.ammo[0]')==100,'Xbox X still reloads the mounted pressure hose')
   # Explicit dispatch starts the existing story and supplies wetness without
   # completing any task or changing its stage through a fixture.
   menu();choose('menu-aaa-director');choose('aaa-director-start');wait('__dinoAAA.state.state.active==="storm-response"');wait('__dinoRanger.optics.fx.uniforms.atlasStorm.value>.25');shot('06-storm-road-sheen.png')
   check(True,'The real Storm Response director drives the wet-road shader')
   menu();choose('menu-coastal-light');focus('coastal-preset')
   # Requested preset survived Low fallback; move from Cinematic to Balanced.
   press(14);wait('__dinoOptics.state.requested==="balanced"')
   page.evaluate('__pad.connected=false');page.wait_for_timeout(600);page.evaluate('__pad.connected=true');page.wait_for_timeout(600);press(1);wait('!__dinoRanger.state.paused')
   check(True,'Controller reconnection leaves shader panel dismissible with B')
   saved=state()['settings'];before=page.evaluate('({stage:__dinoAAA.state.state.stage,credits:__dinoEconomy.state.credits})');page.evaluate('window.dispatchEvent(new Event("pagehide"))')
   page.reload(wait_until='domcontentloaded');wait('window.__dinoOptics&&window.__dinoRanger?.state.ready',120000)
   check(state()['settings']==saved,'Shader settings survive a real reload')
   check(page.evaluate('__dinoAAA.state.state.stage')==before['stage'] and page.evaluate('__dinoEconomy.state.credits')==before['credits'],'Story stage and cargo economy survive the shader upgrade')
   check(state()['shaderErrors']==0 and not errors,'No uncaught JavaScript errors or shader failures in tested scenes')
   result={'passed':len(checks),'checks':checks,'errors':errors,'state':state(),'base':BASE,'limitations':'Native Chromium software WebGL and synthetic Xbox. Distant scene positions use fixtures. No physical gamepad, human visual/comfort review, consumer-GPU rate or full no-fixture island playthrough is certified.'}
   (OUT/'report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2),flush=True)
  except Exception as e:
   report={'error':str(e),'errors':errors,'checks':checks}
   try:report['state']=state();report['focus']=page.evaluate('document.activeElement?.outerHTML');report['game']=page.evaluate('__dinoRanger?.state');shot('failure.png')
   except Exception:pass
   (OUT/'failure.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True);traceback.print_exc();raise
  finally:browser.close()
finally:
 if server:server.terminate()
