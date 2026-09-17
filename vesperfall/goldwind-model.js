/* Goldwind: pure physical action rules. Inputs are poses, not player positions.
 * Combat, projectiles, landing, and reward ownership remain in the simulation. */
(function(root){'use strict';
 const C=root.VesperCore||(typeof require!=='undefined'?require('./core.js'):null);
 const I=root.VesperInput||(typeof require!=='undefined'?require('./input.js'):null);
 const A=root.CloisterLayout||(typeof require!=='undefined'?require('./architecture.js'):null);
 const finite=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
 const DAMAGE=['plain','cinder','frost','volley','ricochet'];
 function available(s,type){return DAMAGE.includes(type)&&(!(type in s.ammo)||s.ammo[type]>0)&&(type!=='volley'||s.volleyUnlocked)&&(type!=='ricochet'||s.ricochetUnlocked);}
 class Draw{
  constructor(latch=new I.BowLatch()){this.latch=latch;this.reset();}
  reset(){this.latch.reset();this.ready=false;this.source=null;this.type=null;}
  update(nock,hand,combat,travel,allowed,type,max=.56){
   if(!allowed||!finite(nock)||!finite(hand)){this.reset();return {drawing:false,charge:0};}
   if(!this.ready){if(!combat&&!travel){this.ready=true;this.latch.update(nock,hand,false,true,max);}return {drawing:false,charge:0};}
   if(combat&&travel||this.source==='damage'&&travel||this.source==='blink'&&combat){this.reset();return {drawing:false,charge:0,cancelled:true};}
   if(!this.source&&(combat||travel)){this.source=travel?'blink':'damage';this.type=travel?'blink':type;}
   const source=this.source,chosen=this.type,pressed=source==='blink'?travel:combat;
   const r=this.latch.update(nock,hand,!!pressed,true,max);
   if(r.shot)r.shot.type=chosen;
   r.type=chosen;r.source=source;
   if(!combat&&!travel){this.source=null;this.type=null;}
   return r;
  }
 }
 class Throw{
  constructor(){this.reset();}
  reset(){this.ready=false;this.held=false;this.samples=[];this.lastTime=null;}
  update(p,pressed,time,allowed=true){
   if(!allowed||!finite(p)||!Number.isFinite(time)){this.reset();return null;}
   const prev=this.samples.at(-1);
   if(this.lastTime!==null&&(time<=this.lastTime||time-this.lastTime>.3)){this.reset();this.lastTime=time;return null;}
   this.lastTime=time;
   if(!this.ready){if(!pressed)this.ready=true;return null;}
   if(pressed&&!this.held)this.samples=[];
   if(pressed||this.held){
    if(prev&&this.held&&C.len(C.sub(p,prev.p))>Math.max(.22,(time-prev.t)*10)){this.reset();return null;}
    this.samples.push({p:[...p],t:time});
    while(this.samples.length>2&&this.samples[1].t<time-.18)this.samples.shift();
    if(this.samples.length>32)this.samples.shift();
   }
   let result=null;
   if(!pressed&&this.held){
    const a=this.samples[0],b=this.samples.at(-1),span=b.t-a.t,delta=C.sub(b.p,a.p),distance=C.len(delta);
    if(this.samples.length>=3&&span>=.035&&span<=.32&&distance>=.075){
     const v=C.mul(delta,1/span),speed=C.len(v),horizontal=Math.hypot(v[0],v[2]);
     if(speed>=.65&&speed<=9&&horizontal>=.5)result={origin:[...p],velocity:[v[0],v[1],v[2]],speed};
    }
    this.samples=[];
   }
   this.held=pressed;return result;
  }
 }
 function launchDisc(s,origin,velocity){
  if(s.phase!=='playing'||s.world.ar||s.shardCharges<1||s.shardCD>0||!finite(origin)||!finite(velocity)||C.len(C.sub(origin,s.head))>1.6||C.segmentBlocked(s.world,s.head,origin,.02))return null;
  const horizontal=Math.hypot(velocity[0],velocity[2]);if(horizontal<.5)return null;
  const speed=C.clamp(1.5+horizontal*.7,2,6),v=[velocity[0]/horizontal*speed,C.clamp(velocity[1]*.35,-2.8,1.2),velocity[2]/horizontal*speed];
  return {p:[...origin],v,origin:[...origin],start:[...s.p],life:1.2,accumulator:0,done:false,ok:false,reason:'flying'};
 }
 function commitDisc(s,destination){
  if(s.phase!=='playing'||s.world.ar||s.shardCharges<1||s.shardCD>0||!finite(destination))return {ok:false,reason:'not ready'};
  const d=C.sub(destination,s.p),distance=Math.hypot(d[0],d[2]);
  if(distance<.75||distance>4||!C.landing(s,destination).ok)return {ok:false,reason:'landing outside clear short range'};
  let old=[...s.p];const n=Math.ceil(distance/.1);
  for(let i=1;i<=n;i++){
   const p=[s.p[0]+d[0]*i/n,old[1],s.p[2]+d[2]*i/n],y=A.floorAt(s.world,p,0,.15,.15);
   if(y===null)return {ok:false,reason:'no continuous support'};p[1]=y;
   if(!C.walkable(s.world,p,.42)||C.segmentBlocked(s.world,C.add(old,[0,.8,0]),C.add(p,[0,.8,0]),.26)||s.world.enemies.some(e=>!e.dead&&Math.hypot(e.p[0]-p[0],e.p[2]-p[2])<1.2))return {ok:false,reason:'route blocked'};
   old=p;
  }
  if(Math.abs(old[1]-destination[1])>.1)return {ok:false,reason:'different floor'};
  s.p=old;s.shardCharges--;s.shardCD=.3;s.shardRecharge=s.shardRecharge||3.5;s.shardsUsed++;s.invuln=Math.max(s.invuln,.12);
  C.emit(s,'shard',{p:[...s.p],distance,physical:true});return {ok:true,reason:'landed',distance};
 }
 function stepDisc(s,f,dt){
  if(!f||f.done)return f;
  if(s.phase!=='playing'||C.len(C.sub(s.p,f.start))>.35){f.done=true;f.reason='player relocated';return f;}
  f.accumulator+=C.clamp(dt,0,.12);
  while(f.accumulator>=1/90&&!f.done){
   f.accumulator-=1/90;f.life-=1/90;f.v[1]-=C.G/90;const next=C.add(f.p,C.mul(f.v,1/90));let hit=null;
   for(const b of s.world.solids){const t=C.boxHit(f.p,next,b,.065);if(t!==null&&(!hit||t<hit.t))hit={t,kind:'wall',p:C.add(f.p,C.mul(C.sub(next,f.p),t))};}
   const floor=C.floorHit(s.world,f.p,next);if(floor&&(!hit||floor.t<hit.t))hit={...floor,kind:'floor'};
   if(hit){f.p=hit.p;f.done=true;Object.assign(f,hit.kind==='floor'?commitDisc(s,hit.p):{ok:false,reason:'stone blocks the disk'});}
   else f.p=next;
   if(!f.done&&(f.life<=0||Math.hypot(f.p[0]-f.start[0],f.p[2]-f.start[2])>4)){f.done=true;f.reason='out of short range';}
  }
  return f;
 }
 const api={DAMAGE,available,Draw,Throw,launchDisc,commitDisc,stepDisc};root.GoldwindModel=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
