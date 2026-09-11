/* Lantern Hours: additive town clock, useful restored services and one spatial
 * lamp circuit. No Date.now(), remote reward calls, teleport or legacy rewrites. */
import {CYCLE_BENCH,cycleAction} from './cycle-core.mjs';
import {targets, roomAt, actions, questStatus, QUESTS, stats, notify} from './life-core.mjs';
import {STREET_JOBS, STREET_SITES, currentSite, inSpace, available} from './street-core.mjs';

export const LAMPS = Object.freeze([
  {id:'arch',name:'Arch lamp / switch A',x:10,z:43,mask:1,affects:'Arch'},
  {id:'lane',name:'Binders lane / switch B',x:-10,z:92,mask:3,affects:'Arch + Binders lane'},
  {id:'market',name:'Market lamp / switch C',x:10,z:158,mask:6,affects:'Binders lane + Market'}
]);
export const SERVICES = Object.freeze([
  CYCLE_BENCH,
  {id:'hours',name:'Take a break at the Copper Cat',x:101,z:177,room:'inn',kind:'wait',description:'Wait until morning or evening. Nothing moves and no cooldown is skipped while you wait.'},
  {id:'meal',name:'Emilia\'s community supper',x:14,z:207,job:'dinner',kind:'meal',description:'After Enough for Everyone, share a meal: restore 40 vitality and 25 focus. Another serving needs 3 minutes of active play.'},
  {id:'brewing',name:'Ada\'s portable tonic recipe',x:23,z:57,room:'apothecary',job:'tonic',kind:'brew',description:'After discovering the recipe, pay 12 florins for ingredients and bottle a tonic. Carry up to 3. Each restores 35 vitality and 12 focus.'},
  {id:'rest',name:'Rest on the restored garden bench',x:10,z:447,garden:true,job:'gardenbench',kind:'rest',description:'Restore 30 focus at your repaired bench. Available again after 1 minute of active play.'},
  {id:'lamplighter',name:'The Lamplighter\'s Circuit',x:-10,z:127,job:'bell',kind:'circuit',description:'The bell works, but three street lamps share crossed wires. Follow the brass diagrams, light all three, then report here.'}
]);
const integer=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
const range=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const eligibleTarget = target => target && ['quest','work','service','lamp'].includes(target.kind) &&
  (target.kind==='quest'?QUESTS:target.kind==='work'?STREET_JOBS:target.kind==='service'?SERVICES:LAMPS).some(x=>x.id===target.id);

