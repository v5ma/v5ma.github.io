import {RAPIER,RangerJeep,rotateVector} from './ranger-physics.js';
import {clamp} from './ranger-data.js';
import {LAGOON,inWater,MAP_RADIUS} from './frontier-data.js';
const ZERO={x:0,y:0,z:0};
export function upright(vehicle){
 const p=vehicle.position,h=vehicle.heading;
 vehicle.body.setRotation({x:0,y:Math.sin(h/2),z:0,w:Math.cos(h/2)},true);
 vehicle.body.setTranslation({x:p.x,y:Math.max(p.y,vehicle.type==='boat'?1.05:1.55),z:p.z},true);
 vehicle.body.setLinvel(ZERO,true);vehicle.body.setAngvel(ZERO,true);vehicle.body.resetForces(true);vehicle.body.resetTorques(true);vehicle.rollTime=0;
}
export function autoRecover(vehicle,dt){
 const up=rotateVector({x:0,y:1,z:0},vehicle.body.rotation());
 vehicle.rollTime=up.y<.25?(vehicle.rollTime||0)+dt:0;
 if(vehicle.rollTime>2.4){upright(vehicle);return true;}return false;
}
export class UtilityVehicle{
 constructor(physics,d){
  this.id=d.id;this.type=d.type;this.name=d.name;this.world=physics.world;this.speed=0;this.grounded=0;this.rollTime=0;
  const boat=d.type==='boat';this.body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(d.x,boat?1:1.4,d.z).setLinearDamping(.45).setAngularDamping(2).setCcdEnabled(true));
  this.collider=this.world.createCollider(RAPIER.ColliderDesc.cuboid(boat?1.25:1.4,boat?.42:.65,boat?2.6:2.5).setMass(boat?370:650).setFriction(.5),this.body);
  this.body.setRotation({x:0,y:Math.sin(d.heading/2),z:0,w:Math.cos(d.heading/2)},true);
  this.lastSafe={x:d.x,z:d.z};
 }
 get position(){return this.body.translation();}
 get heading(){const f=rotateVector({x:0,y:0,z:1},this.body.rotation());return Math.atan2(f.x,f.z);}
 drive(input={},dt=1/60,active=false){
  const b=this.body,p=b.translation(),v=b.linvel(),q=b.rotation(),f=rotateVector({x:0,y:0,z:1},q),up=rotateVector({x:0,y:1,z:0},q),mass=b.mass();
  this.speed=v.x*f.x+v.z*f.z;this.grounded=p.y<2?1:0;
  const throttle=active?(input.throttle||0):0,turn=active?(input.steer||0):0,boat=this.type==='boat',max=boat?18:input.boost?36:26;
  const target=throttle*max,accel=clamp((target-this.speed)*2,-18,18),side={x:f.z,z:-f.x},slip=v.x*side.x+v.z*side.z;
  if(boat||active||p.y>2){
   b.applyImpulse({x:(f.x*accel-side.x*slip*2.5)*mass*dt,y:0,z:(f.z*accel-side.z*slip*2.5)*mass*dt},true);
   const av=b.angvel();b.setAngvel({x:av.x,y:turn*(boat?.8:1.05)*(boat?clamp(Math.abs(this.speed)/3,.15,1):1),z:av.z},true);
  }
  if(boat){
   b.applyImpulse({x:0,y:mass*(18+(1.02-p.y)*22-v.y*7)*dt,z:0},true);
  }else if(active){
   let vy=(input.rise?9:0)-(input.descend?7:0);if(p.y>65)vy=Math.min(vy,-2);if(p.y<1.15)vy=Math.max(vy,0);
   b.applyImpulse({x:0,y:mass*(18+clamp((vy-v.y)*4,-25,28))*dt,z:0},true);
  }
  if(up.y>.25){b.applyTorqueImpulse({x:-up.z*mass*7*dt,y:0,z:up.x*mass*7*dt},true);}
  if(input.brake){b.applyImpulse({x:-v.x*mass*4*dt,y:0,z:-v.z*mass*4*dt},true);}
 }
 reset(p,heading=this.heading){this.body.setTranslation({x:p.x,y:this.type==='boat'?1.05:1.5,z:p.z},true);this.body.setRotation({x:0,y:Math.sin(heading/2),z:0,w:Math.cos(heading/2)},true);this.body.setLinvel(ZERO,true);this.body.setAngvel(ZERO,true);this.speed=0;this.lastSafe={x:p.x,z:p.z};}
}
export function makeVehicle(physics,d){
 const v=['jeep','rover'].includes(d.type)?new RangerJeep(physics):new UtilityVehicle(physics,d);
 Object.assign(v,{id:d.id,type:d.type,name:d.name,rollTime:0,lastSafe:{x:d.x,z:d.z},recoveries:0});if(v instanceof RangerJeep)v.reset(d,d.heading);return v;
}
export function constrainVehicle(v){
 const p=v.position,boat=v.type==='boat';
 if(boat&&!inWater(p,-2)){
  let x=(p.x-LAGOON.x)/(LAGOON.rx-2),z=(p.z-LAGOON.z)/(LAGOON.rz-2),r=Math.hypot(x,z)||1;
  v.body.setTranslation({x:LAGOON.x+x/r*(LAGOON.rx-2),y:1.02,z:LAGOON.z+z/r*(LAGOON.rz-2)},true);v.body.setLinvel(ZERO,true);return;
 }
 if(!boat&&!(v.type==='helicopter'&&p.y>3)&&inWater(p,1)){
  v.body.setTranslation({x:v.lastSafe.x,y:1.55,z:v.lastSafe.z},true);v.body.setLinvel(ZERO,true);return;
 }
 if(Math.hypot(p.x,p.z)>MAP_RADIUS-3){const r=Math.hypot(p.x,p.z),n=(MAP_RADIUS-4)/r;v.body.setTranslation({x:p.x*n,y:Math.max(1.5,p.y),z:p.z*n},true);v.body.setLinvel(ZERO,true);}
 else if(!inWater(p,2))v.lastSafe={x:p.x,z:p.z};
 if(!Number.isFinite(p.x)||p.y< -5){v.reset(v.lastSafe);}
}
export class WalkingRanger{
 constructor(physics){
  this.world=physics.world;this.body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(4,1,51).setLinearDamping(4).lockRotations().setCcdEnabled(true));
  this.collider=this.world.createCollider(RAPIER.ColliderDesc.capsule(.48,.36).setMass(65).setFriction(.1),this.body);this.body.setEnabled(false);this.heading=Math.PI;this.speed=0;this.grounded=2;this.lastSafe={x:4,z:51};this.type='foot';
 }
 get position(){return this.body.translation();}
 setPosition(p){this.body.setTranslation({x:p.x,y:1,z:p.z},true);this.body.setLinvel(ZERO,true);this.lastSafe={x:p.x,z:p.z};}
 move(input,yaw,dt){
  const z=-(input.throttle||0),x=-(input.steer||0),n=Math.max(1,Math.hypot(x,z)),s=input.boost?9:5.6;
  const dx=(x*Math.cos(yaw)+z*Math.sin(yaw))/n,dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))/n,v=this.body.linvel();
  this.body.setLinvel({x:dx*s,y:clamp(v.y,-20,10),z:dz*s},true);if(Math.hypot(dx,dz)>.1)this.heading=Math.atan2(dx,dz);this.speed=Math.hypot(dx,dz)*s;
 }
 constrain(){const p=this.position;if(inWater(p,1)||Math.hypot(p.x,p.z)>MAP_RADIUS-3||p.y< -3){this.setPosition(this.lastSafe);}else this.lastSafe={x:p.x,z:p.z};}
}
export function safeExit(physics,vehicle){
 const p=vehicle.position;if(vehicle.type==='helicopter'&&p.y>2.8)return null;
 const direction=vehicle.heading;
 for(const radius of [3.5,5,7,10,13])for(let i=0;i<12;i++){
  const a=direction+Math.PI/2+i*Math.PI/6,pos={x:p.x+Math.sin(a)*radius,y:1.3,z:p.z+Math.cos(a)*radius};
  if(inWater(pos,1)||Math.hypot(pos.x,pos.z)>MAP_RADIUS-4)continue;
  let blocked=false;physics.world.intersectionsWithShape(pos,{x:0,y:0,z:0,w:1},new RAPIER.Ball(.7),c=>{if(c.parent()?.handle!==vehicle.body.handle){blocked=true;return false;}return true;});
  if(!blocked)return pos;
 }return null;
}
