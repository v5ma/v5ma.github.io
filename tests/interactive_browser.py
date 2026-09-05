"""Native HTTP browser validation for the three public projects.
Run a static server at PORT=4173 before invoking this file. The GitHub runner
uses real ES modules and software-rendered WebGL, not an inline/mock harness.
External services are blocked: these tests never write to live game accounts.
"""
from pathlib import Path
import json, os
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-output';OUT.mkdir(exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[]
def check(value,name):
    assert value,name
    checks.append(name);print('PASS:',name,flush=True)
def visual(page,selector,name):
    file=OUT/name
    page.locator(selector).screenshot(path=str(file),timeout=30000)
    image=Image.open(file).convert('RGB').resize((120,80))
    check(len(set(image.getdata()))>100,name+' contains rendered graphics')

with sync_playwright() as p:
    kw={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
    if os.getenv('CHROMIUM_PATH'):kw['executable_path']=os.environ['CHROMIUM_PATH']
    browser=p.chromium.launch(**kw)
    context=browser.new_context(viewport={'width':1440,'height':960},device_scale_factor=1)
    allowed=urlparse(BASE).hostname
    context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==allowed or r.request.url.startswith(('data:','blob:')) else r.abort())
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        page.goto(BASE+'/index.html',wait_until='networkidle')
        check(page.locator('.project').count()==3,'Homepage presents three projects')
        for href in ['mario-maker-clone/svgn-paper-route/index.html','theology-wiki/san-reader.html','dino-atlas/index.html']:
            check(page.locator('a.primary-link[href="./'+href+'"]').count()==1,'Homepage links to '+href)
        page.screenshot(path=str(OUT/'homepage.png'),full_page=True)
        import subprocess,sys
        # Validate the current main game and current Create workflow. The older
        # expert regression assumes Create opens the legacy palette, which is
        # now intentionally available through the explicit advanced-editor link.
        subprocess.run([sys.executable,str(ROOT/'tests/sky_network_browser.py')],check=True,env={**os.environ,'NETWORK_SUITE':'flight'})
        check((OUT/'network-flight/report.json').exists(),'The connected-world 3D route completes through ordinary controls')
        subprocess.run([sys.executable,str(ROOT/'tests/workshop_browser.py')],check=True,env={**os.environ,'WORKSHOP_SUITE':'authoring'})
        check((OUT/'workshop-authoring/report.json').exists(),'The current Workshop authoring, saves and imports pass')

        page.goto(BASE+'/dino-atlas/index.html',wait_until='domcontentloaded')
        page.wait_for_function('!!window.__dinoExpedition&&window.__dinoExpedition.ready',timeout=90000)
        check(page.evaluate('__dinoExpedition.state.mode==="3d"'),'Dino expedition initializes actual WebGL 3D')
        page.wait_for_timeout(400);visual(page,'#field-3d','dinosaur-3d-scene.png')
        page.screenshot(path=str(OUT/'dinosaur-3d.png'))
        page.locator('#mode-2d').click()
        page.wait_for_function('__dinoExpedition.state.mode==="2d"')
        page.locator('#field-2d').focus()
        pos=page.evaluate('({...__dinoExpedition.state.position})')
        # Software GPU frame pacing is not wall-clock deterministic. Hold a real
        # key until the visible game state advances, with a bounded timeout.
        page.keyboard.down('KeyW')
        try:page.wait_for_function('(z)=>__dinoExpedition.state.position.z<z-1',arg=pos['z'],timeout=12000)
        finally:page.keyboard.up('KeyW')
        check(page.evaluate('__dinoExpedition.state.position.z')<pos['z']-1,'Explorer walks in the shared 2D world')
        page.evaluate('__dinoExpedition.state.position={x:10,z:10}')
        page.wait_for_function('__dinoExpedition.state.near?.id==="tracks"')
        page.locator('#inspect').click();page.wait_for_selector('#discovery[open]')
        check(page.locator('#discovery-content').inner_text().lower().find('track')>=0,'Evidence site opens its scientific clue')
        page.locator('#discovery form button').click()
        check(page.evaluate('__dinoExpedition.state.clues.has("jurassic:tracks")'),'Evidence discovery persists in the expedition')
        page.evaluate('''async()=>{const c=await import('./expedition-core.js');const s=__dinoExpedition.state;const p=c.animalPose(0,s.time);s.position={x:p.x,z:p.z};}''')
        page.wait_for_function('__dinoExpedition.state.near?.id==="diplodocus"')
        page.locator('#inspect').click();page.wait_for_selector('#discovery[open]')
        check(page.evaluate('__dinoExpedition.state.progress.observed.includes("diplodocus")'),'Observing a dinosaur records it in the shared journal')
        page.locator('#discovery form button').click();page.locator('#mode-3d').click()
        check(page.evaluate('__dinoExpedition.state.progress.observed.includes("diplodocus")'),'Switching view retains expedition progress')
        page.locator('[data-period="cretaceous"]').click()
        check(page.evaluate('__dinoExpedition.state.period==="cretaceous"'),'Time machine changes the landscape chapter')
        page.goto(BASE+'/dino-atlas/field-guide.html#journal',wait_until='networkidle')
        check(page.locator('.journal-card').count()>=1,'Field guide reads the expedition journal')
        check('Diplodocus' in page.locator('.journal-card').inner_text(),'Expedition discovery is present in the journal UI')
        check(not errors,'Dinosaur interaction flow has no uncaught JavaScript errors')

        page.goto(BASE+'/theology-wiki/san-reader.html?page=home',wait_until='networkidle')
        page.wait_for_function('document.querySelector("#article-body").innerText.length>500',timeout=30000)
        check('wiki-theme-san' in page.locator('body').get_attribute('class'),'Theology uses the actual SAN reader shell')
        check('Theology' in page.locator('#article-title').inner_text(),'Theology home Markdown loads into the reader')
        page.screenshot(path=str(OUT/'theology-san-reader.png'),full_page=True)
        page.locator('#page-search').fill('gnosticism');page.wait_for_timeout(250)
        links=page.locator('.navigation-panel a[href*="page="]')
        check(links.count()>0,'Wiki search finds indexed theology pages')
        links.first.click();page.wait_for_timeout(800)
        check('page=home' not in page.url,'Wiki navigation opens an indexed article')
        check('could not' not in page.locator('#article-body').inner_text().lower()[:120],'Linked article loads rather than a fetch error')
        check(not errors,'Wiki flow has no uncaught JavaScript errors')
        phone=context.browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        phone.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==allowed or r.request.url.startswith(('data:','blob:')) else r.abort())
        mobile=phone.new_page();mobile.goto(BASE+'/index.html',wait_until='networkidle')
        check(not mobile.evaluate('document.documentElement.scrollWidth>innerWidth'),'Project homepage fits a phone viewport')
        mobile.screenshot(path=str(OUT/'homepage-mobile.png'),full_page=True)
        mobile.goto(BASE+'/dino-atlas/index.html',wait_until='domcontentloaded');mobile.wait_for_function('!!window.__dinoExpedition')
        mobile.locator('#mode-2d').tap();mobile.wait_for_timeout(200)
        check(not mobile.evaluate('document.documentElement.scrollWidth>innerWidth'),'Dinosaur UI fits a phone viewport')
        mobile.screenshot(path=str(OUT/'dinosaur-mobile.png'))
        phone.close()
        result={'passed':len(checks),'checks':checks,'uncaught_errors':errors,'webgl_verified':True,'mode':'Native Chromium HTTP / SwiftShader WebGL','limitations':'The game uses ordinary keyboard/UI input; dinosaur discovery checks retain controlled position fixtures. No live accounts, payments, cloud saves, hardware gamepads, Safari or real phones tested.'}
        (OUT/'report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
    except Exception as e:
        diagnostic=None
        try:diagnostic=page.evaluate('window.__dinoExpedition?({position:__dinoExpedition.state.position,mode:__dinoExpedition.state.mode,walking:__dinoExpedition.state.walking,time:__dinoExpedition.state.time,hidden:document.hidden,focus:document.activeElement?.id}):null')
        except Exception:pass
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'passed':checks,'uncaught_errors':errors,'diagnostic':diagnostic},indent=2))
        try:page.screenshot(path=str(OUT/'failure.png'),full_page=True)
        except Exception:pass
        raise
    finally:browser.close()
