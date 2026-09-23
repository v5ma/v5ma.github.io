"""Standalone real-WebGL surface and pointer checks; NOT a Prism playthrough.
The fixture owns the renderer/canvas. Production FlexSurface owns neither.
"""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/flex-surface';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(value,label):
    assert value,label
    checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as pw:
    opts={'headless':True,'args':['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
    if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
    browser=pw.chromium.launch(**opts)
    try:
        p=browser.new_page(viewport={'width':960,'height':640},device_scale_factor=1)
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'Shader Error' in m.text else None)
        p.goto('about:blank')
        for path in ['vendor/aframe-1.8.0.min.js','modules/environment/flex-surface.js']:
            p.add_script_tag(content=(ROOT/'prism-current'/path).read_text())
        p.evaluate('''()=>{
          const T=AFRAME.THREE,renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
          renderer.setSize(960,640);renderer.setPixelRatio(1);renderer.setClearColor(0x152a38,0);
          document.body.style.cssText='margin:0;background:repeating-conic-gradient(#193b48 0% 25%,#204351 0% 50%) 0/64px 64px';document.body.appendChild(renderer.domElement);
          const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=256;
          const ctx=textureCanvas.getContext('2d'),palette=[[195,93,73],[76,150,200],[140,190,125],[205,168,70]];
          for(let i=0;i<4;i++){ctx.fillStyle='rgb('+palette[i].join(',')+')';ctx.fillRect(i%2*128,Math.floor(i/2)*128,128,128);ctx.fillStyle='#102434';ctx.font='bold 32px sans-serif';ctx.fillText(String(i+1),i%2*128+57,Math.floor(i/2)*128+76);}
          const texture=new T.CanvasTexture(textureCanvas);texture.colorSpace=T.SRGBColorSpace;
          const material=new T.MeshBasicMaterial({map:texture,side:T.FrontSide,toneMapped:false});
          const surface=SVGNFlexSurface.create(T,{width:1.6,height:1.1,columns:32,rows:10,material});
          const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1.5,.01,100);scene.add(surface.group);
          surface.group.position.set(.17,1.05,-.35);surface.group.rotation.set(.05,-.18,.04);surface.group.scale.set(1.05,.90,1.1);
          surface.update({bend:.9,pull:{u:.64,v:.42,strength:.06,radius:.3}});
          const draw=()=>{scene.updateMatrixWorld(true);renderer.render(scene,camera);};
          function side(which){scene.updateMatrixWorld(true);const center=surface.group.localToWorld(new T.Vector3(0,0,.2)),eye=surface.group.localToWorld(new T.Vector3(.25,.12,which==='front'?2.8:-2.8));camera.position.copy(eye);camera.lookAt(center);camera.updateMatrixWorld(true);draw();}
          const ray=new T.Raycaster();let hits=[];
          renderer.domElement.addEventListener('pointerdown',e=>{const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=surface.pick(ray);if(hit)hits.push({side:hit.object===surface.front?'front':'back',u:hit.uv.x,v:hit.uv.y});});
          function target(which,u,v){const descriptor=surface.describe(),local=SVGNFlexSurface.evaluate(which==='back'?1-u:u,v,descriptor.shape,descriptor.options).position;scene.updateMatrixWorld(true);const q=surface.group.localToWorld(new T.Vector3(...local)).project(camera);return [(q.x*.5+.5)*960,(-q.y*.5+.5)*640];}
          function pixel(x,y){draw();const data=new Uint8Array(4);renderer.getContext().readPixels(Math.round(x),639-Math.round(y),1,1,renderer.getContext().RGBA,renderer.getContext().UNSIGNED_BYTE,data);return [...data];}
          window.flexFixture={renderer,surface,scene,camera,material,texture,palette,draw,side,target,pixel,hits};side('front');
        }''')
        check(p.evaluate('flexFixture.renderer.getContext() instanceof WebGL2RenderingContext'),'Fixture uses actual WebGL2 with the supplied Three namespace')
        for side in ['front','back']:
            p.evaluate('(side)=>flexFixture.side(side)',side)
            for i,(u,v) in enumerate([(0.2,0.8),(0.8,0.8),(0.2,0.2),(0.8,0.2)]):
                point=p.evaluate('([side,u,v])=>flexFixture.target(side,u,v)',[side,u,v])
                prior=p.evaluate('flexFixture.hits.length');p.mouse.click(*point)
                p.wait_for_function('(n)=>flexFixture.hits.length===n+1',arg=prior,timeout=5000)
                hit=p.evaluate('flexFixture.hits.at(-1)')
                check(hit['side']==side and abs(hit['u']-u)<.012 and abs(hit['v']-v)<.012,side+': actual pointer click selects the rendered bent quadrant '+str(i+1))
                rgba=p.evaluate('([x,y])=>flexFixture.pixel(x,y)',point);expected=p.evaluate('(i)=>flexFixture.palette[i]',i)
                check(rgba[3]>250 and all(abs(a-b)<8 for a,b in zip(rgba[:3],expected)),side+': rendered texel and picked content quadrant '+str(i+1)+' agree')
            p.screenshot(path=str(OUT/('flex-'+side+'-960.png')))
        before=p.evaluate('({updates:flexFixture.surface.stats.updates,version:flexFixture.surface.front.geometry.attributes.position.version})')
        p.evaluate('()=>{for(let i=0;i<30;i++){flexFixture.surface.update(flexFixture.surface.describe().shape);flexFixture.draw();}}')
        check(p.evaluate('flexFixture.surface.stats.updates')==before['updates'] and p.evaluate('flexFixture.surface.front.geometry.attributes.position.version')==before['version'],'Repeated paused shape draws do not request geometry updates')
        check(p.evaluate('flexFixture.renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable!==false)'),'All actual surface/material shader programs are runnable')
        p.evaluate('flexFixture.surface.reset();flexFixture.side("front")');p.screenshot(path=str(OUT/'flex-flat-960.png'))
        check(p.evaluate('flexFixture.surface.front.geometry.attributes.position.array.every((v,i)=>i%3!==2||v===0)'),'Reset returns the same live geometry to flat')
        p.evaluate('flexFixture.surface.dispose();flexFixture.material.dispose();flexFixture.texture.dispose();flexFixture.renderer.dispose()')
        check(not errors,'No uncaught script or shader errors in the isolated surface fixture')
        (OUT/'native-report.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'errors':errors,'scope':'Standalone 960x640 real-WebGL fixture and real pointer events. No Prism encounter, HTML polyfill, physical Quest or steady frame-rate claim.'},indent=2))
    except Exception as exc:
        (OUT/'native-failure.json').write_text(json.dumps({'error':str(exc),'checks':checks,'errors':errors},indent=2))
        try:p.screenshot(path=str(OUT/'native-failure.png'))
        except Exception:pass
        raise
    finally:browser.close()
