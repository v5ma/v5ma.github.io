import * as T from './vendor/three.module.js';
/* Presentation only: sightline cutaway, never collision or enemy detection.
 * Enrol environment materials only; actors, pickups and hands stay whole. */
export function blocksPortalFocus(eye,point,focus,floor,radius){
 const direction=focus.clone().sub(eye),length=direction.lengthSq();if(length<1e-9||point.y<=floor)return false;
 const relative=point.clone().sub(eye),t=relative.dot(direction)/length;
 return t>0&&t<.985&&relative.addScaledVector(direction,-t).length()<radius;
}
export function createPortalOcclusion(){
 const entries=new Map(),uniforms={rwSightCut:{value:0},rwSightFocus:{value:new T.Vector3()},rwSightFloor:{value:0},rwSightRadius:{value:.18}};
 function attach(material){
  if(!material||entries.has(material))return;
  const compile=material.onBeforeCompile,key=material.customProgramCacheKey,base=key.call(material);
  material.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);
   const main=/void\s+main\s*\(\s*(?:void\s*)?\)\s*\{/;
   if(!main.test(shader.vertexShader)||!main.test(shader.fragmentShader))throw Error('Review portal occlusion shader contract');
   shader.vertexShader='varying vec3 rwSightView;\n'+shader.vertexShader.replace(main,'void rwSightOriginalVertex(){')+'\nvoid main(){rwSightOriginalVertex();vec4 p=inverse(projectionMatrix)*gl_Position;rwSightView=p.xyz/p.w;}';
   shader.fragmentShader=`uniform float rwSightCut;uniform vec3 rwSightFocus;uniform float rwSightFloor;uniform float rwSightRadius;varying vec3 rwSightView;\n`+shader.fragmentShader.replace(main,'void rwSightOriginalFragment(){')+`
void main(){
 if(rwSightCut>.5){
  vec3 point=cameraPosition+vec3(dot(viewMatrix[0].xyz,rwSightView),dot(viewMatrix[1].xyz,rwSightView),dot(viewMatrix[2].xyz,rwSightView));
  vec3 axis=rwSightFocus-cameraPosition;vec3 v=point-cameraPosition;float t=dot(v,axis)/max(dot(axis,axis),.000001);
  if(point.y>rwSightFloor&&t>0.&&t<.985&&length(v-axis*t)<rwSightRadius)discard;
 }
 rwSightOriginalFragment();
}`;
  };
  material.customProgramCacheKey=()=>base+'|rainward-portal-occlusion-1';
  const dispose=()=>{entries.delete(material);material.removeEventListener('dispose',dispose);};
  entries.set(material,{compile,key,dispose});material.addEventListener('dispose',dispose);material.needsUpdate=true;
 }
 return {collect(roots){for(const root of roots||[])root.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])attach(m);});},configure(focus,floor,scale){uniforms.rwSightFocus.value.copy(focus);uniforms.rwSightFloor.value=floor+.15*scale;uniforms.rwSightRadius.value=Math.max(.10,3.5*scale);},set active(v){uniforms.rwSightCut.value=v?1:0;},stats:()=>({materials:entries.size,active:!!uniforms.rwSightCut.value}),dispose(){uniforms.rwSightCut.value=0;for(const [m,e]of entries){m.onBeforeCompile=e.compile;m.customProgramCacheKey=e.key;m.removeEventListener('dispose',e.dispose);m.needsUpdate=true;}entries.clear();}};
}
