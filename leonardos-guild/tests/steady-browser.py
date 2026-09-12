"""Read-only native HTTP/WebGL acceptance, fresh save and virtual Xbox inputs.
The virtual pad is the only injected object. No actor/progression writes, pointer clicks, programmatic focus or keyboard events are used. The default Console profile is exercised. No physical-controller or performance certification is implied.
"""
from pathlib import Path
import os,json,math,time,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'steady-output';OUT.mkdir(exist_ok=True)
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
def drive(x,z,radius=.85,limit=150):
 start=time.monotonic()
 while time.monotonic()-start<limit:
  s=read();assert s['running'],'Navigation attempted while paused';dx=x-s['x'];dz=z-s['z'];distance=math.hypot(dx,dz)
  if distance<radius:neutral();page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.5',timeout=10000);return
  desired=math.atan2(dx,dz);heading=s['render']['heading'];angle=desired-heading;strength=min(.92,.3+distance*.14)
  inputs([],[-math.sin(angle)*strength,-math.cos(angle)*strength,0,0]);frames(3)
 raise AssertionError('Could not walk to '+str((x,z))+' '+json.dumps(read()))
def act(site,action='use'):
 neutral();press(2);page.wait_for_selector('#doors-dialog[open]')
 ui_select('[data-door-site="'+site+'"][data-door-action="'+action+'"]')
 if page.locator('#doors-dialog').get_attribute('open') is not None:close()
 page.wait_for_function('LeonardoGuild.inspect().running');neutral()
def face(yaw,limit=50):
 start=time.monotonic()
 while time.monotonic()-start<limit:
  current=read()['render']['heading'];delta=(yaw-current+math.pi)%(2*math.pi)-math.pi
  if abs(delta)<.045:neutral();return
  inputs([],[0,0,-math.copysign(min(.65,.24+abs(delta)*.6),delta),0]);frames(3)
 raise AssertionError('Could not turn camera with right stick')
