"""Ordinary game journey with real WebGL and labelled synthetic XR hardware.
No game-state, clock, inventory, currency, focus or player-pose assignments.
"""
from pathlib import Path
import os,json,math,time,base64,importlib.util
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
SITE='public' if BASE.startswith('https:') else 'source'
OUT=ROOT/('environment-'+SITE+'-output');OUT.mkdir(exist_ok=True)
checks=[];errors=[];shader_errors=[];states={};failure=None
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts)
 try:
  ctx=browser.new_context(viewport={'width':960,'height':640},service_workers='block')
  ctx.add_init_script(script=(ROOT/'tests/xr-hardware-mock.js').read_text()+'\n'+(ROOT/'tests/xr-compositor-mock.js').read_text())
  page=ctx.new_page();page.set_default_timeout(65000)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:shader_errors.append(m.text) if m.type=='error' and any(t in m.text for t in ['WebGLProgram','Shader Error','VALIDATE_STATUS']) else None)
  page.goto(BASE+'/leonardos-guild/?chapter=stillwater&quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
  read=lambda:page.evaluate('LeonardoGuild.inspect()')
  def check(ok,text):
   assert ok,text
   checks.append(text);print('PASS:',text,flush=True)
  def frames(n=4):page.evaluate('(n)=>new Promise(r=>{let i=0;function f(){if(++i>=n)r();else requestAnimationFrame(f)}requestAnimationFrame(f)})',n)
  held=set()
  def keys(next):
   next=set(next)
   for k in held-next:page.keyboard.up(k)
   for k in next-held:page.keyboard.down(k)
   held.clear();held.update(next)
  def walk(*points):
   page.wait_for_function('LeonardoGuild.inspect().running')
   for x,z in points:
    started=time.monotonic()
    while time.monotonic()-started<160:
     s=read();assert s['running'],'Unexpected pause during ordinary walking'
     dx=x-s['x'];dz=z-s['z'];d=math.hypot(dx,dz)
     if d<.85:keys([]);frames(10);break
     a=(math.atan2(dx,dz)-s['yaw']+math.pi)%(math.pi*2)-math.pi
     keys((['w'] if abs(a)<.5 else [])+(['a' if a>0 else 'd'] if abs(a)>.06 else []));frames(2)
    else:raise AssertionError('No ordinary route to '+str((x,z)))
  def face(yaw):
   started=time.monotonic()
   while time.monotonic()-started<30:
    s=read();a=(yaw-s['yaw']+math.pi)%(2*math.pi)-math.pi
    if abs(a)<.055:keys([]);frames(18);return
    keys(['a' if a>0 else 'd']);frames(1)
   keys([]);raise AssertionError('Ordinary look direction did not settle')
  def settings():
   page.keyboard.press('p');page.wait_for_selector('#pause-dialog[open]');page.locator('#pause-settings').click();page.wait_for_selector('#settings-dialog[open]')
  def resume_settings():
   page.locator('#settings-close').click();page.wait_for_selector('#pause-dialog[open]');page.locator('#resume').click();page.wait_for_function('LeonardoGuild.inspect().running')
  check(read()['frontier']['selected']=='cistern' and read()['frontier']['gateTracked'] and not read()['road']['tracking'],'Stillwater entry selects the real expedition route without forcing the Lantern Road')
  check(read()['frontier']['accepted']==[] and read()['credits']==0,'The playtest link grants no contract completion, money or equipment')
  check(read()['render']['environment']['trees']['prepared'],'Shared tree buffers prepared with Guild r177 before starting gameplay')
  check(read()['render']['environment']['trees']['trees']==6,'Six existing Vinci tree placements use the shared library')
  page.locator('#start').click();page.wait_for_function('LeonardoGuild.inspect().running');page.keyboard.press('f');walk((0,29))
  page.screenshot(path=str(OUT/'vinci-trees.png'));states['trees']=read()
  settings();before=page.evaluate("localStorage.getItem('svgn.leonardos-guild.v1')")
  page.locator('#environment-motion').click();frames(5)
  check(read()['render']['environment']['trees']['quiet'],'Existing graphics menu selects still vegetation without a second UI')
  page.locator('#environment-opacity').click();frames(5)
  check(page.evaluate("localStorage.getItem('svgn.leonardos-guild.v1')")==before,'Visual settings leave the paused adventure save byte-identical')
  check(read()['render']['environment']['settings']['arWaterOpacity']==.85,'AR opacity has an independent saved value')
  resume_settings();walk((0,-17));page.keyboard.press('i');page.wait_for_selector('#frontier-dialog[open]');page.locator('[data-frontier-action="enter"]').click()
  page.wait_for_function("LeonardoGuild.inspect().frontier.zone==='badlands'&&LeonardoGuild.inspect().running")
  walk((270,16),(236.3,16));face(0);frames(8)
  page.keyboard.press('i');page.wait_for_selector('#frontier-dialog[open]');page.locator('[data-frontier-action="accept:cistern"]').click();page.locator('#frontier-close').click();page.wait_for_function('LeonardoGuild.inspect().running');frames(12)
  check(read()['target']['id']=='cistern' and page.locator('#mission-title').inner_text()=='The Drowned Workshop','Accepting the real waterworks contract updates the map and mission display together')
  water=read()['render']['frontier']['water']
  check(water['active'] and water['water']['module']=='Currentworks Water','Ordinary travel reaches the real Stillwater basin with shared water')
  check(water['passes']==0 and water['water']['renderTargets']==0,'The new water adds no reflected-scene or refraction scene pass')
  check(water['water']['quiet'] and water['shaderTime']==0,'Still mode freezes water decoration, not the physical basin')
  check(water['surface']==read()['frontier']['cistern']['surface'],'Water appearance follows the existing hydraulic state')
  settings();page.locator('#environment-motion').click();resume_settings();frames(6)
  page.screenshot(path=str(OUT/'stillwater-surface.png'));states['surface']=read()
  check(read()['render']['frontier']['water']['shaderTime']>0,'Flowing mode resumes on the host simulation clock')
  for mode in ['diorama-ar','first-person']:
   page.keyboard.press('p');page.wait_for_selector('#pause-dialog[open]');page.locator('#xr-pause-launcher [data-xr-entry="'+mode+'"]').click()
   page.wait_for_function('LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.entry.frames>4')
   # Look down toward the basin through an ordinary simulated head pose; the
   # old west-facing landscape capture did not demonstrate visible water.
   page.evaluate('(pitch)=>{__xr.pitch=pitch}',-.35 if mode=='first-person' else -.20);frames(8)
   page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture')
   path=OUT/(mode+'-water.png');path.write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]))
   image=Image.open(path).convert('RGBA');w,h=image.size
   counts=[len({c[:3] for c in image.crop((i*w//2+40,60,(i+1)*w//2-40,h-60)).resize((100,100)).getdata() if c[3]>150}) for i in range(2)]
   check(min(counts)>30,mode+': both real eye attachments are nonblank; basin coverage requires screenshot review')
   states[mode]={'guild':read(),'eyeColors':counts};water=read()['render']['frontier']['water']['water']
   check(water['quality']=='light' and water['xr'],mode+': water uses the bounded stereo geometry tier')
   check(abs(water['opacity']-(.85 if mode=='diorama-ar' else .86))<.001,mode+': AR opacity does not leak into VR')
   page.evaluate('__xr.replace(1,true)')
   spec=importlib.util.spec_from_file_location('hands',ROOT/'tests/porter-xr-pointer.py');helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
   xrframes,panel,dom,capture=helper.hand_ui(page);xrframes(6);panel('pause');xrframes(4);dom('#pause-settings');xrframes(4)
   check(page.locator('#settings-dialog').get_attribute('open') is not None,mode+': tracked hand opens the existing graphics settings')
   dom('#environment-motion');xrframes(5);check(read()['render']['frontier']['water']['water']['quiet'],mode+': hand UI changes the actual shader setting')
   dom('#environment-motion');xrframes(4);panel('back');xrframes(4);panel('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting')
   check(read()['paused'] and read()['credits']==0,mode+': actual session end retains the adventure and usable pause parent')
   page.locator('#resume').click();page.wait_for_function('LeonardoGuild.inspect().running')
  saved=read()['frontier'];page.keyboard.press('p');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
  check(read()['frontier']['cistern']==saved['cistern'] and read()['credits']==0,'Ordinary reload preserves hydraulic progress without granting rewards')
  check(read()['render']['environment']['settings']=={'quiet':False,'arWaterOpacity':.85},'Independent graphical preferences survive normal reload')
  check(not shader_errors,'No captured shader compilation errors on the real r177 renderer')
  check(not errors,'No uncaught script errors in the graphical integration journey')
 except Exception as e:
  failure=str(e)
  try:states['failure']=page.evaluate('({url:location.href,guild:window.LeonardoGuild?.inspect(),text:document.body.innerText})');page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'base':BASE,'checks':checks,'errors':errors,'shaderErrors':shader_errors,'failure':failure,'states':states,'evidence':'Real browser WebGL and ordinary keyboard/DOM gameplay; synthetic XR controller and hand poses. Not physical Quest or sustained hardware performance.'},indent=2));browser.close()
