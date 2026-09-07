"""Real browser multitouch via CDP hardware-input events; no actor-state writes.
Game world and movement are ordinary WebGL2, not a mocked canvas renderer.
"""
from pathlib import Path
import json,os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');OUT=Path(__file__).resolve().parents[1]/'touch-output';OUT.mkdir(exist_ok=True)
checks=[];errors=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS',label,flush=True)
def read():return page.evaluate('LeonardoGuild.inspect()')
def tick(n=20):
 old=read()['steps'];page.wait_for_function('(t)=>LeonardoGuild.inspect().steps>=t',arg=old+n,timeout=30000)
def center(sel):
 box=page.locator(sel).bounding_box();return [box['x']+box['width']/2,box['y']+box['height']/2]
def point(id,x,y):return {'id':id,'x':x,'y':y,'radiusX':6,'radiusY':6,'force':1}
def fingers(kind,*points):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':list(points)})
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=pw.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':844,'height':390},has_touch=True,is_mobile=True,device_scale_factor=1,service_workers='block');page=ctx.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)));cdp=ctx.new_cdp_session(page)
 host=urlparse(BASE).hostname;ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 try:
  page.goto(BASE+'/leonardos-guild/',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');page.locator('#start').tap();tick(2)
  check(read()['version']=='0.2.0','The browser loads the new online-game version')
  check(read()['touchEnabled'] and page.locator('#move-stick').is_visible(),'Touch devices get an actual joystick automatically')
  check(read()['render']['triangles']>50000 and read()['render']['visuals']['instancedFoliage'],'The real WebGL scene contains the new foliage and town graphics')
  page.screenshot(path=str(OUT/'landscape-start.png'))
  x,y=center('#move-stick');radius=page.locator('#move-stick').bounding_box()['width']*.31
  fingers('touchStart',point(1,x,y));fingers('touchMove',point(1,x,y-radius*.55));tick(25)
  check(.35<read()['input']['axes']['y']<.7,'Half thumb travel produces fractional throttle, not a digital W key')
  fingers('touchMove',point(1,x+radius*.25,y-radius));tick(25)
  check(read()['yaw']<-.05 and read()['z']>-6,'Dragging the stick actually steers and moves the bicycle')
  fingers('touchStart',point(1,x,y-radius),point(2,435,185));fingers('touchMove',point(1,x,y-radius),point(2,510,217));tick(2)
  check(read()['input']['pointer'] is not None and read()['input']['cameraPointer'] is not None,'Two fingers have independent joystick and camera ownership')
  check(abs(read()['render']['orbit'])>.1 and read()['render']['pitch']>.1,'A second finger orbits and tilts the actual 3D camera')
  px,py=center('[data-hold="q"]');before=read()['papers'];fingers('touchStart',point(1,x,y-radius),point(2,510,217),point(3,px,py));tick(2)
  check(read()['papers']<before and read()['input']['axes']['strength']>.8,'Letters can be thrown while steering and controlling the camera')
  fingers('touchEnd');page.wait_for_function('LeonardoGuild.inspect().input.pointer===null')
  check(read()['input']['axes']['strength']==0 and read()['input']['buttons']==0,'Lifting all fingers clears every held control')
  fingers('touchStart',point(4,x,y-radius));tick(2);fingers('touchCancel');tick(2)
  check(read()['input']['pointer'] is None and read()['input']['axes']['strength']==0,'Touch cancellation returns the joystick to neutral')
  bx,by=center('[data-hold="brake"]');fingers('touchStart',point(5,bx,by));tick(70);fingers('touchEnd');check(abs(read()['speed'])<.2,'The thumb brake stops the bicycle')
  fingers('touchStart',point(6,x,y-radius));tick(10);page.locator('#pause-button').tap();page.wait_for_function('LeonardoGuild.inspect().paused');snap=read();page.wait_for_timeout(300)
  check(read()['steps']==snap['steps'] and read()['input']['axes']['strength']==0,'Pause freezes time and releases the analogue joystick')
  fingers('touchEnd');page.locator('#resume').tap();page.wait_for_function('!LeonardoGuild.inspect().paused');check(read()['input']['pointer'] is None,'Resuming cannot restore stale held input')
  page.locator('#settings-button').tap();page.wait_for_selector('#settings-dialog[open]');snap=read();page.locator('#graphics-quality').select_option('low');page.wait_for_timeout(150)
  check(read()['render']['quality']=='low' and not read()['render']['shadows'] and read()['steps']==snap['steps'],'Battery graphics changes live without moving or restarting the player')
  page.locator('#camera-distance').select_option('1.4');check(read()['render']['distanceScale']==1.4,'Camera distance is adjustable without reloading the world')
  page.locator('#show-joystick').uncheck();check(not page.locator('#move-stick').is_visible(),'Joystick can be hidden for keyboard play');page.locator('#show-joystick').check();page.locator('#settings-close').tap();page.wait_for_function('!LeonardoGuild.inspect().paused')
  page.set_viewport_size({'width':390,'height':844});tick(2);page.screenshot(path=str(OUT/'portrait-controls.png'))
  check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The portrait interface stays within the phone viewport')
  for sel in ['#move-stick','.action-pad','#settings-button']:
   b=page.locator(sel).bounding_box();assert b and b['x']>=0 and b['x']+b['width']<=391 and b['y']+b['height']<=845,sel
  check(True,'Joystick, buttons and settings remain reachable in portrait')
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild');check(read()['render']['quality']=='low' and read()['render']['distanceScale']==1.4,'Graphics and control preferences persist across page reload')
  page.locator('#start').tap();page.locator('#settings-button').tap();page.locator('#graphics-quality').select_option('high');page.locator('#settings-close').tap();page.set_viewport_size({'width':1280,'height':800});tick(2);page.screenshot(path=str(OUT/'quality-scene.png'))
  check(read()['render']['shadows'] and read()['render']['visuals']['contactShadows'],'Quality mode enables sun shadows while retaining contact shading')
  check(not errors,'No uncaught browser errors in the verified touch and rendering flows')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Native HTTP/software WebGL2; Chromium hardware-input touch events, not a physical iPhone performance certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':read() if page.evaluate('!!window.LeonardoGuild') else None},indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 finally:ctx.close();browser.close()
