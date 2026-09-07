/* Gloamward — deterministic archery, encounter and navigation logic.
 * Coordinates are meters; Y is vertical. No A-Frame, DOM, network or saves here. */
export const VERSION='0.1.0';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const vec=(x=0,y=0,z=0)=>({x,y,z});
export const add=(a,b)=>vec(a.x+b.x,a.y+b.y,a.z+b.z);
export const sub=(a,b)=>vec(a.x-b.x,a.y-b.y,a.z-b.z);
export const mul=(a,s)=>vec(a.x*s,a.y*s,a.z*s);
export const length=a=>Math.hypot(a.x,a.y,a.z);
export const unit=a=>mul(a,1/(length(a)||1));
export const distance=(a,b)=>length(sub(a,b));
export function random(seed){let t=seed>>>0;return()=>{t+=0x6D2B79F5;let n=Math.imul(t^(t>>>15),1|t);n^=n+Math.imul(n^(n>>>7),61|n);return((n^(n>>>14))>>>0)/4294967296;};}
export function hash(text){let h=2166136261;for(const c of String(text).slice(0,64)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function seedText(input){const s=String(input??'').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,32);return s||'GREYBELL-01';}
export function intersects(a,b,box,margin=0){
 let lo=0,hi=1;for(const k of['x','y','z']){const d=b[k]-a[k],mn=box.min[k]-margin,mx=box.max[k]+margin;if(Math.abs(d)<1e-9){if(a[k]<mn||a[k]>mx)return null;}else{let p=(mn-a[k])/d,q=(mx-a[k])/d;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi)return null;}}
 return lo>=0&&lo<=1?lo:null;
}
export function sphereHit(a,b,center,r){const d=sub(b,a),f=sub(a,center),aa=d.x*d.x+d.y*d.y+d.z*d.z;if(aa<1e-12)return distance(a,center)<=r?0:null;const bb=2*(f.x*d.x+f.y*d.y+f.z*d.z),cc=f.x*f.x+f.y*f.y+f.z*f.z-r*r,disc=bb*bb-4*aa*cc;if(disc<0)return null;const t=(-bb-Math.sqrt(disc))/(2*aa);return t>=0&&t<=1?t:null;}
const box=(x,y,z,w,h,d,kind='stone')=>({min:vec(x-w/2,y,z-d/2),max:vec(x+w/2,y+h,z+d/2),kind});
export function makeWorld(seed){
 const rng=random(hash(seedText(seed))),rooms=[],floors=[],obstacles=[],enemies=[];
 for(let i=0;i<3;i++){
  const x=i?Math.round((rng()-.5)*4):0,z=-i*27;
  const room={id:i,name:['Greybell Court','The Amber Archive','The Hollow Spire'][i],x,z,theme:i};rooms.push(room);floors.push({x,z,w:20,d:20,y:0,room:i});
  for(const side of[-1,1]){obstacles.push(box(x+side*9.7,0,z,.6,2.2,20,'wall'));for(const zz of[-9.7,9.7])obstacles.push(box(x+side*6.5,0,z+zz,6.4,2.2,.6,'wall'));}
  // Keep a 4 m central corridor clear. Cover is restricted to authored side bays.
  for(const side of[-1,1])for(let j=0;j<2;j++){
   const xx=x+side*(4.0+rng()*1.6),zz=z-5+j*8+(rng()-.5)*1.5;
   obstacles.push(box(xx,0,zz,2+rng(),j===0?1.05:1.7,1.35,'cover'));
  }
  for(const side of[-1,1])obstacles.push(box(x+side*7.2,0,z-6.9,.8,5,.8,'column'));
  const count=i+2;for(let j=0;j<count;j++)enemies.push({id:`r${i}-${j}`,room:i,pos:vec(x+(j%2?1:-1)*(3.1+Math.floor(j/2)*1.2),0,z-3-j%2*2),home:vec(x+(j%2?1:-1)*3.8,0,z-4),hp:i===2&&j===0?95:32,maxHP:i===2&&j===0?95:32,type:i===2&&j===0?'keeper':j%2?'warden':'watcher',phase:rng()*6.28,cooldown:2+rng()*2,slow:0,alive:true});
  if(i){const prev=rooms[i-1],midZ=(prev.z+z)/2,midX=(prev.x+x)/2;floors.push({x:midX,z:midZ,w:5,d:9,y:0,room:i,bridge:true});for(const side of[-1,1])obstacles.push(box(midX+side*2.6,0,midZ,.25,1.1,9,'bridge-rail'));}
 }
 return {seed:seedText(seed),rooms,floors,obstacles,enemies,exit:vec(rooms[2].x,0,rooms[2].z-7.8)};
}
export function floorAt(world,p,unlocked=2){return world.floors.find(f=>f.room<=unlocked&&Math.abs(p.x-f.x)<f.w/2-.32&&Math.abs(p.z-f.z)<f.d/2-.32)||null;}
export function standingClear(world,p,unlocked=2){if(!floorAt(world,p,unlocked))return false;const a=vec(p.x,.1,p.z),b=vec(p.x,1.85,p.z);return !world.obstacles.some(o=>intersects(a,b,o,.29)!==null);}
export function slide(world,p,delta,unlocked){const out={...p};for(const axis of['x','z']){const candidate={...out,[axis]:out[axis]+delta[axis]};if(standingClear(world,candidate,unlocked))out[axis]=candidate[axis];}return out;}
export function gateBoxes(world,cleared){const result=[];for(let i=0;i<2;i++)if(!cleared.has(i)){const r=world.rooms[i];result.push(box(r.x,0,r.z-9.8,6,3.3,.4,'gate'));}return result;}
export function firstCollision(world,a,b,extra=[],margin=.025){let result=null;for(const o of world.obstacles.concat(extra)){const t=intersects(a,b,o,margin);if(t!==null&&(!result||t<result.t))result={t,box:o,position:add(a,mul(sub(b,a),t)),kind:o.kind};}
 if(a.y>=0&&b.y<=0){const t=a.y/(a.y-b.y),p=add(a,mul(sub(b,a),t));if(world.floors.some(f=>Math.abs(p.x-f.x)<=f.w/2&&Math.abs(p.z-f.z)<=f.d/2)&&(!result||t<result.t))result={t,position:p,kind:'floor'};}
 return result;
}
export class BowState{
 constructor(){this.cancel();this.previous=false;this.armed=false;}
 cancel(){this.nocked=false;this.pull=0;this.previous=false;this.armed=false;}
 update({valid,pressed,bow,hand}){
  if(!valid){this.cancel();return null;}if(!pressed&&!this.nocked)this.armed=true;
  const d=distance(bow,hand);let shot=null;
  if(pressed&&!this.previous&&this.armed&&d<=.32&&d>=.015){this.nocked=true;this.armed=false;}
  if(this.nocked){this.pull=clamp((d-.09)/.57,0,1);if(d>1.1){this.cancel();return null;}if(!pressed&&this.previous){if(this.pull>=.12)shot={origin:{...bow},direction:unit(sub(bow,hand)),power:this.pull};this.nocked=false;this.pull=0;}}
  this.previous=pressed;return shot;
 }
}
export function prediction(world,origin,direction,speed,gates=[],limit=90){let p={...origin},v=mul(unit(direction),speed);const points=[p];for(let i=0;i<limit;i++){const old={...p},dt=1/60;v.y-=9.8*dt;p=add(p,mul(v,dt));const hit=firstCollision(world,old,p,gates);points.push(hit?hit.position:p);if(hit)return {points,hit};}return {points,hit:null};}
export class Run{
 constructor(seed='GREYBELL-01'){this.reset(seed);}
 reset(seed){this.world=makeWorld(seed);this.enemies=this.world.enemies.map(e=>({...e,pos:{...e.pos},home:{...e.home}}));this.projectiles=[];this.cleared=new Set();this.state='ready';this.hp=100;this.maxHP=100;this.charge=6;this.maxCharge=6;this.damage=1;this.score=0;this.shots=0;this.hits=0;this.time=0;this.invulnerable=0;this.wave=0;this.events=[];this.serial=0;this.dodged=0;}
 start(){if(this.state==='ready')this.state='playing';}
 event(type,data={}){this.events.push({type,...data});if(this.events.length>64)this.events.shift();}
 fire(origin,direction,power,type='normal'){
  if(this.state!=='playing'||!['normal','shatter','snare','teleport'].includes(type)||!Number.isFinite(power)||power<.12||![...Object.values(origin),...Object.values(direction)].every(Number.isFinite))return false;
  if(type!=='normal'&&type!=='teleport'){if(this.charge<1){this.event('empty');return false;}this.charge--;}
  const p=clamp(power,0,1);this.projectiles.push({id:++this.serial,pos:{...origin},velocity:mul(unit(direction),type==='teleport'?12+8*p:14+23*p),power:p,type,life:5,enemy:false});if(this.projectiles.length>70)this.projectiles.shift();if(type!=='teleport')this.shots++;this.event('shot',{power:p,type});return true;
 }
 damageEnemy(e,amount){if(!e.alive)return;e.hp-=amount;this.event('hit',{id:e.id});if(e.hp<=0){e.alive=false;this.score+=e.type==='keeper'?250:75;this.event('defeat',{id:e.id});}}
 pick(choice){if(this.state!=='upgrade')return false;if(choice==='vitality'){this.maxHP+=15;this.hp=Math.min(this.maxHP,this.hp+40);}else if(choice==='power')this.damage+=.16;else if(choice==='quiver'){this.maxCharge+=3;this.charge=this.maxCharge;}else return false;this.state='playing';this.wave++;return true;}
 step(dt,head){
  if(this.state!=='playing')return;dt=clamp(dt,0,1/30);this.time+=dt;this.invulnerable=Math.max(0,this.invulnerable-dt);const gates=gateBoxes(this.world,this.cleared);
  const body=vec(head.x,Math.max(.25,head.y*.56),head.z);
  for(const e of this.enemies){if(!e.alive||e.room!==this.wave)continue;e.cooldown-=dt;e.slow=Math.max(0,e.slow-dt);const to=sub(body,e.pos),dist=Math.hypot(to.x,to.z);const speed=e.slow>0?.25:e.type==='warden'?1.0:.38;
   if(dist>3.5){const direction=unit(vec(to.x,0,to.z)),next=slide(this.world,e.pos,mul(direction,speed*dt),this.wave);e.pos=next;}
   if(e.cooldown<=0&&dist<22){const eye=add(e.pos,vec(0,1.35,0));if(!firstCollision(this.world,eye,head,gates,.01)){
    const target={...head},aim=unit(sub(target,eye));this.projectiles.push({id:++this.serial,pos:eye,velocity:mul(aim,e.type==='keeper'?8.5:7),power:1,type:'hostile',life:5,enemy:true});this.event('enemy-shot',{id:e.id});e.cooldown=e.type==='keeper'?2.3:3.5;
   }else e.cooldown=.45;}
  }
  const kept=[];
  for(const arrow of this.projectiles){arrow.life-=dt;if(arrow.life<=0)continue;const a={...arrow.pos};if(!arrow.enemy)arrow.velocity.y-=9.8*dt;arrow.pos=add(arrow.pos,mul(arrow.velocity,dt));let hit=firstCollision(this.world,a,arrow.pos,gates,.03);
   if(arrow.enemy){const t1=sphereHit(a,arrow.pos,head,.20),t2=sphereHit(a,arrow.pos,body,.29),values=[t1,t2].filter(t=>t!==null),t=values.length?Math.min(...values):null;if(t!==null&&(!hit||t<hit.t)){if(this.invulnerable<=0){this.hp=Math.max(0,this.hp-12);this.invulnerable=.8;this.event('hurt');if(!this.hp){this.state='dead';this.event('dead');}}continue;}}
   else if(arrow.type!=='teleport')for(const e of this.enemies){if(!e.alive||e.room!==this.wave)continue;const t=sphereHit(a,arrow.pos,add(e.pos,vec(0,1.0,0)),e.type==='keeper'?.65:.43);if(t!==null&&(!hit||t<hit.t))hit={t,position:add(a,mul(sub(arrow.pos,a),t)),kind:'enemy',enemy:e};}
   if(hit){if(arrow.type==='teleport'){
     const landing=hit.position;if(hit.kind==='floor'&&distance(head,landing)<=23&&standingClear(this.world,landing,this.wave)){this.event('teleport',{position:landing});}else this.event('teleport-miss');
    }else if(hit.enemy){this.hits++;this.damageEnemy(hit.enemy,(12+26*arrow.power)*this.damage);if(arrow.type==='snare'){hit.enemy.slow=4.5;}if(arrow.type==='shatter')for(const e of this.enemies)if(e!==hit.enemy&&e.alive&&distance(e.pos,hit.enemy.pos)<3.5&&!firstCollision(this.world,add(hit.enemy.pos,vec(0,.9,0)),add(e.pos,vec(0,.9,0)),[],.01))this.damageEnemy(e,22*this.damage);}
    this.event('impact',{position:hit.position,type:arrow.type});continue;
   }if(Math.abs(arrow.pos.x)<100&&arrow.pos.y>-20&&arrow.pos.y<70&&arrow.pos.z>-120&&arrow.pos.z<45)kept.push(arrow);
  }this.projectiles=kept;
  if(!this.cleared.has(this.wave)&&!this.enemies.some(e=>e.alive&&e.room===this.wave)&&this.state==='playing'){
   this.cleared.add(this.wave);this.charge=Math.min(this.maxCharge,this.charge+3);this.hp=Math.min(this.maxHP,this.hp+18);this.score+=150;
   if(this.wave<2){this.state='upgrade';this.event('upgrade');}else this.event('exit-open');
  }
  if(this.cleared.size===3&&distance(vec(head.x,0,head.z),this.world.exit)<2){this.state='won';this.score+=400;this.event('won');}
 }
}
