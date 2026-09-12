/* Vesperfall: deterministic mechanics in metres and seconds. No DOM or assets.
 * Static collision geometry also drives rendering. All projectile hits sweep
 * between positions so a fast arrow cannot tunnel through a thin wall. */
(function(root){'use strict';
 const VERSION='0.9.0',G=9.8,R=.28;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),len=a=>Math.hypot(...a),unit=a=>mul(a,1/(len(a)||1));
 function hash(text){let h=2166136261;for(const c of String(text).slice(0,64))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
 function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
 function shuffle(a,r){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function boxHit(a,b,box,pad=0){let lo=0,hi=1;for(let k=0;k<3;k++){const d=b[k]-a[k],min=box.min[k]-pad,max=box.max[k]+pad;if(Math.abs(d)<1e-9){if(a[k]<min||a[k]>max)return null;}else{let t=(min-a[k])/d,u=(max-a[k])/d;if(t>u)[t,u]=[u,t];lo=Math.max(lo,t);hi=Math.min(hi,u);if(lo>hi)return null;}}return lo;}
 function sphereHit(a,b,c,r){const d=sub(b,a),o=sub(a,c),A=dot(d,d),B=2*dot(o,d),C=dot(o,o)-r*r;if(C<=0)return 0;const D=B*B-4*A*C;if(D<0||A<1e-10)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;}
 function rect(x,z,w,d,y=0,type='stone'){return {x,z,w,d,y,type};}
 function inside(p,s,margin=0){return p[0]>=s.x-s.w/2+margin&&p[0]<=s.x+s.w/2-margin&&p[2]>=s.z-s.d/2+margin&&p[2]<=s.z+s.d/2-margin;}
 const encounters=root.VesperEncounters||(typeof require!=='undefined'?require('./encounters.js'):null);
 const architecture=root.CloisterLayout||(typeof require!=='undefined'?require('./architecture.js'):null);
 function floorAt(world,p,margin=0){return architecture.floorAt(world,p,margin);}
 function walkable(world,p,r=R){const y=architecture.floorAt(world,p,0,.42,.55);return y!==null&&[[0,0],[r,0],[-r,0],[0,r],[0,-r]].every(([x,z])=>architecture.floorAt(world,[p[0]+x,y,p[2]+z],0,.42,.55)!==null)&&!world.solids.some(b=>p[0]>b.min[0]-r&&p[0]<b.max[0]+r&&p[2]>b.min[2]-r&&p[2]<b.max[2]+r&&b.max[1]>y+.1&&b.min[1]<y+1.65);}
 function segmentBlocked(world,a,b,pad=0){return world.solids.some(w=>boxHit(a,b,w,pad)!==null);}
 function route(world,from,to){const q=[from],prev=new Map([[from,null]]);for(let i=0;i<q.length;i++)for(const n of world.links[q[i]])if(!prev.has(n)){prev.set(n,q[i]);q.push(n);}if(!prev.has(to))return [];const out=[];for(let n=to;n!==null;n=prev.get(n))out.unshift(n);return out;}
 function roomAt(world,p){let id=0,dist=Infinity;for(const r of world.rooms){const d=Math.hypot(r.x-p[0],r.z-p[2]);if(d<dist){dist=d;id=r.id;}}return id;}
 const districts=root.CathedralDistricts||(typeof require!=='undefined'?require('./districts.js'):null);
 const dominions=root.HollowDominions||(typeof require!=='undefined'?require('./dominions-world.js'):null);
 function generate(seed,depth=1){return dominions.expand(architecture.augment(districts.generate(seed,depth,{hash,rng,shuffle,rect,route})),{hash,rng,shuffle,rect,route});}
 function drawState(bow,string,maxDraw=.56){if(!bow||!string||!bow.every(Number.isFinite)||!string.every(Number.isFinite))return null;const v=sub(bow,string),d=len(v);if(d<.045||d>1.05)return null;return {direction:unit(v),charge:clamp((d-.08)/clamp(maxDraw,.3,.75),0,1),distance:d};}
 function addRicochetLoot(world){world.pickups.filter(p=>p.kind==='cinder').slice(0,3).forEach(p=>{p.kind='ricochet';p.label='Mirror-thread arrows';});}
 function wallNormal(p,box,velocity){let best=Infinity,normal=[0,0,0];for(let k=0;k<3;k++)for(const sign of[-1,1]){const d=Math.abs(p[k]-(sign<0?box.min[k]-.02:box.max[k]+.02));if(d<best&&velocity[k]*sign<0){best=d;normal=[0,0,0];normal[k]=sign;}}if(best===Infinity)return mul(unit(velocity),-1);return normal;}
 function collectPickup(s,index,origin,reach=1.2){const item=s.world.pickups[index];if(s.phase!=='playing'||!item||item.taken||!Array.isArray(origin)||origin.length!==3||!origin.every(Number.isFinite)||!Number.isFinite(reach))return false;
  if(len(sub(origin,s.head))>1.6||len(sub(item.p,origin))>clamp(reach,.2,7.5)||segmentBlocked(s.world,s.head,origin,.01)||segmentBlocked(s.world,origin,item.p,.01))return false;
  return grantPickup(s,item);
 }
 function grantPickup(s,item){if(item.taken)return false;if(item.kind==='health')s.health=Math.min(s.maxHealth,s.health+25);else if(item.kind==='relic'){s.score+=100;s.health=Math.min(s.maxHealth,s.health+12);}else if(Object.hasOwn(s.ammo,item.kind))s.ammo[item.kind]+=3;else return false;item.taken=true;emit(s,'pickup',{kind:item.kind,label:item.label||'',reward:item.kind==='relic'?100:0,p:[...item.p]});return true;}

 function create(seed='BELL-01',depth=1,upgrades={}){const world=generate(seed,depth);if(upgrades.challenge==='nightfall')for(const e of world.enemies){e.hp=Math.round(e.hp*1.3);e.maxHp=e.hp;e.speed*=1.15;}if(upgrades.ricochet)addRicochetLoot(world);return {world,p:[...world.start],head:[0,1.65,3],health:100+(upgrades.heart?15:0),maxHealth:100+(upgrades.heart?15:0),power:upgrades.power?1.08:1,phase:'playing',time:0,playerSlow:0,hazards:[],discovered:new Set([1]),orders:new Set(),sideRewards:new Set(),arrows:[],bolts:[],sparks:[],events:[],score:0,kills:0,shots:0,hits:0,blinkCD:0,invuln:0,ammo:{cinder:4,frost:6,volley:upgrades.volley?4:0,ricochet:upgrades.ricochet?4:0},type:'plain',finished:false,portalReady:false,damageTaken:0,targets:new Set(),weapon:'bow',crossbow:{loaded:true,reload:0},guard:upgrades.wardglass?120:100,maxGuard:upgrades.wardglass?120:100,guardLock:0,shield:null,shardCharges:upgrades.wayfarer?3:2,maxShards:upgrades.wayfarer?3:2,shardRecharge:0,shardCD:0,volleyUnlocked:!!upgrades.volley,ricochetUnlocked:!!upgrades.ricochet,quickwind:!!upgrades.quickwind,headshots:0,blocks:0,blinks:0,shardsUsed:0,sectors:0,challenge:upgrades.challenge==='nightfall'};}
 function emit(s,type,data={}){s.eventSeq=(s.eventSeq||0)+1;s.events.push({seq:s.eventSeq,type,time:s.time,...data});if(s.events.length>160)s.events.shift();}
 function fire(s,origin,direction,charge,type=s.type){
  if(s.phase!=='playing'||!Number.isFinite(charge)||origin.length!==3||direction.length!==3||!origin.every(Number.isFinite)||!direction.every(Number.isFinite)||Math.abs(len(direction)-1)>.01||charge<.08)return false;
  if(s.shield||s.guardLock>0||s.crossbow?.reload>0)return false;
  if(!['plain','cinder','frost','blink','volley','ricochet'].includes(type))return false;if(type==='blink'&&s.blinkCD>0)return false;if(type in s.ammo&&s.ammo[type]<=0)return false;
  if(segmentBlocked(s.world,s.head,origin)||floorAt(s.world,s.p)===null)return false;
  if(type==='volley'&&(!s.volleyUnlocked||!(s.ammo.volley>0)))return false;
  if(type==='ricochet'&&!s.ricochetUnlocked)return false;
  const crossbow=s.weapon==='crossbow';if(crossbow&&!s.crossbow.loaded)return false;if(crossbow)charge=.9;
  charge=clamp(charge,0,1);if(crossbow)s.crossbow.loaded=false;if(type in s.ammo)s.ammo[type]--;if(type==='blink')s.blinkCD=.85;else s.shots++;
  const speed=type==='blink'?7+charge*10:crossbow?38:12+charge*24,arrow={p:[...origin],v:mul(direction,speed),type,damage:(crossbow?66:24+charge*48)*s.power,life:4,dead:false,bounces:type==='ricochet'?2:0};if(type==='volley'){arrow.damage*=.55;for(const sign of[-1,1]){const a=sign*.075,c=Math.cos(a),sn=Math.sin(a),v=arrow.v;s.arrows.push({...arrow,p:[...origin],v:[v[0]*c-v[2]*sn,v[1],v[0]*sn+v[2]*c]});}}
  s.arrows.push(arrow);while(s.arrows.length>48)s.arrows.shift();emit(s,'shot',{arrow:type,charge,weapon:s.weapon,origin:[...origin],direction:[...direction]});return true;
 }
 function move(s,dx,dz){if(s.phase!=='playing'||!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)>5)return;if(s.playerSlow>0){dx*=.55;dz*=.55;}const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));for(let i=0;i<n;i++){const x=s.p[0]+dx/n,z=s.p[2]+dz/n;if(walkable(s.world,[x,s.p[1],s.p[2]])){s.p[0]=x;s.p[1]=floorAt(s.world,s.p);}if(walkable(s.world,[s.p[0],s.p[1],z])){s.p[2]=z;s.p[1]=floorAt(s.world,s.p);}}}
 function blink(s,p){if(!landing(s,p).ok)return false;s.p=[p[0],floorAt(s.world,p),p[2]];s.invuln=Math.max(s.invuln,.25);s.blinks++;emit(s,'blink',{p:[...s.p]});return true;}
 function damageEnemy(s,e,amount,type,head=false){if(e.dead)return;if(head)s.headshots++;e.hp-=amount;e.aware=true;if(type==='frost'){e.slow=4;e.frozen=e.kind==='warden'?.65:1.35;e.wind=0;e.charge=null;e.recovery=.4;}s.sparks.push({p:[...e.p],life:.25,type});if(e.hp<=0){e.dead=true;s.kills++;s.orders?.add(e.kind);s.score+=(e.kind==='warden'?250:100)+(head?25:0);emit(s,'kill',{id:e.id,kind:e.kind,head,p:[...e.p],arrow:type,amount});}else emit(s,'hit',{id:e.id,kind:e.kind,head,p:[...e.p],arrow:type,amount});}
 function strike(s,a,hit){
  if(hit.kind==='wall'&&a.type==='ricochet'&&a.bounces>0){const normal=wallNormal(hit.p,hit.box,a.v);a.v=mul(sub(a.v,mul(normal,2*dot(a.v,normal))),.82);a.p=add(hit.p,mul(normal,.055));a.bounces--;a.damage*=.7;s.sparks.push({p:[...hit.p],life:.3,type:'ricochet'});emit(s,'ricochet',{p:[...hit.p],remaining:a.bounces});return;}
  if(hit.kind==='wall'||hit.kind==='floor')emit(s,'impact',{p:[...hit.p],surface:hit.kind,arrow:a.type});
  if(hit.kind==='enemy'){s.hits++;damageEnemy(s,hit.enemy,a.damage*(hit.head?1.5:1),a.type,hit.head);}
  else if(hit.kind==='guard'){s.sparks.push({p:hit.p,life:.38,type:'guard'});emit(s,'enemy-deflect',{id:hit.enemy.id,p:hit.p});}
  else if(hit.kind==='target'){if(!s.targets.has(hit.id)){s.targets.add(hit.id);s.score+=10;emit(s,'target',{id:hit.id});}}
  else if(hit.kind==='floor'&&a.type==='blink'){if(!blink(s,hit.p))emit(s,'blink-denied');}
  if(a.type==='cinder'){
   // Detonate on the first actual surface, not only on a direct enemy hit.
   const center=add(hit.p,mul(unit(a.v),-.065));center[1]=Math.max(center[1],hit.kind==='floor'?hit.p[1]+.06:center[1]);
   for(const e of s.world.enemies){if(e.dead||hit.kind==='enemy'&&e===hit.enemy)continue;const distance=len(sub(e.p,center));if(distance<3&&!segmentBlocked(s.world,center,e.p))damageEnemy(s,e,a.damage*.7*(1-distance/4),'cinder');}
   s.sparks.push({p:center,life:.55,type:'blast'});emit(s,'explosion',{p:center,radius:3});
  }
  s.sparks.push({p:hit.p,life:.3,type:a.type});a.dead=true;
 }
 function probe(s,a,next){const old=a.p;let best=null;const candidate=(t,h)=>{if(t!==null&&t>=0&&t<=1&&(!best||t<best.t))best={t,...h};};
  for(const b of s.world.solids)candidate(boxHit(old,next,b,.02),{kind:'wall',box:b});
  if(a.type!=='blink'){
   for(const e of s.world.enemies)if(!e.dead){
    if(encounters.guardActive(e)){
     const normal=e.facing||unit([s.head[0]-e.p[0],0,s.head[2]-e.p[2]]),center=add(e.p,mul(normal,.78)),da=dot(sub(old,center),normal),db=dot(sub(next,center),normal);
     if(da>=0&&db<=0&&da-db>1e-8){const t=da/(da-db),p=add(old,mul(sub(next,old),t));if(len(sub(p,center))<=.53)candidate(t,{kind:'guard',enemy:e});}
    }
    candidate(sphereHit(old,next,add(e.p,[0,.62,0]),e.headRadius||(e.kind==='warden'?.36:.25)),{kind:'enemy',enemy:e,head:true});candidate(sphereHit(old,next,e.p,e.bodyRadius||(e.kind==='warden'?.65:.48)),{kind:'enemy',enemy:e,head:false});}
   s.world.targets.forEach((t,i)=>{if(!s.targets.has(i))candidate(sphereHit(old,next,t,.5),{kind:'target',id:i});});
  }
  const floor=architecture.floorHit(s.world,old,next);if(floor)candidate(floor.t,{kind:'floor',landing:floor.p});
  if(best)best.p=best.landing||add(old,mul(sub(next,old),best.t));return best;
 }
 function arrowStep(s,a,dt){a.v[1]-=G*dt;const next=add(a.p,mul(a.v,dt)),hit=probe(s,a,next);if(hit)strike(s,a,hit);else a.p=next;a.life-=dt;if(a.life<=0||a.p[1]<-8)a.dead=true;}
 function landing(s,p){if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite))return {ok:false,reason:'invalid destination'};
  if(!walkable(s.world,p,.42))return {ok:false,reason:'edge or stonework'};
  const floor=floorAt(s.world,p);if(floor===null||Math.abs(floor-p[1])>.1)return {ok:false,reason:'not a floor'};
  if(s.world.enemies.some(e=>!e.dead&&Math.hypot(e.p[0]-p[0],e.p[2]-p[2])<1.25&&Math.abs(e.p[1]-1.05-floor)<1.8))return {ok:false,reason:'enemy occupies landing'};
  return {ok:true,reason:'clear landing',p:[p[0],floor,p[2]]};
 }
 function predictBlink(s,origin,direction,charge){
  if(!Array.isArray(origin)||!Array.isArray(direction)||origin.length!==3||direction.length!==3||![...origin,...direction,charge].every(Number.isFinite)||Math.abs(len(direction)-1)>.01)return {points:[],ok:false,reason:'invalid aim'};
  const c=s.weapon==='crossbow'?.9:clamp(charge,0,1),a={p:[...origin],v:mul(direction,7+c*10),type:'blink'},points=[[...origin]];
  if(segmentBlocked(s.world,s.head,origin))return {points,ok:false,reason:'bow behind cover'};
  for(let tick=0;tick<360;tick++){a.v[1]-=G/90;const next=add(a.p,mul(a.v,1/90)),hit=probe(s,a,next);
   if(hit){points.push(hit.p);const check=hit.kind==='floor'?landing(s,hit.p):{ok:false,reason:'stone blocks the arrow'};return {...check,points,destination:hit.p,hit:hit.kind,ticks:tick+1};}
   a.p=next;if(tick%6===0)points.push([...next]);if(next[1]<-8)break;
  }return {points,ok:false,reason:'no landing in range'};
 }
 function setWeapon(s,type){if(!['bow','crossbow'].includes(type)||s.phase!=='playing')return false;s.weapon=type;emit(s,'equip',{weapon:type});return true;}
 function reload(s,physical=false){if(s.phase!=='playing'||s.weapon!=='crossbow'||s.crossbow.loaded||s.crossbow.reload>0||s.shield)return false;s.crossbow.reload=physical?(s.quickwind?.35:.48):(s.quickwind?1.05:1.55);s.crossbow.reloadDuration=s.crossbow.reload;emit(s,'reload',{physical:!!physical});return true;}
 function shield(s,pose){if(!pose){s.shield=null;return false;}if(s.phase!=='playing'||s.guard<=0||s.guardLock>0||!pose.p||!pose.normal||pose.p.length!==3||pose.normal.length!==3||![...pose.p,...pose.normal].every(Number.isFinite)||len(sub(pose.p,s.head))>1.35||Math.abs(len(pose.normal)-1)>.01||segmentBlocked(s.world,s.head,pose.p)) {s.shield=null;return false;}
  s.shield={p:[...pose.p],normal:[...pose.normal],radius:.62};return true;
 }
 function shieldHit(s,a,b){const sh=s.shield;if(!sh||s.guard<18)return null;const da=dot(sub(a,sh.p),sh.normal),db=dot(sub(b,sh.p),sh.normal);if(da<0||db>0||da-db<1e-8)return null;const t=da/(da-db),p=add(a,mul(sub(b,a),t));return len(sub(p,sh.p))<=sh.radius?{t,p}:null;}
 function block(s,p){s.guard=Math.max(0,s.guard-18);s.blocks++;s.sparks.push({p:[...p],life:.3,type:'guard'});emit(s,'block',{p:[...p]});if(s.guard<18){s.shield=null;s.guardLock=1.8;emit(s,'guard-broken');}}
 function shard(s,direction){if(s.phase!=='playing'||s.shardCharges<1||s.shardCD>0||!Array.isArray(direction)||direction.length!==3||!direction.every(Number.isFinite))return false;
  const horizontal=unit([direction[0],0,direction[2]]);if(len(horizontal)<.5)return false;
  let end=[...s.p],distance=0;for(let n=1;n<=32;n++){const q=add(s.p,mul(horizontal,n*.125));q[1]=end[1];const nextY=architecture.floorAt(s.world,q,0,.15,.15);if(nextY===null)break;q[1]=nextY;
   if(!walkable(s.world,q,.42)||segmentBlocked(s.world,add(end,[0,.8,0]),add(q,[0,.8,0]),.26)||s.world.enemies.some(e=>!e.dead&&Math.hypot(e.p[0]-q[0],e.p[2]-q[2])<1.2))break;
   end=q;distance=n*.125;
  }
  if(distance<.75){emit(s,'shard-denied');return false;}s.p=end;s.shardCharges--;s.shardCD=.3;s.shardRecharge=s.shardRecharge||3.5;s.shardsUsed++;s.invuln=Math.max(s.invuln,.12);emit(s,'shard',{p:[...end],distance});return true;
 }
 function hurt(s,n){if(s.invuln>0||s.phase!=='playing')return;s.health=Math.max(0,s.health-n);s.damageTaken+=n;s.invuln=.8;emit(s,'hurt',{amount:n});if(!s.health){s.phase='dead';emit(s,'death');}}
 function step(s,dt,head=s.head){dt=clamp(dt,0,.04);if(s.phase!=='playing')return;s.time+=dt;s.playerSlow=Math.max(0,(s.playerSlow||0)-dt);s.head=[...head];s.invuln=Math.max(0,s.invuln-dt);s.blinkCD=Math.max(0,s.blinkCD-dt);s.shardCD=Math.max(0,s.shardCD-dt);s.guardLock=Math.max(0,s.guardLock-dt);
  if(s.shield){s.guard=Math.max(0,s.guard-8*dt);if(s.guard<18){s.shield=null;s.guardLock=1.8;}}else if(!s.guardLock)s.guard=Math.min(s.maxGuard,s.guard+22*dt);
  if(s.crossbow.reload>0){s.crossbow.reload=Math.max(0,s.crossbow.reload-dt);if(s.crossbow.reload===0){s.crossbow.loaded=true;emit(s,'reloaded');}}
  if(s.shardCharges<s.maxShards){s.shardRecharge-=dt;if(s.shardRecharge<=0){s.shardCharges++;s.shardRecharge=3.5;}}

  for(const a of s.arrows)arrowStep(s,a,dt);s.arrows=s.arrows.filter(a=>!a.dead);
  if(!s.manualPickups)s.world.pickups.forEach((p,i)=>{if(!p.taken&&Math.hypot(p.p[0]-s.p[0],p.p[2]-s.p[2])<1&&Math.abs(p.p[1]-(s.p[1]+.3))<.65){const origin=add(s.p,[0,.5,0]);if(!segmentBlocked(s.world,origin,p.p,.01))grantPickup(s,p);}});
  for(const e of s.world.enemies)encounters.update(s,e,dt,enemyAPI);
  dominions.bestiary.hazards(s,dt,enemyAPI);
  for(const b of s.bolts){const end=add(b.p,mul(b.v,dt));const wall=s.world.solids.reduce((v,w)=>{const t=boxHit(b.p,end,w,.06);return t!==null?Math.min(t,v):v;},2),body=sphereHit(b.p,end,s.head,.22),guard=shieldHit(s,b.p,end);if(guard&&guard.t<wall&&(body===null||guard.t<body)){block(s,guard.p);b.life=0;}else if(body!==null&&body<wall){const hp=s.health;hurt(s,b.damage||12);if(s.health<hp&&b.slow)s.playerSlow=Math.max(s.playerSlow||0,b.slow);b.life=0;}else if(wall<=1)b.life=0;b.p=end;b.life-=dt;}s.bolts=s.bolts.filter(b=>b.life>0);
  if(s.world.dominions){
   s.discovered.add(roomAt(s.world,s.p));
   const outer=[...s.discovered].filter(i=>s.world.rooms[i]?.outer).length,relics=s.world.pickups.filter(p=>p.kind==='relic'&&p.taken).length,orders=[...s.orders].filter(k=>dominions.bestiary.catalog[k]).length;
   if(!s.unscored)for(const [key,ready]of[['survey',outer===16],['reliquary',relics>=8],['orders',orders===12]])if(ready&&!s.sideRewards.has(key)){s.sideRewards.add(key);s.score+=200;s.health=Math.min(s.maxHealth,s.health+15);s.ammo.cinder+=2;s.ammo.frost+=2;emit(s,'side-expedition',{key});}
  }
  for(const f of s.sparks)f.life-=dt;s.sparks=s.sparks.filter(f=>f.life>0).slice(-32);
  if(!s.portalReady&&s.world.enemies.filter(e=>e.required!==false).every(e=>e.dead)){s.portalReady=true;emit(s,'gate-open');}
 }
 function interact(s){const r=s.world.rooms[s.world.exit];if(s.phase!=='playing')return false;if(s.portalReady&&Math.abs(s.p[1])<.5&&Math.hypot(s.p[0]-r.x,s.p[2]-(r.z-3.8))<2.7){s.phase='reward';s.finished=true;s.sectors++;emit(s,'sector-complete');return true;}return false;}
 function reward(s,type){if(s.phase!=='reward'||!['vitality','power','supplies'].includes(type))return null;const n=create(s.world.seed,s.world.depth+1,{challenge:s.challenge?'nightfall':'normal'});n.maxHealth=s.maxHealth+(type==='vitality'?12:0);n.health=Math.min(n.maxHealth,s.health+35);n.power=s.power+(type==='power'?.12:0);n.ammo={cinder:s.ammo.cinder+(type==='supplies'?6:2),frost:s.ammo.frost+(type==='supplies'?6:2)};n.ricochetUnlocked=s.ricochetUnlocked;n.ammo.ricochet=(s.ammo.ricochet||0)+(s.ricochetUnlocked?3:0);if(s.ricochetUnlocked)addRicochetLoot(n.world);n.weapon=s.weapon;n.quickwind=s.quickwind;n.volleyUnlocked=s.volleyUnlocked;n.ammo.volley=(s.ammo.volley||0)+(s.volleyUnlocked?3:0);n.maxGuard=s.maxGuard;n.guard=n.maxGuard;n.maxShards=s.maxShards;n.shardCharges=n.maxShards;for(const key of['headshots','blocks','blinks','shardsUsed','sectors'])n[key]=s[key];n.score=s.score+200;n.kills=s.kills;n.shots=s.shots;n.hits=s.hits;return n;}
 const enemyAPI={add,sub,mul,unit,len,walkable,floorAt,route,roomAt,segmentBlocked,emit,shieldHit,block,hurt};
 const api={emit,collectPickup,wallNormal,VERSION,G,clamp,add,sub,mul,dot,len,unit,hash,rng,boxHit,sphereHit,floorAt,floorHit:architecture.floorHit,walkable,segmentBlocked,route,roomAt,generate,drawState,create,fire,move,blink,landing,predictBlink,setWeapon,reload,shield,shieldHit,shard,step,interact,reward};root.VesperCore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
