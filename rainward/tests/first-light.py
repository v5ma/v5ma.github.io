"""First Light browser acceptance: real HTTP/WebGL and ordinary input.
A validated legacy shelter fixture removes enemies only from this exploration/UI
journey. The unchanged full mission suite separately retains living enemies.
"""
import os,json,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-first-light');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,checkpoint} from './rainward/model.mjs';const s=createGame();s.enemies.forEach(e=>e.hp=0);const d=JSON.parse(checkpoint(s));delete d.fieldNotes;delete d.guideRoute;console.log(JSON.stringify(d));"],text=True).strip()
checks=[];errors=[];dialogs=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True)
def go(p,x,z):
 p.evaluate('''async ({x,z})=>{const W=await import('./world.mjs'),path=W.findPath(Rainward.state.player,{x,z});path.push({x,z});const cv=document.getElementById('world'),held=new Set();cv.focus();const key=(code,on)=>{if(held.has(code)===on)return;held[on?'add':'delete'](code);cv.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));};await new Promise((resolve,reject)=>{let i=0;const start=performance.now(),timer=setInterval(()=>{const p=Rainward.state.player;if(Rainward.mode!=='play'||performance.now()-start>150000){clearInterval(timer);for(const k of [...held])key(k,false);reject(Error('Walk interrupted'));return;}const q=path[i],dx=q.x-p.x,dz=q.z-p.z;if(Math.hypot(dx,dz)<.32){if(++i===path.length){clearInterval(timer);for(const k of [...held])key(k,false);resolve();}return;}const yaw=Rainward.view.yaw,a=Math.cos(yaw)*dx-Math.sin(yaw)*dz,b=-Math.sin(yaw)*dx-Math.cos(yaw)*dz;key('KeyD',a>.12);key('KeyA',a<-.12);key('KeyW',b>.12);key('KeyS',b<-.12);key('ShiftLeft',true);},20);});}''',{'x':x,'z':z})
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);c=b.new_context(viewport={'width':1180,'height':780},service_workers='block')
 c.add_init_script("if(!localStorage.getItem('first-light-seeded')){localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.setItem('first-light-seeded','1');localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({mute:true,low:true,scanned:false,cinematic:false}));}window.pad={connected:true,mapping:'standard',id:'First Light Xbox-standard',index:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;return [pad];}});")
 p=c.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
 def wait(q):p.wait_for_function(q)
 def frames(n=2):
  before=p.evaluate('padPolls');p.wait_for_function('([x,n])=>padPolls>=x+n',arg=[before,n])
 def press(i,condition=None):
  frames();p.evaluate('(i)=>pad.buttons[i]={pressed:true,value:1}',i)
  if condition:wait(condition)
  else:frames()
  p.evaluate('(i)=>pad.buttons[i]={pressed:false,value:0}',i);frames()
 def nav(id):
  for _ in range(80):
   if p.evaluate('document.activeElement.id')==id:return
   press(13)
  raise AssertionError('Unreachable controller control '+id)
 try:
  p.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2');nav('continue');press(0,'Rainward.mode==="play"')
  check(p.evaluate('Rainward.snapshot().version')=='0.11.0','The actual browser loads First Light v0.11.0')
  check(p.evaluate('Rainward.state.fieldNotes.length===0&&Rainward.state.guideRoute===null'),'Legacy saves without field-record data still load without invented discoveries')
  check(p.evaluate('Rainward.snapshot().visuals.firstLight.notes')==6,'The actual scene builds six readable field-record props')
  p.screenshot(path=str(OUT/'opening.png'));go(p,-1.8,28);before=p.evaluate('Rainward.state.player.mag');press(3,'Rainward.state.fieldNotes.includes("south-letter")')
  check(p.evaluate('Rainward.mode==="play"&&Rainward.state.player.mag')==before,'Y records the shelter letter without a blocking dialog or ammunition reward')
  press(8,'Rainward.mode==="map"');nav('read-south-letter');press(0);check('We left the lamp burning' in p.locator('#note-south-letter p').inner_text(),'The collected original text is readable from a controller-opened journal row')
  check('Find this record' in p.locator('#note-garden-ledger p').inner_text(),'Undiscovered records do not display their story text')
  nav('route-freight');press(0,'Rainward.state.guideRoute==="freight"');check(p.locator('#route-freight').get_attribute('aria-pressed')=='true','A selects the Freight-first approach and shows its equipped state')
  nav('route-garden');press(0,'Rainward.state.guideRoute==="garden"');check(not p.evaluate('Rainward.state.objectives.cell||Rainward.state.objectives.crank'),'Changing route suggestions does not operate either objective')
  p.screenshot(path=str(OUT/'field-journal.png'));press(1,'Rainward.mode==="play"');go(p,-20,18.4);press(3,'Rainward.state.fieldNotes.includes("garden-ledger")')
  check(p.evaluate('Rainward.state.fieldNotes.length')==2,'Walking through the actual garden reaches and records its second story prop')
  press(9,'Rainward.mode==="pause"');p.locator('#low').uncheck();p.locator('#cinematic').check();press(1,'Rainward.mode==="play"');frames(8);p.screenshot(path=str(OUT/'garden-full-quality.png'))
  check(p.evaluate('Rainward.snapshot().visuals.cinema.active'),'The new garden also renders through the full cinematic pipeline')
  press(9,'Rainward.mode==="pause"');p.locator('#low').check();nav('field-guidance');press(0);press(1,'Rainward.mode==="play"');frames(4);check(p.locator('#first-light-advice').is_hidden(),'Opening guidance can be disabled entirely using the controller')
  press(9,'Rainward.mode==="pause"');nav('field-guidance');press(0);press(1,'Rainward.mode==="play"');go(p,0,27);press(3,'Rainward.state.events.some(e=>e.type==="checkpoint")');check(p.evaluate('JSON.parse(localStorage.getItem("svgn.rainward.v2.chapter-checkpoints")).slots.district.checkpoint.includes("garden-ledger")'),'An ordinary shelter action persists both discoveries in the district slot')
  p.reload(wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2');nav('continue');press(0,'Rainward.mode==="play"');check(p.evaluate('Rainward.state.fieldNotes.length===2&&Rainward.state.guideRoute==="garden"'),'Full reload restores records and route preference with the shelter save')
  press(8,'Rainward.mode==="map"');nav('route-off');press(0,'Rainward.state.guideRoute===null');press(1,'Rainward.mode==="play"');frames(3);check(p.locator('#route-beacon').is_hidden(),'The suggested route can be switched off without losing progress')
  press(8,'Rainward.mode==="map"');p.set_viewport_size({'width':390,'height':844});nav('read-garden-ledger');press(0);check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The field journal stays inside a phone-width viewport');p.screenshot(path=str(OUT/'journal-phone.png'));press(1,'Rainward.mode==="play"');frames(3);p.screenshot(path=str(OUT/'hud-phone.png'))
  check(not errors and not dialogs,'No uncaught script errors or native blocking dialogs in the new journey')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'dialogs':dialogs,'scope':'Native HTTP/WebGL, ordinary keyboard walking and Xbox-standard simulated button input. Legacy save fixture removes enemies only for this exploration/UI journey. Physical hardware, artistic quality and a 15-20 minute playtime are not certified.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'dialogs':dialogs}
  try:data['snapshot']=p.evaluate('window.Rainward?.snapshot()');data['focus']=p.evaluate('document.activeElement?.id');p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:b.close()
