"""Matched full-resolution art review and small-buffer gameplay observation.
No actor/score/clock assignments. Old renderer is fetched at the immutable base.
"""
from pathlib import Path
from urllib.parse import urlparse
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/');OUT=ROOT/'test-output/prism-jewels';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(ok,label):
 assert ok,label
 checks.append(label);print('PASS:',label,flush=True)
def ready(p):p.wait_for_function('window.Prism?.snapshot().ready&&AFRAME.scenes[0].renderer.info.render.calls>0')
with sync_playwright() as pw:
 opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=pw.chromium.launch(**opts);c=b.new_context(viewport={'width':1440,'height':1050},device_scale_factor=1,service_workers='block');host=urlparse(BASE).hostname
 c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('blob:','data:')) else r.abort())
 p=c.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
 try:
  p.goto(BASE+'/test-baseline/prism-current/',wait_until='domcontentloaded');ready(p);p.screenshot(path=str(OUT/'before-studio.png'))
  p.goto(BASE+'/prism-current/',wait_until='domcontentloaded');ready(p);p.wait_for_function('Prism.component.art.graphics.materialsReady')
  check(p.evaluate('PrismCore.VERSION')==json.loads((ROOT/'prism-current/release.json').read_text())['version'],'The declared scoring release loads with the Jewelbox renderer')
  check(p.evaluate('Prism.component.art.fx.physical.every(m=>m.envMap&&m.transmission>0&&m.clearcoat===1)'),'Cinematic crystal uses real PMREM reflection, transmission and clearcoat')
  p.wait_for_timeout(500);p.screenshot(path=str(OUT/'after-studio.png'))
  check(p.evaluate('Prism.component.art.fx.physical.every(m=>m.dispersion>0&&m.iridescence>0)'),'Spectral dispersion and thin-film iridescence are enabled on the optical materials')
  check(p.evaluate('Prism.component.art.fx.gold.metalness===1&&Prism.component.art.fx.silver.envMap!==null'),'Precious-metal surfaces actually receive a reflection environment')
  p.locator('#settings').evaluate('(e)=>e.open=true');p.locator('#graphics-quality').select_option('light');p.wait_for_function('Prism.component.art.graphics.profile==="light"')
  check(p.evaluate('Prism.component.art.notes.filter(n=>n.g.visible).every(n=>n.body.material.isShaderMaterial&&!n.halo.visible)'),'Light profile removes optical transmission and note halos')
  p.locator('#quiet-effects').check();p.locator('#graphics-quality').select_option('balanced');p.locator('#effect-strength').evaluate('(e)=>{e.value=45;e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}');p.wait_for_function('Prism.component.art.fx.state.reduced')
  check(p.evaluate('Prism.component.art.notes.filter(n=>n.g.visible).every(n=>!n.sparks.visible)'),'Quiet effects removes decorative twinkle while notes remain visible')
  p.reload(wait_until='domcontentloaded');ready(p);p.wait_for_function('Prism.component.art.graphics.materialsReady')
  check(p.locator('#graphics-quality').input_value()=='balanced' and p.locator('#quiet-effects').is_checked(),'Graphics preferences survive reload without changing the score namespace')
  p.locator('#settings').evaluate('(e)=>e.open=true');p.locator('#graphics-quality').select_option('cinematic');p.locator('#quiet-effects').uncheck();p.locator('#effect-strength').evaluate('(e)=>{e.value=72;e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}');p.locator('#settings').evaluate('(e)=>e.open=false')
  p.set_viewport_size({'width':200,'height':150});p.locator('#input').select_option('keys');p.locator('#start').click();p.wait_for_function('Prism.snapshot().phase==="playing"');p.wait_for_function('Prism.snapshot().time>5')
  p.screenshot(path=str(OUT/'jewels-in-play.png'));p.keyboard.press('KeyP');p.wait_for_function('Prism.snapshot().phase==="paused"');p.locator('#back').click();p.set_viewport_size({'width':1440,'height':1050})
  check(p.evaluate('Object.keys(Prism.snapshot().scoreRecords).length')==0,'Graphics review and aborted play do not create finished score records')
  count=p.evaluate('(()=>{const a=new Set();AFRAME.scenes[0].object3D.traverse(o=>{if(o.geometry)a.add(o.geometry)});return a.size})()')
  for mode in ['light','cinematic','balanced','cinematic']:
   p.locator('#settings').evaluate('(e)=>e.open=true');p.locator('#graphics-quality').select_option(mode);p.wait_for_function('(m)=>Prism.component.art.graphics.profile===m',arg=mode)
  check(p.evaluate('(()=>{const a=new Set();AFRAME.scenes[0].object3D.traverse(o=>{if(o.geometry)a.add(o.geometry)});return a.size})()')==count,'Quality changes reuse geometry rather than accumulating new scenes')
  p.set_viewport_size({'width':390,'height':844});p.screenshot(path=str(OUT/'mobile-graphics.png'));check(not p.evaluate('document.documentElement.scrollWidth>innerWidth'),'The graphics controls fit a phone-width screen')
  check(p.evaluate('AFRAME.scenes[0].renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),'All compiled shader programs are runnable')
  check(not errors,'No uncaught JavaScript errors or reported WebGL shader failures')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'graphics':p.evaluate('Prism.component.art.graphics'),'renderer':p.evaluate('({three:AFRAME.THREE.REVISION,calls:AFRAME.scenes[0].renderer.info.render.calls,triangles:AFRAME.scenes[0].renderer.info.render.triangles,textures:AFRAME.scenes[0].renderer.info.memory.textures,geometries:AFRAME.scenes[0].renderer.info.memory.geometries})'),'scope':'Actual HTTP A-Frame / software WebGL; full-resolution 1440x1050 before/after menus; 200x150 ordinary running-play observation with Cinematic materials unchanged. Small active drawing buffer makes CPU rendering tractable. No consumer GPU or headset frame-rate claim.'},indent=2))
 except Exception as e:
  try:state=p.evaluate('({state:window.Prism?.snapshot(),graphics:window.Prism?.component.art.graphics,stall:window.Prism?.component.lastStall})')
  except:state={}
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2))
  try:p.screenshot(path=str(OUT/'failure.png'))
  except:pass
  raise
 finally:c.close();b.close()
