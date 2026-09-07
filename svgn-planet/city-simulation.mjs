/* Fictional local game state only; no network or device access. */
import {street,tangent,add,mul,norm,cross,dot,rotate,distance,RADIUS} from './world.mjs';
import {CITY,STORY,CITY_SAVE_KEY,coordinates,cityCollision,sightBlocked} from './city-world.mjs';
import {step as footStep,blocked} from './model.mjs';
import {clamp,forward,log,say,focus,moveActor} from './city-shared.mjs';
import {selectedDevice,applyHack} from './city-network.mjs';
export function stepCity(s,c,input,dt=1/60){
 if(!Number.isFinite(dt)||dt<=0||dt>.05)throw Error('Use bounded city time steps.');
 const old=[...s.n],wasCar=!!c.car,remote=c.drone.active;footStep(s,(wasCar||remote)?{}:{...input,crouch:c.crouch},dt);
 for(const k of ['scan','loop','red','distraction','contactCD'])c[k]=Math.max(0,c[k]-dt);c.energy=Math.min(100,c.energy+dt*5);
 if(!wasCar&&!remote&&cityCollision(s.n,.38,s.lift,c.gate)){s.n=old;s.speed=0;s.north=tangent(s.north,s.n);}
 if(!wasCar&&!remote)c.walked+=distance(old,s.n);
 if(c.car){const v=c.vehicles.find(v=>v.id===c.car);const accelerating=Number(input.throttle)||0;let speed=v.speed+(v.fuel>0?accelerating*6*dt:0);if(!accelerating)speed*=Math.exp(-dt*.8);if(input.brake)speed*=Math.exp(-dt*5);
  const nitro=c.nitro&&input.boost&&c.energy>2&&speed>1;if(nitro){speed+=12*dt;c.energy-=dt*20;}
  speed=clamp(speed,-6,nitro?21:14);const steering=(Number(input.steer)||0)*1.3*clamp(Math.abs(speed)/4,0,1)*(speed<0?-1:1),f=tangent(rotate(v.f,s.n,-steering*dt),s.n),moved=moveActor(s.n,f,speed*dt);
  const collides=blocked(moved.n,.95)||cityCollision(moved.n,.95,0,c.gate)||c.vehicles.some(o=>o!==v&&distance(o.n,moved.n)<1.5);
  if(!collides){s.n=moved.n;s.north=moved.f;s.facing=moved.f;v.f=moved.f;c.driven+=Math.abs(speed)*dt;}else{if(c.contactCD===0&&Math.abs(speed)>3){v.condition=Math.max(0,v.condition-Math.abs(speed)*1.6);c.contactCD=1;log(c,s,'vehicle-hit');}speed=-speed*.12;}
  if(v.condition===0){speed=0;say(s,'Vehicle disabled. F gets out; visit the garage.');}v.speed=speed;v.n=[...s.n];v.f=tangent(f,s.n);v.fuel=Math.max(0,v.fuel-Math.abs(speed)*dt*.012);s.speed=Math.abs(speed);s.lift=0;
 }
 if(remote){const d=c.drone;d.battery=Math.max(0,d.battery-dt*1.1);d.lift=clamp(d.lift+(input.rise?1:0)*dt*4-(input.descend?1:0)*dt*4,1,14);
  if(input.direction){const dir=tangent(input.direction,d.n),next=moveActor(d.n,dir,dt*6.5);if(distance(next.n,s.n)<=48&&!cityCollision(next.n,.35,d.lift,c.gate)){d.n=next.n;d.north=tangent(d.north,next.n);d.facing=next.f;}}
  if(d.battery===0){d.active=false;say(s,'Scout battery depleted. Feed returned to your body.');log(c,s,'drone-empty');}
 }else c.drone.battery=Math.min(100,c.drone.battery+dt*6);
 for(const v of c.vehicles){v.stopped=Math.max(0,v.stopped-dt);if(v.owned)continue;const coord=coordinates(v.n);v.speed=(v.stopped>0||(c.red>0&&coord.t<124)||distance(v.n,s.n)<4)?0:3.4;if(v.speed){v.travelDirection??=1;if(coord.t>158&&v.travelDirection>0)v.travelDirection=-1;else if(coord.t<120&&v.travelDirection<0)v.travelDirection=1;v.n=street(coord.t+v.travelDirection*v.speed*dt,v.x);v.f=mul(forward(v.n),v.travelDirection);}}
 const target=selectedDevice(s,c);if(input.hack&&target){const f=focus(s,c),h=remote?f.lift:1.4,range=target.kind==='evidence'?5:7;
  const bodyStationary=remote||s.speed<1;const link=bodyStationary&&distance(f.n,target.n)<range&&!sightBlocked(f.n,h,target.n,1.4,c.gate);
  if(!link){c.progress=0;c.hacking=null;}else{if(c.hacking!==target.id){c.hacking=target.id;c.progress=0;}c.progress+=dt/target.time;if(c.progress>=1){applyHack(s,c,target);c.progress=0;c.hacking=null;c.scan=0;}}
 }else{c.progress=0;c.hacking=null;}
 let seen=false;for(const g of c.guards){g.stun=Math.max(0,g.stun-dt);g.search=Math.max(0,g.search-dt);if(g.stun>0)continue;
  const threats=[{n:s.n,h:c.crouch?1:1.7,range:c.crouch?8:14},...(c.drone.active?[{n:c.drone.n,h:c.drone.lift,range:13}]:[])];
  for(const a of threats){const to=tangent(add(a.n,mul(g.n,-1)),g.n),d=distance(g.n,a.n);if(c.active&&c.stage>=2&&d<a.range&&dot(to,g.f)>.25&&!sightBlocked(g.n,1.6,a.n,a.h,c.gate)){seen=true;g.lastSeen=[...a.n];g.search=5;}}
  let goal=g.search>0&&g.lastSeen?g.lastSeen:street(...g.route[g.target]);if(distance(g.n,goal)<.8){if(g.search<=0)g.target=1-g.target;}else{const f=tangent(add(goal,mul(g.n,-1)),g.n),m=moveActor(g.n,f,dt*(g.search>0?2.3:1));if(!cityCollision(m.n,.25,0,c.gate)){g.n=m.n;g.f=m.f;}}
 }
 const sensor=CITY.devices.find(d=>d.kind==='camera'),bodyT=coordinates(s.n);if(c.active&&c.stage>=2&&c.loop===0&&bodyT.t>173&&bodyT.t<192&&bodyT.x>21&&bodyT.x<30&&!sightBlocked(sensor.n,3,s.n,c.crouch?1:1.7,c.gate))seen=true;
 if(seen){c.trace=clamp(c.trace+dt*.19,0,1);c.unseen=0;}else{c.unseen+=dt;if(c.unseen>2)c.trace=Math.max(0,c.trace-dt*.095);}
 if(c.trace>.6&&!c.alarmEver){c.alarmEver=true;log(c,s,'alert');say(s,'CIVICGRID ALERT / Break sight lines. Cameras and patrols share your last seen position.');}
 if(c.trace>.6&&c.guards.some(g=>g.stun===0&&distance(g.n,s.n)<1.5)&&c.contactCD===0){c.integrity=Math.max(0,c.integrity-20);c.contactCD=2;log(c,s,'security-hit');}
 if(c.integrity===0){c.car=null;c.drone.active=false;s.n=street(155,13);s.north=forward(s.n);s.facing=[...s.north];s.speed=0;s.ride=false;c.integrity=100;c.trace=0;c.contactCD=4;log(c,s,'safe-retry');say(s,'Intercepted. Back at the alley entrance; evidence and mission progress preserved.');}
 for(const id of s.delivered)if(!c.paid.has(id)){c.paid.add(id);c.credits+=10;}
}
