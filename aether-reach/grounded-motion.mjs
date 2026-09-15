/* Render-only grounding. Original two-bone solver and contact state machine.
 * The shipped FootL/R controls are siblings, not shin children. Restore the
 * sampled animation before each mixer step; never accumulate IK in a clip. */
import * as T from './vendor/three.module.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z);
export const CAST_HEIGHTS=Object.freeze({courier:1.76,guard:1.84,officer:1.88,breacher:2.02});
export function strideRate(speed,pose){return /^(Walk|Run)/.test(pose)?clamp(speed/(pose==='Walk'?1.55:3.5),.55,1.65):1;}
export function createLegSolver(){
 const axis=new T.Vector3(),bend=new T.Vector3(),tmp=new T.Vector3();
 return (hip,knee,ankle,target,pole,outKnee,outAnkle)=>{
  if(![hip,knee,ankle,target,pole].every(finite))return false;
  const a=hip.distanceTo(knee),b=knee.distanceTo(ankle);if(a<1e-5||b<1e-5)return false;
  axis.subVectors(target,hip);const requested=axis.length();
  if(requested<1e-6)axis.subVectors(ankle,hip);if(axis.lengthSq()<1e-12)axis.set(0,-1,0);axis.normalize();
  // Keep a small knee bend at full reach. Segment lengths are never changed.
  const d=clamp(requested,Math.abs(a-b)+1e-5,a+b-Math.min(.012,(a+b)*.015));
  bend.subVectors(pole,hip);bend.addScaledVector(axis,-bend.dot(axis));
  if(bend.lengthSq()<1e-10){bend.subVectors(knee,hip);bend.addScaledVector(axis,-bend.dot(axis));}
  if(bend.lengthSq()<1e-10){tmp.set(Math.abs(axis.y)<.9?0:1,Math.abs(axis.y)<.9?1:0,0);bend.crossVectors(axis,tmp);}bend.normalize();
  const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
  outKnee.copy(hip).addScaledVector(axis,along).addScaledVector(bend,height);outAnkle.copy(hip).addScaledVector(axis,d);return true;
 };
}
export function createGrounding(model,sampleGround){
 const legs=['L','R'].map(side=>({side,hip:model.getObjectByName('UpperLeg'+side),knee:model.getObjectByName('LowerLeg'+side),foot:model.getObjectByName('Foot'+side)})).filter(l=>l.hip&&l.knee&&l.foot);
 const changed=[...new Set(legs.flatMap(l=>[l.hip,l.knee,l.foot]))].map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
 const solve=createLegSolver(),hip=new T.Vector3(),knee=new T.Vector3(),ankle=new T.Vector3(),target=new T.Vector3(),outKnee=new T.Vector3(),outAnkle=new T.Vector3(),endLocal=new T.Vector3(),endWorld=new T.Vector3(),from=new T.Vector3(),to=new T.Vector3(),pole=new T.Vector3();
 const parentQ=new T.Quaternion(),worldQ=new T.Quaternion(),deltaQ=new T.Quaternion(),footQ=new T.Quaternion();
 let applied=false,previous=null,resets=0,maxError=0;
 for(const l of legs){Object.assign(l,{lock:new T.Vector3(),offset:new T.Vector3(),last:new T.Vector3(),locked:false,valid:false,floorId:null,clearance:null,error:0});}
 function restore(){if(!applied)return;for(const v of changed){v.b.position.copy(v.p);v.b.quaternion.copy(v.q);v.b.scale.copy(v.s);}applied=false;}
 function reset(){restore();for(const l of legs){l.locked=l.valid=false;l.offset.set(0,0,0);l.clearance=null;l.error=0;}previous=null;resets++;}
 function rotateToward(b,start,end,desired){from.subVectors(end,start).normalize();to.subVectors(desired,start).normalize();if(!finite(from)||!finite(to))return;b.getWorldQuaternion(worldQ);b.parent.getWorldQuaternion(parentQ).invert();deltaQ.setFromUnitVectors(from,to);b.quaternion.copy(parentQ.multiply(deltaQ).multiply(worldQ));b.updateWorldMatrix(false,true);}
 function update(dt,{x,y,z,heading=0,grounded=true,reset:discontinuity=false}={}){
  if(!legs.length)return;const validTime=Number.isFinite(dt)&&dt>0&&dt<=.12;
  if(!validTime||![x,y,z,heading].every(Number.isFinite)){reset();return;}
  const jump=previous&&(Math.hypot(x-previous.x,y-previous.y,z-previous.z)>1||Math.abs(Math.atan2(Math.sin(heading-previous.heading),Math.cos(heading-previous.heading)))>1.15);
  if(discontinuity||jump)reset();previous={x,y,z,heading};
  if(!grounded){for(const l of legs){l.locked=l.valid=false;l.offset.set(0,0,0);}return;}
  // Capture animation, not last frame's IK. restore() is called before mixer.update().
  for(const v of changed){v.p.copy(v.b.position);v.q.copy(v.b.quaternion);v.s.copy(v.b.scale);}applied=true;maxError=0;
  model.updateWorldMatrix(true,true);
  for(const l of legs){
   l.hip.getWorldPosition(hip);l.knee.getWorldPosition(knee);l.foot.getWorldPosition(ankle);l.foot.getWorldQuaternion(footQ);
   if(l.clearance===null)l.clearance=clamp(ankle.y-y,.012,.06);
   const ground=sampleGround?.(ankle.x,ankle.z,y+.25),floor=ground?.y;
   if(!Number.isFinite(floor)||Math.abs(floor-y)>.25){l.locked=l.valid=false;l.offset.set(0,0,0);continue;}
   const clearance=ankle.y-floor-l.clearance,upSpeed=l.valid?(ankle.y-l.last.y)/dt:0;
   const drift=l.locked?Math.hypot(ankle.x-l.lock.x,ankle.z-l.lock.z):0;
   const sameSurface=l.floorId===ground.id;
   if(l.locked&&(!sameSurface||clearance>.10||drift>.25||upSpeed>.6))l.locked=false;
   if(!l.locked&&clearance<.045&&upSpeed<.18){l.lock.set(ankle.x,floor+l.clearance,ankle.z);l.locked=true;l.floorId=ground.id;}
   l.last.copy(ankle);l.valid=true;
   if(l.locked){const support=sampleGround?.(l.lock.x,l.lock.z,y+.25);if(!Number.isFinite(support?.y)||support.id!==l.floorId||Math.abs(support.y-floor)>.12)l.locked=false;}
   if(l.locked){target.subVectors(l.lock,ankle);if(target.length()>.29){l.locked=false;}else l.offset.lerp(target,1-Math.exp(-40*dt));}
   if(!l.locked)l.offset.multiplyScalar(Math.exp(-22*dt));
   target.copy(ankle).add(l.offset);target.y=Math.max(target.y,floor+l.clearance);
   // Do not drag an airborne swing foot down to the floor.
   if(target.distanceTo(ankle)>.3){l.locked=false;l.offset.set(0,0,0);continue;}
   pole.copy(knee);endLocal.copy(ankle);l.knee.worldToLocal(endLocal);
   if(!solve(hip,knee,ankle,target,pole,outKnee,outAnkle))continue;
   rotateToward(l.hip,hip,knee,outKnee);l.knee.getWorldPosition(knee);endWorld.copy(endLocal);l.knee.localToWorld(endWorld);rotateToward(l.knee,knee,endWorld,outAnkle);
   l.foot.position.copy(outAnkle);l.foot.parent.worldToLocal(l.foot.position);l.foot.parent.getWorldQuaternion(parentQ).invert();l.foot.quaternion.copy(parentQ.multiply(footQ));l.foot.updateWorldMatrix(false,true);
   l.error=outAnkle.distanceTo(target);maxError=Math.max(maxError,l.error);if(l.error>.055)l.locked=false;
  }
 }
 return {restore,reset,update,stats:()=>({legs:legs.length,locked:legs.filter(l=>l.locked).length,resets,maxError,feet:legs.map(l=>({side:l.side,locked:l.locked,target:l.lock.toArray(),error:l.error}))})};
}
