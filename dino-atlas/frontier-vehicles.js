import R from './vendor/rapier.mjs';
import {HARBORS,surfaceAt} from './ranch-data.js';
import {RangerJeep,rotateVector} from './ranger-physics.js?v=ranch1';
import {FLEET_START,OUTPOSTS,WORLD_RADIUS,DOCK,isWater} from './frontier-data.js?v=ranch1';
import {clamp,distance} from './ranger-data.js';
const upright=h=>({x:0,y:Math.sin(h/2),z:0,w:Math.cos(h/2)});
export class FlightBoat{
 constructor(physics,def){this.world=physics.world;this.type=def.type;this.speed=0;this.grounded=0;this.impactTime=0;this.targetY=def.type==='helicopter'?.92:.77;
  this.body=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(def.x,this.targetY,def.z).setRotation(upright(def.heading)).setLinearDamping(.65).setAngularDamping(2.3).setCcdEnabled(true));
  this.collider=this.world.createCollider(R.ColliderDesc.cuboid(def.type==='boat'?1.2:1.35,.45,2.4).setMass(def.type==='boat'?350:420).setFriction(.8),this.body);
 }
 get position(){return this.body.translation();}
 get heading(){const f=rotateVector({x:0,y:0,z:1},this.body.rotation());return Math.atan2(f.x,f.z);}
 reset(p,heading=this.heading){this.body.setTranslation({x:p.x,y:p.y??(this.type==='boat'?.77:1),z:p.z},true);this.body.setRotation(upright(heading),true);this.body.setLinvel({x:0,y:0,z:0},true);this.body.setAngvel({x:0,y:0,z:0},true);this.targetY=p.y??(this.type==='boat'?.77:1);this.speed=0;}
 drive(v,dt,time=0){
  this.impactTime=Math.max(0,this.impactTime-dt);const b=this.body,p=b.translation(),vel=b.linvel(),mass=b.mass(),up=rotateVector({x:0,y:1,z:0},b.rotation()),h=this.heading;
  this.speed=Math.hypot(vel.x,vel.z);this.grounded=p.y<surfaceAt(p)+1.5?4:0;
  let tx=0,tz=0;
  if(this.type==='helicopter'){
   this.targetY=clamp(this.targetY+(v.climb||0)*dt*14,surfaceAt(p)+.88,80);
   const flying=this.targetY>1.5||p.y>2;if(flying&&!v.aim&&!v.brake){const speed=v.boost?28:19,angle=v.cameraYaw??Math.PI;tx=((v.x||0)*Math.cos(angle)-(v.z||0)*Math.sin(angle))*speed;tz=(-(v.x||0)*Math.sin(angle)-(v.z||0)*Math.cos(angle))*speed;}
   if(this.impactTime===0){let desiredYaw=(Math.abs(tx)+Math.abs(tz)>.2)?Math.atan2(tx,tz):h;let dy=Math.atan2(Math.sin(desiredYaw-h),Math.cos(desiredYaw-h));const av=b.angvel();b.setAngvel({x:av.x,y:dy*2,z:av.z},true);}
  }else{
   const throttle=v.aim?0:(v.throttle||0),speed=throttle*(v.boost?19:13);tx=Math.sin(h)*speed;tz=Math.cos(h)*speed;
   if(!isWater(p.x+tx*dt*5,p.z+tz*dt*5,-3)){tx=0;tz=0;}
   this.targetY=.78+Math.sin(time*1.8+p.x*.08)*.045;
   if(this.impactTime===0){const av=b.angvel();b.setAngvel({x:av.x,y:(v.steer||0)*(Math.abs(this.speed)>1?1:0)*Math.sign(throttle||1)*.85,z:av.z},true);}
  }
  if(v.brake){tx=0;tz=0;}
  if(this.impactTime===0){b.applyImpulse({x:(tx-vel.x)*mass*dt*2.2,y:0,z:(tz-vel.z)*mass*dt*2.2},true);b.applyTorqueImpulse({x:-up.z*mass*dt*7,y:0,z:up.x*mass*dt*7},true);}
  // Gravity compensation plus a damped height spring keeps flight and buoyancy physical.
  b.applyImpulse({x:0,y:mass*dt*(18+clamp((this.targetY-p.y)*14-vel.y*6,-26,38)),z:0},true);
 }
}
export class RangerPerson{
 constructor(physics){this.world=physics.world;this.body=this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0,1,55));this.collider=this.world.createCollider(R.ColliderDesc.capsule(.55,.34).setFriction(.8),this.body);this.controller=this.world.createCharacterController(.035);this.controller.enableAutostep(.45,.25,true);this.controller.enableSnapToGround(.25);this.controller.setApplyImpulsesToDynamicBodies(true);this.controller.setCharacterMass(65);this.vy=0;this.heading=Math.PI;this.speed=0;this.grounded=0;this.jumpHeld=false;this.active=false;this.body.setEnabled(false);}
 get position(){return this.body.translation();}
 setActive(on,p){this.active=on;this.body.setEnabled(on);if(p){this.body.setTranslation({x:p.x,y:p.y??1,z:p.z},true);this.vy=0;}}
 move(v,dt,yaw){if(!this.active)return;let x=v.x||0,z=v.z||0;const n=Math.hypot(x,z);if(n>1){x/=n;z/=n;}const speed=v.boost?9:5.1;let dx=(x*Math.cos(yaw)-z*Math.sin(yaw))*speed*dt,dz=(-x*Math.sin(yaw)-z*Math.cos(yaw))*speed*dt;const p=this.position;
  if(isWater(p.x+dx,p.z+dz,1.4)||Math.hypot(p.x+dx,p.z+dz)>WORLD_RADIUS-4){dx=0;dz=0;}
  if(v.jump&&!this.jumpHeld&&this.grounded)this.vy=7;this.jumpHeld=!!v.jump;this.vy=Math.max(-25,this.vy-18*dt);
  this.controller.computeColliderMovement(this.collider,{x:dx,y:this.vy*dt,z:dz});const m=this.controller.computedMovement();this.grounded=this.controller.computedGrounded()?4:0;if(this.grounded&&this.vy<0)this.vy=-.1;
  this.body.setNextKinematicTranslation({x:p.x+m.x,y:p.y+m.y,z:p.z+m.z});this.speed=Math.hypot(m.x,m.z)/dt;
  if(Math.hypot(dx,dz)>.001)this.heading=Math.atan2(dx,dz);
 }
}
export class Fleet{
 constructor(physics,state){this.physics=physics;this.state=state;this.vehicles=FLEET_START.map(def=>{const drive=['jeep','buggy'].includes(def.type)?new RangerJeep(physics,def):new FlightBoat(physics,def);const p=state.poses[def.id];if(p&&(!isWater(p.x,p.z)||def.type==='boat')&&(def.type!=='boat'||isWater(p.x,p.z,-2)))drive.reset(p,p.heading);return {...def,drive,model:null,recovery:0,recoveries:0,lastDry:{x:def.x,y:1.4,z:def.z}};});this.person=new RangerPerson(physics);this.active=state.active;this.person.setActive(this.active==='foot',state.foot);this.onNotice=()=>{};this.onRecover=()=>{};}
 get current(){return this.vehicles.find(v=>v.id===this.active)||null;}
 get actor(){return this.current?.drive||this.person;}
 get mode(){return this.current?.type||'foot';}
 get position(){return this.actor.position;}
 nearest(){return [...this.vehicles].filter(v=>Math.abs(v.drive.position.y-this.position.y)<3&&(distance(v.drive.position,this.position)<6.7||(v.type==='boat'&&HARBORS.some(d=>distance(this.position,d.land)<12&&distance(v.drive.position,d)<35)))).sort((a,b)=>distance(a.drive.position,this.position)-distance(b.drive.position,this.position))[0]||null;}
 canStand(p){if(Math.hypot(p.x,p.z)>WORLD_RADIUS-4||isWater(p.x,p.z,1))return false;const shape=new R.Capsule(.48,.32);const hit=this.physics.world.intersectionWithShape({x:p.x,y:p.y??1.05,z:p.z},{x:0,y:0,z:0,w:1},shape,undefined,undefined,this.person.collider);return !hit;}
 board(){
  if(this.current){const v=this.current,p=v.drive.position;if(Math.abs(v.drive.speed)>2.6){this.onNotice('Stop before leaving the vehicle.');return false;}if(v.type==='helicopter'&&p.y>surfaceAt(p)+2.3){this.onNotice('Land before exiting. Use LT to descend.');return false;}
   let exit;
   if(v.type==='boat'){const dock=HARBORS.find(d=>distance(p,d)<35);if(!dock){this.onNotice('Return to any marked harbor to disembark.');return false;}exit={...dock.land,y:1.6};}
   else{const h=v.drive.heading;for(const a of [Math.PI/2,-Math.PI/2,Math.PI,0]){const q={x:p.x+Math.sin(h+a)*4.4,y:surfaceAt(p)+1.1,z:p.z+Math.cos(h+a)*4.4};if(this.canStand(q)){exit=q;break;}}}
   if(!exit){this.onNotice('The exits are obstructed. Move to an open space.');return false;}
   this.active='foot';this.person.setActive(true,exit);this.person.heading=v.drive.heading;this.onNotice('On foot. RT fires; X reloads; Y boards a nearby vehicle.');return true;
  }
  const v=this.nearest();if(!v){this.onNotice('Approach a parked vehicle to board it.');return false;}if(v.type==='helicopter'&&v.drive.position.y>surfaceAt(v.drive.position)+2.6){this.onNotice('The helicopter must be on the ground.');return false;}
  this.person.setActive(false);this.active=v.id;if(!this.state.rides.includes(v.type))this.state.rides.push(v.type);this.onNotice(v.name+' ready. Hold LB and RT to use your tool.');return true;
 }
 drive(v,dt,time,yaw){for(const item of this.vehicles){const selected=item.id===this.active;item.drive.drive(selected?{...v,cameraYaw:yaw}:{brake:true},dt,time);}if(this.active==='foot')this.person.move(v,dt,yaw);}
 recover(item=this.current){if(!item)return;const d=item.drive,p=d.position,h=d.heading;d.reset({x:p.x,y:Math.max(.9,p.y)+.8,z:p.z},h);if(item.type==='helicopter')d.targetY=clamp(p.y+.8,1,80);item.recovery=0;item.recoveries++;this.onRecover(item);}
 afterStep(dt){for(const item of this.vehicles){const d=item.drive,p=d.position,q=d.body.rotation(),up=rotateVector({x:0,y:1,z:0},q),speed=Math.hypot(...Object.values(d.body.linvel()));
   if(![p.x,p.y,p.z].every(Number.isFinite)||p.y< -6){const o=OUTPOSTS.find(o=>o.id===this.state.checkpoint)||OUTPOSTS[0];const dest=item.type==='boat'?FLEET_START.find(f=>f.type==='boat'):{x:o.x+4,z:o.z+4};d.reset(dest);this.onNotice('Safety recovery used the nearest saved safe point.');continue;}
   if(Math.hypot(p.x,p.z)>WORLD_RADIUS-3){const k=(WORLD_RADIUS-5)/Math.hypot(p.x,p.z);d.body.setTranslation({x:p.x*k,y:p.y,z:p.z*k},true);d.body.setLinvel({x:0,y:0,z:0},true);}
   if(item.type==='jeep'||item.type==='buggy'){
    if(isWater(p.x,p.z,1.6)){d.body.setTranslation(item.lastDry,true);d.body.setLinvel({x:0,y:0,z:0},true);if(item.id===this.active)this.onNotice('Deep water ahead. Use the patrol boat at the dock.');}
    else item.lastDry={x:p.x,y:Math.max(.95,p.y),z:p.z};
   }
   const inverted=up.y<.25;item.recovery=inverted?item.recovery+dt:0;if(item.recovery>2.2&&(speed<4||item.recovery>5.2))this.recover(item);
  }}
 blast(origin,power=1){let count=0;for(const v of this.vehicles){const d=v.drive,p=d.position,gap=distance(origin,p);if(gap>14||Math.abs(p.y-(origin.y||1))>10)continue;const k=(1-gap/17)*power,dx=p.x-origin.x,dz=p.z-origin.z,l=Math.hypot(dx,dz)||1;d.body.applyImpulse({x:dx/l*2300*k,y:2100*k,z:dz/l*2300*k},true);d.body.applyTorqueImpulse({x:3300*k,y:300*k,z:4400*k},true);d.impactTime=1.8;count++;}return count;}
 hitBy(a){const v=this.current;if(!v||a.attackCooldown>0||v.drive.position.y>4||distance(a,v.drive.position)>a.radius+2)return false;const d=v.drive,p=d.position,dx=p.x-a.x,dz=p.z-a.z,l=Math.hypot(dx,dz)||1;d.body.applyImpulse({x:dx/l*1100,y:750,z:dz/l*1100},true);d.body.applyTorqueImpulse({x:1400,y:120,z:2600},true);d.impactTime=1.1;a.attackCooldown=5;return true;}
 capture(){this.state.active=this.active;this.state.foot={...this.person.position};for(const v of this.vehicles)this.state.poses[v.id]={...v.drive.position,heading:v.drive.heading};}
 travel(outpost){const o=OUTPOSTS.find(o=>o.id===outpost&&this.state.outposts.includes(outpost));if(!o)return false;if(this.current?.type==='boat'){this.onNotice('Disembark at the wetland dock before using land transport.');return false;}if(this.current){this.current.drive.reset({x:o.pad.x,z:o.pad.z},Math.PI);}else this.person.setActive(true,{x:o.x,y:1.1,z:o.z+4});this.state.checkpoint=o.id;return true;}
}
