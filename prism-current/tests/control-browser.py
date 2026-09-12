"""Real game/renderer/music in Chromium; emulated standard pad, not hardware QA."""
import json, os, pathlib
from playwright.sync_api import sync_playwright
OUT=pathlib.Path('test-output'); OUT.mkdir(exist_ok=True)
URL=os.environ.get('PRISM_URL','http://127.0.0.1:4173/prism-current/')
PAD="""window.testPad={id:'Acceptance standard pad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}; Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.testPad?[window.testPad]:[]});"""
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('PRISM_CHROMIUM') or None,headless=True,args=['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required'])
    page=browser.new_page(viewport={'width':1280,'height':900})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script(PAD)
    page.goto(URL,wait_until='domcontentloaded');page.wait_for_function('window.Prism?.snapshot().ready',timeout=60000)
    page.bring_to_front();page.keyboard.press('Shift');page.wait_for_function('Prism.snapshot().controller',timeout=10000)
    def press(button):
        page.evaluate('(b)=>{testPad.buttons[b]={pressed:true,value:1}}',button);page.wait_for_timeout(120)
        page.evaluate('(b)=>{testPad.buttons[b]={pressed:false,value:0}}',button);page.wait_for_timeout(150)
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
        page.wait_for_function("Prism.component.audio.time() >= Prism.component.state.song.notes[0].time - .035",timeout=20000)
        lane=page.evaluate('Prism.component.state.song.notes[0].lane');press([6,4,5,7][lane])
        assert page.evaluate('Prism.component.state.hits')>=1
        press(9);assert page.evaluate('Prism.snapshot().phase')=='paused'
        before=page.evaluate('Prism.component.audio.time()');page.wait_for_timeout(300)
        assert abs(page.evaluate('Prism.component.audio.time()')-before)<.001
        press(8);page.keyboard.press('Shift+Tab');assert page.locator('#close-mixer').evaluate('(e)=>document.activeElement===e')
        press(1);assert page.evaluate('Prism.snapshot().phase')=='paused'
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
        result={'passed':True,'scope':'Production renderer/music in Chromium; emulated standard controller','checks':['mixer navigation','independent volumes','music-only preset','pause transport','gamepad lane hit','focus trap','disconnect/reconnect','score isolation','preference reload'],'errors':errors}
        (OUT/'control-room-browser.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
    except Exception:
        page.screenshot(path=str(OUT/'control-room-failure.png'),full_page=True)
        print('SNAPSHOT',page.evaluate('window.Prism?.snapshot()'))
        print('ERRORS',errors)
        raise
    finally: browser.close()
