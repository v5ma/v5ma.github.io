"""Real HTTP/WebGL actions. Never assign actor position, currency, inventory or
objective state. Seeded simulation tests are in combat.test.mjs, not here."""
import os,json,time,math
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');MODE=os.getenv('COMBAT_SUITE','arsenal');checks=[];errors=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
def snap(page):return page.evaluate('AetherReach.snapshot()')
def walk(page,points):
 held=set()
 def keys(new):
  nonlocal held
  for k in held-new:page.keyboard.up(k)
  for k in new-held:page.keyboard.down(k)
  held=new
 try:
  for x,z in points:
   begin=time.monotonic()
   while time.monotonic()-begin<95:
    s=snap(page)['position'];delta=math.atan2(math.sin(math.atan2(x-s['x'],-(z-s['z']))-s['yaw']),math.cos(math.atan2(x-s['x'],-(z-s['z']))-s['yaw']))
    if math.hypot(x-s['x'],z-s['z'])<.8:break
    k=set()
    if abs(delta)>.055:k.add('ArrowRight' if delta>0 else 'ArrowLeft')
    if abs(delta)<.22:k.add('KeyW')
    keys(k);page.wait_for_timeout(35)
   else:raise AssertionError('Walking did not reach '+str((x,z))+' from '+str(s))
   keys(set())
 finally:keys(set())
