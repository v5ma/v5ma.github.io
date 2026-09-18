"""Normal-start Floodgate journey through real virtual Xbox inputs.
Read-only path, health and threat guidance is synthetic assistance, not human
reaction evidence. No planted save, actor writes, grants or clock edits.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path(os.getenv('EVIDENCE_DIR','test-output/rainward-freight-cut'));OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks,errors,console,dialogs,trace=[],[],[],[],[]
def check(value,label):
 assert value,label
 checks.append(label);print('PASS',label,flush=True)
PAD="""
localStorage.setItem('svgn.rainward.v1.freefield',JSON.stringify({freeStride:false,xrLayout:'legacy',pinnedXR:true,footsteps:100,waterVolume:100,score:'legacy'}));localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:'classic',mute:true,low:true,scanned:false,cinematic:false,detailedHumans:false,toggleSprint:false}));
window.pad={connected:true,mapping:'standard',index:0,id:'Freight Cut virtual Xbox',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
window.padPolls=0;window.padPulse=[];window.padRecoveryInputs=[];window.padBreakawayInputs=[];window.padAllowRecovery=false;
Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;const buttons=pad.buttons.map(b=>({...b}));for(const i of padPulse)buttons[i]={pressed:true,value:1};padPulse=[];return [{...pad,axes:[...pad.axes],buttons}];}});
"""
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);context=browser.new_context(viewport={'width':960,'height':640},service_workers='block',record_video_dir=str(OUT/'video'))
 context.add_init_script(PAD);page=context.new_page();page.set_default_timeout(90000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
 def wait(q):page.wait_for_function(q)
 def frames(n=2):
  old=page.evaluate('padPolls');page.wait_for_function('([old,n])=>padPolls>=old+n',arg=[old,n])
 def neutral():
  # Preserve production neutral-arming safety after every mode transition.
  page.evaluate('pad.axes=[0,0,0,0];pad.buttons.forEach(b=>{b.pressed=false;b.value=0});padPulse=[]');frames(2)
 def pulse(i):neutral();page.evaluate('(i)=>padPulse=[i]',i);frames()
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
 def heal_now(label):
  before=page.evaluate('({hp:Rainward.state.player.hp,medkit:Rainward.state.player.medkit,heals:Rainward.state.events.filter(e=>e.type==="heal").length})')
  assert before['hp']<100 and before['medkit']>0,(label,before)
  pulse(12);page.wait_for_function('(b)=>Rainward.state.player.medkit===b.medkit-1&&Rainward.state.events.filter(e=>e.type==="heal").length>b.heals',arg=before)
  after=page.evaluate('({hp:Rainward.state.player.hp,medkit:Rainward.state.player.medkit})')
  check(after['hp']>before['hp'] and after['medkit']==before['medkit']-1,label+' spends one earned Classic D-pad-up medkit and restores health')
 def recover_if_needed(label,threshold=45):
  state=page.evaluate('({hp:Rainward.state.player.hp,medkit:Rainward.state.player.medkit})')
  if state['hp']<=min(threshold,45) and state['medkit']>0:heal_now(label);return True
  return False
 def go(x,z,sprint=False,breakaway=False):
  neutral()
  page.evaluate('''async ({x,z,sprint,breakaway})=>{
   const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});route.push({x,z});
   await new Promise((resolve,reject)=>{let i=0;const start=performance.now();
    const stop=()=>{pad.axes[0]=pad.axes[1]=0;pad.buttons[10]={pressed:false,value:0};clearInterval(timer);};
    let lastHeal=-Infinity,standRequested=false;
    const timer=setInterval(()=>{const p=Rainward.state.player;
     // Only a pursuer INSIDE the narrow aisle is a close same-lane flank.
     // A watcher outside the west wall or east of the screen is not one.
     if(breakaway&&!standRequested&&p.x<17.4&&p.stance==='crouch'&&Rainward.state.enemies.some(e=>e.hp>0&&e.x>14.8&&e.x<17.4&&e.seen&&e.state==='chase')){standRequested=true;padPulse.push(1);padBreakawayInputs.push({t:Rainward.state.t,hp:p.hp,stamina:p.stamina,button:1,goal:{x,z}});}
     if(window.padAllowRecovery&&p.hp>0&&p.hp<=45&&p.medkit>0&&!p.craft&&performance.now()-lastHeal>500){padPulse.push(12);lastHeal=performance.now();padRecoveryInputs.push({t:Rainward.state.t,hp:p.hp,medkits:p.medkit,button:12,goal:{x,z}});}
     if(Rainward.mode!=='play'||performance.now()-start>150000){stop();reject(Error('Travel interrupted '+JSON.stringify({x:p.x,z:p.z,hp:p.hp,mode:Rainward.mode,goal:route[i]})));return;}
     const q=route[i],dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<.4){if(++i===route.length){stop();resolve();}return;}
     const yaw=Rainward.view.yaw,scale=Math.min(1,Math.max(.45,d*1.2));pad.axes[0]=(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*scale;pad.axes[1]=(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*scale;const run=sprint||(breakaway&&p.stance==='stand');pad.buttons[10]={pressed:run,value:run?1:0};
    },20);
   });
  }''',{'x':x,'z':z,'sprint':sprint,'breakaway':breakaway});frames(2);record('arrive '+str((x,z)))
 try:
  page.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2')
  check(page.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")'),'No planted checkpoint initializes the journey before Start')
  nav('start');pulse(0);wait('Rainward.mode==="play"')
  check(page.evaluate('Rainward.state.level==="district"&&Rainward.state.enemies.length===5&&Rainward.state.enemies.every(e=>e.hp>0)'),'Normal Floodgate start retains all five living enemies')
  initial_save=json.loads(page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")'))
  check(initial_save['version']==4 and initial_save['checkpoint']=='start' and not initial_save['taken'] and not initial_save['completedTasks'],'Start creates only the genuine empty initial shelter checkpoint')
  check(page.evaluate('Rainward.snapshot().visuals.freightCut.open')==False,'The loading passage is visibly sealed before receiver repair')
  record('arrival');go(1.3,25.5);use('Rainward.state.taken.has("rations")');craft('medkit');craft('smoke')
  check(page.evaluate('Rainward.state.player.medkit===1&&Rainward.state.player.smoke===1&&Rainward.state.player.cloth===0&&Rainward.state.player.canister===0'),'Original finite rations prepare one medkit and one smoke')
  go(-13,23,True);pulse(1);wait('Rainward.state.player.stance==="crouch"');go(-19,16);go(-19,7);pulse(1);wait('Rainward.state.player.stance==="stand"')
  go(-24,5);use('Rainward.state.taken.has("clinic-kit")');go(-22,-3.5);use('Rainward.state.objectives.cell');go(-24,-1);use('Rainward.state.checkpoint==="clinic"')
  old_save=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');(OUT/'earned-clinic-before.json').write_text(old_save)
  check(not json.loads(old_save)['completedTasks'],'The earned clinic checkpoint precedes both optional shortcut repairs')
  craft('medkit');check(page.evaluate('Rainward.state.player.medkit===2&&Rainward.state.player.smoke===1&&Rainward.state.player.cloth===1&&Rainward.state.player.canister===0'),'The clinic spends existing supplies on a second medkit; one smoke remains reserved for Freight Hall')
  go(-22,-3.5,True);go(-22,-10,True);check(page.evaluate('Rainward.state.player.y>2.3'),'The actual clinic ascent provides market observation')
  picture('01-terrace-before-crossing');pulse(1);wait('Rainward.state.player.stance==="crouch"');page.evaluate('padAllowRecovery=true');go(-8,-10);recover_if_needed('Ramp-foot decision');record('preserve smoke; use market counter, fountain and grass')
  go(-5.2,-17);recover_if_needed('Market counter recovery');go(4,-16.5);recover_if_needed('Fountain recovery')
  go(9,-17);check(page.evaluate('(async()=>{const W=await import("./world.mjs");return W.coverAt(Rainward.state.player)})()'),'The approach reaches existing east grass concealment')
  recover_if_needed('East grass recovery');pulse(1);wait('Rainward.state.player.stance==="stand"');go(12,-15,True);go(18,-11,True)
  reserve=page.evaluate('Rainward.state.player.reserve');salvage=page.evaluate('Rainward.state.player.canister')
  use('Rainward.state.completedTasks.includes("ward-radio")');wait('Rainward.snapshot().visuals.freightCut.open')
  check(page.evaluate('Rainward.state.player.reserve')==min(36,reserve+4) and page.evaluate('Rainward.state.player.canister')==min(12,salvage+2),'The local receiver task opens the loading passage with its unchanged one-time reward')
  check(page.evaluate('Rainward.state.hint.includes("WEST LOADING OPEN")'),'Receiver feedback explains the passage and pursuit risk')
  recover_if_needed('Receiver recovery');pulse(1);wait('Rainward.state.player.stance==="crouch"')
  go(16.2,-14,breakaway=True);go(16.2,-18,breakaway=True);go(16.2,-22,breakaway=True);go(16.2,-24,breakaway=True)
  if page.evaluate('Rainward.state.player.stance==="stand"'):pulse(1);wait('Rainward.state.player.stance==="crouch"')
  check(page.evaluate('Rainward.state.player.hp>0&&Rainward.state.player.stance==="crouch"&&Rainward.state.enemies.every(e=>e.hp>0)'),'The loading decision is reached alive after cover or finite-stamina breakaway, with all threats active')
  record('loading decision before commitment');smoke=page.evaluate('Rainward.state.player.smoke');pulse(14);wait('Rainward.state.player.smoke<'+str(smoke))
  check(page.evaluate('Rainward.state.smokes.length>0'),'The reserved earned smoke precedes the exposed spindle floor')
  pulse(1);wait('Rainward.state.player.stance==="stand"');go(17,-26,True);go(22.3,-26.7,True);use('Rainward.state.objectives.crank');record('spindle-recovered');go(17,-26,True)
  go(17,-24,True);start=page.evaluate('({t:Rainward.state.t,x:Rainward.state.player.x,z:Rainward.state.player.z})');go(11,-24,True)
  crossing=page.evaluate('({t:Rainward.state.t,x:Rainward.state.player.x,z:Rainward.state.player.z,hp:Rainward.state.player.hp})');(OUT/'native-crossing.json').write_text(json.dumps({'start':start,'end':crossing,'input':'virtual Xbox; sprint subject to finite stamina'},indent=2))
  check(crossing['x']<12 and abs(crossing['z']+24)<.7,'Xbox movement physically crosses the powered west aperture')
  go(9,-21,True);go(-4,-23,True);go(-8,-10,True);go(-22,-10,True);go(-22,-3.5,True);go(-24,-1,True);use('JSON.parse(localStorage.getItem("svgn.rainward.v1.checkpoint")).objectives.crank')
  saved=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');assert 'ward-radio' in json.loads(saved)['completedTasks'];(OUT/'earned-clinic-after.json').write_text(saved)
  check(json.loads(saved)['objectives']=={'cell':True,'crank':True} and json.loads(saved)['version']==4,'The real recovery shelter saves both components and the passage in the existing schema')
  check(page.evaluate('Rainward.state.stats.escapes>0'),'Breaking sight and repositioning produces an actual search recovery')
  recover_if_needed('Clinic recovery')
  if page.evaluate('Rainward.state.player.cloth>0&&Rainward.state.player.canister>0'):craft('medkit')
  go(-24,5,True);go(-26.1,5.8,True);use('Rainward.state.completedTasks.includes("ward-service-latch")')
  # Walk the protected approach; save finite sprint for the two crossings.
  # The ruin forces its genuine east-side passage. The final z=-46 line is
  # north of the quay pillars, not the exposed z=-41 path chosen by shortest path.
  go(-30,5.8);go(-31,11);go(-31,-15);go(-28,-24,True);go(-28,-42,True);go(-28,-46);go(-18,-46)
  check(page.evaluate('Rainward.state.player.stamina>=80&&!Rainward.state.player.exhausted'),'Ordinary protected walking preserves stamina before the open quay commitment')
  record('quay preparation');go(0,-46,True);go(0,-43,True);use('Rainward.mode==="won"')
  final=snap();check(final['player']['hp']>0 and all(e['hp']>0 for e in final['enemies']),'Extraction retains all five original living enemies')
  check(final['stats']['shots']==0 and final['stats']['takedowns']==0,'The complete route requires no combat kills')
  capture('02-extracted');record('mastered-return')
  recovery_inputs=page.evaluate('padRecoveryInputs');breakaway_inputs=page.evaluate('padBreakawayInputs')
  (OUT/'recovery-inputs.json').write_text(json.dumps({'medkits':recovery_inputs,'breakaways':breakaway_inputs},indent=2))
  page.reload(wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2');nav('continue');pulse(0);wait('Rainward.mode==="play"');wait('Rainward.snapshot().visuals.freightCut.open')
  check(page.evaluate('Rainward.state.objectives.cell&&Rainward.state.objectives.crank&&Rainward.state.checkpoint==="clinic"'),'Browser reload restores the earned clinic checkpoint and powered passage')
  check(not errors and not console and not dialogs,'No captured browser errors, shader errors or blocking dialogs')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'dialogs':dialogs,'final':final,'reactiveRecoveryInputs':recovery_inputs,'breakawayInputs':breakaway_inputs,'crossing':{'start':start,'end':crossing},'scope':'Normal-start living-enemy Floodgate journey; actual HTTP/WebGL with virtual Xbox Classic buttons/sticks, read-only path guidance, synthetic D-pad-up medkit reactions, B stand/L3 finite-stamina aisle breakaway and reserved earned smoke. Two medkits and one smoke use only original rations and clinic drawer. Medkits are not spent above 45 health. Breakaway requires a seen chasing enemy inside the same narrow lane, not outside the wall. The protected western walk preserves finite stamina; the final crossing uses the northern side of the existing quay pillars. No state assignments, grants, invulnerability, enemy removal, clock edits or planted saves. Genuine earned-checkpoint reload. Not human pacing, reaction time or physical Xbox/Quest approval.'},indent=2))
 except Exception as error:
  data={'error':str(error),'checks':checks,'errors':errors,'console':console,'dialogs':dialogs}
  try:data['reactiveRecoveryInputs']=page.evaluate('padRecoveryInputs');data['breakawayInputs']=page.evaluate('padBreakawayInputs');data['snapshot']=snap();data['focus']=page.evaluate('document.activeElement?.id');data['virtualInput']=page.evaluate('({axes:pad.axes,buttons:pad.buttons,polls:padPolls})');capture('failure')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:context.close();browser.close()
