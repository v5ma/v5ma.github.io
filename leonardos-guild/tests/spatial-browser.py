"""Native WebGL software XR-session emulation; no physical Quest certification.
Only XR hardware poses/buttons and trusted XR-entry clicks are supplied. Canvas
captures are passive reads. No actor, progression, inventory, time or focus writes.
"""
from pathlib import Path
import json,os,math,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'spatial-output';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];captures={}
def read():return page.evaluate('LeonardoGuild.inspect()')
def check(value,text):
 assert value,text
 checks.append(text);print('PASS:',text,flush=True)
def frames(n=4):
 if read()['xr']['presenting']:
  target=read()['xr']['frames']+n;page.wait_for_function('(n)=>!LeonardoGuild.inspect().xr.presenting||LeonardoGuild.inspect().xr.frames>=n',arg=target)
 else:page.evaluate('(n)=>new Promise(resolve=>{let i=0;function f(){if(++i>=n)resolve();else requestAnimationFrame(f);}requestAnimationFrame(f);})',n)
def button(index,number,down):page.evaluate('(v)=>{const s=__xr.sources[v.index];s.gamepad.buttons[v.number]={pressed:v.down,value:v.down?1:0};}',{'index':index,'number':number,'down':down})
def trigger(down):
 page.evaluate('(down)=>{const s=__xr.sources[1];if(s.hand)s.pinch=down?.014:.06;else s.gamepad.buttons[0]={pressed:down,value:down?1:0};}',down)
def point(u,v,kind='panel'):
 page.evaluate('''async ({u,v,kind})=>{const T=await import('/leonardos-guild/vendor/three.module.js'),s=__xr.sources[1];let p;if(kind==='panel')p=new T.Vector3((u-.5)*1.10,(v-.5)*1.65,0).applyAxisAngle(new T.Vector3(0,1,0),-.42).add(new T.Vector3(1.61,1.60,-2.37));else {const real=LeonardoGuild.inspect().xr.mode!=='seated-theatre';p=new T.Vector3((u-.5)*2.85,(v-.5)*.7125,0).multiplyScalar(real?.55:1).applyAxisAngle(new T.Vector3(1,0,0),-.16).add(new T.Vector3(-.44,real?.6:.43,real?-.6:-2.38));}const origin=LeonardoGuild.inspect().xr.theatreOrigin;p.applyAxisAngle(new T.Vector3(0,1,0),origin.yaw).add(new T.Vector3(origin.x,origin.y,origin.z));const d=p.sub(new T.Vector3(s.position.x,s.position.y,s.position.z)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),d);s.orientation={x:q.x,y:q.y,z:q.z,w:q.w};}''',{'u':u,'v':v,'kind':kind});frames(3)
def panel_key(key):
 for _ in range(25):
  keys=read()['xr']['panel']['buttons']
  if key in keys:break
  if key=='page-next':raise AssertionError('Missing pagination')
  panel_key('page-next')
 else:raise AssertionError('Panel key not found: '+key)
 i=keys.index(key)
 if key=='text-prev':u=205/1024;v=1-667/1536
 elif key=='text-next':u=702/1024;v=1-667/1536
 elif key=='page-prev':u=185/1024;v=1-1388/1536
 elif key=='page-next':u=545/1024;v=1-1388/1536
 elif key=='back':u=870/1024;v=1-1388/1536
 elif key=='exit':u=.5;v=1-1480/1536
 else:u=.5;v=1-(735+i*76+33)/1536
 point(u,v);trigger(False);frames(2);trigger(True);frames(3);trigger(False);frames(3)
def dom(selector):
 index=page.evaluate('''selector=>{const e=document.querySelector(selector),r=e?.closest('dialog[open]')||document.getElementById('menu');const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]');const list=[...r.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(e=>visible(e)&&e.type!=='hidden');return list.indexOf(e);}''',selector)
 assert index>=0,'DOM action not visible '+selector
 key='dom'+str(index)
 for _ in range(25):
  if key in read()['xr']['panel']['buttons']:panel_key(key);return
  panel_key('page-next')
 raise AssertionError('Paged action unreachable '+selector)
