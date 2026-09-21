"""Production portal shaders in labeled graphics fixtures, then real legacy play.
No live actor, objective, reward, clock or source writes. Hardware emulation only.
"""
from pathlib import Path
import os,json,base64,importlib.util
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'quarter-portal-output';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts)
 page=browser.new_page(viewport={'width':1280,'height':800});page.set_default_timeout(90000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 try:
  page.goto(BASE+'/leonardos-guild/tests/portal-graphics.html',wait_until='domcontentloaded');page.wait_for_function('window.portalGraphics')
  graphics=page.evaluate('portalGraphics');(OUT/'graphics.json').write_text(json.dumps(graphics,indent=2))
  for i,result in enumerate(graphics['results']):
   data=page.evaluate('(i)=>portalCapture(i)',i);(OUT/('mask-'+result['name']+'.png')).write_bytes(base64.b64decode(data.split(',',1)[1]))
  check(graphics['allPass'],'Both-eye front/back/side/above/inside fixtures reject leaks and foreground while preserving beyond-wall depth')
  # A separate fresh Quarter session tests map navigation through hardware input.
  mapctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block')
  mapctx.add_init_script("window.__testPad={id:'Xbox standard',mapping:'standard',index:0,connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__testPad]});")
  mapgame=mapctx.new_page();mapgame.set_default_timeout(90000);mapgame.on('pageerror',lambda e:errors.append(str(e)))
  mapgame.goto(BASE+'/leonardos-guild/?district=quarter&quality=low',wait_until='domcontentloaded');mapgame.wait_for_function('window.LeonardoGuild')
  def press(b):
   mapgame.evaluate('(b)=>__testPad.buttons=Array.from({length:17},(_,i)=>({pressed:i===b,value:i===b?1:0}))',b);mapgame.wait_for_function('(b)=>LeonardoGuild.inspect().controller.buttons[b]',arg=b)
   mapgame.evaluate('__testPad.buttons=Array.from({length:17},()=>({pressed:false,value:0}))');mapgame.wait_for_function('(b)=>!LeonardoGuild.inspect().controller.buttons[b]',arg=b)
  press(0);mapgame.wait_for_function('LeonardoGuild.inspect().running');original=mapgame.evaluate('LeonardoGuild.inspect()');press(8);mapgame.wait_for_selector('#map-dialog[open]')
  goal=mapgame.evaluate('LeonardoGuild.inspect().quarterUI.objective');check(goal['id']=='parcel' and goal['layer']=='upper' and goal['vertical']=='above you','The actual street map exposes the upstairs next goal instead of filtering it out')
  mapgame.screenshot(path=str(OUT/'next-goal-from-street.png'))
  for _ in range(30):
   if mapgame.evaluate("document.activeElement===document.querySelector('[data-quarter-goal]')"):break
   press(13)
  else:raise AssertionError('Xbox navigation cannot reach next-goal-floor control')
  press(0);check(mapgame.evaluate("LeonardoGuild.inspect().quarterUI.layer==='upper'"),'Xbox directly selects the next goal floor through its ordinary map handler');mapgame.screenshot(path=str(OUT/'next-goal-focused-floor.png'));press(1)
  after=mapgame.evaluate('LeonardoGuild.inspect()');check(after['credits']==original['credits'] and after['quarter']['observations']==original['quarter']['observations'] and after['x']==original['x'] and after['z']==original['z'],'Goal inspection cannot grant clues, rewards or relocate the apprentice');mapctx.close()
  ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block');ctx.add_init_script(path=str(ROOT/'tests/xr-hardware-mock.js'));game=ctx.new_page();game.set_default_timeout(90000);game.on('pageerror',lambda e:errors.append(str(e)))
  game.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
  game.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');game.wait_for_function('window.LeonardoGuild&&LeonardoGuild.inspect().xr.supported')
  game.locator('#guild-xr-mode').select_option('diorama-vr');game.locator('#guild-xr-enter').click();game.wait_for_function('LeonardoGuild.inspect().xr.presenting')
  spec=importlib.util.spec_from_file_location('hand',ROOT/'tests/porter-xr-pointer.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
  game.evaluate('__xr.replace(1,true)');frames,panel,dom,capture=module.hand_ui(game);frames(6);dom('#start');frames(8)
  read=lambda:game.evaluate('LeonardoGuild.inspect()');start=read()
  check(not start['quarter']['active'] and start['xr']['mode']=='diorama-vr','The ordinary legacy game uses the world portal rather than falling back to a theatre or map')
  check(not start['xr']['hud']['panelVisible'] and not start['xr']['hud']['toolbarVisible'],'Legacy gameplay has no permanent rectangular controls')
  game.evaluate('__xr.replace(1,false)');frames(4);game.evaluate('__xr.sources[1].gamepad.axes=[0,0,0,.65]');frames(12);game.evaluate('__xr.sources[1].gamepad.axes=[0,0,0,0]');frames(4)
  check(read()['xr']['spatial']['cameraPitch']==0 and read()['xr']['spatial']['worldUp']==[0,1,0],'The diorama remains level while the ordinary right stick orbits horizontally');game.evaluate('__xr.replace(1,true)');frames(4)
  game.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,-.6]');frames(18);game.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]');frames(50);moved=read()
  check(((moved['x']-start['x'])**2+(moved['z']-start['z'])**2)**.5>.2,'Normal bicycle controls move the saved vehicle inside the portal')
  check(max(abs(a-b) for a,b in zip(moved['xr']['spatial']['playerDisplay'],moved['xr']['spatial']['boxPosition']))<1e-5,'The ridden character stays centered, with the complete legacy scene moving instead')
  check(moved['xr']['spatial']['boxPosition']==start['xr']['spatial']['boxPosition'],'Legacy travel preserves accepted exhibit placement')
  game.evaluate('__xr.pitch=-.4;__xr.roll=.35');frames(6);capture(OUT/'legacy-portal-stereo.png');check(not read()['xr']['hud']['panelVisible'] and not read()['xr']['hud']['toolbarVisible'],'Head pitch and roll do not reintroduce the two large planes');game.evaluate('__xr.pitch=0;__xr.roll=0');panel('vehicle');frames(6);panel('exit');game.wait_for_function('!LeonardoGuild.inspect().xr.presenting')
  check(read()['credits']==start['credits'] and read()['mission']==start['mission'],'Portal viewing and travel manufacture no progression')
  game.screenshot(path=str(OUT/'legacy-return.png'))
  game.locator('#guild-xr-pause-mode').select_option('first-person-ar');game.locator('#guild-xr-pause').click();game.wait_for_function('LeonardoGuild.inspect().xr.presenting');frames(6);dom('#resume');frames(6)
  check(read()['xr']['mode']=='first-person-ar' and read()['mode']=='foot','The same legacy session supports actual first-person AR on foot')
  game.evaluate('__xr.pitch=.35');frames(6);capture(OUT/'legacy-first-person-ar-alpha.png');alpha=Image.open(OUT/'legacy-first-person-ar-alpha.png').convert('RGBA').getchannel('A').getextrema()
  check(alpha[0]==0 and alpha[1]>0,'Actual first-person AR framebuffer has transparent background and rendered game content, not an opaque sky');game.evaluate('__xr.pitch=0');frames(3);panel('exit');game.wait_for_function('!LeonardoGuild.inspect().xr.presenting')
  check(not errors,'No captured JavaScript or GLSL errors in actual legacy portal and AR rendering')
 finally:
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'evidence':'Graphics fixtures are explicitly separate from real legacy bicycle movement. Native Chromium/WebGL with emulated XR, not physical hardware.'},indent=2));browser.close()
