/* Original jointed Renaissance character sample. Shared mesh buffers per
 * material/palette; separate pivots per actor. No external art or animation. */
import * as T from './vendor/three.module.js';
import {Batch,unit} from './art.mjs';
const templates=new WeakMap();
function joint(parent,name,x,y,z){const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
function build(m,kind){
 const root=new T.Group();root.name='Guild jointed '+kind;
 const torso=joint(root,'torso',0,1.04,0),head=joint(torso,'head',0,.54,0);
 const tunic=kind==='bandit'?'#815344':kind==='master'?'#645944':'#477568';
 const cloth=new Batch(),face=new Batch();
 cloth.add(unit.cyl,0,.24,0,.245,.5,.18,tunic);cloth.ball(0,.42,0,.26,.15,.18,tunic);cloth.add(unit.cone,0,-.055,0,.285,.28,.22,tunic,Math.PI);
 cloth.box(0,.04,0,.48,.07,.38,'#675139');cloth.box(0,.04,.2,.1,.09,.025,'#d5b677');
 for(const x of[-.09,.09])cloth.box(x,.45,.155,.12,.11,.04,'#e3d4b4',0,0,x*2);
 for(const y of[.19,.28,.37])cloth.ball(0,y,.185,.018,.018,.012,'#d5b677');
 cloth.rod([0,.48,0],[0,.61,0],.07,'#c58f6b');
 cloth.box(0,.24,-.22,.33,.34,.13,'#a78151');cloth.box(0,.4,-.295,.34,.1,.055,'#ceb47d');cloth.rod([-.17,.46,-.16],[.17,.08,-.20],.022,'#70543c');
 cloth.finish(torso,m.trim,'Doublet, collar, belt and satchel');
 face.ball(0,.18,.02,.155,.2,.145,'#d2a37e');face.ball(0,.32,-.018,.17,.07,.15,'#6c513c');
 face.ball(0,.33,-.015,.205,.06,.18,kind==='bandit'?'#4d4b3d':'#5e7250');face.box(0,.32,.15,.26,.033,.11,'#798859');face.ball(0,.18,.165,.035,.04,.04,'#c58e6c');
 for(const x of[-.068,.068])face.ball(x,.23,.15,.019,.014,.008,'#343e35');face.finish(head,m.trim,'Face and cloth cap');
 for(const side of[-1,1]){
  const suffix=side<0?'left':'right',arm=joint(torso,'arm-'+suffix,side*.25,.4,0),elbow=joint(arm,'elbow-'+suffix,side*.025,-.24,0),hand=joint(elbow,'hand-'+suffix,0,-.23,0);
  const upper=new Batch();upper.ball(0,-.04,0,.092,.11,.092,tunic);upper.rod([0,-.035,0],[side*.025,-.23,0],.071,tunic);upper.finish(arm,m.trim,'Tailored upper sleeve');
  const lower=new Batch();lower.rod([0,0,0],[0,-.19,0],.053,'#d2a37e');lower.add(unit.cyl,0,-.025,0,.066,.06,.066,tunic);lower.finish(elbow,m.trim,'Forearm and cuff');
  const palm=new Batch();palm.ball(0,0,.018,.057,.065,.062,'#d2a37e');palm.finish(hand,m.trim,'Hand and equipment socket');
  const hip=joint(root,'hip-'+suffix,side*.115,.96,0),knee=joint(hip,'knee-'+suffix,0,-.42,0),ankle=joint(knee,'ankle-'+suffix,0,-.40,0);
  const thigh=new Batch();thigh.rod([0,0,0],[0,-.41,0],.077,'#5c6350');thigh.finish(hip,m.trim,'Cloth breeches');
  const calf=new Batch();calf.rod([0,0,0],[0,-.39,0],.055,'#756348');calf.add(unit.cyl,0,-.29,0,.068,.13,.068,'#624c35');calf.finish(knee,m.trim,'Calf and boot cuff');
  const boot=new Batch();boot.box(0,-.065,.06,.15,.13,.27,'#624c35');boot.box(0,-.125,.06,.155,.025,.275,'#403b31');boot.finish(ankle,m.trim,'Leather boot and sole');
 }
 return root;
}
export function createPersonRig(m,kind='apprentice'){
 if(!m?.trim)throw new TypeError('A shared character material is required.');
 if(!['apprentice','master','bandit'].includes(kind))kind='apprentice';
 let cache=templates.get(m.trim);if(!cache){cache=new Map();templates.set(m.trim,cache);}
 if(!cache.has(kind))cache.set(kind,build(m,kind));
 const root=cache.get(kind).clone(true),get=n=>root.getObjectByName(n),pair=n=>['left','right'].map(s=>get(n+'-'+s));
 const rig={version:2,torso:get('torso'),head:get('head'),arms:pair('arm'),elbows:pair('elbow'),hands:pair('hand'),legs:pair('hip'),knees:pair('knee'),ankles:pair('ankle'),memory:null};
 root.guildRig=rig;return {root,legs:rig.legs,head:rig.head,arms:rig.arms,handSockets:rig.hands};
}
/* Only the player gets instance-owned fade materials. NPCs retain the shared
 * opaque palette, even when the camera is pressed close to the player's back. */
export function createActorFade(person){
 const copies=new Map();person.root.traverse(o=>{if(!o.isMesh)return;const original=o.material;if(!copies.has(original))copies.set(original,original.clone());o.material=copies.get(original);});
 let opacity=1;
 return {update(distance){opacity=Math.max(.16,Math.min(1,(distance-.35)/.75));const transparent=opacity<.999;for(const m of copies.values()){if(m.transparent!==transparent){m.transparent=transparent;m.depthWrite=!transparent;m.needsUpdate=true;}m.opacity=opacity;}return opacity;},inspect:()=>({opacity,materials:copies.size})};
}
