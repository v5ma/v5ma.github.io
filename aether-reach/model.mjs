/* Aether Reach: original, deterministic first-person expedition simulation.
 * Rendering is a client of this state. No account, analytics or remote service. */
import {WEAPONS,DEPOTS,CACHES,ENEMIES,cleanKit,weaponStats,upgradePrice} from './arsenal.mjs';
export {WEAPONS,DEPOTS,CACHES,ENEMIES,weaponStats};
import {GLIDE,glideVelocity} from './glide.mjs';
export {GLIDE};
export const VERSION='0.4.0';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export const forward=(yaw,pitch=0)=>({x:Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)});
export const DISTRICTS=[
 {id:'harbor',name:'Arrival Quay',x:0,y:0,z:0,w:34,d:34,theme:'harbor'},
 {id:'atrium',name:'Windward Atrium',x:0,y:3,z:-44,w:22,d:22,theme:'park'},
 {id:'garden',name:'Glasshouse Gardens',x:65,y:6,z:-26,w:36,d:32,theme:'garden'},
 {id:'foundry',name:'Copperlight Works',x:-29,y:12,z:-85,w:34,d:34,theme:'foundry'},
 {id:'spire',name:'The Meridian Spire',x:45,y:20,z:-119,w:38,d:36,theme:'spire'}
];
export const BRIDGES=[
 {id:'quay-walk',a:[0,0,-15],b:[0,3,-35],width:5},
 {id:'garden-walk',a:[9,3,-42],b:[49,6,-28],width:5},
 {id:'works-walk',a:[-7,3,-51],b:[-20,12,-71],width:5},
 {id:'spire-walk',a:[61,6,-40],b:[52,20,-103],width:5},
 {id:'north-walk',a:[-13,12,-90],b:[29,20,-116],width:5}
];
export const RELAYS=[
 {id:'garden',x:69,y:6,z:-32,title:'The greenhouse relay',message:'IONA: The gardens have power again. Their irrigation pumps can breathe. Two more relays, and the city can speak for itself.'},
 {id:'foundry',x:-34,y:12,z:-91,title:'The freight relay',message:'IONA: Freight authority restored. These rails belonged to the people who built them, long before anyone put a lock on the sky.'},
 {id:'spire',x:45,y:20,z:-126,title:'The broadcast relay',message:'IONA: The transmitter is listening. Take the long rail home, or walk the bridges. The signal needs your hand at Arrival Quay.'}
];
export const RECORDS=[
 {id:'quay-letter',x:-7,y:0,z:4,title:'A city without a horizon',text:'The first platforms were tethered laboratories, not palaces. We built a place where the wind could do useful work. When the licenses replaced the ladders, nobody voted. — The Quay Archive'},
 {id:'glass-seed',x:74,y:6,z:-21,title:'What we choose to grow',text:'Every district sends one seed to the glasshouse. When a district goes silent, we keep watering its bed. The empty beds are not empty. They are promises. — Gardener Sen'},
 {id:'copper-book',x:-37,y:12,z:-78,title:'Freight is a public road',text:'A motor can pull a thousand kilos uphill. It can certainly carry one stubborn engineer. Clip in, read the junction, and never confuse a rail direction with a rule. — Maintenance notebook'},
 {id:'spire-log',x:54,y:20,z:-122,title:'The missing frequency',text:'There is no voice above the clouds. There are only people, trying to be heard through machinery. Fix the machinery. Let them speak. — Iona’s transmission log'}
];
export const EXTRACTION={x:0,y:0,z:8};
const V=a=>({x:a[0],y:a[1],z:a[2]});
function samples(points){
 const pts=[];for(let i=0;i<points.length-1;i++){
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
  for(let k=0;k<28;k++){const t=k/28,t2=t*t,t3=t2*t;pts.push(V([0,1,2].map(j=>.5*((2*p1[j])+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3))));}
 }pts.push(V(points.at(-1)));const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+distance(pts[i-1],pts[i]));return {pts,cum,length:cum.at(-1)};
}
function rail(id,name,from,to,points){return {id,name,from,to,...samples(points)};}
export const RAILS=[
 rail('glassline','Glasshouse Express','harbor','garden',[[9,3.1,-5],[22,10,-8],[42,16,4],[69,15,0],[76,11,-12],[72,9.1,-20]]),
 rail('copperline','Copperlight Freight','harbor','foundry',[[-10,3.1,-8],[-26,13,-25],[-56,25,-50],[-52,22,-68],[-41,20,-70],[-28,15.1,-81]]),
 rail('sunline','Meridian Ascent','garden','spire',[[62,9.1,-33],[82,20,-55],[89,34,-80],[68,34,-115],[52,26,-124],[39,23.1,-119]]),
 rail('crossline','The Crosswind','foundry','spire',[[-22,15.1,-92],[-5,24,-105],[10,30,-135],[32,31,-145],[50,27,-137],[51,23.1,-112]]),
 rail('gale-loop','Gale Market Loop','harbor','garden',[[13,3.1,0],[26,10,-3],[42,16.5,7],[58,18,7.7],[76,20,2],[83,12,-16],[78,9.1,-24]]),
 rail('spire-fork','Prism Detour','garden','spire',[[78,9.1,-20],[89,18,-36],[88,24,-60],[93,34,-78],[82,38,-94],[66,35,-113],[56,27,-123],[53,23.1,-121]]),
 rail('homeline','Homebound Sweep','spire','harbor',[[34,23.1,-110],[2,33,-125],[-62,42,-96],[-75,30,-38],[-35,16,21],[0,8,21],[7,3.1,8]])
];
export const BUILDINGS=[
 {id:'arrival',x:-10,z:9,y:0,w:9,d:9,h:11}, {id:'customs',x:11,z:-12,y:0,w:7,d:6,h:10},
 {id:'greenhouse',x:74,z:-34,y:6,w:8,d:8,h:12}, {id:'garden-house',x:55,z:-19,y:6,w:7,d:7,h:9},
 {id:'enginehall',x:-35,z:-88,y:12,w:9,d:12,h:14}, {id:'works-house',x:-20,z:-77,y:12,w:7,d:6,h:10},
 {id:'spire-tower',x:44,z:-132,y:20,w:10,d:8,h:33}, {id:'observatory',x:57,z:-112,y:20,w:7,d:7,h:16}
];
// Relays and notes sit outside solid buildings, intentionally reachable on foot.
RELAYS[0].x=64;RELAYS[1].x=-28;
export const SOLIDS=BUILDINGS.map(b=>({x1:b.x-b.w/2,x2:b.x+b.w/2,y1:b.y,y2:b.y+b.h+4,z1:b.z-b.d/2,z2:b.z+b.d/2}));
export function pointOnRail(r,s){
 s=clamp(s,0,r.length);let lo=0,hi=r.cum.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(r.cum[m]<s)lo=m;else hi=m;}
 const a=r.pts[lo],b=r.pts[hi],len=r.cum[hi]-r.cum[lo],t=(s-r.cum[lo])/(len||1);return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,tangent:{x:(b.x-a.x)/len,y:(b.y-a.y)/len,z:(b.z-a.z)/len}};
}
export function nearestRail(p,max=4.3,ignore=null){let best=null;for(const r of RAILS.filter(r=>r.id!==ignore))for(let i=1;i<r.pts.length;i++){
 const a=r.pts[i-1],b=r.pts[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len2=dx*dx+dy*dy+dz*dz,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/len2,0,1),q={x:a.x+dx*t,y:a.y+dy*t,z:a.z+dz*t},d=distance(p,q);
 if(d<max&&(!best||d<best.distance))best={rail:r,s:r.cum[i-1]+Math.sqrt(len2)*t,distance:d,point:q};
 }return best;}
