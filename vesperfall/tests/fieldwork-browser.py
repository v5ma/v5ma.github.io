"""Production WebGL with emulated input only. No actor/resource/progress writes.
The existing authored chapter supplies the actual collision and landing surfaces.
"""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/fieldwork';OUT.mkdir(parents=True,exist_ok=True)
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
PAD="""(()=>{const pad={id:'Goldwind Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1000,'height':750},device_scale_factor=.4,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.12;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text()+(ROOT/'vesperfall/tests/fake-hands.js').read_text())
 page=ctx.new_page();page.set_default_timeout(90000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def frame():
  n=page.evaluate('Vesperfall.component.fieldwork.state.frames');wait('n=>Vesperfall.component.fieldwork.state.frames>n||!Vesperfall.component.xr',n)
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
 def reach_world(point,hand='right'):
  page.evaluate('([p,h])=>{const g=Vesperfall.component,T=g.T;g.rig.updateMatrixWorld(true);TestXR.pose(h,g.rig.worldToLocal(new T.Vector3(...p)).toArray());}',[point,hand]);frame()
 def aim_hand(index,hand='right'):
  page.evaluate('([i,h])=>{const g=Vesperfall.component,T=g.T,target=new T.Vector3(...g.game.world.pickups[i].p),origin=new T.Vector3(...TestXR.state.hands[h]).applyMatrix4(g.rig.matrixWorld),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(origin).normalize());q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation(h,q.toArray());}',[index,hand]);frame()
 def open_menu():
  neutral();button('right',3,True);wait('Vesperfall.component.paused');button('right',3,False)
 def mission(text,replace=False):
  xrmenu('Missions')
  for _ in range(4):
   if page.evaluate('t=>Vesperfall.component.xrMenuRows.some(r=>r[0].includes(t))',text):break
   xrmenu('More / page')
  xrmenu(text)
  if replace:
   wait('Vesperfall.component.dominionControls.state.xrScreen==="confirm"');xrmenu('Start a different expedition?')
  wait('!Vesperfall.component.paused&&Vesperfall.component.running');neutral()
 def golden_to(point):
  neutral();pose('left',[-.23,1.35,-.4]);page.evaluate("TestXR.orientation('left',[0,0,0,1])")
  pose('right',[-.23,1.35,-.31]);button('right',4,True);wait('Vesperfall.component.latch.drawing')
  page.evaluate('target=>{const g=Vesperfall.component,C=VesperCore,T=g.T,nock=new T.Vector3(-.23,1.35,-.31).applyMatrix4(g.rig.matrixWorld),d=new T.Vector3(...target).sub(nock),h=Math.hypot(d.x,d.z),v=17,pitch=Math.atan((v*v-Math.sqrt(v**4-9.8*(9.8*h*h+2*d.y*v*v)))/(9.8*h)),dir=new T.Vector3(d.x/h*Math.cos(pitch),Math.sin(pitch),d.z/h*Math.cos(pitch)),hand=nock.addScaledVector(dir,-.64);TestXR.pose("right",g.rig.worldToLocal(hand).toArray());}',point)
  wait('Vesperfall.component.charge>.98');before=page.evaluate('Vesperfall.state.blinks');button('right',4,False)
  wait('n=>Vesperfall.state.blinks>n||Vesperfall.state.arrows.length===0',before)
  check(page.evaluate('n=>Vesperfall.state.blinks===n+1',before),'The unchanged A-button physical arrow makes an actual valid relocation')
 try:
  page.goto(BASE+'/vesperfall/?journey=fieldwork',wait_until='domcontentloaded');wait('window.Vesperfall?.component.fieldwork&&Vesperfall.component.stats.drawCalls>0')
  check(page.locator('#xr-bow-controls').input_value()=='goldwind','The confirmed golden-arrow scheme remains the default')
  check(page.locator('#pickup-mode').input_value()=='grip','The default pickup mode advertises grip plus contact collection')
  check(page.locator('#mission-ar').is_visible(),'AR expedition has an explicit first-screen entry, separate from the table and Sanctuary')
  page.locator('#pickup-mode').select_option('pull');page.locator('#locomotion').select_option('smooth');page.locator('#practice').click()
  page.keyboard.press('KeyP');page.locator('#menu-vr').click();wait('Vesperfall.component.xr');xrmenu('Resume');neutral()
  page.evaluate("TestXR.axes('left',0,-1)");wait('Vesperfall.state.p[2]<1.55');page.evaluate("TestXR.axes('left',0,0)");frame()
  index=page.evaluate('Vesperfall.state.world.pickups.findIndex(p=>p.id==="ritual-practice")')
  target=page.evaluate('i=>Vesperfall.state.world.pickups[i].p',index);reach_world(target)
  wait('Vesperfall.component.fieldwork.state.target?.near')
  before=page.evaluate('({ammo:Vesperfall.state.ammo.frost,shards:Vesperfall.state.shardsUsed})')
  button('right',1,True);wait('i=>Vesperfall.state.world.pickups[i].taken',index)
  check(page.evaluate('n=>Vesperfall.state.ammo.frost===n.ammo+3&&Vesperfall.state.shardsUsed===n.shards',before),'Reaching to the real practice crystal and gripping grants its stock once, not a disk step')
  page.screenshot(path=str(OUT/'grip-pickup-confirmation.png'))
  pose('right',[.25,1.2,-.25]);button('right',1,False);neutral()
  check(page.evaluate('n=>Vesperfall.state.shardsUsed===n.shards&&!Vesperfall.component.goldwind.state.flight',before),'Moving and releasing the consumed pickup grip never launches a delayed disk')
  open_menu();mission('Practice / no enemies')
  index=page.evaluate('Vesperfall.state.world.pickups.findIndex(p=>p.id==="ritual-practice")');pose('right',[.25,1.25,-.4]);aim_hand(index)
  wait('Vesperfall.component.fieldwork.state.target&&!Vesperfall.component.fieldwork.state.target.near')
  button('right',1,True);wait('!!Vesperfall.component.fieldwork.state.pull');button('right',1,False);frame()
  check(page.evaluate('i=>!Vesperfall.state.world.pickups[i].taken&&!Vesperfall.component.fieldwork.state.pull',index),'Releasing a grip cancels a pull without granting or deleting the power-up')
  before=page.evaluate('Vesperfall.state.ammo.frost');button('right',1,True);wait('!!Vesperfall.component.fieldwork.state.pull')
  page.evaluate("TestXR.missing('right',true)");frame();page.evaluate("TestXR.missing('right',false)");frame();frame()
  check(page.evaluate('i=>!Vesperfall.state.world.pickups[i].taken&&!Vesperfall.component.fieldwork.state.pull',index),'Tracking recovery with a held grip cannot take the item or restart a pull')
  button('right',1,False);neutral();aim_hand(index);button('right',1,True);wait('i=>Vesperfall.state.world.pickups[i].taken',index)
  check(page.evaluate('n=>Vesperfall.state.ammo.frost===n+3&&Vesperfall.state.shardsUsed===0',before),'A fresh aimed grip after recovery pulls the supply with the original one-time reward')
  button('right',1,False);open_menu();xrmenu('Exit VR');wait('!Vesperfall.component.xr')
  page.locator('#pickup-mode').select_option('grip');page.locator('#practice').click();page.keyboard.press('KeyP');page.locator('#menu-vr').click();wait('Vesperfall.component.xr');xrmenu('Resume');neutral()
  before=page.evaluate('Vesperfall.state.ammo.frost');golden_to([1.1,0,1])
  wait('Vesperfall.state.world.pickups.find(p=>p.id==="ritual-practice").taken')
  check(page.evaluate('n=>Vesperfall.state.ammo.frost===n+3',before),'Teleporting into a reachable supply collects it with the same explicit contact rule as walking')
  open_menu();xrmenu('Exit VR');wait('!Vesperfall.component.xr')
  page.locator('#expedition-mode').select_option('endless');page.locator('#start').click();wait('Vesperfall.component.checkpoint.eligible')
  initial=page.evaluate('({generator:Vesperfall.state.world.generator,seed:Vesperfall.state.world.seed,depth:Vesperfall.state.world.depth,p:[...Vesperfall.state.p],enemies:Vesperfall.state.world.enemies.map(e=>e.id)})')
  page.keyboard.press('KeyP');page.locator('#mission-ar').click();wait('Vesperfall.component.xr&&Vesperfall.component.arExpedition')
  check(page.evaluate('!Vesperfall.component.arMode&&!Vesperfall.state.world.ar&&Vesperfall.component.scene.object3D.background===null'),'AR expedition keeps the original mission model and passthrough rather than replacing it with the Sanctuary')
  check(page.evaluate('n=>Vesperfall.state.world.seed===n.seed&&Vesperfall.state.world.depth===n.depth&&JSON.stringify(Vesperfall.state.world.enemies.map(e=>e.id))===JSON.stringify(n.enemies)',initial),'Original mission geometry and enemy identities survive AR entry')
  xrmenu('Back to menu');xrmenu('Resume');neutral();n=page.evaluate('Vesperfall.state.shots');drawshot(0);wait('n=>Vesperfall.state.shots===n+1',n)
  page.evaluate("TestXR.axes('left',0,-1)");wait('z=>Vesperfall.state.p[2]<z-.45',initial['p'][2]);page.evaluate("TestXR.axes('left',0,0)");frame()
  check(True,'An old Endless mission can be explored and fired in AR with actual Goldwind input')
  open_menu();position=page.evaluate('[...Vesperfall.state.p]');page.evaluate('TestHands.mode(true)');wait('Vesperfall.component.questHands.state.active');handaction('Exit AR');wait('!Vesperfall.component.xr')
  check(page.evaluate('p=>Math.hypot(Vesperfall.state.p[0]-p[0],Vesperfall.state.p[2]-p[2])<.001',position),'Hand-menu AR exit retains exploration rather than rolling back the expedition')
  saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint')
  check(saved['state']['p']==position,'The actual AR exploration position is present in the local checkpoint')
  page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.fieldwork');page.locator('#continue-expedition').click();wait('Vesperfall.component.running&&Vesperfall.component.paused')
  check(page.evaluate('p=>JSON.stringify(Vesperfall.state.p)===JSON.stringify(p)',position),'Reload restores the original mission after AR exploration')
  page.locator('#menu-vr').click();wait('Vesperfall.component.xr');xrmenu('Missions');xrmenu('The Returning Bell');wait('Vesperfall.component.dominionControls.state.xrScreen==="confirm"')
  xrmenu('Keep my expedition');check(page.evaluate('!Vesperfall.state.chapter'),'Cancelling a headset mission change keeps the saved expedition')
  mission('The Returning Bell',replace=True)
  check(page.evaluate('Vesperfall.state.world.generator==="returning-bell-2"'),'The original authored opening starts directly from the VR mission browser')
  open_menu();mission('Ashen Archive',replace=True)
  check(page.evaluate('Vesperfall.state.world.generator==="ashen-archive-1"&&Vesperfall.state.world.depth===2'),'The new Archive can be entered directly without replaying the opening')
  open_menu();xrmenu('Exit VR');wait('!Vesperfall.component.xr')
  check(not errors,'No uncaught runtime errors in grip, mission selection, AR exploration or save paths');check(not console,'No captured WebGL or console errors')
  (OUT/'report.json').write_text(json.dumps({'version':page.evaluate('VesperCore.VERSION'),'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console,'scope':'Production WebGL with ordinary UI, actual grip/arrow/stick input, living scored mission, real local save and reload. Device poses and hand joints are simulated; no actor position, health, inventory or progress assigned. Not physical hardware, comfort or human-quality approval.'},indent=2))
 except Exception as exc:
  try:state=page.evaluate('({snapshot:window.Vesperfall?.snapshot(),field:window.Vesperfall?.component.fieldwork?.state,rows:window.Vesperfall?.component.xrMenuRows.map(r=>r[0]),saveIssue:window.Vesperfall?.component.checkpoint.state.issue})')
  except:state=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors,'console':console,'state':state},indent=2,default=str))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();b.close()
