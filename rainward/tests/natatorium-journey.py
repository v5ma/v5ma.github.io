"""Normal-start Natatorium journey with virtual standard Xbox input only.
Read-only route guidance is permitted; no runtime state/clock mutations, grants,
invulnerability, enemy removal or fixture checkpoints are used.
"""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path(os.getenv('RAINWARD_JOURNEY_OUT','test-output/rainward-natatorium-journey'));OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
PROFILE=os.getenv('RAINWARD_PRESET','survival')
checks,errors,console,dialogs,route_log=[],[],[],[],[]
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
PAD="""
localStorage.setItem('svgn.rainward.v1.freefield',JSON.stringify({freeStride:false,xrLayout:'legacy',pinnedXR:true,footsteps:100,waterVolume:100,score:'legacy'}));localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:PROFILE,mute:true,low:true,scanned:false,cinematic:false,detailedHumans:false,rainFilm:true,toggleSprint:false}));
window.pad={connected:true,mapping:'standard',index:0,id:'Natatorium virtual Xbox',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
window.padPolls=0;window.padPulse=[];
Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;const buttons=pad.buttons.map(b=>({...b}));for(const i of padPulse)buttons[i]={pressed:true,value:1};padPulse=[];return pad.connected?[{...pad,axes:[...pad.axes],buttons}]:[];}});
""".replace('PROFILE',json.dumps(PROFILE))
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw)
 context=browser.new_context(viewport={'width':960,'height':640},service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':960,'height':640})
 context.add_init_script(PAD);page=context.new_page();page.set_default_timeout(60000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
 def wait(q,timeout=60000):page.wait_for_function(q,timeout=timeout)
 def frames(n=2):
  before=page.evaluate('padPolls');page.wait_for_function('([x,n])=>padPolls>=x+n',arg=[before,n])
 def pulse(*buttons):
  frames();page.evaluate('(buttons)=>window.padPulse=buttons',list(buttons));frames(3)
 def held(i,on):page.evaluate('([i,on])=>pad.buttons[i]={pressed:on,value:on?1:0}',[i,on])
 def hold(i,condition):
  frames();held(i,True)
  try:wait(condition)
  finally:held(i,False)
  frames(2)
 def nav(target):
  for _ in range(90):
   if page.evaluate('document.activeElement?.id')==target:return
   pulse(13)
  raise AssertionError('Controller cannot reach '+target)
 def snap():return page.evaluate('Rainward.snapshot()')
 def record(label):
  state=snap();route_log.append({'label':label,'snapshot':state});(OUT/'progress.json').write_text(json.dumps(route_log,indent=2))
  print(label,json.dumps({'p':{k:state['player'].get(k) for k in ['x','z','hp','oxygen','mag','reserve','stance']},'enemies':[(e['id'],e['hp'],e['state']) for e in state['enemies']]}),flush=True)
 def capture(name):page.screenshot(path=str(OUT/(name+'.png')))
 def go(x,z,sprint=False):
  print('GO',x,z,flush=True)
  page.evaluate('''async ({x,z,sprint})=>{
   const W=await import('./world.mjs'),p=Rainward.state.player;
   const route=W.findPath(p,{x,z});if(!route.length&&Math.hypot(p.x-x,p.z-z)>2)throw Error('No route');route.push({x,z});
   await new Promise((resolve,reject)=>{let i=0;const start=performance.now();
    const stop=()=>{pad.axes[0]=pad.axes[1]=0;pad.buttons[10]={pressed:false,value:0};clearInterval(timer);};
    const timer=setInterval(()=>{const p=Rainward.state.player;
     if(Rainward.mode!=='play'||performance.now()-start>150000){stop();reject(Error('Travel interrupted '+JSON.stringify({x:p.x,z:p.z,hp:p.hp,mode:Rainward.mode,goal:route[i]})));return;}
     const q=route[i],dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);
     if(d<.4){if(++i===route.length){stop();resolve();}return;}
     const yaw=Rainward.view.yaw,scale=Math.min(1,Math.max(.45,d*1.2));
     pad.axes[0]=(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*scale;
     pad.axes[1]=(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*scale;
     pad.buttons[10]={pressed:sprint,value:sprint?1:0};
    },20);
   });
  }''',{'x':x,'z':z,'sprint':sprint})
  frames(2);record('arrive '+str((x,z)))
 def fight(enemy_id):
  # Read-only projection guidance drives ordinary sticks, LT, RT and reload.
  # Hits, cooldown, damage, finite ammunition and enemy attacks remain real.
  page.evaluate('''async ({id})=>{
   const W=await import('./world.mjs');
   await new Promise((resolve,reject)=>{const start=performance.now();let reloadPending=false;
    const stop=()=>{pad.axes[2]=pad.axes[3]=0;for(const i of [6,7])pad.buttons[i]={pressed:false,value:0};clearInterval(timer);};
    const axis=e=>Math.abs(e)<.012?0:Math.sign(e)*Math.min(.8,Math.max(.26,Math.abs(e)*3));
    const timer=setInterval(()=>{const s=Rainward.state,p=s.player,e=s.enemies.find(e=>e.id===id);
     if(!e||e.hp<=0){stop();resolve();return;}
     if(Rainward.mode!=='play'||performance.now()-start>55000){stop();reject(Error('Combat interrupted '+JSON.stringify({hp:p.hp,enemy:e.hp,ammo:p.mag,reserve:p.reserve,view:Rainward.view})));return;}
     const q=Rainward.project(e.x,W.heightAt(e.x,e.z)+1.1,e.z),desired=Math.atan2(-(e.x-p.x),-(e.z-p.z)),error=Math.atan2(Math.sin(desired-Rainward.view.yaw),Math.cos(desired-Rainward.view.yaw));
     pad.buttons[6]={pressed:true,value:1};
     pad.axes[2]=Math.abs(error)>.65?-Math.sign(error)*.8:axis(q.x-.5);
     pad.axes[3]=Math.abs(error)>.65?0:axis(q.y-.5);
     const aligned=q.visible&&Math.abs(q.x-.5)<.035&&Math.abs(q.y-.5)<.035;
     pad.buttons[7]={pressed:aligned&&p.mag>0,value:aligned&&p.mag>0?1:0};
     if(!p.mag&&!p.reload&&!reloadPending){if(!p.reserve){stop();reject(Error('Finite ammunition exhausted'));return;}padPulse=[2];reloadPending=true;}
     if(p.reload||p.mag)reloadPending=false;
    },20);
   });
  }''',{'id':enemy_id});frames(3);record('combat '+enemy_id)
  check(page.evaluate('(id)=>Rainward.state.enemies.find(e=>e.id===id).hp<=0',enemy_id),'LT, right stick and RT defeat the pump sentinel using finite authored ammunition')
  reserve=page.evaluate('Rainward.state.player.reserve');missing=6-page.evaluate('Rainward.state.player.mag')
  held(6,True);pulse(2);held(6,False);wait('Rainward.state.player.reload===0&&Rainward.state.player.mag===6')
  check(page.evaluate('Rainward.state.player.reserve')==reserve-missing,'The selected preset reloads its remaining finite sidearm reserve')
 def use(condition=None):
  pulse(3)
  if condition:wait(condition)
 def dive():
  if PROFILE=='survival':hold(1,'Rainward.state.player.submerged')
  else:pulse(1);wait('Rainward.state.player.submerged')
 try:
  page.goto(BASE+'/rainward/?chapter=natatorium',wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2')
  check(page.locator('#chapter-select option').count()==7,'All seven expeditions remain available')
  check(page.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")&&!localStorage.getItem("svgn.rainward.v2.chapter-checkpoints")'),'No checkpoint fixture is installed')
  nav('start');pulse(0);wait('Rainward.mode==="play"&&Rainward.state.level==="natatorium"')
  initial=snap();check(initial['player']['hp']==100 and all(e['hp']>0 for e in initial['enemies']) and len(initial['enemies'])==6,'The normal lobby start retains all six living authored enemies')
  record('normal-start');capture('01-normal-start')
  go(2,47);use('Rainward.state.taken.has("natatorium-kit")')
  check(page.evaluate('Rainward.state.player.cloth===3&&Rainward.state.player.canister===3'),'Y collects only the authored emergency bag')
  go(3,29);go(15,23.5);use('Rainward.state.checkpoint==="natatorium-deck"')
  go(15,18);check(page.evaluate('Rainward.state.player.waterMode==="swim"'),'Left stick movement enters the competition pool')
  wait('document.querySelector("#water-control").textContent.includes("DIVE")');check(page.locator('#water-control').inner_text()==('HOLD B' if PROFILE=='survival' else 'B')+' DIVE / GEAR STOWED','The surface HUD matches the active preset dive gesture')
  dive();check(page.evaluate('Rainward.state.player.submerged'),'The preset dive gesture works in live-enemy play')
  go(15,-13,True);use('Rainward.state.objectives.cell')
  check(page.evaluate('Rainward.state.player.submerged&&Rainward.state.taken.has("natatorium-fuse")'),'Y physically recovers the submerged filtration fuse')
  wait('Rainward.state.player.oxygen<24');wait('document.querySelector("#aquatic-hud").classList.contains("low-air")');check('Press A' in page.locator('#water-warning').inner_text(),'Low air displays a textual Xbox surface warning during the real mission')
  capture('02-submerged-fuse');pulse(0);wait('!Rainward.state.player.submerged');wait('Rainward.state.player.oxygen>99');check(True,'A surfaces and natural breathing replenishes oxygen')
  go(15,-23,True);go(3,-25,True);go(-33,-38,True)
  use('Rainward.state.puzzle.clueRead');check(True,'Y records the physical circulation schematic');capture('03-pump-approach')
  go(-39,-42);fight('nat-pump-sentinel');use('Rainward.state.puzzle.wheels[0]===1');use('Rainward.state.puzzle.wheels[0]===2')
  go(-39,-58,True);use('Rainward.state.puzzle.solved')
  go(-35,-63,True);use('Rainward.state.objectives.crank')
  go(-33,-56,True);use('Rainward.state.completedTasks.includes("nat-circulation")')
  go(-36,-54);use('Rainward.state.checkpoint==="natatorium-pump"');record('pump-work-complete');capture('04-circulation-complete')
  go(-25,-50,True);go(-20,-50,True);go(0,-64,True);use('Rainward.state.completedTasks.includes("nat-lift-signal")')
  go(0,-78,True);use('Rainward.mode==="won"')
  final=snap();check(final['objectives']=={'cell':True,'crank':True} and final['puzzle']['solved'] and {'nat-circulation','nat-lift-signal'}<=set(final['completedTasks']),'Both components, physical puzzle and required field tasks precede actual extraction')
  capture('05-extraction');record('extracted');check(not errors and not dialogs,'No uncaught errors or blocking browser dialogs occur')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'profile':PROFILE,'initial':initial,'final':final,'errors':errors,'console':console,'dialogs':dialogs,'scope':'Normal fresh start, six living authored enemies, real HTTP/WebGL, virtual standard Xbox buttons/sticks with read-only route/projection guidance. No player/enemy/clock mutations or resource grants. Not physical controller or target-hardware performance evidence.'},indent=2))
 except Exception as error:
  data={'error':str(error),'checks':checks,'errors':errors,'console':console,'dialogs':dialogs}
  try:data['snapshot']=snap();data['focus']=page.evaluate('document.activeElement?.id');capture('failure')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:context.close();browser.close()
