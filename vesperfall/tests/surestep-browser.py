"""Surestep acceptance: actual WebGL and shipped UI with emulated device input.
Emulators supply only poses, buttons and joints; no game/save state is assigned.
"""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'test-output' / 'surestep'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.getenv('TEST_BASE_URL', 'http://127.0.0.1:4173').rstrip('/')
PAD = """(()=>{const pad={id:'Surestep Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};window.TestPad={enabled:false,pad,button(i,on){pad.buttons[i]={pressed:on,touched:on,value:on?1:0}}};Object.defineProperty(navigator,'getGamepads',{value:()=>TestPad.enabled?[pad]:[]});})();"""
checks, errors, console_errors = [], [], []
def check(ok, label):
    if not ok:
        raise AssertionError(label)
    checks.append(label)
    print('PASS:', label, flush=True)
with sync_playwright() as p:
    opts = {'headless': True, 'args': ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']}
    if os.getenv('CHROMIUM_PATH'):
        opts['executable_path'] = os.environ['CHROMIUM_PATH']
    browser = p.chromium.launch(**opts)
    ctx = browser.new_context(viewport={'width': 1100, 'height': 800}, device_scale_factor=.6, service_workers='block')
    ctx.add_init_script(PAD + 'window.TEST_XR_PIXEL_SCALE=.5;' + (ROOT/'vesperfall/tests/fake-xr.js').read_text() + (ROOT/'vesperfall/tests/fake-hands.js').read_text())
    page = ctx.new_page()
    page.set_default_timeout(60000)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda e: console_errors.append(e.text) if e.type == 'error' else None)
    def wait(js, arg=None):
        return page.wait_for_function(js, arg=arg, timeout=60000)
    def press(i):
        wait('Vesperfall.component.dominionControls.state.armed')
        for on in (True, False):
            page.evaluate('([i,on])=>TestPad.button(i,on)', [i, on])
            wait('([i,on])=>Vesperfall.component.dominionControls.state.prev[i]===on', [i, on])
    def nav_to(id):
        for _ in range(100):
            if page.evaluate('id=>document.activeElement.id===id', id):
                return
            direction = page.evaluate('id=>{const a=Vesperfall.component.dominionControls.focusables(),i=a.indexOf(document.activeElement),j=a.findIndex(e=>e.id===id),n=a.length;return j<0?13:((j-i+n)%n<=(i-j+n)%n?13:12)}', id)
            press(direction)
        raise AssertionError('Xbox cannot focus '+id)
    def xrpress(side, i):
        for on in (True, False):
            page.evaluate('([s,i,on])=>TestXR.button(s,i,on)', [side,i,on])
            wait('([s,i,on])=>Vesperfall.component.prevButtons[s]?.[i]===on||(!on&&!Vesperfall.component.xr)', [side,i,on])
    def xraction(text):
        wait('Vesperfall.component.dominionControls.state.xrNeutral')
        rows = page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])')
        index = next(i for i,v in enumerate(rows) if text.lower() in v.lower())
        cur = page.evaluate('Vesperfall.component.menuSelection')
        steps = (index-cur+len(rows)) % len(rows)
        for _ in range(steps or len(rows)):
            page.evaluate("TestXR.axes('left',0,1)")
            wait('!Vesperfall.component.dominionControls.state.xrAxesReady')
            page.evaluate("TestXR.axes('left',0,0)")
            wait('Vesperfall.component.dominionControls.state.xrAxesReady')
        check(page.evaluate('i=>Vesperfall.component.menuSelection===i',index), 'Tracked controller reaches '+text)
        xrpress('right',0)
    def handaim(text, side='right'):
        rows = page.evaluate('Vesperfall.component.xrMenuRows.map(r=>r[0])')
        index = next(i for i,v in enumerate(rows) if text.lower() in v.lower())
        page.evaluate("""([index,side])=>{const g=Vesperfall.component,T=g.T,panel=g.xrPanel.mesh;
          panel.updateMatrixWorld(true);g.rig.updateMatrixWorld(true);
          const y=195+index*75+30.5,h=panel.geometry.parameters.height;
          const target=panel.localToWorld(new T.Vector3(0,(.5-y/768)*h,0));
          const origin=new T.Vector3(...TestXR.state.hands[side]).applyMatrix4(g.rig.matrixWorld);
          const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),target.sub(origin).normalize());
          q.premultiply(g.rig.getWorldQuaternion(new T.Quaternion()).invert());TestXR.orientation(side,q.toArray());
        }""", [index, side])
        return index
    def handaction(text, side='right', release=True):
        handaim(text,side)
        before = page.evaluate('Vesperfall.component.questHands.state.selections')
        page.evaluate('s=>TestHands.pinch(s,.05)',side)
        wait('s=>[...Vesperfall.component.questHands.state.sources].some(([src,p])=>src.handedness===s&&p.pinch.armed)',side)
        page.evaluate('s=>TestHands.pinch(s,.015)',side)
        wait('n=>Vesperfall.component.questHands.state.selections>n||!Vesperfall.component.xr', before)
        if release and page.evaluate('Vesperfall.component.xr'):
            page.evaluate('s=>TestHands.pinch(s,.05)',side)
        check(True, side+' hand selects '+text+' through a joint pinch and ray hit')
    try:
        page.goto(BASE+'/vesperfall/index.html?acceptance=surestep', wait_until='domcontentloaded')
        wait('window.Vesperfall?.component.questHands&&AFRAME.scenes[0].renderer.info.render.calls>0')
        check(page.evaluate('Vesperfall.component.enemyMeshes.filter(m=>m.userData.surestep).length===16'), 'All 16 outer humanoid instances receive the new articulated rig')
        check(page.evaluate('Vesperfall.component.enemyMeshes.filter(m=>m.visible&&m.userData.surestep).every(m=>m.userData.surestep.pose.legs.every(l=>l.knee.every(Number.isFinite)&&l.ankle.every(Number.isFinite)))'), 'Rendered humanoid poses have finite knees and feet')
        # Isolated review canvas clones actual posed meshes; game state is untouched.
        page.evaluate("""()=>{const g=Vesperfall.component,T=g.T,s=new T.Scene();s.background=new T.Color('#bac8cb');s.add(new T.HemisphereLight('#ffffff','#465358',2.4));const sun=new T.DirectionalLight('#fff4dc',3);sun.position.set(-3,6,4);s.add(sun);
          const models=g.enemyMeshes.filter(m=>m.visible&&m.userData.surestep?.pose).slice(0,3);models.forEach((source,i)=>{const m=source.clone(true);m.position.set((i-1)*1.65,1.05,0);m.rotation.set(0,.12,0);m.visible=true;m.traverse(o=>{if(o.name.includes('warning'))o.visible=false;});s.add(m);});
          const floor=new T.Mesh(new T.PlaneGeometry(14,12),new T.MeshStandardMaterial({color:'#899899',roughness:.85}));floor.rotation.x=-Math.PI/2;s.add(floor);
          const camera=new T.PerspectiveCamera(37,1100/700,.05,50);camera.position.set(1,2.15,7.9);camera.lookAt(0,1,0);
          const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(1100,700);r.render(s,camera);r.domElement.id='surestep-art-review';Object.assign(r.domElement.style,{position:'fixed',inset:'0',zIndex:'999999'});document.body.append(r.domElement);window.SurestepReviewRenderer=r;
        }""")
        page.screenshot(path=str(OUT/'rig-proportions.png'))
        page.evaluate("document.getElementById('surestep-art-review').remove();SurestepReviewRenderer.dispose();delete window.SurestepReviewRenderer")
        page.evaluate('TestPad.enabled=true')
        nav_to('practice'); press(0); wait('Vesperfall.component.running&&!Vesperfall.component.paused')
        press(13); check(page.evaluate("Vesperfall.state.type==='blink'"), 'Xbox D-pad down equips Blink in one press')
        press(14); check(page.evaluate("Vesperfall.state.type==='plain'"), 'Xbox D-pad left leaves Blink for damage arrows')
        for _ in range(8):
            expected = page.evaluate('VesperSurestep.nextDamage(Vesperfall.state)')
            press(14)
            check(page.evaluate('t=>Vesperfall.state.type===t&&t!=="blink"', expected), 'Xbox damage cycle selects '+expected)
        shots = page.evaluate('Vesperfall.state.shots')
        page.evaluate('TestPad.button(7,true)'); wait('Vesperfall.component.charge>.25')
        press(13); page.evaluate('TestPad.button(7,false)'); wait('!Vesperfall.component.dominionControls.state.prev[7]')
        check(page.evaluate('n=>Vesperfall.state.shots===n', shots), 'Quick-switching a held draw cancels it without firing')
        press(14)
        before_type = page.evaluate('Vesperfall.state.type')
        page.evaluate('TestPad.button(3,true)'); wait('Vesperfall.component.ritual.focus.open')
        press(13)
        check(page.evaluate('t=>Vesperfall.state.type===t', before_type), 'D-pad down inside the held-Y quiver navigates without quick-equipping Blink')
        page.evaluate('TestPad.button(3,false)'); wait('!Vesperfall.component.ritual.focus.open')
        press(9); wait('Vesperfall.component.paused')
        before_type = page.evaluate('Vesperfall.state.type')
        press(13); check(page.evaluate('t=>Vesperfall.state.type===t',before_type), 'D-pad down in menus remains focus navigation')
        nav_to('tidelight-toggle'); press(0)
        check(page.locator('#tidelight-settings').evaluate('(e)=>e.open'), 'Xbox opens the water settings disclosure')
        nav_to('tidelight-quality'); old=page.locator('#tidelight-quality').input_value(); press(15)
        check(page.locator('#tidelight-quality').input_value()!=old, 'Xbox changes the water profile without a mouse')
        nav_to('tidelight-caustics'); old=page.locator('#tidelight-caustics').is_checked(); press(0)
        check(page.locator('#tidelight-caustics').is_checked()!=old, 'Xbox changes water caustics without a mouse')
        # XR entry hands polling to Quest; do not wait on the now inactive Xbox loop.
        nav_to('menu-vr'); page.evaluate('TestPad.button(0,true)')
        wait('Vesperfall.component.xr')
        page.evaluate('TestPad.button(0,false);TestPad.enabled=false')
        wait('Vesperfall.component.dominionControls.state.xrNeutral')
        check(True, 'Xbox opens the real immersive session before handing input to Quest controllers')
        check(page.evaluate('TestHands.state.options.optionalFeatures.includes("hand-tracking")'), 'Immersive session requests optional hand tracking while retaining local-floor')
        xraction('Settings')
        for _ in range(12):
            if page.evaluate('Vesperfall.component.xrMenuRows.some(r=>r[0].startsWith("Water profile"))'):
                break
            xraction('More / page')
        old=page.locator('#tidelight-quality').input_value(); xraction('Water profile')
        check(page.locator('#tidelight-quality').input_value()!=old, 'Tracked Quest controller changes the actual water profile')
        xraction('Back'); xraction('Resume'); wait('!Vesperfall.component.paused')
        if page.evaluate("Vesperfall.state.type==='blink'"): xrpress('right',5)
        shots = page.evaluate('Vesperfall.state.shots')
        page.evaluate("TestXR.pose('right',[-.23,1.35,-.31]);TestXR.orientation('right',[0,0,0,1])")
        page.wait_for_timeout(250)
        page.evaluate("TestXR.button('right',0,true)"); wait('Vesperfall.component.latch.drawing')
        page.evaluate("TestXR.pose('right',[-.23,1.35,.15])"); wait('Vesperfall.component.charge>.35')
        stored=page.evaluate('Object.fromEntries(Object.keys(localStorage).filter(k=>/profile|expedition|checkpoint/.test(k)).map(k=>[k,localStorage.getItem(k)]))')
        page.evaluate("TestHands.pinch('right',.015);TestHands.mode(true);TestXR.pose('right',[.23,1.35,-.4]);TestXR.orientation('left',[0,1,0,0])")
        wait('Vesperfall.component.questHands.state.active&&Vesperfall.component.paused&&!Vesperfall.component.latch.drawing')
        check(page.evaluate('n=>Vesperfall.state.shots===n&&Vesperfall.component.charge===0',shots), 'Switching from a drawn controller bow to bare hands safely pauses and cancels')
        handaim('Settings')
        page.wait_for_timeout(350)
        check(page.evaluate('Vesperfall.component.questHands.state.selections===0'), 'A pinch already held at hand acquisition cannot activate a row')
        handaction('Settings',release=False)
        before=page.evaluate('Vesperfall.component.questHands.state.selections')
        page.evaluate("TestHands.pinch('right',.015)"); page.wait_for_timeout(300)
        check(page.evaluate('n=>Vesperfall.component.questHands.state.selections===n', before), 'A held pinch does not repeat after a menu transition')
        handaction('Bow hand', 'left')
        check(page.locator('#handedness').input_value()=='right','Left bare hand changes bow-handedness in the real settings control')
        handaction('Bow hand','left')
        check(page.locator('#handedness').input_value()=='left','Left bare hand restores bow-handedness')
        for _ in range(12):
            if page.evaluate('Vesperfall.component.xrMenuRows.some(r=>r[0].startsWith("Water profile"))'):
                break
            handaction('More / page')
        handaim('Water profile'); page.evaluate("TestHands.pinch('right',.05)")
        wait("[...Vesperfall.component.questHands.state.sources].some(([s,p])=>s.handedness==='right'&&p.pinch.armed)")
        before=page.evaluate('Vesperfall.component.questHands.state.selections')
        page.evaluate("TestHands.missing('right','index-finger-tip',true);TestHands.pinch('right',.015)")
        wait("[...Vesperfall.component.questHands.state.sources].some(([s,p])=>s.handedness==='right'&&p.last?.valid===false)")
        page.evaluate("TestHands.missing('right','index-finger-tip',false)")
        wait("[...Vesperfall.component.questHands.state.sources].some(([s,p])=>s.handedness==='right'&&p.last?.valid===true&&p.pinch.closed)")
        check(page.evaluate('n=>Vesperfall.component.questHands.state.selections===n',before),'Lost finger tracking followed by a held pinch cannot make a ghost selection')
        old=page.locator('#tidelight-quality').input_value(); handaction('Water profile')
        check(page.locator('#tidelight-quality').input_value()!=old,'A fresh pinch after tracking recovery changes the real water setting')
        page.screenshot(path=str(OUT/'hand-tracking-water-menu.png'))
        handaction('Back'); handaction('Controller manual'); handaction('Hand tracking / menu gestures')
        check(page.evaluate("Vesperfall.component.dominionControls.state.xrScreen==='notice'"),'The in-headset manual explains bare-hand UI and its combat boundary')
        handaction('Back to menu')
        page.evaluate('TestHands.mode(false)'); wait('!Vesperfall.component.questHands.state.active&&Vesperfall.component.dominionControls.state.xrNeutral')
        check(page.evaluate('n=>Vesperfall.state.shots===n',shots),'Returning to neutral tracked controllers does not fire the cancelled arrow')
        xraction('Resume'); wait('!Vesperfall.component.paused'); xrpress('left',5); wait('Vesperfall.component.paused')
        check(True,'Tracked controllers can resume and pause normally after hand UI')
        page.evaluate('TestHands.mode(true)'); wait('Vesperfall.component.questHands.state.active')
        handaction('Exit VR'); wait('!Vesperfall.component.xr')
        after=page.evaluate('Object.fromEntries(Object.keys(localStorage).filter(k=>/profile|expedition|checkpoint/.test(k)).map(k=>[k,localStorage.getItem(k)]))')
        check(stored==after,'Hand-menu transitions and session exit preserve profile/checkpoint bytes')
        check(not errors,'No uncaught runtime errors during Surestep Xbox, controller and hand paths')
        check(not [e for e in console_errors if 'SHADER' in e.upper() or 'INVALID' in e.upper()], 'No invalid WebGL or shader operations')
        report={'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'consoleErrors':console_errors,
          'scope':'Actual WebGL, shipped UI and physical-draw logic exercised with emulated Xbox, Quest controllers and WebXR joints. Not physical hardware, comfort, tracking accuracy or frame-rate certification.'}
        (OUT/'report.json').write_text(json.dumps(report,indent=2))
    except Exception as exc:
        (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors,'consoleErrors':console_errors,'ui':page.evaluate('window.Vesperfall?({screen:Vesperfall.component.dominionControls.state.xrScreen,rows:Vesperfall.component.xrMenuRows.map(r=>r[0]),paused:Vesperfall.component.paused,hands:Vesperfall.component.questHands?.state.active,selection:Vesperfall.component.menuSelection,version:VesperCore.VERSION}):null')},indent=2))
        try: page.screenshot(path=str(OUT/'failure.png'))
        except Exception: pass
        raise
    finally:
        ctx.close(); browser.close()
