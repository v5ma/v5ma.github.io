"""Fresh native Console journey. Only virtual Xbox input is injected, not
actor/quest/clock/currency state. One declared Enter key activates browser audio.
The browser navigates ordinary committed files served by a real HTTP server.
"""
from pathlib import Path
import os,json,math,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'water-output';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];captures={}
def check(v,text):
 assert v,text
 checks.append(text);print('PASS:',text,flush=True)
def read():return page.evaluate('LeonardoGuild.inspect()')
def inputs(buttons=None,axes=None):page.evaluate('(v)=>{const p=__testPad;p.axes=v.axes||[0,0,0,0];p.buttons=Array.from({length:17},(_,i)=>({pressed:v.buttons.includes(i),touched:v.buttons.includes(i),value:v.buttons.includes(i)?1:0}));}',{'buttons':buttons or [],'axes':axes})
def frames(n=3):page.evaluate('(n)=>new Promise(r=>{let i=0;function f(){if(++i>=n)r();else requestAnimationFrame(f)}requestAnimationFrame(f)})',n)
def press(b):
 inputs([b]);frames(2);inputs();frames(3)
def close():press(1);page.wait_for_function('LeonardoGuild.inspect().running')
def select(selector,activate=True):
 for _ in range(48):
  data=page.evaluate('''sel=>{const t=document.querySelector(sel),a=document.activeElement,r=a?.closest('dialog[open]')||document.querySelector('#menu');if(!t||!r)return {error:'missing '+sel};const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]');const list=[...r.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')].filter(e=>visible(e)&&e.type!=='hidden');const start=list.indexOf(a),goal=list.indexOf(t);if(start<0||goal<0)return {error:'not focusable '+sel};const rect=list.map(e=>e.getBoundingClientRect());function next(i,d){if((d===14||d===15)&&(list[i].tagName==='SELECT'||list[i].type==='range'))return i;const a=rect[i],h=d>13,sign=d===12||d===14?-1:1;let k=-1,best=Infinity;for(let j=0;j<list.length;j++){if(i===j)continue;const b=rect[j],dx=b.x+b.width/2-a.x-a.width/2,dy=b.y+b.height/2-a.y-a.height/2,f=(h?dx:dy)*sign,side=Math.abs(h?dy:dx);if(f<4)continue;const score=f+side*2.8;if(score<best){k=j;best=score;}}return k<0?(i+sign+list.length)%list.length:k;}const q=[[start,[]]],seen=new Set([start]);while(q.length){const [i,path]=q.shift();if(i===goal)return {path};for(const d of[13,12,15,14]){const j=next(i,d);if(!seen.has(j)){seen.add(j);q.push([j,[...path,d]]);}}}return {error:'unreachable '+sel}}''',selector)
  if 'error' in data:raise AssertionError(data['error'])
  if not data['path']:
   if activate:press(0)
   return
  # Recompute after each move: scrolling can alter the visible focus geometry.
  press(data['path'][0])
 raise AssertionError('Controller could not focus '+selector+' '+str(read()['controller']))
def drive(x,z,radius=.9):
 # Closed-loop controller input runs beside the game, reading public inspect().
 # It neither advances the clock nor changes simulation/character state.
 page.evaluate('''goal=>new Promise((resolve,reject)=>{const started=performance.now();function pad(ax){__testPad.axes=ax;}function frame(){const s=LeonardoGuild.inspect();if(!s.running){pad([0,0,0,0]);reject(Error('Paused while travelling'));return;}const dx=goal.x-s.x,dz=goal.z-s.z,d=Math.hypot(dx,dz);if(d<goal.radius){pad([0,0,0,0]);resolve();return;}if(performance.now()-started>90000){pad([0,0,0,0]);reject(Error('Travel timeout '+JSON.stringify({x:s.x,z:s.z,goal})));return;}const relative=Math.atan2(dx,dz)-s.render.heading,strength=Math.min(.96,.34+d*.12);pad([-Math.sin(relative)*strength,-Math.cos(relative)*strength,0,0]);requestAnimationFrame(frame);}requestAnimationFrame(frame);})''',{'x':x,'z':z,'radius':radius})
 inputs();page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.12')
def face(yaw):
 page.evaluate('''yaw=>new Promise((resolve,reject)=>{let n=0;function f(){const d=Math.atan2(Math.sin(yaw-LeonardoGuild.inspect().render.heading),Math.cos(yaw-LeonardoGuild.inspect().render.heading));if(Math.abs(d)<.035){__testPad.axes=[0,0,0,0];resolve();return;}if(++n>500){reject(Error('Camera turn timeout'));return;}__testPad.axes=[0,0,-Math.sign(d)*Math.min(.7,.22+Math.abs(d)*.8),0];requestAnimationFrame(f)}requestAnimationFrame(f)})''',yaw)
 frames(4)
def interact(action):
 inputs();press(2);page.wait_for_selector('#frontier-dialog[open]');select('[data-frontier-action="'+action+'"]')
 if page.locator('#frontier-dialog').evaluate('d=>d.open'):close()
 frames(5)
def capture(name):captures[name]=read();page.screenshot(path=str(OUT/(name+'.png')))
def reload_sling():
 inputs([6]);frames(3);inputs([6,2]);frames(2);inputs([6]);page.wait_for_function('LeonardoGuild.inspect().resonance.reload===0');inputs();frames(3)
