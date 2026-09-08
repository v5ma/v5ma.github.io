"""Fixed-camera source renderer review; not gameplay progress or FPS evidence.
Only fixture cameras are changed. Capture after a completed static render so a
software GPU is not forced to redraw the same heavy image during screenshots.
"""
import json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path(__file__).resolve().parents[1]/'test-output';OUT.mkdir(exist_ok=True)
views={'hero':([24,16,27],[-3,5,2]),'facade':([0,1.67,5],[-10,4.2,9]),'street':([0,1.67,5],[4,3,-20]),'lamp':([12,2.3,12],[15.7,2.2,15.7])};results={};errors=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 try:
  for edition,base in [('before','http://127.0.0.1:4174'),('after','http://127.0.0.1:4173')]:
   c=browser.new_context(viewport={'width':1440,'height':960},service_workers='block');page=c.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader' in m.text or 'WebGLProgram' in m.text) else None)
   html='''<!doctype html><base href="BASE/aether-reach/"><style>body{margin:0}canvas{display:block}</style><canvas id="plate"></canvas><script type="module">import {makeView} from './scene.mjs';import {createState} from './model.mjs';const v=makeView(document.getElementById('plate')),s=createState();v.resize(innerWidth,innerHeight);let ready=false;window.setPlate=(eye,target)=>{v.camera.position.set(...eye);v.camera.lookAt(...target);window.PlateReady=false;requestAnimationFrame(()=>{v.update(s,0,false,true);v.render();window.PlateStats=v.stats();window.PlateReady=true;});};function prepare(){v.update(s,0,false,true);v.render();const a=v.stats().art;if(!a||a.settled){ready=true;setPlate([24,16,27],[-3,5,2]);}else setTimeout(prepare,100);}prepare();</script>'''.replace('BASE',base)
   c.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body=html) if r.request.url.endswith('/__art_plate__') else r.continue_() if urlparse(r.request.url).hostname=='127.0.0.1' or r.request.url.startswith(('blob:','data:')) else r.abort())
   try:
    page.goto(base+'/__art_plate__',wait_until='domcontentloaded');page.wait_for_function('window.PlateReady===true',timeout=120000)
    for name,(eye,target) in views.items():
     page.evaluate('([eye,target])=>setPlate(eye,target)',[eye,target]);page.wait_for_function('PlateReady===true');page.screenshot(path=str(OUT/(edition+'-plate-'+name+'.png')),timeout=90000);results[edition+'-'+name]=page.evaluate('PlateStats')
    assert not errors,errors
    if edition=='after':assert not results['after-hero']['art']['errors'],results['after-hero']['art']
   finally:c.close()
  (OUT/'plate-report.json').write_text(json.dumps({'scope':'Actual source renderer comparison with identical fixed cameras/viewport. Static capture, not a gameplay-progress, FPS or artistic-approval claim.','views':results,'errors':errors},indent=2))
 except Exception as e:
  (OUT/'plate-failure.json').write_text(json.dumps({'error':str(e),'views':results,'errors':errors},indent=2));raise
 finally:browser.close()