def camera_ok(label):
 c=read()['render']['cameraSafety'];check(c['valid'] and all(math.isfinite(c['position'][k]) for k in ['x','y','z']),label)
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
 ctx.add_init_script("window.__testPad={id:'Xbox 360 Controller (STANDARD GAMEPAD)',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__testPad]});")
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:(_ for _ in ()).throw(AssertionError('Blocking browser dialog: '+d.message)))
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5)
  check(read()['version']==json.loads((ROOT/'release.json').read_text())['version'],'Steady Steps source version matches the served game')
  check(read()['render']['character']['rigVersion']==2,'Actual player renderer uses the new jointed rig')
  check(read()['audio']['preferences']['density']=='quiet','Quiet audio remains the default');check(read()['console']['preferences']['profile']=='console','Console controller profile remains the default')
  page.screenshot(path=str(OUT/'title.png'));press(0);page.wait_for_function('LeonardoGuild.inspect().running');press(3)
  check(read()['mode']=='foot','Y dismounts with the new rendered body')
  phase=read()['render']['character']['phase'];inputs([],[0,-.8,0,0]);frames(40);neutral();check(read()['render']['character']['phase']!=phase,'Walking through controller input advances actual character stride')
  # Let the existing movement reducer stop, then verify distance-driven legs.
  page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.01');page.wait_for_function('LeonardoGuild.inspect().render.character.weight<.01');still=read()['render']['character']['phase'];frames(30)
  check(abs(read()['render']['character']['phase']-still)<.01,'Idle time does not keep advancing walking legs')
  drive(-9,8);drive(-9,24);drive(-17,24);drive(-24.5,24);drive(-30,24);face(math.pi/2);frames(15)
  c=read()['render']['cameraSafety'];check(c['occluded'] and c['position']['x']>-30.85,'Camera remains in front of the actual workshop back wall')
  check(c['distance']<2,'Obstructed camera shortens its boom instead of crossing a thin wall');camera_ok('Wall contact leaves a finite camera pose')
  page.screenshot(path=str(OUT/'back-wall-camera.png'))
  drive(-27,24);frames(30);check(read()['render']['cameraSafety']['distance']>2.5,'Camera smoothly recovers its follow distance after moving away')
  drive(-30,24);drive(-30,18.2);face(0);frames(15);c=read()['render']['cameraSafety'];check(c['occluded'] and c['position']['z']>17.6,'A rotated camera respects the northern wall at an interior corner')
  page.screenshot(path=str(OUT/'corner-camera.png'))
  drive(-28.5,26);act('up:workshop');check(read()['doors']['level']==1,'The existing stairs remain usable with the controller')
  c=read()['render']['cameraSafety'];check(c['level']==1 and c['position']['y']>3.8,'Camera history resets onto the actual upper floor')
  drive(-30,18.2);face(0);frames(12);check(read()['render']['cameraSafety']['obstacle']=='room-boundary','Upper-floor camera uses its own room boundary, not street collision walls')
  page.screenshot(path=str(OUT/'upper-room-camera.png'))
  drive(-24.5,24);inputs([4],[0,0,0,0]);page.wait_for_function('LeonardoGuild.inspect().console.wheel==="tools"');inputs([4],[0,0,1,0]);frames(5);inputs([],[0,0,1,0]);frames(5);neutral()
  check(read()['resonance']['tool']=='sling','The controller equipment wheel still equips the sling')
  inputs([6]);frames(25);check(read()['render']['character']['motion']=='aim' and read()['render']['cameraFov']<57,'LT blends into a distinct articulated aiming pose and shoulder view')
  check(len(read()['render']['character']['elbows'])==2,'Both elbow pivots are active in the rendered aiming pose');camera_ok('Shoulder aiming retains safe finite camera placement');page.screenshot(path=str(OUT/'shoulder-aim.png'))
  # A single shot supplies a real reload opportunity without a save fixture.
  inputs([6,7]);frames(2);inputs([6]);frames(4);inputs([6,2]);frames(2);inputs([6]);frames(3)
  check(read()['resonance']['reload']>0,'X still starts a timed finite-ammunition reload');check(read()['render']['character']['motion']=='reload','Reloading uses a distinct two-arm pose');neutral()
  page.wait_for_function('LeonardoGuild.inspect().resonance.reload===0')
  # Default Console controller retains all modal back/close behavior.
  press(9);page.wait_for_function('LeonardoGuild.inspect().paused');frozen=read()['render']['character'];camera=read()['render']['cameraSafety']['position'];frames(20)
  check(read()['render']['character']==frozen,'Pause freezes every character joint instead of continuing the walk cycle')
  check(read()['render']['cameraSafety']['position']==camera,'Pause does not creep the camera through room geometry')
  ui_select('#pause-sound');check(read()['controller']['modal']=='audio-dialog','Controller opens sound and control settings from Pause');close();check(read()['controller']['modal']=='pause-dialog','B returns from nested settings to Pause');close();check(read()['running'],'B resumes without a mouse or browser alert')
  drive(-28.5,26);act('up:workshop');drive(-28.5,26);act('up:workshop');drive(-24.5,24);face(math.pi/2);frames(30)
  c=read()['render']['cameraSafety'];check(c['level']==3 and not c['occluded'] and c['distance']>4,'Rooftop camera is not blocked by the street walls far below')
  page.screenshot(path=str(OUT/'rooftop-camera.png'))
  check(read()['render']['doors']['jointedRivals']==18,'The retained humanoid rivals use the same articulated rig')
  press(12);ui_select('[data-dispatch="adventures"]');ui_select('#living-stories-open');check(page.locator('[data-door-track="story"]').count()==2,'Both Living Stories remain discoverable with the controller');close()
  check(read()['mission']==0 and read()['credits']==0,'Camera and animation work grant no quests or money')
  press(9);save=page.evaluate('localStorage.getItem("svgn.leonardos-guild.v1")');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5);press(0)
  check(read()['credits']==json.loads(save)['credits'] and read()['mission']==0,'An actual reload preserves existing saved progression')
  check(read()['audio']['preferences']['density']=='quiet' and read()['audio']['musicVoices']<=1,'Quiet single-track audio remains intact after reload')
  page.evaluate('window.__testPad.connected=false');frames(5);check(read()['paused'],'Controller disconnect still pauses and releases input');page.evaluate('window.__testPad.connected=true');frames(5);close();check(read()['running'],'Controller reconnection and B safely resume play')
  check(not errors,'No uncaught browser errors in the new camera and jointed-character journey');page.screenshot(path=str(OUT/'final.png'))
 finally:
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'state':page.evaluate('window.LeonardoGuild?.inspect()'),'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'input':'Fresh save; only standard virtual Xbox input object is injected. Actual controller movement, aiming, reload, menus, stairs, roofs and reload. No live actor/progression/clock writes or keyboard/pointer/focus injections. Software WebGL, not physical Xbox/performance certification.'},indent=2));page.screenshot(path=str(OUT/'last-state.png'));browser.close()
