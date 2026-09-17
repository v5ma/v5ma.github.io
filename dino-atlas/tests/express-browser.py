"""Actual-input vehicle/guide regression. Only device APIs and XR poses are mocked.
No actor, mission, inventory or physics assignments manufacture acceptance.
"""
from pathlib import Path
import json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'express-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
SCENE=os.getenv('EXPRESS_SCENE','tidegate');assert SCENE in ('tidegate','classic')
KEY='__tidegate' if SCENE=='tidegate' else '__dinoRanger';PAGE='tidegate.html' if SCENE=='tidegate' else 'index.html'
PAD="""window.__pad={id:'Express synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad],configurable:true});"""
checks=[];errors=[];server=None

def check(value,name):
 assert value,name
 checks.append(name);print('PASS:',name,flush=True)
try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  options=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**options);page=browser.new_page(viewport={'width':1280,'height':900});page.add_init_script(PAD);page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 and 'favicon' not in r.url else None)
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('shader' in m.text.lower() or 'webgl' in m.text.lower()) else None)
  def wait(e,t=90000):page.wait_for_function(e,timeout=t)
  def press(i):
   wait('!input.neutral',30000);page.evaluate('i=>__pad.buttons[i]={pressed:true,value:1}',i)
   try:page.wait_for_function('i=>input.previous[i]===true',arg=i,timeout=30000)
   finally:page.evaluate('i=>__pad.buttons[i]={pressed:false,value:0}',i)
   page.wait_for_function('i=>input.previous[i]===false&&!input.neutral',arg=i,timeout=30000)
  def choose(id):
   for _ in range(140):
    if page.evaluate('document.activeElement?.id')==id:press(0);return
    press(13)
   raise AssertionError('Xbox cannot reach '+id)
  def walk(points):
   for x,z in points:
    print('WALK',x,z,flush=True);wait('!input.neutral')
    page.evaluate('''([x,z])=>{window.arrived=false;window.walkTimer=setInterval(()=>{const s=g.state,p=s.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.65){__pad.axes[0]=__pad.axes[1]=0;arrived=true;clearInterval(walkTimer);return;}const c=Math.cos(s.yaw),q=Math.sin(s.yaw);__pad.axes[0]=(dx*c-dz*q)/d;__pad.axes[1]=(dx*q+dz*c)/d;},20);}''',[x,z])
    try:wait('arrived',90000)
    finally:page.evaluate('clearInterval(walkTimer);__pad.axes[0]=__pad.axes[1]=0;')
  def xrready():wait('!g.xr.gate.neutral.has(left)&&!g.xr.gate.neutral.has(right)&&g.xr.context===g.xr.ctx.modal()',30000)
  def xrpress(side,i):
   xrready();page.evaluate('([s,i])=>window[s].gamepad.buttons[i].value=1',[side,i])
   try:page.wait_for_function('([s,i])=>g.xr.gate.states.get(window[s])?.[i]===true',arg=[side,i],timeout=30000)
   finally:page.evaluate('([s,i])=>window[s].gamepad.buttons[i].value=0',[side,i])
   xrready()
  def ammo():return page.evaluate('g.xr.ctx.fleet.state.ammo[0]')
  try:
   page.goto(BASE+PAGE+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.'+KEY+'?.state.ready',120000);page.evaluate('window.g=window.'+KEY+';window.input=g.xr.ctx.input;')
   check(page.evaluate('g.state.travel.build')=='ranger-express-20260917.1','Express build boots in '+SCENE)
   press(0);wait('g.state.started')
   if page.locator('dialog[open]').count():press(1)
   press(8);wait('document.getElementById("map-dialog").open');check('GOAL:' in page.locator('#map-destination').inner_text(),'Map names the current objective and distance')
   check(page.evaluate('g.state.guidance.distance')>=0,'Guide targets the actual current task')
   page.screenshot(path=str(OUT/(SCENE+'-map.png')));press(1)
   press(9);choose('travel-xbox-layout');check(page.evaluate('g.state.travel.xboxLayout')=='active','Xbox can select the optional stick-drive profile')
   choose('travel-multiplier');check(page.evaluate('g.state.travel.multiplier')==8,'Xbox can adjust express speed without mouse');choose('travel-multiplier');choose('travel-multiplier');check(page.evaluate('g.state.travel.multiplier')==4,'Speed returns to intended 4x setting');press(1)
   if SCENE=='classic':
    # Real jeep travel before disembarking, not an actor fixture.
    press(10);check(page.evaluate('g.state.travel.express'),'Xbox stick click latches express without a hold')
    before=page.evaluate('g.state.position');page.evaluate('__pad.axes[1]=-1')
    try:page.wait_for_function('p=>Math.hypot(g.state.position.x-p.x,g.state.position.z-p.z)>3',arg=before,timeout=45000)
    finally:page.evaluate('__pad.axes[1]=0;__pad.buttons[1]={pressed:true,value:1}')
    wait('Math.abs(g.xr.ctx.fleet.actor.speed)<1.5');page.evaluate('__pad.buttons[1]={pressed:false,value:0}');check(not page.evaluate('g.state.travel.express'),'Brake cancels latched express in the actual jeep');press(3);wait('g.state.mode==="foot"')
   else:walk([[-35,31],[-38,31]])
   # Mock the device only. The production handler and original game state remain active.
   page.evaluate('''async()=>{const x=g.xr;window.T=await import('./vendor/three.module.js');const make=handedness=>({handedness,gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({value:0,pressed:false}))}});window.left=make('left');window.right=make('right');window.session=new EventTarget();session.inputSources=[left,right];session.visibilityState='visible';session.end=async()=>session.dispatchEvent(new Event('end'));Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>true,requestSession:async()=>session}});g.renderer.xr.setSession=async()=>{};x.presentation.view='first-person-vr';await x.enter();g.camera.position.set(0,1.65,0);g.camera.quaternion.identity();for(const [i,s] of [[0,left],[1,right]]){const e=x.controllers[i];e.ray.visible=true;e.ray.position.set(i?.25:-.25,1.3,-.25);e.ray.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),new T.Vector3(0,1,0));e.ray.updateMatrix();e.ray.dispatchEvent({type:'connected',data:s});}window.events=[];const original=x.ctx.action;x.ctx.action=key=>{events.push(key);original(key);};}''');xrready()
   before=ammo();awaited=page.evaluate('right.gamepad.buttons[0].value=1')
   try:wait('g.xr.ctx.fleet.state.ammo[0]<'+str(before),30000)
   finally:page.evaluate('right.gamepad.buttons[0].value=0')
   check(ammo()<before,'Right trigger spends actual ammunition');xrready();xrpress('right',1)
   check(page.evaluate('events.includes("interact")'),'Right grip routes through the ordinary interaction handler')
   if SCENE=='tidegate':check(ammo()==100,'Grip at the home station performs actual replenishment')
   if page.locator('dialog[open]').count():xrpress('right',5)
   xrpress('left',1);check(page.evaluate('events.filter(e=>e==="interact").length')>=2,'Either grip can interact')
   if page.locator('dialog[open]').count():xrpress('right',5)
   xrpress('right',3);wait('document.getElementById("map-dialog").open');check(True,'Right-stick click opens map directly in XR');xrpress('right',5);wait('!g.state.paused')
   # Both worlds have a physically accessible initial helicopter bay.
   if SCENE=='tidegate':walk([[-35,31],[-35,44],[-53,44]])
   else:walk([[10,62],[19,60],[19,59]])
   xrpress('left',5);wait('g.state.mode==="helicopter"');check(True,'Y boards the actual helicopter after walking to its bay')
   xrready();page.evaluate('right.gamepad.axes[3]=-1')
   try:wait('g.state.position.y>10',45000)
   finally:page.evaluate('right.gamepad.axes[3]=0')
   target=page.evaluate('g.xr.ctx.fleet.actor.targetY');before=ammo();page.evaluate('left.gamepad.buttons[0].value=1;right.gamepad.buttons[0].value=1')
   try:wait('g.xr.ctx.fleet.state.ammo[0]<'+str(before),30000)
   finally:page.evaluate('left.gamepad.buttons[0].value=right.gamepad.buttons[0].value=0')
   check(abs(page.evaluate('g.xr.ctx.fleet.actor.targetY')-target)<.001,'Aim/fire triggers do not alter helicopter altitude')
   xrready();xrpress('left',3);check(page.evaluate('g.state.travel.express'),'Quest left-stick click latches unlimited-duration express')
   before=page.evaluate('g.state.position');page.evaluate('left.gamepad.axes[2]=1')
   try:page.wait_for_function('p=>Math.hypot(g.state.position.x-p.x,g.state.position.z-p.z)>6',arg=before,timeout=45000)
   finally:page.evaluate('left.gamepad.axes[2]=0;right.gamepad.buttons[4].value=1')
   wait('!g.state.travel.express');page.evaluate('right.gamepad.buttons[4].value=0');check(True,'A brakes/hovers and cancels express after actual flight')
   xrready();xrpress('left',3);page.evaluate('g.xr.controllers[0].ray.visible=false');wait('!g.state.travel.express');check(True,'Temporary tracked-pose loss disarms express without removing the source');page.evaluate('g.xr.controllers[0].ray.visible=true');xrready()
   xrready();xrpress('left',3);xrpress('right',5);check(not page.evaluate('g.state.travel.express'),'Opening a menu disarms express')
   page.screenshot(path=str(OUT/(SCENE+'-controls.png')));page.evaluate('session.end()');wait('!g.xr.active')
   # Use the normal UI for persisted preferences; reload does not inject a save.
   choose('travel-xr-layout');check(page.evaluate('g.state.travel.xrLayout')=='legacy','Legacy Quest layout stays reachable')
   press(1);page.reload(wait_until='domcontentloaded');wait('window.'+KEY+'?.state.ready',120000);page.evaluate('window.g=window.'+KEY+';window.input=g.xr.ctx.input;')
   check(page.evaluate('g.state.travel.xrLayout')=='legacy' and page.evaluate('g.state.travel.xboxLayout')=='active','Control profiles survive an ordinary reload')
   check(not page.evaluate('g.state.travel.express'),'Reload never restores armed high speed')
   check(not errors,'No captured runtime, shader or HTTP errors')
   (OUT/(SCENE+'-report.json')).write_text(json.dumps({'build':'ranger-express-20260917.1','scene':SCENE,'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'physicalHardwareVerified':False,'limits':'Actual movement, boarding, tools and UI driven by synthetic Xbox/Quest values. XR session/poses mocked. Hour test is policy-only, not a one-hour hardware flight. No actor, objective or inventory assignments.'},indent=2))
  except Exception as e:
   diag={}
   try:diag=page.evaluate('({state:window.g?.state,focus:document.activeElement?.id,neutral:window.input?.neutral,events:window.events})');page.screenshot(path=str(OUT/(SCENE+'-failure.png')),timeout=30000)
   except:pass
   (OUT/(SCENE+'-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'diagnostic':diag},indent=2));raise
  finally:browser.close()
finally:
 if server:server.terminate()
