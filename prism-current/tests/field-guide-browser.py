"""Actual AR game entry/menu/combat recovery; no direct game-state writes.
Uses tracked-input emulation, not physical Quest hardware. Public mode compares
all loaded local scripts/styles with this checkout before exercising the site.
"""
from pathlib import Path
import base64,functools,hashlib,http.server,json,os,re,sys,threading,time,urllib.request
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];APP=ROOT/'prism-current'
PUBLIC='--public' in sys.argv;scope='public' if PUBLIC else 'source'
OUT=ROOT/'test-output/field-guide'/scope;OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];server=None

def check(value,message):
    assert value,message
    checks.append(message);print('PASS',message,flush=True)

if PUBLIC:
    URL='https://v5ma.github.io/prism-current/'
    html=(APP/'index.html').read_text();paths={'index.html','release.json'}
    paths.update(s.split('?')[0] for s in re.findall(r'(?:src|href)="\./([^"#]+)',html) if s.split('?')[0].endswith(('.js','.css')))
    expected={p:hashlib.sha256((APP/p).read_bytes()).hexdigest() for p in sorted(paths)};actual={}
    for attempt in range(25):
        for name in expected:
            if actual.get(name)==expected[name]:continue
            try:
                req=urllib.request.Request(urljoin(URL,name)+'?field-guide='+expected['index.html'][:12],headers={'Cache-Control':'no-cache'})
                with urllib.request.urlopen(req,timeout=12) as r:actual[name]=hashlib.sha256(r.read()).hexdigest()
            except Exception as exc:actual[name]=str(exc)
        if actual==expected:break
        time.sleep(6)
    (OUT/'publication.json').write_text(json.dumps({'expected':expected,'actual':actual,'all_match':actual==expected},indent=2))
    check(actual==expected,'Every loaded game script/style and release matches this commit on the public site')
else:
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/prism-current/'

