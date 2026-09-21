"""Real source; only browser/device inputs and a labeled storage fault are simulated.
The test never assigns actor coordinates, health, inventory or progress.
"""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];MODE=os.getenv('XR_MODE','vr')
OUT=ROOT/'test-output'/('threshold-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as p:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**args);ctx=b.new_context(viewport={'width':1100,'height':800},device_scale_factor=.5,service_workers='block')
 ctx.add_init_script('window.TEST_XR_PIXEL_SCALE=.3;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text()+(ROOT/'vesperfall/tests/fake-hands.js').read_text())
 page=ctx.new_page();page.set_default_timeout(90000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def frame():
  n=page.evaluate('Vesperfall.component.threshold.state.frames');wait('n=>Vesperfall.component.threshold.state.frames>n',n)
 def button(h,i,on):page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[h,i,on]);frame()
 def menu(text):
  wait('Vesperfall.component.dominionControls.state.xrNeutral')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');i=next(i for i,r in enumerate(rows) if text.lower() in r.lower());cur=page.evaluate('Vesperfall.component.menuSelection')
  for _ in range((i-cur+len(rows))%len(rows) or len(rows)):
   page.evaluate("TestXR.axes('left',0,1)");wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  button('right',0,True);button('right',0,False)
 def state():return page.evaluate('PilgrimSave.capture(Vesperfall.state,{id:"compare",banked:Vesperfall.component.banked,receipt:Vesperfall.component.arsenal.state.receipt,yaw:0,pitch:0,focus:Vesperfall.component.ritual.focus.remaining}).state')
 try:
  page.goto(BASE+'/vesperfall/?journey=threshold-'+MODE,wait_until='domcontentloaded');wait('window.Vesperfall?.component.threshold&&Vesperfall.component.stats.drawCalls>0')
  page.locator('#start').click();page.keyboard.press('KeyP');page.locator('#mission-ar' if MODE=='ar' else '#menu-vr').click();wait('Vesperfall.component.xr')
  if MODE=='ar':menu('Back to menu')
  check(page.evaluate('Vesperfall.component.threshold.desk.visible'),'The first XR pause has a scene-rendered floor desk')
  old=page.evaluate('Vesperfall.component.xrPanel.mesh.position.toArray()')
  page.evaluate('TestXR.state.yaw=.2');frame();frame()
  check(page.evaluate('Vesperfall.component.xrPanel.mesh.position.toArray()')==old,'Turning the tracked head does not drag the menu around')
  page.evaluate('TestXR.state.yaw=0');menu('Settings');menu('Spatial desk')
  before=page.evaluate('Vesperfall.component.threshold.state.settings.height');menu('Desk height')
  check(page.evaluate('Vesperfall.component.threshold.state.settings.height')!=before,'Height adjustment moves the real scene panel and pedestal')
  menu('Panel size');check(page.evaluate('Vesperfall.component.xrPanel.mesh.scale.x')!=1,'Size adjustment changes the actual raycast panel')
  menu('Move / turn');menu('Reset desk');menu('Back to spatial')
  check(page.evaluate('Vesperfall.component.threshold.state.settings.scale')==1,'Reset restores readable bounded dimensions')
  page.screenshot(path=str(OUT/'spatial-desk.png'))
  # Storage-fault fixture: fail the browser write, never rewrite a game save.
  page.evaluate("window.ThresholdSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===PilgrimSave.KEY)throw Error('Injected write failure');return ThresholdSetItem.call(this,k,v)}")
  menu('Open walking doorway');check(page.evaluate('Vesperfall.component.threshold.state.phase')=='game','A failed checkpoint leaves the doorway closed and the expedition available')
  page.evaluate('Storage.prototype.setItem=ThresholdSetItem;delete window.ThresholdSetItem')
  menu('Back to menu');menu('Settings');menu('Spatial desk')
  before=state();menu('Open walking doorway');wait('Vesperfall.component.threshold.state.walking');frame();frame()
  check(page.evaluate('Vesperfall.component.threshold.stage.visible&&!Vesperfall.component.xrPanel.mesh.visible'),'Opening the doorway stows the panel and presents a walking threshold')
  check(state()==before,'Preparing the walking transition does not change the paused expedition')
  # Passing a hand through the doorway is not viewer traversal.
  page.evaluate("TestXR.pose('right',[0,1.35,-1.6])");frame();frame()
  check(page.evaluate('Vesperfall.component.threshold.state.crossings')==0,'A controller through the doorway cannot trigger travel')
  page.evaluate("TestXR.pose('right',[.23,1.35,-.4])");wait('Vesperfall.component.threshold.state.moveReady')
  page.evaluate("TestXR.axes('left',0,-1)");wait('Vesperfall.component.threshold.state.phase==="foyer"');page.evaluate("TestXR.axes('left',0,0)");frame();frame()
  check(state()==before,'A real stick-driven doorway crossing preserves all captured expedition fields')
  check(page.evaluate('Vesperfall.component.threshold.state.crossings')==1,'Entering the local foyer consumes the crossing once')
  page.screenshot(path=str(OUT/'local-foyer.png'))
  menu('Open return walking doorway');wait('Vesperfall.component.threshold.state.moveReady')
  page.evaluate("TestXR.axes('left',0,-1)");wait('Vesperfall.component.threshold.state.phase==="game"');page.evaluate("TestXR.axes('left',0,0)");frame();frame()
  check(state()==before,'Walking back restores the expedition without time, health, reward or coordinate changes')
  check(page.evaluate('Vesperfall.component.threshold.state.crossings')==2,'The return crossing does not bounce or repeat')
  check(page.evaluate('Vesperfall.component.paused&&!Vesperfall.component.goldwind.state.flight'),'Returning waits safely paused with no stray disk or arrow')
  # Real hand ray/pinch operates the transformed existing panel.
  page.evaluate('TestHands.mode(true)');wait('Vesperfall.component.questHands.state.active')
  def pinch(text):
   rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');i=next(i for i,r in enumerate(rows) if text.lower() in r.lower())
   page.evaluate("""i=>{const g=Vesperfall.component,T=g.T,m=g.xrPanel.mesh;m.updateMatrixWorld(true);g.rig.updateMatrixWorld(true);const target=m.localToWorld(new T.Vector3(0,(.5-(195+i*75+30.5)/768)*m.geometry.parameters.height,0)),origin=new T.Vector3(...TestXR.state.hands.right).applyMatrix4(g.rig.matrixWorld),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(origin).normalize());q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation('right',q.toArray());}""",i)
   n=page.evaluate('Vesperfall.component.questHands.state.selections');page.evaluate("TestHands.pinch('right',.05)");wait("[...Vesperfall.component.questHands.state.sources].some(([s,p])=>s.handedness==='right'&&p.pinch.armed)")
   page.evaluate("TestHands.pinch('right',.015)");wait('n=>Vesperfall.component.questHands.state.selections>n',n);page.evaluate("TestHands.pinch('right',.05)")
  pinch('Settings');pinch('Spatial desk');pinch('Desk height')
  check(page.evaluate('Vesperfall.component.threshold.state.settings.height')!=1.15,'Tracked hand pinch adjusts the real spatial desk')
  page.evaluate('TestHands.mode(false)');frame();frame();menu('Open walking doorway');frame();frame();button('right',3,True);button('right',3,False)
  menu('Return now');check(state()==before,'The seated return alternative preserves the same expedition')
  menu('Settings');menu('Spatial desk');menu('Open walking doorway');frame();frame();button('right',3,True);button('right',3,False)
  menu('Exit XR');wait('!Vesperfall.component.xr')
  check(page.evaluate('TestXR.state.session.ended'),'Exit ends the actual immersive session, not only its panel')
  check(page.evaluate('!Vesperfall.component.threshold.stage.visible&&!Vesperfall.component.threshold.desk.visible'),'Session exit removes both stage and desk from the browser view')
  check(state()==before,'Exit during travel restores the unchanged expedition')
  page.locator('#resume').click();wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  check(True,'The browser remains playable without being closed')
  check(not errors,'No uncaught runtime errors');check(not console,'No captured console errors')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'mode':MODE,'passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console,'scope':'Public/native WebGL and generated controller/hand inputs. Storage fault is simulated. No game-state assignments or physical-device certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'state':page.evaluate('window.Vesperfall?{phase:Vesperfall.component.threshold?.state.phase,walking:Vesperfall.component.threshold?.state.walking,screen:Vesperfall.component.dominionControls.state.xrScreen,rows:Vesperfall.component.xrMenuRows.map(r=>r[0])}:null')},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:ctx.close();b.close()
