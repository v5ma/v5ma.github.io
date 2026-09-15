"""Real Chromium/WebGL/game with explicit XR device poses; not physical Quest QA."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
KIND=os.getenv('QUEST_KIND','controllers');VIEW=os.getenv('XR_VIEW','diorama-vr');OUT=Path('test-output/rainward-'+VIEW+'-'+KIND);OUT.mkdir(parents=True,exist_ok=True)
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
 def trigger(on):p.evaluate("on=>{if(questDevice.kind==='hands')questDevice.pinch('right',on);else questDevice.button('right',0,on);}",on)
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
  frames(3);trigger(True)
  if row_id=='exit':wait('!Rainward.snapshot().xr.active');trigger(False);return
  frames(4);trigger(False);frames(5)
 def away():p.evaluate("()=>{for(const s of questDevice.sources)s.orientation={x:0,y:0,z:0,w:1};}")
 try:
  p.goto(BASE+'/rainward/?chapter=natatorium',wait_until='domcontentloaded');wait('window.Rainward')
  check(p.evaluate('Rainward.mode')=='title','The native title initializes without a fatal UI construction error');check(p.locator('#xr-view-title option').count()==3,'First-person VR, third-person VR and third-person AR are explicit native choices')
  p.locator('#xr-view-title').select_option(VIEW);p.evaluate('(kind)=>questDevice.use(kind)',KIND)
  p.locator('#xr-title-hands' if KIND=='hands' else '#xr-title').click();wait('Rainward.snapshot().xr.active');frames(8)
  check(p.evaluate('questDevice.requests[0].mode')==('immersive-ar' if VIEW=='diorama-ar' else 'immersive-vr'),'The selected diorama requests the correct immersive session type')
  check(p.evaluate('Rainward.snapshot().xr.mode')==VIEW,'The actual game adapter enters the requested third-person view')
  select('start');wait('Rainward.mode==="play"');frames(10)
  check(p.evaluate('Rainward.snapshot().camera.heroVisible'),'The existing survivor is rendered in third person, not hidden as in first person')
  check(p.evaluate('Rainward.state.enemies.length===6&&Rainward.state.enemies.every(e=>e.hp>0)'),'The miniature is the normal mission with six living enemies, not a duplicate showcase')
  initial=p.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z,anchor:Rainward.snapshot().xr.diorama.anchor,head:{...questDevice.head}})')
  p.evaluate('questDevice.head.x+=.25;questDevice.head.y-=.2;questDevice.head.z+=.1');frames(10)
  check(p.evaluate('([x,z])=>Rainward.state.player.x===x&&Rainward.state.player.z===z',[initial['x'],initial['z']]),'Physically leaning/walking around the table never drives character locomotion')
  check(p.evaluate('Rainward.snapshot().xr.diorama.anchor')==initial['anchor'],'The diorama anchor remains fixed while the viewer moves')
  p.evaluate('(h)=>questDevice.head=h',initial['head']);frames(5)
  for row,shell,top,front in [('shell-top','top-open',True,False),('shell-front','front-open',False,True),('shell-both','both-open',True,True)]:
   select(row);frames(5);d=p.evaluate('Rainward.snapshot().xr.diorama');check(d['shell']==shell and d['topOpen']==top and d['frontOpen']==front,'Spatial selection applies '+shell+' with at least one visible opening')
   check(not ('front' in d['closedFaces'] and 'top' in d['closedFaces']),'The rendered shell never closes both its front and top')
   p.screenshot(path=str(OUT/(shell+'.png')))
  scale=p.evaluate('Rainward.snapshot().xr.diorama.scale');select('display-larger');frames(5)
  d=p.evaluate('Rainward.snapshot().xr.diorama');check(abs(d['scale']-scale-.01)<1e-9 and d['physicalDimensions']=={'width':1.6,'depth':1.2,'height':.72},'Zoom enlarges game content without enlarging the physical display')
  select('display-smaller');frames(5);check(p.evaluate('Rainward.snapshot().xr.diorama.extraRenderTargets')==0,'The diorama adds no offscreen theatre or full-screen render target')
  select('display-follow');check(p.evaluate('Rainward.snapshot().xr.diorama.follow')==False,'Content follow can be disabled using a spatial control')
  select('display-follow');select('recenter');frames(5)
  away();frames(6);wait('Rainward.snapshot().xr.armed');start=p.evaluate('Rainward.state.player.z')
  if KIND=='controllers':p.evaluate("questDevice.sources[0].gamepad.axes[3]=-1")
  else:
   p.evaluate("questDevice.pinch('left',true)");frames(4);p.evaluate("questDevice.sources[0].position.z-=.13")
  p.wait_for_function('(z)=>Rainward.state.player.z<z-1',arg=start)
  if KIND=='controllers':p.evaluate("questDevice.sources[0].gamepad.axes[3]=0")
  else:p.evaluate("questDevice.pinch('left',false)")
  frames(5);check(True,'Tracked controller or pinch-stick moves the real character inside the stationary diorama')
  select('pack');wait('Rainward.mode==="pack"');select('equip-rifle');check(p.evaluate('Rainward.state.player.equipped')=='rifle','Original satchel equipment works through the scaled spatial interface')
  select('back');wait('Rainward.mode==="play"');select('pause');wait('Rainward.mode==="pause"')
  select('retry');wait('Rainward.mode==="confirm"');check(p.evaluate('document.activeElement.id')=='confirm-no','Diorama confirmations retain safe Cancel focus')
  select('confirm-no');wait('Rainward.mode==="pause"')
  if VIEW=='diorama-vr':
   saved=p.evaluate('localStorage.getItem("svgn.rainward.v2.chapter-checkpoints")');select('view-toggle');frames(7)
   check(p.evaluate('Rainward.snapshot().xr.mode')=='immersive-first-person','VR can switch from the diorama back to the existing first-person experience')
   select('view-toggle');frames(7);check(p.evaluate('Rainward.snapshot().xr.mode')=='diorama-vr','Returning to the diorama keeps the same mission')
   check(p.evaluate('localStorage.getItem("svgn.rainward.v2.chapter-checkpoints")')==saved,'Perspective changes never migrate, clear or rewrite checkpoint data')
  else:
   check(p.evaluate('questDevice.sessions[0].environmentBlendMode')=='alpha-blend','The mock AR compositor is explicitly transparent, not opaque VR labeled AR')
  check(p.evaluate('questDevice.sessions.length')==1,'UI and perspective operations preserve one XR session')
  select('exit');wait('!Rainward.snapshot().xr.active');check(p.evaluate('Rainward.mode')=='pause','Exiting a diorama returns to the preserved desktop pause menu')
  check(p.evaluate('JSON.parse(localStorage.getItem("svgn.rainward.v1.xr-view")).shell')=='both-open','Only validated presentation preferences are persisted separately from saves')
  check(not errors,'No uncaught JavaScript errors in the diorama journey')
  check(not any('Shader Error' in s or 'GL_INVALID' in s for s in console),'The real clipped scene renders without captured shader errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'kind':KIND,'view':VIEW,'errors':errors,'console':console,'scope':'Real Chromium/WebGL/game with an explicit XR pose/session/controller/hand mock. Not a physical Quest 3 or a view of a real passthrough camera. Physical tracking, comfort, real-room placement and frame-time acceptance remain open.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=p.evaluate('Rainward.snapshot()');p.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();b.close()
