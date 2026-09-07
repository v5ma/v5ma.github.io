"""Homepage-to-game acceptance, also usable against the actual public site.
The game is controlled through real links, buttons, pointer and keyboard input.
No live position, velocity, score or progression values are assigned.
"""
import json, os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
MODE=os.getenv('ENTRY_VIEW','desktop')
OUT=ROOT/'test-output'/('entry-'+MODE);OUT.mkdir(parents=True,exist_ok=True)
manifest=json.loads((ROOT/'mario-maker-clone/svgn-paper-route/release.json').read_text())
checks=[];errors=[]
def check(ok, text):
    assert ok, text
    checks.append(text);print('PASS:',text,flush=True)
with sync_playwright() as p:
    args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
    if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
    browser=p.chromium.launch(**args)
    context=browser.new_context(viewport={'width':390,'height':844} if MODE=='mobile' else {'width':1440,'height':940},has_touch=MODE=='mobile',service_workers='block',accept_downloads=True)
    context.add_init_script("localStorage.setItem('sprocket_muted','1')")
    host=urlparse(BASE).hostname
    context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
    page=context.new_page();page.set_default_timeout(90000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('dialog',lambda dialog:dialog.accept())
    try:
        page.goto(BASE+'/',wait_until='domcontentloaded')
        link=page.locator('#paper-delivery-launch')
        check(link.is_visible() and link.get_attribute('href')=='./mario-maker-clone/svgn-paper-route/index.html','The homepage shortcut points to the actual side-scrolling application')
        box=link.bounding_box()
        check(box['y']>=0 and box['y']+box['height']<=page.viewport_size['height'],'The play shortcut is visible without scrolling past other projects')
        check(page.locator('#paper-delivery .primary-link').get_attribute('href')==link.get_attribute('href'),'The project card and top shortcut use the same game URL')
        check(page.locator('.project.planet .primary-link').get_attribute('href')=='./svgn-planet/index.html','The independent 3D neighborhood link is preserved')
        check(page.locator('.project.theology .primary-link').count()==1 and page.locator('.project.dinosaur .primary-link').count()==1,'The Theology and Dino Atlas menu entries remain')
        check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Homepage navigation fits the viewport')
        page.screenshot(path=str(OUT/'homepage.png'))
        link.click()
        page.wait_for_url('**/mario-maker-clone/svgn-paper-route/index.html')
        page.wait_for_function('window.PaperDeliveryCampaign?.status==="ready"&&window.SkyRelayReady&&window.__gpuReady===true')
        check(page.locator('#rail-build').inner_text()=='v'+manifest['version'],'The homepage opens the installed release version')
        check(page.evaluate('PaperDeliveryRelease.build')==manifest['build'],'The running build matches the source manifest')
        page.locator('[data-course="4"]').click()
        page.wait_for_function('SkyRelay.active()&&player.onGround')
        check(page.evaluate('tracks.length===16&&tracks.some(t=>t.sky.id===SkyRelay.ID)&&__grapple.pegs().some(p=>p.id===SkyRelay.PEG.id)'),'The actual campaign contains the new receiving rail and relay peg')
        check(page.evaluate('__merged.camera.isPerspectiveCamera&&__delivery.state.view==="3d"'),'The route starts in the real 3D renderer')
        page.screenshot(path=str(OUT/'online-game.png'))
        if MODE=='desktop':
            page.locator('#cv').focus();page.keyboard.down('KeyD');page.wait_for_function('player.x>220',timeout=40000);page.keyboard.up('KeyD')
            check(page.evaluate('tries===1&&!won'),'Ordinary movement advances the live player without retry or forced completion')
            page.locator('#delivery-header [data-delivery="editor"]').click();page.wait_for_function('RouteWorkshop.active')
            page.locator('#maker-route').select_option('4');page.locator('#route-workshop [data-mk="route"]').click()
            check(page.evaluate('RouteWorkshop.state.doc.paths.length===16'),'Create loads the same expanded sixteen-surface level')
            original=page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')
            page.locator('#maker-outline [data-track="15"]').click();page.locator('#route-workshop [data-mk="focus"]').click()
            page.locator('#maker-x').fill('5268');page.locator('#maker-x').press('Tab')
            check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')!=original,'The published relay surface can be moved in the Workshop')
            page.locator('#route-workshop [data-mk="undo"]').click()
            check(page.evaluate('WorkshopCore.encode(RouteWorkshop.state.doc)')==original,'Undo restores the entire curve and its metadata')
            with page.expect_download() as event:page.locator('#route-workshop [data-mk="export"]').click()
            event.value.save_as(OUT/'Cloudpost-Sunrise.route')
            check((OUT/'Cloudpost-Sunrise.route').read_text()==original,'The browser exports the exact edited level document')
            page.screenshot(path=str(OUT/'online-workshop.png'))
            page.locator('#route-workshop [data-mk="exit"]').click()
        page.locator('#delivery-header a[href="../../index.html"]').click()
        page.wait_for_url(BASE+'/index.html')
        check(page.locator('#paper-delivery-launch').is_visible(),'All projects returns to the working homepage menu')
        check(not errors,'No uncaught errors in the homepage, game and editor navigation')
        (OUT/'report.json').write_text(json.dumps({'base':BASE,'view':MODE,'version':manifest['version'],'build':manifest['build'],'passed':len(checks),'checks':checks,'errors':errors,'scope':'Native Chromium / software WebGL. Real URL navigation and ordinary controls; viewport checks are not a physical-phone performance certification.'},indent=2))
    except Exception as error:
        (OUT/'failure.json').write_text(json.dumps({'url':page.url,'error':str(error),'checks':checks,'errors':errors},indent=2))
        try:page.screenshot(path=str(OUT/'failure.png'))
        except Exception:pass
        raise
    finally:context.close();browser.close()
