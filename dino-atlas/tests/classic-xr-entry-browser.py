"""Actual Classic launcher DOM/input checks; WebXR capabilities and sessions mocked.
No actor, inventory, mission, or saved-progression assignments. Not hardware testing.
"""
from pathlib import Path
import json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'xr-entry-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
PAD="""window.__pad={id:'Classic entry synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[__pad],configurable:true});"""
MOCK="""window.__xrSupport={vr:true,ar:true};window.__xrRequests=[];window.__rejectXR=false;Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async m=>m==='immersive-ar'?__xrSupport.ar:__xrSupport.vr,requestSession:async mode=>{__xrRequests.push({mode,path:location.pathname,activation:navigator.userActivation.isActive});if(__rejectXR)throw new Error('Mock permission denial');window.__session=new EventTarget();__session.inputSources=[];__session.visibilityState='visible';__session.end=async()=>__session.dispatchEvent(new Event('end'));return __session;}}});"""
checks=[];errors=[];server=None

def check(value,name):
 assert value,name
 checks.append(name);print('PASS:',name,flush=True)

try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  options=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
  browser=pw.chromium.launch(**options)
  context=browser.new_context(viewport={'width':1100,'height':720});context.add_init_script(PAD);context.add_init_script(MOCK)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 and 'favicon' not in r.url else None)
  def wait(expr,t=90000):page.wait_for_function(expr,timeout=t)
  def press(i):
   wait('!g.xr.ctx.input.neutral',30000);page.evaluate('i=>__pad.buttons[i]={value:1,pressed:true}',i)
   try:page.wait_for_function('i=>g.xr.ctx.input.previous[i]===true',arg=i,timeout=30000)
   finally:page.evaluate('i=>__pad.buttons[i]={value:0,pressed:false}',i)
   page.wait_for_function('i=>g.xr.ctx.input.previous[i]===false&&!g.xr.ctx.input.neutral',arg=i,timeout=30000)
  def launch(view,initial=False):
   scope='#classic-xr-entry' if initial else '#classic-xr-menu'
   page.locator(scope+' [data-classic-xr-view="'+view+'"]').click()
   wait('g.xr.active&&!g.xr.pending');check(page.evaluate('g.xr.actualView')==view,'Visible button enters '+view+' in Classic')
   check(page.evaluate('__xrRequests.at(-1).mode')==('immersive-ar' if view=='diorama-ar' else 'immersive-vr'),'Entry requests correct immersive session type for '+view)
  try:
   page.goto(BASE+'?test=1&xr-entry=20260918.1',wait_until='domcontentloaded',timeout=90000)
   wait('window.__dinoRanger?.state.ready',120000)
   page.evaluate('window.g=__dinoRanger;g.renderer.xr.setSession=async()=>{};')
   wait('g.xr.entrySupportReady')
   check(page.evaluate('g.xr.snapshot().launcherBuild')=='classic-xr-entry-20260918.1','Current regular-game entry adapter boots')
   check(page.locator('#classic-xr-entry [data-classic-xr-view]').count()==3,'All three modes are visible in the regular game introduction')
   for width,height in [(1100,720),(900,600),(390,844)]:
    page.set_viewport_size({'width':width,'height':height});page.locator('#intro').evaluate('(e)=>e.scrollTop=0');page.wait_for_timeout(200)
    bounds=page.locator('#classic-xr-entry .classic-xr-modes').evaluate('(e)=>{let r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,w:innerWidth,h:innerHeight}}')
    check(bounds['top']>=0 and bounds['bottom']<=height and bounds['left']>=0 and bounds['right']<=width,'Mode choices fit initial viewport '+str(width)+'x'+str(height))
    page.screenshot(path=str(OUT/('intro-'+str(width)+'x'+str(height)+'.png')),timeout=45000)
   page.set_viewport_size({'width':1100,'height':720})
   check(not page.evaluate('g.state.started'),'Inspecting modes does not start or reset the regular game')
   page.evaluate('__rejectXR=true');page.locator('#classic-xr-entry [data-classic-xr-view="diorama-ar"]').click();wait('!g.xr.pending&&!!g.xr.entryFailure')
   check(not page.evaluate('g.state.started||g.xr.active'),'Rejected permission leaves the original game unstarted and recoverable')
   check('not completed' in page.locator('#classic-xr-entry [data-classic-xr-status]').inner_text(),'Entry failure is visible beside the mode buttons')
   page.evaluate('__rejectXR=false');launch('first-person-vr',True);wait('g.state.started')
   check(page.evaluate('__xrRequests.at(-1).activation'),'Direct entry preserves browser click activation before requestSession')
   check(page.evaluate('g.state.animals.length')==64 and '/tidegate' not in page.url,'First-person entry keeps the regular reserve and all 64 residents')
   page.evaluate('__session.end()');wait('!g.xr.active')
   if page.locator('dialog[open]').count():press(1)
   page.locator('#classic-xr-button').click();wait('document.getElementById("menu-dialog").open')
   check(page.locator('#classic-xr-menu').is_visible(),'Top-bar AR / VR opens mode choices in the regular pause menu')
   launch('diorama-vr');wait('!g.state.paused')
   check(page.evaluate('g.xr.diorama&&g.xr.snapshot().framing==="character-centered-depth-portal"'),'VR diorama uses the existing character-centered full-world portal')
   page.evaluate('__session.end()');wait('!g.xr.active');press(9);wait('document.getElementById("menu-dialog").open')
   # Standard gamepad focus navigation, never assigning focus or presentation.
   for _ in range(60):
    if page.evaluate('document.activeElement?.dataset.classicXrView')=='diorama-ar':break
    press(13)
   else:raise AssertionError('Xbox focus cannot reach the AR entry button')
   press(0);wait('g.xr.active&&!g.xr.pending')
   check(page.evaluate('g.xr.actualView')=='diorama-ar','Xbox menu navigation reaches AR diorama through the same ordinary button handler')
   check(page.evaluate('__xrRequests.at(-1).mode')=='immersive-ar','AR selection does not silently request VR')
   page.evaluate('__session.end()');wait('!g.xr.active')
   if page.locator('dialog[open]').count():press(1)
   # Isolate device capability reports, not game state or progress.
   page.evaluate('__xrSupport.ar=false');page.locator('#classic-xr-button').click();wait('document.getElementById("menu-dialog").open');page.locator('#classic-xr-menu [data-classic-xr-recheck]').click();wait('g.xr.entrySupportReady')
   check(page.locator('#classic-xr-menu [data-classic-xr-view="diorama-ar"]').is_disabled() and page.locator('#classic-xr-menu [data-classic-xr-view="first-person-vr"]').is_enabled(),'VR-only browser keeps AR visible but accurately unavailable')
   page.evaluate('Object.defineProperty(navigator,"xr",{configurable:true,value:undefined})');page.locator('#classic-xr-menu [data-classic-xr-recheck]').click();wait('g.xr.entrySupportReady')
   check('does not expose WebXR' in page.locator('#classic-xr-menu [data-classic-xr-status]').inner_text(),'Desktop without WebXR gets an explicit explanation, not disappearing modes')
   check(page.locator('#classic-xr-menu [data-classic-xr-view]:disabled').count()==3,'Unsupported headset entry never falsely advertises an enabled mode')
   page.screenshot(path=str(OUT/'unsupported-browser.png'),timeout=45000)
   press(1);wait('!g.state.paused');press(15)
   check(page.evaluate('g.state.tool')=='zapper','Direct tools remain usable after headset exit and capability recheck')
   check(not errors,'No captured game JavaScript or HTTP errors')
   report={'build':'classic-xr-entry-20260918.1','base':BASE,'passed':len(checks),'checks':checks,'requests':page.evaluate('__xrRequests'),'errors':errors,'physicalHardwareVerified':False,'limitations':'Native software WebGL; actual entry buttons and synthetic Xbox navigation. XR capabilities/session/render-session attachment mocked. No actor, mission, inventory or progress assignments; not headset compositor, passthrough, controller tracking, comfort or performance certification.'}
   (OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
  except Exception as exc:
   try:page.screenshot(path=str(OUT/'failure.png'),timeout=30000)
   except:pass
   (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors},indent=2));raise
  finally:browser.close()
finally:
 if server:server.terminate()
