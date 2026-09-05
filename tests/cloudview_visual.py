"""Render the actual upgraded game and record a normal-input loop transfer.
The source concept is a visual target, not a substituted background image.
"""
from pathlib import Path
import os,json,time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from PIL import Image
OUT=Path('test-output/cloudview');OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('TEST_BASE_URL','http://127.0.0.1:4173').rstrip('/')
checks=[];errors=[];gpu_errors=[]
def check(value,title):
    assert value,title
    checks.append(title);print('PASS:',title,flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    c=b.new_context(viewport={'width':1440,'height':900},record_video_dir=str(OUT/'video'),record_video_size={'width':1440,'height':900},service_workers='block')
    c.add_init_script("localStorage.setItem('sprocket_muted','1')")
    host=urlparse(BASE).hostname
    c.route('**/*',lambda r:r.continue_() if urlparse(r.request.url).hostname==host or r.request.url.startswith(('data:','blob:')) else r.abort())
    page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:gpu_errors.append(m.text) if m.type=='error' and any(s in m.text for s in ['VALIDATION','GL_INVALID','CommandBuffer','shader error','uniform buffer']) else None)
    try:
        page.goto(BASE+'/mario-maker-clone/svgn-paper-route/index.html',wait_until='domcontentloaded')
        page.wait_for_function('!!window.__cloudview?.world&&window.__gpuReady===true',timeout=90000)
        check(page.locator('[data-course]').count()==3,'Existing three sky courses remain the main menu')
        page.screenshot(path=str(OUT/'cloudview-menu.png'),timeout=60000)
        page.locator('[data-course="0"]').click();page.locator('#cv').focus()
        page.wait_for_function('__sky.active()&&__cloudview.courier.visible&&__merged.renderer.info.render.calls>0',timeout=60000)
        check(page.evaluate('__delivery.state.view==="3d"&&__merged.get3D()'),'New art runs in the real 3D renderer')
        check(page.evaluate('__cloudview.stats.trackPanels>500&&__cloudview.stats.islands>=10'),'Track armor and island scenery are actual geometry')
        check(page.evaluate('__cloudview.stats.mailboxes===4'),'Red mailbox models match the real targets')
        check(page.evaluate('!__merged.activePose.visible'),'The legacy rider does not overlap the new courier')
        check(page.evaluate('''()=>{let good=true;__cloudview.world.traverse(o=>{if(o.geometry){const a=o.geometry.attributes.position.array;for(let i=0;i<a.length;i++)if(!Number.isFinite(a[i]))good=false;}});return good;}'''),'All new scene vertices are finite')
        page.screenshot(path=str(OUT/'cloudview-start.png'),timeout=60000)
        page.locator('#gl').screenshot(path=str(OUT/'cloudview-start-scene.png'),timeout=60000)
        im=Image.open(OUT/'cloudview-start-scene.png').convert('RGB').resize((180,100))
        check(len(set(im.getdata()))>2000,'The captured 3D scene contains rendered detail')
        # Ordinary controls only: no assignment to rider, track or progress.
        page.keyboard.down('KeyD');page.keyboard.down('KeyC');start=time.monotonic();st={}
        while time.monotonic()-start<150:
            st=page.evaluate('''()=>{const p=player,t=p.track,k=t?.sky;return {transfers:__sky.state.transfers,launches:__sky.state.launches,loops:[...__sky.state.completed],phase:k?(p.trackS/t.len-k.begin)/(k.end-k.begin):-1,armed:__sky.state.armed,tries,deliveries};}''')
            if st['transfers']>=1:break
            if .64<=st['phase']<.96 and not st['armed']:page.keyboard.press('Space',delay=80)
            page.wait_for_timeout(35)
        page.keyboard.up('KeyD');page.keyboard.up('KeyC')
        check(st.get('transfers',0)>=1 and st.get('launches',0)>=1,'Normal input completes a loop, launch and receiving-rail catch')
        check(st['tries']==1 and st['deliveries']>=1,'The art upgrade preserves airborne delivery without a retry')
        page.screenshot(path=str(OUT/'cloudview-flight.png'),timeout=60000)
        page.keyboard.press('KeyP');page.wait_for_function('__delivery.paused')
        steps=page.evaluate('__sky.state.steps');page.wait_for_timeout(350)
        check(page.evaluate('__sky.state.steps')==steps,'Pause still freezes simulation')
        page.locator('#delivery-pause [data-delivery="resume"]').click()
        check(page.evaluate('__merged.gpuLimitAudit().ok'),'GPU instance limits remain within the existing guard')
        check(not errors,'No uncaught JavaScript errors in the art and input flow')
        check(not gpu_errors,'No detected GPU validation errors')
        (OUT/'report.json').write_text(json.dumps({'checks':checks,'passed':len(checks),'flight':st,'geometry':page.evaluate('__cloudview.stats'),'renderer':page.evaluate('__merged.renderer.backend.constructor.name'),'uncaught_errors':errors,'gpu_errors':gpu_errors,'limits':'Software WebGL rendering through the existing WebGPURenderer. Screenshots require human visual review; this is not a physical-device frame-rate benchmark.'},indent=2))
    except Exception as e:
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'uncaught_errors':errors,'gpu_errors':gpu_errors},indent=2))
        try:page.screenshot(path=str(OUT/'failure.png'),timeout=15000)
        except Exception:pass
        raise
    finally:c.close();b.close()
