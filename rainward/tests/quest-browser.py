"""Native Chromium/WebGL test with explicit XR device mock. Not physical Quest QA."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
KIND=os.getenv('QUEST_KIND','controllers');OUT=Path('test-output/rainward-quest-'+KIND);OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];console=[]
def check(v,msg):
 assert v,msg
 checks.append(msg);print('PASS',msg,flush=True)
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);ctx=b.new_context(viewport={'width':960,'height':640},service_workers='block')
 ctx.add_init_script(Path('rainward/tests/quest-device-mock.js').read_text())
 ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.freefield',JSON.stringify({freeStride:false,xrLayout:'legacy',pinnedXR:true,footsteps:100,waterVolume:100,score:'legacy'}));localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,cinematic:false,scanned:false,detailedHumans:false}));")
 p=ctx.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def wait(q):p.wait_for_function(q)
 def frames(n=4):
  old=p.evaluate('questDevice.frames');p.wait_for_function('([old,n])=>questDevice.frames>=old+n',arg=[old,n])
 def trigger(on):
  p.evaluate("on=>{if(questDevice.kind==='hands')questDevice.pinch('right',on);else questDevice.button('right',0,on);}",on)
 def select(row_id,hold_until=None):
  for _ in range(9):
   if p.evaluate('Rainward.snapshot().xr.panelPage')==0:break
   click_visible('prev')
  for _ in range(12):
   ids=p.evaluate('Rainward.snapshot().xr.panelRows.map(r=>r.id)')
   if row_id in ids:break
   click_visible('next')
  else:raise AssertionError('XR row not found: '+row_id+' '+str(ids))
  click_visible(row_id,hold_until)
 def click_visible(row_id,hold_until=None):
  frames(4)
  p.evaluate('''async id=>{const T=await import('./vendor/three.module.js'),xr=Rainward.snapshot().xr,row=xr.panelRows.find(r=>r.id===id);if(!row)throw Error('No row '+id);const uv={x:(row.x+row.w/2)/1024,y:1-(row.y+row.h/2)/1024},point=new T.Vector3((uv.x-.5)*1.45,(uv.y-.5)*1.45,0).applyMatrix4(new T.Matrix4().fromArray(xr.panelMatrix)),s=questDevice.sources.find(s=>s.handedness==='right'),d=point.sub(new T.Vector3(s.position.x,s.position.y,s.position.z)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',row_id)
  frames(3);trigger(True)
  if row_id=='exit':
   wait('!Rainward.snapshot().xr.active');trigger(False);return
  frames(4)
  if hold_until:wait(hold_until)
  trigger(False);frames(5)
 def away():p.evaluate("()=>{for(const s of questDevice.sources)s.orientation={x:0,y:0,z:0,w:1};}")
 def go(x,z):
  # Read-only route guidance writes only the emulated device, not game state.
  print('GO',x,z,flush=True);frames(5);away()
  p.evaluate('''async ({x,z})=>{
   const W=await import('./world.mjs'),p=Rainward.state.player,L=questDevice.sources.find(s=>s.handedness==='left'),route=W.findPath(p,{x,z});route.push({x,z});
   const base={...L.position};if(L.hand)L.pinch=true;
   await new Promise((resolve,reject)=>{let i=0,armedAt=questDevice.frames;const start=performance.now();
    const stop=()=>{if(L.hand){L.pinch=false;L.position={...base};}else L.gamepad.axes=[0,0,0,0];clearInterval(timer);};
    const timer=setInterval(()=>{if(questDevice.frames<armedAt+4)return;const p=Rainward.state.player;
     if(Rainward.mode!=='play'||performance.now()-start>180000){stop();reject(Error('XR travel interrupted '+JSON.stringify({mode:Rainward.mode,x:p.x,z:p.z,hp:p.hp,goal:route[i]})));return;}
     const q=route[i],dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<.4){if(++i===route.length){stop();resolve();}return;}
     const yaw=L.hand?Rainward.snapshot().xr.rig.yaw:Rainward.view.yaw,c=Math.cos(yaw),s=Math.sin(yaw),scale=Math.min(1,Math.max(.4,d));
     const a=(c*dx-s*dz)/d*scale,b=(s*dx+c*dz)/d*scale;
     if(L.hand){L.position.x=base.x+a*.13;L.position.z=base.z+b*.13;}else {L.gamepad.axes[2]=a;L.gamepad.axes[3]=b;}
    },20);
   });
  }''',{'x':x,'z':z});frames(5)
 def button(side,index,condition=None):
  frames(3);p.evaluate('([side,index])=>questDevice.button(side,index,true)',[side,index]);frames(4)
  if condition:wait(condition)
  p.evaluate('([side,index])=>questDevice.button(side,index,false)',[side,index]);frames(5)
 def interact():
  if quest_kind()=='controllers':button('right',1)
  else:
   if p.evaluate('Rainward.snapshot().xr.handFire'):select('hand-fire')
   away();frames(3);trigger(True);frames(3);trigger(False);frames(3)
 def quest_kind():return p.evaluate('questDevice.kind')
 def dive():
  if quest_kind()=='controllers':button('right',5,'Rainward.state.player.submerged')
  else:select('prone');wait('Rainward.state.player.submerged')
 def breathe():
  if quest_kind()=='controllers':button('right',4)
  else:select('traverse')
  wait('!Rainward.state.player.submerged&&Rainward.state.player.oxygen>99')
 try:
  p.goto(BASE+'/rainward/?chapter=natatorium',wait_until='domcontentloaded');wait('window.Rainward')
  check(p.locator('#chapter-select option').count()==7,'Seven expeditions remain on the title')
  check(p.evaluate('questDevice.requests.length')==0,'No XR permission or session requested before explicit entry')
  p.evaluate('(kind)=>questDevice.use(kind)',KIND)
  p.locator('#xr-title-hands' if KIND=='hands' else '#xr-title').click();wait('Rainward.snapshot().xr.active');frames(6)
  check(p.evaluate('questDevice.requests[0].mode')=='immersive-vr','Explicit entry starts immersive VR rather than a paused overlook')
  if KIND=='hands':check(p.evaluate('questDevice.requests[0].options.requiredFeatures.includes("hand-tracking")'),'Hand entry explicitly requires articulated hand tracking')
  else:check(p.evaluate('questDevice.requests[0].options.optionalFeatures.includes("hand-tracking")'),'Controller entry permits later hand tracking when available')
  check(p.evaluate('Rainward.mode')=='title','XR preserves the actual title/new/continue decision')
  p.screenshot(path=str(OUT/'01-xr-title.png'));select('start');wait('Rainward.mode==="play"');frames(6)
  check(p.evaluate('questDevice.sessions.length===1&&!questDevice.sessions[0].ended'),'Starting a chapter keeps the original XR session attached')
  check(p.evaluate('Rainward.state.enemies.every(e=>e.hp>0)&&Rainward.state.enemies.length===6'),'The new XR game retains all six living authored enemies')
  if KIND=='hands':check(p.evaluate('Rainward.snapshot().xr.handJoints.left===25&&Rainward.snapshot().xr.handJoints.right===25'),'Both actual rendered hand meshes follow 25 mock WebXR joints')
  away();frames(5);wait('Rainward.snapshot().xr.armed');start=p.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z,t:Rainward.state.t})')
  if KIND=='controllers':p.evaluate("questDevice.sources[0].gamepad.axes[3]=-1")
  else:
   p.evaluate("questDevice.pinch('left',true)");frames(4);p.evaluate("questDevice.sources[0].position.z-=.13")
  p.wait_for_function('(z)=>Rainward.state.player.z<z-1',arg=start['z'])
  if KIND=='controllers':p.evaluate("questDevice.sources[0].gamepad.axes[3]=0")
  else:p.evaluate("questDevice.pinch('left',false)")
  frames(4);check(p.evaluate('Rainward.state.t')>start['t'],'XR locomotion advances the real mission clock and moves the player')
  go(2,47);interact();check(p.evaluate('Rainward.state.taken.has("natatorium-kit")&&Rainward.state.player.cloth===3'),'XR interaction collects only the authored lobby supplies')
  select('pack');wait('Rainward.mode==="pack"');frames(5);p.screenshot(path=str(OUT/'02-xr-satchel.png'))
  select('craft-med');wait('!Rainward.state.player.craft');check(p.evaluate('Rainward.state.player.cloth===3&&Rainward.state.player.canister===3&&Rainward.state.player.medkit===0'),'Releasing an XR crafting hold refunds its reserved supplies once')
  select('craft-smoke','Rainward.state.player.smoke===1&&!Rainward.state.player.craft');check(p.evaluate('Rainward.state.player.cloth===2&&Rainward.state.player.canister===2'),'A sustained XR selection crafts exactly one smoke using authored supplies')
  select('equip-rifle');check(p.evaluate('Rainward.state.player.equipped')=='rifle','Satchel equipment is operated through a ray-selectable control')
  select('back');wait('Rainward.mode==="play"');select('pause');wait('Rainward.mode==="pause"')
  select('resume');wait('Rainward.mode==="play"');select('map');wait('Rainward.mode==="map"');click_visible('read');click_visible('read');check(p.evaluate('Rainward.snapshot().xr.panelView')=='map','The original field map is drawn inside the immersive panel');p.screenshot(path=str(OUT/'04-xr-map.png'));click_visible('back');wait('Rainward.mode==="play"');select('pause');wait('Rainward.mode==="pause"')
  select('musicVolume-minus');check(p.evaluate('document.getElementById("musicVolume").value')=='35','An in-world slider changes the existing audio setting')
  select('retry');wait('Rainward.mode==="confirm"');check(p.evaluate('document.activeElement.id')=='confirm-no','A new confirmation retains safe Cancel focus');select('confirm-no');wait('Rainward.mode==="pause"')
  select('resume');wait('Rainward.mode==="play"');select('selectPistol')
  select('comfort-speed');check(not p.evaluate('Rainward.snapshot().xr.comfortSpeed'),'The public comfort option selects normal speed without altering the simulation')
  if KIND=='hands':
   # Select this existing movement option at the dry, sheltered preparation
   # stage, not by paging through menus during a time-limited underwater dive.
   select('hand-sprint');check(p.evaluate('Rainward.snapshot().xr.panelRows.some(row=>row.id==="hand-sprint"&&row.label==="HAND SPRINT: ON")'),'Hand sprint is selected through its actual spatial control before leaving the dry shelter')
  go(3,29);go(15,23.5);go(15,18);check(p.evaluate('Rainward.state.player.waterMode==="swim"'),'XR locomotion enters the real competition pool')
  # Breathing stops use normal controls, not oxygen or clock edits.
  dive();go(15,3);breathe();dive();go(15,-13)
  wait('Rainward.snapshot().xr.rig.y+questDevice.head.y<-.2');interact();check(p.evaluate('Rainward.state.objectives.cell&&Rainward.state.taken.has("natatorium-fuse")'),'XR depth and interaction recover the actual submerged filtration fuse')
  p.screenshot(path=str(OUT/'02-xr-underwater.png'));breathe();check(True,'XR surface controls recover oxygen naturally')
  if KIND=='hands':select('hand-fire')
  ammo=p.evaluate('Rainward.state.player.mag');away();frames(5);trigger(True);frames(5);trigger(False);frames(3);check(p.evaluate('Rainward.state.player.mag')==ammo,'Swimming keeps firearms stowed despite XR trigger or pinch input')
  if KIND=='hands':select('hand-fire')
  dive();go(15,3);breathe();dive();go(15,18)
  breathe()
  go(15,23.5);go(3,23.5);go(3,29);go(0,48);interact();check(p.evaluate('Rainward.state.checkpoint')=='natatorium-lobby','The XR journey saves at the authored dry lobby shelter')
  if KIND=='controllers':button('left',5,'Rainward.mode==="pause"')
  else:select('pause');wait('Rainward.mode==="pause"')
  saved_hp=p.evaluate('JSON.parse(localStorage.getItem("svgn.rainward.v1.checkpoint")).player.hp')
  check(p.evaluate('JSON.parse(localStorage.getItem("svgn.rainward.v1.checkpoint")).objectives.cell'),'The recovered fuse is serialized into the actual shelter save')
  select('retry');wait('Rainward.mode==="confirm"');select('confirm-yes');wait('Rainward.mode==="play"');frames(5)
  check(p.evaluate('Rainward.state.player.hp')==saved_hp and p.evaluate('Rainward.state.objectives.cell'),'Native shelter retry restores the saved health and fuse without granting either')
  if KIND=='controllers':
   old=p.evaluate('Rainward.snapshot().xr.rig.yaw');p.evaluate("questDevice.sources[1].gamepad.axes[2]=1");frames(5);p.evaluate("questDevice.sources[1].gamepad.axes[2]=0");frames(5);check(abs(p.evaluate('Rainward.snapshot().xr.rig.yaw')-old)>.4,'Right stick produces a bounded snap turn')
  else:
   select('turn-right');check(abs(p.evaluate('Rainward.snapshot().xr.rig.yaw'))>.4,'Hand ray/pinch selects a snap-turn field action')
  away();frames(5)
  p.evaluate("questDevice.use(questDevice.kind==='hands'?'controllers':'hands')");wait('Rainward.mode==="pause"');frames(6);check(p.evaluate('Rainward.snapshot().xr.active'),'Changing between controllers and hands pauses without ending XR')
  select('resume');wait('Rainward.mode==="play"');p.evaluate('questDevice.headTracked=false');wait('Rainward.mode==="pause"');p.evaluate('questDevice.headTracked=true');frames(6)
  check(p.evaluate('Rainward.snapshot().xr.active'),'Loss of viewer tracking pauses and recovers within the session')
  select('retry');wait('Rainward.mode==="confirm"');select('confirm-yes');wait('Rainward.mode==="play"');frames(6)
  check(p.evaluate('Rainward.state.checkpoint')=='natatorium-lobby','XR retry restores the actual dry shelter checkpoint')
  check(p.evaluate('questDevice.sessions.length')==1,'Retry also retains one XR session across the renderer handoff')
  select('pause');select('to-title');wait('Rainward.mode==="confirm"');select('confirm-yes');wait('Rainward.mode==="title"');select('chapter-select-minus');select('start');wait('Rainward.mode==="play"&&Rainward.state.level!=="natatorium"');frames(6)
  check(p.evaluate('questDevice.sessions.length===1&&Rainward.snapshot().xr.active'),'Changing expeditions remains playable in the same immersive session')
  if quest_kind()=='hands':select('hand-fire')
  away();frames(6);reserve=p.evaluate('Rainward.state.player.reserve');trigger(True);wait('Rainward.state.player.mag<6');trigger(False);frames(4)
  check(p.evaluate('Rainward.state.player.reserve')==reserve,'Tracked trigger/pinch firing spends a finite magazine without granting reserve ammo')
  missing=6-p.evaluate('Rainward.state.player.mag')
  if quest_kind()=='controllers':button('left',4)
  else:select('reload')
  wait('Rainward.state.player.reload===0&&Rainward.state.player.mag===6');check(p.evaluate('Rainward.state.player.reserve')==reserve-missing,'XR reload transfers exactly the missing finite ammunition')
  p.screenshot(path=str(OUT/'03-second-chapter.png'));select('exit');wait('!Rainward.snapshot().xr.active');check(p.evaluate('Rainward.mode')=='pause','Exiting XR returns to the preserved desktop pause interface')
  check(not p.evaluate('Rainward.snapshot().xr.rigVisible'),'XR-only panels and tracked visuals are hidden after returning to desktop')
  p.evaluate('questDevice.deny=true');p.locator('#xr-start').click();wait('document.getElementById("xr-status").textContent.includes("Mock user denial")');check(not p.evaluate('Rainward.snapshot().xr.active') and p.evaluate('Rainward.mode')=='pause','Permission denial leaves the preserved expedition paused with visible feedback')
  check(not errors,'No uncaught JavaScript errors in the native XR journey')
  check(not any('Shader Error' in s or 'GL_INVALID' in s for s in console),'The immersive scene renders without captured shader validation errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'kind':KIND,'errors':errors,'console':console,'scope':'Real Chromium HTTP/WebGL and real game with test-only XR session/pose/button/hand data. Normal start and living enemies; read-only route guidance only writes emulated device input. Not physical Quest 3, headset comfort, hand tracking accuracy or hardware performance certification.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=p.evaluate('Rainward.snapshot()');p.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();b.close()
