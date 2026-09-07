/* Fictional local game state only; no network or device access. */
import {street,tangent,add,mul,norm,cross,dot,rotate,distance,RADIUS} from './world.mjs';
import {CITY,STORY,CITY_SAVE_KEY,coordinates,cityCollision,sightBlocked} from './city-world.mjs';
import {blocked} from './model.mjs';
import {log,say,focus} from './city-shared.mjs';
import {mission} from './city-state.mjs';
export function startAssignment(s,c){c.active=true;say(s,c.stage===5?'The Waterfront File is published. Free roam and side dispatches remain open.':`${STORY.hero} / ${STORY.crew}: start at the SVGN field desk.`);log(c,s,'assignment');}
export function nearbyVehicle(s,c){return c.vehicles.filter(v=>distance(s.n,v.n)<3.2&&Math.abs(v.speed)<1.8).sort((a,b)=>distance(s.n,a.n)-distance(s.n,b.n))[0];}
export function mount(s,c){if(c.drone.active){say(s,'Recall the drone with R before changing vehicles.');return true;}
 if(c.car){const v=c.vehicles.find(v=>v.id===c.car);if(Math.abs(v.speed)>1.1){say(s,'Brake before getting out.');return true;}const side=norm(cross(v.f,s.n));for(const offset of [1.8,-1.8,2.6,-2.6]){const n=norm(rotate(s.n,norm(cross(s.n,side)),offset/RADIUS));if(!blocked(n)&&!cityCollision(n,.4,0,c.gate)){s.n=n;s.north=tangent(s.north,n);s.facing=tangent(v.f,n);s.speed=0;s.ride=false;c.car=null;log(c,s,'exit-car',{id:v.id});say(s,'On foot. C crouches; R deploys your scout drone.');return true;}}say(s,'No clear space to get out here.');return true;}
 const v=nearbyVehicle(s,c);if(!v)return false;if(s.speed>1.4||s.lift>.1){say(s,'Stop beside the car before getting in.');return true;}
 c.car=v.id;v.owned=true;v.speed=0;s.n=[...v.n];s.facing=[...v.f];s.north=[...v.f];s.ride=false;s.lift=s.vy=s.speed=0;log(c,s,'enter-car',{id:v.id});say(s,'W/S accelerate, brake and reverse. A/D steer. Space handbrake; Shift nitro when upgraded.');return true;
}
export function droneAction(s,c){if(c.drone.active){c.drone.active=false;c.hacking=null;c.progress=0;log(c,s,'recall');say(s,'Scout feed closed. You are back at your body, not teleported.');return;}
 if(c.car||s.speed>1||s.lift>.1){say(s,'Stop and get out before deploying the drone.');return;}
 if(c.drone.battery<15){say(s,'Scout battery recharging.');return;}
 Object.assign(c.drone,{active:true,n:[...s.n],north:[...s.north],facing:[...s.facing],lift:4});log(c,s,'drone');say(s,'DRONE / WASD fly. Space climbs, C descends. X scans; H links. R recalls. Body stays vulnerable.');}
export function interactCity(s,c){if(c.drone.active){say(s,'Use H to link a device, or R to return to your body.');return true;}
 if(c.active&&c.stage!==2&&c.stage<5&&distance(s.n,mission(c).site.n)<4){
  if(s.speed>1.2||(c.stage===3&&c.car)){say(s,'Stop and step out to record or collect the story.');return true;}
  if(c.stage===4&&c.trace>.08){say(s,'Lose the surveillance trace before returning the evidence.');return true;}
  c.stage++;log(c,s,'mission-stage',{stage:c.stage});
  if(c.stage===5){c.completed=true;c.credits+=250+(c.alarmEver?0:75);log(c,s,'published',{approach:c.approach,quiet:!c.alarmEver});say(s,'PUBLISHED / +250 credits'+(c.alarmEver?'':' +75 undetected bonus')+'. The city stays open.');}
  else say(s,['','Field kit secured. Nia is waiting at Signal Plaza.','Nia: CivicGrid is selling private movement records. Take the file your way.','','Quay report recorded. Return to the newsroom without a trace.'][c.stage]||mission(c).detail);
  return true;
 }
 for(const j of CITY.jobs)if(distance(s.n,j.n)<3.5){if(c.jobs.has(j.id))say(s,'This dispatch is already complete.');else{c.jobs.add(j.id);c.credits+=j.reward;log(c,s,'side-job',{id:j.id});say(s,`${j.name}: delivered. +${j.reward} credits.`);}return true;}
 return false;}
export function garageAction(s,c,kind){if(!['nitro','service'].includes(kind))return false;if(c.drone.active||distance(s.n,CITY.garage.n)>6){say(s,'Visit Switchback Garage in person to buy service or upgrades.');return false;}
 const price=kind==='nitro'?60:20;if(kind==='nitro'&&c.nitro){say(s,'Nitro is already fitted.');return false;}if(c.credits<price){say(s,'Not enough credits. Complete a dispatch or deliver papers.');return false;}
 c.credits-=price;if(kind==='nitro')c.nitro=true;else c.vehicles.forEach(v=>{v.condition=100;v.fuel=100;});log(c,s,'garage',{kind,price});say(s,kind==='nitro'?'Nitro fitted. Shift boosts while driving; gadget energy recharges.':'Vehicles repaired and refueled.');return true;}
export function pulse(s,c){if(c.energy<30){say(s,'Pulse recharging.');return;}const f=focus(s,c);let hit=false;for(const g of c.guards)if(distance(f.n,g.n)<7&&!sightBlocked(f.n,1.5,g.n,1.5,c.gate)){g.stun=8;hit=true;}
 if(hit){c.energy-=30;c.trace=Math.min(1,c.trace+.32);c.alarmEver=true;log(c,s,'pulse');say(s,'Patrol electronics disrupted for eight seconds. Trace increased.');}else say(s,'No patrol in pulse range.');}
