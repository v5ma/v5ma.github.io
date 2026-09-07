"""Native HTTP A-Frame smoke checks; NOT a physical Quest acceptance test.
No fake headset session or controller pose is presented as headset evidence.
"""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.getenv('TEST_OUTPUT','test-output'));out.mkdir(exist_ok=True)
checks=[];errors=[]
with sync_playwright() as p:
    args={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
    if os.getenv('CHROMIUM_PATH'):args['executable_path']=os.environ['CHROMIUM_PATH']
    browser=p.chromium.launch(**args);page=browser.new_page(viewport={'width':1365,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    def check(v,name):
        assert v,name
        checks.append(name)
    try:
        page.goto(os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')+'/gloamward/',wait_until='domcontentloaded')
        page.wait_for_function('!!window.GloamwardDemo',timeout=90000)
        check(page.evaluate('AFRAME.version.startsWith("1.8.")'),'Pinned A-Frame renderer loaded')
        check(page.locator('#menu').is_visible(),'Title and controls are readable')
        page.screenshot(path=str(out/'title.png'))
        page.locator('#menu-actions button').first.click()
        page.wait_for_function('GloamwardDemo.snapshot().state==="playing"')
        page.keyboard.down('KeyF');page.wait_for_timeout(1250);page.keyboard.up('KeyF')
        page.wait_for_function('GloamwardDemo.snapshot().shots===1')
        check(True,'Deliberate held input releases a real arrow')
        page.keyboard.press('KeyP');page.wait_for_function('GloamwardDemo.snapshot().paused')
        before=page.evaluate('GloamwardDemo.snapshot()');page.wait_for_timeout(350)
        check(page.evaluate('GloamwardDemo.snapshot().hp')==before['hp'],'Pause stops combat updates')
        page.locator('#menu-actions button').first.click()
        page.keyboard.press('KeyQ');page.wait_for_function('document.getElementById("arrow-label").textContent==="Shatter"');check(True,'Arrow selection responds to ordinary controls')
        page.screenshot(path=str(out/'courtyard.png'))
        page.set_viewport_size({'width':390,'height':844});page.keyboard.press('KeyP')
        check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Narrow viewport does not overflow horizontally')
        page.screenshot(path=str(out/'mobile-menu.png'))
        check(not errors,'No uncaught browser errors in the exercised flow')
        (out/'browser-report.json').write_text(json.dumps({'checks':checks,'passed':len(checks),'errors':errors,'scope':'Native HTTP smoke test; no full mission or physical Quest pass.'},indent=2))
    except Exception as e:
        (out/'browser-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors},indent=2))
        try:page.screenshot(path=str(out/'failure.png'))
        except Exception:pass
        raise
    finally:browser.close()
