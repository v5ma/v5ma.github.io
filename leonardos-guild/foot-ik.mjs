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
/** A bounded local support plane. A missing sample or abrupt floor edge stays
 * level instead of turning a boot toward a wall, pit or another storey. */
export function soleContact(ground,x,z,fallback,scale=1,heading=0){
 const size=Number.isFinite(scale)&&scale>EPS?scale:1;
 const height=safeFloor(ground,x,z,fallback),span=.10*size;
 const up=new T.Vector3(0,1,0);
 try{
  const samples=[ground?.(x-span,z),ground?.(x+span,z),ground?.(x,z-span),ground?.(x,z+span)];
  if(samples.every(v=>Number.isFinite(v)&&Math.abs(v-height)<=.10*size)){
   const gx=(samples[1]-samples[0])/(2*span),gz=(samples[3]-samples[2])/(2*span);
   // Sharp rims and implausible normals are not support planes.
   if(Math.hypot(gx,gz)<=.65)up.set(-gx,1,-gz).normalize();
  }
 }catch{/* A renderer must remain usable with unavailable floor data. */}
 const yaw=Number.isFinite(heading)?heading:0;
 const forward=new T.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 forward.addScaledVector(up,-forward.dot(up)).normalize();
 const right=new T.Vector3().crossVectors(up,forward).normalize();
 const rotation=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,forward));
 return {height,normal:up,rotation};
}
const yawDifference=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function rounded(v){return v?{x:+v.x.toFixed(6),y:+v.y.toFixed(6),z:+v.z.toFixed(6)}:null;}
export function inspectFeet(person){
 const rig=(person.root||person).guildRig;
 return rig?.feet?.map(f=>({locked:f.locked,anchor:rounded(f.anchor),actual:rounded(f.actual),error:+(f.error||0).toFixed(6),clamped:!!f.clamped,turning:!!f.replant,normal:rounded(f.normal),heading:+(f.heading||0).toFixed(6)}))||[];
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
 const heading=new T.Euler().setFromQuaternion(parentYaw,'YXZ').y;
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
  const support=soleContact(ground,desired.x,desired.z,origin.y,scale,heading);
  // This vertical offset places the bottom of the rotated sole ON its plane.
  desired.y=support.height+(d.soleOffset/support.normal.y+lift)*scale;
  const prior=rig.feet[i],dt=prior?clamp(time-prior.time,0,.1):0;
  const reset=!prior||time<prior.time||Math.hypot(origin.x-prior.origin.x,origin.z-prior.origin.z)>1.5||Math.abs(origin.y-prior.origin.y)>.45||m.level!==prior.level;
  let f=reset?{locked:false,anchor:null,contact:false,blocked:false,actual:desired.clone(),rotation:support.rotation.clone(),normal:support.normal.clone(),heading,replant:null}:prior;
  if(!contact)f.blocked=false;
  if(moving&&f.replant){f.replant=null;f.locked=false;f.blocked=contact;}
  if(f.locked){
   const h=hip.getWorldPosition(new T.Vector3()),floor=soleContact(ground,f.anchor.x,f.anchor.z,origin.y,scale,f.heading);
   const excessive=h.distanceTo(f.anchor)>(d.upperLeg+d.lowerLeg)*scale*.995;
   const heightChanged=Math.abs(f.anchor.y-(floor.height+d.soleOffset*scale/floor.normal.y))>.09*scale;
   if(!contact||excessive||heightChanged){f.locked=false;f.blocked=contact;}
  }
  // Replant one foot at a time during stationary turns. Keeping a stationary
  // world anchor forever otherwise twists the ankle while the torso rotates.
  if(!moving&&!reset&&!f.replant&&(f.blocked||Math.abs(yawDifference(heading,f.heading))>.55)&&!rig.feet.some((other,j)=>j!==i&&other?.replant)){
   f.replant={elapsed:0,from:f.actual.clone(),rotation:f.rotation.clone()};f.locked=false;f.blocked=true;
  }
  if(contact&&!f.locked&&!f.blocked&&!f.replant){f.locked=true;f.anchor=desired.clone();f.rotation.copy(support.rotation);f.normal.copy(support.normal);f.heading=heading;}
  const target=f.locked?f.anchor.clone():desired.clone();
  // A short position-continuous release avoids snapping to the swing target.
  if(!f.locked&&!f.replant&&!reset&&dt>0)target.copy(f.actual).lerp(target,1-Math.exp(-dt*24));
  let footRotation=f.locked?f.rotation.clone():support.rotation.clone();
  if(f.replant){
   f.replant.elapsed+=dt;const t=clamp(f.replant.elapsed/.22,0,1),ease=t*t*(3-2*t);
   target.copy(f.replant.from).lerp(desired,ease);target.y+=Math.sin(Math.PI*t)*.055*scale;
   footRotation.copy(f.replant.rotation).slerp(support.rotation,ease);
   if(t>=1){f.replant=null;f.locked=true;f.blocked=false;f.anchor=target.clone();f.rotation.copy(support.rotation);f.normal.copy(support.normal);f.heading=heading;}
  }
  const targetSupport=soleContact(ground,target.x,target.z,origin.y,scale,heading);
  target.y=Math.max(target.y,targetSupport.height+d.soleOffset*scale/targetSupport.normal.y);
  const local=root.worldToLocal(target.clone()),solution=solveLeg(hip.position,local,d.upperLeg,d.lowerLeg);
  hip.quaternion.setFromUnitVectors(down,solution.knee.clone().sub(hip.position).normalize());
  const lowerDir=solution.ankle.clone().sub(solution.knee).normalize().applyQuaternion(hip.quaternion.clone().invert());
  knee.quaternion.setFromUnitVectors(down,lowerDir);
  root.updateWorldMatrix(true,true);
  // Follow the sampled support plane; a stance sole retains its orientation
  // until lift-off. Replant rotation is eased instead of snapping to body yaw.
  const lowerWorld=knee.getWorldQuaternion(new T.Quaternion());
  ankle.quaternion.copy(lowerWorld.invert().multiply(footRotation));
  root.updateWorldMatrix(true,true);
  f.actual=ankle.getWorldPosition(new T.Vector3());f.clamped=solution.clamped;f.error=f.locked?f.actual.distanceTo(f.anchor):0;
  if(!f.locked){f.rotation.copy(footRotation);f.normal.copy(targetSupport.normal);}
  if(solution.clamped){f.locked=false;f.blocked=contact;}
  f.time=time;f.origin=origin.clone();f.level=m.level;f.contact=contact;rig.feet[i]=f;
 }
 rig.plantSnapshot={time,level:m.level,matrix:[...root.matrixWorld.elements],torsoY:rig.torso.position.y,hips:rig.legs.map(l=>l.position.y),quaternions:rig.legs.flatMap((l,i)=>[l.quaternion.clone(),rig.knees[i].quaternion.clone(),rig.ankles[i].quaternion.clone()])};
 return true;
}
