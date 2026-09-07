"""HTTP / native WebGL integration. Every gameplay transition uses ordinary
keys, pointer actions or UI. Observations are copies; no actor/clock writes.
"""
from pathlib import Path
import os,json,time,math
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'svgn-planet/test-output/city';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];held=set()
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS',text,flush=True)
def read(p):return p.evaluate('SVGNPlanet.inspect()')
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def point(t,x=0):return [math.sin(x/110),math.cos(x/110)*math.cos(t/110),-math.cos(x/110)*math.sin(t/110)]
def hold(p,wanted):
 global held
 wanted=set(wanted)
 for k in held-wanted:p.keyboard.up(k)
 for k in wanted-held:p.keyboard.down(k)
 held=wanted
def stop(p):
 q=read(p);hold(p,[])
 if q['city']['car']:
  hold(p,['Space']);p.wait_for_function('Math.abs(SVGNPlanet.inspect().city.vehicles.find(v=>v.id===SVGNPlanet.inspect().city.car).speed)<.25');hold(p,[])
 elif not q['city']['drone']['active']:p.wait_for_function('SVGNPlanet.inspect().speed<.25')
def go(p,t,x=0,radius=1.7):
 to=point(t,x);start=time.monotonic()
 while time.monotonic()-start<110:
  s=read(p);c=s['city'];n=c['drone']['n'] if c['drone']['active'] else s['n'];d=math.acos(max(-1,min(1,dot(n,to))))*110
  if d<radius:stop(p);return
  aim=[to[i]-n[i]*dot(n,to) for i in range(3)];length=math.sqrt(dot(aim,aim));aim=[v/length for v in aim];wanted=[]
  if c['car']:
   v=next(v for v in c['vehicles'] if v['id']==c['car']);a=math.atan2(dot(n,cross(v['f'],aim)),dot(v['f'],aim));limit=2.8 if abs(a)>.3 else min(8,math.sqrt(d*3))
   if v['speed']>limit+.2:wanted.append('KeyS')
   elif v['speed']<limit:wanted.append('KeyW')
   if a>.04:wanted.append('KeyA')
   elif a<-.04:wanted.append('KeyD')
  else:
   right=dot(s['basis']['right'],aim);fwd=dot(s['basis']['forward'],aim)
   if abs(right)>.22:wanted.append('KeyD' if right>0 else 'KeyA')
   if abs(fwd)>.22:wanted.append('KeyW' if fwd>0 else 'KeyS')
  hold(p,wanted);p.wait_for_timeout(65)
 raise AssertionError('Route '+str((t,x))+' stalled: '+json.dumps(read(p)))
def enter_car(p,id):
 v=next(v for v in read(p)['city']['vehicles'] if v['id']==id)
 n=v['n'];go(p,math.atan2(-n[2],n[1])*110,math.asin(n[0])*110,radius=.7)
 p.keyboard.press('KeyF');p.wait_for_function('(id)=>SVGNPlanet.inspect().city.car===id',arg=id)
