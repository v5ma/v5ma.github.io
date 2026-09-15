"""Waterwheel reference slice: ordinary-input native acceptance and old-save fixtures.

No player, score, win, rail contact or progression assignments. Old storage is
explicit compatibility data. XR uses the shared deterministic hardware emulator.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import base64, functools, json, os, subprocess, threading
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[3]
OUT = Path(os.getenv('ARTIFACT_DIR', '/tmp/waterwheel-native')); OUT.mkdir(parents=True, exist_ok=True)
CASE = os.getenv('WATERWHEEL_ROUTE', 'road')
assert CASE in ['road', 'quay', 'canal', 'express', 'xr']
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
origin = os.getenv('TEST_ORIGIN', f'http://127.0.0.1:{server.server_port}').rstrip('/')
BASE = origin + '/mario-maker-clone/svgn-paper-route/'
checks, errors, console, evidence = [], [], [], {}
passed = False; failure = None
OLD = {'svgn_delivery_records_v1': json.dumps({'canal-choices': {'medal': 'gold', 'time': 1, 'score': 900}}),
       'svgn.skycycle.mastery.v1': json.dumps({'canal-choices': {'badges': ['finish', 'mail'], 'best': 1, 'finishes': 7}}),
       'svgn.skycycle.exploration.v1': json.dumps({'canal-choices': {'stamps': ['district:0', 'rail:legacy-rail'], 'finishes': 7}})}
PAD = "window.testPad={id:'Waterwheel Xbox sample',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[testPad];"
def check(ok, label):
    assert ok, label
    checks.append(label); print('PASS:', label, flush=True)
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'), headless=True,
        args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    ctx = browser.new_context(viewport={'width':1100,'height':800}, service_workers='block',
        record_video_dir=str(OUT/'video'), record_video_size={'width':800,'height':600}, accept_downloads=True)
    ctx.add_init_script(PAD)
    ctx.add_init_script("if(!localStorage.getItem('waterwheel-compatibility-fixture')){const old="+json.dumps(OLD)+";for(const [k,v]of Object.entries(old))localStorage.setItem(k,v);localStorage.setItem('waterwheel-compatibility-fixture','preserved');localStorage.setItem('sprocket_muted','1');}")
    if CASE == 'xr':
        ctx.add_init_script(Path(__file__).with_name('xr-emulator.js').read_text().replace("import('../vendor/three.webgpu.js')", "import('./vendor/three.webgpu.js')"))
    ctx.route('**/*', lambda r: r.continue_() if urlparse(r.request.url).hostname == urlparse(origin).hostname or r.request.url.startswith(('blob:', 'data:')) else r.abort())
    page=ctx.new_page();page.set_default_timeout(120000)
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
    def frames(n=3):
        page.evaluate('(n)=>new Promise(resolve=>{function step(){if(--n<=0)resolve();else requestAnimationFrame(step);}requestAnimationFrame(step);})',n)
    def tap(i):
        frames();page.evaluate('(i)=>{testPad.buttons[i]={pressed:true,value:1};}',i);frames();page.evaluate('(i)=>{testPad.buttons[i]={pressed:false,value:0};}',i);frames()
    def snap():
        return page.evaluate('({x:player.x,y:player.y,vx:player.vx,vy:player.vy,rail:player.track?.sky?.id,ground:player.onGround,won,tries,mode,route:__delivery.state.route,view:__delivery.state.view,delivered:deliveries,visits:[...__network.state.visits],trace:SkyCycleWaterwheel.trace,art:SkyCycleWaterwheel.art})')
    def seek(id):
        for _ in range(50):
            if page.evaluate('(id)=>document.activeElement?.id===id',id):return
            tap(5)
        raise AssertionError('Controller could not reach '+id)
    def xrframes(n=4):
        start=page.evaluate('SkyCycleXR.diagnostics.frames');page.wait_for_function('(n)=>SkyCycleXR.diagnostics.frames>=n',arg=start+n)
    def point(label):
        page.evaluate('(s)=>xrEmulator.point(s)',label);xrframes(3)
    def choose(label):
        for _ in range(20):
            if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.toLowerCase().includes(s.toLowerCase()))',label):break
            point('Next');page.evaluate("xrEmulator.select('start')");page.evaluate("xrEmulator.select('end')");xrframes(3)
        point(label);page.evaluate("xrEmulator.select('start')");page.evaluate("xrEmulator.select('end')");xrframes()
    def xrcapture(name):
        image=page.evaluate('xrEmulator.image()');(OUT/(name+'.png')).write_bytes(base64.b64decode(image.split(',',1)[1]))
    try:
        page.goto(BASE+'?chapter=waterwheel&xr=1',wait_until='domcontentloaded');page.bring_to_front()
        page.wait_for_function('window.SkyCycleWaterwheel && window.SkyCycleCompass && window.SkyCycleFlightDeck && PaperDeliveryCampaign.status==="ready" && __delivery.state.route===5 && player.onGround && SkyCycleWaterwheel.art.wheel')
        check(page.evaluate('DeliveryCampaign.routes.length===8 && DeliveryCampaign.routes[5].id==="canal-choices" && DeliveryCampaign.routes[5].recordId==="canal-choices-waterwheel-r2"'),'Waterwheel replaces only its authored layout while keeping the eight route identities')
        check(page.evaluate('tracks.length===9 && __sky.state.data.gp.waterwheel.revision==="waterwheel-r2"'),'The nine authored surfaces are loaded into the real collision world')
        code=page.evaluate('levelCode()');classic=page.evaluate('SkyCycleWaterwheel.classicCode()')
        check(classic!=code,'The earlier Waterwheel remains a distinct, exportable editable document')
        # An existing valid classic Workshop document is an explicit compatibility fixture.
        draft=json.dumps([{'id':'waterwheel-old-draft','name':'My classic Waterwheel','code':classic,'time':1}])
        page.evaluate('(value)=>localStorage.setItem("svgn_route_workshop_library_v2",value)',draft)
        check(page.evaluate('JSON.parse(localStorage.getItem("svgn_delivery_records_v1"))["canal-choices"].time===1 && !JSON.parse(localStorage.getItem("svgn_delivery_records_v1"))["canal-choices-waterwheel-r2"]'),'Earlier-layout best time is not treated as a new-layout record')
        page.screenshot(path=str(OUT/'post-quay-3d.png'))
        if CASE=='xr':
            page.wait_for_function('!!window.SkyCycleXR');page.locator('#sky-xr-open').click();page.locator('#sky-xr-enter').click()
            page.wait_for_function('SkyCycleXR.presenting && SkyCycleXR.diagnostics.frames>5');xrcapture('waterwheel-stereo-controller')
            check(page.evaluate('SkyCycleXR.diagnostics.eyes===2 && SkyCycleXR.diagnostics.ownedScene && SkyCycleWaterwheel.art.wheel'),'The redesigned chapter renders through the actual stereo XR scene')
            choose('Back to the route');page.wait_for_function('!__delivery.paused');x=page.evaluate('player.x')
            page.evaluate('xrEmulator.axis(.8)');page.wait_for_function('(x)=>player.x>x+100',arg=x);page.evaluate('xrEmulator.axis(0)');xrframes()
            check(True,'Tracked controller input rides the redesigned chapter through the unchanged physics')
            page.evaluate("xrEmulator.button('right',5,true)");xrframes();page.evaluate("xrEmulator.button('right',5,false)");xrframes();page.wait_for_function('__delivery.paused')
            page.evaluate('xrEmulator.hands()');xrframes();check(page.evaluate('SkyCycleXR.diagnostics.handJoints===50'),'Both tracked hands are available in the redesigned scene')
            choose('Back to the route');page.wait_for_function('!__delivery.paused');x=page.evaluate('player.x');point('Ride right');page.evaluate("xrEmulator.select('start')")
            page.wait_for_function('(x)=>player.x>x+80',arg=x);page.evaluate("xrEmulator.select('end')");xrframes();xrcapture('waterwheel-stereo-hands')
            check(True,'Native hand-select hold operates the same riding input without a mouse')
            page.evaluate('xrEmulator.disconnect()');xrframes();check(page.evaluate('__delivery.paused && !keys.ArrowRight && !keys.Space'),'Tracked source loss releases input and pauses this chapter')
            page.evaluate('xrEmulator.session.end()');page.wait_for_function('!SkyCycleXR.presenting');check(page.evaluate('__delivery.paused && !__merged.scene.parent'),'XR exit restores ordinary scene ownership safely')
            check(page.evaluate('levelCode()')==code,'XR input does not rewrite the authored course')
        else:
            # Native full-route completions use the supported 2D view on CPU CI.
            page.locator('#delivery-header [data-delivery="view"]').click();page.wait_for_function('__delivery.state.view==="2d"');page.locator('#cv').focus()
            page.keyboard.down('KeyD')
            if CASE=='quay':
                page.wait_for_function('player.x>=525 && player.onGround && !player.track');page.keyboard.down('Space')
                page.wait_for_function('player.track?.sky?.id==="ww-quay"',timeout=30000);page.keyboard.up('Space')
                page.wait_for_function('!player.track && player.onGround && player.x>1040',timeout=30000)
                check(page.evaluate('player.x<1404'),'The introductory branch returns naturally to the road before the main aerial network')
            elif CASE in ('canal','express'):
                page.wait_for_function('player.x>=1970 && player.onGround && !player.track');page.keyboard.down('Space')
                page.wait_for_function('player.track?.sky?.id==="ww-rise"',timeout=30000);page.keyboard.up('Space')
                check(True,'An ordinary road jump enters the express runway')
                if CASE=='canal':
                    page.wait_for_function('player.track?.sky?.id==="ww-rise" && player.track.len-player.trackS<=125',timeout=30000)
                    page.keyboard.up('KeyD');page.keyboard.down('KeyA')
                    page.wait_for_function('player.track?.sky?.id!=="ww-rise"',timeout=30000);page.keyboard.up('KeyA');page.keyboard.down('KeyD')
                    page.wait_for_function('player.track?.sky?.id==="ww-low"',timeout=30000)
                    check(True,'Braking selects the lower canal balcony rather than the express lift')
                    page.wait_for_function('!player.track && player.onGround && player.x>3420',timeout=30000)
                    check(page.evaluate('player.x<4000'),'The lower choice returns naturally to a useful road continuation')
                else:
                    page.wait_for_function('player.track?.sky?.id==="ww-5"',timeout=90000)
                    check(page.evaluate('SkyCycleWaterwheel.main.every(id=>__network.state.visits.has(id))'),'A continuous real-input ride visits all six express surfaces without intermediate resets')
                    page.wait_for_function('player.track?.sky?.id==="ww-east"',timeout=90000)
                    check(True,'The east-bank receiver catches the actual final express flight')
            if CASE=='road':
                page.wait_for_function('player.x>=4330 && player.onGround',timeout=90000);page.keyboard.up('KeyD');tap(9);page.wait_for_function('__delivery.paused')
                page.locator('#delivery-header [data-delivery="view"]').click();page.wait_for_function('__delivery.state.view==="3d"');frames(5)
                page.screenshot(path=str(OUT/'wheelhouse-court-3d.png'))
                check(page.evaluate('SkyCycleWaterwheel.art.wheel'),'The waterwheel landmark remains in the actual scene at the court')
                page.set_viewport_size({'width':390,'height':844});frames(5);page.screenshot(path=str(OUT/'wheelhouse-mobile-3d.png'))
                page.set_viewport_size({'width':1100,'height':800});page.locator('#delivery-header [data-delivery="view"]').click();tap(9);page.wait_for_function('!__delivery.paused');page.locator('#cv').focus();page.keyboard.down('KeyD')
            page.wait_for_function('won && __delivery.state.route===5',timeout=180000);page.keyboard.up('KeyD');page.keyboard.up('KeyA');page.keyboard.up('Space')
            if page.locator('#stay-results').is_visible():page.locator('#stay-results').click()
            evidence['finish']=snap();check(evidence['finish']['won'] and evidence['finish']['tries']==1,CASE+' route completes through the actual engine without checkpoint retries')
            visits=evidence['finish']['visits']
            if CASE=='road':check(not visits,'The complete road journey requires no aerial surface or advanced action')
            elif CASE=='quay':check(visits==['ww-quay'],'The practice detour never accidentally commits the rider to the express network')
            elif CASE=='canal':check(visits==['ww-rise','ww-low'],'The brake-selected journey stays on its declared lower route')
            else:check(all(x in visits for x in ['ww-rise','ww-1','ww-2','ww-3','ww-4','ww-5','ww-east']),'The expressive route retains the complete connected traversal through finish')
            check(page.evaluate('levelCode()')==code,'Native completion preserves the exact authored document')
            page.screenshot(path=str(OUT/(CASE+'-finish.png')))
            check(page.evaluate('(()=>{const r=JSON.parse(localStorage.getItem("svgn_delivery_records_v1"));return r["canal-choices"].time===1&&r["canal-choices"].score===900&&r["canal-choices-waterwheel-r2"].time>1;})()'),'The accepted finish creates a layout-specific record and preserves the earlier medal and time')
            check(page.evaluate('SkyCycleFlightDeck.records["canal-choices"].best===1 && SkyCycleFlightDeck.records["canal-choices"].finishes===7 && SkyCycleFlightDeck.records["canal-choices-waterwheel-r2"].finishes===1'),'Career records distinguish new-layout achievement from preserved legacy history')
            tap(8);page.wait_for_function('document.getElementById("flight-deck").open');seek('waterwheel-classic-export')
            with page.expect_download() as download:tap(0)
            download.value.save_as(str(OUT/'classic-layout.route'));check((OUT/'classic-layout.route').read_text()==classic,'Xbox-accessible classic export produces the earlier document without replacing the current route')
            page.screenshot(path=str(OUT/'layout-history-flight-deck.png'));tap(1)
            check(page.evaluate('levelCode()')==code,'Exporting history does not load it over the current course')
        check(page.evaluate('localStorage.getItem("svgn_route_workshop_library_v2")')==draft,'The valid earlier Workshop document survives unchanged')
        check(page.evaluate('localStorage.getItem("waterwheel-compatibility-fixture")==="preserved"'),'Unrelated stored data is preserved')
        page.reload(wait_until='domcontentloaded');page.wait_for_function('window.SkyCycleWaterwheel && window.SkyCycleFlightDeck && __delivery.state.route===5')
        check(page.evaluate('localStorage.getItem("svgn_route_workshop_library_v2")')==draft,'A real reload preserves the old editable draft without silent migration')
        check(page.evaluate('JSON.parse(localStorage.getItem("svgn_delivery_records_v1"))["canal-choices"].time===1'),'Earlier-layout records remain intact after reload')
        check(not errors,'No uncaught application errors');passed=True
    except Exception as exc:
        failure=str(exc)
        try:evidence['failure_state']=snap();page.screenshot(path=str(OUT/'failure.png'))
        except Exception:pass
        raise
    finally:
        report={'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'case':CASE,'passed':passed,'checks':checks,'failure':failure,'errors':errors,'console':console,'evidence':evidence,'origin':origin,'coverage':'Normal-input game, real 3D scenes, supported 2D complete routes; sampled Xbox and deterministic XR hardware where named. Explicit old-save fixtures. No intermediate physics, score, progression or win assignments. Physical-device, human enjoyment and performance gates remain open.'}
        (OUT/'report.json').write_text(json.dumps(report,indent=2));ctx.close();browser.close();server.shutdown()
