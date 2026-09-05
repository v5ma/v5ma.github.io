"""Final visual-only acceptance. Full ground/expert gameplay evidence is pinned
by the workflow's unchanged-runtime comparison, not replaced by this smoke test.
"""
import json,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path('test-output/ground-finish');OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:4173';errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':1280,'height':800},service_workers='block')
 c.add_init_script("localStorage.setItem('sprocket_muted','1')")
 c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname=='127.0.0.1' or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=c.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.__ground&&window.__gpuReady')
  page.locator('[data-course="4"]').click();page.wait_for_function('__ground.active()&&player.onGround')
  assert page.evaluate('__merged.camera.isPerspectiveCamera')
  marker=page.evaluate('(()=>{const o=__merged.scene.getObjectByName("Ground route depot");return o?{x:o.position.x,y:o.position.y,visible:o.visible}:null})()')
  assert marker and marker['visible'] and marker['x']==(76-5)*36+18,marker
  page.screenshot(path=str(OUT/'clean-neighborhood.png'));page.locator('#cv').focus()
  page.keyboard.down('KeyD');page.keyboard.down('KeyC')
  page.wait_for_function('player.x>2100',timeout=300000)
  page.screenshot(path=str(OUT/'clear-depot.png'))
  page.wait_for_function('won',timeout=120000);page.keyboard.up('KeyD');page.keyboard.up('KeyC')
  result=page.evaluate('({won,tries,deliveries,quota:routeQuota,upper:__ground.state.upper.size,hooks:__grapple.state.hooks})')
  assert result['won'] and result['tries']==1 and result['deliveries']>=result['quota'] and result['upper']==0 and result['hooks']==0,result
  assert not errors,errors
  (OUT/'report.json').write_text(json.dumps({'passed':True,'marker':marker,'result':result,'errors':errors,'scope':'Native perspective 3D, ordinary input, final road surfaces and visible depot; unchanged game rules verified separately against the full-playthrough source.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
