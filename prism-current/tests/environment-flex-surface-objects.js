/* Actual Three resources/rays, without a renderer or physical-XR claim. */
(()=>{
 'use strict';const T=AFRAME.THREE,F=SVGNFlexSurface,checks=[];
 const check=(x,m)=>{if(!x)throw Error(m);checks.push(m);};
 const near=(a,b)=>Math.abs(a-b)<2e-6;
 const borrowed=new T.MeshBasicMaterial({color:0xffffff});let materialFreed=0;borrowed.addEventListener('dispose',()=>materialFreed++);
 const f=F.create(T,{material:borrowed}),root=new T.Group(),sibling=new T.Group();root.add(f.group,sibling);
 check(f.front.isMesh&&f.back.isMesh&&f.front.material===borrowed&&f.back.material===borrowed,'Creates actual front/back meshes sharing the borrowed material');
 check(f.stats.vertices===297&&f.stats.triangles===1024&&f.stats.meshes===2,'Default grid and two-sided triangle budget are exact');
 check(f.front.geometry.attributes.position===f.back.geometry.attributes.position,'Both sides render the same deformed position buffer');
 check(f.front.geometry.attributes.uv!==f.back.geometry.attributes.uv,'Back content has its own readable orientation');
 const initial=f.stats.updates,version=f.front.geometry.attributes.position.version;
 for(let i=0;i<100;i++)f.update({bend:0});
 check(f.stats.updates===initial&&f.front.geometry.attributes.position.version===version,'Identical paused shape avoids buffer uploads and allocations');
 const pull=Object.freeze({u:.7,v:.4,strength:.065,radius:.21});f.update(Object.freeze({bend:.85,pull}));
 const ps=f.front.geometry.attributes.position,ns=f.front.geometry.attributes.normal,bs=f.back.geometry.attributes.normal;
 check(ps.usage===T.DynamicDrawUsage&&f.stats.updates===initial+1,'Changed shape updates the existing dynamic buffer');
 let valid=true;for(let i=0;i<ps.count;i++){valid&&=near(Math.hypot(ns.getX(i),ns.getY(i),ns.getZ(i)),1)&&near(ns.getX(i),-bs.getX(i))&&near(ns.getZ(i),-bs.getZ(i));}
 check(valid,'Deformed vertex normals remain unit-length and reverse on the back');
 check(ps.array.every(Number.isFinite)&&f.front.geometry.boundingSphere.radius>0,'Deformation keeps finite geometry and updates culling bounds');
 const old=Array.from(ps.array),nUpdates=f.stats.updates;let threw=false;try{f.update({bend:1,pull:{u:NaN}});}catch{threw=true;}
 check(threw&&f.stats.updates===nUpdates&&ps.array.every((x,i)=>x===old[i]),'Rejected shape leaves all previous live geometry unchanged');
 const d=f.describe();d.shape.pull.strength=99;d.options.width=99;check(f.describe().shape.pull.strength===.065&&f.describe().options.width===1.2,'Descriptions are copies and cannot mutate the current shape');
 root.position.set(2.7,.4,-1.6);root.rotation.set(.17,.83,-.05);root.scale.set(1.3,.7,1.6);f.group.position.set(-.3,.2,-.8);root.updateMatrixWorld(true);
 for(const side of ['front','back']){
  const mesh=f[side],g=mesh.geometry,indices=g.index,uv=g.attributes.uv,point=new T.Vector3(),normal=new T.Vector3(),expect=new T.Vector2();
  const face=(4*32+18)*2;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  const ids=[indices.getX(face*3),indices.getX(face*3+1),indices.getX(face*3+2)];
  a.fromBufferAttribute(ps,ids[0]);b.fromBufferAttribute(ps,ids[1]);c.fromBufferAttribute(ps,ids[2]);
  point.copy(a).add(b).add(c).multiplyScalar(1/3).applyMatrix4(mesh.matrixWorld);
  normal.subVectors(b,a).cross(c.clone().sub(a)).applyMatrix3(new T.Matrix3().getNormalMatrix(mesh.matrixWorld)).normalize();
  for(const id of ids){expect.x+=uv.getX(id)/3;expect.y+=uv.getY(id)/3;}
  const ray=new T.Raycaster(point.clone().addScaledVector(normal,1),normal.clone().negate()),hit=f.pick(ray);
  check(!!hit&&hit.object===mesh,side+': real ray hits the visible triangle after nonuniform parent transforms');
  check(hit.point.distanceTo(point)<2e-6&&near(hit.uv.x,expect.x)&&near(hit.uv.y,expect.y),side+': visible contact and displayed UV agree after bend and localized pull');
  const saved=ray.ray.clone();root.visible=false;check(f.pick(ray)===null,side+': hidden parent disables the module picker');root.visible=true;
  check(ray.ray.equals(saved),side+': picker does not change the caller ray');
 }
 const geometry=f.front.geometry;for(let i=0;i<100;i++)f.update({bend:Math.sin(i)*.8});check(f.front.geometry===geometry&&f.stats.vertices===297,'Repeated shape changes do not rebuild or enlarge the meshes');
 f.reset();let flat=true;for(let i=0;i<ps.count;i++)flat&&=ps.getZ(i)===0;
 check(flat&&!f.describe().shape.pull&&f.describe().shape.bend===0,'Reset flattens the existing surface without a host clock');
 let disposed=0;for(const mesh of [f.front,f.back])mesh.geometry.addEventListener('dispose',()=>disposed++);f.dispose();f.dispose();
 check(disposed===2&&materialFreed===0&&root.children.length===1&&root.children[0]===sibling,'Disposal frees both owned geometries once but preserves borrowed material and siblings');
 check(f.pick(new T.Raycaster())===null&&f.update({bend:.2})===false&&f.reset()===false,'Disposed methods cannot revive the effect');
 const single=F.create(T,{readableBack:false,columns:16,rows:4});let singleMaterial=0;single.material.addEventListener('dispose',()=>singleMaterial++);
 check(single.back===null&&single.stats.triangles===128&&single.stats.meshes===1,'One-sided surfaces use half the triangle/draw budget');single.dispose();single.dispose();check(singleMaterial===1,'Default factory material is disposed exactly once');
 const invalid=new T.MeshBasicMaterial({side:T.DoubleSide});let error=false;try{F.create(T,{material:invalid});}catch{error=true;}
 check(error,'Rejects double-sided borrowed material that would draw coplanar front and back together');invalid.dispose();borrowed.dispose();
 window.flexObjectReport={passed:checks.length,checks,threeRevision:T.REVISION,scope:'Actual Three.js objects and CPU ray/UV intersections. No GPU rendering, DOM controls, headset or physical-performance claim.'};
})();