export function groundAt(x,z,under=Infinity){let y=-Infinity,id=null;
 for(const p of DISTRICTS)if(Math.abs(x-p.x)<=p.w/2&&Math.abs(z-p.z)<=p.d/2&&p.y<=under&&p.y>y){y=p.y;id=p.id;}
 for(const p of BRIDGES){const [ax,ay,az]=p.a,[bx,by,bz]=p.b,dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),t=((x-ax)*dx+(z-az)*dz)/(l*l),side=Math.abs((x-ax)*dz-(z-az)*dx)/l,gy=ay+(by-ay)*t;if(t>=0&&t<=1&&side<p.width/2&&gy<=under&&gy>y){y=gy;id=p.id;}}
 return {y,id};
}
export function rayBox(o,d,b,max=Infinity){let near=0,far=max;for(const axis of ['x','y','z']){if(Math.abs(d[axis])<1e-9){if(o[axis]<b[axis+'1']||o[axis]>b[axis+'2'])return null;}else{let a=(b[axis+'1']-o[axis])/d[axis],c=(b[axis+'2']-o[axis])/d[axis];if(a>c)[a,c]=[c,a];near=Math.max(near,a);far=Math.min(far,c);if(near>far)return null;}}return near;}
export function raySphere(o,d,c,r){const x=o.x-c.x,y=o.y-c.y,z=o.z-c.z,b=x*d.x+y*d.y+z*d.z,h=b*b-(x*x+y*y+z*z-r*r);if(h<0)return null;const t=-b-Math.sqrt(h);return t>0?t:null;}
export function clearLine(a,b){const l=distance(a,b);if(l<1e-8)return !SOLIDS.some(s=>a.x>s.x1&&a.x<s.x2&&a.y>s.y1&&a.y<s.y2&&a.z>s.z1&&a.z<s.z2);const d={x:(b.x-a.x)/l,y:(b.y-a.y)/l,z:(b.z-a.z)/l};return !SOLIDS.some(s=>rayBox(a,d,s,l)!==null);}
const pointFor=id=>{const d=DISTRICTS.find(p=>p.id===id)||DISTRICTS[0];return {x:d.x,y:d.y+.02,z:d.z+5};};
export function createState(save=null){
 const safe=readSave(save),kit=cleanKit(safe.kit),p=pointFor(safe.checkpoint);
 return {p:{...p,vx:0,vy:0,vz:0,yaw:0,pitch:0,grounded:true,gliding:false,glideCharge:100,rail:null,speed:0,health:100,shield:60+kit.shield*20,energy:100,weapon:kit.selected,ammo:kit.mags[kit.selected],scoped:false,reload:0,shoot:0,pulse:0,hookCooldown:0,hookRequest:0,invuln:2,latch:null,lastRail:null,airSince:0},kit,time:0,relays:new Set(safe.relays),records:new Set(safe.records),checkpoint:safe.checkpoint,won:false,bullets:[],events:[],drones:ENEMIES.map((d,i)=>({...d,hp:kit.dead.includes(d.id)||safe.relays.includes(d.home)?0:d.hp,maxHp:d.hp,stun:0,attack:2.2+i,telegraph:0,origin:{x:d.x,y:d.y,z:d.z}})),stats:{glides:0,glideDistance:0,glideSeconds:0,rails:0,railDistance:0,reversals:0,transfers:0,shots:0,hits:0,critical:0,defeated:0,rescues:0},damagedAt:-100};
}
export function readSave(value){let s=value;try{if(typeof s==='string')s=JSON.parse(s);}catch{s=null;}if(!s||s.version!==1)return {relays:[],records:[],checkpoint:'harbor'};return {relays:[...new Set(Array.isArray(s.relays)?s.relays.filter(x=>RELAYS.some(r=>r.id===x)):[])],records:[...new Set(Array.isArray(s.records)?s.records.filter(x=>RECORDS.some(r=>r.id===x)):[])],checkpoint:DISTRICTS.some(d=>d.id===s.checkpoint)?s.checkpoint:'harbor',kit:cleanKit(s.kit)};}
export function saveState(s){s.kit.mags[s.p.weapon]=s.p.ammo;s.kit.selected=s.p.weapon;return JSON.stringify({version:1,relays:[...s.relays],records:[...s.records],checkpoint:s.checkpoint,kit:cleanKit(s.kit)});}
export function emit(s,type,data={}){s.events.push({type,...data});if(s.events.length>80)s.events.shift();}
export function depotNear(s){return !s.p.rail&&s.p.grounded?DEPOTS.find(d=>distance(s.p,d)<4.5):null;}
export function equip(s,id){if(!s.kit.owns.includes(id)||!Object.hasOwn(WEAPONS,id))return false;s.kit.mags[s.p.weapon]=s.p.ammo;s.p.weapon=id;s.kit.selected=id;s.p.ammo=s.kit.mags[id];s.p.reload=0;s.p.scoped=false;emit(s,'equip',{id});return true;}
export function buy(s,id,kind='weapon'){if(s.won)return false;
 if(!depotNear(s))return false;let price=0;
 if(kind==='weapon'){if(!Object.hasOwn(WEAPONS,id)||s.kit.owns.includes(id))return false;price=WEAPONS[id].cost;}
 else if(kind==='damage'||kind==='reload'){if(!s.kit.owns.includes(id)||s.kit.tune[id][kind]>=2)return false;price=upgradePrice(s.kit.tune[id][kind]);}
 else if(kind==='shield'){if(s.kit.shield>=2)return false;price=upgradePrice(s.kit.shield);}
 else if(kind==='ammo'){if(id==='arc'||!s.kit.owns.includes(id)||s.kit.reserve[id]>=WEAPONS[id].reserve*3)return false;price=35;}
 else return false;
 if(s.kit.credits<price)return false;s.kit.credits-=price;
 if(kind==='weapon'){s.kit.owns.push(id);s.kit.mags[id]=WEAPONS[id].mag;s.kit.reserve[id]=WEAPONS[id].reserve;s.kit.tune[id]={damage:0,reload:0};equip(s,id);}
 else if(kind==='ammo')s.kit.reserve[id]=Math.min(WEAPONS[id].reserve*3,s.kit.reserve[id]+WEAPONS[id].reserve);
 else if(kind==='shield'){s.kit.shield++;s.p.shield=Math.min(60+s.kit.shield*20,s.p.shield+20);}
 else s.kit.tune[id][kind]++;
 emit(s,'purchase',{id,kind,price});emit(s,'save');return true;
}
export function loot(s){const boxes=CACHES.map(c=>({...c,kind:'cache'}));for(const id of s.kit.dead){const b=ENEMIES.find(e=>e.id===id);const floor=groundAt(b.x,b.z);boxes.push({id:'drop-'+id,x:b.x,y:Number.isFinite(floor.y)?floor.y:b.y-2,z:b.z,credits:b.reward,kind:'drop',label:b.kind+' salvage'});}return boxes.filter(b=>!s.kit.taken.includes(b.id));}
export function collect(s,id){const b=loot(s).find(b=>b.id===id);if(!b||distance(s.p,b)>3||!clearLine({x:s.p.x,y:s.p.y+1,z:s.p.z},{...b,y:b.y+1}))return false;s.kit.taken.push(b.id);s.kit.credits=Math.min(99999,s.kit.credits+b.credits);s.p.health=Math.min(100,s.p.health+15);for(const id of s.kit.owns)if(id!=='arc')s.kit.reserve[id]=Math.min(WEAPONS[id].reserve*3,s.kit.reserve[id]+WEAPONS[id].mag*2);if(b.weapon&&!s.kit.owns.includes(b.weapon)){const id=b.weapon;s.kit.owns.push(id);s.kit.mags[id]=WEAPONS[id].mag;s.kit.reserve[id]=WEAPONS[id].reserve;s.kit.tune[id]={damage:0,reload:0};}emit(s,'loot',{id:b.id,credits:b.credits,weapon:b.weapon});emit(s,'save');return true;}
function defeated(s,b){if(s.kit.dead.includes(b.id))return;s.kit.dead.push(b.id);s.stats.defeated++;emit(s,'defeat',{id:b.id});emit(s,'save');}
// Aim-weighted reachable candidates, not a global nearest-rail teleport.
export function railTarget(s){const p=s.p,head={x:p.x,y:p.y+1.6,z:p.z},view=forward(p.yaw,p.pitch);let best=null;
 for(const r of RAILS){if(r.id===p.rail?.id||!p.grounded&&s.time-p.airSince<.85&&r.id===p.lastRail)continue;const target=nearestRailOn(head,r,p.grounded?4.3:6.3);if(!target)continue;const v={x:target.point.x-head.x,y:target.point.y-head.y,z:target.point.z-head.z},dot=(v.x*view.x+v.y*view.y+v.z*view.z)/(target.distance||1);if(!p.grounded&&dot<-.12)continue;if(!clearLine(head,target.point))continue;const dest={x:target.point.x,y:target.point.y-2.65,z:target.point.z};if(occupied(dest.x,dest.y,dest.z)||!clearLine({...head,y:head.y-.6},{...dest,y:dest.y+1}))continue;const score=target.distance-(p.grounded?0:dot*2.8);if(!best||score<best.score)best={...target,score,dot};}return best;
}
function nearestRailOn(p,r,max){let best=null;for(let i=1;i<r.pts.length;i++){const a=r.pts[i-1],b=r.pts[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len2=dx*dx+dy*dy+dz*dz,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/len2,0,1),q={x:a.x+dx*t,y:a.y+dy*t,z:a.z+dz*t},d=distance(p,q);if(d<max&&(!best||d<best.distance))best={rail:r,s:r.cum[i-1]+Math.sqrt(len2)*t,distance:d,point:q};}return best;}
export function nearby(s){const p=s.p;const head={x:p.x,y:p.y+1.6,z:p.z};if(p.rail){const target=railTarget(s);if(target&&clearLine(head,target.point))return {type:'hook',target,label:'SPACE then E · Transfer to '+target.rail.name};return {type:'rail',label:'SPACE release · C reverse · S brake'};}
 const relay=RELAYS.find(r=>!s.relays.has(r.id)&&distance(p,r)<3.8);if(relay)return {type:'relay',id:relay.id,label:'E · Restore '+relay.title.replace('The ','')};
 const record=RECORDS.find(r=>!s.records.has(r.id)&&distance(p,r)<3.2);if(record)return {type:'record',id:record.id,label:'E · Read '+record.title};
 if(distance(p,EXTRACTION)<3.8)return {type:'exit',label:s.relays.size===3?'E · Broadcast the signal':'Restore three relays, then return here'};
 const box=loot(s).find(b=>distance(p,b)<3);if(box)return {type:'loot',id:box.id,label:'E · '+box.label+' / '+box.credits+' credits'};
 const target=railTarget(s);if(target&&clearLine(head,target.point))return {type:'hook',target,label:'E · Hook '+target.rail.name};return null;}
