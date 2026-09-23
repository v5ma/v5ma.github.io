/* Original, bounded visual feedback. No input, timers, saves, lights or targets.
 * The sight is a short direction indicator, not a full-range ballistic promise.
 * Pellets/trails use only positions advanced by the existing simulation.
 */
import * as T from './vendor/three.module.js';
import {slingSight,slingSpace} from './resonance-core.mjs';
export function createSlingFeedback({root,world,elevation}){
 const group=new T.Group();group.name='Sling direction and actual shot feedback';root.add(group);
 const box=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(.10,8,5);
 const material=color=>new T.MeshBasicMaterial({color,toneMapped:false,depthTest:true,depthWrite:false});
 const sightMaterial=material('#fff0b4'),shotMaterial=material('#ff704d'),trailMaterial=material('#ffc184');
 function instances(geometry,mat,count,name){const mesh=new T.InstancedMesh(geometry,mat,count);mesh.name=name;mesh.count=0;mesh.visible=false;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(mesh);return mesh;}
 const sight=instances(box,sightMaterial,16,'Short sling direction / not weapon range'),pellets=instances(sphere,shotMaterial,12,'Actual travelling pellets'),trails=instances(box,trailMaterial,12,'Previous simulation step trails');
 const scratch=new T.Object3D(),axis=new T.Vector3(1,0,0),direction=new T.Vector3();
 function segment(mesh,index,a,b,width=.035){direction.subVectors(b,a);const length=direction.length();if(length<1e-6)return false;scratch.position.copy(a).add(b).multiplyScalar(.5);scratch.quaternion.setFromUnitVectors(axis,direction.multiplyScalar(1/length));scratch.scale.set(length,width,width);scratch.updateMatrix();mesh.setMatrixAt(index,scratch.matrix);return true;}
 const a=new T.Vector3(),b=new T.Vector3();
 function point(s,x,z,out){return out.set(x,elevation(s,x,z),z);}
 function marks(name,color){const values=new Float32Array(8*8*2*3),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(values,3).setUsage(T.DynamicDrawUsage));geometry.setDrawRange(0,0);const mat=new T.LineBasicMaterial({color,toneMapped:false,depthTest:true,depthWrite:false});const mesh=new T.LineSegments(geometry,mat);mesh.name=name;mesh.frustumCulled=false;mesh.visible=false;group.add(mesh);return {mesh,geometry,mat,values,count:0};}
 const walls=marks('Stone/timber contact / cross','#ffbe71'),hits=marks('Confirmed hit / diamond','#f7ffe2');let snapshot={guide:{visible:false},pellets:0,trails:0,impacts:0};let disposed=false;
 function line(mark,ax,ay,az,bx,by,bz){let n=mark.count*3;mark.values.set([ax,ay,az,bx,by,bz],n);mark.count+=2;}
 function update(s){if(disposed)return;const c=s.resonance||{},guide=slingSight(s,world);let count=0;
  sightMaterial.color.set(guide?.ready?'#fff0b4':'#a7bac6');
  if(guide&&guide.length>.2){const dx=Math.sin(guide.yaw),dz=Math.cos(guide.yaw);
   for(let d=.2;d<guide.length;d+=.42){point(s,guide.x+dx*d,guide.z+dz*d,a);const end=Math.min(guide.length,d+.25);point(s,guide.x+dx*end,guide.z+dz*end,b);if(segment(sight,count,a,b,.03))count++;}
   // Two arrow wings distinguish the sight from the controller's menu ray.
   point(s,guide.endX,guide.endZ,b);for(const side of [-1,1]){point(s,guide.endX-dx*.22+Math.cos(guide.yaw)*.12*side,guide.endZ-dz*.22-Math.sin(guide.yaw)*.12*side,a);if(segment(sight,count,a,b,.04))count++;}
  }
  sight.count=count;sight.visible=count>0;if(count)sight.instanceMatrix.needsUpdate=true;
  let pc=0,tc=0;for(const p of (c.projectiles||[]).slice(0,12)){if(![p.x,p.z,p.previousX,p.previousZ].every(Number.isFinite))continue;point(s,p.x,p.z,scratch.position);scratch.quaternion.identity();scratch.scale.setScalar(1);scratch.updateMatrix();pellets.setMatrixAt(pc++,scratch.matrix);point(s,p.previousX,p.previousZ,a);point(s,p.x,p.z,b);if(segment(trails,tc,a,b,.04))tc++;}
  for(const [mesh,n]of [[pellets,pc],[trails,tc]]){mesh.count=n;mesh.visible=n>0;if(n)mesh.instanceMatrix.needsUpdate=true;}
  walls.count=hits.count=0;let impactCount=0;const space=slingSpace(s,world);
  for(const m of (c.impacts||[]).slice(-8)){const age=s.steps-m.step;if(m.space!==space||age<0||age>=24||![m.x,m.z].every(Number.isFinite))continue;const x=m.x,y=elevation(s,x,m.z),z=m.z,r=.12+age/24*.18;
   if(m.kind==='hit'){
    for(const [u,v]of [[0,1],[1,2],[2,3],[3,0]]){const q=[[0,r],[r,0],[0,-r],[-r,0]],A=q[u],B=q[v];line(hits,x+A[0],y+A[1],z,x+B[0],y+B[1],z);line(hits,x,y+A[1],z+A[0],x,y+B[1],z+B[0]);}
   }else{line(walls,x-r,y-r,z,x+r,y+r,z);line(walls,x-r,y+r,z,x+r,y-r,z);line(walls,x,y-r,z-r,x,y+r,z+r);line(walls,x,y+r,z-r,x,y-r,z+r);}
   impactCount++;
  }
  for(const mark of [walls,hits]){mark.mesh.visible=mark.count>0;mark.geometry.setDrawRange(0,mark.count);if(mark.count)mark.geometry.attributes.position.needsUpdate=true;}
  snapshot={guide:guide?{...guide,visible:sight.visible}:{visible:false},pellets:pc,trails:tc,impacts:impactCount};
 }
 function dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const g of [box,sphere,walls.geometry,hits.geometry])g.dispose();for(const m of [sightMaterial,shotMaterial,trailMaterial,walls.mat,hits.mat])m.dispose();for(const m of [sight,pellets,trails])m.dispose();}
 return {update,dispose,inspect:()=>({...snapshot,guide:{...snapshot.guide},capacity:{pellets:12,impacts:8},maxDraws:5,renderTargets:0})};
}
