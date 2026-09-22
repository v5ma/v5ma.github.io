"""Strict WebXR UI regression: real renderer and input handlers, emulated hardware.
The source list deliberately has no Array.filter. Pick the visible texture's
centers/corners with separate aim/grip poses and an offset, rotated seated head.
No gameplay score, clock, actor, phase or health writes are permitted here.
"""
from pathlib import Path
import base64,json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/xr-menu';OUT.mkdir(parents=True,exist_ok=True)
URL=os.getenv('PRISM_URL','http://127.0.0.1:4173/prism-current/')
checks=[];errors=[];reproduced=False
SAVED={'prism-current.v1.records':'{"sentinel":true}','prism-current.v1.practice':'{"sentinel":true}','prism-current.v1.lessons':'{"sentinel":true}','prism-current.v1.water-mission':'{"sentinel":true}','prism-current.river.records.v1':'{"duck-armada/vr/arcade":{"score":1234,"wins":2}}'}
def check(ok,message):
    assert ok,message
    checks.append(message);print('PASS',message,flush=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
    def page():
        c=browser.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.125,service_workers='block')
        c.add_init_script((ROOT/'prism-current/tests/river-fake-xr.js').read_text()+'\n'+(ROOT/'prism-current/tests/river-strict-xr.js').read_text())
        c.add_init_script('for(const [k,v]of Object.entries('+json.dumps(SAVED)+'))localStorage.setItem(k,v)')
        p=c.new_page();p.set_default_timeout(45000);return c,p
    def button(p,hand,index):
        p.evaluate('''async ([h,i])=>{
            const session=TestXR.state.session;
            const frames=()=>new Promise((resolve,reject)=>{
                const timeout=setTimeout(()=>reject(Error('XR input frames did not arrive')),5000);
                session.requestAnimationFrame(()=>session.requestAnimationFrame(()=>{clearTimeout(timeout);resolve();}));
            });
            // Present neutral/press/release across real XR frames. Do not lose a
            // complete short button pulse inside a software shader-compilation gap.
            TestXR.button(h,i,false);await frames();
            TestXR.button(h,i,true);await frames();
            TestXR.button(h,i,false);await frames();
        }''',[hand,index])
    def aim(p,hand,index,corner='center'):
        if p.evaluate('!!River.snapshot().rotunda'):p.wait_for_function('River.snapshot().rotunda.progress>.99')
        # Literal artwork coordinates, not invisible hitboxes or production helpers.
        p.evaluate('''([hand,i,corner])=>{const T=AFRAME.THREE,m=AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu');m.updateWorldMatrix(true,false);
        const x=i%2?631:56,y=306+Math.floor(i/2)*122,points={center:[x+256.5,y+45],tl:[x+2,y+2],tr:[x+511,y+2],bl:[x+2,y+88],br:[x+511,y+88]},q=points[corner];
        const p=new T.Vector3((q[0]/1200-.5)*1.68,(.5-q[1]/814)*1.14,0).applyMatrix4(m.matrixWorld);TestXR.point(hand,p.toArray());}''',[hand,index,corner])
        p.wait_for_function('([h,i])=>River.snapshot().xrUI.hover[h]==i',arg=[0 if hand=='left' else 1,index],timeout=10000)
    def primary(p,hand,polled=False):
        if polled:p.evaluate('(h)=>TestXR.button(h,0,true)',hand)
        p.evaluate('(h)=>TestXR.select(h,true)',hand);p.wait_for_timeout(200)
        if polled:p.evaluate('(h)=>TestXR.button(h,0,false)',hand)
        p.evaluate('(h)=>TestXR.select(h,false)',hand);p.wait_for_timeout(150)
    try:
        before=os.getenv('RIVER_XR_BEFORE')
        if before:
            c,p=page();old_errors=[];p.on('pageerror',lambda e:old_errors.append(str(e)))
            p.route('**/river/xr.js*',lambda route:route.fulfill(status=200,content_type='text/javascript',body=Path(before).read_text()))
            p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2')
            p.locator('#enter-ar').click();p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated')
            p.evaluate('TestXR.pose("left",[-.4,1.53,-.4])');p.wait_for_timeout(180);button(p,'left',0)
            reproduced=any('filter' in error for error in old_errors)
            check(reproduced and p.evaluate('River.snapshot().phase')=='menu','Old XR code reproduces the Start failure with a native-shaped source list')
            (OUT/'before-failure.json').write_text(json.dumps({'expected_error':old_errors,'phase':p.evaluate('River.snapshot().phase'),'scope':'Old XR module substituted only for the negative reproduction.'},indent=2));c.close()
        for mode in ['ar','vr']:
            c,p=page();p.on('pageerror',lambda e:errors.append(str(e)))
            p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
            p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready');p.keyboard.press('F2')
            p.evaluate('''()=>{const S=TestXR.state,T=AFRAME.THREE;S.head=[2.7,1.21,-1.6];S.yaw=.83;for(const hand of['left','right'])S.hands[hand]=new T.Vector3(hand==='left'?-.23:.23,-.3,-.4).applyAxisAngle(new T.Vector3(0,1,0),S.yaw).add(new T.Vector3(...S.head)).toArray();S.rotate.right=[.7,1.6,0];}''')
            p.locator('#enter-'+mode).click();p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated&&River.snapshot().xrUI.trackedControllers===2')
            check(p.evaluate('!Array.isArray(TestXR.state.session.inputSources)&&TestXR.state.session.inputSources.filter===undefined'),mode+': native-shaped XR source collection, not an ordinary array')
            check(p.evaluate('River.snapshot().xrUI.version')=='0.12.2',mode+': repaired XR module loaded')
            check(p.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==(0 if mode=='ar' else 1),mode+': correct compositor transparency')
            p.evaluate('TestXR.away()')
            for index in range(8):
                for corner in ['center','tl','tr','bl','br']:aim(p,'right',index,corner)
            check(True,mode+': all 40 visible button centers/corners hit after translating and rotating a seated viewpoint')
            check(p.evaluate('''()=>{const s=AFRAME.scenes[0],r=s.object3D.getObjectByName('river-xr-ray-1'),c=s.object3D.getObjectByName('river-xr-cursor-1'),a=r.geometry.attributes.position;return !r.frustumCulled&&r.material.depthTest===false&&c.visible&&new AFRAME.THREE.Vector3().fromBufferAttribute(a,1).distanceTo(c.position)<.001;}'''),mode+': visible ray ends at its hit cursor, without stale culling or depth occlusion')
            aim(p,'right',1);count=p.evaluate('River.snapshot().xrUI.actions');primary(p,'right')
            check(p.evaluate('River.snapshot().chapter')=='mothership' and p.evaluate('River.snapshot().xrUI.actions')==count+1,mode+': native selectstart activates Other chapter exactly once without polled trigger data')
            aim(p,'right',1);count=p.evaluate('River.snapshot().xrUI.actions');primary(p,'right',True)
            check(p.evaluate('River.snapshot().chapter')=='duck-armada' and p.evaluate('River.snapshot().xrUI.actions')==count+1,mode+': native event plus polled trigger does not double-activate')
            p.evaluate('TestXR.away()');p.wait_for_timeout(180);p.evaluate('TestXR.axes("left",-1,0)');p.wait_for_function('River.snapshot().xrUI.focus===0');p.evaluate('TestXR.axes("left",0,0)')
            button(p,'right',4);p.wait_for_function("River.snapshot().phase==='playing'")
            check(p.evaluate('River.snapshot().chapter')=='duck-armada',mode+': thumbstick plus A starts Duck Armada with both rays pointing away')
            button(p,'right',5);p.wait_for_function("River.snapshot().phase==='paused'");t=p.evaluate('River.snapshot().time');p.wait_for_timeout(150)
            check(p.evaluate('River.snapshot().time')==t and p.evaluate('River.snapshot().xrUI.menuVisible'),mode+': B pauses into a usable menu without freezing menu input')
            aim(p,'right',0);primary(p,'right',True);p.wait_for_function("River.snapshot().phase==='playing'")
            check(p.evaluate('River.snapshot().result.shots')==0,mode+': trigger-selected Resume does not leak a menu press into a gunshot')
            button(p,'left',0);check(p.evaluate('River.snapshot().result.shots')>0,mode+': the released trigger fires through the normal combat path')
            button(p,'left',5);p.wait_for_function("River.snapshot().phase==='paused'")
            p.evaluate('TestXR.away();TestXR.state.oneController=true');p.wait_for_timeout(180);aim(p,'left',5);primary(p,'left')
            check(p.evaluate('River.snapshot().xrUI.trackedControllers')==1,mode+': one controller can still operate the spatial menu')
            aim(p,'left',0);primary(p,'left');check(p.evaluate('River.snapshot().phase')=='paused' and 'both tracked controllers' in p.evaluate('River.snapshot().message'),mode+': missing combat controller gives readable feedback, not a dead Start button')
            p.evaluate('TestXR.state.oneController=false');p.wait_for_function('River.snapshot().xrUI.trackedControllers===2');p.evaluate('TestXR.away()');button(p,'left',5);p.wait_for_function("River.snapshot().phase==='playing'")
            check(True,mode+': Y directly resumes with no ray targeting')
            p.evaluate('TestXR.hide(true)');p.wait_for_function("River.snapshot().phase==='paused'");p.evaluate('TestXR.hide(false)');p.wait_for_timeout(200)
            check(p.evaluate('River.snapshot().phase')=='paused',mode+': visibility recovery does not auto-resume or replay a held action')
            p.evaluate('TestXR.state.noGrip.add("left");TestXR.state.noGrip.add("right");TestXR.away()');p.wait_for_timeout(180);aim(p,'left',4);primary(p,'left')
            check(p.evaluate('River.snapshot().xrUI.trackedControllers')==0 and p.evaluate('River.snapshot().xrUI.focus')==4,mode+': menu pointing works even while grip poses are unavailable')
            p.evaluate('TestXR.state.noGrip.clear();TestXR.state.handMode=true;TestXR.state.pinch=false;TestXR.away()');p.wait_for_timeout(180);aim(p,'left',1);p.evaluate('TestXR.state.pinch=true');p.wait_for_timeout(220);p.evaluate('TestXR.state.pinch=false')
            check(p.evaluate('River.snapshot().chapter')=='mothership',mode+': hand pinch selects the actual painted chapter button')
            p.evaluate('TestXR.state.handMode=false;TestXR.away()');p.wait_for_function('River.snapshot().xrUI.trackedControllers===2');button(p,'right',5);p.wait_for_function("River.snapshot().phase==='playing'")
            check(p.evaluate('River.snapshot().chapter')=='mothership',mode+': direct B starts the second chapter with no pointer')
            button(p,'right',5);p.wait_for_function("River.snapshot().phase==='paused'");p.evaluate('TestXR.reset()');p.wait_for_function('!River.snapshot().calibrated');aim(p,'left',2);primary(p,'left')
            check(p.evaluate('River.snapshot().calibrated') and p.evaluate('River.snapshot().phase')=='paused',mode+': Recenter restores calibration without automatically starting combat')
            data=p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("river-xr-menu").material.map.image.toDataURL()')
            (OUT/(mode+'-menu-texture.png')).write_bytes(base64.b64decode(data.split(',')[1]));p.screenshot(path=str(OUT/(mode+'-emulated-view.png')))
            aim(p,'left',3);primary(p,'left');p.wait_for_function('!River.snapshot().immersive')
            check(p.evaluate('River.snapshot().phase')=='paused',mode+': Exit headset returns to screen with the current battle still paused')
            for key,value in SAVED.items():check(p.evaluate('(k)=>localStorage.getItem(k)',key)==value,mode+': saved data preserved: '+key)
            c.close()
        check(not errors,'No uncaught script or shader errors in the repaired AR/VR menu checks')
        (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'before_failure_reproduced':reproduced,'errors':errors,'scope':'Production renderer, strict non-Array XR source collection and emulated hardware events/poses. Not physical Quest testing. Negative reproduction alone substitutes the old XR file; all repaired acceptance uses the actual selected source/public URL. No gameplay state or clock writes.'},indent=2))
    except Exception as exc:
        try:snapshot=p.evaluate('window.River?.snapshot()')
        except:snapshot=None
        (OUT/'failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors,'snapshot':snapshot},indent=2))
        try:p.screenshot(path=str(OUT/'failure.png'))
        except:pass
        raise
    finally:browser.close()
