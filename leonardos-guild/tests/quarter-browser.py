"""Fresh authored opening: standard Xbox inputs only, ordinary native WebGL.
No live actor, quest, currency, clock, focus or source mutations.
"""
from pathlib import Path
import json,os,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];ROUTE=os.environ.get('QUARTER_ROUTE','upper');RELAY=os.environ.get('QUARTER_RELAY')=='1';OUT=ROOT/('quarter-'+('relay' if RELAY else ROUTE)+'-output');OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];captures={}
paths=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {QUARTER_ROUTES} from './quarter-data.mjs';console.log(JSON.stringify(QUARTER_ROUTES));"],cwd=ROOT,text=True))
def read():return page.evaluate('LeonardoGuild.inspect()')
def check(v,text):
 assert v,text
 checks.append(text);print('PASS:',text,flush=True)
def frames(n=4):page.evaluate('(n)=>new Promise(resolve=>{let i=0;function f(){if(++i>=n)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);})',n)
def press(button):
 # Ordinary actions wait for the real Gamepad poll to observe press/release.
 # LB alone retains a short tap so this test does not turn a tap into a hold.
 if button==4:
  page.evaluate('(button)=>new Promise(resolve=>{const p=__testPad,set=v=>p.buttons=Array.from({length:17},(_,i)=>({pressed:i===v,value:i===v?1:0}));set(button);requestAnimationFrame(()=>{set(-1);requestAnimationFrame(()=>requestAnimationFrame(resolve));});})',button)
 else:
  page.evaluate('(b)=>__testPad.buttons=Array.from({length:17},(_,i)=>({pressed:i===b,value:i===b?1:0}))',button)
  page.wait_for_function('(b)=>LeonardoGuild.inspect().controller.buttons[b]',arg=button)
  page.evaluate('__testPad.buttons=Array.from({length:17},()=>({pressed:false,value:0}))')
  page.wait_for_function('(b)=>!LeonardoGuild.inspect().controller.buttons[b]',arg=button)
 frames(3)
def choose(selector):
 for _ in range(45):
  if page.evaluate('(selector)=>document.activeElement===document.querySelector(selector)',selector):press(0);return
  press(13)
 raise AssertionError('Controller cannot reach '+selector+' from '+str(read()['controller']))
def act(action):
 press(2);page.wait_for_selector('#quarter-dialog[open]');choose('[data-quarter-action="'+action+'"]');frames(3)
 feedback=page.locator('#quarter-feedback').inner_text() if page.locator('#quarter-dialog').get_attribute('open') is not None else ''
 print('INTERACTION:',action,feedback,flush=True)
 if page.locator('#quarter-dialog').get_attribute('open') is not None:press(1)
 page.wait_for_function('LeonardoGuild.inspect().running');frames(5)
def drive(x,z):
 page.evaluate('''({x,z})=>new Promise((resolve,reject)=>{const start=performance.now();let settle=0;function next(){const s=LeonardoGuild.inspect(),d=Math.hypot(x-s.x,z-s.z);if(!s.running){__testPad.axes=[0,0,0,0];reject(Error('Unexpected modal during travel'));return;}if(d<.25||settle){__testPad.axes=[0,0,0,0];if(++settle>20&&Math.abs(s.speed)<.02){resolve();return;}}else{const a=Math.atan2(x-s.x,z-s.z)-s.render.heading,amount=Math.min(.75,Math.max(.30,d*.7));__testPad.axes=[-Math.sin(a)*amount,-Math.cos(a)*amount,0,0];}if(performance.now()-start>85000){__testPad.axes=[0,0,0,0];reject(Error('Travel blocked '+JSON.stringify({x,z,actualX:s.x,actualZ:s.z,y:s.quarter.groundY,near:s.quarterUI.nearby})));return;}requestAnimationFrame(next);}next();})''',{'x':x,'z':z})
