import {RADIUS,WORLD,CITY,street,at,add,mul,norm,cross,dot,clamp,tangent,rotate,distance,height} from './world.mjs';
import {readHomecoming} from './homecoming.mjs';
import {driveSpeed} from './coastal-motion.mjs';
import {readJobs,createJobs,writeJobs,tickJobs} from './activities.mjs';
export * from './world.mjs';
export const VERSION='0.8.0',SAVE_KEY='svgn.paper-delivery-3d.v1',LEGACY_SAVE_KEY='svgn.little-planet.v1';
export function readSave(raw){try{
 if(!raw||raw.length>64000)return null;const s=JSON.parse(raw);if(s?.v!==1)return null;
 const known=(a,list)=>Array.isArray(a)?[...new Set(a.filter(id=>list.some(h=>h.id===id)))]:[];
 const delivered=known(s.delivered,WORLD.homes);
 return {delivered,bonusDelivered:known(s.bonusDelivered,WORLD.bonusStops),stamps:known(s.stamps,WORLD.stars),stunts:known(s.stunts,WORLD.stuntGates),complete:s.complete===true&&delivered.length===WORLD.homes.length,ride:s.ride===true,position:s.radius===RADIUS&&Array.isArray(s.position)&&s.position.length===3&&s.position.every(Number.isFinite)&&Math.abs(Math.hypot(...s.position)-1)<.01?norm(s.position):null,north:Array.isArray(s.north)&&s.north.length===3&&s.north.every(Number.isFinite)?norm(s.north):null,vehicle:s.vehicle==='bicycle'?'bicycle':'unicycle',jobs:readJobs(s.jobs),homecoming:readHomecoming(s.homecoming)};
 }catch{return null;}}
