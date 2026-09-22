"""Actual AR entry, scenery controls and a complete Easy battle through input.
The strict emulator has the existing small stereo framebuffer; no state writes.
A separate high-resolution rendered fixture is labelled, never called a Quest test.
"""
from pathlib import Path
import base64,json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/ar-tide';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[];result=None

def check(ok,text):
    assert ok,text
    checks.append(text);print('PASS',text,flush=True)

with sync_playwright() as pw:
    options={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
    if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**options)
    def watch(page):
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
    def capture_texture(name):
        data=p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("river-xr-menu").material.map.image.toDataURL()')
        (OUT/name).write_bytes(base64.b64decode(data.split(',')[1]))
    try:
        c=browser.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
        c.add_init_script((ROOT/'prism-current/tests/river-fake-xr.js').read_text()+'\n'+(ROOT/'prism-current/tests/river-strict-xr.js').read_text())
        c.add_init_script("if(!localStorage.getItem('prism-current.river.records.v1'))localStorage.setItem('prism-current.river.records.v1','{\"sentinel\":true}')")
        p=c.new_page();watch(p);p.set_default_timeout(45000)
        p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open&&River.snapshot().stats.arScenery')
        def snap():return p.evaluate('River.snapshot()')
        def frames():
            p.evaluate('async()=>{const s=TestXR.state.session;await new Promise((r,j)=>{const timeout=setTimeout(()=>j(Error("No XR frames")),5000);s.requestAnimationFrame(()=>s.requestAnimationFrame(()=>{clearTimeout(timeout);r();}));});}')
        def button(hand,i):
            p.evaluate('([h,i])=>TestXR.button(h,i,false)',[hand,i]);frames()
            p.evaluate('([h,i])=>TestXR.button(h,i,true)',[hand,i]);frames()
            p.evaluate('([h,i])=>TestXR.button(h,i,false)',[hand,i]);frames()
        def select(i):
            p.wait_for_function('River.snapshot().rotunda.open&&River.snapshot().rotunda.progress>=1')
            p.evaluate('TestXR.select("left",false)');frames();p.wait_for_timeout(140)
            p.evaluate('i=>{const T=AFRAME.THREE,m=AFRAME.scenes[0].object3D.getObjectByName("river-xr-menu"),r=RiverRotunda.RECTS[i];m.updateWorldMatrix(true,false);const q=new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld);TestXR.point("left",q.toArray());}',i)
            p.wait_for_function('i=>River.snapshot().xrUI.hover[0]===i',arg=i);frames();n=snap()['xrUI']['actions']
            p.evaluate('TestXR.select("left",true)');p.wait_for_function('n=>River.snapshot().xrUI.actions===n+1',arg=n)
            p.evaluate('TestXR.select("left",false)')
            if snap()['immersive']:frames()
        # Click the actual rendered Duck Armada AR card, not a hidden DOM control.
        p.wait_for_function('River.snapshot().rotunda.progress>=1&&!document.getElementById("enter-ar").disabled')
        xy=p.evaluate('()=>{const T=AFRAME.THREE,s=AFRAME.scenes[0],m=s.object3D.getObjectByName("river-xr-menu"),r=RiverRotunda.RECTS[0],box=document.getElementById("scene-wrap").getBoundingClientRect();m.updateWorldMatrix(true,false);const q=new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld).project(s.camera);return [box.x+(q.x*.5+.5)*box.width,box.y+(-q.y*.5+.5)*box.height];}')
        p.mouse.click(*xy);p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated&&River.snapshot().stats.arScenery.visible')
        check(snap()['difficulty']=='easy','Actual main-canvas AR card preserves the Easy default')
        check(p.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==0,'The new scenery does not replace transparent AR composition')
        a=snap()['stats']['arScenery']
        check(a['islands']['islands']==2 and a['clouds']['visibleClouds']==2,'Two compact islands and two cloud groups appear in the real AR game')
        check(a['trees']['lod'][0]==0 and a['clouds']['levels']==[2,2],'New AR trees and clouds respect their shared stereo detail limits')
        check(a['optics']['ar'] and a['optics']['extraTextures']==0,'Water optics is active without new sampling textures or reflection passes')
        check(not snap()['entities'] or not any(n['type']=='boss' for n in snap()['entities']),'Scenery does not introduce an early boss')
        select(11);select(7);p.wait_for_function('River.snapshot().rotunda.page==="scenery"')
        capture_texture('ar-scenery-menu.png')
        select(1);p.wait_for_function('!River.snapshot().stats.arScenery.visible')
        check(snap()['rotunda']['preferences']['arScenery']=='minimal','Point-and-trigger Minimal scenery actually hides the island composition')
        select(0);p.wait_for_function('River.snapshot().stats.arScenery.visible')
        check(snap()['rotunda']['preferences']['arScenery']=='islands','The same spatial controls restore islands without leaving AR')
        opacity=snap()['stats']['water']['opacity'];select(4);p.wait_for_function('v=>River.snapshot().stats.water.opacity<v',arg=opacity)
        check(snap()['rotunda']['preferences']['opacity']==snap()['stats']['water']['opacity'],'AR water opacity still drives the actual water uniform')
        select(12);check(snap()['rotunda']['preferences']['arScenery']=='islands','Reset placement preserves the selected AR scenery mode')
        scene_matrix=p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("prism-ar-archipelago").matrixWorld.toArray()')
        p.evaluate('TestXR.state.head[0]+=.3;TestXR.state.yaw+=.2');frames()
        check(p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("prism-ar-archipelago").matrixWorld.toArray()')==scene_matrix,'Head turns and sidesteps do not drag the islands or cloud group')
        select(8);p.evaluate('TestXR.away()');button('right',5)
        p.wait_for_function('River.snapshot().phase==="playing"&&River.snapshot().rotunda.healthGaugeVisible')
        check(snap()['stats']['arScenery']['prepared'],'New tree, cloud and material preparation completes before gameplay')
        check(snap()['result']['health']==100,'The running AR game starts with a visible HEALTH 100 gauge')
        p.add_script_tag(content=(ROOT/'prism-current/tests/playability-xr-driver.js').read_text());p.evaluate('observeFriendlyXR()')
        p.wait_for_function('River.snapshot().result.health<100',timeout=30000);damaged=snap()['result']['health']
        p.evaluate('startFriendlyXR("heal")');p.wait_for_function('River.snapshot().result.healed>0',timeout=10000);p.evaluate('stopFriendlyXR()')
        check(snap()['result']['health']>damaged,'An actual tracked laser heals actual damage while the islands are present')
        p.evaluate('startFriendlyXR("cut-block")');p.wait_for_function('River.snapshot().result.cutBlocks>0',timeout=22000);p.evaluate('stopFriendlyXR()')
        check(True,'The actual controller stroke still cuts incoming purple blocks')
        p.evaluate('TestXR.away()');button('right',5);p.wait_for_function('River.snapshot().phase==="paused"');before=snap()
        p.wait_for_timeout(240);after=snap()
        check(before['time']==after['time'] and before['stats']['arScenery']['clouds']['time']==after['stats']['arScenery']['clouds']['time'],'Pausing freezes the host and cloud animation clock')
        select(11);select(7);select(1);select(4)
        check(snap()['result']==before['result'] and snap()['time']==before['time'],'Changing scenery and opacity preserves the exact paused encounter')
        select(0);select(8);p.evaluate('TestXR.away()');button('right',5);p.wait_for_function('River.snapshot().phase==="playing"')
        p.evaluate('startFriendlyXR("boss")');p.wait_for_function('River.snapshot().entities.some(n=>n.type==="boss")',timeout=45000)
        check(not p.evaluate('friendlyXRObserved.earlyBoss'),'Admiral Quack still arrives only in the final phrase')
        p.wait_for_function('["complete","failed","escaped"].includes(River.snapshot().phase)',timeout=30000);p.evaluate('stopFriendlyXR();clearInterval(friendlyXRObserver)')
        result=snap()['result'];check(result['complete'] and result['bossDefeated'],'The full Easy AR battle clears through real hits, healing, blocks and a late boss')
        check(not p.evaluate('friendlyXRObserved.bolt'),'No old red missile is reintroduced')
        check(p.evaluate("localStorage.getItem('prism-current.river.records.v1')")=='{"sentinel":true}','Older saved River records remain untouched')
        p.screenshot(path=str(OUT/'ar-result.png'))
        select(8);select(1);p.wait_for_function('River.snapshot().chapter==="mothership"')
        check(not snap()['stats']['arScenery']['visible'],'Mothership does not inherit river islands or clouds')
        select(1);p.wait_for_function('River.snapshot().chapter==="duck-armada"')
        select(11);select(7);select(1);select(8);select(3);p.wait_for_function('!River.snapshot().immersive')
        p.reload(wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().rotunda?.open')
        check(snap()['rotunda']['preferences']['arScenery']=='minimal','The deliberate scenery preference survives XR exit and page reload')
        check(p.evaluate('AFRAME.scenes[0].renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),'All exercised game shaders report runnable')
        c.close()
        # Wider, ordinary-resolution view of the SAME AR scene via its existing
        # emulator. Only view framebuffer dimensions change for this capture.
        # It does not claim physical passthrough imagery or measured Quest speed.
        c=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,service_workers='block')
        fake=(ROOT/'prism-current/tests/river-fake-xr.js').read_text().replace('this.framebufferWidth=240;this.framebufferHeight=160','this.framebufferWidth=1200;this.framebufferHeight=800').replace("x:v.eye==='left'?0:120,y:0,width:120,height:160","x:v.eye==='left'?0:600,y:0,width:600,height:800")
        c.add_init_script(fake+'\n'+(ROOT/'prism-current/tests/river-strict-xr.js').read_text());p=c.new_page();watch(p);p.set_default_timeout(60000)
        p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2');p.wait_for_function('!document.getElementById("enter-ar").disabled');p.locator('#enter-ar').click()
        p.wait_for_function('River.snapshot().immersive&&River.snapshot().stats.arScenery.visible');p.wait_for_timeout(800)
        p.screenshot(path=str(OUT/'ar-islands-stereo-1200.png'))
        check(p.evaluate('River.snapshot().stats.arScenery.visible'),'Separate ordinary-resolution stereo scene capture retains AR islands')
        p.evaluate('TestXR.state.session.end()');p.wait_for_function('!River.snapshot().immersive');c.close()
        check(not errors,'No captured JavaScript or shader errors in the new AR path')
        (OUT/'native-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'result':result,'errors':errors,'scope':'Actual source/served AR canvas, input handlers and full Easy battle with strict emulated XR. Existing small gameplay framebuffer and a separate 1200x800 stereo scene capture. No game state writes or physical headset claim.'},indent=2))
    except Exception as e:
        try:state=p.evaluate('window.River?.snapshot()')
        except:state=None
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'result':result,'errors':errors,'state':state},indent=2))
        try:p.screenshot(path=str(OUT/'failure.png'))
        except:pass
        raise
    finally:browser.close()
