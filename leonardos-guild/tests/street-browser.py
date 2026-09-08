"""Native WebGL source/art and ordinary-input activity journeys. Fresh starts;
no actor position, inventory, quest, clock or payout assignments in the browser.
"""
from pathlib import Path
from urllib.parse import urlparse
import json,os,time,math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];MODE=os.getenv('STREET_SUITE','art');OUT=ROOT/'street-output'/MODE;OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];held=set()
def check(v,label):
 assert v,label
 checks.append(label);print('PASS:',label,flush=True)
def read():return page.evaluate('LeonardoGuild.inspect()')
def hold(codes):
 global held
 codes=set(codes)
 for k in held-codes:page.keyboard.up(k)
 for k in codes-held:page.keyboard.down(k)
 held=codes
def stop():
 hold([]);s=read()
 if abs(s['speed'])>.5:
  if s['mode']!='foot':
   sign=1 if s['speed']>0 else -1;hold(['KeyS' if sign>0 else 'KeyW']);page.wait_for_function('(sign)=>LeonardoGuild.inspect().speed*sign<=.5',arg=sign);hold([])
  page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.5')
def drive(x,z,radius=1,limit=170):
 page.wait_for_function('LeonardoGuild.inspect().running');page.locator('#world').focus();start=time.monotonic()
 while time.monotonic()-start<limit:
  s=read();dx=x-s['x'];dz=z-s['z'];d=math.hypot(dx,dz)
  if d<radius:stop();return
  angle=(math.atan2(dx,dz)-s['yaw']+math.pi)%(2*math.pi)-math.pi
  speed=min(8 if s['mode']=='bike' else 4,math.sqrt(max(.1,d-radius)*4));codes=[]
  if abs(angle)>.5:speed=min(speed,2.8)
  if s['mode']=='foot':
   if abs(angle)<.9:codes.append('KeyW')
  elif s['speed']>speed+.4:codes.append('KeyS')
  elif s['speed']<speed-.2:codes.append('KeyW')
  if angle>.045:codes.append('KeyA')
  elif angle<-.045:codes.append('KeyD')
  hold(codes);page.wait_for_timeout(50)
 raise AssertionError('Could not reach '+str((x,z))+' '+json.dumps(read()))
def openwork(title):
 page.locator('#world').focus();page.keyboard.press('KeyY');page.wait_for_selector('#street-dialog[open]');check(title.lower() in page.locator('#street-title').inner_text().lower(),'In-world activity reaches '+title)
def closework():
 page.locator('#street-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused');hold([])
