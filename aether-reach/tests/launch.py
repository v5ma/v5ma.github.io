"""Native launch/host/mobile regressions. Only real UI input changes the game."""
from pathlib import Path
import json,os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(ok,name):
 assert ok,name
 checks.append(name);print('PASS',name,flush=True)
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**kw);c=b.new_context(viewport={'width':1280,'height':800},service_workers='block');host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort());page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(60000)
 try:
  page.goto(BASE+'/index.html',wait_until='domcontentloaded')
  check(page.locator('.project').count()==4,'The public project page includes the new game alongside all three previous projects')
  for route in ['aether-reach/index.html','mario-maker-clone/svgn-paper-route/index.html','theology-wiki/san-reader.html','dino-atlas/index.html']:
   check(page.locator('a.primary-link[href="./'+route+'"]').count()==1,'Homepage retains playable route: '+route)
  page.screenshot(path=str(OUT/'public-projects.png'),full_page=True)
  page.locator('a.primary-link[href="./aether-reach/index.html"]').click();page.wait_for_function('!!window.AetherReach');page.locator('#start').click();page.wait_for_timeout(400)
  check(abs(page.evaluate('AetherReach.snapshot().position.pitch'))<.05,'Starting the expedition looks along the street instead of jumping toward the sky')
  page.locator('#world').click(position={'x':640,'y':400});page.wait_for_timeout(500)
  check(abs(page.evaluate('AetherReach.snapshot().position.pitch'))<.08,'Clicking to capture the mouse does not apply a cursor-warp rotation')
  page.screenshot(path=str(OUT/'first-person-street.png'))
  touch=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,service_workers='block');touch.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort());phone=touch.new_page();phone.on('pageerror',lambda e:errors.append(str(e)));phone.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');phone.wait_for_function('!!window.AetherReach');phone.locator('#start').tap();phone.locator('[data-key="fire"]').tap();phone.wait_for_function('AetherReach.snapshot().ammo<8');phone.locator('[data-key="reload"]').tap();phone.wait_for_function('AetherReach.snapshot().ammo===8')
  check(True,'A real touch fire and reload works without a physical keyboard')
  check(not phone.evaluate('document.documentElement.scrollWidth>innerWidth'),'The touch HUD remains within its viewport')
  phone.screenshot(path=str(OUT/'touch-playable.png'));touch.close();check(not errors,'No uncaught browser exceptions during launch and touch checks')
  (OUT/'launch-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Native HTTP software-WebGL; normal clicks, taps and keyboard, no actor-state writes. Emulated touch is not physical-phone performance certification.'},indent=2))
 except Exception as e:
  (OUT/'launch-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2))
  page.screenshot(path=str(OUT/'launch-failure.png'));raise
 finally:c.close();b.close()
