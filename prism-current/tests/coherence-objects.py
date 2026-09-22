"""Real Three object/geometry checks without WebGL, not a visual acceptance test."""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'test-output/coherence';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox'])
 try:
  p=b.new_page();p.goto('about:blank')
  for name in ['vendor/aframe-1.8.0.min.js','modules/environment/water.js','modules/environment/fire.js','modules/environment/trees.js','river/difficulty.js','river/core.js','river/art.js','river/bank-trees.js']:
   p.add_script_tag(content=(ROOT/'prism-current'/name).read_text())
  report=p.evaluate("""()=>{const T=AFRAME.THREE,checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const scene={object3D:new T.Scene(),is:()=>false,components:{'river-game':{quality:'balanced',dock:{prefs:{opacity:.23}}}}},art=RiverArt.build(T,scene);
   const ground=scene.object3D.getObjectByName('river-bank-slope'),rocks=scene.object3D.getObjectByName('river-bank-stones'),reeds=scene.object3D.getObjectByName('river-bank-reeds');
   check(ground&&rocks&&reeds,'Real integrated art builds sloped ground, irregular stones and actual reed blades');
   const a=ground.geometry.attributes.position,n=ground.geometry.attributes.normal;
   for(let i=0;i<a.count;i++)if(Math.abs(a.getY(i)-RiverArt.bankHeight(a.getX(i),a.getZ(i)))>2e-6||n.getY(i)<0)throw Error('incorrect bank geometry');
   check(true,'Every ground vertex matches the optical bed and normals face upward');
   check(art.stats.shore.triangles<8000,'New bank geometry stays below the declared triangle budget');
   const water=scene.object3D.getObjectByName('Currentworks Water / local-space surface'),bed=water.geometry.attributes.bedHeight,wp=water.geometry.attributes.position;
   for(let i=0;i<bed.count;i++)if(Math.abs(bed.array[i]-RiverArt.bankHeight(wp.getX(i),wp.getZ(i)))>2e-6)throw Error('water and shore disagree');
   check(true,'Every water bed sample follows the same actual shore function');
   const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};ground.material.onBeforeCompile(shader);
   check(shader.fragmentShader.indexOf('float dry=')<shader.fragmentShader.indexOf('roughnessFactor=mix'),'Wet shading is initialized before roughness use');
   check(shader.uniforms.bankNoise.value===water.material.uniforms.waterNoise.value,'Shore borrows the generated water texture without another allocation');
   const state=RiverCore.create('duck-armada');state.mode='playing';state.time=55;const saved=JSON.stringify(state);art.update(state,55,0,false,false,true);
   check(JSON.stringify(state)===saved,'Scenery does not change the battle');
   check(shader.uniforms.bankLevel.value===RiverCore.water('duck-armada',55),'Wet ground follows the real tide rather than an unrelated clock');
   for(const d of PrismBankTrees.TREES)check(Math.abs(d.position[1]-RiverArt.bankHeight(d.position[0],d.position[2]))<1e-7,d.id+': trunk meets bank');
   art.update(state,55,0,true,false,false);check(!art.stats.shore.visible&&!art.stats.trees.visible&&art.stats.water.opacity===.23,'AR keeps scenery hidden and retains saved water opacity');
   const space=RiverCore.create('mothership');art.update(space,0,0,false,false,false);check(!art.stats.shore.visible,'Mothership preserves its space scene');
   let released=0;water.material.uniforms.waterNoise.value.addEventListener('dispose',()=>released++);art.dispose();art.dispose();
   check(released===1&&scene.object3D.children.length===0,'Teardown frees the borrowed texture exactly once and removes the art');
   return {passed:checks.length,checks,scope:'Three object/data checks, no GPU/physical-device claim'};}""")
  (OUT/'object-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
 finally:b.close()
