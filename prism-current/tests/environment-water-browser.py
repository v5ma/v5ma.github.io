"""Native production water acceptance. Requires a real served page and WebGL2.
No direct actor, score, clock, completion or wave-state assignments.
This suite is distinct from the blank-page Three object and Mesa shader fixtures.
"""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/environment-water';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[]
def check(ok,msg):
    assert ok,msg
    checks.append(msg);print('PASS',msg,flush=True)
with sync_playwright() as pw:
    launch={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
    if os.getenv('CHROMIUM_PATH'):launch['executable_path']=os.environ['CHROMIUM_PATH']
    b=pw.chromium.launch(**launch)
    def watch(p):
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
    try:
        c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
        p=c.new_page();p.set_default_timeout(45000);watch(p)
        p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("window.River?.snapshot().stats.water?.version==='0.1.0'")
        check(p.evaluate("River.snapshot().rotunda.open"),'The untouched entry retains the actual Rotunda')
        check(p.evaluate('River.snapshot().stats.water.renderTargets')==0,'New water owns no reflection render target or extra renderer')
        p.keyboard.press('F2');p.locator('#options summary').click()
        p.locator('#quality').select_option('light');p.wait_for_function("River.snapshot().stats.water.quality==='light'")
        p.locator('#quiet').check();p.wait_for_function('River.snapshot().stats.water.quiet')
        check(p.evaluate("AFRAME.scenes[0].object3D.getObjectByName('Currentworks Water / local-space surface').material.uniforms.time.value") == 0,'Quiet uses the actual frozen shader clock')
        p.locator('#quiet').uncheck();p.locator('#quality').select_option('balanced')
        p.locator('#play').click();p.wait_for_function("River.snapshot().phase==='playing'")
        p.mouse.move(640,500);p.mouse.down();p.evaluate((ROOT/'prism-current/tests/river-driver.js').read_text());p.evaluate('startRiverDriver()')
        p.wait_for_function('River.snapshot().stats.water.emitted>0',timeout=30000)
        check(p.evaluate('River.snapshot().stats.water.bodies')>0,'The running battle supplies real boat/catapult observations')
        check(p.evaluate('River.snapshot().stats.water.liveDisturbances')<=12,'Observed motion uses a bounded wake pool')
        p.keyboard.press('KeyP');p.wait_for_function("River.snapshot().phase==='paused'");p.mouse.up();p.wait_for_timeout(120)
        before=p.evaluate('River.snapshot()');p.wait_for_timeout(220);after=p.evaluate('River.snapshot()')
        check(before['time']==after['time'] and before['stats']['water']==after['stats']['water'],'Pausing freezes host-clock water and its effect history')
        p.locator('#resume').click();p.wait_for_function("River.snapshot().phase==='playing'");p.mouse.move(640,500);p.mouse.down()
        p.wait_for_function("['complete','failed','escaped'].includes(River.snapshot().phase)",timeout=115000)
        result=p.evaluate('River.snapshot().result');check(result['complete'],'Unchanged Duck Armada combat completes with the water adapter active')
        p.mouse.up();p.evaluate('stopRiverDriver()');p.locator('#results-back').click();p.locator('#space').click()
        p.wait_for_function('!River.snapshot().stats.water.visible');check(p.evaluate('River.snapshot().stats.water.liveDisturbances')==0,'Switching chapters hides water and clears obsolete effects')
        check(p.evaluate('AFRAME.scenes[0].renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),'All production shader programs report runnable')
        c.close()
        # A native-shaped emulated XR source list, not a physical Quest test.
        c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
        c.add_init_script((ROOT/'prism-current/tests/river-fake-xr.js').read_text()+'\n'+(ROOT/'prism-current/tests/river-strict-xr.js').read_text())
        p=c.new_page();watch(p);p.set_default_timeout(45000)
        p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2')
        p.wait_for_function('!document.getElementById("enter-ar").disabled');p.locator('#enter-ar').click()
        p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated&&River.snapshot().rotunda.progress>.99')
        def choose(index):
            target=p.evaluate('''i=>{const T=AFRAME.THREE,m=AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu');m.updateWorldMatrix(true,false);
              const r=i<8?{x:i%2?631:56,y:306+Math.floor(i/2)*122,w:513,h:90}:{x:32+(i-8)*292,y:209,w:268,h:63};
              return new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld).toArray();}''',index)
            p.evaluate('q=>TestXR.point("left",q)',target);p.wait_for_function('i=>River.snapshot().xrUI.hover[0]===i',arg=index)
            p.evaluate('TestXR.select("left",true)');p.wait_for_timeout(180);p.evaluate('TestXR.select("left",false)');p.wait_for_timeout(180)
        before=p.evaluate('River.snapshot().rotunda.preferences.opacity');choose(10);choose(4)
        p.wait_for_function('(v)=>River.snapshot().stats.water.opacity<v',arg=before)
        check(p.evaluate('River.snapshot().stats.water.opacity===River.snapshot().rotunda.preferences.opacity'),'The actual AR rotunda opacity control drives the new shader')
        check(p.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==0,'Water does not replace transparent AR compositor clear alpha')
        check(p.evaluate('River.snapshot().stats.water.xr') and p.evaluate('River.snapshot().stats.water.quality')!='cinematic','Stereo profile remains bounded without changing the XR UI')
        p.evaluate('TestXR.state.session.end()');p.wait_for_function('!River.snapshot().immersive');c.close()
        check(not errors,'No captured shader or script errors')
        (OUT/'native-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'result':result,'errors':errors,'scope':'Served game, actual WebGL shaders and input handlers; emulated XR and reduced software-rendered buffers, not physical device approval.'},indent=2))
    except Exception as e:
        try:state=p.evaluate('window.River?.snapshot()')
        except:state=None
        (OUT/'native-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2));raise
    finally:b.close()
