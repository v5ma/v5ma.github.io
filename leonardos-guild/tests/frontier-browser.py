"""Fresh native Console journey. Only virtual Xbox input is injected, not
actor/quest/clock/currency state. One declared Enter key activates browser audio.
The browser navigates ordinary committed files served by a real HTTP server.
"""
from pathlib import Path
import os,json,math,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'frontier-output';OUT.mkdir(exist_ok=True)
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
 browser=p.chromium.launch(**opts);context=browser.new_context(viewport={'width':1100,'height':760},service_workers='block')
 context.add_init_script("window.__testPad={id:'Xbox standard virtual acceptance',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__testPad]});")
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));network=[];page.on('response',lambda r:network.append([r.url,r.status]) if '/leonardos-guild/' in r.url else None)
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(5)
  check(read()['version']=='0.11.0','Actual build is Cinder Hollow v0.11.0');check(read()['frontier']['zone']=='town','Fresh real app session installs the safe-town adapter');check(read()['audio']['preferences']['density']=='quiet','Quiet cue density remains enabled');press(0);page.wait_for_function('LeonardoGuild.inspect().running')
  page.keyboard.press('Enter');page.wait_for_function('LeonardoGuild.inspect().audio.context==="running"');check(True,'One declared Enter activates the existing audio graph')
  press(12);select('[data-dispatch="expeditions"]');check(page.locator('#frontier-dialog[open]').count()==1,'D-pad Up opens the real expedition notebook');check('planned, not yet playable' in page.locator('#frontier-dialog').inner_text(),'Farmlands are clearly marked as planned, without fake travel')
  select('[data-frontier-tab="contracts"]');
  for id in ['survey','wardens','folio']:select('[data-frontier-action="accept:'+id+'"]')
  check(len(read()['frontier']['accepted'])==3,'Controller records all three expedition contracts');close();press(3);drive(0,-16)
  check(read()['mode']=='foot','Y dismounts beside the actual southern gate');capture('safe-town-gate');interact('enter')
  check(read()['frontier']['zone']=='badlands','X at the real gate enters the separate region');check(read()['render']['frontier']['active'] and read()['render']['frontier']['monsterModels']==7,'Seven actual creature models render in Cinder Hollow');check(read()['render']['frontier']['trailSegments']==19,'The renderer builds nineteen connected trail segments');capture('gate-camp')
  press(8);check(page.locator('#map-dialog[open]').count()==1,'View opens the actual region map');capture('region-map');close()
  # Equipment wheel, real aiming and a monster reward, not a fixture kill.
  inputs([4]);page.wait_for_function('LeonardoGuild.inspect().console.wheel==="tools"');inputs([4],[0,0,1,0]);frames(4);inputs([],[0,0,1,0]);frames(3);inputs();frames(4)
  check(read()['resonance']['tool']=='sling','LB/right-stick/release equips the sling');drive(300,43);kill('hollow-scout',0);check(read()['frontier']['cargo']['ore']==1 and read()['credits']==0,'Real projectiles defeat a sentinel and award cargo, not a premature contract payment');reload_sling();check(read()['resonance']['ready']==6 and read()['resonance']['reserve']<36,'X reloads with the finite shared ammunition reserve')
  # Follow the western loop around the existing solid crag.
  drive(262,50);drive(238,77);interact('site:ridge');drive(231,91);interact('site:resin-west');drive(238,120);drive(254,171);drive(300,176);interact('site:court')
  check(len(read()['frontier']['visited'])==2,'Survey objectives require physically reaching the ridge and court');capture('forgotten-court')
  kill('hollow-warden',math.pi);check('hollow-warden' in read()['frontier']['defeated'],'The stronger Hollow Warden can be defeated with actual finite shots');reload_sling();drive(300,154);interact('site:case');check(read()['frontier']['relic'],'The guarded field case is recovered through X after the Warden falls')
  drive(300,125);drive(329,138);face(math.pi/2);inputs();page.wait_for_function('LeonardoGuild.inspect().health<100',timeout=25000);hp=read()['health'];dressings=read()['frontier']['dressings'];press(3);check(read()['health']>hp and read()['frontier']['dressings']==dressings-1,'Actual monster damage and Y field dressing use change real vitality and inventory');kill('court-wisp',math.pi/2);reload_sling();check(len(read()['frontier']['defeated'])>=3,'The three-creature contract progresses through combat, not a debug award')
  drive(346,171);drive(363,105);interact('site:orchard');check(len(read()['frontier']['visited'])==3,'All three surveyed areas are connected through playable routes');capture('old-orchard')
  drive(363,62);drive(338,43);drive(300,43);drive(300,20);interact('return');check(read()['frontier']['zone']=='town' and not read()['render']['frontier']['active'],'Gate Camp returns to the original town and restores its renderer')
  # Banking/crafting and one-time rewards happen in town, at the gate.
  press(2);select('[data-frontier-tab="pack"]');select('[data-frontier-action="bank"]');check(read()['frontier']['cargo']=={'ore':0,'resin':0},'Controller banks recovered cargo only after returning to town');select('[data-frontier-action="craft"]');check(read()['frontier']['dressings']==dressings,'Crafting spends banked iron/resin to replace the dressing')
  select('[data-frontier-tab="contracts"]');
  for id in ['survey','wardens','folio']:select('[data-frontier-action="report:'+id+'"]')
  check(read()['credits']==200 and len(read()['frontier']['reported'])==3,'All three completed contracts pay their advertised rewards once');close();capture('returned-to-vinci')
  check(read()['mission']==0 and not read()['relay'],'Expeditions never grant original campaign prerequisites');check(read()['audio']['musicVoices']<=1 and read()['audio']['loops']==5,'One music stream and five shared ambience loops remain bounded after travel')
  # Actual page reload, no game data assignments.
  press(9);saved=page.evaluate('localStorage.getItem("svgn.leonardos-guild.v1")');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(4);press(0)
  check(read()['credits']==200 and len(read()['frontier']['reported'])==3,'Actual save/reload retains rewards without paying again');check(read()['frontier']['zone']=='town' and read()['resonance']['tool']=='sling','Reload resumes safely in town with selected equipment intact');press(12);select('[data-dispatch="expeditions"]');select('[data-frontier-tab="contracts"]');check(page.locator('[data-frontier-action^="report:"]').count()==0,'Completed contracts expose no repeat-reward action');close()
  page.evaluate('__testPad.connected=false');frames(4);check(read()['paused'],'Controller disconnect pauses safely');page.evaluate('__testPad.connected=true');frames(4);close();check(read()['running'],'B resumes after controller reconnection')
  for width,height,name in [(390,844,'portrait'),(844,390,'landscape')]:
   page.set_viewport_size({'width':width,'height':height});frames(5);press(12);select('[data-dispatch="expeditions"]');check(page.evaluate('(()=>{const d=document.querySelector("#frontier-dialog"),r=d.getBoundingClientRect();return d.scrollWidth<=d.clientWidth+1&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()'),name+' expedition notebook fits without horizontal overflow');capture(name+'-notebook');close()
  check(not errors,'No runtime JavaScript errors in the full town/expedition/return journey');check(all(status in (200,206,304) for _,status in network),'All requested game and audio assets load successfully')
 finally:
  try:state=read()
  except:state=None
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'state':state,'captures':captures,'network':network,'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'input':'Fresh save, standard virtual Xbox controller for all gameplay/UI. One declared Enter key activates audio. No live actor/progression/clock/currency writes, mouse or programmatic focus.'},indent=2));page.screenshot(path=str(OUT/'last-state.png'));browser.close()
