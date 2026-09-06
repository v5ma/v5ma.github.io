/* Aether Reach: original, deterministic first-person expedition simulation.
 * Rendering is a client of this state. No account, analytics or remote service. */
export const VERSION='0.2.0';
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
export function clearLine(a,b){const l=distance(a,b),d={x:(b.x-a.x)/l,y:(b.y-a.y)/l,z:(b.z-a.z)/l};return !SOLIDS.some(s=>rayBox(a,d,s,l)!==null);}
const pointFor=id=>{const d=DISTRICTS.find(p=>p.id===id)||DISTRICTS[0];return {x:d.x,y:d.y+.02,z:d.z+5};};
export function createState(save=null){
 const safe=readSave(save),p=pointFor(safe.checkpoint);return {p:{...p,vx:0,vy:0,vz:0,yaw:0,pitch:0,grounded:true,rail:null,speed:0,health:100,shield:60,energy:100,ammo:8,reload:0,shoot:0,pulse:0,hookCooldown:0,invuln:2},time:0,relays:new Set(safe.relays),records:new Set(safe.records),checkpoint:safe.checkpoint,won:false,bullets:[],events:[],drones:[{id:'g1',home:'garden',x:66,y:9,z:-22},{id:'f1',home:'foundry',x:-24,y:15,z:-83},{id:'s1',home:'spire',x:44,y:23,z:-119}].map((d,i)=>({...d,hp:safe.relays.includes(d.home)?0:85,stun:0,attack:2.2+i,origin:{x:d.x,y:d.y,z:d.z}})),stats:{rails:0,railDistance:0,reversals:0,shots:0,hits:0,defeated:0,rescues:0},damagedAt:-100};
}
export function readSave(value){let s=value;try{if(typeof s==='string')s=JSON.parse(s);}catch{s=null;}if(!s||s.version!==1)return {relays:[],records:[],checkpoint:'harbor'};return {relays:[...new Set(Array.isArray(s.relays)?s.relays.filter(x=>RELAYS.some(r=>r.id===x)):[])],records:[...new Set(Array.isArray(s.records)?s.records.filter(x=>RECORDS.some(r=>r.id===x)):[])],checkpoint:DISTRICTS.some(d=>d.id===s.checkpoint)?s.checkpoint:'harbor'};}
export function saveState(s){return JSON.stringify({version:1,relays:[...s.relays],records:[...s.records],checkpoint:s.checkpoint});}
export function emit(s,type,data={}){s.events.push({type,...data});if(s.events.length>80)s.events.shift();}
export function nearby(s){const p=s.p;const head={x:p.x,y:p.y+1.6,z:p.z};if(p.rail){const target=nearestRail(head,4.3,p.rail.id);if(target&&clearLine(head,target.point))return {type:'hook',target,label:'E · Switch to '+target.rail.name};return {type:'rail',label:'SPACE release · C reverse · S brake'};}
 const relay=RELAYS.find(r=>!s.relays.has(r.id)&&distance(p,r)<3.8);if(relay)return {type:'relay',id:relay.id,label:'E · Restore '+relay.title.replace('The ','')};
 const record=RECORDS.find(r=>!s.records.has(r.id)&&distance(p,r)<3.2);if(record)return {type:'record',id:record.id,label:'E · Read '+record.title};
 if(distance(p,EXTRACTION)<3.8)return {type:'exit',label:s.relays.size===3?'E · Broadcast the signal':'Restore three relays, then return here'};
 const target=nearestRail(head);if(target&&clearLine(head,target.point))return {type:'hook',target,label:'E · Hook '+target.rail.name};return null;}
export function interact(s){const n=nearby(s),p=s.p;if(!n)return false;
 if(n.type==='relay'){s.relays.add(n.id);s.checkpoint=n.id;p.health=100;p.shield=60;p.ammo=8;emit(s,'relay',{id:n.id});emit(s,'save');return true;}
 if(n.type==='record'){s.records.add(n.id);emit(s,'record',{id:n.id});emit(s,'save');return true;}
 if(n.type==='exit'&&s.relays.size===3){s.won=true;emit(s,'win');emit(s,'save');return true;}
 if(n.type==='hook'&&p.hookCooldown<=0){const r=n.target.rail,q=pointOnRail(r,n.target.s),dir=forward(p.yaw,p.pitch);let sign=dir.x*q.tangent.x+dir.z*q.tangent.z>=0?1:-1;if(n.target.s<4)sign=1;if(n.target.s>r.length-4)sign=-1;p.rail={id:r.id,s:n.target.s,dir:sign};p.speed=12;p.vy=0;p.grounded=false;s.stats.rails++;emit(s,'hook',{id:r.id});return true;}return false;}
