"""Lantern Road integration: actual browser input and rendering. No assignments
of actor positions, quest stages, money, inventory, focus, clock or rewards.
Only a storage failure and optional XR hardware are fixtures, explicitly labeled.
"""
from pathlib import Path
import os,json,math,time,importlib.util
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
OUT=ROOT/('road-public-output' if BASE.startswith('https://') else 'road-source-output');OUT.mkdir(exist_ok=True)
checks=[];errors=[];failure=None

def report():
 (OUT/'report.json').write_text(json.dumps({'base':BASE,'checks':checks,'errors':errors,'failure':failure,'evidence':'Real browser/WebGL. Keyboard and mouse journey plus synthetic hand-menu hardware. Not physical Quest. No live player/progression assignments.'},indent=2))
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True);report()
with sync_playwright() as p:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**args)
 try:
  ctx=browser.new_context(viewport={'width':640,'height':480},service_workers='block')
  ctx.add_init_script("window.__storageFailure=false;const oldSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.__storageFailure&&k==='svgn.leonardos-guild.v1')throw Error('Labelled test storage failure');return oldSet.call(this,k,v);};")
  page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/leonardos-guild/?quality=low&chapter=lantern-road',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
  read=lambda:page.evaluate('LeonardoGuild.inspect()')
  check(not read()['quarter']['active'],'The new story uses full Vinci, not a replacement district')
  page.locator('#road-start').click();page.wait_for_function('LeonardoGuild.inspect().running');page.keyboard.press('f')
  check(read()['mode']=='foot','Ordinary keyboard input dismounts the original bicycle')
  def frames(n=3):
   page.evaluate('(n)=>new Promise(resolve=>{let i=0;function next(){if(++i>=n)resolve();else requestAnimationFrame(next);}requestAnimationFrame(next);})',n)
  held=set()
  def keys(next):
   next=set(next)
   for k in held-next:page.keyboard.up(k)
   for k in next-held:page.keyboard.down(k)
   held.clear();held.update(next)
  def walk(x,z):
   begin=time.monotonic()
   while time.monotonic()-begin<180:
    s=read();assert s['running'],'Walking is unexpectedly paused';dx=x-s['x'];dz=z-s['z'];d=math.hypot(dx,dz)
    if d<1.2:
     keys([]);frames(10);return
    a=(math.atan2(dx,dz)-s['yaw']+math.pi)%(math.pi*2)-math.pi
    keys((['w'] if abs(a)<.6 else [])+(['a' if a>0 else 'd'] if abs(a)>.06 else []));frames(2)
   raise AssertionError('No ordinary walking route to '+str((x,z))+' current '+str((read()['x'],read()['z'])))
  def destination(x,z):
   walk(0,read()['z']);walk(0,z);walk(x,z)
  def open_story():
   page.keyboard.press('g');page.wait_for_selector('#road-dialog[open]')
  def confirm_story(stage):
   open_story();page.locator('#road-step').click();page.wait_for_selector('#road-review[open]')
   check(read()['road']['stage']==stage,'Review alone does not advance stage '+str(stage))
   page.locator('#road-review-confirm').click();page.wait_for_function('(stage)=>LeonardoGuild.inspect().road.stage===stage',arg=stage+1)
   page.locator('#road-close').click();page.wait_for_function('LeonardoGuild.inspect().running')
  destination(-8,3);confirm_story(0)
  check(read()['credits']==20 and read()['road']['items']['parcel']==1,'Accepting the real charter grants its bound parcel and one allowance')
  # Prove cancellation and failed persistence at an actual shop before proceeding.
  destination(10.8,24);page.keyboard.press('g');page.wait_for_selector('#road-dialog[open]');page.locator('#road-tab-shops').click()
  page.locator('#road-buy-herbs').click();page.locator('#road-review-cancel').click()
  check(read()['credits']==20 and read()['road']['items'].get('herbs',0)==0,'Cancelling a reviewed purchase spends nothing')
  page.locator('#road-buy-herbs').click();page.evaluate('__storageFailure=true');page.locator('#road-review-confirm').click()
  check('Not completed' in page.locator('#road-review-status').inner_text() and read()['credits']==20,'A labelled browser storage failure refuses the exchange')
  page.evaluate('__storageFailure=false');page.locator('#road-review-cancel').click()
  for item in ['herbs','herbs','linen']:
   page.locator('#road-buy-'+item).click();page.locator('#road-review-confirm').click();page.wait_for_selector('#road-review',state='hidden')
  page.locator('#road-craft-tonic').click();page.locator('#road-review-confirm').click();page.wait_for_selector('#road-review',state='hidden')
  check(read()['road']['items'].get('tonic')==1 and read()['credits']==10,'Actual merchant purchases and the displayed recipe produce one tonic')
  page.locator('#road-tab-pack').click();page.screenshot(path=str(OUT/'inventory.png'))
  check('Sealed survey parcel' in page.locator('#road-dialog').inner_text(),'Inventory distinguishes the protected quest parcel from consumed trade materials')
  page.locator('#road-close').click();destination(-10.8,61);confirm_story(1);confirm_story(2)
  check(read()['target']['id']=='glass','Identifying the chart updates the live objective marker to the glassworks')
  destination(10.8,98);confirm_story(3);destination(0,-17);confirm_story(4)
  check(read()['render']['road']['lit'],'Installing the actual lens visibly changes the scene lantern')
  page.screenshot(path=str(OUT/'restored-gate.png'))
  destination(-8,3);confirm_story(5)
  check(read()['credits']==40 and read()['road']['stage']==6,'Reporting the repair awards the charter once without overwriting purchased supplies')
  saved=read()['road'];page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
  check(read()['road']['stage']==6 and read()['road']['items']==saved['items'],'Ordinary reload keeps inventory, story custody and completed charter')
  page.locator('#start').click();page.keyboard.press('f');destination(0,-17);open_story();page.locator('#road-depart').click();page.locator('#road-review-confirm').click()
  page.wait_for_url('**/vesperfall/?from=vinci');page.wait_for_selector('#vinci-return')
  check('Vinci' in page.locator('#vinci-arrival').inner_text(),'Departure loads the real Vesperfall page with an explicit return connection')
  # Do not replace an existing expedition or award a win merely for changing pages.
  page.locator('#vinci-return').click();page.wait_for_selector('#dominion-dialog-confirm');page.locator('#dominion-dialog-confirm').click()
  page.wait_for_url('**/leonardos-guild/?journey=return');page.wait_for_function('window.LeonardoGuild')
  check(read()['road']['returned'] and read()['credits']==40 and read()['road']['items']==saved['items'],'Returning from Vesperfall preserves Vinci inventory and grants no fabricated expedition reward')
  page.screenshot(path=str(OUT/'returned-vinci.png'));ctx.close()
  # Separate fresh XR UI smoke. Real DOM/rays/per-eye rendering, hardware only mocked.
  for mode in ['first-person','diorama-vr']:
   xrctx=browser.new_context(viewport={'width':640,'height':480},service_workers='block')
   xrctx.add_init_script(script=(ROOT/'tests/xr-hardware-mock.js').read_text()+'\n'+(ROOT/'tests/xr-compositor-mock.js').read_text())
   page=xrctx.new_page();page.set_default_timeout(65000);page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(BASE+'/leonardos-guild/?quality=low&chapter=lantern-road',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild&&LeonardoGuild.inspect().xr.entry.vr===true')
   page.locator('#xr-launcher [data-xr-entry="'+mode+'"]').click();page.wait_for_function('LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.presenting')
   page.evaluate('__xr.replace(1,true)')
   spec=importlib.util.spec_from_file_location('hands',ROOT/'tests/porter-xr-pointer.py');helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
   frames,panel,dom,capture=helper.hand_ui(page);frames(6);panel('pause');frames(4);dom('#desk-road');frames(4)
   check(page.locator('#road-dialog').get_attribute('open') is not None,mode+': a tracked hand opens the new story on the existing spatial desk')
   dom('#road-tab-pack');frames(4);check('Your inventory' in page.locator('#road-dialog').inner_text(),mode+': hand selection reaches the real inventory page')
   capture(OUT/(mode+'-inventory.png'));panel('back');frames(4)
   check(page.locator('#pause-dialog').get_attribute('open') is not None,mode+': Back retains the pause parent')
   panel('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');xrctx.close()
  check(not errors,'No captured JavaScript errors in the exercised journey')
 except Exception as e:
  failure=str(e)
  try:
   (OUT/'failure-state.json').write_text(json.dumps(page.evaluate('({url:location.href,guild:window.LeonardoGuild?.inspect(),text:document.body.innerText})'),indent=2));page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:report();browser.close()
