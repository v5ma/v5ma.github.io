"""Lantern Vault: real keyboard movement, DOM/XR interaction and WebGL.
Only XR hardware and the clearly labelled storage fault are simulated. No actor,
quest, inventory, money, focus, clock or reward assignments are used.
"""
from pathlib import Path
import os,json,math,time,importlib.util,base64
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
ROUTE=os.environ.get('VAULT_ROUTE','optical')
SITE='public' if BASE.startswith('https://') else 'source'
OUT=ROOT/('vault-'+SITE+'-output');OUT.mkdir(exist_ok=True)
checks=[];errors=[];failure=None;states={}
def report():
 (OUT/'report.json').write_text(json.dumps({'base':BASE,'route':ROUTE,'checks':checks,'errors':errors,'failure':failure,'states':states,'evidence':'Ordinary keyboard/DOM actions, real WebGL, synthetic XR controller/hand hardware and labelled failed-storage injection. Not physical Quest.'},indent=2))
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True);report()
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts)
 try:
  ctx=browser.new_context(viewport={'width':640,'height':480},service_workers='block')
  ctx.add_init_script(script=(ROOT/'tests/xr-hardware-mock.js').read_text()+'\n'+(ROOT/'tests/xr-compositor-mock.js').read_text())
  ctx.add_init_script("window.__storageFailure=false;const oldSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.__storageFailure&&k==='svgn.leonardos-guild.v1')throw Error('Labelled test storage failure');return oldSet.call(this,k,v);};")
  page=ctx.new_page();page.set_default_timeout(65000);page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/leonardos-guild/?quality=low&chapter=lantern-vault',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
  read=lambda:page.evaluate('LeonardoGuild.inspect()')
  check(not read()['quarter']['active'] and read()['vault']['tracking'],'The chapter selects an objective in full Vinci without replacing the adventure')
  page.locator('#vault-start').click();page.wait_for_function('LeonardoGuild.inspect().running');page.keyboard.press('f')
  check(read()['mode']=='foot','The original dismount control starts the survey on foot')
  def frames(n=3):
   page.evaluate('(n)=>new Promise(resolve=>{let i=0;function next(){if(++i>=n)resolve();else requestAnimationFrame(next);}requestAnimationFrame(next);})',n)
  held=set()
  def keys(next):
   next=set(next)
   for k in held-next:page.keyboard.up(k)
   for k in next-held:page.keyboard.down(k)
   held.clear();held.update(next)
  def walk(*points):
   # HTML dialog close dispatch is queued; observe the real resume before sending movement.
   page.wait_for_function('LeonardoGuild.inspect().running')
   for x,z in points:
    begin=time.monotonic()
    while time.monotonic()-begin<160:
     s=read();assert s['running'],'Walking is unexpectedly paused';dx=x-s['x'];dz=z-s['z'];d=math.hypot(dx,dz)
     if d<.85:
      keys([]);frames(12);break
     a=(math.atan2(dx,dz)-s['yaw']+math.pi)%(math.pi*2)-math.pi
     keys((['w'] if abs(a)<.5 else [])+(['a' if a>0 else 'd'] if abs(a)>.06 else []));frames(2)
    else:raise AssertionError('No walking route to '+str((x,z))+' current '+str((read()['x'],read()['z'])))
  def use():page.keyboard.press('i');frames(4)
  def equip(tool):
   page.keyboard.press('p');page.wait_for_selector('#pause-dialog[open]');page.locator('#desk-vault').click();page.wait_for_selector('#vault-dialog[open]');page.locator('#vault-equip-'+tool).click();page.locator('#vault-close').click();check(page.locator('#pause-dialog').get_attribute('open') is not None,'Survey Back retains the existing pause parent');page.locator('#resume').click();page.wait_for_function('LeonardoGuild.inspect().running')
  walk((0,3),(-8,3));use();page.wait_for_selector('#vault-dialog[open]')
  page.evaluate('__storageFailure=true');page.locator('#vault-accept').click()
  check(not read()['vault']['accepted'] and 'Not saved' in page.locator('#vault-dialog').inner_text(),'A failed save cannot grant the loan or advance the chapter')
  page.evaluate('__storageFailure=false');page.locator('#vault-accept').click()
  check(read()['vault']['accepted'] and read()['credits']==0,'The survey loans both tools without charging or granting currency')
  page.locator('#vault-close').click();walk((0,3),(0,-17));use();page.wait_for_selector('#frontier-dialog[open]');page.locator('[data-frontier-action="enter"]').click();page.wait_for_function("LeonardoGuild.inspect().frontier.zone==='badlands'&&LeonardoGuild.inspect().running")
  walk((320,20),(324,25),(331,25));page.screenshot(path=str(OUT/'survey-entry.png'))
  check(read()['render']['frontier']['vault']['spaces']==8,'The actual Cinder Hollow renderer contains the eight-space survey wing')
  if ROUTE=='optical':
   walk((334,25),(334,14),(345,14));use();check('inscription' in read()['vault']['notes'],'Using the carried lens reveals and records the inscription')
   walk((354,14),(363,14));use();check('account' in read()['vault']['notes'],'The alternative observation walk preserves the caretaker account')
   walk((362,25),(350,25),(339,25));use();check(read()['vault']['lens']=='emitter','The same inventory lens moves into the real light instrument')
   equip('weight');walk((347,25),(347,28));use();walk((347,25),(362,25),(362,28));use()
   check(read()['vault']['mirror']==1 and read()['vault']['weight']=='shutter','The shutter and east-facing reflector form the optical solution')
   page.screenshot(path=str(OUT/'optical-solution.png'));walk((362,25),(374,25),(381,25))
  else:
   equip('weight');walk((336,25),(336,36),(347,36));use()
   check(read()['vault']['weight']=='service' and read()['vault']['lens']=='pack','The maintenance approach uses one weight without solving the optical puzzle')
   walk((355,36),(382,36),(382,25));page.screenshot(path=str(OUT/'maintenance-route.png'))
  use();check(read()['vault']['record'],'Ordinary movement reaches the protected plans through the '+ROUTE+' route')
  walk((374,25),(374,28));use();check(read()['vault']['shortcut'],'The interior latch creates a persistent return connection')
  states['archive']=read();page.keyboard.press('m');page.wait_for_selector('#map-dialog[open]');page.screenshot(path=str(OUT/'survey-map.png'));page.locator('#map-close').click()
  # The same reached chapter, not an assigned fixture position, enters XR.
  mode='first-person' if ROUTE=='optical' else 'diorama-ar'
  page.keyboard.press('p');page.wait_for_selector('#pause-dialog[open]');page.locator('#xr-pause-launcher [data-xr-entry="'+mode+'"]').click()
  page.wait_for_function('LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.entry.frames>4')
  page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture')
  image_path=OUT/(mode+'-archive.png');image_path.write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]))
  image=Image.open(image_path).convert('RGBA');iw,ih=image.size;counts=[]
  for eye in range(2):
   counts.append(len({v[:3] for v in image.crop((eye*iw//2+40,60,(eye+1)*iw//2-40,ih-60)).resize((100,100)).getdata() if v[3]>150}))
  states['stereo_eye_colors']=counts;check(min(counts)>30,mode+': both real eye attachments contain nonblank survey geometry')
  check(read()['xr']['presenting'] and read()['vault']['record'],mode+': the reached survey remains playable in the existing XR scene')
  page.evaluate('__xr.replace(1,true)')
  spec=importlib.util.spec_from_file_location('hands',ROOT/'tests/porter-xr-pointer.py');helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
  xrframes,panel,dom,capture=helper.hand_ui(page);xrframes(6);panel('pause');xrframes(4);dom('#desk-vault');xrframes(4)
  check(page.locator('#vault-dialog').get_attribute('open') is not None and 'Civic optical plans' in page.locator('#vault-dialog').inner_text(),mode+': a tracked hand reaches real survey inventory and protected evidence')
  capture(OUT/(mode+'-inventory.png'));panel('back');xrframes(4);panel('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting')
  check(read()['paused'] and read()['vault']['record'],'Actual XR session exit preserves the reached chapter and pause state')
  page.locator('#resume').click();walk((374,25),(324,25),(320,20),(300,20));use();page.wait_for_selector('#frontier-dialog[open]');page.locator('[data-frontier-action="return"]').click();page.wait_for_function("LeonardoGuild.inspect().frontier.zone==='town'&&LeonardoGuild.inspect().running")
  walk((0,3),(-8,3));use();page.wait_for_selector('#vault-dialog[open]');page.locator('#vault-report').click()
  check(read()['vault']['reported'] and read()['credits']==40,'Reporting to Leonardo grants one reward and completes the civic survey')
  check(read()['render']['road']['readingInstrument'],'The plans create a visible working instrument in the Map House scene')
  page.locator('#vault-close').click();walk((0,3),(0,61),(-10.8,61));page.screenshot(path=str(OUT/'restored-map-house.png'))
  saved=read()['vault'];page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
  check(read()['vault']==saved and read()['credits']==40,'Normal reload preserves both tool locations, shortcut, evidence and the once-only reward')
  page.wait_for_function('LeonardoGuild.inspect().render.road.readingInstrument')
  check(read()['render']['road']['readingInstrument'],'The civic improvement survives a normal reload')
  check(read()['frontier']['defeated']==[] and not read()['completed'],'Survey completion neither requires kills nor overwrites the original campaign')
  check(not errors,'No captured JavaScript errors in the full chapter journey');states['completed']=read();ctx.close()
 except Exception as e:
  failure=str(e)
  try:
   states['failure']=page.evaluate('({url:location.href,guild:window.LeonardoGuild?.inspect(),text:document.body.innerText})');page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:report();browser.close()
