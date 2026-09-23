"""Real Three.js object ownership, not a renderer or physical-device test."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/field-guide'; OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox'])
    try:
        page=browser.new_page(); page.goto('about:blank')
        for name in ['vendor/aframe-1.8.0.min.js','river/difficulty.js','river/core.js','modules/environment/flex-surface.js','river/field-guide.js']:
            page.add_script_tag(content=(ROOT/'prism-current'/name).read_text())
        report=page.evaluate('''()=>{
 const T=AFRAME.THREE, checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const scene=new T.Scene(),anchor=new T.Group(),menu=new T.Mesh(new T.PlaneGeometry(1.68,1.14),new T.MeshBasicMaterial());scene.add(anchor);anchor.add(menu);
 let page='play',disposeCalls=0,uploads=0;
 const dock={menu,update(){},prepare(){return true;},dispose(){disposeCalls++;},get diagnostics(){return {open:g.phase!=='playing',page};}};
 const g={T,el:{is:m=>m==='ar-mode'},immersive:true,phase:'menu',busy:false,difficulty:'easy',state:null};
 const returned=PrismFieldGuide.attach(g,dock);const guide=dock.fieldGuide;
 check(returned===dock,'Uses the original Rotunda API rather than replacing its controls');
 check(PrismFieldGuide.attach(g,dock)===dock&&menu.children.length===1,'Repeated installation cannot duplicate the guides');
 dock.update();check(guide.stats.visible&&guide.stats.cards===3,'Three real curved cards appear in the initial AR menu');
 check(guide.stats.triangles===288&&guide.stats.textures===3,'Geometry and texture allocation remain within the declared budget');
 let hold=JSON.stringify(guide.stats);for(let i=0;i<50;i++)dock.update();check(JSON.stringify(guide.stats)===hold,'Unchanged menu frames do not repaint textures or update geometry');
 g.difficulty='hard';dock.update();check(guide.stats.paints===2,'Actual difficulty changes refresh the guide once');
 dock.prepare({initTexture(){uploads++;}});check(uploads===3&&guide.stats.prepared,'All three textures are prepared before music');
 g.state={difficulty:'normal',score:123,health:81,time:10};g.phase='playing';const state=JSON.stringify(g.state);dock.update();
 check(!guide.stats.visible,'All guide cards disappear during combat');check(JSON.stringify(g.state)===state,'The guide never modifies the encounter');
 g.phase='paused';dock.update();check(!guide.stats.visible,'The paused Battle page stays compact');page='help';dock.update();check(guide.stats.visible,'Paused Controls recalls the object guide');
 check(guide.stats.paints===3,'Paused guide uses run difficulty, not a changed next-run preference');
 anchor.position.set(1,.2,-3);anchor.rotation.y=.7;scene.updateMatrixWorld(true);const matrix=menu.children[0].matrixWorld.clone();dock.update();scene.updateMatrixWorld(true);
 check(matrix.equals(menu.children[0].matrixWorld),'Repeated observations do not move the world-anchored panel');
 g.immersive=false;dock.update();check(!guide.stats.visible,'AR-only addition does not obscure the screen fallback');
 g.immersive=true;g.busy=true;dock.update();check(!guide.stats.visible,'Loading does not expose the guide');g.busy=false;
 const group=menu.children[0];let gs=0,ms=0,ts=0;const materials=new Set(),geometries=new Set();group.traverse(o=>{if(o.isMesh){materials.add(o.material);geometries.add(o.geometry);}});
 for(const x of geometries)x.addEventListener('dispose',()=>gs++);for(const x of materials){x.addEventListener('dispose',()=>ms++);x.map.addEventListener('dispose',()=>ts++);}
 guide.dispose();guide.dispose();check(gs===6&&ms===3&&ts===3,'Each owned geometry, material and texture is freed once');
 check(menu.parent===anchor&&anchor.parent===scene&&menu.children.length===0,'Cleanup leaves the original menu and scene intact');
 guide.update();check(!guide.stats.visible&&guide.stats.disposed,'Disposed guides cannot reappear');dock.dispose();check(disposeCalls===1,'Host teardown still reaches the original Rotunda disposer');
 menu.geometry.dispose();menu.material.dispose();return {passed:checks.length,checks,scope:'Actual Three objects and lifecycle. No GPU render, input-playthrough or physical Quest approval.'};
}''')
        (OUT/'objects.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
    finally:browser.close()
