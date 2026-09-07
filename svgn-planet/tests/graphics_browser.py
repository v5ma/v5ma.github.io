"""Actual WebGL before/after views and failed-asset recovery.
No pose, velocity, mission, or game-clock assignments. Same ordinary inputs.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'svgn-planet/test-output/art';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');BEFORE=os.getenv('BEFORE_BASE_URL','http://127.0.0.1:4174').rstrip('/')
checks=[];errors=[];observations={}
def check(ok,msg):
 assert ok,msg
 checks.append(msg);print('PASS',msg,flush=True)
def read(p):return p.evaluate('SVGNPlanet.inspect()')
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw)
 try:
  for name,url in [('before',BEFORE),('after',BASE)]:
   ctx=b.new_context(viewport={'width':1280,'height':800},service_workers='block');p=ctx.new_page();p.set_default_timeout(90000)
   ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname=='127.0.0.1' or r.request.url.startswith(('data:','blob:')) else r.abort())
   p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if 'Shader Error' in m.text else None)
   p.goto(url+'/svgn-planet/',wait_until='domcontentloaded');p.wait_for_function('window.SVGNPlanet&&SVGNPlanet.inspect().render')
   if name=='after':
    p.wait_for_function('SVGNPlanet.inspect().render.art.status!=="loading"')
    check(read(p)['render']['art']['status']=='ready','Curated CC0 geometry and local material maps loaded successfully')
   p.locator('#vehicle').select_option('bicycle');p.locator('#start').click();p.wait_for_function('SVGNPlanet.inspect().steps>20');p.wait_for_timeout(900)
   q=read(p);p.screenshot(path=str(OUT/(name+'-01-street.png')));observations[name]={'start':q}
   if name=='after':
    check(q['render']['art']['rendered']>0,'Licensed meshes have actually been rendered, not merely downloaded')
    check(q['render']['art']['buildings']>=16 and q['render']['art']['trees']>=60,'Existing building and tree sites use the finished mesh family')
    check(q['render']['playerScreenHeight']>.14,'Default rider remains readable in the unchanged close camera')
   p.keyboard.down('KeyW');p.wait_for_function('SVGNPlanet.inspect().distance>25');p.keyboard.up('KeyW');p.wait_for_function('SVGNPlanet.inspect().speed<.1');p.wait_for_timeout(400)
   p.screenshot(path=str(OUT/(name+'-02-avenue.png')));observations[name]['avenue']=read(p)
   p.mouse.move(900,490);p.mouse.down();p.mouse.move(1110,490,steps=16);p.mouse.up();p.wait_for_timeout(900)
   p.screenshot(path=str(OUT/(name+'-03-facades.png')))
   if name=='after':
    p.keyboard.press('KeyQ');p.wait_for_function('SVGNPlanet.inspect().deliveries.length>0');check(True,'A real delivery remains playable with detailed scenery')
    p.locator('#pause').click();saved=read(p);p.wait_for_timeout(400);check(read(p)['steps']==saved['steps'],'Pausing does not alter or restart the game after art loading');p.locator('#resume').click()
    before=read(p);p.evaluate("document.getElementById('world').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()")
    p.wait_for_function('SVGNPlanet.inspect().graphicsLost');p.locator('#retry').click();p.wait_for_function('!SVGNPlanet.inspect().graphicsLost&&SVGNPlanet.inspect().render.webgl');p.wait_for_function('SVGNPlanet.inspect().steps>'+str(before['steps']+5))
    check(read(p)['render']['art']['status']=='ready' and read(p)['deliveries']==before['deliveries'],'Imported textures and meshes recover with the original graphics lifecycle')
    p.screenshot(path=str(OUT/'after-04-restored.png'))
   ctx.close()
  a=observations['after']['start'];z=observations['before']['start']
  check(a['n']==z['n'] and a['basis']==z['basis'],'Matched opening captures use exactly the same player position and heading')
  check(abs(a['render']['playerScreenHeight']-z['render']['playerScreenHeight'])<.001,'The art comparison did not improve apparent detail by zooming in')
  from PIL import Image,ImageChops,ImageStat
  before=Image.open(OUT/'before-01-street.png').convert('RGB');after=Image.open(OUT/'after-01-street.png').convert('RGB')
  change=sum(ImageStat.Stat(ImageChops.difference(before,after)).mean)/3
  check(change>6,'Actual rendered before/after frames differ visibly; manual aesthetic review is still required')
  ctx=b.new_context(viewport={'width':900,'height':700},service_workers='block');p=ctx.new_page();p.set_default_timeout(90000)
  p.route('**/street-art.gltf',lambda r:r.abort());p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'/svgn-planet/?quality=low');p.wait_for_function('window.SVGNPlanet&&SVGNPlanet.inspect().render.art.status==="fallback"')
  p.locator('#start').click();p.keyboard.down('KeyW');p.wait_for_function('SVGNPlanet.inspect().distance>3');p.keyboard.up('KeyW')
  check(read(p)['started'] and not read(p)['failed'],'An unavailable art archive retains the original playable scenery instead of quitting')
  p.screenshot(path=str(OUT/'asset-failure-safe-fallback.png'));ctx.close()
  check(not errors,'No uncaught runtime or shader errors in the art comparison')
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'observations':observations,'errors':errors,'meanPixelDifference':change,'scope':'Native HTTP Chromium software WebGL. Identical initial actor/camera and ordinary controls; no gameplay state writes. Not human quality approval or physical-device certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'observations':observations},indent=2))
  try:p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:b.close()