export function initial(saved=null){
 const n=saved?.position&&!blocked(saved.position)?saved.position:street(0,-1.5),reference=saved?.north||[0,0,-1],north=tangent(Math.abs(dot(reference,n))>.95?(Math.abs(n[1])<.9?[0,1,0]:[1,0,0]):reference,n);
 return {n,north,facing:[...north],speed:0,lift:0,vy:0,energy:1,ride:saved?.ride??false,vehicle:saved?.vehicle||'unicycle',boosting:false,delivered:new Set(saved?.delivered||[]),bonusDelivered:new Set(saved?.bonusDelivered||[]),stamps:new Set(saved?.stamps||[]),stunts:new Set(saved?.stunts||[]),complete:!!saved?.complete,time:0,steps:0,distance:0,toast:'',toastT:0,lastSite:null,events:[],paper:null,paperCooldown:0,collisionCooldown:0,jobs:createJobs(saved?.jobs),homecoming:readHomecoming(saved?.homecoming)};
}
export const saveData=s=>({v:1,delivered:[...s.delivered],bonusDelivered:[...s.bonusDelivered],stamps:[...s.stamps],stunts:[...s.stunts],complete:s.complete,ride:s.ride,radius:RADIUS,position:[...s.n],north:[...s.north],vehicle:s.vehicle||'unicycle',jobs:writeJobs(s),homecoming:readHomecoming(s.homecoming)});
export function event(s,type,data={}){s.events.push({type,step:s.steps,...data});if(s.events.length>180)s.events.shift();}
// Local broad phase: do not scan every tree and evaluate acos hundreds of times
// in each simulation tick. House footprints match the enlarged rendered bodies.
const legacyHash=new Map(),cell=n=>n.map(v=>Math.floor(v*RADIUS/24));
function register(c){const k=cell(c.n).join(',');if(!legacyHash.has(k))legacyHash.set(k,[]);legacyHash.get(k).push(c);}
for(const b of WORLD.buildings)if(b.type!=='garden'){const front=tangent(add(b.mail,mul(b.n,-1)),b.n);register({n:b.n,front,right:norm(cross(b.n,front)),w:3.7,d:2.65});}
for(const b of WORLD.rocks)register({n:b.n,r:b.size*.37});
for(const b of WORLD.trees)register({n:b.n,r:.37});
export function blocked(n){
 if(CITY.blocked(n))return true;const a=cell(n);
 for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
  const entries=legacyHash.get([a[0]+x,a[1]+y,a[2]+z].join(','));if(!entries)continue;
  for(const b of entries){const d=mul(add(n,mul(b.n,-1)),RADIUS);if(b.r?dot(d,d)<b.r*b.r:Math.abs(dot(d,b.front))<b.d&&Math.abs(dot(d,b.right))<b.w)return true;}
 }
 return false;
}
export function nearest(s){let best=null;for(const site of [...WORLD.sites,...WORLD.bonusStops]){const d=distance(s.n,site.mail);if(d<2.7&&(!best||d<best.distance))best={...site,distance:d};}return best;}
function deliver(s,p){
 if(!p)return false;
 if(WORLD.homes.some(h=>h.id===p.id)){if(s.delivered.has(p.id))return false;s.delivered.add(p.id);s.toast='DELIVERED | '+p.name+' | '+s.delivered.size+'/'+WORLD.homes.length;s.toastT=4;event(s,'delivery',{id:p.id});return true;}
 if(WORLD.bonusStops.some(h=>h.id===p.id)){if(s.bonusDelivered.has(p.id))return false;s.bonusDelivered.add(p.id);s.toast='BONUS STOP | '+p.name+' | '+s.bonusDelivered.size+'/'+WORLD.bonusStops.length;s.toastT=4;event(s,'bonus-delivery',{id:p.id});return true;}return false;
}
export function interact(s){const p=nearest(s);if(!p){s.toast='Move closer to a mailbox, or open City jobs with J / D-pad down.';s.toastT=3;return false;}s.lastSite=p.id;s.toastT=5;s.toast=p.message;if(deliver(s,p))return true;if(p.id==='post'&&s.delivered.size===WORLD.homes.length&&!s.complete){s.complete=true;s.toast='ROUTE COMPLETE | The city, contracts, bonus stops and sprint gates remain open.';event(s,'complete');return true;}event(s,'talk',{id:p.id});return false;}
export function throwPaper(s){if(s.paper||s.paperCooldown>0)return false;const candidates=[...WORLD.homes.filter(h=>!s.delivered.has(h.id)),...WORLD.bonusStops.filter(h=>!s.bonusDelivered.has(h.id))],p=candidates.filter(h=>distance(s.n,h.mail)<10).sort((a,b)=>distance(s.n,a.mail)-distance(s.n,b.mail))[0];if(!p){s.toast='No undelivered mailbox in range. Open City jobs for more adventures.';s.toastT=2;return false;}s.paper={from:[...s.n],to:[...p.mail],id:p.id,t:0};s.paperCooldown=.72;event(s,'throw',{id:p.id});return true;}
export function switchRide(s){s.ride=!s.ride;if(!s.ride)s.speed=Math.min(s.speed,4.1);s.toast=s.ride?'RT / Shift accelerates. Coast freely. LT / B / Ctrl brakes.':'On foot | Meet the neighbors, collect litter or repair city signals.';s.toastT=3;event(s,'ride',{ride:s.ride});}
export function target(s){if(s.delivered.size<WORLD.homes.length)return WORLD.homes.filter(h=>!s.delivered.has(h.id)).reduce((a,b)=>!a||distance(s.n,b.mail)<distance(s.n,a.mail)?b:a,null);if(!s.complete)return WORLD.sites[0];const bonus=WORLD.bonusStops.filter(h=>!s.bonusDelivered.has(h.id));return bonus.length?bonus.reduce((a,b)=>!a||distance(s.n,b.mail)<distance(s.n,a.mail)?b:a,null):WORLD.sites[0];}
export function step(s,input={},dt=1/60){
 if(!Number.isFinite(dt)||dt<=0||dt>.05)throw Error('Use bounded fixed simulation steps.');
 const previous=[...s.n];s.steps++;s.time+=dt;s.toastT=Math.max(0,s.toastT-dt);s.collisionCooldown=Math.max(0,s.collisionCooldown-dt);s.paperCooldown=Math.max(0,s.paperCooldown-dt);
 if(s.paper){s.paper.t+=dt/.55;if(s.paper.t>=1){deliver(s,[...WORLD.homes,...WORLD.bonusStops].find(h=>h.id===s.paper.id));s.paper=null;}}
 let dir=input.direction;if(!dir||dir.length!==3||!dir.every(Number.isFinite)||Math.hypot(...dir)<.01)dir=null;
 dir=driveSpeed(s,input,dt,dir);
 if(input.jump&&s.lift<=.001){s.vy=s.ride?3.7:3.8;event(s,'jump');}s.vy-=10*dt;s.lift=Math.max(0,s.lift+s.vy*dt);if(s.lift===0)s.vy=0;
 if(dir&&s.speed>.001){
  const segments=Math.max(1,Math.ceil(s.speed*dt/.45)),angle=s.speed*dt/RADIUS/segments;
  for(let i=0;i<segments;i++){
   dir=tangent(dir,s.n);const axis=norm(cross(s.n,dir)),next=norm(rotate(s.n,axis,angle));
   if(blocked(next)){s.speed=0;if(s.collisionCooldown<=0){event(s,'collision');s.collisionCooldown=.6;}break;}
   s.n=next;s.north=tangent(rotate(s.north,axis,angle),s.n);s.facing=tangent(rotate(dir,axis,angle),s.n);dir=s.facing;s.distance+=angle*RADIUS;
  }
 }
 for(const p of WORLD.stars)if(!s.stamps.has(p.id)&&distance(s.n,p.n)<1.1){s.stamps.add(p.id);event(s,'stamp',{id:p.id});s.toast='POSTMARK FOUND | '+s.stamps.size+'/'+WORLD.stars.length;s.toastT=2;}
 for(const gate of WORLD.stuntGates)if(!s.stunts.has(gate.id)&&s.ride&&s.speed>=gate.minSpeed&&distance(s.n,gate.n)<1.45){s.stunts.add(gate.id);event(s,'stunt',{id:gate.id,speed:s.speed});s.toast='SPRINT GATE | '+gate.name+' | '+Math.round(s.speed*3.6)+' km/h';s.toastT=3;}
 tickJobs(s,previous,dt);
}
export function travelTo(s,id){
 const stop=CITY.districts.find(d=>d.id===id);if(!stop&&id!=='post')return false;
 const n=stop?[...stop.landing]:street(0,-1.5);if(blocked(n))return false;
 s.n=n;s.north=stop?tangent(add(stop.mail,mul(n,-1)),n):tangent([0,0,-1],n);s.facing=[...s.north];s.speed=0;s.lift=0;s.vy=0;s.energy=1;s.boosting=false;s.paper=null;
 s.toast='Arrived: '+(stop?.name||'Original delivery depot');s.toastT=4;event(s,'transit',{id});return true;
}
