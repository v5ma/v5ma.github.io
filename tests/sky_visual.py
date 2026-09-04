"""Early native 3D flight recording and a regression test for backdrop clipping."""
import json,time,os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from PIL import Image
OUT=Path('test-output/sky-view');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 c=b.new_context(viewport={'width':1280,'height':800},record_video_dir=str(OUT/'videos'),record_video_size={'width':1280,'height':800},service_workers='block')
 c.add_init_script("localStorage.setItem('sprocket_muted','1')")
 host=urlparse(BASE).hostname
 c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
  page.wait_for_function('!!window.__sky&&window.__gpuReady===true',timeout=90000)
  page.locator('[data-course="0"]').click();page.locator('#cv').focus()
  page.keyboard.down('KeyD');page.keyboard.down('KeyC');start=time.monotonic()
  while time.monotonic()-start<100:
   s=page.evaluate('''()=>{const p=player,t=p.track,k=t?.sky;return {transfers:__sky.state.transfers,phase:k?(p.trackS/t.len-k.begin)/(k.end-k.begin):-1,armed:__sky.state.armed};}''')
   if s['transfers']>=1:break
   if s['phase']>=.64 and s['phase']<.96 and not s['armed']:page.keyboard.press('Space',delay=70)
   page.wait_for_timeout(35)
  page.keyboard.up('KeyD');page.keyboard.up('KeyC')
  state=page.evaluate('({far:__merged.camera.far,three:__merged.get3D()&&__delivery.state.view==="3d",transfers:__sky.state.transfers,loops:[...__sky.state.completed],tries,deliveries,duplicateRails:__merged.trackGroup.visible||__merged.curveGroup.visible})')
  assert state['three'] and state['transfers']>=1 and 0 in state['loops'],state
  assert state['tries']==1 and state['deliveries']>=1,state
  assert state['far']>=5000 and not state['duplicateRails'],state
  page.screenshot(path=str(OUT/'sky-latest.png'))
  page.locator('#gl').screenshot(path=str(OUT/'sky-scene.png'))
  im=Image.open(OUT/'sky-scene.png').convert('RGB')
  dark=sum(1 for r,g,b in im.getdata() if r<14 and g<23 and b<38)/(im.width*im.height)
  assert dark<.02,{'clear_color_fraction':dark,'expected':'No large near-black clipped backdrop wedge'}
  assert not errors,errors
  (OUT/'report.json').write_text(json.dumps({'passed':True,'clear_color_fraction':dark,'state':state,'uncaught_errors':errors,'scope':'Actual keyboard-controlled full lap, tangential launch, airborne delivery and receiving-rail catch in the final 3D camera. No player state assignments.'},indent=2))
  print('PASS: Final 3D camera, lap, launch, delivery, catch, and unclipped sky',flush=True)
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:c.close();b.close()
