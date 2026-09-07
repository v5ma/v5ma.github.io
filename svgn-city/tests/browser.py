"""Native HTTP / WebGL2 integration. Gameplay changes use ordinary keys and UI.
The observer returns copied state; no test assigns positions, progression or time.
"""
from pathlib import Path
from urllib.parse import urlparse
import json,os,time,math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(ok,name):
 assert ok,name
 checks.append(name);print('PASS:',name,flush=True)
def read(p):return p.evaluate('SVGNCity.inspect()')
held=set()
def hold(page,codes):
 global held
 codes=set(codes)
 for k in held-codes:page.keyboard.up(k)
 for k in codes-held:page.keyboard.down(k)
 held=codes
def stop(page):
 hold(page,[])
 if read(page)['speed']>.6:
  hold(page,['KeyS']);page.wait_for_function('SVGNCity.inspect().speed<.6',timeout=20000);hold(page,[])
def drive(page,x,z,radius=2.3,limit=140):
 started=time.monotonic()
 while time.monotonic()-started<limit:
  s=read(page);dx=x-s['x'];dz=z-s['z'];dist=math.hypot(dx,dz)
  if dist<radius:
   stop(page);return s
  target=math.atan2(dx,dz);angle=(target-s['yaw']+math.pi)%(math.pi*2)-math.pi
  desired=min(9 if s['mode']=='car' else 7 if s['mode']=='bike' else 4,math.sqrt(max(.1,dist-radius)*4))
  if abs(angle)>.5:desired=min(desired,3.0)
  keys=[]
  if s['speed']>desired+.4:keys.append('KeyS')
  elif s['speed']<desired-.2:keys.append('KeyW')
  if angle>.055:keys.append('KeyA')
  elif angle<-.055:keys.append('KeyD')
  hold(page,keys);page.wait_for_timeout(50)
 raise AssertionError('Could not drive to '+str((x,z))+' last '+json.dumps(read(page)))
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);context=browser.new_context(viewport={'width':1440,'height':900},service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':1440,'height':900})
 host=urlparse(BASE).hostname;context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=context.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/svgn-city/index.html',wait_until='domcontentloaded');page.wait_for_function('window.SVGNCity')
  check(read(page)['version']=='0.1.0','The isolated SVGN City application loads')
  check(read(page)['render']['triangles']>50000,'Native WebGL draws the actual city geometry')
  page.screenshot(path=str(OUT/'01-sunrise-title.png'))
  page.locator('#start').click();page.locator('#world').focus()
  # An intentional paper round, not an automatic win or a twenty-paper spray.
  # The actual keyboard-driven rider stops at two addresses and throws to both
  # sides; swept projectile contacts, not these actions, credit the deliveries.
  for z,completed in [(16,0),(53,2)]:
   drive(page,2,z,2.3)
   page.keyboard.press('KeyQ');page.wait_for_function('(n)=>SVGNCity.inspect().deliveries.length===n',arg=completed+1,timeout=30000)
   page.keyboard.press('KeyC');page.wait_for_function('(n)=>SVGNCity.inspect().deliveries.length===n',arg=completed+2,timeout=30000)
  page.wait_for_function('SVGNCity.inspect().mission===1');stop(page)
  s=read(page);check(len(s['deliveries'])>=4,'Real paper projectiles complete the morning delivery chapter')
  check(sum(e['type']=='delivery' for e in s['events'])>=4 and s['score']>=400,'Delivery score comes from collected projectiles, not button presses')
  check(s['papers']<20,'Thrown newspapers consume the finite inventory')
  page.screenshot(path=str(OUT/'02-neighborhood-ride.png'))
  page.locator('#map-button').click();snap=read(page);page.wait_for_timeout(250)
  check(read(page)['steps']==snap['steps'],'The map pauses simulation rather than moving the rider')
  page.screenshot(path=str(OUT/'03-city-map.png'));page.locator('#map-close').click()
  check(not read(page)['paused'],'Closing the map restores ordinary play')
  drive(page,2,170);drive(page,8.5,190,3)
  page.keyboard.press('KeyX');hold(page,['KeyH']);page.wait_for_function('SVGNCity.inspect().relay',timeout=30000);hold(page,[])
  check(read(page)['mission']==2,'Proximity + scan + held interaction unlocks the civic shortcut')
  page.screenshot(path=str(OUT/'04-city-link.png'))
  drive(page,8,216,2);page.keyboard.press('KeyF');check(read(page)['mode']=='foot','F dismounts into the shared on-foot world')
  drive(page,7.3,228,1.4);page.keyboard.press('KeyF');page.wait_for_function('SVGNCity.inspect().mode==="car"')
  check(read(page)['mode']=='car','The press hatchback is a real enterable vehicle')
  drive(page,0,235,3);drive(page,40,240,3);check(read(page)['x']>36,'The car traverses the now-open garden crossing')
  drive(page,80,240,3);drive(page,80,354,4)
  page.wait_for_function('SVGNCity.inspect().completed',timeout=30000);hold(page,[])
  check(read(page)['mission']==3,'Delivery, relay and driving chapters complete in one continuous playable city')
  page.screenshot(path=str(OUT/'05-harbor-finish.png'))
  before=read(page);raw=page.evaluate('localStorage.getItem("svgn.city.first-dispatch.v1")');check(bool(raw),'The new game uses its own local save namespace')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.SVGNCity');check(read(page)['completed'] and read(page)['credits']==before['credits'],'Completed story progress survives a real page reload')
  page.locator('#start').click();page.locator('#pause-button').click();snap=read(page);page.wait_for_timeout(300);check(read(page)['steps']==snap['steps'],'Pause freezes the game and clears held driving controls')
  page.locator('#recover').click();check(read(page)['mode']=='bike' and len(read(page)['deliveries'])>=4,'Kiosk recovery preserves completed deliveries and restores the bicycle')
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'06-narrow-layout.png'))
  check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The user interface fits a narrow viewport')
  check(not errors,'No uncaught script errors in the full native scenario')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'final':read(page),'scope':'Native HTTP/Chromium software WebGL2. Ordinary input feedback driver, no player-state assignments. Not a physical-phone, controller, hardware-frame-rate or commercial-content parity certification.'},indent=2))
 except Exception as e:
  try:last=read(page)
  except:last=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':last},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