export function detach(s,jump=true){const p=s.p;if(!p.rail)return;const r=RAILS.find(r=>r.id===p.rail.id),q=pointOnRail(r,p.rail.s),dir=p.rail.dir;p.vx=q.tangent.x*p.speed*dir;p.vz=q.tangent.z*p.speed*dir;p.vy=q.tangent.y*p.speed*dir+(jump?5:0);p.rail=null;p.hookCooldown=.6;p.grounded=false;emit(s,'release');}
export function reverseRail(s){if(!s.p.rail)return;s.p.rail.dir*=-1;s.p.speed=Math.max(7,s.p.speed*.72);s.stats.reversals++;emit(s,'reverse');}
export function fire(s,aim=null){const p=s.p;if(p.shoot>0||p.reload>0||p.ammo<=0||s.won)return false;const head={x:p.x,y:p.y+1.6,z:p.z};
 let o=head,d=forward(p.yaw,p.pitch);
 if(aim){if(!aim.origin||!aim.direction||!['x','y','z'].every(k=>Number.isFinite(aim.origin[k])&&Number.isFinite(aim.direction[k])))return false;const len=Math.hypot(aim.direction.x,aim.direction.y,aim.direction.z);if(len<.001||distance(head,aim.origin)>2.5||!clearLine(head,aim.origin))return false;o={...aim.origin};d={x:aim.direction.x/len,y:aim.direction.y/len,z:aim.direction.z/len};}
p.shoot=.23;p.ammo--;s.stats.shots++;let limit=85,hit=null;for(const b of SOLIDS){const t=rayBox(o,d,b,limit);if(t!==null)limit=t;}
 for(const bot of s.drones){if(bot.hp<=0)continue;const t=raySphere(o,d,bot,1.35);if(t!==null&&t<limit){limit=t;hit=bot;}}if(hit){hit.hp-=34;hit.stun=.3;s.stats.hits++;if(hit.hp<=0){s.stats.defeated++;emit(s,'defeat',{id:hit.id});}else emit(s,'hit');}
 emit(s,'shot',{o,end:{x:o.x+d.x*limit,y:o.y+d.y*limit,z:o.z+d.z*limit},hit:!!hit});return true;}
