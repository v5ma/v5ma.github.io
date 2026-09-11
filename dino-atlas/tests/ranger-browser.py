"""Real HTTP/WebGL smoke tests. Repositioning is used only for mission interaction coverage.
Driving, steering, gate passage, pausing, touch, persistence, and rendering use the real app.
"""
import base64, functools, http.server, json, os, pathlib, threading, time
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=pathlib.Path('ranger-evidence');OUT.mkdir(exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/dino-atlas/'
report={'checks':[],'errors':[],'note':'Mission station coverage uses test-only repositioning. Keyboard driving and northern gate passage are exercised without teleporting through those passages.'}
def check(name,value):
    report['checks'].append({'name':name,'passed':bool(value)})
    print(('PASS ' if value else 'FAIL ')+name,flush=True)
    if not value:raise AssertionError(name)
def state(page):return page.evaluate('window.__dinoRanger.state')
def warp(page,x,z):
    page.evaluate('([x,z])=>window.__dinoRanger.teleport(x,z)',[x,z]);page.wait_for_timeout(700)
def interact(page):
    page.wait_for_function("!document.getElementById('interact-button').disabled")
    page.keyboard.press('e');page.wait_for_timeout(300)
try:
    with sync_playwright() as p:
        kwargs={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
        if os.getenv('DINO_BROWSER_EXECUTABLE'):kwargs['executable_path']=os.environ['DINO_BROWSER_EXECUTABLE']
        browser=p.chromium.launch(**kwargs)
        context=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
        page=context.new_page();page.set_default_timeout(45000)
        page.on('pageerror',lambda e:report['errors'].append(str(e)))
        failed=[];external=[]
        page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
        page.on('request',lambda r:external.append(r.url) if r.url.startswith('http') and not r.url.startswith(URL.rsplit('/dino-atlas/',1)[0]) else None)
        response=page.goto(URL+'?test=1',wait_until='networkidle')
        page.wait_for_function('window.__dinoRanger?.state.ready')
        check('Application served through HTTP',response.status==200)
        check('Real rendered scene contains substantial geometry',state(page)['triangles']>10000)
        pixel_count=page.evaluate("""()=>{window.__dinoRanger.render();const c=document.getElementById('park'),g=c.getContext('webgl2'),a=new Uint8Array(64*64*4);g.readPixels(Math.floor(c.width/2)-32,Math.floor(c.height/2)-32,64,64,g.RGBA,g.UNSIGNED_BYTE,a);let s=new Set;for(let i=0;i<a.length;i+=4)s.add(a[i]+','+a[i+1]+','+a[i+2]);return s.size;}""")
        check('WebGL framebuffer contains varied pixels',pixel_count>10)
        report['rendered_pixel_colors']=pixel_count
        page.screenshot(path=str(OUT/'01-intro.png'))
        page.evaluate("localStorage.setItem('dino-atlas.progress.v1',JSON.stringify({version:1,observed:['coelophysis'],excavated:[],quizzes:[],notes:{coelophysis:'Preserve my original field note.'},digs:{}}))")
        page.click('#start-button');page.wait_for_timeout(600)
        start=state(page)['position']
        page.keyboard.down('w');page.wait_for_function('window.__dinoRanger.state.position.z<40');page.keyboard.up('w');page.keyboard.down('Space');page.wait_for_function('Math.abs(window.__dinoRanger.state.speed)<.6');page.keyboard.up('Space')
        check('Keyboard throttle physically moves the jeep',state(page)['position']['z']<start['z']-10)
        page.screenshot(path=str(OUT/'02-driving.png'))
        page.keyboard.press('r');page.wait_for_timeout(500)
        check('Recovery returns to the visitor center',abs(state(page)['position']['z']-51)<1)
        page.keyboard.down('w');page.wait_for_function('window.__dinoRanger.state.position.z<48');page.keyboard.down('a');page.wait_for_function('Math.abs(window.__dinoRanger.state.position.x)>.75');page.keyboard.up('a');page.keyboard.up('w')
        check('Keyboard steering changes the actual vehicle path',abs(state(page)['position']['x'])>.25)
        page.keyboard.press('Escape');paused=state(page)['position'];page.wait_for_timeout(500)
        check('Pause stops the simulation',abs(state(page)['position']['z']-paused['z'])<.01)
        page.locator('#menu-dialog form button').click()
        warp(page,0,24);page.wait_for_function('window.__dinoRanger.state.stage===1')
        d=next(a for a in state(page)['animals'] if a['id']=='diplodocus');warp(page,d['x']+9,d['z']+2)
        page.screenshot(path=str(OUT/'03-giant-meadow.png'));interact(page)
        check('Observation advances the survey mission',state(page)['stage']==2)
        check('Observation opens a species evidence card',page.locator('#info-title').inner_text()=='Diplodocus')
        page.screenshot(path=str(OUT/'04-field-notes.png'));page.locator('#info-dialog form button').click()
        journal=page.evaluate("JSON.parse(localStorage.getItem('dino-atlas.progress.v1'))")
        check('Original journal notes survive new discoveries',journal['notes']['coelophysis']=='Preserve my original field note.' and 'diplodocus' in journal['observed'])
        warp(page,31,-20);interact(page);check('Relay restoration advances mission',state(page)['stage']==3)
        warp(page,37,-31);page.keyboard.down('w');page.wait_for_function('window.__dinoRanger.state.position.z< -44');page.keyboard.up('w');page.keyboard.down('Space');page.wait_for_function('Math.abs(window.__dinoRanger.state.speed)<.6');page.keyboard.up('Space')
        check('The restored gate permits actual driving passage',state(page)['position']['z']< -44)
        page.screenshot(path=str(OUT/'05-northern-habitat.png'))
        warp(page,43,-51);interact(page);check('Recorder recovery advances mission',state(page)['stage']==4);page.locator('#info-dialog form button').click()
        warp(page,0,51);interact(page);check('Delivery completes all five objectives',state(page)['stage']==5);page.screenshot(path=str(OUT/'06-complete.png'));page.locator('#info-dialog form button').click()
        page.keyboard.press('m');check('Map opens from keyboard',page.locator('#map-dialog').evaluate('(d)=>d.open'));page.screenshot(path=str(OUT/'07-map.png'));page.keyboard.press('Escape')
        page.reload(wait_until='networkidle');page.wait_for_function('window.__dinoRanger?.state.ready');check('Mission and observations survive reload',state(page)['stage']==5 and 'diplodocus' in state(page)['observed'])
        page.click('#start-button');page.keyboard.press('Escape');page.select_option('#camera-select','chase');page.check('#night-toggle');page.check('#motion-toggle');page.locator('#menu-dialog form button').click();page.wait_for_timeout(700)
        check('Camera and dusk settings take effect',state(page)['cameraMode']=='chase' and state(page)['night'])
        page.screenshot(path=str(OUT/'08-dusk.png'))
        page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(500)
        check('Mobile page fits without horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        check('Touch controls are visible',page.locator('[data-drive=forward]').is_visible())
        warp(page,0,51);before=state(page)['position']['z'];b=page.locator('[data-drive=forward]').bounding_box();page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2);page.mouse.down();page.wait_for_function('(z)=>window.__dinoRanger.state.position.z<z-1',arg=before);page.mouse.up()
        check('Touch-style pointer controls move the real jeep',state(page)['position']['z']<before-.5)
        page.screenshot(path=str(OUT/'09-mobile.png'))
        check('No missing HTTP assets',not failed);check('No external runtime requests',not external);check('No application JavaScript errors',not report['errors'])
        for route in ['walking.html','field-guide.html']:
            r=page.goto(URL+route,wait_until='networkidle');check('Original route retained: '+route,r.status==200)
        # A separate simulated no-WebGL device must get a usable fallback, not a blank page.
        fallback=context.new_page()
        fallback.add_init_script("const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t==='webgl2'?null:get.call(this,t,...a)}")
        fallback.goto(URL,wait_until='networkidle');fallback.wait_for_function("document.getElementById('load-status').textContent.includes('could not start')")
        check('No-WebGL fallback points to the preserved expedition',fallback.locator('.intro-links a').first.get_attribute('href')=='./walking.html')
        report['final_state']=state(context.pages[0]) if context.pages[0].evaluate('Boolean(window.__dinoRanger)') else {'completed_stage':5}
        browser.close()
except Exception as error:
    report['failure']=str(error)
    try:
        report['failure_state']=state(page)
        page.screenshot(path=str(OUT/'failure.png'))
    except Exception:pass
    raise
finally:
    (OUT/'report.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2),flush=True)
    server.shutdown()
