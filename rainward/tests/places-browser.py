"""Actual game/HTTP/WebGL with synthetic standard Xbox buttons and read-only
steering. No actor, resource, clock or progress writes and no planted saves.
The explicit Classic/legacy movement choice exercises an existing supported
preset; it is not a claim of physical Xbox, XR or human reaction acceptance.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
CHAPTER=os.getenv('PLACES_CHAPTER','district')
assert CHAPTER in ('district','terminus')
OUT=Path('test-output/reclaimed-places-'+CHAPTER);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];console=[];dialogs=[];trace=[]
PAD=Path('rainward/tests/freight-cut-browser.py').read_text().split('PAD="""',1)[1].split('"""',1)[0]
with sync_playwright() as pw:
 options={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**options);context=browser.new_context(viewport={'width':1100,'height':760},service_workers='block')
 context.add_init_script(PAD);page=context.new_page();page.set_default_timeout(90000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
 def check(value,label):
  assert value,label
  checks.append(label);print('PASS',label,flush=True);(OUT/'progress.json').write_text(json.dumps({'checks':checks,'complete':False},indent=2))
 def wait(q):page.wait_for_function(q)
 def frames(n=3):
  old=page.evaluate('padPolls');page.wait_for_function('([old,n])=>padPolls>=old+n',arg=[old,n])
 def neutral():
  page.evaluate('pad.axes=[0,0,0,0];pad.buttons.forEach(b=>{b.pressed=false;b.value=0});padPulse=[]');frames()
 def pulse(i):neutral();page.evaluate('(i)=>padPulse=[i]',i);frames()
 def nav(target):
  for _ in range(150):
   if page.evaluate('document.activeElement?.id')==target:return
   pulse(13)
  raise AssertionError('Unreachable controller UI '+target)
 def capture(name):
  page.screenshot(path=str(OUT/(name+'.png')))
 def record(label):
  s=page.evaluate('Rainward.snapshot()');trace.append({'label':label,'state':s});(OUT/'trace.json').write_text(json.dumps(trace,indent=2));print(label,s['player']['hp'],flush=True)
 def use(condition):pulse(3);wait(condition)
 def craft(item):
  pulse(13);wait('Rainward.mode==="pack"');nav('craft-'+('med' if item=='medkit' else 'smoke'));before=page.evaluate('(item)=>Rainward.state.player[item]',item);pulse(0);page.wait_for_function('([item,before])=>Rainward.state.player[item]===before+1&&!Rainward.state.player.craft',arg=[item,before]);pulse(1);wait('Rainward.mode==="play"')
 def go(x,z,sprint=False,breakaway=False):
  neutral()
  page.evaluate('''async ({x,z,sprint,breakaway})=>{
   const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});route.push({x,z});
   await new Promise((resolve,reject)=>{let i=0;const start=performance.now();let lastHeal=-Infinity,standRequested=false;
    const stop=()=>{pad.axes[0]=pad.axes[1]=0;pad.buttons[10]={pressed:false,value:0};clearInterval(timer);};
    const timer=setInterval(()=>{const p=Rainward.state.player;
     if(breakaway&&!standRequested&&p.x<17.4&&p.stance==='crouch'&&Rainward.state.enemies.some(e=>e.hp>0&&e.x>14.8&&e.x<17.4&&e.seen&&e.state==='chase')){standRequested=true;padPulse.push(1);padBreakawayInputs.push({t:Rainward.state.t,button:1,goal:{x,z}});}
     if(window.padAllowRecovery&&p.hp>0&&p.hp<=45&&p.medkit>0&&!p.craft&&performance.now()-lastHeal>500){padPulse.push(12);lastHeal=performance.now();padRecoveryInputs.push({t:Rainward.state.t,hp:p.hp,medkits:p.medkit,button:12,goal:{x,z}});}
     if(Rainward.mode!=='play'||performance.now()-start>150000){stop();reject(Error('Travel interrupted '+JSON.stringify({x:p.x,z:p.z,hp:p.hp,mode:Rainward.mode,goal:route[i]})));return;}
     const q=route[i],dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<.4){if(++i===route.length){stop();resolve();}return;}
     const yaw=Rainward.view.yaw,scale=Math.min(1,Math.max(.45,d*1.2));pad.axes[0]=(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*scale;pad.axes[1]=(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*scale;const run=sprint||(breakaway&&p.stance==='stand');pad.buttons[10]={pressed:run,value:run?1:0};
    },20);
   });
  }''',{'x':x,'z':z,'sprint':sprint,'breakaway':breakaway});frames(2)
 def travel(points,sprint=False):
  for x,z in points:go(x,z,sprint)
 def task(id):use('Rainward.state.completedTasks.includes('+json.dumps(id)+')')
 def door(id):return page.evaluate('async id=>(await import("./world.mjs")).OBSTACLES.find(o=>o.id===id).disabled',id)
 try:
  page.goto(BASE+'/rainward/?chapter='+CHAPTER,wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2')
  check(page.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")'),'No planted save before normal title Start')
  nav('start');pulse(0);wait('Rainward.mode==="play"')
  check(page.evaluate('(async()=>{const W=await import("./world.mjs");return W.CURRENT.placesRevision==="reclaimed-places-1"})()'),'The loaded expedition contains the new authored layout')
  count=page.evaluate('Rainward.state.enemies.length');check(page.evaluate('Rainward.state.enemies.every(e=>e.hp>0)'),'All original enemies start alive')
  check(page.evaluate('Rainward.snapshot().version')=='0.16.4','The running version matches this scoped update')
  if CHAPTER=='district':
   go(1.3,25.5);use('Rainward.state.taken.has("rations")');craft('medkit');craft('smoke');go(-13,23,True);pulse(1);wait('Rainward.state.player.stance==="crouch"');travel([[-19,16],[-19,7]]);pulse(1)
   go(-24,5);use('Rainward.state.taken.has("clinic-kit")');go(-22,-3.5);use('Rainward.state.objectives.cell');go(-24,-1);use('Rainward.state.checkpoint==="clinic"');craft('medkit')
   travel([[-22,-3.5],[-22,-10]],True);pulse(1);wait('Rainward.state.player.stance==="crouch"');page.evaluate('padAllowRecovery=true')
   travel([[-8,-10],[-5.2,-17],[4,-16.5],[9,-17]]);pulse(1);wait('Rainward.state.player.stance==="stand"');travel([[12,-15],[18,-11]],True);task('ward-radio');pulse(1);wait('Rainward.state.player.stance==="crouch"')
   for z in [-14,-18,-22,-24]:go(16.2,z,False,True)
   if page.evaluate('Rainward.state.player.stance')!='crouch':pulse(1)
   pulse(14);wait('Rainward.state.player.smoke===0');pulse(1);wait('Rainward.state.player.stance==="stand"');go(17,-26,True);go(22.3,-26.7,True);use('Rainward.state.objectives.crank')
   travel([[17,-26],[17,-24],[11,-24],[9,-21],[-4,-23],[-8,-10],[-22,-10],[-22,-3.5],[-24,-1]],True);use('JSON.parse(localStorage.getItem("svgn.rainward.v1.checkpoint")).objectives.crank')
   if page.evaluate('Rainward.state.player.cloth>0&&Rainward.state.player.canister>0'):craft('medkit')
   travel([[-24,5],[-26.1,5.8]],True);task('ward-service-latch');travel([[-30,5.8],[-31,11],[-31,-15],[-30,-23],[-32,-24],[-32,-28]])
   check(page.evaluate('Rainward.state.player.x<-30&&Rainward.state.player.z<-25'),'Ordinary Xbox movement enters the former solid quay ruin')
   record('pump-room');capture('01-pump-room');travel([[-31,-32],[-31,-34],[-32,-38]])
   check(page.evaluate('Rainward.state.player.z<-36'),'The internal turning route reaches the evacuation room');record('evacuation-room');capture('02-evacuation-room')
   travel([[-32,-42],[-27,-44],[-18,-46]]);check(page.evaluate('Rainward.state.player.stamina>=80'),'Protected walking preserves finite stamina for the last crossing')
   travel([[0,-46],[0,-43]],True);use('Rainward.mode==="won"')
  else:
   page.evaluate('padAllowRecovery=true');go(2,38);use('Rainward.state.taken.has("terminus-kit")');craft('medkit');craft('medkit');craft('smoke')
   go(-28,21,True);use('Rainward.state.puzzle.clueRead');go(-28,16.4,True);use('Rainward.state.puzzle.wheels[0]===1');go(-28,4.4,True);use('Rainward.state.puzzle.solved')
   go(-32,-13,True);use('Rainward.state.checkpoint==="workshop"');go(-34,-20,True);use('Rainward.state.objectives.crank');check(not door('workshop-goods-shutter'),'Workshop goods exit starts closed')
   go(-31,-23,True);task('station-radio');check(door('workshop-goods-shutter'),'The original radio interaction opens the actual goods doorway')
   travel([[-32,-23],[-32,-29],[-24,-30]],True);check(page.evaluate('Rainward.state.player.z<-28'),'Ordinary movement passes through the newly opened workshop exit');record('workshop-escape');capture('01-workshop-escape')
   travel([[-16,-20],[-16,8],[22,10],[32,20]],True);check(not door('dispatch-emergency-shutter'),'Dispatch exit starts closed');task('last-dispatch');check(door('dispatch-emergency-shutter'),'The original dispatch interaction opens the actual emergency shutter')
   travel([[30,10],[38,8],[38,-4],[38,-19],[35,-21]],True);check(page.evaluate('Rainward.state.player.x>34&&Rainward.state.player.z<-19'),'The outer document aisle is traversable with living enemies');record('records-aisle');capture('02-records-aisle')
   pulse(14);wait('Rainward.state.player.smoke===0');go(32,-21,True);use('Rainward.state.objectives.cell');travel([[25,-22],[18,-22]],True)
   check(page.evaluate('Rainward.state.player.x<19'),'The collected prism can leave through the new lateral dispatch exit');record('dispatch-escape');capture('03-dispatch-escape')
   travel([[5,-24],[0,-30],[0,-42],[0,-64]],True);use('Rainward.mode==="won"')
  final=page.evaluate('Rainward.snapshot()');check(final['player']['hp']>0 and all(e['hp']>0 for e in final['enemies']) and len(final['enemies'])==count,'Complete extraction retains every original living enemy')
  check(final['stats']['shots']==0 and final['stats']['takedowns']==0,'The complete mission is possible without forced kills or new resource grants')
  record('extraction');capture('04-extraction')
  saved=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');page.reload(wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2');nav('continue');pulse(0);wait('Rainward.mode==="play"')
  check(page.evaluate('Rainward.state.level')==CHAPTER and page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')==saved,'Reload restores the earned shelter without rewriting its saved bytes')
  check(not errors and not console and not dialogs,'No captured script, graphics or blocking-dialog errors')
  (OUT/'report.json').write_text(json.dumps({'chapter':CHAPTER,'passed':len(checks),'checks':checks,'final':final,'errors':errors,'console':console,'dialogs':dialogs,'scope':__doc__},indent=2))
 except Exception as e:
  failure={'error':str(e),'checks':checks,'errors':errors,'console':console,'dialogs':dialogs}
  try:failure['snapshot']=page.evaluate('Rainward.snapshot()');capture('failure')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(failure,indent=2));raise
 finally:context.close();browser.close()
