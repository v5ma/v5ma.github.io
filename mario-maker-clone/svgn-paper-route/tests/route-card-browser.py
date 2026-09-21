"""Actual route UI geometry and normal clicks, not a synthetic layout/scene.
No rider, win, delivery, save or score assignments. Real browser with ordinary pointer and keyboard input.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import functools, json, os, subprocess, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.getenv('ARTIFACT_DIR','/tmp/route-card-layout'));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/')
checks=[];samples=[];errors=[];failure=None;passed=False
MEASURE='''el=>{const main=el.querySelector('[data-course]'),modes=el.querySelector('.sc-route-modes'),info=el.querySelector('.sc-route-preference'),r=x=>x.getBoundingClientRect().toJSON();return {id:el.dataset.scRoute,card:r(el),main:r(main),modes:r(modes),info:r(info),mainScroll:main.scrollHeight,mainClient:main.clientHeight,header:r(document.getElementById('delivery-header')),menu:r(document.getElementById('delivery-menu')),buttons:[...modes.children].map(r)};}'''
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':960,'height':720},service_workers='block')
 context.add_init_script("localStorage.setItem('sprocket_muted','1');localStorage.setItem('sc-layout-sentinel','keep');")
 context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==urlparse(origin).hostname or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(origin+'/mario-maker-clone/svgn-paper-route/?xr=1',wait_until='domcontentloaded');page.bring_to_front()
  page.wait_for_function('window.SkyCycleRouteEntry?.diagnostics.checked && window.__gpuReady && window.SkyCycleFlightDeck')
  before=page.evaluate('JSON.stringify({records:SkyCycleFlightDeck.records,ids:DeliveryCampaign.routes.map(r=>r.id),sentinel:localStorage.getItem("sc-layout-sentinel")})')
  for width,height in [(960,720),(1100,800),(390,844),(844,390)]:
   label=f'{width}x{height}';page.set_viewport_size({'width':width,'height':height})
   if not page.locator('#delivery-menu').evaluate('(el)=>el.classList.contains("show-expert")'):
    page.locator('#advanced-routes-toggle').click()
   cards=page.locator('.sc-route-card');check(cards.count()==8,label+' retains all eight route cards')
   measured=[]
   for i in range(cards.count()):
    card=cards.nth(i);main=card.locator('[data-course]')
    # Trial uses the normal browser hit-test and scroll path, never force=True.
    main.click(trial=True)
    row=card.evaluate(MEASURE);measured.append(row)
    assert row['mainScroll']<=row['mainClient']+2,(label,row['id'],'clipped main text',row)
    assert row['modes']['top']>=row['main']['bottom']-1,(label,row['id'],'mode row overlaps main action',row)
    assert row['info']['top']>=row['modes']['bottom']-1,(label,row['id'],'hint overlaps mode row',row)
    assert row['info']['bottom']<=row['card']['bottom']+1,(label,row['id'],'hint outside card',row)
    assert row['menu']['top']>=row['header']['bottom']-1,(label,'header overlaps menu viewport',row)
    for mode in card.locator('[data-sc-mode]').all():
     mode.click(trial=True)
     assert mode.bounding_box()['height']>=44,(label,row['id'],'small mode target')
   check(True,label+' gives every card nonoverlapping title, mode choices and preference hint')
   check(True,label+' keeps all 32 route actions reachable through ordinary browser hit-testing')
   check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),label+' has no window-level horizontal overflow')
   samples.append({'viewport':label,'cards':measured})
   cards.first.locator('[data-course]').scroll_into_view_if_needed();page.screenshot(path=str(OUT/(label+'-first-card.png')))
   cards.last.locator('[data-sc-mode="screen"]').scroll_into_view_if_needed();page.screenshot(path=str(OUT/(label+'-last-card.png')))
  page.set_viewport_size({'width':960,'height':720})
  page.locator('[data-course="4"]').click()
  page.wait_for_function('__delivery.state.route===4 && player.onGround && !__delivery.state.menu')
  check(True,'The original Sunrise card starts through an ordinary click without header interception')
  x=page.evaluate('player.x');page.locator('#cv').focus();page.keyboard.down('KeyD')
  page.wait_for_function('(x)=>player.x>x+45',arg=x);page.keyboard.up('KeyD')
  check(True,'Original movement responds after the repaired current-view route entry')
  page.locator('#delivery-header [data-delivery="routes"]').click()
  page.locator('button[data-sc-route="canal-choices"][data-sc-mode="screen"]').click()
  page.wait_for_function('__delivery.state.route===5 && __delivery.state.view==="2d" && !__delivery.state.menu')
  check(True,'The sibling Screen choice still launches the intended original Waterwheel route')
  check(page.evaluate('JSON.stringify({records:SkyCycleFlightDeck.records,ids:DeliveryCampaign.routes.map(r=>r.id),sentinel:localStorage.getItem("sc-layout-sentinel")})')==before,'Layout changes do not alter career records, stable IDs or existing storage')
  check(not errors,'No uncaught errors during layout, click, riding and screen-entry checks');passed=True
 except Exception as exc:
  failure=str(exc)
  try:page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'origin':origin,'browser':browser.version,'passed':passed,'checks':checks,'samples':samples,'errors':errors,'failure':failure,'coverage':'Actual application CSS/DOM in four viewports; unforced browser trial hit-tests and real route clicks followed by ordinary keyboard movement. No gameplay-state assignments. Not physical Quest, Xbox or human readability approval.'},indent=2))
  context.close();browser.close();server.shutdown()
