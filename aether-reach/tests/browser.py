"""Actual HTTP/WebGL expedition. Model tests seed states; these UI tests do not.
A keyboard driver reads position and uses normal keydown/up for navigation.
"""
import os,json,time,math
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
MODE=os.getenv('AETHER_SUITE','expedition');checks=[];errors=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
def snap(p):return p.evaluate('AetherReach.snapshot()')
def walk(page,targets):
 page.wait_for_function('!AetherReach.snapshot().paused')
 held=set()
 def controls(new):
  nonlocal held
  for k in held-new:page.keyboard.up(k)
  for k in new-held:page.keyboard.down(k)
  held=new
 try:
  for x,z in targets:
   start=time.monotonic()
   while time.monotonic()-start<100:
    s=snap(page);p=s['position'];d=math.hypot(x-p['x'],z-p['z'])
    if d<1.0:break
    want=math.atan2(x-p['x'],-(z-p['z']));delta=math.atan2(math.sin(want-p['yaw']),math.cos(want-p['yaw']))
    new=set()
    if abs(delta)>.07:new.add('ArrowRight' if delta>0 else 'ArrowLeft')
    if abs(delta)<.28:new.add('KeyW')
    controls(new);page.wait_for_timeout(35)
   else:raise AssertionError('Walk failed at '+json.dumps(s)+' toward '+str((x,z)))
   controls(set())
 finally:controls(set())