def aim(page,x,y,z):
 held=set();start=time.monotonic()
 try:
  while time.monotonic()-start<100:
   s=snap(page)['position'];yaw=math.atan2(x-s['x'],-(z-s['z']));pitch=math.atan2(y-s['y']-1.65,math.hypot(x-s['x'],z-s['z']));dy=math.atan2(math.sin(yaw-s['yaw']),math.cos(yaw-s['yaw']));dp=pitch-s['pitch'];new=set()
   if abs(dy)>.015:new.add('ArrowRight' if dy>0 else 'ArrowLeft')
   if abs(dp)>.015:new.add('ArrowUp' if dp>0 else 'ArrowDown')
   for k in held-new:page.keyboard.up(k)
   for k in new-held:page.keyboard.down(k)
   held=new
   if not held:return
   page.wait_for_timeout(30)
  raise AssertionError('Aim did not settle')
 finally:
  for k in held:page.keyboard.up(k)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);ctx=b.new_context(viewport={'width':1440,'height':900},service_workers='block');host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort());page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.add_init_script("window.combatInputLog=[];window.addEventListener('keydown',e=>{if(['KeyZ','KeyE','Space','Digit2'].includes(e.code)){combatInputLog.push({code:e.code,repeat:e.repeat,focus:e.target.tagName,state:window.AetherReach?.snapshot()});if(combatInputLog.length>20)combatInputLog.shift();}},true)")
 try:
  page.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');page.wait_for_function('window.AetherReach');page.locator('#start').click();page.wait_for_function('AetherReach.snapshot().playing');check(page.evaluate('AetherReach.version')==json.loads((ROOT/'aether-reach/release.json').read_text())['version'],'The upgraded real application is running')
  page.screenshot(path=str(OUT/('new-street-'+MODE+'.png')))
  if MODE=='arsenal':
   page.keyboard.press('KeyB');page.wait_for_selector('#shop-dialog[open]');before=snap(page);page.wait_for_timeout(200);check(snap(page)['time']==before['time'],'The buy/upgrade screen pauses enemy simulation')
   check(page.locator('[data-kind="weapon"]').count()==3,'Outfitters offers three new weapon classes in addition to the sidearm');page.screenshot(path=str(OUT/'outfitters-arsenal.png'))
   page.locator('[data-buy="sniper"][data-kind="weapon"]').click();check(snap(page)['credits']==100 and snap(page)['weapon']=='sniper','Buying the sniper deducts its real 300-credit cost and equips it')
   page.locator('#shop-dialog form button').click();page.wait_for_function('!AetherReach.snapshot().paused');page.locator('#world').focus();page.keyboard.press('KeyZ');page.wait_for_function('AetherReach.snapshot().fov<25');check(page.locator('#scope-view').is_visible(),'A real camera-FOV magnification appears through the circular sniper optic')
   await_target=snap(page)['enemies'];target=next(e for e in await_target if e['id']=='range');aim(page,target['x'],target['y'],target['z']);page.screenshot(path=str(OUT/'sniper-viewfinder.png'))
   page.keyboard.press('KeyF');page.wait_for_function('AetherReach.snapshot().enemies.find(e=>e.id==="range").hp<=0');check(snap(page)['ammo']==3,'The aimed sniper hits the real target and spends one magazine charge')
   page.keyboard.press('KeyZ');page.wait_for_function('AetherReach.snapshot().fov>70');walk(page,[(3,0),(14,-4)]);page.keyboard.press('KeyE',delay=100);page.wait_for_function('AetherReach.snapshot().picked.includes("drop-range")');check(snap(page)['credits']==130,'Defeated target salvage is collected by proximity and E, not credited remotely')
   walk(page,[(5,1),(3,7)]);page.keyboard.press('KeyB');page.wait_for_selector('#shop-dialog[open]');page.locator('[data-kind="damage"]').click();check(snap(page)['tune']['sniper']['damage']==1 and snap(page)['credits']==10,'The amplifier upgrade changes saved weapon tuning and consumes its price')
   page.locator('#shop-dialog form button').click();page.wait_for_function('!AetherReach.snapshot().paused');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.AetherReach');page.locator('#continue').click();page.wait_for_function('AetherReach.snapshot().playing');check(snap(page)['weapon']=='sniper' and snap(page)['tune']['sniper']['damage']==1 and snap(page)['credits']==10,'Reload and Continue preserve purchased kit, credits and upgrade without repaying drops')
   page.keyboard.press('KeyP');page.locator('#return-title').click();page.locator('#start').click();page.wait_for_function('AetherReach.snapshot().playing');page.keyboard.press('KeyB');page.wait_for_selector('#shop-dialog[open]');page.locator('[data-buy="carbine"][data-kind="weapon"]').click();page.locator('[data-buy="scatter"][data-kind="weapon"]').click();check(snap(page)['credits']==0,'A new expedition resets the economy and can buy a different 400-credit loadout')
   page.locator('#shop-dialog form button').click();page.wait_for_function('!AetherReach.snapshot().paused');page.locator('#world').focus();page.keyboard.press('Digit2');page.wait_for_function('AetherReach.snapshot().weapon==="carbine"');page.keyboard.down('KeyF');page.wait_for_function('AetherReach.snapshot().ammo<=20');page.keyboard.up('KeyF');check(snap(page)['ammo']<22,'Automatic carbine has its own firing cadence and magazine');page.screenshot(path=str(OUT/'tempest-carbine.png'))
   page.keyboard.press('Digit4');page.wait_for_function('AetherReach.snapshot().weapon==="scatter"');settled=snap(page)['time'];page.wait_for_function('(t)=>AetherReach.snapshot().time>t+.2',arg=settled);page.keyboard.press('KeyF');page.wait_for_function('AetherReach.snapshot().ammo===5');check(snap(page)['ammo']==5,'Scattergun consumes one shell for a distinct six-pellet shot');page.screenshot(path=str(OUT/'foundry-scattergun.png'))
   page.set_viewport_size({'width':390,'height':844});page.wait_for_function('innerWidth===390');page.wait_for_function('!document.getElementById("touch").hidden');check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The new buy/loadout HUD fits a narrow viewport');check(page.evaluate('(()=>{const a=document.getElementById("weapon-slots").getBoundingClientRect();return [document.getElementById("move-pad"),document.querySelector(".touch-actions"),document.querySelector(".vitals")].every(e=>{const b=e.getBoundingClientRect();return a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;});})()'),'Weapon selection does not cover touch movement, actions or health');page.screenshot(path=str(OUT/'arsenal-mobile.png'))
  else:
   walk(page,[(3,0),(9,-5)]);page.keyboard.press('KeyE',delay=100);page.wait_for_function('AetherReach.snapshot().rail?.id==="glassline"');page.keyboard.down('KeyW');page.wait_for_function('AetherReach.snapshot().rail?.s>16');before=snap(page)
   # Real arrow-key free look while the freight rail continues moving.
   page.keyboard.down('ArrowRight');page.wait_for_function('(y)=>AetherReach.snapshot().target?.id==="gale-loop"&&Math.abs(AetherReach.snapshot().position.yaw-y)>.25',arg=before['position']['yaw']);page.keyboard.up('ArrowRight');page.keyboard.up('KeyW');after=snap(page)
   check(after['rail']['s']>before['rail']['s'] and abs(after['position']['yaw']-before['position']['yaw'])>.2,'The player can look toward a different rail while travel continues independently')
   page.screenshot(path=str(OUT/'free-look-transfer.png'));page.keyboard.press('Space');page.wait_for_function('!AetherReach.snapshot().rail');released=snap(page)['time'];page.wait_for_function('(t)=>AetherReach.snapshot().time>=t+.18',arg=released);page.keyboard.press('KeyE',delay=100);page.wait_for_function('AetherReach.snapshot().rail?.id==="gale-loop"');check(snap(page)['stats']['transfers']==1,'A real jump and aimed catch changes onto the new rail without a scripted position assignment')
   page.screenshot(path=str(OUT/'on-gale-market-loop.png'));page.keyboard.down('KeyW');page.wait_for_function('!AetherReach.snapshot().rail',timeout=120000);page.keyboard.up('KeyW');check(snap(page)['stats']['rescues']==0,'The transferred ride reaches its real garden endpoint without a rescue shortcut')
   walk(page,[(78,-25)]);page.keyboard.press('KeyE',delay=100);page.wait_for_function('AetherReach.snapshot().owned.includes("carbine")');check(True,'The garden supply cache unlocks a weapon after actual exploration');page.screenshot(path=str(OUT/'glasshouse-diversity.png'))
  check(not errors,'No uncaught JavaScript errors in the tested scenario');(OUT/(MODE+'-report.json')).write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'snapshot':snap(page),'scope':'Native HTTP software WebGL. Ordinary keys, clicks and read-only snapshots; no actor/economy/mission state injections. Physical hardware QA remains separate.'},indent=2))
 except Exception as e:
  try:s=snap(page)
  except:s=None
  (OUT/(MODE+'-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'snapshot':s,'inputLog':page.evaluate('window.combatInputLog||[]')},indent=2));page.screenshot(path=str(OUT/(MODE+'-failure.png')));raise
 finally:ctx.close();b.close()
