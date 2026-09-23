"""Public WebGL and generated input. No simulation-state assignments."""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/currentworks';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[];observations=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
PAD="""(()=>{const pad={id:'Pilgrimage Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1100,'height':850},device_scale_factor=.45,service_workers='block')
 ctx.add_init_script(PAD+'window.TEST_XR_PIXEL_SCALE=.35;'+(ROOT/'vesperfall/tests/fake-xr.js').read_text())
 page=ctx.new_page();page.set_default_timeout(150000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(s,arg=None):return page.wait_for_function(s,arg=arg)
 def diag():return page.evaluate('Vesperfall.component.currentworks.diagnostics()')
 def frame():
  n=page.evaluate('Vesperfall.component.goldwind.state.frames');wait('n=>Vesperfall.component.goldwind.state.frames>n||!Vesperfall.component.xr',n)
 def button(hand,index,on):
  page.evaluate('([h,i,on])=>TestXR.button(h,i,on)',[hand,index,on]);frame()
 def xrmenu(text):
  wait('Vesperfall.component.dominionControls.state.xrNeutral')
  rows=page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])');idx=next(i for i,r in enumerate(rows) if text.lower() in r.lower());cur=page.evaluate('Vesperfall.component.menuSelection');n=(idx-cur+len(rows))%len(rows)
  for _ in range(n or len(rows)):
   page.evaluate("TestXR.axes('left',0,1)");wait('!Vesperfall.component.dominionControls.state.xrAxesReady');page.evaluate("TestXR.axes('left',0,0)");wait('Vesperfall.component.dominionControls.state.xrAxesReady')
  button('right',0,True);button('right',0,False)
 def walk(point):
  result=page.evaluate("""async target=>{const trace={distance:0,start:performance.now(),simStart:Vesperfall.state.time};let last=[...Vesperfall.state.p];return await new Promise((resolve,reject)=>{const timer=setInterval(()=>{const g=Vesperfall.component,s=g.game,p=s.p,dx=target[0]-p[0],dz=target[2]-p[2],d=Math.hypot(dx,dz),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-g.yaw),Math.cos(yaw-g.yaw));trace.distance+=Math.hypot(p[0]-last[0],p[1]-last[1],p[2]-last[2]);last=[...p];TestPad.pad.axes=[0,d>.18&&Math.abs(a)<.08?-1:0,Math.abs(a)>.025?Math.max(-1,Math.min(1,-a*5)):0,0];TestPad.button(10,true);
   if(d<=.18||s.phase!=='playing'||performance.now()-trace.start>150000){TestPad.pad.axes=[0,0,0,0];TestPad.button(10,false);clearInterval(timer);if(d>.18)reject(Error('Walk failed '+JSON.stringify({target,p,phase:s.phase})));else resolve({...trace,simSeconds:s.time-trace.simStart,health:s.health,end:[...p]});}},3);});}""",point)
  observations.append({'target':point,**result});print('WALK',point,'health',result['health'],flush=True)
 def aim(target):
  result=page.evaluate("""async target=>{const start=performance.now();return await new Promise((resolve,reject)=>{const timer=setInterval(()=>{const g=Vesperfall.component,p=g.game.head,dx=target[0]-p[0],dz=target[2]-p[2],dy=target[1]-p[1],h=Math.hypot(dx,dz),v=36,disc=v**4-9.8*(9.8*h*h+2*dy*v*v),pitch=Math.atan((v*v-Math.sqrt(Math.max(0,disc)))/(9.8*h)),yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-g.yaw),Math.cos(yaw-g.yaw)),q=pitch-g.pitch;
   const stick=e=>Math.abs(e)<=.012?0:-Math.sign(e)*(.18+.82*Math.min(1,Math.abs(e)*7));TestPad.pad.axes=[0,0,stick(a),stick(q)];
   if(Math.abs(a)<.03&&Math.abs(q)<.025||performance.now()-start>45000){TestPad.pad.axes=[0,0,0,0];clearInterval(timer);if(Math.abs(a)<.03&&Math.abs(q)<.025)resolve({target,yawError:a,pitchError:q,wallMilliseconds:performance.now()-start,health:g.game.health});else reject(Error('Aim did not converge '+JSON.stringify({target,yawError:a,pitchError:q,phase:g.game.phase})));}},3);});}""",target)
  observations.append({'aim':result});(OUT/'input-observations.json').write_text(json.dumps(observations,indent=2))
 def shoot(target):
  aim(target);before=page.evaluate('Vesperfall.state.shots');page.evaluate('TestPad.button(7,true)');wait('Vesperfall.component.charge>.99');page.evaluate('TestPad.button(7,false)');wait('n=>Vesperfall.state.shots===n+1',before);wait('Vesperfall.state.arrows.length===0||Vesperfall.state.phase!=="playing"')
 try:
  page.goto(BASE+'/vesperfall/?acceptance=living-lanterns',wait_until='domcontentloaded')
  wait('window.Vesperfall?.component.currentworks&&(Vesperfall.component.currentworks.state.ready||Vesperfall.component.currentworks.state.error)')
  check(diag()['ready'],'All three Currentworks modules finish actual renderer preparation')
  check(page.evaluate('AFRAME.THREE.REVISION==="184"&&AFRAME.scenes.length===1'),'The existing r184 renderer remains the only game engine')
  page.locator('#start').click();wait('Vesperfall.component.running&&!Vesperfall.component.paused')
  page.evaluate('TestPad.enabled=true');wait('Vesperfall.component.dominionControls.state.armed')
  check(page.evaluate('Vesperfall.component.currentworks.water.length===2&&Vesperfall.component.currentworks.forests.reduce((n,f)=>n+f.stats.trees,0)===4'),'The actual Causeway contains two water surfaces and four trees')
  check(page.evaluate('!Vesperfall.component.tidelight.root.visible'),'The previous water layer is suppressed rather than double-rendered')
  check(not any(diag()['restored']),'No refuge is credited before its actual relay is restored')
  m=page.evaluate('Vesperfall.state.world.pipeline.modules[0]');walk([m['x'],0,m['z']+3])
  wait('Vesperfall.component.currentworks.water[0].stats.emitted>0')
  check(True,'Ordinary Xbox walking generates actual bounded water disturbances')
  page.screenshot(path=str(OUT/'water-court.png'))
  shoot(m['release']);wait('Vesperfall.state.pilgrimage.shutters[0]')
  for _ in range(3):
   if page.evaluate('Vesperfall.state.targets.has(0)'):break
   shoot(m['targetPoint'])
  wait('Vesperfall.component.currentworks.state.restored[0]')
  check(page.evaluate('Vesperfall.state.targets.has(0)&&Vesperfall.component.currentworks.fire.stats.emitters===1'),'A real signal shot relights exactly its refuge brazier')
  walk(m['front']);aim([m['x']-m['side']*11.8,2.5,m['z']+11.4]);page.screenshot(path=str(OUT/'refuge-relit.png'))
  page.evaluate('TestPad.enabled=false');page.locator('a-scene canvas').focus();page.keyboard.press('KeyP');wait('Vesperfall.component.paused')
  frozen=diag();page.wait_for_timeout(350);after=diag()
  check([x['time'] for x in frozen['water']]==[x['time'] for x in after['water']] and frozen['fire']['time']==after['fire']['time'] and [x['time'] for x in frozen['trees']]==[x['time'] for x in after['trees']],'Pause freezes water, fire and tree simulation times')
  page.locator('#save-expedition').click()
  saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint.state')
  check(saved['targets']==page.evaluate('[...Vesperfall.state.targets]'),'The checkpoint contains the current restored signal, not an older save')
  page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.currentworks?.state.ready')
  page.locator('#continue-expedition').click();wait('Vesperfall.component.running&&Vesperfall.component.paused&&Vesperfall.component.currentworks.state.restored[0]')
  current=page.evaluate('PilgrimSave.capture(Vesperfall.state,{id:"comparison",banked:0,receipt:{},yaw:0,pitch:0,focus:1}).state')
  for key in ['p','health','ammo','fieldkit','pilgrimage','enemies','pickups','score','shots','targets','time']:
   check(saved.get(key)==current.get(key),'Graphics integration preserves saved '+key)
  page.locator('#menu-vr').click();wait('Vesperfall.component.xr')
  wait('Vesperfall.component.currentworks.water.every(w=>w.stats.xr)')
  check(page.evaluate('AFRAME.scenes[0].renderer.xr.getCamera().isArrayCamera&&Vesperfall.component.currentworks.water.every(w=>w.stats.quality==="light")'),'Generated VR renders stereo with the capped Light water meshes')
  check(page.evaluate('Vesperfall.component.currentworks.fire.stats.lights===0'),'The new fire does not add dynamic lights in stereo')
  page.screenshot(path=str(OUT/'vr-refuge.png'));xrmenu('Exit VR');wait('!Vesperfall.component.xr')
  page.locator('#mission-ar').click();wait('Vesperfall.component.xr&&Vesperfall.component.arExpedition')
  wait('!Vesperfall.component.currentworks.scene.visible')
  check(page.evaluate('!Vesperfall.component.tidelight.root.visible&&Vesperfall.state.targets.has(0)'),'AR hides both water layers while retaining the actual expedition and signal progress')
  page.screenshot(path=str(OUT/'ar-preserved.png'));xrmenu('Exit AR');wait('!Vesperfall.component.xr')
  wait('Vesperfall.component.currentworks.scene.visible')
  check(diag()['restored'][0],'Leaving AR restores the relit refuge without rebuilding the saved expedition')
  check(not errors,'No uncaught runtime errors');check(not console,'No captured console or shader errors')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console,'observations':observations,'graphics':diag(),'scope':'Actual public WebGL, generated Xbox/keyboard and stereo WebXR input. No physical-device or sustained-performance certification. No simulation writes.'},indent=2))
 except Exception as exc:
  try:state=diag();page.screenshot(path=str(OUT/'failure.png'))
  except Exception:state=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors,'console':console,'graphics':state,'observations':observations},indent=2));raise
 finally:ctx.close();b.close()