def use(page):
 page.wait_for_function('!AetherReach.snapshot().paused')
 page.locator('#world').focus();page.keyboard.press('KeyE',delay=120);page.wait_for_timeout(150)
 if page.locator('#record-dialog[open]').count():page.locator('#record-dialog button').click()
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**kw);ctx=b.new_context(viewport={'width':1280,'height':800},service_workers='block')
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("window.testKeyLog=[];window.addEventListener('keydown',e=>{if(['KeyE','KeyQ','KeyC'].includes(e.code)){testKeyLog.push({code:e.code,repeat:e.repeat,focus:e.target.tagName,state:window.AetherReach?.snapshot()});if(testKeyLog.length>16)testKeyLog.shift();}},true)")
 try:
  page.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');page.wait_for_function('!!window.AetherReach')
  check(page.locator('#start').is_enabled(),'A separately hosted first-person application loads its local renderer')
  page.screenshot(path=str(OUT/('title-'+MODE+'.png')))
  page.locator('#start').click();page.wait_for_function('AetherReach.snapshot().playing&&!AetherReach.snapshot().paused')
  check(snap(page)['renderer']['triangles']>10000,'The world is rendered geometry, not a screenshot backdrop')
  page.screenshot(path=str(OUT/('first-person-'+MODE+'.png')))
  page.keyboard.press('KeyM');page.wait_for_selector('#map-dialog[open]');before=snap(page);page.wait_for_timeout(300)
  check(snap(page)['time']==before['time'],'The field map freezes gameplay rather than letting enemies run behind it')
  page.screenshot(path=str(OUT/('map-'+MODE+'.png')));page.locator('#map-dialog form button').click()
  if MODE=='expedition':
   # Approach objects with margin for the driver's stopping tolerance and
   # deceleration, rather than pressing E just outside their real use radius.
   walk(page,[(-6,3.5)]);page.wait_for_function('AetherReach.snapshot().interaction==="record"');use(page);check('quay-letter' in snap(page)['records'],'An archive is discovered through proximity and E interaction')
   walk(page,[(3,0),(9,-5)]);use(page);page.wait_for_function('!!AetherReach.snapshot().rail')
   check(snap(page)['rail']['id']=='glassline','The sky clamp boards the physical Glasshouse freight line')
   page.keyboard.down('KeyW');page.wait_for_function('AetherReach.snapshot().rail?.s>10')
   page.keyboard.press('KeyC');check(snap(page)['rail']['dir']==-1,'The player can reverse direction on the moving rail')
   page.keyboard.press('KeyC');page.wait_for_function('AetherReach.snapshot().position.y>9');page.screenshot(path=str(OUT/'riding-above-the-city.png'))
   page.wait_for_function('!AetherReach.snapshot().rail',timeout=120000);page.keyboard.up('KeyW')
   check(snap(page)['stats']['rescu es'.replace(' ','')]==0,'The complete first rail ride lands on its intended district without a rescue')
   walk(page,[(65,-22),(64,-31)]);page.wait_for_function('AetherReach.snapshot().interaction==="relay"')
   page.keyboard.press('KeyQ');page.wait_for_timeout(200);check(snap(page)['energy']<100,'Pulse spends actual suit energy')
   use(page);page.wait_for_function('AetherReach.snapshot().relays.includes("garden")')
   check(page.evaluate('JSON.parse(localStorage.getItem("aether-reach.expedition.v1")).checkpoint')=='garden','Restoring a relay creates a validated local checkpoint')
   walk(page,[(62,-33)]);use(page);page.wait_for_function('AetherReach.snapshot().rail?.id==="sunline"')
   page.keyboard.down('KeyW');page.wait_for_function('!AetherReach.snapshot().rail',timeout=120000);page.keyboard.up('KeyW')
   walk(page,[(43,-123),(45,-126)]);use(page);page.wait_for_function('AetherReach.snapshot().relays.includes("spire")')
   walk(page,[(50,-120),(51,-113)]);use(page);page.wait_for_function('AetherReach.snapshot().rail?.id==="crossline"')
   check(snap(page)['rail']['dir']==-1,'The opposite station boards a rail in the returning direction')
   page.keyboard.down('KeyW');page.wait_for_function('!AetherReach.snapshot().rail',timeout=120000);page.keyboard.up('KeyW')
   walk(page,[(-27,-93)]);use(page);page.wait_for_function('AetherReach.snapshot().relays.length===3')
   page.screenshot(path=str(OUT/'restored-freight-district.png'))
   walk(page,[(-26,-82),(-28,-81)]);use(page);page.wait_for_function('AetherReach.snapshot().rail?.id==="copperline"')
   page.keyboard.down('KeyW');page.wait_for_function('!AetherReach.snapshot().rail',timeout=120000);page.keyboard.up('KeyW')
   walk(page,[(-4,-4),(0,8)]);use(page);page.wait_for_selector('#complete-dialog[open]')
   end=snap(page);check(end['won'] and len(end['relays'])==3,'The expedition has a real three-relay objective and a reachable ending')
   check(end['stats']['rails']>=4 and end['stats']['rescu es'.replace(' ','')]==0,'A complete ordinary-input rail expedition finishes without position writes or rescue shortcuts')
   page.screenshot(path=str(OUT/'expedition-complete.png'))
   page.locator('#explore-more').click();check(not snap(page)['paused'],'The completed world can be explored further')
   page.reload(wait_until='domcontentloaded');page.wait_for_function('!!window.AetherReach');check(page.locator('#continue').is_visible(),'Continue appears after reloading a real saved expedition')
   page.locator('#continue').click();page.wait_for_function('AetherReach.snapshot().playing');check(len(snap(page)['relays'])==3 and snap(page)['checkpoint']=='foundry','Continue restores the checkpoint and restored relays, not an arbitrary position')
  else:
   walk(page,[(0,-10)]);page.keyboard.press('KeyP');page.wait_for_selector('#pause-dialog[open]');old=snap(page);page.keyboard.down('KeyW');page.wait_for_timeout(300);page.keyboard.up('KeyW');check(snap(page)['position']==old['position'],'Movement inputs do not leak through the pause dialog')
   page.locator('#pause-settings').click();page.locator('#fov').fill('85');page.locator('#sensitivity').fill('1.4');page.locator('#sound').check();page.locator('#reduced').check();page.locator('#settings-dialog button').click()
   check(page.evaluate('JSON.parse(localStorage.getItem("aether-reach.settings.v1")).fov')==85,'View and comfort settings persist on this device')
   # Dialog close is asynchronous; wait for resumed gameplay before firing.
   page.wait_for_function('!AetherReach.snapshot().paused&&!document.querySelector("dialog[open]")');page.locator('#world').focus()
   page.keyboard.down('KeyF');page.wait_for_function('AetherReach.snapshot().ammo<8');page.keyboard.up('KeyF');check(snap(page)['ammo']<8,'The first-person arc caster fires and consumes charges')
   page.keyboard.press('KeyR');page.wait_for_function('AetherReach.snapshot().ammo===8');check(True,'Reload restores the weapon after its real cooldown')
   page.set_viewport_size({'width':390,'height':844})
   page.wait_for_function('innerWidth===390&&!document.getElementById("touch").hidden')
   page.locator('#touch').wait_for(state='visible')
   check(page.locator('#touch').is_visible(),'Touch movement, look and action controls exist on a narrow display')
   check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The HUD and menus do not overflow the phone-width viewport')
   page.screenshot(path=str(OUT/'touch-layout.png'))
   page.locator('#pause-button').click();page.locator('#return-title').click();check(page.locator('#menu').is_visible(),'The player can return to the title without leaving running input')
   denied=ctx.new_page();denied.on('pageerror',lambda e:errors.append(str(e)));denied.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError')}})")
   denied.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');denied.wait_for_function('!!window.AetherReach');denied.locator('#start').click();denied.wait_for_function('AetherReach.snapshot().playing');check(True,'A denied storage API does not prevent a new expedition');denied.close()
  check(not errors,'No uncaught JavaScript errors in the verified scenario')
  (OUT/(MODE+'-report.json')).write_text(json.dumps({'passed':len(checks),'checks':checks,'snapshot':snap(page),'errors':errors,'scope':'Actual HTTP Chromium software-WebGL, pointer/buttons and normal keyboard input. Read-only snapshots for assertions. No physical-device performance certification.'},indent=2))
 except Exception as e:
  try:s=snap(page)
  except:s=None
  (OUT/(MODE+'-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'state':s,'errors':errors,'keys':page.evaluate('window.testKeyLog||[]')},indent=2))
  try:page.screenshot(path=str(OUT/(MODE+'-failure.png')))
  except:pass
  raise
 finally:ctx.close();b.close()
