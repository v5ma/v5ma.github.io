/* Vesperfall: deterministic mechanics in metres and seconds. No DOM or assets.
 * Static collision geometry also drives rendering. All projectile hits sweep
 * between positions so a fast arrow cannot tunnel through a thin wall. */
(function(root){'use strict';
 const VERSION='0.2.0',G=9.8,R=.28;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),len=a=>Math.hypot(...a),unit=a=>mul(a,1/(len(a)||1));
 function hash(text){let h=2166136261;for(const c of String(text).slice(0,64))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
 function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
 function shuffle(a,r){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function boxHit(a,b,box,pad=0){let lo=0,hi=1;for(let k=0;k<3;k++){const d=b[k]-a[k],min=box.min[k]-pad,max=box.max[k]+pad;if(Math.abs(d)<1e-9){if(a[k]<min||a[k]>max)return null;}else{let t=(min-a[k])/d,u=(max-a[k])/d;if(t>u)[t,u]=[u,t];lo=Math.max(lo,t);hi=Math.min(hi,u);if(lo>hi)return null;}}return lo;}
 function sphereHit(a,b,c,r){const d=sub(b,a),o=sub(a,c),A=dot(d,d),B=2*dot(o,d),C=dot(o,o)-r*r;if(C<=0)return 0;const D=B*B-4*A*C;if(D<0||A<1e-10)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?t:null;}
 function rect(x,z,w,d,y=0,type='stone'){return {x,z,w,d,y,type};}
 function inside(p,s,margin=0){return p[0]>=s.x-s.w/2+margin&&p[0]<=s.x+s.w/2-margin&&p[2]>=s.z-s.d/2+margin&&p[2]<=s.z+s.d/2-margin;}
 const architecture=root.CloisterLayout||(typeof require!=='undefined'?require('./architecture.js'):null);
 function floorAt(world,p,margin=0){return architecture.floorAt(world,p,margin);}
 function walkable(world,p,r=R){const y=architecture.floorAt(world,p,0,.42,.55);return y!==null&&[[0,0],[r,0],[-r,0],[0,r],[0,-r]].every(([x,z])=>architecture.floorAt(world,[p[0]+x,y,p[2]+z],0,.42,.55)!==null)&&!world.solids.some(b=>p[0]>b.min[0]-r&&p[0]<b.max[0]+r&&p[2]>b.min[2]-r&&p[2]<b.max[2]+r&&b.max[1]>y+.1&&b.min[1]<y+1.65);}
 function segmentBlocked(world,a,b,pad=0){return world.solids.some(w=>boxHit(a,b,w,pad)!==null);}
 function route(world,from,to){const q=[from],prev=new Map([[from,null]]);for(let i=0;i<q.length;i++)for(const n of world.links[q[i]])if(!prev.has(n)){prev.set(n,q[i]);q.push(n);}if(!prev.has(to))return [];const out=[];for(let n=to;n!==null;n=prev.get(n))out.unshift(n);return out;}
 function roomAt(world,p){let id=0,dist=Infinity;for(const r of world.rooms){const d=Math.hypot(r.x-p[0],r.z-p[2]);if(d<dist){dist=d;id=r.id;}}return id;}
 function generate(seed,depth=1){
  const random=rng((hash(seed)+Math.imul(depth,1013904223))>>>0),rooms=[],links=Array.from({length:9},()=>[]),edges=[],floors=[],solids=[];
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){const id=row*3+col;rooms.push({id,x:(col-1)*20,z:-row*20,style:Math.floor(random()*3)});floors.push(rect((col-1)*20,-row*20,14,14));}
  const done=new Set([1]),stack=[1];while(stack.length){const a=stack.at(-1),ns=shuffle([a%3>0?a-1:-1,a%3<2?a+1:-1,a>2?a-3:-1,a<6?a+3:-1].filter(n=>n>=0&&!done.has(n)),random);if(!ns.length){stack.pop();continue;}const b=ns[0];edges.push([a,b]);done.add(b);stack.push(b);}
  const extras=shuffle(rooms.flatMap(r=>[r.id%3<2?[r.id,r.id+1]:null,r.id<6?[r.id,r.id+3]:null].filter(Boolean)).filter(([a,b])=>!edges.some(e=>e.includes(a)&&e.includes(b))),random).slice(0,2);edges.push(...extras);
  for(const [a,b]of edges){links[a].push(b);links[b].push(a);const p=rooms[a],q=rooms[b];floors.push(rect((p.x+q.x)/2,(p.z+q.z)/2,p.x===q.x?4:8,p.z===q.z?4:8,0,'bridge'));}
  const wall=(x,y,z,w,h,d,type='wall')=>{solids.push({min:[x-w/2,y-h/2,z-d/2],max:[x+w/2,y+h/2,z+d/2],type});};
  for(const r of rooms){for(const [dx,dz]of[[-6,-6],[6,-6],[-6,6],[6,6]])wall(r.x+dx,2,r.z+dz,.9,4,.9,'column');
   // Perimeter walls have open doorways only at actual graph connections.
   for(const [dx,dz,n]of[[-1,0,r.id%3?r.id-1:-1],[1,0,r.id%3<2?r.id+1:-1],[0,-1,r.id<6?r.id+3:-1],[0,1,r.id>2?r.id-3:-1]]){
    if(links[r.id].includes(n)){for(const s of[-1,1])wall(r.x+dx*6.8+Math.abs(dz)*s*4.9,1.4,r.z+dz*6.8+Math.abs(dx)*s*4.9,dx?.45:3.7,2.8,dz?.45:3.7);}
    else wall(r.x+dx*6.8,1.2,r.z+dz*6.8,dx?.45:13.4,2.4,dz?.45:13.4);
   }
   if(r.id!==1){for(const s of[-1,1])if(random()>.25)wall(r.x+s*3.2,.55,r.z+(random()>.5?2.4:-2.4),1.7,1.1,1.25,'cover');}
  }
  const world={seed:String(seed).slice(0,32),depth,rooms,links,edges,floors,solids,start:[0,0,3],exit:null,enemies:[],targets:[[-3,1.5,-3],[0,1.5,-4],[3,1.5,-3]],pickups:[]};
  const candidates=rooms.filter(r=>r.id!==1).sort((a,b)=>route(world,1,b.id).length-route(world,1,a.id).length);world.exit=candidates[0].id;
  const occupied=shuffle(rooms.filter(r=>r.id!==1&&r.id!==world.exit),random).slice(0,4);occupied.push(rooms[world.exit]);
  for(let i=0;i<occupied.length;i++){const r=occupied[i];world.enemies.push({id:i,room:r.id,p:[r.x,1.05,r.z],hp:i===4?110+depth*8:65+depth*5,maxHp:i===4?110+depth*8:65+depth*5,kind:i===4?'warden':i%2?'stalker':'cantor',speed:i===4?.65:i%2?.95:.4,cd:2+i*.4,wind:0,slow:0,dead:false,aware:false});}
  for(const r of rooms.filter(r=>r.id!==1))world.pickups.push({id:r.id,p:[r.x-3.4,.3,r.z],kind:r.id%3===0?'health':r.id%2?'cinder':'frost',taken:false});
  return architecture.augment(world);
 }
 function drawState(bow,string,maxDraw=.56){if(!bow||!string||!bow.every(Number.isFinite)||!string.every(Number.isFinite))return null;const v=sub(bow,string),d=len(v);if(d<.045||d>1.05)return null;return {direction:unit(v),charge:clamp((d-.08)/clamp(maxDraw,.3,.75),0,1),distance:d};}
 function create(seed='BELL-01',depth=1,upgrades={}){const world=generate(seed,depth);return {world,p:[...world.start],head:[0,1.65,3],health:100+(upgrades.heart?15:0),maxHealth:100+(upgrades.heart?15:0),power:upgrades.power?1.08:1,phase:'playing',time:0,arrows:[],bolts:[],sparks:[],events:[],score:0,kills:0,shots:0,hits:0,blinkCD:0,invuln:0,ammo:{cinder:4,frost:6},type:'plain',finished:false,portalReady:false,damageTaken:0,targets:new Set()};}
 function emit(s,type,data={}){s.eventSeq=(s.eventSeq||0)+1;s.events.push({seq:s.eventSeq,type,time:s.time,...data});if(s.events.length>160)s.events.shift();}
 function fire(s,origin,direction,charge,type=s.type){
  if(s.phase!=='playing'||!Number.isFinite(charge)||origin.length!==3||direction.length!==3||!origin.every(Number.isFinite)||!direction.every(Number.isFinite)||Math.abs(len(direction)-1)>.01||charge<.08)return false;
  if(!['plain','cinder','frost','blink'].includes(type))return false;if(type==='blink'&&s.blinkCD>0)return false;if(type in s.ammo&&s.ammo[type]<=0)return false;
  if(segmentBlocked(s.world,s.head,origin)||floorAt(s.world,s.p)===null)return false;
  charge=clamp(charge,0,1);if(type in s.ammo)s.ammo[type]--;if(type==='blink')s.blinkCD=.85;else s.shots++;
  const speed=type==='blink'?7+charge*10:12+charge*24,arrow={p:[...origin],v:mul(direction,speed),type,damage:(24+charge*48)*s.power,life:4,dead:false};s.arrows.push(arrow);if(s.arrows.length>48)s.arrows.shift();emit(s,'shot',{arrow:type,charge});return true;
 }
 function move(s,dx,dz){if(s.phase!=='playing'||!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)>5)return;const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));for(let i=0;i<n;i++){const x=s.p[0]+dx/n,z=s.p[2]+dz/n;if(walkable(s.world,[x,s.p[1],s.p[2]])){s.p[0]=x;s.p[1]=floorAt(s.world,s.p);}if(walkable(s.world,[s.p[0],s.p[1],z])){s.p[2]=z;s.p[1]=floorAt(s.world,s.p);}}}
 function blink(s,p){if(!walkable(s.world,p,.42)||s.world.enemies.some(e=>!e.dead&&Math.hypot(e.p[0]-p[0],e.p[2]-p[2])<1.25))return false;s.p=[p[0],floorAt(s.world,p),p[2]];s.invuln=Math.max(s.invuln,.25);emit(s,'blink',{p:[...s.p]});return true;}
 function damageEnemy(s,e,amount,type,head=false){if(e.dead)return;e.hp-=amount;e.aware=true;if(type==='frost')e.slow=4;s.sparks.push({p:[...e.p],life:.25,type});if(e.hp<=0){e.dead=true;s.kills++;s.score+=(e.kind==='warden'?250:100)+(head?25:0);emit(s,'kill',{id:e.id,kind:e.kind});}else emit(s,'hit',{id:e.id,head});}
 function strike(s,a,hit){
  if(hit.kind==='enemy'){s.hits++;damageEnemy(s,hit.enemy,a.damage*(hit.head?1.5:1),a.type,hit.head);if(a.type==='cinder')for(const e of s.world.enemies)if(e!==hit.enemy&&!e.dead&&len(sub(e.p,hit.p))<3&&!segmentBlocked(s.world,hit.p,e.p))damageEnemy(s,e,a.damage*.65,'cinder');}
  else if(hit.kind==='target'){if(!s.targets.has(hit.id)){s.targets.add(hit.id);s.score+=10;emit(s,'target',{id:hit.id});}}
  else if(hit.kind==='floor'&&a.type==='blink'){if(!blink(s,hit.p))emit(s,'blink-denied');}
  s.sparks.push({p:hit.p,life:.3,type:a.type});a.dead=true;
 }
 function arrowStep(s,a,dt){const old=[...a.p];a.v[1]-=G*dt;const next=add(old,mul(a.v,dt));let best=null;const candidate=(t,h)=>{if(t!==null&&t>=0&&t<=1&&(!best||t<best.t))best={t,...h};};
  for(const b of s.world.solids)candidate(boxHit(old,next,b,.02),{kind:'wall'});
  if(a.type!=='blink'){
   for(const e of s.world.enemies)if(!e.dead){candidate(sphereHit(old,next,add(e.p,[0,.62,0]),e.kind==='warden'?.36:.25),{kind:'enemy',enemy:e,head:true});candidate(sphereHit(old,next,e.p,e.kind==='warden'?.65:.48),{kind:'enemy',enemy:e,head:false});}
   s.world.targets.forEach((t,i)=>{if(!s.targets.has(i))candidate(sphereHit(old,next,t,.5),{kind:'target',id:i});});
  }
  const floor=architecture.floorHit(s.world,old,next);if(floor)candidate(floor.t,{kind:'floor',landing:floor.p});
  if(best){best.p=best.landing||add(old,mul(sub(next,old),best.t));strike(s,a,best);}else a.p=next;
  a.life-=dt;if(a.life<=0||a.p[1]<-8)a.dead=true;
 }
 function hurt(s,n){if(s.invuln>0||s.phase!=='playing')return;s.health=Math.max(0,s.health-n);s.damageTaken+=n;s.invuln=.8;emit(s,'hurt',{amount:n});if(!s.health){s.phase='dead';emit(s,'death');}}
 function step(s,dt,head=s.head){dt=clamp(dt,0,.04);if(s.phase!=='playing')return;s.time+=dt;s.head=[...head];s.invuln=Math.max(0,s.invuln-dt);s.blinkCD=Math.max(0,s.blinkCD-dt);
  for(const a of s.arrows)arrowStep(s,a,dt);s.arrows=s.arrows.filter(a=>!a.dead);
  for(const p of s.world.pickups)if(!p.taken&&Math.hypot(p.p[0]-s.p[0],p.p[2]-s.p[2])<1){p.taken=true;if(p.kind==='health')s.health=Math.min(s.maxHealth,s.health+25);else s.ammo[p.kind]+=3;emit(s,'pickup',{kind:p.kind});}
  for(const e of s.world.enemies){if(e.dead)continue;e.slow=Math.max(0,e.slow-dt);const distance=len(sub(e.p,s.head)),visible=distance<17&&!segmentBlocked(s.world,add(e.p,[0,.5,0]),s.head);if(visible)e.aware=true;if(!e.aware)continue;
   e.cd-=dt;if(e.wind>0){e.wind-=dt;if(e.wind<=0&&visible){if(distance<2.1&&e.kind==='stalker')hurt(s,14);else{s.bolts.push({p:add(e.p,[0,.45,0]),v:mul(unit(sub(s.head,add(e.p,[0,.45,0]))),e.kind==='warden'?5.5:4.5),life:6});emit(s,'enemy-shot');}}}
   else if(visible&&e.cd<=0){e.wind=.8;e.cd=(e.kind==='warden'?2.3:3.6);}
   if(e.wind<=0&&distance>2.2){const er=roomAt(s.world,e.p),pr=roomAt(s.world,s.p),path=route(s.world,er,pr),goal=path.length>1?s.world.rooms[path[1]]:{x:s.p[0],z:s.p[2]};const dx=goal.x-e.p[0],dz=goal.z-e.p[2],d=Math.hypot(dx,dz)||1,v=e.speed*(e.slow>0?.3:1)*dt;if(walkable(s.world,[e.p[0]+dx/d*v,0,e.p[2]+dz/d*v],.4)){e.p[0]+=dx/d*v;e.p[2]+=dz/d*v;}}
  }
  for(const b of s.bolts){const end=add(b.p,mul(b.v,dt));const wall=s.world.solids.reduce((v,w)=>{const t=boxHit(b.p,end,w,.06);return t!==null?Math.min(t,v):v;},2),body=sphereHit(b.p,end,s.head,.22);if(body!==null&&body<wall){hurt(s,12);b.life=0;}else if(wall<=1)b.life=0;b.p=end;b.life-=dt;}s.bolts=s.bolts.filter(b=>b.life>0);
  for(const f of s.sparks)f.life-=dt;s.sparks=s.sparks.filter(f=>f.life>0).slice(-32);
  if(!s.portalReady&&s.world.enemies.every(e=>e.dead)){s.portalReady=true;emit(s,'gate-open');}
 }
 function interact(s){const r=s.world.rooms[s.world.exit];if(s.phase!=='playing')return false;if(s.portalReady&&Math.abs(s.p[1])<.5&&Math.hypot(s.p[0]-r.x,s.p[2]-(r.z-3.8))<2.7){s.phase='reward';s.finished=true;emit(s,'sector-complete');return true;}return false;}
 function reward(s,type){if(s.phase!=='reward'||!['vitality','power','supplies'].includes(type))return null;const n=create(s.world.seed,s.world.depth+1);n.maxHealth=s.maxHealth+(type==='vitality'?12:0);n.health=Math.min(n.maxHealth,s.health+35);n.power=s.power+(type==='power'?.12:0);n.ammo={cinder:s.ammo.cinder+(type==='supplies'?6:2),frost:s.ammo.frost+(type==='supplies'?6:2)};n.score=s.score+200;n.kills=s.kills;n.shots=s.shots;n.hits=s.hits;return n;}
 const api={VERSION,G,clamp,add,sub,mul,dot,len,unit,hash,rng,boxHit,sphereHit,floorAt,floorHit:architecture.floorHit,walkable,segmentBlocked,route,roomAt,generate,drawState,create,fire,move,blink,step,interact,reward};root.VesperCore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
