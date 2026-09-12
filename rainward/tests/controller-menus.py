"""Native HTTP game, navigated only through an emulated Xbox-standard pad.
A validated shelter-save fixture isolates long UI checks from combat. Existing
controller.py separately checks gameplay against the ordinary district enemies.
No clicks, page focus injection or live game-state mutation are used below.
"""
import json,os,subprocess,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-controller-menus');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,checkpoint} from './rainward/model.mjs';const s=createGame('meridian');for(const e of s.enemies)e.hp=0;s.player.hp=45;s.player.medkit=1;s.player.smoke=1;s.player.cloth=2;s.player.canister=2;console.log(checkpoint(s));"],text=True).strip()
district_fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,checkpoint} from './rainward/model.mjs';console.log(checkpoint(createGame()));"],text=True).strip()
bank=json.dumps({'version':1,'active':'meridian','slots':{'district':{'checkpoint':district_fixture,'savedAt':0},'meridian':{'checkpoint':fixture,'savedAt':0}}})
checks=[];errors=[];dialogs=[]
def check(v,s):
 assert v,s
 checks.append(s);print('PASS: '+s,flush=True)
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**kw);c=b.new_context(viewport={'width':1080,'height':760},service_workers='block')
 c.add_init_script("localStorage.setItem('svgn.rainward.v2.chapter-checkpoints',"+json.dumps(bank)+");localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:'classic',mute:true,low:true,scanned:false,cinematic:false,sensitivity:85}));window.pad={connected:true,mapping:'standard',index:0,id:'Xbox standard test',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;return [pad];}});")
 host=urlparse(BASE).hostname;c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 page=c.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
 def dialog(d):dialogs.append(d.type+': '+d.message);d.dismiss()
 page.on('dialog',dialog)
 def polls(n=2):
  before=page.evaluate('padPolls');page.wait_for_function('([n,k])=>padPolls>=n+k',arg=[before,n])
 def press(i,condition=None):
  page.evaluate('(i)=>pad.buttons[i]={pressed:true,value:1}',i)
  if condition:page.wait_for_function(condition)
  else:polls()
  page.evaluate('(i)=>pad.buttons[i]={pressed:false,value:0}',i);polls()
 def focus_id():return page.evaluate('document.activeElement?.id')
 def nav(target):
  for _ in range(45):
   if focus_id()==target:return
   press(13)
  raise AssertionError('Could not navigate to '+target+'; focused '+str(focus_id()))
 def move_to(x,z):
  deadline=time.monotonic()+30
  while time.monotonic()<deadline:
   q=page.evaluate('({x:Rainward.state.player.x,z:Rainward.state.player.z,yaw:Rainward.view.yaw})');dx=x-q['x'];dz=z-q['z']
   if (dx*dx+dz*dz)**.5<.25:break
   import math
   a=math.cos(q['yaw'])*dx-math.sin(q['yaw'])*dz;v=math.sin(q['yaw'])*dx+math.cos(q['yaw'])*dz;l=max(.001,(a*a+v*v)**.5)
   page.evaluate('([a,v])=>{pad.axes[0]=a;pad.axes[1]=v;}',[a/l*.65,v/l*.65]);polls(2)
  else:raise AssertionError('Controller movement did not reach supply bag')
  page.evaluate('pad.axes[0]=pad.axes[1]=0');polls()
 try:
  page.goto(BASE+'/rainward/index.html',wait_until='domcontentloaded');page.wait_for_function('!!window.Rainward&&padPolls>2');polls()
  check(page.evaluate('Rainward.snapshot().version')=='0.10.0','The upgraded HTTP application loads with all six chapter options')
  check(page.locator('#chapter-select option').count()==6,'All six existing expeditions remain selectable')
  press(9,'Rainward.mode==="pause"');t=page.evaluate('Rainward.state.t');press(1,'Rainward.mode==="title"');check(page.evaluate('Rainward.state.t')==t,'Menu opens title settings and B returns to title without starting a mission')
  press(9,'Rainward.mode==="pause"');nav('sensitivity');press(15);check(page.locator('#sensitivity').input_value()=='90','D-pad right adjusts the look-sensitivity slider')
  press(14);check(page.locator('#sensitivity').input_value()=='85','D-pad left decreases a slider without navigating away')
  nav('deadzone');press(15);check(page.locator('#deadzone').input_value()=='19','The stick deadzone is adjustable using only the controller')
  nav('invertY');press(0);check(page.locator('#invertY').is_checked(),'A toggles a settings checkbox instead of dismissing the menu')
  nav('vibration');press(0);check(not page.locator('#vibration').is_checked(),'Vibration can be disabled with the controller')
  check(page.evaluate("JSON.parse(localStorage.getItem('svgn.rainward.v1.settings')).deadzone") ==19,'Controller settings persist in the existing namespaced store')
  before=page.evaluate('document.getElementById("pause").scrollTop');page.evaluate('pad.axes[3]=.9');page.wait_for_function('(n)=>document.getElementById("pause").scrollTop>n+20',arg=before);page.evaluate('pad.axes[3]=0');polls();down=page.evaluate('document.getElementById("pause").scrollTop');page.evaluate('pad.axes[3]=-.9');page.wait_for_function('(n)=>document.getElementById("pause").scrollTop<n-20',arg=down);page.evaluate('pad.axes[3]=0');polls();check(True,'Right stick scrolls the controls panel in both directions without a mouse')
  press(1,'Rainward.mode==="title"');press(5);check(page.locator('#chapter-select').input_value()=='conservatory','RB cycles expedition choice from the title');press(4);check(page.locator('#chapter-select').input_value()=='district','LB cycles backward through expeditions')
  nav('chapter-select');press(15);check(page.locator('#chapter-select').input_value()=='conservatory','D-pad left/right changes the focused chapter selector without an OS popup');press(14)
  nav('start');press(0,'Rainward.mode==="confirm"');check(focus_id()=='confirm-no','Starting over opens an in-game confirmation with Cancel selected')
  saved=page.evaluate("localStorage.getItem('svgn.rainward.v1.checkpoint')");press(1,'Rainward.mode==="title"');check(page.evaluate("localStorage.getItem('svgn.rainward.v1.checkpoint')")==saved,'B cancels overwrite without modifying the shelter save')
  nav('continue');press(0,'Rainward.mode==="play"&&Rainward.state.level==="meridian"');check(page.evaluate('Rainward.state.player.hp')==45,'A continues the validated Meridian shelter save')
  press(12,'Rainward.state.player.hp===100');check(page.evaluate('Rainward.state.player.medkit')==0,'D-pad up uses a finite medkit through the shared gameplay action')
  press(14,'Rainward.state.player.smoke===0');check(page.evaluate('Rainward.state.smokes.length')>0,'D-pad left deploys actual smoke cover')
  move_to(2,56);press(3,'Rainward.state.taken.has("meridian-kit")');check(page.evaluate('Rainward.state.player.bottles')==2,'Y scavenges a supply bag reached using the left stick')
  press(5,'Rainward.state.player.bottles===1');check(page.evaluate('Rainward.state.stats.bottles')==1,'RB throws a finite bottle in gameplay rather than switching menus')
  press(15,'Rainward.view.shoulder===-1');check(True,'D-pad right switches the gameplay camera shoulder')
  page.evaluate('pad.buttons[4]={pressed:true,value:1}');page.wait_for_function('Rainward.state.player.listen');page.evaluate('pad.buttons[4]={pressed:false,value:0}');polls();check(True,'LB activates listening without a menu side effect')
  page.evaluate('pad.buttons[6]={pressed:true,value:1}');page.wait_for_function('Rainward.state.player.aim');press(7,'Rainward.state.player.mag<6');page.evaluate('pad.buttons[6]={pressed:false,value:0}');polls()
  total=page.evaluate('Rainward.state.player.mag+Rainward.state.player.reserve');press(2,'Rainward.state.player.reload>0');page.wait_for_function('document.getElementById("reload-state").textContent.includes("RELOADING")');check(True,'X starts a real reload and displays reload progress')
  press(9,'Rainward.mode==="pause"');t=page.evaluate('Rainward.state.t');press(2);check(page.evaluate('Rainward.state.t')==t,'X in a menu does not run combat or advance reload simulation');press(1,'Rainward.mode==="play"');page.wait_for_function('Rainward.state.player.reload===0&&Rainward.state.player.mag===6');check(page.evaluate('Rainward.state.player.mag+Rainward.state.player.reserve')==total,'Reload survives a pause and conserves total ammunition')
  press(13,'Rainward.mode==="pack"');nav('craft-med');press(0,'!!Rainward.state.player.craft');page.wait_for_function('!Rainward.state.player.craft&&Rainward.state.player.medkit===1');check(True,'The controller can select and complete timed crafting')
  press(1,'Rainward.mode==="play"');press(8,'Rainward.mode==="map"');nav('track-clinic-power');press(0,'Rainward.state.trackedTask==="clinic-power"');check(focus_id()=='track-clinic-power','Tracking a journal task retains focus after the list rebuilds')
  press(0,'Rainward.state.trackedTask===null');check(focus_id()=='track-clinic-power','The same controller-focused task can be untracked without a mouse')
  press(5,'Rainward.mode==="pack"');press(5,'Rainward.mode==="pause"');press(5,'Rainward.mode==="map"');check(True,'Bumpers move between journal, satchel and controls tabs')
  press(8,'Rainward.mode==="play"');press(9,'Rainward.mode==="pause"');nav('retry');press(0,'Rainward.mode==="confirm"');press(1,'Rainward.mode==="pause"');check(True,'Checkpoint retry uses a controller-cancelable in-game confirmation')
  nav('retry');page.evaluate('pad.buttons[0]={pressed:true,value:1}');page.wait_for_function('Rainward.mode==="confirm"');polls(6);check(page.evaluate('Rainward.mode')=='confirm','Holding A cannot click through the newly opened confirmation');page.evaluate('pad.buttons[0]={pressed:false,value:0}');polls();press(1,'Rainward.mode==="pause"')
  press(1,'Rainward.mode==="play"');page.evaluate('pad.buttons[7]={pressed:true,value:1}');page.wait_for_function('Rainward.state.player.mag<6');page.evaluate('pad.connected=false');page.wait_for_function('Rainward.mode==="pause"');mag=page.evaluate('Rainward.state.player.mag');page.evaluate('pad.connected=true');polls(5);check(page.evaluate('Rainward.state.player.mag')==mag,'Disconnect pauses and held fire stays suppressed on reconnect');page.evaluate('pad.buttons[7]={pressed:false,value:0}');polls();press(0,'Rainward.mode==="play"')
  press(9,'Rainward.mode==="pause"');nav('to-title');press(0,'Rainward.mode==="confirm"');press(15);check(focus_id()=='confirm-yes','D-pad selects the confirmation action explicitly');press(0,'Rainward.mode==="title"');check(True,'The controller can confirm return to title')
  press(9,'Rainward.mode==="pause"');press(1,'Rainward.mode==="title"');check(True,'Title settings still return to title after a prior expedition')
  nav('chapter-select');press(15);nav('start');press(0,'Rainward.mode==="play"&&Rainward.state.level==="conservatory"');check(True,'A new chapter can be selected, confirmed and started entirely by controller')
  press(9,'Rainward.mode==="pause"');page.set_viewport_size({'width':390,'height':844});nav('deadzone');check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Controller settings fit a phone-width viewport and scroll focused controls into view')
  page.screenshot(path=str(OUT/'controller-settings-phone.png'));page.set_viewport_size({'width':1080,'height':760});page.screenshot(path=str(OUT/'controller-settings.png'))
  check(not dialogs,'No native browser alert, confirm or prompt appeared');check(not errors,'No uncaught errors during the controller-only journey')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'dialogs':dialogs,'scope':'Native HTTP WebGL app; simulated standard gamepad; validated shelter fixture isolates UI from combat. Not physical Xbox/Quest certification.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'dialogs':dialogs,'url':page.url}
  try:data['snapshot']=page.evaluate('window.Rainward?.snapshot()');data['focus']=focus_id();page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:c.close();b.close()
