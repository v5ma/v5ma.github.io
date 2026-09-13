"""Read-only native HTTP/WebGL acceptance, fresh save and virtual Xbox inputs.
The virtual pad is the only injected object. No actor/progression writes, pointer clicks, programmatic focus or keyboard events are used. The default Console profile is exercised.
"""
from pathlib import Path
import os,json,math,time,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'stories-output';OUT.mkdir(exist_ok=True)
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
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
 ctx.add_init_script("window.__testPad={id:'Xbox 360 Controller (STANDARD GAMEPAD)',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__testPad]});")
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:(_ for _ in ()).throw(AssertionError('Blocking browser dialog: '+d.message)))
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(4)
  check(read()['version']==json.loads((ROOT/'release.json').read_text())['version'],'Living Stories release starts the actual renderer')
  check(read()['console']['preferences']['profile']=='console','Fresh journey uses default Console, not legacy steering')
  check(read()['audio']['preferences']['density']=='quiet','Quiet cue density is retained')
  press(0);page.wait_for_function('LeonardoGuild.inspect().running');press(12);ui_select('[data-dispatch="adventures"]');ui_select('#living-stories-open')
  check(page.locator('[data-door-track="story"]').count()==2,'Dispatch exposes two actual story cases and their notebooks')
  ui_select('[data-door-track="story"][data-door-id="lamplighter"]');check(read()['doors']['tracked']=={'kind':'story','id':'lamplighter'},'Controller tracks a story without moving or rewarding the actor');page.screenshot(path=str(OUT/'case-notebook.png'));close()
  press(3);drive(-9,8);drive(-9,24);drive(-17,24);drive(-23,25.5);act('story:lamplighter','accept')
  check(read()['doors']['stories']['cases']['lamplighter']['stage']==1,'Story begins at the real workshop desk')
  drive(-28.5,26);act('up:workshop');drive(-24.5,22);act('story:lamplighter','roof')
  check(read()['doors']['stories']['cases']['lamplighter']['route']=='roof','Physical upper-workshop route choice is saved')
  drive(-28.5,26);act('up:workshop');drive(-28.5,26);act('up:workshop');drive(-24.5,24);drive(-24.5,61);drive(24.5,61);act('story:lamplighter','observe')
  check(read()['doors']['stories']['cases']['lamplighter']['stage']==3,'Controller travels the connected roof route to collect the actual diagram');page.screenshot(path=str(OUT/'roof-evidence.png'))
  drive(-24.5,61);drive(-24.5,24);drive(-28.5,26);act('roofexit:workshop');drive(-24.5,22);act('story:lamplighter','test')
  check(read()['doors']['stories']['cases']['lamplighter']['stage']==3,'Incorrect shutter pattern neither advances nor charges the player')
  act('story:lamplighter','shutter:0');act('story:lamplighter','shutter:2');press(2);page.wait_for_selector('#doors-dialog[open]');page.screenshot(path=str(OUT/'shutter-puzzle.png'));close();act('story:lamplighter','test')
  check(read()['doors']['stories']['cases']['lamplighter']['stage']==4,'Correct copied shutter pattern solves the attic puzzle')
  drive(-28.5,20);act('down:workshop');drive(-28.5,20);act('down:workshop');drive(-23,25.5);act('story:lamplighter','amber')
  check(read()['render']['doors']['stories']['lamp']=='amber' and read()['render']['doors']['stories']['lampVisible'],'Chosen lamp color is an actual visible world outcome')
  before=read()['credits'];act('story:lamplighter','report');check(read()['credits']==before+60 and read()['doors']['stories']['cases']['lamplighter']['stage']==6,'Physical return grants the lamp story reward once');page.screenshot(path=str(OUT/'reading-lamp.png'))
  # Walk back through the doorway and along the original cross street. No teleport.
  drive(-17,24);drive(-10,24);drive(-10,8);drive(-89,8);drive(-89,24);drive(-97,24);drive(-103,25.5);act('story:ledger','accept')
  drive(-107.5,26);act('up:residence-home-0');drive(-104.5,22);act('story:ledger','cellar');drive(-107.5,20);act('down:residence-home-0');drive(-107.5,20);act('down:residence-home-0');drive(-104.5,22);act('story:ledger','observe')
  check(read()['doors']['stories']['cases']['ledger']['stage']==3,'Cellar evidence route progresses through real stairs and archive')
  drive(-107.5,20);act('up:residence-home-0');drive(-107.5,26);act('up:residence-home-0');drive(-104.5,22);act('story:ledger','theft')
  check(read()['doors']['stories']['cases']['ledger']['stage']==3,'Unsupported accusation is rejected without advancing the story')
  act('story:ledger','shared-work');drive(-107.5,26);act('up:residence-home-0');drive(-104.5,22);act('story:ledger','shared');drive(-107.5,20);act('down:residence-home-0');drive(-107.5,20);act('down:residence-home-0');drive(-103,25.5)
  check(read()['render']['doors']['stories']['ledger']=='shared' and read()['render']['doors']['stories']['ledgerVisible'],'Peaceful shared-work ending displays the neighborhood lending shelf')
  before=read()['credits'];act('story:ledger','report');check(read()['credits']==before+55 and read()['doors']['stories']['cases']['ledger']['stage']==6,'Second story completes with its one-time return reward');page.screenshot(path=str(OUT/'lending-shelf.png'))
  check(read()['doors']['defeated']==[],'Both new cases can complete without defeating a rival')
  check(not any(e['type'].startswith('story') for e in read()['events']),'Story progress adds no automatic sound event stream')
  press(9);saved=page.evaluate('localStorage.getItem("svgn.leonardos-guild.v1")');check(json.loads(saved)['doors']['stories']['cases']['ledger']['stage']==6,'Both stories are saved in the existing adventure save')
  money=read()['credits'];page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(4);press(0)
  check(read()['doors']['stories']['cases']['lamplighter']['resolution']=='amber' and read()['doors']['stories']['cases']['ledger']['resolution']=='shared','Actual reload preserves both selected world outcomes')
  check(read()['credits']==money,'Reload cannot replay story payments');check(read()['mission']==0 and not read()['relay'],'New stories do not grant original mission or gate progression')
  check(read()['audio']['musicVoices']<=1 and read()['audio']['preferences']['density']=='quiet','Quiet single-track audio survives the story journey and reload')
  check(not errors,'No runtime JavaScript errors during the two-case Console journey')
 finally:
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'state':page.evaluate('window.LeonardoGuild?.inspect()'),'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'input':'Fresh save. Only a virtual standard Xbox Gamepad API input object is injected. Default Console profile for all movement and UI. No mouse, keyboard, programmatic focus, actor/quest/clock/currency writes. Roof lamp and cellar ledger paths are native; other routes/endings are explicitly model fixtures.'},indent=2));page.screenshot(path=str(OUT/'last-state.png'));browser.close()
