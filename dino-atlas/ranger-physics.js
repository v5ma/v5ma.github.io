import RAPIER from './vendor/rapier.mjs';
import {HOME,clamp} from './ranger-data.js';
export async function initPhysics(){await RAPIER.init();return RAPIER;}
export function rotateVector(v,q){
  const ix=q.w*v.x+q.y*v.z-q.z*v.y,iy=q.w*v.y+q.z*v.x-q.x*v.z,iz=q.w*v.z+q.x*v.y-q.y*v.x,iw=-q.x*v.x-q.y*v.y-q.z*v.z;
  return {x:ix*q.w+iw*-q.x+iy*-q.z-iz*-q.y,y:iy*q.w+iw*-q.y+iz*-q.x-ix*-q.z,z:iz*q.w+iw*-q.z+ix*-q.y-iy*-q.x};
}
export class ParkPhysics{
  constructor(){
    this.world=new RAPIER.World({x:0,y:-18,z:0});this.world.timestep=1/60;
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(325,.5,325).setTranslation(0,-.5,0).setFriction(.9));
    this.props=[];
  }
  box(x,y,z,hx,hy,hz,options={}){
    const desc=options.dynamic?RAPIER.RigidBodyDesc.dynamic().setLinearDamping(.4).setAngularDamping(.4):RAPIER.RigidBodyDesc.fixed();
    desc.setTranslation(x,y,z);if(options.angle)desc.setRotation({x:0,y:Math.sin(options.angle/2),z:0,w:Math.cos(options.angle/2)});
    const body=this.world.createRigidBody(desc);
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setFriction(.7).setRestitution(.08).setMass(options.dynamic?18:1),body);
    return body;
  }
  cylinder(x,z,r,y=1,h=1){return this.world.createCollider(RAPIER.ColliderDesc.cylinder(h,r).setTranslation(x,y,z).setFriction(.5));}
  animal(radius,x,z){const b=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x,1,z));this.world.createCollider(RAPIER.ColliderDesc.cylinder(.9,radius).setFriction(.4),b);return b;}
  ramp(x,z){
    const verts=new Float32Array([-3,0,-5,3,0,-5,-3,0,5,3,0,5,-3,1.5,-5,3,1.5,-5]);
    const d=RAPIER.ColliderDesc.convexHull(verts);if(d)this.world.createCollider(d.setTranslation(x,0,z).setFriction(.8));
  }
}
export class RangerJeep{
  constructor(physics,spawn=HOME){
    this.world=physics.world;this.body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(spawn.x,1.4,spawn.z).setRotation({x:0,y:1,z:0,w:0}).setLinearDamping(.12).setAngularDamping(1.5).setCcdEnabled(true));
    this.collider=this.world.createCollider(RAPIER.ColliderDesc.cuboid(1.02,.36,1.72).setMass(280).setFriction(.5).setRestitution(.1),this.body);
    this.controller=this.world.createVehicleController(this.body);this.controller.indexUpAxis=1;this.controller.setIndexForwardAxis=2;
    this.connections=[];this.steer=0;this.jumpCooldown=0;this.speed=0;this.grounded=0;this.impactTime=0;
    for(const z of [1.18,-1.18])for(const x of [-1.03,1.03]){
      const i=this.controller.numWheels(),p={x,y:0,z};this.connections.push(p);
      this.controller.addWheel(p,{x:0,y:-1,z:0},{x:-1,y:0,z:0},.42,.49);
      this.controller.setWheelSuspensionStiffness(i,38);
      this.controller.setWheelSuspensionCompression(i,4.4);
      this.controller.setWheelSuspensionRelaxation(i,5.2);
      this.controller.setWheelMaxSuspensionTravel(i,.32);
      this.controller.setWheelMaxSuspensionForce(i,11000);
      this.controller.setWheelFrictionSlip(i,2.4);
      this.controller.setWheelSideFrictionStiffness(i,1.25);
    }
  }
  drive(input,dt=1/60){
    const vc=this.controller,vel=this.body.linvel(),forward=rotateVector({x:0,y:0,z:1},this.body.rotation());
    this.speed=vel.x*forward.x+vel.z*forward.z;this.jumpCooldown=Math.max(0,this.jumpCooldown-dt);this.impactTime=Math.max(0,this.impactTime-dt);
    const throttle=clamp(input.throttle||0,-1,1),boost=!!input.boost,limit=boost?22:15;
    this.steer+=((input.steer||0)*(.52/(1+Math.abs(this.speed)*.045))-this.steer)*Math.min(1,dt*8);
    const reversing=throttle<0&&this.speed>1.1,stopping=throttle>0&&this.speed< -1.1;
    let force=throttle*480;if(reversing||stopping||this.speed>limit&&throttle>0||this.speed< -7&&throttle<0)force=0;
    if(boost&&force>0)force*=1.55;
    const brake=input.brake?42:reversing||stopping?24:Math.abs(throttle)<.05?1.3:0;
    for(let i=0;i<4;i++){
      vc.setWheelSteering(i,i<2?this.steer:0);vc.setWheelEngineForce(i,force);
      vc.setWheelBrake(i,brake);vc.setWheelFrictionSlip(i,input.brake&&i>=2?1.05:2.4);
    }
    vc.updateVehicle(dt,undefined,undefined,c=>c.handle!==this.collider.handle);
    this.grounded=[0,1,2,3].filter(i=>vc.wheelIsInContact(i)).length;
    if(this.grounded>=2){
      this.body.applyImpulse({x:0,y:-150*dt,z:0},true);
      const up=rotateVector({x:0,y:1,z:0},this.body.rotation());
      if(up.y>.25&&this.impactTime===0)this.body.applyTorqueImpulse({x:-up.z*1200*dt,y:0,z:up.x*1200*dt},true);
      if(input.jump&&this.jumpCooldown===0){this.body.applyImpulse({x:0,y:1100,z:0},true);this.jumpCooldown=1.5;}
    }
  }
  reset(position=HOME,heading=Math.PI){
    this.body.setTranslation({x:position.x,y:1.5,z:position.z},true);
    this.body.setRotation({x:0,y:Math.sin(heading/2),z:0,w:Math.cos(heading/2)},true);
    this.body.setLinvel({x:0,y:0,z:0},true);this.body.setAngvel({x:0,y:0,z:0},true);
    this.body.resetForces(true);this.body.resetTorques(true);this.steer=0;this.speed=0;
  }
  get position(){return this.body.translation();}
  get heading(){const f=rotateVector({x:0,y:0,z:1},this.body.rotation());return Math.atan2(f.x,f.z);}
}
