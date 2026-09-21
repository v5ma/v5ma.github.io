"""Normal-start real game with explicit tracking and actual XR eye attachments.
No actor assignments, planted saves, rewards or enemy removal. Not hardware QA.
"""
import base64,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
VIEW=os.getenv('XR_VIEW','first-person');KIND=os.getenv('QUEST_KIND','controllers');LAYER=os.getenv('XR_LAYER','projection')
OUT=Path('test-output/field-desk-'+VIEW+'-'+KIND+'-'+LAYER);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);ctx=browser.new_context(viewport={'width':960,'height':640},service_workers='block')
 ctx.add_init_script('window.REPAIR_LAYER='+json.dumps(LAYER)+';\n'+Path('rainward/tests/quest-device-mock.js').read_text()+'\n'+Path('rainward/tests/xr-repair-device.js').read_text()+"\nlocalStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,scanned:false,cinematic:false,detailedHumans:false}));")
 p=ctx.new_page();p.set_default_timeout(30000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def wait(q):p.wait_for_function(q)
 def frames(n=3):
  before=p.evaluate('questDevice.frames');p.wait_for_function('([v,n])=>questDevice.frames>=v+n',arg=[before,n])
 def check(value,label):
  assert value,label
  checks.append(label);print('PASS',label,flush=True);(OUT/'progress.json').write_text(json.dumps({'checks':checks,'complete':False},indent=2))
 def click(id):
  frames(3);p.evaluate('''async id=>{const T=await import('./vendor/three.module.js'),xr=Rainward.snapshot().xr,r=xr.panelRows.find(r=>r.id===id);if(!r)throw Error('Missing '+id);const target=new T.Vector3(((r.x+r.w/2)/1024-.5)*1.45,(.5-(r.y+r.h/2)/1024)*1.45,0).applyMatrix4(new T.Matrix4().fromArray(xr.panelMatrix)),src=questDevice.sources[1],dir=target.sub(new T.Vector3(src.position.x,src.position.y,src.position.z)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),dir);src.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',id);frames(3)
  if KIND=='hands':p.evaluate("questDevice.pinch('right',true)")
  else:p.evaluate("questDevice.pulse('right',0)")
  if id=='exit':wait('!Rainward.snapshot().xr.active');return
  frames(3)
  if KIND=='hands':p.evaluate("questDevice.pinch('right',false)");frames(3)
 def select(id):
  for direction in ['next','prev']:
   seen=set()
   while True:
    data=p.evaluate('({page:Rainward.snapshot().xr.panelPage,rows:Rainward.snapshot().xr.panelRows.map(r=>r.id)})')
    if id in data['rows']:click(id);return
    if data['page'] in seen:break
    seen.add(data['page']);click(direction)
  raise AssertionError('Unreachable '+id)
 def menu():
  if KIND=='hands':
   p.evaluate("()=>{const s=questDevice.sources[0];s.position={x:-.2,y:1.55,z:-.3};s.orientation={x:-Math.SQRT1_2,y:0,z:0,w:Math.SQRT1_2};s.pinch=false;}");wait('Rainward.mode==="pause"');p.evaluate("()=>{const s=questDevice.sources[0];s.position={x:-.25,y:1.25,z:-.4};s.orientation={x:0,y:0,z:0,w:1};}")
  else:
   p.evaluate("questDevice.button('right',5,true)");wait('Rainward.mode==="pause"');p.evaluate("questDevice.button('right',5,false)")
  frames(4)
 def capture(label):
  p.evaluate('(label)=>questDevice.captureRequested=label',label);p.wait_for_function('(label)=>questDevice.captures.some(c=>c.label===label)',arg=label);c=p.evaluate('(label)=>questDevice.captures.find(c=>c.label===label)',label);(OUT/(label+'.png')).write_bytes(base64.b64decode(c.pop('png').split(',')[1]));(OUT/(label+'.json')).write_text(json.dumps(c,indent=2));return c
 def preserved():return p.evaluate("JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k.includes('checkpoint')||k.includes('button-remaps')).map(k=>[k,localStorage.getItem(k)])))")
 try:
  p.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward');check(p.evaluate('!localStorage.getItem("svgn.rainward.v1.checkpoint")'),'Normal entry uses no planted checkpoint')
  p.locator('#xr-view-title').select_option(VIEW);p.evaluate('(kind)=>questDevice.use(kind)',KIND);p.locator('#xr-title-hands' if KIND=='hands' else '#xr-title').click();wait('Rainward.snapshot().xr.active');select('start');wait('Rainward.mode==="play"');frames(5)
  check(p.evaluate('!Rainward.snapshot().xr.menuVisible&&!Rainward.snapshot().xr.fieldDesk.visible'),'The panel and pedestal are stowed during ordinary gameplay')
  menu();rows=p.evaluate('Rainward.snapshot().xr.panelRows.map(r=>r.id)');check(all(id in rows for id in ['resume','map','pack','last-clue']),'Resume, map, satchel and clue recall are on the first menu page')
  original=p.evaluate('({matrix:Rainward.snapshot().xr.panelMatrix,anchor:Rainward.snapshot().xr.fieldDesk.anchor,player:{x:Rainward.state.player.x,z:Rainward.state.player.z},mag:Rainward.state.player.mag})');save=preserved()
  p.evaluate('questDevice.head.x+=.2;questDevice.headYaw=.35;questDevice.headPitch=-.1');frames(8);select('next');frames(3)
  check(p.evaluate('Rainward.snapshot().xr.panelMatrix')==original['matrix'],'Turning the head and changing pages do not drag the menu toward the gaze')
  check(p.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z})')==original['player'],'Looking around the paused desk never moves the survivor')
  select('desk-layout');wait('Rainward.snapshot().xr.panelView==="desk"')
  before=p.evaluate('Rainward.snapshot().xr.fieldDesk.options');click('desk-raise');click('desk-closer');click('desk-larger');click('desk-left');frames(4)
  after=p.evaluate('Rainward.snapshot().xr.fieldDesk.options');check(after['height']>before['height'] and after['distance']<before['distance'] and after['scale']>before['scale'] and after['yaw']>before['yaw'],'Transformed buttons remain ray-selectable through height, distance, scale and rotation changes')
  check(p.evaluate('Rainward.snapshot().xr.fieldDesk.anchor')==original['anchor'],'Layout adjustments keep the captured reference anchor')
  image=capture('01-adjusted-desk');check(all(e['solid']>100 and e['colorful']>30 for e in image['eyes']),'Both actual compositor eyes contain the adjusted spatial interface')
  if KIND=='controllers':
   p.evaluate("questDevice.sources[1].orientation={x:0,y:1,z:0,w:0};questDevice.sources[0].gamepad.axes[3]=1");frames(3);p.evaluate('questDevice.sources[0].gamepad.axes[3]=0');frames(4);p.evaluate("questDevice.pulse('right',4)");frames(4)
   check(p.evaluate('Rainward.snapshot().xr.fieldDesk.options.height')>after['height'],'Thumbstick focus and A also operate placement without a pointed ray')
  click('back');wait('Rainward.snapshot().xr.panelView!=="desk"');select('map');wait('Rainward.mode==="map"&&Rainward.snapshot().xr.panelView==="map"');frames(4)
  check('NEXT:' in p.locator('#next-goal').text_content(),'Opening the map immediately displays the current mission objective');capture('02-map');click('back');wait('Rainward.mode==="play"');frames(5)
  check(p.evaluate('!Rainward.snapshot().xr.menuVisible&&!Rainward.snapshot().xr.fieldDesk.visible'),'Closing the map removes its visual and hit target, not just its text')
  menu();select('last-clue');wait('!!Rainward.snapshot().xr.reading');check('No clue' in p.evaluate('Rainward.snapshot().xr.reading.text'),'Clue recall does not reveal an unacquired solution');click('back');wait('Rainward.mode==="play"')
  menu();select('musicVolume-plus');frames(3);select('resume');wait('Rainward.mode==="play"');menu();check(p.evaluate('Rainward.state.player.mag')==original['mag'],'Menu selection and layout controls do not spend ammunition')
  check(preserved()==save,'Layout, map and audio changes preserve checkpoints and remaps byte-for-byte')
  stored=p.evaluate('localStorage.getItem("svgn.rainward.v1.field-desk")');select('exit');check(p.evaluate('Rainward.mode')=='pause','Exit ends the actual XR session and retains native pause recovery')
  p.locator('#xr-hands' if KIND=='hands' else '#xr-start').click();wait('Rainward.snapshot().xr.active');frames(5)
  check(p.evaluate('questDevice.sessions.filter(s=>!s.ended).length')==1,'Reentry leaves exactly one active session')
  check(p.evaluate('localStorage.getItem("svgn.rainward.v1.field-desk")')==stored,'Reentry keeps preferences without persisting room coordinates');select('exit');p.reload(wait_until='domcontentloaded');wait('window.Rainward');check(p.evaluate('localStorage.getItem("svgn.rainward.v1.field-desk")')==stored,'Browser reload retains the separate validated layout preference')
  check(not errors and not console,'No captured game or graphics errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'view':VIEW,'kind':KIND,'layer':LAYER,'errors':errors,'console':console,'scope':'Normal-start real HTTP/WebGL game and GPU eye attachments with artificial tracked controllers/hands. Real menu/volume/map/reentry and stored layout actions; no game-state assignments or planted saves. Not physical Quest/Xbox, passthrough camera, comfort or sustained hardware performance.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=p.evaluate('Rainward.snapshot()');capture('failure')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();browser.close()
