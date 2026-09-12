"""Isolated fixture checks or real-game smoke checks. Mock only Gamepad input.
Fixture-only authority tests are explicitly not native route-completion evidence.
"""
import argparse, functools, http.server, json, os, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--fixture',action='store_true');args=parser.parse_args()
game=Path(__file__).resolve().parents[1]
root=game if args.fixture else game.parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
path='tests/flight-deck-fixture.html' if args.fixture else 'mario-maker-clone/svgn-paper-route/index.html'
base=f'http://127.0.0.1:{server.server_port}/{path}'
PAD="""window.testPad={id:'Automated standard-layout input',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>window.testPad.connected?[window.testPad]:[]});"""
checks=[];errors=[]; page=None
def check(value,label):
    if not value and page is not None:
        try:
            state=page.evaluate("({mode,won,paused:window.__delivery?.paused,menu:window.__delivery?.state.menu,route:window.__delivery?.state.route,focus:document.activeElement?.outerHTML?.slice(0,500),hasFocus:document.hasFocus(),panel:window.SkyCycleFlightDeck?.topPanel()?.id,keys,run:window.SkyCycleFlightDeck?.run})")
            print('FAILURE STATE:',json.dumps(state),flush=True)
            (out/('fixture-state.json' if args.fixture else 'native-state.json')).write_text(json.dumps(state,indent=2))
            page.screenshot(path=str(out/('fixture-failure.png' if args.fixture else 'native-failure.png')))
        except Exception as error: print('Capture error:',error,flush=True)
    assert value,label
    checks.append(label);print('PASS:',label,flush=True)
out=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-cycle-flight-deck'));out.mkdir(parents=True,exist_ok=True)
try:
 with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':1280,'height':900},service_workers='block')
    context.add_init_script(PAD)
    context.add_init_script("localStorage.setItem('fd-preservation-sentinel','keep');")
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    context.set_default_timeout(90000)
    page.goto(base,wait_until='domcontentloaded');page.bring_to_front()
    page.wait_for_function('!!window.SkyCycleFlightDeck',timeout=90000)
    if not args.fixture: page.wait_for_function("window.PaperDeliveryCampaign?.status==='ready'",timeout=90000)
    page.wait_for_timeout(500)
    def down(i):
        page.evaluate('(i)=>{testPad.buttons[i].pressed=true;testPad.buttons[i].value=1;}',i);page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
    def up(i):
        page.evaluate('(i)=>{testPad.buttons[i].pressed=false;testPad.buttons[i].value=0;}',i);page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
    def tap(i):down(i);up(i)
    def seek(predicate):
        for _ in range(40):
            if page.evaluate(predicate):return
            tap(5)
        raise AssertionError('Could not reach control: '+predicate)
    seek("document.activeElement.matches('[data-course]')")
    down(0)
    page.wait_for_function("mode==='play' && !!SkyCycleFlightDeck.run",timeout=20000)
    check(page.evaluate('!keys.Space'),'Selecting a route does not leak A into jump')
    up(0);before=page.evaluate('player.x');down(15);page.evaluate('new Promise(resolve=>{let n=0;function step(){if(++n>=8)resolve();else requestAnimationFrame(step)}requestAnimationFrame(step)})');check(page.evaluate('keys.ArrowRight'),'Controller throttle reaches live input state');up(15)
    check(page.evaluate('player.x')!=before,'Controller input moves the actual active rider')
    tap(9);check(page.evaluate("mode==='play' && __delivery.paused"),'Start pauses without entering the editor')
    frames=page.evaluate('SkyCycleFlightDeck.run.frames');page.wait_for_timeout(250)
    check(page.evaluate('SkyCycleFlightDeck.run.frames')==frames,'Contract timer stops while paused')
    seek("document.activeElement.textContent.trim()==='Sound & music'")
    tap(0);check(page.evaluate("document.getElementById('score-dialog').open"),'Controller opens the existing audio dialog')
    seek("document.activeElement.id==='score-music'")
    music=page.locator('#score-music').input_value();tap(15)
    check(page.locator('#score-music').input_value()!=music,'D-pad adjusts the music slider')
    tap(13);check(page.evaluate("document.activeElement.id==='score-effects'"),'D-pad moves to the effects slider')
    effects=page.locator('#score-effects').input_value();tap(14)
    check(page.locator('#score-effects').input_value()!=effects,'Effects volume adjusts independently')
    page.keyboard.press('Escape');page.wait_for_timeout(150)
    check(page.evaluate("!document.getElementById('score-dialog').open && __delivery.paused"),'Escape closes the modal without unpausing its parent')
    tap(8);check(page.evaluate("document.getElementById('flight-deck').open"),'View opens Flight Deck from a paused menu')
    seek("document.activeElement.id==='fd-controls'");tap(0)
    check(page.evaluate("SkyCycleFlightDeck.topPanel().id==='flight-deck-guide'"),'The most recently opened nested dialog owns focus')
    tap(1);check(page.evaluate("!document.getElementById('flight-deck-guide').open && document.getElementById('flight-deck').open"),'B closes only the top nested dialog')
    page.screenshot(path=str(out/('fixture-flight-deck.png' if args.fixture else 'native-flight-deck.png')))
    tap(1);check(page.evaluate("!document.getElementById('flight-deck').open && __delivery.paused"),'B returns from Flight Deck without resuming a previously paused game')
    tap(9);check(page.evaluate("mode==='play' && !__delivery.paused"),'Start resumes the same route')
    down(15);page.evaluate('testPad.connected=false');page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
    check(page.evaluate('!keys.ArrowRight && __delivery.paused'),'Controller disconnect releases throttle and pauses safely')
    page.evaluate('testPad.buttons.forEach(b=>{b.pressed=false;b.value=0});testPad.connected=true;');page.wait_for_timeout(250)
    check(page.evaluate('Object.keys(SkyCycleFlightDeck.records).length===0'),'No career badges are granted before a genuine finish')
    check(page.evaluate("localStorage.getItem('fd-preservation-sentinel')==='keep'"),'Unrelated saved data remains intact')
    if args.fixture:
        page.evaluate("__delivery.act('resume');win();")
        check(page.evaluate('Object.keys(SkyCycleFlightDeck.records).length===0'),'Fixture: a blocked engine win cannot grant badges')
        page.evaluate('allowWin=true;win();win();')
        check(page.evaluate('SkyCycleFlightDeck.records.flight.finishes===1'),'Fixture: accepted completion settles only once')
        page.evaluate("mode='edit';__delivery.state.code='different';startPlay();")
        check(page.evaluate('SkyCycleFlightDeck.run===null'),'Fixture: altered editor copies are excluded from career scoring')
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate('SkyCycleFlightDeck.show()');page.wait_for_timeout(150)
    check(page.evaluate("(()=>{const r=document.getElementById('flight-deck').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()"),'Flight Deck fits a narrow viewport')
    check(not errors,'No uncaught JavaScript exceptions')
    browser.close()
except Exception:
 if page is not None:
    try: page.screenshot(path=str(out/('fixture-failure.png' if args.fixture else 'native-failure.png')))
    except Exception: pass
 raise
finally:
 server.shutdown()
 (out/('fixture-report.json' if args.fixture else 'native-report.json')).write_text(json.dumps({'mode':'isolated-fixture' if args.fixture else 'real-game-smoke','commit':os.getenv('GITHUB_SHA'),'checks':checks,'pageErrors':errors},indent=2))
print('Completed',len(checks),'checks.',flush=True)
