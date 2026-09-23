"""Real GPU fixture of the Aether adapter. No gameplay/device acceptance claim."""
import json,os,base64
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**args);p=b.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  p.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/aether-reach/tests/currentworks-render.html');p.wait_for_function('!!window.currentworksRender',timeout=120000)
  r=p.evaluate('currentworksRender');r['pageErrors']=errors
  for i,image in enumerate(r.pop('images',[])):(OUT/('currentworks-render-'+str(i)+'.png')).write_bytes(base64.b64decode(image['data'].split(',',1)[1]))
  (OUT/'currentworks-render.json').write_text(json.dumps(r,indent=2));assert not errors and not r.get('error') and not r['errors'],r
  print('PASS',r['passed'],'real Currentworks adapter GPU observations',flush=True)
 finally:b.close()