def kill(id,yaw):
 face(yaw);inputs([6]);frames(4);inputs([6,7]);page.wait_for_function('(id)=>LeonardoGuild.inspect().frontier.defeated.includes(id)',arg=id,timeout=25000);inputs();frames(5)
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);context=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
 context.add_init_script("window.__testPad={id:'Xbox standard virtual acceptance',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__testPad]});")
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));shader_errors=[]
 page.on('console',lambda m:shader_errors.append(m.text) if m.type=='error' and any(t in m.text for t in ['WebGLProgram','Shader Error','VALIDATE_STATUS']) else None)
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5)
  check(read()['version']=='0.12.0','Real game starts Stillwater Works v0.12.0');press(0);page.wait_for_function('LeonardoGuild.inspect().running')
  page.keyboard.press('Enter');page.wait_for_function('LeonardoGuild.inspect().audio.context==="running"')
  press(12);select('[data-dispatch="expeditions"]');select('[data-frontier-tab="contracts"]');select('[data-frontier-action="accept:cistern"]');close()
  check(read()['frontier']['accepted']==['cistern'],'Controller records the real waterworks contract without completing older missions')
  press(3);drive(0,-16);interact('enter');drive(270,16);drive(236.3,16);face(0)
  # Use the player's real settings interface to render a higher-detail pool.
  press(9);select('#pause-settings');select('#graphics-quality',False)
  for _ in range(3):
   if page.locator('#graphics-quality').input_value()=='high':break
   press(15)
  check(page.locator('#graphics-quality').input_value()=='high','Controller selects actual high graphics quality')
  press(1);frames(3)
  if read()['paused']:press(1)
  page.wait_for_function('LeonardoGuild.inspect().running');frames(12)
  check(read()['render']['frontier']['water']['active'],'The actual nearby cistern activates its rendering pass')
  check(read()['render']['frontier']['water']['passes']==1 and read()['render']['frontier']['water']['size']==768,'High quality uses one bounded scene-refraction target, not a pasted image')
  capture('filled-cistern')
  interact('water:read');check(read()['frontier']['cistern']['phase']==1,'X at the dry platform reads the real hydraulic slate')
  # Water, not an invisible unchanging wall, determines the ramp's usable depth.
  drive(236.3,19);face(0);inputs([],[0,-1,0,0]);frames(80);inputs();frames(6)
  check(20<read()['z']<22.3 and read()['health']==100,'Flooded ramp blocks unsafe deep entry without damaging the player')
  drive(236.3,16);interact('water:apply');check(read()['frontier']['cistern']['phase']==1 and read()['credits']==0,'A wrong valve pattern is reversible and consumes no money')
  for i in range(3):interact('water:valve:'+str(i))
  check(read()['frontier']['cistern']['mask']==6,'The controller sets INLET closed, OUTLET and BYPASS open')
  press(2);capture('sluice-controls');close();interact('water:apply')
  before=read()['frontier']['cistern']['surface'];check(read()['frontier']['cistern']['phase']==2,'Applying correct sluices begins actual draining')
  page.wait_for_function('LeonardoGuild.inspect().frontier.cistern.surface < -1.64');check(read()['frontier']['cistern']['surface']<before-1,'The playable and rendered water levels actually fall');capture('drained-cistern')
  drive(236.3,25.9);drive(236.3,32.4);face(0);frames(12)
  water=read()['render']['frontier']['water'];check(water['actorGround']==-2 and .3<water['depth']<.45,'Player walks down the real ramp to a shallow submerged floor')
  check(read()['render']['frontier']['cameraSafety']['valid'],'Camera remains finite after descending below the terrain')
  capture('wading-to-lens');interact('water:recover');check(read()['frontier']['cistern']['phase']==3,'X recovers the lens only after physically reaching it')
  check(read()['credits']==0 and not read()['frontier']['defeated'],'Water mission does not auto-award money or require monster kills')
  drive(236.3,26);drive(236.3,19);drive(236.3,16)
  for i in range(3):interact('water:valve:'+str(i))
  interact('water:apply');check(read()['frontier']['cistern']['phase']==4,'Only the dry controls can start restoring the pool')
  page.wait_for_function('LeonardoGuild.inspect().frontier.cistern.phase===5');face(0);capture('restored-cistern')
  check(read()['frontier']['cistern']['surface']>.03,'The saved restoration visibly returns the basin to its full level')
  # Pause must freeze both gameplay water level and shader time.
  press(9);frozen=read()['frontier']['cistern'];frames(20);check(read()['frontier']['cistern']==frozen,'Pause freezes hydraulic simulation');press(1)
  drive(270,16);drive(300,20);interact('return');press(2);select('[data-frontier-tab="contracts"]');select('[data-frontier-action="report:cistern"]')
  check(read()['credits']==80 and read()['frontier']['reported']==['cistern'],'Physical return to Vinci pays exactly 80 florins once');close()
  press(9);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(4);press(0)
  check(read()['credits']==80 and read()['frontier']['cistern']['phase']==5,'Actual reload preserves the restored pool and one-time reward')
  check(read()['frontier']['zone']=='town' and read()['mission']==0,'Reload remains in safe Vinci with the old campaign untouched')
  check(read()['audio']['preferences']['density']=='quiet' and read()['audio']['musicVoices']<=1,'Quiet density and single-track music remain unchanged')
  press(12);select('[data-dispatch="expeditions"]');select('[data-frontier-tab="contracts"]');check(page.locator('[data-frontier-action="report:cistern"]').count()==0,'Completed water contract has no repeat-payment button');close()
  check(not shader_errors,'Both actual pool GLSL shaders compile without WebGL program errors')
  check(not errors,'No uncaught JavaScript errors in the full waterworks/controller journey')
 finally:
  try:state=read()
  except:state=None
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'shaderErrors':shader_errors,'captures':captures,'state':state,'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'input':'Fresh save, virtual standard Xbox input for gameplay, menus and graphics settings. One declared Enter enables browser audio. No position, quest, clock, money or focus assignments. Native software WebGL, not physical Xbox certification.'},indent=2));page.screenshot(path=str(OUT/'last-state.png'));browser.close()
