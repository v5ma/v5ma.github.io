"""Native feedback regression. Authored-kit shelter fixture; no physical-device claim."""
import json, os, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('test-output/rainward-readability');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
fixture=subprocess.check_output(['node','--input-type=module','-e',"import {createGame,interact,checkpoint} from './rainward/model.mjs';const s=createGame('natatorium');Object.assign(s.player,{x:2,z:47});interact(s);s.enemies.forEach(e=>e.hp=0);console.log(checkpoint(s));"],text=True).strip()
checks=[];errors=[];console=[]
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts)
 for profile,controller in [('survival',False),('survival',True),('classic',False)]:
  name=profile+('-controller' if controller else '-keyboard');ctx=browser.new_context(viewport={'width':960,'height':720},service_workers='block')
  ctx.add_init_script("localStorage.setItem('svgn.rainward.v1.checkpoint',"+json.dumps(fixture)+");localStorage.setItem('svgn.rainward.v1.settings',"+json.dumps(json.dumps({'controlPreset':profile,'mute':True,'low':True,'scanned':False,'cinematic':False,'detailedHumans':False}))+ ");")
  if controller:ctx.add_init_script("window.pad={connected:true,mapping:'standard',index:0,id:'Readability virtual Xbox',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};window.padPolls=0;window.padPulse=[];Object.defineProperty(navigator,'getGamepads',{value:()=>{padPolls++;const buttons=pad.buttons.map(b=>({...b}));for(const i of padPulse)buttons[i]={pressed:true,value:1};padPulse=[];return [{...pad,buttons}];}});")
  page=ctx.new_page();page.set_default_timeout(45000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
  def wait(q):page.wait_for_function(q)
  def check(v,msg):
   assert v,name+': '+msg
   checks.append(name+': '+msg);print('PASS',checks[-1],flush=True)
  def frames(n=4):
   old=page.evaluate('padPolls');page.wait_for_function('([old,n])=>padPolls>=old+n',arg=[old,n])
  def pulse(i):frames();page.evaluate('(i)=>padPulse=[i]',i);frames()
  def nav(target):
   for _ in range(70):
    if page.evaluate('document.activeElement?.id')==target:return
    if controller:pulse(13)
    else:page.keyboard.press('Tab')
   raise AssertionError('Cannot focus '+target)
  def hold(on,key='Enter'):
   if controller:page.evaluate('(on)=>pad.buttons[0]={pressed:on,value:on?1:0}',on)
   elif on:page.keyboard.down(key)
   else:page.keyboard.up(key)
  try:
   page.goto(BASE+'/rainward/?chapter=natatorium',wait_until='domcontentloaded');wait('window.Rainward')
   nav('continue')
   if controller:pulse(0)
   else:page.keyboard.press('Enter')
   wait('Rainward.mode==="play"')
   if controller:pulse(13)
   else:page.keyboard.press('Tab')
   wait('Rainward.mode==="pack"');nav('craft-med')
   token='Hold A' if controller else 'Hold Enter, Space'
   wait('document.getElementById("craft-status").textContent.includes('+json.dumps(token if profile=='survival' else 'Select a recipe')+')')
   check(True,'Idle instructions match the input method and selected crafting preset')
   hold(True);wait('!!Rainward.state.player.craft&&Number(document.getElementById("craft-progress").value)>0')
   # Read all feedback in one browser turn, then RELEASE before any screenshot.
   # A screenshot may legitimately take longer than a complete 2.1-second recipe.
   feedback=page.evaluate('({label:document.getElementById("craft-progress").getAttribute("aria-label"),value:document.getElementById("craft-progress").getAttribute("aria-valuetext"),percent:document.getElementById("craft-percent").textContent,status:document.getElementById("craft-status").textContent})')
   hold(False)
   check(feedback['label']=='Crafting medkit','Native progress exposes the correct accessible recipe name')
   check('percent' in feedback['value'] and '%' in feedback['percent'],'Visible and accessible percentage feedback accompanies the native progress bar')
   status=feedback['status']
   check(('release to cancel' in status)==(profile=='survival') and (token in status if profile=='survival' else 'Assembling medkit.' in status),'Active instructions match both the real hold mode and the actual input method')
   if profile=='survival':
    wait('!Rainward.state.player.craft');check(page.evaluate('Rainward.state.player.cloth===3&&Rainward.state.player.canister===3&&Rainward.state.player.medkit===0'),'Releasing the advertised input cancels without losing or duplicating authored resources')
    if controller:frames(5)
    wait('!document.getElementById("craft-smoke").disabled');nav('craft-smoke');hold(True,'Space');wait('!!Rainward.state.player.craft&&Number(document.getElementById("craft-progress").value)>0')
    # This separate hold is intentionally completed; capturing it cannot spoil
    # the earlier cancellation assertion or justify a timing/resource change.
    page.screenshot(path=str(OUT/(name+'-craft.png')))
    wait('Rainward.state.player.smoke===1&&!Rainward.state.player.craft');hold(False,'Space')
    check(page.evaluate('Rainward.state.player.cloth===2&&Rainward.state.player.canister===2'),'A deliberate full hold crafts one smoke with the unchanged finite recipe cost')
   else:
    wait('Rainward.state.player.medkit===1&&!Rainward.state.player.craft');check(page.evaluate('Rainward.state.player.cloth===2&&Rainward.state.player.canister===2'),'Classic crafting finishes after input release with its original cost')
    page.screenshot(path=str(OUT/(name+'-craft.png')))
   page.set_viewport_size({'width':390,'height':844});wait('document.getElementById("craft-percent").textContent===""')
   check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Feedback fits a phone-width native satchel without horizontal overflow')
   page.screenshot(path=str(OUT/(name+'-phone.png')))
  except Exception as e:
   data={'case':name,'error':str(e),'checks':checks,'errors':errors,'console':console}
   try:data['snapshot']=page.evaluate('Rainward.snapshot()');page.screenshot(path=str(OUT/(name+'-failure.png')))
   except Exception:pass
   (OUT/'failure.json').write_text(json.dumps(data,indent=2));raise
  finally:ctx.close()
 browser.close()
assert not errors,errors
assert not console,console
(OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'console':console,'scope':'Real HTTP/WebGL, keyboard and virtual Xbox input. Authored-kit defeated-enemy shelter fixture isolates feedback and preserves recipe timing/cost/refunds. Not physical Xbox/Quest or living-enemy balance evidence.'},indent=2))
