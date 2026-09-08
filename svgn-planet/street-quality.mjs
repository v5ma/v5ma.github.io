/* Low-power rendering keeps the same textured meshes. It drops per-fragment
 * PBR reflection/normal work, not architectural detail or collision geometry. */
import * as T from './vendor/three.module.js';
export function createArtQuality(root){
 const lowMaterials=new Map(),meshes=[];let previous=null;
 root.traverse(o=>{if(o.isMesh&&o.material.isMeshStandardMaterial)meshes.push({mesh:o,high:o.material});});
 function low(m){
  if(lowMaterials.has(m))return lowMaterials.get(m);
  const lite=new T.MeshLambertMaterial({name:m.name+' / diffuse',color:m.color,map:m.map,
   emissive:m.emissive,emissiveMap:m.emissiveMap,emissiveIntensity:m.emissiveIntensity,
   alphaMap:m.alphaMap,alphaTest:m.alphaTest,side:m.side,opacity:m.opacity,
   transparent:m.transparent,vertexColors:m.vertexColors,aoMap:m.aoMap,aoMapIntensity:m.aoMapIntensity});
  lowMaterials.set(m,lite);return lite;
 }
 return {update(useLow){if(previous===useLow)return;previous=useLow;for(const {mesh,high}of meshes)mesh.material=useLow?low(high):high;},inspect:()=>({diffuseLowPower:!!previous,sharedMaterials:lowMaterials.size})};
}
