/* Rendering-only finishing: no simulation imports, callbacks or state writes. */
import * as T from './vendor/three.module.js';
const washMaterials=new WeakMap();
export function recolorFacade(object,theme){
 let count=0;if(theme!=='stone')return count;
 object.traverse(mesh=>{if(!mesh.isMesh||!/MI_Trim_Green/.test(mesh.material?.name||''))return;const original=mesh.material;
  if(!washMaterials.has(original)){const m=original.clone();m.name='Quay pale masonry and painted trim';m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float quayLuma=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
   diffuseColor.rgb=vec3(0.78,0.76,0.68)*sqrt(max(quayLuma,0.0));
  `);};m.customProgramCacheKey=()=> 'quay-pale-masonry-v2';washMaterials.set(original,m);}
  mesh.material=washMaterials.get(original);count++;
 });return count;
}
export function polishEquipment(camera){
 const s=new T.Shape();s.moveTo(-.46,-.46);s.lineTo(.46,-.46);s.lineTo(.46,.46);s.lineTo(-.46,.46);s.closePath();
 const rounded=new T.ExtrudeGeometry(s,{depth:.92,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.04,bevelThickness:.04,curveSegments:1});rounded.translate(0,0,-.46);rounded.computeVertexNormals();
 camera.traverse(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry')o.geometry=rounded;});
}
export function cloudSky(hdr){
 return new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{image:{value:hdr},haze:{value:new T.Color('#d6e3ea')}},vertexShader:'varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
  uniform sampler2D image;uniform vec3 haze;varying vec3 skyDirection;
  void main(){vec3 d=normalize(skyDirection);float u=atan(d.z,d.x)/6.28318530718+0.5+0.2387;float v=asin(clamp(d.y,-1.0,1.0))/3.14159265359+0.5;
   vec3 clouds=texture2D(image,vec2(fract(u),max(v,0.53))).rgb*0.8;
   float mist=1.0-smoothstep(-0.10,0.13,d.y);gl_FragColor=vec4(mix(clouds,haze,mist),1.0);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
}
