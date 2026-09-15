/* Original analytic two-bone IK and world-space stance contacts.
 * Presentation only. Contacts are ephemeral, never serialized. The solver does
 * not write actor position, collision geometry, movement speed or game state.
 * Algorithmic background: Daniel Holden, Inverse Kinematics and Foot Locking.
 */
import * as T from './vendor/three.module.js';
const EPS=1e-7, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const down=new T.Vector3(0,-1,0);
const finite=v=>v&&[v.x,v.y,v.z].every(Number.isFinite);
const vec=v=>new T.Vector3(v.x,v.y,v.z);
/** Solve in any single Euclidean coordinate system, with a stable knee pole. */
export function solveLeg(hip,target,upper,lower,pole={x:0,y:0,z:1}){
 if(!finite(hip)||!finite(target)||!finite(pole)||![upper,lower].every(n=>Number.isFinite(n)&&n>EPS))throw new TypeError('Finite vectors and positive limb lengths are required.');
 const h=vec(hip),direction=vec(target).sub(h),requested=direction.length();
 if(requested<EPS)direction.copy(down);else direction.divideScalar(requested);
 const minimum=Math.abs(upper-lower)+EPS,maximum=(upper+lower)*.998;
 const reach=clamp(requested,minimum,maximum),bend=vec(pole).addScaledVector(direction,-vec(pole).dot(direction));
 if(bend.lengthSq()<EPS){bend.set(1,0,0).addScaledVector(direction,-direction.x);if(bend.lengthSq()<EPS)bend.set(0,0,1).addScaledVector(direction,-direction.z);}
 bend.normalize();
 const along=(upper*upper-lower*lower+reach*reach)/(2*reach);
 const height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const knee=h.clone().addScaledVector(direction,along).addScaledVector(bend,height),ankle=h.clone().addScaledVector(direction,reach);
 return {knee,ankle,clamped:Math.abs(requested-reach)>EPS,requested,reach};
}
/** Invalid/missing hand or terrain data must not leak NaN into a scene. */
export function safeFloor(sample,x,z,fallback){
 try{const y=sample?.(x,z);return Number.isFinite(y)&&Math.abs(y-fallback)<.7?y:fallback;}catch{return fallback;}
}
function rounded(v){return v?{x:+v.x.toFixed(6),y:+v.y.toFixed(6),z:+v.z.toFixed(6)}:null;}
export function inspectFeet(person){
 const rig=(person.root||person).guildRig;
 return rig?.feet?.map(f=>({locked:f.locked,anchor:rounded(f.anchor),actual:rounded(f.actual),error:+(f.error||0).toFixed(6),clamped:!!f.clamped}))||[];
}
/** Call after the actor's final root transform. ground() samples its REAL floor. */
export function plantFeet(person,time,{ground,enabled=true}={}){
 const root=person.root||person,rig=root.guildRig,m=rig?.memory,d=rig?.dimensions;
 if(!m||!d)return false;
 const grounded=enabled&&!['ride','jump','dodge','cover','yield'].includes(m.motion);
 if(!grounded){rig.feet=null;rig.plantSnapshot=null;return false;}
 root.updateWorldMatrix(true,true);
 const snapshot=rig.plantSnapshot;
 if(snapshot&&snapshot.time===time&&snapshot.level===m.level&&snapshot.matrix.every((v,i)=>v===root.matrixWorld.elements[i])){
  rig.torso.position.y=snapshot.torsoY;
  for(let i=0;i<2;i++){rig.legs[i].position.y=snapshot.hips[i];rig.legs[i].quaternion.copy(snapshot.quaternions[i*3]);rig.knees[i].quaternion.copy(snapshot.quaternions[i*3+1]);rig.ankles[i].quaternion.copy(snapshot.quaternions[i*3+2]);}
  root.updateWorldMatrix(true,true);return true;
 }
 const origin=root.getWorldPosition(new T.Vector3()),scale=root.getWorldScale(new T.Vector3()).y;
 if(!finite(origin)||!Number.isFinite(scale)||scale<EPS)return false;
 const parentYaw=root.getWorldQuaternion(new T.Quaternion());
 const drop=.012+.085*m.weight;
 rig.legs.forEach(l=>l.position.y=d.hipHeight-drop);
 rig.torso.position.y=1.04+m.pose.bob-drop;
 root.updateWorldMatrix(true,true);
 if(!rig.feet)rig.feet=[null,null];
 for(let i=0;i<2;i++){
  const hip=rig.legs[i],knee=rig.knees[i],ankle=rig.ankles[i],phase=m.phase+i*Math.PI;
  const moving=m.weight>.06,contact=!moving||Math.sin(phase)>=0;
  const lift=moving?Math.max(0,-Math.sin(phase))*.16*m.weight:0;
  const stride=.34*m.weight;
  const desired=root.localToWorld(new T.Vector3(hip.position.x,d.soleOffset,Math.cos(phase)*stride));
  desired.y=safeFloor(ground,desired.x,desired.z,origin.y)+(d.soleOffset+lift)*scale;
  const prior=rig.feet[i],dt=prior?clamp(time-prior.time,0,.1):0;
  const reset=!prior||Math.hypot(origin.x-prior.origin.x,origin.z-prior.origin.z)>1.5||Math.abs(origin.y-prior.origin.y)>.45||m.level!==prior.level;
  let f=reset?{locked:false,anchor:null,contact:false,blocked:false,actual:desired.clone(),rotation:parentYaw.clone()}:prior;
  if(!contact)f.blocked=false;
  if(f.locked){
   const h=hip.getWorldPosition(new T.Vector3()),floor=safeFloor(ground,f.anchor.x,f.anchor.z,origin.y);
   const excessive=h.distanceTo(f.anchor)>(d.upperLeg+d.lowerLeg)*scale*.995;
   const heightChanged=Math.abs(f.anchor.y-(floor+d.soleOffset*scale))>.09*scale;
   if(!contact||excessive||heightChanged){f.locked=false;f.blocked=contact;}
  }
  if(contact&&!f.locked&&!f.blocked){f.locked=true;f.anchor=desired.clone();f.rotation.copy(parentYaw);}
  const target=f.locked?f.anchor.clone():desired.clone();
  // A short position-continuous release avoids snapping to the swing target.
  if(!f.locked&&!reset&&dt>0)target.copy(f.actual).lerp(target,1-Math.exp(-dt*24));
  target.y=Math.max(target.y,safeFloor(ground,target.x,target.z,origin.y)+d.soleOffset*scale);
  const local=root.worldToLocal(target.clone()),solution=solveLeg(hip.position,local,d.upperLeg,d.lowerLeg);
  hip.quaternion.setFromUnitVectors(down,solution.knee.clone().sub(hip.position).normalize());
  const lowerDir=solution.ankle.clone().sub(solution.knee).normalize().applyQuaternion(hip.quaternion.clone().invert());
  knee.quaternion.setFromUnitVectors(down,lowerDir);
  root.updateWorldMatrix(true,true);
  // Keep soles level in world coordinates. A locked sole retains its yaw while
  // the body turns; knees always use the actor's forward pole, never flip.
  const lowerWorld=knee.getWorldQuaternion(new T.Quaternion());
  ankle.quaternion.copy(lowerWorld.invert().multiply(f.locked?f.rotation:parentYaw));
  root.updateWorldMatrix(true,true);
  f.actual=ankle.getWorldPosition(new T.Vector3());f.clamped=solution.clamped;f.error=f.locked?f.actual.distanceTo(f.anchor):0;
  if(solution.clamped){f.locked=false;f.blocked=contact;}
  f.time=time;f.origin=origin.clone();f.level=m.level;f.contact=contact;rig.feet[i]=f;
 }
 rig.plantSnapshot={time,level:m.level,matrix:[...root.matrixWorld.elements],torsoY:rig.torso.position.y,hips:rig.legs.map(l=>l.position.y),quaternions:rig.legs.flatMap((l,i)=>[l.quaternion.clone(),rig.knees[i].quaternion.clone(),rig.ankles[i].quaternion.clone()])};
 return true;
}
