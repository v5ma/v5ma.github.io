/* Rainward original procedural motion and contact solver.
 * Research: Daniel Holden, Inverse Kinematics and Foot Locking (2026-07-30)
 * Full research links and scope are recorded in GROUNDED.md.
 * Independently implemented analytic two-bone solve, world-space plant targets
 * and cubic transition offsets. No third-party code, clips or trained models.
 * This module mutates ONLY render objects. Gameplay remains authoritative. */
import * as T from './vendor/three.module.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>t*t*(3-2*t),up=new T.Vector3(0,1,0);
const v=()=>new T.Vector3(),q=()=>new T.Quaternion();
const scratch={a:v(),b:v(),c:v(),dir:v(),pole:v(),knee:v(),end:v(),from:v(),to:v(),parent:q(),world:q(),delta:q()};
export function twoBonePoints(hip,target,upper,lower,pole=new T.Vector3(0,0,-1)){
 if(!(upper>0&&lower>0))throw new RangeError('Positive bone lengths required');
 const direction=target.clone().sub(hip),raw=direction.length();if(raw<1e-8)direction.set(0,-1,0);else direction.multiplyScalar(1/raw);
 const max=upper+lower-1e-5,min=Math.abs(upper-lower)+1e-5,soft=Math.min(.012,max*.02);
 let d=clamp(raw,min,max);if(raw>max-soft)d=max-soft*Math.exp(-(raw-max+soft)/soft);
 d=Math.max(min,d);const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const bend=pole.clone().addScaledVector(direction,-pole.dot(direction));
 if(bend.lengthSq()<1e-8){bend.set(1,0,0).addScaledVector(direction,-direction.x);if(bend.lengthSq()<1e-8)bend.set(0,0,1).addScaledVector(direction,-direction.z);}
 bend.normalize();return {knee:hip.clone().addScaledVector(direction,along).addScaledVector(bend,height),end:hip.clone().addScaledVector(direction,d),clamped:Math.abs(d-raw)>.0001};
}
export function solveLeg(hip,knee,foot,target,pole){
 // Bone lengths and the parent transform are read from this actor's skeleton.
 const s=scratch;hip.getWorldPosition(s.a);knee.getWorldPosition(s.b);foot.getWorldPosition(s.c);
 const points=twoBonePoints(s.a,target,s.a.distanceTo(s.b),s.b.distanceTo(s.c),pole);
 s.from.copy(s.b).sub(s.a).normalize();s.to.copy(points.knee).sub(s.a).normalize();s.delta.setFromUnitVectors(s.from,s.to);
 hip.getWorldQuaternion(s.world);hip.parent.getWorldQuaternion(s.parent).invert();hip.quaternion.copy(s.parent.multiply(s.delta.multiply(s.world)));hip.updateWorldMatrix(false,true);
 knee.getWorldPosition(s.b);foot.getWorldPosition(s.c);s.from.copy(s.c).sub(s.b).normalize();s.to.copy(points.end).sub(s.b).normalize();s.delta.setFromUnitVectors(s.from,s.to);
 knee.getWorldQuaternion(s.world);knee.parent.getWorldQuaternion(s.parent).invert();knee.quaternion.copy(s.parent.multiply(s.delta.multiply(s.world)));knee.updateWorldMatrix(false,true);
 return points;
}
export class FootContact{
 constructor(){this.anchor=v();this.point=v();this.velocity=v();this.offset=v();this.offsetVelocity=v();this.input=v();this.elapsed=1;this.locked=false;this.ready=false;this.age=0;this.waitForLift=false;}
 reset(){this.ready=false;this.locked=false;this.age=0;this.waitForLift=false;}
 update(input,wantsContact,dt,forceRelease=false){
  if(!wantsContact)this.waitForLift=false;
  if(forceRelease){this.waitForLift=true;wantsContact=false;}else if(this.waitForLift)wantsContact=false;
  const inputVelocity=this.ready&&dt>0?input.clone().sub(this.input).multiplyScalar(1/dt):v();this.input.copy(input);
  if(!this.ready){this.ready=true;this.locked=wantsContact;this.anchor.copy(input);this.point.copy(input);this.velocity.set(0,0,0);this.offset.set(0,0,0);this.offsetVelocity.set(0,0,0);this.elapsed=1;return this.point;}
  const change=wantsContact!==this.locked;
  if(change){this.locked=wantsContact;if(this.locked)this.anchor.copy(input);const next=this.locked?this.anchor:input;this.offset.copy(this.point).sub(next);this.offsetVelocity.copy(this.velocity).sub(this.locked?v():inputVelocity);this.offsetVelocity.clampLength(0,8);this.elapsed=0;this.age=0;}
  else this.elapsed+=dt;
  this.age+=dt;const duration=.10,t=clamp(this.elapsed/duration,0,1),h=2*t*t*t-3*t*t+1,hv=(t*t*t-2*t*t+t)*duration;
  const old=this.point.clone();this.point.copy(this.locked?this.anchor:input).addScaledVector(this.offset,h).addScaledVector(this.offsetVelocity,hv);
  if(dt>0)this.velocity.copy(this.point).sub(old).multiplyScalar(1/dt);return this.point;
 }
}
export function groundSample(heightAt,x,z){
 const h=heightAt(x,z),e=.06,x0=heightAt(x-e,z),x1=heightAt(x+e,z),z0=heightAt(x,z-e),z1=heightAt(x,z+e);
 if(![h,x0,x1,z0,z1].every(Number.isFinite))return null;
 // Discontinuous support is not a walkable slope. Do not glue a foot to a wall.
 if(Math.max(x0,x1,z0,z1)-Math.min(x0,x1,z0,z1)>.22)return null;
 const normal=new T.Vector3(-(x1-x0)/(2*e),1,-(z1-z0)/(2*e)).normalize();if(normal.y<.70)return null;
 return {height:h,normal};
}
function makeState(a,p,time){return {x:p.x,z:p.z,time,phase:0,speed:0,yaw:p.yaw,direction:new T.Vector3(-Math.sin(p.yaw),0,-Math.cos(p.yaw)),mode:'',feet:[new FootContact(),new FootContact()],previous:a.bones.map(b=>b.quaternion.clone()),rigQ:a.rig.quaternion.clone(),rigP:a.rig.position.clone(),rootY:a.bones[0].position.y,stats:{enabled:true,plants:0,locked:0,maxPlantError:0,mode:'stand',groundSolves:0}};}
function modeOf(p){return p.hp<=0?'dead':p.waterMode==='swim'?'swim':p.vault?'vault':p.stance==='prone'?'prone':p.stance==='crouch'?'crouch':'stand';}
export function applyGroundedMotion(a,p,time,dt,heightAt=()=>0){
 let m=a.motion;const mode=modeOf(p),distance=m?Math.hypot(p.x-m.x,p.z-m.z):0;
 const reset=!m||time<m.time||time-m.time>.30||distance>2.5||(dt===0&&m.mode!==mode);
 if(reset)m=a.motion=makeState(a,p,time);
 const moved=reset?0:distance,instant=dt>1e-6?moved/dt:0;
 m.speed+=(clamp(instant,0,10)-m.speed)*(1-Math.exp(-dt*14));
 if(moved>.0001)m.direction.set(p.x-m.x,0,p.z-m.z).normalize();
 const moving=m.speed>.08,run=clamp((m.speed-2.2)/3.5,0,1),crouch=mode==='crouch',stanceFraction=crouch?.64:.58-.18*run,stride=(crouch?.85:1.18+1.18*run)*clamp(m.speed/1.2,.35,1);
 m.phase=(m.phase+moved/stride)%1;const cycle=m.phase*Math.PI*2;
 if(mode==='swim'){
  const stroke=time*(p.submerged?3.8:3.3),travel=clamp(m.speed/1.2,p.submerged?.70:0,1),pitch=-(.25+travel*(p.submerged?1.18:1.10));
  a.rig.rotation.set(pitch,0,Math.sin(stroke)*.045*travel);a.rig.position.set(0,(p.submerged?.20:.56)-1.35*Math.cos(pitch),-.94*Math.sin(pitch));
  for(const side of[-1,1]){const arm=side<0?5:8,leg=side<0?11:14,t=stroke+(side<0?0:Math.PI);
   a.bones[arm].rotation.set((.68+Math.sin(t)*.17)*(1-travel)+(1.46+1.4*Math.cos(t))*travel,0,side*(.65*(1-travel)+(.20+.18*Math.max(0,Math.sin(t)))*travel));
   a.bones[arm+1].rotation.set((1.0+.15*Math.sin(t))*(1-travel)+(.18+.90*Math.max(0,-Math.sin(t)))*travel,0,0);
   a.bones[leg].rotation.x=.18*(1-travel)+Math.sin(t*2)*(.16+.10*travel);a.bones[leg+1].rotation.x=-.4*(1-travel)-.16-.14*Math.max(0,-Math.sin(t*2));a.bones[leg+2].rotation.x=-.35;
  }
  a.bones[2].rotation.y=Math.sin(stroke)*.045*travel;a.bones[4].rotation.x=-.18*travel;
  a.weapon.visible=a.longWeapon.visible=a.tools.visible=false;
 }else if(mode==='stand'||crouch){
  const amount=clamp(m.speed/1.2,0,1),lean=run*.10;
  a.bones[0].position.y=.94-(crouch?.0:.028+amount*(.075+.075*run))+(crouch?0:Math.cos(cycle*2)*.004*amount);
  a.bones[1].rotation.x+=lean;a.bones[2].rotation.z=Math.sin(cycle)*.015*amount;
  if(!p.aim&&!p.melee&&!p.reload&&!p.craft&&!p.healing&&p.phase!=='windup')for(const side of[-1,1]){const arm=side<0?5:8;const swing=Math.sin(cycle+side*Math.PI/2)*amount;a.bones[arm].rotation.x=.07+swing*(.28+run*.22);a.bones[arm+1].rotation.x=.17+run*.25+Math.max(0,-swing)*.14;}
 }
 // Blend source poses BEFORE IK so smoothing cannot drag an established plant.
 // No interpolation changes game action clocks, posture, oxygen or collision.
 const weight=reset||mode==='dead'?1:1-Math.exp(-dt*20);
 for(let i=0;i<a.bones.length;i++){m.previous[i].slerp(a.bones[i].quaternion,weight);a.bones[i].quaternion.copy(m.previous[i]);}
 m.rigQ.slerp(a.rig.quaternion,weight);m.rigP.lerp(a.rig.position,weight);m.rootY+=(a.bones[0].position.y-m.rootY)*weight;
 a.rig.quaternion.copy(m.rigQ);a.rig.position.copy(m.rigP);a.bones[0].position.y=m.rootY;
 a.root.updateMatrixWorld(true);m.stats.locked=0;m.stats.groundSolves=0;m.stats.mode=mode;
 const grounded=(mode==='stand'||crouch)&&Math.abs(a.rig.rotation.x)<.12;
 if(!grounded){m.feet.forEach(f=>f.reset());}
 else for(let i=0;i<2;i++){
  const side=i===0?-1:1,leg=i===0?11:14,phase=(m.phase+i*.5)%1,contactWanted=!moving||phase<stanceFraction;
  const f=m.feet[i],radius=stride*stanceFraction/2,air=!contactWanted?(phase-stanceFraction)/(1-stanceFraction):0;
  const advance=moving?(contactWanted?radius-stride*phase:-radius+2*radius*smooth(air)):0;
  const lateral=new T.Vector3(side*.105,0,0).applyQuaternion(a.root.quaternion),target=new T.Vector3(p.x+lateral.x,0,p.z+lateral.z).addScaledVector(m.direction,advance);
  const support=groundSample(heightAt,target.x,target.z);if(!support||Math.abs(support.height-heightAt(p.x,p.z))>.32){f.reset();continue;}
  target.y=support.height+.094+(contactWanted?0:Math.sin(Math.PI*air)**2*(crouch?.075:.10+.08*run));
  const hip=a.bones[leg].getWorldPosition(v()),reach=a.bones[leg+1].position.length()+a.bones[leg+2].position.length();
  // Release on overreach, large pivots or loss of supporting ground. Never stretch.
  const lockedSupport=f.locked?groundSample(heightAt,f.anchor.x,f.anchor.z):support;
  const tooFar=f.locked&&(hip.distanceTo(f.anchor)>reach-.007||f.anchor.distanceTo(target)>.48||!lockedSupport||(f.rotation&&f.rotation.angleTo(a.root.quaternion)>.65));
  if(!moving&&f.waitForLift&&Math.abs(a.root.rotation.y-m.yaw)<.002&&f.point.distanceTo(target)<.02)f.waitForLift=false;
  const wasLocked=f.locked;const point=f.update(target,contactWanted,dt,tooFar);if(!wasLocked&&f.locked)m.stats.plants++;
  const pole=new T.Vector3(0,0,-1).applyQuaternion(a.root.quaternion);
  solveLeg(a.bones[leg],a.bones[leg+1],a.bones[leg+2],point,pole);
  const foot=a.bones[leg+2],normal=(f.locked?lockedSupport:support)?.normal||up,back=new T.Vector3(0,0,1).applyQuaternion(a.root.quaternion);back.addScaledVector(normal,-back.dot(normal)).normalize();
  const right=normal.clone().cross(back).normalize(),world=q().setFromRotationMatrix(new T.Matrix4().makeBasis(right,normal,back)),parent=foot.parent.getWorldQuaternion(q()).invert();if(f.locked&&!wasLocked)f.rotation=world.clone();if(f.locked&&f.rotation)world.copy(f.rotation);foot.quaternion.copy(parent.multiply(world));foot.updateWorldMatrix(false,true);
  const error=foot.getWorldPosition(v()).distanceTo(point);m.stats.groundSolves++;
  if(f.locked){m.stats.locked++;if(f.age>.11)m.stats.maxPlantError=Math.max(m.stats.maxPlantError,error);}
 }
 m.x=p.x;m.z=p.z;m.time=time;m.mode=mode;m.yaw=a.root.rotation.y;
}
export const motionStats=a=>a.motion?{...a.motion.stats,phase:a.motion.phase,speed:a.motion.speed}:{enabled:true,mode:'not-rendered',locked:0};
