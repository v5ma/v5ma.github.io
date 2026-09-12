/* Pilgrim's Rest: bounded, versioned local expedition checkpoints.
 * Geometry is regenerated, never trusted from disk. Only model-owned mutable
 * fields are restored. Checksums detect damage, not deliberate client cheating.
 * One atomic envelope holds the profile, run and its reward-banking receipts.
 */
(function(root){'use strict';
 const C=root.VesperCore||(typeof require!=='undefined'?require('./core.js'):null);
 const P=root.VesperChronicle||(typeof require!=='undefined'?require('./chronicle.js'):null);
 const E=root.VesperEncounters||(typeof require!=='undefined'?require('./encounters.js'):null);
 const KEY='vesperfall-expedition-v1',PROFILE_KEY='vesperfall-profile-v1',GENERATOR='hollow-dominions-1',LIMIT=180000;
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),copy=o=>JSON.parse(JSON.stringify(o));
 const fail=message=>{throw new Error(message);};
 function object(o){if(!o||typeof o!=='object'||Array.isArray(o))fail('Expected an object.');return o;}
 function keys(o,allowed){object(o);for(const k of Object.keys(o))if(!allowed.includes(k))fail('Unrecognized save field: '+k);return o;}
 function num(n,min=0,max=1000000,integer=false){if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))fail('A saved number is out of bounds.');return n;}
 function bool(v){if(typeof v!=='boolean')fail('A saved flag is invalid.');return v;}
 function choice(v,values){if(!values.includes(v))fail('A saved option is unsupported.');return v;}
 function vector(v,max=4096){if(!Array.isArray(v)||v.length!==3)fail('A saved pose is invalid.');return v.map(n=>num(n,-max,max));}
 function array(v,max){if(!Array.isArray(v)||v.length>max)fail('Saved collection is too large.');return v;}
 function unique(v,max,validate){const a=array(v,max).map(validate);if(new Set(a).size!==a.length)fail('A saved collection contains duplicates.');return new Set(a);}
 const numberFields={health:[.000001,10000],maxHealth:[100,10000],power:[.1,10000],time:[0,10000000],playerSlow:[0,10],score:[0,100000000],kills:[0,1000000],shots:[0,1000000],hits:[0,1000000],blinkCD:[0,10],invuln:[0,10],damageTaken:[0,1000000],guard:[0,200],maxGuard:[100,200],guardLock:[0,10],shardCharges:[0,3],maxShards:[2,3],shardRecharge:[-1,10],shardCD:[0,10],headshots:[0,1000000],blocks:[0,1000000],blinks:[0,1000000],shardsUsed:[0,1000000],sectors:[0,99]};
 const flags=['finished','portalReady','volleyUnlocked','ricochetUnlocked','quickwind','challenge'];
 const sets=['discovered','orders','sideRewards','targets'];
 const counters=['score','kills','shots','hits','shardCharges','maxShards','headshots','blocks','blinks','shardsUsed','sectors'];
 const enemyFields=['id','room','kind','p','hp','maxHp','speed','cd','wind','slow','frozen','recovery','dead','aware','required','bodyRadius','headRadius','facing','aim','windTotal','phase','charge','combo','comboTime'];
 const stateFields=[...Object.keys(numberFields),...flags,...sets,'p','head','phase','ammo','type','weapon','crossbow','arrows','bolts','hazards','enemies','pickups'];
 function enemy(raw,base){keys(raw,enemyFields);const out={...base};
  for(const k of['id','room','kind','maxHp','speed','required','bodyRadius','headRadius'])if(raw[k]!==base[k])fail('Enemy identity or stats do not match this world.');
  out.p=vector(raw.p);out.hp=num(raw.hp,-100000,base.maxHp);out.dead=bool(raw.dead);out.aware=bool(raw.aware);if(out.dead!==(out.hp<=0))fail('Enemy life state is inconsistent.');
  for(const k of['cd','wind','slow','frozen','recovery','windTotal','comboTime'])if(own(raw,k))out[k]=num(raw[k],-10000000,60);
  for(const k of['facing','aim'])if(own(raw,k))out[k]=vector(raw[k]);
  if(own(raw,'phase'))out.phase=choice(raw.phase,['dormant','frozen','charging','striking','recovering','winding','guarding','hunting']);
  if(own(raw,'combo'))out.combo=num(raw.combo,0,2,true);
  if(raw.charge){keys(raw.charge,['dir','left','speed']);out.charge={dir:vector(raw.charge.dir,1),left:num(raw.charge.left,-1,30)};if(own(raw.charge,'speed'))out.charge.speed=num(raw.charge.speed,0,40);}
  else if(own(raw,'charge'))out.charge=null;
  if(out.wind>0&&!out.aim)fail('The saved windup has no committed aim.');
  return out;
 }
 function projectile(raw,kind){const arrow=kind==='arrow';keys(raw,arrow?['p','v','type','damage','life','dead','bounces']:['p','v','life','kind','slow','damage']);
  const out={p:vector(raw.p),v:vector(raw.v,200),life:num(raw.life,0,8)};
  if(arrow){out.type=choice(raw.type,['plain','cinder','frost','blink','volley','ricochet']);out.damage=num(raw.damage,0,1000000);out.dead=bool(raw.dead);out.bounces=num(raw.bounces??0,0,2,true);}
  else {out.kind=choice(raw.kind,Object.keys(E.names));if(own(raw,'slow'))out.slow=num(raw.slow,0,10);if(own(raw,'damage'))out.damage=num(raw.damage,0,200);}
  return out;
 }
 function capture(s,meta){if(s.unscored||s.world.ar||!['playing','reward'].includes(s.phase)||s.health<=0)fail('Only a living scored expedition can be suspended.');
  const state={};for(const k of[...Object.keys(numberFields),...flags,'p','head','phase','ammo','type','weapon','crossbow','arrows','bolts','hazards'])state[k]=copy(s[k]??(k==='playerSlow'?0:undefined));
  for(const k of sets)state[k]=[...(s[k]||[])];
  state.enemies=s.world.enemies.map(e=>{const o={};for(const k of enemyFields)if(own(e,k))o[k]=copy(e[k]);return o;});
  state.pickups=s.world.pickups.map(p=>({id:p.id,taken:p.taken}));
  return {generator:GENERATOR,seed:s.world.seed,depth:s.world.depth,meta:copy(meta),state};
 }
 function restore(checkpoint){keys(checkpoint,['generator','seed','depth','meta','state']);
  if(checkpoint.generator!==GENERATOR)fail('This expedition needs its original world-generator version.');
  if(typeof checkpoint.seed!=='string'||!/^[-\w]{1,24}$/.test(checkpoint.seed))fail('Saved seed is invalid.');
  const depth=num(checkpoint.depth,1,99,true),d=keys(checkpoint.state,stateFields);
  const s=C.create(checkpoint.seed,depth,{challenge:bool(d.challenge)?'nightfall':'normal',ricochet:bool(d.ricochetUnlocked)});
  for(const[k,[min,max]]of Object.entries(numberFields))s[k]=num(d[k],min,max,counters.includes(k));
  for(const k of flags)s[k]=bool(d[k]);
  s.p=vector(d.p);s.head=vector(d.head);s.phase=choice(d.phase,['playing','reward']);
  if(s.health>s.maxHealth||s.guard>s.maxGuard||s.shardCharges>s.maxShards)fail('Saved resources exceed their capacities.');
  if(!C.walkable(s.world,s.p,.26)||Math.abs(C.floorAt(s.world,s.p)-s.p[1])>.06)fail('Saved position is not on a supported floor.');
  if(C.len(C.sub(s.head,s.p))>4)fail('Saved head pose is outside the player space.');
  s.ammo={};keys(d.ammo,['cinder','frost','volley','ricochet']);for(const k of['cinder','frost','volley','ricochet'])s.ammo[k]=num(d.ammo[k],0,100000,true);
  s.type=choice(d.type,['plain','cinder','frost','blink','volley','ricochet']);s.weapon=choice(d.weapon,['bow','crossbow']);
  keys(d.crossbow,['loaded','reload','reloadDuration']);s.crossbow={loaded:bool(d.crossbow.loaded),reload:num(d.crossbow.reload,0,2)};if(own(d.crossbow,'reloadDuration'))s.crossbow.reloadDuration=num(d.crossbow.reloadDuration,0,2);
  s.discovered=unique(d.discovered,25,v=>num(v,0,24,true));s.targets=unique(d.targets,4,v=>num(v,0,3,true));s.orders=unique(d.orders,15,v=>choice(v,Object.keys(E.names)));s.sideRewards=unique(d.sideRewards,3,v=>choice(v,['survey','reliquary','orders']));
  if(array(d.enemies,21).length!==s.world.enemies.length)fail('Enemy roster does not match the seed.');
  s.world.enemies=d.enemies.map((e,i)=>enemy(e,s.world.enemies[i]));
  if(array(d.pickups,100).length!==s.world.pickups.length)fail('Supply roster does not match the seed.');
  d.pickups.forEach((p,i)=>{keys(p,['id','taken']);if(p.id!==s.world.pickups[i].id)fail('Saved pickup identity is invalid.');s.world.pickups[i].taken=bool(p.taken);});
  s.arrows=array(d.arrows,48).map(a=>projectile(a,'arrow'));s.bolts=array(d.bolts,24).map(b=>projectile(b,'bolt'));
  s.hazards=array(d.hazards,12).map(h=>{keys(h,['p','radius','life','kind','owner']);return {p:vector(h.p),radius:num(h.radius,0,6),life:num(h.life,0,2),kind:choice(h.kind,['alchemist','colossus']),owner:num(h.owner,0,20,true)};});
  const ready=s.world.enemies.filter(e=>e.required!==false).every(e=>e.dead);if(s.portalReady&&!ready||s.phase==='reward'&&(!s.portalReady||!s.finished))fail('Beacon state is inconsistent.');
  const m=keys(checkpoint.meta,['id','banked','receipt','yaw','pitch','focus']);if(typeof m.id!=='string'||!/^[-a-zA-Z0-9]{8,64}$/.test(m.id))fail('Saved expedition identity is invalid.');
  const meta={id:m.id,banked:num(m.banked,0,s.kills,true),yaw:num(m.yaw,-Math.PI,Math.PI),pitch:num(m.pitch,-1.5,1.5),focus:num(m.focus,0,3),receipt:{}};
  keys(m.receipt,P.FIELDS);for(const k of P.FIELDS)if(own(m.receipt,k))meta.receipt[k]=num(m.receipt[k],0,s[k],true);
  // Physical input latches and cosmetic history are deliberately not restored.
  s.shield=null;s.events=[];s.sparks=[];s.eventSeq=0;s.unscored=false;s.manualPickups=false;
  return {game:s,meta};
 }
 function checksum(text){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0).toString(16).padStart(8,'0');}
 function encode(profile,checkpoint,revision=1,now=Date.now()){
  if(checkpoint)restore(checkpoint);const data={schema:1,revision:num(revision,1,1000000000,true),savedAt:num(now,0,9000000000000000,true),profile:P.clean(profile),checkpoint:checkpoint||null};
  const payload=JSON.stringify(data),raw=JSON.stringify({checksum:checksum(payload),payload});if(raw.length>LIMIT)fail('The expedition exceeds the local checkpoint budget.');return raw;
 }
 function decode(raw){try{if(typeof raw!=='string'||raw.length>LIMIT)fail('Checkpoint is missing or too large.');const outer=keys(JSON.parse(raw),['checksum','payload']);if(typeof outer.payload!=='string'||checksum(outer.payload)!==outer.checksum)fail('Checkpoint integrity check failed.');
   const d=keys(JSON.parse(outer.payload),['schema','revision','savedAt','profile','checkpoint']);if(d.schema!==1)fail('This checkpoint schema is not supported.');num(d.revision,1,1000000000,true);num(d.savedAt,0,9000000000000000,true);object(d.profile);
   return {ok:true,profile:P.clean(d.profile),checkpoint:d.checkpoint,restored:d.checkpoint?restore(d.checkpoint):null,revision:d.revision,savedAt:d.savedAt};
  }catch(e){return {ok:false,error:e.message};}}
 class Store{
  constructor(storage){this.storage=storage;this.raw=null;this.data=null;this.error=null;this.read();}
  read(){try{this.raw=this.storage.getItem(KEY);this.data=this.raw===null?null:decode(this.raw);this.error=this.data&&!this.data.ok?this.data.error:null;}catch(e){this.error='Local storage is unavailable.';}return this.data;}
  write(profile,checkpoint){try{if(this.error)fail(this.error);if(this.storage.getItem(KEY)!==this.raw)fail('Another tab changed this expedition. Reload before saving.');
    const next=encode(profile,checkpoint,(this.data?.revision||0)+1);this.storage.setItem(KEY,next);this.raw=next;this.data=decode(next);
    // The envelope is authoritative. Legacy mirror failure never rolls it back.
    try{this.storage.setItem(PROFILE_KEY,JSON.stringify(P.clean(profile)));}catch{}
    return {ok:true,revision:this.data.revision,savedAt:this.data.savedAt};
   }catch(e){return {ok:false,error:e.message};}}
  discard(profile){try{if(this.storage.getItem(KEY)!==this.raw)fail('Another tab changed this expedition. Reload before discarding.');const next=encode(profile,null,(this.data?.revision||0)+1);this.storage.setItem(KEY,next);this.raw=next;this.data=decode(next);this.error=null;try{this.storage.setItem(PROFILE_KEY,JSON.stringify(P.clean(profile)));}catch{}return {ok:true};}catch(e){return {ok:false,error:e.message};}}
 }
 const api={KEY,PROFILE_KEY,GENERATOR,LIMIT,capture,restore,encode,decode,Store,checksum};root.PilgrimSave=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
