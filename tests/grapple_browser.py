"""Native HTTP / actual 3D gameplay. Only normal keys/buttons drive the rider.
State reads are assertions; no test assigns player position, velocity or progress.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output/grapple';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];events=[]
def check(ok,name):
    assert ok,name
    checks.append(name);print('PASS:',name,flush=True)
def state(page):
    return page.evaluate('''()=>{const p=player,a=p.peg;return {x:p.x,y:p.y,vx:p.vx,vy:p.vy,stage:p.track?.sky?.stage,open:__grapple.isOpen(),target:__grapple.state.target?.d,hook:a?{th:a.th,loops:a.loops,r:a.r}:null,turns:__grapple.state.turns,hooks:__grapple.state.hooks,releases:__grapple.state.releases,completed:__sky.state.completed.size,transfers:__sky.state.transfers,tries,deliveries,quota:routeQuota,won,three:__merged.get3D()&&__delivery.state.view==='3d',steps:__sky.state.steps};}''')
with sync_playwright() as p:
    options={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
    if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
    browser=p.chromium.launch(**options)
    context=browser.new_context(viewport={'width':1280,'height':800},record_video_dir=str(OUT/'video'),record_video_size={'width':1280,'height':800},service_workers='block')
    host=urlparse(BASE).hostname
    context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
    context.add_init_script("localStorage.setItem('sprocket_muted','1')")
    page=context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
        page.wait_for_function('!!window.__grapple&&window.__gpuReady===true',timeout=90000)
        check(page.locator('[data-course]').count()==7,'New open-ramp route is in the existing main menu')
        original=page.evaluate('levelCode()')
        page.locator('#advanced-routes-toggle').click()
        page.locator('[data-course="3"]').click(timeout=90000);page.locator('#cv').focus()
        page.wait_for_function('__grapple.isOpen()&&!!__grapple.graphics',timeout=90000)
        check(page.evaluate('__grapple.pegs().length===2'),'Two physical grapple pegs exist in the course')
        check(state(page)['three'],'Cloudview graphics and real 3D rendering are retained')
        page.screenshot(path=str(OUT/'01-open-ramp.png'))
        page.keyboard.down('KeyD');page.keyboard.down('KeyC');held=False;released=False;snap=False;start=time.monotonic()
        while time.monotonic()-start<540:
            q=state(page)
            if q['won']:break
            if q['tries']>1:raise AssertionError('New course required an unexpected retry: '+json.dumps(q))
            if q.get('stage') is None and q['x']>1250 and not held and not released and ((q.get('target') or 999)<120 or q['vy']>0):
                page.keyboard.down('KeyZ');held=True
            if q['hook']:
                if not snap:
                    page.wait_for_function('__grapple.graphics.ropeMesh?.geometry.drawRange.count>0',timeout=10000)
                    check(page.evaluate('__grapple.graphics.ropeMesh?.geometry.drawRange.count>0'),'Whip has submitted nonempty dynamic 3D link geometry')
                    page.screenshot(path=str(OUT/'02-whip-swing.png'));snap=True
                th=q['hook']['th']%(2*3.141592653589793)
                if q['hook']['loops']>=1 and .08<th<.42:
                    page.keyboard.up('KeyZ');held=False;released=True
            page.wait_for_timeout(20)
        page.keyboard.up('KeyD');page.keyboard.up('KeyC');page.keyboard.up('KeyZ');q=state(page)
        check(q['won'] and q['tries']==1,'Open-ramp course completes with normal controls and no teleport or retry')
        check(q['completed']==4 and q['transfers']>=3,'Four open sections and three disconnected catches are traversed')
        check(q['hooks']>=1 and q['releases']>=1 and q['turns']>=1,'Whip catches a peg, winds up and releases into the next catcher')
        check(q['deliveries']>=q['quota'],'Actual newspapers meet the delivery quota')
        events=page.evaluate('__grapple.state.events');check(any(e['type']=='catch' and e.get('from')=='whip' for e in events),'Released momentum leads to a swept receiving-ramp collision')
        check(page.evaluate('!!JSON.parse(localStorage.getItem("svgn_delivery_records_v1"))["hookline-run"]'),'New route saves its own medal record')
        page.screenshot(path=str(OUT/'03-route-complete.png'))
        # Negative case: no Z input must not silently auto-grapple a peg.
        page.locator('#delivery-header [data-delivery="routes"]').click();page.locator('[data-course="3"]').click(timeout=90000);page.locator('#cv').focus()
        page.keyboard.down('KeyD');page.keyboard.down('KeyC')
        page.wait_for_function('tries>1 || __sky.state.checkpoint>=3 || __sky.state.steps>=1800',timeout=180000);page.keyboard.up('KeyD');page.keyboard.up('KeyC')
        check(state(page)['hooks']==0 and not state(page)['won'],'C does not auto-grapple; skipping the whip crossing does not win')
        before_retry=page.evaluate('({checkpoint:__sky.state.checkpoint,attempts:tries,delivered:deliveries})')
        page.locator('#cv').focus();page.keyboard.press('KeyR')
        page.wait_for_function('(n)=>tries===n+1',arg=before_retry['attempts'],timeout=10000)
        check(page.evaluate('player.track?.sky.stage')==before_retry['checkpoint'],'Retry returns to the recorded receiving ramp')
        check(state(page)['deliveries']==before_retry['delivered'],'A single R press retries exactly once without losing deliveries')
        page.keyboard.press('KeyP');before=state(page)['steps'];page.wait_for_timeout(400)
        check(state(page)['steps']==before,'Pause freezes the open-course simulation')
        page.locator('#delivery-pause [data-delivery="resume"]').click()
        page.locator('#delivery-header [data-delivery="editor"]').click()
        check(page.evaluate('levelCode()')==original,'Create restores the original full blueprint')
        page.locator('#delivery-header [data-delivery="routes"]').click();page.locator('[data-course="3"]').click(timeout=90000);page.locator('#sky-edit-copy').click()
        check(page.evaluate('mode==="edit"&&customTracks.filter(t=>t.sky?.kind==="open").length===4'),'Open ramps are editable in the existing creator')
        encoded=page.evaluate('levelCode()');meta=json.loads(__import__('base64').b64decode(encoded.split('.')[0]))
        check(len(meta['cm'])==4 and all(t['kind']=='open' for t in meta['cm']),'Saved code preserves the open-ramp behavior')
        page.locator('#btnPlay').click(timeout=90000);page.wait_for_function('__grapple.isOpen()',timeout=90000)
        check(page.evaluate('__grapple.pegs().length===2'),'Playing an edited copy retains grapple pegs and open movement')
        page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(400)
        check(page.locator('#whip-control').is_visible(),'A touch-accessible whip button is available')
        check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'Controls fit a narrow viewport')
        page.screenshot(path=str(OUT/'04-touch-controls.png'))
        check(not errors,'No uncaught JavaScript errors in the tested flow')
        (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'completion':q,'events':events,'errors':errors,'scope':'Native Chromium HTTP with software WebGL; ordinary keyboard/button input. Not a physical-phone, controller or performance certification.'},indent=2))
    except Exception as e:
        try:diagnostic=state(page)
        except Exception:diagnostic=None
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'last_state':diagnostic,'checks':checks,'errors':errors,'events':page.evaluate('window.__grapple?.state.events')},indent=2))
        try:page.screenshot(path=str(OUT/'failure.png'))
        except Exception:pass
        raise
    finally:context.close();browser.close()
