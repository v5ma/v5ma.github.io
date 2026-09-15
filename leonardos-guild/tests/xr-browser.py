"""Native WebGL software XR-session emulation; no physical Quest certification.
Only XR hardware poses/buttons and trusted XR-entry clicks are supplied. Canvas
captures are passive reads. No actor, progression, inventory, time or focus writes.
"""
from pathlib import Path
import json,os,math,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'xr-output';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];captures={}
def read():return page.evaluate('LeonardoGuild.inspect()')
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
def frames(n=4):
 if read()['xr']['presenting']:
  target=read()['xr']['frames']+n;page.wait_for_function('(n)=>!LeonardoGuild.inspect().xr.presenting||LeonardoGuild.inspect().xr.frames>=n',arg=target)
 else:page.evaluate('(n)=>new Promise(resolve=>{let i=0;function f(){if(++i>=n)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);})',n)
def button(index,number,down):page.evaluate('(v)=>{const s=__xr.sources[v.index];s.gamepad.buttons[v.number]={pressed:v.down,value:v.down?1:0};}',{'index':index,'number':number,'down':down})
def sampled_pulse(index,number):
 # Supply one pressed hardware snapshot, then release before the next poll.
 # Three software-rendered frames can exceed the deliberate 450 ms hold.
 return page.evaluate('''({index,number})=>new Promise(resolve=>{const p=__xr.sources[index].gamepad,buttons=p.buttons.map(v=>({...v}));buttons[number]={pressed:true,value:1};let seen=false;Object.defineProperty(p,'buttons',{configurable:true,get(){if(!seen){seen=true;queueMicrotask(()=>{buttons[number]={pressed:false,value:0};Object.defineProperty(p,'buttons',{configurable:true,writable:true,value:buttons});resolve(LeonardoGuild.inspect());});}return buttons;}});})''',{'index':index,'number':number})
def trigger(down):
 page.evaluate('(down)=>{const s=__xr.sources[1];if(s.hand)s.pinch=down?.014:.06;else s.gamepad.buttons[0]={pressed:down,value:down?1:0};}',down)
def point(u,v,kind='panel'):
 page.evaluate('''async ({u,v,kind})=>{const T=await import('/leonardos-guild/vendor/three.module.js'),s=__xr.sources[1];let p;if(kind==='panel')p=new T.Vector3((u-.5)*1.10,(v-.5)*1.65,0).applyAxisAngle(new T.Vector3(0,1,0),-.42).add(new T.Vector3(1.61,1.60,-2.37));else p=new T.Vector3((u-.5)*2.85,(v-.5)*.7125,0).applyAxisAngle(new T.Vector3(1,0,0),-.16).add(new T.Vector3(-.44,.43,-2.38));const origin=LeonardoGuild.inspect().xr.theatreOrigin;p.applyAxisAngle(new T.Vector3(0,1,0),origin.yaw).add(new T.Vector3(origin.x,origin.y,origin.z));const d=p.sub(new T.Vector3(s.position.x,s.position.y,s.position.z)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',{'u':u,'v':v,'kind':kind});frames(3)
def panel_key(key):
 for _ in range(25):
  keys=read()['xr']['panel']['buttons']
  if key in keys:break
  if key=='page-next':raise AssertionError('Missing pagination')
  panel_key('page-next')
 else:raise AssertionError('Panel key not found: '+key)
 i=keys.index(key)
 if key=='text-prev':u=205/1024;v=1-667/1536
 elif key=='text-next':u=702/1024;v=1-667/1536
 elif key=='page-prev':u=185/1024;v=1-1388/1536
 elif key=='page-next':u=545/1024;v=1-1388/1536
 elif key=='back':u=870/1024;v=1-1388/1536
 elif key=='exit':u=.5;v=1-1480/1536
 else:u=.5;v=1-(735+i*76+33)/1536
 point(u,v);trigger(False);frames(2);trigger(True);frames(3);trigger(False);frames(3)
def dom(selector):
 index=page.evaluate('''selector=>{const e=document.querySelector(selector),r=e?.closest('dialog[open]')||document.getElementById('menu');const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]');const list=[...r.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(e=>visible(e)&&e.type!=='hidden');return list.indexOf(e);}''',selector)
 assert index>=0,'DOM action not visible '+selector
 key='dom'+str(index)
 for _ in range(25):
  if key in read()['xr']['panel']['buttons']:panel_key(key);return
  panel_key('page-next')
 raise AssertionError('Paged action unreachable '+selector)