export function interact(s){const n=nearby(s),p=s.p;
 // A deliberate catch pressed during the release cooldown is remembered for
 // 0.30 simulation seconds. Never auto-grab without input or through a wall.
 if(!p.rail&&!p.grounded&&p.lastRail&&(!n||n.type==='hook')&&(!n||p.hookCooldown>0)){p.hookRequest=.30;return true;}
 if(!n)return false;
 if(n.type==='loot')return collect(s,n.id);
 if(n.type==='relay'){s.kit.credits=Math.min(99999,s.kit.credits+90);s.relays.add(n.id);s.checkpoint=n.id;p.health=100;p.shield=60+s.kit.shield*20;p.ammo=weaponStats(s).mag;emit(s,'relay',{id:n.id});emit(s,'save');return true;}
 if(n.type==='record'){s.records.add(n.id);emit(s,'record',{id:n.id});emit(s,'save');return true;}
 if(n.type==='exit'&&s.relays.size===3){s.won=true;emit(s,'win');emit(s,'save');return true;}
 if(n.type==='hook'&&p.hookCooldown<=0){
  if(p.rail){detach(s,true);emit(s,'transfer-ready',{id:n.target.rail.id});return true;}
  const r=n.target.rail,q=pointOnRail(r,n.target.s),dir=forward(p.yaw,p.pitch),speed=Math.hypot(p.vx,p.vy,p.vz);let sign=dir.x*q.tangent.x+dir.z*q.tangent.z>=0?1:-1;if(n.target.s<4)sign=1;if(n.target.s>r.length-4)sign=-1;
  const transfer=p.lastRail&&p.lastRail!==r.id&&!p.grounded;
  foldGlide(s,'rail');p.hookRequest=0;p.latch={x:p.x,y:p.y,z:p.z,t:0};p.rail={id:r.id,s:n.target.s,dir:sign};p.speed=clamp(speed||12,10,28);p.vy=0;p.grounded=false;s.stats.rails++;if(transfer)s.stats.transfers++;emit(s,'hook',{id:r.id,transfer:!!transfer});return true;
 }return false;
}
export function detach(s,jump=true){const p=s.p;if(!p.rail)return;const r=RAILS.find(r=>r.id===p.rail.id),q=pointOnRail(r,p.rail.s),dir=p.rail.dir;p.vx=q.tangent.x*p.speed*dir;p.vz=q.tangent.z*p.speed*dir;p.vy=q.tangent.y*p.speed*dir+(jump?5:0);p.lastRail=p.rail.id;p.airSince=s.time;p.rail=null;p.latch=null;p.hookCooldown=.14;p.hookRequest=0;p.grounded=false;emit(s,'release');}
export function reverseRail(s){if(!s.p.rail)return;s.p.rail.dir*=-1;s.p.speed=Math.max(7,s.p.speed*.72);s.stats.reversals++;emit(s,'reverse');}
export function fire(s,aim=null){const p=s.p,w=weaponStats(s);if(p.shoot>0||p.reload>0||p.ammo<=0||s.won)return false;const head={x:p.x,y:p.y+1.6,z:p.z};let o=head,d=forward(p.yaw,p.pitch);
 if(aim){if(!aim.origin||!aim.direction||!['x','y','z'].every(k=>Number.isFinite(aim.origin[k])&&Number.isFinite(aim.direction[k])))return false;const len=Math.hypot(aim.direction.x,aim.direction.y,aim.direction.z);if(len<.001||distance(head,aim.origin)>2.5||!clearLine(head,aim.origin))return false;o={...aim.origin};d={x:aim.direction.x/len,y:aim.direction.y/len,z:aim.direction.z/len};}
 p.shoot=w.delay;p.ammo--;s.kit.mags[p.weapon]=p.ammo;s.stats.shots++;
 const across={x:d.z,y:0,z:-d.x},al=Math.hypot(across.x,across.z)||1;across.x/=al;across.z/=al;const up={x:across.z*d.y,y:across.x*d.z-across.z*d.x,z:-across.x*d.y};
 for(let pellet=0;pellet<w.pellets;pellet++){
  const a=(s.stats.shots*2.399+pellet*2.399),spread=w.spread*(p.scoped?(w.id==='sniper'?0:.28):1)*(p.grounded?1:1.45),rad=w.pellets>1?(pellet===0?0:spread):spread*.45,dx=Math.cos(a)*rad,dy=Math.sin(a)*rad;
  const v={x:d.x+across.x*dx+up.x*dy,y:d.y+up.y*dy,z:d.z+across.z*dx+up.z*dy},len=Math.hypot(v.x,v.y,v.z);for(const k of['x','y','z'])v[k]/=len;
  let limit=w.range,hit=null,critical=false;for(const b of SOLIDS){const t=rayBox(o,v,b,limit);if(t!==null)limit=t;}
  for(const bot of s.drones){if(bot.hp<=0)continue;const t=raySphere(o,v,bot,bot.kind==='heavy'?1.5:1.15);if(t!==null&&t<limit){limit=t;hit=bot;critical=raySphere(o,v,{x:bot.x,y:bot.y+.55,z:bot.z},.31)!==null;}}
  if(hit){const falloff=w.id==='scatter'?Math.max(.25,1-limit/40):1,damage=w.damage*falloff*(critical?1.6:1);hit.hp-=damage;hit.stun=Math.max(hit.stun,w.id==='sniper'?.5:.16);s.stats.hits++;if(critical)s.stats.critical++;if(hit.hp<=0)defeated(s,hit);else emit(s,'hit',{id:hit.id,damage,critical});}
  emit(s,'shot',{weapon:w.id,o,end:{x:o.x+v.x*limit,y:o.y+v.y*limit,z:o.z+v.z*limit},hit:!!hit,critical});
 }return true;
}
export function pulse(s){const p=s.p;if(p.energy<45||p.pulse>0||s.won)return false;p.energy-=45;p.pulse=1.2;let n=0;for(const b of s.drones)if(b.hp>0&&distance(p,b)<13&&clearLine({x:p.x,y:p.y+1.5,z:p.z},b)){b.stun=5;b.hp-=20;n++;if(b.hp<=0){defeated(s,b);}}emit(s,'pulse',{hits:n});return true;}
export function rescue(s,death=false){const p=s.p,q=pointFor(s.checkpoint);Object.assign(p,q,{vx:0,vy:0,vz:0,rail:null,grounded:true,gliding:false,glideCharge:100,health:death?100:Math.max(35,p.health-12),shield:60+s.kit.shield*20,energy:100,ammo:p.weapon==='arc'?8:p.ammo,scoped:false,latch:null,hookRequest:0,lastRail:null,invuln:3,hookCooldown:1});s.stats.rescues++;s.bullets=[];emit(s,'rescue',{death});}
function hurt(s,amount){const p=s.p;if(p.invuln>0||s.won)return;let left=amount;if(p.shield>0){const k=Math.min(left,p.shield);p.shield-=k;left-=k;}p.health-=left;s.damagedAt=s.time;emit(s,'damage');if(p.health<=0)rescue(s,true);}
function occupied(x,y,z){return SOLIDS.some(b=>x+.38>b.x1&&x-.38<b.x2&&y+1.8>b.y1&&y<b.y2&&z+.38>b.z1&&z-.38<b.z2);}
export function step(s,input,dt){
 if(s.won)return;dt=clamp(dt,0,.025);s.time+=dt;const p=s.p;
 for(const k of ['shoot','pulse','hookCooldown','invuln'])p[k]=Math.max(0,p[k]-dt);if(p.reload>0){p.reload-=dt;if(p.reload<=0){const w=weaponStats(s),take=w.id==='arc'?w.mag:Math.min(w.mag-p.ammo,s.kit.reserve[w.id]);p.ammo=w.id==='arc'?w.mag:p.ammo+take;if(w.id!=='arc')s.kit.reserve[w.id]-=take;s.kit.mags[w.id]=p.ammo;}}if(s.time-s.damagedAt>4)p.shield=Math.min(60+s.kit.shield*20,p.shield+9*dt);p.energy=Math.min(100,p.energy+12*dt);
 if(p.gliding&&(p.grounded||p.rail||p.glideCharge<=0))foldGlide(s,p.glideCharge<=0?'empty':'landed');
 if(!p.gliding&&(p.grounded||p.rail))p.glideCharge=Math.min(GLIDE.capacity,p.glideCharge+GLIDE.recharge*dt);
 if(input.reload&&p.ammo<weaponStats(s).mag&&p.reload<=0&&(p.weapon==='arc'||s.kit.reserve[p.weapon]>0))p.reload=weaponStats(s).reload;
 if(p.rail){const r=RAILS.find(r=>r.id===p.rail.id);p.speed=clamp(p.speed+(input.back?-16:input.boost?15:p.speed>19?-3:4)*dt,3,input.boost||p.speed>19?28:19);const old=p.rail.s;p.rail.s=clamp(old+p.speed*p.rail.dir*dt,0,r.length);s.stats.railDistance+=Math.abs(old-p.rail.s);const q=pointOnRail(r,p.rail.s);if(p.latch){p.latch.t+=dt;const f=Math.min(1,p.latch.t/.18);p.x=p.latch.x+(q.x-p.latch.x)*f;p.y=p.latch.y+(q.y-2.65-p.latch.y)*f;p.z=p.latch.z+(q.z-p.latch.z)*f;if(f===1)p.latch=null;}else{p.x=q.x;p.y=q.y-2.65;p.z=q.z;}
  if(input.railCamera===true&&!p.scoped){const yaw=Math.atan2(q.tangent.x*p.rail.dir,-q.tangent.z*p.rail.dir),delta=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw));p.yaw+=delta*Math.min(1,dt*2.5);}
  if(p.rail.s===0||p.rail.s===r.length){const end=p.rail.s===0?r.from:r.to;detach(s,false);p.vx=p.vz=0;const floor=groundAt(p.x,p.z,p.y+1);if(Number.isFinite(floor.y)){p.y=floor.y+.01;p.grounded=true;}emit(s,'arrive',{district:end});}
 }else{
  const f=forward(p.yaw),rx=Math.cos(p.yaw),rz=Math.sin(p.yaw),ix=Number.isFinite(input.moveX)?clamp(input.moveX,-1,1):(input.right?1:0)-(input.left?1:0),iz=Number.isFinite(input.moveZ)?clamp(input.moveZ,-1,1):(input.forward?1:0)-(input.back?1:0),len=Math.max(1,Math.hypot(ix,iz)),speed=(input.boost?10.5:6.5)*(p.scoped?.55:1);
  const targetX=(f.x*iz+rx*ix)/len*speed,targetZ=(f.z*iz+rz*ix)/len*speed,blend=1-Math.exp(-dt*(p.grounded?14:2.2));if(p.gliding)glideVelocity(p,input,dt);else{p.vx+=(targetX-p.vx)*blend;p.vz+=(targetZ-p.vz)*blend;}
  const oldY=p.y,oldX=p.x,oldZ=p.z,was=p.grounded;const nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;if(!occupied(nx,p.y,p.z))p.x=nx;else p.vx=0;if(!occupied(p.x,p.y,nz))p.z=nz;else p.vz=0;
  const floor=groundAt(p.x,p.z,oldY+(was?.55:0));if(!p.gliding)p.vy-=18*dt;p.y+=p.vy*dt;p.grounded=false;
  if(Number.isFinite(floor.y)&&((was&&floor.y-oldY<=.55)||(oldY>=floor.y&&p.y<=floor.y))){p.y=floor.y;p.vy=0;p.grounded=true;}
  if(p.gliding){s.stats.glideDistance+=Math.hypot(p.x-oldX,p.z-oldZ);s.stats.glideSeconds+=dt;if(p.grounded)foldGlide(s,'landed');else if(p.glideCharge<=0)foldGlide(s,'empty');}
  if(p.y<-45)rescue(s);
 }
 if(p.hookRequest>0){
  p.hookRequest=Math.max(0,p.hookRequest-dt);
  if(p.grounded||p.rail)p.hookRequest=0;
  else if(p.hookCooldown<=0&&nearby(s)?.type==='hook'){p.hookRequest=0;interact(s);}
 }
 for(let i=0;i<s.drones.length;i++){
  const b=s.drones[i];if(b.hp<=0||b.kind==='target')continue;b.stun=Math.max(0,b.stun-dt);if(b.stun>0){b.telegraph=0;continue;}
  const t=s.time*(b.kind==='scout'?.75:.3)+i,amplitude=b.kind==='heavy'?.7:b.kind==='sentry'?0:2.4;
  b.x=b.origin.x+Math.sin(t)*amplitude;b.z=b.origin.z+Math.cos(t*.8)*amplitude;b.y=b.origin.y+Math.sin(t*2)*(b.kind==='heavy'?.07:.45);b.attack-=dt;
  const range=b.kind==='sentry'?52:30,seen=distance(p,b)<range&&clearLine(b,{x:p.x,y:p.y+1.3,z:p.z});b.telegraph=seen&&b.attack<.8?Math.max(0,1-b.attack/.8):0;
  if(b.attack<=0&&seen){const to={x:p.x,y:p.y+1.1,z:p.z},len=distance(to,b),n=b.kind==='heavy'?3:1,speed=b.kind==='sentry'?23:13;
   for(let k=0;k<n;k++){const offset=(k-(n-1)/2)*.65;s.bullets.push({x:b.x,y:b.y,z:b.z,vx:(to.x-b.x+offset)/len*speed,vy:(to.y-b.y)/len*speed,vz:(to.z-b.z-offset)/len*speed,life:4,damage:b.kind==='heavy'?20:15});}
   b.attack=b.kind==='sentry'?3.4:b.kind==='heavy'?3:2.4;emit(s,'enemy-shot');
  }
 }
 for(let i=s.bullets.length-1;i>=0;i--){const b=s.bullets[i];b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;if(distance(b,{x:p.x,y:p.y+1,z:p.z})<.85){hurt(s,(b.damage||15)*(input.explorer?.53:1));b.life=0;}if(b.life<=0||SOLIDS.some(q=>b.x>q.x1&&b.x<q.x2&&b.y>q.y1&&b.y<q.y2&&b.z>q.z1&&b.z<q.z2))s.bullets.splice(i,1);}
}
export function jump(s){if(s.p.rail){detach(s,true);return true;}if(s.p.grounded){s.p.vy=7;s.p.grounded=false;s.p.y+=.05;return true;}return false;}

// Room-scale translation is collision checked independently of joystick motion.
export function roomMove(s,dx,dz){if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)>.5||s.p.rail)return false;const p=s.p;if(!occupied(p.x+dx,p.y,p.z))p.x+=dx;if(!occupied(p.x,p.y,p.z+dz))p.z+=dz;return true;}

export function foldGlide(s,reason='manual'){if(!s.p.gliding)return false;s.p.gliding=false;emit(s,'glide-fold',{reason});return true;}
export function toggleGlide(s){const p=s.p;if(s.won)return false;if(p.gliding)return foldGlide(s);const floor=groundAt(p.x,p.z,p.y);if(p.grounded||p.rail||p.glideCharge<8||occupied(p.x,p.y,p.z)||(Number.isFinite(floor.y)&&p.y-floor.y<1.2))return false;p.gliding=true;s.stats.glides++;emit(s,'glide-open');return true;}
