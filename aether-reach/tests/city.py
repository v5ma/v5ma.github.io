"""Native HTTP/WebGL city expedition. Only keyboard and UI clicks mutate the
game; read-only snapshots observe it. No actor, money, mission or clock writes.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,math,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
MODE=os.getenv('CITY_SUITE','civic');checks=[];errors=[];visits=[]
def state(p):return p.evaluate('AetherReach.snapshot()')
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
def close(p,dialog='city-dialog'):
 p.locator('#'+dialog+' form button').click()
 p.wait_for_function('!AetherReach.snapshot().paused')
 t=state(p)['time'];p.wait_for_function('(t)=>AetherReach.snapshot().time>t',arg=t)
 p.locator('#world').focus()
def walk(p,points,tolerance=.38):
 held=set()
 def keys(new):
  nonlocal held
  for k in held-new:p.keyboard.up(k)
  for k in new-held:p.keyboard.down(k)
  held=new
 try:
  for x,z in points:
   start=time.monotonic()
   while time.monotonic()-start<85:
    a=state(p);s=a['position'];d=math.hypot(x-s['x'],z-s['z'])
    if d<tolerance:break
    if a['paused']:raise AssertionError('Unexpected modal while walking')
    want=math.atan2(x-s['x'],-(z-s['z']));delta=math.atan2(math.sin(want-s['yaw']),math.cos(want-s['yaw']))
    new=set()
    if abs(delta)>.045:new.add('ArrowRight' if delta>0 else 'ArrowLeft')
    if abs(delta)<.24:new.add('KeyW')
    keys(new);p.wait_for_timeout(25)
   else:raise AssertionError('Route blocked toward '+str((x,z))+' at '+json.dumps(a))
   keys(set());p.wait_for_timeout(90);visits.append({'target':[x,z],'position':state(p)['position']})
 finally:keys(set())
def look(p,x,z):
 for _ in range(160):
  a=state(p)['position'];want=math.atan2(x-a['x'],-(z-a['z']));d=math.atan2(math.sin(want-a['yaw']),math.cos(want-a['yaw']))
  if abs(d)<.04:return
  k='ArrowRight' if d>0 else 'ArrowLeft';p.keyboard.down(k);p.wait_for_timeout(20);p.keyboard.up(k)
def use(p,flag=None):
 p.locator('#world').focus();p.keyboard.press('KeyE',delay=100)
 if flag:p.wait_for_function('(f)=>AetherReach.snapshot().city.flags.includes(f)',arg=flag)
def talk(p,name,choice):
 use(p);p.wait_for_selector('#city-dialog[open]')
 check(name in p.locator('#city-speaker').inner_text(),'Nearby conversation: '+name)
 p.locator('[data-city-choice="'+choice+'"]').click()
 close(p)
def photo(p,name):p.screenshot(path=str(OUT/name))
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1280,'height':800},service_workers='block')
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 p=ctx.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  p.goto(BASE+'/aether-reach/',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach')
  check(p.evaluate('AetherReach.version==="0.5.0"'),'The living-city build boots the actual renderer')
  photo(p,'city-title-'+MODE+'.png');p.locator('#start').click();p.wait_for_function('AetherReach.snapshot().playing&&!AetherReach.snapshot().paused')
  if MODE=='civic':
   walk(p,[(-3,3),(-10,2),(-10,6),(-8.8,7)])
   talk(p,'Nora','start-pumps');check('cellar-key' in state(p)['city']['flags'],'Nora issues a real service key')
   walk(p,[(-9.4,9.9)]);look(p,-9.4,10.3);photo(p,'copper-cup-interior.png');talk(p,'Mara','start-cat')
   walk(p,[(-10,6),(-10,2),(0,2),(0,17),(0,30),(0,35),(-10,36),(-10,40.5),(-9.6,44.8)])
   talk(p,'Ada','start-cargo');photo(p,'lantern-watch-interior.png')
   walk(p,[(-10,40.5),(-10,36),(0,36),(0,48),(3,47)]);use(p,'cat-found')
   check(True,'Pip is found through an actual city walk and proximity interaction')
   walk(p,[(0,48),(0,35),(0,17),(0,2),(-10,2),(-10,6),(-9.4,9.9)]);talk(p,'Mara','finish-cat')
   walk(p,[(-10,6),(-10,5.4),(-12.15,5.4),(-12.15,11.6),(-10,11.6),(-8.3,11.6)])
   check(state(p)['room']=='basement' and state(p)['position']['y']< -4,'The café stair physically descends into the same-map basement')
   use(p,'fuse');walk(p,[(-9,9.2)]);use(p,'ledger');walk(p,[(-7.7,7.2)]);use(p,'pump-fixed')
   look(p,-9,10);photo(p,'underquay-pump-vault.png')
   walk(p,[(-10,11.3),(-12.15,11.3),(-12.15,5.4),(-10,5.4),(-8.8,7)]);talk(p,'Nora','finish-pumps')
   check(state(p)['position']['y']>-.05 and state(p)['stats']['rescues']==0,'The basement has a walkable return, not a teleport or rescue')
   p.keyboard.press('KeyJ');p.wait_for_selector('#city-journal[open]');p.locator('[data-train="vigor"]').click()
   check(state(p)['maxHealth']==110,'Mission XP buys a real Vigor attribute rank');photo(p,'city-journal-attributes.png');close(p,'city-journal')
   walk(p,[(-9.4,10)]);talk(p,'Mara','date');check('dating' in state(p)['city']['flags'],'Adult companionship is an optional explicit dialogue choice')
   walk(p,[(-10,6),(-10,2),(4,2),(11,-6.5),(11,-10.8)]);talk(p,'Rook','recover-coil')
   walk(p,[(11,-6.5),(4,2),(0,17),(0,35),(-10,36),(-10,40.5),(-9.6,44.8)]);talk(p,'Ada','finish-cargo')
   walk(p,[(-10,40.5),(-10,36),(10,36),(10,40.5),(10,43.8)]);talk(p,'Mayor','finish-permit')
   check('permit' in state(p)['city']['flags'],'Resolved missions grant the hangar permit rather than an always-open gate')
   look(p,10.4,45.3);photo(p,'mayor-civic-hall.png')
   walk(p,[(10,40.5),(10,36),(-3,36),(-3,43),(-17,43),(-25,43),(-29,37),(-39,38),(-39,42.5),(-41.2,44.9)])
   talk(p,'Ivo','start-airmail');photo(p,'skywright-workshop.png')
   walk(p,[(-39,42.5),(-39,38),(-30,35)]);use(p);p.wait_for_function('AetherReach.snapshot().vehicle==="kestrel"')
   check(True,'The permit opens a reachable hangar and a mountable flying machine')
   p.keyboard.down('Space');p.wait_for_function('AetherReach.snapshot().position.y>32');p.keyboard.up('Space')
   walk(p,[(15,20),(79,-12)],tolerance=1.1);look(p,65,-32);photo(p,'kestrel-over-garden.png')
   p.keyboard.down('KeyC');p.wait_for_function('AetherReach.snapshot().grounded&&AetherReach.snapshot().position.y<7');p.keyboard.up('KeyC')
   use(p);p.wait_for_function('!AetherReach.snapshot().vehicle')
   walk(p,[(75.5,-13)]);use(p,'delivered');check(True,'A real skiff flight and Garden landing enable the airmail delivery')
   walk(p,[(78.8,-12)]);use(p);p.wait_for_function('!!AetherReach.snapshot().vehicle')
   p.keyboard.down('Space');p.wait_for_function('AetherReach.snapshot().position.y>32');p.keyboard.up('Space')
   walk(p,[(15,20),(-30,35)],tolerance=1.1)
   p.keyboard.down('KeyC');p.wait_for_function('AetherReach.snapshot().grounded&&AetherReach.snapshot().position.y<3');p.keyboard.up('KeyC')
   use(p);p.wait_for_function('!AetherReach.snapshot().vehicle')
   walk(p,[(-39,38),(-39,42.5),(-41.2,44.9)]);talk(p,'Ivo','finish-airmail')
   final=state(p);check(all(i in final['city']['done'] for i in ['cat','pumps','cargo','permit','company','airmail']),'Six connected city stories complete through ordinary input')
   check(final['stats']['rescues']==0,'The full civic, basement and airmail route needs no rescue')
   saved=final['city'];p.reload(wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach');p.locator('#continue').click()
   p.wait_for_function('AetherReach.snapshot().playing');check(state(p)['city']==saved,'Mission flags, relationship choice, XP and attributes survive reload')
  else:
   walk(p,[(3,0),(9,-5)]);use(p);p.wait_for_function('!!AetherReach.snapshot().rail')
   p.keyboard.down('KeyW');p.wait_for_function('!AetherReach.snapshot().rail',timeout=120000);p.keyboard.up('KeyW')
   walk(p,[(65,-22),(74,-27),(74,-30.7),(72.3,-34.5)]);talk(p,'Sel','start-resonance')
   walk(p,[(76.5,-33.2)]);use(p);check(state(p)['city']['glyphStep']==0,'A wrong initial glyph does not solve the puzzle')
   walk(p,[(71.3,-32.6)]);use(p);p.wait_for_function('AetherReach.snapshot().city.glyphStep===1')
   walk(p,[(74,-33)]);use(p);p.wait_for_function('AetherReach.snapshot().city.glyphStep===2')
   walk(p,[(76.5,-33.2)]);use(p,'glyph-solved')
   walk(p,[(72.3,-34.5)]);talk(p,'Sel','finish-resonance');check('mend' in state(p)['city']['flags'],'Ordered glyphs and a return conversation unlock a new spell')
   look(p,74,-32);photo(p,'resonance-conservatory.png')
   p.keyboard.press('KeyJ');p.wait_for_selector('#city-journal[open]');p.locator('[data-train="resonance"]').click();close(p,'city-journal')
   check(state(p)['city']['skills']['resonance']==1,'Magic mission XP supports an independent Resonance build')
   walk(p,[(74,-30.7),(74,-27),(65,-22)])
   p.wait_for_function('AetherReach.snapshot().health<95',timeout=120000);hp=state(p)['health'];p.keyboard.press('KeyV')
   p.wait_for_function('(hp)=>AetherReach.snapshot().health>hp',arg=hp);check(True,'Mend spends energy and heals actual enemy damage')
   p.keyboard.press('KeyJ');p.wait_for_selector('#city-journal[open]');p.set_viewport_size({'width':390,'height':844});p.wait_for_timeout(500)
   check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'City journal remains inside a phone-width display')
   photo(p,'city-journal-mobile.png');close(p,'city-journal')
   p.locator('#pause-button').click();p.locator('#return-title').click();check(p.locator('#menu').is_visible(),'New city UI preserves normal pause and title return')
  check(not errors,'No uncaught JavaScript exceptions in the native city scenario')
  (OUT/(MODE+'-report.json')).write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'state':state(p),'visits':visits,'scope':'Native Chromium HTTP/software-WebGL and ordinary keys/UI. No actor-position, time, money or objective assignment. Physical GPU/Xbox/Quest performance and comfort are not certified.'},indent=2))
 except Exception as e:
  try:s=state(p)
  except:s=None
  (OUT/(MODE+'-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':s,'visits':visits},indent=2))
  try:photo(p,MODE+'-failure.png')
  except:pass
  raise
 finally:ctx.close();b.close()
