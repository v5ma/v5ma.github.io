"""Native HTTP/WebGL tactical acceptance. Only keyboard and UI clicks mutate
play. Snapshot/aim observations never assign player, target or mission state.
"""
from pathlib import Path
from urllib.parse import urlparse
import os,json,math,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'aether-reach/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');MODE=os.getenv('TACTIC_SUITE','tools');checks=[];errors=[]
def check(v,text):
 assert v,text
 checks.append(text);print('PASS',text,flush=True)
def snap(p):return p.evaluate('AetherReach.snapshot()')
def use(p):
 p.locator('#world').focus();p.keyboard.press('KeyE',delay=80);p.wait_for_timeout(100)
def close_field(p):
 p.locator('#field-close').click()
 p.wait_for_function('!AetherReach.snapshot().paused&&!document.querySelector("dialog[open]")')
 p.locator('#world').focus()
 # Wait for the close event and resumed input frame, not an assumed millisecond delay.
 old=snap(p)['time'];p.wait_for_function('(t)=>AetherReach.snapshot().time>t',arg=old)
def walk(p,targets):
 held=set()
 def keys(new):
  nonlocal held
  for k in held-new:p.keyboard.up(k)
  for k in new-held:p.keyboard.down(k)
  held=new
 try:
  for x,z in targets:
   start=time.monotonic()
   while time.monotonic()-start<100:
    s=snap(p);pos=s['position'];d=math.hypot(x-pos['x'],z-pos['z'])
    if d<.65:break
    want=math.atan2(x-pos['x'],-(z-pos['z']));delta=math.atan2(math.sin(want-pos['yaw']),math.cos(want-pos['yaw']))
    new=set()
    if abs(delta)>.055:new.add('ArrowRight' if delta>0 else 'ArrowLeft')
    if abs(delta)<.25:new.add('KeyW')
    keys(new);p.wait_for_timeout(30)
   else:raise AssertionError('Could not walk to '+str((x,z))+' '+json.dumps(s))
   keys(set())
 finally:keys(set())
