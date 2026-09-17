import {cruiseFactor,normalizedStick} from './active-controls.js';
import * as T from './vendor/three.module.js';import R from './vendor/rapier.mjs';
import {RangerJeep,rotateVector} from './ranger-physics.js?v=express1';
import {RangerPerson} from './frontier-vehicles.js?v=express1';
import {makeJeep} from './ranger-art.js';import {makeBoat,makeHelicopter,makePerson} from './frontier-art.js';
import {canWalk,canBoat,gap,POINTS,BOUNDS,clamp} from './tidegate-core.js';
class DistrictPerson extends RangerPerson {
 constructor(physics,state){super(physics);this.state=state;}
 move(v,dt,yaw){if(!this.active)return;let x=v.x||0,z=v.z||0;const n=Math.hypot(x,z);if(n>1){x/=n;z/=n;}const speed=v.boost?9:5.1,p=this.position;let dx=(x*Math.cos(yaw)-z*Math.sin(yaw))*speed*dt,dz=(-x*Math.sin(yaw)-z*Math.cos(yaw))*speed*dt;
  if(!canWalk({x:p.x+dx,z:p.z+dz},this.state)){dx=0;dz=0;}
  if(v.jump&&!this.jumpHeld&&this.grounded)this.vy=7;this.jumpHeld=!!v.jump;this.vy=Math.max(-25,this.vy-18*dt);
  this.controller.computeColliderMovement(this.collider,{x:dx,y:this.vy*dt,z:dz});const m=this.controller.computedMovement();this.grounded=this.controller.computedGrounded()?4:0;if(this.grounded&&this.vy<0)this.vy=-.1;
  this.body.setNextKinematicTranslation({x:p.x+m.x,y:p.y+m.y,z:p.z+m.z});this.speed=Math.hypot(m.x,m.z)/dt;if(Math.hypot(dx,dz)>.001)this.heading=Math.atan2(dx,dz);
 }
}
export class DistrictCraft {
 constructor(physics,type,spawn,state){this.type=type;this.state=state;this.speed=0;this.grounded=0;this.targetY=spawn.y;this.body=physics.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(spawn.x,spawn.y,spawn.z).setLinearDamping(.8).setAngularDamping(2).setCcdEnabled(true));this.collider=physics.world.createCollider(R.ColliderDesc.cuboid(type==='boat'?1.1:1.3,.42,2.3).setMass(350).setFriction(.8),this.body);}
 get position(){return this.body.translation();}get heading(){const d=rotateVector({x:0,y:0,z:1},this.body.rotation());return Math.atan2(d.x,d.z);}
 drive(v,dt){const p=this.position,vel=this.body.linvel(),mass=this.body.mass(),up=rotateVector({x:0,y:1,z:0},this.body.rotation());let tx=0,tz=0;
  if(this.type==='helicopter'){if(v.brake)this.targetY=clamp(p.y,.95,28);this.targetY=clamp(this.targetY+(v.brake?0:v.climb||0)*dt*9*cruiseFactor(v),.95,28);const speed=(v.boost?19:12)*cruiseFactor(v),stick=normalizedStick(v.x,v.z),yaw=v.cameraYaw||0;if((!v.aim||v.independentTools)&&!v.brake&&p.y>1.3){tx=(stick.x*Math.cos(yaw)-stick.z*Math.sin(yaw))*speed;tz=(-stick.x*Math.sin(yaw)-stick.z*Math.cos(yaw))*speed;}}
  else{const throttle=v.aim&&!v.independentTools?0:v.throttle||0,speed=throttle*(v.boost?11:7)*cruiseFactor(v);tx=Math.sin(this.heading)*speed;tz=Math.cos(this.heading)*speed;if(!canBoat({x:p.x+tx*.2,z:p.z+tz*.2},this.state)){tx=0;tz=0;}this.body.setAngvel({x:0,y:(v.steer||0)*Math.sign(throttle||1)*1.1,z:0},true);}
  if(v.brake){tx=0;tz=0;}if(Math.abs(p.x+tx*.1)>64)tx=0;if(p.z+tz*.1<-44||p.z+tz*.1>50)tz=0;
  this.body.applyImpulse({x:(tx-vel.x)*mass*dt*3,y:mass*dt*(18+clamp((this.targetY-p.y)*15-vel.y*6,-28,35)),z:(tz-vel.z)*mass*dt*3},true);
  this.body.applyTorqueImpulse({x:-up.z*mass*dt*7,y:0,z:up.x*mass*dt*7},true);this.speed=Math.hypot(vel.x,vel.z);this.grounded=p.y<1.6?4:0;
 }
 reset(p){this.body.setTranslation(p,true);this.body.setLinvel({x:0,y:0,z:0},true);this.body.setAngvel({x:0,y:0,z:0},true);this.body.setRotation({x:0,y:0,z:0,w:1},true);this.targetY=p.y;}
}
export class TidegateFleet {
 constructor(physics,world,state,notify){this.physics=physics;this.world=world;this.state=state;this.notify=notify;this.person=new DistrictPerson(physics,state);this.active='foot';
  const spawn=state.position&&canWalk(state.position,state)?state.position:state.checkpoint==='station'?{x:45,y:1.2,z:24}:{x:-35,y:1.2,z:39};this.person.setActive(true,spawn);this.personModel=makePerson();world.root.add(this.personModel);
  this.vehicles=[{id:'jeep',type:'jeep',drive:new RangerJeep(physics,{x:-34,z:23}),model:makeJeep()},{id:'boat',type:'boat',drive:new DistrictCraft(physics,'boat',{x:-7,y:.85,z:38},state),model:makeBoat()},{id:'helicopter',type:'helicopter',drive:new DistrictCraft(physics,'helicopter',{x:-53,y:1,z:39},state),model:makeHelicopter()}];for(const v of this.vehicles){v.lastDry={...v.drive.position};v.spawn={...v.drive.position};v.inverted=0;world.root.add(v.model);}
 }
 get current(){return this.vehicles.find(v=>v.id===this.active)||null;}get actor(){return this.current?.drive||this.person;}get position(){return this.actor.position;}get mode(){return this.current?.type||'foot';}
 nearest(){return this.vehicles.filter(v=>gap(v.drive.position,this.position)<7&&Math.abs(v.drive.position.y-this.position.y)<3).sort((a,b)=>gap(a.drive.position,this.position)-gap(b.drive.position,this.position))[0];}
 board(){
  const v=this.current;if(!v){const n=this.nearest();if(!n){this.notify('Approach a parked vehicle or the patrol-boat landing.');return false;}this.person.setActive(false);this.active=n.id;return true;}
  if(v.drive.speed>2.6){this.notify('Stop before leaving the vehicle.');return false;}
  if(v.type==='boat'){const p=v.drive.position;if(Math.abs(p.z-38)>7){this.notify('Use either lower-harbor landing to disembark.');return false;}const side=p.x<0?-1:1;this.person.setActive(true,{x:side*14,y:1.2,z:38});}
  else{
   const p=v.drive.position;let dest=null;for(const a of [Math.PI/2,-Math.PI/2,0,Math.PI]){const q={x:p.x+Math.sin(a+v.drive.heading)*4.2,z:p.z+Math.cos(a+v.drive.heading)*4.2};if(!canWalk(q,this.state))continue;const hit=this.physics.world.castRay(new R.Ray({x:q.x,y:p.y+.6,z:q.z},{x:0,y:-1,z:0}),3,true,undefined,undefined,v.drive.collider,v.drive.body);if(!hit)continue;const y=p.y+.6-hit.timeOfImpact;if(v.type==='helicopter'&&Math.abs(p.y-y)>2.5)continue;q.y=y+1.05;const blocked=this.physics.world.intersectionWithShape(q,{x:0,y:0,z:0,w:1},new R.Capsule(.5,.32),undefined,undefined,this.person.collider);if(!blocked){dest=q;break;}}
   if(!dest){this.notify('Land or move to a clear exit before stepping out.');return false;}this.person.setActive(true,dest);
  }
  this.active='foot';return true;
 }
 step(v,dt,time,yaw){for(const item of this.vehicles)item.drive.drive(item.id===this.active?{...v,cameraYaw:yaw}:{brake:true},dt,time);if(this.mode==='foot')this.person.move(v,dt,yaw);}
 after(dt){for(const v of this.vehicles){const p=v.drive.position;if(v.type==='jeep'){if(!canWalk(p,this.state)){v.drive.reset(v.lastDry);this.notify('Tidal water ahead. Use a crossing or the patrol boat.');}else v.lastDry={...p};}
  const up=rotateVector({x:0,y:1,z:0},v.drive.body.rotation());v.inverted=up.y<.2?v.inverted+dt:0;if(v.inverted>3||p.y<-4||!Number.isFinite(p.x)){v.drive.reset(v.spawn);v.inverted=0;this.notify('Vehicle recovered without damage.');}}
 }
 sync(dt){for(const v of this.vehicles){v.model.position.copy(v.drive.position);v.model.quaternion.copy(v.drive.body.rotation());const d=v.drive;if(v.model.userData.tires)v.model.userData.tires.forEach(({pivot,roll},i)=>{const c=d.connections[i];pivot.position.set(c.x,c.y-(d.controller.wheelSuspensionLength(i)||.42),c.z);pivot.rotation.y=i<2?d.steer:0;roll.rotation.x=d.controller.wheelRotation(i)||0;});if(v.model.userData.rotor){v.model.userData.rotor.rotation.y+=dt*(v.id===this.active?35:2);v.model.userData.tailRotor.rotation.x+=dt*35;}}
  this.personModel.position.set(this.person.position.x,this.person.position.y-.9,this.person.position.z);this.personModel.rotation.y=this.person.heading;
 }
}
