"""Measure the real input window for a fitted branch; never assign rider state."""
import os,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
PHASE=float(os.getenv('JUMP_PHASE','.40'));OUT=Path('test-output')/('branch-'+str(PHASE));OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:4173';errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':1440,'height':900},service_workers='block',record_video_dir=str(OUT/'video'))
 c.add_init_script("localStorage.setItem('sprocket_muted','1')")
 c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname=='127.0.0.1' or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=c.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 def state():return page.evaluate('({x:player.x,y:player.y,track:player.track?.sky.id,phase:player.track?player.trackS/player.track.len:null,won,tries,score,deliveries,events:__network.state.events,visits:[...__network.state.visits]})')
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded');page.wait_for_function('window.RouteFlowEditor&&window.__gpuReady')
  page.locator('[data-course="4"]').click();page.wait_for_function('__ground.active()&&player.onGround');page.locator('#cv').focus();page.keyboard.down('KeyD')
  page.wait_for_function('player.x>=600');page.keyboard.down('Space');page.wait_for_function('player.track?.sky.id==="loop-0"');page.keyboard.up('Space')
  page.wait_for_function('(p)=>player.track?.sky.id==="loop-1"&&player.trackS/player.track.len>=p',arg=PHASE,timeout=120000)
  requested=state();page.keyboard.down('Space');page.wait_for_function('!player.track');page.keyboard.up('Space')
  page.wait_for_function('__network.state.visits.has("flow-11")||player.x>3300',timeout=120000)
  entry=state();assert 'flow-11' in entry['visits'],entry
  page.screenshot(path=str(OUT/'fitted-branch.png'));page.wait_for_function('won',timeout=600000)
  end=state();page.keyboard.up('KeyD')
  if page.locator('#stay-results').count() and page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
  assert end['tries']==1 and end['won'] and not errors,(end,errors)
  page.screenshot(path=str(OUT/'finish.png'))
  (OUT/'report.json').write_text(json.dumps({'passed':True,'phaseThreshold':PHASE,'inputRequest':requested,'branchEntry':entry,'finish':end,'errors':errors,'scope':'Ordinary keyboard control; actual branch and onward finish. No player-state assignments. Threshold is test polling, not a guaranteed human timing window.'},indent=2))
  print('PASS: branch entry and complete first-attempt finish',PHASE,flush=True)
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'phaseThreshold':PHASE,'state':state(),'errors':errors},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
