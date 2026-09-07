/* Public rendering presets, not test-only shortcuts. Reduced mode replaces
 * costly per-pixel PBR/bump work with lit diffuse materials; geometry, AI,
 * collision, interaction targets and inventory remain completely unchanged. */
import * as T from './vendor/three.module.js';
export function graphicsPreset(scene,renderer){
 const environment=scene.environment,originals=new WeakMap(),variants=new Map();let reduced=false;
 function material(original){
  if(!original?.isMeshStandardMaterial)return original;
  if(!variants.has(original)){
   const m=new T.MeshLambertMaterial({color:original.color,map:original.map,emissive:original.emissive,emissiveIntensity:original.emissiveIntensity,transparent:original.transparent,opacity:original.opacity,side:original.side,alphaTest:original.alphaTest,depthWrite:original.depthWrite,depthTest:original.depthTest,vertexColors:original.vertexColors,flatShading:original.flatShading});
   m.name='Reduced / '+(original.name||'surface');variants.set(original,m);
  }
  return variants.get(original);
 }
 function update(){scene.traverse(o=>{if(!o.material)return;let original=originals.get(o);if(!original){original=o.material;originals.set(o,original);}o.material=reduced?(Array.isArray(original)?original.map(material):material(original)):original;});}
 function set(low){reduced=!!low;scene.environment=reduced?null:environment;renderer.setPixelRatio(reduced?.85:Math.min(globalThis.devicePixelRatio||1,1.6));renderer.shadowMap.enabled=!reduced;update();}
 function dispose(){reduced=false;update();for(const m of variants.values())m.dispose();variants.clear();}
 return {set,update,dispose,get reduced(){return reduced}};
}
