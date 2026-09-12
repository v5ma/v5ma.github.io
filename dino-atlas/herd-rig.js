import * as T from './vendor/three.module.js';
import {lifeOf,profileFor,angleDelta} from './herd-behavior.js?v=herds1';
// A small articulated rig for the existing original procedural meshes, not imported art.
const up=new T.Vector3(0,1,0),axis=new T.Vector3(),mid=new T.Vector3();
const limbGeometry=new T.IcosahedronGeometry(1,1);
export function articulateResident(root,kind,bake){
 const giant=['sauropod','brachio'].includes(kind),quad=['trike','stego','ankylosaur'].includes(kind);
 const neckOrigin=giant?[0,4,2]:kind==='ankylosaur'?[0,1.2,2]:quad?[0,2,1.9]:[0,3.5,1];
 const tailOrigin=giant?[0,3.6,-2.3]:quad?[0,1.8,-1.7]:[0,3,-1.3];
 const head=new T.Group(),tail=new T.Group();head.position.set(...neckOrigin);tail.position.set(...tailOrigin);root.add(head,tail);root.updateMatrixWorld(true);
 for(const m of [...root.children]){
  if(!m.isMesh)continue;
  const p=m.position;
  const isHead=giant?p.z>2&&p.y>4.2:kind==='ankylosaur'?p.z>2.1&&p.y<1.9:quad?p.z>1.8&&p.y>.7:p.z>1.4&&p.y>3.7;
  if(isHead)head.attach(m);else if(p.z< -2.1)tail.attach(m);
 }
 bake(head);bake(tail);
 const limbs=(root.userData.legs||[]).map((leg,index)=>{
  const skin=leg.children.find(c=>c.isMesh)?.material,footMat=leg.children.filter(c=>c.isMesh).at(-1)?.material||skin;
  const h=leg.position.y,thick=(giant?.53:quad?.38:.37);
  leg.clear();
  function mesh(mat){const m=new T.Mesh(limbGeometry,mat);m.castShadow=true;m.receiveShadow=true;leg.add(m);return m;}
  const thigh=mesh(skin),shin=mesh(skin),foot=mesh(footMat);foot.scale.set(thick*.92,.16,thick*1.4);
  const hip=leg.position.clone();
  const phase=(root.userData.legs.length===2?index*.5:(hip.x<0?0:.5)+(hip.z<0?.5:0))%1;
  return {leg,hip,h,thick,thigh,shin,foot,phase,anchor:null,wasStance:false,lastPhase:0,base:hip.clone()};
 });
 root.userData.rig={head,tail,limbs,kind,giant,quad,phase:0,lastDistance:0,breath:0};
 bake(root,[...root.userData.legs,head,tail]);
 animateResident({model:root,x:0,z:0,angle:0,kind,life:{state:'idle',distance:0,speed:0,head:0}},0,0,true);
 return root;
}
function segment(mesh,a,b,width){
 axis.subVectors(b,a);const length=axis.length();mid.addVectors(a,b).multiplyScalar(.5);mesh.position.copy(mid);mesh.scale.set(width,length*.54,width);mesh.quaternion.setFromUnitVectors(up,axis.normalize());
}
export function animateResident(a,dt,time,reduced=false){
 const root=a.model,rig=root?.userData.rig;if(!rig)return;
 const life=lifeOf(a),scale=root.scale.x||1;
 const traveled=Math.max(0,life.distance-rig.lastDistance);rig.lastDistance=life.distance;
 const h=rig.limbs[0]?.h||2,step=h*.48,cycle=step/.65*scale;
 if(traveled<10)rig.phase+=traveled/Math.max(.2,cycle);
 const moving=life.speed>.12;
 const idleBreath=reduced?0:Math.sin(time*1.5+(a.phase||0))*.018;
 root.position.y=idleBreath*scale;
 // Clear non-textual anticipation: stop, square up, raise head, then accelerate.
 let headPitch=life.state==='feed'?(rig.giant?.27:.32):life.state==='alert'?-.19:life.state==='rest'?.12:life.state==='interrupted'?.13:0;
 if(!reduced&&life.state==='feed')headPitch+=Math.sin(time*2.4)*.035;
 const blend=1-Math.exp(-Math.max(0,dt)*7);
 rig.head.rotation.x+=(headPitch-rig.head.rotation.x)*blend;
 rig.head.rotation.y+=((life.head||0)-rig.head.rotation.y)*blend;
 rig.tail.rotation.y=reduced?0:Math.sin(time*(moving?1.5:.6)+(a.phase||0))*(moving?.1:.04);
 for(const l of rig.limbs){
  const phase=((rig.phase+l.phase)%1+1)%1,stance=!moving||phase<.65;
  let z=l.hip.z,x=l.hip.x,fy=.16;
  if(moving){
   if(phase<.65)z+=step*(.5-phase/.65);
   else {const t=(phase-.65)/.35;z+=step*(-.5+t);fy+=Math.sin(t*Math.PI)*Math.min(.65,l.h*.22);}
  }
  const sin=Math.sin(a.angle),cos=Math.cos(a.angle);
  if(stance){
   if(!l.wasStance||!l.anchor||Math.hypot(a.x-l.anchor.x,a.z-l.anchor.z)>l.h*scale*2){l.anchor={x:a.x+(x*cos+z*sin)*scale,z:a.z+(-x*sin+z*cos)*scale};}
   const ax=(l.anchor.x-a.x)/scale,az=(l.anchor.z-a.z)/scale;
   // World-space stance anchors compensate root translation and turning.
   x=ax*cos-az*sin;z=ax*sin+az*cos;
  }
  l.wasStance=stance;l.lastPhase=phase;
  const local=new T.Vector3(x-l.hip.x,(fy-root.position.y)/scale-l.hip.y,z-l.hip.z);
  // Clamp extension before solving a two-segment leg; knees remain finite at full reach.
  const length=l.h*.55,dist=Math.min(length*1.99,local.length());local.setLength(Math.max(.01,dist));
  const half=local.clone().multiplyScalar(.5),bend=Math.sqrt(Math.max(0,length*length-dist*dist/4));
  const forward=new T.Vector3(0,0,rig.quad||rig.giant?1:-1),normal=forward.addScaledVector(local,-forward.dot(local)/(dist*dist||1)).normalize();
  const knee=half.addScaledVector(normal,bend);
  segment(l.thigh,new T.Vector3(),knee,l.thick);segment(l.shin,knee,local,l.thick*.74);
  l.foot.position.copy(local);l.foot.position.z+=.14;l.foot.rotation.set(0,0,0);
 }
}
