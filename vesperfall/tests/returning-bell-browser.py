"""Native Returning Bell journey. Inputs are synthesized, game state is not.
Real WebGL/native source, emulated Xbox/Quest input. Not physical-device QA.
"""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output'/'returning-bell';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
AIM="async target=>{const c=Vesperfall.component,canvas=AFRAME.scenes[0].canvas,held=new Set(),key=(code,on)=>{if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?held.add(code):held.delete(code);};await new Promise((resolve,reject)=>{const start=performance.now(),t=setInterval(()=>{const s=Vesperfall.state,p=s.head,dx=target[0]-p[0],dz=target[2]-p[2],d=Math.hypot(dx,dz),dy=target[1]-p[1],v=target[3]||36,v2=v*v,disc=v2*v2-9.8*(9.8*d*d+2*dy*v2),pitch=disc>0?Math.atan((v2-Math.sqrt(disc))/(9.8*d)):0,yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw)),b=pitch-c.pitch;key('ArrowLeft',a>.01);key('ArrowRight',a<-.01);key('ArrowUp',b>.006);key('ArrowDown',b<-.006);if(Math.abs(a)<.02&&Math.abs(b)<.012||performance.now()-start>90000){for(const k of [...held])key(k,false);clearInterval(t);Math.abs(a)<.02?resolve():reject(Error('Aim timeout'));}},3);});}"
WALK="async target=>{const c=Vesperfall.component,canvas=AFRAME.scenes[0].canvas,held=new Set(),key=(code,on)=>{if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?held.add(code):held.delete(code);};await new Promise((resolve,reject)=>{const start=performance.now(),t=setInterval(()=>{const s=Vesperfall.state,dx=target[0]-s.p[0],dz=target[1]-s.p[2],d=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw));key('ArrowLeft',a>.018);key('ArrowRight',a<-.018);key('KeyW',Math.abs(a)<.09&&d>.15);key('ShiftLeft',true);const encounter=target[2]&&s.oath?.active;if(d<.17||encounter||s.phase!=='playing'||performance.now()-start>180000){for(const k of [...held])key(k,false);clearInterval(t);d<.17||encounter?resolve():reject(Error('Walk stalled '+JSON.stringify({p:s.p,target,phase:s.phase})));}},3);});}"
PAD="(()=>{const pad={id:'Test Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts)
 ctx=browser.new_context(viewport={'width':1280,'height':900},device_scale_factor=.55,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.5;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text()+(ROOT/'vesperfall/tests/fake-hands.js').read_text())
 page=ctx.new_page();page.set_default_timeout(180000)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(js,arg=None):return page.wait_for_function(js,arg=arg)
 def press(i):
  wait('Vesperfall.component.dominionControls.state.armed')
  for on in[True,False]:
   page.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on',[i,on])
 def nav(id):
  for _ in range(120):
   if page.evaluate('id=>document.activeElement.id===id',id):return
   d=page.evaluate('id=>{const a=Vesperfall.component.dominionControls.focusables(),i=a.indexOf(document.activeElement),j=a.findIndex(e=>e.id===id),n=a.length;if(j<0)throw Error("Missing focus "+id);return (j-i+n)%n<=(i-j+n)%n?13:12}',id)
   press(d)
  raise AssertionError('Focus failed '+id)
 def pause():
  if not page.evaluate('Vesperfall.component.paused'):page.keyboard.press('KeyP');wait('Vesperfall.component.paused')
 def walk(x,z):
  page.evaluate(WALK,[x,z]);check(True,'Native movement reaches '+str([x,z]))
 def xrpress(side,i):
  for on in[True,False]:
   page.evaluate('([s,i,on])=>TestXR.button(s,i,on)',[side,i,on]);wait('([s,i,on])=>Vesperfall.component.prevButtons[s]?.[i]===on||(!on&&!Vesperfall.component.xr)',[side,i,on])
 def xraction(text):
  wait('Vesperfall.component.dominionControls.state.xrNeutral')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');index=next(i for i,r in enumerate(rows) if text.lower() in r.lower())
  cur=page.evaluate('Vesperfall.component.menuSelection');down=(index-cur+len(rows))%len(rows);up=(cur-index+len(rows))%len(rows)
  for d in([1,-1] if down==0 else [1]*down if down<=up else[-1]*up):
   wait('Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("d=>TestXR.axes('left',0,d)",d);wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  check(page.evaluate('i=>Vesperfall.component.menuSelection===i',index),'Quest controller reaches '+text);xrpress('right',0)
 def handaction(text):
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');index=next(i for i,r in enumerate(rows) if text.lower() in r.lower())
  page.evaluate("""index=>{const g=Vesperfall.component,T=g.T,panel=g.xrPanel.mesh;panel.updateMatrixWorld(true);g.rig.updateMatrixWorld(true);const y=195+index*75+30.5,target=panel.localToWorld(new T.Vector3(0,(.5-y/768)*panel.geometry.parameters.height,0)),origin=new T.Vector3(...TestXR.state.hands.right).applyMatrix4(g.rig.matrixWorld),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(origin).normalize());q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation('right',q.toArray());}""",index)
  before=page.evaluate('Vesperfall.component.questHands.state.selections');page.evaluate("TestHands.pinch('right',.05)");wait("[...Vesperfall.component.questHands.state.sources].some(([s,p])=>s.handedness==='right'&&p.pinch.armed)");page.evaluate("TestHands.pinch('right',.015)");wait('n=>Vesperfall.component.questHands.state.selections>n||!Vesperfall.component.xr',before)
  if page.evaluate('Vesperfall.component.xr'):page.evaluate("TestHands.pinch('right',.05)")
  check(True,'A joint-pinch ray activates '+text)
 try:
  page.goto(BASE+'/vesperfall/?journey=returning-bell',wait_until='domcontentloaded');wait('window.Vesperfall?.component.returningBell&&Vesperfall.component.stats.drawCalls>0')
  check(page.evaluate('Vesperfall.state.world.generator===ReturningBellModel.ID&&Vesperfall.state.world.rooms.length===7'),'Fresh arrival previews the authored opening, not the old generator')
  check(page.locator('#expedition-mode').input_value()=='returning-bell','The new chapter is the default new-player content')
  page.evaluate('TestPad.enabled=true');nav('start');press(0);wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  check(page.evaluate('Vesperfall.component.checkpoint.eligible&&!Vesperfall.state.unscored'),'Xbox starts the chapter as a real scored saved expedition')
  press(13);check(page.evaluate("Vesperfall.state.type==='blink'"),'D-pad down still selects Blink directly')
  press(14);check(page.evaluate("Vesperfall.state.type==='plain'"),'D-pad left returns to available damage arrows')
  page.screenshot(path=str(OUT/'refuge-first-view.png'))
  # Keyboard walking uses the same movement/collision owner, observed positions
  # only guide generated button events. Xbox remains connected and neutral.
  for p in[[-4,8.5],[-14,8.5],[-14,0],[-14,-11.5]]:walk(*p)
  page.evaluate(AIM,[-1,1.5,-13,1000]);page.screenshot(path=str(OUT/'gallery-court.png'))
  walk(-12.1,-11.5);press(0);wait('Vesperfall.state.chapter.screensRaised')
  check(page.evaluate('Vesperfall.component.worldArt.returningBell.dynamic.screen.position.y===4.8'),'The winch moves the visible screen to the authoritative collision height')
  press(0);wait('!Vesperfall.state.chapter.screensRaised');press(0);wait('Vesperfall.state.chapter.screensRaised')
  check(True,'Xbox can reverse the screen mechanism without a menu')
  pause();nav('save-expedition');press(0)
  saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint')
  check(saved['generator']=='returning-bell-1' and saved['state']['chapter']['screensRaised'],'Actual save captures the new identity and mechanism state')
  nav('architect-table');page.evaluate('TestPad.button(0,true)');wait('Vesperfall.component.xr&&Vesperfall.component.returningBell.state.table');page.evaluate('TestPad.button(0,false);TestPad.enabled=false')
  wait('Vesperfall.component.dominionControls.state.xrNeutral')
  check(page.evaluate('Vesperfall.component.arMode&&Vesperfall.component.scene.object3D.background===null'),'The table uses real immersive-ar session handling and transparent passthrough')
  check(page.evaluate('Vesperfall.component.returningBell.table.userData.discovered.length<7&&!Vesperfall.component.returningBell.table.userData.discovered.includes(6)'),'Undiscovered service passages are absent from AR inspection')
  check(page.evaluate('Vesperfall.component.paused&&!Vesperfall.component.worldArt.group.visible'),'Table inspection suspends AR combat and hides the arena')
  xraction('Layers:');check(page.evaluate('Vesperfall.component.returningBell.state.layer===1'),'Quest controller changes table layers')
  page.evaluate('TestHands.mode(true)');wait('Vesperfall.component.questHands.state.active')
  handaction('Layers:');check(page.evaluate('Vesperfall.component.returningBell.state.layer===2'),'Bare-hand UI changes table layers')
  handaction('Recenter');page.screenshot(path=str(OUT/'architects-table-hand-ui.png'))
  handaction('Known places');handaction('Back to menu');handaction('Exit AR')
  wait('!Vesperfall.component.xr&&Vesperfall.state.chapter&&Vesperfall.component.paused')
  check(page.evaluate('Vesperfall.state.chapter.screensRaised&&!Vesperfall.state.chapter.gateOpen'),'AR exit restores the expedition mechanisms, not its temporary arena')
  restored=page.evaluate('PilgrimSave.capture(Vesperfall.state,{id:"comparison",banked:0,receipt:{},yaw:0,pitch:0,focus:1}).state')
  for key in['p','health','ammo','chapter','enemies','pickups','score','shots','time']:check(restored[key]==saved['state'][key],'AR inspection preserves '+key)
  page.locator('#resume').click();page.locator('a-scene canvas').focus()
  for p in[[-14,-11.5],[-14,-21],[0,-21]]:walk(*p)
  # The bell is reached through a real swept arrow from the gallery approach.
  page.evaluate(AIM,[0,5,-24,36]);page.keyboard.down('Space');wait('Vesperfall.component.charge>.985');page.keyboard.up('Space');wait('Vesperfall.state.chapter.bellRung')
  check(page.evaluate('Vesperfall.state.phase==="playing"&&Vesperfall.state.kills<5'),'Ringing the signal recognizes actual archery without requiring every defender to die')
  page.screenshot(path=str(OUT/'signal-restored.png'))
  for p in[[0,-28],[20,-28],[20,-16],[20,8],[7.3,8]]:walk(*p)
  page.evaluate(AIM,[0,1.4,8,1000]);page.screenshot(path=str(OUT/'return-gate-revelation.png'))
  page.keyboard.press('KeyE');wait('Vesperfall.state.chapter.gateOpen');walk(6.7,8);pause();page.locator('#save-expedition').click()
  check(page.evaluate('Vesperfall.component.checkpoint.state.checkpoint.state.chapter.gateOpen'),'The unlocked return connection is in the actual saved checkpoint')
  page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.returningBell');page.locator('#continue-expedition').click();wait('Vesperfall.component.running&&Vesperfall.component.paused&&Vesperfall.state.chapter?.gateOpen')
  check(page.evaluate('!Vesperfall.state.world.solids.some(b=>b.id==="return-gate")'),'A real page reload restores the open collision gate before validating player position')
  page.locator('#resume').click();page.locator('a-scene canvas').focus();walk(0,8);page.keyboard.press('KeyE');wait('Vesperfall.state.phase==="reward"');check(page.evaluate('Vesperfall.state.chapter.returned&&Vesperfall.state.sectors===1'),'Returning to the refuge completes the whole chapter exactly once')
  page.screenshot(path=str(OUT/'chapter-complete.png'))
  page.locator('[data-reward="power"]').click();wait('Vesperfall.state.world.depth===2&&!Vesperfall.state.chapter');check(page.evaluate('Vesperfall.state.sectors===1&&Vesperfall.state.world.rooms.length===25'),'Earned blessing continues into retained Endless content without losing counters')
  check(not errors,'No uncaught JavaScript errors in the native chapter/AR/save journey')
  check(not console,'No captured console or shader errors')
  report={'version':page.evaluate('VesperCore.VERSION'),'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console,'scope':'Ordinary production source, real WebGL and input-driven movement/archery/interaction. Xbox and WebXR poses/joints are simulated. No player, enemy, progression or resource assignments. Physical Quest/Xbox, enjoyment and comfort are not certified.'}
  (OUT/'report.json').write_text(json.dumps(report,indent=2))
 except Exception as e:
  try:snapshot=page.evaluate('({state:window.Vesperfall?.snapshot(),table:window.Vesperfall?.component.returningBell?.state.table,chapter:window.Vesperfall?.state.chapter,rows:window.Vesperfall?.component.xrMenuRows.map(r=>r[0]),issue:window.Vesperfall?.component.checkpoint?.state.issue})')
  except:snapshot=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'console':console,'snapshot':snapshot},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
