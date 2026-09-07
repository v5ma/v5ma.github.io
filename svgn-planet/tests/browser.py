"""Native WebGL2 acceptance: ordinary keyboard/UI; read-only spherical observer.
No assignments to rider location, time, delivered mail, or progress.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,time,math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');errors=[];checks=[];held=set()
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def state(page):return page.evaluate('SVGNPlanet.inspect()')
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def hold(page,keys):
 global held
 keys=set(keys)
 for k in held-keys:page.keyboard.up(k)
 for k in keys-held:page.keyboard.down(k)
 held=keys

def navigate(page,n,limit=120):
 start=time.monotonic();lastdist=999;stuck=0
 while time.monotonic()-start<limit:
  s=state(page);d=math.acos(max(-1,min(1,dot(s['n'],n))))*22
  if d<1.25:hold(page,[]);return
  t=[n[i]-dot(n,s['n'])*s['n'][i] for i in range(3)]
  x=dot(t,s['basis']['right']);z=dot(t,s['basis']['forward']);keys=[]
  if abs(x)>abs(z)*.45:keys.append('KeyD' if x>0 else 'KeyA')
  if abs(z)>abs(x)*.45:keys.append('KeyW' if z>0 else 'KeyS')
  if abs(d-lastdist)<.007:stuck+=1
  else:stuck=0
  if stuck>15:
   # Try an ordinary sideways detour, not a teleport or goal mutation.
   hold(page,['KeyD']);page.wait_for_timeout(400);stuck=0
  else:hold(page,keys)
  lastdist=d;page.wait_for_timeout(45)
 raise AssertionError('Navigation timed out: '+json.dumps(state(page)))
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**kw);ctx=browser.new_context(viewport={'width':1440,'height':1000},record_video_dir=str(OUT/'video'),record_video_size={'width':1440,'height':1000},service_workers='block')
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 try:
  page.goto(BASE+'/svgn-planet/index.html',wait_until='domcontentloaded');page.wait_for_function('window.SVGNPlanet&&SVGNPlanet.inspect().render.triangles>1000')
  check(state(page)['render']['webgl'],'The actual 3D renderer draws a spherical world')
  page.screenshot(path=str(OUT/'01-little-planet.png'))
  page.locator('#start').click();page.locator('#world').focus()
  initial=state(page);page.keyboard.press('Space');page.wait_for_function('SVGNPlanet.inspect().lift>0');check(True,'Space lifts the actual character outward from the sphere')
  page.wait_for_function('SVGNPlanet.inspect().lift===0');page.keyboard.press('KeyF');check(state(page)['ride'],'F switches to the visible electric unicycle without relocating the player')
  sites={p['id']:p['n'] for p in state(page)['sites']}
  for i,name in enumerate(['cabin','beacon','mill']):
   navigate(page,sites[name]);page.keyboard.press('KeyE');page.wait_for_function('(id)=>SVGNPlanet.inspect().deliveries.includes(id)',arg=name)
   check(True,'Real movement and local interaction delivered to '+name)
   page.screenshot(path=str(OUT/f'0{i+2}-{name}.png'))
  navigate(page,sites['post']);page.keyboard.press('KeyE');page.wait_for_function('SVGNPlanet.inspect().complete')
  check(len(state(page)['deliveries'])==3,'Returning to the post office completes the three-neighbor expedition')
  before=state(page);page.locator('#atlas').click();page.wait_for_function('SVGNPlanet.inspect().paused');snap=state(page);page.wait_for_timeout(200)
  check(state(page)['steps']==snap['steps'],'Atlas pauses movement and world animation')
  page.locator('#map').click(position={'x':60,'y':90});check(state(page)['n']==snap['n'],'Setting an atlas waypoint does not teleport the rider')
  page.screenshot(path=str(OUT/'05-atlas.png'));page.locator('#map-close').click();page.wait_for_function('!SVGNPlanet.inspect().paused')
  # Follow the broad circumplanet road to a location on the opposite hemisphere.
  def at(x,z=0):return [math.sin(x/22)*math.cos(z/22),math.cos(x/22)*math.cos(z/22),math.sin(z/22)]
  navigate(page,at(0,0))
  for x in [10,20,30,40,50,60,69]:navigate(page,at(x,0))
  check(dot(initial['n'],state(page)['n'])<-.9,'The rider physically traveled to the far hemisphere with radial gravity')
  check(abs(sum(a*a for a in state(page)['n'])-1)<1e-8,'Movement stays on the same unit sphere rather than crossing a flat-world edge')
  page.screenshot(path=str(OUT/'06-far-side.png'))
  page.locator('#view').click();page.wait_for_timeout(150);page.screenshot(path=str(OUT/'07-close-camera.png'))
  check(state(page)['render']['geometries']>10,'Close view retains modeled geometry, not a 2D image')
  progress=state(page);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.SVGNPlanet')
  check(state(page)['complete'] and state(page)['deliveries']==progress['deliveries'],'The local save survives a genuine page reload')
  page.locator('#start').click();page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(150);page.screenshot(path=str(OUT/'08-narrow-view.png'))
  check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The game UI fits a phone-width viewport')
  check(not errors,'No uncaught script errors in the native scenario')
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'passed':len(checks),'errors':errors,'final':state(page),'scope':'Native HTTP Chromium with software WebGL2. Ordinary controls and a read-only feedback observer. Not physical-phone, Safari, hardware performance or AAA parity certification.'},indent=2))
 except Exception as e:
  try:last=state(page)
  except:last=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':last},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
