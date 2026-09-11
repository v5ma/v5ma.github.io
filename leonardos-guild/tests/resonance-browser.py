"""Read-only native HTTP/WebGL acceptance, fresh save and virtual Xbox inputs plus one explicitly declared trusted Enter key for browser audio permission.
The virtual pad is the only injected object. No actor/progression writes, pointer
clicks or programmatic focus are used in this journey.
"""
from pathlib import Path
import os,json,math,time,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'resonance-output';OUT.mkdir(exist_ok=True)
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
def pulse(button,keep=()):
 page.evaluate('(v)=>new Promise(resolve=>{const p=window.__testPad;const set=b=>{p.buttons=Array.from({length:17},(_,i)=>({pressed:b.includes(i),touched:b.includes(i),value:b.includes(i)?1:0}));};set([...v.keep,v.button]);requestAnimationFrame(()=>{set(v.keep);requestAnimationFrame(()=>requestAnimationFrame(resolve));});})',{'button':button,'keep':list(keep)})
def wheel(kind,index):
 button={'tools':4,'music':14,'disciplines':13}[kind]
 inputs([button],[0,0,0,0]);page.wait_for_function('(kind)=>LeonardoGuild.inspect().console.wheel===kind',arg=kind)
 count={'tools':4,'music':7,'disciplines':3}[kind];angle=index/count*math.pi*2
 inputs([button],[0,0,math.sin(angle),-math.cos(angle)]);frames(5)
 check(read()['console']['index']==index,kind+' wheel selects sector '+str(index)+' with right stick')
 inputs([],[0,0,math.sin(angle),-math.cos(angle)]);frames(5);neutral()
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
 ctx.add_init_script("window.__testPad={id:'Xbox 360 Controller (STANDARD GAMEPAD)',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__testPad]});")
 page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)));network=[]
 page.on('response',lambda r:network.append({'url':r.url,'status':r.status}) if '/assets/resonance/' in r.url else None)
 page.on('dialog',lambda d:(_ for _ in ()).throw(AssertionError('Blocking browser dialog: '+d.message)))
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5)
  check(read()['version']=='0.8.0','Committed Resonance v0.8.0 starts the actual WebGL game')
  check(read()['console']['preferences']['profile']=='console','New controller profile defaults to contextual console controls')
  check(read()['controller']['focus']=='start','Controller focuses Start without a pointer')
  page.screenshot(path=str(OUT/'title.png'));press(0);page.wait_for_function('LeonardoGuild.inspect().running')
  check(read()['running'],'Controller starts gameplay regardless of browser sound permission')
  # This is explicitly a trusted browser activation, not a claim that synthetic
  # Gamepad input can defeat Chrome autoplay restrictions. No mouse is used.
  page.keyboard.press('Enter');page.wait_for_function('LeonardoGuild.inspect().audio.context==="running" && LeonardoGuild.inspect().audio.loops===5')
  page.wait_for_function('LeonardoGuild.inspect().audio.rms>0.00001');check(True,'One declared Enter activation produces real audible Web Audio output and five ambient layers')
  page.wait_for_function('LeonardoGuild.inspect().audio.nowPlaying==="Morning in Vinci"');check(True,'Original streamed music is decoded and playing, not only a UI label')
  initial=read()['speed'];inputs([7]);frames(20);check(read()['speed']>initial+.3,'Vehicle RT accelerates the original bicycle')
  inputs([5]);page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.4');neutral();check(True,'RB handbrake brings the original bicycle to a stop')
  pulse(10);page.wait_for_function('LeonardoGuild.inspect().audio.eventCounts.horn>0');check(True,'Left-stick click produces the vehicle bell')
  lamp=read()['resonance']['headlight'];press(14);frames(5);check(read()['resonance']['headlight']!=lamp,'Quick D-pad left toggles the actual rendered vehicle lamp')
  inputs([0]);frames(4);check(read()['resonance']['duck'] and read()['render']['resonance']['duck'],'Vehicle A ducks the rendered rider');neutral()
  press(3);check(read()['mode']=='foot','Y transitions from riding to on-foot console controls')
  heading=read()['render']['heading'];yaw=read()['yaw'];inputs([],[0,0,.65,0]);frames(18);neutral()
  check(abs(read()['render']['heading']-heading)>.15 and abs(read()['yaw']-yaw)<.08,'Right stick turns the foot camera independently of the stationary character')
  x,z=read()['x'],read()['z'];inputs([],[0,-.65,0,0]);frames(22);neutral();check(math.hypot(read()['x']-x,read()['z']-z)>.3,'Left stick walks relative to the camera')
  inputs([4],[0,0,0,0]);page.wait_for_function('LeonardoGuild.inspect().console.wheel==="tools"');before=read()['steps'];at=time.monotonic();frames(25);elapsed=time.monotonic()-at;delta=read()['steps']-before
  check(delta>=0 and delta/max(elapsed,.001)<23,'Equipment wheel slows actual simulation rather than merely drawing an overlay')
  inputs([4],[0,0,1,0]);frames(4);pulse(15,[4]);check(read()['console']['variant']==1,'D-pad cycles real variants inside the selected equipment slice');pulse(14,[4]);page.screenshot(path=str(OUT/'equipment-wheel.png'));inputs([],[0,0,1,0]);frames(4);neutral()
  check(read()['resonance']['tool']=='sling' and read()['resonance']['variants']['sling']==0,'Releasing LB equips the selected sling without unintended camera input')
  inputs([6]);frames(20);check(read()['resonance']['aim'] and read()['render']['cameraFov']<57,'LT enters a closer over-the-shoulder aiming view')
  n=read()['resonance']['ready'];pulse(7,[6]);frames(6);check(read()['resonance']['ready']==n-1,'RT releases one real travelling pellet and consumes ammunition')
  reserve=read()['resonance']['reserve'];pulse(2,[6]);page.wait_for_function('LeonardoGuild.inspect().resonance.reload>0');check(True,'X starts a timed reload while aiming the sling')
  page.wait_for_function('LeonardoGuild.inspect().resonance.reload===0');check(read()['resonance']['ready']==6 and read()['resonance']['reserve']==reserve-1,'Reload moves pellets from the finite reserve rather than creating ammunition')
  page.screenshot(path=str(OUT/'aiming.png'));inputs([6,2]);page.wait_for_function('LeonardoGuild.inspect().controller.modal!==null');neutral();check(True,'Holding X still reaches nearby interactions while the sling is equipped');close()
  press(12);page.wait_for_selector('#dispatch-dialog[open]');check(page.locator('[data-dispatch]').count()==8,'D-pad up opens eight functioning guild dispatch applications');page.screenshot(path=str(OUT/'dispatch.png'))
  ui_select('[data-dispatch="audio"]');check(read()['controller']['modal']=='audio-dialog','Controller enters audio and control settings from dispatch')
  ui_select('#audio-master',False)
  for _ in range(20):press(14)
  page.wait_for_function('LeonardoGuild.inspect().audio.preferences.master===0 && LeonardoGuild.inspect().audio.rms<0.000001');check(True,'Controller master-volume slider silences the actual audio graph')
  for _ in range(12):press(15)
  page.wait_for_function('LeonardoGuild.inspect().audio.rms>0.00001');check(True,'Controller restores the audible mix without native popups')
  ui_select('#audio-range',False);press(15);check(read()['audio']['preferences']['range']=='night','Controller selects a gentler dynamic-range preset')
  ui_select('#controller-lock');check(read()['console']['preferences']['lockOn']==False,'Lock-on assistance can be disabled with the controller');press(0)
  ui_select('#audio-preview');page.wait_for_function('LeonardoGuild.inspect().audio.eventCounts.success>0');page.screenshot(path=str(OUT/'mixer.png'));close();check(read()['running'],'B closes the mixer and resumes without a pointer')
  press(9);ui_select('#pause-sound');close();check(read()['controller']['modal']=='pause-dialog','B from nested audio settings returns to Pause, not gameplay');close()
  for index,name in [(2,'market'),(3,'lamplight'),(4,'underways'),(5,'pursuit')]:
   wheel('music',index);page.wait_for_function('(name)=>LeonardoGuild.inspect().audio.chosen===name',arg=name);check(read()['audio']['musicVoices']<=2,'Music selection '+name+' uses at most two crossfading streams')
  wheel('music',6);check(read()['audio']['station']=='off' and read()['audio']['musicVoices']==0,'Music-off stops score streams but leaves sound effects available');press(8);close();check(read()['audio']['musicVoices']==0,'Further controller gestures do not incorrectly restart disabled music')
  wheel('music',0);page.wait_for_function('LeonardoGuild.inspect().audio.musicVoices>0');check(True,'Adaptive music resumes from the controller music wheel')
  wheel('disciplines',1);check(read()['resonance']['discipline']=='warden','Discipline wheel chooses the existing apprentice role, not an invented protagonist')
  focus=read()['life']['focus'];inputs([10,11]);frames(4);neutral();check(read()['resonance']['special']>0 and read()['life']['focus']<focus-35,'Both stick clicks activate the selected ability once for real focus cost')
  check(read()['audio']['eventCounts'].get('sling',0)>0 and read()['audio']['eventCounts'].get('loaded',0)>0,'Sling and reload events reach the sound-effects mixer')
  check(any(k.startswith('step-') for k in read()['audio']['eventCounts']),'Walking produces material-specific footstep events')
  press(9);saved=json.loads(page.evaluate('localStorage.getItem("svgn.leonardos-guild.v1")'));check(saved['resonance']['tool']=='sling','New equipment is saved in the original compatible adventure save')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5);press(0);check(read()['resonance']['tool']=='sling' and read()['resonance']['discipline']=='warden','Actual reload retains selected equipment and discipline')
  check(read()['audio']['preferences']['master']==.6 and read()['audio']['preferences']['range']=='night','Mixer preferences survive actual reload separately from the adventure')
  page.evaluate('window.__testPad.connected=false');frames(4);check(read()['paused'],'Controller disconnection safely pauses the game');page.evaluate('window.__testPad.connected=true');frames(5);close();check(read()['running'],'B resumes after reconnection without stale held controls')
  check(not errors,'No runtime JavaScript errors in the native console and audio journey')
  check(all(n['status'] in (200,206,304) for n in network),'Every requested original audio asset is served successfully')
  check(read()['audio']['voices']<=24 and read()['audio']['musicVoices']<=2,'Audio voice and streaming bounds remain enforced')
  page.screenshot(path=str(OUT/'end.png'))
 finally:
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'state':page.evaluate('window.LeonardoGuild?.inspect()'),'audioRequests':network,'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'input':'Fresh save. Virtual standard Xbox gamepad for gameplay and all UI. One explicitly declared trusted Enter press for browser audio activation. No mouse, programmatic focus, live-state or quest writes.'},indent=2));page.screenshot(path=str(OUT/'last-state.png'));browser.close()