fake=(APP/'tests/river-fake-xr.js').read_text();strict=(APP/'tests/river-strict-xr.js').read_text()
with sync_playwright() as pw:
    options={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
    if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**options)
    def setup(high=False):
        c=browser.new_context(viewport={'width':1280,'height':1000},device_scale_factor=1 if high else .25,service_workers='block')
        source=fake
        if high:source=source.replace('this.framebufferWidth=240;this.framebufferHeight=160','this.framebufferWidth=1200;this.framebufferHeight=800').replace("x:v.eye==='left'?0:120,y:0,width:120,height:160","x:v.eye==='left'?0:600,y:0,width:600,height:800")
        c.add_init_script(source+'\n'+strict)
        c.add_init_script("localStorage.setItem('prism-current.v1.records','{\"sentinel\":true}')")
        p=c.new_page();p.set_default_timeout(45000)
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
        p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready&&AFRAME.scenes[0].components["river-game"].dock.fieldGuide')
        p.wait_for_function('!document.getElementById("enter-ar").disabled&&River.snapshot().rotunda.progress>=1')
        # The normal rendered chapter-card AR action, without opening F2/HTML.
        xy=p.evaluate('''()=>{const s=AFRAME.scenes[0],T=AFRAME.THREE,m=s.object3D.getObjectByName('river-xr-menu');m.updateWorldMatrix(true,false);const r=RiverRotunda.RECTS[0],v=new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld).project(s.camera),b=document.getElementById('scene-wrap').getBoundingClientRect();return [b.x+(v.x*.5+.5)*b.width,b.y+(-v.y*.5+.5)*b.height];}''')
        p.mouse.click(*xy);p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated&&River.snapshot().rotunda.progress>=1')
        return c,p
    def stats():return page.evaluate('AFRAME.scenes[0].components["river-game"].dock.fieldGuide.stats')
    def snap():return page.evaluate('River.snapshot()')
    def frames():
        page.evaluate('''async()=>{const s=TestXR.state.session;const f=()=>new Promise((resolve,reject)=>{const id=setTimeout(()=>reject(Error('XR frame timeout')),8000);s.requestAnimationFrame(()=>{clearTimeout(id);resolve();});});await f();await f();}''')
    def button(index):
        for down in [False,True,False]:page.evaluate('([i,v])=>TestXR.button("right",i,v)',[index,down]);frames()
    def choose(index):
        page.wait_for_function('River.snapshot().rotunda.open&&River.snapshot().rotunda.progress>=1');frames()
        page.evaluate('TestXR.select("left",false)');frames();page.wait_for_timeout(140)
        page.evaluate('''i=>{const T=AFRAME.THREE,m=AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu');m.updateWorldMatrix(true,false);const r=RiverRotunda.RECTS[i],p=new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld);TestXR.point('left',p.toArray());}''',index)
        page.wait_for_function('i=>River.snapshot().xrUI.hover[0]===i',arg=index);n=snap()['xrUI']['actions']
        page.evaluate('TestXR.select("left",true)');page.wait_for_function('n=>River.snapshot().xrUI.actions===n+1',arg=n)
        page.evaluate('TestXR.select("left",false)')
        if snap()['immersive']:frames()
    try:
        context,page=setup();check(stats()['visible'] and stats()['cards']==3,'Normal AR chapter card opens the actual game with three curved object guides')
        check(snap()['difficulty']=='easy' and snap()['phase']=='menu','Easy remains the default and the guide does not start the battle')
        check(page.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==0,'The real room remains visible through transparent AR composition')
        check(snap()['stats']['arScenery']['grass']['visible'],'Existing island grass is retained alongside the guide')
        check(stats()['triangles']==288 and stats()['interactive'] is False,'The cards have a fixed small geometry budget and own no input')
        page.wait_for_timeout(160);before=stats();frames();check(before==stats(),'An unchanged menu does not repaint or bend continuously')
        matrix=page.evaluate("AFRAME.scenes[0].object3D.getObjectByName('prism-ar-field-guide').matrixWorld.toArray()")
        page.evaluate('TestXR.state.head[0]+=.2;TestXR.state.yaw+=.12');frames()
        check(page.evaluate("AFRAME.scenes[0].object3D.getObjectByName('prism-ar-field-guide').matrixWorld.toArray()") == matrix,'Head movement does not drag the guide through the room')
        choose(7);choose(1);check(snap()['difficulty']=='normal','Existing difficulty controls still work through tracked rays')
        choose(0);choose(8)
        check(snap()['difficulty']=='easy','Easy is restored through the original scene buttons')
        page.evaluate('TestXR.away()');button(5);page.wait_for_function('River.snapshot().phase==="playing"')
        check(not stats()['visible'] and stats()['prepared'],'Loading prepares the cards and combat hides them completely')
        page.wait_for_function('River.snapshot().rotunda.healthGaugeVisible');check(snap()['result']['health']==100,'Combat retains the visible actual HEALTH gauge')
        button(5);page.wait_for_function('River.snapshot().phase==="paused"');run=snap()['result'];t=snap()['time']
        choose(11);check(stats()['visible'],'Paused Controls reveals the guide without restarting the encounter')
        check(snap()['time']==t and snap()['result']==run,'Consulting the guide preserves exact paused progress')
        choose(10);check(not stats()['visible'],'Sound controls remain uncluttered by guide cards');choose(0)
        check(snap()['time']==t and snap()['result']==run,'Changing music still preserves progress')
        page.evaluate('TestXR.away()');button(5);page.wait_for_function('River.snapshot().phase==="playing"')
        check(snap()['result']['shots']==run['shots'],'Menu selection does not leak into a saber shot')
        button(5);page.wait_for_function('River.snapshot().phase==="paused"');choose(8);run=snap()['result'];choose(3);page.wait_for_function('!River.snapshot().immersive')
        check(snap()['phase']=='paused' and snap()['result']==run,'Exit ends XR and preserves the paused encounter')
        check(page.evaluate("localStorage.getItem('prism-current.v1.records')")=='{"sentinel":true}','Legacy saved records are preserved');context.close()
        context,page=setup(True);page.wait_for_timeout(500);page.screenshot(path=str(OUT/'ar-field-guide-stereo.png'))
        for name in ['fruit','block','health']:
            data=page.evaluate('''id=>AFRAME.scenes[0].object3D.getObjectByName('prism-guide-'+id).children[0].material.map.image.toDataURL()''',name)
            (OUT/(name+'.png')).write_bytes(base64.b64decode(data.split(',')[1]))
        check(stats()['visible'],'Separate 1200x800 stereo capture shows the actual game guides');context.close()
        check(not errors,'No captured script or shader errors in the exercised paths')
        (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':scope+' actual game/menu/brief combat recovery with emulated tracked XR. Not a full-battle or physical Quest/performance certificate.'},indent=2))
    except Exception as exc:
        try:state=snap()
        except:state=None
        (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors,'state':state},indent=2))
        try:page.screenshot(path=str(OUT/'failure.png'))
        except:pass
        raise
    finally:
        browser.close()
        if server:server.shutdown()