def aim(p,target,timeout=20):
 held=set();start=time.monotonic()
 try:
  while time.monotonic()-start<timeout:
   state=snap(p);pos=state['position'];q=next((b for b in state['enemies'] if b['id']==target and b['hp']>0),None) if isinstance(target,str) else {'x':target[0],'y':target[1],'z':target[2]}
   if not q:return False
   yaw=math.atan2(q['x']-pos['x'],-(q['z']-pos['z']));dy=math.atan2(math.sin(yaw-pos['yaw']),math.cos(yaw-pos['yaw']));pitch=math.atan2(q['y']-pos['y']-1.6,math.hypot(q['x']-pos['x'],q['z']-pos['z']));dp=pitch-pos['pitch']
   if abs(dy)<.07 and abs(dp)<.05:return True
   new=set()
   if abs(dy)>.055:new.add('ArrowRight' if dy>0 else 'ArrowLeft')
   if abs(dp)>.04:new.add('ArrowUp' if dp>0 else 'ArrowDown')
   for k in held-new:p.keyboard.up(k)
   for k in new-held:p.keyboard.down(k)
   held=new;p.wait_for_timeout(30)
  raise AssertionError('Aim did not settle '+str(target))
 finally:
  for k in held:p.keyboard.up(k)
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**args);ctx=b.new_context(viewport={'width':1280,'height':850},service_workers='block');host=urlparse(BASE).hostname
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort());p=ctx.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:errors.append(str(e)))
 p.add_init_script("window.tacticalKeyLog=[];window.addEventListener('keydown',e=>{if(['KeyQ','KeyF','KeyE'].includes(e.code)){tacticalKeyLog.push({code:e.code,repeat:e.repeat,focus:e.target.tagName,paused:window.AetherReach?.snapshot().paused});if(tacticalKeyLog.length>20)tacticalKeyLog.shift();}},true);")
 try:
  p.goto(BASE+'/aether-reach/index.html',wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach');p.locator('#start').click();p.wait_for_function('AetherReach.snapshot().playing')
  check(not snap(p)['tactics']['learned'],'The loan rig is acquired in the world, not silently awarded at spawn')
  walk(p,[(3,4),(7,4)]);use(p);p.wait_for_selector('#field-dialog[open]');check(snap(p)['tactics']['learned'],'Physical Quay bench interaction equips the field rig')
  p.locator('#power-current').click();close_field(p);walk(p,[(10,4),(17,2)]);aim(p,'range');p.keyboard.press('KeyJ',delay=70);p.wait_for_function('AetherReach.snapshot().tactics.research.includes("target")');check(True,'The survey lens records an actual living range machine')
  p.keyboard.press('KeyN');p.locator('#module-capacitor').click();close_field(p);check(snap(p)['tactics']['module']=='capacitor','Research unlocks a passive that can be selected through the real field UI')
  before=snap(p);p.keyboard.press('KeyQ',delay=100);p.wait_for_function('AetherReach.snapshot().tactics.metrics.casts>0');p.keyboard.press('KeyF',delay=100);p.wait_for_function('AetherReach.snapshot().tactics.metrics.combos>0');after=snap(p)
  check(after['ammo']<before['ammo'] and after['energy']<before['energy'],'Gun and power are both usable without switching the weapon away')
  check(after['tactics']['hazards']['quay-water']>0,'Electricity activates the actual water surface')
  p.screenshot(path=str(OUT/'current-and-gun.png'))
  p.keyboard.press('KeyN');p.wait_for_selector('#field-dialog[open]');t=snap(p)['time'];p.wait_for_timeout(250);check(snap(p)['time']==t,'Loadout planning pauses combat and hazard time');close_field(p)
  walk(p,[(3,0),(0,-14),(0,-33),(5,-37),(7,-44)]);use(p);p.wait_for_selector('#field-circuit')
  p.locator('#field-energize').click();check(not snap(p)['tactics']['hacked'],'An unconnected circuit does not grant a friendly turret')
  for cell,n in [(0,1),(1,1),(2,2),(3,3),(5,3)]:
   for _ in range(n):p.locator('#circuit-'+str(cell)).click()
  p.screenshot(path=str(OUT/'security-routing.png'));p.locator('#field-energize').click();p.wait_for_function('AetherReach.snapshot().tactics.hacked');check(True,'Solving the visible conductor network changes the real security faction')
  p.locator('#module-engineer').click();p.locator('#power-cinder').click();close_field(p)
  check(snap(p)['tactics']['module']=='engineer','The hacked security unlocks the Engineer passive')
  if MODE=='tools':
   walk(p,[(4,-45)]);aim(p,(-5,3.06,-49));p.keyboard.press('KeyQ',delay=60);p.wait_for_function('AetherReach.snapshot().tactics.hazards["atrium-oil"]>0');check(True,'Cinder ignites a persistent oil trap at its real surface location');p.screenshot(path=str(OUT/'cinder-oil-trap.png'))
   saved=snap(p);p.reload(wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach');p.locator('#continue').click();p.wait_for_function('AetherReach.snapshot().playing');r=snap(p)
   check(r['tactics']['hacked'] and r['tactics']['research']==saved['tactics']['research'] and r['tactics']['module']=='engineer','Reload preserves learned powers, the hacked turret, research and equipped module')
   check(r['tactics']['hazards']['atrium-oil']==0 and r['tactics']['encounter']['phase']=='idle','Reload does not resurrect an active hazard or fabricate a defense success')
   p.set_viewport_size({'width':390,'height':844});p.wait_for_function('!document.getElementById("touch").hidden');p.locator('#field-open').click();p.wait_for_selector('#field-dialog[open]');p.screenshot(path=str(OUT/'tactical-mobile.png'));check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'Field loadout and puzzle controls fit the phone-width interface');close_field(p);p.locator('#field-cycle').click();check(snap(p)['tactics']['power']=='pulse','Touch-sized power cycling calls the real model action')
  else:
   # Defender navigates and aims through ordinary keyboard actions. The model
   # receives no special HP, damage, elapsed-time or mission-state assignments.
   walk(p,[(5,-48.7)]);use(p);p.wait_for_selector('#field-start');before=snap(p)['credits'];p.locator('#field-start').click();p.wait_for_function('AetherReach.snapshot().tactics.encounter.phase==="active"');p.locator('#world').focus();check(True,'The collector starts an opt-in three-wave defense through proximity and its UI')
   start=time.monotonic();surveyed=False
   while time.monotonic()-start<450:
    s=snap(p)
    if s['tactics']['encounter']['phase']!='active':break
    enemies=[x for x in s['enemies'] if x['id'].startswith('trial-') and x['hp']>0]
    if enemies:
     target=min(enemies,key=lambda x:math.hypot(x['x']-s['position']['x'],x['z']-s['position']['z']))
     if aim(p,target['id'],timeout=12):
      if not surveyed:p.keyboard.press('KeyJ');surveyed=True
      if s['energy']>=32:p.keyboard.press('KeyQ')
      if s['ammo']>0:p.keyboard.down('KeyF');p.wait_for_timeout(280);p.keyboard.up('KeyF')
      else:p.keyboard.press('KeyR')
    else:p.wait_for_timeout(100)
   end=snap(p);check(end['tactics']['encounter']['phase']=='complete','All three actual waves are cleared while the collector survives')
   check(end['tactics']['metrics']['turretHits']>0 and end['tactics']['encounter']['kills']==6,'The hacked turret contributes real hits, and six defense enemies are defeated')
   check(end['credits']==before+180,'Only the first successful recovery grants its 180-credit reward')
   check(end['stats']['rescues']==0,'The defense is completed without a rescue or hidden position shortcut');p.screenshot(path=str(OUT/'recovery-complete.png'))
   p.reload(wait_until='domcontentloaded');p.wait_for_function('!!window.AetherReach');p.locator('#continue').click();p.wait_for_function('AetherReach.snapshot().playing');r=snap(p)
   check(r['tactics']['completed'] and r['credits']==end['credits'],'The completed recovery reward persists exactly once after reloading')
  check(not errors,'No uncaught JavaScript errors in the tactical scenario')
  (OUT/(MODE+'-tactics-report.json')).write_text(json.dumps({'mode':MODE,'passed':len(checks),'checks':checks,'snapshot':snap(p),'errors':errors,'scope':'Native HTTP Chromium software WebGL. Normal keyboard and UI input with read-only observation. Not hardware Xbox or headset performance certification.'},indent=2))
 except Exception as e:
  try:state=snap(p)
  except:state=None
  (OUT/(MODE+'-tactics-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state,'keys':p.evaluate('window.tacticalKeyLog||[]')},indent=2));p.screenshot(path=str(OUT/(MODE+'-tactics-failure.png')));raise
 finally:ctx.close();b.close()
