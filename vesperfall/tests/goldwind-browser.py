"""Production WebGL with emulated input only. No actor/resource/progress writes.
The existing authored chapter supplies the actual collision and landing surfaces.
"""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/goldwind';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[];observations=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
PAD="""(()=>{const pad={id:'Goldwind Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1000,'height':750},device_scale_factor=.4,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.35;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text()+(ROOT/'vesperfall/tests/fake-hands.js').read_text())
 page=ctx.new_page();page.set_default_timeout(90000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def frame():
  n=page.evaluate('Vesperfall.component.goldwind.state.frames');wait('n=>Vesperfall.component.goldwind.state.frames>n',n)
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
 def drawshot(index,hand='right',bow='left',down=False):
  x=-.23 if bow=='left' else .23
  pose(bow,[x,1.35,-.4]);page.evaluate('h=>TestXR.orientation(h,[0,0,0,1])',bow)
  pose(hand,[x,1.35,-.31]);button(hand,index,True);wait('Vesperfall.component.latch.drawing')
  pose(hand,[x,1.75 if down else 1.35,.18]);wait('Vesperfall.component.charge>.65')
  button(hand,index,False)
 try:
  page.goto(BASE+'/vesperfall/?journey=goldwind',wait_until='domcontentloaded');wait('window.Vesperfall?.component.goldwind&&Vesperfall.component.stats.drawCalls>0')
  check(page.locator('#xr-bow-controls').input_value()=='classic','Classic bindings remain the default until explicitly switched')
  page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed')
  def pad(i):
   for on in [True,False]:
    page.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on',[i,on])
  for _ in range(100):
   if page.evaluate("document.activeElement.id==='xr-bow-controls'"):break
   pad(13)
  check(page.evaluate("document.activeElement.id==='xr-bow-controls'"),'Xbox reaches the new bow control preset without a mouse')
  pad(15);check(page.locator('#xr-bow-controls').input_value()=='goldwind','Xbox enables the physical Goldwind preset')
  page.evaluate('TestPad.enabled=false');page.locator('#start').click();wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  page.locator('[data-arrow="frost"]').click();page.keyboard.press('KeyP');page.locator('#menu-vr').click();wait('Vesperfall.component.xr');xrmenu('Resume');neutral()
  ammo=page.evaluate('Vesperfall.state.ammo.frost');shots=page.evaluate('Vesperfall.state.shots')
  drawshot(0);wait('n=>Vesperfall.state.shots===n+1',shots)
  check(page.evaluate('n=>Vesperfall.state.ammo.frost===n-1',ammo),'Trigger draw fires the chosen damage arrow and consumes its real ammunition')
  for index in [4,5]:
   neutral();start=page.evaluate('({p:[...Vesperfall.state.p],blinks:Vesperfall.state.blinks,ammo:Vesperfall.state.ammo.frost})')
   x=-.23;pose('left',[x,1.35,-.4]);pose('right',[x,1.35,-.31]);button('right',index,True);wait('Vesperfall.component.latch.drawing');pose('right',[x,1.75,.18]);wait('Vesperfall.component.charge>.65')
   check(page.evaluate("Vesperfall.component.goldwind.state.drawType==='blink'&&Vesperfall.component.visualArrow.children[1].material.color.getHexString()==='ffd166'"),'The physical face-button draw displays a golden teleport arrow')
   check(page.evaluate('!Vesperfall.component.teleLine.visible&&!Vesperfall.component.teleRing.visible'),'No constant teleport arc or destination ring obscures the bow')
   page.screenshot(path=str(OUT/f'golden-draw-{index}.png'));button('right',index,False);wait('n=>Vesperfall.state.blinks>n',start['blinks'])
   check(page.evaluate("n=>Vesperfall.state.type==='frost'&&Vesperfall.state.ammo.frost===n",start['ammo']),'Golden relocation leaves the combat arrow and finite ammunition unchanged')
   observations.append(page.evaluate('({kind:"golden-flight",p:[...Vesperfall.state.p],head:Vesperfall.state.head,blinks:Vesperfall.state.blinks,events:Vesperfall.state.events.slice(-5)})'))
  neutral();pose('left',[-.23,1.35,-.4]);pose('right',[.23,1.35,-.4]);button('left',4,True);wait('Vesperfall.component.goldwind.state.quiver')
  point=page.evaluate("()=>{const g=Vesperfall.component;g.goldwind.quiver.updateMatrixWorld(true);return g.rig.worldToLocal(g.goldwind.quiver.localToWorld(g.goldwind.slots[1].p.clone())).toArray();}")
  pose('right',point);wait('Vesperfall.component.goldwind.state.hover===1');page.screenshot(path=str(OUT/'bow-quiver.png'))
  n=page.evaluate('Vesperfall.state.shots');button('right',0,True);wait("Vesperfall.state.type==='cinder'&&!Vesperfall.component.goldwind.state.quiver");button('right',0,False);button('left',4,False);neutral()
  check(page.evaluate('n=>Vesperfall.state.shots===n',n),'Reaching into the bow quiver selects Cinder without an accidental shot')
  pose('right',[-.23,1.35,-.31]);button('right',0,True);pose('right',[-.23,1.35,.18]);wait('Vesperfall.component.latch.drawing');button('left',0,True)
  check(page.evaluate('!!Vesperfall.state.shield&&!Vesperfall.component.latch.drawing'),'Bow trigger transforms the bow into a directional shield and cancels drawing')
  button('right',0,False);button('left',0,False);neutral();check(page.evaluate('n=>Vesperfall.state.shots===n',n),'Releasing a shield-cancelled draw never fires a stale arrow')
  uses=page.evaluate('Vesperfall.state.shardsUsed');pose('right',[.25,1.25,-.2]);button('right',1,True);frame();button('right',1,False);frame()
  check(page.evaluate('n=>Vesperfall.state.shardsUsed===n&&!Vesperfall.component.goldwind.state.flight',uses),'Dropping a stationary disk does not teleport')
  neutral();pose('right',[.25,1.25,.12]);button('right',1,True)
  page.evaluate("""async()=>{const start=performance.now();await new Promise(resolve=>{function step(){const t=Math.min(1,(performance.now()-start)/280);TestXR.pose('right',[.25,1.25,.12-.55*t]);if(t<1)requestAnimationFrame(step);else{TestXR.button('right',1,false);resolve();}}requestAnimationFrame(step);});}""")
  wait('n=>Vesperfall.state.shardsUsed>n',uses)
  check(page.evaluate('n=>Vesperfall.state.shardsUsed===n+1',uses),'A deliberate tracked throw resolves one supported short-range relocation')
  observations.append(page.evaluate('({kind:"thrown-disk",p:[...Vesperfall.state.p],events:Vesperfall.state.events.slice(-5)})'))
  neutral();pose('right',[-.23,1.35,-.31]);button('right',4,True);pose('right',[-.23,1.75,.18]);wait('Vesperfall.component.latch.drawing');n=page.evaluate('Vesperfall.state.blinks')
  page.evaluate("TestXR.missing('right',true)");frame();page.evaluate("TestXR.missing('right',false);TestXR.button('right',4,false)");frame();neutral()
  check(page.evaluate('n=>Vesperfall.state.blinks===n&&!Vesperfall.component.latch.drawing',n),'Tracking loss cancels a held golden draw without teleporting on recovery')
  button('right',3,True);wait('Vesperfall.component.paused');button('right',3,False);xrmenu('Exit VR');wait('!Vesperfall.component.xr')
  page.locator('#handedness').select_option('right');page.locator('#goldwind-shield').select_option('grip');page.locator('#menu-vr').click();wait('Vesperfall.component.xr');xrmenu('Resume');neutral()
  n=page.evaluate('Vesperfall.state.shots');drawshot(0,'left','right');wait('n=>Vesperfall.state.shots===n+1',n)
  check(True,'Right-bow / left-draw hands fire through the same physical acquisition path')
  button('right',1,True);check(page.evaluate('!!Vesperfall.state.shield'),'The optional bow-grip shield binding works in reversed handedness');button('right',1,False);neutral()
  button('left',3,True);wait('Vesperfall.component.paused');button('left',3,False);xrmenu('Exit VR');wait('!Vesperfall.component.xr')
  page.locator('#save-expedition').click();payload=page.evaluate('localStorage.getItem(PilgrimSave.KEY)');page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.goldwind')
  check(page.locator('#xr-bow-controls').input_value()=='goldwind' and page.locator('#goldwind-shield').input_value()=='grip','Explicit control preferences survive a real page reload')
  check(page.evaluate('p=>localStorage.getItem(PilgrimSave.KEY)===p',payload),'Changing physical controls does not rewrite the saved expedition')
  check(not errors,'No uncaught runtime errors in the Goldwind journey');check(not console,'No captured WebGL, shader or console errors')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'passed':len(checks),'checks':checks,'observations':observations,'errors':errors,'consoleErrors':console,'scope':'Native production WebGL, actual controls and core physics; synthetic Xbox/buttons/controller poses, not real Quest/Xbox hardware or ergonomic approval.'},indent=2))
 except Exception as e:
  try:snapshot=page.evaluate('window.Vesperfall?({game:Vesperfall.snapshot(),goldwind:Vesperfall.component.goldwind?.state,gesture:Vesperfall.component.goldwind?.gesture.samples}):null')
  except:snapshot=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'snapshot':snapshot},indent=2,default=str))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();b.close()
