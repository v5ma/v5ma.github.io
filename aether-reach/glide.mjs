/* Optional foldwing motion. No position assignments, head rotation, auto-aim,
 * target attraction or upward thrust. Arrival collision remains in model.mjs. */
export const GLIDE=Object.freeze({capacity:100,drain:12.5,recharge:24,gravity:4,sink:3,cruise:11,brake:6,drag:.35,turn:1.8});
export function glideVelocity(p,input,dt){
 const f={x:Math.sin(p.yaw),z:-Math.cos(p.yaw)},right={x:Math.cos(p.yaw),z:Math.sin(p.yaw)};
 const ix=Number.isFinite(input.moveX)?Math.max(-1,Math.min(1,input.moveX)):(input.right?1:0)-(input.left?1:0),iz=Number.isFinite(input.moveZ)?Math.max(-1,Math.min(1,input.moveZ)):(input.forward?1:0)-(input.back?1:0);
 const speed=Math.hypot(p.vx,p.vz),magnitude=Math.min(1,Math.hypot(ix,iz));
 // Steering needs a deliberate stick/key; looking through the sights alone
 // does not turn the glide. Coasting keeps the current flight direction.
 let dx=speed>.01?p.vx/speed:f.x,dz=speed>.01?p.vz/speed:f.z;
 if(magnitude>.05){const x=f.x*Math.max(.2,iz)+right.x*ix,z=f.z*Math.max(.2,iz)+right.z*ix,l=Math.hypot(x,z);let angle=Math.atan2(dx,-dz),target=Math.atan2(x/l,-z/l);let delta=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));delta=Math.max(-GLIDE.turn*dt*magnitude,Math.min(GLIDE.turn*dt*magnitude,delta));angle+=delta;dx=Math.sin(angle);dz=-Math.cos(angle);}
 const targetSpeed=(input.back||iz<-.25)?GLIDE.brake:GLIDE.cruise;
 // Retain high launch speed and lose it gradually. The canopy can acquire a
 // modest forward speed from descent, but never make the avatar climb.
 const next=speed+(targetSpeed-speed)*(1-Math.exp(-GLIDE.drag*dt));p.vx=dx*next;p.vz=dz*next;
 // Opening from a fast fall slows descent over time, not in an instant.
 p.vy=p.vy< -GLIDE.sink?p.vy+(-GLIDE.sink-p.vy)*(1-Math.exp(-3*dt)):Math.max(-GLIDE.sink,p.vy-GLIDE.gravity*dt);
 p.glideCharge=Math.max(0,p.glideCharge-GLIDE.drain*dt);
}
