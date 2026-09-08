/* Rendering-only finishing: no simulation imports, callbacks or state writes. */
import * as T from './vendor/three.module.js';
const washMaterials=new WeakMap();
export function recolorFacade(object,theme){
 if(theme!=='stone')return;
 object.traverse(mesh=>{if(!mesh.isMesh||mesh.material?.name!=='MI_Trim_Green')return;const original=mesh.material;
  if(!washMaterials.has(original)){const m=original.clone();m.name='Quay pale masonry and painted trim';m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float quayLuma=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.72,0.69,0.60)*sqrt(max(quayLuma,0.0)),0.83);
  `);};m.customProgramCacheKey=()=> 'quay-pale-masonry-v1';washMaterials.set(original,m);}
  mesh.material=washMaterials.get(original);
 });
}
export function polishEquipment(camera){
 const s=new T.Shape();s.moveTo(-.46,-.46);s.lineTo(.46,-.46);s.lineTo(.46,.46);s.lineTo(-.46,.46);s.closePath();
 const rounded=new T.ExtrudeGeometry(s,{depth:.92,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.04,bevelThickness:.04,curveSegments:1});rounded.translate(0,0,-.46);rounded.computeVertexNormals();
 // Only meshes already attached to the camera: held equipment, never walls.
 camera.traverse(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry')o.geometry=rounded;});
}
