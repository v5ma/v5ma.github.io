/* Open-city systems use the existing actor and fixed-step clock. No network
 * access, autoplay, commerce endpoints, or second renderer are involved. */
import {CITY,STORY,CITY_SAVE_KEY,coordinates,cityCollision,sightBlocked} from './city-world.mjs';
import {street,tangent,add,mul,norm,cross,dot,rotate,distance,RADIUS} from './world.mjs';
import {step as footStep,blocked} from './model.mjs';
export {CITY,STORY,CITY_SAVE_KEY};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const forward=n=>tangent(add(street(coordinates(n).t+1,coordinates(n).x),mul(n,-1)),n);
export function initialCity(saved={}){saved=saved||{};return {
 active:saved.active===true,stage:saved.stage||0,credits:saved.credits??80,nitro:!!saved.nitro,completed:!!saved.completed,
 jobs:new Set(saved.jobs||[]),paid:new Set(saved.paid||[]),alarmEver:!!saved.alarmEver,approach:saved.approach||null,
 vehicles:CITY.vehicles.map(v=>({...v,n:[...v.n],f:forward(v.n),speed:0,fuel:100,condition:100,owned:v.parked,stopped:0})),
 car:null,drone:{active:false,n:street(0),north:[0,0,-1],facing:[0,0,-1],lift:4,battery:100},
 guards:CITY.guards.map(g=>({...g,n:[...g.n],f:forward(g.n),target:1,stun:0,search:0,lastSeen:null})),
 scan:0,selected:0,progress:0,hacking:null,power:false,gate:false,loop:0,red:0,distraction:0,
 trace:0,unseen:0,integrity:100,energy:100,contactCD:0,crouch:false,walked:saved.walked||0,driven:saved.driven||0,events:[],lastHacked:null
 };}
function log(c,s,type,data={}){c.events.push({type,step:s.steps,...data});if(c.events.length>160)c.events.shift();}
function say(s,text){s.toast=text;s.toastT=5;}
export const focus=(s,c)=>c.drone.active?c.drone:s;
export function citySave(c){return {v:1,active:c.active,stage:c.stage,completed:c.completed,credits:c.credits,nitro:c.nitro,jobs:[...c.jobs],paid:[...c.paid],alarmEver:c.alarmEver,approach:c.approach,walked:c.walked,driven:c.driven};}
export function readCitySave(raw){try{if(typeof raw!=='string'||raw.length>7000)return null;const d=JSON.parse(raw);if(d?.v!==1)return null;const arr=(a,allowed)=>Array.isArray(a)?[...new Set(a.filter(x=>allowed.includes(x)))]:[];const stage=Number.isInteger(d.stage)?clamp(d.stage,0,5):0;return {active:d.active===true,stage,completed:d.completed===true&&stage===5,credits:clamp(Number(d.credits)||0,0,100000),nitro:d.nitro===true,jobs:arr(d.jobs,CITY.jobs.map(j=>j.id)),paid:arr(d.paid,['cabin','fern','mill','terrace','beacon','market','quay','harbor']),alarmEver:d.alarmEver===true,approach:['on foot','drone'].includes(d.approach)?d.approach:null,walked:clamp(Number(d.walked)||0,0,1e7),driven:clamp(Number(d.driven)||0,0,1e7)};}catch{return null;}}
export function startAssignment(s,c){c.active=true;say(s,c.stage===5?'The Waterfront File is published. Free roam and side dispatches remain open.':`${STORY.hero} / ${STORY.crew}: start at the SVGN field desk.`);log(c,s,'assignment');}
export function mission(c){return [
 {name:'Collect the field kit',detail:'E at the SVGN desk. Paper deliveries remain optional.',site:CITY.desk},
 {name:'Meet Open Signal',detail:'Meet Nia at Signal Plaza. Take a car or ride the neighborhood road to the new junction.',site:CITY.contact},
 {name:'Retrieve the Waterfront File',detail:'Scan with X; hold H to link. Power the front gate, use the rear alley, or fly a drone above the fence.',site:CITY.devices.find(d=>d.id==='evidence')},
 {name:'Record the quay report',detail:'Recall the drone. Cross the harbor bridge and press E at the field-report marker.',site:CITY.report},
 {name:'Publish without a tail',detail:'Return to the SVGN desk. Lose the CivicGrid trace before publishing.',site:CITY.desk},
 {name:'The Waterfront File — published',detail:'Keep exploring. Garage upgrades and optional dispatches are available.',site:CITY.garage}
 ][clamp(c.stage,0,5)];}
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
export function scan(s,c){c.scan=18;c.selected=0;say(s,'NETWORK VISION / H links the nearest highlighted device. Z cycles targets.');log(c,s,'scan');}
export function candidates(s,c){const f=focus(s,c);return [...CITY.devices,...c.vehicles.map(v=>({...v,kind:'vehicle',time:.8}))].filter(d=>distance(f.n,d.n)<(c.drone.active?18:14)).sort((a,b)=>distance(f.n,a.n)-distance(f.n,b.n));}
export function selectedDevice(s,c){if(c.scan<=0)return null;const nodes=candidates(s,c);return nodes.length?nodes[c.selected%nodes.length]:null;}
export function cycleDevice(s,c){const nodes=candidates(s,c);c.selected=nodes.length?(c.selected+1)%nodes.length:0;c.progress=0;}
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
export function garageAction(s,c,kind){if(c.drone.active||distance(s.n,CITY.garage.n)>6){say(s,'Visit Switchback Garage in person to buy service or upgrades.');return false;}
 const price=kind==='nitro'?60:20;if(kind==='nitro'&&c.nitro){say(s,'Nitro is already fitted.');return false;}if(c.credits<price){say(s,'Not enough credits. Complete a dispatch or deliver papers.');return false;}
 c.credits-=price;if(kind==='nitro')c.nitro=true;else c.vehicles.forEach(v=>{v.condition=100;v.fuel=100;});log(c,s,'garage',{kind,price});say(s,kind==='nitro'?'Nitro fitted. Shift boosts while driving; gadget energy recharges.':'Vehicles repaired and refueled.');return true;}
