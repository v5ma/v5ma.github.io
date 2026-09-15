import * as T from './vendor/three.module.js';
import {lifeOf,angleDelta} from './herd-behavior.js?v=herds1';
import {FootContact,solveLimb} from './grounded-motion.js?v=grounded1';
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
  return {leg,hip,h,thick,thigh,shin,foot,phase,anchor:null,wasStance:false,lastPhase:0,base:hip.clone(),contact:new FootContact(),solve:{knee:[0,0,0],end:[0,0,0]},upper:h*.55,lower:h*.55};
 });
 root.userData.rig={head,tail,limbs,kind,giant,quad,phase:0,lastDistance:0,breath:0,lastX:0,lastZ:0,lastAngle:0};
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
 const ground=Number.isFinite(a.groundY)?a.groundY:0;
 const traveled=Math.hypot(a.x-rig.lastX,a.z-rig.lastZ),turn=Math.abs(angleDelta(rig.lastAngle,a.angle));
 rig.lastX=a.x;rig.lastZ=a.z;rig.lastAngle=a.angle;rig.lastDistance=life.distance;
 const h=rig.limbs[0]?.h||2,step=h*.48,cycle=step/.65*scale,reset=traveled>Math.max(2,h*scale*2);
 if(!reset&&dt>0)rig.phase+=(traveled+turn*h*scale*.24)/Math.max(.2,cycle);
 const moving=life.speed>.12||turn>.003;
 const idleBreath=reduced?0:Math.sin(time*1.5+(a.phase||0))*.018;
 root.position.y=ground+idleBreath*scale;
 // Clear non-textual anticipation: stop, square up, raise head, then accelerate.
 let headPitch=life.state==='feed'?(rig.giant?.27:.32):life.state==='alert'?-.19:life.state==='rest'?.12:life.state==='interrupted'?.13:0;
 if(!reduced&&life.state==='feed')headPitch+=Math.sin(time*2.4)*.035;
 const blend=1-Math.exp(-Math.max(0,dt)*7);
 rig.head.rotation.x+=(headPitch-rig.head.rotation.x)*blend;
 rig.head.rotation.y+=((life.head||0)-rig.head.rotation.y)*blend;
 rig.tail.rotation.y=reduced?0:Math.sin(time*(moving?1.5:.6)+(a.phase||0))*(moving?.1:.04);
 const sin=Math.sin(a.angle),cos=Math.cos(a.angle);
 for(const l of rig.limbs){
  const phase=((rig.phase+l.phase)%1+1)%1,stance=!moving||phase<.65;
  // Every term below is in world metres; foot thickness scales with its model.
  const lead=moving?step*.42:0,x=l.hip.x,z=l.hip.z+lead;
  const point=[a.x+(x*cos+z*sin)*scale,ground+.16*scale,a.z+(-x*sin+z*cos)*scale];
  const hip=[a.x+(l.hip.x*cos+l.hip.z*sin)*scale,root.position.y+l.h*scale,a.z+(-l.hip.x*sin+l.hip.z*cos)*scale];
  const world=l.contact.update({point,hip,yaw:a.angle,stance,dt,reset,reach:(l.upper+l.lower)*scale*.985,release:step*scale*1.4,lift:Math.min(.65,l.h*.22)*scale,duration:Math.max(.12,Math.min(.32,cycle/Math.max(.2,life.speed)*.35))});
  const ax=(world[0]-a.x)/scale,az=(world[2]-a.z)/scale;
  const target=[ax*cos-az*sin-l.hip.x,(world[1]-root.position.y)/scale-l.h,ax*sin+az*cos-l.hip.z];
  // Hind-leg knees bend forward; long quadruped forelegs use their own plane.
  const bend=[0,0,(rig.quad||rig.giant)&&l.hip.z>0?-1:1];
  const pose=solveLimb(target,l.upper,l.lower,bend,l.solve);
  const knee=new T.Vector3(...pose.knee),end=new T.Vector3(...pose.end);
  segment(l.thigh,new T.Vector3(),knee,l.thick);segment(l.shin,knee,end,l.thick*.74);
  l.foot.position.copy(end);l.foot.rotation.set(0,l.contact.yaw-a.angle,0);
  l.wasStance=l.contact.locked;l.lastPhase=phase;l.anchor={x:l.contact.anchor[0],z:l.contact.anchor[2]};
 }
}
