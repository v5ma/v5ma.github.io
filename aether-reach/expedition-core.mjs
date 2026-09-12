import {ROOFS,ROOF_THINGS,BEACON_TARGETS} from './rooftop-world.mjs';
/* Original Skyward Dispatch campaign. No UI or renderer can award completion;
 * guarded world interactions, actual transit and simulation events do that. */
import {EXP_DISTRICTS,EXP_ENEMIES,EXP_FLAGS,EXP_RAILS,TASKS,THINGS,POSTS,TRANSIT,ESCORT_PATH,transitPosition} from './expedition-world.mjs';
const has=(s,id)=>s.expedition.flags.includes(id);
const unique=(a,allowed)=>[...new Set(Array.isArray(a)?a.filter(v=>allowed.has(v)):[])];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function cleanExpedition(value){const v=value&&typeof value==='object'?value:{};return {
 flags:unique(v.flags,EXP_FLAGS),visited:unique(v.visited,new Set(EXP_DISTRICTS.map(d=>d.id))),
 beaconDials:[0,1,2].map(i=>Number.isInteger(v.beaconDials?.[i])?clamp(v.beaconDials[i],0,3):0),
 routes:unique(v.routes,new Set(['rail','ferry','lift'])),
 valves:[0,1,2].map(i=>Number.isInteger(v.valves?.[i])?clamp(v.valves[i],0,3):0),
 tracked:TASKS.some(t=>t.id===v.tracked)?v.tracked:'dispatch'
};}
export const saveExpedition=s=>cleanExpedition(s.expedition);
export function expeditionSnapshot(s){const e=s.expedition;return {...saveExpedition(s),defense:{...e.defense},escort:{...e.escort},transits:e.transits.map(t=>({...t,position:transitPosition(TRANSIT.find(d=>d.id===t.id),t.t)})),completed:TASKS.filter(t=>has(s,t.flag)).map(t=>t.id)};}
function thing(s,id){if(id==='surveyor')return {id,...s.expedition.escort,name:'Surveyor Lio',kind:'person'};return THINGS.find(t=>t.id===id);}
export function expeditionGoal(s,id=s.expedition.tracked){
 const e=s.expedition,find=key=>thing(s,key),first=ids=>find(ids.find(k=>!has(s,k))||ids.at(-1));
 if(id==='roof-surveys')return first(ROOFS.map(r=>'survey-'+r.id));
 if(id==='roof-courier')return ['roof-parcel-gannet','roof-parcel-academy','roof-parcel-dawn'].every(k=>has(s,k))?find('roof-desk'):first(['roof-parcel-gannet','roof-parcel-academy','roof-parcel-dawn']);
 if(id==='roof-beacons'){const i=e.beaconDials.findIndex((n,i)=>n!==BEACON_TARGETS[i]);return find(i<0?'roof-desk':'roof-beacon-'+i);}
 if(id==='dispatch')return find(has(s,'dispatch-started')?'market-board':'dispatch-board');
 if(id==='ferry')return find(has(s,'regulator')?'ferry-engine':'regulator');
 if(id==='charter')return !['charter-market','charter-academy','charter-dawn'].every(k=>has(s,k))?first(['charter-market','charter-academy','charter-dawn']):find(has(s,'archive-open')?'charter-original':'archive-lock');
 if(id==='weather')return find('weather-console');
 if(id==='rescue')return has(s,'surveyor-found')?{x:130,y:12,z:-58,name:'Dawn evacuation pad'}:find('surveyor');
 if(id==='defense')return find('beacon-control');
 if(id==='summits')return first(['survey-archive','survey-dawn','survey-solstice']);
 if(id==='districts')return POSTS.find(p=>!e.visited.includes(p.id))||POSTS[0];
 if(id==='routes'){const mode=['ferry','lift','rail'].find(r=>!e.routes.includes(r));if(mode==='rail')return {x:-81,y:7,z:-7,name:'Bellwether Local station'};const r=TRANSIT.find(t=>t.kind===mode&&!t.requires);return r?{...r.a,name:r.name}:find('market-board');}
 return find('dispatch-board');
}
export function createExpedition(api){
 const {groundAt,occupied,clearLine,emit,hurt}=api;
 function say(s,text){emit(s,'expedition-message',{text});}
 function mark(s,id){if(has(s,id))return false;s.expedition.flags.push(id);emit(s,'save');return true;}
 function reward(s,id){const t=TASKS.find(q=>q.id===id);if(!t||!mark(s,t.flag))return false;s.kit.credits=Math.min(99999,s.kit.credits+t.reward);emit(s,'expedition-complete',{id,name:t.name,credits:t.reward});if(s.expedition.tracked===id){s.expedition.tracked=TASKS.find(q=>!has(s,q.flag))?.id||'open-sky';}emit(s,'save');return true;}
 function init(s,saved){const e=cleanExpedition(saved);s.expedition={...e,transits:TRANSIT.map(r=>({id:r.id,t:0,target:0,moving:false,dwell:0})),defense:{active:false,wave:-1,time:0,gap:0},escort:{x:149,y:12,z:-85,yaw:0,index:0,active:false,walking:false},railTrip:null};s.p.ride=null;
  for(const b of s.drones.filter(b=>b.humanoid)){b.patrolIndex=0;b.awareness=0;b.heading=0;b.walking=false;if(Number.isInteger(b.wave))b.hp=0;}
  if(has(s,'surveyor-safe'))Object.assign(s.expedition.escort,{x:130,z:-58,index:4});
 }
 function nearby(s){const p=s.p,e=s.expedition;if(p.ride)return {type:'exp-ride',label:'Passenger transit in motion · SPACE to jump clear'};if(p.rail||!p.grounded)return null;
  const reachable=t=>Math.abs(t.y-p.y)<1.35&&dist(p,t)<2.6&&clearLine({x:p.x,y:p.y+1.5,z:p.z},{x:t.x,y:t.y+1.3,z:t.z},s);
  const candidates=[];
  for(const base of THINGS){const t=thing(s,base.id);if((base.kind==='pickup'&&has(s,base.id))||(base.id==='charter-original'&&has(s,'charter'))||(base.kind==='telescope'&&has(s,base.id)))continue;if(!reachable(t))continue;
   let label=t.name;if(t.id.startsWith('roof-beacon-'))label+=' / ring '+e.beaconDials[Number(t.id.at(-1))];if(t.id.startsWith('valve-'))label+=' ['+e.valves[Number(t.id.at(-1))]+'] · turn';
   if(t.id==='surveyor'&&has(s,'surveyor-safe'))label='Lio: Thank you. The route is open.';
   candidates.push({type:'exp-thing',id:t.id,distance:dist(p,t),label:'E · '+label});
  }
  for(const r of TRANSIT)for(const end of [0,1]){const pos=end?r.b:r.a;if(!reachable(pos))continue;const car=e.transits.find(t=>t.id===r.id),ready=!car.moving&&Math.abs(car.t-end)<.001;
   candidates.push({type:'exp-transit',id:r.id,end,distance:dist(p,pos),label:r.requires&&!has(s,r.requires)?'E · '+r.name+' needs a regulator':car.moving?'E · '+r.name+' approaching':ready?'E · Board '+r.name:'E · Call '+r.name});}
  for(const post of POSTS)if(reachable(post))candidates.push({type:'exp-rest',id:post.id,distance:dist(p,post)+.6,label:'E · Rest and save at '+post.name});
  return candidates.sort((a,b)=>a.distance-b.distance)[0]||null;
 }
 function routeStamp(s,kind){const e=s.expedition;if(!e.routes.includes(kind)){e.routes.push(kind);say(s,'Passport stamped: '+kind+' journey complete.');emit(s,'save');}if(e.routes.length===3)reward(s,'routes');}
 function transit(s,n){const r=TRANSIT.find(t=>t.id===n.id),car=s.expedition.transits.find(t=>t.id===n.id);if(!r||!car)return false;
  if(r.requires&&!has(s,r.requires)){say(s,'Find the induction regulator in the Clockmaker\'s Arcade, then repair the engine at Gannet Docks.');return true;}
  if(car.moving){say(s,'The cabin is on its way. Wait at the illuminated landing.');return true;}
  if(Math.abs(car.t-n.end)>.001){car.target=n.end;car.moving=true;say(s,r.name+' called to this landing.');return true;}
  car.target=1-n.end;car.moving=true;car.dwell=.8;
  // A short physical boarding interpolation, never a cross-map teleport.
  s.p.ride={id:r.id,board:{x:s.p.x,y:s.p.y,z:s.p.z},age:0,origin:n.end};s.p.gliding=false;s.p.grounded=false;s.p.vx=s.p.vy=s.p.vz=0;emit(s,'expedition-board',{id:r.id});return true;
 }
 function startDefense(s){const e=s.expedition;if(has(s,'beacon-secure')){say(s,'The beacon is secure. Its light now marks an open route.');return;}
  if(e.defense.active){say(s,'Keep the beacon lit. Defeat each boarding wave before the next arrives.');return;}
  e.defense={active:true,wave:-1,time:0,gap:1.6};say(s,'Beacon ignition started. Three Registry boarding parties are approaching.');
 }
 function handle(s,n){if(!n?.type?.startsWith('exp-'))return false;const fresh=nearby(s);if(!fresh||fresh.type!==n.type||fresh.id!==n.id||fresh.end!==n.end)return false;
  if(n.type==='exp-ride'){say(s,'The cabin follows its route. Space jumps clear; stay aboard to earn a passport stamp.');return true;}
  if(n.type==='exp-transit')return transit(s,n);
  if(n.type==='exp-rest'){s.checkpoint=n.id;s.p.health=100;s.p.shield=60+s.kit.shield*20;s.p.energy=100;s.p.glideCharge=100;s.p.invuln=3;s.damagedAt=s.time;say(s,'Checkpoint saved. Field suit, shield and Foldwing restored.');emit(s,'save');return true;}
  const id=n.id;
  if(id.startsWith('roof-parcel-')){if(mark(s,id))say(s,'Undelivered parcel secured. Bring all three to the Clockmaker\'s Arcade courier desk.');}
  else if(id.startsWith('roof-beacon-')){const i=Number(id.at(-1));s.expedition.beaconDials[i]=(s.expedition.beaconDials[i]+1)%4;say(s,'Beacon ring '+s.expedition.beaconDials[i]+' / target '+BEACON_TARGETS[i]+'. Return to the courier desk after aligning all three.');emit(s,'save');}
  else if(id==='roof-desk'){const parcels=['roof-parcel-gannet','roof-parcel-academy','roof-parcel-dawn'].every(k=>has(s,k));if(parcels)reward(s,'roof-courier');if(s.expedition.beaconDials.every((n,i)=>n===BEACON_TARGETS[i]))reward(s,'roof-beacons');say(s,parcels?'The recovered letters are back in public hands. The beacon circuit needs Theatre 2, Stormglass 1, Solstice 3.':'Find the parcels on Gannet, Aurelian and Dawn rooftops. The beacon rings need Theatre 2, Stormglass 1, Solstice 3.');}
  else if(id==='dispatch-board'){
   if(['charter','weather-open','surveyor-safe','beacon-secure'].every(k=>has(s,k))){reward(s,'open-sky');say(s,'IONA: Your dispatch is on every public frequency. The Archive, weather station, rescue pad and beacon are connected again. Keep exploring; the sky is open.');}
   else if(mark(s,'dispatch-started'))say(s,'IONA: The Registry has closed the northern routes. Take this dispatch to Bellwether Market, west across the long stair. Your journal lists the people and stations that need help.');
   else say(s,'IONA: Recover the charter, restore Stormglass, bring Lio home and secure Solstice. The west stair leads to Bellwether; the east route leads to Dawn.');
   emit(s,'expedition-open');
  }else if(id==='market-board'){
   if(has(s,'dispatch-started')){reward(s,'dispatch');say(s,'The notice office accepts Iona\'s dispatch. A mechanic left a regulator in the Clockmaker\'s Arcade. The ferry at Gannet can carry you to the Archive.');}
   else say(s,'The north road needs a courier. Pick up Iona\'s dispatch at the Arrival Quay noticeboard.');
   emit(s,'expedition-open');
  }else if(id==='regulator'){if(mark(s,id))say(s,'Induction regulator recovered. Install it at the Gannet ferry engine.');}
  else if(id==='ferry-engine'){if(has(s,'regulator')){reward(s,'ferry');say(s,'Ferry power restored. Board at the southwest Gannet landing; the crossing leads to the Archive.');}else say(s,'The ferry needs the regulator from the Clockmaker\'s Arcade in Bellwether Market.');}
  else if(id.startsWith('charter-')&&id!=='charter-original'){if(mark(s,id))say(s,'Charter leaf recovered. '+['charter-market','charter-academy','charter-dawn'].filter(k=>has(s,k)).length+' of 3 leaves found.');}
  else if(id==='archive-lock'){if(['charter-market','charter-academy','charter-dawn'].every(k=>has(s,k))){mark(s,'archive-open');say(s,'Archive seals matched. The brass doors are open; the original charter is inside.');}else say(s,'The seal reader needs all three charter leaves: Bellwether, Aurelian and Dawn.');}
  else if(id==='charter-original'){if(has(s,'archive-open'))reward(s,'charter');}
  else if(id.startsWith('valve-')){const k=Number(id.at(-1));s.expedition.valves[k]=(s.expedition.valves[k]+1)%4;say(s,'Valve '+(k+1)+' set to '+s.expedition.valves[k]+'. Required west-to-east settings: 1, 3, 2.');emit(s,'save');}
  else if(id==='weather-console'){if(s.expedition.valves.every((v,i)=>v===[1,3,2][i])){reward(s,'weather');say(s,'Pressure balanced. The Weather Engine is open and running; a reserve chest is inside.');}else say(s,'Pressure mismatch. Turn the three nearby valve wheels to 1, 3, 2 from west to east, then test again.');}
  else if(id==='surveyor'){if(has(s,'surveyor-safe'))say(s,'LIO: We can see the beacon from here. Nobody has to cross alone now.');else{mark(s,'surveyor-found');s.expedition.escort.active=true;say(s,'LIO: I can walk, but not through Registry fire. Stay close and help me reach the marked evacuation pad.');}}
  else if(id==='beacon-control')startDefense(s);
  else if(id.startsWith('survey-')){if(mark(s,id))say(s,'Upper-gallery survey recorded.');if(['survey-archive','survey-dawn','survey-solstice'].every(k=>has(s,k)))reward(s,'summits');if(ROOFS.every(r=>has(s,'survey-'+r.id)))reward(s,'roof-surveys');}
  return true;
 }
 function abort(s,reason){const e=s.expedition;s.p.ride=null;e.railTrip=null;e.escort.active=false;e.escort.walking=false;if(e.defense.active){e.defense.active=false;for(const b of s.drones)if(Number.isInteger(b.wave))b.hp=0;say(s,'Beacon attempt '+reason+'. Return to the Solstice console to retry.');}}
 function killed(s,b){if(!Number.isInteger(b.wave))return false;b.hp=0;s.stats.defeated++;emit(s,'defeat',{id:b.id});return true;}
 function jumpOff(s){const p=s.p;if(!p.ride)return false;p.ride=null;p.grounded=false;p.vy=7;p.y+=.04;emit(s,'release');return true;}
 function moveTransits(s,dt){const e=s.expedition,p=s.p;for(const r of TRANSIT){const c=e.transits.find(t=>t.id===r.id),old=transitPosition(r,c.t);if(c.dwell>0)c.dwell=Math.max(0,c.dwell-dt);else if(c.moving){const dir=c.target>c.t?1:-1;c.t=clamp(c.t+dir*dt/r.seconds,0,1);if(Math.abs(c.t-c.target)<1e-8){c.t=c.target;c.moving=false;}}
   if(p.ride?.id!==r.id)continue;const q=transitPosition(r,c.t);p.ride.age+=dt;const f=Math.min(1,p.ride.age/.7),a=p.ride.board;p.x=a.x+(q.x-a.x)*f;p.y=a.y+(q.y-a.y)*f;p.z=a.z+(q.z-a.z)*f;p.vx=(q.x-old.x)/dt;p.vy=(q.y-old.y)/dt;p.vz=(q.z-old.z)/dt;p.grounded=false;
   if(!c.moving&&Math.abs(c.t-p.ride.origin)>.9){p.ride=null;p.x=q.x;p.y=q.y;p.z=q.z;p.vx=p.vy=p.vz=0;p.grounded=true;routeStamp(s,r.kind);emit(s,'expedition-arrive',{name:r.name});}
  }}
 function spawnWave(s){const e=s.expedition;e.defense.wave++;for(const b of s.drones.filter(b=>b.wave===e.defense.wave)){Object.assign(b,b.origin,{hp:b.maxHp,stun:0,attack:1.8,telegraph:0,awareness:6});}say(s,'SOLSTICE BOARDING WAVE '+(e.defense.wave+1)+' / 3');emit(s,'expedition-wave',{wave:e.defense.wave+1});}
 function walkPerson(s,b,to,speed,dt){const dx=to.x-b.x,dz=to.z-b.z,l=Math.hypot(dx,dz);b.walking=false;if(l<.18)return true;b.heading=Math.atan2(dx,-dz);const options=[0,.55,-.55,1.1,-1.1];for(const turn of options){const a=Math.atan2(dz,dx)+turn,nx=b.x+Math.cos(a)*Math.min(l,speed*dt),nz=b.z+Math.sin(a)*Math.min(l,speed*dt),floor=groundAt(nx,nz,b.y+1);const fy=b.humanoid?b.y-1.05:b.y;
    if(!Number.isFinite(floor.y)||Math.abs(floor.y-fy)>.4||occupied(nx,fy,nz,s))continue;
    b.x=nx;b.z=nz;b.y=floor.y+(b.humanoid?1.05:0);b.walking=true;return false;
   }return false;
 }
 function enemies(s,dt){const p=s.p;for(const b of s.drones){if(!b.humanoid||b.hp<=0)continue;b.stun=Math.max(0,b.stun-dt);b.walking=false;if(b.stun>0){b.telegraph=0;continue;}b.attack-=dt;const home=b.arenaHome||EXP_DISTRICTS.find(d=>d.id===b.home),eye={x:p.x,y:p.y+(p.crouched?.9:1.35),z:p.z},seen=dist(b,eye)<(b.range??(b.kind==='marshal'?37:28))&&clearLine(b,eye,s);b.awareness=seen?5:Math.max(0,(b.awareness||0)-dt);
   if(seen){b.heading=Math.atan2(p.x-b.x,-(p.z-b.z));if(home&&dist(b,eye)>9&&Math.abs(p.x-home.x)<home.w/2-2&&Math.abs(p.z-home.z)<home.d/2-2&&Math.abs(p.y-(b.y-1.05))<2)walkPerson(s,b,p,b.chaseSpeed??(b.kind==='breacher'?1.5:2.5),dt);
    b.telegraph=b.attack<.9?Math.max(0,1-b.attack/.9):0;
    if(b.attack<=0&&s.bullets.length<90){const speed=b.projectileSpeed??(b.kind==='marshal'?21:15),n=b.kind==='breacher'?3:1,l=dist(b,eye)||1;for(let k=0;k<n;k++){const spread=(k-(n-1)/2)*.65;s.bullets.push({x:b.x,y:b.y+.35,z:b.z,vx:(eye.x-b.x+spread)/l*speed,vy:(eye.y-b.y-.35)/l*speed,vz:(eye.z-b.z-spread)/l*speed,life:3.2,damage:b.shotDamage??(b.kind==='breacher'?15:12)});}b.attack=b.attackDelay??(b.kind==='marshal'?2.3:3);emit(s,'enemy-shot',{at:{x:b.x,y:b.y,z:b.z},kind:b.kind,weapon:b.gun||'carbine'});}
   }else{b.telegraph=0;const route=b.patrol||[[b.origin.x,b.origin.z]],v=route[(b.patrolIndex||0)%route.length];if(walkPerson(s,b,{x:v[0],z:v[1]},1.2,dt))b.patrolIndex=((b.patrolIndex||0)+1)%route.length;}
  }}
 function tick(s,dt){const e=s.expedition,p=s.p;
  if(p.rail){if(!e.railTrip&&EXP_RAILS.some(r=>r.id===p.rail.id))e.railTrip={id:p.rail.id,start:p.rail.s,distance:0,last:p.rail.s};if(e.railTrip?.id===p.rail.id){e.railTrip.distance+=Math.abs(p.rail.s-e.railTrip.last);e.railTrip.last=p.rail.s;}}
  else if(e.railTrip)e.railTrip=null;
  if(p.grounded&&!p.ride)for(const d of EXP_DISTRICTS)if(!e.visited.includes(d.id)&&Math.abs(p.x-d.x)<d.w/2&&Math.abs(p.z-d.z)<d.d/2&&Math.abs(p.y-d.y)<.5){e.visited.push(d.id);say(s,'Discovered '+d.name+'. Open L / Journal for routes and adventures.');emit(s,'save');}
  if(e.visited.length===EXP_DISTRICTS.length)reward(s,'districts');
  const def=e.defense;if(def.active){def.time+=dt;const d=EXP_DISTRICTS.find(d=>d.id==='observatory');if(Math.hypot(p.x-d.x,p.z-d.z)>55||p.y<d.y-8){abort(s,'abandoned');}else if(!s.drones.some(b=>b.wave===def.wave&&b.hp>0)){def.gap-=dt;if(def.wave<2&&def.gap<=0){spawnWave(s);def.gap=2.5;}else if(def.wave===2&&def.time>=24){def.active=false;reward(s,'defense');}}}
  const escort=e.escort;escort.walking=false;if(escort.active&&!has(s,'surveyor-safe')){const unsafe=s.drones.some(b=>b.humanoid&&b.hp>0&&dist(b,{x:escort.x,y:escort.y+1.05,z:escort.z})<15&&clearLine(b,{x:escort.x,y:escort.y+1.4,z:escort.z},s));if(dist(p,escort)<13&&!unsafe){const v=ESCORT_PATH[Math.min(escort.index+1,ESCORT_PATH.length-1)];if(walkPerson(s,escort,{x:v[0],z:v[2]},2.5,dt)){escort.index++;if(escort.index>=ESCORT_PATH.length-1){escort.active=false;reward(s,'rescue');say(s,'LIO: We made it. The evacuation pad is secure. Tell Iona the northern charts are safe.');}}}}
  enemies(s,dt);
 }
 function railArrival(s,id){const trip=s.expedition.railTrip;if(trip?.id===id&&trip.distance>20)routeStamp(s,'rail');s.expedition.railTrip=null;}
 return {init,nearby,handle,moveTransits,tick,abort,killed,jumpOff,railArrival};
}
