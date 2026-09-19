"""Actual HTTP/WebGL and game, explicit virtual XR device only. No game-state writes.
Native remaps are separate from saves. This is NOT physical Quest certification.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
VIEW=os.getenv('XR_VIEW','first-person');KIND=os.getenv('QUEST_KIND','controllers')
OUT=Path('test-output/freefield-'+VIEW+'-'+KIND);OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];console=[]
def check(value,message):
 assert value,message
 checks.append(message);print('PASS',message,flush=True);(OUT/'progress.json').write_text(json.dumps({'checks':checks,'view':VIEW,'kind':KIND,'complete':False},indent=2))
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':960,'height':640},service_workers='block')
 ctx.add_init_script(Path('rainward/tests/quest-device-mock.js').read_text())
 ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,scanned:false,cinematic:false,detailedHumans:false}));")
 page=ctx.new_page();page.set_default_timeout(60000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def wait(q):page.wait_for_function(q)
 def frames(n=3):
  old=page.evaluate('questDevice.frames');page.wait_for_function('([old,n])=>questDevice.frames>=old+n',arg=[old,n])
 def pulse(side,index):
  frames();page.evaluate('([side,index])=>questDevice.pulse(side,index)',[side,index]);frames(3)
 def pinch(value):page.evaluate("v=>questDevice.pinch('right',v)",value)
 def away():page.evaluate("()=>{for(const s of questDevice.sources)s.orientation={x:0,y:0,z:0,w:1};}")
 def pause():
  if KIND=='controllers':pulse('right',3)
  else:
   page.evaluate("()=>{const s=questDevice.sources.find(s=>s.handedness==='left');s.position={x:-.2,y:1.55,z:-.3};s.orientation={x:-Math.SQRT1_2,y:0,z:0,w:Math.SQRT1_2};s.pinch=false;}")
   wait('Rainward.mode==="pause"');page.evaluate("()=>{const s=questDevice.sources.find(s=>s.handedness==='left');s.position={x:-.25,y:1.25,z:-.4};s.orientation={x:0,y:0,z:0,w:1};}")
  wait('Rainward.mode==="pause"');frames()
 def click_row(id):
  frames();page.evaluate('''async id=>{const T=await import('./vendor/three.module.js'),xr=Rainward.snapshot().xr,r=xr.panelRows.find(r=>r.id===id);if(!r)throw Error('Missing row '+id);const p=new T.Vector3(((r.x+r.w/2)/1024-.5)*1.45,(.5-(r.y+r.h/2)/1024)*1.45,0).applyMatrix4(new T.Matrix4().fromArray(xr.panelMatrix)),s=questDevice.sources.find(s=>s.handedness==='right'),d=p.sub(new T.Vector3(s.position.x,s.position.y,s.position.z)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',id)
  frames(2)
  if id=='exit':
   if KIND=='controllers':page.evaluate("questDevice.pulse('right',0)")
   else:pinch(True)
   wait('!Rainward.snapshot().xr.active');return
  if KIND=='controllers':pulse('right',0)
  else:pinch(True);frames(2);pinch(False);frames(3)
 def select(id):
  # Use a control already visible on this page (especially the Exit toolbar).
  # Otherwise discover reachable pages with real ray clicks. Rewinding to page
  # zero before EVERY selection needlessly exceeded the external test timeout.
  for direction in ('next','prev'):
   seen=set()
   while True:
    visible=page.evaluate('({page:Rainward.snapshot().xr.panelPage,rows:Rainward.snapshot().xr.panelRows.map(r=>r.id)})')
    if id in visible['rows']:click_row(id);return
    if visible['page'] in seen:break
    seen.add(visible['page']);click_row(direction)
  raise AssertionError('Unreachable native XR row '+id+' '+str(visible['rows']))
 try:
  page.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward')
  initial=page.evaluate('Rainward.snapshot()');check(initial['freefield']['freeStride'] and initial['freefield']['footsteps']==0,'New defaults enable Free Stride and silence repetitive player footsteps')
  check(page.locator('#chapter-select option').count()==7,'All seven expedition identities remain available')
  check(page.locator('#xr-view-title option').count()==4,'First-person AR is an explicit fourth view, not an opaque VR label')
  check(page.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")'),'No checkpoint fixture is planted before entry')
  page.locator('#xr-view-title').select_option(VIEW);page.evaluate('(kind)=>questDevice.use(kind)',KIND)
  page.locator('#xr-title-hands' if KIND=='hands' else '#xr-title').click();wait('Rainward.snapshot().xr.active');frames(5)
  check(page.evaluate('questDevice.requests[0].mode')==('immersive-ar' if VIEW.endswith('-ar') else 'immersive-vr'),'The requested mode uses the correct XR session')
  select('start');wait('Rainward.mode==="play"');frames(5)
  check(not page.evaluate('Rainward.snapshot().xr.menuVisible'),'The full floating menu is hidden during ordinary gameplay')
  check(page.evaluate('Rainward.state.enemies.length===5&&Rainward.state.enemies.every(e=>e.hp>0)'),'The regular game starts with all five living enemies')
  wait('Rainward.snapshot().xr.weapon.ready.includes("pistol")')
  check(page.evaluate('Rainward.snapshot().xr.weapon.visible'),'The equipped firearm is a visible original mechanical firearm, not a controller cylinder')
  if VIEW.startswith('diorama'):
   p=page.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z})');anchor=page.evaluate('Rainward.snapshot().xr.diorama.anchor')
   page.evaluate('questDevice.head.x+=.3;questDevice.head.y-=.1');frames(5)
   check(page.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z})')==p,'Walking around the portal changes only the viewer, not the controlled character')
   check(page.evaluate('Rainward.snapshot().xr.diorama.anchor')==anchor,'The box stays fixed in reference space')
   check(page.evaluate('Rainward.snapshot().xr.diorama.portal&&Rainward.snapshot().xr.diorama.rigScale===1&&Rainward.snapshot().xr.diorama.beyondBackVisible'),'Perspective aperture keeps normal eye separation and depth beyond the rear')
   page.evaluate('questDevice.head.x-=.3;questDevice.head.y+=.1');frames(3)
  if KIND=='controllers':
   away();frames();wait('Rainward.snapshot().xr.armed')
   page.evaluate("questDevice.sources[0].gamepad.axes[2]=.65;questDevice.sources[0].gamepad.axes[3]=-.75")
   wait('Math.hypot(Rainward.state.player.x-1.3,Rainward.state.player.z-25.5)<1.15')
   page.evaluate("questDevice.sources[0].gamepad.axes=[0,0,0,0]");frames(4)
   pulse('right',4);wait('Rainward.state.taken.has("rations")')
   check(True,'Quest A interacts with the actual nearby supply cache')
   pulse('left',4);wait('Rainward.state.player.stance==="crouch"');pulse('left',4);wait('Rainward.state.player.stance==="stand"')
   check(True,'Quest X tap crouches and stands, without conflicting with reload')
   if not VIEW.startswith('diorama'):
    pulse('left',3);page.evaluate("questDevice.sources[0].gamepad.axes[2]=1");wait('Rainward.state.player.speed>8.8');speed=page.evaluate('Rainward.state.player.speed');page.evaluate("questDevice.sources[0].gamepad.axes[2]=0");frames()
    check(speed>8.8,'Free Stride reaches the faster requested running speed in the actual game');pulse('left',3)
   pause();select('resume');wait('Rainward.mode==="play"');away();frames()
   if VIEW.startswith('diorama'):
    page.evaluate('''async()=>{const T=await import('./vendor/three.module.js'),x=Rainward.snapshot().xr.diorama,a=x.anchor,s=questDevice.sources[1],d=new T.Vector3(a.x,a.y+.36,a.z-.2).sub(new T.Vector3(s.position.x,s.position.y,s.position.z)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''')
   old=page.evaluate('Rainward.state.player.mag');page.evaluate("questDevice.button('right',0,true)")
   try:page.wait_for_function('(mag)=>Rainward.state.player.mag<mag',arg=old,timeout=10000)
   finally:page.evaluate("questDevice.button('right',0,false)")
   frames(3);pulse('right',5);wait('Rainward.state.player.mag===6&&!Rainward.state.player.reload')
   check(True,'RT fires finite rounds and B reloads using the direct Quest bindings')
  else:
   pause();check(page.evaluate('Rainward.snapshot().xr.menuVisible'),'An open left palm summons the menu when it is needed')
   select('resume');wait('Rainward.mode==="play"');away();frames();page.evaluate("questDevice.pinch('left',true)");frames(3);start=page.evaluate('Rainward.state.player.x');page.evaluate("questDevice.sources[0].position.x+=.13")
   page.wait_for_function('(x)=>Rainward.state.player.x>x+.7',arg=start);page.evaluate("questDevice.pinch('left',false)");frames(3)
   check(True,'Hand pinch locomotion drives the real character without an always-visible control panel')
  if VIEW.startswith('diorama'):page.evaluate('questDevice.headPitch=-.32');frames(5)
  page.screenshot(path=str(OUT/'01-gameplay.png'))
  pause();select('freefield-settings-toggle');frames();select('remap-xr-rightsecondary-plus');frames()
  saved=page.evaluate('localStorage.getItem("svgn.rainward.v1.button-remaps")');check(json.loads(saved)['xr']['rightsecondary']!='reload','The real native remap selector persists a new gameplay binding')
  checkpoint=page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');select('reset-button-remaps');frames();check(json.loads(page.evaluate('localStorage.getItem("svgn.rainward.v1.button-remaps")'))['xr']['rightsecondary']=='reload','Menu-safe remap reset works without leaving XR')
  check(page.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')==checkpoint,'Remapping never changes checkpoint contents')
  if KIND=='controllers' and VIEW=='first-person':
   select('resume');wait('Rainward.mode==="play"');away();frames(4)
   page.evaluate("questDevice.button('left',0,true)");wait('Rainward.snapshot().xr.sight.active&&Rainward.snapshot().xr.sight.draws>0');page.evaluate("questDevice.button('left',0,false)");frames(4)
   check(not page.evaluate('Rainward.snapshot().xr.sight.headsetFovChanged'),'The scoped sight draws without changing headset field of view')
   before=page.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z,mag:Rainward.state.player.mag,objectives:{...Rainward.state.objectives}})')
   page.evaluate("()=>{questDevice.sources[1].orientation={x:0,y:-Math.SQRT1_2,z:0,w:Math.SQRT1_2};questDevice.button('left',1,true);}");frames(5)
   check(page.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z})')=={'x':before['x'],'z':before['z']},'Holding blink previews without moving the survivor')
   page.evaluate("questDevice.button('left',1,false)");page.wait_for_function('(x)=>Rainward.state.player.x>x+1',arg=before['x']);frames(4)
   check(page.evaluate('Rainward.state.player.mag')==before['mag'] and page.evaluate('Rainward.state.objectives')==before['objectives'],'Blink release uses the real clear route without granting ammunition or objectives')
   pause()
  page.screenshot(path=str(OUT/'02-settings.png'));select('exit');wait('!Rainward.snapshot().xr.active')
  check(page.evaluate('Rainward.mode')=='pause','XR exit restores the ordinary native pause screen')
  page.reload(wait_until='domcontentloaded');wait('window.Rainward');check(page.evaluate('Rainward.snapshot().buttonRemaps.xr.rightsecondary')=='reload','A browser reload retains the saved reset mapping')
  check(not errors,'No uncaught script errors during actual new-default gameplay');check(not console,'No captured browser or shader errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'view':VIEW,'kind':KIND,'scope':'Actual HTTP/WebGL game with explicit simulated XR session, pose, controller and hand data. Normal start, no gameplay state assignments or planted checkpoints. Not physical Quest/Xbox, human comfort, real passthrough or frame-rate approval.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=page.evaluate('Rainward.snapshot()');page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();browser.close()
