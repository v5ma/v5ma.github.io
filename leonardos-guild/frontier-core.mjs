/* Region session above the retained campaign model. No networking or payments.
 * Old model-only fixtures remain usable without installing a region session;
 * every real app session installs this adapter, including reset and old saves.
 * Safety is an authoritative simulation rule, never only a HUD label. */
export const TOWN_GATE={x:0,z:-17};
export const CAMP={x:300,z:20};
export const BADLANDS={minX:208,maxX:392,minZ:6,maxZ:192};
export const CONTRACTS=Object.freeze([
 {id:'survey',name:'Three Ways Through the Hollow',text:'Survey the ridge, old orchard and ruined court. Combat is optional; paths go around the patrols.',reward:45,xp:100},
 {id:'wardens',name:'Watch Beyond the Walls',text:'Defeat three creatures outside Vinci, then report at the town gate.',reward:65,xp:140},
 {id:'folio',name:'The Lost Field Case',text:'Defeat the Hollow Warden and recover the surveyor\'s case from the court. Return it at the town gate.',reward:90,xp:200},
]);
export const FRONTIER_SITES=Object.freeze([
 {id:'return',name:'Gate Camp',x:300,z:20,kind:'exit',detail:'Return to safe Vinci. Field cargo and completed objectives are retained.'},
 {id:'ridge',name:'Cairn Ridge',x:238,z:77,kind:'beacon',detail:'Read the ridge survey stone. The west trail joins the court approach.'},
 {id:'orchard',name:'The Overgrown Orchard',x:363,z:105,kind:'beacon',detail:'Record the old irrigation channels. The east path loops behind the patrols.'},
 {id:'court',name:'The Forgotten Court',x:300,z:176,kind:'beacon',detail:'Mark the ruined court. The northern path returns along either side of the region.'},
 {id:'case',name:'Surveyor\'s Field Case',x:300,z:154,kind:'relic',detail:'The Hollow Warden guards the sealed field case.'},
 {id:'resin-west',name:'Ridge Resin',x:231,z:91,kind:'resin',detail:'Harvest two measures of resin. Each source can be collected once.'},
 {id:'resin-east',name:'Orchard Resin',x:368,z:94,kind:'resin',detail:'Harvest two measures of resin for field dressings.'},
 {id:'ore',name:'Exposed Iron',x:352,z:153,kind:'ore',detail:'Recover two pieces of iron from the collapsed wall.'},
]);
export const MONSTERS=Object.freeze([
 {id:'hollow-scout',name:'Hollow Sentinel',kind:'sentinel',x:300,z:62,hp:56,harm:9,pace:1.9,windup:1.1,ore:1,resin:0},
 {id:'cairn-wisp',name:'Cairn Wisp',kind:'wisp',x:261,z:100,hp:42,harm:7,pace:2.2,windup:1.2,ore:0,resin:1},
 {id:'orchard-guard',name:'Thornbound Sentinel',kind:'thorn',x:342,z:79,hp:70,harm:12,pace:1.7,windup:1.15,ore:1,resin:1},
 {id:'broken-watch',name:'Broken Watchman',kind:'sentinel',x:285,z:121,hp:56,harm:9,pace:1.9,windup:1.1,ore:1,resin:0},
 {id:'court-wisp',name:'Court Wisp',kind:'wisp',x:341,z:138,hp:42,harm:7,pace:2.2,windup:1.2,ore:0,resin:1},
 {id:'ridge-guard',name:'Cairn Keeper',kind:'thorn',x:256,z:143,hp:70,harm:12,pace:1.7,windup:1.15,ore:1,resin:1},
 {id:'hollow-warden',name:'The Hollow Warden',kind:'warden',x:300,z:151,hp:130,harm:17,pace:1.5,windup:1.4,ore:2,resin:1},
]);
export const TRAIL_NODES=[[300,20],[300,43],[262,50],[238,77],[238,120],[254,171],[300,176],[346,171],[363,105],[363,62],[338,43],[300,95],[300,125],[300,154]];
export const TRAIL_EDGES=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,1],[1,11],[11,12],[12,13],[13,6],[4,11],[11,8],[5,12],[12,7]];
export const FRONTIER_SOLIDS=Object.freeze([
 {id:'west-crag',x:261,z:73,hx:6,hz:9,h:5},
 {id:'east-crag',x:339,z:117,hx:4,hz:8,h:4},
 {id:'court-plinth',x:319,z:155,hx:4,hz:4,h:2.5},
 {id:'west-tomb',x:272,z:164,hx:5,hz:4,h:3},
 {id:'orchard-well',x:375,z:119,hx:3,hz:3,h:1.6},
 {id:'chapel-left',x:289,z:168,hx:1.4,hz:4,h:5},
 {id:'chapel-right',x:311,z:168,hx:1.4,hz:4,h:5},
]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const message=(s,text)=>{s.toast=text;s.toastT=5;return {ok:true,text};};
const fail=(text)=>({ok:false,text});
const ids=(v,valid)=>Array.isArray(v)?[...new Set(v.filter(x=>valid.includes(x)))]:[];
const integer=(v,max,otherwise=0)=>Number.isInteger(v)&&v>=0&&v<=max?v:otherwise;
const capacity=s=>100+12*(s.life?.attrs?.vitality||0);
export const inBadlands=s=>s.frontier?.zone==='badlands';
export const safeTown=s=>s.frontier?.zone==='town';
export const frontierHeight=(x,z)=>Math.sin((x-300)/23)*.18+Math.cos(z/18)*.15;
export function frontierState(raw){
 const r=raw?.version===1?raw:{};
 return {version:1,zone:'town',accepted:ids(r.accepted,CONTRACTS.map(c=>c.id)),reported:ids(r.reported,CONTRACTS.map(c=>c.id)),visited:ids(r.visited,['ridge','orchard','court']),defeated:ids(r.defeated,MONSTERS.map(m=>m.id)),harvested:ids(r.harvested,FRONTIER_SITES.filter(p=>['resin','ore'].includes(p.kind)).map(p=>p.id)),relic:r.relic===true,cargo:{ore:integer(r.cargo?.ore,99),resin:integer(r.cargo?.resin,99)},store:{ore:integer(r.store?.ore,999),resin:integer(r.store?.resin,999)},dressings:integer(r.dressings,3,2),selected:FRONTIER_SITES.some(p=>p.id===r.selected)?r.selected:'ridge',gateTracked:false,enemies:[],lastArea:null,notice:0};
}
export function attachFrontier(s,raw){s.frontier=frontierState(raw);return s;}
export function saveFrontier(s){if(!s.frontier)return undefined;const {zone,enemies,lastArea,notice,gateTracked,...data}=s.frontier;return JSON.parse(JSON.stringify(data));}
export function frontierBlocked(x,z,r=.33){
 if(!Number.isFinite(x)||!Number.isFinite(z))return true;
 const b=BADLANDS;if(x<b.minX+r||x>b.maxX-r||z<b.minZ+r||z>b.maxZ-r)return true;
 return FRONTIER_SOLIDS.some(b=>Math.hypot(x-clamp(x,b.x-b.hx,b.x+b.hx),z-clamp(z,b.z-b.hz,b.z+b.hz))<r);
}
export function frontierSight(a,b){const n=Math.max(1,Math.ceil(dist(a,b)/.25));for(let i=1;i<n;i++)if(frontierBlocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,.09))return false;return true;}
export function refreshMonsters(s){s.frontier.enemies=MONSTERS.map(m=>({...m,homeX:m.x,homeZ:m.z,hp:s.frontier.defeated.includes(m.id)?0:m.hp,maxHP:m.hp,phase:'patrol',timer:0,flash:0,yaw:0}));}
export function enterBadlands(s){
 if(!safeTown(s)||s.mode!=='foot'||s.doors.level||s.life.inside||dist(s,TOWN_GATE)>4||Math.abs(s.speed)>1.7)return fail('Stop on foot beside the expedition gate at the south entrance to Vinci.');
 if(s.cycle?.active)return fail('Finish or cancel the bicycle road test before leaving town.');
 s.frontier.zone='badlands';s.frontier.gateTracked=false;s.frontier.lastArea=null;
 s.x=CAMP.x;s.z=CAMP.z;s.yaw=0;s.speed=s.lift=s.vy=0;s.inv=2;s.shots=[];
 Object.assign(s.resonance,{projectiles:[],cover:null,lock:null,aim:false,fireCD:0,reload:0});s.doors.dodge=0;s.life.attackPending=false;refreshMonsters(s);
 return message(s,'Cinder Hollow: monsters stay outside town. Explore the three trails; return through this camp at any time.');
}
export function leaveBadlands(s,rescued=false){
 if(!inBadlands(s)||!rescued&&(dist(s,CAMP)>7||Math.abs(s.speed)>1.7))return fail('Return to the Gate Camp to travel safely to Vinci.');
 s.frontier.zone='town';s.frontier.enemies=[];s.frontier.lastArea=null;
 s.x=TOWN_GATE.x;s.z=TOWN_GATE.z+1;s.yaw=0;s.mode='foot';s.speed=s.lift=s.vy=0;s.inv=2;s.shots=[];s.doors.level=0;s.doors.room=null;s.life.inside=null;
 Object.assign(s.resonance,{projectiles:[],cover:null,lock:null,aim:false,reload:0,fireCD:0,special:0});
 if(rescued)s.health=capacity(s);
 return message(s,rescued?'The gate watch brings you back to safe Vinci. Your progress, cargo, money and equipment were kept.':'Vinci is safe. Bank your cargo and report completed contracts at the expedition gate.');
}
export function useDressing(s){const f=s.frontier;if(!f||s.health>=capacity(s))return fail('Your vitality is already full.');if(f.dressings<=0)return fail('No field dressings remain. Prepare more at the town expedition gate.');f.dressings--;s.health=Math.min(capacity(s),s.health+35);return message(s,'Field dressing used. +35 vitality.');}
export function contractComplete(s,id){const f=s.frontier;return id==='survey'?f.visited.length===3:id==='wardens'?f.defeated.length>=3:id==='folio'?f.relic:false;}
export function frontierTarget(s){const f=s.frontier;if(!f)return null;if(safeTown(s)&&f.gateTracked)return {...TOWN_GATE,name:'Expedition Gate / on foot',level:0};if(inBadlands(s)){const p=FRONTIER_SITES.find(p=>p.id===f.selected)||FRONTIER_SITES[0];return {...p,level:0};}return null;}
export function targetFrontier(s,id){if(!s.frontier)return false;if(safeTown(s)&&id==='gate'){s.frontier.gateTracked=true;return true;}if(!FRONTIER_SITES.some(p=>p.id===id))return false;s.frontier.selected=id;return true;}
export function nearbyFrontier(s,w){
 if(!s.frontier||Math.abs(s.speed)>1.7)return [];
 if(inBadlands(s))return FRONTIER_SITES.filter(p=>dist(s,p)<4);
 if(s.doors.level===0&&!s.life.inside&&dist(s,TOWN_GATE)<4)return [{id:'gate',name:'Expedition Gate',kind:'gate',...TOWN_GATE}];
 const out=[];
 if(s.mode!=='foot')return out;
 if(!s.doors.level&&!s.life.inside&&!s.defeated&&dist(s,w.bandit)<3.5)out.push({id:'parley-folio',name:'Folio Watchman / peaceful restitution',kind:'parley',...w.bandit,detail:'Vinci forbids street fighting. Resolve the original encounter without losing its reward.'});
 for(const m of s.doors.enemies||[]){if(m.hp<=0||s.doors.defeated.includes(m.id)||dist(m,s)>=3.2)continue;const level=s.life.inside?-1:s.doors.level||0;if(level===m.level&&([3,-2].includes(level)||s.doors.room===m.room))out.push({id:'parley:'+m.id,name:m.name+' / accept the town truce',kind:'parley',x:m.x,z:m.z,detail:'This older hostile encounter now has a peaceful town resolution.'});}
 return out;
}
export function frontierAction(s,w,action){
 if(!s.frontier)return fail('The region session is not active.');
 const f=s.frontier,near=nearbyFrontier(s,w),gate=near.some(p=>p.id==='gate')&&s.mode==='foot';
 if(action==='enter')return enterBadlands(s);
 if(action==='return')return leaveBadlands(s);
 if(action==='heal')return useDressing(s);if(action==='untrack'){f.gateTracked=false;return message(s,'Expedition gate marker cleared. Your other adventure markers remain.');}
 if(action.startsWith('track:')){return targetFrontier(s,action.slice(6))?message(s,'Destination marked. Travel is always through an actual gate or path.'):fail('Unknown destination.');}
 if(action.startsWith('accept:')){const id=action.slice(7);if(!CONTRACTS.some(c=>c.id===id)||f.accepted.includes(id))return fail('That contract is already recorded.');f.accepted.push(id);return message(s,'Contract recorded: '+CONTRACTS.find(c=>c.id===id).name+'.');}
 if(action==='bank'){
  if(!gate)return fail('Return to the town gate to bank your field cargo.');
  if(!f.cargo.ore&&!f.cargo.resin)return fail('There is no unbanked cargo.');
  for(const key of ['ore','resin']){const n=Math.min(f.cargo[key],999-f.store[key]);f.store[key]+=n;f.cargo[key]-=n;}
  return message(s,'Field cargo banked. It remains available for dressings on later visits.');
 }
 if(action==='craft'){
  if(!gate||f.dressings>=3||f.store.ore<1||f.store.resin<2)return fail('At the town gate, 1 banked iron and 2 resin make a dressing. Carry up to three.');
  f.store.ore--;f.store.resin-=2;f.dressings++;return message(s,'One field dressing prepared. Use Y in the badlands, or the expedition notebook.');
 }
 if(action==='rest'){
  if(!gate&&!near.some(p=>p.id==='return'))return fail('Rest at the town gate or Gate Camp.');s.health=capacity(s);s.life.focus=60+15*(s.life.attrs.ingenuity||0);s.resonance.ready=6;s.resonance.reserve=Math.max(s.resonance.reserve,36);s.resonance.reload=0;return message(s,'Rested and resupplied. No charge and no sound notification.');
 }
 if(action.startsWith('report:')){
  const id=action.slice(7),c=CONTRACTS.find(c=>c.id===id);if(!gate||!c||!f.accepted.includes(id)||f.reported.includes(id)||!contractComplete(s,id))return fail('Complete the recorded objective and return on foot to the town gate.');
  f.reported.push(id);s.credits=Math.min(10000000,s.credits+c.reward);s.life.xp=Math.min(50000,s.life.xp+c.xp);return message(s,c.name+' complete. +'+c.reward+' florins / +'+c.xp+' XP. Reward paid once.');
 }
 if(action==='parley-folio'){
  if(!near.some(p=>p.id===action)||s.mission!==2)return fail('Complete the original deliveries and waterwheel, then speak to the watchman here.');
  s.defeated=true;s.banditHP=0;s.banditPhase='yielded';s.banditWindup=0;s.score=Math.min(10000000,s.score+150);return message(s,'The watchman honors the town truce and releases the stolen folio. Recover it at the archive, then return it to Leonardo.');
 }
 if(action.startsWith('parley:')){
  if(!near.some(p=>p.id===action))return fail('Speak to this person on their actual floor.');const id=action.slice(7),m=s.doors.enemies.find(m=>m.id===id);if(!m||s.doors.defeated.includes(id))return fail('This encounter has already been resolved.');
  s.doors.defeated.push(id);m.hp=0;m.phase='yielded';s.credits=Math.min(10000000,s.credits+12);s.life.xp=Math.min(50000,s.life.xp+25);return message(s,m.name+' accepts the truce. The original encounter is resolved; its reward is paid once.');
 }
 if(action.startsWith('site:')){
  const id=action.slice(5),p=near.find(p=>p.id===id);if(!p||!inBadlands(s))return fail('Stop beside this marked site in Cinder Hollow.');
  if(p.kind==='beacon'){if(f.visited.includes(id))return message(s,'This route is already surveyed.');f.visited.push(id);f.selected=['ridge','orchard','court'].find(x=>!f.visited.includes(x))||'return';return message(s,p.name+' surveyed. '+f.visited.length+' of 3 route stones recorded.');}
  if(p.kind==='relic'){if(f.relic)return fail('The field case is already recovered.');if(!f.defeated.includes('hollow-warden'))return fail('The Hollow Warden still guards this case. Its attacks are slow and clearly signaled.');f.relic=true;f.selected='return';return message(s,'The field case is recovered. Bring it to the town gate for your report.');}
  if(['resin','ore'].includes(p.kind)){if(f.harvested.includes(id))return fail('This source has already been gathered.');f.harvested.push(id);f.cargo[p.kind]=Math.min(99,f.cargo[p.kind]+2);return message(s,'Gathered 2 '+(p.kind==='ore'?'iron':'resin')+'. Cargo is retained if you return or reload.');}
 }
 return fail('That region action is not available here.');
}
export function hurtMonster(s,id,damage,stun=.4){
 if(!inBadlands(s)||!Number.isFinite(damage)||damage<=0)return false;const f=s.frontier,m=f.enemies.find(e=>e.id===id);if(!m||m.hp<=0)return false;
 m.hp=Math.max(0,m.hp-Math.min(100,damage));m.flash=.18;m.phase='stagger';m.timer=stun;
 if(m.hp===0&&!f.defeated.includes(id)){f.defeated.push(id);f.cargo.ore=Math.min(99,f.cargo.ore+m.ore);f.cargo.resin=Math.min(99,f.cargo.resin+m.resin);message(s,m.name+' defeated. Field cargo collected; report contracts in town.');}
 return true;
}
export function strikeFrontier(s){
 if(!inBadlands(s)||s.attackCD>0)return false;s.attackCD=s.resonance.variants.staff===1?.85:.6;s.attackT=.25;
 const targets=s.frontier.enemies.filter(m=>m.hp>0&&dist(m,s)<3.4&&frontierSight(s,m)).sort((a,b)=>dist(a,s)-dist(b,s));
 if(!targets.length)return false;const m=targets[0];s.yaw=Math.atan2(m.x-s.x,m.z-s.z);return hurtMonster(s,m.id,s.upgraded?40:28,.4);
}
export function stepFrontier(s,w,input,dt){
 s.time+=dt;s.steps++;const f=s.frontier;f.notice=Math.max(0,f.notice-dt);
 for(const k of ['inv','toastT','attackCD','attackT','scan','scanCD','throwCD'])s[k]=Math.max(0,s[k]-dt);
 for(const k of ['dodge','dodgeCD'])s.doors[k]=Math.max(0,s.doors[k]-dt);
 const yaw=Number.isFinite(input.moveYaw)?input.moveYaw:s.yaw-(input.steer||0)*2.6*dt;
 if(!s.resonance.aim)s.yaw=yaw;
 s.speed+=((input.throttle||0)*(input.boost?7:4.6)-s.speed)*Math.min(1,dt*12);
 const d=(s.doors.dodge>0?9:s.speed)*dt,dx=Math.sin(yaw)*d,dz=Math.cos(yaw)*d,before={x:s.x,z:s.z};
 if(!frontierBlocked(s.x+dx,s.z))s.x+=dx;if(!frontierBlocked(s.x,s.z+dz))s.z+=dz;s.distance+=dist(before,s);
 if(input.jump&&s.lift===0)s.vy=5;if(s.vy>0||s.lift>0){s.vy-=12*dt;s.lift=Math.max(0,s.lift+s.vy*dt);if(s.lift===0)s.vy=0;}
 s.guarding=!!input.guard;s.life.focus=Math.min(60+15*s.life.attrs.ingenuity,s.life.focus+dt*2);s.life.spellCD=Math.max(0,s.life.spellCD-dt);s.life.aura=Math.max(0,s.life.aura-dt);
 const sanctuary=dist(s,CAMP)<18;
 for(const m of f.enemies){
  m.flash=Math.max(0,m.flash-dt);if(m.hp<=0)continue;m.timer=Math.max(0,m.timer-dt);
  const near=dist(s,m),home={x:m.homeX,z:m.homeZ},sees=!sanctuary&&near<13&&dist(s,home)<23&&frontierSight(s,m);
  if(m.phase==='windup'){
   if(!m.timer){if(!sanctuary&&near<3.2&&s.inv===0&&frontierSight(s,m)){s.health=Math.max(0,s.health-(s.guarding?2:m.harm));s.inv=.7;}m.phase='recover';m.timer=1.1;}continue;
  }
  if(m.timer>0)continue;
  if(sees&&near<2.8){m.phase='windup';m.timer=m.windup;continue;}
  const target=sees?s:home,length=dist(m,target);m.phase=sees?'chase':'patrol';if(length>.3){const step=Math.min(length,m.pace*dt),dx=(target.x-m.x)/length*step,dz=(target.z-m.z)/length*step;if(!frontierBlocked(m.x+dx,m.z,.45))m.x+=dx;if(!frontierBlocked(m.x,m.z+dz,.45))m.z+=dz;m.yaw=Math.atan2(target.x-m.x,target.z-m.z);}
 }
 if(s.health<=0)leaveBadlands(s,true);
}
