"""Full AR Color Match journey. Only tracked input is controlled; gameplay is observed.
Runs directly or after the existing Field Guide suite. Every original assertion remains.
"""
from pathlib import Path
import base64,functools,hashlib,http.server,json,os,re,sys,threading,urllib.request
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];APP=ROOT/'prism-current';PUBLIC='--public' in sys.argv
OUT=ROOT/'test-output/field-guide/chromatic'/('public' if PUBLIC else 'source');OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];server=None
old='{"duck-armada/ar/easy/arcade":{"score":12345,"wins":2}}'
def check(value,message):
    assert value,message
    checks.append(message);print('PASS',message,flush=True)
if PUBLIC:
    URL='https://v5ma.github.io/prism-current/'
    paths={'index.html','release.json'};paths.update(s.split('?')[0] for s in re.findall(r'(?:src|href)="\./([^"#]+)',(APP/'index.html').read_text()) if s.split('?')[0].endswith(('.js','.css')))
    expected={p:hashlib.sha256((APP/p).read_bytes()).hexdigest() for p in sorted(paths)};actual={}
    for name in expected:
        try:
            with urllib.request.urlopen(URL+name+'?chromatic='+expected['index.html'][:12],timeout=20) as response:actual[name]=hashlib.sha256(response.read()).hexdigest()
        except Exception as e:actual[name]=str(e)
    (OUT/'publication.json').write_text(json.dumps({'expected':expected,'actual':actual,'all_match':actual==expected},indent=2))
    check(expected==actual,'All loaded public scripts, style, entry and release match the tested source')
