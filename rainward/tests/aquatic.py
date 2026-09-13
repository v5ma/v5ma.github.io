"""Native HTTP/WebGL acceptance for Northlight Natatorium. The fixture removes
patrol pressure and begins at the competition-pool deck so this suite can isolate
real swimming, diving and rendering without spending CI time crossing the whole
map. Model tests separately prove start-to-objective and mission reachability.
"""
import json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-undertow');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[];dialogs=[]
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,checkpoint} from './rainward/model.mjs';const s=createGame('natatorium');s.enemies.forEach(e=>e.hp=0);s.player.x=15;s.player.z=24;s.player.y=0;console.log(checkpoint(s));"],text=True).strip()
def check(v,label):
 assert v,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);c=b.new_context(viewport={'width':1180,'height':780},service_workers='block')
 c.add_init_script("localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.removeItem('svgn.rainward.v2.chapter-checkpoints');localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:'survival',mute:true,low:true,scanned:false,cinematic:false,detailedHumans:false,rainFilm:true}));window.pad={connected:true,mapping:'standard',index:0,id:'Undertow Xbox-standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;return [pad];}});")
 p=c.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None);p.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
 def wait(q):p.wait_for_function(q)
 def frames(n=2):
  before=p.evaluate('padPolls');p.wait_for_function('([x,n])=>padPolls>=x+n',arg=[before,n])
 def press(i,condition=None):
  frames();p.evaluate('(i)=>pad.buttons[i]={pressed:true,value:1}',i)
  if condition:wait(condition)
  else:frames(2)
  p.evaluate('(i)=>pad.buttons[i]={pressed:false,value:0}',i);frames()
 def hold(i,condition):
  frames();p.evaluate('(i)=>pad.buttons[i]={pressed:true,value:1}',i);wait(condition);p.evaluate('(i)=>pad.buttons[i]={pressed:false,value:0}',i);frames()
 def nav(target):
  for _ in range(80):
   if p.evaluate('document.activeElement?.id')==target:return
   press(13)
  raise AssertionError('Controller could not reach '+target)
 def go(x,z):
  print('GO',x,z,flush=True)
  p.evaluate('''async ({x,z})=>{const W=await import('./world.mjs'),route=W.findPath(Rainward.state.player,{x,z});route.push({x,z});const held=new Set(),cv=document.getElementById('world');cv.focus();const key=(code,on)=>{if(held.has(code)===on)return;held[on?'add':'delete'](code);cv.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));};await new Promise((resolve,reject)=>{let i=0;const start=performance.now(),timer=setInterval(()=>{const p=Rainward.state.player;if(Rainward.mode!=='play'||performance.now()-start>30000){clearInterval(timer);for(const k of [...held])key(k,false);reject(Error('Navigation interrupted '+JSON.stringify({x:p.x,z:p.z,target:route[i]})));return;}const q=route[i],dx=q.x-p.x,dz=q.z-p.z;if(Math.hypot(dx,dz)<.34){if(++i===route.length){clearInterval(timer);for(const k of [...held])key(k,false);resolve();}return;}const a=Rainward.view.yaw,lx=Math.cos(a)*dx-Math.sin(a)*dz,lz=-Math.sin(a)*dx-Math.cos(a)*dz;key('KeyD',lx>.13);key('KeyA',lx<-.13);key('KeyW',lz>.13);key('KeyS',lz<-.13);key('ShiftLeft',true);},18);});}''',{'x':x,'z':z})
  print('REACHED',x,z,flush=True)
 try:
  p.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2');check(p.locator('#chapter-select option').count()==7,'Seven expeditions are visible on the real title screen');nav('continue');press(0,'Rainward.mode==="play"&&Rainward.state.level==="natatorium"')
  check(p.evaluate('Rainward.snapshot().version')=='0.13.0','The actual browser loads Undertow v0.13.0')
  wait('Rainward.snapshot().visuals.aquatic?.waterSurfaces===4');check(p.evaluate('Rainward.snapshot().visuals.aquatic.causticProjectors')==4,'Four actual pool shaders and four floor-caustic passes render in WebGL');check(p.evaluate('Rainward.snapshot().visuals.aquatic.activeLights')<=6,'The pool hall uses a bounded local-light budget')
  p.screenshot(path=str(OUT/'pool-deck.png'));go(15,15);wait('Rainward.state.player.waterMode==="swim"');check(True,'Ordinary movement from the deck transitions into competition-pool swimming')
  oxygen=p.evaluate('Rainward.state.player.oxygen');hold(1,'Rainward.state.player.submerged');p.wait_for_timeout(750);check(p.evaluate('Rainward.state.player.oxygen')<oxygen,'Holding B in the Survival layout dives and consumes air');check(p.locator('body').evaluate("e=>e.classList.contains('underwater')"),'Underwater visual treatment follows the real swim state')
  p.set_viewport_size({'width':390,'height':844});frames(3);check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The oxygen HUD and water controls fit a phone-width viewport');p.screenshot(path=str(OUT/'competition-underwater-phone.png'));p.set_viewport_size({'width':1180,'height':780})
  # Brief stationary full-quality comparison; travel remains Reduced Graphics so
  # the acceptance result does not depend on software-GPU frame rate.
  press(9,'Rainward.mode==="pause"');nav('low');press(0);press(1,'Rainward.mode==="play"');frames(3);p.screenshot(path=str(OUT/'competition-underwater-full.png'));check(p.evaluate('Rainward.snapshot().visuals.aquatic.waterSurfaces')==4,'Full graphics preserves all pool surfaces');press(9,'Rainward.mode==="pause"');nav('low');press(0);press(1,'Rainward.mode==="play"')
  mag=p.evaluate('Rainward.state.player.mag');press(7);check(p.evaluate('Rainward.state.player.mag')==mag,'RT cannot fire a firearm while swimming')
  go(15,-13);press(3,'Rainward.state.objectives.cell');check(True,'Y recovers the filtration fuse only after the player dives to it')
  press(0,'!Rainward.state.player.submerged');check(True,'A surfaces without changing the horizontal route or objective state');p.screenshot(path=str(OUT/'competition-surface.png'))
  go(27,-13);wait('Rainward.state.player.waterMode==="dry"');p.wait_for_function('Rainward.state.player.oxygen>95');check(True,'Leaving the pool returns to dry movement and restores air')
  check(p.evaluate('Rainward.snapshot().visuals.aquatic.extraRenderTargets')==0,'Pool and caustic shaders add no full-screen render target')
  check(not errors and not dialogs,'No uncaught errors or native blocking dialogs occur during the water journey');check(not any('Shader Error' in x or 'VALIDATE_STATUS' in x or 'GL_INVALID' in x for x in console),'Pool surface and caustic shaders compile without WebGL validation errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'dialogs':dialogs,'console':console,'scope':'Native HTTP/WebGL, ordinary movement and simulated Xbox-standard face buttons. The validated fixture starts on the competition-pool deck and defeats enemies only to isolate traversal/rendering; model tests cover full-map reachability. Reduced Graphics is used for travel, with a stationary full-quality underwater capture. Not physical-controller, artistic-quality or performance-tier certification.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'dialogs':dialogs,'console':console}
  try:data['snapshot']=p.evaluate('window.Rainward?.snapshot()');data['focus']=p.evaluate('document.activeElement?.id');p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:b.close()
