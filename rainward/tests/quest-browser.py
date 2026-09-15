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
 ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,cinematic:false,scanned:false,detailedHumans:false}));")
 p=ctx.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def wait(q):p.wait_for_function(q)
 def frames(n=4):
  old=p.evaluate('questDevice.frames');p.wait_for_function('([old,n])=>questDevice.frames>=old+n',arg=[old,n])
 def trigger(on):
  p.evaluate("on=>{if(questDevice.kind==='hands')questDevice.pinch('right',on);else questDevice.button('right',0,on);}",on)
 def select(row_id):
  for _ in range(9):
   if p.evaluate('Rainward.snapshot().xr.panelPage')==0:break
   click_visible('prev')
  for _ in range(12):
   ids=p.evaluate('Rainward.snapshot().xr.panelRows.map(r=>r.id)')
   if row_id in ids:break
   click_visible('next')
  else:raise AssertionError('XR row not found: '+row_id+' '+str(ids))
  click_visible(row_id)
 def click_visible(row_id):
  frames(4)
  p.evaluate('''async id=>{const T=await import('./vendor/three.module.js'),xr=Rainward.snapshot().xr,row=xr.panelRows.find(r=>r.id===id);if(!row)throw Error('No row '+id);const uv={x:(row.x+row.w/2)/1024,y:1-(row.y+row.h/2)/1024},point=new T.Vector3((uv.x-.5)*1.45,(uv.y-.5)*1.45,0).applyMatrix4(new T.Matrix4().fromArray(xr.panelMatrix)),s=questDevice.sources.find(s=>s.handedness==='right'),d=point.sub(new T.Vector3(s.position.x,s.position.y,s.position.z)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',row_id)
  frames(3);trigger(True);frames(4);trigger(False);frames(5)
 def away():p.evaluate("()=>{for(const s of questDevice.sources)s.orientation={x:0,y:0,z:0,w:1};}")
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
  away();frames(5);start=p.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z,t:Rainward.state.t})')
  if KIND=='controllers':p.evaluate("questDevice.sources[0].gamepad.axes[3]=-1")
  else:
   p.evaluate("questDevice.pinch('left',true)");frames(4);p.evaluate("questDevice.sources[0].position.z-=.13")
  p.wait_for_function('(z)=>Rainward.state.player.z<z-1',arg=start['z']);
  if KIND=='controllers':p.evaluate("questDevice.sources[0].gamepad.axes[3]=0")
  else:p.evaluate("questDevice.pinch('left',false)")
  frames(4);check(p.evaluate('Rainward.state.t')>start['t'],'XR locomotion advances the real mission clock and moves the player')
  if KIND=='controllers':
   old=p.evaluate('Rainward.snapshot().xr.rig.yaw');p.evaluate("questDevice.sources[1].gamepad.axes[2]=1");frames(5);p.evaluate("questDevice.sources[1].gamepad.axes[2]=0");frames(5);check(abs(p.evaluate('Rainward.snapshot().xr.rig.yaw')-old)>.4,'Right stick produces a bounded snap turn')
  else:
   select('turn-right');check(abs(p.evaluate('Rainward.snapshot().xr.rig.yaw'))>.4,'Hand ray/pinch selects a snap-turn field action')
  select('reload');select('pack');wait('Rainward.mode==="pack"');frames(5);p.screenshot(path=str(OUT/'02-xr-satchel.png'))
  select('equip-rifle');check(p.evaluate('Rainward.state.player.equipped')=='rifle','Satchel equipment is operated through a ray-selectable control')
  select('back');wait('Rainward.mode==="play"');select('pause');wait('Rainward.mode==="pause"')
  select('musicVolume-minus');check(p.evaluate('document.getElementById("musicVolume").value')=='35','An in-world slider changes the existing audio setting')
  select('retry');wait('Rainward.mode==="confirm"');check(p.evaluate('document.activeElement.id')=='confirm-no','A new confirmation retains safe Cancel focus');select('confirm-no');wait('Rainward.mode==="pause"')
  select('resume');wait('Rainward.mode==="play"');away();frames(5)
  p.evaluate("questDevice.use(questDevice.kind==='hands'?'controllers':'hands')");wait('Rainward.mode==="pause"');frames(6);check(p.evaluate('Rainward.snapshot().xr.active'),'Changing between controllers and hands pauses without ending XR')
  select('resume');wait('Rainward.mode==="play"');p.evaluate('questDevice.headTracked=false');wait('Rainward.mode==="pause"');p.evaluate('questDevice.headTracked=true');frames(6)
  check(p.evaluate('Rainward.snapshot().xr.active'),'Loss of viewer tracking pauses and recovers within the session')
  select('retry');wait('Rainward.mode==="confirm"');select('confirm-yes');wait('Rainward.mode==="play"');frames(6)
  check(p.evaluate('Rainward.state.checkpoint')=='natatorium-lobby','XR retry restores the actual dry shelter checkpoint')
  check(p.evaluate('questDevice.sessions.length')==1,'Retry also retains one XR session across the renderer handoff')
  select('pause');select('to-title');wait('Rainward.mode==="confirm"');select('confirm-yes');wait('Rainward.mode==="title"');select('chapter-select-minus');select('start');wait('Rainward.mode==="play"&&Rainward.state.level!=="natatorium"');frames(6)
  check(p.evaluate('questDevice.sessions.length===1&&Rainward.snapshot().xr.active'),'Changing expeditions remains playable in the same immersive session')
  p.screenshot(path=str(OUT/'03-second-chapter.png'));select('exit');wait('!Rainward.snapshot().xr.active');check(p.evaluate('Rainward.mode')=='pause','Exiting XR returns to the preserved desktop pause interface')
  check(not errors,'No uncaught JavaScript errors in the native XR journey')
  check(not any('Shader Error' in s or 'GL_INVALID' in s for s in console),'The immersive scene renders without captured shader validation errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'kind':KIND,'errors':errors,'console':console,'scope':'Real Chromium HTTP/WebGL and real game with test-only XR session/pose/button/hand data. Not physical Quest 3, headset comfort, hand tracking accuracy or hardware performance certification.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=p.evaluate('Rainward.snapshot()');p.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();b.close()
