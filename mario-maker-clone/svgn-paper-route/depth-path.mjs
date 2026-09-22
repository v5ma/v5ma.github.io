/* One curved presentation for the original scene, including instanced packets,
 * contacts, rails and scenery. Never wraps the headset, menus or physics world.
 * Horizontal framing recenters C(player.s); depth motion remains visible.
 */
import * as T from './vendor/three.webgpu.js';
import {PROFILE,accepts,createPath} from './depth-path-core.mjs';
const path=createPath();
export function createDepthWarp(scene){
 const {uniform,vec3,vec4,ivec2,textureLoad,Fn,positionLocal,normalLocal,modelWorldMatrix,modelWorldMatrixInverse,transformNormal,transpose,mix,buffer,instanceIndex,mat4,instancedDynamicBufferAttribute}=T.TSL;
 const tex=new T.DataTexture(path.data,PROFILE.samples,1,T.RGBAFormat,T.FloatType);tex.minFilter=tex.magFilter=T.NearestFilter;tex.generateMipmaps=false;tex.needsUpdate=true;
 const root=uniform(new T.Matrix4()).onRenderUpdate(()=>{scene.updateWorldMatrix(true,false);return scene.matrixWorld;});
 const inverse=uniform(new T.Matrix4()).onRenderUpdate(()=>{scene.updateWorldMatrix(true,false);return new T.Matrix4().copy(scene.matrixWorld).invert();});
 const follow=uniform(0),rigid=uniform(new T.Vector3());let hero=null,active=false;
 const members=new WeakSet(),originals=new Map(),objects=new Map(),instances=new Map();
 // Pinned r177 emits positionNode BEFORE native instance placement. Conjugate
 // the warp through the actual instance frame so native placement is not doubled.
 function instanceFrame(object){
  if(!object.isInstancedMesh)return null;
  let item=instances.get(object);
  if(!item){
   const attribute=object.instanceMatrix,capacity=attribute.array.length/16;
   if(capacity<=1000)item={node:buffer(attribute.array,'mat4',Math.max(1,capacity)).element(instanceIndex)};
   else{
    const shared=new T.InstancedInterleavedBuffer(attribute.array,16,1);
    item={shared,node:mat4(...[0,4,8,12].map(offset=>instancedDynamicBufferAttribute(shared,'vec4',16,offset)))};
   }
   instances.set(object,item);
  }
  return item.node;
 }
 const undoInstance=Fn(([point,matrix])=>{
  const a=matrix.element(0).xyz,b=matrix.element(1).xyz,c=matrix.element(2).xyz,v=point.sub(matrix.element(3).xyz);
  const determinant=a.dot(b.cross(c)),safe=determinant.abs().max(1e-8).mul(determinant.lessThan(0).select(-1,1));
  return vec3(v.dot(b.cross(c)),v.dot(c.cross(a)),v.dot(a.cross(b))).div(safe);
 });
 rigid.onObjectUpdate(({object})=>{const p=rigid.value;p.set(0,0,0);if(members.has(object)&&hero){const v=hero.getWorldPosition(new T.Vector3());scene.worldToLocal(v);p.set(v.x,v.z,1);}return p;});
 const lookup=Fn(([s])=>{
  const f=s.div(path.step).clamp(0,PROFILE.samples-1),i=f.floor(),a=textureLoad(tex,ivec2(i,0)),b=textureLoad(tex,ivec2(i.add(1).min(PROFILE.samples-1),0));
  const v=mix(a,b,f.fract()),t=v.zw.normalize();return vec4(s.add(v.x),v.y,t.x,t.y);
 });
 const project=Fn(([p])=>{const c=lookup(p.x),d=p.z.clamp(-PROFILE.depthLimit,PROFILE.depthLimit);return vec3(c.x.sub(d.mul(c.w)),p.y,c.y.add(d.mul(c.z)).add(p.z.sub(d)));});
 const deform=Fn(([p])=>{
  const c=lookup(rigid.x),base=project(vec3(rigid.x,p.y,rigid.y)),x=p.x.sub(rigid.x),z=p.z.sub(rigid.y);
  const body=base.add(vec3(x.mul(c.z).sub(z.mul(c.w)),0,x.mul(c.w).add(z.mul(c.z))));
  return mix(project(p),body,rigid.z);
 });
 function restoreMaterial(m,record){
  for(const key of ['positionNode','normalNode'])if(m[key]===record[key]){if(record.owned[key])m[key]=record.prior[key];else delete m[key];}
  m.removeEventListener('dispose',record.disposed);m.needsUpdate=true;originals.delete(m);
 }
 function attach(m){
  if(!m?.isMaterial||originals.has(m))return;
  const record={prior:{positionNode:m.positionNode,normalNode:m.normalNode},owned:{positionNode:Object.hasOwn(m,'positionNode'),normalNode:Object.hasOwn(m,'normalNode')}};
  record.positionNode=Fn(builder=>{
   const instance=instanceFrame(builder.object),local=record.prior.positionNode||positionLocal;
   const transform=instance?modelWorldMatrix.mul(instance):modelWorldMatrix;
   const p=inverse.mul(transform.mul(vec4(local,1))).xyz.toVar();
   // Transport geometric normals in the vertex stage, not by repeating texture
   // lookups for every shaded fragment. Existing authored normal nodes remain.
   const n=inverse.mul(vec4(transformNormal(normalLocal,transform),0)).xyz.normalize();
   const a=deform(p.add(vec3(.5,0,0))).sub(deform(p.sub(vec3(.5,0,0))));
   const b=deform(p.add(vec3(0,0,.5))).sub(deform(p.sub(vec3(0,0,.5))));
   const det=a.x.mul(b.z).sub(a.z.mul(b.x));
   const mapped=vec3(b.z.mul(n.x).sub(a.z.mul(n.z)).div(det),n.y,a.x.mul(n.z).sub(b.x.mul(n.x)).div(det));
   normalLocal.assign(transpose(transform).mul(root.mul(vec4(mapped,0))).xyz.normalize());
   const out=deform(p).sub(vec3(follow,0,0)),modelPoint=modelWorldMatrixInverse.mul(root.mul(vec4(out,1))).xyz;
   return instance?undoInstance(modelPoint,instance):modelPoint;
  })();
  record.normalNode=record.prior.normalNode;
  record.disposed=()=>{originals.delete(m);};m.addEventListener('dispose',record.disposed);
  m.positionNode=record.positionNode;
  m.needsUpdate=true;originals.set(m,record);
 }
 function restore(){
  for(const [m,r]of originals)restoreMaterial(m,r);
  for(const [o,cull]of objects)o.frustumCulled=cull;
  objects.clear();instances.clear();active=false;hero=null;
 }
 return {
  update(on,riderS=0,rider=null){
   if(!on){if(active)restore();return;}active=true;hero=rider;
   follow.value=path.sample(riderS).x-riderS;
   hero?.traverse(o=>members.add(o));
   for(const [object,item]of instances)if(item.shared)item.shared.version=object.instanceMatrix.version;
   const seen=new Set(),seenMaterials=new Set();
   scene.traverse(o=>{
    if(!o.geometry||!o.material)return;seen.add(o);
    // GPU displacement invalidates source bounding volumes. Restore on leaving.
    if(!objects.has(o))objects.set(o,o.frustumCulled);o.frustumCulled=false;
    for(const m of Array.isArray(o.material)?o.material:[o.material]){seenMaterials.add(m);attach(m);}
   });
   for(const [o,cull]of objects)if(!seen.has(o)){o.frustumCulled=cull;objects.delete(o);instances.delete(o);}
   for(const [m,r]of originals)if(!seenMaterials.has(m))restoreMaterial(m,r);
  },
  dispose(){restore();tex.dispose();},
  get diagnostics(){return {active,materials:originals.size,meshes:objects.size,profile:PROFILE.id,horizontalCorrection:follow.value};}
 };
}
let warp=null,ownedScene=null,lastProfile=null;
function update(){
 const engine=window.__merged;if(!engine?.scene)return;
 if(ownedScene!==engine.scene){warp?.dispose();ownedScene=engine.scene;warp=createDepthWarp(ownedScene);}
 const data=window.__sky?.state?.data?.gp?.waterwheel;
 const selected=!!window.RouteWorkshop?.testing&&accepts(data?.depthPath);
 const active=selected&&window.__delivery?.state.view==='3d';lastProfile=selected?data.depthPath:null;
 warp.update(active,typeof player==='undefined'?0:player.x+player.w/2,window.__cloudview?.hero?.group);
}
if(typeof window!=='undefined'){
// Subdivide long authored structural boxes only in the new preview; the
// collision document is unchanged. The existing spatial batching is retained.
const assets=window.CloudAssets,create=assets?.create;
if(create)assets.create=function(...args){
 const kit=create.apply(this,args),Base=kit.Batch;
 if(accepts(window.__sky?.state?.data?.gp?.waterwheel?.depthPath)){
  kit.Batch=class extends Base{box(x,y,z,w,h,d,c,a=0){
   const n=Math.max(1,Math.ceil(Math.abs(w)/64));
   if(n===1)return super.box(x,y,z,w,h,d,c,a);
   for(let i=0;i<n;i++){const u=-w/2+(i+.5)*w/n;super.box(x+u*Math.cos(a),y+u*Math.sin(a),z,w/n,h,d,c,a);}
   return this;
  }};
 }
 return kit;
};
const visual=window.SkyVisual;
if(visual){const prior=visual.update;visual.update=function(...args){const result=prior.apply(this,args);update();return result;};}
// The 2D and Workshop render paths deliberately skip SkyVisual.update. Release
// deformation there as well; use the existing render owner, never a new loop.
const draw=window.render;
if(draw)window.render=function(...args){
 if(!window.RouteWorkshop?.testing||window.__delivery?.state.view!=='3d')update();
 return draw.apply(this,args);
};
window.SkyCycleDepth=Object.freeze({version:'0.28.0',sample:s=>path.sample(s),project:p=>path.project(p),get diagnostics(){return {...warp?.diagnostics,selected:!!lastProfile,headDriven:false,physics:'unchanged-2d',rigidRider:true};}});

}
