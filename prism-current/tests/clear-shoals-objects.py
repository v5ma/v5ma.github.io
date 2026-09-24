"""Actual Three resource and reversible integration checks; not GPU execution."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];APP=ROOT/'prism-current';OUT=ROOT/'test-output/clear-shoals';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH') or None,headless=True,args=['--no-sandbox'])
    try:
        page=b.new_page();page.goto('about:blank');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        for f in ['vendor/aframe-1.8.0.min.js','modules/environment/water.js','modules/environment/water-detail.js','modules/environment/water-optics.js']:
            page.add_script_tag(content=(APP/f).read_text())
        report=page.evaluate('''()=>{
 const T=AFRAME.THREE,checks=[],check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const water=SVGNWater.create(T),vertex=water.material.vertexShader,fragment=water.material.fragmentShader,originalUniforms=Object.keys(water.uniforms).sort();
 const base=water.mesh.geometry,waterTexture=water.uniforms.waterNoise.value,opacity=water.uniforms.opacity.value;
 const optics=SVGNWaterOptics.attach(T,water.material);
 check(optics.stats.version==='0.2.1'&&water.stats.version==='0.1.0','Existing water receives the new optics without a second water mesh');
 check(water.mesh.geometry===base&&water.uniforms.waterNoise.value===waterTexture,'Macro geometry, original data and CPU height query are preserved');
 check(optics.stats.extraTextures===2&&optics.stats.dataBytes===327680&&optics.stats.renderTargets===0,'Optical resources obey the declared fixed two-texture budget');
 const textures=[water.uniforms.waterDetail.value,water.uniforms.waterPebbles.value];
 check(textures.every(t=>t.isDataTexture&&t.colorSpace===T.NoColorSpace&&t.generateMipmaps&&t.minFilter===T.LinearMipmapLinearFilter),'Actual textures store linear optical data with mip filtering');
 check(textures[0].image.width===128&&textures[1].image.width===256,'Slope/flux and pebble textures use the declared dimensions');
 let copies=textures.map(t=>[t,t.version,t.image.data]);const state=water.stats;optics.update({ar:true});
 for(let i=0;i<100;i++)optics.update({ar:true});
 check(copies.every(([t,v,data])=>t.version===v&&t.image.data===data),'Ordinary updates never regenerate or upload the two textures');
 check(water.stats.time===state.time&&water.uniforms.opacity.value===opacity,'The optics adapter owns neither clock nor opacity');
 water.update({time:3.5,opacity:.23,quiet:true});optics.update({ar:true});
 check(water.uniforms.time.value===0&&water.uniforms.opacity.value===.23&&water.uniforms.optics.value.w===1,'Quiet clock and existing AR opacity reach the combined material');
 check(water.material.fragmentShader.includes('alpha*nearRoom')&&water.material.fragmentShader.includes('float alpha=opacity*'),'All new color/caustic results remain under the original alpha bound and near-viewer fade');
 check(water.material.vertexShader.includes('opticalX=modelViewMatrix[0].xyz'),'Refracted rays use per-draw transformed axes rather than one cached camera');
 let maxError=0;
 for(const scale of [[1,1,1],[.55,1,1],[2,.7,1.4]]){
  const m=new T.Matrix4().compose(new T.Vector3(3,1,-4),new T.Quaternion().setFromEuler(new T.Euler(.1,.7,.2)),new T.Vector3(...scale));
  const a=new T.Vector3().setFromMatrixColumn(m,0),b=new T.Vector3().setFromMatrixColumn(m,1),c=new T.Vector3().setFromMatrixColumn(m,2),ray=new T.Vector3(.2,-.8,.35).normalize();
  const ab=b.clone().cross(c),bc=c.clone().cross(a),ca=a.clone().cross(b),det=a.dot(ab);
  const actual=new T.Vector3(ray.dot(ab),ray.dot(bc),ray.dot(ca)).divideScalar(det),expected=ray.clone().applyMatrix3(new T.Matrix3().setFromMatrix4(m).invert());maxError=Math.max(maxError,actual.distanceTo(expected));
 }
 check(maxError<1e-12,'Local refracted-ray conversion agrees with matrix inversion under rotated nonuniform AR scale');
 let duplicate=false;try{SVGNWaterOptics.attach(T,water.material);}catch{duplicate=true;}check(duplicate&&optics.stats.extraTextures===2,'Duplicate attachment cannot allocate another hidden optics stack');
 const bad=water.material.clone();bad.userData={};bad.uniforms={waterNoise:{value:waterTexture}};bad.fragmentShader='incompatible';const badVertex=bad.vertexShader;
 let rejected=false;try{SVGNWaterOptics.attach(T,bad);}catch{rejected=true;}
 check(rejected&&bad.fragmentShader==='incompatible'&&bad.vertexShader===badVertex&&Object.keys(bad.uniforms).length===1,'Unsupported shader revisions fail without partial source or uniform mutation');bad.dispose();
 let freed=0,baseFreed=0;for(const t of textures)t.addEventListener('dispose',()=>freed++);waterTexture.addEventListener('dispose',()=>baseFreed++);
 optics.dispose();optics.dispose();
 check(freed===2&&baseFreed===0,'Optics disposes its own two textures once without freeing base water');
 check(water.material.fragmentShader===fragment&&water.material.vertexShader===vertex,'Detaching restores both original shader sources exactly');
 check(JSON.stringify(Object.keys(water.uniforms).sort())===JSON.stringify(originalUniforms),'Detaching removes every owned uniform and preserves all others');
 check(!optics.update({ar:true})&&optics.stats.extraTextures===0,'Disposed optics cannot reactivate or retain reported resources');
 const again=SVGNWaterOptics.attach(T,water.material);check(again.stats.extraTextures===2,'A deliberate later attachment remains supported');again.dispose();water.dispose();
 check(baseFreed===1,'The original owner still disposes its water resource exactly once');
 return {passed:checks.length,checks,threeRevision:T.REVISION,scope:'Actual bundled-Three objects, data, shader contracts and disposal; no GPU or physical-device measurement.'};
}''')
        assert not errors,errors
        (OUT/'objects.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
    finally:b.close()

# The updated module's bounded loading and fire resources are separate observations.
import subprocess
subprocess.run([__import__('sys').executable,str(ROOT/'prism-current/tests/effects-polish-objects.py')],check=True)
