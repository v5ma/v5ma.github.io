"""Fresh keyboard/UI Cycle Works journey. No initial save or live actor writes.
The old first-commission/touch/quest/art journeys remain independent regressions.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,time,math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'cycle-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];held=set()
def read():return page.evaluate('LeonardoGuild.inspect()')
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
def hold(codes):
 global held
 codes=set(codes)
 for code in held-codes:page.keyboard.up(code)
 for code in codes-held:page.keyboard.down(code)
 held=codes
def stop():
 hold([])
 if read()['mode']=='bike':hold(['KeyZ'])
 page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.4',timeout=30000);hold([])
def drive(x,z,radius=1.5,limit=180):
 page.wait_for_function('LeonardoGuild.inspect().running');page.locator('#world').focus();start=time.monotonic()
 while time.monotonic()-start<limit:
  s=read();dx=x-s['x'];dz=z-s['z'];d=math.hypot(dx,dz)
  if d<radius:stop();return
  angle=(math.atan2(dx,dz)-s['yaw']+math.pi)%(math.pi*2)-math.pi;keys=[]
  desired=min(7 if s['mode']=='bike' else 3.5,math.sqrt(max(.1,d-radius)*3.4))
  if abs(angle)>.5:desired=min(desired,2.5)
  if s['mode']=='foot':
   if abs(angle)<.85:keys.append('KeyW')
  elif s['speed']>desired+.5:keys.append('KeyZ')
  elif s['speed']<desired-.2:keys.append('KeyW')
  if angle>.04:keys.append('KeyA')
  elif angle<-.04:keys.append('KeyD')
  hold(keys);page.wait_for_timeout(40)
 raise AssertionError('Failed route target '+str((x,z))+' '+json.dumps(read()))
def nearby(kind,id):
 page.locator('#world').focus();page.keyboard.press('KeyI');page.wait_for_selector('#city-dialog[open]');page.locator('[data-city-select="'+kind+':'+id+'"]').click()
def closecity():
 page.locator('#city-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused');hold([])
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1080,'height':760},service_workers='block',record_video_dir=str(OUT/'video'))
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');page.wait_for_function('LeonardoGuild.inspect().render.art.ready')
  check(read()['version']=='0.6.0','The same game loads Cycle Works v0.6.0')
  page.locator('#start').click();page.wait_for_function('LeonardoGuild.inspect().steps>3');check(read()['render']['cycle']['frame']['finish']=='terracotta','The actual detailed bicycle frame is rendered')
  page.screenshot(path=str(OUT/'detailed-bicycle.png'))
  for z,n in [(16,0),(53,2)]:
   drive(2,z,1.6)
   page.keyboard.press('KeyQ');page.wait_for_function('(n)=>LeonardoGuild.inspect().deliveries.length===n',arg=n+1)
   page.keyboard.press('KeyC');page.wait_for_function('(n)=>LeonardoGuild.inspect().deliveries.length===n',arg=n+2)
  check(read()['credits']==100,'Physical letter deliveries earn the actual tuning budget')
  drive(0,110,2);drive(0,170,2);drive(0,208,2);drive(-10,215,1.2);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(-17,215,.7);drive(-22,212,.7)
  check(read()['render']['interior']['room']=='smith','The rider walks through Bartolo\'s original shop doorway')
  nearby('service','cycleworks');check(page.locator('[data-city-work="fitting"]').count()==1,'Tuning explains the existing A Better Fit prerequisite')
  page.locator('[data-city-work="fitting"]').click();page.wait_for_selector('#street-dialog[open]')
  for value in ['reach','saddle','pedals']:page.locator('[data-street-action="'+value+'"]').click()
  page.wait_for_function('LeonardoGuild.inspect().street.done.includes("fitting")');page.locator('#street-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused')
  check(read()['street']['done'].count('fitting')==1,'The actual original fitting activity unlocks the new bench')
  nearby('service','cycleworks');before=read()['credits'];page.locator('[data-city-action="gear:sprint"]').click();check(read()['cycle']['gear']=='sprint' and read()['credits']==before-30,'Buying sprint gearing deducts earned florins and equips it')
  page.locator('[data-city-action="gear:stock"]').click();page.locator('[data-city-action="gear:sprint"]').click();check(read()['credits']==before-30,'Refitting owned gears is free')
  page.locator('[data-city-action="brake:lever"]').click();page.locator('[data-city-action="finish:river"]').click();check(read()['credits']==before-73,'Brake and enamel each have a single transparent purchase cost')
  page.screenshot(path=str(OUT/'cycle-bench-options.png'))
  page.locator('[data-city-action="start"]').click();check(read()['cycle']['active']['gate']==0,'The test is armed without moving the player or starting its timer')
  check(page.locator('[data-city-action="gear:stock"]').is_disabled(),'Equipment cannot be changed during a measured attempt')
  closecity();page.wait_for_function('LeonardoGuild.inspect().render.cycle.frame.finish==="river"');check(read()['render']['cycle']['frame']['brakeLever'],'The visible player bicycle uses the fitted finish and brake lever')
  page.screenshot(path=str(OUT/'cycle-workstand.png'))
  drive(-17,215,.7);drive(-11,215,1);v=read()['vehicles']['bike'];drive(v['x']+2.5,v['z']+.5,.7);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="bike"')
  drive(0,216,1);check(read()['cycle']['active']['seconds']==0,'Walking to the parked bicycle did not consume road-test time')
  for x,z,gate in [(0,222,1),(-2,230,2),(2,240,3),(-2,250,4)]:
   drive(x,z,.8);check(read()['cycle']['active']['gate']>=gate,'Ordinary cycling crosses checkpoint '+str(gate))
  page.screenshot(path=str(OUT/'road-test-pennants.png'));drive(0,259,.8);page.wait_for_function('LeonardoGuild.inspect().cycle.pending!==null')
  check(read()['cycle']['active'] is None and abs(read()['speed'])<1.2,'The final stage requires a real stopped bicycle in the braking ring')
  money=read()['credits'];xp=read()['life']['xp'];pending=read()['cycle']['pending'];check(not read()['cycle']['rewarded'],'Finishing the road does not award the return-report reward remotely')
  drive(0,240,2);drive(0,215,2);drive(-10,215,1);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(-17,215,.7);drive(-22,212,.7)
  nearby('service','cycleworks');page.locator('[data-city-action="report"]').click();check(read()['cycle']['rewarded'] and read()['credits']==money+25 and read()['life']['xp']==xp+40,'A physical return and report pay the single road-test reward')
  check(page.locator('[data-city-action="report"]').count()==0,'The recorded report cannot be clicked again for currency')
  check(not any(e['type']=='recover' for e in read()['events']),'The complete new journey required no recovery teleport')
  page.locator('.city-tabs [data-city-tab="roadtest"]').click();page.screenshot(path=str(OUT/'road-test-record.png'));closecity();saved=read();page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');check(read()['cycle']['finish']=='river' and read()['cycle']['brake']=='lever' and read()['cycle']['rewarded'],'Equipment and paid status survive a real reload')
  check(read()['cycle']['best']==pending['seconds'] and read()['credits']==saved['credits'],'Personal best and earned currency survive reload exactly')
  check(read()['deliveries']==saved['deliveries'] and read()['street']['done']==saved['street']['done'],'Earlier deliveries and activity completion remain intact')
  page.locator('#start').click();page.set_viewport_size({'width':390,'height':844});page.keyboard.press('KeyI');page.wait_for_selector('#city-dialog[open]');page.locator('.city-tabs [data-city-tab="roadtest"]').click();page.screenshot(path=str(OUT/'portrait-road-test.png'))
  check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The new tab fits a narrow viewport')
  check(not errors,'No uncaught browser errors in the fresh tuning and road-test journey')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'final':read(),'scope':'Fresh ordinary-keyboard/UI HTTP software-WebGL journey. No save seeding, actor/clock/reward assignment or runtime rewriting. Not a hardware frame-rate benchmark.'},indent=2))
 except Exception as e:
  try:last=read()
  except:last=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':last},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:ctx.close();browser.close()
