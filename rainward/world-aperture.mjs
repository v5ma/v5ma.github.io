// Perspective portal, not six-plane world clipping or a second map simulation.
// The ray/box aperture is evaluated per fragment using each actual render camera.
// It needs no stencil attachment (which an XR compositor need not provide).
import * as T from './vendor/three.module.js';
export const PORTAL_BUILD='rainward-freefield-20260917.1';
export const PORTAL_SPAN=48; // game units across the unchanged physical display
export function dimensions(width){return {width,depth:width*100/136,height:width*32/136};}
export function boxInverse(anchor,yaw){return new T.Matrix4().compose(anchor,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),new T.Vector3(1,1,1)).invert();}
// t is a ray parameter, not a distance unless direction is normalized.
export function boxInterval(origin,direction,size){
 let enter=-Infinity,exit=Infinity;
 for(const [k,lo,hi] of [['x',-size.width/2,size.width/2],['y',0,size.height],['z',-size.depth/2,size.depth/2]]){
  if(!Number.isFinite(origin[k])||!Number.isFinite(direction[k]))return null;
  if(Math.abs(direction[k])<1e-9){if(origin[k]<lo||origin[k]>hi)return null;continue;}
  const a=(lo-origin[k])/direction[k],b=(hi-origin[k])/direction[k];enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));
 }
 return exit>=Math.max(enter,0)&&exit>0?{enter:Math.max(0,enter),exit}:null;
}
export function seesFragment(eye,point,inverse,size){
 const a=eye.clone().applyMatrix4(inverse),b=point.clone().applyMatrix4(inverse),v=b.sub(a),hit=boxInterval(a,v,size);
 return !!hit&&hit.enter<=1+1e-7;
}
export function enterPortal(ray,inverse,size){
 const a=ray.origin.clone().applyMatrix4(inverse),d=ray.direction.clone().transformDirection(inverse),hit=boxInterval(a,d,size);
 if(!hit)return null;
 return {origin:ray.origin.clone().addScaledVector(ray.direction,hit.enter+1e-5),direction:ray.direction.clone()};
}
export function faceOpacity(eyeLocal,normal,point,closed=true){return !closed||normal.dot(eyeLocal.clone().sub(point))>=-.005?0:.035;}
export function uniforms(){return {dinoPortalEnabled:{value:0},dinoPortalInverse:{value:new T.Matrix4()},dinoPortalHalf:{value:new T.Vector3(1,.3,1)}};}
const declarations=`
uniform float dinoPortalEnabled;
uniform mat4 dinoPortalInverse;
uniform vec3 dinoPortalHalf;
varying vec3 dinoPortalView;
`;
const aperture=`
bool dinoPortalSlab(float o,float d,float lo,float hi,inout float entry,inout float leave) {
 if(abs(d)<0.00000001) return o>=lo && o<=hi;
 float a=(lo-o)/d, b=(hi-o)/d;
 entry=max(entry,min(a,b)); leave=min(leave,max(a,b)); return true;
}
bool dinoPortalVisible() {
 // viewMatrix and cameraPosition are supplied by Three for each eye, not a
 // shared center-eye uniform. Its camera rig is deliberately never scaled.
 vec3 world=cameraPosition+vec3(dot(viewMatrix[0].xyz,dinoPortalView),dot(viewMatrix[1].xyz,dinoPortalView),dot(viewMatrix[2].xyz,dinoPortalView));
 vec3 eye=(dinoPortalInverse*vec4(cameraPosition,1.0)).xyz;
 vec3 end=(dinoPortalInverse*vec4(world,1.0)).xyz;
 vec3 ray=end-eye;float entry=-1e20,leave=1e20;
 if(!dinoPortalSlab(eye.x,ray.x,-dinoPortalHalf.x,dinoPortalHalf.x,entry,leave))return false;
 if(!dinoPortalSlab(eye.y,ray.y,0.0,2.0*dinoPortalHalf.y,entry,leave))return false;
 if(!dinoPortalSlab(eye.z,ray.z,-dinoPortalHalf.z,dinoPortalHalf.z,entry,leave))return false;
 // Keep depth BEYOND the back/sides. Reject geometry before the entry surface
 // and every ray that misses the display. This is intentionally not a crop box.
 return leave>=max(entry,0.0) && entry<=1.00001;
}
`;
function renamedMain(source,name){
 const pattern=/void\s+main\s*\(\s*(?:void\s*)?\)\s*\{/;
 if(!pattern.test(source))throw new Error('Portal shader has no main function');
 return source.replace(pattern,'void '+name+'() {');
}
export function patchShader(shader,shared){
 Object.assign(shader.uniforms,shared);
 // Wrap the completed vertex shader, including existing material hooks. Using
 // its final projection handles instancing, skinning, sprites and custom water.
 shader.vertexShader=declarations+renamedMain(shader.vertexShader,'dinoPortalOriginalVertex')+`
void main(){dinoPortalOriginalVertex();vec4 p=inverse(projectionMatrix)*gl_Position;dinoPortalView=p.xyz/p.w;}
`;
 shader.fragmentShader=declarations+aperture+renamedMain(shader.fragmentShader,'dinoPortalOriginalFragment')+`
void main(){if(dinoPortalEnabled>0.5&&!dinoPortalVisible())discard;dinoPortalOriginalFragment();}
`;
}
export class PortalMaterials {
 constructor(){this.uniforms=uniforms();this.entries=new Map();}
 attach(material){
  if(!material||this.entries.has(material))return;
  // The bundled game uses built-ins and ShaderMaterial; reject unsupported raw
  // shader contracts instead of letting an unmasked object leak into the room.
  if(material.isRawShaderMaterial)throw new Error('Raw shader requires an explicit portal adapter');
  const compile=material.onBeforeCompile,key=material.customProgramCacheKey,base=key.call(material);
  material.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);patchShader(shader,this.userData.dinoPortalUniforms);};
  material.userData.dinoPortalUniforms=this.uniforms;
  material.customProgramCacheKey=()=>base+'|'+PORTAL_BUILD;
  const dispose=()=>{this.entries.delete(material);material.removeEventListener('dispose',dispose);};
  this.entries.set(material,{compile,key,dispose});material.addEventListener('dispose',dispose);material.needsUpdate=true;
 }
 collect(root){root.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])this.attach(m);});}
 configure(anchor,yaw,size){this.uniforms.dinoPortalInverse.value.copy(boxInverse(anchor,yaw));this.uniforms.dinoPortalHalf.value.set(size.width/2,size.height/2,size.depth/2);}
 set active(value){this.uniforms.dinoPortalEnabled.value=value?1:0;}
 dispose(){this.active=false;for(const [m,e] of this.entries){m.onBeforeCompile=e.compile;m.customProgramCacheKey=e.key;delete m.userData.dinoPortalUniforms;m.removeEventListener('dispose',e.dispose);m.needsUpdate=true;}this.entries.clear();}
}
// The shell is a thin frame and very light far-side glass, never an opaque end
// wall. A panel between either render eye and the character is transparent for
// that eye. Preset top/front openings remain valid, with automatic cutaway first.
export function shellMaterial(normal,point,shared){
 return new T.ShaderMaterial({uniforms:{...shared,shellNormal:{value:normal},shellPoint:{value:point}},transparent:true,depthWrite:false,depthTest:false,side:T.DoubleSide,toneMapped:false,
  vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`uniform mat4 dinoPortalInverse;uniform vec3 shellNormal;uniform vec3 shellPoint;
  void main(){vec3 eye=(dinoPortalInverse*vec4(cameraPosition,1.0)).xyz;if(dot(shellNormal,eye-shellPoint)>=-0.005)discard;gl_FragColor=vec4(0.16,0.30,0.30,0.035);}`});
}
