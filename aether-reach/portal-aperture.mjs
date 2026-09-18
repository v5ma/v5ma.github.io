/* Ray/box aperture adapted from this repository's Dino Atlas portal.
 * Full depth beyond the aperture; no six-plane crop, render texture or second
 * simulation. Fragment coordinates cover sprites/particles and scaled XR rigs. */
import * as T from './vendor/three.module.js';
export const PORTAL_BUILD='aether-window-20260918.1';
export const PORTAL_SIZE=Object.freeze({width:60,height:35,depth:48});
export function boxInterval(o,d,size=PORTAL_SIZE){
 let enter=-Infinity,exit=Infinity;
 for(const [k,lo,hi] of [['x',-size.width/2,size.width/2],['y',0,size.height],['z',-size.depth/2,size.depth/2]]){
  if(!Number.isFinite(o[k])||!Number.isFinite(d[k]))return null;
  if(Math.abs(d[k])<1e-9){if(o[k]<lo||o[k]>hi)return null;continue;}
  const a=(lo-o[k])/d[k],b=(hi-o[k])/d[k];enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));
 }
 return exit>=Math.max(enter,0)&&exit>0?{enter:Math.max(enter,0),exit}:null;
}
export function seesFragment(eye,point,inverse,size=PORTAL_SIZE){
 const a=eye.clone().applyMatrix4(inverse),b=point.clone().applyMatrix4(inverse),hit=boxInterval(a,b.sub(a),size);
 return !!hit&&hit.enter<=1+1e-7;
}
export function enterPortal(origin,direction,inverse,size=PORTAL_SIZE){
 const a=new T.Vector3(origin.x,origin.y,origin.z).applyMatrix4(inverse),v=new T.Vector3(direction.x,direction.y,direction.z).transformDirection(inverse),hit=boxInterval(a,v,size);
 return hit?{origin:{x:origin.x+direction.x*(hit.enter+1e-4),y:origin.y+direction.y*(hit.enter+1e-4),z:origin.z+direction.z*(hit.enter+1e-4)},direction:{...direction}}:null;
}
export function faceVisible(eye,normal,point){return normal.dot(eye.clone().sub(point))<-.005;}
const declarations=`
uniform float aetherPortalEnabled;
uniform float aetherPortalNearGate;
uniform mat4 aetherPortalWorldFromClip;
uniform mat4 aetherPortalBoxFromWorld;
uniform vec4 aetherPortalViewport;
uniform vec3 aetherPortalEye;
uniform vec3 aetherPortalHalf;
bool aetherSlab(float o,float d,float lo,float hi,inout float en,inout float ex){
 if(abs(d)<1e-8)return o>=lo&&o<=hi;
 float a=(lo-o)/d,b=(hi-o)/d;en=max(en,min(a,b));ex=min(ex,max(a,b));return true;
}
bool aetherVisible(){
 vec2 xy=(gl_FragCoord.xy-aetherPortalViewport.xy)/aetherPortalViewport.zw*2.0-1.0;
 vec4 p=aetherPortalWorldFromClip*vec4(xy,gl_FragCoord.z*2.0-1.0,1.0);
 vec3 eye=(aetherPortalBoxFromWorld*vec4(aetherPortalEye,1.0)).xyz;
 vec3 end=(aetherPortalBoxFromWorld*vec4(p.xyz/p.w,1.0)).xyz;
 vec3 d=end-eye;float en=-1e20,ex=1e20;
 if(!aetherSlab(eye.x,d.x,-aetherPortalHalf.x,aetherPortalHalf.x,en,ex))return false;
 if(!aetherSlab(eye.y,d.y,0.0,2.0*aetherPortalHalf.y,en,ex))return false;
 if(!aetherSlab(eye.z,d.z,-aetherPortalHalf.z,aetherPortalHalf.z,en,ex))return false;
 return ex>=max(en,0.0)&&(aetherPortalNearGate<.5||en<=1.00001);
}
`;
export function patchPortalShader(shader,shared){
 Object.assign(shader.uniforms,shared);
 const main=/void\s+main\s*\(\s*(?:void\s*)?\)\s*\{/;
 if(!main.test(shader.fragmentShader))throw new Error('Missing portal fragment entry point');
 shader.fragmentShader=declarations+shader.fragmentShader.replace(main,'void aetherOriginalFragment(){')+'\nvoid main(){if(aetherPortalEnabled>0.5&&!aetherVisible())discard;aetherOriginalFragment();}\n';
}
export class PortalMaterials{
 constructor(){this.entries=new Map();this.uniforms={aetherPortalEnabled:{value:0},aetherPortalNearGate:{value:1},aetherPortalWorldFromClip:{value:new T.Matrix4()},aetherPortalBoxFromWorld:{value:new T.Matrix4()},aetherPortalViewport:{value:new T.Vector4(0,0,1,1)},aetherPortalEye:{value:new T.Vector3()},aetherPortalHalf:{value:new T.Vector3(30,17.5,24)}};}
 attach(m){
  if(!m||this.entries.has(m))return;
  if(m.isRawShaderMaterial)throw new Error('Raw material requires a portal adapter');
  const shared=this.uniforms,compile=m.onBeforeCompile,render=m.onBeforeRender,key=m.customProgramCacheKey,base=key.call(m);
  m.onBeforeCompile=function(s,r){compile.call(this,s,r);patchPortalShader(s,shared);};
  m.customProgramCacheKey=()=>base+'|'+PORTAL_BUILD;
  m.onBeforeRender=function(r,s,c,...args){render.call(this,r,s,c,...args);shared.aetherPortalWorldFromClip.value.multiplyMatrices(c.matrixWorld,c.projectionMatrixInverse);shared.aetherPortalEye.value.setFromMatrixPosition(c.matrixWorld);r.getCurrentViewport(shared.aetherPortalViewport.value);if(this.isShaderMaterial)this.uniformsNeedUpdate=true;};
  const dispose=()=>{this.entries.delete(m);m.removeEventListener('dispose',dispose);};
  this.entries.set(m,{compile,render,key,dispose});m.addEventListener('dispose',dispose);m.needsUpdate=true;
 }
 collect(root,exclude=new Set()){
  // Device and UI stages are never part of the game-world aperture, even
  // when a desktop preview runs before its first immersive session.
  const visit=o=>{if(exclude.has(o)||o.name==='XR locomotion rig'||o.userData?.xrStage||o.userData?.xrUI)return;for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])this.attach(m);for(const child of o.children)visit(child);};visit(root);
 }
 configure(matrix){this.uniforms.aetherPortalBoxFromWorld.value.copy(matrix).invert();}
 set active(on){this.uniforms.aetherPortalEnabled.value=on?1:0;}
 dispose(){this.active=false;for(const[m,e]of this.entries){m.onBeforeCompile=e.compile;m.onBeforeRender=e.render;m.customProgramCacheKey=e.key;m.removeEventListener('dispose',e.dispose);m.needsUpdate=true;}this.entries.clear();}
}
export function shellMaterial(normal,point,shared){
 return new T.ShaderMaterial({uniforms:{...shared,shellNormal:{value:normal},shellPoint:{value:point}},transparent:true,depthWrite:false,depthTest:false,side:T.DoubleSide,toneMapped:false,
 vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:`uniform mat4 aetherPortalBoxFromWorld;uniform vec3 shellNormal;uniform vec3 shellPoint;
 void main(){vec3 eye=(aetherPortalBoxFromWorld*vec4(cameraPosition,1.0)).xyz;if(dot(shellNormal,eye-shellPoint)>=-.005)discard;gl_FragColor=vec4(.15,.28,.31,.035);}`});
}
