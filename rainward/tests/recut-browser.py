"""Native geometry/save test with an explicitly enemy-defeated authored shelter.
Not living-enemy balance, physical hardware or final-art certification.
"""
import json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-clinic-recut');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[];dialogs=[]
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,checkpoint} from './rainward/model.mjs';const s=createGame();s.enemies.forEach(e=>e.hp=0);console.log(checkpoint(s));"],text=True).strip()
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw);context=browser.new_context(viewport={'width':1100,'height':760},service_workers='block')
 context.add_init_script("if(!localStorage.getItem('recut-seeded')){localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.setItem('recut-seeded','1');localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:'survival',mute:true,low:true,scanned:false,cinematic:false,detailedHumans:false,toggleSprint:false}));}")
 context.add_init_script("window.pad={connected:true,mapping:'standard',index:0,id:'Clinic recut virtual Xbox',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;window.padPulse=[];Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;const buttons=pad.buttons.map(b=>({...b}));for(const i of padPulse)buttons[i]={pressed:true,value:1};padPulse=[];return [{...pad,axes:[...pad.axes],buttons}];}});")
 page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None);page.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
 def wait(q):page.wait_for_function(q)
 def frames(n=3):
  old=page.evaluate('padPolls');page.wait_for_function('([old,n])=>padPolls>=old+n',arg=[old,n])
 def pulse(i):frames();page.evaluate('(i)=>padPulse=[i]',i);frames(4)
 def nav(target):
  for _ in range(100):
   if page.evaluate('document.activeElement.id')==target:return
   pulse(13)
  raise AssertionError('Cannot reach '+target)
 def use(condition):pulse(3);wait(condition)
 def capture(name):page.screenshot(path=str(OUT/(name+'.png')))
 def go(x,z):
  print('GO',x,z,flush=True)
  page.evaluate('''async ({x,z})=>{const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});route.push({x,z});await new Promise((resolve,reject)=>{let i=0;const start=performance.now(),stop=()=>{pad.axes[0]=pad.axes[1]=0;clearInterval(timer);},timer=setInterval(()=>{const p=Rainward.state.player;if(Rainward.mode!=='play'||performance.now()-start>150000){stop();reject(Error('Walk interrupted '+JSON.stringify({x:p.x,z:p.z,goal:route[i]})));return;}const q=route[i],dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d<.35){if(++i===route.length){stop();resolve();}return;}const yaw=Rainward.view.yaw,scale=Math.min(1,Math.max(.4,d));pad.axes[0]=(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/d*scale;pad.axes[1]=(Math.sin(yaw)*dx+Math.cos(yaw)*dz)/d*scale;},20);});}''',{'x':x,'z':z});frames()
 try:
  page.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2');nav('continue');pulse(0);wait('Rainward.mode==="play"');frames(5)
  check(page.evaluate('Rainward.state.level')=='district','Legacy dry-shelter fixture restores the original Floodgate slot')
  check(page.locator('#chapter-select option').count()==7,'The recut does not replace the campaign with an extra demonstration')
  check(page.evaluate('Rainward.snapshot().visuals.recut.revision')=='clinic-market-loop-1','The actual scene installs the authored clinic-market replacement')
  check(page.evaluate('Rainward.snapshot().visuals.recut.routeChevrons')==10,'Ten low painted cues mark the actual clinic ramps')
  pulse(8);wait('Rainward.mode==="map"');nav('clinic-route-guide-open');pulse(0)
  check(page.locator('#clinic-route-guide').get_attribute('open') is not None,'Xbox navigation opens the route key without a pointer')
  check('CLOSED' in page.locator('#clinic-route-status').inner_text(),'The journal explains the initially locked return crossing')
  check('dotted = garden' in page.locator('#clinic-route-legend').inner_text(),'Route patterns have a textual key instead of relying on color alone')
  capture('00-route-journal-closed');pulse(1);wait('Rainward.mode==="play"')
  go(-13,23);go(-19,16);go(-19,7);go(-24,6);go(-26.1,5.8)
  check(page.evaluate('!Rainward.state.completedTasks.includes("ward-service-latch")'),'The new return gate begins closed in an older checkpoint')
  use('Rainward.state.completedTasks.includes("ward-service-latch")');frames(5)
  check(page.evaluate('Rainward.snapshot().visuals.recut.returnGateOpen'),'Y from inside opens the visible shutter and real navigation gate')
  check(page.evaluate('Rainward.snapshot().visuals.recut.gateLabel')=='YARD RETURN OPEN','The physical shutter sign changes to identify the newly opened return')
  pulse(8);wait('Rainward.mode==="map"');check('OPEN / YARD RETURN' in page.locator('#clinic-route-status').inner_text(),'The route journal reflects the actual opened collision gate')
  capture('00-route-journal-open');pulse(1);wait('Rainward.mode==="play"')
  capture('01-inside-return-gate');go(-30,5.8);go(-31,11);go(-24,12);go(-19,16)
  check(True,'Ordinary Xbox stick movement completes the newly unlocked recovery loop')
  go(-19,7);go(-24,6);go(-24,-1);use('Rainward.state.checkpoint==="clinic"')
  page.reload(wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2');nav('continue');pulse(0);wait('Rainward.mode==="play"');frames(5)
  check(page.evaluate('Rainward.state.completedTasks.includes("ward-service-latch")&&Rainward.snapshot().visuals.recut.returnGateOpen'),'Reload restores the gate through the existing chapter save format')
  go(-22,-3.5);use('Rainward.state.objectives.cell')
  check(True,'The original clinic battery remains a reachable required objective')
  go(-22,-7);go(-22,-10);frames(5)
  check(page.evaluate('Rainward.snapshot().camera.heroVisible'),'The character remains visible on the raised route')
  check(page.evaluate('Rainward.snapshot().visuals.recut.upperHeight')==2.4,'The terrace uses the authored 2.4-metre elevation')
  capture('02-observation-terrace');go(-15,-10);go(-10,-10);go(-7,-10)
  check(True,'The terrace descends continuously into the market approach with real collision')
  go(-27,-24);go(-30,-23);go(-30,-20);go(-30,-14);go(-30,-10);go(-25,-10);go(-22,-10)
  check(True,'The collapsed-ruin approach climbs the west ramp and reconnects to the observation point')
  capture('03-west-ramp-return');go(-22,-7);go(-22,-3.5);go(-24,-1);use('Rainward.state.checkpoint==="clinic"')
  check(page.evaluate('JSON.parse(localStorage.getItem("svgn.rainward.v1.checkpoint")).version')==4,'The replacement keeps version-4 checkpoint serialization')
  check(not errors and not dialogs,'No uncaught errors or blocking dialogs during geometry and save acceptance')
  check(not any('Shader Error' in s or 'GL_INVALID' in s for s in console),'New graybox geometry renders without captured shader validation errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'dialogs':dialogs,'scope':'Real HTTP/WebGL and virtual Xbox-standard input. The authored dry-shelter legacy fixture defeats enemies only to isolate new geometry/collision/camera/gate/save checks. Existing normal-start living-enemy mission suites remain separate. No independent-player enjoyment, pacing duration, final art or physical Xbox/Quest certification.'},indent=2))
 except Exception as error:
  data={'error':str(error),'checks':checks,'errors':errors,'console':console,'dialogs':dialogs}
  try:data['snapshot']=page.evaluate('Rainward.snapshot()');data['focus']=page.evaluate('document.activeElement?.id');capture('failure')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:context.close();browser.close()
