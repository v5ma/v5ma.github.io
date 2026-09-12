"""Read-only native HTTP/WebGL acceptance, fresh save and virtual Xbox inputs.
The virtual pad is the only injected object. No actor/progression writes, pointer
clicks, programmatic focus or keyboard events are used in this journey.
"""
from pathlib import Path
import os,json,math,time,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'doors-output';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];last_axes=[0,0,0,0]
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
 # Pulse and release within one browser task/RAF chain, so slow WebGL
 # cannot turn transport round trips into unintended long-held navigation.
 page.evaluate('(button)=>new Promise(resolve=>{const p=window.__testPad;const buttons=v=>Array.from({length:17},(_,i)=>({pressed:i===v,touched:i===v,value:i===v?1:0}));p.buttons=buttons(button);requestAnimationFrame(()=>{p.buttons=buttons(-1);requestAnimationFrame(()=>requestAnimationFrame(resolve));});})',button)
def neutral():inputs([], [0,0,0,0]);frames(6)
def ui_select(selector,click=True):
 # Read actual on-screen focus graph, then send only D-pad presses.
 for attempt in range(4):
  result=page.evaluate('''(selector)=>{const target=document.querySelector(selector),current=document.activeElement,r=current?.closest('dialog[open]')||document.querySelector('#menu');if(!target||!r)return {error:'target/root missing '+selector};const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]');const list=[...r.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(e=>visible(e)&&e.type!=='hidden');const start=list.indexOf(current),goal=list.indexOf(target);if(start<0||goal<0)return {error:'focus/target not reachable '+selector};const rects=list.map(e=>e.getBoundingClientRect());function neighbor(i,d){if((d===14||d===15)&&(list[i].tagName==='SELECT'||list[i].type==='range'))return i;const a=rects[i],horizontal=d===14||d===15,sign=d===12||d===14?-1:1,cx=a.x+a.width/2,cy=a.y+a.height/2;let best=-1,score=Infinity;for(let j=0;j<list.length;j++){if(i===j)continue;const q=rects[j],dx=q.x+q.width/2-cx,dy=q.y+q.height/2-cy,f=(horizontal?dx:dy)*sign,s=Math.abs(horizontal?dy:dx);if(f<4)continue;const v=f+s*2.8;if(v<score){score=v;best=j;}}return best<0?(i+sign+list.length)%list.length:best;}const queue=[[start,[]]],seen=new Set([start]);while(queue.length){const [i,path]=queue.shift();if(i===goal)return {path};for(const d of[13,12,15,14]){const j=neighbor(i,d);if(!seen.has(j)){seen.add(j);queue.push([j,[...path,d]]);}}}return {error:'unreachable focus graph '+selector};}''',selector)
  if 'error' in result:raise AssertionError(result['error'])
  for button in result['path']:press(button)
  if page.evaluate('(s)=>document.activeElement===document.querySelector(s)',selector):
   if click:press(0)
   return
 raise AssertionError('Focus could not reach '+selector+' '+str(read()['controller']))
def close():press(1);frames(3)
def drive(x,z,radius=.75,limit=180):
 start=time.monotonic()
 while time.monotonic()-start<limit:
  s=read();assert s['running'],'Navigation attempted while paused';dx=x-s['x'];dz=z-s['z'];distance=math.hypot(dx,dz)
  if distance<radius:neutral();page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.5',timeout=10000);return
  angle=(math.atan2(dx,dz)-s['yaw']+math.pi)%(math.pi*2)-math.pi
  steer=0 if abs(angle)<.035 else -math.copysign(min(1,.18+abs(angle)*.7),angle)
  throttle=0 if abs(angle)>.7 else min(.95,.25+distance*.12)
  inputs([], [steer,-throttle,0,0]);frames(3)
 raise AssertionError('Could not walk to '+str((x,z))+' '+json.dumps(read()))
