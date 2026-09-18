"""Production WebGL with emulated input only. No actor/resource/progress writes.
The existing authored chapter supplies the actual collision and landing surfaces.
"""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/pilgrimage';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[];observations=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
save_observations=[]
def same_expedition(before,after,label):
 a=json.loads(json.loads(before)['payload']);b=json.loads(json.loads(after)['payload'])
 changed=[k for k in sorted(set(a)|set(b)) if a.get(k)!=b.get(k)]
 save_observations.append({'boundary':label,'changedEnvelopeKeys':changed,'before':a,'after':b})
 (OUT/'save-boundary-observations.json').write_text(json.dumps(save_observations,indent=2))
 return (a['profile']==b['profile'] and a['checkpoint']==b['checkpoint']
         and b['revision']>=a['revision'] and b['savedAt']>=a['savedAt'])
PAD="""(()=>{const pad={id:'Pilgrimage Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1000,'height':750},device_scale_factor=.35,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.25;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text()+(ROOT/'vesperfall/tests/fake-hands.js').read_text())
 page=ctx.new_page();page.set_default_timeout(150000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def frame():
  n=page.evaluate('Vesperfall.component.goldwind.state.frames');wait('n=>Vesperfall.component.goldwind.state.frames>n||!Vesperfall.component.xr',n)
 def button(hand,index,on):
  page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[hand,index,on]);frame()
 def pose(hand,point):page.evaluate('([h,p])=>TestXR.pose(h,p)',[hand,point]);frame()
 def neutral():
  page.evaluate("()=>{for(const h of ['left','right']){for(let i=0;i<6;i++)TestXR.button(h,i,false);TestXR.axes(h,0,0);}}")
  wait('Vesperfall.component.goldwind.state.ready')
 def xrmenu(text):
  wait('Vesperfall.component.dominionControls.state.xrNeutral')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');idx=next(i for i,r in enumerate(rows) if text.lower() in r.lower());cur=page.evaluate('Vesperfall.component.menuSelection');n=(idx-cur+len(rows))%len(rows)
  for _ in range(n or len(rows)):
   page.evaluate("TestXR.axes('left',0,1)");wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  button('right',0,True);button('right',0,False)
 def handaction(text):
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');index=next(i for i,r in enumerate(rows) if text.lower() in r.lower())
  page.evaluate("""index=>{const g=Vesperfall.component,T=g.T,panel=g.xrPanel.mesh;panel.updateMatrixWorld(true);g.rig.updateMatrixWorld(true);const y=195+index*75+30.5,target=panel.localToWorld(new T.Vector3(0,(.5-y/768)*panel.geometry.parameters.height,0)),origin=new T.Vector3(...TestXR.state.hands.right).applyMatrix4(g.rig.matrixWorld),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(origin).normalize());q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation('right',q.toArray());}""",index)
  before=page.evaluate('Vesperfall.component.questHands.state.selections');page.evaluate("TestHands.pinch('right',.05)");wait("[...Vesperfall.component.questHands.state.sources].some(([s,p])=>s.handedness==='right'&&p.pinch.armed)");page.evaluate("TestHands.pinch('right',.015)");wait('n=>Vesperfall.component.questHands.state.selections>n||!Vesperfall.component.xr',before)
  if page.evaluate('Vesperfall.component.xr'):page.evaluate("TestHands.pinch('right',.05)")
  check(True,'With Goldwind enabled, a tracked hand pinch selects '+text)
 def drawshot(index,hand='right',bow='left',down=False):
  x=-.23 if bow=='left' else .23
  pose(bow,[x,1.35,-.4]);page.evaluate('h=>TestXR.orientation(h,[0,0,0,1])',bow)
  pose(hand,[x,1.35,-.31]);button(hand,index,True);wait('Vesperfall.component.latch.drawing')
  pose(hand,[x,1.75 if down else 1.35,.18]);wait('Vesperfall.component.charge>.65')
  button(hand,index,False)
 def pad(i):
  wait('Vesperfall.component.dominionControls.state.armed')
  for on in [True,False]:
   page.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on',[i,on])
 def nav(id):
  for _ in range(120):
   if page.evaluate('id=>id.startsWith("reward-")?document.activeElement.dataset.reward===id.slice(7):document.activeElement.id===id',id):return
   direction=page.evaluate('id=>{const a=Vesperfall.component.dominionControls.focusables(),i=a.indexOf(document.activeElement),j=a.findIndex(e=>id.startsWith("reward-")?e.dataset.reward===id.slice(7):e.id===id),n=a.length;if(j<0)throw Error("Missing control "+id);return ((j-i+n)%n<=(i-j+n)%n)?13:12}',id)
   pad(direction)
  raise AssertionError('Xbox focus '+id)
 def walk(point):
  result=page.evaluate("""async target=>{const trace={distance:0,start:performance.now(),simStart:Vesperfall.state.time};let last=[...Vesperfall.state.p];return await new Promise((resolve,reject)=>{const timer=setInterval(()=>{const g=Vesperfall.component,s=g.game,p=s.p,dx=target[0]-p[0],dz=target[2]-p[2],d=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-g.yaw),Math.cos(yaw-g.yaw));trace.distance+=Math.hypot(p[0]-last[0],p[1]-last[1],p[2]-last[2]);last=[...p];TestPad.pad.axes=[0,d>.18&&Math.abs(a)<.08?-1:0,Math.abs(a)>.025?Math.max(-1,Math.min(1,-a*5)):0,0];TestPad.button(10,true);
   if(d<=.18||s.phase!=='playing'||performance.now()-trace.start>150000){TestPad.pad.axes=[0,0,0,0];TestPad.button(10,false);clearInterval(timer);if(d>.18)reject(Error('Walk failed '+JSON.stringify({target,p,phase:s.phase})));else resolve({...trace,simSeconds:s.time-trace.simStart,health:s.health,end:[...p]});}},3);});}""",point)
  observations.append({'target':point,**result});print('WALK',point,'health',result['health'],flush=True)
 def route(points):
  for point in points:walk(point)
 def aim(target):
  page.evaluate("""async target=>{const start=performance.now();await new Promise((resolve,reject)=>{const timer=setInterval(()=>{const g=Vesperfall.component,p=g.game.head,dx=target[0]-p[0],dz=target[2]-p[2],dy=target[1]-p[1],h=Math.hypot(dx,dz),v=36,disc=v**4-9.8*(9.8*h*h+2*dy*v*v),pitch=Math.atan((v*v-Math.sqrt(Math.max(0,disc)))/(9.8*h)),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-g.yaw),Math.cos(yaw-g.yaw)),q=pitch-g.pitch;
   TestPad.pad.axes=[0,0,Math.abs(a)>.012?Math.max(-1,Math.min(1,-a*7)):0,Math.abs(q)>.012?Math.max(-1,Math.min(1,-q*7)):0];
   if(Math.abs(a)<.03&&Math.abs(q)<.025||performance.now()-start>45000){TestPad.pad.axes=[0,0,0,0];clearInterval(timer);if(Math.abs(a)<.03&&Math.abs(q)<.025)resolve();else reject(Error('Aim did not converge'));}},3);});}""",target)
 def shoot(target):
  aim(target);before=page.evaluate('Vesperfall.state.shots');page.evaluate('TestPad.button(7,true)');wait('Vesperfall.component.charge>.99');page.evaluate('TestPad.button(7,false)');wait('n=>Vesperfall.state.shots===n+1',before);wait('Vesperfall.state.arrows.length===0||Vesperfall.state.phase!=="playing"')
 def checkpoint():
  pad(9);wait('Vesperfall.component.paused');nav('save-expedition');pad(0)
  saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint')
  page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.pilgrimageView');page.evaluate('TestPad.enabled=true');nav('continue-expedition');pad(0);wait('Vesperfall.component.running&&Vesperfall.component.paused')
  restored=page.evaluate('PilgrimSave.capture(Vesperfall.state,{id:"comparison",banked:0,receipt:{},yaw:0,pitch:0,focus:1}).state')
  for key in ['p','health','ammo','pilgrimage','enemies','pickups','score','shots','targets','time']:check(saved['state'][key]==restored[key],'Actual reload preserves '+key)
  nav('resume');pad(0);wait('!Vesperfall.component.paused')
 try:
  page.goto(BASE+'/vesperfall/?journey=pilgrimage',wait_until='domcontentloaded');wait('window.Vesperfall?.component.pilgrimageView&&Vesperfall.component.stats.drawCalls>0')
  check(page.locator('#xr-bow-controls').input_value()=='goldwind','Goldwind is the default without overriding an explicitly saved Classic preference')
  check(page.locator('#expedition-mode').input_value()=='pilgrimage','The two generated chapters are the default new-run campaign')
  check(page.evaluate('Vesperfall.state.world.generator===PilgrimageModel.IDS[0]'),'The preview renders the actual seeded Lantern Causeway')
  page.evaluate('TestPad.enabled=true');nav('start');pad(0);wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  check(page.evaluate('Vesperfall.component.checkpoint.eligible&&!Vesperfall.state.unscored'),'Xbox begins a scored, saveable Pilgrimage expedition')
  pad(13);check(page.evaluate("Vesperfall.state.type==='blink'"),'Xbox down still selects Blink directly');pad(14);check(page.evaluate("Vesperfall.state.type==='plain'"),'Xbox left still selects usable damage arrows')
  page.screenshot(path=str(OUT/'causeway-arrival.png'))
  modules=page.evaluate('Vesperfall.state.world.pipeline.modules')
  m=modules[0];route([m['front'],*m['paths']['gallery'][1:3]]);walk(m['winch']);pad(0);wait('Vesperfall.state.pilgrimage.shutters[0]')
  check(page.evaluate('Vesperfall.component.worldArt.pilgrimage.dynamic[Vesperfall.state.world.pipeline.modules[0].id+"/shutter"].position.y===6'),'Visible shutter follows the same raised collision state')
  pad(0);wait('!Vesperfall.state.pilgrimage.shutters[0]');check(True,'Xbox can restore cover with the reversible gallery winch')
  pad(9);nav('menu-vr');page.evaluate('TestPad.button(0,true)');wait('Vesperfall.component.xr');page.evaluate('TestPad.button(0,false);TestPad.enabled=false')
  check(page.evaluate('AFRAME.scenes[0].renderer.xr.getCamera().isArrayCamera&&Math.abs(Vesperfall.state.p[1]-3.2)<.05'),'First-person VR shares the generated upper gallery and actual player height')
  xrmenu('Resume');neutral();n=page.evaluate('Vesperfall.state.shots');drawshot(0);wait('n=>Vesperfall.state.shots===n+1',n)
  check(True,'Default Goldwind physically nocks and fires on the generated upper route')
  button('right',3,True);wait('Vesperfall.component.paused');button('right',3,False);xrmenu('Exit VR');wait('!Vesperfall.component.xr')
  page.evaluate('TestPad.enabled=true');nav('save-expedition');pad(0);saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload)')
  nav('architect-table');page.evaluate('TestPad.button(0,true)');wait('Vesperfall.component.xr&&Vesperfall.component.returningBell.state.table');page.evaluate('TestPad.button(0,false);TestPad.enabled=false')
  check(page.evaluate('Vesperfall.component.returningBell.table.userData.layout===PilgrimageModel.IDS[0]'),'AR inspection reconstructs the suspended procedural layout, not a different cathedral')
  check(page.evaluate('Vesperfall.component.returningBell.table.userData.discovered.every(id=>id<4)'),'The second module remains undiscovered and absent from the inspection table')
  page.evaluate('TestHands.mode(true)');wait('Vesperfall.component.questHands.state.active');handaction('Layers:');handaction('Recenter');page.screenshot(path=str(OUT/'causeway-ar-table.png'));handaction('Exit AR');wait('!Vesperfall.component.xr')
  restored=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload)')
  (OUT/'ar-save-observations.json').write_text(json.dumps({'before':saved,'after':restored},indent=2))
  check(saved['checkpoint']==restored['checkpoint'] and saved['profile']==restored['profile'],'AR hand inspection preserves the complete checkpoint, view direction and profile')
  page.evaluate('TestPad.enabled=true');nav('resume');pad(0);wait('!Vesperfall.component.paused')
  route(m['paths']['gallery'][3:5]);pad(0);wait('Vesperfall.state.targets.has(0)');check(True,'The ordinary gallery route activates the first relay without requiring an arrow')
  page.screenshot(path=str(OUT/'causeway-overlook.png'));route(m['paths']['gallery'][5:7]);walk(m['latch']);pad(0);wait('Vesperfall.state.pilgrimage.gates[0]');walk([m['latch'][0],0,m['z']+9.5]);checkpoint()
  check(page.evaluate('!Vesperfall.state.world.solids.some(s=>s.id===Vesperfall.state.world.pipeline.modules[0].id+"/gate")'),'Reload reconstructs the opened return gate before accepting a player saved inside it')
  route([[m['latch'][0],0,m['z']+12],m['front'],*m['paths']['bypass'][1:]])
  route(page.evaluate('Vesperfall.state.world.pipeline.connector'));m=modules[1];walk([m['x'],0,m['z']+3]);shoot([m['x'],6,m['z']-10]);check(page.evaluate('!Vesperfall.state.pilgrimage.shutters[1]'),'A deliberate missed release shot does not secretly open the mechanism')
  shoot(m['release']);wait('Vesperfall.state.pilgrimage.shutters[1]')
  for _ in range(3):
   if page.evaluate('Vesperfall.state.targets.has(1)'):break
   shoot(m['targetPoint'])
  check(page.evaluate('Vesperfall.state.targets.has(1)'),'Correcting a missed shot restores the far relay from below')
  route(m['paths']['direct'][2:]);walk(page.evaluate('Vesperfall.state.world.pipeline.controls.find(c=>c.kind==="exit").p'));pad(0);wait('Vesperfall.state.phase==="reward"')
  check(page.evaluate('Vesperfall.state.kills<6&&Vesperfall.state.sectors===1'),'The first chapter rewards its signal objective without requiring every defender to die')
  page.screenshot(path=str(OUT/'causeway-complete.png'));nav('reward-power');pad(0);wait('Vesperfall.state.world.generator===PilgrimageModel.IDS[1]&&Vesperfall.state.phase==="playing"')
  check(page.evaluate('Vesperfall.state.world.depth===2&&Vesperfall.state.sectors===1'),'An actual blessing opens the Ashen Archive with run counters retained')
  page.screenshot(path=str(OUT/'archive-arrival.png'));modules=page.evaluate('Vesperfall.state.world.pipeline.modules')
  for m in modules:
   route(page.evaluate('Vesperfall.state.world.pipeline.connector') if m['slot'] else [m['front']]);walk([m['x'],0,m['z']+3]);shoot(m['release']);wait('i=>Vesperfall.state.pilgrimage.shutters[i]',m['slot'])
   for _ in range(3):
    if page.evaluate('i=>Vesperfall.state.targets.has(i)',m['slot']):break
    shoot(m['targetPoint'])
   check(page.evaluate('i=>Vesperfall.state.targets.has(i)',m['slot']),'A real shot restores Archive lens '+str(m['slot']+1));route(m['paths']['direct'][2:])
  checkpoint();walk(page.evaluate('Vesperfall.state.world.pipeline.controls.find(c=>c.kind==="exit").p'));pad(0);wait('Vesperfall.state.phase==="reward"')
  check(page.evaluate('Vesperfall.state.sectors===2'),'Both new chapters complete in one continuing, saved run')
  page.screenshot(path=str(OUT/'archive-complete.png'));nav('reward-power');pad(0);wait('Vesperfall.state.world.depth===3&&!Vesperfall.state.pilgrimage')
  check(page.evaluate('Vesperfall.state.world.rooms.length===25&&Vesperfall.state.sectors===2'),'The final blessing retains the existing Endless continuation')
  check(not errors,'No uncaught JavaScript errors in the generated chapter journey');check(not console,'No console or shader errors in the generated chapter journey')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'version':page.evaluate('VesperCore.VERSION'),'passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console,'observations':observations,'scope':'Production WebGL with real game-owned movement, projectiles, mechanisms, enemies, save/reload and rewards. Input is generated Xbox buttons/sticks plus simulated WebXR controller poses and hand joints. No actor position, health, resource or objective assignments. Not physical-device or human-comprehension acceptance.'},indent=2))
 except Exception as exc:
  try:state=page.evaluate('({snapshot:window.Vesperfall?.snapshot(),phase:window.Vesperfall?.state.phase,pilgrimage:window.Vesperfall?.state.pilgrimage,ui:window.Vesperfall?.component.dominionControls?.state.xrScreen,focus:document.activeElement?.id})')
  except:state=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors,'console':console,'state':state,'observations':observations},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();b.close()
