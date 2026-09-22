"""Pilgrim's Kit public production journey. Emulated devices, not physical hardware.
Only keys, buttons, controller/joint poses and a standard gamepad are generated.
Actor positions, health, inventory, clocks, world state and outcomes are read only.
"""
from pathlib import Path
import os,json,math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/field-kit';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[];observations=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True)
PAD="""(()=>{const pad={id:'Pilgrim Kit Xbox fixture',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1100,'height':800},device_scale_factor=.4,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.12;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text()+(ROOT/'vesperfall/tests/fake-hands.js').read_text())
 page=ctx.new_page();page.set_default_timeout(60000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def frame():
  n=page.evaluate('Vesperfall.component.fieldKit.state.frames');wait('n=>Vesperfall.component.fieldKit.state.frames>n||!Vesperfall.component.xr',n)
 def button(h,i,on):page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[h,i,on]);frame()
 def pose(h,point):page.evaluate('([h,p])=>TestXR.pose(h,p)',[h,point]);frame()
 def neutral():
  page.evaluate("()=>{for(const h of ['left','right']){for(let i=0;i<6;i++)TestXR.button(h,i,false);TestXR.axes(h,0,0);}}")
  wait('Vesperfall.component.goldwind.state.ready&&Vesperfall.component.fieldKit.state.armed')
 def menu(text):
  wait('Vesperfall.component.dominionControls.state.xrNeutral')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');i=next(i for i,r in enumerate(rows) if text.lower() in r.lower());cur=page.evaluate('Vesperfall.component.menuSelection')
  for _ in range((i-cur+len(rows))%len(rows) or len(rows)):
   page.evaluate("TestXR.axes('left',0,1)");wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  button('right',0,True);button('right',0,False)
 def pause():button('right',3,True);wait('Vesperfall.component.paused');button('right',3,False)
 def acquire(kind):
  neutral();point=page.evaluate("kind=>{const g=Vesperfall.component;g.fieldKit.positionBelt();g.rig.updateMatrixWorld(true);return g.rig.worldToLocal(g.fieldKit.slots.find(s=>s.kind===kind).point.clone()).toArray();}",kind)
  pose('right',point);button('right',1,True);wait('k=>Vesperfall.component.fieldKit.state.held===k',kind);return point
 def kit():return page.evaluate('JSON.parse(JSON.stringify(Vesperfall.state.fieldkit))')
 def handmenu(text):
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');i=next(i for i,r in enumerate(rows) if text.lower() in r.lower())
  page.evaluate("""i=>{const g=Vesperfall.component,T=g.T,m=g.xrPanel.mesh;m.updateMatrixWorld(true);g.rig.updateMatrixWorld(true);const target=m.localToWorld(new T.Vector3(0,(.5-(195+i*75+30.5)/768)*m.geometry.parameters.height,0)),origin=new T.Vector3(...TestXR.state.hands.right).applyMatrix4(g.rig.matrixWorld),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(origin).normalize());q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation('right',q.toArray());}""",i)
  n=page.evaluate('Vesperfall.component.questHands.state.selections');page.evaluate("TestHands.pinch('right',.05)");wait("[...Vesperfall.component.questHands.state.sources].some(([s,p])=>s.handedness==='right'&&p.pinch.armed)");page.evaluate("TestHands.pinch('right',.015)");wait('n=>Vesperfall.component.questHands.state.selections>n',n);page.evaluate("TestHands.pinch('right',.05)");frame()
 try:
  page.goto(BASE+'/vesperfall/?journey=pilgrims-kit',wait_until='domcontentloaded');wait('window.Vesperfall?.component.fieldKit&&Vesperfall.component.echoes&&Vesperfall.component.stats.drawCalls>0')
  page.locator('#locomotion').select_option('smooth');page.locator('#start').click();wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  check(kit()['stock']=={'mend':2,'frost':2},'An ordinary new expedition starts with two healing and two frost vials')
  page.keyboard.press('KeyF');check(kit()['stock']['mend']==2,'Full-health keyboard drinking keeps the vial rather than wasting it')
  page.keyboard.press('KeyG');wait('Vesperfall.state.fieldkit.throws===1');wait('Vesperfall.state.fieldkit.flights.length===0')
  check(kit()['stock']['frost']==1,'The keyboard throws a finite frost flask through the real swept physics')
  check(page.evaluate("Vesperfall.state.events.some(e=>e.type==='kit-splash')&&Vesperfall.state.shots===0"),'The actual flask lands without manufacturing a bow shot or teleport')
  page.keyboard.press('KeyP');page.locator('#menu-vr').click();wait('Vesperfall.component.xr');menu('Resume');neutral()
  check(page.evaluate('Vesperfall.component.fieldKit.belt.visible'),'The physical waist satchel is rendered during first-person VR play')
  before=kit();acquire('mend');frame();frame();button('right',1,False);neutral()
  check(kit()==before,'Reaching and releasing a stationary vial stows it without consuming anything')
  acquire('mend');pose('right',[0,1.48,-.12]);button('right',0,True);button('right',0,False);button('right',1,False);neutral()
  check(kit()==before,'A mouth-level trigger at full vitality retains the physical healing vial')
  start=acquire('frost');n=kit()['throws'];shards=page.evaluate('Vesperfall.state.shardsUsed')
  trace=page.evaluate("""async start=>{const trace=[];let began=null;await new Promise(resolve=>{TestXR.state.inputFrame=()=>{const now=performance.now();began??=now;const t=Math.min(.28,(now-began)/1000);TestXR.pose('right',[start[0]+t*.25,start[1]+t*.25,start[2]-t*3]);trace.push({t,p:[...TestXR.state.hands.right]});if(t>=.28){TestXR.button('right',1,false);TestXR.state.inputFrame=null;resolve();}};});return trace;}""",start)
  observations.append({'physicalThrowSamples':trace});wait('n=>Vesperfall.state.fieldkit.throws===n+1',n);wait('Vesperfall.state.fieldkit.flights.length===0');neutral()
  check(kit()['stock']['frost']==0,'A sampled grip-and-release throw launches exactly one frost flask')
  check(page.evaluate('n=>Vesperfall.state.shardsUsed===n&&!Vesperfall.component.goldwind.state.flight',shards),'Releasing a held flask never fires the teleport disk or consumes a shard')
  # Approach the actual cache with the production movement input, then reach.
  page.evaluate("TestXR.axes('left',.65,-.65)");wait('Vesperfall.state.p[0]>.32&&Vesperfall.state.p[2]<19.68');page.evaluate("TestXR.axes('left',0,0)");frame();frame()
  point=page.evaluate("()=>{const g=Vesperfall.component,T=g.T,c=PilgrimKitModel.center(PilgrimKitModel.anchors(g.game)[0]),head=g.head.object3D.getWorldPosition(new T.Vector3()),v=new T.Vector3(...c).sub(head);v.setLength(Math.min(1.25,v.length()));return g.rig.worldToLocal(head.add(v)).toArray();}")
  pose('right',point);page.evaluate("()=>{const g=Vesperfall.component,T=g.T,c=new T.Vector3(...PilgrimKitModel.center(PilgrimKitModel.anchors(g.game)[0])),origin=new T.Vector3(...TestXR.state.hands.right).applyMatrix4(g.rig.matrixWorld),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),c.sub(origin).normalize());q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation('right',q.toArray());}")
  button('right',1,True);wait('Vesperfall.state.fieldkit.caches[0]===2');button('right',1,False);neutral()
  check(kit()['stock']=={'mend':3,'frost':1},'Reaching the field cache grants its bounded healing and frost supplies once')
  before=kit();button('right',1,True);frame();button('right',1,False);neutral()
  check(kit()==before,'An emptied cache cannot grant the same supplies again')
  pause();page.screenshot(path=str(OUT/'vr-kit-checkpoint.png'))
  saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint.state.fieldkit')
  check(saved==kit(),'The pause checkpoint contains the actual spent stock and opened cache')
  menu('Equipment');menu('Pilgrim field kit');check(len(page.evaluate('Vesperfall.component.xrMenuRows'))==6,'The field-kit menu exposes six usable scene-rendered actions')
  page.screenshot(path=str(OUT/'field-kit-menu.png'))
  page.evaluate('TestHands.mode(true)');wait('Vesperfall.component.questHands.state.active');handmenu('How to use');handmenu('Back to menu');handmenu('Equipment');handmenu('Pilgrim field kit');handmenu('Throw frost')
  check(kit()==saved and page.evaluate('Vesperfall.component.paused'),'Bare-hand menus remain usable but do not silently enable hand-only flask combat')
  handmenu('Back to menu');handmenu('Exit VR');wait('!Vesperfall.component.xr')
  page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.fieldKit');page.locator('#continue-expedition').click();wait('Vesperfall.component.running&&Vesperfall.component.paused')
  check(kit()==saved,'Reload preserves the finite kit exactly, rather than refilling it')
  # The same saved expedition and kit enter AR; no substitute training arena.
  page.locator('#mission-ar').click();wait('Vesperfall.component.xr&&Vesperfall.component.arExpedition');menu('Back to menu');menu('Resume');neutral()
  check(kit()==saved and page.evaluate('Vesperfall.component.fieldKit.belt.visible'),'The saved field kit works in first-person AR expedition too')
  before=kit();acquire('mend');page.evaluate("TestXR.missing('right',true)");frame();frame();page.evaluate("TestXR.missing('right',false)");frame();button('right',1,False)
  check(kit()==before and page.evaluate('!Vesperfall.component.fieldKit.state.held'),'Tracking loss cancels a held vial without spending it or launching a stale throw')
  # Pause may be automatic on loss; use the existing paused menu either way.
  if not page.evaluate('Vesperfall.component.paused'):pause()
  menu('Exit AR');wait('!Vesperfall.component.xr')
  page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed')
  def pad(i,on):page.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on',[i,on])
  pad(9,True);pad(9,False);wait('!Vesperfall.component.paused');n=kit()['throws'];shards=page.evaluate('Vesperfall.state.shardsUsed');pad(4,True);pad(5,True);pad(5,False);pad(4,False);wait('n=>Vesperfall.state.fieldkit.throws===n+1',n)
  check(page.evaluate('n=>Vesperfall.state.shardsUsed===n',shards),'Xbox LB+RB throws frost without also activating the normal RB shard step')
  wait('Vesperfall.state.fieldkit.flights.length===0');before=kit()['stock']['mend'];pad(4,True);pad(2,True);pad(2,False);pad(4,False)
  check(kit()['stock']['mend']==before,'Xbox LB+X uses the same full-vitality protection as a physical healing vial')
  pad(13,True);pad(13,False);check(page.evaluate("Vesperfall.state.type==='blink'"),'The Xbox down-D-pad golden-arrow shortcut is preserved')
  pad(14,True);pad(14,False);check(page.evaluate("Vesperfall.state.type!=='blink'"),'Left D-pad still cycles only usable combat arrows')
  check(not errors,'No uncaught runtime errors in the field-kit journey');check(not console,'No captured shader or console errors in the field-kit journey')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'passed':len(checks),'checks':checks,'observations':observations,'errors':errors,'consoleErrors':console,'scope':'Production WebGL with generated keys, Xbox and XR/hand inputs, not physical Quest approval. No actor, inventory or mission-state writes.'},indent=2))
 except Exception as e:
  try:snapshot=page.evaluate('window.Vesperfall?({game:Vesperfall.snapshot(),kit:Vesperfall.state.fieldkit,held:Vesperfall.component.fieldKit.state.held,armed:Vesperfall.component.fieldKit.state.armed,samples:Vesperfall.component.fieldKit.motion.samples,invalid:Vesperfall.component.fieldKit.motion.invalid,paused:Vesperfall.component.paused,rows:Vesperfall.component.xrMenuRows.map(r=>r[0])}):null')
  except:snapshot=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'observations':observations,'snapshot':snapshot},indent=2,default=str))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();b.close()