def act(site,action='use'):
 neutral();press(2);page.wait_for_selector('#doors-dialog[open]')
 ui_select('[data-door-site="'+site+'"][data-door-action="'+action+'"]')
 if page.locator('#doors-dialog').get_attribute('open') is not None:close()
 page.wait_for_function('LeonardoGuild.inspect().running');neutral()
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
 ctx.add_init_script("window.__testPad={id:'Xbox 360 Controller (STANDARD GAMEPAD)',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__testPad]});")
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:(_ for _ in ()).throw(AssertionError('Unexpected blocking browser dialog: '+d.message)))
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(4)
  check(read()['version']==json.loads((ROOT/'release.json').read_text())['version'],'Open Doors loads the actual WebGL renderer')
  check(read()['controller']['connected'] and read()['controller']['focus']=='start','Controller focuses the title start button without a mouse')
  ui_select('#title-sound');ui_select('#controller-profile',False);press(15);check(page.locator('#controller-profile').input_value()=='classic','Classic profile remains controller-selectable for the original acceptance journey');close();
  page.screenshot(path=str(OUT/'title.png'));ui_select('#title-settings');check(read()['controller']['modal']=='settings-dialog','Controller opens title settings')
  ui_select('#graphics-quality',False);press(15);check(page.locator('#graphics-quality').input_value()!='low','Controller changes a select without a native popup');press(14)
  close();press(0);page.wait_for_function('LeonardoGuild.inspect().running');check(read()['render']['doors']['houses']==49,'Renderer reports every house in the existing city')
  page.wait_for_function('LeonardoGuild.inspect().render.art.ready||LeonardoGuild.inspect().render.art.failed');check(read()['render']['art']['ready'],'All retained licensed town artwork loads')
  press(9);check(read()['paused'],'Menu pauses gameplay');ui_select('#pause-settings');check(read()['controller']['modal']=='settings-dialog','Nested settings rather than the underlying pause window receives controller input');close();check(read()['controller']['modal']=='pause-dialog','B returns from settings to the underlying pause');ui_select('#reset');check(read()['controller']['modal']=='reset-confirm','Reset uses an in-game confirmation');check(read()['controller']['focus']=='reset-cancel','Keeping existing progress is the default reset choice');close();close();check(read()['running'],'B dismisses both windows and resumes without a mouse')
  press(8);check(read()['controller']['modal']=='map-dialog','View opens the map');close();press(13);check(read()['controller']['modal']=='life-dialog','D-pad down opens the original notebook');close()
  press(12);check(read()['controller']['modal']=='doors-dialog','D-pad up opens the six-adventure guide');press(5);check(page.locator('[data-door-tab="controls"]').get_attribute('aria-selected')=='true','RB switches guide tabs');close()
  press(2);page.wait_for_selector('#city-dialog[open]');ui_select('[data-city-tab="guide"]');ui_select('#city-search');check(read()['controller']['modal']=='pad-keyboard','Controller can open text entry for the original searchable guide');press(0);ui_select('#pad-keyboard .pad-key-controls button:nth-child(4)');check(page.locator('#city-search').input_value()=='a','Controller text entry updates the existing search field');close()
  press(3);check(read()['mode']=='foot','Y dismounts the original bicycle');parked=read()['vehicles'];drive(-9,8);drive(-9,24);drive(-17,24);drive(-23,25.5)
  check(read()['render']['interior']['room']=='workshop','Controller movement walks through the original workshop doorway');page.screenshot(path=str(OUT/'workshop.png'))
  act('desk:workshop','accept');check(read()['doors']['homes']['workshop']==1,'Household commission is accepted at its actual desk');drive(-24.5,22);act('adventure:survey');check(read()['doors']['adventures']['survey']==1,'A new adventure is accepted from the in-world commission board')
  drive(-28.5,26);act('up:workshop');check(read()['doors']['level']==1,'Controller uses the upper staircase');drive(-24.5,22);act('work:workshop','choice:0');check(read()['doors']['homes']['workshop']==2,'Upper workshop choice solves the clued craft');page.screenshot(path=str(OUT/'upper-workshop.png'))
  drive(-28.5,26);act('up:workshop');check(read()['doors']['level']==2,'Attic is a separate playable floor');drive(-24.5,22);act('work:workshop','finish');check(read()['doors']['homes']['workshop']==3,'Attic finishing requires the earned upstairs work')
  drive(-28.5,26);act('up:workshop');check(read()['doors']['level']==3,'The attic ladder reaches the connected roof layer');drive(-24.5,24);drive(-24.5,61);check(read()['z']>59,'Controller walks a continuous bridge between different houses');page.screenshot(path=str(OUT/'rooftops.png'))
  drive(24.5,61);drive(28.5,63);act('roofexit:apothecary');check(read()['doors']['level']==2 and read()['doors']['room']=='apothecary','Rooftop hatch reaches a different house attic');drive(28.5,57);act('down:apothecary');drive(28.5,57);act('down:apothecary');check(read()['doors']['level']==0,'Paired stairs return to that house ground floor')
  drive(28.5,57);act('down:apothecary');check(read()['doors']['level']==-1,'A formerly cellarless house now has a playable cellar');drive(24.5,61);act('tunnel:apothecary');check(read()['doors']['level']==-2,'Its cellar opens onto the shared underground passage');drive(-24.5,61);drive(-24.5,24);act('cellexit:workshop');check(read()['life']['inside']=='workshop','Underground passage joins the original quest basement');page.screenshot(path=str(OUT/'original-basement.png'))
  drive(-28.5,20);press(2)
  if read()['controller']['modal']=='doors-dialog':ui_select('#doors-legacy')
  page.wait_for_selector('#city-dialog[open]');ui_select('[data-city-select="talk:up-workshop"]');page.wait_for_selector('#life-dialog[open]');ui_select('[data-use="stairs"]');page.wait_for_function('LeonardoGuild.inspect().running')
  drive(-23,25.5);before=read()['credits'];act('desk:workshop','report');check(read()['doors']['homes']['workshop']==4 and read()['credits']==before+25,'Full controller-only house journey returns and earns the one-time reward');check(read()['vehicles']==parked,'Exploring every layer leaves both original vehicles parked')
  press(9);saved=page.evaluate('localStorage.getItem("svgn.leonardos-guild.v1")');check(json.loads(saved)['doors']['homes']['workshop']==4,'Expanded progress is written to the original save key')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5);press(0);check(read()['doors']['homes']['workshop']==4 and read()['doors']['adventures']['survey']==1,'Actual reload retains household and adventure progress');check(read()['doors']['level']==0 and read()['x']==2,'Continue safely returns to the starting street rather than a sealed floor')
  page.evaluate('window.__testPad.connected=false');frames(4);check(read()['paused'],'Disconnect pauses and releases active input');page.evaluate('window.__testPad.connected=true');frames(5);close();check(read()['running'],'Reconnection supports resuming with B')
  check(not errors,'No runtime JavaScript errors during the controller-only journey');page.screenshot(path=str(OUT/'end.png'))
 finally:
  neutral();page.screenshot(path=str(OUT/'last-state.png'));(OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'state':page.evaluate('window.LeonardoGuild?.inspect()'),'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip() if (ROOT.parent/'.git').exists() else 'local','input':'virtual standard Xbox Gamepad API only; no pointer or live state writes'},indent=2));browser.close()