def hack(p,id):
 hold(p,[]);p.keyboard.press('KeyX')
 for _ in range(12):
  if read(p)['city']['device']==id:break
  p.keyboard.press('KeyZ')
 check(read(p)['city']['device']==id,'Scan selects real device: '+id)
 old=len(read(p)['city']['events']);hold(p,['KeyH']);p.wait_for_function('(d)=>SVGNPlanet.inspect().city.events.slice(d.n).some(e=>e.type==="hack"&&e.id===d.id)',arg={'n':old,'id':id},timeout=18000);hold(p,[])
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1280,'height':800},service_workers='block');host=urlparse(BASE).hostname
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 p=ctx.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if 'Shader Error' in m.text else None)
 try:
  p.goto(BASE+'/svgn-planet/?quality=low',wait_until='domcontentloaded');p.wait_for_function('window.SVGNPlanet&&SVGNPlanet.inspect().render')
  check(read(p)['version']=='0.3.0','The existing online game loads the new city campaign')
  p.locator('#start').click();p.locator('#jobs-button').click();before=read(p);p.wait_for_timeout(300);check(read(p)['steps']==before['steps'],'Job board pauses gameplay rather than resetting it')
  p.screenshot(path=str(OUT/'01-assignment.png'));p.locator('#begin-city').click();p.wait_for_function('!SVGNPlanet.inspect().paused')
  go(p,-9,-4.2);p.keyboard.press('KeyE');check(read(p)['city']['stage']==1,'James collects the reporting kit from the actual newsroom desk')
  enter_car(p,'press');check(True,'The courier gets into the nearby press hatchback')
  go(p,35,0);go(p,106,0);go(p,116,0);go(p,116,12);p.keyboard.press('KeyE');check(read(p)['city']['stage']==2,'Driving the connected neighborhood reaches Nia at Signal Plaza')
  p.screenshot(path=str(OUT/'02-plaza-driving.png'))
  go(p,116,25);go(p,130,24);p.keyboard.press('KeyF');p.wait_for_function('SVGNPlanet.inspect().city.car===null');go(p,132,21)
  p.locator('#jobs-button').click();p.locator('[data-buy=nitro]').click();check(read(p)['city']['nitro'] and read(p)['city']['credits']==20,'The nearby garage spends actual earned/starter credits to install nitro')
  p.locator('#jobs-close').click();p.wait_for_function('!SVGNPlanet.inspect().paused')
  go(p,154,25);hack(p,'power');check(read(p)['city']['power'],'The power junction changes the real checkpoint network')
  go(p,165,24);p.keyboard.press('KeyF');
  if read(p)['ride']:p.keyboard.press('KeyF')
  p.keyboard.press('KeyC');p.keyboard.press('KeyR');p.wait_for_function('SVGNPlanet.inspect().city.drone.active')
  body=read(p)['n'];check(read(p)['city']['drone']['active'],'A controllable scout drone deploys from the player')
  go(p,187,24);hack(p,'evidence');check(read(p)['city']['stage']==3 and read(p)['city']['approach']=='drone','The remote approach obtains evidence beyond the still-closed gate')
  check(not read(p)['city']['gate'] and read(p)['n']==body,'The body stayed outside; no player teleport or secretly opened gate')
  p.screenshot(path=str(OUT/'03-drone-extraction.png'));p.keyboard.press('KeyR');check(not read(p)['city']['drone']['active'] and read(p)['n']==body,'Recalling the drone returns control to the same stationary body')
  go(p,167,23);hack(p,'gate');check(read(p)['city']['gate'],'A real powered gate opens for the on-foot route')
  go(p,175,25);p.keyboard.press('KeyX');p.screenshot(path=str(OUT/'04-security-yard.png'));hack(p,'camera');check(read(p)['city']['loop']>0,'Looping the camera disables its actual surveillance window')
  go(p,173,25);go(p,164,25);go(p,144,25);go(p,130,24);enter_car(p,'press')
  go(p,151,25);go(p,165,25);go(p,175,25);go(p,181,26.5);go(p,190,25);go(p,206,25);go(p,206,55);p.keyboard.press('KeyF');p.wait_for_function('SVGNPlanet.inspect().city.car===null');go(p,206,57);p.keyboard.press('KeyE');check(read(p)['city']['stage']==4,'Crossing the physical harbor bridge reaches the quay report')
  p.screenshot(path=str(OUT/'05-harbor-report.png'))
  go(p,206,25);go(p,197,25);go(p,195,13);go(p,158,13);go(p,158,25);go(p,116,25);go(p,116,0);go(p,0,0);go(p,-9,-4.2)
  p.wait_for_function('SVGNPlanet.inspect().city.trace<.08',timeout=20000);p.keyboard.press('KeyE');p.wait_for_function('SVGNPlanet.inspect().city.completed')
  check(read(p)['city']['stage']==5 and read(p)['city']['credits']>=270,'The complete investigation publishes and awards its reward once')
  before=read(p);p.wait_for_timeout(2300);check(read(p)['steps']>before['steps'] and not read(p)['failed'],'Publishing leaves the same open world running')
  p.screenshot(path=str(OUT/'06-story-published.png'));p.reload(wait_until='domcontentloaded');p.wait_for_function('window.SVGNPlanet&&SVGNPlanet.inspect().render');check(read(p)['city']['completed'] and read(p)['city']['nitro'],'Progress and garage upgrade survive an actual page reload')
  p.locator('#start').click();p.locator('#atlas').click();p.screenshot(path=str(OUT/'07-connected-map.png'));p.locator('#map-close').click();p.wait_for_function('!SVGNPlanet.inspect().paused');p.set_viewport_size({'width':390,'height':844});p.wait_for_timeout(300);p.screenshot(path=str(OUT/'08-narrow-ui.png'));check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The extended UI remains inside a phone-width viewport')
  final=read(p)
  p.goto(BASE+'/svgn-planet/development/roadmap.html',wait_until='domcontentloaded');p.wait_for_selector('.card');check(p.locator('.card').count()==23,'The versioned development board contains the full staged backlog');p.locator('#search').fill('swimming');p.wait_for_timeout(100);check(p.locator('.card').count()==1,'Development board search filters actual roadmap data');p.locator('#clear').click();p.set_viewport_size({'width':1440,'height':950});p.screenshot(path=str(OUT/'09-development-board.png'))
  check(not errors,'No uncaught JS or shader errors in the full city mission')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'completed':before,'scope':'Native HTTP software WebGL2, ordinary keys/UI and copied observations. Not physical-phone/GPU certification. Separate legacy desktop/mobile tests cover context recovery.'},indent=2))
 except Exception as e:
  try:last=read(p)
  except:last=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'snapshot':last},indent=2))
  try:p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:b.close()
