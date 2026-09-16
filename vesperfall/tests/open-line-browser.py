"""Open Line: actual controller-only gameplay, not actor-state fixtures.
Route distances, simulation time and resources are observations, not human scores.
"""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output'/'open-line';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
PAD="""(()=>{const pad={id:'Open Line Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>[pad]});})();"""
WALK="""async target=>{const g=Vesperfall.component,T=g.T,pad=TestPad.pad,axis=v=>Math.abs(v)<.001?0:Math.sign(v)*(.18+.82*Math.min(1,Math.abs(v)));let previous=[...g.game.p],distance=0;TestPad.button(10,true);
try{return await new Promise((resolve,reject)=>{const start=performance.now(),t=setInterval(()=>{const s=g.game,dx=target[0]-s.p[0],dz=target[1]-s.p[2],d=Math.hypot(dx,dz),f=new T.Vector3(0,0,-1).applyQuaternion(g.head.object3D.getWorldQuaternion(new T.Quaternion()));f.y=0;f.normalize();
 distance+=Math.hypot(...s.p.map((v,i)=>v-previous[i]));previous=[...s.p];
 if(d<.12||s.phase!=='playing'||g.paused||performance.now()-start>180000){clearInterval(t);d<.12?resolve(distance):reject(Error('Xbox walk stalled '+JSON.stringify({p:s.p,target,phase:s.phase,paused:g.paused})));return;}
 const speed=Math.min(1,d*4),x=dx/d*speed,z=dz/d*speed;pad.axes[0]=axis(x*(-f.z)+z*f.x);pad.axes[1]=axis(-(x*f.x+z*f.z));},8);});}finally{pad.axes[0]=pad.axes[1]=0;TestPad.button(10,false);}}"""
AIM="""async target=>{const g=Vesperfall.component,pad=TestPad.pad,axis=v=>Math.abs(v)<.001?0:Math.sign(v)*(.18+.82*Math.min(1,Math.abs(v)));
try{await new Promise((resolve,reject)=>{const start=performance.now(),t=setInterval(()=>{const p=g.game.head,dx=target[0]-p[0],dz=target[2]-p[2],d=Math.hypot(dx,dz),dy=target[1]-p[1],v=target[3]||36,v2=v*v,disc=v2*v2-9.8*(9.8*d*d+2*dy*v2),pitch=disc>=0?Math.atan((v2-Math.sqrt(disc))/(9.8*d)):0,yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-g.yaw),Math.cos(yaw-g.yaw)),b=pitch-g.pitch;
 if(Math.abs(a)<.008&&Math.abs(b)<.007||performance.now()-start>60000||g.game.phase!=='playing'){clearInterval(t);Math.abs(a)<.008&&Math.abs(b)<.007?resolve():reject(Error('Xbox aim stalled '+JSON.stringify({a,b,phase:g.game.phase})));return;}
 pad.axes[2]=axis(-a*3);pad.axes[3]=axis(-b*4*(document.getElementById('pad-invert').checked?-1:1));},8);});}finally{pad.axes[2]=pad.axes[3]=0;}}"""
