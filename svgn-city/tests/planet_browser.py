"""Actual WebGL2 tiny-planet acceptance. No actor/mission/clock assignments.
The mission driver's choices use only copied observations plus normal keys.
"""
from pathlib import Path
from urllib.parse import urlparse
import json,math,os,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];MODE=os.getenv('PLANET_SUITE','visual');OUT=ROOT/'test-output'/('planet-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def read(page):return page.evaluate('SVGNPlanet.inspect()')
def check(ok,msg):
 assert ok,msg
 checks.append(msg);print('PASS',msg,flush=True)
def norm(a):return math.sqrt(sum(x*x for x in a))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def point(u,v=0):return [math.sin(u)*math.cos(v),math.cos(u)*math.cos(v),math.sin(v)]
held=set()
def hold(page,k):
 global held
 k=set(k)
 for x in held-k:page.keyboard.up(x)
 for x in k-held:page.keyboard.down(x)
 held=k
def stop(page):
 s=read(page)
 if s['mode']=='foot':hold(page,[])
 elif abs(s['speed'])>.18:hold(page,['KeyS' if s['speed']>0 else 'KeyW'])
 page.wait_for_function('Math.abs(SVGNPlanet.inspect().speed)<.22',timeout=20000);hold(page,[])
def drive(page,u,v=0,radius=1.5):
 t=point(u,v);begin=time.monotonic()
 while time.monotonic()-begin<75:
  s=read(page);n=s['n'];f=s['heading'];dist=math.acos(max(-1,min(1,dot(n,t))))*32
  if dist<radius:stop(page);return
  aim=[t[i]-n[i]*dot(t,n) for i in range(3)];l=norm(aim);aim=[x/l for x in aim];a=math.atan2(dot(cross(f,aim),n),dot(f,aim));want=min(6 if s['mode']=='car' else 4.5,math.sqrt(max(.1,dist-radius)*3));key=[]
  if s['mode']=='foot':
   if abs(a)<1.1:key.append('KeyW')
  else:
   if s['speed']>want+.25:key.append('KeyS')
   elif s['speed']<want-.1 and abs(a)<1.6:key.append('KeyW')
  if a>.018:key.append('KeyA')
  elif a<-.018:key.append('KeyD')
  hold(page,key);page.wait_for_timeout(40)
 raise AssertionError('Could not reach spherical waypoint '+str((u,v))+' '+json.dumps(read(page)))
with sync_playwright() as p:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**args);c=b.new_context(viewport={'width':1440,'height':900},service_workers='block',record_video_dir=str(OUT/'video'))
 host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:','file:')) else r.abort());page=c.new_page();page.set_default_timeout(45000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/svgn-city/'+('?quality=low' if MODE=='mission' else ''),wait_until='domcontentloaded');page.wait_for_function('window.SVGNPlanet')
  s=read(page);check(s['version']=='0.2.0' and s['world']['topology']=='sphere','The app loads the little planet, not the former flat city')
  check(s['render']['threeD'] and s['render']['triangles']>18000,'A real WebGL renderer submits the spherical scene')
  if MODE=='visual':
   page.wait_for_timeout(800);page.screenshot(path=str(OUT/'01-little-planet-title.png'))
   page.locator('#start').click();page.wait_for_timeout(300);page.screenshot(path=str(OUT/'02-whole-planet.png'))
   initial=read(page);page.mouse.move(900,440);page.mouse.down();page.mouse.move(1060,540,steps=16);page.mouse.up();page.wait_for_timeout(250)
   s=read(page);check(s['n']==initial['n'] and s['render']['camera']!=initial['render']['camera'],'Dragging orbits the 3D camera without moving or teleporting the player')
   page.locator('[data-view="neighborhood"]').click();page.wait_for_function('Math.hypot(...SVGNPlanet.inspect().render.camera)<85');page.screenshot(path=str(OUT/'03-neighborhood.png'))
   page.locator('[data-view="street"]').click();page.wait_for_function('Math.hypot(...SVGNPlanet.inspect().render.camera)<43');page.wait_for_timeout(350);page.screenshot(path=str(OUT/'04-street.png'))
   s=read(page);check(s['n']==initial['n'] and s['world']['radius']==32,'Street, neighborhood and orbit views use the same physical planet')
   page.keyboard.press('KeyC');check(read(page)['render']['view']=='planet','C cycles back to the actual whole-planet camera')
   page.locator('#pause-button').click();page.wait_for_function('SVGNPlanet.inspect().paused');saved=read(page);page.keyboard.down('KeyW');page.wait_for_timeout(350);page.keyboard.up('KeyW');check(read(page)['steps']==saved['steps'] and read(page)['n']==saved['n'],'Pause freezes surface movement and clears driving inputs')
   page.locator('#resume').click();page.wait_for_function('!SVGNPlanet.inspect().paused');page.keyboard.press('KeyF');check(read(page)['mode']=='foot','F dismounts the bicycle onto the spherical ground')
   page.keyboard.press('KeyF');check(read(page)['mode']=='bike','The nearby bicycle can be re-entered without a different map')
   page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(400);page.screenshot(path=str(OUT/'05-phone-width.png'));check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Planet UI fits a phone-width viewport')
  else:
   page.set_viewport_size({'width':1100,'height':740});page.locator('#start').click();page.locator('[data-view="neighborhood"]').click();page.locator('#world').focus()
   for i,u in enumerate([.13,.4,.74]):
    drive(page,u,.02,1.5);page.keyboard.press('KeyQ');page.wait_for_function('(n)=>SVGNPlanet.inspect().delivered.length>=n',arg=i+1)
   check(read(page)['mission']==1 and read(page)['papers']==17,'Normal riding and three physical newspaper contacts complete the first task')
   page.screenshot(path=str(OUT/'06-delivery-on-the-curve.png'))
   drive(page,1.04,.02);drive(page,1.18,.13,1.2);page.keyboard.press('KeyE');page.wait_for_function('SVGNPlanet.inspect().relay');check(read(page)['mission']==2,'A nearby stopped player can reconnect the local grove relay')
   drive(page,1.34,.02,1.3);page.keyboard.press('KeyF');check(read(page)['mode']=='foot','The player walks toward the parked press car in the same world')
   drive(page,1.42,.08,1.0);page.keyboard.press('KeyF');page.wait_for_function('SVGNPlanet.inspect().mode==="car"')
   check(read(page)['mode']=='car','The press car is enterable on the globe')
   page.locator('[data-view="planet"]').click();page.locator('#world').focus()
   for u in [1.7,2.05,2.4,2.75,3.1,3.45,3.8,4.15,4.5,4.85,5.2,5.55,5.9,6.14]:
    drive(page,u,.025*math.sin(u*3),1.8)
    if u==3.1:
     q=read(page);check(q['n'][1]<-.95 and dot(q['n'],q['radialUp'])>.9999,'The real car reaches the opposite side with gravity and up still aligned to the surface');page.screenshot(path=str(OUT/'07-other-side.png'))
   page.keyboard.press('KeyE');page.wait_for_function('SVGNPlanet.inspect().completed');check(read(page)['credits']>=185,'The same uninterrupted expedition returns around the globe and publishes the edition')
   q=read(page);page.screenshot(path=str(OUT/'08-first-world-edition.png'));page.reload(wait_until='domcontentloaded');page.wait_for_function('window.SVGNPlanet');check(read(page)['completed'] and read(page)['credits']==q['credits'],'Planet progress survives a real page reload in its own save namespace')
   check(page.evaluate('localStorage.getItem("svgn.city.first-dispatch.v1")===null'),'The old flat-city save namespace was not modified')
  check(not errors,'No uncaught JavaScript exceptions in the native scenario')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'state':read(page),'scope':'Native HTTP Chromium software WebGL. Normal keyboard and pointer input. No player-state or clock writes. Phone-width layout is not physical-device certification.'},indent=2))
 except Exception as e:
  try:s=read(page)
  except:s=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':s},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
