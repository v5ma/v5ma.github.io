"""Real first-screen DOM, WebGL and input handlers with explicit WebXR hardware emulation.
No game state, source responses, clocks, saved progress or acceptance flags are assigned.
The hardware shim enforces browser transient user activation for requestSession.
"""
from pathlib import Path
import json,os,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'quarter-entry-output';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];captures={};requests=[]
def check(v,text):
 assert v,text
 checks.append(text);print('PASS:',text,flush=True)
fixture=(ROOT/'tests/xr-hardware-mock.js').read_text()
def hardware(config):
 return fixture+'''\n(()=>{const config='''+json.dumps(config)+''';
 const xr=navigator.xr,request=xr.requestSession;
 __xr.requests=[];__xr.reject=!!config.reject;__xr.floor=!config.noFloor;
 // Emulate browser/page lifecycle separately from the XR device visibility.
 __xr.pageHidden=false;Object.defineProperty(document,'hidden',{get:()=>__xr.pageHidden,configurable:true});
 if(config.noAPI){Object.defineProperty(navigator,'xr',{value:undefined,configurable:true});return;}
 xr.isSessionSupported=async mode=>{if(config.probeError)throw Error('Probe unavailable');return mode==='immersive-ar'?config.ar!==false:config.vr!==false;};
 xr.requestSession=(mode,options)=>{
  __xr.requests.push({mode,active:navigator.userActivation.isActive,options});
  if(!navigator.userActivation.isActive)return Promise.reject(new DOMException('Direct activation required','SecurityError'));
  return request(mode,options);
 };
})();'''
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**opts)
 def make(config=None,viewport=None):
  ctx=browser.new_context(viewport=viewport or {'width':1280,'height':720},service_workers='block')
  ctx.add_init_script(script=hardware(config or {}));page=ctx.new_page();page.set_default_timeout(90000)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
  page.goto(BASE+'/leonardos-guild/?quality=low',wait_until='domcontentloaded');page.wait_for_function('window.LeonardoGuild')
  page.wait_for_function("!['checking'].includes(LeonardoGuild.inspect().xr.entry.vr)")
  return ctx,page
 def read(page):return page.evaluate('LeonardoGuild.inspect()')
 def capture(page,name):
  captures[name]=read(page);page.screenshot(path=str(OUT/(name+'.png')))
  if captures[name]['xr']['presenting']:
   page.evaluate('__xr.capture=null;__xr.captureNext=true');page.wait_for_function('__xr.capture');(OUT/(name+'-stereo.png')).write_bytes(base64.b64decode(page.evaluate('__xr.capture').split(',',1)[1]))
 def stop(page):
  # The headset's system exit is a hardware event, not a game-state write.
  page.evaluate('__xr.session.end()');page.wait_for_function('!LeonardoGuild.inspect().xr.presenting');page.wait_for_timeout(150)
 try:
  for name,width,height in [('desktop',1280,720),('headset-window',1024,640),('phone',390,660)]:
   ctx,page=make(viewport={'width':width,'height':height})
   bounds=page.locator('#xr-launcher [data-xr-entry]').evaluate_all('es=>es.map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent,y:r.y,bottom:r.bottom,x:r.x,right:r.right,disabled:e.disabled}})')
   check(len(bounds)==4 and all(b['y']>=0 and b['bottom']<=height and b['x']>=0 and b['right']<=width and not b['disabled'] for b in bounds),'All four direct modes are visible without scrolling on '+name)
   capture(page,'entry-'+name);ctx.close()
  for mode,expected,session in [('first-person','first-person-vr','immersive-vr'),('diorama-vr','diorama-vr','immersive-vr'),('first-person-ar','first-person-ar','immersive-ar'),('diorama-ar','diorama-ar','immersive-ar')]:
   ctx,page=make();before=read(page)
   page.locator('#xr-launcher [data-xr-entry="'+mode+'"]').click()
   page.wait_for_function("LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.entry.phase==='running'")
   page.wait_for_function('LeonardoGuild.inspect().xr.entry.frames>3')
   current=read(page);calls=page.evaluate('__xr.requests');requests.extend(calls)
   check(len(calls)==1 and calls[0]['mode']==session and calls[0]['active'],mode+' makes exactly one correct session request inside the trusted button activation')
   check(current['xr']['mode']==expected and current['xr']['spatial']['renderedEyes']==2,mode+' starts the selected actual stereo view, not a default or fallback')
   check(current['running'] and not current['xr']['hud']['panelVisible'] and not current['xr']['hud']['toolbarVisible'],mode+' enters play with one click and no second Start or permanent rectangles')
   check(current['credits']==before['credits'] and current['quarter']['delivery']==before['quarter']['delivery'],mode+' preserves the existing rewards and mission state')
   capture(page,'direct-'+mode)
   # Browser visibility is a platform fixture, not a game-state or clock write.
   page.evaluate("__xr.pageHidden=true;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'))")
   page.wait_for_timeout(150)
   check(read(page)['running'] and not read(page)['paused'],mode+' remains active when its immersive view is visible but the browser page is hidden')
   startMove=read(page);target=startMove['xr']['frames']+16
   page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,-.45]');page.wait_for_function('(n)=>LeonardoGuild.inspect().xr.frames>=n',arg=target)
   page.evaluate('__xr.sources[0].gamepad.axes=[0,0,0,0]');afterMove=read(page)
   check((afterMove['x']-startMove['x'])**2+(afterMove['z']-startMove['z'])**2>.0225,mode+' accepts real tracked-stick movement while only the page is hidden')
   page.evaluate("__xr.session.visibilityState='visible-blurred';__xr.session.dispatchEvent(new Event('visibilitychange'))");page.wait_for_function('LeonardoGuild.inspect().paused')
   check(read(page)['paused'],mode+' still pauses when a real XR overlay takes focus')
   page.evaluate("__xr.pageHidden=false;document.dispatchEvent(new Event('visibilitychange'));__xr.session.visibilityState='visible';__xr.session.dispatchEvent(new Event('visibilitychange'))");stop(page)
   check(read(page)['paused'] and page.locator('#pause-dialog [data-xr-entry]').count()==4,mode+' exits safely to four explicit pause-screen mode buttons')
   # A different mode on pause must also start/resume from one direct user click.
   page.locator('#xr-pause-launcher [data-xr-entry="'+mode+'"]').click();page.wait_for_function("LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.entry.phase==='running'")
   check(read(page)['xr']['mode']==expected,mode+' resumes directly from its pause-screen button');stop(page);ctx.close()
  ctx,page=make({'reject':True});page.locator('#xr-launcher [data-xr-entry="first-person"]').click()
  page.wait_for_function("LeonardoGuild.inspect().xr.entry.phase==='failed'")
  check('NotAllowedError' in page.locator('#xr-launcher-status').inner_text() and not read(page)['xr']['presenting'],'Denied permission remains a visible actionable error on the same first screen')
  check(page.locator('#xr-launcher [data-xr-entry="first-person"]').is_enabled() and len(page.evaluate('__xr.requests'))==1,'Denied startup rearms the button and does not silently retry or switch modes')
  capture(page,'permission-denied');page.evaluate('__xr.reject=false');page.locator('#xr-launcher [data-xr-entry="first-person"]').click();page.wait_for_function('LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.entry.frames>2')
  check(read(page)['xr']['entry']['error']=='','A fresh trusted retry after denial starts normally and clears the old error');stop(page);ctx.close()
  ctx,page=make({'vr':True,'ar':False})
  check(page.locator('#xr-launcher [data-xr-entry="first-person"]').is_enabled() and page.locator('#xr-launcher [data-xr-entry="first-person-ar"]').is_disabled(),'AR unavailable does not disable supported VR; all four buttons stay visible')
  check('unavailable' in page.locator('#xr-launcher [data-xr-support="ar"]').inner_text(),'Unsupported AR has an explicit visible explanation instead of a silent button');capture(page,'vr-only');ctx.close()
  ctx,page=make({'probeError':True,'noFloor':True});page.locator('#xr-launcher [data-xr-entry="diorama-ar"]').click();page.wait_for_function('LeonardoGuild.inspect().running&&LeonardoGuild.inspect().xr.entry.frames>2')
  check(read(page)['xr']['referenceType']=='local' and read(page)['xr']['mode']=='diorama-ar','An inconclusive support probe and absent local-floor retain a real direct AR attempt with local-reference fallback');stop(page);ctx.close()
  ctx,page=make({'noAPI':True})
  check(page.locator('#xr-launcher [data-xr-entry]').count()==4 and page.locator('#xr-launcher [data-xr-entry]:disabled').count()==4,'A non-XR browser keeps the four explained modes visible')
  check('headset browser' in page.locator('#xr-launcher-status').inner_text(),'A non-XR browser tells the player where XR must be opened')
  page.locator('#start').click();check(read(page)['running'],'The original on-screen game still starts without XR support');capture(page,'desktop-no-xr');page.evaluate("__xr.pageHidden=true;document.dispatchEvent(new Event('visibilitychange'))");check(read(page)['paused'],'Ordinary on-screen play still pauses when its page is hidden');ctx.close()
  check(not errors,'No captured JavaScript or shader errors in the direct launch and recovery journeys')
 finally:
  (OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors,'captures':captures,'requests':requests,'evidence':'Native Chromium and real DOM/Three/WebGL with clearly emulated XR hardware, page/session visibility and activation policy. Not a physical Quest, passthrough or performance certificate.'},indent=2));browser.close()
