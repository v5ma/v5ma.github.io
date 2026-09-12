"""Native HTTP rhythm/AR correctness, not a hardware performance benchmark."""
from pathlib import Path
from urllib.parse import urlparse
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];MODE=os.getenv('PRISM_SUITE','desktop');OUT=ROOT/'test-output'/('prism-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[]
RELEASE=json.loads((ROOT/'prism-current/release.json').read_text())['version']
DRIVER=(ROOT/'prism-current/tests/input-driver.js').read_text()
def check(v,s):
 assert v,s
 checks.append(s);print('PASS:',s,flush=True)
def snapshot(page):return page.evaluate('Prism.snapshot()')
def device_button(page,hand,index):
 page.evaluate("""async ([h,i])=>{const scene=AFRAME.scenes[0];async function frames(){let prev=scene.frame,n=0;await new Promise((resolve,reject)=>{const began=performance.now(),timer=setInterval(()=>{if(scene.frame!==prev){prev=scene.frame;n++;}if(n>=3){clearInterval(timer);resolve();}else if(performance.now()-began>12000){clearInterval(timer);reject(Error('XR frames stalled'));}},4);});}TestXR.button(h,i,true);await frames();TestXR.button(h,i,false);await frames();}""",[hand,index])
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);ctx=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block');host=urlparse(BASE).hostname
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
 if MODE=='xr':ctx.add_init_script(path=str(ROOT/'prism-current/tests/fake-xr.js'))
 page=ctx.new_page();page.set_default_timeout(40000);page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  if MODE=='desktop':
   page.goto(BASE+'/',wait_until='domcontentloaded');page.locator('a#prism-launch').click()
  else:page.goto(BASE+'/prism-current/',wait_until='domcontentloaded')
  page.wait_for_function('window.Prism?.snapshot().ready&&AFRAME.scenes[0].renderer.info.render.calls>0');page.evaluate(DRIVER)
  check(snapshot(page)['version']==RELEASE,'The actual A-Frame renderer loads the declared isolated rhythm release')
  page.screenshot(path=str(OUT/'title.png'))
  if MODE=='desktop':
   check(page.url.endswith('/prism-current/index.html'),'The homepage game card opens the playable page')
   check(page.locator('#tracks button').count()==4,'Four original tracks are selectable')
   check(page.locator('#enter-ar').is_disabled(),'Unsupported AR is not presented as a working mode')
   page.locator('#input').select_option('keys');check(snapshot(page)['input']=='keys','Selecting an input mode preserves the chosen value');page.locator('#start').click();page.wait_for_function('Prism.snapshot().phase==="playing"')
   check(snapshot(page)['audio']=='running','The worker-rendered score plays through a real AudioContext')
   page.wait_for_function('Prism.snapshot().time>2');page.keyboard.press('KeyP');page.wait_for_function('Prism.snapshot().phase==="paused"');before=snapshot(page)['time'];page.wait_for_timeout(450)
   check(abs(snapshot(page)['time']-before)<.001,'Pause freezes audio position and note progression together')
   page.locator('#resume').click();page.wait_for_function('Prism.snapshot().phase==="playing"');page.locator('#scene-wrap').focus();page.evaluate('PrismTestInput.keys()')
   page.wait_for_function('Prism.snapshot().state.hits>=3');page.screenshot(path=str(OUT/'rhythm-session.png'))
   check(snapshot(page)['state']['score']>0,'Normal keyboard input scores the timing-only practice mode')
   page.wait_for_function('Prism.snapshot().phase==="complete"',timeout=110000);result=snapshot(page)['state'];check(result['hits']>=35 and result['complete'],'A complete original track reaches its results through input, not injected completion')
   page.screenshot(path=str(OUT/'results.png'));check(len(snapshot(page)['scoreRecords'])==1,'A completed result is stored only under its track, chart and input mode')
   page.reload(wait_until='domcontentloaded');page.wait_for_function('window.Prism?.snapshot().ready');check(len(snapshot(page)['scoreRecords'])==1,'Local best survives a page reload without an account')
   page.locator('[data-track="afterglow"]').click();page.locator('#difficulty').select_option('pulse');page.locator('#start').click();page.wait_for_function('Prism.snapshot().phase==="playing"');check(snapshot(page)['track']=='afterglow' and snapshot(page)['difficulty']=='pulse','A different original song and denser chart start independently')
   page.keyboard.press('KeyP');page.locator('#back').click();check(len(snapshot(page)['scoreRecords'])==1,'Aborting a run does not invent a completed record')
   page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(OUT/'mobile-menu.png'));check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'The control and song menus fit a phone-width viewport')
  else:
   page.wait_for_function('!document.getElementById("enter-ar").disabled');page.evaluate('TestXR.state.deny=true');page.locator('#enter-ar').click();page.wait_for_function('Prism.snapshot().message.includes("Could not enter AR:")')
   check(not snapshot(page)['immersive'],'Session refusal leaves the normal browser game usable')
   page.evaluate('TestXR.state.deny=false');page.locator('#enter-ar').click();page.wait_for_function('Prism.snapshot().immersive&&Prism.snapshot().calibrated')
   check(page.evaluate('TestXR.state.requests.at(-1).mode')=='immersive-ar','The AR button requests immersive-ar, not a VR scene named AR')
   check(snapshot(page)['blend']=='alpha-blend' and not snapshot(page)['studio'],'Opaque sky and floor are hidden for the transparent AR composition')
   check(page.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==0,'Clear alpha is transparent while the AR compositor supplies passthrough')
   page.screenshot(path=str(OUT/'emulated-ar-menu.png'))
   check(page.evaluate('Prism.component.art.graphics.ar&&Prism.component.art.notes.filter(n=>n.g.visible).every(n=>n.body.material.isShaderMaterial)'), 'AR selects screen-buffer-free translucent jewels, not opaque glass capture')
   page.evaluate('TestXR.pose("left",[-.36,1.385,-.4])');page.wait_for_timeout(100);device_button(page,'left',0);page.wait_for_function('Prism.snapshot().phase==="playing"')
   check(snapshot(page)['input']=='slice','Tracked controller play uses real blade sweeps, not keyboard note matching')
   page.evaluate('PrismTestInput.xr()');page.wait_for_function('Prism.snapshot().state.hits>0');check(snapshot(page)['state']['hits']>0,'A swept tracked saber physically intersects and scores a note')
   page.screenshot(path=str(OUT/'emulated-ar-slice.png'));page.evaluate('TestXR.missing("right",true)');page.wait_for_function('Prism.snapshot().phase==="paused"')
   check('controllers' in snapshot(page)['message'],'Missing tracked controllers pause the song instead of creating phantom swings')
   frozen=snapshot(page)['time'];page.evaluate('TestXR.missing("right",false)');page.wait_for_timeout(400);check(snapshot(page)['phase']=='paused' and snapshot(page)['time']==frozen,'Tracking recovery never automatically resumes motion or audio')
   device_button(page,'right',5);page.wait_for_function('Prism.snapshot().phase==="playing"');page.evaluate('TestXR.hide(true)');page.wait_for_function('Prism.snapshot().phase==="paused"');check(snapshot(page)['phase']=='paused','Headset visibility loss pauses the run')
   page.evaluate('TestXR.hide(false);TestXR.reset()');check(not snapshot(page)['calibrated'],'A reference-space reset requires recentering before more play')
   page.evaluate('TestXR.state.session.end()');page.wait_for_function('!Prism.snapshot().immersive');check(snapshot(page)['studio'],'Ending XR restores the desktop studio and does not record an aborted run')
   page.evaluate('TestXR.state.blend="opaque"');page.locator('#enter-ar').click();page.wait_for_function('TestXR.state.session.ended');check(not snapshot(page)['immersive'],'An opaque session is rejected rather than misrepresented as passthrough')
  check(not errors,'No uncaught browser errors in this suite')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'passed':len(checks),'checks':checks,'errors':errors,'state':snapshot(page),'scope':'Native HTTP Chromium/software WebGL: desktop one-eighth pixel ratio; emulated XR 120x160 pixels per eye. Input drivers read audio time and issue ordinary input, never write scores or clocks. Full-resolution artwork checked separately. Not hardware performance or physical Quest certification.'},indent=2))
 except Exception as e:
  try:
   state=snapshot(page);state['stall']=page.evaluate('Prism.component.lastStall || null');state['renderer']=page.evaluate('({pixels:AFRAME.scenes[0].renderer.domElement.width*AFRAME.scenes[0].renderer.domElement.height,ratio:AFRAME.scenes[0].renderer.getPixelRatio()})')
  except:state={}
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2));page.screenshot(path=str(OUT/'failure.png'));raise
 finally:ctx.close();b.close()
