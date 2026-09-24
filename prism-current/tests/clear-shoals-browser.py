"""Clear Shoals: native shader fixture plus real AR controls and an Easy battle.
Only tracked INPUT is driven. Isolated optical fixtures are labeled separately.
"""
from pathlib import Path
import base64,functools,hashlib,http.server,json,os,re,sys,threading,time,urllib.request
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];APP=ROOT/'prism-current';PUBLIC='--public' in sys.argv
OUT=ROOT/'test-output/clear-shoals'/('public' if PUBLIC else 'source');OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];server=None;result=None;pixels=None;capDiagnostics=None

def check(v,m):
    assert v,m
    checks.append(m);print('PASS',m,flush=True)

if PUBLIC:
    URL='https://v5ma.github.io/prism-current/'
    paths={'index.html','release.json','modules/environment/CLEARWATER-NOTICE.txt'}
    paths.update(s.split('?')[0] for s in re.findall(r'(?:src|href)="\./([^"#]+)',(APP/'index.html').read_text()) if s.split('?')[0].endswith(('.js','.css')))
    expected={name:hashlib.sha256((APP/name).read_bytes()).hexdigest() for name in sorted(paths)};actual={}
    for attempt in range(40):
        for name in expected:
            if actual.get(name)==expected[name]:continue
            try:
                request=urllib.request.Request(URL+name+'?clear-shoals='+expected['index.html'][:12],headers={'Cache-Control':'no-cache'})
                with urllib.request.urlopen(request,timeout=12) as r:actual[name]=hashlib.sha256(r.read()).hexdigest()
            except Exception as e:actual[name]=str(e)
        if expected==actual:break
        time.sleep(6)
    (OUT/'publication.json').write_text(json.dumps({'expected':expected,'actual':actual,'all_match':expected==actual},indent=2))
    check(expected==actual,'All loaded public runtime/style files, release and attribution match this source')
else:
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/prism-current/'

