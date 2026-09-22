"""Negative reproduction of redundant resets, then real-input repaired acceptance.
Only the negative case substitutes the previously observed sync implementation.
No score, actor, health, phase, simulation time or game action is assigned.
"""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/render-policy';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
app=(ROOT/'prism-current/river/app.js').read_text()
start=app.index('   // Three r184 setPixelRatio calls setSize')
end=app.index('   const record=',start)
old=app[:start]+"   if(this.el.renderer&&!this.immersive)this.el.renderer.setPixelRatio(Math.min(devicePixelRatio,this.quality==='cinematic'?1.5:this.quality==='light'?.7:1));\n"+app[end:]
checks=[];errors=[];observations={}
def check(ok,msg):
 assert ok,msg
 checks.append(msg);print('PASS',msg,flush=True)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts)
 def watch(p):
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader Error' in m.text else None)
 try:
  for negative in [True,False]:
   c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.25,service_workers='block');p=c.new_page();watch(p);p.set_default_timeout(45000)
   if negative:p.route('**/river/app.js*',lambda route:route.fulfill(status=200,content_type='text/javascript',body=old))
   p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2');p.locator('#options summary').click()
   p.add_script_tag(content=(ROOT/'prism-current/tests/frame-trace.js').read_text());p.evaluate("window.trace=RiverFrameTrace.install(AFRAME.scenes[0].components['river-game'])")
   before=p.evaluate('trace.snapshot()')
   for _ in range(4):p.locator('#quiet').click()
   after=p.evaluate('trace.snapshot()');resets=len(after['resizes'])-len(before['resizes'])
   observations['negative' if negative else 'fixed-menu']={'resets':resets,'buffer':after['drawingBuffer']}
   check(resets==4 if negative else resets==0,'Old sync reproduces four redundant drawing-buffer resets' if negative else 'Four actual preference changes do not resize an unchanged buffer')
   check(after['drawingBuffer']==before['drawingBuffer'],'Drawing resolution is unchanged, not lowered to avoid a failure')
   if negative:c.close();continue
   check(p.evaluate('River.snapshot().stats.shore.visible&&River.snapshot().stats.shore.triangles<8000'),'Coherent visible shoreline uses a bounded ground/stone/reed budget')
   p.locator('#play').click();p.wait_for_function('River.snapshot().phase==="playing"')
   for _ in range(6):p.keyboard.press('KeyF')
   check(len(p.evaluate('trace.snapshot().resizes'))==0,'Starting and six actual blade swaps make no redundant resize calls')
   p.mouse.move(640,500);p.mouse.down();p.add_script_tag(content=(ROOT/'prism-current/tests/river-driver.js').read_text());p.evaluate('startRiverDriver()')
   p.wait_for_function('River.snapshot().result.slices>0&&River.snapshot().stats.fire.emitted>0',timeout=35000)
   check(p.evaluate('River.snapshot().phase')=='playing','Cutting and destruction work with all three environment modules')
   p.keyboard.press('KeyP');p.wait_for_function('River.snapshot().phase==="paused"');p.mouse.up();p.evaluate('stopRiverDriver()');before=p.evaluate('River.snapshot()');p.wait_for_timeout(250)
   after=p.evaluate('River.snapshot()');check(before['time']==after['time'] and before['result']==after['result'],'Pausing preserves the exact encounter while diagnostics observe it')
   check(len(p.evaluate('trace.snapshot().resizes'))==0,'Pause and driver blade switches leave the buffer alone')
   observations['fixed-combat']=p.evaluate('trace.snapshot()');p.evaluate('trace.dispose()');c.close()
  c=b.new_context(viewport={'width':1000,'height':760},device_scale_factor=1,service_workers='block');p=c.new_page();watch(p);p.set_default_timeout(45000)
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2');p.locator('#options summary').click();p.add_script_tag(content=(ROOT/'prism-current/tests/frame-trace.js').read_text());p.evaluate("window.trace=RiverFrameTrace.install(AFRAME.scenes[0].components['river-game'])")
  p.locator('#quality').select_option('light');p.wait_for_function('AFRAME.scenes[0].renderer.getPixelRatio()===.7');p.locator('#quality').select_option('balanced');p.wait_for_function('AFRAME.scenes[0].renderer.getPixelRatio()===1')
  check([x['to'] for x in p.evaluate('trace.snapshot().resizes')]==[.7,1],'Genuine Light/Balanced changes still apply their existing resolutions')
  observations['real-quality-changes']=p.evaluate('trace.snapshot()');p.evaluate('trace.dispose()');c.close()
  check(not errors,'No captured script or shader errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'observations':observations,'scope':'Negative sync-only substitution and actual served-game controls. No physical-device test or guaranteed frame-rate claim.'},indent=2))
 except Exception as e:
  try:state=p.evaluate('window.River?.snapshot()');trace=p.evaluate('window.trace?.snapshot()')
  except:state=trace=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'observations':observations,'snapshot':state,'trace':trace},indent=2));raise
 finally:b.close()
