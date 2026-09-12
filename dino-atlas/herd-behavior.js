// Living Herds: deterministic arcade behavior, not reconstructed paleobiology.
// No browser, renderer or save side effects. The existing pen/water boundaries remain authoritative.
export const HERDS_BUILD = 'living-herds-20260912.1';
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const angleDelta = (to, from) => Math.atan2(Math.sin(to-from), Math.cos(to-from));
export const HERD_PROFILES = Object.freeze({
 giant: {name:'Giant browser',warning:2,turn:1.1,stride:1.65,water:.78,zapper:.7,horn:.76,voice:65},
 armored: {name:'Armored browser',warning:1.8,turn:1.5,stride:.95,water:.9,zapper:.85,horn:.8,voice:125},
 horned: {name:'Horned grazer',warning:1.6,turn:1.7,stride:1.15,water:1,zapper:.9,horn:1,voice:155},
 hunter: {name:'Large hunter',warning:1.75,turn:2,stride:1.65,water:.95,zapper:1.15,horn:.9,voice:88},
 swift: {name:'Small hunter',warning:1.25,turn:3,stride:.8,water:1.15,zapper:1,horn:1.2,voice:420},
 grazer: {name:'Social browser',warning:1.5,turn:2.3,stride:1.1,water:1.1,zapper:.95,horn:1.1,voice:230}
});
export function profileFor(a){
 const k=a.kind;
 return HERD_PROFILES[['sauropod','brachio'].includes(k)?'giant':['ankylosaur','stego'].includes(k)?'armored':['trike','dome'].includes(k)?'horned':['rex','allosaur','spinosaur'].includes(k)?'hunter':k==='raptor'?'swift':'grazer'];
}
export function lifeOf(a){
 return a.life || (a.life={state:'idle',age:0,clock:0,warning:0,charge:0,cooldown:0,distance:0,speed:0,turn:0,head:0,blocked:0,tolerance:0,lastEffect:-100,lastKind:'',responseCount:0,warningCount:0,wasThreat:false});
}
export function tickLife(a,dt){
 const l=lifeOf(a);l.clock+=dt;l.age+=dt;l.cooldown=Math.max(0,l.cooldown-dt);l.tolerance=Math.max(0,l.tolerance-dt*.1);
}
function setState(a,state){const l=lifeOf(a);if(l.state!==state){l.state=state;l.age=0;}return l;}
export function herdEffect(a,origin,kind){
 const l=lifeOf(a),profile=profileFor(a),tool=['water','zapper','horn'].includes(kind)?kind:'water';
 const interval=tool==='water'?.22:tool==='zapper'?.35:.9;
 if(l.lastKind===tool&&l.clock-l.lastEffect<interval)return false;
 const repeated=l.clock-l.lastEffect<1.1;
 l.tolerance=clamp(l.tolerance+(repeated?.16:0),0,1.8);
 const strength=(profile[tool]||1)*Math.max(.55,1-l.tolerance*.2);
 const dx=a.x-origin.x,dz=a.z-origin.z,len=Math.hypot(dx,dz)||1;
 a.toolVector={x:dx/len,z:dz/len};a.deter=(tool==='zapper'?7.5:tool==='horn'?4.5:6)*Math.max(.8,strength);
 // First contact always has a useful effect. Rapid repeats do not indefinitely re-stun.
 a.deter=Math.max(repeated?3.6:4.5,a.deter);a.stun=tool==='zapper'&&!repeated?1.1:Math.max(0,a.stun||0);
 a.effect=tool;a.herdSpeed=(tool==='horn'?4.4:5.6)*strength;
 a.mood=a.stun?'stunned':'being herded';a.attackCooldown=Math.max(2,a.attackCooldown||0);
 if(['alert','charge'].includes(l.state)&&tool==='zapper')l.interruptCount=(l.interruptCount||0)+1;
 l.warning=0;l.charge=0;l.cooldown=3;l.lastEffect=l.clock;l.lastKind=tool;l.responseCount++;
 setState(a,a.stun?'interrupted':'retreat');return true;
}
export function buildHerdGrid(animals,size=14){
 const cells=new Map();
 for(const a of animals){const key=Math.floor(a.x/size)+','+Math.floor(a.z/size);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(a);}
 return {near(a){const x=Math.floor(a.x/size),z=Math.floor(a.z/size),out=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)out.push(...(cells.get((x+dx)+','+(z+dz))||[]));return out;}};
}
export function shapeIntent(a,p,dt,time,intent,context){
 const l=lifeOf(a),profile=profileFor(a),gap=Math.hypot(a.x-p.x,a.z-p.z);
 let {tx,tz,speed}=intent;
 const threat=a.mood==='pursuing'&&(!context?.visible||context.visible(a,p));
 if(a.deter>0){setState(a,a.stun>0?'interrupted':'retreat');l.warning=0;l.charge=0;}
 else if(threat){
  if(l.cooldown>0){speed=0;a.mood='recovering';setState(a,'recovering');}
  else if(l.charge>0){l.charge-=dt;speed=6.2;a.mood='pursuing';setState(a,'charge');if(l.charge<=0){l.cooldown=3;l.warning=0;}}
  else{
   if(!l.wasThreat)l.warning=0;
   if(l.warning===0)l.warningCount++;
   l.warning+=dt;speed=0;a.mood='warning';setState(a,'alert');
   if(l.warning>=profile.warning){l.charge=2.5;l.warning=0;}
  }
 }else{
  l.warning=0;l.charge=0;
  if(a.mood==='pursuing'){speed=0;a.mood='listening';setState(a,'idle');}
  else if(a.mood==='startled'){setState(a,'retreat');}
  else if(a.mood==='returning to feeder'){
   if(intent.canFeed&&Math.hypot(tx-a.x,tz-a.z)<2.8){speed=0;a.mood='feeding';setState(a,'feed');}else setState(a,'walk');
  }else{
   const cycle=((time+(a.phase||0)*3)%24+24)%24;
   if(gap<16&&gap>5&&p.y<5&&cycle<4){speed=0;a.mood='watching';setState(a,'watch');}
   else if(cycle>18){speed=0;a.mood=cycle>21?'resting':'grazing';setState(a,cycle>21?'rest':'feed');}
   else setState(a,'walk');
  }
 }
 l.wasThreat=threat;
 const facing=gap<30&&p.y<6?Math.atan2(p.x-a.x,p.z-a.z):a.angle;
 l.head+=clamp(angleDelta(facing,a.angle),-.65,.65)*dt*2-l.head*Math.min(1,dt*2);
 if(['alert','recovering','watch'].includes(l.state)){const delta=angleDelta(facing,a.angle);a.angle+=clamp(delta,-profile.turn*dt,profile.turn*dt);}
 // Local spacing biases the desired direction; it never directly teleports residents.
 if(speed>0&&context?.grid&&a.deter<=0&&l.state!=='charge'){
  let sx=0,sz=0;
  for(const b of context.grid.near(a)){
   if(b===a||b.pen!==a.pen)continue;
   const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz),space=Math.min(8,a.radius+b.radius+1);
   if(d>space)continue;
   const tie=(String(a.uid)<String(b.uid)?1:-1),ux=d>.01?dx/d:tie,uz=d>.01?dz/d:0;
   sx+=ux*(space-d)/space;sz+=uz*(space-d)/space;
  }
  // Do not push a returning animal away from the only open gateway.
  if(!a.pen||context.atGate?.(a)!==true){tx+=sx*5;tz+=sz*5;}
 }
 return {tx,tz,speed,turn:profile.turn};
}
export function resolveMove(a,old,proposed,context){
 if(!context?.canStep||context.canStep(a,old,proposed))return proposed;
 const dx=proposed.x-old.x,dz=proposed.z-old.z;
 const l=lifeOf(a);l.blocked+=1/60;
 // Alternate the preferred shoulder periodically when blocked, without crossing walls.
 const side=Math.floor(l.clock/2)%2?1:-1;
 for(const s of [side,-side]){const n={x:old.x-dz*s,z:old.z+dx*s};if(context.canStep(a,old,n))return n;}
 return old;
}
export function finishMove(a,old,dt){
 const l=lifeOf(a),d=Math.hypot(a.x-old.x,a.z-old.z);l.speed=dt>0?d/dt:0;l.distance+=d;
 if(d>.0001){l.blocked=0;if(l.state==='walk'&&Math.abs(l.turn)>.9)setState(a,'turn');}
 else if(l.state==='walk'||l.state==='turn'){setState(a,'idle');}
 return a;
}
// Bounded wildlife call scheduling shared with tests. Threats win over idle chatter.
export class HerdCueBudget{
 constructor(){this.next=0;this.until=0;this.last=new Map();this.accepted=0;this.dropped=0;}
 take(uid,now,priority=false,density='balanced'){
  if(!Number.isFinite(now)||density==='off'||now<this.until||now<(this.last.get(uid)??-100)+8||(!priority&&now<this.next)){this.dropped++;return false;}
  this.until=now+1.6;this.next=now+(density==='quiet'?18:10);this.last.set(uid,now);this.accepted++;return true;
 }
}
