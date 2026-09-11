"""Verify the deployed GitHub Pages game in a fresh, unauthenticated browser."""
import hashlib, json, os, pathlib, time, urllib.request
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=pathlib.Path('frontier-evidence');OUT.mkdir(exist_ok=True)
BASE='https://v5ma.github.io/dino-atlas/'
release=os.environ.get('GITHUB_SHA','verification')
expected=hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
report={'url':BASE,'release':release,'checks':[],'errors':[]}
def check(name,value):
    report['checks'].append({'name':name,'passed':bool(value)})
    print(('PASS ' if value else 'FAIL ')+name,flush=True)
    if not value:raise AssertionError(name)
try:
    matched=False
    for attempt in range(24):
        try:
            request=urllib.request.Request(BASE+'index.html?release='+release+'&attempt='+str(attempt),headers={'Cache-Control':'no-cache','User-Agent':'Dino-Atlas-Deployment-Check'})
            with urllib.request.urlopen(request,timeout=15) as response:
                matched=hashlib.sha256(response.read()).hexdigest()==expected
            if matched:break
        except Exception as error:
            report['last_deployment_wait']=str(error)
        time.sleep(8)
    check('Published entry point matches the tested source',matched)
    with urllib.request.urlopen(BASE+'vendor/rapier.mjs',timeout=30) as response:
        check('Published physics module has a JavaScript MIME type',response.status==200 and 'javascript' in response.headers.get('Content-Type','').lower())
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        context=browser.new_context(viewport={'width':1280,'height':800})
        page=context.new_page();page.set_default_timeout(60000)
        page.on('pageerror',lambda error:report['errors'].append(str(error)))
        page.goto(BASE+'?release='+release,wait_until='networkidle')
        page.wait_for_function('window.__dinoRanger?.state.ready')
        check('Published game initializes actual WebGL',page.evaluate('window.__dinoRanger.state.triangles>10000'))
        page.screenshot(path=str(OUT/'published-intro.png'))
        page.click('#start-button')
        start=page.evaluate('window.__dinoRanger.state.position.z')
        page.keyboard.down('w')
        try:page.wait_for_function('(z)=>window.__dinoRanger.state.position.z<z-6',arg=start)
        finally:page.keyboard.up('w')
        check('Published jeep responds to real keyboard input',page.evaluate('window.__dinoRanger.state.position.z')<start-6)
        page.keyboard.down('Space')
        try:page.wait_for_function('Math.abs(window.__dinoRanger.state.speed)<.6')
        finally:page.keyboard.up('Space')
        page.screenshot(path=str(OUT/'published-driving.png'))
        page.keyboard.press('KeyV')
        page.wait_for_function('window.__dinoRanger.state.mode==="foot"')
        check('Published ranger can leave the jeep',page.evaluate('window.__dinoRanger.state.mode==="foot"'))
        check('Published expansion has 34 animals and six vehicles',page.evaluate('window.__dinoRanger.state.animals.length===34&&window.__dinoRanger.state.vehicles.length===6'))
        page.keyboard.press('KeyB')
        page.wait_for_selector('#orders-dialog[open]')
        check('Published ranger operations board works',page.locator('.order-card').count()==13)
        page.screenshot(path=str(OUT/'published-operations.png'))
        check('Published game has no uncaught JavaScript errors',not report['errors'])
        report['state']=page.evaluate('window.__dinoRanger.state')
        browser.close()
except Exception as error:
    report['failure']=str(error)
    raise
finally:
    (OUT/'published-report.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2),flush=True)
