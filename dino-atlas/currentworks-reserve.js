// Pinned Currentworks graphics, adapted to Dino's r177 renderer and existing world.
// This adapter owns no controls, physics, storage, camera or animation loop.
import * as T from './vendor/three.module.js';
import Water from './vendor/currentworks/water.mjs';
import Trees from './vendor/currentworks/trees.mjs';
import {LAKE,HOME,roadDistance} from './ranger-data.js';
export const CURRENTWORKS_BUILD='currentworks-reserve-20260922.1';
export const WATER_SHAPES=Object.freeze([
 Object.freeze({id:'woodland-pond',x:LAKE.x,z:LAKE.z,rx:LAKE.r,rz:LAKE.r}),
 Object.freeze({id:'wetland-lagoon',x:-164,z:-155,rx:76,rz:57}),
 Object.freeze({id:'channel-lagoon',x:-238,z:-152,rx:38,rz:25})
]);
const inside=(p,s)=>((p.x-s.x)/s.rx)**2+((p.z-s.z)/s.rz)**2<1;
export function ownsWater(index,p){
 const s=WATER_SHAPES[index];
 return !!s&&Number.isFinite(p?.x)&&Number.isFinite(p?.z)&&inside(p,s)&&
  !WATER_SHAPES.slice(0,index).some(o=>inside(p,o))&&
  !(index>0&&p.x>=-479&&p.x<=-221&&Math.abs(p.z+152)<=18);
}
export function chooseTrees(trunks){
 const candidates=[],m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();
 for(let i=0;i<(trunks?.count||0);i++){
  trunks.getMatrixAt(i,m);m.decompose(p,q,s);
  const height=Math.min(11.5,s.y),radius=height*.72+1.5;
  if(roadDistance(p.x,p.z)<radius+6||Math.hypot(p.x-HOME.x,p.z-HOME.z)<radius+21||
   Math.hypot(p.x-LAKE.x,p.z-LAKE.z)<radius+LAKE.r+2||
   [{x:31,z:-26},{x:47,z:-54},{x:24,z:17},{x:-12,z:13}].some(a=>Math.hypot(p.x-a.x,p.z-a.z)<radius+7))continue;
  candidates.push({index:i,id:'classic-tree-'+i,seed:6022+i*37,preset:['alder','palm','willow'][i%3],height,position:[p.x,0,p.z],yaw:i*.37,radius});
 }
 candidates.sort((a,b)=>Math.hypot(...[a.position[0],a.position[2]])-Math.hypot(...[b.position[0],b.position[2]]));
 const selected=[];
 for(const d of candidates){if(selected.every(a=>Math.hypot(a.position[0]-d.position[0],a.position[2]-d.position[2])>12))selected.push(d);if(selected.length===12)break;}
 return selected;
}
function maskWater(w,index){
 const s=WATER_SHAPES[index],u=w.material.uniforms;
 u.atlasEllipse={value:new T.Vector4(s.x,s.z,s.rx,s.rz)};
 u.atlasPrior={value:WATER_SHAPES.map((a,i)=>new T.Vector4(a.x,a.z,i<index?a.rx:0,a.rz))};
 u.atlasWetland={value:index>0?1:0};u.atlasDim={value:1};
 w.material.fragmentShader='uniform vec4 atlasEllipse;uniform vec4 atlasPrior[3];uniform float atlasWetland,atlasDim;\n'+w.material.fragmentShader;
 w.material.fragmentShader=w.material.fragmentShader.replace('if(opacity<.002)discard;',`if(opacity<.002)discard;
 vec2 atlasPoint=vLocal.xz+atlasEllipse.xy;
 if(length(vLocal.xz/atlasEllipse.zw)>1.)discard;
 for(int j=0;j<3;j++){vec4 a=atlasPrior[j];if(a.z>0.&&length((atlasPoint-a.xy)/a.zw)<1.)discard;}
 if(atlasWetland>.5&&atlasPoint.x>=-479.&&atlasPoint.x<=-221.&&abs(atlasPoint.y+152.)<=18.)discard;`);
 w.material.fragmentShader=w.material.fragmentShader.replace('#include <tonemapping_fragment>','gl_FragColor.rgb*=atlasDim;\n#include <tonemapping_fragment>');
 w.material.customProgramCacheKey=()=>CURRENTWORKS_BUILD+'/ellipse';
}
export class CurrentworksReserve{
 constructor(ctx){
  this.ctx=ctx;this.time=0;this.disposed=false;this.failed=false;this.compiled=false;this.active=false;this.treeActive=false;this.water=[];this.replacements=[];
  this.root=new T.Group();this.root.name='Currentworks reserve graphics';
  try{
   const circles=[];let trunks,crowns;
   ctx.scene.traverse(o=>{
    if(o.isMesh&&o.geometry?.type==='CircleGeometry'&&o.rotation.x<-1.5&&o.material?.metalness>=.15)circles.push(o);
    if(o.isInstancedMesh&&o.geometry?.type==='CylinderGeometry'&&o.geometry.parameters.radiusTop===.65)trunks=o;
    if(o.isInstancedMesh&&o.geometry?.type==='IcosahedronGeometry'&&o.material?.color?.getHex()===0x608059)crowns=o;
   });
   for(const [i,s]of WATER_SHAPES.entries()){
    const original=circles.find(o=>Math.abs(o.position.x-s.x)<.01&&Math.abs(o.position.z-s.z)<.01);
    if(!original)continue;
    const water=Water.create(T,{preset:'lagoon',quality:'light',width:s.rx*2+.4,length:s.rz*2+.4,centerZ:0,level:original.position.y+.015,seed:9041+i,
     bedHeight:(x,z)=>original.position.y-(.12+2.6*Math.max(0,1-Math.hypot(x/s.rx,z/s.rz)))});
    const record={water,original,wasVisible:original.visible,index:i};this.water.push(record);
    water.mesh.position.set(s.x,0,s.z);water.mesh.name='Currentworks / '+s.id;maskWater(water,i);this.root.add(water.mesh);
   }
   this.descriptors=trunks&&crowns?.count===trunks.count*3?chooseTrees(trunks):[];
   this.forest=Trees.create(T,{trees:this.descriptors,hideInAR:false,windStrength:.18,near:30,far:90,quality:'light'});this.root.add(this.forest.group);
   for(const d of this.descriptors){for(const [mesh,index]of [[trunks,d.index],...Array.from({length:3},(_,j)=>[crowns,d.index*3+j])]){const matrix=new T.Matrix4();mesh.getMatrixAt(index,matrix);this.replacements.push({mesh,index,matrix});}}
   ctx.scene.add(this.root);this.root.visible=false;
  }catch(error){this.fail(error);}
 }
 fail(error){this.failed=true;this.failure=String(error?.message||error);this.restore();this.root.visible=false;for(const r of this.water)r.water.dispose();this.forest?.dispose();console.warn('Currentworks graphics unavailable; original reserve graphics retained.',error);}
 restore(){for(const r of this.water)r.original.visible=r.wasVisible;for(const r of this.replacements){r.mesh.setMatrixAt(r.index,r.matrix);r.mesh.instanceMatrix.needsUpdate=true;}this.treeActive=false;}
 setTrees(active){if(active===this.treeActive)return;const hidden=new T.Matrix4().makeScale(0,0,0);for(const r of this.replacements){r.mesh.setMatrixAt(r.index,active?hidden:r.matrix);r.mesh.instanceMatrix.needsUpdate=true;}this.treeActive=active;}
 update(dt,options={}){
  if(this.disposed||this.failed)return;
  const {settings,fleet,renderer}=this.ctx,p=fleet.position,xr=renderer.xr.isPresenting===true;
  this.time+=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
  this.active=options.preset!=='classic';this.root.visible=this.active;
  const quality=settings.low||xr?'light':'balanced',quiet=!!settings.reduced;
  this.setTrees(this.active);
  // Dino's world is identity during simulation; the existing XR renderer transforms
  // the entire root only while drawing, then restores it. Never detach these meshes.
  this.forest.update({time:this.time,quality,quiet:quiet||!options.wind,xr,ar:false,visible:this.active,viewer:[p.x,p.y,p.z],windStrength:.18});
  const boat=fleet.vehicles.find(v=>v.type==='boat'),bp=boat?.drive.position;
  for(const r of this.water){const s=WATER_SHAPES[r.index],visible=this.active&&options.water!==false;
   r.original.visible=visible?false:r.wasVisible;
   const bodies=bp&&ownsWater(r.index,bp)?[{id:boat.id,x:bp.x-s.x,z:bp.z-s.z,radius:1.8}]:[];
   r.water.update({time:this.time,quality,quiet,xr,visible,opacity:1,level:r.original.position.y+.015,bodies});
   r.water.uniforms.atlasDim.value=settings.night?.4:1;
  }
 }
 prepare(camera){
  if(this.compiled||this.failed||this.disposed)return;
  // Synchronous host loading: compile the existing r177 shader path before the
  // first playable frame. No asynchronous renderer-state changes or extra loop.
  try{this.ctx.renderer.compile(this.root,camera,this.ctx.scene);this.compiled=true;}catch(error){this.fail(error);}
 }
 splash(p){if(this.disposed||this.failed||!this.active||this.ctx.settings.reduced)return;for(const r of this.water)if(r.water.mesh.visible&&ownsWater(r.index,p)&&Math.abs(p.y-r.water.uniforms.level.value)<1){const s=WATER_SHAPES[r.index];r.water.splash(p.x-s.x,p.z-s.z,.4,.35);}}
 snapshot(){return {build:CURRENTWORKS_BUILD,engine:T.REVISION,waterVersion:Water.VERSION,treesVersion:Trees.VERSION,active:this.active,failed:this.failed,failure:this.failure||null,compiled:this.compiled,time:this.time,trees:this.forest?.stats||null,treeIds:(this.descriptors||[]).map(d=>d.id),water:this.water.map(r=>({id:WATER_SHAPES[r.index].id,...r.water.stats})),physicsChanged:false,disposed:this.disposed};}
 dispose(){if(this.disposed)return;this.disposed=true;this.restore();for(const r of this.water)r.water.dispose();this.forest?.dispose();this.root.removeFromParent();}
}
