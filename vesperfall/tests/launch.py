"""Open the actual homepage card and play with ordinary controls.
No engine-state assignments; usable on both local HTTP and public HTTPS.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output'/'vesper-launch';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/',wait_until='domcontentloaded')
  for route in ['vesperfall/index.html','leonardos-guild/index.html','svgn-planet/index.html','little-planet/','rainward/index.html','aether-reach/index.html','mario-maker-clone/svgn-paper-route/index.html','theology-wiki/san-reader.html','dino-atlas/index.html']:
   check(page.locator('a.primary-link[href="./'+route+'"]').count()==1,'Homepage contains exactly one playable card for '+route)
  page.screenshot(path=str(OUT/'public-games-list.png'),full_page=True)
  page.locator('a.primary-link[href="./vesperfall/index.html"]').click()
  page.wait_for_function('window.Vesperfall?.component.rendererReady&&AFRAME.scenes[0].renderer.info.render.calls>0')
  check('/vesperfall/' in page.url,'The homepage link loads the separate browser-game folder')
  page.locator('#practice').click();page.wait_for_function('Vesperfall.component.running&&!Vesperfall.component.paused')
  page.locator('a-scene canvas').focus();before=page.evaluate('Vesperfall.state.p[2]');page.keyboard.down('KeyW');page.wait_for_function('(z)=>Vesperfall.state.p[2]<z-.5',arg=before);page.keyboard.up('KeyW')
  check(True,'The card leads to a live scene with working movement, not an image or source download')
  page.keyboard.down('Space');page.wait_for_function('Vesperfall.component.charge>.98');page.keyboard.up('Space');page.wait_for_function('Vesperfall.state.shots===1')
  check(True,'Hold and release Space shoots an actual arrow in the A-Frame browser renderer')
  check(not page.evaluate('Vesperfall.component.xr'),'Desktop play requires no headset or VR session')
  page.screenshot(path=str(OUT/'browser-playable.png'))
  page.keyboard.press('KeyP');page.wait_for_function('Vesperfall.component.paused');check(page.locator('#menu.open').is_visible(),'Pause returns to usable browser menus')
  page.goto(BASE+'/gloamward/',wait_until='domcontentloaded');page.wait_for_url('**/vesperfall/**');page.wait_for_function('window.Vesperfall?.component.rendererReady');check(True,'The earlier Gloamward link redirects to the maintained archery game')
  check(not errors,'No uncaught browser errors in the verified public launch path')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'scope':'Actual HTTP/HTTPS A-Frame/WebGL with ordinary card clicks, keyboard movement and bow release. Not a physical-headset or performance certificate.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'url':page.url},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
