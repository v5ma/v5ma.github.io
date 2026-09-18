"""New-default acceptance. Real production renderer/music and ordinary input only.
Emulated controller/VR/AR, not physical headset or listener acceptance."""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/prism-undertow';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
PAD=(ROOT/'prism-current/tests/standard-pad.js').read_text();checks=[];errors=[]
LEGACY={'first-light/flow/keys':{'score':1234,'accuracy':74,'best':11},'tidal-bloom/flow/ar':{'score':2100,'accuracy':82,'best':14}}
def check(value,text):
 assert value,text
 checks.append(text);print('PASS',text,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
 c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block');c.add_init_script(PAD)
 c.add_init_script("if(!localStorage.getItem('prism-current.v1.records'))localStorage.setItem('prism-current.v1.records',"+json.dumps(json.dumps(LEGACY))+");")
 p=c.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader Error' in m.text else None)
 try:
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready&&Prism.snapshot().controller');p.bring_to_front();p.keyboard.press('Shift')
  check(p.evaluate('Prism.snapshot().track')=='undertow','Fresh launch selects the new song, without a hidden menu or alternate route')
  check(p.evaluate('Prism.snapshot().difficulty')=='pulse','Fresh launch uses the 286-note directional chart')
  check('Undertow' in p.locator('#start').inner_text(),'The primary Play button identifies the changed experience')
  check(p.locator('#start').bounding_box()['y']<700,'Primary Play is above the catalog and visible on the opening screen')
  check(p.evaluate('Prism.component.art.poolStage.status.waterVisible'),'Water venue is inside the rhythm game, not only the expedition')
  p.wait_for_function('Prism.component.art.notes.some(n=>n.g.visible)');check(p.evaluate('Prism.component.art.notes.filter(n=>n.g.visible).every(n=>n.dir!==6)'),'Idle preview shows the selected directional chart, not legacy dots')
  check(p.evaluate('Prism.component.art.poolStage.status.boxBatches')==5,'The static venue uses five instanced batches instead of a draw per tile wall or fixture')
  check(p.locator('#tracks button').count()==5,'All four old songs remain beside the new one')
  p.evaluate('PrismTestPad.press(9)');p.wait_for_function("Prism.snapshot().phase==='playing'")
  check(p.evaluate('Prism.snapshot().track')=='undertow','An ordinary Menu press starts Undertow')
  check(p.evaluate('Prism.snapshot().notes.length')==286,'Actual loaded Pulse chart contains 286 targets')
  check(p.evaluate('new Set(Prism.snapshot().notes.map(n=>n.dir)).size')==8 and p.evaluate('Prism.snapshot().notes.every(n=>n.dir!==6)'),'All eight directions are present and no dots are generated')
  check(p.evaluate('Prism.component.audio.source.buffer===Prism.component.audio.cache.get("undertow")'),'Audio playback uses the new rendered soundtrack')
  p.evaluate('''()=>{const done=new Set(),until={},map=[6,4,5,7];window.undertowDriver=setInterval(()=>{const g=Prism.component;if(!testPad)return;if(g.phase!=='playing'){for(const i of map)testPad.buttons[i]={pressed:false,value:0};return;}const t=g.audio.time()+g.runOffset;for(const i of map)if(t>=(until[i]||0))testPad.buttons[i]={pressed:false,value:0};for(const n of g.state.song.notes){if(done.has(n.id)||t<n.time-.055||t>n.time+.12)continue;done.add(n.id);const i=map[n.lane];testPad.buttons[i]={pressed:true,value:1};until[i]=t+.09;}},4)}''')
  p.wait_for_function('Prism.snapshot().state.hits>=8',timeout=20000)
  check(p.evaluate('Prism.component.art.poolStage.status.hitsObserved')>0,'Successful gameplay cuts create pool reactions')
  p.evaluate('PrismTestPad.press(9)');p.wait_for_function("Prism.snapshot().phase==='paused'")
  before=p.evaluate('Prism.component.audio.time()');p.wait_for_timeout(250);check(p.evaluate('Prism.component.audio.time()')==before,'Pause freezes the new soundtrack')
  p.screenshot(path=str(OUT/'pool-rhythm-paused.png'));p.evaluate('PrismTestPad.press(9)')
  p.wait_for_function("Prism.snapshot().phase==='complete'",timeout=115000)
  result=p.evaluate('Prism.snapshot().state');check(result['hits']>=258,'Full unaccelerated new song completes with at least 90% input-connected targets')
  check(p.evaluate('Prism.snapshot().scoreRecords["first-light/flow/keys"]')==LEGACY['first-light/flow/keys'],'Old score survives new-song completion')
  check(p.evaluate('Prism.snapshot().scoreRecords["undertow/pulse/gamepad"].score')==result['score'],'New song saves under a separate normal record key')
  p.reload(wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready');check(p.evaluate('Prism.snapshot().scoreRecords["undertow/pulse/gamepad"].score')==result['score'],'New score survives reload')
  vc=b.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1);v=vc.new_page();v.set_default_timeout(60000);v.on('pageerror',lambda e:errors.append(str(e)))
  v.goto(URL,wait_until='domcontentloaded');v.wait_for_function('window.Prism?.snapshot().ready&&Prism.component.art.poolStage.status.waterVisible');v.wait_for_timeout(600);v.screenshot(path=str(OUT/'undertow-menu-1440.png'));vc.close()
  xc=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block');xc.add_init_script(path=str(ROOT/'prism-current/tests/fake-xr.js'));x=xc.new_page();x.set_default_timeout(45000);x.on('pageerror',lambda e:errors.append(str(e)))
  x.goto(URL,wait_until='domcontentloaded');x.wait_for_function('window.Prism?.snapshot().ready&&!document.getElementById("enter-vr").disabled');x.locator('#enter-vr').click();x.wait_for_function('Prism.snapshot().immersive&&Prism.snapshot().calibrated')
  check(x.evaluate('Prism.snapshot().track')=='undertow','VR opens on the new song too')
  check(x.evaluate('Prism.component.art.poolStage.status.waterVisible'),'The pool venue is rendered in VR, not disabled like the earlier spectral effects')
  def xr_button(hand,i):
   x.evaluate('''async ([hand,i])=>{const frame=()=>new Promise(r=>TestXR.state.session.requestAnimationFrame(()=>TestXR.state.session.requestAnimationFrame(r)));TestXR.button(hand,i,false);await frame();TestXR.button(hand,i,true);await frame();TestXR.button(hand,i,false);await frame();}''',[hand,i])
  xr_button('left',4);check(x.evaluate('Prism.snapshot().difficulty')=='flow','X/A changes the chart from inside the headset')
  xr_button('left',4);check(x.evaluate('Prism.snapshot().difficulty')=='pulse','The chart shortcut cycles back without leaving VR')
  x.evaluate('TestXR.pose("left",[-.36,1.385,-.4])');xr_button('left',0);x.wait_for_function("Prism.snapshot().phase==='playing'")
  x.evaluate('''async()=>{window.undertowXRTrace=[];const n=Prism.snapshot().notes[0],v=PrismCore.dirs[n.dir],p=PrismCore.position(n,n.time);await new Promise((resolve,reject)=>{const begun=performance.now(),timer=setInterval(()=>{const g=Prism.component,t=g.audio.time()+g.runOffset;undertowXRTrace.push({audio:t,time:g.state.time,previous:g.previous[0]||null,judged:g.state.judged[n.id]||null});if(undertowXRTrace.length>64)undertowXRTrace.shift();if(g.state.judged[n.id]){clearInterval(timer);g.state.judged[n.id]==='hit'?resolve():reject(Error('XR directional strike missed: '+JSON.stringify({detail:g.state.judgmentDetails[n.id],trace:undertowXRTrace})));return;}if(g.phase!=='playing'||performance.now()-begun>18000){clearInterval(timer);reject(Error('XR strike interrupted'));return;}const f=Math.max(0,Math.min(1,(t-n.time+.14)/.28)),d=-.28+f*.56;TestXR.pose('left',[p[0]+v[0]*d,p[1]+v[1]*d,-.41]);},4);});}''')
  check(x.evaluate('Prism.snapshot().state.hits')>0,'Tracked blade input scores a directional note in the new VR song')
  x.screenshot(path=str(OUT/'undertow-emulated-vr.png'));x.evaluate('TestXR.state.session.end()');x.wait_for_function('!Prism.snapshot().immersive')
  x.locator('#enter-ar').click();x.wait_for_function('Prism.snapshot().immersive&&Prism.snapshot().calibrated')
  check(x.evaluate('!Prism.component.art.poolStage.group.visible&&!Prism.component.art.studio.visible'),'AR keeps the real room unobscured by opaque pool walls')
  check(x.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==0,'AR clear alpha stays transparent')
  x.evaluate('TestXR.state.session.end()');xc.close()
  check(not errors,'No captured uncaught JavaScript or shader errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'result':result,'scope':'Actual HTTP renderer, original newly generated audio, emulated standard gamepad and WebXR. Full song at normal audio speed; no score, clock or actor-position injection. Reduced software-renderer gameplay buffer and separate 1440x1000 menu image. Not physical Quest/Xbox or a judgment of musical enjoyment.'},indent=2))
 except Exception as e:
  try:xr_failure=x.evaluate('({snapshot:Prism.snapshot(),trace:window.undertowXRTrace||[],pool:Prism.component.art.poolStage.status,calls:AFRAME.scenes[0].renderer.info.render.calls})')
  except Exception:xr_failure=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'xr':xr_failure,'snapshot':p.evaluate('window.Prism?.snapshot()'),'stall':p.evaluate('window.Prism?.component.lastStall||null')},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:b.close()
