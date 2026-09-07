import {RADIUS,position,surfaceRadius,waterAt,SAVE_KEY,VERSION,ringPoint,ringHeading} from './world.mjs';
import {at,unit,dot,geo,tangent,angle,mul,add,sub,cross,length,projected,rotate,move,clamp,segmentDistance} from './math.mjs';
export {SAVE_KEY,VERSION};
export function newState(saved){const n=ringPoint(0),f=projected(ringHeading(0),n);return {n,f,speed:0,alt:0,vy:0,mode:'bike',vehicle:{bike:{n:[...n],f:[...f]},car:{n:at(1.42,.081),f:tangent(at(1.42,.081))}},delivered:new Set(saved?.delivered||[]),relay:!!saved?.relay,completed:!!saved?.completed,credits:saved?.credits||0,papers:20,time:0,distance:0,steps:0,shots:[],cooldown:0,events:[],toast:'A whole little world. Find your route.',toastT:5,collisions:0};}
function say(s,text){s.toast=text;s.toastT=3.6;}
function event(s,type,extra={}){s.events.push({type,tick:s.steps,...extra});if(s.events.length>80)s.events.shift();}
export function phase(s){return s.completed?3:s.delivered.size<3?0:!s.relay?1:2;}
export function target(s,w){const p=phase(s);return p===0?w.posts.find(p=>p.route&&!s.delivered.has(p.id)):p===1?w.relay:w.depot;}
export function collision(n,w,r=.4){return w.obstacles.find(o=>geo(n,o.n,RADIUS)<o.r+r);}
export function enterExit(s,w){
 if(Math.abs(s.speed)>1.2||s.alt>.1){say(s,'Stop on the ground before changing rides.');return false;}
 if(s.mode==='foot'){
  const v=Object.entries(s.vehicle).filter(([k,v])=>geo(s.n,v.n,RADIUS)<3.4).sort((a,b)=>geo(s.n,a[1].n,RADIUS)-geo(s.n,b[1].n,RADIUS))[0];
  if(!v){say(s,'Walk to a parked bicycle or the press car.');return false;}
  s.mode=v[0];s.n=[...v[1].n];s.f=[...v[1].f];say(s,s.mode==='car'?'Press car ready. The roads curve all the way around.':'Back on the bicycle.');event(s,'enter',{mode:s.mode});return true;
 }
 const right=cross(s.f,s.n);let safe=null;
 for(const a of[1,-1,1.8,-1.8]){const n=move(s.n,right,a,surfaceRadius(s.n)).n;if(!collision(n,w)&&!waterAt(n)){safe=n;break;}}
 if(!safe){say(s,'Not enough room to dismount here.');return false;}
 s.mode='foot';s.n=safe;s.f=projected(s.f,safe);s.speed=0;s.vy=0;s.alt=0;say(s,'On foot. F enters a nearby ride.');event(s,'exit');return true;
}
export function throwPaper(s,w){
 if(s.cooldown>0||s.papers<1)return false;
 const p=w.posts.filter(p=>!s.delivered.has(p.id)&&geo(s.n,p.n,RADIUS)<8).sort((a,b)=>geo(s.n,a.n,RADIUS)-geo(s.n,b.n,RADIUS))[0];
 if(!p){say(s,'Move within 8 m of an undelivered mailbox.');return false;}
 const a=position(s.n,1.3+s.alt),b=position(p.n,1.3),t=clamp(length(sub(a,b))/13,.35,.62),v=add(mul(sub(b,a),1/t),mul(s.n,4.5*t));
 s.shots.push({p:a,v,age:0});s.papers--;s.cooldown=.45;event(s,'throw');return true;
}
export function interact(s,w){
 if(geo(s.n,w.relay.n,RADIUS)<4.8){
  if(Math.abs(s.speed)>2){say(s,'Slow down to link the local relay.');return false;}
  if(!s.relay){s.relay=true;s.credits+=40;event(s,'relay');say(s,'City link restored. Take your story back to the world desk.');}else say(s,'The grove relay is already connected.');return true;
 }
 if(geo(s.n,w.depot.n,RADIUS)<4.5){s.papers=20;if(phase(s)===2){s.completed=true;s.credits+=100;event(s,'complete');say(s,'First world edition published! Keep exploring the other side.');}else say(s,'Paper satchel refilled. Your world is still waiting.');return true;}
 return throwPaper(s,w);
}
export function recover(s){const keep=saveData(s);Object.assign(s,newState(keep));say(s,'Returned to the world desk. Deliveries and progress kept.');event(s,'recovery');}
export function step(s,w,input={},dt=1/60){
 if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.05);s.time+=dt;s.steps++;s.cooldown=Math.max(0,s.cooldown-dt);s.toastT=Math.max(0,s.toastT-dt);
 const throttle=clamp(Number(input.throttle)||0,-1,1),steer=clamp(Number(input.steer)||0,-1,1),acc=s.mode==='car'?6:s.mode==='bike'?4:12,top=s.mode==='car'?13:s.mode==='bike'?(input.boost?10:7):(input.boost?6:3.6);
 if(s.mode==='foot')s.speed+=(throttle*top-s.speed)*Math.min(1,dt*9);
 else{s.speed+=throttle*acc*dt;if(!throttle)s.speed*=Math.exp(-dt*(s.mode==='bike'?.46:.23));if(input.brake)s.speed*=Math.exp(-dt*4);s.speed=clamp(s.speed,-top*.4,top);}
 if(waterAt(s.n))s.speed*=Math.exp(-dt*1.8);
 const steering=s.mode==='foot'?2.3:(s.mode==='bike'?1.6:1.12)*clamp(Math.abs(s.speed)/2.7,.24,1)*(s.speed<-.1?-1:1);
 s.f=projected(rotate(s.f,s.n,-steer*steering*dt),s.n);
 if(input.jump&&s.alt===0&&s.mode!=='car'){s.vy=5.1;event(s,'jump');}
 if(s.alt>0||s.vy>0){s.vy-=17*dt;s.alt+=s.vy*dt;if(s.alt<0){s.alt=0;s.vy=0;}}
 const radius=surfaceRadius(s.n)+s.alt,travel=s.speed*dt,parts=Math.max(1,Math.ceil(Math.abs(travel)/.25));
 for(let i=0;i<parts;i++){
  const next=move(s.n,s.f,travel/parts,radius);
  if(collision(next.n,w,s.mode==='car'?.88:.38)){s.speed*=.15;s.collisions++;break;}
  s.n=next.n;s.f=next.f;s.distance+=Math.abs(travel/parts);
 }
 if(s.mode!=='foot')s.vehicle[s.mode]={n:[...s.n],f:[...s.f]};
 for(let i=s.shots.length-1;i>=0;i--){const p=s.shots[i],old=p.p;p.v=sub(p.v,mul(unit(p.p),9*dt));p.p=add(p.p,mul(p.v,dt));p.age+=dt;
  const hit=w.posts.find(box=>!s.delivered.has(box.id)&&segmentDistance(position(box.n,1.3),old,p.p)<.90);
  if(hit){s.delivered.add(hit.id);s.credits+=15;event(s,'delivery',{id:hit.id});say(s,`Delivered to ${hit.name}.`);s.shots.splice(i,1);}
  else if(p.age>2.4||length(p.p)<surfaceRadius(unit(p.p)))s.shots.splice(i,1);
 }
}
export function saveData(s){return {version:1,delivered:[...s.delivered],relay:s.relay,completed:s.completed,credits:s.credits};}
export function readSave(text,w){
 try{if(typeof text!=='string'||text.length>4096)return null;const d=JSON.parse(text);if(d?.version!==1||!Array.isArray(d.delivered)||d.delivered.length>30)return null;
  const delivered=[...new Set(d.delivered.filter(x=>w.posts.some(p=>p.id===x)))],relay=d.relay===true,completed=d.completed===true&&relay&&delivered.length>=3;
  return {delivered,relay,completed,credits:Math.floor(clamp(Number(d.credits)||0,0,10000))};
 }catch{return null;}
}
export function inspect(s,w){return {version:VERSION,planetRadius:RADIUS,n:[...s.n],heading:[...s.f],position:position(s.n,s.alt),radialUp:[...s.n],altitude:s.alt,mode:s.mode,speed:s.speed,distance:s.distance,steps:s.steps,mission:phase(s),delivered:[...s.delivered],relay:s.relay,completed:s.completed,credits:s.credits,papers:s.papers,events:s.events.map(e=>({...e})),vehicles:JSON.parse(JSON.stringify(s.vehicle)),target:{...target(s,w),n:[...target(s,w).n]}};}
