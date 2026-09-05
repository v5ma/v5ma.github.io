"""Native HTTP render review. Captures the unmodified gameplay surface.
No game-state positions, scores, velocities, or track assignments are injected.
"""
import json,os,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path('test-output/depth');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173')
errors=[];console=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':1440,'height':900},service_workers='block')
    context.add_init_script("localStorage.setItem('sprocket_muted','1')")
    host=urlparse(BASE).hostname
    context.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
    page=context.new_page();page.set_default_timeout(90000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:console.append(m.text) if m.type=='error' else None)
    try:
        print('CAPTURE: loading game',flush=True)
        print('CAPTURE: loading game',flush=True)
        print('CAPTURE: loading game',flush=True)
        page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
        page.wait_for_function('window.__gpuReady===true&&!!window.__cloudview')
        page.wait_for_timeout(1200)
        print('CAPTURE: menu ready',flush=True)
        print('CAPTURE: menu ready',flush=True)
        print('CAPTURE: menu ready',flush=True)
        page.screenshot(path=str(OUT/'01-menu.png'))
        print('CAPTURE: start route',flush=True)
        print('CAPTURE: start route',flush=True)
        print('CAPTURE: start route',flush=True)
        page.locator('[data-course="0"]').click()
        page.wait_for_function('mode==="play"&&player?.track&&__sky.state.steps>5')
        page.locator('#cv').focus();page.wait_for_timeout(800)
        page.screenshot(path=str(OUT/'02-start.png'))
        print('CAPTURE: drive loop',flush=True)
        print('CAPTURE: drive loop',flush=True)
        print('CAPTURE: drive loop',flush=True)
        page.keyboard.down('KeyD');page.keyboard.down('KeyC')
        start=time.monotonic();captured=False
        while time.monotonic()-start<150:
            s=page.evaluate('''()=>{const t=player.track,k=t?.sky;return {phase:k?(player.trackS/t.len-k.begin)/(k.end-k.begin):-1,armed:__sky.state.armed,transfers:__sky.state.transfers,steps:__sky.state.steps};}''')
            if s['phase']>.66 and s['phase']<.98 and not s['armed']:page.keyboard.press('Space',delay=80)
            if s['transfers']>=1:break
            if not captured and s['phase']>.22:
                page.screenshot(path=str(OUT/'03-loop.png'));captured=True
            page.wait_for_timeout(45)
        page.keyboard.up('KeyD');page.keyboard.up('KeyC')
        page.screenshot(path=str(OUT/'04-flight-catch.png'))
        data=page.evaluate('''()=>({cloudview:__cloudview.stats,depth:window.__cloudDepth?.stats,transfers:__sky.state.transfers,loops:[...__sky.state.completed],tries,deliveries,renderer:__merged.renderer.backend.constructor.name,shadow:__merged.renderer.shadowMap.enabled,toneMapping:__merged.renderer.toneMapping,camera:__merged.camera.type,camera:__merged.camera.type,calls:__merged.renderer.info.render.calls,triangles:__merged.renderer.info.render.triangles})''')
        assert data.get('depth',{}).get('version'),'Depth renderer did not initialize'
        assert data['shadow'] and data['toneMapping']==4,data
        assert data['camera']=='PerspectiveCamera',data
        assert data.get('depth',{}).get('version'),'Depth renderer did not initialize'
        assert data['shadow'] and data['toneMapping']==4,data
        assert data['camera']=='PerspectiveCamera',data
        assert data.get('depth',{}).get('version'),'Depth renderer did not initialize'
        assert data['shadow'] and data['toneMapping']==4,data
        assert data['transfers']>=1 and data['tries']==1,data
        assert not errors,errors
        (OUT/'review.json').write_text(json.dumps({'state':data,'errors':errors,'console_errors':console},indent=2))
        print(json.dumps(data,indent=2),flush=True)
    except Exception as e:
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'errors':errors,'console_errors':console},indent=2))
        try:page.screenshot(path=str(OUT/'failure.png'))
        except Exception:pass
        raise
    finally:context.close();browser.close()
