"""Real HTTP, WebGL and ordinary-input acceptance for source human meshes and wet materials.
No live gameplay assignments. The controller settings check uses a validated safe
shelter fixture; original native encounter suites retain their living enemies.
"""
import json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from ui_flow import EXPECTED_VERSION,finish_transition
OUT=Path('test-output/rainward-rainworn');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];console=[]
def check(ok,text):
 assert ok,text
 checks.append(text);(OUT/'progress.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2));print('PASS:',text,flush=True)
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,checkpoint} from './rainward/model.mjs';const s=createGame();s.enemies.forEach(e=>e.hp=0);console.log(checkpoint(s));"],text=True).strip()
with sync_playwright() as pw:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**kw);context=browser.new_context(viewport={'width':1120,'height':840},service_workers='block');p=context.new_page();p.set_default_timeout(120000)
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda e:console.append(e.text) if e.type=='error' else None)
 def wait(q):p.wait_for_function(q)
 try:
  p.goto(BASE+'/rainward/tests/rainworn-harness.html');wait('window.AssetTest');check(p.evaluate('AssetTest.modelStatus().loaded===2'),'Both self-hosted human sources decode and use the actual game clothing adapter')
  for gender in ['female','male']:
   p.locator('#'+gender).click();wait('AssetTest.gender==='+json.dumps(gender));p.locator('#front').click()
   for stance in ['stand','crouch','prone']:
    p.locator('#'+stance).click();p.wait_for_timeout(250);bounds=p.evaluate('AssetTest.bounds()');check(bounds['max'][1] < {'stand':1.84,'crouch':1.09,'prone':.46}[stance],gender+' '+stance+' uses the real fitted skin and collision-height envelope');p.screenshot(path=str(OUT/(gender+'-'+stance+'.png')))
   p.locator('#stand').click();p.locator('#aim').click();p.wait_for_timeout(250);p.screenshot(path=str(OUT/(gender+'-aim.png')));p.locator('#back').click();p.wait_for_timeout(200);p.screenshot(path=str(OUT/(gender+'-back.png')))
  context.close();context=browser.new_context(viewport={'width':1120,'height':800},service_workers='block')
  context.add_init_script("localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({low:true,mute:true,scanned:false,cinematic:false}));window.pad={connected:true,mapping:'standard',index:0,id:'Rainworn Xbox-standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;return [pad]}});")
  p=context.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda e:console.append(e.text) if e.type=='error' else None);requests=[];p.on('request',lambda r:requests.append(r.url) if '/assets/humans/' in r.url else None)
  def frames(n=2):
   count=p.evaluate('padPolls');p.wait_for_function('([c,n])=>padPolls>=c+n',arg=[count,n])
  def press(i,condition=None):
   frames();p.evaluate('(i)=>pad.buttons[i]={pressed:true,value:1}',i)
   if condition:wait(condition)
   else:frames(1)
   p.evaluate('(i)=>pad.buttons[i]={pressed:false,value:0}',i);frames(1)
  def nav(id):
   for _ in range(95):
    if p.evaluate('document.activeElement?.id')==id:return
    press(13)
   raise AssertionError('Controller cannot reach '+id)
  p.goto(BASE+'/rainward/');wait('window.Rainward');nav('continue');press(0,'Rainward.mode==="play"');wait('Rainward.snapshot().visuals.rainworn.humans.loaded===2&&Rainward.snapshot().visuals.rainworn.humans.active>0')
  check(p.evaluate('Rainward.snapshot().version')==EXPECTED_VERSION,'The current Rainward build integrates both authored human assets')
  check(p.evaluate('Object.keys(Rainward.snapshot().visuals.rainworn.humans.errors).length')==0,'Both human files load without fallback errors')
  before=p.evaluate('JSON.stringify({hp:Rainward.state.player.hp,mag:Rainward.state.player.mag,reserve:Rainward.state.player.reserve,x:Rainward.state.player.x,z:Rainward.state.player.z,objectives:Rainward.state.objectives,taken:[...Rainward.state.taken]})')
  p.screenshot(path=str(OUT/'game-imported-low.png'));press(9,'Rainward.mode==="pause"');nav('detailedHumans');press(0);press(1,'Rainward.mode==="play"');wait('Rainward.snapshot().visuals.rainworn.humans.active===0');check(True,'The controller switches to the original characters without replacing game state');p.screenshot(path=str(OUT/'game-original-low.png'))
  press(9,'Rainward.mode==="pause"');nav('detailedHumans');press(0);nav('rainFilm');press(0);check(p.evaluate('!Rainward.snapshot().visuals.rainworn.film.enabled'),'The controller independently toggles wet materials');press(0);p.locator('#low').uncheck();p.locator('#resume').click();wait('Rainward.snapshot().visuals.rainworn.humans.active>0&&Rainward.snapshot().visuals.rainworn.film.active');frames(5);p.screenshot(path=str(OUT/'game-rainworn-full.png'))
  check(p.evaluate('Rainward.snapshot().visuals.rainworn.film.materials')>5,'Actual world-surface materials use the composed rain-film shader')
  p.keyboard.press('KeyP');wait('Rainward.mode==="pause"');p.locator('#rainFilm').uncheck();p.locator('#resume').click();wait('Rainward.snapshot().visuals.rainworn.film.amount===0');frames(4);p.screenshot(path=str(OUT/'game-dry-full.png'))
  after=p.evaluate('JSON.stringify({hp:Rainward.state.player.hp,mag:Rainward.state.player.mag,reserve:Rainward.state.player.reserve,x:Rainward.state.player.x,z:Rainward.state.player.z,objectives:Rainward.state.objectives,taken:[...Rainward.state.taken]})');check(before==after,'Visual comparisons preserve health, ammunition, position, objectives and supplies')
  p.keyboard.press('KeyP');wait('Rainward.mode==="pause"');p.locator('#low').check();p.locator('#rainFilm').check();p.locator('#resume').click();wait('!Rainward.snapshot().visuals.rainworn.film.active');check(True,'Reduced Graphics bypasses rain-film shading while retaining the fitted hero')
  press(1);wait('Rainward.state.player.stance==="crouch"');p.evaluate('pad.buttons[1]={pressed:true,value:1}');wait('Rainward.state.player.stance==="prone"');p.evaluate('pad.buttons[1]={pressed:false,value:0}');frames();p.screenshot(path=str(OUT/'game-prone.png'));check(p.evaluate('Rainward.snapshot().visuals.rainworn.humans.active')>0,'Crouch and hold-B prone retain the imported model instead of swapping its body')
  press(9,'Rainward.mode==="pause"');p.set_viewport_size({'width':390,'height':844});nav('detailedHumans');check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The character and shader settings fit a phone-width interface');p.screenshot(path=str(OUT/'settings-phone.png'));p.set_viewport_size({'width':1120,'height':800});p.locator('#to-title').click();finish_transition(p,'title');p.locator('#chapter-select').select_option('terminus');p.locator('#start').click();finish_transition(p,'play');wait('Rainward.snapshot().visuals.rainworn.humans.loaded===2');check(all(requests.count(url)==1 for url in set(requests)),'Chapter changes reuse downloaded bytes, not stale mutable skeletons or extra network downloads')
  context.close();context=browser.new_context(viewport={'width':1000,'height':740});context.add_init_script("localStorage.setItem('svgn.rainward.v1.settings',JSON.stringify({low:true,mute:true,scanned:false}))");context.route('**/assets/humans/*.glb',lambda r:r.fulfill(status=503,body='offline fixture'));p=context.new_page();p.set_default_timeout(120000);p.on('pageerror',lambda e:errors.append(str(e)));p.goto(BASE+'/rainward/');wait('window.Rainward');p.locator('#start').click();wait('Object.keys(Rainward.snapshot().visuals.rainworn.humans.errors).length===2');z=p.evaluate('Rainward.state.player.z');p.keyboard.down('KeyW');p.wait_for_function('(z)=>Rainward.state.player.z<z-.5',arg=z);p.keyboard.up('KeyW');check(p.evaluate('Rainward.snapshot().visuals.rainworn.humans.active')==0,'Missing human downloads leave the actual game playable with the original character')
  context.unroute('**/assets/humans/*.glb');p.keyboard.press('KeyP');p.locator('#human-retry').click();wait('Rainward.snapshot().visuals.rainworn.humans.loaded===2');check(True,'Retry loads the models without restarting or erasing the expedition')
  check(not errors,'No uncaught script errors during model swaps, chapter disposal or fallback')
  check(not any('Shader Error' in e or 'VALIDATE_STATUS' in e for e in console),'Imported skin, cloth and rain-film shaders compile in actual WebGL')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'scope':'Native HTTP/WebGL, decoded CC0 human assets, real adapter clothing, keyboard/mouse/standard-pad actions, safe shelter fixture for visual comparisons, isolated network failure. Long full-shading menu traversals are replaced with native mouse clicks; controller options are exercised in Reduced Graphics. Not physical controller, performance-tier or artistic approval.'},indent=2))
 except Exception as e:
  data={'error':str(e),'checks':checks,'errors':errors,'console':console}
  try:data['snapshot']=p.evaluate('window.Rainward?.snapshot()');data['focus']=p.evaluate('document.activeElement?.id');p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
 finally:browser.close()
