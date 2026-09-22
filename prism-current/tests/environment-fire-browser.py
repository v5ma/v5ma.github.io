"""Served-game fire acceptance via ordinary input; no game-state assignments.
A separate isolated rendered fixture tests the reusable jet/impact APIs. That
fixture is not a gameplay screenshot or evidence of a new Prism flamethrower.
"""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/environment-fire';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[]
def check(ok,text):
    assert ok,text
    checks.append(text);print('PASS',text,flush=True)
with sync_playwright() as pw:
    opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
    if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**opts)
    def watch(page):
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
    try:
        c=browser.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.25,service_workers='block');p=c.new_page();watch(p);p.set_default_timeout(45000)
        p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready&&River.snapshot().stats.fire?.version==="0.1.3"')
        check(p.evaluate('River.snapshot().stats.water.version')=='0.1.0','Main game retains the actual reusable water module')
        check(p.evaluate('River.snapshot().rotunda.open'),'Main in-canvas interface is still the ordinary entry')
        check(p.evaluate('AFRAME.scenes[0].systems.renderer.data.sortTransparentObjects'),'Transparent effects use the real A-Frame sorting setting')
        p.keyboard.press('F2');p.locator('#play').click();p.wait_for_function('River.snapshot().phase==="playing"')
        check(p.evaluate('AFRAME.scenes[0].renderer.info.programs.some(p=>p.name==="Currentworks Fire 0.1.3")'),'Host loading precompiles fire before the first destruction')
        check(p.evaluate('River.snapshot().stats.fire.warmupDraws')==1,'Actual density, geometry and draw preparation completes before audio')
        check(p.evaluate('River.snapshot().stats.fire.emitted')==0,'Loading warmup never creates a gameplay fire event')
        p.evaluate("()=>{const s=AFRAME.scenes[0],m=s.object3D.getObjectByName('Currentworks flame 0');window.firePreparedKey=s.renderer.properties.get(m.material).currentProgram.cacheKey;}")
        p.mouse.move(640,500);p.mouse.down();p.evaluate((ROOT/'prism-current/tests/river-driver.js').read_text());p.evaluate('startRiverDriver()')
        p.wait_for_function('River.snapshot().stats.fire.activeVolumes>0&&River.snapshot().stats.fire.emitted>0',timeout=35000)
        check(p.evaluate('River.snapshot().stats.fire.prepared'),'Density texture and fire programs were prepared before gameplay')
        check(p.evaluate("(()=>{const s=AFRAME.scenes[0],m=s.object3D.getObjectByName('Currentworks flame 0');return s.renderer.properties.get(m.material).currentProgram.cacheKey===window.firePreparedKey;})()"),'The first visible burst uses the same shader variant exercised during loading')
        check(p.evaluate('River.snapshot().phase')=='playing','First destruction did not trigger a rendering-stall pause')
        check(p.evaluate('River.snapshot().result.shotHits')>0,'Normal laser hits produce actual destruction feedback')
        p.keyboard.press('KeyP');p.wait_for_function('River.snapshot().phase==="paused"');p.mouse.up();p.wait_for_timeout(150)
        before=p.evaluate('River.snapshot()');p.wait_for_timeout(350);after=p.evaluate('River.snapshot()')
        check(before['stats']['fire']==after['stats']['fire'] and before['time']==after['time'] and before['result']==after['result'],'Pause freezes fire, water and the exact encounter state')
        check(after['stats']['fire']['activeVolumes']<=3 and after['stats']['fire']['activeSparks']<=64,'Actual battle stays within the Balanced effect budget')
        p.screenshot(path=str(OUT/'game-paused-fire.png'))
        p.locator('#resume').click();p.wait_for_function('River.snapshot().phase==="playing"');p.mouse.move(640,500);p.mouse.down()
        # Easy keeps enemies alive longer and schedules fewer of them. Require the
        # same three real destructions across its actual wave spacing, without
        # accelerating the soundtrack or changing the selected difficulty.
        p.wait_for_function('River.snapshot().stats.fire.emitted>=3',timeout=45000)
        check(p.evaluate('River.snapshot().stats.fire.emitters')==0,'No unrequested flamethrower is introduced into saber gameplay')
        p.keyboard.press('KeyP');p.wait_for_function('River.snapshot().phase==="paused"');p.mouse.up();p.evaluate('stopRiverDriver()')
        p.locator('#back').click();p.wait_for_function('River.snapshot().phase==="menu"&&River.snapshot().stats.fire.activeVolumes===0')
        check(p.evaluate('River.snapshot().stats.fire.emitted')==0,'Abandoning a run clears its visual event history')
        p.locator('#options summary').click();p.locator('#quiet').check();p.locator('#play').click();p.wait_for_function('River.snapshot().phase==="playing"')
        p.mouse.move(640,500);p.mouse.down();p.evaluate('startRiverDriver()');p.wait_for_function('River.snapshot().stats.fire.emitted>0',timeout=35000)
        check(p.evaluate('River.snapshot().stats.fire.quiet&&River.snapshot().stats.fire.activeSparks===0&&River.snapshot().stats.fire.lights===0'),'Existing quiet control suppresses sparks and flashing lights in actual gameplay')
        p.evaluate('stopRiverDriver()');p.mouse.up();p.keyboard.press('KeyP');p.wait_for_function('River.snapshot().phase==="paused"')
        p.locator('#back').click();p.locator('#space').click();p.wait_for_function('River.snapshot().chapter==="mothership"')
        check(p.evaluate('River.snapshot().stats.fire.activeVolumes')==0,'Chapter selection cannot resurrect a previous explosion')
        check(p.evaluate('AFRAME.scenes[0].renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),'All programs exercised by main-game effects are runnable')
        c.close()
        # Explicit shader fixture: only the reusable effect, its own test renderer,
        # and authored test objects. Host input/score/physics are not present here.
        c=browser.new_context(viewport={'width':960,'height':640},device_scale_factor=1);p=c.new_page();watch(p)
        p.goto('about:blank')
        for name in ['vendor/aframe-1.8.0.min.js','modules/environment/fire.js']:
            p.add_script_tag(content=(ROOT/'prism-current'/name).read_text())
        p.evaluate('''()=>{const T=AFRAME.THREE;const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setSize(960,640);renderer.setClearColor(0x18212b,1);document.body.style.margin='0';document.body.appendChild(renderer.domElement);
        const scene=new T.Scene(),camera=new T.PerspectiveCamera(60,1.5,.05,50);camera.position.set(2,1.7,3);camera.lookAt(0,1,-2);scene.add(new T.HemisphereLight(0xb5dbff,0x253521,1.5));
        const ground=new T.Mesh(new T.PlaneGeometry(15,15),new T.MeshStandardMaterial({color:0x253342,roughness:.65}));ground.rotation.x=-Math.PI/2;scene.add(ground);
        const fire=SVGNFire.create(T,{quality:'cinematic'});scene.add(fire.group);window.fixture={T,scene,camera,renderer,fire};}''')
        p.evaluate('async()=>{const f=fixture;await f.fire.prepare(f.renderer,f.camera,f.scene)}')
        check(p.evaluate('fixture.fire.stats.prepared'),'Standalone host can prepare all effect programs explicitly')
        for mode,age in [('burst',.25),('burst-smoke',1.12),('jet',.5),('impact',.35),('quiet',.3)]:
            p.evaluate('''([mode,age])=>{const {fire,renderer,scene,camera}=fixture;fire.reset();fire.update({time:0,quiet:mode==='quiet'});
             if(mode==='jet')fire.emitter('jet',{position:[-1.5,1,-3],direction:[1,.05,0],length:3,radius:.8});
             else fire.emit({id:1,position:[0,1,-3],radius:1,mode:mode==='impact'?'impact':'burst',direction:[0,0,1]});
             for(let t=.025;t<=age+.0001;t+=.025){fire.update({time:t});if(mode==='jet')fire.emitter('jet',{position:[-1.5,1,-3],direction:[1,.05,0],length:3,radius:.8});}
             renderer.render(scene,camera);}''',[mode,age])
            p.screenshot(path=str(OUT/('fixture-'+mode+'.png')))
            check(p.evaluate('fixture.renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),mode+': standalone real-WebGL shader fixture renders')
        p.evaluate('fixture.fire.dispose();fixture.renderer.dispose()');c.close()
        check(not errors,'No uncaught script or shader errors in the new fire paths')
        (OUT/'native-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Actual served gameplay inputs plus separately labeled standalone WebGL fixtures. Reduced software game buffers; no physical Quest/Xbox or sustained-performance claim.'},indent=2))
    except Exception as e:
        try:state=p.evaluate('window.River?.snapshot()')
        except:state=None
        try:program=p.evaluate("(()=>{const s=AFRAME.scenes[0],m=s.object3D.getObjectByName('Currentworks flame 0');return {prepared:window.firePreparedKey,current:s.renderer.properties.get(m.material).currentProgram?.cacheKey};})()")
        except:program=None
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state,'program':program},indent=2))
        try:p.screenshot(path=str(OUT/'failure.png'))
        except:pass
        raise
    finally:browser.close()
