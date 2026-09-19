/* Adapted from dino-atlas/diorama-portal.js, blob 03dd03ba56795918905d3dec264843ababb3d5fe.
 * Same SVGN repository. Per-eye perspective aperture, NOT a world-space crop.
 * No stencil attachment is required from the XR compositor. */
import * as T from '../vendor/three.module.js';
export const PORTAL_BUILD='neighborhood-player-portal-0.13.0';
export function boxInterval(o,d,size){
 let enter=-Infinity,exit=Infinity;
 for(const [k,lo,hi] of [['x',-size.x/2,size.x/2],['y',0,size.y],['z',-size.z/2,size.z/2]]){
  if(!Number.isFinite(o[k])||!Number.isFinite(d[k]))return null;
  if(Math.abs(d[k])<1e-9){if(o[k]<lo||o[k]>hi)return null;continue;}
  const a=(lo-o[k])/d[k],b=(hi-o[k])/d[k];enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));
 }
 return exit>=Math.max(enter,0)&&exit>0?{enter:Math.max(0,enter),exit}:null;
}
export function seesFragment(eye,point,inverse,size){const a=eye.clone().applyMatrix4(inverse),d=point.clone().applyMatrix4(inverse).sub(a),hit=boxInterval(a,d,size);return !!hit&&hit.enter<=1+1e-7;}
export function followPosition(anchor,player,yaw,scale,footHeight){return new T.Vector3(player.x,player.y,player.z).multiplyScalar(-scale).applyAxisAngle(new T.Vector3(0,1,0),yaw).add(anchor).add(new T.Vector3(0,footHeight,0));}
const declarations='uniform float wardPortalEnabled;uniform mat4 wardPortalInverse;uniform vec3 wardPortalSize;varying vec3 wardPortalView;\n';
const aperture=`
bool wardSlab(float o,float d,float lo,float hi,inout float entry,inout float leave){
 if(abs(d)<1e-8)return o>=lo&&o<=hi;
 float a=(lo-o)/d,b=(hi-o)/d;entry=max(entry,min(a,b));leave=min(leave,max(a,b));return true;
}
bool wardVisible(){
 vec3 world=cameraPosition+vec3(dot(viewMatrix[0].xyz,wardPortalView),dot(viewMatrix[1].xyz,wardPortalView),dot(viewMatrix[2].xyz,wardPortalView));
 vec3 eye=(wardPortalInverse*vec4(cameraPosition,1.)).xyz;
 vec3 ray=(wardPortalInverse*vec4(world,1.)).xyz-eye;float entry=-1e20,leave=1e20;
 if(!wardSlab(eye.x,ray.x,-wardPortalSize.x/2.,wardPortalSize.x/2.,entry,leave))return false;
 if(!wardSlab(eye.y,ray.y,0.,wardPortalSize.y,entry,leave))return false;
 if(!wardSlab(eye.z,ray.z,-wardPortalSize.z/2.,wardPortalSize.z/2.,entry,leave))return false;
 return leave>=max(entry,0.)&&entry<=1.00001;
}
`;
// One wrapper per material, even when the chapter joins the shared renderer.
const portalOwners=new WeakMap();
function rename(source,name){const p=/void\s+main\s*\(\s*(?:void\s*)?\)\s*\{/;if(!p.test(source))throw Error('Unsupported portal shader');return source.replace(p,'void '+name+'(){');}
export class PortalMaterials{
 constructor(){this.uniforms={wardPortalEnabled:{value:0},wardPortalInverse:{value:new T.Matrix4()},wardPortalSize:{value:new T.Vector3(1.96,.68,1.72)}};this.entries=new Map();}
 collect(root){root.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])this.attach(m);});}
 attach(m){
  if(this.entries.has(m))return;if(m.isRawShaderMaterial)throw Error('Portal raw shader adapter required');
  const existing=portalOwners.get(m);
  if(existing){
   // The integrated scene takes ownership from its standalone presentation.
   // Rebind uniforms without nesting another copy of the GLSL functions.
   existing.owner.entries.delete(m);existing.owner=this;existing.uniforms=this.uniforms;
   this.entries.set(m,existing);m.needsUpdate=true;return;
  }
  const compile=m.onBeforeCompile,key=m.customProgramCacheKey,base=key.call(m);
  const entry={compile,key,owner:this,uniforms:this.uniforms};portalOwners.set(m,entry);
  m.onBeforeCompile=function(s,r){compile.call(this,s,r);Object.assign(s.uniforms,entry.uniforms);
   s.vertexShader=declarations+rename(s.vertexShader,'wardVertex')+'\nvoid main(){wardVertex();vec4 p=inverse(projectionMatrix)*gl_Position;wardPortalView=p.xyz/p.w;}';
   s.fragmentShader=declarations+aperture+rename(s.fragmentShader,'wardFragment')+'\nvoid main(){if(wardPortalEnabled>.5&&!wardVisible())discard;wardFragment();}';};
  m.customProgramCacheKey=()=>base+'|'+PORTAL_BUILD;m.needsUpdate=true;this.entries.set(m,entry);
 }
 configure(anchor,yaw,size){this.uniforms.wardPortalInverse.value.compose(anchor,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),new T.Vector3(1,1,1)).invert();this.uniforms.wardPortalSize.value.copy(size);}
 set active(v){this.uniforms.wardPortalEnabled.value=v?1:0;}
 get active(){return this.uniforms.wardPortalEnabled.value===1;}
}
export function createPortalFrame(scene,materials){
 const group=new T.Group();group.name='Fixed room-space portal';group.userData.portalPresentation=true;scene.add(group);group.visible=false;
 const geo=new T.BoxGeometry(1,1,1),frame=new T.LineSegments(new T.EdgesGeometry(geo),new T.LineBasicMaterial({color:0x87b9b5,transparent:true,opacity:.55,depthTest:false}));frame.renderOrder=100;group.add(frame);
 const faces=[];
 for(const [normal,point,rotation]of [[[-1,0,0],[-.5,.5,0],[0,Math.PI/2,0]],[[1,0,0],[.5,.5,0],[0,Math.PI/2,0]],[[0,0,-1],[0,.5,-.5],[0,0,0]],[[0,0,1],[0,.5,.5],[0,0,0]],[[0,1,0],[0,1,0],[-Math.PI/2,0,0]]]){
  const m=new T.ShaderMaterial({uniforms:{...materials.uniforms,faceNormal:{value:new T.Vector3(...normal)},facePoint:{value:new T.Vector3()}},transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,toneMapped:false,
   vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform mat4 wardPortalInverse;uniform vec3 faceNormal;uniform vec3 facePoint;void main(){vec3 eye=(wardPortalInverse*vec4(cameraPosition,1.)).xyz;if(dot(faceNormal,eye-facePoint)>=-.005)discard;gl_FragColor=vec4(.12,.28,.3,.025);}'});
  const mesh=new T.Mesh(new T.PlaneGeometry(1,1),m);mesh.rotation.set(...rotation);mesh.renderOrder=99;group.add(mesh);faces.push({mesh,normal,point});
 }
 return {group,update(anchor,yaw,size,opening){group.position.copy(anchor);group.rotation.set(0,yaw,0);frame.position.y=size.y/2;frame.scale.copy(size);
  for(let i=0;i<faces.length;i++){const {mesh,point,normal}=faces[i];mesh.position.set(point[0]*size.x,point[1]*size.y,point[2]*size.z);mesh.scale.set(i<2?size.z:size.x,i===4?size.z:size.y,1);mesh.material.uniforms.facePoint.value.copy(mesh.position);mesh.visible=i<3||(i===3?opening==='top':opening==='front');}
 },dispose(){group.removeFromParent();}};
}
