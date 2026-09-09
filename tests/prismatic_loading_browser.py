"""Fail only optional material-module delivery, then recover through real reload."""
import os,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path('test-output/prism-loading');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173');checks=[];errors=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':1280,'height':840},service_workers='block');host=urlparse(BASE).hostname
 c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 def fail(r):r.abort()
 c.route('**/prismatic-renderer.js',fail);c.add_init_script("localStorage.setItem('sprocket_muted','1')")
 page=c.new_page();page.set_default_timeout(180000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.__gpuReady&&window.SkyRelayReady&&window.RideLabReady')
  check(not page.evaluate('!!window.PrismaticReady'),'The optional material import really failed')
  page.locator('[data-course="4"]').click();page.wait_for_function('player.onGround');page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('player.x>220');page.keyboard.up('KeyD')
  check(page.evaluate('tries===1&&tracks.length===16'),'Campaign movement and current Cloudpost data still work with no material add-on')
  page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active');check(page.locator('#curve-pen').count()==1,'The Bezier Workshop is independent of the optional graphics module')
  c.unroute('**/prismatic-renderer.js',fail);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.PrismaticReady&&window.SkyRelayReady&&window.__gpuReady')
  page.locator('#prism-options').click();page.locator('#prism-look').select_option('classic');page.locator('#prism-motion').uncheck();page.locator('#prism-close').click();page.reload(wait_until='domcontentloaded')
  page.wait_for_function('window.PrismaticReady&&window.__gpuReady');check(page.evaluate('Prismatic.settings.look==="classic"&&!Prismatic.settings.motion'),'Material preferences survive a normal reload without clearing any saved documents')
  check(not errors,'No uncaught error during the fail/recover/preferences sequence')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Real HTTP module failure injection and ordinary keys/menu/reload. No engine-state writes.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2));raise
 finally:c.close();b.close()
