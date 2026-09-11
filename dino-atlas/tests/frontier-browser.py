"""Native Chromium/WebGL checks for Wild Frontier II.
Normal input drives all controls. Explicit test-only repositioning accelerates travel
between test locations; this is not an end-to-end human playthrough of the island.
"""
import json,os,subprocess,sys,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'frontier-evidence';OUT.mkdir(exist_ok=True)
BASE='http://127.0.0.1:4173'
checks=[];errors=[]
def check(value,name):
    assert value,name
    checks.append(name);print('PASS:',name,flush=True)
server=subprocess.Popen([sys.executable,'-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
with sync_playwright() as pw:
    launch={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
    if os.getenv('CHROMIUM_PATH'):launch['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**launch)
    ctx=browser.new_context(viewport={'width':1440,'height':960})
    ctx.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname=='127.0.0.1' or r.request.url.startswith(('data:','blob:')) else r.abort())
    ctx.add_init_script("""if(!localStorage.getItem('dino-atlas.progress.v1'))localStorage.setItem('dino-atlas.progress.v1',JSON.stringify({version:1,observed:['diplodocus'],excavated:[],quizzes:[],notes:{diplodocus:'Keep this earlier research note.'},digs:{}}));""")
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    def state():return page.evaluate('__dinoRanger.state')
    def wait(js,timeout=20000):page.wait_for_function(js,timeout=timeout)
    def tele(x,z,heading=3.14159265):page.evaluate('([x,z,h])=>__dinoRanger.teleport(x,z,h)',[x,z,heading]);page.wait_for_timeout(350)
    def hold(key,condition,timeout=18000):
        page.keyboard.down(key)
        try:wait(condition,timeout)
        finally:page.keyboard.up(key)
    def close_info():
        if page.locator('#info-dialog').get_attribute('open') is not None:page.locator('#info-dialog form button').click()
    def screenshot(name):page.screenshot(path=str(OUT/name))
    try:
        page.goto(BASE+'/dino-atlas/?test=1',wait_until='domcontentloaded');wait('window.__dinoRanger?.state.ready',90000)
        check(state()['drawCalls']>50 and state()['triangles']>10000,'Actual WebGL world renders with physical vehicles and vegetation')
        check(len(state()['animals'])==34 and len(state()['vehicles'])==6,'All 34 dinosaurs and six usable vehicles are initialized')
        screenshot('01-expanded-intro.png');page.locator('#start-button').click();page.wait_for_timeout(500)
        z=state()['position']['z'];hold('KeyW',f'__dinoRanger.state.position.z < {z-6}')
        hold('Space','Math.abs(__dinoRanger.state.speed)<1')
        check(state()['position']['z']<z-6,'Keyboard throttle drives the physical jeep')
        screenshot('02-jeep-and-helicopter.png');page.keyboard.press('KeyV');wait('__dinoRanger.state.mode==="foot"')
        p=state()['position'];hold('KeyW',f'Math.hypot(__dinoRanger.state.position.x-{p["x"]},__dinoRanger.state.position.z-{p["z"]})>1.5')
        check(state()['mode']=='foot','Ranger disembarks and walks with ordinary controls')
        j=state()['vehicles'][0]['position'];tele(j['x']+2.5,j['z']);page.keyboard.press('KeyV');wait('__dinoRanger.state.mode==="jeep"')
        tele(0,96);page.evaluate('__dinoRanger.flip()');wait('__dinoRanger.state.reserve.stats.recoveries>0',20000)
        check(abs(state()['position']['z']-96)<5 and state()['health']==100,'A flipped jeep auto-recovers in place without damage or a base reset')
        tele(22,49);hold('KeyW','__dinoRanger.state.reserve.stats.explosions>0',20000)
        check(any(c['spent'] for c in state()['crates']),'Driving into an orange crate triggers a real physical blast')
        page.wait_for_timeout(1800);screenshot('03-rollover-yard.png')
        tele(19,62);page.keyboard.press('KeyV');wait('__dinoRanger.state.mode==="foot"');tele(21.5,54)
        page.keyboard.press('KeyV');wait('__dinoRanger.state.mode==="helicopter"')
        hold('KeyQ','__dinoRanger.state.position.y>9');z=state()['position']['z'];hold('KeyW',f'__dinoRanger.state.position.z<{z-16}')
        page.keyboard.press('KeyV');check(state()['mode']=='helicopter','Airborne exit is rejected safely')
        screenshot('04-helicopter-flight.png');hold('KeyZ','__dinoRanger.state.position.y<2.2',25000)
        page.keyboard.press('KeyV');wait('__dinoRanger.state.mode==="foot"');check(state()['mode']=='foot','Helicopter lands and allows disembarking on clear ground')
        tele(-140,65);page.keyboard.press('KeyV');wait('__dinoRanger.state.mode==="boat"')
        z=state()['position']['z'];hold('KeyW',f'__dinoRanger.state.position.z<{z-18}',25000)
        check(state()['reserve']['stats']['sailing']>10,'Boat propulsion moves the launch through the lagoon')
        tele(-208,14);page.keyboard.press('KeyV');check(state()['mode']=='boat','Boat cannot disembark in deep open water')
        screenshot('05-lagoon-launch.png');tele(-208,-101);page.keyboard.press('KeyV');wait('__dinoRanger.state.mode==="foot"')
        tele(-208,-124);page.keyboard.press('KeyE');wait('document.querySelector("#info-dialog").open')
        check(state()['reserve']['checkpoint']=='lagoon-north','North Shore Dock saves a discovered outpost checkpoint')
        check(state()['water']==100 and state()['battery']>99,'Rest stops refill both management tools');close_info()
        # Fixture travel, but tools, prompts and their effects are ordinary input.
        a=next(a for a in state()['animals'] if a['uid']=='fern-0');tele(a['x'],a['z']+8)
        page.evaluate('([x,z])=>__dinoRanger.aim(x,z)',[a['x'],a['z']]);page.keyboard.press('Digit1');hold('KeyF','__dinoRanger.state.reserve.stats.water>0')
        check(state()['water']<100,'Water pressure consumes the tank and changes the animal behavior')
        a=next(a for a in state()['animals'] if a['uid']=='fern-0');tele(a['x'],a['z']+7);page.evaluate('([x,z])=>__dinoRanger.aim(x,z)',[a['x'],a['z']]);page.keyboard.press('Digit2');hold('KeyF','__dinoRanger.state.reserve.stats.zap>0')
        check(state()['battery']<99,'Short-range zapper consumes charge and herds the target')
        screenshot('06-ranger-herding-tools.png');page.keyboard.press('Digit4');hold('KeyF','__dinoRanger.state.reserve.observed.includes("parasaurolophus")')
        check('parasaurolophus' in state()['reserve']['observed'],'Scanner adds a new species to the persistent reserve register')
        tele(-100,115);page.keyboard.press('KeyE');wait('__dinoRanger.state.reserve.gates.fern===true')
        check(state()['reserve']['gates']['fern'],'Fern Hollow gate opens through its actual console')
        tele(-82,115);page.keyboard.press('KeyE');wait('__dinoRanger.state.reserve.fed.includes("fern")')
        wait('__dinoRanger.state.animals.filter(a=>a.pen==="fern").every(a=>a.x> -121&&a.x< -61&&a.z>61&&a.z<109)',45000)
        tele(-100,115);page.keyboard.press('KeyE');wait('__dinoRanger.state.reserve.secured.includes("fern")')
        check(state()['reserve']['gates']['fern']==False,'Feeder returns the real stray and closing the gate secures all four residents')
        screenshot('07-fern-enclosure.png')
        page.keyboard.press('KeyB');wait('document.querySelector("#orders-dialog").open');check(page.locator('.order-card').count()==13,'Orders board exposes thirteen playable assignments')
        page.locator('[data-track="flight"]').click();wait('__dinoRanger.state.reserve.tracked==="flight"')
        tele(-131,65);page.keyboard.press('KeyE');wait('document.querySelector("#info-dialog").open');close_info()
        check('lakeside' in state()['reserve']['outposts'],'A second outpost becomes an active rest and resume point')
        # Existing campaign regression, using fixtures only for travel.
        tele(0,24);wait('__dinoRanger.state.stage===1')
        a=next(a for a in state()['animals'] if a['id']=='diplodocus');tele(a['x'],a['z']+6);page.keyboard.press('KeyE');wait('__dinoRanger.state.stage===2');close_info()
        tele(31,-20);page.keyboard.press('KeyE');wait('__dinoRanger.state.stage===3')
        tele(47,-49);page.keyboard.press('KeyE');wait('__dinoRanger.state.stage===4');close_info()
        tele(0,51);page.keyboard.press('KeyE');wait('__dinoRanger.state.stage===5');close_info()
        check(state()['stage']==5,'The original five-stage expedition remains completable')
        old=page.evaluate('JSON.parse(localStorage.getItem("dino-atlas.progress.v1"))');check(old['notes']['diplodocus']=='Keep this earlier research note.','Previously saved journal notes survive new observations')
        page.keyboard.press('KeyM');wait('document.querySelector("#map-dialog").open');screenshot('08-whole-reserve-map.png');page.locator('#map-dialog form button').click()
        page.keyboard.press('Escape');wait('document.querySelector("#menu-dialog").open');before=state()['position'];page.wait_for_timeout(800);check(state()['position']==before,'Pause freezes the simulation');page.locator('#menu-dialog form button').click()
        page.reload(wait_until='domcontentloaded');wait('window.__dinoRanger?.state.ready',90000)
        check(state()['stage']==5 and state()['reserve']['checkpoint']=='lakeside','Reload retains both campaign progress and the last outpost')
        check('parasaurolophus' in state()['reserve']['observed'] and 'fern' in state()['reserve']['secured'],'Extra species, feeder and secured-enclosure records survive reload')
        phone=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        mobile=phone.new_page();mobile.on('pageerror',lambda e:errors.append('mobile: '+str(e)));mobile.goto(BASE+'/dino-atlas/',wait_until='domcontentloaded');mobile.wait_for_function('window.__dinoRanger?.state.ready',timeout=90000);mobile.locator('#start-button').tap();mobile.wait_for_timeout(500)
        check(not mobile.evaluate('document.documentElement.scrollWidth>innerWidth'),'Operations interface fits a phone viewport without horizontal overflow')
        check(mobile.locator('[data-drive="fire"]').is_visible() and mobile.locator('#vehicle-button').is_visible(),'Mobile players can use tools and enter or leave vehicles')
        box=mobile.locator('[data-drive="forward"]').bounding_box();cdp=phone.new_cdp_session(mobile);z=mobile.evaluate('__dinoRanger.state.position.z')
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':box['x']+box['width']/2,'y':box['y']+box['height']/2}]})
        try:mobile.wait_for_function(f'__dinoRanger.state.position.z<{z-1}',timeout=18000)
        finally:cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        check(mobile.evaluate('__dinoRanger.state.position.z')<z-1,'Emulated touch pedal drives the actual physics vehicle')
        mobile.screenshot(path=str(OUT/'09-mobile-controls.png'));phone.close()
        check(not errors,'Desktop and mobile flows have no uncaught JavaScript errors')
        report={'passed':len(checks),'checks':checks,'errors':errors,'mode':'Native Chromium HTTP / SwiftShader WebGL','limitations':'Station travel uses explicit test-only repositioning. No complete human playthrough, physical phone, physical gamepad or Safari certification.'}
        (OUT/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
    except Exception as e:
        diagnostic=None
        try:diagnostic=state();screenshot('failure.png')
        except Exception:pass
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':diagnostic},indent=2));raise
    finally:browser.close();server.terminate()