def act(value):page.locator('[data-street-action="'+value+'"]').click()
with sync_playwright() as p:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**args);ctx=browser.new_context(viewport={'width':1000,'height':720},service_workers='block',record_video_dir=str(OUT/'video'))
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  if MODE=='art':
   page.set_viewport_size({'width':1280,'height':800});page.goto(BASE+'/leonardos-guild/?quality=high&art=baseline',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');page.locator('#start').click();page.screenshot(path=str(OUT/'before-workshop-street.png'))
  page.goto(BASE+'/leonardos-guild/?quality='+('high' if MODE=='art' else 'low'),wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');page.wait_for_function('LeonardoGuild.inspect().render.art.ready||LeonardoGuild.inspect().render.art.failed',timeout=120000)
  check(read()['render']['art']['ready'],'All actual curated assets load instead of silently falling back')
  check(read()['render']['art']['models']==32 and read()['render']['art']['facades']==49,'The renderer uses 32 named CC0 models across the same 49 building shells')
  check(read()['render']['art']['bytes']<10000000,'The selected redistributed art budget stays below 10 MB')
  page.locator('#start').click()
  if MODE=='art':
   page.screenshot(path=str(OUT/'after-workshop-street.png'))
   page.locator('#settings-button').click();page.locator('#graphics-quality').select_option('low');page.locator('#settings-close').click();page.wait_for_function('!LeonardoGuild.inspect().paused')
   page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(-9,24);drive(-17,24,.8);drive(-23,24,.8)
   check(read()['render']['interior']['room']=='workshop','The new facade preserves the original physically walkable doorway')
   page.screenshot(path=str(OUT/'textured-workshop-interior.png'));drive(-22,27,.7);openwork('Three Gears');before=read();act('pin')
   check(read()['credits']==before['credits'] and 'calibrate' not in read()['street']['done'],'A mistaken workshop operation charges nothing and grants no reward')
   for answer in ['large gear','small gear','pin']:act(answer)
   check('calibrate' in read()['street']['done'],'A real sequence completes the existing indoor calibration work')
   closework();drive(-23,24);drive(-17,24);drive(-10,24)
   check(read()['render']['interior']['room'] is None,'Walking back out restores the textured exterior shell')
   page.keyboard.press('KeyV');page.wait_for_selector('#street-dialog[open]');check(page.locator('.street-grid article').count()==22,'The persisted neighbourhood board lists all 22 authored activities')
   page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'portrait-work-board.png'));check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The activity board fits a narrow screen');closework()
   page.route('**/ASSET-REGISTER.json',lambda r:r.abort());page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');page.wait_for_function('LeonardoGuild.inspect().render.art.failed');page.locator('#start').click();page.locator('#world').focus();page.keyboard.down('KeyW');page.wait_for_function('LeonardoGuild.inspect().z>0');page.keyboard.up('KeyW')
   check(read()['render']['art']['facades']==0 and read()['render']['triangles']>50000,'Unavailable enhanced art leaves the original game visibly playable')
  elif MODE=='neighbourhood':
   page.keyboard.press('KeyV');page.wait_for_selector('#street-dialog[open]');before=read();page.locator('[data-street-track="cart"]').click();check(read()['x']==before['x'] and read()['z']==before['z'],'Marking an activity never teleports the rider');closework()
   drive(1,61,2);drive(8,86,1.5);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(10,89,1);openwork('A Wheel');money=read()['credits'];act('wheel');check(read()['credits']==money,'Wrong repair order does not spend florins')
   for answer in ['brace','axle','wheel']:act(answer)
   check('cart' in read()['street']['done'] and read()['credits']==money+18,'Repairing the market cart awards one real encounter reward');closework();page.screenshot(path=str(OUT/'repaired-market-cart.png'))
   drive(10,125,1.5);drive(10,145,1);openwork('Notes through');page.locator('#street-listen').click();check('C / E / G / E / C' in page.locator('#street-message').inner_text(),'The playable melody has a written alternative')
   for answer in ['C','E','G','E','C']:act(answer)
   check('tune' in read()['street']['done'],'The musician lesson accepts actual note-button input');closework();page.screenshot(path=str(OUT/'street-musician.png'))
   drive(-10,127,1);openwork('Bell before');act('brake');closework();openwork('Bell before');check(read()['street']['sequence']==[],'Leaving a puzzle clears its half-entered input without granting progress')
   for answer in ['brake','gear','cord']:act(answer)
   check('bell' in read()['street']['done'],'The second repair uses a different ordered mechanism');closework()
   before=read();page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');check(read()['street']['done']==before['street']['done'] and read()['credits']==before['credits'],'Completed activities and one-time payments survive a real page reload')
   page.locator('#start').click();page.keyboard.press('KeyV');page.wait_for_selector('#street-dialog[open]');check(page.locator('[data-street-track="cart"]').is_disabled(),'Completed work cannot be selected again for a second payout');page.locator('[data-street-tab="notes"]').click();check(page.locator('.street-grid article').count()==3,'Field Notes retain the three actual outcomes');page.screenshot(path=str(OUT/'remembered-work.png'))
  else:
   drive(1,45,2);drive(11,61,1.5);page.keyboard.press('KeyF');page.wait_for_function('LeonardoGuild.inspect().mode==="foot"');drive(17,61,.8);drive(22,58,.8);openwork('Useful Cup');act('continue');closework()
   drive(22,61);drive(17,61);drive(10,61);drive(-10,76);drive(-13,76,.8);openwork('Useful Cup');act('continue');closework()
   drive(-10,99);drive(12.5,99,.8);openwork('Useful Cup');act('continue');closework()
   drive(10,140,1.5);drive(8,181.5,.8);openwork('Useful Cup');act('continue');closework()
   drive(10,140,1.5);drive(10,98,1.5);drive(10,61);drive(17,61,.8);drive(22,58,.8);openwork('Useful Cup');act('honey');check('tonic' not in read()['street']['done'],'The recipe does not complete from a wrong final ingredient order')
   for answer in ['water','sage','honey']:act(answer)
   check('tonic' in read()['street']['done'] and read()['health']==read()['attributes']['maxHealth'],'The gathered recipe creates its actual restorative result');closework();page.screenshot(path=str(OUT/'apothecary-recipe.png'))
   page.keyboard.press('KeyV');page.wait_for_selector('#street-dialog[open]');page.locator('[data-street-tab="notes"]').click();check('Useful Cup' in page.locator('#street-content').inner_text(),'The discovered recipe remains in Field Notes')
  check(not errors,'No uncaught browser exceptions during this native journey')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'final':read(),'scope':'Fresh native HTTP/Chromium software WebGL; actual keys, buttons, audio action and ordinary movement. Art comparison at same starting location/camera; no live actor/progress/clock assignments. Physical hardware and all 22 human journeys are not certified.'},indent=2))
 except Exception as e:
  try:state=read()
  except:state=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 finally:ctx.close();browser.close()
