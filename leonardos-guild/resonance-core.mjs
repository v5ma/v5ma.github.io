import {inBadlands,safeTown,frontierBlocked,frontierSight,hurtMonster,FRONTIER_SOLIDS} from './frontier-core.mjs';
/* Bounded console equipment and non-lethal projectile simulation.
 * No DOM, networking, random rewards, civilian targeting or hidden save writes.
 * Original mission prerequisites and the existing staff reducers remain authoritative.
 */
import {doorLocation,inDoorSpace,doorsBlocked} from './doors-core.mjs';
import {roomAt,notify,stats,PEOPLE} from './life-core.mjs';
import {TOOLS,DISCIPLINES} from './resonance-data.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const integer=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
export function resonanceState(raw){
  const c={version:1,tool:'staff',variants:{staff:0,sling:0,letters:0,lantern:0},discipline:'courier',ready:6,reserve:36,guard:100,guardTired:false,headlight:true,reload:0,fireCD:0,aim:false,aimYaw:0,lock:null,cover:null,duck:false,special:0,specialCD:0,projectiles:[],nextShot:0,supplyCD:0};
  if(!raw||raw.version!==1)return c;
  if(TOOLS.some(t=>t.id===raw.tool))c.tool=raw.tool;if(DISCIPLINES.some(d=>d.id===raw.discipline))c.discipline=raw.discipline;
  for(const t of TOOLS)if(integer(raw.variants?.[t.id],t.variants.length-1))c.variants[t.id]=raw.variants[t.id];
  if(integer(raw.ready,6))c.ready=raw.ready;if(integer(raw.reserve,72))c.reserve=raw.reserve;
  if(typeof raw.headlight==='boolean')c.headlight=raw.headlight;return c;
}
export function saveResonance(c){return {version:1,tool:c.tool,variants:{...c.variants},discipline:c.discipline,ready:Math.floor(clamp(c.ready,0,6)),reserve:Math.floor(clamp(c.reserve,0,72)),headlight:!!c.headlight};}
export function validTargets(s,w){
  if(safeTown(s))return [];if(inBadlands(s))return s.frontier.enemies.filter(e=>e.hp>0).map(e=>({id:e.id,x:e.x,z:e.z,hp:e.hp,name:e.name,kind:'monster',actor:e}));
  const list=s.doors.enemies.filter(e=>e.hp>0&&inDoorSpace(s,e,w)).map(e=>({id:e.id,x:e.x,z:e.z,hp:e.hp,name:e.name,kind:'rival',actor:e}));
  const l=doorLocation(s,w);
  if(l.level===0&&!l.room&&!s.defeated)list.push({id:'folio-guard',...w.bandit,hp:s.banditHP,name:'Folio guard',kind:'guard'});
  if(s.life.inside==='inn'&&!s.life.flags.rocco){const p=PEOPLE.find(p=>p.id==='rocco');list.push({id:'rocco',x:p.x,z:p.z,hp:s.life.enemies.rocco,name:'Rocco',kind:'rocco'});}
  return list;
}
function solidPoint(s,w,x,z){
  if(inBadlands(s))return frontierBlocked(x,z,.08);
  if(s.doors.level||s.life.inside)return doorsBlocked(s,w,x,z,.08);
  if(!s.life.flags.garden&&Math.abs(x-w.townGate.x)<w.townGate.hx&&Math.abs(z-w.townGate.z)<w.townGate.hz)return true;
  if(!s.relay&&w.gates.some(b=>Math.abs(x-b.x)<b.hx&&Math.abs(z-b.z)<b.hz))return true;
  return w.colliders.some(b=>Math.abs(x-b.x)<b.hx&&Math.abs(z-b.z)<b.hz);
}
export function clearShot(s,w,a,b){if(inBadlands(s))return frontierSight(a,b);const length=dist(a,b),steps=Math.max(1,Math.ceil(length/.3));for(let i=1;i<steps;i++){const f=i/steps;if(solidPoint(s,w,a.x+(b.x-a.x)*f,a.z+(b.z-a.z)*f))return false;}return true;}
export function aimTarget(s,w,yaw,enabled=true){
  if(!enabled)return null;
  return validTargets(s,w).filter(e=>dist(e,s)<30&&Math.abs(angle(Math.atan2(e.x-s.x,e.z-s.z)-yaw))<.72&&clearShot(s,w,s,e)).sort((a,b)=>dist(a,s)-dist(b,s))[0]||null;
}
export function reloadSling(s){const c=s.resonance;if(c.tool!=='sling')return false;if(c.reload>0||c.ready>=6)return false;if(!c.reserve){notify(s,'Your pellet pouch is empty. Refill at Leonardo\'s workshop or buy market supplies.','resonance-empty');return false;}c.reload=c.special>0&&c.discipline==='artificer'?.5:1.35;notify(s,'Filling the ready pouch...','resonance-reload');return true;}
export function restockResonance(s){const c=s.resonance;if(!c)return;c.reserve=36;c.ready=6;c.reload=0;c.guard=100;c.guardTired=false;c.projectiles=[];c.cover=null;c.aim=false;c.lock=null;c.duck=false;}
export function chooseTool(s,id,variant=0){const t=TOOLS.find(t=>t.id===id);if(!t||!integer(variant,t.variants.length-1))return false;const c=s.resonance;c.tool=id;c.variants[id]=variant;c.reload=0;c.lock=null;return true;}
export function chooseDiscipline(s,w,id){if(!DISCIPLINES.some(t=>t.id===id))return false;const c=s.resonance;if(c.special>0||validTargets(s,w).some(e=>dist(e,s)<12&&clearShot(s,w,s,e))){notify(s,'Choose a discipline in a safe place, after your active ability ends.','resonance-denied');return false;}c.discipline=id;notify(s,DISCIPLINES.find(d=>d.id===id).name+' discipline ready. Your character, commissions and equipment stay with you.','resonance-discipline');return true;}
export function specialAbility(s){const c=s.resonance;if(c.specialCD>0||c.special>0)return false;if(s.life.focus<40){notify(s,'This ability needs 40 focus. Let it recover, or use an earned restorative service.','resonance-denied');return false;}s.life.focus-=40;c.special=7;c.specialCD=25;if(c.discipline==='artificer'){s.scan=8;s.scanCD=2;}notify(s,({courier:'Second Wind',warden:'Steadfast',artificer:'Ingenio Focus'})[c.discipline]+'!','resonance-special');return true;}
export function coverObject(s,w){
  if(s.mode!=='foot'||s.doors.level||s.life.inside)return null;
  return (inBadlands(s)?FRONTIER_SOLIDS:w.colliders).map(b=>{const x=clamp(s.x,b.x-b.hx,b.x+b.hx),z=clamp(s.z,b.z-b.hz,b.z+b.hz);return {id:b.id,x,z,d:dist(s,{x,z})};}).filter(b=>b.d>.2&&b.d<1.9).sort((a,b)=>a.d-b.d)[0]||null;
}
export function toggleCover(s,w){const c=s.resonance;if(c.cover){c.cover=null;return false;}const cover=coverObject(s,w);if(!cover){notify(s,'Stand beside a wall, counter or street obstacle to take cover. LT with the staff also braces.','resonance-denied');return false;}c.cover=cover;notify(s,'In cover. Move away, press RB again, or dodge with B to leave.','resonance-cover');return true;}
function damageTarget(s,w,t,damage,stun){
  if(safeTown(s))return;if(t.kind==='monster'){hurtMonster(s,t.id,damage,stun);return;}
  if(t.kind==='rival'){
    const e=t.actor;if(e.hp<=0)return;e.hp=Math.max(0,e.hp-damage);e.phase='stagger';e.timer=stun;e.flash=.2;
    if(!e.hp&&!s.doors.defeated.includes(e.id)){s.doors.defeated.push(e.id);s.credits+=12;s.life.xp=Math.min(50000,s.life.xp+25);notify(s,e.name+' yields. +25 XP / +12 florins.','doors-rival-yields',{id:e.id,x:e.x,z:e.z});}
    else notify(s,e.name+' / '+e.hp+' vitality.','resonance-impact',{id:e.id,x:e.x,z:e.z});
  }else if(t.kind==='guard'){
    if(s.defeated)return;s.banditHP=Math.max(0,s.banditHP-damage);
    if(!s.banditHP){s.defeated=true;s.banditPhase='yielded';s.banditWindup=0;s.score+=150;notify(s,'The guard yields. Retrieve the folio beyond the crossing.','duel-won');}else notify(s,'The pellet catches the folio guard.','resonance-impact',{x:t.x,z:t.z});
  }else if(t.kind==='rocco'){
    if(s.life.flags.rocco)return;s.life.enemies.rocco=Math.max(0,s.life.enemies.rocco-damage);
    if(!s.life.enemies.rocco){s.life.flags.rocco=true;notify(s,'Rocco yields. Present your warrant and evidence to close the investigation.','town-duel');}else notify(s,'The pellet catches Rocco.','resonance-impact',{x:t.x,z:t.z});
  }
}
export function fireTool(s,w,{attack,throwPaper,cast}={}){
  const c=s.resonance;if(s.mode!=='foot'||c.fireCD>0||c.reload>0)return false;
  if(c.tool==='staff'){const heavy=c.variants.staff===1,before=new Map(validTargets(s,w).map(t=>[t.id,t.hp]));c.fireCD=heavy?.85:.6;const result=attack?.(s,w);if(heavy&&result){s.attackCD=.85;const hit=validTargets(s,w).find(t=>t.hp<before.get(t.id));if(hit)damageTarget(s,w,hit,10,.7);}return !!result;}
  if(c.tool==='letters'){c.fireCD=.34;if(s.doors.level||s.life.inside){notify(s,'Sealed letters are for outdoor deliveries.','resonance-denied');return false;}return !!throwPaper?.(s,w,c.variants.letters===0?1:-1);}
  if(c.tool==='lantern'){c.fireCD=.5;return !!cast?.(s);}
  if(c.tool!=='sling')return false;
  if(!c.ready){c.fireCD=.5;notify(s,'Ready pouch empty. X reloads from your reserve.','resonance-empty');return false;}
  const target=c.lock?validTargets(s,w).find(t=>t.id===c.lock&&clearShot(s,w,s,t)):null;
  const yaw=target?Math.atan2(target.x-s.x,target.z-s.z):c.aimYaw;
  const f={x:Math.sin(yaw),z:Math.cos(yaw)},soft=c.variants.sling===1;
  c.ready--;c.fireCD=.42;s.attackT=.22;c.projectiles.push({id:++c.nextShot,x:s.x,z:s.z,vx:f.x*(soft?29:37),vz:f.z*(soft?29:37),life:1.1,level:doorLocation(s,w).level,room:doorLocation(s,w).room,damage:soft?14:26,stun:soft?1.4:.4});
  if(c.projectiles.length>12)c.projectiles.shift();notify(s,'Sling / '+c.ready+' ready / '+c.reserve+' reserve.','resonance-sling');return true;
}
export function resonanceInput(s,w,input,dt,{lockOn=true}={}){
  const c=s.resonance;
  for(const k of ['fireCD','special','specialCD','supplyCD'])c[k]=Math.max(0,c[k]-dt);
  if(c.reload>0){c.reload=Math.max(0,c.reload-dt);if(!c.reload){const n=Math.min(6-c.ready,c.reserve);c.ready+=n;c.reserve-=n;notify(s,'Ready pouch filled.','resonance-loaded');}}
  c.aim=s.mode==='foot'&&!!input.aim;c.duck=s.mode!=='foot'&&!!input.duck;
  if(c.cover&&(s.mode!=='foot'||dist(s,c.cover)>2.3||s.doors.level||s.life.inside))c.cover=null;
  const cameraYaw=Number.isFinite(input.cameraYaw)?input.cameraYaw:s.yaw;c.aimYaw=cameraYaw;
  const target=c.aim?aimTarget(s,w,cameraYaw,lockOn):null;c.lock=target?.id||null;
  if(c.aim){c.aimYaw=target?Math.atan2(target.x-s.x,target.z-s.z):cameraYaw;s.yaw=c.aimYaw;}
  if(c.special>0&&c.discipline==='warden')s.health=Math.min(stats(s).maxHealth,s.health+dt*2);
  const guardRequested=!!c.cover||c.aim&&c.tool==='staff'||c.special>0&&c.discipline==='warden';
  if(c.guard<=1)c.guardTired=true;if(!guardRequested&&c.guard>=15)c.guardTired=false;const guard=guardRequested&&!c.guardTired&&c.guard>1;c.guard=clamp(c.guard+(guard?-11:18)*dt,0,100);
  const activeSprint=c.special>0&&c.discipline==='courier';
  return {...input,boost:input.boost||activeSprint,guard:input.guard||guard,throttle:c.cover?(input.throttle||0)*.55:input.throttle,brake:input.brake||input.handbrake};
}
export function resonanceStep(s,w,input,dt,actions){
  const c=s.resonance;if(input.fire)fireTool(s,w,actions);
  const loc=doorLocation(s,w);
  for(const p of c.projectiles){
    if(p.level!==loc.level||p.room!==loc.room&&![3,-2].includes(loc.level)){p.life=0;continue;}
    const from={x:p.x,z:p.z},to={x:p.x+p.vx*dt,z:p.z+p.vz*dt};p.life-=dt;
    if(!clearShot(s,w,from,to)||solidPoint(s,w,to.x,to.z)){p.life=0;notify(s,'The pellet hits stone or timber.','resonance-wall',{x:to.x,z:to.z});continue;}
    p.x=to.x;p.z=to.z;
    const e=validTargets(s,w).find(e=>{const dx=to.x-from.x,dz=to.z-from.z,den=dx*dx+dz*dz,f=clamp(((e.x-from.x)*dx+(e.z-from.z)*dz)/(den||1),0,1);return dist(e,{x:from.x+dx*f,z:from.z+dz*f})<.65;});
    if(e){p.life=0;damageTarget(s,w,e,p.damage,p.stun);}
  }
  c.projectiles=c.projectiles.filter(p=>p.life>0);
}
