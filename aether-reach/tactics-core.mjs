/* Original tactical systems, independent of renderer and browser input.
 * Services use the SAME occlusion, damage and save rules as the main game.
 * This is a deterministic single-player scenario, not network authority. */
export const FIELD_BENCH=Object.freeze({x:7,y:0,z:4,name:'Field Engineering'});
export const RECOVERY=Object.freeze({x:5,y:3,z:-49,name:'Atrium Salvage Relay',duration:48,hull:180,reward:180});
export const SECURITY=Object.freeze({x:7,y:3,z:-44,name:'Atrium Security Junction'});
export const TURRET=Object.freeze({x:8,y:4.5,z:-46});
export const POWERS=Object.freeze({pulse:{name:'Pulse',cost:45,color:'#82e9d4',description:'Original close-range stun. Q / LB / left trigger.'},current:{name:'Current',cost:28,color:'#88dfff',description:'Aimed electrical discharge. Water conducts it to nearby machines.'},cinder:{name:'Cinder',cost:32,color:'#ffb075',description:'Aimed heat charge. Oil burns as an area-denial trap.'}});
export const MODULES=Object.freeze({insulator:{name:'Insulator',description:'Take 65% less damage from your own charged water and burning oil.'},capacitor:{name:'Capacitor',description:'Scan one enemy class: Current/Cinder cost 25% less energy.'},catalyst:{name:'Catalyst',description:'Scan two classes: guns deal 20% more damage to shocked or burning machines.'},engineer:{name:'Engineer',description:'Hack security: your friendly turret deals 40% more damage.'}});
export const PATCHES=Object.freeze([
 {id:'quay-water',type:'water',x:14,y:0,z:-4,r:2.2},
 {id:'atrium-water',type:'water',x:0,y:3,z:-44,r:3.5},
 {id:'atrium-oil',type:'oil',x:-5,y:3,z:-49,r:2.5},
 {id:'garden-water',type:'water',x:66,y:6,z:-22,r:4},
 {id:'works-oil',type:'oil',x:-24,y:12,z:-83,r:2.6}
]);
export const CIRCUIT_INITIAL=Object.freeze([3,5,3,3,5,6,3,5,3]); // NESW bitmask
export const KINDS=Object.freeze(['target','scout','heavy','sentry']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const planar=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),inside=(b,p)=>planar(b,p)<=p.r&&b.y>=p.y-.3&&b.y<=p.y+5.5;
export function rotateCircuit(mask){return ((mask<<1)&15)|(mask>>3);}
export function connectedCircuit(cells){
 if(!Array.isArray(cells)||cells.length!==9||cells.some(x=>!Number.isInteger(x)||x<1||x>15)||!(cells[3]&8))return {connected:false,path:[]};
 const open=[3],seen=new Set([3]),parents=new Map();
 while(open.length){const at=open.shift();if(at===5&&(cells[at]&2)){const path=[];for(let i=at;i!==undefined;i=parents.get(i))path.unshift(i);return {connected:true,path};}
  for(const [dr,dc,out,input] of [[-1,0,1,4],[0,1,2,8],[1,0,4,1],[0,-1,8,2]]){const r=Math.floor(at/3)+dr,c=at%3+dc,next=r*3+c;if(r<0||r>2||c<0||c>2||seen.has(next)||!(cells[at]&out)||!(cells[next]&input))continue;seen.add(next);parents.set(next,at);open.push(next);}
 }return {connected:false,path:[]};
}
export function cleanTactics(value){const v=value&&typeof value==='object'?value:{};return {version:1,learned:v.learned===true,power:Object.hasOwn(POWERS,v.power)?v.power:'pulse',module:Object.hasOwn(MODULES,v.module)?v.module:'insulator',research:[...new Set(Array.isArray(v.research)?v.research.filter(k=>KINDS.includes(k)):[])],hacked:v.hacked===true,completed:v.completed===true};}
export function saveTactics(s){return cleanTactics(s.tactics);}
export function createTactics({solids,clearLine,rayBox,raySphere,forward,emit,defeated,hurt}){
 const eye=s=>({x:s.p.x,y:s.p.y+1.6,z:s.p.z});
 const near=(s,o,r=3)=>!s.p.rail&&s.p.grounded&&dist(s.p,o)<r&&clearLine(eye(s),{...o,y:o.y+1.1});
 const unlocked=(t,k)=>k==='insulator'||k==='capacitor'&&t.research.length>=1||k==='catalyst'&&t.research.length>=2||k==='engineer'&&t.hacked;
 function init(s,value){const t=s.tactics={...cleanTactics(value),cooldown:0,scanCooldown:0,flash:0,comboAt:-10,circuit:[...CIRCUIT_INITIAL],hazards:Object.fromEntries(PATCHES.map(p=>[p.id,0])),projectiles:[],encounter:{phase:'idle',time:0,hull:RECOVERY.hull,wave:0,kills:0,turretCooldown:0},metrics:{casts:0,combos:0,areaHits:0,turretHits:0}};if(!unlocked(t,t.module))t.module='insulator';}
 function target(s,aim=null,range=32){let o=eye(s),d=forward(s.p.yaw,s.p.pitch);if(aim){if(!aim.origin||!aim.direction||!['x','y','z'].every(k=>Number.isFinite(aim.origin[k])&&Number.isFinite(aim.direction[k])))return null;const l=Math.hypot(aim.direction.x,aim.direction.y,aim.direction.z);if(l<.001||dist(o,aim.origin)>2.5||!clearLine(o,aim.origin))return null;o={...aim.origin};d={x:aim.direction.x/l,y:aim.direction.y/l,z:aim.direction.z/l};}
  let limit=range,result=null;for(const b of solids){const t=rayBox(o,d,b,limit);if(t!==null)limit=t;}
  for(const b of s.drones){if(b.hp<=0)continue;const t=raySphere(o,d,b,b.kind==='heavy'?1.5:1.15);if(t!==null&&t<limit){limit=t;result={kind:'enemy',enemy:b};}}
  for(const p of PATCHES){if(Math.abs(d.y)<.0001)continue;const t=(p.y+.06-o.y)/d.y;if(t<=0||t>=limit)continue;const hit={x:o.x+d.x*t,y:o.y+d.y*t,z:o.z+d.z*t};if(planar(hit,p)<=p.r){limit=t;result={kind:'patch',patch:p};}}
  return {o,d,end:{x:o.x+d.x*limit,y:o.y+d.y*limit,z:o.z+d.z*limit},...result};
 }
 function damage(s,b,n,source){if(b.hp<=0)return;b.hp-=n;if(b.hp<=0)defeated(s,b);else if(n>=1||s.time-(b.fieldHitAt??-1)>=.12){b.fieldHitAt=s.time;emit(s,'hit',{id:b.id,damage:n});}if(source==='area')s.tactics.metrics.areaHits++;}
 function choose(s,power){if(!Object.hasOwn(POWERS,power)||power!=='pulse'&&!s.tactics.learned||s.won)return false;s.tactics.power=power;emit(s,'save');return true;}
 function module(s,name){if(s.won||!s.p.grounded||s.p.rail||s.tactics.encounter.phase==='active'||!unlocked(s.tactics,name))return false;s.tactics.module=name;emit(s,'save');return true;}
 function cast(s,aim=null){const t=s.tactics,p=s.p,power=t.power;if(s.won||!t.learned||power==='pulse'||t.cooldown>0)return false;const cost=POWERS[power].cost*(t.module==='capacitor'?.75:1);if(p.energy<cost)return false;const hit=target(s,aim);if(!hit)return false;p.energy-=cost;t.cooldown=.7;t.flash=.3;t.metrics.casts++;
  const b=hit.enemy;let patch=hit.patch||PATCHES.find(area=>b&&inside(b,area));
  if(b){if(power==='current'){b.shocked=3.2;b.stun=Math.max(b.stun,2.4);damage(s,b,patch?.type==='water'?55:28,'cast');}else{b.burning=5;damage(s,b,22,'cast');}}
  if(patch&&(power==='current'&&patch.type==='water'||power==='cinder'&&patch.type==='oil')){t.hazards[patch.id]=power==='current'?4.5:7;emit(s,'tactical-hazard',{id:patch.id,power});for(const other of s.drones)if(other!==b&&other.hp>0&&inside(other,patch)&&clearLine({...patch,y:patch.y+.35},other)){if(power==='current'){other.shocked=3;other.stun=Math.max(other.stun,2);}else other.burning=5;damage(s,other,power==='current'?28:18,'area');}}
  emit(s,'tactical-cast',{power,o:hit.o,end:hit.end,hit:!!hit.kind});return true;
 }
 function scan(s,aim=null){if(s.won||!s.tactics.learned||s.tactics.scanCooldown>0)return false;const hit=target(s,aim,45),b=hit?.enemy;if(!b||!KINDS.includes(b.kind)||s.tactics.research.includes(b.kind))return false;s.tactics.scanCooldown=2;s.tactics.research.push(b.kind);emit(s,'survey',{kind:b.kind});emit(s,'save');return true;}
 function multiplier(s,b){const t=s.tactics,afflicted=(b.shocked||0)>0||(b.burning||0)>0;return 1+(t.research.includes(b.kind)?.1:0)+(t.module==='catalyst'&&afflicted?.2:0);}
 function onHit(s,b){if(((b.shocked||0)>0||(b.burning||0)>0)&&s.time-s.tactics.comboAt>.09){s.tactics.comboAt=s.time;s.tactics.metrics.combos++;emit(s,'tactical-combo',{id:b.id,power:b.shocked>0?'current':'cinder'});}}
 function nearby(s){if(near(s,FIELD_BENCH))return {type:'field-bench',label:'E · Field Engineering / powers and builds'};if(near(s,SECURITY,2.7))return {type:'field-hack',label:s.tactics.hacked?'E · Friendly security / field kit':'E · Rewire security junction'};if(near(s,RECOVERY,2.7))return {type:'field-relay',label:'E · Atrium recovery / prepare and defend'};return null;}
 function handle(s,type){if(type==='field-bench'){if(!near(s,FIELD_BENCH))return false;if(!s.tactics.learned){s.tactics.learned=true;emit(s,'save');}emit(s,'field-open',{page:'kit'});return true;}if(type==='field-hack'&&near(s,SECURITY,2.7)){emit(s,'field-open',{page:s.tactics.hacked?'kit':'hack'});return true;}if(type==='field-relay'&&near(s,RECOVERY,2.7)){emit(s,'field-open',{page:'relay'});return true;}return false;}
 function turn(s,index){if(s.won||s.tactics.hacked||!near(s,SECURITY,2.7)||!Number.isInteger(index)||index<0||index>8)return false;s.tactics.circuit[index]=rotateCircuit(s.tactics.circuit[index]);return true;}
 function hack(s){if(s.won||s.tactics.hacked||!near(s,SECURITY,2.7)||!connectedCircuit(s.tactics.circuit).connected)return false;s.tactics.hacked=true;emit(s,'tactical-hack');emit(s,'save');return true;}
 function start(s){if(s.won||!near(s,RECOVERY,2.7)||s.tactics.encounter.phase==='active')return false;s.drones=s.drones.filter(b=>!b.tactical);s.tactics.projectiles=[];s.tactics.encounter={phase:'active',time:0,hull:RECOVERY.hull,wave:0,kills:0,turretCooldown:0};emit(s,'tactical-start');return true;}
 function end(s,reason){if(s.tactics.encounter.phase!=='active')return;s.tactics.encounter.phase=reason;s.drones=s.drones.filter(b=>!b.tactical);s.tactics.projectiles=[];emit(s,'tactical-end',{reason});}
 function killed(s,b){if(!b.tactical)return false;if(b.credited)return true;b.credited=true;s.stats.defeated++;s.tactics.encounter.kills++;emit(s,'defeat',{id:b.id});return true;}
 function wave(s,n){const xs=[-8,-6.5,7.5,-8,-5,4],zs=[-39,-51,-37,-46,-39,-37];for(let j=0;j<2;j++){const i=n*2+j,kind=n===2&&j===1?'heavy':'scout',hp=kind==='heavy'?140:64;s.drones.push({id:'trial-'+i,tactical:true,kind,x:xs[i],y:5.0,z:zs[i],hp,maxHp:hp,stun:0,shocked:0,burning:0,attack:2.5,telegraph:0,origin:{x:xs[i],y:5,z:zs[i]}});}emit(s,'tactical-wave',{number:n+1});}
 function step(s,input,dt){const t=s.tactics;if(!t)return;t.cooldown=Math.max(0,t.cooldown-dt);t.scanCooldown=Math.max(0,t.scanCooldown-dt);t.flash=Math.max(0,t.flash-dt);
  for(const b of s.drones){b.shocked=Math.max(0,(b.shocked||0)-dt);if(b.hp>0&&b.burning>0){b.burning=Math.max(0,b.burning-dt);damage(s,b,7*dt,'burn');}}
  for(const patch of PATCHES){if(t.hazards[patch.id]<=0)continue;t.hazards[patch.id]=Math.max(0,t.hazards[patch.id]-dt);for(const b of s.drones)if(b.hp>0&&inside(b,patch)&&clearLine({...patch,y:patch.y+.3},b)){if(patch.type==='water'){b.shocked=Math.max(b.shocked,.8);b.stun=Math.max(b.stun,.2);}else b.burning=Math.max(b.burning,1);damage(s,b,(patch.type==='water'?12:23)*dt,'area');}
   if(inside(s.p,patch)&&clearLine({...patch,y:patch.y+.3},eye(s)))hurt(s,(patch.type==='water'?7:10)*dt*(t.module==='insulator'?.35:1));
  }
  const e=t.encounter;if(e.phase!=='active')return;
  if(dist(s.p,RECOVERY)>42){end(s,'retreated');return;}e.time+=dt;
  if(e.wave<3&&e.time>2+e.wave*14){wave(s,e.wave);e.wave++;}
  const alive=s.drones.filter(b=>b.tactical&&b.hp>0);
  for(const b of alive){b.stun=Math.max(0,b.stun-dt);if(b.stun>0){b.telegraph=0;continue;}const d=planar(b,RECOVERY);if(d>6){const speed=b.kind==='heavy'?.65:1.25;b.x+=(RECOVERY.x-b.x)/d*speed*dt;b.z+=(RECOVERY.z-b.z)/d*speed*dt;}b.attack-=dt;b.telegraph=clamp(1-b.attack/.8,0,1);if(b.attack<=0){const dest={...RECOVERY,y:RECOVERY.y+1.2},len=dist(b,dest);if(clearLine(b,dest)&&t.projectiles.length<36)t.projectiles.push({x:b.x,y:b.y,z:b.z,vx:(dest.x-b.x)/len*9,vy:(dest.y-b.y)/len*9,vz:(dest.z-b.z)/len*9,life:4,damage:b.kind==='heavy'?18:11});b.attack=b.kind==='heavy'?3.3:3.9;}}
  if(t.hacked){e.turretCooldown-=dt;const enemy=alive.sort((a,b)=>dist(a,RECOVERY)-dist(b,RECOVERY)).find(b=>dist(TURRET,b)<23&&clearLine(TURRET,b));if(enemy&&e.turretCooldown<=0){e.turretCooldown=.8;damage(s,enemy,t.module==='engineer'?25.2:18,'turret');t.metrics.turretHits++;emit(s,'tactical-turret',{o:{...TURRET},end:{x:enemy.x,y:enemy.y,z:enemy.z}});}}
  const goal={...RECOVERY,y:RECOVERY.y+1.2};for(let i=t.projectiles.length-1;i>=0;i--){const b=t.projectiles[i],old={x:b.x,y:b.y,z:b.z};b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;if(!clearLine(old,b)){b.life=0;}else if(dist(b,goal)<1){e.hull=Math.max(0,e.hull-b.damage);b.life=0;emit(s,'tactical-impact');}if(b.life<=0)t.projectiles.splice(i,1);}
  if(e.hull<=0){end(s,'failed');return;}
  if(e.time>=RECOVERY.duration&&e.wave===3&&alive.every(b=>b.hp<=0)){const first=!t.completed;t.completed=true;end(s,'complete');if(first){s.kit.credits=Math.min(99999,s.kit.credits+RECOVERY.reward);emit(s,'tactical-reward',{credits:RECOVERY.reward});emit(s,'save');}}
  else if(e.time>100)end(s,'failed');
 }
 return {init,nearby,handle,choose,module,cast,scan,target,multiplier,onHit,turn,hack,start,step,killed,end,unlocked};
}
