"""Jewelglass native renderer verification. No simulation assignments.
Settings, ordinary keys and controller-device emulation are the only inputs.
Frames are actual A-Frame WebGL output, not offline or generated concept art.
"""
import os,json,math
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];MODE=os.getenv('JEWEL_SUITE','visual');OUT=ROOT/'test-output'/('jewelglass-'+MODE);OUT.mkdir(parents=True,exist_ok=True);BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');checks=[];errors=[];shader_errors=[]
def check(ok,name):
 assert ok,name
 checks.append(name);print('PASS',name,flush=True)
def aim(p,yaw,pitch=0):
 # Long camera moves use a smaller ordinary browser viewport, then restore the
 # full capture viewport. Rendering, input handlers and simulation remain live.
 viewport=p.viewport_size
 p.set_viewport_size({'width':480,'height':360})
 try:
  p.evaluate("""async ({yaw,pitch})=>{const canvas=AFRAME.scenes[0].canvas,held=new Set();const key=(k,v)=>{if(held.has(k)===v)return;canvas.dispatchEvent(new KeyboardEvent(v?'keydown':'keyup',{code:k,bubbles:true}));v?held.add(k):held.delete(k);};await new Promise((resolve,reject)=>{const start=performance.now(),timer=setInterval(()=>{const c=Vesperfall.component,a=Math.atan2(Math.sin(yaw-c.yaw),Math.cos(yaw-c.yaw)),b=pitch-c.pitch;key('ArrowLeft',a>.02);key('ArrowRight',a<-.02);key('ArrowUp',b>.02);key('ArrowDown',b<-.02);if((Math.abs(a)<.03&&Math.abs(b)<.03)||performance.now()-start>90000){for(const k of [...held])key(k,false);clearInterval(timer);Math.abs(a)<.03&&Math.abs(b)<.03?resolve():reject(Error('aim timeout '+JSON.stringify({yaw:c.yaw,pitch:c.pitch,time:Vesperfall.state.time})));}},3);});}""",{'yaw':yaw,'pitch':pitch})
 finally:p.set_viewport_size(viewport)
def options(p,mode=None,reduced=None,effects=None):
 if not p.evaluate('Vesperfall.component.paused'):p.locator('#menu-button').click()
 p.locator('#jewel-settings').evaluate('(e)=>e.open=true')
 if mode is not None:p.locator('#jewel-quality').select_option(mode)
 if reduced is not None:p.locator('#jewel-reduced').set_checked(reduced)
 if effects is not None:p.locator('#jewel-effects').set_checked(effects)
 p.locator('#resume').click();p.locator('a-scene canvas').focus()
