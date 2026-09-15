/* Articulated courier. Every mesh stays owned by the disposable world root. */
import * as T from './vendor/three.webgpu.js';
import {createMotion,updateMotion,riderPose} from './rider-motion-core.mjs';
export function create(m,parent,{Batch}){
 const group=new T.Group();group.name='Articulated Sky Cycle courier';parent.add(group);
 const b=new Batch();b.ell(0,-9,0,23,5,7,'#f2ede0');b.ell(12,-6,0,12,4,6,'#197cbe');b.box(-9,-5,0,15,3,11,'#273c54');b.rod([-17,-13,0],[3,-4,0],1.7,'#e9a82e');b.rod([3,-4,0],[19,-14,0],1.5,'#9cbace');b.rod([18,10,0],[20,-4,0],1,'#aac7d4');b.rod([17,10,-7],[17,10,7],1,'#253c4c');b.finish(m,group,{roughness:.34,metalness:.2});
 const wheels=[];for(const x of [-17,19]){const w=new T.Group();w.position.set(x,-14,0);group.add(w);const q=new Batch();q.torus(0,0,0,7,'#24374b');q.torus(0,0,2.4,4.6,'#3189b8');for(let j=0;j<6;j++){const a=j*Math.PI/3;q.rod([0,0,3.2],[Math.cos(a)*4.2,Math.sin(a)*4.2,3.2],.65,'#b2dbea');}q.finish(m,w,{roughness:.4,metalness:.25});wheels.push(w);}
 const torso=new T.Group();group.add(torso);const jacket=new Batch();jacket.ell(0,7,0,5.1,8.5,4.2,'#fac456');jacket.box(-5,6,-.6,7,12,9,'#bd9145');jacket.box(-5,6,4.1,6,8,1,'#eed6a6');jacket.ell(3,18,0,4.3,4.7,4,'#f3c392');jacket.ell(2.2,20,0,5.2,4.6,4.7,'#187ebc');jacket.box(5.3,20,3.6,5,2.5,1.2,'#eab144');jacket.ell(5.6,19.5,4.1,2.6,1.7,.8,'#264956');jacket.ell(6.4,20,4.8,1, .6,.22,'#b8f6f3');jacket.box(1,13.5,0,8,2,8,'#e14b36');jacket.finish(m,torso,{roughness:.48,metalness:.07});
 const scarf=new T.Group();scarf.position.set(-4,18,0);torso.add(scarf);const sb=new Batch();sb.tri([0,0,1],[-16,-1,2],[-10,-4,2],'#ed513c');sb.finish(m,scarf,{roughness:.8});
 const flame=new T.Group();flame.position.set(-27,-8,-2);group.add(flame);const fb=new Batch();fb.ell(-5,0,0,7,1.6,1.6,'#55dfff');fb.finish(m,flame,{unlit:true,transparent:true,opacity:.8,depthWrite:false});
 const geo=new T.CylinderGeometry(1,1,1,7),ball=new T.SphereGeometry(1,8,6),materials={};
 function material(color){return materials[color]??=new T.MeshStandardNodeMaterial({color,roughness:.6,metalness:.04});}
 function mesh(g,c){const o=m.makeSingle(g,material(c));o.castShadow=true;o.frustumCulled=false;group.add(o);return o;}
 function limb(color,r){return {upper:mesh(geo,color),lower:mesh(geo,color),joint:mesh(ball,color),end:mesh(ball,'#253f55'),r};}
 const legs=[limb('#315b80',2.1),limb('#315b80',2.1)],arms=[limb('#edb345',1.55),limb('#edb345',1.55)];
 const cranks=[mesh(geo,'#aac7d4'),mesh(geo,'#aac7d4')],pedalGeo=new T.BoxGeometry(7,1,5),pedals=[mesh(pedalGeo,'#253f55'),mesh(pedalGeo,'#253f55')];
 const up=new T.Vector3(0,1,0),dir=new T.Vector3();
 function segment(o,a,b,z,r){dir.set(b[0]-a[0],b[1]-a[1],0);const len=dir.length();o.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,z);o.quaternion.setFromUnitVectors(up,dir.normalize());o.scale.set(r,len,r*.86);}
 function poseLimb(l,v,z,boot){segment(l.upper,v.root,v.joint,z,l.r);segment(l.lower,v.joint,v.end,z,l.r*.8);l.joint.position.set(...v.joint,z);l.joint.scale.setScalar(l.r);l.end.position.set(v.end[0]+(boot?1.8:0),v.end[1]-.4,z);l.end.scale.set(boot?3.3:1.7,boot?1.4:1.3,boot?2.1:1.5);}
 const state=createMotion();let pose=riderPose(state);
 function update(p,step,options={}){updateMotion(state,p,step,options);pose=riderPose(state);torso.position.set(pose.hip[0],pose.hip[1],0);torso.rotation.z=-state.lean;legs.forEach((l,i)=>poseLimb(l,pose.legs[i],i?6:-6,true));arms.forEach((l,i)=>poseLimb(l,pose.arms[i],i?5.8:-5.8,false));wheels.forEach(w=>w.rotation.z=state.wheel);pose.legs.forEach((l,i)=>{const z=i?6:-6;segment(cranks[i],[1,-11],l.target,z,.7);pedals[i].position.set(l.target[0]+1.8,l.target[1]-2.2,z);});group.userData.contacts={feet:pose.legs.map(l=>l.end.slice()),hands:pose.arms.map(l=>l.end.slice())};}
 update({x:0,vx:0,vy:0,onGround:true},0,{motion:false});
 return {group,scarf,flame,update,get pose(){return pose;},get motion(){return {...state};}};
}
window.SkyCycleRider=Object.freeze({create,version:'contact-rider-1'});
