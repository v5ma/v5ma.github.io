import * as T from './vendor/three.module.js';
import {ellipsoid,box,bone} from './ranger-art.js';
import {FootContact,solveLimb} from './grounded-motion.js?v=grounded1';
const geometry=new T.IcosahedronGeometry(1,1),up=new T.Vector3(0,1,0),axis=new T.Vector3(),middle=new T.Vector3();
function segment(mesh,a,b,width){axis.subVectors(b,a);mesh.position.copy(middle.addVectors(a,b).multiplyScalar(.5));mesh.scale.set(width,axis.length()*.53,width);if(axis.lengthSq()>1e-12)mesh.quaternion.setFromUnitVectors(up,axis.normalize());}
export function makeRangerBody(bake){
 const root=new T.Group(),olive=0x536454,skin=0xbe9877,boots=0x2a4038;
 ellipsoid(root,olive,0,1.17,0,.23,.28,.145);ellipsoid(root,0x4d6355,0,.88,0,.195,.13,.15);
 box(root,0xd4a947,0,1.2,.135,.33,.31,.065);box(root,0x7b9278,0,1.18,-.20,.34,.43,.17);
 bone(root,skin,[0,1.40,0],[0,1.53,0],.065);
 const head=new T.Group();head.position.set(0,1.635,0);root.add(head);
 ellipsoid(head,skin,0,0,0,.103,.126,.104);box(head,0xb9ad81,0,.13,0,.31,.035,.29);ellipsoid(head,0xb9ad81,0,.166,0,.117,.065,.115);
 const mat=new T.MeshStandardMaterial({color:olive,roughness:.9}),bootMat=new T.MeshStandardMaterial({color:boots,roughness:.95});
 const limbs=[-.115,.115].map((x,i)=>{
  const leg=new T.Group();leg.position.set(x,.89,0);root.add(leg);
  const thigh=new T.Mesh(geometry,mat),shin=new T.Mesh(geometry,mat),foot=new T.Mesh(geometry,bootMat);
  for(const m of [thigh,shin,foot]){m.castShadow=true;m.receiveShadow=true;leg.add(m);}
  foot.scale.set(.10,.07,.18);
  return {leg,thigh,shin,foot,hip:leg.position.clone(),phase:i*.5,contact:new FootContact(),solve:{knee:[0,0,0],end:[0,0,0]}};
 });
 const arms=[-1,1].map(side=>{const arm=new T.Group();arm.position.set(side*.255,1.405,0);root.add(arm);bone(arm,olive,[0,0,0],[side*.025,-.28,.015],.075,.060);bone(arm,skin,[side*.025,-.28,.015],[side*.015,-.52,.09],.06,.045);ellipsoid(arm,skin,side*.015,-.54,.09,.052,.071,.047);return arm;});
 root.userData={legs:limbs.map(l=>l.leg),bodyRig:{limbs,arms,head,phase:0,last:null,lastAngle:0}};
 bake(root,[...root.userData.legs,...arms,head]);animateRangerBody(root,{grounded:4,speed:0},0,0);return root;
}
export function animateRangerBody(root,actor,dt,time,{reduced=false,aiming=false,groundAt=null}={}){
 const rig=root.userData.bodyRig;if(!rig)return;
 const p=root.position,angle=root.rotation.y,sin=Math.sin(angle),cos=Math.cos(angle),last=rig.last;
 const moved=last?Math.hypot(p.x-last.x,p.z-last.z):0,turn=last?Math.abs(Math.atan2(Math.sin(angle-rig.lastAngle),Math.cos(angle-rig.lastAngle))):0;
 const reset=!last||moved>3;rig.last={x:p.x,z:p.z};rig.lastAngle=angle;
 if(dt>0&&!reset)rig.phase+=(moved+turn*.18)/1.2;
 const moving=actor.speed>.1||turn>.008,grounded=actor.grounded>0;
 for(const l of rig.limbs){
  const phase=(rig.phase+l.phase)%1,lead=moving?.22:0;
  const nx=p.x+l.hip.x*cos+lead*sin,nz=p.z-l.hip.x*sin+lead*cos;
  const floor=groundAt?groundAt(nx,nz,p.y):p.y;
  const point=[nx,(grounded?floor:p.y+.10)+.07,nz],hip=[p.x+l.hip.x*cos,p.y+l.hip.y,p.z-l.hip.x*sin];
  const world=l.contact.update({point,hip,yaw:angle,stance:!moving||phase<.60,grounded,dt,reset,reach:.888,release:.65,lift:.17,duration:Math.max(.09,.20-Math.max(0,actor.speed)*.013)});
  // A second, bounded foot probe prevents an arcing boot entering a stair tread.
  if(grounded&&groundAt)world[1]=Math.max(world[1],groundAt(world[0],world[2],p.y)+.07);
  const ax=world[0]-p.x,az=world[2]-p.z,local=[ax*cos-az*sin-l.hip.x,world[1]-p.y-l.hip.y,ax*sin+az*cos];
  const pose=solveLimb(local,.46,.44,[0,0,1],l.solve),knee=new T.Vector3(...pose.knee),end=new T.Vector3(...pose.end);
  segment(l.thigh,new T.Vector3(),knee,.095);segment(l.shin,knee,end,.073);l.foot.position.copy(end);l.foot.rotation.set(0,l.contact.yaw-angle,0);
 }
 rig.arms.forEach((arm,i)=>{const target=aiming?-.9:reduced?0:Math.sin(rig.phase*Math.PI*2+i*Math.PI)*Math.min(.36,actor.speed*.065);arm.rotation.x+=(target-arm.rotation.x)*(1-Math.exp(-dt*12));});
 rig.head.rotation.x=reduced?0:Math.sin(time*1.6)*.008;
}
