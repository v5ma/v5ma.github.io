"""Real game and real compositor attachments; artificial tracking, not hardware QA.
No actor writes, grants, enemy removal or planted saves.
"""
import base64,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
VIEW=os.getenv('XR_VIEW','first-person');LAYER=os.getenv('XR_LAYER','projection')
OUT=Path('test-output/xr-repair-'+VIEW+'-'+LAYER);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[]
with sync_playwright() as pw:
 args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**args);ctx=browser.new_context(viewport={'width':960,'height':640},service_workers='block')
 ctx.add_init_script("window.REPAIR_LAYER="+json.dumps(LAYER)+";\n"+Path('rainward/tests/quest-device-mock.js').read_text()+"\n"+Path('rainward/tests/xr-repair-device.js').read_text()+"\nlocalStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,scanned:false,cinematic:false,detailedHumans:false}));")
 p=ctx.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def wait(q):p.wait_for_function(q)
 def frames(n=3):
  old=p.evaluate('questDevice.frames');p.wait_for_function('([old,n])=>questDevice.frames>=old+n',arg=[old,n])
 def tap(side,i):frames();p.evaluate('([side,i])=>questDevice.pulse(side,i)',[side,i]);frames(4)
 def check(v,t):
  assert v,t
  checks.append(t);print('PASS',t,flush=True)
 def aim():p.evaluate("()=>{for(const s of questDevice.sources)s.orientation={x:0,y:0,z:0,w:1};}");frames(4)
 def menu():
  frames();p.evaluate("questDevice.button('right',5,true)");wait('Rainward.mode===\"pause\"');p.evaluate("questDevice.button('right',5,false)");frames(4)
 def click(id):
  frames();p.evaluate('''async id=>{const T=await import('./vendor/three.module.js'),s=Rainward.snapshot().xr,r=s.panelRows.find(r=>r.id===id);if(!r)throw Error('Missing '+id);const q=new T.Vector3(((r.x+r.w/2)/1024-.5)*1.45,(.5-(r.y+r.h/2)/1024)*1.45,0).applyMatrix4(new T.Matrix4().fromArray(s.panelMatrix)),src=questDevice.sources[1],d=q.sub(new T.Vector3(src.position.x,src.position.y,src.position.z)).normalize(),rot=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);src.orientation={x:rot.x,y:rot.y,z:rot.z,w:rot.w};}''',id)
  frames(3)
  if id=='exit':p.evaluate("questDevice.pulse('right',0)");wait('!Rainward.snapshot().xr.active');return
  tap('right',0)
 def select(id):
  for _ in range(16):
   if p.evaluate('Rainward.snapshot().xr.panelPage')==0:break
   click('prev')
  for _ in range(30):
   if id in p.evaluate('Rainward.snapshot().xr.panelRows.map(r=>r.id)'):click(id);return
   click('next')
  raise AssertionError('No spatial row '+id)
 def capture(label):
  p.evaluate('(x)=>questDevice.captureRequested=x',label);p.wait_for_function('(x)=>questDevice.captures.some(c=>c.label===x)',arg=label)
  c=p.evaluate('(x)=>questDevice.captures.find(c=>c.label===x)',label);(OUT/(label+'.png')).write_bytes(base64.b64decode(c.pop('png').split(',')[1]));(OUT/(label+'.json')).write_text(json.dumps(c,indent=2));return c
 def go(x,z):
  aim();p.evaluate("questDevice.sources[0].gamepad.axes=[0,0,0,0]");frames(4)
  p.evaluate("async({x,z})=>{const driver=await import('./tests/xr-repair-steering.mjs');await driver.driveTo(x,z);}",{'x':x,'z':z});frames(3)
 def defend():
  p.evaluate("async()=>{const driver=await import('./tests/xr-repair-steering.mjs');await driver.clearPursuer();}");frames(4)
 def scope(label):
  aim();p.evaluate("questDevice.button('left',0,true)");wait('Rainward.snapshot().xr.sight.active&&Rainward.snapshot().xr.sight.sceneDraws>1');frames(4);r=p.evaluate('Rainward.snapshot().xr.sight');capture(label);p.evaluate("questDevice.button('left',0,false)");frames(3);return r
 try:
  p.goto(BASE+'/rainward/?chapter=conservatory',wait_until='domcontentloaded');wait('window.Rainward')
  check(p.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")'),'No checkpoint was planted')
  p.locator('#xr-view-title').select_option(VIEW);p.locator('#xr-title').click();wait('Rainward.snapshot().xr.active');select('start');wait('Rainward.mode==="play"');aim()
  check(p.evaluate('questDevice.layer.complete'),'A real non-default XR compositor framebuffer is complete')
  check(p.evaluate('Rainward.snapshot().freefield.autoRun'),'Fast running is the default without a stick-click requirement')
  check(p.evaluate('Rainward.state.enemies.every(e=>e.hp>0)'),'The authored enemies remain alive')
  menu();check(p.evaluate('Rainward.snapshot().xr.menuVisible'),'Hold B summons the actual on-demand menu');select('resume');wait('Rainward.mode==="play"');aim();check(not p.evaluate('Rainward.snapshot().xr.menuVisible'),'Releasing the menu restores unobstructed gameplay')
  if VIEW.startswith('diorama'):p.evaluate('questDevice.headPitch=-.3');frames(4)
  image=capture('01-world-layer');check(all(e['solid']>50 and e['colorful']>20 for e in image['eyes']),'Both compositor eyes contain actual rendered game content')
  if VIEW.endswith('-ar'):check(all(e['transparent']>100 for e in image['eyes']),'Both AR eye images retain transparent room area')
  if not VIEW.startswith('diorama'):
   aim();r=p.evaluate('Rainward.snapshot().xr.weapon');check(abs(r['direction'][1])<1e-5 and r['direction'][2]<-.999,'Gun points level despite a deliberately tilted physical grip pose')
   before=p.evaluate('Rainward.state.player.mag')
   # Fire is a held action consumed by the bounded 60 Hz simulation, not an
   # edge event. One 90 Hz mock-frame tap can contain no simulation step.
   # Keep the real trigger held until the first finite-ammo shot, then release.
   p.evaluate("questDevice.button('right',0,true)")
   try:p.wait_for_function('(mag)=>Rainward.state.player.mag<mag',arg=before,timeout=10000)
   finally:p.evaluate("questDevice.button('right',0,false)")
   frames(3);shot=p.evaluate('Rainward.state.events.filter(e=>e.type==="shot").at(-1)');ray=p.evaluate('Rainward.snapshot().xr.weapon');check(abs(shot['to']['y']-shot['from']['y'])<.15,'Forward trigger fire travels forward without aiming at the sky')
   check(sum((shot['from'][k]-ray['muzzle'][i])**2 for i,k in enumerate(['x','y','z']))<.0025,'Actual projectile starts at the visible safe muzzle')
   tap('right',5);wait('Rainward.state.player.mag===6&&!Rainward.state.player.reload');check(True,'A short B press reloads rather than opening the menu')
   scope('02-sight-first-chapter')
   go(-7,19);go(-29,10);go(-29,7);tap('right',1);wait('Rainward.mode==="pause"&&Rainward.snapshot().xr.reading')
   note=p.evaluate('Rainward.snapshot().xr.reading');expected=p.evaluate('(async()=>{const W=await import("./world.mjs");return W.CURRENT.puzzle.clue.text;})()');check(note['text']==expected and len(note['visibleLines'])>1,'The complete acquired puzzle inscription appears in VR, not a truncated wrist hint');capture('03-readable-puzzle');click('back');wait('Rainward.mode==="play"');defend()
   for x,z,count in [(-29,1,2),(-29,-7,3),(-29,-15,1)]:
    go(x,z);defend()
    for _ in range(count):tap('right',1)
   wait('Rainward.state.puzzle.solved');check(True,'Actual wheel interactions solve the acquired clue with no puzzle-state assignment')
  else:
   anchor=p.evaluate('Rainward.snapshot().xr.diorama.anchor');position=p.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z})');p.evaluate('questDevice.head.x+=.25');frames(5);check(p.evaluate('Rainward.snapshot().xr.diorama.anchor')==anchor and p.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z})')==position,'Looking around the centered portal does not move the survivor or box');p.evaluate('questDevice.head.x-=.25');frames()
  menu();select('to-title');wait('Rainward.mode==="confirm"');select('confirm-yes');wait('Rainward.mode==="title"');select('chapter-select-plus');select('start');wait('Rainward.mode==="play"&&Rainward.state.level!=="conservatory"');aim()
  if not VIEW.startswith('diorama'):
   second=scope('04-sight-next-chapter');check(second['sceneDraws']>1 and not second['headsetFovChanged'],'Scope refreshes immediately in the next chapter with unchanged headset field of view')
  image=capture('04-next-chapter-layer');check(all(e['solid']>50 for e in image['eyes']),'Changing chapter keeps both actual compositor eyes rendered')
  menu();select('exit');check(p.evaluate('Rainward.mode')=='pause','Exit retains the mission and returns to the native pause screen')
  check(not errors and not console,'No captured script or graphics errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'view':VIEW,'layer':LAYER,'defenseInputs':p.evaluate('questDevice.repairDefense||[]'),'errors':errors,'console':console,'scope':'Actual HTTP/WebGL game using artificial XR controller/head poses, distinct grip and ray frames, real offscreen base-layer framebuffer or projection-layer texture attachments. Captures are compositor images, not desktop mirror screenshots. Read-only frame-paced steering with braking and synthetic defensive controller aiming at the actual type-specific torso use finite ammunition and damage; no game-state assignment, grants or enemy removal. Not physical Quest or real room passthrough approval.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=p.evaluate('Rainward.snapshot()');capture('failure-layer')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();browser.close()