def capture(name):
 captures[name]=read();page.screenshot(path=str(OUT/(name+'.png')))
 if read()['xr']['presenting']:
  page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture')
  (OUT/(name+'-stereo-canvas.png')).write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]))
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block');ctx.add_init_script(path=str(ROOT/'tests/xr-hardware-mock.js'))
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 try:
  page.goto(BASE+'/leonardos-guild/?district=legacy&quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild&&LeonardoGuild.inspect().xr.supported')
  page.evaluate('__xr.head={x:.4,y:1.4,z:.2};__xr.yaw=.24');page.locator('#guild-xr-enter').click();page.wait_for_function('LeonardoGuild.inspect().xr.presenting');frames(6)
  check(page.evaluate("__xr.request.mode==='immersive-vr'&&__xr.request.options.optionalFeatures.includes('hand-tracking')"),'Actual session request asks for optional hand tracking')
  check(read()['xr']['controllerCount']==2 and read()['xr']['targetSize']==[1024,576],'Actual XR frame loop tracks both controllers and reuses one bounded GPU game texture')
  origin=read()['xr']['theatreOrigin'];check(abs(origin['x']-.4)<1e-6 and abs(origin['y']+.2)<1e-6 and abs(origin['yaw']-.24)<1e-6,'The theatre initially anchors in front of a non-origin seated viewer');capture('xr-title-and-controllers');dom('#start');check(read()['running'],'Tracked ray/trigger activates the real title Start handler')
  panel_key('vehicle');check(read()['mode']=='foot','Tracked ray/trigger dismounts through the existing Y action')
  # Refinement acceptance: tracked hardware input only; no live-state writes.
  button(0,1,True);frames(4);check(read()['console']['wheel']=='tools','Left grip opens the retained wheel for direct stick selection')
  heading=read()['render']['heading'];page.evaluate('__xr.sources[1].gamepad.axes=[0,0,1,0]');frames(4)
  check(read()['console']['index']==1,'Right thumbstick selects the sling without pointing at the side panel')
  button(1,4,True);frames(3);button(1,4,False);frames(4);button(0,1,False);frames(3)
  check(not read()['console']['wheel'] and read()['resonance']['tool']=='sling','Right A confirms a tracked wheel selection')
  check(abs(math.atan2(math.sin(read()['render']['heading']-heading),math.cos(read()['render']['heading']-heading)))<.01,'Held wheel-selection stick cannot kick the game camera after confirmation')
  page.evaluate('__xr.sources[1].gamepad.axes=[0,0,0,0]');frames(4)
  # Move the real controller ray off the menu before firing. A UI-directed
  # trigger must remain an interaction, not leak into a shot.
  page.evaluate('__xr.sources[1].orientation={x:0,y:0,z:0,w:1}');frames(4)
  button(0,0,True);frames(5);button(1,0,True);frames(6);button(1,0,False);frames(3)
  check(read()['resonance']['ready']<6,'Tracked trigger spends real sling ammunition before reload acceptance')
  first=sampled_pulse(1,5)
  check(first['resonance']['reload']>0 and not first['controller']['modal'],'Aimed right B reloads directly without opening Nearby')
  frames(2)
  page.wait_for_function('LeonardoGuild.inspect().resonance.reload===0');button(0,0,False);frames(4)
  button(0,4,True);frames(3);button(0,4,False);frames(3)
  panel_key('pause');beforeFocus=read()['controller']['focus'];frames(3);page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,1]');frames(3)
  check(read()['controller']['focus']!=beforeFocus,'Left tracked stick navigates real pause-menu focus')
  button(1,5,True);frames(3);button(1,5,False);page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]');frames(4)
  check(read()['running'],'Tracked B returns from a real menu without a mouse')
  page.evaluate('__xr.session.visibilityState="visible-blurred";__xr.session.dispatchEvent(new Event("visibilitychange"))');frames(3)
  button(1,4,True);frames(4);check(read()['paused'],'A headset overlay blocks confirm input instead of resuming hidden gameplay')
  page.evaluate('__xr.session.visibilityState="visible";__xr.session.dispatchEvent(new Event("visibilitychange"))');frames(3)
  check(read()['paused'],'Held confirm remains disarmed when headset visibility returns')
  button(1,4,False);frames(3);button(1,4,True);frames(3);button(1,4,False);frames(3)
  check(read()['running'],'Release and a fresh tracked A press resume normally after the overlay')
  tool=read()['resonance']['tool'];button(0,4,True);frames(3);button(0,4,False);frames(3)
  check(read()['resonance']['tool']!=tool and not read()['console']['wheel'],'Tracked left X directly swaps the tool with no menu')
  button(0,0,True);frames(6);check(read()['resonance']['aim'] and read()['xr']['reticleVisible'],'Tracked trigger aim has a visible in-headset game-screen reticle');capture('xr-aim');button(0,0,False);frames(5)
  start=read();page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,-.65]');frames(25);page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]');frames(35)
  check(math.hypot(read()['x']-start['x'],read()['z']-start['z'])>.25,'Tracked thumbstick moves the same saved player through the real movement reducer')
  before=read();page.evaluate('__xr.head.x=.18;__xr.yaw=.15');frames(12)
  check(math.hypot(read()['x']-before['x'],read()['z']-before['z'])<.03,'Head translation/rotation does not become player movement or stride distance')
  page.evaluate('__xr.head.x=0;__xr.yaw=0');panel_key('tools');check(read()['console']['wheel']=='tools','Tracked pointer opens the retained equipment wheel')
  panel_key('next');selected=read()['console']['index'];panel_key('confirm');check(not read()['console']['wheel'],'Wheel choice and confirmation are reachable inside XR')
  page.evaluate('__xr.replace(1,true)');frames(5);check(read()['xr']['handCount']==1,'A tracked hand replaces a controller without restarting the game')
  panel_key('interact');check(bool(read()['controller']['modal']),'Pinch invokes actual nearby interaction and its existing dialog')
  panel_key('back');check(read()['running'],'Pinch Back closes the nested dialog and resumes')
  start=read();point((256+128)/1536,1-(65+70)/384,'bar');trigger(True);frames(25);trigger(False);frames(35)
  check(math.hypot(read()['x']-start['x'],read()['z']-start['z'])>.25,'Held hand pinch on Forward drives real movement; release stops it')
  check(abs(read()['speed'])<.03,'Hand locomotion does not remain stuck after release')
  point(.5,1-(735+3*76+33)/1536);trigger(False);frames(2);page.evaluate('__xr.sources[1].jointsTracked=false;__xr.sources[1].pinch=.014');frames(3);tool=read()['resonance']['tool'];page.evaluate('__xr.sources[1].jointsTracked=true');frames(5)
  check(read()['resonance']['tool']==tool,'Reacquiring an already-pinched hand cannot trigger a phantom quick-swap')
  trigger(False);frames(3);trigger(True);frames(3);trigger(False);frames(3);check(read()['resonance']['tool']!=tool,'A deliberate release and new pinch re-arms the hand')
  capture('xr-hand-ui');panel_key('map');check(read()['controller']['modal']=='map-dialog','The existing map opens from the hand-operated panel');capture('xr-map');panel_key('back')
  before=read();panel_key('pause');check(read()['paused'],'Hand-accessible Pause stops the existing simulation');frames(8);check(math.hypot(read()['x']-before['x'],read()['z']-before['z'])<.03,'XR panel stays tracked while game simulation is paused')
  dom('#resume');check(read()['running'],'Hand pointer activates the real Resume button')
  page.evaluate('__xr.sources.forEach(s=>s.tracked=false)');frames(3);check(read()['paused'],'Complete input tracking loss safely pauses instead of continuing locomotion')
  page.evaluate('__xr.sources.forEach(s=>s.tracked=true)');trigger(False);frames(4);dom('#resume')
  check(read()['credits']==start['credits'] and read()['deliveries']==start['deliveries'],'XR input and head tracking do not manufacture rewards or deliveries')
  saved=json.loads(page.evaluate("localStorage.getItem('svgn.leonardos-guild.v1')"));check(saved['version']==2,'XR uses the same version-2 save, not a separate game')
  panel_key('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');frames(5);check(read()['paused'],'XR exit returns safely to the ordinary paused game');capture('xr-exit-desktop')
  page.evaluate('__xr.floor=false;__xr.head={x:1.2,y:.05,z:-.7};__xr.yaw=-.2');page.locator('#guild-xr-pause').click();page.wait_for_function('LeonardoGuild.inspect().xr.presenting');frames(6)
  check(read()['xr']['referenceType']=='local' and abs(read()['xr']['theatreOrigin']['y']+1.55)<1e-6,'Unsupported local-floor falls back to a viewer-centered local reference')
  check(read()['xr']['renderTargets']==1 and read()['xr']['sources']<=4,'Repeated XR sessions reuse the single game target and bounded source slots');capture('xr-local-reference');panel_key('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');frames(4)
  page.evaluate('__xr.reject=true');page.locator('#guild-xr-pause').click();page.wait_for_function("LeonardoGuild.inspect().xr.status.includes('declined')")
  check(not read()['xr']['presenting'] and read()['credits']==start['credits'],'Denied XR permission falls back without losing progress')
  check(not errors,'No captured JavaScript or shader errors during the actual emulated XR render loop')
 finally:
  try:page.screenshot(path=str(OUT/'final.png'))
  except:pass
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'captures':captures,'evidence':'Native Chromium and real local WebGL/Three runtime; deterministic WebXR hardware emulation only. Physical Quest, comfort and target-device FPS unverified.'},indent=2));browser.close()
