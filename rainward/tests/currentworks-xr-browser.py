"""Real game and real compositor attachments; artificial tracking, not hardware QA.
No actor writes, grants, enemy removal or planted saves.
"""
import base64,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
VIEW=os.getenv('XR_VIEW','first-person');LAYER=os.getenv('XR_LAYER','projection')
OUT=Path('test-output/currentworks-xr-'+VIEW+'-'+LAYER);OUT.mkdir(parents=True,exist_ok=True)
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
  check(p.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")'),'No planted checkpoint')
  p.locator('#xr-view-title').select_option(VIEW);p.locator('#xr-title').click();wait('Rainward.snapshot().xr.active');select('start');wait('Rainward.mode==="play"');aim()
  wait('Rainward.snapshot().visuals.currentworks.active&&!Rainward.snapshot().environmentLoading')
  env=p.evaluate('Rainward.snapshot().visuals.currentworks')
  check(env['hostThree']=='177' and env['prepared'] and not env['error'],'The same r177 game prepares Currentworks inside an actual XR render session')
  check(len(env['water'])==3 and env['trees']['trees']==5 and all(w['quality']=='light' for w in env['water']),'Water and trees retain the XR geometry budget')
  check(p.evaluate('questDevice.layer.complete'),'The external compositor framebuffer is complete')
  if VIEW.startswith('diorama'):p.evaluate('questDevice.headPitch=-.3');frames(6)
  image=capture('01-currentworks-in-game')
  check(all(e['solid']>50 and e['colorful']>20 for e in image['eyes']),'Both actual eye attachments contain the rendered upgraded world')
  if VIEW.endswith('-ar'):check(all(e['transparent']>100 for e in image['eyes']),'Both AR eyes retain transparency outside the game view')
  menu();saved=p.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');frozen=p.evaluate('Rainward.snapshot().visuals.currentworks.water[0].time');frames(12)
  check(p.evaluate('Rainward.snapshot().visuals.currentworks.water[0].time')==frozen,'The paused spatial menu freezes environmental effects')
  select('currentworks');frames(4);check(not p.evaluate('Rainward.snapshot().visuals.currentworks.active'),'The spatial settings ray can select legacy graphics')
  select('currentworks');frames(4);check(p.evaluate('Rainward.snapshot().visuals.currentworks.active'),'The same controller can restore Currentworks without a duplicate renderer')
  select('resume');wait('Rainward.mode==="play"');frames(4)
  check(p.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')==saved,'XR graphics controls preserve saved progress')
  menu();select('exit');wait('!Rainward.snapshot().xr.active');check(p.evaluate('Rainward.mode')=='pause','XR exit returns to a usable paused game')
  check(not errors and not console,'No captured game or shader errors')
  (OUT/'report.json').write_text(json.dumps({'view':VIEW,'layer':LAYER,'passed':len(checks),'checks':checks,'errors':errors,'console':console,'environment':env,'scope':'Actual Rainward HTTP/WebGL and external eye attachments, with synthetic tracked controllers. Normal title entry, host preparation, real graphics settings, pause and XR exit; no game-state assignments or planted saves. Not a complete XR mission, physical Quest, passthrough camera, comfort or performance certification.'},indent=2))
 except Exception as e:
  failure={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:failure['snapshot']=p.evaluate('Rainward.snapshot()');capture('failure')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(failure,indent=2));raise
 finally:ctx.close();browser.close()
