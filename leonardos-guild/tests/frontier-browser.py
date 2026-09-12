"""Fresh native Cinder Hollow journey using only a virtual standard Xbox pad.
No keyboard, pointer, programmatic focus, actor/progression/currency writes, or
teleport fixtures. Model tests cover alternate contracts and resource routes.
"""
from pathlib import Path
import os,json,math,time,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'frontier-output';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];last_axes=[0,0,0,0]
def check(v,t): assert v,t;checks.append(t);print('PASS:',t,flush=True)
def read(): return page.evaluate('LeonardoGuild.inspect()')
def frames(n=3): page.evaluate('(n)=>new Promise(r=>{let i=0;function f(){if(++i>=n)r();else requestAnimationFrame(f)}requestAnimationFrame(f)})',n)
def setpad(buttons=None,axes=None):
 global last_axes
 if axes is not None:last_axes=axes
 page.evaluate('(v)=>{__testPad.axes=v.a;__testPad.buttons=Array.from({length:17},(_,i)=>({pressed:v.b.includes(i),touched:v.b.includes(i),value:v.b.includes(i)?1:0}))}',{'a':last_axes,'b':buttons or []})
def press(b):
 page.evaluate('(b)=>new Promise(r=>{let make=x=>Array.from({length:17},(_,i)=>({pressed:i===x,touched:i===x,value:i===x?1:0}));__testPad.buttons=make(b);requestAnimationFrame(()=>{__testPad.buttons=make(-1);requestAnimationFrame(()=>requestAnimationFrame(r))})})',b)
def neutral(): setpad([], [0,0,0,0]);frames(5)
def close(): press(1);frames(3)
def ui_select(selector,click=True):
 for _ in range(5):
  result=page.evaluate('''(s)=>{const t=document.querySelector(s),c=document.activeElement,r=c?.closest('dialog[open]')||document.querySelector('#menu');if(!t||!r)return {e:'missing'};const vis=e=>e.getClientRects().length&&!e.closest('[hidden]');const a=[...r.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(vis);let start=a.indexOf(c),goal=a.indexOf(t);if(start<0||goal<0)return {e:'focus'};let rect=a.map(e=>e.getBoundingClientRect());function n(i,d){const h=d===14||d===15,sg=d===12||d===14?-1:1,A=rect[i],cx=A.x+A.width/2,cy=A.y+A.height/2;let best=-1,score=1e9;for(let j=0;j<a.length;j++){if(i===j)continue;let q=rect[j],dx=q.x+q.width/2-cx,dy=q.y+q.height/2-cy,f=(h?dx:dy)*sg,side=Math.abs(h?dy:dx);if(f<4)continue;let z=f+side*2.8;if(z<score){score=z;best=j}}return best<0?(i+sg+a.length)%a.length:best}let q=[[start,[]]],seen=new Set([start]);while(q.length){let [i,p]=q.shift();if(i===goal)return {p};for(const d of[13,12,15,14]){let j=n(i,d);if(!seen.has(j)){seen.add(j);q.push([j,[...p,d]])}}}return {e:'route'}}''',selector)
  if 'e' in result: raise AssertionError(selector+' '+str(result))
  for b in result['p']: press(b)
  if page.evaluate('(s)=>document.activeElement===document.querySelector(s)',selector):
   if click:press(0)
   return
 raise AssertionError('focus failed '+selector)
def drive(x,z,radius=.8,limit=90):
 start=time.monotonic()
 while time.monotonic()-start<limit:
  s=read();assert s['running'];dx=x-s['x'];dz=z-s['z'];d=math.hypot(dx,dz)
  if d<radius: neutral();page.wait_for_function('Math.abs(LeonardoGuild.inspect().speed)<.55',timeout=10000);return
  desired=math.atan2(dx,dz);heading=s['render']['heading'];a=(desired-heading+math.pi)%(2*math.pi)-math.pi;strength=min(.9,.34+d*.1)
  setpad([],[-math.sin(a)*strength,-math.cos(a)*strength,0,0]);frames(3)
 raise AssertionError('drive '+str((x,z))+' '+json.dumps(read()))
def wheel(index):
 setpad([4],[0,0,0,0]);page.wait_for_function('LeonardoGuild.inspect().console.wheel==="tools"')
 angle=index/4*math.pi*2;setpad([4],[0,0,math.sin(angle),-math.cos(angle)]);frames(5);setpad([],[0,0,math.sin(angle),-math.cos(angle)]);frames(5);neutral()