def capture(name):
 captures[name]=read();page.screenshot(path=str(OUT/(name+'.png')))
 if read()['xr']['presenting']:
  page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture')
  (OUT/(name+'-stereo-canvas.png')).write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]))
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1280,'height':800},service_workers='block');ctx.add_init_script(path=str(ROOT/'tests/xr-hardware-mock.js'))
 page=ctx.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 try:
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild&&LeonardoGuild.inspect().xr.supported')
  check(read()['quarter']['active'],'Spatial acceptance starts in the actual authored opening')
  page.locator('#guild-xr-enter').click();page.wait_for_function('LeonardoGuild.inspect().xr.presenting');frames(8)
  check(read()['xr']['mode']=='diorama-vr' and read()['xr']['spatial']['renderedEyes']==2,'VR diorama renders the actual shared district with both headset cameras')
  check(not read()['xr']['spatial']['worldIsTexture'] and read()['xr']['spatial']['geometryDraws']>3,'The miniature is geometry, not the old flat theatre screen')
  capture('diorama-title');dom('#start');check(read()['running'],'Tracked pointer starts the same campaign inside the miniature');frames(8)
  before=read();page.evaluate('__xr.head.x=.15;__xr.yaw=.18');frames(12)
  check(abs(read()['x']-before['x'])<1e-7 and abs(read()['z']-before['z'])<1e-7,'Leaning and looking around the miniature do not move the apprentice')
  page.evaluate('__xr.head.x=0;__xr.yaw=0');panel_key('presentation');page.wait_for_selector('#guild-spatial-options[open]');before=read()
  for action,expected in [('aperture-overhead',{'topOpen':True,'frontOpen':False}),('aperture-front',{'topOpen':False,'frontOpen':True}),('aperture-corner',{'topOpen':True,'frontOpen':True})]:
   dom('[data-spatial-action="'+action+'"]');frames(5);check(read()['xr']['spatial']['faces']==expected,'Actual renderer accepts '+action+' without closing both faces');capture(action)
  for action in ['toggle-top','toggle-front','toggle-top','scale-up','raise','rotate-right','nearer']:
   dom('[data-spatial-action="'+action+'"]');frames(3);faces=read()['xr']['spatial']['faces'];check(faces['topOpen'] or faces['frontOpen'],'The '+action+' action retains an opening')
  check(read()['x']==before['x'] and read()['z']==before['z'] and read()['credits']==before['credits'] and read()['mission']==before['mission'],'Apertures, scale, height and rotation leave world position and progression unchanged')
  dom('[data-spatial-action="aperture-corner"]');dom('[data-spatial-action="rotate-left"]');dom('[data-spatial-action="view-first-person"]');frames(6)
  check(read()['xr']['mode']=='first-person-vr' and read()['xr']['spatial']['renderedEyes']==2,'First-person VR uses full-scale stereo geometry of the same district')
  panel_key('back');page.wait_for_function('LeonardoGuild.inspect().running');frames(8);capture('first-person-workshop')
  button(0,0,True);frames(6);check(read()['resonance']['aim'] and read()['xr']['spatial']['aimVisible'],'First-person aim has a visible headset reticle');button(0,0,False);frames(4)
  start=read();page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,-.65]');frames(18);page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]');frames(35)
  check(math.hypot(read()['x']-start['x'],read()['z']-start['z'])>.2,'Tracked stick moves the same collision-checked player in first person')
  before=read();page.evaluate('__xr.sources[1].gamepad.axes=[0,0,1,0]');frames(6);page.evaluate('__xr.sources[1].gamepad.axes=[0,0,0,0]');frames(4)
  check(abs(read()['x']-before['x'])<.04 and abs(read()['z']-before['z'])<.04,'Snap turning changes the view without translating the apprentice')
  before=read();page.evaluate('__xr.head.x=1.2');frames(5);check(read()['xr']['spatial']['headBlocked'],'Excessive physical leaning activates the head-clipping guard');check(read()['x']==before['x'] and read()['z']==before['z'],'Head-clipping recovery cannot teleport the player');page.evaluate('__xr.head.x=0');frames(6)
  page.evaluate('__xr.replace(1,true)');frames(6);check(read()['xr']['handCount']==1,'Hand tracking can replace a controller inside true spatial XR')
  panel_key('presentation');dom('[data-spatial-action="view-diorama"]');panel_key('back');frames(8);check(read()['xr']['mode']=='diorama-vr','Hand-pinch UI switches back to the miniature without a separate save');capture('diorama-hand-ui')
  panel_key('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');frames(6);check(read()['paused'] and read()['quarter']['active'],'Leaving spatial XR safely restores the ordinary game')
  page.locator('#guild-xr-pause-mode').select_option('diorama-ar');page.locator('#guild-xr-pause').click();page.wait_for_function('LeonardoGuild.inspect().xr.presenting');frames(8)
  check(page.evaluate("__xr.request.mode==='immersive-ar'&&__xr.request.options.optionalFeatures.includes('hit-test')"),'AR uses a real separate immersive-ar request with optional surface hit testing')
  check(read()['xr']['mode']=='diorama-ar' and read()['xr']['spatial']['renderedEyes']==2,'AR renders the same miniature geometry with both views')
  dom('#resume');panel_key('presentation');before=read();dom('[data-spatial-action="place-surface"]');frames(6)
  check(read()['xr']['spatial']['placement']=='hit-test-surface','A deliberate hand selection places the exhibit on the supplied hit-test surface')
  check(read()['x']==before['x'] and read()['z']==before['z'],'Surface placement changes no game-world coordinates')
  dom('[data-spatial-action="view-first-person"]');check(read()['xr']['mode']=='diorama-ar','AR cannot silently become first-person VR without a new session')
  panel_key('back');capture('diorama-ar');panel_key('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');frames(5);check(page.evaluate('__xr.hitCancelled===true'),'Surface tracking is cancelled at session exit')
  page.evaluate('__xr.hitSupported=false');page.locator('#guild-xr-pause').click();page.wait_for_function('LeonardoGuild.inspect().xr.presenting');frames(6)
  check(read()['xr']['spatial']['placement']=='manual' and not read()['xr']['spatial']['hitAvailable'],'Unsupported surface hit testing retains explicitly manual placement')
  panel_key('exit');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');frames(5)
  check(read()['credits']==0 and not read()['quarter']['parcel'],'Spatial inspection never remotely collects the visible parcel or grants a reward')
  check(not errors,'No captured JavaScript or GLSL errors across native stereo VR, first-person and AR rendering')
 finally:
  try:page.screenshot(path=str(OUT/'final.png'))
  except:pass
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'captures':captures,'evidence':'Native Chromium and actual local Three/WebGL drawing. Emulated WebXR session, eyes, hands, controllers and surface samples only; no live actor/progression writes. Physical passthrough, Quest comfort and hardware performance are not certified.'},indent=2));browser.close()
