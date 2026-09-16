"""Normal-start Floodgate journey. Read-only route/health guidance writes only
virtual Xbox buttons/sticks. No planted save, actor writes, grants or clock edits.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-freight-cut');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks,errors,console,dialogs,trace=[],[],[],[],[]
def check(value,label):
 assert value,label
 checks.append(label);print('PASS',label,flush=True)
PAD="""
localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:'classic',mute:true,low:true,scanned:false,cinematic:false,detailedHumans:false,toggleSprint:false}));
window.pad={connected:true,mapping:'standard',index:0,id:'Freight Cut virtual Xbox',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
window.padPolls=0;window.padPulse=[];
Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;const buttons=pad.buttons.map(b=>({...b}));for(const i of padPulse)buttons[i]={pressed:true,value:1};padPulse=[];return [{...pad,axes:[...pad.axes],buttons}];}});
"""
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);context=browser.new_context(viewport={'width':960,'height':640},service_workers='block',record_video_dir=str(OUT/'video'))
 context.add_init_script(PAD);page=context.new_page();page.set_default_timeout(90000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
 def wait(q):page.wait_for_function(q)
 def frames(n=3):
  old=page.evaluate('padPolls');page.wait_for_function('([old,n])=>padPolls>=old+n',arg=[old,n])
 def pulse(i):frames();page.evaluate('(i)=>padPulse=[i]',i);frames()
 def nav(target):
  for _ in range(100):
   if page.evaluate('document.activeElement?.id')==target:return
   pulse(13)
  raise AssertionError('Unreachable Xbox control: '+target)
 def snap():return page.evaluate('Rainward.snapshot()')
 def record(label):
  s=snap();trace.append({'label':label,'snapshot':s});(OUT/'trace.json').write_text(json.dumps(trace,indent=2));print(label,'hp',s['player']['hp'],'time',s['stats']['seconds'],flush=True)
 def capture(name):page.screenshot(path=str(OUT/(name+'.png')))
 def picture(name):pulse(9);wait('Rainward.mode==="pause"');capture(name);pulse(1);wait('Rainward.mode==="play"')
 def use(q):pulse(3);wait(q)
 def craft(item):
  pulse(13);wait('Rainward.mode==="pack"');nav('craft-'+('med' if item=='medkit' else 'smoke'));before=page.evaluate('(item)=>Rainward.state.player[item]',item);pulse(0);page.wait_for_function('([item,before])=>Rainward.state.player[item]===before+1&&!Rainward.state.player.craft',arg=[item,before]);pulse(1);wait('Rainward.mode==="play"')
 def go(x,z,sprint=False):
  page.evaluate('''async ({x,z,sprint})=>{
   const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});route.push({x,z});
   await new Promise((resolve,reject)=>{let i=0;const start=performance.now();
    const stop=()=>{pad.axes[0]=pad.axes[1]=0;pad.buttons[10]={pressed:false,value:0};clearInterval(timer);};
    const timer=setInterval(()=>{const p=Rainward.state.player;
     if(Rainward.mode!=='play'||performance.now()-start>150000){stop();reject(Error('Travel interrupted '+JSON.stringify({x:p.x,z:p.z,hp:p.hp,mode:Rainward.mode,goal:route[i]})));return;}
     if(p.hp<60&&p.medkit>0&&padPulse.length===0)padPulse=[12];
     const q=route[i],dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<.4){if(++i===route.length){stop();resolve();}return;}
     const yaw=Rainward.view.yaw,scale=Math.min(1,Math.max(.45,d*1.2));pad.axes[0]=(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*scale;pad.axes[1]=(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*scale;pad.buttons[10]={pressed:sprint,value:sprint?1:0};
    },20);
   });
  }''',{'x':x,'z':z,'sprint':sprint});frames(2);record('arrive '+str((x,z)))
 try:
  page.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2')
  check(page.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")'),'No planted checkpoint initializes this journey before the normal Start action')
  nav('start');pulse(0);wait('Rainward.mode==="play"')
  check(page.evaluate('Rainward.state.level==="district"&&Rainward.state.enemies.length===5&&Rainward.state.enemies.every(e=>e.hp>0)'),'Normal Floodgate start retains all five living enemies')
  initial_save=json.loads(page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")'))
  check(initial_save['version']==4 and initial_save['checkpoint']=='start' and not initial_save['taken'] and not initial_save['completedTasks'],'Start creates only the genuine empty initial shelter checkpoint')
  check(page.evaluate('Rainward.snapshot().visuals.freightCut.open')==False,'The new loading passage is visibly sealed before its real receiver repair')
  record('arrival');go(1.3,25.5);use('Rainward.state.taken.has("rations")');craft('medkit');craft('smoke')
  check(page.evaluate('Rainward.state.player.medkit===1&&Rainward.state.player.smoke===1&&Rainward.state.player.cloth===0&&Rainward.state.player.canister===0'),'Preparation spends the original finite rations on one medkit and one smoke')
  go(-13,23,True);pulse(1);wait('Rainward.state.player.stance==="crouch"');go(-19,16);go(-19,7);pulse(1);wait('Rainward.state.player.stance==="stand"')
  go(-24,5);use('Rainward.state.taken.has("clinic-kit")');go(-22,-3.5);use('Rainward.state.objectives.cell');go(-24,-1);use('Rainward.state.checkpoint==="clinic"')
  old_save=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');(OUT/'earned-clinic-before.json').write_text(old_save)
  check(not json.loads(old_save)['completedTasks'],'The earned clinic checkpoint precedes both optional shortcut repairs')
  craft('medkit');check(page.evaluate('Rainward.state.player.medkit===2&&Rainward.state.player.cloth===1&&Rainward.state.player.canister===0'),'The clinic recovery beat converts earned materials into a second finite medkit before commitment')
  go(-22,-3.5,True);go(-22,-10,True);check(page.evaluate('Rainward.state.player.y>2.3'),'The real clinic ascent gives a market observation position')
  picture('01-terrace-before-crossing');go(-8,-10,True);go(0,-8,True);go(10,-10,True);go(18,-11,True)
  reserve=page.evaluate('Rainward.state.player.reserve');salvage=page.evaluate('Rainward.state.player.canister')
  use('Rainward.state.completedTasks.includes("ward-radio")');wait('Rainward.snapshot().visuals.freightCut.open')
  check(page.evaluate('Rainward.state.player.reserve')==min(36,reserve+4) and page.evaluate('Rainward.state.player.canister')==min(12,salvage+2),'The existing local receiver task opens the loading passage with its unchanged one-time reward')
  check(page.evaluate('Rainward.state.hint.includes("WEST LOADING OPEN")'),'Receiver feedback explains the new passage and the pursuit risk')
  go(16.2,-14,True);pulse(1);wait('Rainward.state.player.stance==="crouch"');go(16.2,-18);go(16.2,-22)
  check(page.evaluate('Rainward.state.player.hp>0&&Rainward.state.enemies.every(e=>e.hp>0)'),'The slower crouch-cover aisle provides a viable recovery state with every original threat still active')
  go(17,-26,True);go(22.3,-26.7,True);use('Rainward.state.objectives.crank');pulse(1);wait('Rainward.state.player.stance==="stand"')
  record('spindle-recovered');go(17,-26,True);smoke=page.evaluate('Rainward.state.player.smoke');pulse(14);wait('Rainward.state.player.smoke<'+str(smoke))
  check(page.evaluate('Rainward.state.smokes.length>0'),'A real finite smoke screens the retreat; no enemies or detection rules are removed')
  go(17,-24,True);start=page.evaluate('({t:Rainward.state.t,x:Rainward.state.player.x,z:Rainward.state.player.z})');go(11,-24,True)
  crossing=page.evaluate('({t:Rainward.state.t,x:Rainward.state.player.x,z:Rainward.state.player.z,hp:Rainward.state.player.hp})');(OUT/'native-crossing.json').write_text(json.dumps({'start':start,'end':crossing,'input':'virtual Xbox; sprint subject to finite stamina'},indent=2))
  check(crossing['x']<12 and abs(crossing['z']+24)<.7,'Xbox movement physically crosses the powered west aperture from spindle aisle to sorting yard')
  go(9,-21,True);go(-4,-23,True);go(-8,-10,True);go(-22,-10,True);go(-22,-3.5,True);go(-24,-1,True);use('JSON.parse(localStorage.getItem("svgn.rainward.v1.checkpoint")).objectives.crank')
  saved=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');assert 'ward-radio' in json.loads(saved)['completedTasks'];(OUT/'earned-clinic-after.json').write_text(saved)
  check(json.loads(saved)['objectives']=={'cell':True,'crank':True} and json.loads(saved)['version']==4,'The genuine recovery shelter saves both components and the new passage in the existing schema')
  check(page.evaluate('Rainward.state.stats.escapes>0'),'Breaking sight and repositioning produces an actual search recovery, not just theoretical connectivity')
  if page.evaluate('Rainward.state.player.cloth>0&&Rainward.state.player.canister>0'):craft('medkit')
  go(-24,5,True);go(-26.1,5.8,True);use('Rainward.state.completedTasks.includes("ward-service-latch")')
  go(-30,5.8,True);go(-31,11,True);go(-31,-15,True);go(-27,-24,True);go(-18,-26,True);go(-18,-42,True);go(0,-43,True);use('Rainward.mode==="won"')
  final=snap();check(final['player']['hp']>0 and all(e['hp']>0 for e in final['enemies']),'The complete earned route reaches extraction while every original enemy remains alive')
  check(final['stats']['shots']==0 and final['stats']['takedowns']==0,'Observation, finite supplies and recovery suffice without mandatory combat kills')
  capture('02-extracted');record('mastered-return')
  page.reload(wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2');nav('continue');pulse(0);wait('Rainward.mode==="play"');wait('Rainward.snapshot().visuals.freightCut.open')
  check(page.evaluate('Rainward.state.objectives.cell&&Rainward.state.objectives.crank&&Rainward.state.checkpoint==="clinic"'),'A real browser reload restores the earned clinic checkpoint and powered passage')
  check(not errors and not console and not dialogs,'No captured browser errors, shader errors or blocking dialogs')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'dialogs':dialogs,'final':final,'crossing':{'start':start,'end':crossing},'scope':'Normal-start living-enemy Floodgate journey; real HTTP/WebGL with virtual Xbox Classic buttons/sticks and read-only path/health guidance. No state assignments, grants, invulnerability, enemy removal, clock edits or planted save. Earned shelter saves are captured for genuine reload acceptance. Not human-player pacing or physical Xbox/Quest approval.'},indent=2))
 except Exception as error:
  data={'error':str(error),'checks':checks,'errors':errors,'console':console,'dialogs':dialogs}
  try:data['snapshot']=snap();data['focus']=page.evaluate('document.activeElement?.id');capture('failure')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:context.close();browser.close()
