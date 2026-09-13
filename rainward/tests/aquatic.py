"""Native HTTP/WebGL acceptance for Northlight Natatorium. The validated fixture
starts at the authored competition-deck shelter with patrols defeated so the
browser suite can isolate real water entry, diving, oxygen, controls and shader
output. Model tests separately prove full-map and submerged-object routes.
"""
import json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-undertow');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[];dialogs=[]
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,checkpoint} from './rainward/model.mjs';const s=createGame('natatorium');s.enemies.forEach(e=>e.hp=0);s.checkpoint='natatorium-deck';console.log(checkpoint(s));"],text=True).strip()
def check(v,label):
 assert v,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**kw);c=b.new_context(viewport={'width':1180,'height':780},service_workers='block')
 c.add_init_script("localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.removeItem('svgn.rainward.v2.chapter-checkpoints');localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({controlPreset:'survival',mute:true,low:true,scanned:false,cinematic:false,detailedHumans:false,rainFilm:true}));window.pad={connected:true,mapping:'standard',index:0,id:'Undertow Xbox-standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;return [pad];}});")
 p=c.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:console.append(m.text) if m.type=='error' else None);p.on('dialog',lambda d:(dialogs.append(d.type),d.dismiss()))
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
 try:
  p.goto(BASE+'/rainward/',wait_until='domcontentloaded');wait('window.Rainward&&padPolls>2');check(p.locator('#chapter-select option').count()==7,'Seven expeditions are visible on the real title screen');nav('continue');press(0,'Rainward.mode==="play"&&Rainward.state.level==="natatorium"')
  check(p.evaluate('Rainward.snapshot().version')=='0.13.0','The actual browser loads Undertow v0.13.0');check(abs(p.evaluate('Rainward.state.player.x')-15)<.6 and abs(p.evaluate('Rainward.state.player.z')-23.5)<.6,'Continue restores the authored competition-deck shelter instead of a synthetic position')
  wait('Rainward.snapshot().visuals.aquatic?.waterSurfaces===4');check(p.evaluate('Rainward.snapshot().visuals.aquatic.causticProjectors')==4,'Four actual pool shaders and four floor-caustic passes render in WebGL');check(p.evaluate('Rainward.snapshot().visuals.aquatic.activeLights')<=6,'The pool hall uses a bounded local-light budget')
  p.screenshot(path=str(OUT/'pool-deck.png'));p.keyboard.down('KeyW');wait('Rainward.state.player.waterMode==="swim"');p.keyboard.up('KeyW');check(True,'Ordinary forward movement off the deck transitions into competition-pool swimming')
  check(p.evaluate('Rainward.snapshot().visuals.aquatic.deckPanels')>0,'Tiled dry decks have real pool openings')
  saved=p.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")');press(3);check(p.evaluate('localStorage.getItem("svgn.rainward.v1.checkpoint")')==saved,'Y cannot save at a dry shelter while swimming beside its edge')
  p.evaluate('pad.axes[1]=-1');wait('Rainward.state.player.z<18');p.evaluate('pad.axes[1]=0');frames(3);check(True,'The left stick swims away from the pool rim without a mouse')
  oxygen=p.evaluate('Rainward.state.player.oxygen');hold(1,'Rainward.state.player.submerged');p.wait_for_timeout(650);check(p.evaluate('Rainward.state.player.oxygen')<oxygen,'Holding B in the Survival layout dives and consumes air');check(p.locator('body').evaluate("e=>e.classList.contains('underwater')"),'Underwater visual treatment follows the real swim state');check(p.evaluate('Rainward.state.player.stance==="stand"&&Rainward.state.player.swimDepth>1'),'The swimming system controls depth independently from land stance')
  check(p.evaluate('Rainward.snapshot().camera.y<-.2&&Rainward.snapshot().camera.heroVisible'),'The camera follows the submerged body above the basin instead of collapsing at the land floor')
  mag=p.evaluate('Rainward.state.player.mag');press(7);check(p.evaluate('Rainward.state.player.mag')==mag,'RT cannot fire a firearm while swimming');p.set_viewport_size({'width':390,'height':844});frames(3);check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The oxygen HUD and water controls fit a phone-width viewport');p.screenshot(path=str(OUT/'competition-underwater-phone.png'));p.set_viewport_size({'width':1180,'height':780})
  press(9,'Rainward.mode==="pause"');nav('low');press(0);press(1,'Rainward.mode==="play"');frames(3);p.screenshot(path=str(OUT/'competition-underwater-full.png'));check(p.evaluate('Rainward.snapshot().visuals.aquatic.waterSurfaces')==4,'Full graphics preserves all pool surfaces');press(9,'Rainward.mode==="pause"');nav('low');press(0);press(1,'Rainward.mode==="play"')
  press(0,'!Rainward.state.player.submerged');check(True,'A surfaces through the Survival traversal button');p.wait_for_function('Rainward.state.player.oxygen>99');check(True,'Air refills at the surface without leaving the pool');check(p.evaluate('Rainward.snapshot().visuals.aquatic.extraRenderTargets')==0,'Pool and caustic shaders add no full-screen render target')
  check(not errors and not dialogs,'No uncaught errors or native blocking dialogs occur during the water journey');check(not any('Shader Error' in x or 'VALIDATE_STATUS' in x or 'GL_INVALID' in x for x in console),'Pool surface and caustic shaders compile without WebGL validation errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'dialogs':dialogs,'console':console,'scope':'Native HTTP/WebGL, ordinary movement and simulated Xbox-standard face buttons. The validated fixture uses a real authored dry shelter and defeats enemies only to isolate water traversal/rendering; model tests cover full-map reachability and submerged-object recovery. Reduced Graphics is used for interactive checks, with a stationary full-quality underwater capture. Not physical-controller, artistic-quality or performance-tier certification.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'dialogs':dialogs,'console':console}
  try:data['snapshot']=p.evaluate('window.Rainward?.snapshot()');data['focus']=p.evaluate('document.activeElement?.id');p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:b.close()
