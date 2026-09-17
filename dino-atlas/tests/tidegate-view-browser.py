"""Capture actual miniature WebGL, with explicit session and eye-pose mocks.
These images are not headset captures, passthrough photographs or stereo evidence.
The canvas is read immediately after the production render, without DOM overlays.
"""
from pathlib import Path
import base64,hashlib,json,os,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'tidegate-evidence';OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
server=None;errors=[];captures=[]
try:
 if BASE.startswith('http://127.0.0.1'):
  server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  try:
   page=browser.new_page(viewport={'width':1100,'height':820});page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('shader' in m.text.lower() or 'webgl' in m.text.lower()) else None)
   page.goto(BASE+'tidegate.html?test=1',wait_until='domcontentloaded');page.wait_for_function('window.__tidegate?.state.ready',timeout=120000)
   page.evaluate('''async()=>{const g=__tidegate;Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>true,requestSession:async()=>{const s=new EventTarget();s.visibilityState='visible';s.inputSources=[];s.end=async()=>s.dispatchEvent(new Event('end'));return s;}}});g.renderer.xr.setSession=async()=>{};g.xr.presentation.view='diorama-ar';await g.xr.enter();g.camera.position.set(0,1.65,0);g.camera.quaternion.identity();g.xr.place();}''')
   for aperture in ['both','top','front']:
    result=page.evaluate('''aperture=>{const g=__tidegate,x=g.xr;x.presentation.aperture=aperture;x.updateStage();g.camera.position.set(0,aperture==='front'?1.22:2.1,.3);g.camera.lookAt(x.anchor.x,x.anchor.y+.14,x.anchor.z);x.render();return {image:document.getElementById('park').toDataURL('image/png').split(',')[1],frontClosed:x.frontWall.visible,topClosed:x.lid.visible,drawCalls:g.renderer.info.render.calls,scale:g.world.root.scale.x};}''',aperture)
    image=base64.b64decode(result.pop('image'));assert len(image)>5000 and image.startswith(b'\x89PNG')
    assert not(result['frontClosed'] and result['topClosed'])
    assert result['frontClosed']==(aperture=='top') and result['topClosed']==(aperture=='front')
    assert result['drawCalls']>30 and result['scale']==1
    name='diorama-'+aperture+'-mock-eye.png';(OUT/name).write_bytes(image)
    captures.append({'aperture':aperture,'file':name,'sha256':hashlib.sha256(image).hexdigest(),**result})
   # A camera-facing closed panel is now automatically transparent.
   # Two presets may intentionally look identical from that viewpoint.
   assert len(captures)==3
   page.evaluate('__tidegate.xr.session.end()');assert page.evaluate('!__tidegate.xr.active&&!__tidegate.xr.stage.visible')
   assert not errors,errors
   (OUT/'render-review.json').write_text(json.dumps({'build':'tidegate-20260917.1','base':BASE,'captures':captures,'errors':errors,'physicalHardwareVerified':False,'limitations':'Actual production miniature renderer in software WebGL, with explicitly mocked XR session and chosen monocular eye poses. No DOM overlay in canvas images. Not real headset stereo, room anchoring, passthrough capture or human acceptance.'},indent=2))
   print('PASS: three actual miniature enclosure renders; simulation scale restored; no captured runtime/shader errors.',flush=True)
  finally:browser.close()
finally:
 if server:server.terminate()
