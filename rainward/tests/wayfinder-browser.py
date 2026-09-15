"""Actual Chromium/WebGL with a labeled XR mock and isolated authored-kit save.
No physical Quest sign-off and no living-enemy mission claim follow from this test.
"""
import json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
KIND=os.getenv('QUEST_KIND','controllers');VIEW=os.getenv('XR_VIEW','diorama-vr')
OUT=Path('test-output/rainward-wayfinder-'+KIND);OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];console=[]
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,interact,checkpoint} from './rainward/model.mjs';const s=createGame('natatorium');Object.assign(s.player,{x:2,z:47});interact(s);s.enemies.forEach(e=>e.hp=0);console.log(checkpoint(s));"],text=True).strip()
def check(v,msg):
 assert v,msg
 checks.append(msg);print('PASS',msg,flush=True)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);ctx=b.new_context(viewport={'width':960,'height':640},service_workers='block')
 ctx.add_init_script(Path('rainward/tests/quest-device-mock.js').read_text())
 ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,cinematic:false,scanned:false,detailedHumans:false}));")
 p=ctx.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
 def frames(n=3):
  before=p.evaluate('questDevice.frames');p.wait_for_function('([v,n])=>questDevice.frames>=v+n',arg=[before,n])
 def wait(q):p.wait_for_function(q)
 def press(side,on):p.evaluate("([side,on])=>{if(questDevice.kind==='hands')questDevice.pinch(side,on);else questDevice.button(side,0,on);}",[side,on])
 def aim(id):
  p.evaluate('''async id=>{const T=await import('./vendor/three.module.js'),xr=Rainward.snapshot().xr,row=xr.panelRows.find(r=>r.id===id);if(!row)throw Error('Missing row '+id);const point=new T.Vector3(((row.x+row.w/2)/1024-.5)*1.45,(.5-(row.y+row.h/2)/1024)*1.45,0).applyMatrix4(new T.Matrix4().fromArray(xr.panelMatrix)),s=questDevice.sources.find(s=>s.handedness==='right'),d=point.sub(new T.Vector3(s.position.x,s.position.y,s.position.z)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',id)
  frames(2)
 def click(id):
  aim(id);press('right',True);frames(3);press('right',False);frames(4)
 def select(id):
  for _ in range(12):
   if p.evaluate('Rainward.snapshot().xr.panelPage')==0:break
   click('prev')
  for _ in range(12):
   if p.evaluate('(id)=>Rainward.snapshot().xr.panelRows.some(r=>r.id===id)',id):break
   click('next')
  else:raise AssertionError('Missing control '+id)
  click(id)
 try:
  p.goto(BASE+'/rainward/?chapter=natatorium',wait_until='domcontentloaded');wait('window.Rainward');p.locator('#xr-view-title').select_option(VIEW);p.evaluate('(k)=>questDevice.use(k)',KIND)
  p.locator('#xr-title-hands' if KIND=='hands' else '#xr-title').click();wait('Rainward.snapshot().xr.active');frames(6);select('continue');wait('Rainward.mode==="play"');select('pack');wait('Rainward.mode==="pack"');frames(5)
  check(p.evaluate('Rainward.state.player.cloth===3&&Rainward.state.player.canister===3'),'The isolated save contains only the collected authored emergency-kit supplies')
  # Keep the unused hand pointed away so it cannot hit another spatial button.
  p.evaluate("questDevice.sources.find(s=>s.handedness==='left').orientation={x:0,y:1,z:0,w:0}")
  aim('craft-med');wait('Rainward.snapshot().xr.panelHover==="craft-med"')
  check(True,'A tracked ray visibly highlights the targeted craft button before activation')
  before=p.evaluate('Rainward.snapshot().xr.panelRows.filter(r=>r.id.startsWith("craft-")).map(({id,x,y})=>({id,x,y}))')
  press('right',True);wait('Rainward.state.player.craft&&Rainward.snapshot().xr.panelHoldOwner');
  wait('Rainward.snapshot().xr.craftReadout&&Rainward.snapshot().xr.craftReadout.percent>0')
  p.screenshot(path=str(OUT/'01-craft-feedback.png'))
  check(p.evaluate('Rainward.snapshot().xr.craftReadout.label.includes("RELEASE TO CANCEL")'),'Spatial crafting exposes percentage progress and explicit cancel guidance')
  check(p.evaluate('Rainward.snapshot().xr.panelRows.filter(r=>r.id.startsWith("craft-")).map(({id,x,y})=>({id,x,y}))')==before,'Unavailable recipes retain their positions instead of shifting under the ray')
  # Change both device inputs in one poll: release owner; hold a different source.
  p.evaluate("()=>{if(questDevice.kind==='hands'){questDevice.pinch('right',false);questDevice.pinch('left',true);}else{questDevice.button('right',0,false);questDevice.button('left',0,true);}}")
  wait('!Rainward.state.player.craft');check(p.evaluate('Rainward.state.player.cloth===3&&Rainward.state.player.canister===3&&Rainward.state.player.medkit===0'),'Releasing the initiating hand cancels and refunds once even while the other input stays held')
  check(p.evaluate('!Rainward.snapshot().xr.panelHoldOwner'),'Cancelled spatial holds do not leave a stale owner')
  press('left',False);frames(5);aim('craft-smoke');press('right',True);wait('Rainward.state.player.smoke===1&&!Rainward.state.player.craft');frames(3)
  check(p.evaluate('Rainward.state.player.smoke===1&&Rainward.state.player.cloth===2&&Rainward.state.player.canister===2'),'A deliberate sustained hold crafts exactly one item and cannot repeat while held')
  press('right',False);frames(5)
  aim('craft-med');press('right',True);wait('!!Rainward.state.player.craft');p.evaluate("questDevice.sources.find(s=>s.handedness==='right').tracked=false");wait('Rainward.mode==="pause"&&!Rainward.state.player.craft')
  check(p.evaluate('Rainward.state.player.cloth===2&&Rainward.state.player.canister===2'),'Tracking loss cancels the active craft and restores its reserved supplies')
  press('right',False);p.evaluate("questDevice.sources.find(s=>s.handedness==='right').tracked=true");frames(7);select('resume');wait('Rainward.mode==="play"');select('pack');frames(5)
  check(p.evaluate('!Rainward.snapshot().xr.panelHoldOwner'),'Tracking recovery requires a fresh selection rather than resuming the old craft')
  p.screenshot(path=str(OUT/'02-recovered-panel.png'));select('back');wait('Rainward.mode==="play"');select('pause');frames(5);aim('exit');press('right',True);wait('!Rainward.snapshot().xr.active');press('right',False)
  check(p.evaluate('Rainward.mode')=='pause','Exiting the polished interface preserves the desktop pause state')
  check(not errors,'No uncaught JavaScript errors in the isolated XR interaction journey')
  check(not any('Shader Error' in s or 'GL_INVALID' in s for s in console),'New cursor and feedback render without captured shader validation errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'kind':KIND,'view':VIEW,'errors':errors,'console':console,'scope':'Real HTTP/WebGL/game with explicit XR device data and authored-kit dry-shelter fixture; enemies defeated to isolate input and rendering. Not physical Quest or living-enemy mission evidence.'},indent=2))
 except Exception as error:
  data={'error':str(error),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=p.evaluate('Rainward.snapshot()');p.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:ctx.close();b.close()
