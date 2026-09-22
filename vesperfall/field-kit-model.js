/* Pilgrim's Kit v1: finite supplies, swept throws and expedition-owned state.
 * All coordinates are metres; all timers are simulation seconds. No renderer,
 * networking, new layout identity, independent economy or save namespace. */
(function(root){'use strict';
 const TYPES=['mend','frost'],CAP=3;
 const finite=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),len=a=>Math.hypot(...a);
 function create(){return {version:1,stock:{mend:2,frost:2},caches:[0,0,0],flights:[],serial:0,throws:0,drinks:0};}
 function ensure(s){return s.fieldkit||(s.fieldkit=create());}
 function eligible(s){return s.phase==='playing'&&!s.world.ar&&!s.unscored;}
 function anchors(s){
  const w=s.world,p=w.start;if(!finite(p))return [];const out=[{id:0,label:"Ilyra's field supplies",p:[p[0]+1.5,p[1],p[2]-1]}];
  if(w.pilgrimage){const c=w.pipeline.connector,m=w.pipeline.modules[0];
   out.push({id:1,label:'Refuge resupply',p:[(c[1][0]+c[2][0])/2+1.5,c[1][1],c[1][2]]});
   out.push({id:2,label:'Gallery courier cache',p:[m.winch[0],m.winch[1],m.winch[2]+2]});
  }return out;
 }
 function center(c){return add(c.p,[0,.64,0]);}
 function visible(s,a,b,C){if(C.segmentBlocked(s.world,a,b,.015))return false;const f=C.floorHit(s.world,a,b)||C.floorHit(s.world,b,a);return !f||f.t>=.99;}
 function cacheHit(s,a,b,C){if(!eligible(s))return null;const k=s.fieldkit;let best=null;
  for(const c of anchors(s)){if(k?.caches[c.id])continue;const t=C.sphereHit(a,b,center(c),.28);if(t!==null&&(!best||t<best.t))best={t,kind:'field-cache',id:c.id};}return best;
 }
 function open(s,id,C){if(!eligible(s)||!anchors(s).some(c=>c.id===id))return false;const k=ensure(s);if(k.caches[id])return false;k.caches[id]=1;C.emit(s,'kit-cache-open',{id,text:'Seal broken. Reach the cache to take its supplies.'});return true;}
 function collect(s,id,origin,C){const c=anchors(s).find(c=>c.id===id);if(!eligible(s)||!c||!finite(origin)||len(sub(origin,s.head))>1.7||len(sub(origin,center(c)))>1.8||!visible(s,s.head,origin,C)||!visible(s,origin,center(c),C))return false;
  const k=ensure(s);if(k.caches[id]===2)return false;
  if(k.stock.mend===CAP&&k.stock.frost===CAP){C.emit(s,'kit-message',{text:'Satchel full. These supplies stay here.'});return false;}
  const m=Math.min(1,CAP-k.stock.mend),f=Math.min(1,CAP-k.stock.frost);k.stock.mend+=m;k.stock.frost+=f;k.caches[id]=2;
  C.emit(s,'kit-supply',{id,text:'Field supplies: +'+m+' healing, +'+f+' frost. This cache is now empty.'});return true;
 }
 function drink(s,C){if(!eligible(s)||s.health>=s.maxHealth||ensure(s).stock.mend<1)return false;const k=ensure(s),amount=Math.min(32,s.maxHealth-s.health);k.stock.mend--;s.health+=amount;k.drinks++;C.emit(s,'kit-drink',{amount,text:'Healing vial: +'+Math.ceil(amount)+' vitality.'});return true;}
 function launch(s,type,p,v,C){if(!eligible(s)||!TYPES.includes(type)||!finite(p)||!finite(v)||len(v)>16||len(sub(p,s.head))>1.7||!visible(s,s.head,p,C))return false;
  const k=ensure(s);if(!k.stock[type]||k.flights.length>=4)return false;
  k.stock[type]--;k.throws++;const f={id:++k.serial,type,p:[...p],v:[...v],life:8};k.flights.push(f);C.emit(s,'kit-throw',{id:f.id,kind:type,p:[...p]});return true;
 }
 function splash(s,f,hit,C){
  // Stay on the incident side of a wall; never apply effects through masonry.
  const speed=len(f.v),away=speed?mul(f.v,-.11/speed):[0,.1,0];const p=hit.kind==='floor'?add(hit.p,[0,.11,0]):add(hit.p,away);
  let affected=0,amount=0;
  if(f.type==='mend'){
   const body=add(s.p,[0,.65,0]);if(len(sub(body,p))<2.8&&visible(s,p,body,C)){amount=Math.min(32,s.maxHealth-s.health);s.health+=amount;affected=amount>0?1:0;}
  }else for(const e of s.world.enemies){if(e.dead||!C.canTarget(s,e))continue;const d=len(sub(e.p,p));if(d<3.2&&visible(s,p,e.p,C)){C.damageEnemy(s,e,30*s.power*(1-.45*d/3.2),'frost');affected++;}}
  s.sparks.push({p:[...p],life:.55,type:f.type==='frost'?'frost':'blink'});
  C.emit(s,'kit-splash',{kind:f.type,p,affected,amount,text:f.type==='mend'?(amount?'Healing splash: +'+Math.ceil(amount)+' vitality.':'Healing splash missed or vitality was full.'):'Frost burst: '+affected+' threat'+(affected===1?'':'s')+' interrupted.'});
 }
 function step(s,dt,C){if(!s.fieldkit||!s.fieldkit.flights.length||!eligible(s))return;const k=s.fieldkit;
  for(const f of k.flights){if(f.life<=0)continue;f.v[1]-=9.8*dt;const next=add(f.p,mul(f.v,dt));let hit=null;
   const use=(t,data)=>{if(t!==null&&t>=0&&t<=1&&(!hit||t<hit.t))hit={t,...data};};
   for(const b of s.world.solids)use(C.boxHit(f.p,next,b,.07),{kind:'wall'});
   const floor=C.floorHit(s.world,f.p,next);if(floor)use(floor.t,{kind:'floor',p:floor.p});
   for(const e of s.world.enemies)if(!e.dead&&C.canTarget(s,e))use(C.sphereHit(f.p,next,e.p,(e.bodyRadius||.48)+.07),{kind:'enemy'});
   if(hit){hit.p??=add(f.p,mul(sub(next,f.p),hit.t));f.p=[...hit.p];splash(s,f,hit,C);f.life=0;}else{f.p=next;f.life-=dt;}
   if(f.life<=0||f.p[1]<-40){if(!hit)C.emit(s,'kit-lost',{kind:f.type,text:'Vial lost beyond the available ground.'});f.life=0;}
  }k.flights=k.flights.filter(f=>f.life>0);
 }
 function next(s,reward){const k=create();if(s.fieldkit){for(const t of TYPES)k.stock[t]=Math.min(CAP,s.fieldkit.stock[t]+(reward==='supplies'?1:0));}return k;}
 function restore(raw){
  const fail=()=>{throw Error('Invalid Pilgrim field-kit state.');};
  const exact=(o,names)=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==names.length||Object.keys(o).some(k=>!names.includes(k)))fail();};
  const integer=(v,max)=>{if(!Number.isInteger(v)||v<0||v>max)fail();};
  exact(raw,['version','stock','caches','flights','serial','throws','drinks']);if(raw.version!==1)fail();exact(raw.stock,TYPES);for(const t of TYPES)integer(raw.stock[t],CAP);
  if(!Array.isArray(raw.caches)||raw.caches.length!==3)fail();raw.caches.forEach(v=>integer(v,2));
  for(const n of ['serial','throws','drinks'])integer(raw[n],1000000);if(raw.serial!==raw.throws)fail();
  if(!Array.isArray(raw.flights)||raw.flights.length>4)fail();const ids=new Set();
  for(const f of raw.flights){exact(f,['id','type','p','v','life']);integer(f.id,raw.serial);if(!f.id||ids.has(f.id)||!TYPES.includes(f.type)||!finite(f.p)||f.p.some(v=>Math.abs(v)>4096)||!finite(f.v)||f.v.some(v=>Math.abs(v)>100)||!Number.isFinite(f.life)||f.life<=0||f.life>8)fail();ids.add(f.id);}
  return JSON.parse(JSON.stringify(raw));
 }
 class Motion{
  constructor(){this.reset();}
  reset(){this.samples=[];this.invalid=false;}
  sample(p,t){if(!finite(p)||!Number.isFinite(t)){this.invalid=true;return;}const prev=this.samples.at(-1);if(prev&&(t<=prev.t||t-prev.t>.3||len(sub(p,prev.p))>Math.max(.25,(t-prev.t)*14))){this.invalid=true;return;}this.samples.push({p:[...p],t});while(this.samples.length>2&&this.samples[1].t<t-.13)this.samples.shift();}
  release(p,t){this.sample(p,t);if(this.invalid||this.samples.length<3)return null;const a=this.samples[0],b=this.samples.at(-1),span=b.t-a.t,d=sub(b.p,a.p);if(span<.035||span>.3||len(d)<.055)return null;const v=mul(d,1/span),speed=len(v);return speed>=.6&&speed<=14?v:null;}
 }
 const api=Object.freeze({TYPES,CAP,create,ensure,eligible,anchors,center,cacheHit,open,collect,drink,launch,step,next,restore,Motion});root.PilgrimKitModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