with sync_playwright() as pw:
 launch={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):launch['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**launch);ctx=b.new_context(viewport={'width':1120,'height':800} if MODE=='visual' else {'width':800,'height':600},service_workers='block');host=urlparse(BASE).hostname
 ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 if MODE=='xr':ctx.add_init_script((ROOT/'vesperfall/tests/fake-xr.js').read_text())
 p=ctx.new_page();p.set_default_timeout(90000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda e:shader_errors.append(e.text) if e.type=='error' and ('Shader' in e.text or 'VALIDATE' in e.text or 'WebGL' in e.text) else None)
 try:
  p.goto(BASE+'/vesperfall/',wait_until='domcontentloaded');p.wait_for_function('window.Vesperfall?.component.jewelglass&&Vesperfall.component.rendererReady&&Vesperfall.component.art.cathedralStatus.sculptures===1')
  check(p.evaluate('Vesperfall.component.jewelglass.errors.length===0'),'Both local HDR lighting probes were generated without error')
  p.locator('#practice').click();p.wait_for_function('Vesperfall.component.running&&!Vesperfall.component.paused');p.locator('a-scene canvas').focus();profile=p.evaluate('JSON.stringify(Vesperfall.component.profile)')
  if MODE=='visual':
   options(p,'classic');p.wait_for_timeout(300);p.screenshot(path=str(OUT/'before-materials.png'))
   options(p,'jewel');p.wait_for_timeout(800);p.screenshot(path=str(OUT/'after-jewelglass.png'))
   check(p.evaluate('Vesperfall.component.jewelglass.heroGlass.transmission>.8&&Vesperfall.component.jewelglass.heroGlass.dispersion>0'),'Jewel quality enables actual physical transmission and dispersion, not opacity-only labeling')
   check(p.evaluate('Vesperfall.component.jewelglass.gold.envMap.isTexture&&Vesperfall.component.jewelglass.gold.metalness>.9'),'Metals use a prefiltered reflection environment')
   check(p.evaluate('Vesperfall.component.jewelglass.stats.probes===2'),'Environment generation is cached, not repeated every frame')
   check(p.evaluate('AFRAME.scenes[0].renderer.transmissionResolutionScale===.5'),'Optical transmission uses a half-resolution background pass')
   check(p.evaluate('Vesperfall.component.jewelglass.instanceBatches.length<=6'),'Suspended ornaments share at most six instanced draws')
   # Precise vertex bounds, not the enlarged rotated local bounding-box corners.
   clearance=p.evaluate('(()=>{const j=Vesperfall.component.jewelglass;j.center.updateWorldMatrix(true,true);return new AFRAME.THREE.Box3().setFromObject(j.center,true).min.y;})()')
   check(clearance>5.4,f'Suspended crystal clears gallery headroom: lowest visible vertex {clearance:.3f}m')
   aim(p,0,.26);p.wait_for_timeout(400);p.screenshot(path=str(OUT/'cut-crystal-and-glass.png'))
   p.keyboard.down('KeyH');p.wait_for_function('Vesperfall.state.shield&&Vesperfall.component.arsenal.shield.visible');p.wait_for_timeout(300);p.screenshot(path=str(OUT/'interference-wardglass.png'));p.keyboard.up('KeyH');p.wait_for_function('!Vesperfall.state.shield')
   check(p.evaluate('Vesperfall.component.arsenal.shield.children[0].material.isShaderMaterial'),'The defensive shield uses the custom iridescent surface shader')
   p.keyboard.press('KeyV');p.wait_for_function('Vesperfall.state.weapon==="crossbow"');p.screenshot(path=str(OUT/'lacquer-metal-crossbow.png'))
   aim(p,-1.87,0);p.screenshot(path=str(OUT/'stone-remains-stone.png'))
   options(p,'balanced',True);check(p.evaluate('!Vesperfall.component.jewelglass.particles.visible&&!Vesperfall.component.jewelglass.current.shafts'),'Reduced effects suppress sparkle and light shafts')
   options(p,'balanced',False);p.keyboard.press('KeyP');p.wait_for_function('Vesperfall.component.paused');p.set_viewport_size({'width':390,'height':844});p.screenshot(path=str(OUT/'mobile-settings.png'));check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'Material controls fit the narrow menu')
   p.reload(wait_until='domcontentloaded');p.wait_for_function('Vesperfall.component.jewelglass');check(p.evaluate('Vesperfall.component.jewelglass.options.mode==="balanced"&&!Vesperfall.component.jewelglass.options.reduced'),'Graphics options persist separately from progression')
  elif MODE=='effects':
   options(p,'balanced');n=p.evaluate('Vesperfall.state.shots');p.keyboard.press('Digit2');p.keyboard.down('Space');p.wait_for_function('Vesperfall.component.charge>.5');p.keyboard.up('Space');p.wait_for_function('(n)=>Vesperfall.state.shots>n',arg=n);p.wait_for_function('Vesperfall.component.jewelglass.stats.bursts>0');check(True,'Real fired Cinder arrows drive the bounded trail pool')
   p.wait_for_function('Vesperfall.state.events.some(e=>e.type==="explosion")');check(True,'Existing impact/explosion events remain physical simulation outcomes')
   p.screenshot(path=str(OUT/'spell-impact.png'))
   for mode in ['jewel','classic','balanced','jewel','balanced']:options(p,mode)
   before=p.evaluate('Vesperfall.component.jewelglass.resources.size')
   for _ in range(3):p.keyboard.press('KeyP');p.wait_for_function('Vesperfall.component.paused');p.locator('#practice').click();p.wait_for_function('!Vesperfall.component.paused&&Vesperfall.component.worldArt.group.userData.loadedSculptures>0')
   after=p.evaluate('Vesperfall.component.jewelglass.resources.size');check(after==before,'Repeated sector rebuilds do not accumulate Jewelglass resources')
   check(p.evaluate('Vesperfall.component.jewelglass.particles.geometry.attributes.position.count===256'),'The sparkle buffer remains capped at 256 vertices')
   check(p.evaluate('JSON.stringify(Vesperfall.component.profile)')==profile,'Materials and practice effects do not change permanent records')
   options(p,'classic');check(p.evaluate('!Vesperfall.component.jewelglass.root.visible&&!Vesperfall.component.jewelglass.bow.visible'),'Classic restores the previous art without reloading or changing the run')
  else:
   options(p,'jewel');p.locator('#vr-button').click();p.wait_for_function('Vesperfall.component.xr&&Object.keys(Vesperfall.component.hands).length===2')
   check(p.evaluate('Vesperfall.component.jewelglass.heroGlass.transmission===0&&Vesperfall.component.jewelglass.heroGlass.dispersion===0'),'Immersive mode removes screen-space transmission and dispersion')
   p.evaluate("TestXR.pose('right',[.1,1.9,-.4])");p.wait_for_function('Vesperfall.component.menuSelection===0');p.evaluate("TestXR.button('right',0,true)");p.wait_for_function('!Vesperfall.component.paused');p.evaluate("TestXR.button('right',0,false);TestXR.pose('right',[.23,1.35,-.4])")
   p.evaluate("TestXR.button('left',1,true)");p.wait_for_function('Vesperfall.state.shield&&Vesperfall.component.arsenal.shield.visible');p.screenshot(path=str(OUT/'stereo-wardglass.png'));check(p.evaluate('Vesperfall.component.jewelglass.current.particles===96'),'XR effects use the smaller bounded pool')
   p.evaluate("TestXR.missing('left',true)");p.wait_for_function('!Vesperfall.state.shield');check(True,'The shader cannot leave invisible protection after tracking loss')
   p.evaluate("TestXR.state.session.end()");p.wait_for_function('!Vesperfall.component.xr');p.wait_for_function('Vesperfall.component.jewelglass.heroGlass.transmission>.8');check(True,'Leaving XR restores the selected desktop optical-material profile')
   check(p.evaluate('JSON.stringify(Vesperfall.component.profile)')==profile,'Immersive material transitions leave progression unchanged')
  check(not errors and not shader_errors,'No uncaught runtime or WebGL shader compile errors in the exercised renderer')
  g=p.evaluate('(()=>{const j=Vesperfall.component.jewelglass,r=AFRAME.scenes[0].renderer;return {policy:j.current,stats:j.stats,resources:j.resources.size,errors:j.errors,render:r.info.render,memory:r.info.memory,revision:AFRAME.THREE.REVISION};})()')
  (OUT/'report.json').write_text(json.dumps({'suite':MODE,'checks':checks,'passed':len(checks),'errors':errors,'shaderErrors':shader_errors,'graphics':g,'scope':'Native HTTP A-Frame software WebGL. Actual controls/events; no simulation state writes. Long visual camera moves resize to 480x360, then restore 1120x800 for captures; this is not a performance benchmark. XR emulates devices and is not physical-headset performance or comfort certification.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors,'shaderErrors':shader_errors,'checks':checks},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:ctx.close();b.close()
