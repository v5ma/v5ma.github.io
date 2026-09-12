"""Production shaders and real inputs; matched full-resolution menus separately.
No replacement renderer, injected scores, clock changes or fabricated impacts.
"""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/prism-spectral';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[]
def check(ok,text):
 assert ok,text
 checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
 c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block');c.add_init_script(path=str(ROOT/'prism-current/tests/standard-pad.js'))
 p=c.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader Error' in m.text else None)
 def press(n):p.evaluate('(n)=>PrismTestPad.press(n)',n)
 def focus(id):
  for _ in range(50):
   if p.evaluate('(id)=>document.activeElement?.id===id',id):return
   press(13)
  raise AssertionError('Controller could not reach '+id)
 def status():return p.evaluate('Prism.component.art.spectral.status')
 try:
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.Prism?.snapshot().ready&&Prism.component.art.spectral.status.enabled');p.bring_to_front();p.keyboard.press('Shift')
  check(status()['theme']=='opal','Opal Aurora is the new default without starting gameplay')
  check(p.locator('#spectral-theme option').count()==4,'Three new looks and the original Jewelbox option are available')
  p.locator('#settings').locator('summary').click();focus('spectral-theme');press(15);p.wait_for_function("Prism.component.art.spectral.status.theme==='solar'")
  check(status()['enabled'],'Controller changes the atmosphere to Solar Silk')
  press(15);p.wait_for_function("Prism.component.art.spectral.status.theme==='abyss'");check(status()['enabled'],'Controller reaches Deep Current')
  focus('spectral-reactive');press(0);p.wait_for_function('!Prism.component.art.spectral.status.reactions');check(not status()['reactions'],'Controller disables hit reactions without leaving ambient art')
  press(0);p.reload(wait_until='domcontentloaded');p.wait_for_function("window.Prism?.snapshot().ready&&Prism.component.art.spectral.status.theme==='abyss'")
  check(p.locator('#spectral-theme').input_value()=='abyss','The chosen atmosphere survives reload')
  p.locator('#settings').locator('summary').click();p.locator('#spectral-theme').select_option('classic');p.wait_for_function('!Prism.component.art.spectral.status.enabled')
  check(p.evaluate('!Prism.component.art.spectral.group.visible'),'Classic disables the new planes rather than making them invisible but drawn')
  p.locator('#spectral-theme').select_option('opal');p.locator('#graphics-quality').select_option('light');p.wait_for_function('!Prism.component.art.spectral.status.enabled');check(not status()['enabled'],'Light graphics disables every new shader effect')
  p.locator('#graphics-quality').select_option('cinematic');p.locator('#quiet-effects').check();p.wait_for_function('Prism.component.art.spectral.status.enabled&&!Prism.component.art.spectral.status.motion');check(p.evaluate('Prism.component.art.spectral.uniforms.uTime.value')==0,'Quiet mode freezes spectral animation and disables impact ripples')
  p.locator('#quiet-effects').uncheck();p.locator('#effect-strength').evaluate('(e)=>{e.value=0;e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}');p.wait_for_function('!Prism.component.art.spectral.status.enabled');check(not status()['enabled'],'Zero effect strength returns to the original art')
  p.locator('#effect-strength').evaluate('(e)=>{e.value=72;e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));}');p.wait_for_function('Prism.component.art.spectral.status.enabled')
  before=p.evaluate('({g:AFRAME.scenes[0].renderer.info.memory.geometries,t:AFRAME.scenes[0].renderer.info.memory.textures})')
  for theme in ['solar','abyss','classic','opal','solar','opal']:
   p.locator('#spectral-theme').select_option(theme);p.wait_for_function('(s)=>Prism.component.art.spectral.status.theme===s',arg=theme)
  after=p.evaluate('({g:AFRAME.scenes[0].renderer.info.memory.geometries,t:AFRAME.scenes[0].renderer.info.memory.textures})')
  check(before==after,'Theme switching reuses geometry and textures instead of growing GPU resources')
  p.locator('#settings').locator('summary').click();p.locator('#input').select_option('keys');p.locator('#start').click();p.wait_for_function("Prism.snapshot().phase==='playing'")
  p.evaluate((ROOT/'prism-current/tests/input-driver.js').read_text());p.evaluate('PrismTestInput.keys()')
  p.wait_for_function('Prism.snapshot().state.hits>=1&&Prism.component.art.spectral.status.activeRipples>0',timeout=20000)
  check(status()['impacts']>0,'A real audio-timed keyboard hit creates floor interference')
  check(status()['activeRipples']<=6,'Hit feedback stays within the six-event pool')
  check(p.evaluate('Prism.component.art.notes.filter(o=>o.g.visible).every(o=>{const n=Prism.component.state.song.notes[o.id],v=PrismCore.position(n,Prism.component.state.time,Prism.component.state.reach);return o.g.position.toArray().every((x,i)=>Math.abs(x-v[i])<1e-8);})'),'Shader effects do not move the authored notes or their hit plane')
  p.keyboard.press('KeyP');p.wait_for_function("Prism.snapshot().phase==='paused'");t=p.evaluate('Prism.component.art.spectral.uniforms.uTime.value');p.wait_for_timeout(200)
  check(p.evaluate('Prism.component.art.spectral.uniforms.uTime.value')==t,'Pausing freezes the new decorative animation')
  p.screenshot(path=str(OUT/'hit-ripple-paused.png'));p.locator('#back').click();check(p.evaluate('Object.keys(Prism.snapshot().scoreRecords).length')==0,'Partial shader testing creates no completed-song records')
  check(p.evaluate('AFRAME.scenes[0].renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),'All compiled shader programs are runnable')
  # Separate matched full-resolution captures; no score or scene-state injection.
  vc=b.new_context(viewport={'width':1440,'height':1050},device_scale_factor=1,service_workers='block');v=vc.new_page();v.set_default_timeout(60000);v.on('pageerror',lambda e:errors.append(str(e)));v.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader Error' in m.text else None)
  v.goto(URL,wait_until='domcontentloaded');v.wait_for_function('window.Prism?.snapshot().ready&&Prism.component.art.graphics.materialsReady');v.locator('#settings').locator('summary').click()
  for theme in ['classic','opal','solar','abyss']:
   v.locator('#spectral-theme').select_option(theme);v.wait_for_function('(t)=>Prism.component.art.spectral.status.theme===t',arg=theme);v.evaluate('window.scrollTo(0,0)');v.wait_for_timeout(400);v.screenshot(path=str(OUT/(theme+'-1440.png')))
  v.set_viewport_size({'width':390,'height':844});check(not v.evaluate('document.documentElement.scrollWidth>innerWidth'),'New graphics controls fit a phone-width viewport');vc.close()
  # Explicitly emulated AR; never a claim about real passthrough hardware.
  xc=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125);xc.add_init_script(path=str(ROOT/'prism-current/tests/fake-xr.js'));x=xc.new_page();x.on('pageerror',lambda e:errors.append(str(e)))
  x.goto(URL,wait_until='domcontentloaded');x.wait_for_function('window.Prism?.snapshot().ready&&!document.getElementById("enter-ar").disabled');x.locator('#enter-ar').click();x.wait_for_function('Prism.snapshot().immersive&&Prism.snapshot().calibrated&&!Prism.component.art.spectral.status.enabled')
  check(x.evaluate('!Prism.component.art.studio.visible&&!Prism.component.art.spectral.group.visible'),'AR excludes all new background and floor layers')
  check(x.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==0,'The AR compositor retains transparent clear alpha')
  x.evaluate('TestXR.state.session.end()');x.wait_for_function('!Prism.snapshot().immersive&&Prism.component.art.spectral.status.enabled');check(True,'Leaving XR restores the selected desktop shader theme');xc.close()
  p.evaluate('window.released=0;for(const m of Prism.component.art.spectral.materials)m.addEventListener("dispose",()=>released++);Prism.component.art.spectral.dispose();Prism.component.art.spectral.dispose();');check(p.evaluate('released')==5,'Repeated cleanup releases each of the five materials once')
  check(not errors,'No uncaught JavaScript or shader errors')
  (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'resource_counts':after,'scope':'Production A-Frame/WebGL with original songs and real input handlers. Emulated controller/AR and one-eighth gameplay pixel ratio; four 1440x1050 actual-menu theme captures. No synthetic hits or clock writes. Not consumer GPU frame-rate, comfort or physical headset acceptance.'},indent=2))
 except Exception as e:
  (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':p.evaluate('window.Prism?.snapshot()'),'spectral':p.evaluate('window.Prism?.component.art.spectral.status'),'stall':p.evaluate('window.Prism?.component.lastStall||null')},indent=2));p.screenshot(path=str(OUT/'failure.png'));raise
 finally:b.close()
