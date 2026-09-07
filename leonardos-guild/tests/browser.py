"""Native HTTP/WebGL acceptance: real keyboard, pointer and file/UI actions.
The observer only returns copies. No rider position, progress or time writes.
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
def read(p):return p.evaluate('LeonardoGuild.inspect()')
held=set()
def hold(page,codes):
 global held
 codes=set(codes)
 for k in held-codes:page.keyboard.up(k)
 for k in codes-held:page.keyboard.down(k)
 held=codes
def stop(page):
 hold(page,[]);s=read(page)
 if abs(s['speed'])>.6:
  if s['mode']!='foot':hold(page,['KeyS' if s['speed']>0 else 'KeyW'])
  page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.6',timeout=20000);hold(page,[])
def drive(page,x,z,radius=2.3,limit=140):
 # Closing a dialog restores input asynchronously; wait before sending keys.
 page.wait_for_function('!LeonardoGuild.inspect().paused');page.locator('#world').focus()
 started=time.monotonic()
 while time.monotonic()-started<limit:
  s=read(page);dx=x-s['x'];dz=z-s['z'];dist=math.hypot(dx,dz)
  if dist<radius:stop(page);return s
  angle=(math.atan2(dx,dz)-s['yaw']+math.pi)%(math.pi*2)-math.pi
  desired=min(9 if s['mode']=='car' else 7 if s['mode']=='bike' else 4,math.sqrt(max(.1,dist-radius)*4))
  if abs(angle)>.5:desired=min(desired,3)
  keys=[]
  if s['mode']=='foot':
   if abs(angle)<1.2:keys.append('KeyW')
  elif s['speed']>desired+.4:keys.append('KeyS')
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
  page.goto(BASE+'/',wait_until='domcontentloaded');card=page.locator('article.leonardo')
  check(card.count()==1,'The homepage has one distinct Leonardo’s Guild game card')
  for name in ['little-planet','rainward','aether','delivery','theology','dinosaur']:assert page.locator('article.'+name).count()==1,name
  check(True,'All six existing homepage cards remain, including Little Planet')
  page.wait_for_function('document.querySelector("article.leonardo img")?.naturalWidth>0')
  check(card.locator('img').evaluate('(img)=>img.complete&&img.naturalWidth>0'),'The card shows an actual rendered game capture')
  page.screenshot(path=str(OUT/'00-homepage.png'));card.locator('a.primary-link').click();page.wait_for_function('window.LeonardoGuild')
  check('/leonardos-guild/' in page.url,'The homepage card opens the independently hosted browser game')
  check(read(page)['version']=='0.1.0','The isolated Leonardo’s Guild application loads')
  check(read(page)['render']['triangles']>50000,'Native WebGL draws the actual city geometry')
  page.screenshot(path=str(OUT/'01-sunrise-title.png'))
  # User-accessible low-power mode and a smaller window, not faster simulation.
  page.goto(BASE+'/leonardos-guild/index.html?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
  page.set_viewport_size({'width':960,'height':640});page.locator('#start').click();page.locator('#world').focus()
  for z,completed in [(16,0),(53,2)]:
   drive(page,2,z)
   page.keyboard.press('KeyQ');page.wait_for_function('(n)=>LeonardoGuild.inspect().deliveries.length===n',arg=completed+1,timeout=30000)
   page.keyboard.press('KeyC');page.wait_for_function('(n)=>LeonardoGuild.inspect().deliveries.length===n',arg=completed+2,timeout=30000)
  page.wait_for_function('LeonardoGuild.inspect().mission===1');stop(page);s=read(page)
  check(len(s['deliveries'])>=4,'Real projectiles complete the letter-delivery chapter')
  check(sum(e['type']=='delivery' for e in s['events'])>=4 and s['score']>=400,'Delivery score comes from projectile contacts, not button presses')
  check(s['papers']<20,'Thrown letters consume the finite inventory');page.screenshot(path=str(OUT/'02-neighborhood-ride.png'))
  page.locator('#map-button').click();snap=read(page);page.wait_for_timeout(250)
  check(read(page)['steps']==snap['steps'],'The map pauses simulation rather than moving the rider')
  page.screenshot(path=str(OUT/'03-city-map.png'));page.locator('#map-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused')
  check(not read(page)['paused'],'Closing the map restores ordinary play')
  drive(page,0,110);drive(page,0,155);drive(page,10,170,2)
  page.keyboard.press('KeyB');page.wait_for_selector('#shop-dialog[open]');check(read(page)['paused'],'The merchant pauses movement while trading')
  money=read(page)['credits'];page.locator('#shop-staff').click()
  check(read(page)['upgraded'] and read(page)['credits']==money-45,'Florins buy a real staff upgrade without real payments')
  page.screenshot(path=str(OUT/'04-artisans-market.png'));page.locator('#shop-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused');page.locator('#world').focus();hold(page,[])
  drive(page,8.5,190,2.5);page.keyboard.press('KeyX');hold(page,['KeyH']);page.wait_for_function('LeonardoGuild.inspect().relay',timeout=30000);hold(page,[])
  check(read(page)['mission']==2,'Inspection and held interaction restore the waterwheel and open the bridge')
  drive(page,8,216,2);page.keyboard.press('KeyF');check(read(page)['mode']=='foot','F dismounts into the same explorable world')
  drive(page,7.3,228,1.4);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="car"')
  check(read(page)['mode']=='car','The fictional pedal carriage retains vehicle-entering mechanics')
  drive(page,0,235,3);drive(page,40,240,3);drive(page,80,240,3);drive(page,80,323,2)
  page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(page,80,329,1.2);hold(page,['KeyK'])
  page.wait_for_function('LeonardoGuild.inspect().events.some(e=>e.type==="blocked-hit")',timeout=45000)
  check(read(page)['guarding'],'Bracing blocks an actual telegraphed guard attack')
  for i in range(3):
   if read(page)['defeated']:break
   page.keyboard.press('KeyJ');tick=read(page)['steps']
   # Wait for the live cooldown, not an assumption about CI wall-clock speed.
   page.wait_for_function('(tick)=>LeonardoGuild.inspect().steps>=tick+40',arg=tick,timeout=20000)
  hold(page,[]);page.wait_for_function('LeonardoGuild.inspect().defeated',timeout=15000)
  check(any(e['type']=='duel-won' for e in read(page)['events']),'Real staff strikes make the folio guard yield');page.screenshot(path=str(OUT/'05-guard-yields.png'))
  drive(page,80,352,3);hold(page,['KeyH']);page.wait_for_function('LeonardoGuild.inspect().folio');hold(page,[])
  check(read(page)['mission']==3 and not read(page)['completed'],'Recovering the folio creates a return mission rather than an automatic win')
  # Walk to the side of the actual parked carriage, within its entry radius.
  # A broad stop several metres beyond the vehicle is not a valid boarding test.
  car=read(page)['vehicles']['car'];drive(page,car['x']+2.6,car['z']+1.4,.8);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="car"')
  drive(page,80,240,3);drive(page,40,240,3);drive(page,0,240,3);drive(page,0,120,3);drive(page,0,10,3);drive(page,-8,2,2)
  hold(page,['KeyH']);page.wait_for_function('LeonardoGuild.inspect().completed',timeout=15000);hold(page,[])
  check(read(page)['mission']==4,'The complete commission returns physically to Leonardo’s workshop');page.screenshot(path=str(OUT/'06-guild-commission-complete.png'))
  before=read(page);raw=page.evaluate('localStorage.getItem("svgn.leonardos-guild.v1")');check(bool(raw),'The new game uses its own local save namespace')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
  check(read(page)['completed'] and read(page)['credits']==before['credits'],'Completed story progress survives a real page reload')
  page.locator('#start').click();page.locator('#pause-button').click();snap=read(page);page.wait_for_timeout(300)
  check(read(page)['steps']==snap['steps'],'Pause freezes the game and clears held driving controls')
  page.locator('#recover').click();check(read(page)['mode']=='bike' and len(read(page)['deliveries'])>=4,'Workshop recovery preserves completed deliveries and restores the bicycle')
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'07-narrow-layout.png'))
  check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The user interface fits a narrow viewport')
  check(page.evaluate('localStorage.getItem("svgn.city.first-dispatch.v1")') is None,'The Renaissance game never overwrites the modern city save')
  check(not errors,'No uncaught script errors in the full native scenario')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'final':read(page),'scope':'Native HTTP/Chromium software WebGL2: high-quality scene smoke and complete low-power gameplay. Ordinary input feedback driver, no player-state or clock assignments. Not a physical-phone, controller, hardware-frame-rate or commercial-content parity certification.'},indent=2))
 except Exception as e:
  try:last=read(page)
  except:last=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':last},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:context.close();browser.close()
