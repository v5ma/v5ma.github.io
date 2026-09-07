import * as T from './vendor/three.module.js';
import {heightAt} from './world.mjs';
export function creature(scene,mesh,type){const root=new T.Group();scene.add(root);const body=new T.Group();root.add(body);const limbs=[],large=type==='brute';
 const torso=mesh('ball',large?[.86,1.05,.58]:[.43,.45,.86],large?0x5b6751:0x435951);torso.position.y=large?1.3:.72;body.add(torso);
 const head=mesh('ball',large?[.46,.51,.43]:[.27,.3,.50],0x879080);head.position.set(0,large?2.18:.8,large?-.3:-.80);body.add(head);
 const jaw=mesh('box',large?[.45,.22,.22]:[.26,.12,.36],0x354538);jaw.position.set(0,large?1.98:.60,large?-.67:-1.14);body.add(jaw);
 for(const sign of [-1,1]){const eye=mesh('ball',[.05,.05,.04],0xe5bb77,'glow');eye.position.set(sign*(large?.24:.15),large?2.21:.83,large?-.7:-1.15);body.add(eye);}
 for(let i=0;i<(large?14:8);i++){const a=i*2.4;const fungus=mesh('ball',[.22+.07*(i%3),.07,.3],i%2?0x9c9871:0x758354);fungus.position.set(Math.sin(a)*(large?.67:.30),large?1.3+i*.07:.95,Math.cos(a)*(large?.43:.6));fungus.rotation.z=Math.sin(a)*.4;body.add(fungus);}
 for(let side of[-1,1])for(let front of[-1,1]){const pivot=new T.Group();pivot.position.set(side*(large?.65:.35),large?1.2:.60,front*(large?.23:.5));body.add(pivot);const leg=mesh('capsule',[large?.25:.10,large?.42:.23,large?.21:.12],0x586753);leg.position.y=large?-.35:-.24;pivot.add(leg);const foot=mesh('box',[large?.37:.13,.12,large?.45:.28],0x344939);foot.position.set(0,large?-.99:-.56,-.06);pivot.add(foot);limbs.push({pivot,side,front});}
 const ring=new T.Mesh(new T.RingGeometry(large?2.9:1.4,large?3.1:1.53,40),new T.MeshBasicMaterial({color:0xeab477,transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.035;root.add(ring);
 return {root,body,limbs,ring,type};
}
export function poseCreature(a,e,t){a.root.position.set(e.x,heightAt(e.x,e.z),e.z);a.root.rotation.y=e.yaw;a.ring.visible=e.phase==='windup';a.ring.material.opacity=.3+Math.sin(t*13)*.2;a.body.position.y=e.phase==='windup'?-.15:0;a.body.rotation.x=e.phase==='charge'?-.18:0;
 for(const l of a.limbs)l.pivot.rotation.x=e.speed>.1?Math.sin(t*(e.phase==='charge'?16:7)+(l.side*l.front>0?0:Math.PI))*.55:0;
 if(e.hp<=0){a.body.rotation.z=1.6;a.body.position.y=-.28;a.ring.visible=false;}}