with sync_playwright() as pw:
    opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
    if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**opts)
    def watch(p):
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
    try:
        # A separate, ordinary-resolution optical fixture. No game state exists.
        c=browser.new_context(viewport={'width':960,'height':640},device_scale_factor=1);p=c.new_page();watch(p)
        p.goto('about:blank')
        for name in ['vendor/aframe-1.8.0.min.js','modules/environment/water.js','modules/environment/water-detail.js','modules/environment/water-optics.js']:
            p.add_script_tag(content=(APP/name).read_text())
        p.evaluate('''()=>{const T=AFRAME.THREE,r=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});
          r.setSize(960,640);r.setPixelRatio(1);r.setClearColor(0,0);document.body.style.margin='0';document.body.style.background='#142f38';document.body.appendChild(r.domElement);
          const s=new T.Scene(),cam=new T.PerspectiveCamera(54,1.5,.05,100);cam.position.set(2,2.6,3);cam.lookAt(0,0,-4);
          const w=SVGNWater.create(T,{width:8,length:15,centerZ:-7,depth:1.25,shoreDepth:.10,level:0,quality:'balanced'});s.add(w.mesh);w.update({time:4,opacity:.8});
          const pixels=()=>{const a=new Uint8Array(960*640*4);r.getContext().readPixels(0,0,960,640,r.getContext().RGBA,r.getContext().UNSIGNED_BYTE,a);return a;};
          r.render(s,cam);window.fixture={T,r,s,cam,w,pixels,base:pixels()};}''')
        p.screenshot(path=str(OUT/'fixture-base-water.png'))
        p.evaluate('''()=>{const f=fixture;f.o=SVGNWaterOptics.attach(f.T,f.w.material);f.o.update({ar:false});f.r.render(f.s,f.cam);f.r.render(f.s,f.cam);f.upgraded=f.pixels();}''')
        p.screenshot(path=str(OUT/'fixture-clear-shoals.png'))
        pixels=p.evaluate('''()=>{const f=fixture;let visible=0,different=0,maxAlpha=0;for(let i=0;i<f.base.length;i+=4){if(f.upgraded[i+3]>0)visible++;maxAlpha=Math.max(maxAlpha,f.upgraded[i+3]);if(Math.abs(f.base[i]-f.upgraded[i])+Math.abs(f.base[i+1]-f.upgraded[i+1])+Math.abs(f.base[i+2]-f.upgraded[i+2])>12)different++;}return {visible,different,maxAlpha};}''')
        check(pixels['visible']>10000 and pixels['different']>pixels['visible']*.15,'Real WebGL pixels show a substantial optical change over the same base-water geometry')
        p.add_script_tag(content=(APP/'tests/clear-shoals-pixels.js').read_text())
        capDiagnostics=p.evaluate('measureShoalOpacity()')
        (OUT/'opacity-diagnostics.json').write_text(json.dumps(capDiagnostics,indent=2))
        data=p.evaluate('fixture.r.domElement.toDataURL()');(OUT/'fixture-optical-alpha.png').write_bytes(base64.b64decode(data.split(',')[1]))
        check(capDiagnostics['boundViolations']==0,'Every moving-water pixel stays within the same-geometry composed opacity bound')
        check(capDiagnostics['addedOverlapPixels']==0,'The optical extension introduces no new above-cap overlap pixels over the base water')
        check(capDiagnostics['overhead']['max']<=205,'A nonoverlapping view strictly respects the 0.8 surface opacity cap')
        p.evaluate('fixture.r.render(fixture.s,fixture.cam)')
        check(p.evaluate('fixture.pixels().every((v,i)=>v===fixture.upgraded[i])'),'Repeated paused time produces an identical native water image')
        p.evaluate('''()=>{const f=fixture;f.w.update({time:4,opacity:0});f.o.update({ar:true});f.r.render(f.s,f.cam);}''')
        check(p.evaluate('fixture.pixels().every((v,i)=>i%4!==3||v===0)'),'Zero opacity really preserves the transparent framebuffer')
        p.evaluate('''()=>{const f=fixture;f.w.mesh.scale.x=.55;f.w.mesh.rotation.y=.7;f.w.update({time:4,opacity:.38,quiet:true});f.r.render(f.s,f.cam);f.held=f.pixels();}''')
        check(p.evaluate('fixture.w.uniforms.time.value')==0,'Quiet mode freezes the actual optics clock, not only geometric waves')
        check(p.evaluate('fixture.held.every((v,i)=>i%4!==3||v<=98)'),'Rotated, narrowed AR-shaped water retains the 0.38 opacity cap')
        p.screenshot(path=str(OUT/'fixture-quiet-ar-opacity.png'))
        check(p.evaluate('fixture.r.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),'Both shader variants compile and link in real WebGL2')
        p.evaluate('fixture.o.dispose();fixture.w.dispose();fixture.r.dispose()');c.close()

        # Updated fire is rendered independently before the unchanged AR journey.
        c=browser.new_context(viewport={'width':960,'height':640},device_scale_factor=1);p=c.new_page();watch(p);p.goto('about:blank')
        for name in ['vendor/aframe-1.8.0.min.js','modules/environment/fire.js','tests/effects-polish-render.js']:
            p.add_script_tag(content=(APP/name).read_text())
        fireReport=p.evaluate('runEffectsPolishFixture()')
        for name,data in fireReport.pop('captures').items():
            (OUT/('fixture-curl-'+name+'.png')).write_bytes(base64.b64decode(data.split(',')[1]))
        (OUT/'curl-fire.json').write_text(json.dumps(fireReport,indent=2))
        for text in fireReport['checks']:check(True,text)
        c.close()

        # The normal game with tracked-input emulation; no actor/health/clock writes.
        c=browser.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.25,service_workers='block')
        c.add_init_script((APP/'tests/river-fake-xr.js').read_text()+'\n'+(APP/'tests/river-strict-xr.js').read_text())
        c.add_init_script("localStorage.setItem('prism-current.river.pacing.records.v1','{\"sentinel\":true}')")
        p=c.new_page();watch(p);p.set_default_timeout(45000);p.goto(URL,wait_until='domcontentloaded')
        p.wait_for_function('window.River?.snapshot().ready&&River.snapshot().rotunda.progress>=1&&!document.getElementById("enter-ar").disabled')
        p.add_script_tag(content=(APP/'tests/frame-trace.js').read_text());p.add_script_tag(content=(APP/'tests/playability-xr-driver.js').read_text())
        p.evaluate("window.shoalTrace=RiverFrameTrace.install(AFRAME.scenes[0].components['river-game'])")
        p.add_script_tag(content=(APP/'tests/render-completion-probe.js').read_text());p.evaluate('window.gpuProbe=RenderCompletionProbe.install(AFRAME.scenes[0])')
        xy=p.evaluate('''()=>{const T=AFRAME.THREE,s=AFRAME.scenes[0],m=s.object3D.getObjectByName('river-xr-menu'),r=RiverRotunda.RECTS[0];m.updateWorldMatrix(true,false);const v=new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld).project(s.camera),b=document.getElementById('scene-wrap').getBoundingClientRect();return [b.x+(v.x*.5+.5)*b.width,b.y+(-v.y*.5+.5)*b.height];}''')
        p.mouse.click(*xy);p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated&&River.snapshot().rotunda.progress>=1')
        def snap():return p.evaluate('River.snapshot()')
        def frames():
            p.evaluate('''async()=>{const s=TestXR.state.session;const frame=()=>new Promise((r,j)=>{const t=setTimeout(()=>j(Error('XR frame timeout')),8000);s.requestAnimationFrame(()=>{clearTimeout(t);r();});});await frame();await frame();}''')
        def button(i):
            for v in [False,True,False]:p.evaluate('([i,v])=>TestXR.button("right",i,v)',[i,v]);frames()
        def choose(i):
            p.wait_for_function('River.snapshot().rotunda.open&&River.snapshot().rotunda.progress>=1');p.evaluate('TestXR.select("left",false)');frames();p.wait_for_timeout(140)
            p.evaluate('''i=>{const T=AFRAME.THREE,m=AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu'),r=RiverRotunda.RECTS[i];m.updateWorldMatrix(true,false);TestXR.point('left',new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld).toArray());}''',i)
            p.wait_for_function('i=>River.snapshot().xrUI.hover[0]===i',arg=i);n=snap()['xrUI']['actions'];p.evaluate('TestXR.select("left",true)');p.wait_for_function('n=>River.snapshot().xrUI.actions===n+1',arg=n);p.evaluate('TestXR.select("left",false)')
            if snap()['immersive']:frames()
        check(snap()['difficulty']=='easy' and snap()['version']=='0.13.0','The actual AR chapter card preserves Easy and Color Match gameplay')
        check(snap()['stats']['arScenery']['optics']['version']=='0.2.1','The real AR river uses Clear Shoals, not only the standalone fixture')
        check(p.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==0,'The game retains transparent AR composition')
        check(snap()['stats']['arScenery']['optics']['extraTextures']==2 and snap()['stats']['arScenery']['optics']['renderTargets']==0,'Actual AR uses exactly two additional data textures and no scene-copy targets')
        before=snap()['stats']['water']['opacity'];choose(10);choose(4);p.wait_for_function('v=>River.snapshot().stats.water.opacity<v',arg=before)
        check(snap()['stats']['water']['opacity']==snap()['rotunda']['preferences']['opacity'],'Tracked opacity selection drives the combined material and saved preference')
        choose(6);p.wait_for_function('River.snapshot().stats.water.quiet');choose(6);p.wait_for_function('!River.snapshot().stats.water.quiet')
        check(True,'The existing tracked quiet/flowing control still works')
        choose(8);p.evaluate('TestXR.away()');button(5);p.wait_for_function('River.snapshot().phase==="playing"')
        check(snap()['result']['health']==100 and snap()['rotunda']['healthGaugeVisible'],'The running AR encounter retains its actual health display')
        check(snap()['stats']['arScenery']['optics']['prepared'] and snap()['stats']['arScenery']['optics']['warmupDraws']==1,'The actual AR water completes its first-use draw before music and combat')
        check(snap()['stats']['fire']['version']=='0.2.0' and snap()['stats']['fire']['prepared'],'The actual game uses prepared curling fire rather than the old flame material')
        before=snap()['bladeColors'];button(4)
        check(snap()['bladeColors'][1]!=before[1] and snap()['bladeColors'][0]==before[0],'Right A still changes only its saber color rather than opening a menu')
        p.wait_for_function('River.snapshot().stats.water.emitted>0',timeout=22000)
        check(snap()['phase']=='playing','Real boat movement creates wakes without an unsolicited first-use pause')
        p.evaluate('TestXR.away()');button(5);p.wait_for_function('River.snapshot().phase==="paused"');state=snap();p.wait_for_timeout(200)
        check(snap()['time']==state['time'] and snap()['result']==state['result'] and snap()['stats']['water']==state['stats']['water'],'Pause freezes water and the exact encounter without resetting progress')
        p.screenshot(path=str(OUT/'actual-ar-paused.png'))
        choose(10);choose(0);choose(4)
        check(snap()['time']==state['time'] and snap()['result']==state['result'] and snap()['bladeColors']==state['bladeColors'],'Music and opacity changes preserve paused health, points and selected colors')
        choose(8);p.evaluate('TestXR.away()');button(5);p.wait_for_function('River.snapshot().phase==="playing"')
        p.evaluate('observeFriendlyXR();startFriendlyXR("boss")')
        p.wait_for_function('River.snapshot().entities.some(n=>n.type==="boss")',timeout=90000)
        check(not p.evaluate('friendlyXRObserved.earlyBoss'),'Admiral Quack still arrives only in the final musical phrase')
        p.wait_for_function('["complete","failed","escaped"].includes(River.snapshot().phase)',timeout=35000);p.evaluate('stopFriendlyXR();clearInterval(friendlyXRObserver)');result=snap()['result']
        check(result['complete'] and result['bossDefeated'],'The unchanged Easy AR battle completes through real boss laser hits with the new water')
        check(snap()['stats']['fire']['emitted']>0,'Real defeated enemies produced the upgraded fire during the AR battle')
        check(p.evaluate("localStorage.getItem('prism-current.river.pacing.records.v1')")=='{"sentinel":true}','Older scoring records remain byte-identical')
        check(snap()['stats']['arScenery']['grass']['visible'],'The current island, cloud and grass composition remains present')
        choose(8);choose(3);p.wait_for_function('!River.snapshot().immersive')
        check(True,'Exit ends the XR session without closing the browser')
        check(not errors,'No captured JavaScript or shader errors in these optical and AR paths')
        (OUT/'gpu-completion.json').write_text(json.dumps(p.evaluate('gpuProbe.snapshot()'),indent=2))
        (OUT/'frame-trace.json').write_text(json.dumps(p.evaluate('shoalTrace.snapshot()'),indent=2))
        (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'pixelEvidence':pixels,'opacityDiagnostics':capDiagnostics,'result':result,'scope':'Native WebGL fixture and actual full Easy AR game using emulated tracked input. Existing reduced stereo gameplay buffer; not physical Quest approval or sustained performance.'},indent=2));c.close()
    except Exception as e:
        try:state=p.evaluate('window.River?.snapshot()')
        except:state=None
        try:trace=p.evaluate('window.shoalTrace?.snapshot()')
        except:trace=None
        try:
            gpu=p.evaluate('window.gpuProbe?.snapshot()');p.evaluate('window.gpuProbe?.dispose()')
            (OUT/'gpu-completion.json').write_text(json.dumps(gpu,indent=2))
            completion=p.evaluate('window.RenderCompletionProbe?.pausedVariants(AFRAME.scenes[0])')
            (OUT/'paused-render-completion.json').write_text(json.dumps(completion,indent=2))
        except Exception as diagnostic_error:(OUT/'completion-error.txt').write_text(str(diagnostic_error))
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state,'trace':trace,'pixelEvidence':pixels,'opacityDiagnostics':capDiagnostics},indent=2))
        try:p.screenshot(path=str(OUT/'failure.png'))
        except:pass
        raise
    finally:
        browser.close()
        if server:server.shutdown()
