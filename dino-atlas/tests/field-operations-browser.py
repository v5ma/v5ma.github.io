"""Native software-WebGL mission journeys, driven by actual synthetic Xbox input.
Device input is synthetic. No position, inventory, objective or reward assignments.
"""
from pathlib import Path
import json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'field-ops-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
CASE=os.getenv('FIELD_CASE','tidegate');assert CASE in ('classic','tidegate','air')
SCENE='classic' if CASE=='classic' else 'tidegate';KEY='__dinoRanger' if SCENE=='classic' else '__tidegate'
PAD="""window.__pad={id:'Field operations synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad],configurable:true});"""
checks=[];errors=[];server=None;routes=[]
def check(value,name):
 assert value,name
 checks.append(name);print('PASS:',name,flush=True)
try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  opt=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):opt['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**opt);context=browser.new_context(viewport={'width':1280,'height':900});context.add_init_script(PAD);page=context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 and 'favicon' not in r.url else None)
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('shader' in m.text.lower() or 'webgl' in m.text.lower()) else None)
  def wait(expr,t=90000):page.wait_for_function(expr,timeout=t)
  def state():return page.evaluate('g.state')
  def snap(name):page.screenshot(path=str(OUT/(CASE+'-'+name+'.png')),timeout=45000)
  def release():page.evaluate('clearInterval(window.driver);__pad.axes.fill(0);__pad.buttons.forEach(b=>{b.value=0;b.pressed=false;});')
  def press(i):
   wait('!input.neutral',30000);page.evaluate('i=>{__pad.buttons[i]={value:1,pressed:true};}',i)
   try:page.wait_for_function('i=>input.previous[i]===true',arg=i,timeout=30000)
   finally:page.evaluate('i=>{__pad.buttons[i]={value:0,pressed:false};}',i)
   page.wait_for_function('i=>input.previous[i]===false&&!input.neutral',arg=i,timeout=30000)
  def choose(id):
   for _ in range(170):
    if page.evaluate('document.activeElement?.id')==id:press(0);return
    press(13)
   raise AssertionError('Controller cannot reach '+id)
  def walk(points):
   assert state()['mode']=='foot','Walking driver requires actual foot mode'
   for x,z in points:
    wait('!input.neutral');print('WALK',x,z,flush=True)
    page.evaluate('''([x,z])=>{window.arrived=false;window.driver=setInterval(()=>{const s=g.state,p=s.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.55){__pad.axes[0]=__pad.axes[1]=0;arrived=true;return;}const c=Math.cos(s.yaw),q=Math.sin(s.yaw);__pad.axes[0]=(dx*c-dz*q)/d;__pad.axes[1]=(dx*q+dz*c)/d;},20);}''',[x,z])
    try:wait('arrived',120000)
    finally:release()
    wait('Math.abs(g.state.speed)<.2',30000);routes.append({'kind':'walk','target':[x,z],'actual':state()['position']})
  def board(mode):
   wait('Math.abs(g.state.speed)<.2',30000);press(3);wait('g.state.mode==='+json.dumps(mode),30000)
  def assignment(id):
   release();press(9);choose('menu-field-contracts');wait('document.getElementById("field-contracts-dialog").open');choose('field-start-'+id);wait('g.state.field.active==='+json.dumps(id)+'&&!g.state.paused');check(True,'Controller starts '+id)
  def tool(id):
   release()
   if id in ('water','zapper'):press(14 if id=='water' else 15)
   else:
    for _ in range(4):
     if state()['field']['selected']==id:break
     press(5)
   wait('g.state.field.selected==='+json.dumps(id),30000)
  def work(target,utility,done):
   tool(utility);wait('!input.neutral');wait('Math.abs(g.state.speed)<.3',30000)
   page.evaluate('''id=>{window.aimed=false;__pad.buttons[6]={value:1,pressed:true};window.driver=setInterval(()=>{const s=g.state,raw=g.fieldOps.allTargets().find(t=>t.id===id),t=raw&&g.fieldOps.resolve(raw);if(!t)return;const v=g.fleet.current,p=v.drive.position,q=v.drive.body.rotation(),o=new THREE.Vector3(...g.fieldOps.profile.origin).applyQuaternion(new THREE.Quaternion(q.x,q.y,q.z,q.w)).add(new THREE.Vector3(p.x,p.y,p.z)),d=new THREE.Vector3(t.x,t.y,t.z).sub(o).normalize(),want=Math.atan2(-d.x,-d.z),ey=Math.atan2(Math.sin(want-s.yaw),Math.cos(want-s.yaw)),ep=-Math.asin(d.y)-s.aimPitch,axis=v=>Math.abs(v)<.003?0:Math.sign(v)*(.14+.86*Math.min(1,Math.abs(v)*3));__pad.axes[2]=axis(-ey);__pad.axes[3]=axis(ep);aimed=Math.abs(ey)<.035&&Math.abs(ep)<.035;__pad.buttons[7]={value:aimed?1:0,pressed:aimed};},20);}''',target)
   try:wait(done,120000)
   finally:release()
  def field_action(phase):
   wait('g.state.field.phase==='+json.dumps(phase)+'&&g.fieldOps.candidate()!==null&&Math.abs(g.state.speed)<.2',60000);press(0)
  def flight(x,z,y):
   assert state()['mode']=='helicopter';wait('!input.neutral');print('FLY',x,z,y,flush=True)
   page.evaluate('''([x,z,y])=>{window.arrived=false;window.driver=setInterval(()=>{const s=g.state,p=s.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),err=y-g.fleet.actor.targetY;__pad.buttons[12]={value:err>.2?1:0,pressed:err>.2};__pad.buttons[13]={value:err<-.2?1:0,pressed:err<-.2};const slow=Math.min(.6,Math.max(.08,d*.1)),c=Math.cos(s.yaw),q=Math.sin(s.yaw);__pad.axes[0]=d>.65?(dx*c-dz*q)/d*(.18+.82*slow):0;__pad.axes[1]=d>.65?(dx*q+dz*c)/d*(.18+.82*slow):0;const v=g.fleet.actor.body.linvel();if(d<1&&Math.abs(p.y-y)<.65&&Math.hypot(v.x,v.y,v.z)<.45){arrived=true;__pad.axes.fill(0);__pad.buttons[12].value=__pad.buttons[13].value=0;}},20);}''',[x,z,y])
   try:wait('arrived',150000)
   finally:release()
   routes.append({'kind':'flight','target':[x,z,y],'actual':state()['position']})
  def sail(x):
   assert state()['mode']=='boat';wait('!input.neutral');print('SAIL',x,flush=True)
   page.evaluate('''x=>{window.arrived=false;window.driver=setInterval(()=>{const s=g.state,p=s.position,dx=x-p.x,dz=38-p.z,d=Math.hypot(dx,dz),h=g.fleet.actor.heading,want=Math.atan2(dx,dz),e=Math.atan2(Math.sin(want-h),Math.cos(want-h));__pad.axes[0]=d>1?-Math.max(-1,Math.min(1,e*3)):0;__pad.axes[1]=Math.abs(e)<.2&&d>1?-(.18+.82*Math.min(.65,d*.14)):0;__pad.buttons[1]={value:d<1?1:0,pressed:d<1};if(d<1&&g.state.speed<.2)arrived=true;},20);}''',x)
   try:wait('arrived',120000)
   finally:release()
   routes.append({'kind':'boat','target':[x,38],'actual':state()['position']})
  try:
   page.goto(BASE+('index.html' if SCENE=='classic' else 'tidegate.html')+'?test=1',wait_until='domcontentloaded',timeout=90000);wait('window.'+KEY+'?.state.ready',120000)
   page.evaluate('async()=>{window.g=window.'+KEY+';window.input=g.xr.ctx.input;window.THREE=await import("./vendor/three.module.js");}')
   check(state()['field']['build']=='ranger-field-ops-20260917.1','Exact field-operations build boots')
   check(state()['field']['mountCount']==(4 if SCENE=='classic' else 3),'Every existing vehicle carries modeled utility equipment')
   check(state()['field']['total']==6,'Six authored assignments are available in this scene')
   press(0);wait('g.state.started')
   if page.locator('dialog[open]').count():press(1)
   press(9);choose('quality-select' if SCENE=='classic' else 'quality');choose('travel-xbox-layout');press(1)
   check(state()['travel']['xboxLayout']=='active','Active Xbox profile exposes direct aim, fire and mounted-tool cycling')
   if CASE in ('classic','tidegate'):
    assignment(SCENE+'-cooling');snap('assignment')
    if SCENE=='tidegate':walk([[-35,29],[-34,29]]);board('jeep')
    pump='gate-pump' if SCENE=='classic' else 'crane-pump';pump2='road-pump' if SCENE=='classic' else 'harbor-pump'
    before=state()['ammo'] if SCENE=='classic' else state()['progress']['ammo']
    work(pump,'scanner','g.state.field.phase==="water"');check(True,'Actual mounted scanner holds a clear line long enough to assess the unit')
    after=state()['ammo'] if SCENE=='classic' else state()['progress']['ammo'];check(after==before,'Scanning does not consume or manufacture water/pulse ammunition')
    work(pump,'water','g.state.field.done.includes('+json.dumps(pump)+')');snap('water-monitor')
    work(pump2,'water','g.state.field.phase==="report"');check(True,'Water from the actual mount cools both authored housings')
    after=state()['ammo'] if SCENE=='classic' else state()['progress']['ammo'];check(after[0]<=before[0]-24,'Cooling spends at least 24 real water charges')
    board('foot');walk([[0,51]] if SCENE=='classic' else [[-38,29],[-38,31]]);field_action('report');wait('g.state.field.commendations===1')
    check(True,'Returning on foot files one report and replenishes the existing tools')
    if SCENE=='tidegate':check(not state()['progress']['complete'] and state()['progress']['reportCount']==0,'Optional field report cannot complete or replay the original crossing reward')
   if CASE=='tidegate':
    assignment('tidegate-android');walk([[-38,29],[-38,23]]);board('jeep')
    work('service-android','scanner','g.state.field.phase==="pulse"');work('service-android','zapper','g.state.field.phase==="confirm"');check(True,'Mounted pulses reset the fictional android service panel')
    board('foot');walk([[-38,17],[-29,10],[-25,10]]);field_action('confirm');wait('g.state.field.phase==="report"');walk([[-29,15],[-35,29],[-38,31]]);field_action('report');wait('g.state.field.commendations===2');check(True,'Android restart requires grounded confirmation, not remote shooting alone')
    assignment('tidegate-boat-rescue');walk([[-35,29],[-35,43],[-25,43],[-14,38]]);board('boat');sail(5.8)
    work('east-crew','scanner','g.state.field.phase==="rescue"');work('east-crew','rescue','g.state.field.phase==="deliver"');check(state()['field']['cargo']['carrier']=='boat','Stable recovery line secures the crew basket to this boat')
    snap('rescued-crew');saved=state()['position'];page.reload(wait_until='domcontentloaded');wait('window.__tidegate?.state.ready',120000);page.evaluate('async()=>{window.g=__tidegate;window.input=g.xr.ctx.input;window.THREE=await import("./vendor/three.module.js");}')
    check(state()['field']['phase']=='deliver' and state()['mode']=='boat','Reload retains the secured crew and resumes the occupied cargo carrier')
    check(abs(state()['position']['x']-saved['x'])<2,'Cargo reload does not teleport the return journey to the home dock');press(0);wait('g.state.started');sail(-6.5);field_action('deliver');wait('g.state.field.phase==="report"');board('foot');walk([[-14,43],[-25,43],[-35,29],[-38,31]]);field_action('report');wait('g.state.field.commendations===3');check(True,'Boat evacuation returns through the real channel without repairing the crossing')
   if CASE=='air':
    assignment('tidegate-roof-rescue');walk([[-35,44],[-53,44]]);board('helicopter');flight(-53,39,18);flight(54,14,18)
    work('roof-crew','scanner','g.state.field.phase==="rescue"');work('roof-crew','rescue','g.state.field.phase==="deliver"');check(state()['field']['cargo']['carrier']=='helicopter','Aerial scanner and hoist recover the actual roof engineer')
    snap('aerial-recovery');flight(-53,39,18);flight(-53,39,1.1);field_action('deliver');wait('g.state.field.phase==="report"');board('foot');walk([[-53,44],[-35,44],[-35,29],[-38,31]]);field_action('report');wait('g.state.field.commendations===1');check(True,'Helicopter landing and foot report finish the roof-rescue operation')
   count=state()['field']['commendations'];release();page.reload(wait_until='domcontentloaded');wait('window.'+KEY+'?.state.ready',120000);page.evaluate('window.g=window.'+KEY+';window.input=g.xr.ctx.input;')
   check(state()['field']['commendations']==count,'Ordinary reload retains each unique completed field report without duplicate awards')
   press(0);wait('g.state.started');press(9);choose('menu-field-contracts')
   check(page.locator('#field-start-'+('tidegate-roof-rescue' if CASE=='air' else SCENE+'-cooling')).is_disabled(),'Completed mission cannot be restarted for a duplicate commendation');snap('completed-board');press(1);wait('!g.state.paused')
   check(not errors,'No captured runtime, shader or game HTTP errors')
   report={'build':'ranger-field-ops-20260917.1','case':CASE,'base':BASE,'passed':len(checks),'checks':checks,'routes':routes,'errors':errors,'physicalHardwareVerified':False,'limitations':'Synthetic Xbox input in native software WebGL. No actor/mission/inventory/reward assignments. Does not establish physical-device comfort, human route understanding, every optional approach or biological realism.'}
   (OUT/(CASE+'-report.json')).write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
  except Exception as exc:
   diag={}
   try:release();diag=page.evaluate('({state:window.g?.state,focus:document.activeElement?.id,toast:document.getElementById("toast")?.textContent,lastHit:window.g?.fieldOps.lastHit})');snap('failure')
   except:pass
   (OUT/(CASE+'-failure.json')).write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors,'routes':routes,'diagnostic':diag},indent=2));raise
  finally:browser.close()
finally:
 if server:server.terminate()