export function pulse(s,c){if(c.energy<30){say(s,'Pulse recharging.');return;}const f=focus(s,c);let hit=false;for(const g of c.guards)if(distance(f.n,g.n)<7&&!sightBlocked(f.n,1.5,g.n,1.5,c.gate)){g.stun=8;hit=true;}
 if(hit){c.energy-=30;c.trace=Math.min(1,c.trace+.32);c.alarmEver=true;log(c,s,'pulse');say(s,'Patrol electronics disrupted for eight seconds. Trace increased.');}else say(s,'No patrol in pulse range.');}
function moveActor(n,f,meters){const axis=norm(cross(n,f)),a=meters/RADIUS;return {n:norm(rotate(n,axis,a)),f:tangent(rotate(f,axis,a),norm(rotate(n,axis,a)))};}
function applyHack(s,c,d){const f=focus(s,c);if(d.requires&&!c.power){say(s,'Gate needs the power junction first — or find another route.');return false;}
 if(d.kind==='power')c.power=true;
 if(d.kind==='gate')c.gate=true;
 if(d.kind==='camera')c.loop=24;
 if(d.kind==='traffic')c.red=18;
 if(d.kind==='speaker'){c.distraction=16;c.guards[0].lastSeen=[...d.n];c.guards[0].search=16;}
 if(d.kind==='vehicle')c.vehicles.find(v=>v.id===d.id).stopped=18;
 if(d.kind==='evidence'){
  if(!c.active||c.stage!==2){say(s,'Take the Waterfront File assignment before accessing the records.');return false;}
  c.stage=3;c.approach=c.drone.active?'drone':'on foot';log(c,s,'evidence',{approach:c.approach});
 }
 log(c,s,'hack',{id:d.id,remote:c.drone.active});say(s,d.kind==='evidence'?'Evidence secured. Record the quay report, then publish.':d.name+' linked.');c.lastHacked=d.id;return true;}
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
 for(const v of c.vehicles){v.stopped=Math.max(0,v.stopped-dt);if(v.owned)continue;const coord=coordinates(v.n);v.speed=(v.stopped>0||(c.red>0&&coord.t<124)||distance(v.n,s.n)<4)?0:3.4;if(v.speed){const m=moveActor(v.n,v.f,v.speed*dt);v.n=m.n;v.f=m.f;if(coord.t>158||coord.t<120)v.f=mul(v.f,-1);}}
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
export function cityInspect(s,c){return {active:c.active,stage:c.stage,completed:c.completed,credits:c.credits,car:c.car,vehicles:c.vehicles.map(v=>({id:v.id,n:[...v.n],f:[...v.f],speed:v.speed,fuel:v.fuel,condition:v.condition})),drone:JSON.parse(JSON.stringify(c.drone)),trace:c.trace,integrity:c.integrity,crouch:c.crouch,gate:c.gate,power:c.power,loop:c.loop,scan:c.scan,device:selectedDevice(s,c)?.id||null,progress:c.progress,approach:c.approach,nitro:c.nitro,walked:c.walked,driven:c.driven,jobs:[...c.jobs],guards:c.guards.map(g=>({id:g.id,n:[...g.n],stun:g.stun,search:g.search})),objective:JSON.parse(JSON.stringify(mission(c))),events:c.events.map(e=>({...e}))};}
