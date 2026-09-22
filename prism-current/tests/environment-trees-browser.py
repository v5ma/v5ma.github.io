"""Actual served Prism trees and separately labeled shader fixtures.
The main game is controlled only through inputs, not phase/score/actor writes.
"""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/environment-trees';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[]
def check(ok,message):
    assert ok,message
    checks.append(message);print('PASS',message,flush=True)
with sync_playwright() as pw:
    launch={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
    if os.getenv('CHROMIUM_PATH'):launch['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**launch)
    def watch(page):
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
    try:
        c=browser.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.25,service_workers='block');p=c.new_page();watch(p);p.set_default_timeout(45000)
        p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().stats.trees?.version==="0.1.3"&&River.snapshot().rotunda.open')
        p.evaluate("""()=>{const scene=AFRAME.scenes[0],renderer=scene.renderer,original=renderer.render,log=[];window.treeRenderObservations=log;
          renderer.render=function(){const begin=performance.now(),value=original.apply(this,arguments),elapsed=performance.now()-begin;
           if(elapsed>75){const game=scene.components['river-game'];log.push({renderMs:elapsed,phase:game.phase,time:game.state?.time||0,pointerHeld:!!game.mouse,calls:this.info.render.calls,triangles:this.info.render.triangles,programs:this.info.programs.length});if(log.length>64)log.shift();}return value;};}""")
        p.add_script_tag(content=(ROOT/'prism-current/tests/frame-trace.js').read_text());p.evaluate("window.frameTrace=RiverFrameTrace.install(AFRAME.scenes[0].components['river-game'])")
        check(p.evaluate('River.snapshot().stats.trees.trees')==8,'The ordinary Duck Armada entry contains exactly eight authored bank trees')
        check(p.evaluate('River.snapshot().stats.water.version==="0.1.0"&&River.snapshot().stats.fire.version==="0.1.3"'),'Existing water and fire implementations are retained')
        check(p.evaluate('River.snapshot().stats.trees.geometries===48&&River.snapshot().stats.trees.materials===2&&River.snapshot().stats.trees.textures===0'),'Tree resource counts are fixed before gameplay')
        p.wait_for_function('AFRAME.scenes[0].object3D.getObjectByName("Currentworks Trees").children.length===8')
        check(p.evaluate('''()=>{const s=AFRAME.scenes[0],g=s.object3D.getObjectByName('Currentworks Trees');let ok=true,count=0;g.traverseVisible(o=>{if(o.isMesh){const r=s.renderer.properties.get(o.material).currentProgram;ok=ok&&!!r&&(!r.diagnostics||r.diagnostics.runnable!==false);count++;}});return ok&&count===16;}'''),'Actual standard-material wind shaders compile in the served scene')
        p.keyboard.press('F2');p.locator('#options summary').click();p.locator('#quality').select_option('light');p.wait_for_function('River.snapshot().stats.trees.lod[0]===0')
        check(p.evaluate('River.snapshot().stats.trees.triangles')<18000,'Light quality uses the bounded lower-detail forest')
        p.locator('#quiet').check();p.wait_for_function('River.snapshot().stats.trees.quiet');check(p.evaluate('River.snapshot().stats.trees.quiet'),'The existing quiet control applies to foliage too')
        p.locator('#quiet').uncheck();p.locator('#quality').select_option('balanced');p.locator('#play').click();p.wait_for_function('River.snapshot().phase==="playing"')
        check(p.evaluate('River.snapshot().stats.trees.prepared&&River.snapshot().stats.trees.warmupDraws===1'),'Tree detail geometry is drawn in loading before soundtrack playback')
        p.mouse.move(640,500);p.mouse.down();p.evaluate((ROOT/'prism-current/tests/river-driver.js').read_text());p.evaluate('startRiverDriver()')
        p.wait_for_function('River.snapshot().result.slices>0&&River.snapshot().stats.fire.emitted>0',timeout=35000)
        check(p.evaluate('River.snapshot().phase')=='playing','Slicing and destruction continue with trees, water and fire active together')
        p.keyboard.press('KeyP');p.wait_for_function('River.snapshot().phase==="paused"');p.mouse.up();p.evaluate('stopRiverDriver()');p.wait_for_timeout(150)
        before=p.evaluate('River.snapshot()');p.wait_for_timeout(220);after=p.evaluate('River.snapshot()')
        check(before['time']==after['time'] and before['result']==after['result'] and before['stats']['trees']['time']==after['stats']['trees']['time'],'Pausing freezes wind and keeps the exact battle state')
        check(after['stats']['trees']['geometries']==48,'Combat and pause allocate no new tree geometry')
        p.locator('#back').click();p.locator('#space').click();p.wait_for_function('!River.snapshot().stats.trees.visible')
        check(p.evaluate('River.snapshot().stats.trees.drawCalls')==0,'Mothership does not inherit riverbank vegetation')
        p.locator('#duck').click();p.wait_for_function('River.snapshot().stats.trees.visible');c.close()
        # Native-shaped XR source lists, but not physical headset measurements.
        for mode in ['ar','vr']:
            c=browser.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
            c.add_init_script((ROOT/'prism-current/tests/river-fake-xr.js').read_text()+'\n'+(ROOT/'prism-current/tests/river-strict-xr.js').read_text())
            p=c.new_page();watch(p);p.set_default_timeout(45000);p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2')
            p.wait_for_function('!document.getElementById("enter-'+mode+'").disabled');p.locator('#enter-'+mode).click();p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated')
            if mode=='ar':
                p.wait_for_function('!River.snapshot().stats.trees.visible')
                check(p.evaluate('River.snapshot().stats.trees.drawCalls===0&&AFRAME.scenes[0].renderer.getClearAlpha()===0'),'AR keeps the real room free of opaque tree scenery')
            else:
                p.wait_for_function('River.snapshot().stats.trees.visible&&River.snapshot().stats.trees.xr')
                check(p.evaluate('River.snapshot().stats.trees.lod[0]===0'),'VR retains the bank trees with the stereo detail cap')
            p.wait_for_function('River.snapshot().rotunda.progress>=1')
            matrix=p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("Currentworks Trees").matrixWorld.toArray()')
            p.evaluate('TestXR.state.yaw+=.25;TestXR.state.head[0]+=.2');p.wait_for_timeout(180)
            check(p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("Currentworks Trees").matrixWorld.toArray()')==matrix,mode+': head motion does not drag or tilt the tree scenery')
            p.evaluate('TestXR.state.session.end()');p.wait_for_function('!River.snapshot().immersive');p.wait_for_function('River.snapshot().stats.trees.visible')
            check(p.evaluate('River.snapshot().stats.trees.geometries')==48,mode+': leaving XR restores the same forest without rebuilding it');c.close()
        # Actual full-resolution MAIN entry, not a substitution for a gameplay frame.
        c=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,service_workers='block');p=c.new_page();watch(p);p.set_default_timeout(60000)
        p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().stats.trees?.visible');p.wait_for_timeout(800);p.screenshot(path=str(OUT/'prism-trees-entry-1440.png'));c.close()
        # Isolated reusable-module fixture. No gameplay state exists in this page.
        c=browser.new_context(viewport={'width':1100,'height':760},device_scale_factor=1);p=c.new_page();watch(p);p.goto('about:blank')
        for name in ['vendor/aframe-1.8.0.min.js','modules/environment/trees.js']:p.add_script_tag(content=(ROOT/'prism-current'/name).read_text())
        p.evaluate('''()=>{const T=AFRAME.THREE,renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,760);renderer.setClearColor(0xb8d4db,1);document.body.style.margin=0;document.body.append(renderer.domElement);
        const scene=new T.Scene(),camera=new T.PerspectiveCamera(47,1100/760,.05,100);camera.position.set(8.5,5.7,13);camera.lookAt(0,2,-1);
        scene.add(new T.HemisphereLight(0xdbf0fc,0x3c4330,2));const sun=new T.DirectionalLight(0xffe6bf,2.4);sun.position.set(-4,8,5);scene.add(sun);
        const floor=new T.Mesh(new T.PlaneGeometry(25,25),new T.MeshStandardMaterial({color:0x727861,roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);
        const trees=SVGNTrees.create(T,{trees:[{id:'palm',seed:137,height:4,position:[-4,0,0],preset:'palm'},{id:'alder',seed:557,height:4.2,position:[0,0,0],preset:'alder'},{id:'willow',seed:881,height:4.4,position:[4,0,0],preset:'willow'}]});scene.add(trees.group);window.fixture={renderer,scene,camera,trees};}''')
        for name,time,quality in [('near',0,'cinematic'),('wind',2,'cinematic'),('light',2,'light'),('quiet',2,'balanced')]:
            p.evaluate('''([name,time,quality])=>{const f=fixture;f.trees.update({time,quality,quiet:name==='quiet',viewer:[0,2,0]});f.renderer.render(f.scene,f.camera);}''',[name,time,quality])
            p.screenshot(path=str(OUT/('fixture-trees-'+name+'.png')))
            check(p.evaluate('fixture.renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),name+': isolated three-preset fixture renders with actual WebGL')
        p.evaluate('fixture.trees.dispose();fixture.renderer.dispose()');c.close()
        check(not errors,'No captured tree shader or JavaScript errors')
        (OUT/'native-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Served game entry, ordinary combat input, quiet/pause, AR/VR visibility and independent Three shader fixtures. Reduced software game buffers and separate full-resolution views. Not physical Quest/Xbox or sustained performance approval.'},indent=2))
    except Exception as e:
        try:state=p.evaluate('window.River?.snapshot()')
        except:state=None
        try:render_trace=p.evaluate('window.treeRenderObservations||[]')
        except:render_trace=[]
        try:frame_trace=p.evaluate('window.frameTrace?.snapshot()||null')
        except:frame_trace=None
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state,'slowRenders':render_trace,'frameTrace':frame_trace},indent=2))
        try:p.screenshot(path=str(OUT/'failure.png'))
        except:pass
        raise
    finally:browser.close()
