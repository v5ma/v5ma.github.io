"""Normal-start living-enemy acceptance; writes ONLY virtual device inputs.
No fixture saves, actor/inventory/clock writes, or physical-device certification.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
VIEW=os.getenv('FIREBREAK_VIEW','desktop');KIND=os.getenv('FIREBREAK_INPUT','classic');ROUTE=os.getenv('FIREBREAK_ROUTE','firebreak');XR=VIEW!='desktop'
OUT=Path('test-output/firebreak-'+VIEW+'-'+KIND+'-'+ROUTE);OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];console=[];trace=[]
def check(v,msg):
 assert v,msg
 checks.append(msg);print('PASS',msg,flush=True)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw);ctx=browser.new_context(viewport={'width':1100,'height':760},service_workers='block')
 settings={'controlPreset':'survival' if KIND=='survival' else 'classic','mute':True,'low':True,'scanned':False,'cinematic':False,'detailedHumans':False,'toggleSprint':False}
 ctx.add_init_script('localStorage.setItem("svgn.rainward.v1.settings",'+json.dumps(json.dumps(settings))+');')
 if XR:ctx.add_init_script(Path('rainward/tests/quest-device-mock.js').read_text())
 else:ctx.add_init_script("window.pad={connected:true,mapping:'standard',index:0,id:'Firebreak virtual Xbox',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;window.padPulse=[];Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;const buttons=pad.buttons.map(b=>({...b}));for(const i of padPulse)buttons[i]={pressed:true,value:1};padPulse=[];return [{...pad,axes:[...pad.axes],buttons}];}});")
 p=ctx.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def wait(q):p.wait_for_function(q)
 def frames(n=3):
  key='questDevice.frames' if XR else 'padPolls';before=p.evaluate(key);p.wait_for_function('([key,b,n])=>eval(key)>=b+n',arg=[key,before,n])
 def pulse(index):
  frames();p.evaluate('(i)=>padPulse=[i]',index);frames(4)
 def press(on):p.evaluate("on=>{if(questDevice.kind==='hands')questDevice.pinch('right',on);else questDevice.button('right',0,on);}",on)
 def clickrow(id):
  frames(3)
  p.evaluate('''async id=>{const T=await import('./vendor/three.module.js'),x=Rainward.snapshot().xr,row=x.panelRows.find(r=>r.id===id);if(!row)throw Error('Missing spatial control '+id);const q=new T.Vector3(((row.x+row.w/2)/1024-.5)*1.45,(.5-(row.y+row.h/2)/1024)*1.45,0).applyMatrix4(new T.Matrix4().fromArray(x.panelMatrix)),s=questDevice.sources.find(s=>s.handedness==='right'),d=q.sub(new T.Vector3(s.position.x,s.position.y,s.position.z)).normalize(),rot=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);s.orientation={x:rot.x,y:rot.y,z:rot.z,w:rot.w};}''',id)
  frames(3);press(True);frames(3);press(False);frames(4)
 def select(id):
  if XR:
   for _ in range(10):
    if p.evaluate('Rainward.snapshot().xr.panelPage')==0:break
    clickrow('prev')
   for _ in range(12):
    if id in p.evaluate('Rainward.snapshot().xr.panelRows.map(r=>r.id)'):break
    clickrow('next')
   else:raise AssertionError('Missing XR control '+id)
   clickrow(id)
  else:
   for _ in range(100):
    if p.evaluate('document.activeElement.id')==id:break
    pulse(13)
   else:raise AssertionError('Missing Xbox focus '+id)
   pulse(0)
 def record(label):
  s=p.evaluate('Rainward.snapshot()');entry={'label':label,'t':p.evaluate('Rainward.state.t'),'player':s['player'],'stats':s['stats'],'firebreak':s['visuals']['firebreak'],'enemies':s['enemies'],'metrics':p.evaluate('firebreakMetrics')};trace.append(entry);(OUT/'trace.json').write_text(json.dumps(trace,indent=2));print(label,'HP',s['player']['hp'],'time',entry['t'],flush=True)
 def go(x,z):
  print('GO',x,z,flush=True);frames(3)
  p.evaluate('''async ({x,z,xr})=>{const W=await import('./world.mjs'),P=Rainward.state.player,L=xr?questDevice.sources.find(s=>s.handedness==='left'):null,base=L?{...L.position}:null,route=W.findPath(P,{x,z});route.push({x,z});
   if(xr){for(const s of questDevice.sources)s.orientation={x:0,y:0,z:0,w:1};if(L.hand)L.pinch=true;}
   await new Promise((resolve,reject)=>{let i=0,frame=xr?questDevice.frames:padPolls;const start=performance.now();const stop=()=>{if(xr){if(L.hand){L.pinch=false;L.position={...base};}else{L.gamepad.axes=[0,0,0,0];L.gamepad.buttons[3]={pressed:false,value:0};}}else{pad.axes[0]=pad.axes[1]=0;pad.buttons[10]={pressed:false,value:0};}clearInterval(timer);};
    const timer=setInterval(()=>{if((xr?questDevice.frames:padPolls)<frame+3)return;const p=Rainward.state.player;
     if(Rainward.mode!=='play'||performance.now()-start>120000){stop();reject(Error('Travel blocked or defeated '+JSON.stringify({mode:Rainward.mode,x:p.x,z:p.z,hp:p.hp,goal:route[i]})));return;}
     const q=route[i],dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<.4){if(++i===route.length){stop();resolve();}return;}
     const yaw=xr&&L.hand?Rainward.snapshot().xr.rig.yaw:Rainward.view.yaw,c=Math.cos(yaw),s=Math.sin(yaw),scale=Math.min(1,Math.max(.45,d*1.2)),a=(c*dx-s*dz)/d*scale,b=(s*dx+c*dz)/d*scale;
     if(xr){if(L.hand){L.position.x=base.x+a*.13;L.position.z=base.z+b*.13;}else{L.gamepad.axes[2]=a;L.gamepad.axes[3]=b;L.gamepad.buttons[3]={pressed:true,value:1};}}
     else{pad.axes[0]=a;pad.axes[1]=b;pad.buttons[10]={pressed:true,value:1};}
    },20);
   });}''',{'x':x,'z':z,'xr':XR});frames(2);record('arrived '+str((x,z)))
 def use(condition=None):
  if XR:
   p.evaluate("()=>{const r=questDevice.sources.find(s=>s.handedness==='right');r.orientation={x:0,y:0,z:0,w:1};}");frames(3)
   if KIND=='hands':press(True);frames(3);press(False)
   else:p.evaluate("questDevice.button('right',1,true)");frames(3);p.evaluate("questDevice.button('right',1,false)")
   frames(3)
  else:pulse(3)
  if condition:wait(condition)
 def pause():
  if XR:select('pause')
  else:pulse(9)
  wait('Rainward.mode==="pause"')
 try:
  p.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward');check(p.evaluate('Rainward.mode')=='title','The unchanged title loads without a fatal error')
  if XR:
   p.locator('#xr-view-title').select_option(VIEW);p.evaluate('(k)=>questDevice.use(k)',KIND);p.locator('#xr-title-hands' if KIND=='hands' else '#xr-title').click();wait('Rainward.snapshot().xr.active');frames(6)
  select('start');wait('Rainward.mode==="play"');frames(5)
  check(p.evaluate('Rainward.state.enemies.length===5&&Rainward.state.enemies.every(e=>e.hp>0)'),'Normal new Floodgate start retains all five living threats')
  p.evaluate("window.firebreakMetrics={distance:0,damage:0};window.firebreakLast={x:Rainward.state.player.x,z:Rainward.state.player.z,hp:100};window.firebreakReadTimer=setInterval(()=>{const p=Rainward.state.player,m=firebreakMetrics,l=firebreakLast;m.distance+=Math.hypot(p.x-l.x,p.z-l.z);m.damage+=Math.max(0,l.hp-p.hp);firebreakLast={x:p.x,z:p.z,hp:p.hp};},20)")
  if XR:
   select('comfort-speed')
   if KIND=='hands':select('hand-sprint')
  go(1.3,25.5);use('Rainward.state.taken.has("rations")')
  if not XR:
   pulse(13);wait('Rainward.mode==="pack"')
   for id,key in [('craft-med','medkit'),('craft-smoke','smoke')]:
    if KIND=='survival':
     for _ in range(60):
      if p.evaluate('document.activeElement.id')==id:break
      pulse(13)
     p.evaluate('pad.buttons[0]={pressed:true,value:1}');wait('Rainward.state.player.'+key+'===1&&!Rainward.state.player.craft');p.evaluate('pad.buttons[0]={pressed:false,value:0}');frames(4)
    else:select(id);wait('Rainward.state.player.'+key+'===1&&!Rainward.state.player.craft')
   pulse(1);wait('Rainward.mode==="play"');check(p.evaluate('Rainward.state.player.cloth===0&&Rainward.state.player.canister===0'),'Planning spends the authored rations on exactly one medkit and one smoke')
  for x,z in [(-19,14),(-19,7),(-24,6),(-22,-3.5)]:go(x,z)
  use('Rainward.state.objectives.cell');go(-24,-1);use('Rainward.state.checkpoint==="clinic"');record('clinic battery and shelter')
  if ROUTE=='north':
   for x,z in [(-24,6),(-19,7),(-19,12),(-31,12),(-31,-15),(-27,-16),(-27,-24),(-18,-26),(-18,-42),(12,-46),(21,-32),(21,-26.7),(22.3,-26.7)]:go(x,z)
   use('Rainward.state.objectives.crank');check(not p.evaluate('Rainward.snapshot().visuals.firebreak.deployed'),'The longer north loading approach completes both objectives without the optional mechanism')
  else:
   for x,z in [(-22,-3.5),(-22,-7),(-22,-10)]:go(x,z)
   check(p.evaluate('Rainward.state.player.y')>2.3,'The existing clinic terrace supplies a real elevated observation approach')
   for x,z in [(-10,-10),(-7,-10),(0,-8),(10,-6),(21,-5),(24,-12),(26.1,-14.5)]:go(x,z)
   before=p.evaluate('({distance:firebreakMetrics.distance,t:Rainward.state.t,mag:Rainward.state.player.mag,reserve:Rainward.state.player.reserve})')
   check(p.evaluate('!Rainward.snapshot().visuals.firebreak.yardOpen'),'The linked yard gate remains physically closed until operated')
   # Safety interlock is tested separately with explicit model fixtures. If a
   # live patrol occupies the screen, remain in real time and retry normal use.
   for _ in range(12):
    use()
    if p.evaluate('Rainward.state.completedTasks.includes("ward-freight-firebreak")'):break
    frames(12)
   wait('Rainward.snapshot().visuals.firebreak.deployed')
   check(p.evaluate('Rainward.state.sounds.some(s=>s.type==="mechanism")||Rainward.state.events.some(e=>e.type==="wheel")'),'Operating the real nearby lever emits the mechanical sound cue')
   check(p.evaluate('Rainward.state.player.mag')==before['mag'] and p.evaluate('Rainward.state.player.reserve')==before['reserve'],'The mechanism spends no ammunition and grants no new supplies')
   go(30.2,-15);record('opened crossing');cross=p.evaluate('firebreakMetrics.distance')-before['distance'];check(cross<8,'The new exit is crossed with real movement in under eight travelled metres')
   for x,z in [(31,-21),(31,-32),(21,-32),(21,-26.7),(22.3,-26.7)]:go(x,z)
   use('Rainward.state.objectives.crank');check(p.evaluate('Rainward.state.enemies.every(e=>e.hp>0)'),'The recovery loop reaches the original spindle without removing or defeating threats')
   record('spindle after yard loop')
  if XR:
   # Focused XR acceptance proves the changed route and operation, not a claim
   # that this particular XR case completed the entire campaign.
   pause();p.screenshot(path=str(OUT/'changed-world-xr.png'))
   check(p.evaluate('Rainward.snapshot().xr.active'),'The transformed geometry remains in the requested immersive session')
   if VIEW!='first-person':check(p.evaluate('Rainward.snapshot().xr.diorama.topOpen||Rainward.snapshot().xr.diorama.frontOpen'),'The diorama retains at least one viewing opening')
  else:
   # Use the original finite smoke and medkit through each preset's real UI.
   if KIND=='classic':pulse(12);pulse(14)
   else:
    pulse(13);wait('Rainward.mode==="pack"');select('equip-medkit');pulse(1);wait('Rainward.mode==="play"')
    if p.evaluate('Rainward.state.player.hp<100'):
     p.evaluate('pad.buttons[7]={pressed:true,value:1}');wait('!Rainward.state.player.healing&&Rainward.state.player.medkit===0');p.evaluate('pad.buttons[7]={pressed:false,value:0}');frames(3)
    pulse(13);wait('Rainward.mode==="pack"');select('equip-smoke');pulse(1);wait('Rainward.mode==="play"');p.evaluate('pad.buttons[7]={pressed:true,value:1}');wait('Rainward.state.player.smoke===0');p.evaluate('pad.buttons[7]={pressed:false,value:0}');frames(3)
   for x,z in [(21,-32),(16,-38),(0,-43)]:go(x,z)
   use('Rainward.mode==="won"');record('extracted');check(p.evaluate('Rainward.state.objectives.cell&&Rainward.state.objectives.crank'),'Extraction uses both original recovered components')
   check(p.evaluate('Rainward.state.stats.shots===0&&Rainward.state.stats.takedowns===0'),'The complete living-enemy run needs neither shooting nor takedowns')
   if ROUTE=='firebreak':check(p.evaluate('Rainward.state.stats.alerts>0&&Rainward.state.stats.escapes>0'),'Real patrol alerts and recovery occur in the completed firebreak run')
   p.screenshot(path=str(OUT/'extracted.png'))
  check(not errors,'No uncaught JavaScript errors during the changed-route journey');check(not any('Shader Error' in s or 'GL_INVALID' in s for s in console),'The changed world renders without captured shader errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'view':VIEW,'input':KIND,'route':ROUTE,'errors':errors,'console':console,'metrics':p.evaluate('firebreakMetrics'),'stats':p.evaluate('Rainward.state.stats'),'scope':'Normal start, living enemies, actual movement/collision and finite resources. All driver writes target virtual device inputs only; snapshots and route guidance are read-only. Desktop cases complete extraction; XR cases cover the new mechanism and loop in the selected view. Neither proves physical-device comfort, reliability or player enjoyment.'},indent=2))
 except Exception as error:
  data={'error':str(error),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=p.evaluate('Rainward.snapshot()');record('FAILED');p.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();browser.close()
