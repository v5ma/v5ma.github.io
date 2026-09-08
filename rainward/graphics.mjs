import {reducedWorldTexturing} from './surface-work.mjs';
/* Public rendering presets, not test-only shortcuts. Reduced mode replaces
 * costly per-pixel PBR/bump work with lit diffuse materials; geometry, AI,
 * collision, interaction targets and inventory remain completely unchanged. */
import * as T from './vendor/three.module.js';
export function graphicsPreset(scene,renderer){
 let environment=scene.environment;const originals=new WeakMap(),variants=new Map(),localLights=new Map(),lowMaps=new Map();let reduced=false;
 function material(original){
  if(!original?.isMeshStandardMaterial)return original;
  if(variants.has(original)&&variants.get(original).userData.sourceVersion!==original.version){variants.get(original).dispose();variants.delete(original);}if(!variants.has(original)){
   const m=new T.MeshLambertMaterial({color:original.color,map:original.map,emissive:original.emissive,emissiveIntensity:original.emissiveIntensity,transparent:original.transparent,opacity:original.opacity,side:original.side,alphaTest:original.alphaTest,depthWrite:original.depthWrite,depthTest:original.depthTest,vertexColors:original.vertexColors,flatShading:original.flatShading});
   if(original.userData.worldSurface){
    reducedWorldTexturing(m,original.userData.worldSurface);
    if(original.map){if(!lowMaps.has(original.map)){const texture=original.map.clone();texture.anisotropy=1;texture.needsUpdate=true;lowMaps.set(original.map,texture);}m.map=lowMaps.get(original.map);}
   }
   m.userData.sourceVersion=original.version;m.name='Reduced / '+(original.name||'surface');variants.set(original,m);
  }
  const m=variants.get(original);m.color.copy(original.color);m.emissive.copy(original.emissive);m.emissiveIntensity=original.emissiveIntensity;m.opacity=original.opacity;return m;
 }
 function update(){scene.traverse(o=>{if(o.isPointLight||o.isSpotLight){if(!localLights.has(o))localLights.set(o,o.visible);o.visible=reduced?false:localLights.get(o);}if(!o.material)return;let original=originals.get(o);if(!original){original=o.material;originals.set(o,original);}o.material=reduced?(Array.isArray(original)?original.map(material):material(original)):original;});}
 function set(low){reduced=!!low;scene.environment=reduced?null:environment;renderer.setPixelRatio(reduced?.6:Math.min(globalThis.devicePixelRatio||1,1.6));renderer.shadowMap.enabled=!reduced;update();}
 function dispose(){reduced=false;update();for(const m of variants.values())m.dispose();variants.clear();for(const t of lowMaps.values())t.dispose();lowMaps.clear();localLights.clear();}
 return {set,update,dispose,setEnvironment(value){environment=value;scene.environment=reduced?null:environment;},get reduced(){return reduced}};
}
