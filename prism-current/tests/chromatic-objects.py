"""Actual bundled-Three badge/material and ownership checks, without WebGL claims."""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/chromatic';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox'])
    try:
        page=b.new_page();page.goto('about:blank');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        for name in ['vendor/aframe-1.8.0.min.js','river/difficulty.js','river/core.js','modules/environment/water.js','modules/environment/fire.js','river/art.js']:
            page.add_script_tag(content=(ROOT/'prism-current'/name).read_text())
        report=page.evaluate('''()=>{
          const T=AFRAME.THREE,C=RiverCore,checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
          const host={object3D:new T.Scene(),components:{'river-game':{quality:'balanced',dock:{prefs:{opacity:.38}}}},is:()=>false};
          const art=RiverArt.build(T,host),left=host.object3D.getObjectByName('prism-saber-blade-0'),right=host.object3D.getObjectByName('prism-saber-blade-1');
          const lb=host.object3D.getObjectByName('prism-saber-badge-0'),rb=host.object3D.getObjectByName('prism-saber-badge-1');
          const originals=[left.material,right.material],badges=[lb.material,rb.material];
          const pose={a:[-.25,1.3,-.4],b:[-.25,1.3,-1.1]};
          art.weapon(0,pose,null,1);check(left.material===originals[1]&&lb.material===badges[1],'Visible left blade and symbol use the selected ROSE palette');
          check(right.material===originals[1]&&rb.material===badges[1],'Switching one hand does not alter the other hand');
          art.weapon(1,pose,null,0);check(right.material===originals[0]&&rb.material===badges[0],'Right hand independently selects the MINT blade and symbol');
          check(originals[0].color.getHex()===C.PALETTES[0].color&&originals[1].color.getHex()===C.PALETTES[1].color,'Palette swaps do not recolor materials shared with health or boss geometry');
          const textures=badges.map(m=>m.map);check(textures.every(t=>t.isCanvasTexture&&!t.generateMipmaps&&t.colorSpace===T.SRGBColorSpace),'Saber symbols are prebuilt non-mipmapped canvas textures, not per-frame allocations');
          const bytes=textures.map(t=>t.image.getContext('2d').getImageData(0,0,64,64).data);
          check(bytes[0].some((v,i)=>v!==bytes[1][i]),'The two palette badges carry distinct painted content');
          const resources=()=>{const values=new Set();art.stage.traverse(o=>{if(o.geometry)values.add(o.geometry);if(o.material){values.add(o.material);if(o.material.map)values.add(o.material.map);}});return values;};
          const before=resources();for(let i=0;i<200;i++){art.weapon(0,pose,null,i%2);art.weapon(1,pose,null,1-i%2);}
          const after=resources();check(before.size===after.size&&[...after].every(v=>before.has(v)),'Two hundred swaps allocate no new geometry, material or texture');
          const s=C.create();s.mode='playing';C.cycleColor(s,0);const state=JSON.stringify(s);art.update(s,0,0,true,false,true);
          check(JSON.stringify(s)===state,'Color rendering never writes game state, health or rewards');
          const shield={active:true,center:[-.25,1.3,-.8],normal:[0,0,-1]};art.weapon(0,pose,shield,1);
          check(!left.visible&&lb.visible,'A shield still hides its saber while the selected symbol remains available');
          const reference=art.stage.matrixWorld.clone();art.stage.position.set(2,.2,-1);art.stage.rotation.y=.8;art.stage.updateMatrixWorld(true);
          check(!art.stage.matrixWorld.equals(reference)&&lb.parent.parent===art.stage,'Badges follow the same recentered stage and held weapon');
          const originalWater=art.stats.water.version,originalFire=art.stats.fire.version;
          check(originalWater==='0.1.0'&&originalFire==='0.1.3','Water and fire modules retain their existing versions');
          let freed=0;for(const r of [...badges,...textures])r.addEventListener('dispose',()=>freed++);
          art.dispose();art.dispose();check(freed===4,'Both badge materials and textures are disposed exactly once');
          check(host.object3D.children.length===0,'Art teardown leaves no detached visible saber badge');
          return {passed:checks.length,checks,threeRevision:T.REVISION,scope:'Real Three objects and canvas painting, not GPU drawing or physical headset performance.'};
        }''')
        assert not errors,errors
        (OUT/'objects.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
    finally:b.close()
