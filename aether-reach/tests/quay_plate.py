"""Renderer-only visual benchmark: fixed cameras, actual shipped scene modules.
These are not gameplay progress, reachability or physical GPU measurements.
"""
import os,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path(__file__).resolve().parents[1]/'test-output';OUT.mkdir(exist_ok=True)
views={'hero':([24,16,27],[-3,5,2]),'facade':([0,1.67,5],[-10,4.2,9]),'street':([0,1.67,5],[4,3,-20]),'lamp':([12,2.3,12],[15.7,2.2,15.7])};results={}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for edition,base in [('before','http://127.0.0.1:4174'),('after','http://127.0.0.1:4173')]:
  c=browser.new_context(viewport={'width':1440,'height':960},service_workers='block');errors=[];page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  html='''<!doctype html><base href="BASE/aether-reach/"><style>body{margin:0}canvas{display:block}</style><canvas id="plate"></canvas><script type="module">import {makeView} from './scene.mjs';import {createState} from './model.mjs';const v=makeView(document.getElementById('plate')),s=createState();v.resize(innerWidth,innerHeight);window.setPlate=(eye,target)=>{v.camera.position.set(...eye);v.camera.lookAt(...target);window.PlateReady=false;};setPlate([24,16,27],[-3,5,2]);function draw(){requestAnimationFrame(draw);v.update(s,0,false,true);v.render();const a=v.stats().art;if(!a||a.settled){window.PlateStats=v.stats();window.PlateReady=true;}}draw();</script>'''.replace('BASE',base)
  c.route('**/*',lambda r:r.fulfill(status=200,content_type='text/html',body=html) if r.request.url.endswith('/__art_plate__') else r.continue_() if urlparse(r.request.url).hostname=='127.0.0.1' or r.request.url.startswith(('blob:','data:')) else r.abort())
  try:
   page.goto(base+'/__art_plate__',wait_until='domcontentloaded');page.wait_for_function('window.PlateReady===true',timeout=120000)
   for name,(eye,target) in views.items():
    page.evaluate('([eye,target])=>setPlate(eye,target)',[eye,target]);page.wait_for_function('PlateReady===true');page.screenshot(path=str(OUT/(edition+'-plate-'+name+'.png')));results[edition+'-'+name]=page.evaluate('PlateStats')
   assert not errors,errors
   if edition=='after':assert not results['after-hero']['art']['errors'],results['after-hero']['art']
  finally:c.close()
 browser.close()
(OUT/'plate-report.json').write_text(json.dumps({'scope':'Actual source renderer comparison. Identical fixture cameras and viewport. Not a gameplay, FPS or human-artistic-approval claim.','views':results},indent=2))