checks=[];routes=[];errors=[];console=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as p:
 options={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**options)
 page=None;ctx=None
 try:
  for name in ['gallery','ambulatory','central','learned-shot']:
   ctx=browser.new_context(viewport={'width':1100,'height':800},device_scale_factor=.65,service_workers='block');ctx.add_init_script(PAD)
   page=ctx.new_page();page.set_default_timeout(180000)
   page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
   def wait(js,arg=None):return page.wait_for_function(js,arg=arg)
   def press(i):
    wait('Vesperfall.component.dominionControls.state.armed')
    for on in [True,False]:
     page.evaluate('([i,on])=>TestPad.button(i,on)',[i,on]);wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on',[i,on])
   def nav(id):
    for _ in range(120):
     if page.evaluate('id=>document.activeElement.id===id',id):return
     d=page.evaluate('id=>{const a=Vesperfall.component.dominionControls.focusables(),i=a.indexOf(document.activeElement),j=a.findIndex(e=>e.id===id),n=a.length;if(j<0)throw Error("Missing focus "+id);return (j-i+n)%n<=(i-j+n)%n?13:12}',id);press(d)
    raise AssertionError('Cannot focus '+id)
   distance=0
   def walk(points):
    global distance
    for target in points:distance+=page.evaluate(WALK,target)
   def fire(target):
    page.evaluate(AIM,target);before=page.evaluate('Vesperfall.state.shots')
    page.evaluate('TestPad.button(7,true)');wait('Vesperfall.component.charge>.999');page.evaluate('TestPad.button(7,false)');wait('n=>Vesperfall.state.shots>n',before)
    wait('Vesperfall.state.arrows.length===0')
   page.goto(BASE+'/vesperfall/?acceptance=open-line',wait_until='domcontentloaded');wait('window.Vesperfall?.component.returningBell&&Vesperfall.component.stats.drawCalls>0')
   check(page.evaluate('Vesperfall.state.world.generator==="returning-bell-2"'),'Fresh '+name+' journey uses the new immutable layout')
   nav('start');press(0);wait('Vesperfall.component.running&&!Vesperfall.component.paused')
   start=page.evaluate('Vesperfall.state.time')
   if name=='gallery':walk([[-4,8.5],[-14,8.5],[-14,0],[-14,-11.5],[-14,-21],[0,-21],[0,-24]])
   elif name=='ambulatory':walk([[0,2],[7.8,1],[12,1],[13.8,-14],[12,-16],[12,-28],[0,-28],[0,-24]])
   else:
    press(13);check(page.evaluate('Vesperfall.state.type==="blink"'),'Direct Blink shortcut is preserved');press(14);check(page.evaluate('Vesperfall.state.type==="plain"'),'Damage-only shortcut returns to Standard')
    walk([[0,2],[-5.5,0],[-5.5,-7.5]])
    if name=='learned-shot':
     fire([-7,3.3,-12.35]);check(page.evaluate('!Vesperfall.state.chapter.screensRaised&&Vesperfall.state.score===0'),'A missed release arrow leaves the mechanism unchanged and remains recoverable')
    fire([-7,1.65,-12.35]);wait('Vesperfall.state.chapter.screensRaised')
    check(page.evaluate('Vesperfall.component.worldArt.returningBell.dynamic.screen.position.y===4.8&&Vesperfall.state.world.solids.find(s=>s.id==="screen").min[1]===4.8'),'The actual arrow lifts the visual screen and authoritative collision together')
    check(page.evaluate('Vesperfall.state.score===0&&Vesperfall.state.targets.size===0'),'The release cannot fabricate score or a completed objective')
    if name=='central':
     walk([[0,-9],[0,-13]])
     press(9);wait('Vesperfall.component.paused');nav('save-expedition');press(0)
     saved=page.evaluate('JSON.parse(JSON.parse(localStorage.getItem(PilgrimSave.KEY)).payload).checkpoint')
     check(saved['generator']=='returning-bell-2' and saved['state']['chapter']['screensRaised'],'Xbox saves the actual player inside the opened screen crossing')
     page.reload(wait_until='domcontentloaded');wait('window.Vesperfall?.component.returningBell');nav('continue-expedition');press(0);wait('Vesperfall.component.running&&Vesperfall.component.paused')
     restored=page.evaluate('({p:Vesperfall.state.p,chapter:Vesperfall.state.chapter,health:Vesperfall.state.health})')
     check(restored['p']==saved['state']['p'] and restored['chapter']==saved['state']['chapter'] and restored['health']==saved['state']['health'],'Reload restores supported stair position, mechanisms and health without relocation')
     nav('resume');press(0);wait('!Vesperfall.component.paused')
     walk([[0,-16],[0,-21],[0,-24]])
    else:
     walk([[0,-10]])
     fire([0,5,-24]);fire([0,5,-24]);wait('Vesperfall.state.chapter.bellRung')
     check(page.evaluate('!Vesperfall.state.discovered.has(4)&&Vesperfall.state.kills<5'),'A learned shot line can ring the signal without entering the tower or killing every defender')
     page.screenshot(path=str(OUT/'learned-signal-line.png'))
     walk([[0,2],[0,8]]);press(0);wait('Vesperfall.state.phase==="reward"')
     check(page.evaluate('Vesperfall.state.sectors===1&&Vesperfall.state.chapter.returned'),'The alternate approach earns exactly one real chapter outcome')
   end=page.evaluate('({time:Vesperfall.state.time,health:Vesperfall.state.health,damageTaken:Vesperfall.state.damageTaken,shots:Vesperfall.state.shots,kills:Vesperfall.state.kills,p:Vesperfall.state.p,phase:Vesperfall.state.phase})')
   end.update({'route':name,'distanceMetres':distance,'simulationSeconds':end['time']-start});routes.append(end)
   check(end['health']>0,name+' route completes under living-enemy gameplay without resource grants')
   if name!='learned-shot':check(abs(end['p'][1]-3.2)<.05,name+' route reaches the same tower height through actual stairs')
   page.screenshot(path=str(OUT/(name+'-arrival.png')))
   ctx.close();ctx=None
  indexed={r['route']:r for r in routes}
  check(indexed['central']['distanceMetres']<indexed['gallery']['distanceMetres']*.8 and indexed['central']['distanceMetres']<indexed['ambulatory']['distanceMetres']*.8,'Measured controller-driven central approach is substantially shorter than both flanks')
  check(not errors,'No page errors in controller-only routes, archery and save recovery')
  check(not console,'No console or shader errors in the exercised production renderer')
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'checks':checks,'passed':len(checks),'routes':routes,'errors':errors,'consoleErrors':console,'scope':'Controller-only production WebGL. Input commands and observation only, no game-state assignments. Route timing includes aim, combat and save UI; not a human pacing or hardware certification.'},indent=2))
 except Exception as exc:
  try:snapshot=page.evaluate('({p:window.Vesperfall?.state.p,health:window.Vesperfall?.state.health,chapter:window.Vesperfall?.state.chapter,phase:window.Vesperfall?.state.phase})')
  except:snapshot=None
  (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'routes':routes,'snapshot':snapshot,'errors':errors,'consoleErrors':console},indent=2))
  try:page.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:
  if ctx:ctx.close()
  browser.close()
