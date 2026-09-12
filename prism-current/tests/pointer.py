"""Native pointer correctness and recovery; CPU frame stalls are reported.
A successful functional result does not imply sustained pointer-play FPS.
"""
from pathlib import Path
from urllib.parse import urlparse
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/prism-pointer';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(ok,s):
 assert ok,s
 checks.append(s);print('PASS:',s,flush=True)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block');host=urlparse(BASE).hostname
 c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 p=c.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  p.goto(BASE+'/prism-current/',wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready');p.evaluate((ROOT/'prism-current/tests/input-driver.js').read_text());p.locator('#start').click();p.wait_for_function('Prism.snapshot().phase==="playing"&&Prism.snapshot().time>1')
  check(p.evaluate('Prism.snapshot().input')=='slice','The normal browser button starts physical pointer slicing')
  point=p.evaluate('(()=>{const n=Prism.snapshot().notes[0],v=PrismCore.position(n,n.time),p=new AFRAME.THREE.Vector3(v[0],v[1]+.28,v[2]).project(AFRAME.scenes[0].camera),r=document.getElementById("scene-wrap").getBoundingClientRect();return [r.x+(p.x*.5+.5)*r.width,r.y+(-p.y*.5+.5)*r.height]})()')
  p.mouse.move(*point);p.mouse.down();p.evaluate('PrismTestInput.pointer()');p.mouse.up();p.wait_for_function('Prism.snapshot().state.hits>=1')
  check(p.evaluate('Prism.snapshot().judged[0]')=='hit','A moving mouse-controlled blade intersects the real first note')
  check(p.evaluate('Prism.snapshot().state.mode')=='slice','The cut uses directional slice scoring, not a keyboard tap')
  p.wait_for_timeout(400)
  stalled=p.evaluate('Prism.component.lastStall || null')
  if p.evaluate('Prism.snapshot().phase')=='paused':
   check('Rendering stalled' in p.evaluate('Prism.snapshot().message'),'A software-renderer pause identifies the frame-stall cause')
   p.locator('#resume').click();p.wait_for_function('Prism.snapshot().phase==="playing"')
   check(p.evaluate('Prism.snapshot().judged[0]')=='hit','Resuming a renderer-paused run preserves the valid cut')
  p.keyboard.press('KeyP');p.wait_for_function('Prism.snapshot().phase==="paused"');p.screenshot(path=str(OUT/'browser-slice.png'));p.locator('#back').click()
  check(p.evaluate('Object.keys(Prism.snapshot().scoreRecords).length')==0,'A partial pointer practice does not create a finished score')
  check(not errors,'No uncaught browser errors in the pointer flow')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'software_frame_stall':stalled,'scope':'Native HTTP A-Frame at one-eighth pixel ratio; real pointerdown and smooth audio-clock-driven DOM pointer moves. No score/clock writes. A CPU frame pause after a valid cut is explicitly recorded and UI recovery tested. Sustained pointer performance remains unmeasured on consumer hardware.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':p.evaluate('window.Prism?.snapshot()'),'stall':p.evaluate('window.Prism?.component.lastStall || null')},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:c.close();b.close()
