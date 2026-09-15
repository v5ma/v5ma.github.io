"""Fresh native controller-only quick actions, rendered contacts and real reload.
Only the standard Xbox hardware fixture is injected; no actor/progression writes.
A 640x400 viewport bounds software-renderer latency for the 220 ms tap test;
The timing-sensitive tap sequence follows actual legacy walking into the lighter
Quarter scene. Large-viewport legacy art and camera journeys remain separate.
"""
from pathlib import Path
import os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'grounded-output';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];captures={};last_axes=[0,0,0,0]
def check(v,text):
 assert v,text
 checks.append(text);print('PASS:',text,flush=True)
def read():return page.evaluate('LeonardoGuild.inspect()')
def inputs(buttons=None,axes=None):
 global last_axes
 if axes is not None:last_axes=axes
 page.evaluate('(v)=>{window.__testPad.axes=v.axes;window.__testPad.buttons=Array.from({length:17},(_,i)=>({pressed:v.buttons.includes(i),touched:v.buttons.includes(i),value:v.buttons.includes(i)?1:0}));}',{'axes':last_axes,'buttons':buttons or []})
def frames(n=2):page.evaluate('(n)=>new Promise(resolve=>{let i=0;function next(){if(++i>=n)resolve();else requestAnimationFrame(next);}requestAnimationFrame(next);})',n)
def press(button):
 if button==4:
  page.evaluate('(button)=>new Promise(resolve=>{const p=window.__testPad;const buttons=v=>Array.from({length:17},(_,i)=>({pressed:i===v,touched:i===v,value:i===v?1:0}));p.buttons=buttons(button);requestAnimationFrame(()=>{p.buttons=buttons(-1);requestAnimationFrame(()=>requestAnimationFrame(resolve));});})',button)
 else:
  inputs([button]);page.wait_for_function('(b)=>LeonardoGuild.inspect().controller.buttons[b]',arg=button)
  inputs([]);page.wait_for_function('(b)=>!LeonardoGuild.inspect().controller.buttons[b]',arg=button)
 frames(3)
def choose(selector):
 for _ in range(35):
  if page.evaluate('(selector)=>document.activeElement===document.querySelector(selector)',selector):press(0);return
  press(13)
 raise AssertionError('Controller cannot reach '+selector)
def drive(x,z):
 page.evaluate('''({x,z})=>new Promise((resolve,reject)=>{const start=performance.now();let settle=0;function next(){const s=LeonardoGuild.inspect(),d=Math.hypot(x-s.x,z-s.z);if(!s.running){__testPad.axes=[0,0,0,0];reject(Error('Unexpected travel modal'));return;}if(d<.25||settle){__testPad.axes=[0,0,0,0];if(++settle>20&&Math.abs(s.speed)<.02){resolve();return;}}else{const a=Math.atan2(x-s.x,z-s.z)-s.render.heading,amount=Math.min(.65,Math.max(.30,d*.7));__testPad.axes=[-Math.sin(a)*amount,-Math.cos(a)*amount,0,0];}if(performance.now()-start>85000){__testPad.axes=[0,0,0,0];reject(Error('Physical travel blocked '+JSON.stringify({x,z,actualX:s.x,actualZ:s.z})));return;}requestAnimationFrame(next);}next();})''',{'x':x,'z':z})
