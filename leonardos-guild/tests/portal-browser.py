"""Production portal shaders in labeled graphics fixtures, then real legacy play.
No live actor, objective, reward, clock or source writes. Hardware emulation only.
"""
from pathlib import Path
import os,json,base64,importlib.util
from playwright.sync_api import sync_playwright
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
  ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block');ctx.add_init_script(path=str(ROOT/'tests/xr-hardware-mock.js'));game=ctx.new_page();game.set_default_timeout(90000);game.on('pageerror',lambda e:errors.append(str(e)))
  game.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
  game.goto(BASE+'/leonardos-guild/?district=legacy&quality=low',wait_until='domcontentloaded');game.wait_for_function('window.LeonardoGuild&&LeonardoGuild.inspect().xr.supported')
  game.locator('#guild-xr-mode').select_option('diorama-vr');game.locator('#guild-xr-enter').click();game.wait_for_function('LeonardoGuild.inspect().xr.presenting')
  spec=importlib.util.spec_from_file_location('hand',ROOT/'tests/porter-xr-pointer.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
  game.evaluate('__xr.replace(1,true)');frames,panel,dom,capture=module.hand_ui(game);frames(6);dom('#start');frames(8)
  read=lambda:game.evaluate('LeonardoGuild.inspect()');start=read()
  check(not start['quarter']['active'] and start['xr']['mode']=='diorama-vr','The ordinary legacy game uses the world portal rather than falling back to a theatre or map')
  check(not start['xr']['hud']['panelVisible'] and not start['xr']['hud']['toolbarVisible'],'Legacy gameplay has no permanent rectangular controls')
  game.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,-.6]');frames(18);game.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]');frames(50);moved=read()
  check(((moved['x']-start['x'])**2+(moved['z']-start['z'])**2)**.5>.2,'Normal bicycle controls move the saved vehicle inside the portal')
  check(max(abs(a-b) for a,b in zip(moved['xr']['spatial']['playerDisplay'],moved['xr']['spatial']['boxPosition']))<1e-5,'The ridden character stays centered, with the complete legacy scene moving instead')
  check(moved['xr']['spatial']['boxPosition']==start['xr']['spatial']['boxPosition'],'Legacy travel preserves accepted exhibit placement')
  game.evaluate('__xr.pitch=-.4');frames(6);capture(OUT/'legacy-portal-stereo.png');game.evaluate('__xr.pitch=0');panel('exit');game.wait_for_function('!LeonardoGuild.inspect().xr.presenting')
  check(read()['credits']==start['credits'] and read()['mission']==start['mission'],'Portal viewing and travel manufacture no progression')
  game.screenshot(path=str(OUT/'legacy-return.png'));check(not errors,'No captured JavaScript or GLSL errors in actual legacy portal rendering')
 finally:
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'evidence':'Graphics fixtures are explicitly separate from real legacy bicycle movement. Native Chromium/WebGL with emulated XR, not physical hardware.'},indent=2));browser.close()
