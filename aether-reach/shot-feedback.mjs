/* Bounded visual echoes of real hitscan events; no extra projectiles or damage. */
import * as T from './vendor/three.module.js';
export function createShotFeedback(scene){
 const root=new T.Group();root.name='Diorama shot feedback / visual only';scene.add(root);
 const sphere=new T.SphereGeometry(.18,8,6),cylinder=new T.CylinderGeometry(.06,.06,1,6),up=new T.Vector3(0,1,0);
 const items=Array.from({length:24},()=>{
  const mat=new T.MeshBasicMaterial({color:0xff4038,transparent:true,opacity:1,depthWrite:false});
  const pellet=new T.Mesh(sphere,mat),streak=new T.Mesh(cylinder,mat),impact=new T.Mesh(sphere,new T.MeshBasicMaterial({color:0xffe6a0,transparent:true,opacity:1,depthWrite:false}));
  root.add(pellet,streak,impact);pellet.visible=streak.visible=impact.visible=false;
  return {pellet,streak,impact,mat,age:1,from:new T.Vector3(),to:new T.Vector3(),dir:new T.Vector3(),length:0,hit:false};
 });let cursor=0,count=0,last=null;
 function shot(e){
  if(!scene.userData.thirdPersonWindow||e.type!=='shot'||!e.o||!e.end)return;
  if(![e.o.x,e.o.y,e.o.z,e.end.x,e.end.y,e.end.z].every(Number.isFinite))return;
  const a=items[cursor++%items.length];a.from.set(e.o.x,e.o.y,e.o.z);a.to.set(e.end.x,e.end.y,e.end.z);a.dir.subVectors(a.to,a.from);a.length=a.dir.length();a.dir.normalize();a.age=0;a.hit=!!e.hit;
  a.streak.quaternion.setFromUnitVectors(up,a.dir);a.impact.position.copy(a.to);a.impact.scale.setScalar(a.hit?1.7:1);a.impact.material.color.set(a.hit?0xffed9c:0xff6f50);
  last={origin:{...e.o},end:{...e.end},hit:!!e.hit};count++;
 }
 function update(dt){root.visible=!!scene.userData.thirdPersonWindow;for(const a of items){a.age+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));const visible=root.visible&&a.age<.32;a.pellet.visible=a.streak.visible=visible&&a.length>.01;a.impact.visible=visible;
  if(!visible)continue;const f=Math.min(1,a.age/.2),length=Math.min(2.4,a.length*f);a.pellet.position.copy(a.from).addScaledVector(a.dir,a.length*f);a.streak.position.copy(a.pellet.position).addScaledVector(a.dir,-length/2);a.streak.scale.set(1,length,1);a.mat.opacity=Math.max(0,1-a.age/.32);a.impact.material.opacity=a.mat.opacity;
 }}
 return {shot,update,stats:()=>({events:count,visible:items.filter(a=>a.pellet.visible&&root.visible).length,last,visualOnly:true,pool:items.length})};
}