def neutral():inputs([], [0,0,0,0]);frames(6)
def capture(name):captures[name]=read();page.screenshot(path=str(OUT/(name+'.png')))
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':640,'height':400},service_workers='block')
 ctx.add_init_script("window.__testPad={id:'Xbox 360 Controller (STANDARD GAMEPAD)',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__testPad]});")
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 try:
  page.goto(BASE+'/leonardos-guild/?district=legacy&quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5)
  check(read()['version']==json.loads((ROOT/'release.json').read_text())['version'],'The new release runs ordinary committed source')
  check(read()['xr']['mode']=='seated-theatre' and not read()['xr']['presenting'],'XR is opt-in; ordinary browser gameplay is unchanged')
  press(0);page.wait_for_function('LeonardoGuild.inspect().running');press(3);neutral()
  check(read()['mode']=='foot','Xbox Y retains dismount')
  legacy=read();drive(-5,-6);press(2);page.wait_for_selector('#quarter-dialog[open]');choose('[data-quarter-action="enter"]');page.wait_for_function('LeonardoGuild.inspect().quarter.active');neutral()
  check(read()['quarter']['active'] and read()['credits']==legacy['credits'] and read()['deliveries']==legacy['deliveries'],'Real legacy walking and X entry reach the Quarter without replacing prior accomplishments')
  original=read();press(4);check(read()['resonance']['tool']=='sling' and not read()['console']['wheel'],'Tap LB swaps staff to sling without opening any menu')
  press(4);check(read()['resonance']['tool']=='staff','A second tap returns to the actual previous tool')
  inputs([4],[0,0,0,0]);page.wait_for_function("LeonardoGuild.inspect().console.wheel==='tools'")
  inputs([4,13]);frames(3);inputs([4]);frames(2);inputs([]);frames(5)
  check(read()['resonance']['tool']=='sling' and not read()['console']['wheel'],'Holding LB retains full wheel selection and release confirmation')
  press(4);check(read()['resonance']['tool']=='staff','Wheel selection updates quick-swap history')
  press(9);page.wait_for_selector('#pause-dialog[open]');tool=read()['resonance']['tool'];press(4);press(1)
  check(read()['resonance']['tool']==tool and read()['running'],'LB remains menu navigation and does not leak a tool swap after pause')
  inputs([],[0,-.60,0,0]);frames(42);neutral();page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.01');frames(25)
  snapshot=read();feet=snapshot['render']['character']['feet'];check(len(feet)==2 and any(f['locked'] for f in feet),'Actual moving game actor uses world-space foot contacts')
  check(all(not f['locked'] or f['error']<1e-5 for f in feet),'Rendered stance contacts meet the numerical world-anchor tolerance')
  check(snapshot['render']['character']['proportions']['headScale']==.65,'Actual game actor uses the revised adult-like proportions')
  capture('grounded-front-view');press(9);page.wait_for_selector('#pause-dialog[open]');frozen=read()['render']['character'];frames(15)
  check(read()['render']['character']==frozen,'A real pause freezes all planted joints and feet');press(1)
  press(0);frames(2);check(read()['lift']>0 or read()['steps']>snapshot['steps'],'Xbox A retains jump or authorized nearby stair action');neutral();frames(90)
  check(read()['credits']==original['credits'] and read()['mission']==original['mission'] and read()['deliveries']==original['deliveries'],'Control and animation upgrades do not grant progression or change rewards')
  saved=json.loads(page.evaluate("localStorage.getItem('svgn.leonardos-guild.v1')"));check(saved['version']==2,'The original version-2 save remains in the same namespace')
  expected=read();page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5);press(0);page.wait_for_function('LeonardoGuild.inspect().running');actual=read()
  check(actual['resonance']['tool']==expected['resonance']['tool'] and actual['credits']==expected['credits'] and actual['frontier']==expected['frontier'],'An actual reload preserves tool choice, money and region/contract saves')
  check(actual['audio']['preferences']['density']=='quiet','Quiet audio preferences remain intact')
  capture('grounded-reloaded');drive(-24,-14);press(2);page.wait_for_selector('#quarter-dialog[open]');choose('[data-quarter-action="leave"]');page.wait_for_function('!LeonardoGuild.inspect().quarter.active');neutral()
  check(read()['credits']==expected['credits'] and read()['vehicles']==legacy['vehicles'],'Physical Quarter departure restores the retained town and parked vehicles')
  capture('grounded-legacy-return');check(not errors,'No captured JavaScript or shader compilation errors')
 finally:
  try:page.screenshot(path=str(OUT/'final.png'))
  except:pass
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'captures':captures,'input':'Fresh legacy start, actual walking into Quarter for timing-sensitive taps, physical return; virtual standard Xbox only. No actor/progression/clock writes. No physical hardware certification.'},indent=2));browser.close()
