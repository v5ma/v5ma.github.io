"""First Light through ordinary input, production physics, chapter UI and save/reload.
No assignments to player position, mission, animals, inventory or rewards.
Optional XR case mocks device/session poses only and uses the same story actions.
"""
from pathlib import Path
import json,os,subprocess,time,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'living-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
XR=os.getenv('LIVING_XR','0')=='1';NAME='xr' if XR else 'screen';checks=[];errors=[];routes=[];server=None
PAD="""window.__pad={id:'Living Reserve synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[__pad]});"""
def check(ok,name):
 assert ok,name
 checks.append(name);print('PASS',name,flush=True)
try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  opts=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1100,'height':800});page.add_init_script(PAD)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  page.on('requestfailed',lambda r:errors.append(r.url+' '+str(r.failure)))
  page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 and 'favicon' not in r.url else None)
  def wait(expr,t=60000):page.wait_for_function(expr,timeout=t)
  def ready():
   wait("window.__dinoRanger?.state.ready || document.getElementById('load-status')?.textContent.includes('could not start')",120000)
   assert page.evaluate('!!window.__dinoRanger?.state.ready'), 'Bootstrap failed: '+page.locator('#load-status').inner_text()+' / '+str(errors)
   page.evaluate('window.g=__dinoRanger;window.input=g.xr.ctx.input;')
  def press(i):
   wait('!input.neutral',30000);page.evaluate('i=>__pad.buttons[i]={pressed:true,value:1}',i)
   try:page.wait_for_function('i=>input.previous[i]===true',arg=i,timeout=30000)
   finally:page.evaluate('i=>__pad.buttons[i]={pressed:false,value:0}',i)
   page.wait_for_function('i=>input.previous[i]===false&&!input.neutral',arg=i,timeout=30000)
  def choose(id):
   for _ in range(90):
    if page.evaluate('document.activeElement?.id')==id:press(0);return
    press(13)
   raise AssertionError('Controller cannot reach '+id)
  def finish():
   for _ in range(10):
    if not page.locator('#living-dialog').evaluate('(e)=>e.open'):return
    choose('living-next')
   raise AssertionError('Conversation does not close')
  def walk(points):
   for x,z in points:
    wait('!input.neutral');page.evaluate('''([x,z])=>{window.arrived=false;window.driver=setInterval(()=>{const s=g.state,p=s.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),c=Math.cos(s.yaw),q=Math.sin(s.yaw);if(d<.5){__pad.axes.fill(0);arrived=true;return;}__pad.axes[0]=(dx*c-dz*q)/d;__pad.axes[1]=(dx*q+dz*c)/d;},20);}''',[x,z])
    try:wait('arrived',120000)
    finally:page.evaluate('clearInterval(window.driver);__pad.axes.fill(0)')
    wait('Math.abs(g.state.speed)<.2');routes.append({'goal':[x,z],'actual':page.evaluate('g.state.position')})
  def act(stage):
   wait('g.state.living.candidate!==null');press(0);wait('g.state.living.stage==='+str(stage));finish()
  try:
   page.goto(BASE+'index.html?test=1',wait_until='domcontentloaded',timeout=90000);ready()
   check(page.evaluate('g.state.living.build')=='living-reserve-20260922.1','Story module boots in the full regular reserve')
   check(page.locator('#living-play').is_visible(),'The story is visible on the regular-game opening screen')
   check(not page.evaluate('g.state.living.active'),'Ordinary existing saves are not auto-enrolled or reset')
   choose('living-play');wait('g.state.started&&document.getElementById("living-dialog").open');check('AI Singularity' in page.locator('#living-line').inner_text(),'The actual prologue uses the requested AI Singularity DNA origin');finish()
   press(9);page.select_option('#quality-select','low');press(1)
   if XR:
    page.evaluate('''async()=>{window.T=await import('./vendor/three.module.js');window.session=new EventTarget();session.inputSources=[];session.visibilityState='visible';session.end=async()=>session.dispatchEvent(new Event('end'));Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>true,requestSession:async()=>session}});g.renderer.xr.setSession=async()=>{};await g.xr.checkSupport();}''')
    press(9);page.select_option('#xr-presentation','diorama-vr');page.locator('#xr-enter').click();wait('g.xr.active');page.evaluate('g.camera.position.set(0,1.65,0);g.camera.quaternion.identity()')
    for _ in range(5):
     if not page.locator('dialog[open]').count():break
     press(1)
    check(page.evaluate('g.xr.console.feedback.root.visible'),'XR floor UI remains present for the story')
   press(3);wait('g.state.mode==="foot"');walk([[-4,54],[-4,45],[5,44]]);act(1)
   check(page.evaluate('g.state.living.stage')==1,'Meet Mara through ordinary in-reach interaction')
   walk([[0,39],[0,24],[-12,13]])
   # A shifted view is still ordinary walking; never move the animal to the test.
   for p in [[-12,13],[-18,12],[-15,10]]:
    if page.evaluate('g.state.living.candidate==="watch"'):break
    walk([p])
   act(2);check(bool(page.evaluate('g.state.living.observation.uid')),'Observe an actually visible living resident without firing a tool')
   walk([[0,16],[8,14],[18,14],[24,17]]);act(3);check(True,'Reach Ivo by the real ramp-bypass route')
   walk([[31,7],[30,-7],[29,-20],[31,-23]]);act(4);act(5)
   check(page.evaluate('g.state.living.corridorRestored'),'Service record and second physical interaction restore the corridor')
   page.screenshot(path=str(OUT/(NAME+'-relay.png')))
   if XR:
    press(9);choose('menu-living-reserve');choose('living-origin');wait('document.getElementById("living-dialog").open');wait('g.xr.rows.length>0')
    check('Singularity' in page.locator('#living-line').inner_text(),'Story origin is accessible through the same XR menu flow')
    finish();page.evaluate('session.end()');wait('!g.xr.active')
   saved=page.evaluate('g.state.position');page.reload(wait_until='domcontentloaded');ready()
   check(page.evaluate('g.state.living.stage')==5 and page.evaluate('g.state.living.corridorRestored'),'Reload preserves the chapter and restored passage')
   check(abs(page.evaluate('g.state.position.x')-saved['x'])<1 and abs(page.evaluate('g.state.position.z')-saved['z'])<1,'Reload retains the actual ranger location instead of skipping travel')
   press(0);wait('g.state.started')
   if page.locator('dialog[open]').count():press(1)
   walk([[35,-28],[37,-34],[37,-43],[47,-51]]);act(6)
   check(True,'Walk through the reopened physical gate to recover the recording')
   walk([[37,-43],[37,-34],[35,-28],[29,-20],[30,-7],[31,7],[24,17],[18,14],[8,14],[0,16],[0,39],[-4,44]]);act(7)
   check(page.evaluate('g.state.living.complete&&!g.state.living.active'),'Return to Leena completes First Light without another unrelated fetch task')
   press(9);choose('menu-living-reserve');check(page.locator('#living-records button').count()==7,'All seven completed conversations remain replayable')
   check(page.locator('#living-resume').is_disabled(),'Completed chapter is not restarted for a duplicate reward')
   page.screenshot(path=str(OUT/(NAME+'-journal.png')));press(1)
   page.reload(wait_until='domcontentloaded');ready();check(page.evaluate('g.state.living.complete'),'Chapter completion survives a second ordinary reload')
   check(not errors,'No captured boot, JavaScript, shader, request or HTTP errors')
   report={'build':'living-reserve-20260922.1','base':BASE,'case':NAME,'passed':len(checks),'checks':checks,'routes':routes,'errors':errors,'physicalHardwareVerified':False,'limits':'Native software WebGL; synthetic Xbox and optional explicit XR session/head poses. No actor, mission, inventory or reward assignments. Opening chapter only, not an entire future campaign.'}
   (OUT/(NAME+'-report.json')).write_text(json.dumps(report,indent=2))
  except Exception as e:
   diag={}
   try:diag=page.evaluate('({state:window.g?.state,status:document.getElementById("load-status")?.textContent,focus:document.activeElement?.id,dialogs:[...document.querySelectorAll("dialog[open]")].map(d=>d.id)})');page.screenshot(path=str(OUT/(NAME+'-failure.png')),timeout=30000)
   except:pass
   (OUT/(NAME+'-failure.json')).write_text(json.dumps({'error':str(e),'errors':errors,'checks':checks,'routes':routes,'diagnostic':diag},indent=2));raise
  finally:browser.close()
finally:
 if server:server.terminate()
