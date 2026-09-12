"""Read-only integration checks. --fixture uses a deliberately stubbed engine.
The default suite exercises the native 3D scene with standard controller input.
It never sets a win, teleports the rider, or changes physics or rendering mode.
"""
import argparse,functools,http.server,json,os,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--fixture',action='store_true');args=parser.parse_args()
game=Path(__file__).resolve().parents[1];root=game if args.fixture else game.parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'+('tests/route-compass-fixture.html' if args.fixture else 'mario-maker-clone/svgn-paper-route/index.html')
out=Path(os.getenv('ARTIFACT_DIR','/tmp/sky-cycle-compass'));out.mkdir(parents=True,exist_ok=True)
label='fixture' if args.fixture else 'native';checks=[];errors=[];success=False
PAD="window.testPad={id:'Standard controller test input',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>testPad.connected?[testPad]:[]});"
def check(value,message):
    assert value,message
    checks.append(message);print('PASS:',message,flush=True)
try:
 with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':1280,'height':900},service_workers='block')
    context.add_init_script("localStorage.setItem('compass-preservation-sentinel','keep');")
    if not args.fixture:context.add_init_script(PAD)
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(90000)
    try:
        page.goto(url,wait_until='domcontentloaded');page.bring_to_front();page.wait_for_function('!!window.SkyCycleCompass')
        if args.fixture:
            check(page.evaluate('SkyCycleCompass.run===null'),'Fixture: late loading does not invent an observed run')
            page.evaluate('startPlay();stepPlayer();')
            check(page.evaluate('SkyCycleCompass.run.seen.includes("district:0")'),'Fixture: native step hook records a district')
            page.evaluate('win()');check(page.evaluate('Object.keys(SkyCycleCompass.records).length===0'),'Fixture: rejected win banks no stamps')
            page.evaluate('allowWin=true;win();win();')
            check(page.evaluate('SkyCycleCompass.records["first-neighborhood"].finishes===1'),'Fixture: accepted finish banks exactly once')
            page.locator('#sc-journal-open').click();check(page.locator('#sc-journal-content').inner_text().count('BANKED')>0,'Fixture: journal shows banked discoveries')
            page.locator('#sc-guidance').click();check(page.evaluate('SkyCycleCompass.preference==="compact"'),'Fixture: density switches to compact')
            page.locator('#sc-guidance').click();check(page.evaluate('SkyCycleCompass.preference==="off"'),'Fixture: guidance can be switched off')
            page.keyboard.press('Escape');check(page.evaluate('!document.getElementById("sc-journal").open'),'Fixture: Escape closes journal')
            page.evaluate("loadCode('edited');startPlay();stepPlayer();")
            check(page.evaluate('SkyCycleCompass.run===null'),'Fixture: edited routes cannot create exploration records')
            page.evaluate("loadCode('authored');startPlay();stepPlayer();Storage.prototype.setItem=function(){throw Error('storage denied');};win();")
            page.locator('#sc-journal-open').click();check('unavailable' in page.locator('#sc-journal-status').inner_text(),'Fixture: failed persistence is visible')
        else:
            page.wait_for_function('!!window.SkyCycleFlightDeck && PaperDeliveryCampaign.status==="ready"')
            def frames():page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
            def tap(i):
                frames();page.evaluate('(i)=>{testPad.buttons[i]={pressed:true,value:1};}',i);frames();page.evaluate('(i)=>{testPad.buttons[i]={pressed:false,value:0};}',i);frames()
            def seek(predicate):
                if page.evaluate(predicate):return
                # Exercise the real held-stick repeat. Stop in the matching browser
                # frame, rather than spending six rendered frames per bumper tap.
                frames();page.evaluate('testPad.axes[1]=0.9')
                try:
                    page.wait_for_function('()=>{if('+predicate+'){testPad.axes[1]=0;return true;}return false;}',timeout=90000)
                finally:
                    page.evaluate('testPad.axes[1]=0');frames()
            seek('document.activeElement.matches(\'[data-course="4"]\')');tap(0)
            page.wait_for_function('!!SkyCycleCompass.run && SkyCycleCompass.run.steps>0')
            check(page.evaluate('SkyCycleCompass.run.id==="first-neighborhood"'),'Native: Sunrise Borough starts with an observed exploration run')
            before=page.evaluate('player.x');tap(15)
            check(page.evaluate('player.x')!=before,'Native: controller moves the real rider')
            check(page.evaluate('SkyCycleCompass.run.seen.includes("district:0")'),'Native: real simulation records the first district')
            page.wait_for_function('!document.getElementById("sc-compass").hidden')
            check(page.evaluate('(()=>{const a=document.getElementById("sc-compass").getBoundingClientRect(),b=document.querySelector("#cloud-hud .cloud-loop").getBoundingClientRect();return a.top>=b.bottom+4;})()'),'Native: compass clears existing route and speed instruments')
            page.screenshot(path=str(out/'native-compass.png'))
            tap(9);seek('document.activeElement.id==="sc-journal-pause"');tap(0)
            check(page.evaluate('document.getElementById("sc-journal").open && __delivery.paused'),'Native: controller opens journal without resuming the route')
            seek('document.activeElement.matches(".sc-stamps article")')
            check(page.evaluate('document.activeElement.textContent.includes("Post Office Green")'),'Native: controller focuses discovery entries for reading')
            seek('document.activeElement.id==="sc-guidance"');tap(0)
            check(page.evaluate('SkyCycleCompass.preference==="compact"'),'Native: controller changes guidance density')
            tap(0);check(page.evaluate('SkyCycleCompass.preference==="off"'),'Native: controller disables guidance');tap(0)
            page.screenshot(path=str(out/'native-journal.png'))
            tap(1);check(page.evaluate('!document.getElementById("sc-journal").open && __delivery.paused'),'Native: B returns to the paused parent')
            tap(8);seek('document.activeElement.id==="sc-journal-deck"');tap(0)
            check(page.evaluate('SkyCycleFlightDeck.topPanel().id==="sc-journal"'),'Native: nested journal owns controller focus')
            tap(1);check(page.evaluate('document.getElementById("flight-deck").open && !document.getElementById("sc-journal").open'),'Native: B closes only the nested journal');tap(1)
            check(page.evaluate('Object.keys(SkyCycleCompass.records).length===0'),'Native: no stamps are banked without a completed route')
            page.locator('#sc-journal-pause').click()
        page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(out/(label+'-journal-mobile.png')))
        check(page.evaluate('(()=>{const r=document.getElementById("sc-journal").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()'),'Journal fits the narrow viewport')
        check(page.evaluate('localStorage.getItem("compass-preservation-sentinel")==="keep"'),'Unrelated saved data remains intact')
        check(not errors,'No uncaught JavaScript exceptions');success=True
    finally:
        if not success:
            try:
                page.screenshot(path=str(out/(label+'-failure.png')))
                (out/(label+'-state.json')).write_text(json.dumps(page.evaluate('({focus:document.activeElement?.outerHTML,panel:window.SkyCycleFlightDeck?.topPanel()?.id,paused:window.__delivery?.paused,visible:!document.hidden,focused:document.hasFocus(),run:window.SkyCycleCompass?.run})'),indent=2))
            except Exception:pass
        browser.close()
finally:
 server.shutdown();(out/(label+'-report.json')).write_text(json.dumps({'commit':os.getenv('GITHUB_SHA'),'mode':label,'passed':success,'checks':checks,'pageErrors':errors,'rendererNotes':'Default native 3D renderer; CPU-only smoke test, not a performance certification.' if not args.fixture else 'Isolated fixture; not native gameplay evidence.'},indent=2))
