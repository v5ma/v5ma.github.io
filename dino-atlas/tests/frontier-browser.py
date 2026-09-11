"""Native HTTP/WebGL acceptance suite with a simulated standard-layout Xbox gamepad.
Actual browser rendering and the production input loop are used, not mocked game logic.
Explicit ?test=1 repositioning fixtures accelerate travel/target coverage; they are not
proof of a human driving every road. Physical Xbox hardware is not available in CI.
"""
from pathlib import Path
import json, os, subprocess, time, traceback
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'frontier-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[]
server=None
if not os.getenv('TEST_BASE_URL'):
 server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 time.sleep(.5)
def check(v,label):
 assert v,label
 checks.append(label);print('PASS:',label,flush=True)
PAD='''window.__pad={id:'CI standard Xbox layout',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__pad],configurable:true});'''
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw)
 context=browser.new_context(viewport={'width':1440,'height':960},device_scale_factor=1)
 context.add_init_script(PAD)
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 def state():return page.evaluate('__dinoRanger.state')
 def button(i,value):page.evaluate('([i,v])=>{__pad.buttons[i]={pressed:v>.35,touched:v>0,value:v};__pad.timestamp++;}',[i,value])
 def press(i):
  button(i,1);page.wait_for_timeout(200);button(i,0);page.wait_for_timeout(250)
 def wait(js,timeout=60000):page.wait_for_function(js,timeout=timeout)
 def focus_by_pad(id):
  for i in range(55):
   if page.evaluate('document.activeElement?.id')==id:return
   press(13)
  raise AssertionError('Controller could not focus '+id)
 def shot(name):page.screenshot(path=str(OUT/name),timeout=45000)
 try:
  page.goto(BASE+'/dino-atlas/?test=1',wait_until='domcontentloaded')
  wait('window.__dinoRanger?.state.ready',90000)
  check(state()['build']=='ranger-operations-20260911.1','new Ranger Operations module initializes over HTTP')
  check(len(state()['animals'])==40,'all 40 residents exist in the actual scene')
  check(state()['triangles']>10000,'actual WebGL geometry is rendered')
  shot('01-intro.png')
  press(0);wait('__dinoRanger.state.started&&!__dinoRanger.state.paused')
  check(state()['device']=='gamepad','A starts the game through the production gamepad poller')
  # UI opens while driving, stops motion, navigates every setting and closes with B.
  z=state()['position']['z'];button(7,1)
  wait(f'__dinoRanger.state.position.z<{z-3}')
  button(7,0);page.wait_for_timeout(400)
  check(state()['position']['z']<z-3,'Xbox RT actually drives the physical jeep')
  press(9);wait('document.querySelector("#menu-dialog").open')
  paused=state()['position'];page.wait_for_timeout(400)
  check(state()['position']==paused,'menu freezes the simulation without stopping controller polling')
  focus_by_pad('quality-select');press(15)
  check(page.locator('#quality-select').input_value()=='low','D-pad changes the native graphics selection without a mouse')
  focus_by_pad('night-toggle');press(0)
  check(page.locator('#night-toggle').is_checked(),'A toggles focused settings')
  press(0);focus_by_pad('menu-controls');press(0)
  wait('document.querySelector("#controls-dialog").open')
  page.evaluate('__pad.axes[3]=.9');page.wait_for_timeout(700);page.evaluate('__pad.axes[3]=0')
  check(page.locator('#controls-dialog').evaluate('(d)=>d.scrollTop')>0,'right stick scrolls the controller guide')
  press(1);wait('document.querySelector("#menu-dialog").open');press(1);wait('!__dinoRanger.state.paused')
  check(not state()['paused'],'B returns from nested controls and closes the pause menu')
  shot('02-driving.png')
  # Starting on foot and firing spends actual ammunition; X initiates timed reload.
  page.evaluate('__dinoRanger.jeep.body.setLinvel({x:0,y:0,z:0},true)')
  page.wait_for_timeout(400);press(3);wait('__dinoRanger.state.mode==="foot"')
  check(state()['mode']=='foot','Y exits the existing jeep into the playable ranger')
  button(7,1);wait('__dinoRanger.state.ammo[0]<95');button(7,0);page.wait_for_timeout(200)
  before=state()['ammo'][0];press(2);wait('__dinoRanger.state.reloading>0')
  press(9);wait('__dinoRanger.state.paused');reload_before=state()['reloading'];page.wait_for_timeout(500)
  check(state()['reloading']==reload_before,'reload timer pauses while the menu is open')
  press(1);wait('!__dinoRanger.state.paused');wait('__dinoRanger.state.reloading===0')
  check(state()['ammo'][0]==100 and state()['reserve'][0]<400,'Xbox X reloads by transferring finite reserve supplies')
  press(5);check(state()['tool']=='zapper','RB selects the electric herding tool')
  press(14);check(state()['tool']=='water','D-pad left returns to the pressure hose')
  # Position fixtures select target proximity; actual RT presses produce real physics ray hits.
  a=next(a for a in state()['animals'] if a['uid']=='legacy-0')
  page.evaluate('([x,z])=>{__dinoRanger.teleport(x,z+11);__dinoRanger.setAim(0,.02)}',[a['x'],a['z']]);page.wait_for_timeout(600)
  button(6,1);button(7,1);wait('__dinoRanger.state.toolHits.water>0');button(7,0);button(6,0)
  check(state()['toolHits']['water']>0,'water hits a live dinosaur and changes its herding state')
  press(5);button(6,1);button(7,1);wait('__dinoRanger.state.toolHits.zapper>0');button(7,0);button(6,0)
  check(state()['toolHits']['zapper']>0,'electric pulse hits a live dinosaur and suppresses pursuit')
  shot('03-ranger-tools.png')
  a=next(a for a in state()['animals'] if a['uid']=='legacy-0')
  page.evaluate('([x,z])=>__dinoRanger.teleport(x+6,z)',[a['x'],a['z']]);page.wait_for_timeout(500)
  wait('document.querySelector("#interact-label").textContent.startsWith("Observe")')
  press(0);wait('document.querySelector("#info-dialog").open')
  check(len(state()['species'])>0,'A records a discovery without replacing the original journal')
  press(1);wait('!__dinoRanger.state.paused')
  # Full UI coverage: View opens map, B closes it, every operation remains reachable.
  press(8);wait('document.querySelector("#map-dialog").open');shot('04-reserve-map.png')
  press(1);wait('!__dinoRanger.state.paused');check(True,'View opens the map and B dismisses it')
  page.evaluate('__dinoRanger.teleport(-87,-76)');page.wait_for_timeout(700);press(0)
  wait('document.querySelector("#outpost-dialog").open')
  check('wetland' in state()['outposts'] and state()['checkpoint']=='wetland','outpost interaction saves a checkpoint and unlocks the network')
  check(state()['ammo']==[100,12] and state()['reserve']==[400,48],'resting replenishes both ranger tools and reserves')
  press(1);wait('!__dinoRanger.state.paused')
  page.evaluate('__dinoRanger.teleport(-139,25)');page.wait_for_timeout(600);press(0)
  wait('document.querySelector("#pen-dialog").open')
  focus_by_pad('pen-feed');press(0);check(state()['pens']['redwood-giants']['fed'],'controller operates the enclosure feeder')
  focus_by_pad('pen-gate');press(0);check(not state()['pens']['redwood-giants']['open'],'controller closes the real enclosure gate')
  press(0);check(state()['pens']['redwood-giants']['open'],'controller reopens the real enclosure gate')
  press(1);wait('!__dinoRanger.state.paused');shot('05-redwood-enclosure.png')
  # Helicopter takeoff and landing use actual controller trigger input.
  page.evaluate('__dinoRanger.teleport(19,58)');page.wait_for_timeout(600);press(3);wait('__dinoRanger.state.mode==="helicopter"')
  button(7,1);wait('__dinoRanger.state.position.y>10');button(7,0);page.wait_for_timeout(300)
  check(state()['position']['y']>10,'Y boards the helicopter and RT lifts it off the ground')
  press(3);check(state()['mode']=='helicopter','airborne helicopter refuses an unsafe exit')
  x=state()['position']['x'];page.evaluate('__pad.axes[0]=.9');wait(f'Math.abs(__dinoRanger.state.position.x-{x})>5');page.evaluate('__pad.axes[0]=0')
  shot('06-helicopter.png');check(True,'left stick flies the helicopter horizontally')
  button(6,1);wait('__dinoRanger.state.position.y<1.7');button(6,0);page.wait_for_timeout(700)
  press(3);wait('__dinoRanger.state.mode==="foot"');check(True,'LT lands the helicopter and Y disembarks')
  # Dock boarding and actual boat motion.
  page.evaluate('__dinoRanger.teleport(-74,-151)');page.wait_for_timeout(700);press(3);wait('__dinoRanger.state.mode==="boat"')
  x=state()['position']['x'];button(7,1);wait(f'__dinoRanger.state.position.x<{x-7}');button(7,0);page.wait_for_timeout(500)
  check(state()['mode']=='boat','patrol boat can be boarded and driven with the same controller')
  shot('07-wetland-patrol.png')
  page.evaluate('__dinoRanger.teleport(-93,-151,-Math.PI/2)');page.wait_for_timeout(800);press(3);wait('__dinoRanger.state.mode==="foot"')
  check(state()['position']['x']> -80,'Y disembarks the boat onto the dry dock')
  # Collision and recovery are real Rapier simulation, with fixture positioning only.
  page.evaluate('()=>{const p=__dinoRanger.fleet.vehicles[0].drive.position;__dinoRanger.teleport(p.x+4,p.z)}');page.wait_for_timeout(600);press(3);wait('__dinoRanger.state.mode==="jeep"')
  page.evaluate('__dinoRanger.teleport(17,49,Math.PI)');page.wait_for_timeout(600);button(7,1)
  wait('__dinoRanger.state.exploded.includes("blast-0")');button(7,0)
  check('blast-0' in state()['exploded'],'ramming a training crate triggers its physical explosion')
  wait('__dinoRanger.state.vehicles[0].rotation.w**2+__dinoRanger.state.vehicles[0].rotation.y**2>.85',90000)
  check(state()['health']==100,'rollover recovers with no vehicle damage')
  shot('08-recovered-jeep.png')
  # Persistence across actual navigation and reload.
  page.evaluate('window.dispatchEvent(new Event("pagehide"))')
  page.reload(wait_until='domcontentloaded');wait('window.__dinoRanger?.state.ready',90000)
  check('wetland' in state()['outposts'] and state()['checkpoint']=='wetland','checkpoint and discovered outposts survive a real page reload')
  check(len(state()['species'])>0,'species observations survive a real page reload')
  press(0);wait('__dinoRanger.state.started');press(9);wait('document.querySelector("#menu-dialog").open')
  focus_by_pad('menu-lab');press(0);wait('document.querySelector("#lab-dialog").open')
  focus_by_pad('lab-brush');press(0)
  check(page.locator('#dig-progress').evaluate('(e)=>e.value')>0,'controller brushes the preserved fossil lab and writes its original save key')
  press(1);wait('!__dinoRanger.state.paused')
  check(not errors,'desktop run has no uncaught JavaScript errors')
  # Mobile is an emulated viewport with actual DOM touch controls, not physical hardware.
  phone=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
  mobile=phone.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)))
  mobile.goto(BASE+'/dino-atlas/',wait_until='domcontentloaded');mobile.wait_for_function('window.__dinoRanger?.state.ready',timeout=90000)
  mobile.locator('#start-button').tap();mobile.wait_for_timeout(600)
  check(not mobile.evaluate('document.documentElement.scrollWidth>innerWidth'),'mobile HUD fits a 390-pixel viewport')
  check(mobile.locator('[data-drive="fire"]').is_visible() and mobile.locator('[data-action="reload"]').is_visible(),'mobile controls expose fire and reload')
  mobile.screenshot(path=str(OUT/'09-mobile.png'),timeout=45000);phone.close()
  check(not errors,'complete browser run has no uncaught JavaScript errors')
  report={'passed':len(checks),'checks':checks,'uncaught_errors':errors,'build':state()['build'],'mode':'Native Chromium HTTP/WebGL; simulated Xbox standard-layout Gamepad API','limitations':'No physical Xbox controller, haptics hardware, real phone, Safari, Quest or XR tested. Position fixtures accelerate facility and target coverage; driving, tool firing, reload, menu navigation, takeoff, landing, boat movement and crate collision use production input and physics.'}
  (OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True)
 except Exception as e:
  report={'error':str(e),'checks':checks,'uncaught_errors':errors}
  try:report['state']=state();report['activeElement']=page.evaluate('document.activeElement?.outerHTML');shot('failure.png')
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(report,indent=2));traceback.print_exc();raise
 finally:
  browser.close()
  if server:server.terminate()