export function cityState(raw){
  const c={version:1,minute:480,activeSeconds:0,servings:0,mealCooldown:0,restCooldown:0,tonics:0,
    circuit:0,switches:0,rewarded:false,tracked:null,invited:[],callout:null,calloutT:0,calloutDelay:12};
  if(!raw||raw.version!==1)return c;
  if(range(raw.minute,0,1440))c.minute=raw.minute%1440;
  if(range(raw.activeSeconds,0,1e8))c.activeSeconds=raw.activeSeconds;
  if(integer(raw.servings,1000000))c.servings=raw.servings;
  if(range(raw.mealCooldown,0,180))c.mealCooldown=raw.mealCooldown;
  if(range(raw.restCooldown,0,60))c.restCooldown=raw.restCooldown;
  if(integer(raw.tonics,3))c.tonics=raw.tonics;
  if(integer(raw.circuit,3))c.circuit=raw.circuit;
  if(integer(raw.switches,7))c.switches=raw.switches;
  // The completed outcome is authoritative within this single-player save.
  c.rewarded=raw.rewarded===true||c.circuit===3;
  if(c.rewarded){c.circuit=3;c.switches=6;}
  if(eligibleTarget(raw.tracked))c.tracked={kind:raw.tracked.kind,id:raw.tracked.id};
  if(Array.isArray(raw.invited))c.invited=[...new Set(raw.invited.filter(x=>STREET_SITES.some(s=>s.id===x)))];
  return c;
}
export function saveCity(c){
  return {version:1,minute:Math.floor(c.minute),activeSeconds:Math.floor(c.activeSeconds),
    servings:c.servings,mealCooldown:Math.ceil(c.mealCooldown),restCooldown:Math.ceil(c.restCooldown),
    tonics:c.tonics,circuit:c.circuit,switches:c.switches,rewarded:c.rewarded,
    tracked:c.tracked?{...c.tracked}:null,invited:[...c.invited]};
}
export function lampMask(c){if(c.circuit===3)return 7;let mask=2;LAMPS.forEach((p,i)=>{if(c.switches&(1<<i))mask^=p.mask;});return mask;}
export function clockInfo(c){
  const minute=c.minute,hour=Math.floor(minute/60),night=minute<360||minute>=1200;
  // A full town day takes 36 minutes of active play; every old task stays open.
  const daylight=Math.max(0,Math.min(1,(minute-330)/120,(1230-minute)/120));
  return {hour,minute:Math.floor(minute%60),text:`${String(hour).padStart(2,'0')}:${String(Math.floor(minute%60)).padStart(2,'0')}`,
    phase:night?'Night':minute<480?'Dawn':minute<1020?'Day':'Evening',daylight};
}
export function canVisit(s,w,p){
  return !s.doors?.level&&(p.inside||null)===(s.life.inside||null)&&(!p.room||roomAt(s,w)?.id===p.room)&&(!p.garden||s.life.flags.garden);
}
function isSafe(s,w){
  if(s.life.inside==='inn'&&!s.life.flags.rocco&&distance(s,{x:105,z:180})<5)return false;
  return s.mode==='foot'&&Math.abs(s.speed)<=1.7&&(s.defeated||distance(s,w.bandit)>5);
}
export function nearbyChoices(s,w){
  const entries=[];
  for(const p of targets(s,w)){
    const d=distance(s,p);if(d>3.2||!canVisit(s,w,p))continue;
    const offered=actions(s,p,w).filter(x=>!x.disabled);
    entries.push({kind:'talk',id:p.id,name:p.name,detail:p.role||p.type,distance:d,ready:offered.length>0});
  }
  for(const j of STREET_JOBS){
    const p=currentSite(s,j),d=distance(s,p);if(d>3||!inSpace(s,w,p)||s.street.done.includes(j.id))continue;
    entries.push({kind:'work',id:j.id,name:j.title,detail:p.name,distance:d,ready:!!available(s,j)});
  }
  for(const p of SERVICES){
    const d=distance(s,p);if(d>3||!canVisit(s,w,p))continue;
    entries.push({kind:'service',id:p.id,name:p.name,detail:p.job&&!s.street.done.includes(p.job)?'Finish the related neighbourhood work first':p.description,distance:d,ready:!p.job||s.street.done.includes(p.job)});
  }
  if(s.city.circuit>0)for(const p of LAMPS){
    const d=distance(s,p);if(d<=3&&!s.life.inside)entries.push({kind:'lamp',id:p.id,name:p.name,detail:'Toggles '+p.affects,distance:d,ready:s.city.circuit<3});
  }
  return entries.sort((a,b)=>a.distance-b.distance||a.kind.localeCompare(b.kind));
}
export function setTracked(s,kind,id){
  if(!eligibleTarget({kind,id}))return false;
  s.city.tracked={kind,id};return true;
}
export function cityTarget(s,w){
  const t=s.city.tracked;if(!t)return null;let p;
  if(t.kind==='quest'){
    const q=QUESTS.find(q=>q.id===t.id),qs=questStatus(s,q);if(qs.done)return null;
    p=targets(s,w).find(p=>p.id===qs.target);
    if(!p){ // A cellar target is not in the current floor's list.
      for(const inside of [null,'workshop','inn']){p=targets({...s,life:{...s.life,inside,flags:{...s.life.flags,garden:true}}},w).find(p=>p.id===qs.target);if(p)break;}
    }
    if(p)p={...p,label:q.name};
  }else if(t.kind==='work'){
    const j=STREET_JOBS.find(j=>j.id===t.id);if(s.street.done.includes(j.id))return null;p={...currentSite(s,j),label:j.title};
  }else p={...(t.kind==='service'?SERVICES:LAMPS).find(p=>p.id===t.id)};
  if(!p)return null;
  const layer=p.inside||null;
  if(s.life.inside!==layer){
    const room=w.rooms.find(r=>r.id===(s.life.inside||layer));
    return {...room.stairs,inside:s.life.inside,hint:s.life.inside?'Take the stairs upstairs':'Enter '+room.name+' and use its basement stairs',label:p.label||p.name};
  }
  if(p.room&&roomAt(s,w)?.id!==p.room){const r=w.rooms.find(r=>r.id===p.room);return {...r.door,hint:'Walk through the signed doorway into '+r.name,label:p.label||p.name};}
  return {...p,hint:p.z>407&&!s.life.flags.garden?'The northern gate still needs its charter and pump repair':p.inside?'Basement destination':'Walk close, stop, then use Nearby / I',label:p.label||p.name};
}
export function guideEntries(s,w){
  const entries=QUESTS.map(q=>{const z=questStatus(s,q),p=cityTarget({...s,city:{...s.city,tracked:{kind:'quest',id:q.id}}},w);
    return {kind:'quest',id:q.id,name:q.name,detail:z.text,ready:z.available,complete:z.done,progress:z.n>0,location:p};});
  for(const j of STREET_JOBS){const p=currentSite(s,j);entries.push({kind:'work',id:j.id,name:j.title,detail:p.name,ready:!!available(s,j),complete:s.street.done.includes(j.id),progress:(s.street.progress[j.id]||0)>0,location:p});}
  for(const p of SERVICES)entries.push({kind:'service',id:p.id,name:p.name,detail:p.description,ready:!p.job||s.street.done.includes(p.job),complete:p.id==='lamplighter'&&s.city.circuit===3,progress:p.id==='lamplighter'&&s.city.circuit>0,location:p});
  return entries.map(x=>({...x,distance:x.location?distance(s,x.location):Infinity}));
}
export function useCity(s,w,id,action){
  const p=SERVICES.find(p=>p.id===id)||LAMPS.find(p=>p.id===id);
  if(!p||!isSafe(s,w)||!canVisit(s,w,p)||distance(s,p)>3.1)return {ok:false,text:'Stop on foot beside this place, on the correct floor and away from combat.'};
  const c=s.city,st=stats(s),reply=text=>({ok:true,text});
  if(p.job&&!s.street.done.includes(p.job))return {ok:false,text:'First finish '+STREET_JOBS.find(j=>j.id===p.job).title+'. Your completed work unlocks this service.'};
  if(p.kind==='cycle')return cycleAction(s,w,action);
  if(p.kind==='wait'){
    if(!['morning','evening'].includes(action))return {ok:false,text:'Choose morning or evening.'};
    c.minute=action==='morning'?480:1170;notify(s,'You take a quiet break. It is now '+clockInfo(c).text+'. All commissions remain available.','town-wait');
    return reply(s.toast);
  }
  if(p.kind==='meal'||p.kind==='rest'){
    if(action!=='use')return {ok:false,text:'Choose the service action.'};
    const key=p.kind==='meal'?'mealCooldown':'restCooldown';
    if(c[key]>0)return {ok:false,text:`Come back after ${Math.ceil(c[key])} seconds of active play. Waiting in a menu does not renew supplies.`};
    if(s.life.focus>=st.maxFocus&&(p.kind==='rest'||s.health>=st.maxHealth))return {ok:false,text:'You are already restored. No serving has been used.'};
    if(p.kind==='meal'){s.health=Math.min(st.maxHealth,s.health+40);c.servings++;}
    s.life.focus=Math.min(st.maxFocus,s.life.focus+(p.kind==='meal'?25:30));c[key]=p.kind==='meal'?180:60;
    notify(s,p.kind==='meal'?'Emilia shares a warm meal. Your earlier work now helps you on every visit.':'A quiet rest restores your focus. The bench you repaired remains useful.','town-service',{id});return reply(s.toast);
  }
  if(p.kind==='brew'){
    if(action!=='brew')return {ok:false,text:'Choose Bottle a tonic.'};
    if(c.tonics>=3)return {ok:false,text:'Your satchel already holds three tonics. No ingredients were charged.'};
    if(s.credits<12)return {ok:false,text:'Ingredients cost 12 earned florins. Nothing was charged.'};
    s.credits-=12;c.tonics++;notify(s,'A portable tonic is packed. Use it from Nearby / Satchel when you need vitality or focus.','town-brew');return reply(s.toast);
  }
  if(p.kind==='circuit'){
    if(action==='accept'&&c.circuit===0){c.circuit=1;c.switches=0;c.tracked={kind:'lamp',id:'arch'};notify(s,'The Lamplighter\'s Circuit: read the three switch diagrams, light all lamps, then return to the bell.','circuit-start');return reply(s.toast);}
    if(action==='reset'&&c.circuit>0&&c.circuit<3){c.switches=0;c.circuit=1;return reply('Circuit reset to its original pattern. No money or progress in other tasks was lost.');}
    if(action==='report'&&c.circuit>0&&lampMask(c)===7&&!c.rewarded){c.circuit=3;c.rewarded=true;s.life.xp+=90;s.credits+=35;notify(s,'The Lamplighter\'s Circuit complete. +90 XP / +35 florins. These lamps will light the street each evening.','circuit-complete');return reply(s.toast);}
    return {ok:false,text:c.circuit===3?'The lamps are maintained. This reward was already paid.':'Light all three lamps before reporting. Each brass diagram shows which lamps its switch changes.'};
  }
  if(action!=='toggle'||c.circuit===0||c.circuit===3)return {ok:false,text:'Accept the circuit at the repaired crossing bell first. A finished circuit cannot be rewarded again.'};
  c.switches^=1<<LAMPS.findIndex(l=>l.id===p.id);c.circuit=lampMask(c)===7?2:1;
  notify(s,c.circuit===2?'All three lamps are lit. Return to the crossing bell.':p.name+' changed. Look at the live lamp diagram.','lamp-switch',{id});
  if(c.circuit===2)c.tracked={kind:'service',id:'lamplighter'};
  return reply(s.toast);
}
export function drinkTonic(s,w){
  if(!isSafe(s,w))return {ok:false,text:'Stop on foot and step away from combat to use the satchel.'};
  const st=stats(s);if(!s.city.tonics)return {ok:false,text:'No tonic packed. Ada can bottle the recipe once you learn it.'};
  if(s.health>=st.maxHealth&&s.life.focus>=st.maxFocus)return {ok:false,text:'Vitality and focus are already full. The tonic stays in your satchel.'};
  s.city.tonics--;s.health=Math.min(st.maxHealth,s.health+35);s.life.focus=Math.min(st.maxFocus,s.life.focus+12);notify(s,'You use a packed tonic: +35 vitality and +12 focus, up to your limits.','town-tonic');return {ok:true,text:s.toast};
}
export function cityStep(s,w,dt){
  const c=s.city;c.activeSeconds+=dt;c.minute=(c.minute+dt*(1440/2160))%1440;
  for(const key of ['mealCooldown','restCooldown','calloutT','calloutDelay'])c[key]=Math.max(0,c[key]-dt);
  if(c.calloutT===0)c.callout=null;
  if(c.calloutDelay||s.doors?.level||s.life.inside||Math.abs(s.speed)>8)return;
  const p=STREET_SITES.find(p=>p.person&&!c.invited.includes(p.id)&&distance(s,p)<8&&inSpace(s,w,p)&&STREET_JOBS.some(j=>currentSite(s,j).id===p.id&&available(s,j)&&!s.street.done.includes(j.id)));
  if(p){c.invited.push(p.id);c.callout={id:p.id,name:p.person,text:`${p.person}: A moment, neighbour? There is something here you could help with.`};c.calloutT=7;c.calloutDelay=40;}
}
