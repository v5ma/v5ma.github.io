"""Browser acceptance through keyboard, buttons, taps and WebGL fault recovery."""
from pathlib import Path
import os,json,time,math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'svgn-planet/test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');MODE=os.getenv('SUITE','desktop');checks=[];errors=[]
def check(ok,name):
 assert ok,name
 checks.append(name);print('PASS',name,flush=True)
def snap(page):return page.evaluate('SVGNPlanet.inspect()')
def street(t,x=0):
 a=t/110;b=x/110
 return [math.sin(b),math.cos(b)*math.cos(a),-math.cos(b)*math.sin(a)]
def walk(page,target):
 held=set();start=time.monotonic()
 try:
  while time.monotonic()-start<60:
   s=snap(page);n=s['n'];dot=sum(a*b for a,b in zip(n,target));d=math.acos(max(-1,min(1,dot)))*110
   if d<1.7:return
   direction=[b-dot*a for a,b in zip(n,target)];length=math.sqrt(sum(a*a for a in direction));direction=[a/length for a in direction]
   x=sum(a*b for a,b in zip(direction,s['basis']['right']));z=sum(a*b for a,b in zip(direction,s['basis']['forward']));new=set()
   if abs(x)>.25:new.add('KeyD' if x>0 else 'KeyA')
   if abs(z)>.25:new.add('KeyW' if z>0 else 'KeyS')
   for key in held-new:page.keyboard.up(key)
   for key in new-held:page.keyboard.down(key)
   held=new;page.wait_for_timeout(60)
  raise AssertionError('Navigation timed out: '+str(s))
 finally:
  for key in held:page.keyboard.up(key)
with sync_playwright() as p:
 kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**kw);mobile=MODE=='mobile';ctx=b.new_context(viewport={'width':390 if mobile else 1280,'height':844 if mobile else 800},is_mobile=mobile,has_touch=mobile,service_workers='block');page=ctx.new_page();page.set_default_timeout(45000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(BASE+'/svgn-planet/index.html',wait_until='domcontentloaded');page.wait_for_function('window.SVGNPlanet&&SVGNPlanet.inspect().render');page.locator('#start').click();page.wait_for_timeout(900);begin=time.monotonic()
  check('Paper Delivery' in page.title(),'The application uses the requested SVGN Paper Delivery identity')
  check(snap(page)['render']['cameraMode']=='street','The first playable view follows the character, not the planet center')
  check(snap(page)['render']['playerScreenHeight']>.14,'The rider occupies a readable portion of the viewport')
  page.screenshot(path=str(OUT/(MODE+'-street-start.png')))
  if not mobile:
   page.keyboard.press('KeyP');page.locator('#quality').select_option('low');page.locator('#resume').click()
   walk(page,street(8));page.keyboard.press('KeyQ');page.wait_for_function('SVGNPlanet.inspect().deliveries.length===1');check(True,'A paper flies to the first mailbox and completes a real delivery')
   for i in range(1,8):
    t=12+i*12;side=1 if i%2 else -1
    walk(page,street(t));walk(page,street(t,side*4.2));page.keyboard.press('KeyE');page.wait_for_timeout(100);walk(page,street(t))
   check(len(snap(page)['deliveries'])==8,'All eight neighborhood deliveries are reachable through ordinary movement')
   page.screenshot(path=str(OUT/'desktop-route.png'))
   for t in [84,72,60,48,36,24,12,0,-9]:walk(page,street(t))
   walk(page,street(-9,-4.2));page.keyboard.press('KeyE');page.wait_for_timeout(300);check(snap(page)['complete'],'Returning to the depot completes the round')
   old=snap(page)['steps'];page.wait_for_timeout(3000);check(snap(page)['steps']>old and not snap(page)['paused'],'Finishing never quits or stops the session')
   page.keyboard.press('KeyP');page.locator('#vehicle-pause').select_option('bicycle');page.locator('#resume').click();page.wait_for_timeout(500);page.screenshot(path=str(OUT/'desktop-bicycle.png'))
   page.reload();page.wait_for_function('window.SVGNPlanet&&SVGNPlanet.inspect().render');page.locator('#start').click();page.wait_for_timeout(500);check(len(snap(page)['deliveries'])==8 and snap(page)['started'],'Saved completion resumes into a playable scene')
  else:
   q=snap(page)['render'];check(q['low'] and not q['shadows'] and q['pixelRatio']<=1,'Phone graphics start in the bounded low-power preset')
   r=page.locator('#stick').bounding_box();client=ctx.new_cdp_session(page);x=r['x']+r['width']/2;y=r['y']+r['height']/2
   client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]});client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-32,'id':1}]});page.wait_for_timeout(5000);client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});check(snap(page)['distance']>5,'The on-screen joystick actually moves the rider')
   page.screenshot(path=str(OUT/'mobile-riding.png'));page.locator('#touch-jump').tap();page.wait_for_timeout(180);check(any(e['type']=='jump' for e in snap(page)['events']),'Touch hopping reaches the simulation')
   page.locator('#pause').tap();old=snap(page)['steps'];page.wait_for_timeout(500);check(snap(page)['steps']==old,'Pause holds the simulation without leaving the game');page.locator('#resume').tap()
   before=snap(page);page.evaluate("document.getElementById('world').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()");page.wait_for_function('SVGNPlanet.inspect().graphicsLost');check(page.locator('#failure').is_visible(),'A graphics interruption has a recoverable in-game message')
   page.locator('#retry').tap();page.wait_for_function('!SVGNPlanet.inspect().graphicsLost');page.wait_for_timeout(600);check(snap(page)['started'] and not snap(page)['failed'],'Graphics recovery keeps the running game rather than navigating away')
   check(snap(page)['deliveries']==before['deliveries'],'Graphics recovery preserves delivery progress')
   page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(400);check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Landscape touch layout stays within the screen');page.screenshot(path=str(OUT/'mobile-landscape.png'))
   page.wait_for_timeout(max(0,60-(time.monotonic()-begin))*1000);check(snap(page)['started'] and snap(page)['steps']>600 and not snap(page)['failed'],'A sixty-second mobile-browser session stays running')
  check(not errors,'No uncaught JavaScript exceptions in this scenario');(OUT/(MODE+'-report.json')).write_text(json.dumps({'checks':checks,'snapshot':snap(page),'errors':errors,'scope':'Chromium software WebGL; touch is emulated, not physical iPhone Safari certification.'},indent=2))
 except Exception as e:
  (OUT/(MODE+'-failure.json')).write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'snapshot':snap(page)},indent=2));page.screenshot(path=str(OUT/(MODE+'-failure.png')));raise
 finally:b.close()