export function pulse(s){const p=s.p;if(p.energy<45||p.pulse>0||s.won)return false;p.energy-=45;p.pulse=1.2;let n=0;for(const b of s.drones)if(b.hp>0&&distance(p,b)<13&&clearLine({x:p.x,y:p.y+1.5,z:p.z},b)){b.stun=5;b.hp-=20;n++;if(b.hp<=0){s.stats.defeated++;emit(s,'defeat',{id:b.id});}}emit(s,'pulse',{hits:n});return true;}
export function rescue(s,death=false){const p=s.p,q=pointFor(s.checkpoint);Object.assign(p,q,{vx:0,vy:0,vz:0,rail:null,grounded:true,health:death?100:Math.max(35,p.health-12),shield:60,energy:100,ammo:8,invuln:3,hookCooldown:1});s.stats.rescues++;s.bullets=[];emit(s,'rescue',{death});}
function hurt(s,amount){const p=s.p;if(p.invuln>0||s.won)return;let left=amount;if(p.shield>0){const k=Math.min(left,p.shield);p.shield-=k;left-=k;}p.health-=left;s.damagedAt=s.time;emit(s,'damage');if(p.health<=0)rescue(s,true);}
function occupied(x,y,z){return SOLIDS.some(b=>x+.38>b.x1&&x-.38<b.x2&&y+1.8>b.y1&&y<b.y2&&z+.38>b.z1&&z-.38<b.z2);}
export function step(s,input,dt){
 if(s.won)return;dt=clamp(dt,0,.025);s.time+=dt;const p=s.p;
 for(const k of ['shoot','pulse','hookCooldown','invuln'])p[k]=Math.max(0,p[k]-dt);if(p.reload>0){p.reload-=dt;if(p.reload<=0)p.ammo=8;}if(s.time-s.damagedAt>4)p.shield=Math.min(60,p.shield+9*dt);p.energy=Math.min(100,p.energy+12*dt);
 if(input.reload&&p.ammo<8&&p.reload<=0)p.reload=1.05;
 if(p.rail){const r=RAILS.find(r=>r.id===p.rail.id);p.speed=clamp(p.speed+(input.back?-16:input.boost?15:4)*dt,3,input.boost?28:19);const old=p.rail.s;p.rail.s=clamp(old+p.speed*p.rail.dir*dt,0,r.length);s.stats.railDistance+=Math.abs(old-p.rail.s);const q=pointOnRail(r,p.rail.s);p.x=q.x;p.y=q.y-2.65;p.z=q.z;
  if(input.railCamera!==false){const yaw=Math.atan2(q.tangent.x*p.rail.dir,-q.tangent.z*p.rail.dir),delta=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw));p.yaw+=delta*Math.min(1,dt*2.5);}
  if(p.rail.s===0||p.rail.s===r.length){const end=p.rail.s===0?r.from:r.to;detach(s,false);p.vx=p.vz=0;const floor=groundAt(p.x,p.z,p.y+1);if(Number.isFinite(floor.y)){p.y=floor.y+.01;p.grounded=true;}emit(s,'arrive',{district:end});}
 }else{
  const f=forward(p.yaw),rx=Math.cos(p.yaw),rz=Math.sin(p.yaw),ix=Number.isFinite(input.moveX)?clamp(input.moveX,-1,1):(input.right?1:0)-(input.left?1:0),iz=Number.isFinite(input.moveZ)?clamp(input.moveZ,-1,1):(input.forward?1:0)-(input.back?1:0),len=Math.max(1,Math.hypot(ix,iz)),speed=input.boost?10.5:6.5;
  const targetX=(f.x*iz+rx*ix)/len*speed,targetZ=(f.z*iz+rz*ix)/len*speed,blend=1-Math.exp(-dt*(p.grounded?14:2.2));p.vx+=(targetX-p.vx)*blend;p.vz+=(targetZ-p.vz)*blend;
  const oldY=p.y,was=p.grounded;const nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;if(!occupied(nx,p.y,p.z))p.x=nx;else p.vx=0;if(!occupied(p.x,p.y,nz))p.z=nz;else p.vz=0;
  const floor=groundAt(p.x,p.z,oldY+(was?.55:0));p.vy-=18*dt;p.y+=p.vy*dt;p.grounded=false;
  if(Number.isFinite(floor.y)&&((was&&floor.y-oldY<=.55)||(oldY>=floor.y&&p.y<=floor.y))){p.y=floor.y;p.vy=0;p.grounded=true;}
  if(p.y<-45)rescue(s);
 }
 for(let i=0;i<s.drones.length;i++){const b=s.drones[i];if(b.hp<=0)continue;b.stun=Math.max(0,b.stun-dt);if(b.stun>0)continue;const t=s.time*.5+i;b.x=b.origin.x+Math.sin(t)*2.4;b.z=b.origin.z+Math.cos(t*.8)*2.2;b.y=b.origin.y+Math.sin(t*2)*.45;b.attack-=dt;
  if(b.attack<=0&&distance(p,b)<30&&clearLine(b,{x:p.x,y:p.y+1.3,z:p.z})){const to={x:p.x,y:p.y+1.1,z:p.z},len=distance(to,b);s.bullets.push({x:b.x,y:b.y,z:b.z,vx:(to.x-b.x)/len*13,vy:(to.y-b.y)/len*13,vz:(to.z-b.z)/len*13,life:4});b.attack=2.4;emit(s,'enemy-shot');}
 }
 for(let i=s.bullets.length-1;i>=0;i--){const b=s.bullets[i];b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;if(distance(b,{x:p.x,y:p.y+1,z:p.z})<.85){hurt(s,input.explorer?8:15);b.life=0;}if(b.life<=0||SOLIDS.some(q=>b.x>q.x1&&b.x<q.x2&&b.y>q.y1&&b.y<q.y2&&b.z>q.z1&&b.z<q.z2))s.bullets.splice(i,1);}
}
export function jump(s){if(s.p.rail){detach(s,true);return true;}if(s.p.grounded){s.p.vy=7;s.p.grounded=false;s.p.y+=.05;return true;}return false;}

// Room-scale translation is collision checked independently of joystick motion.
export function roomMove(s,dx,dz){if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)>.5||s.p.rail)return false;const p=s.p;if(!occupied(p.x+dx,p.y,p.z))p.x+=dx;if(!occupied(p.x,p.y,p.z+dz))p.z+=dz;return true;}
