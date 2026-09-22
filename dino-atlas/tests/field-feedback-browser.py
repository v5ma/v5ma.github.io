"""Real game UI/input; synthetic Xbox and explicit XR session/head/controller mocks.
No player, objective, inventory or reward assignments. Not physical Quest testing.
"""
from pathlib import Path
import base64, json, os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'feedback-evidence'; OUT.mkdir(exist_ok=True)
BASE=os.getenv('DINO_TEST_BASE','http://127.0.0.1:4173/dino-atlas/').rstrip('/')+'/'
SCENE=os.getenv('SPATIAL_SCENE','classic'); assert SCENE in ('classic','tidegate')
KEY='__dinoRanger' if SCENE=='classic' else '__tidegate'
ROUTE='index.html' if SCENE=='classic' else 'tidegate.html'
checks=[]; errors=[]; server=None
PAD="""window.__pad={id:'Field clarity synthetic Xbox',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[__pad]});"""
def check(value,name):
    assert value,name
    checks.append(name); print('PASS:',name,flush=True)
try:
    if BASE.startswith('http://127.0.0.1'):
        server=subprocess.Popen(['python','-m','http.server','4173','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.4)
    with sync_playwright() as pw:
        opts=dict(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
        browser=pw.chromium.launch(**opts);page=browser.new_page(viewport={'width':1280,'height':960});page.add_init_script(PAD)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('shader' in m.text.lower() or 'webgl' in m.text.lower()) else None)
        page.on('response',lambda r:errors.append(str(r.status)+' '+r.url) if r.status>=400 and 'favicon' not in r.url else None)
        def wait(expr,timeout=90000):page.wait_for_function(expr,timeout=timeout)
        def press(i):
            wait('!input.neutral',30000);page.evaluate('i=>__pad.buttons[i]={value:1,pressed:true}',i)
            try:page.wait_for_function('i=>input.previous[i]===true',arg=i,timeout=30000)
            finally:page.evaluate('i=>__pad.buttons[i]={value:0,pressed:false}',i)
            page.wait_for_function('i=>input.previous[i]===false&&!input.neutral',arg=i,timeout=30000)
        def ready():wait('!x.gate.neutral.has(left)&&!x.gate.neutral.has(right)&&x.context===x.ctx.modal()',30000)
        try:
            page.goto(BASE+ROUTE+'?test=1&clarity=1',wait_until='domcontentloaded',timeout=90000);wait('window.'+KEY+'?.state.ready',120000)
            page.evaluate('window.g=window.'+KEY+';window.x=g.xr;window.input=x.ctx.input;')
            check(page.evaluate('x.console.feedback.snapshot().build')=='ranger-field-clarity-20260921.1','Exact floor-feedback implementation boots in '+SCENE)
            check(page.evaluate('x.presentation.height')==2,'Default box is 2 meters tall without clearing older saves')
            press(0);wait('g.state.started')
            for _ in range(5):
                if not page.locator('dialog[open]').count():break
                press(1)
            wait('!g.state.paused')
            check(page.evaluate('x.travel.navigation.liveMap.width')>0,'Live map exists without opening or pausing the full map')
            # The two worlds use the same actual existing map/goal data, not fixture objectives.
            check(page.evaluate('x.console.feedback.data().goal')==page.evaluate('x.travel.navigation.goal.name||x.travel.navigation.goal.title'),'Floor guide describes the actual active mission')
            if SCENE=='tidegate':check(page.locator('#live-map-button').is_visible(),'Tidegate also exposes a live screen minimap')
            if page.evaluate('g.state.mode')!='foot':press(3)
            wait('g.state.mode==="foot"')
            page.evaluate('''async()=>{window.T=await import('./vendor/three.module.js');const make=handedness=>({handedness,gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({value:0,pressed:false}))}});window.left=make('left');window.right=make('right');window.session=new EventTarget();session.inputSources=[left,right];session.visibilityState='visible';session.end=async()=>session.dispatchEvent(new Event('end'));Object.defineProperty(navigator,'xr',{configurable:true,value:{isSessionSupported:async()=>true,requestSession:async()=>session}});g.renderer.xr.setSession=async()=>{};await x.checkSupport();}''')
            press(9);page.select_option('#quality-select' if SCENE=='classic' else '#quality','low');page.select_option('#xr-presentation','diorama-vr');page.locator('#xr-enter').click();wait('x.active')
            page.evaluate('''()=>{g.camera.position.set(0,1.65,0);g.camera.quaternion.identity();for(const [i,s] of [[0,left],[1,right]]){const e=x.controllers[i];e.ray.visible=true;e.grip.visible=true;e.ray.position.set(i?.3:-.3,1.25,-.25);e.ray.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),new T.Vector3(0,1,0));e.ray.updateMatrix();e.ray.dispatchEvent({type:'connected',data:s});}}''')
            for _ in range(5):
                if not page.locator('dialog[open]').count():break
                press(1)
            wait('x.console.feedback.snapshot().visible&&x.console.feedback.mapFrames>2');ready()
            check(True,'Headset play shows the floor map and readable goal without opening a menu')
            check(page.evaluate('x.size.height')==2 and page.evaluate('x.size.height/x.size.width')>.8,'Actual rendered aperture is tall, not the old shallow box')
            pose=page.evaluate('x.console.feedback.root.position.toArray()');page.evaluate('g.camera.rotation.y=.4;g.camera.rotation.x=-.25');page.wait_for_timeout(250)
            check(page.evaluate('x.console.feedback.root.position.toArray()')==pose,'Looking around does not drag the floor guide with the head')
            page.evaluate('g.camera.rotation.set(0,0,0)')
            before=page.evaluate('g.state.position');map_before=page.evaluate('x.travel.navigation.liveMap.toDataURL()');page.evaluate('__pad.axes[1]=-.6')
            try:page.wait_for_function('p=>Math.hypot(g.state.position.x-p.x,g.state.position.z-p.z)>.35',arg=before,timeout=45000)
            finally:page.evaluate('__pad.axes[1]=0')
            page.wait_for_function('s=>x.travel.navigation.liveMap.toDataURL()!==s',arg=map_before,timeout=15000)
            check(True,'Live map refreshes after ordinary movement with no assigned player position')
            # X invokes normal full-tank/reload feedback, including while in XR.
            old=page.evaluate('x.console.feedback.trail.serial');press(2)
            wait('x.console.feedback.trail.serial>'+str(old)+'&&x.console.feedback.notice.mesh.visible',15000)
            message=page.evaluate('x.console.feedback.trail.current.text');check(bool(message),'A real tool interaction becomes visible floor text')
            press(9);wait('g.state.paused');wait('!x.console.feedback.notice.mesh.visible',5000)
            check(page.evaluate('x.console.feedback.trail.history.some(m=>m.text==='+json.dumps(message)+')'),'Message fades while paused but remains available in message history')
            press(1);wait('!g.state.paused');ready()
            page.evaluate('''()=>{window.tap=(mesh,u,v)=>{const e=x.controllers[1];mesh.updateWorldMatrix(true,false);mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox,target=mesh.localToWorld(new T.Vector3(b.min.x+(b.max.x-b.min.x)*u,b.min.y+(b.max.y-b.min.y)*v,0)),normal=new T.Vector3(0,0,1).transformDirection(mesh.matrixWorld),origin=target.clone().addScaledVector(normal,.6),localOrigin=x.rig.worldToLocal(origin.clone()),localTarget=x.rig.worldToLocal(target.clone());e.ray.position.copy(localOrigin);e.ray.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),localTarget.sub(localOrigin).normalize());e.ray.updateMatrix();e.ray.visible=true;const h=x.hit(e);if(!h?.run)throw Error('No interactive surface at '+mesh.name);e.ray.dispatchEvent({type:'selectstart',data:right});e.ray.dispatchEvent({type:'selectend',data:right});};window.tapTile=label=>{x.draw(x.ctx.modal());const t=x.tiles.find(t=>t.label===label);if(!t)throw Error('Missing visible tile '+label);tap(x.panel,(t.x+t.w/2)/1024,1-(t.y+t.h/2)/1024);};}''')
            page.evaluate('tap(x.console.feedback.guide.mesh,.5,.05)');wait('document.getElementById("field-help-dialog").open');ready()
            check(page.locator('#field-help-goal').inner_text()==page.evaluate('x.console.feedback.data().goal'),'Pointed floor Help shows the actual current goal and step')
            check('GRIP' in page.locator('#field-help-interact').inner_text() or 'Move closer' in page.locator('#field-help-interact').inner_text() or 'Slow down' in page.locator('#field-help-interact').inner_text(),'Interaction help distinguishes range/speed from a ready grip action')
            check('LT: aim' in page.locator('#field-help-tools').inner_text() and message in page.locator('#field-help-dialog').inner_text(),'Controls and expired messages are reachable inside the app')
            press(1);wait('!g.state.paused');ready();page.evaluate('tap(x.console.feedback.guide.mesh,.85,.05)');wait('document.getElementById("spatial-console-settings").open');ready()
            before=page.evaluate('({width:x.presentation.width,height:x.presentation.height,center:x.anchor.y+x.presentation.height/2,menu:x.console.cfg.scale,player:g.state.position})')
            page.evaluate('tapTile("Diorama larger")');ready()
            check(page.evaluate('x.presentation.width')>before['width'] and page.evaluate('x.presentation.height')>before['height'],'Diorama larger is a directly ray-selectable size button')
            check(abs(page.evaluate('x.anchor.y+x.presentation.height/2')-before['center'])<1e-8,'Enlarging the box preserves the displayed character-center height')
            width=page.evaluate('x.presentation.width');height=page.evaluate('x.presentation.height');page.evaluate('tapTile("Menu larger")');ready()
            check(page.evaluate('x.console.cfg.scale')>before['menu'] and page.evaluate('x.presentation.width')==width and page.evaluate('x.presentation.height')==height,'Menu size changes independently of the diorama')
            page.evaluate('tapTile("Box taller")');ready()
            check(page.evaluate('x.presentation.height')>height and page.evaluate('x.presentation.width')==width,'Box taller changes height without widening the world')
            check(page.evaluate('g.state.position')==before['player'],'Resizing does not move the ranger or change paused physics')
            # Inspect the actual rendered canvas from an explicitly simulated downward head view.
            page.evaluate('x.console.resume()');wait('!g.state.paused');ready()
            page.evaluate('''()=>{x.console.feedback.guide.mesh.updateWorldMatrix(true,false);g.camera.lookAt(x.console.feedback.guide.mesh.getWorldPosition(new T.Vector3()));}''');page.wait_for_timeout(300)
            capture=page.evaluate("()=>{x.render();return g.renderer.domElement.toDataURL('image/png').split(',')[1]}")
            (OUT/(SCENE+'-floor-guide.png')).write_bytes(base64.b64decode(capture))
            page.evaluate('g.camera.rotation.set(0,0,0)');saved=page.evaluate('JSON.parse(JSON.stringify(x.presentation))');page.evaluate('session.end()');wait('!x.active')
            check(not page.evaluate('x.console.feedback.root.visible'),'Leaving XR removes floor surfaces and their input targets')
            page.reload(wait_until='domcontentloaded');wait('window.'+KEY+'?.state.ready',120000);page.evaluate('window.g=window.'+KEY+';window.x=g.xr;window.input=x.ctx.input;')
            check(page.evaluate('x.presentation')==saved,'Box dimensions and selected presentation survive ordinary reload')
            check(not errors,'No captured game JavaScript or HTTP errors')
            report={'build':'ranger-field-clarity-20260921.1','scene':SCENE,'base':BASE,'passed':len(checks),'checks':checks,'errors':errors,'physicalHardwareVerified':False,'limitations':'Real game/UI and renderer, synthetic Xbox and explicit XR session/head/controller poses. No gameplay-state assignments. Not physical Quest, stereo compositor or human readability acceptance.'}
            (OUT/(SCENE+'-report.json')).write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
        except Exception as exc:
            diagnostic={}
            try:diagnostic=page.evaluate('({state:window.g?.state,feedback:window.x?.console?.feedback?.snapshot(),modal:window.x?.ctx.modal()?.id,focus:document.activeElement?.id})');page.screenshot(path=str(OUT/(SCENE+'-failure.png')),timeout=30000)
            except Exception:pass
            (OUT/(SCENE+'-failure.json')).write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors,'diagnostic':diagnostic},indent=2));raise
        finally:browser.close()
finally:
    if server:server.terminate()