def capture(name):captures[name]=read();page.screenshot(path=str(OUT/(name+'.png')))
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);context=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
 context.add_init_script("window.__testPad={id:'Xbox 360 Controller (STANDARD GAMEPAD)',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__testPad]});")
 if RELAY:context.add_init_script(path=str(ROOT/'tests/xr-hardware-mock.js'))
 page=context.new_page();page.set_default_timeout(100000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(6)
  check(read()['quarter']['active'] and read()['version']==json.loads((ROOT/'release.json').read_text())['version'],'Fresh actual game starts in Waterwheel Quarter, not the prototype rows')
  press(0);page.wait_for_function('LeonardoGuild.inspect().running');frames(12);capture('arrival');original=read()
  check(read()['render']['quarter']['cameraSafety']['valid'] and read()['render']['quarter']['cameraSafety']['obstacle']=='workshop-back','The actual arrival camera is on the apprentice side of the workshop wall')
  check(read()['render']['quarter']['physicalScene'] and read()['render']['quarter']['floorCount']==24,'Actual renderer uses the authored metric floors')
  press(9);page.wait_for_selector('#pause-dialog[open]');choose('#menu-return');page.wait_for_function('!LeonardoGuild.inspect().running');press(0);page.wait_for_function('LeonardoGuild.inspect().running');frames(8)
  act('brief');check(read()['quarter']['briefed'],'Xbox X opens the real workshop brief and B returns')
  before=read();press(8);page.wait_for_selector('#map-dialog[open]')
  for _ in range(3):press(5)
  check(read()['quarterUI']['layer']=='upper','Xbox bumpers switch the actual map to the upper work floors')
  check(read()['x']==before['x'] and read()['z']==before['z'] and not read()['quarter']['observations'],'Inspecting other map floors cannot move the player or invent observations')
  check(page.locator('#city-map').evaluate('c=>[c.width,c.height]')==[900,600],'Quarter map uses a readable landscape surface instead of shrinking a square plan')
  capture('upper-floor-map');press(1);page.wait_for_function('LeonardoGuild.inspect().running')
  press(13);page.wait_for_selector('#quarter-dialog[open]');check(read()['quarterUI']['notebookOpen'],'The retained direct Xbox notebook shortcut opens the Quarter observations');press(1)
  # Bound software-GPU latency only for the 220 ms tap fixture. The map,
  # route and art evidence retain their original 1280 by 800 viewport.
  page.set_viewport_size({'width':640,'height':400});frames(12)
  press(4);check(read()['resonance']['tool']=='sling','Tap LB retains direct tool selection in the new opening');press(4)
  page.set_viewport_size({'width':1280,'height':800});frames(8)
  for i,(x,z) in enumerate(paths[ROUTE]):
   drive(x,z)
   note='precision' if ROUTE=='social' and x==17.5 else 'dye' if ROUTE=='upper' and x==-23.2 else 'cellar' if ROUTE=='hydraulic' and x==1 and z==14.1 else None
   if note:
    act('read');check(note in read()['quarter']['observations'],'Inspecting '+note+' records its own route-specific clue without granting a reward')
    press(13);page.wait_for_selector('#quarter-dialog[open]');check(page.locator('[data-observation="'+note+'"]').count()==1,'The notebook shows the actual observation once');capture('learned-observation');press(1)
   if ROUTE=='social' and x==17.5:
    act('ratio-1');check(not read()['quarter']['goodsAccess'] and read()['credits']==0,'A mistaken drive ratio is recoverable and costs nothing');act('ratio-2');check(read()['quarter']['goodsAccess'],'The actual cooperative repair opens the physical goods stairs')
   if ROUTE=='hydraulic' and x==1.7:
    capture('filled-channel');act('drain');page.wait_for_function('LeonardoGuild.inspect().quarter.waterY < -2.32');capture('drained-channel');check(read()['quarter']['low'],'Sluices visibly drain the real channel over simulation time')
   if i==len(paths[ROUTE])//2:capture('approach-'+ROUTE)
  capture('gallery');check(read()['quarter']['groundY']>3.1,'The chosen approach reaches the real raised gallery')
  act('recover');check(read()['quarter']['parcel'] and read()['credits']==0,'Physical parcel recovery succeeds without a preferred-route trigger or premature reward')
  for x,z in paths['return']:
   drive(x,z)
   if z==-2.35:act('unlatch');capture('recognition-shortcut');check(read()['quarter']['archOpen'],'The latch opens the recognizable workshop arch from its far side')
  act('report');check(read()['credits']==60 and read()['life']['xp']==120,'Returning physically pays exactly once')
  press(13);page.wait_for_selector('#quarter-dialog[open]')
  check(page.locator('#quarter-observations').evaluate('e=>getComputedStyle(e).overflowY=="auto"&&e.scrollHeight>e.clientHeight'),'The accumulated notebook has a real bounded scroll region')
  page.evaluate('__testPad.axes=[0,0,0,1]');frames(18);page.evaluate('__testPad.axes=[0,0,0,0]');frames(3)
  check(page.locator('#quarter-observations').evaluate('e=>e.scrollTop>0'),'Xbox right stick scrolls the accumulated observations without a mouse')
  capture('notebook-scroll');press(1);page.wait_for_function('LeonardoGuild.inspect().running')
  check(read()['mission']==original['mission'] and read()['deliveries']==original['deliveries'] and read()['relay']==original['relay'],'The new case does not skip or alter the old campaign')
  check(read()['vehicles']==original['vehicles'],'Older parked vehicles are retained')
  if ROUTE=='upper':
   act('delivery-start')
   for x,z in paths['social'][1:5]:drive(x,z)
   act('collect-spindle')
   for x,z in [[12,-7],[6,-7],[-8,-7],[-16,-7],[-16,0],[-10,0],[-10,9],[-10,14],[-13,16],[-13,21],[-20,21],[-20,15],[-20,9.5],[-23.4,9.5]]:drive(x,z)
   act('deliver-spindle');check(read()['credits']==75 and read()['life']['xp']==160,'Follow-up delivery uses the opened shortcut and pays its distinct one-time reward');capture('finishing-loft')
  if RELAY:
   act('delivery-start');drive(-16,-11);drive(-16,-6);act('call-porter')
   check(read()['quarter']['porterOrder']=='requested' and read()['quarter']['delivery']==1,'The in-person bell requests useful cooperation without collecting or paying for a spindle')
   press(9);page.wait_for_selector('#pause-dialog[open]');frozen=read()['quarter']['porter'];frames(15)
   check(read()['quarter']['porter']==frozen,'Pause freezes the actual porter and his goods, not only the player');press(1)
   # Read-only frame observations measure the actual autonomous walk. No fixture
   # sets positions, flags, clock, item custody or completion.
   trace=page.evaluate("""()=>new Promise((resolve,reject)=>{const samples=[],start=performance.now();function observe(){const s=LeonardoGuild.inspect(),p=s.quarter.porter;samples.push({time:s.time,x:p.x,y:p.y,z:p.z,node:p.node,carrying:p.carrying,phase:p.phase});if(s.quarter.porterOrder==='ready'){resolve(samples);return;}if(performance.now()-start>90000){reject(Error('Porter failed to reach bell: '+JSON.stringify(p)));return;}requestAnimationFrame(observe);}observe();})""")
   (OUT/'porter-trace.json').write_text(json.dumps(trace,indent=2))
   seen={p['node'] for p in trace};check({0,7,10,15}.issubset(seen),'Neri visibly follows bench, loading stairs, gallery and workshop descent instead of teleporting')
   check(read()['quarter']['delivery']==1 and read()['credits']==60,'Porter arrival does not auto-complete the personal delivery or award money')
   check(read()['render']['quarter']['spindleLocation']=='neri','The actual rendered spindle moves from the workbench into Neri\'s custody')
   capture('neri-ready-at-bell');before=read()['quarter']['porter'];frames(40)
   check(read()['quarter']['porter']['x']==before['x'] and read()['quarter']['porterOrder']=='ready','An arrived delivery remains available without a missed-opportunity deadline')
   page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5);press(0);page.wait_for_function('LeonardoGuild.inspect().running')
   check(read()['quarter']['porterOrder']=='ready' and read()['quarter']['delivery']==1,'A real reload preserves the ready handoff without granting the item to the player')
   drive(-16,-11);drive(-16,-6);act('cancel-porter')
   check(read()['quarter']['porterOrder']=='returning','Changing a plan sends the same carried spindle back by a physical route')
   page.wait_for_function("LeonardoGuild.inspect().quarter.porterOrder===''")
   check(read()['quarter']['delivery']==1 and not read()['quarter']['porter']['carrying'],'Cancellation restores bench availability without duplicate inventory')
   act('call-porter');page.wait_for_function("LeonardoGuild.inspect().quarter.porterOrder==='ready'")
   # XR entry is a trusted UI click; all in-headset work uses a hand ray/pinch.
   import importlib.util
   spec=importlib.util.spec_from_file_location('porter_xr',ROOT/'tests/porter-xr-pointer.py');helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
   press(9);page.wait_for_selector('#pause-dialog[open]');page.locator('#guild-xr-pause').click();page.wait_for_function('LeonardoGuild.inspect().xr.presenting')
   page.evaluate('__xr.replace(1,true)');xrframes,panel,xrdom,xrcapture=helper.hand_ui(page);xrframes(6);xrdom('#resume')
   check(read()['xr']['mode']=='diorama-vr' and read()['xr']['spatial']['renderedEyes']==2,'The earned porter rendezvous exists in the same actual stereo miniature')
   panel('interact');xrdom('[data-quarter-action="take-spindle"]');panel('back');xrframes(6)
   check(read()['quarter']['delivery']==2 and read()['xr']['handCount']==1,'Tracked hand pinch performs the actual in-person spindle handoff in XR')
   xrcapture(OUT/'relay-handoff-stereo.png');panel('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');press(1);page.wait_for_function('LeonardoGuild.inspect().running');frames(6)
   check(read()['quarter']['delivery']==2 and not read()['quarter']['porterOrder'] and read()['render']['quarter']['spindleLocation']=='apprentice','The shared nearby handoff transfers one spindle; observation alone did not')
   for x,z in [[-16,0],[-10,0],[-10,9],[-10,14],[-13,16],[-13,21],[-20,21],[-20,15],[-20,9.5],[-23.4,9.5]]:drive(x,z)
   act('deliver-spindle');check(read()['credits']==75 and read()['life']['xp']==160,'The cooperative route still requires personal loft delivery and pays the unchanged reward once')
   check(read()['render']['quarter']['spindleLocation']=='loft','The finishing table retains a visible result of the delivery');capture('relay-finishing-table')
   check(read()['vehicles']==original['vehicles'],'The complete cooperative loop leaves parked vehicles untouched')
  expected=read();raw=json.loads(page.evaluate("localStorage.getItem('svgn.leonardos-guild.v1')"));check(raw['version']==2,'The original save namespace and outer version remain intact')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5);press(0);page.wait_for_function('LeonardoGuild.inspect().running');actual=read()
  check(actual['quarter']['archOpen'] and actual['quarter']['reported'] and actual['credits']==expected['credits'] and actual['quarter']['delivery']==expected['quarter']['delivery'],'Actual reload preserves the shortcut, both cases and earned rewards')
  check(actual['quarter']['observations']==expected['quarter']['observations'] and len(actual['quarter']['observations'])>0,'Actual reload retains optional learned observations in the original save')
  check(abs(actual['x']+20)<.1 and abs(actual['z']+13)<.1,'Resumed Quarter saves arrive safely at the workshop rather than on a removed floor')
  capture('resumed');drive(-24,-14);act('leave');check(not read()['quarter']['active'] and read()['credits']==expected['credits'],'The older town remains accessible with the same earned progression')
  check(page.locator('#city-map').evaluate('c=>[c.width,c.height]')==[900,900] and 'Mailboxes' in page.locator('.map-legend').inner_text(),'Departure restores the original legacy map dimensions and legend')
  check(read()['audio']['preferences']['density']=='quiet' and read()['audio']['musicVoices']<=1,'Quiet audio and the single-score-stream policy remain intact')
  check(not errors,'No captured native JavaScript or shader compilation errors')
 finally:
  try:
   (OUT/'last-state.json').write_text(json.dumps(read(),indent=2));page.screenshot(path=str(OUT/'final.png'))
  except:pass
  (OUT/'report.json').write_text(json.dumps({'route':'relay' if RELAY else ROUTE,'checks':checks,'errors':errors,'captures':captures,'input':'Fresh save; standard virtual Xbox input only. No actor, quest, money, clock or focus mutation. Native WebGL, not physical Xbox/Quest.'},indent=2));browser.close()
