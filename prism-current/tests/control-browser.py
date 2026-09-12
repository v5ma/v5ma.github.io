"""Real game/renderer/music in Chromium at quarter pixel ratio.
The standard pad is emulated; this is not physical-device or frame-rate QA.
"""
import json, os, pathlib
from playwright.sync_api import sync_playwright
OUT=pathlib.Path('test-output'); OUT.mkdir(exist_ok=True)
URL=os.environ.get('PRISM_URL','http://127.0.0.1:4173/prism-current/')
PAD="""window.testPad={id:'Acceptance standard pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}; Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.testPad?[window.testPad]:[]});"""
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('PRISM_CHROMIUM') or None,headless=True,args=['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page(viewport={'width':1280,'height':900},device_scale_factor=.25)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script(PAD)
    page.goto(URL,wait_until='domcontentloaded');page.wait_for_function('window.Prism?.snapshot().ready',timeout=60000)
    page.bring_to_front();page.keyboard.press('Shift');page.wait_for_function('Prism.snapshot().controller',timeout=10000)
    def press(button):
        # Present both edges across browser frames, not fixed wall-clock pulses
        # that can disappear between CPU-rendered WebGL frames.
        page.evaluate('''async b=>{const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));testPad.buttons[b]={pressed:true,value:1};await frames();testPad.buttons[b]={pressed:false,value:0};await frames();}''',button)
    try:
        press(8);assert page.locator('#mixer-panel').is_visible()
        assert page.locator('#mix-music').evaluate('(e)=>document.activeElement===e')
        press(14);assert page.locator('#mix-music').input_value()=='50'
        press(13);assert page.locator('#mix-effects').evaluate('(e)=>document.activeElement===e')
        press(14);assert page.locator('#mix-effects').input_value()=='17'
        for _ in range(5):press(13)
        assert page.locator('#sound-music').evaluate('(e)=>document.activeElement===e')
        press(0);assert page.locator('#mix-effects').input_value()=='0'
        assert page.locator('#mix-rate').input_value()=='off'
        page.screenshot(path=str(OUT/'control-room-mixer.png'))
        press(1);assert not page.locator('#mixer-panel').is_visible()
        press(9);page.wait_for_function("Prism.snapshot().phase==='playing'",timeout=45000)
        assert page.evaluate("Prism.snapshot().input")=='gamepad'
        assert page.evaluate("Prism.component.runMode")=='gamepad'
        assert page.evaluate("Prism.component.state.mode")=='keys'
        assert page.locator('#pad-lanes').is_visible()
        # Schedule an ordinary pad edge inside the browser; Python round trips
        # must not consume the 170 ms game timing window. No direct scoring call.
        timing=page.evaluate("""async()=>{
            const g=Prism.component,n=g.state.song.notes.find(n=>n.time>g.audio.time()+g.runOffset+.25);
            if(!n)throw Error('No upcoming note for controller acceptance');
            const b=[6,4,5,7][n.lane];let pressedAt=null;
            return await new Promise((resolve,reject)=>{
                const began=performance.now(),timer=setInterval(()=>{
                    const time=g.audio.time()+g.runOffset;
                    const stop=()=>{clearInterval(timer);testPad.buttons[b]={pressed:false,value:0};};
                    if(g.phase!=='playing'||performance.now()-began>15000){stop();reject(Error('Controller cue interrupted'));return;}
                    if(pressedAt===null&&time>=n.time-.055){pressedAt=time;testPad.buttons[b]={pressed:true,value:1};}
                    if(g.state.judged[n.id]||time>n.time+.2){
                        stop();
                        if(g.state.judged[n.id]!=='hit'){reject(Error('Controller missed cue at '+time));return;}
                        resolve({note:n.id,cue:n.time,pressedAt,judgment:g.state.judged[n.id]});
                    }
                },4);
            });
        }""")
        assert timing['judgment']=='hit'
        assert page.evaluate('Prism.component.state.hits')>=1
        press(9);assert page.evaluate('Prism.snapshot().phase')=='paused'
        before=page.evaluate('Prism.component.audio.time()');page.wait_for_timeout(300)
        assert abs(page.evaluate('Prism.component.audio.time()')-before)<.001
        press(8);page.keyboard.press('Shift+Tab');assert page.locator('#close-mixer').evaluate('(e)=>document.activeElement===e')
        page.keyboard.press('KeyP');assert page.evaluate('Prism.snapshot().phase')=='paused'
        assert page.locator('#hud').evaluate('(e)=>e.inert')
        press(1);assert page.evaluate('Prism.snapshot().phase')=='paused'
        assert not page.locator('#hud').evaluate('(e)=>e.inert')
        press(9);page.wait_for_function("Prism.snapshot().phase==='playing'")
        page.evaluate('window.testPad=null');page.wait_for_function("Prism.snapshot().phase==='paused'")
        assert 'disconnected' in page.evaluate('Prism.snapshot().message')
        page.evaluate(PAD);page.wait_for_function('Prism.snapshot().controller');page.wait_for_timeout(200)
        press(9);page.wait_for_function("Prism.snapshot().phase==='playing'");press(9)
        for _ in range(3):press(13)
        assert page.locator('#back').evaluate('(e)=>document.activeElement===e')
        press(0);assert page.evaluate('Prism.snapshot().phase')=='menu'
        assert page.evaluate("localStorage.getItem('prism-current.v1.records')") is None
        page.reload(wait_until='domcontentloaded');page.wait_for_function('window.Prism?.snapshot().ready')
        assert page.evaluate('Prism.snapshot().mixer.effects')==0
        assert page.evaluate('Prism.snapshot().mixer.rate')=='off'
        assert not errors,errors
        result={'passed':True,'scope':'Production renderer/music in Chromium at quarter pixel ratio; emulated standard controller','checks':['mixer navigation','independent volumes','music-only preset','pause transport','gamepad lane hit','focus trap','background input isolation','disconnect/reconnect','score isolation','preference reload'],'errors':errors,'timed_pad_input':timing}
        (OUT/'control-room-browser.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
    except Exception as e:
        (OUT/'control-room-failure.json').write_text(json.dumps({'error':str(e),'errors':errors,'state':page.evaluate('window.Prism?.snapshot()')},indent=2))
        page.screenshot(path=str(OUT/'control-room-failure.png'),full_page=True)
        print('SNAPSHOT',page.evaluate('window.Prism?.snapshot()'))
        print('ERRORS',errors)
        raise
    finally: browser.close()
