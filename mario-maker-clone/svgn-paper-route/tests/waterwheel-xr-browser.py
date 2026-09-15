"""Real game and XR rendering with deterministic hardware.
Audit all settled pause-menu pages; the labeled scenery-isolation fixture changes
only scene visibility and restores it. Never assigns player, velocity, wins or score.
"""
from pathlib import Path
import os,json,subprocess,threading,functools,base64
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.environ.get('ARTIFACT_DIR','/tmp/sky-cycle-portals'));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
origin=os.getenv('TEST_ORIGIN',f'http://127.0.0.1:{server.server_port}').rstrip('/')+'/';BASE=origin+'mario-maker-clone/svgn-paper-route/'
checks=[];errors=[];logs=[];passed=False;diagnostics={};failure=None
MEASURE="""async({labels,page})=>{
 const T=await import('./vendor/three.webgpu.js'),d=SkyCycleXR.diagnostics;
 const dom=SkyCycleFlightDeck.controls(SkyCycleFlightDeck.topPanel()).filter(el=>el.id!=='sky-xr-enter').map(el=>el.textContent.trim());
 if(JSON.stringify(dom)!==JSON.stringify(labels))throw Error('Pause controls changed after readiness');
 const expected=labels.slice(page*6,page*6+6);
 const rows=d.buttons.filter(b=>b.w===1130&&b.h===67&&b.y>=270&&b.y<=655);
 if(d.page!==page||!expected.length||JSON.stringify(rows.map(b=>b.label))!==JSON.stringify(expected))throw Error('Rendered page does not match the corresponding real DOM controls');
 const img=new Image();img.src=await xrEmulator.image();await img.decode();
 const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const cx=c.getContext('2d');cx.drawImage(img,0,0);
 const eyes=__merged.renderer.xr.getCamera().cameras,samples=[],text=[];
 function pixel(eye,x,y){const v=new T.Vector3((x/1200-.5)*1.5,(.5-y/900)*1.125,0).applyMatrix4(new T.Matrix4().fromArray(d.uiMatrix)).project(eyes[eye]);const px=Math.round(eye*550+(v.x+1)*275),py=Math.round((1-v.y)*400);if(px<eye*550||px>=(eye+1)*550||py<0||py>=800)throw Error('Menu sample outside eye viewport');return {px,py,rgb:[...cx.getImageData(px,py,1,1).data].slice(0,3)};}
 function luminance(rgb){return rgb.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);}
 for(let eye=0;eye<2;eye++)for(const b of rows){
  const background=pixel(eye,b.x+b.w*.7,b.y+b.h-12);for(const t of [.7,.85])samples.push({eye,label:b.label,...pixel(eye,b.x+b.w*t,b.y+b.h-12)});
  const a=pixel(eye,b.x+12,b.y+10),z=pixel(eye,b.x+380,b.y+43);let highContrast=0;
  for(let y=a.py;y<=z.py;y++)for(let x=a.px;x<=z.px;x++){const rgb=[...cx.getImageData(x,y,1,1).data].slice(0,3);if((luminance(rgb)+.05)/(luminance(background.rgb)+.05)>=4.5)highContrast++;}
  text.push({eye,label:b.label,highContrast});
 }
 return {page,labels:expected,samples,text,toneMapping:__merged.renderer.toneMapping,exposure:__merged.renderer.toneMappingExposure};
}"""
def check(value,label):
 assert value,label
 checks.append(label);print('PASS:',label,flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1100,'height':800},service_workers='block',record_video_dir=str(OUT/'video'),record_video_size={'width':800,'height':600})
 ctx.add_init_script((Path(__file__).with_name('xr-emulator.js')).read_text().replace("import('../vendor/three.webgpu.js')","import('./vendor/three.webgpu.js')"))
 ctx.add_init_script("localStorage.setItem('sprocket_muted','1');if(!localStorage.getItem('portal-legacy-sentinel'))localStorage.setItem('portal-legacy-sentinel','preserved');")
 ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith((origin,'blob:','data:')) else r.abort())
 page=ctx.new_page();page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:logs.append(m.text) if m.type=='error' else None)
 def frames(n=4):
  start=page.evaluate('SkyCycleXR.diagnostics.frames');page.wait_for_function('(s)=>SkyCycleXR.diagnostics.frames>=s',arg=start+n)
 def choose(label,ending=False):
  for _ in range(20):
   if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.toLowerCase().includes(s.toLowerCase()))',label):break
   point('Next');page.evaluate("xrEmulator.select('start')");page.evaluate("xrEmulator.select('end')");frames(3)
  point(label);page.evaluate("xrEmulator.select('start')");page.evaluate("xrEmulator.select('end')")
  if ending:page.wait_for_function('!SkyCycleXR.presenting')
  else:frames(4)
 def point(label):
  page.evaluate('(s)=>xrEmulator.point(s)',label);frames(3)
 def press(index,hand='right'):
  frames();page.evaluate('([h,i])=>xrEmulator.button(h,i,true)',[hand,index]);frames();page.evaluate('([h,i])=>xrEmulator.button(h,i,false)',[hand,index]);frames()
 def capture(name):
  image=page.evaluate('xrEmulator.image()');(OUT/(name+'.png')).write_bytes(base64.b64decode(image.split(',',1)[1]))
 try:
  page.goto(BASE+'?xr=1',wait_until='domcontentloaded');page.bring_to_front();page.wait_for_function('window.SkyCycleXR && window.SkyCycleWaterwheel && window.__gpuReady && window.PaperDeliveryCampaign?.status==="ready" && window.PrismaticReady && window.SkyCyclePortals && document.getElementById("prism-pause") && document.getElementById("bathhouse-pause")')
  records=page.evaluate('JSON.stringify(SkyCycleFlightDeck.records)')
  page.locator('#ww-preview-open').click();page.locator('#ww-preview-ride').click();page.wait_for_function('RouteWorkshop.testing && player.onGround && __cloudview?.root?.userData.waterwheelPreview')
  page.locator('#sky-xr-open').click();page.locator('#sky-xr-enter').click();page.wait_for_function('SkyCycleXR.presenting && SkyCycleXR.diagnostics.frames>5')
  check(page.evaluate('SkyCycleXR.diagnostics.eyes===2 && SkyCycleXR.diagnostics.ownedScene && __cloudview.root.userData.waterwheelPreview.revision===2'),'Both stereo eyes render the actual Waterwheel preview scene')
  capture('waterwheel-xr-controller')
  labels=page.evaluate('SkyCycleFlightDeck.controls(SkyCycleFlightDeck.topPanel()).filter(el=>el.id!=="sky-xr-enter").map(el=>el.textContent.trim())')
  required=['Back to the route','Choose a route','Portal atlas','Materials & FX','Flight Deck','Sound & music','Controller guide','Retry checkpoint']
  check(len(labels)>=8 and all(label in labels for label in required),'All invariant and both optional pause controls are registered before measuring pagination')
  diagnostics['pause_controls']=labels;diagnostics['menu_pages']=[];diagnostics['isolated_pages']=[]
  pixels=[];text_regions=[];seen=[];isolated_pixels=[]
  for page_index in range((len(labels)+5)//6):
   if page_index:choose('Next')
   page.wait_for_function('(i)=>SkyCycleXR.diagnostics.page===i',arg=page_index);frames(3)
   measured=page.evaluate(MEASURE,{'labels':labels,'page':page_index})
   diagnostics['menu_pages'].append(measured);pixels+=measured['samples'];text_regions+=measured['text'];seen+=measured['labels']
   capture('waterwheel-pause-page-'+str(page_index+1))
   # Explicit render-only fixture. Always restore original scenery visibility.
   visible=page.evaluate('__merged.scene.visible')
   try:
    page.evaluate('(()=>{__merged.scene.visible=false;})()');frames(3)
    isolated=page.evaluate(MEASURE,{'labels':labels,'page':page_index})
   finally:
    page.evaluate('(value)=>{__merged.scene.visible=value;}',visible);frames(3)
   diagnostics['isolated_pages'].append(isolated);isolated_pixels+=isolated['samples']
  check(seen==labels,'Native next-page input exposes every pause control exactly once in DOM order')
  reference=pixels[0]['rgb']
  check(len(pixels)==4*len(labels) and len(pixels)>=24 and all(max(abs(v-e) for v,e in zip(sample['rgb'],reference))<=6 for sample in pixels),'Every control on every page has uniform opaque backgrounds in both eyes')
  check(len(text_regions)==2*len(labels) and len(text_regions)>=12 and all(sample['highContrast']>=20 for sample in text_regions),'Every pause control has visible text with at least 4.5 to 1 measured contrast in both eyes')
  check(len(isolated_pixels)==len(pixels) and all(a['label']==b['label'] and a['eye']==b['eye'] and max(abs(v-e) for v,e in zip(a['rgb'],b['rgb']))<=2 for a,b in zip(pixels,isolated_pixels)),'Render-only isolation confirms scenery cannot overwrite any sampled page background')
  choose('Controller guide');page.wait_for_function('document.getElementById("flight-deck-guide").open');capture('waterwheel-paged-controller-guide')
  choose('Back');page.wait_for_function('!document.getElementById("flight-deck-guide").open && __delivery.paused')
  check(True,'Controller guide remains selectable after paging and Back preserves the paused parent')
  choose('Back to the route');page.wait_for_function('!__delivery.paused');frames()
  x=page.evaluate('player.x');page.evaluate('xrEmulator.axis(.8)');page.wait_for_function('(x)=>player.x>x+100',arg=x);page.evaluate('xrEmulator.axis(0)');frames()
  check(page.evaluate('RouteWorkshop.testing && __delivery.state.route===-1'),'Tracked controller rides while the existing Workshop retains award isolation')
  press(5);page.wait_for_function('__delivery.paused');page.evaluate('xrEmulator.hands()');frames()
  check(page.evaluate('SkyCycleXR.diagnostics.handJoints===50'),'Waterwheel retains two tracked hands in the native XR UI')
  choose('Sound & music');choose('Effect intensity: soft plus');check(page.evaluate('SkyCycleSensory.settings.transients==="full"'),'Hand-selected comfort settings still operate during a Waterwheel preview')
  choose('Back');choose('Back to the route');page.wait_for_function('!__delivery.paused');frames()
  x=page.evaluate('player.x');point('Ride right');page.evaluate("xrEmulator.select('start')");page.wait_for_function('(x)=>player.x>x+80',arg=x);page.evaluate("xrEmulator.select('end')");frames()
  point('Jump');page.evaluate("xrEmulator.select('start')");page.wait_for_function('!player.onGround');page.evaluate("xrEmulator.select('end')");frames();capture('waterwheel-xr-hand-jump')
  check(True,'Hand selection drives real Waterwheel movement and jumping without changing physics state directly')
  choose('Pause');page.wait_for_function('__delivery.paused');capture('waterwheel-xr-hand-pause')
  choose('Exit XR',ending=True);page.wait_for_function('!SkyCycleXR.presenting && !__merged.scene.parent')
  check(page.evaluate('__delivery.paused && !keys.ArrowRight && !keys.Space'),'Hand-operated XR exit restores the safely paused original game and clears held input')
  check(page.evaluate('JSON.stringify(SkyCycleFlightDeck.records)')==records,'Partial XR preview awards no campaign career progress')
  page.locator('#maker-return').click();page.wait_for_function('RouteWorkshop.active && !RouteWorkshop.testing')
  check(page.evaluate('RouteWorkshop.state.doc.extra.gp.waterwheel.revision===2'),'XR preview returns to its unchanged editable blueprint')
  page.screenshot(path=str(OUT/'waterwheel-editor-after-xr.png'))
  check(not errors,'No uncaught exceptions in the Waterwheel tracked-input flow')
  shader=[x for x in logs if any(v in x.lower() for v in ['tsl:','shader error','validation error','gl_invalid'])];check(not shader,'No detected shader errors in the Waterwheel stereo target')
  diagnostics['final']=page.evaluate('SkyCycleXR.diagnostics');passed=True
 except Exception as exc:
  failure=str(exc)
  try:page.screenshot(path=str(OUT/'failure.png'));diagnostics['failure_state']=page.evaluate('({xr:window.SkyCycleXR?.diagnostics,route:window.__delivery?.state.route,testing:window.RouteWorkshop?.testing,capture:window.xrEmulator?.lastCapture})')
  except Exception:pass
  raise
 finally:
  (OUT/'report.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'passed':passed,'failure':failure,'checks':checks,'errors':errors,'console':logs,'diagnostics':diagnostics,'coverage':'Real Waterwheel game scene and Three XRManager with deterministic tracking hardware. All settled pause pages, native paging/guide selection, stereo contrast and explicitly isolated render-only scenery fixture; original visibility restored. Ordinary movement and editor return. No full XR finish or physical Quest qualification.'},indent=2));ctx.close();browser.close();server.shutdown()
