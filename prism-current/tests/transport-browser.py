"""Native playback with controlled AudioContext promise delivery and emulated XR.
The gate delays the real audio-resume promise; it never fabricates game progress,
changes the game clock, or calls the game's Start/Resume methods directly.
"""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/transport-recovery';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[]
def check(ok,text):
    assert ok,text
    checks.append(text);print('PASS',text,flush=True)
GATE="""()=>{
 const audio=AFRAME.scenes[0].components['river-game'].audio.a;
 const original=audio.resume,gate={waiting:false,release:null};
 audio.resume=function(){audio.resume=original;return original.call(audio).then(()=>new Promise(resolve=>{gate.waiting=true;gate.release=resolve;}));};
 window.NativeAudioGate=gate;
}"""
with sync_playwright() as pw:
    opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
    if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    b=pw.chromium.launch(**opts)
    try:
        for mode in ['ar','vr']:
            ctx=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
            ctx.add_init_script((ROOT/'prism-current/tests/river-fake-xr.js').read_text()+'\n'+(ROOT/'prism-current/tests/river-strict-xr.js').read_text())
            p=ctx.new_page();p.set_default_timeout(45000)
            p.on('pageerror',lambda e:errors.append(str(e)))
            p.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader Error' in m.text else None)
            def snap():return p.evaluate('River.snapshot()')
            def button(index=5):
                p.evaluate('''async i=>{const s=TestXR.state.session;
                 const frames=()=>new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('XR frame unavailable')),5000);s.requestAnimationFrame(()=>s.requestAnimationFrame(()=>{clearTimeout(timeout);resolve();}));});
                 TestXR.button('right',i,false);await frames();TestXR.button('right',i,true);await frames();TestXR.button('right',i,false);await frames();}''',index)
            p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2')
            p.wait_for_function('(id)=>!document.getElementById(id).disabled',arg='enter-'+mode);p.locator('#enter-'+mode).click()
            p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated&&River.snapshot().xrUI.trackedControllers===2')
            p.evaluate('TestXR.away()');button();p.wait_for_function("River.snapshot().phase==='playing'")
            p.wait_for_function('River.snapshot().time>.4');button();p.wait_for_function("River.snapshot().phase==='paused'")
            before=snap();p.evaluate(GATE);button();p.wait_for_function('NativeAudioGate.waiting&&River.snapshot().busy')
            check(snap()['phase']=='paused',mode+': pending native audio resume has not yet started combat')
            p.evaluate('TestXR.hide(true)');p.wait_for_function('!River.snapshot().busy')
            check(snap()['phase']=='paused' and snap()['result']==before['result'],mode+': hidden headset interrupts Resume without resetting the encounter')
            # Restore visibility BEFORE resolving the old audio promise: recovery
            # must still require another deliberate input, not just a visible view.
            p.evaluate('TestXR.hide(false);NativeAudioGate.release()');p.wait_for_timeout(350)
            check(snap()['phase']=='paused' and snap()['time']==before['time'],mode+': late audio resolution after visibility recovery cannot auto-resume')
            check(p.evaluate("!AFRAME.scenes[0].components['river-game'].audio.playing"),mode+': interrupted native soundtrack remains stopped')
            button();p.wait_for_function("River.snapshot().phase==='playing'")
            p.wait_for_function('(t)=>River.snapshot().time>t+.2',arg=before['time'])
            check(snap()['mode']==mode,mode+': a fresh B/Y press resumes the same input mode and battle')
            button();p.wait_for_function("River.snapshot().phase==='paused'");before=snap()
            p.evaluate(GATE);button();p.wait_for_function('NativeAudioGate.waiting&&River.snapshot().busy')
            p.evaluate('TestXR.state.session.end()');p.wait_for_function('!River.snapshot().immersive&&!River.snapshot().busy')
            p.evaluate('NativeAudioGate.release()');p.wait_for_timeout(350)
            check(snap()['phase']=='paused' and snap()['result']==before['result'],mode+': ending XR cancels pending playback and preserves progress')
            check(p.evaluate("!AFRAME.scenes[0].components['river-game'].audio.playing"),mode+': no old soundtrack starts after the immersive session ends')
            # A preserved run returns to the paused screen, not the chapter menu.
            # Its actual Resume control deliberately re-enters the recorded XR mode.
            p.locator('#resume').click();p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated&&River.snapshot().xrUI.trackedControllers===2')
            check(snap()['phase']=='paused' and snap()['time']==before['time'],mode+': same-mode re-entry does not silently start the suspended run')
            p.evaluate('TestXR.away()');button();p.wait_for_function("River.snapshot().phase==='playing'")
            check(snap()['mode']==mode,mode+': the recovered battle remains deliberately resumable')
            p.evaluate('TestXR.state.session.end()');p.wait_for_function('!River.snapshot().immersive');ctx.close()
        check(not errors,'No uncaught script or shader errors in interruption-recovery checks')
        (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Production WebGL/audio with an explicitly controlled native AudioContext-resume promise and emulated XR visibility/end events. Uses normal menu buttons and no game-state, score, health, position or clock assignments. Not physical headset or sustained performance acceptance.'},indent=2))
    except Exception as exc:
        try:state=p.evaluate('window.River?.snapshot()')
        except:state=None
        (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors,'snapshot':state},indent=2))
        try:p.screenshot(path=str(OUT/'failure.png'))
        except:pass
        raise
    finally:b.close()
