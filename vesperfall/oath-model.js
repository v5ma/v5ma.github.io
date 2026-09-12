/* Bellkeeper's Oath: optional authored encounter sequence on the existing
 * seed-derived world. No DOM, hidden teleports, hitscan, or unbounded spawns. */
(function(root){'use strict';
 const VERSION=1,NAME="The Bellkeeper's Oath";
 const stages=[{room:11,title:'First Toll / Roseglass Approach',hint:'A cantor and a charging hound. Move after their aim locks.',kinds:['cantor','stalker']},{room:9,title:'Second Toll / Ivory Crown',hint:'An archer and mirror guard. Use the two stairs to change your firing angle.',kinds:['archer','mirror']},{room:17,title:'Final Toll / Ember Crown',hint:'The Bellkeeper guards the beacon. Green light marks the weak-point opening.',kinds:['warden']}];
 const initial=()=>({version:VERSION,stage:0,active:false,rest:0,gap:0,grants:0,cleared:0});
 function configure(s,a,make){
  s.oath=initial();s.world.exit=17;s.world.enemies=[];
  const route=[];let from=1;
  for(let wave=0;wave<stages.length;wave++){
   const d=stages[wave],r=s.world.rooms[d.room];const path=a.route(s.world,from,r.id);route.push(...(route.length?path.slice(1):path));from=r.id;
   d.kinds.forEach((kind,j)=>{const e=make(kind),id=s.world.enemies.length;e.id=id;e.room=r.id;e.required=true;e.aware=false;e.oathWave=wave;e.p=[r.x+(d.kinds.length===1?3:(j?3:-3)),1.05,r.z-.8];
    // These positions have ground clearance below the galleries on every seed.
    e.cd=1.3+j*.8;e.dead=false;
    if(wave===2){e.oathBoss=true;e.hp=e.maxHp=420+Math.max(0,s.world.depth-1)*28;e.bossPhase=1;e.bossTransition=0;e.bossPattern=0;e.bodyRadius=.72;e.headRadius=.34;e.speed=.8;e.bossMove=null;}
    if(s.challenge){e.hp=Math.round(e.hp*1.3);e.maxHp=e.hp;e.speed*=1.15;}
    s.world.enemies.push(e);
   });
  }
  s.world.oath={version:VERSION,route,stations:stages.map(d=>({room:d.room,title:d.title,hint:d.hint}))};
 }
 function canTarget(s,e){return !s.oath||e.oathWave===undefined||(s.oath.active&&e.oathWave===s.oath.stage);}
 function canAttack(s,e,a){
  if(!s.oath)return true;if(!canTarget(s,e)||s.oath.rest>0||s.oath.gap>0||s.bolts.length>=6||s.hazards.length)return false;
  if(s.world.enemies.filter(x=>!x.dead&&(x.wind>0||x.charge||x.bossMove||x.combo>0)).length>=2)return false;
  // Fresh attacks need a forward hemisphere and an unobstructed warning.
  // Committed attacks are never retargeted when the player turns away.
  const dir=a.unit(a.sub(e.p,s.head)),f=s.viewForward||[0,0,-1];
  if(a.dot(dir,f)<-.15)return false;
  s.oath.gap=e.oathBoss?1.7:1.15;s.oath.grants++;return true;
 }
 function prepare(s,dt,a){if(!s.oath)return;const o=s.oath;o.gap=Math.max(0,o.gap-dt);o.rest=Math.max(0,o.rest-dt);
  if(o.stage>=3||o.active||o.rest>0)return;
  const r=s.world.rooms[stages[o.stage].room];
  if(Math.hypot(s.p[0]-r.x,s.p[2]-r.z)<10.5){o.active=true;o.gap=.8;for(const e of s.world.enemies)if(e.oathWave===o.stage){e.aware=true;e.cd=Math.max(1.3,e.cd);}a.emit(s,'oath-arrival',{stage:o.stage,p:[r.x,1.6,r.z],text:stages[o.stage].title});}
 }
 function after(s,a){if(!s.oath||!s.oath.active||s.phase!=='playing')return;const o=s.oath,roster=s.world.enemies.filter(e=>e.oathWave===o.stage);
  if(!roster.length||roster.some(e=>!e.dead))return;
  const cleared=o.stage;o.stage++;o.cleared=o.stage;o.active=false;o.rest=4.5;o.gap=1.2;
  s.bolts=[];s.hazards=[];s.health=Math.min(s.maxHealth,s.health+18);s.ammo.frost+=2;s.ammo.cinder+=2;
  a.emit(s,'oath-clear',{stage:cleared,p:[...s.p],text:cleared===2?'The last toll is yours. Approach the beacon.':'A quiet interval. +18 vitality and elemental arrows.'});
 }
 function damage(s,e,amount,head,a){
  if(!canTarget(s,e))return 0;
  if(!e.oathBoss)return amount;
  if(e.bossTransition>0)return 0;
  const open=e.recovery>0&&!e.bossMove&&!(e.wind>0);
  const hit=amount*(open?(head?1:.65):.16),floor=e.bossPhase===1?e.maxHp*2/3:e.bossPhase===2?e.maxHp/3:0;
  if(!open)a.emit(s,'oath-armor',{id:e.id,p:[...e.p]});
  // A powerful arrow may reach, but cannot skip, a phase transition.
  return Math.max(0,Math.min(hit,e.hp-floor));
 }
 function boss(s,e,dt,a){
  if(e.dead||!canTarget(s,e)){e.phase='dormant';return;}
  const {add,sub,mul,len,unit,emit,walkable,floorAt,segmentBlocked,shieldHit,block,hurt}=a;
  const phase=e.hp<=e.maxHp/3+.0001?3:e.hp<=e.maxHp*2/3+.0001?2:1;
  if(phase>e.bossPhase){e.bossPhase=phase;e.bossTransition=2;e.wind=0;e.bossMove=null;e.charge=null;e.frozen=0;e.recovery=0;e.cd=2.8;s.bolts=s.bolts.filter(b=>b.owner!==e.id);s.hazards=s.hazards.filter(h=>h.owner!==e.id);emit(s,'oath-phase',{phase,id:e.id,p:[...e.p]});}
  e.frozen=Math.max(0,(e.frozen||0)-dt);e.slow=Math.max(0,(e.slow||0)-dt);e.recovery=Math.max(0,e.recovery-dt);e.cd=Math.max(0,e.cd-dt);
  if(e.bossTransition>0){e.bossTransition=Math.max(0,e.bossTransition-dt);e.phase='recovering';return;}
  if(e.frozen>0){e.wind=0;e.bossMove=null;e.recovery=Math.max(e.recovery,.8);e.phase='frozen';return;}
  const origin=add(e.p,[0,.45,0]),delta=sub(s.head,origin),distance=len(delta),visible=distance<25&&!segmentBlocked(s.world,origin,s.head);
  if(e.bossMove){
   e.phase='charging';const m=e.bossMove,travel=Math.min(m.left,5.8*dt),n=Math.max(1,Math.ceil(travel/.09));
   for(let i=0;i<n;i++){const p=add(e.p,mul(m.dir,travel/n)),floor=[p[0],e.p[1]-1.05,p[2]];
    if(!walkable(s.world,floor,.72)){m.left=0;break;}const y=floorAt(s.world,floor);e.p=[p[0],y+1.05,p[2]];m.left-=travel/n;
    if(len(sub(add(e.p,[0,.45,0]),s.head))<1.3&&!segmentBlocked(s.world,add(e.p,[0,.45,0]),s.head)){const h=shieldHit(s,add(e.p,[0,.45,0]),s.head);if(h)block(s,h.p);else hurt(s,22);m.left=0;break;}
   }
   if(m.left<=.01){e.bossMove=null;e.recovery=3.0;e.cd=3.2;emit(s,'oath-open',{id:e.id,p:[...e.p]});}return;
  }
  if(e.recovery>0){e.phase='recovering';return;}
  if(e.wind>0){e.phase='winding';e.wind=Math.max(0,e.wind-dt);if(e.wind>0)return;
   if(e.bossPhase===2&&Math.abs(e.aim[1]-e.p[1])<2){e.bossMove={dir:unit([e.aim[0]-e.p[0],0,e.aim[2]-e.p[2]]),left:Math.min(7.5,Math.hypot(e.aim[0]-e.p[0],e.aim[2]-e.p[2]))};e.facing=e.bossMove.dir;emit(s,'enemy-charge',{id:e.id,kind:'warden',p:[...e.p]});}
   else if(e.bossPhase===3&&e.bossPattern%2===1){const y=floorAt(s.world,[e.aim[0],e.aimFloor,e.aim[2]]);if(y!==null&&s.hazards.length<12)s.hazards.push({p:[e.aim[0],y,e.aim[2]],radius:2.3,life:1.4,kind:'alchemist',owner:e.id});e.recovery=3.1;emit(s,'oath-open',{id:e.id,p:[...e.p]});}
   else{const dir=unit(sub(e.aim,origin)),spread=e.bossPhase===3?[-.28,-.14,0,.14,.28]:[-.14,0,.14];for(const angle of spread){if(s.bolts.length>=24)break;const c=Math.cos(angle),sn=Math.sin(angle);s.bolts.push({p:[...origin],v:mul([dir[0]*c-dir[2]*sn,dir[1],dir[0]*sn+dir[2]*c],5),kind:'warden',life:5,damage:16,owner:e.id});}e.recovery=2.8;emit(s,'enemy-shot',{id:e.id,kind:'warden',p:[...e.p]});emit(s,'oath-open',{id:e.id,p:[...e.p]});}e.bossPattern++;return;
  }
  e.phase='guarding';e.facing=unit([delta[0],0,delta[2]]);
  if(visible&&e.cd<=0&&canAttack(s,e,a)){e.aim=[...s.head];e.aimFloor=s.p[1];e.wind=e.bossPhase===2?1.35:1.55;e.windTotal=e.wind;e.cd=e.wind+3.2;emit(s,'enemy-windup',{id:e.id,kind:'warden',p:[...e.p],aim:[...e.aim]});}
 }
 const api={VERSION,NAME,stages,initial,configure,canTarget,canAttack,prepare,after,damage,boss};root.BellOath=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