with sync_playwright() as p:
 opt={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'): opt['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opt);ctx=b.new_context(viewport={'width':1280,'height':800},service_workers='block')
 ctx.add_init_script("window.__testPad={id:'Xbox 360 Controller (STANDARD GAMEPAD)',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__testPad]})")
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:(_ for _ in ()).throw(AssertionError('blocking dialog '+d.message)))
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(4)
  check(read()['version']=='0.11.0','Borderlands v0.11.0 loads the existing game')
  check(read()['frontier']['zone']=='town','Fresh save begins in safe Vinci')
  press(0);page.wait_for_function('LeonardoGuild.inspect().running');press(3);check(read()['mode']=='foot','Y dismounts before an expedition')
  drive(0,-17);press(2);page.wait_for_selector('#frontier-dialog[open]');check('SAFE TOWN' in page.locator('.region-rule').inner_text(),'Town gate explicitly identifies Vinci as safe')
  page.screenshot(path=str(OUT/'safe-town-gate.png'));ui_select('[data-frontier-action="enter"]');page.wait_for_function('LeonardoGuild.inspect().frontier.zone==="badlands"')
  s=read();check(s['render']['frontier']['active'] and s['render']['frontier']['monsterModels']==7,'Cinder Hollow renders seven frontier creature models')
  check(math.hypot(s['x']-300,s['z']-20)<1,'The explicit gate arrives at Gate Camp, not a map teleport destination')
  check('SANCTUARY' in page.locator('#region-badge').inner_text(),'Gate Camp visibly identifies its sanctuary rule');page.screenshot(path=str(OUT/'gate-camp.png'))
  # Map uses the connected local route graph.
  press(8);page.wait_for_selector('#map-dialog[open]');page.screenshot(path=str(OUT/'badlands-map.png'));close()
  wheel(1);check(read()['resonance']['tool']=='sling','LB/right-stick equipment wheel equips the sling in the badlands')
  drive(300,54);setpad([6],[0,0,0,0]);page.wait_for_function('LeonardoGuild.inspect().resonance.lock==="hollow-scout"');check(True,'LT locks only onto the visible frontier sentinel')
  setpad([6,7],[0,0,0,0]);page.wait_for_function('LeonardoGuild.inspect().frontier.defeated.includes("hollow-scout")',timeout=12000);neutral();s=read()
  check(s['frontier']['cargo']['ore']>=1,'Defeating the sentinel places bounded salvage in field cargo');page.screenshot(path=str(OUT/'frontier-combat.png'))
  drive(262,50);drive(238,77);press(2);page.wait_for_selector('#frontier-dialog[open]');ui_select('[data-frontier-action="site:ridge"]');close();check('ridge' in read()['frontier']['visited'],'X records the physical ridge survey site');page.screenshot(path=str(OUT/'ridge-survey.png'))
  drive(262,50);drive(300,43);drive(300,20);press(2);page.wait_for_selector('#frontier-dialog[open]');ui_select('[data-frontier-action="return"]');page.wait_for_function('LeonardoGuild.inspect().frontier.zone==="town"')
  s=read();check(s['frontier']['defeated']==['hollow-scout'] and s['frontier']['visited']==['ridge'],'Returning to Vinci keeps earned badlands progress')
  check('SAFE TOWN' in page.locator('#region-badge').inner_text(),'Return restores the safe-town region rule');page.screenshot(path=str(OUT/'safe-return.png'))
  # Save/reload deliberately resumes in town while retaining expedition results.
  press(9);raw=page.evaluate('localStorage.getItem("svgn.leonardos-guild.v1")');assert raw;page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');frames(4);press(0);r=read()
  check(r['frontier']['zone']=='town' and 'hollow-scout' in r['frontier']['defeated'] and 'ridge' in r['frontier']['visited'],'Reload resumes safely in town with expedition progress retained')
  check(r['audio']['preferences']['density']=='quiet' and r['audio']['musicVoices']<=1,'Quiet single-stream audio remains intact')
  check(not errors,'No uncaught JavaScript errors in the frontier controller journey')
 finally:
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'state':page.evaluate('window.LeonardoGuild?.inspect()'),'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'input':'Fresh storage. Virtual standard Xbox Gamepad API input only. No mouse, keyboard, programmatic focus, actor/progression/currency writes, or teleport fixtures.'},indent=2));page.screenshot(path=str(OUT/'last-state.png'));b.close()
