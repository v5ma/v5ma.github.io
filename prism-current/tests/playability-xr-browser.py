"""Independent AR/VR playability: actual controller input, not a desktop pilot.
Uses the existing strict headset emulator and its existing framebuffer. Desktop
quarter-resolution performance failures remain in the separate unchanged test.
"""
from pathlib import Path
import base64,json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/playability-xr';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[];results={}
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS',text,flush=True)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts)
 try:
  for mode,chapter in [('ar','duck-armada'),('vr','mothership')]:
   context=browser.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
   context.add_init_script((ROOT/'prism-current/tests/river-fake-xr.js').read_text()+'\n'+(ROOT/'prism-current/tests/river-strict-xr.js').read_text())
   context.add_init_script("localStorage.setItem('prism-current.river.records.v1','{\"sentinel\":true}');")
   p=context.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)))
   p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
   p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open');p.keyboard.press('F2')
   if chapter=='mothership':p.locator('#space').click()
   p.wait_for_function('(m)=>!document.getElementById("enter-"+m).disabled',arg=mode);p.locator('#enter-'+mode).click();p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated')
   def frames():
    p.evaluate('async()=>{const s=TestXR.state.session;await new Promise((r,j)=>{const timeout=setTimeout(()=>j(Error("No XR frames")),5000);s.requestAnimationFrame(()=>s.requestAnimationFrame(()=>{clearTimeout(timeout);r();}));});}')
   def button(hand,i):
    p.evaluate('([h,i])=>TestXR.button(h,i,false)',[hand,i]);frames()
    p.evaluate('([h,i])=>TestXR.button(h,i,true)',[hand,i]);frames()
    p.evaluate('([h,i])=>TestXR.button(h,i,false)',[hand,i]);frames()
   def select(i):
    p.wait_for_function('River.snapshot().rotunda.open&&River.snapshot().rotunda.progress>=1')
    p.evaluate('TestXR.select("left",false)');frames();p.wait_for_timeout(140)
    p.evaluate('i=>{const T=AFRAME.THREE,m=AFRAME.scenes[0].object3D.getObjectByName("river-xr-menu"),r=RiverRotunda.RECTS[i];m.updateWorldMatrix(true,false);const q=new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld);TestXR.point("left",q.toArray());}',i)
    p.wait_for_function('i=>River.snapshot().xrUI.hover[0]===i',arg=i);frames();n=p.evaluate('River.snapshot().xrUI.actions')
    p.evaluate('TestXR.select("left",true)');p.wait_for_function('n=>River.snapshot().xrUI.actions===n+1',arg=n);p.evaluate('TestXR.select("left",false)');frames()
   check(p.evaluate('River.snapshot().difficulty')=='easy',mode+': fresh headset entry defaults to Easy')
   select(7);select(1);check(p.evaluate('River.snapshot().difficulty')=='normal',mode+': real spatial selection changes to Normal')
   select(0);select(6);p.evaluate('TestXR.away()');button('right',5)
   p.wait_for_function('River.snapshot().phase==="playing"&&River.snapshot().rotunda.healthGaugeVisible')
   check(p.evaluate('River.snapshot().result.health')==100,mode+': direct controller start displays HEALTH 100')
   check(not p.evaluate('River.snapshot().entities.some(n=>n.type==="boss")'),mode+': neither chapter starts with a boss')
   p.add_script_tag(content=(ROOT/'prism-current/tests/playability-xr-driver.js').read_text())
   p.evaluate('observeFriendlyXR()')
   p.wait_for_function('River.snapshot().result.health<100',timeout=30000)
   damaged=p.evaluate('River.snapshot().result.health');check(damaged<100,mode+': an actual incoming block reduces health')
   p.evaluate('startFriendlyXR("heal")');p.wait_for_function('River.snapshot().result.healed>0',timeout=10000);p.evaluate('stopFriendlyXR()')
   check(p.evaluate('River.snapshot().result.health')>damaged,mode+': aiming the tracked saber laser at a supply case restores health')
   check(p.evaluate('AFRAME.scenes[0].components["river-game"].state.events.some(e=>e.type==="heal"&&e.reason==="laser")'),mode+': recovery came from a real laser intersection')
   p.evaluate('startFriendlyXR("cut-block")');p.wait_for_function('River.snapshot().result.cutBlocks>0',timeout=22000);p.evaluate('stopFriendlyXR()')
   check(True,mode+': a tracked controller stroke cuts the incoming purple block')
   p.evaluate('startFriendlyXR("laser-block")');p.wait_for_function('AFRAME.scenes[0].components["river-game"].state.events.some(e=>e.type==="destroy"&&e.kind==="block"&&e.reason==="laser")',timeout=15000);p.evaluate('stopFriendlyXR()')
   check(True,mode+': the same block family is also laser-destructible')
   p.evaluate('TestXR.away()');button('right',5);p.wait_for_function('River.snapshot().phase==="paused"');before=p.evaluate('River.snapshot().result')
   select(7);select(3);check(p.evaluate('River.snapshot().result')==before and p.evaluate('River.snapshot().difficulty')=='easy',mode+': a paused menu cannot relabel difficulty or change progress')
   image=p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("prism-health-gauge").material.map.image.toDataURL()');(OUT/(mode+'-health.png')).write_bytes(base64.b64decode(image.split(',')[1]))
   select(6);p.evaluate('TestXR.away()');button('right',5);p.wait_for_function('River.snapshot().phase==="playing"')
   check(True,mode+': B/Y immediately after the Back action resumes instead of being dropped')
   p.evaluate('startFriendlyXR("boss")');p.wait_for_function('River.snapshot().entities.some(n=>n.type==="boss")',timeout=45000)
   check(not p.evaluate('friendlyXRObserved.earlyBoss'),mode+': the boss arrives only in the final phrase')
   p.wait_for_function('["complete","escaped","failed"].includes(River.snapshot().phase)',timeout=30000);p.evaluate('stopFriendlyXR();clearInterval(friendlyXRObserver)')
   result=p.evaluate('River.snapshot().result');results[mode]=result
   check(result['complete'] and result['bossDefeated'],mode+': damage, healing, cuts and shots lead to a real completed Easy boss battle')
   check(not p.evaluate('friendlyXRObserved.bolt'),mode+': no old red missile appeared in the encounter')
   check(p.evaluate("localStorage.getItem('prism-current.river.records.v1')")=='{"sentinel":true}',mode+': legacy River records were not overwritten')
   record=chapter+'/'+mode+'/easy/arcade';check(record in p.evaluate('River.snapshot().records'),mode+': clear saved under the actual chapter, input and difficulty')
   check(p.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==(0 if mode=='ar' else 1),mode+': HUD preserves the compositor transparency')
   p.screenshot(path=str(OUT/(mode+'-result.png')));p.evaluate('TestXR.state.session.end()');p.wait_for_function('!River.snapshot().immersive');context.close()
  check(not errors,'No captured script/shader errors in the independent tracked-input path')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'results':results,'errors':errors,'scope':'Existing strict headset emulator and framebuffer, actual tracked pose/trigger/menu paths. No actor, health, clock, score or completion assignments. Independent of the retained quarter-resolution desktop performance regression. Not physical Quest approval.'},indent=2))
 except Exception as e:
  try:s=p.evaluate('window.River?.snapshot()');observed=p.evaluate('window.friendlyXRObserved')
  except:s=observed=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'results':results,'errors':errors,'snapshot':s,'observed':observed},indent=2))
  try:p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:browser.close()
