/* Ray/box aperture adapted from the studio's Dino Atlas portal (03dd03ba).
 * Per-eye projected masking, NOT clipping world depth at the exhibit walls.
 * Local Three only; no second simulation, stencil attachment or remote assets. */
import * as T from './vendor/three.module.js';
export const PORTAL_BUILD='guild-portal-20260917';
export function boxInterval(origin,direction,size){
 let enter=-Infinity,exit=Infinity;
 for(const [k,lo,hi] of [['x',-size.width/2,size.width/2],['y',0,size.height],['z',-size.depth/2,size.depth/2]]){
  if(!Number.isFinite(origin[k])||!Number.isFinite(direction[k]))return null;
  if(Math.abs(direction[k])<1e-9){if(origin[k]<lo||origin[k]>hi)return null;continue;}
  const a=(lo-origin[k])/direction[k],b=(hi-origin[k])/direction[k];enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));
 }
 return exit>=Math.max(enter,0)&&exit>0?{enter:Math.max(0,enter),exit}:null;
}
export function seesFragment(eye,point,inverse,size){const a=eye.clone().applyMatrix4(inverse),b=point.clone().applyMatrix4(inverse);const h=boxInterval(a,b.sub(a),size);return !!h&&h.enter<=1+1e-7;}
export function faceOpacity(eye,normal,point,closed=true){return !closed||normal.dot(eye.clone().sub(point))>=-.005?0:.025;}
export function centeredWorldMatrix(actor,scale,heading){
 const m=new T.Matrix4().makeRotationY(Math.PI-heading);m.scale(new T.Vector3(scale,scale,scale));
 const offset=new T.Vector3(actor.x,actor.y,actor.z).applyMatrix4(m).negate();return m.setPosition(offset);
}
const declarations=`uniform float guildPortalEnabled;uniform mat4 guildPortalInverse;uniform vec3 guildPortalHalf;varying vec3 guildPortalView;\n`;
const aperture=`
bool guildSlab(float o,float d,float lo,float hi,inout float entry,inout float leave){
 if(abs(d)<0.00000001)return o>=lo&&o<=hi;float a=(lo-o)/d,b=(hi-o)/d;
 entry=max(entry,min(a,b));leave=min(leave,max(a,b));return true;
}
bool guildVisible(){
 vec3 world=cameraPosition+vec3(dot(viewMatrix[0].xyz,guildPortalView),dot(viewMatrix[1].xyz,guildPortalView),dot(viewMatrix[2].xyz,guildPortalView));
 vec3 eye=(guildPortalInverse*vec4(cameraPosition,1.0)).xyz;
 vec3 ray=(guildPortalInverse*vec4(world,1.0)).xyz-eye;float entry=-1e20,leave=1e20;
 if(!guildSlab(eye.x,ray.x,-guildPortalHalf.x,guildPortalHalf.x,entry,leave))return false;
 if(!guildSlab(eye.y,ray.y,0.0,2.0*guildPortalHalf.y,entry,leave))return false;
 if(!guildSlab(eye.z,ray.z,-guildPortalHalf.z,guildPortalHalf.z,entry,leave))return false;
 return leave>=max(entry,0.0)&&entry<=1.00001;
}
`;
function rename(source,name){const re=/void\s+main\s*\(\s*(?:void\s*)?\)\s*\{/;if(!re.test(source))throw Error('Portal shader missing main');return source.replace(re,'void '+name+'(){');}
export function patchShader(shader,shared){
 Object.assign(shader.uniforms,shared);
 shader.vertexShader=declarations+rename(shader.vertexShader,'guildOriginalVertex')+'\nvoid main(){guildOriginalVertex();vec4 p=inverse(projectionMatrix)*gl_Position;guildPortalView=p.xyz/p.w;}';
 shader.fragmentShader=declarations+aperture+rename(shader.fragmentShader,'guildOriginalFragment')+'\nvoid main(){if(guildPortalEnabled>0.5&&!guildVisible())discard;guildOriginalFragment();}';
}
export class PortalMaterials{
 constructor(){this.uniforms={guildPortalEnabled:{value:0},guildPortalInverse:{value:new T.Matrix4()},guildPortalHalf:{value:new T.Vector3(1,.3,1)}};this.entries=new Map();}
 attach(m){
  if(!m||this.entries.has(m))return;if(m.isRawShaderMaterial)throw Error('Raw shader requires an explicit portal adapter');
  const compile=m.onBeforeCompile,key=m.customProgramCacheKey,base=key.call(m),shared=this.uniforms;
  m.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);patchShader(shader,shared);};m.customProgramCacheKey=()=>base+'|'+PORTAL_BUILD;
  const dispose=()=>{this.entries.delete(m);m.removeEventListener('dispose',dispose);};this.entries.set(m,{compile,key,dispose});m.addEventListener('dispose',dispose);m.needsUpdate=true;
 }
 collect(root){root.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])this.attach(m);});}
 configure(matrix,size){this.uniforms.guildPortalInverse.value.copy(matrix).invert();this.uniforms.guildPortalHalf.value.set(size.width/2,size.height/2,size.depth/2);}
 set active(v){this.uniforms.guildPortalEnabled.value=v?1:0;}
 dispose(){this.active=false;for(const [m,e]of this.entries){m.onBeforeCompile=e.compile;m.customProgramCacheKey=e.key;m.removeEventListener('dispose',e.dispose);m.needsUpdate=true;}this.entries.clear();}
}
export function shellMaterial(normal,point,shared){return new T.ShaderMaterial({uniforms:{...shared,shellNormal:{value:normal},shellPoint:{value:point}},transparent:true,depthWrite:false,depthTest:false,side:T.DoubleSide,toneMapped:false,vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform mat4 guildPortalInverse;uniform vec3 shellNormal;uniform vec3 shellPoint;void main(){vec3 eye=(guildPortalInverse*vec4(cameraPosition,1.0)).xyz;if(dot(shellNormal,eye-shellPoint)>=-0.005)discard;gl_FragColor=vec4(0.16,0.30,0.30,0.025);}'});}
