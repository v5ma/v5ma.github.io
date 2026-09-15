"""Fresh authored opening: standard Xbox inputs only, ordinary native WebGL.
No live actor, quest, currency, clock, focus or source mutations.
"""
from pathlib import Path
import json,os,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];ROUTE=os.environ.get('QUARTER_ROUTE','upper');OUT=ROOT/('quarter-'+ROUTE+'-output');OUT.mkdir(exist_ok=True)
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
 page=context.new_page();page.set_default_timeout(100000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(6)
  check(read()['quarter']['active'] and read()['version']=='0.14.0','Fresh actual game starts in Waterwheel Quarter, not the prototype rows')
  press(0);page.wait_for_function('LeonardoGuild.inspect().running');frames(12);capture('arrival');original=read()
  check(read()['render']['quarter']['physicalScene'] and read()['render']['quarter']['floorCount']==24,'Actual renderer uses the authored metric floors')
  act('brief');check(read()['quarter']['briefed'],'Xbox X opens the real workshop brief and B returns')
  press(4);check(read()['resonance']['tool']=='sling','Tap LB retains direct tool selection in the new opening');press(4)
  for i,(x,z) in enumerate(paths[ROUTE]):
   drive(x,z)
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
  check(read()['mission']==original['mission'] and read()['deliveries']==original['deliveries'] and read()['relay']==original['relay'],'The new case does not skip or alter the old campaign')
  check(read()['vehicles']==original['vehicles'],'Older parked vehicles are retained')
  if ROUTE=='upper':
   act('delivery-start')
   for x,z in paths['social'][1:5]:drive(x,z)
   act('collect-spindle')
   for x,z in [[12,-7],[6,-7],[-8,-7],[-16,-7],[-16,0],[-10,0],[-10,9],[-10,14],[-13,16],[-13,21],[-20,21],[-20,15],[-20,9.5],[-23.4,9.5]]:drive(x,z)
   act('deliver-spindle');check(read()['credits']==75 and read()['life']['xp']==160,'Follow-up delivery uses the opened shortcut and pays its distinct one-time reward');capture('finishing-loft')
  expected=read();raw=json.loads(page.evaluate("localStorage.getItem('svgn.leonardos-guild.v1')"));check(raw['version']==2,'The original save namespace and outer version remain intact')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5);press(0);page.wait_for_function('LeonardoGuild.inspect().running');actual=read()
  check(actual['quarter']['archOpen'] and actual['quarter']['reported'] and actual['credits']==expected['credits'] and actual['quarter']['delivery']==expected['quarter']['delivery'],'Actual reload preserves the shortcut, both cases and earned rewards')
  check(abs(actual['x']+20)<.1 and abs(actual['z']+13)<.1,'Resumed Quarter saves arrive safely at the workshop rather than on a removed floor')
  capture('resumed');drive(-24,-14);act('leave');check(not read()['quarter']['active'] and read()['credits']==expected['credits'],'The older town remains accessible with the same earned progression')
  check(read()['audio']['preferences']['density']=='quiet' and read()['audio']['musicVoices']<=1,'Quiet audio and the single-score-stream policy remain intact')
  check(not errors,'No captured native JavaScript or shader compilation errors')
 finally:
  try:
   (OUT/'last-state.json').write_text(json.dumps(read(),indent=2));page.screenshot(path=str(OUT/'final.png'))
  except:pass
  (OUT/'report.json').write_text(json.dumps({'route':ROUTE,'checks':checks,'errors':errors,'captures':captures,'input':'Fresh save; standard virtual Xbox input only. No actor, quest, money, clock or focus mutation. Native WebGL, not physical Xbox/Quest.'},indent=2));browser.close()