else:
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/prism-current/'
with sync_playwright() as pw:
    options={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']}
    if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
    b=pw.chromium.launch(**options)
    try:
        c=b.new_context(viewport={'width':1280,'height':1000},device_scale_factor=.25,service_workers='block')
        c.add_init_script((APP/'tests/river-fake-xr.js').read_text()+'\n'+(APP/'tests/river-strict-xr.js').read_text())
        c.add_init_script('localStorage.setItem("prism-current.river.pacing.records.v1",'+json.dumps(old)+');localStorage.setItem("prism-current.v1.records",\'{"sentinel":true}\');')
        p=c.new_page();p.set_default_timeout(45000);p.on('pageerror',lambda e:errors.append(str(e)))
        p.on('console',lambda m:errors.append(m.text) if m.type=='error' and ('Shader Error' in m.text or 'VALIDATE_STATUS' in m.text) else None)
        p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.River?.snapshot().ready&&River.snapshot().rotunda.progress>=1&&!document.getElementById("enter-ar").disabled')
        # Enter through the actual painted AR chapter card, not a direct action call.
        xy=p.evaluate('''()=>{const T=AFRAME.THREE,s=AFRAME.scenes[0],m=s.object3D.getObjectByName('river-xr-menu'),r=RiverRotunda.RECTS[0];m.updateWorldMatrix(true,false);const v=new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld).project(s.camera),b=document.getElementById('scene-wrap').getBoundingClientRect();return [b.x+(v.x*.5+.5)*b.width,b.y+(-v.y*.5+.5)*b.height];}''')
        p.mouse.click(*xy);p.wait_for_function('River.snapshot().immersive&&River.snapshot().calibrated&&River.snapshot().rotunda.progress>=1')
        def snap():return p.evaluate('River.snapshot()')
        def frames():
            p.evaluate('''async()=>{const s=TestXR.state.session;const frame=()=>new Promise((r,j)=>{const timer=setTimeout(()=>j(Error('XR frame timeout')),8000);s.requestAnimationFrame(()=>{clearTimeout(timer);r();});});await frame();await frame();}''')
        def button(hand,index):
            for down in [False,True,False]:p.evaluate('([h,i,v])=>TestXR.button(h,i,v)',[hand,index,down]);frames()
        def choose(i):
            p.wait_for_function('River.snapshot().rotunda.open&&River.snapshot().rotunda.progress>=1');p.evaluate('TestXR.select("left",false)');frames();p.wait_for_timeout(140)
            p.evaluate('''i=>{const T=AFRAME.THREE,m=AFRAME.scenes[0].object3D.getObjectByName('river-xr-menu'),r=RiverRotunda.RECTS[i];m.updateWorldMatrix(true,false);TestXR.point('left',new T.Vector3(((r.x+r.w/2)/1200-.5)*1.68,(.5-(r.y+r.h/2)/814)*1.14,0).applyMatrix4(m.matrixWorld).toArray());}''',i)
            p.wait_for_function('i=>River.snapshot().xrUI.hover[0]===i',arg=i);n=snap()['xrUI']['actions'];p.evaluate('TestXR.select("left",true)');p.wait_for_function('n=>River.snapshot().xrUI.actions===n+1',arg=n);p.evaluate('TestXR.select("left",false)')
            if snap()['immersive']:frames()
        check(snap()['version']=='0.13.0' and snap()['difficulty']=='easy','Normal AR entry keeps Easy and identifies Color Match')
        check(snap()['previousRecords']['duck-armada/ar/easy/arcade']['score']==12345,'Old difficulty scores are readable without being migrated to the new board')
        p.evaluate('TestXR.away()');button('right',5);p.wait_for_function('River.snapshot().phase==="playing"')
        check(snap()['bladeColors']==[0,1],'Each new battle begins with MINT left and ROSE right')
        p.evaluate('TestXR.button("right",4,true)');p.wait_for_function('River.snapshot().bladeColors[1]===0');frames();frames()
        check(snap()['bladeColors']==[0,0],'Holding right A changes its color once, without repeated toggles')
        p.evaluate('TestXR.button("right",4,false)');frames();button('left',4)
        check(snap()['bladeColors']==[1,0] and snap()['result']['score']==0,'Left X changes only that hand, without awarding points or opening a menu')
        check(snap()['stats']['bladeColors']==snap()['bladeColors'],'Rendered saber palettes agree with actual gameplay state')
        check(p.evaluate('AFRAME.scenes[0].renderer.getClearAlpha()')==0,'The new feedback preserves transparent AR')
        p.evaluate('''()=>{window.chromaticDriver=null;window.startChromatic=mode=>{
          const T=AFRAME.THREE,stage=AFRAME.scenes[0].components['river-game'].art.stage;let stroke=null,targetId=null;
          const world=p=>stage.localToWorld(new T.Vector3(...p));
          const pose=p=>{TestXR.state.hands.left=world(p).toArray();TestXR.state.rotate.left=new T.Euler().setFromQuaternion(stage.getWorldQuaternion(new T.Quaternion())).toArray().slice(0,3);};
          chromaticDriver=setInterval(()=>{const s=River.snapshot();if(s.phase!=='playing')return;
            const n=s.entities.find(n=>n.id===targetId)||s.entities.find(n=>n.type==='fruit'&&n.position[2]>-3&&n.position[2]<-.95);if(!n)return;targetId=n.id;
            const desired=mode==='match'?n.hand:1-n.hand;
            if(s.bladeColors[0]!==desired){pose([n.position[0],n.position[1]+.50,-.4]);TestXR.button('left',4,true);return;}
            TestXR.button('left',4,false);TestXR.button('left',0,false);
            if(!stroke&&n.position[2]>-1.7)stroke={id:n.id,at:s.time};
            if(stroke){const f=Math.min(1,(s.time-stroke.at)/.26);pose([n.position[0],n.position[1]+.4-f*.8,-.4]);if(f===1){stroke=null;targetId=null;}}
          },12);
        };window.stopChromatic=()=>{clearInterval(chromaticDriver);TestXR.button('left',4,false);TestXR.button('left',0,false);};}''')
        p.evaluate('startChromatic("mismatch")');p.wait_for_function('AFRAME.scenes[0].components["river-game"].state.events.some(e=>e.type==="destroy"&&e.kind==="fruit"&&e.reason==="slice"&&!e.matched)',timeout=22000);p.evaluate('stopChromatic()')
        mismatch=p.evaluate('AFRAME.scenes[0].components["river-game"].state.events.findLast(e=>e.type==="destroy"&&e.kind==="fruit"&&e.reason==="slice")')
        check(mismatch['basePoints']>=120 and mismatch['bonusPoints']==0,'A real wrong-color tracked stroke earns the full base reward')
        p.evaluate('startChromatic("match")');p.wait_for_function('River.snapshot().result.colorMatches>0',timeout=22000);p.evaluate('stopChromatic()');frames()
        match=p.evaluate('AFRAME.scenes[0].components["river-game"].state.events.findLast(e=>e.type==="destroy"&&e.kind==="fruit"&&e.matched)')
        check(match['bonusPoints']>0 and match['points']==match['basePoints']+match['bonusPoints'],'A real matching stroke adds explicit bonus points to the base')
        p.screenshot(path=str(OUT/'actual-ar-color-stroke.png'))
        data=p.evaluate('AFRAME.scenes[0].object3D.getObjectByName("prism-controller-status").material.map.image.toDataURL()');(OUT/'actual-color-health-hud.png').write_bytes(base64.b64decode(data.split(',')[1]))
        p.evaluate('TestXR.away()');button('right',5);p.wait_for_function('River.snapshot().phase==="paused"');before=snap();choose(10);choose(0)
        check(snap()['result']==before['result'] and snap()['time']==before['time'] and snap()['bladeColors']==before['bladeColors'],'Sound adjustment preserves paused points, health, clock and selected colors')
        p.evaluate('TestXR.away()');button('right',4)
        check(snap()['phase']=='paused' and snap()['bladeColors']==before['bladeColors'],'A still confirms menu controls while paused; it does not change a blade color')
        button('right',5);p.wait_for_function('River.snapshot().phase==="playing"')
        check(snap()['bladeColors']==before['bladeColors'],'Direct B resume retains both selected colors')
        check(snap()['result']['shots']==before['result']['shots'],'Color and menu buttons do not leak into saber laser shots')
        p.add_script_tag(content=(APP/'tests/playability-xr-driver.js').read_text());p.evaluate('observeFriendlyXR();startFriendlyXR("boss")')
        p.wait_for_function('River.snapshot().entities.some(n=>n.type==="boss")',timeout=80000)
        check(not p.evaluate('friendlyXRObserved.earlyBoss'),'Admiral Quack still arrives only in the final musical phrase')
        p.wait_for_function('["complete","escaped","failed"].includes(River.snapshot().phase)',timeout=35000);p.evaluate('stopFriendlyXR();clearInterval(friendlyXRObserver)');result=snap()['result']
        check(result['complete'] and result['bossDefeated'],'Wrong-color cut, matching bonus, menu recovery and real boss shooting complete an Easy AR battle')
        check('duck-armada/ar/easy/arcade' in snap()['records'],'Completion writes the new Color Match scoring board')
        check(p.evaluate('localStorage.getItem(RiverCore.PACING_KEY)')==old,'The prior scoring ledger remains byte-identical after completion')
        check(p.evaluate('localStorage.getItem("prism-current.v1.records")')=='{"sentinel":true}','Original rhythm records remain unchanged')
        choose(8);choose(3);p.wait_for_function('!River.snapshot().immersive')
        check(True,'Exit ends the actual XR session without closing the page')
        check(not errors,'No captured script or shader errors in this tracked AR journey')
        (OUT/'report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'mismatch':mismatch,'match':match,'result':result,'errors':errors,'scope':'Actual game and tracked input in the existing strict XR emulator. Real completed Easy AR battle, not a physical headset or sustained performance certification.'},indent=2))
        c.close()
    except Exception as e:
        try:state=p.evaluate('window.River?.snapshot()')
        except:state=None
        (OUT/'failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'errors':errors,'state':state},indent=2))
        try:p.screenshot(path=str(OUT/'failure.png'))
        except:pass
        raise
    finally:
        b.close()
        if server:server.shutdown()
