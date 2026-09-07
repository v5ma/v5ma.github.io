const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../core'),P=require('../chronicle'),I=require('../input');
function fresh(){const s=C.create('BELL-01');s.world.enemies=[];return s;}
function tick(s,n=180){for(let i=0;i<n;i++)C.step(s,1/90,s.head);}
function shot(s,charge=.45,degrees=30){const a=degrees*Math.PI/180,dir=[0,Math.sin(a),-Math.cos(a)],origin=C.add(s.head,C.mul(dir,.18));return {dir,origin,charge};}
test('Blink prediction uses identical swept fixed-step trajectory and its first collision',()=>{
 for(const charge of [.2,.35,.45,.65,1])for(const angle of [10,30,45,65]){const s=fresh(),a=shot(s,charge,angle),before=JSON.stringify(s),p=C.predictBlink(s,a.origin,a.dir,charge);assert.equal(JSON.stringify(s),before);assert.ok(C.fire(s,a.origin,a.dir,charge,'blink'));tick(s,365);const done=s.events.find(e=>e.type==='blink');assert.equal(!!done,p.ok,JSON.stringify({charge,angle,p}));if(done)for(let k=0;k<3;k++)assert.ok(Math.abs(s.p[k]-p.destination[k])<1e-7);}
});
test('A visible light-draw aiming lane reaches the gallery and does not teleport through its deck',()=>{
 const s=fresh(),a=shot(s,.45,30),p=C.predictBlink(s,a.origin,a.dir,a.charge);assert.ok(p.ok,p.reason);assert.equal(p.destination[1],3.2);C.fire(s,a.origin,a.dir,a.charge,'blink');tick(s,180);assert.equal(s.p[1],3.2);
 const blocked=C.predictBlink(s,[0,1.6,-4.85],[0,1,0],.4);assert.equal(blocked.ok,false);assert.equal(blocked.hit,'wall');
});
test('Blink validation rejects missing floors, enemies, edges and non-finite targets',()=>{
 const s=fresh();for(const p of[[0,Infinity,0],[NaN,0,0],[0,3,0],[10,0,10],[6,0,6]])assert.equal(C.landing(s,p).ok,false);
 s.world.enemies=[{p:[0,1.05,0],dead:false}];assert.equal(C.landing(s,[0,0,0]).reason,'enemy occupies landing');
});
test('Front-facing shield stops an incoming swept bolt, consumes guard and records one block',()=>{
 const s=fresh();C.shield(s,{p:[0,1.65,2.4],normal:[0,0,-1]});s.bolts=[{p:[0,1.65,1.8],v:[0,0,9],life:3}];tick(s,18);assert.equal(s.health,100);assert.equal(s.blocks,1);assert.ok(s.guard<83);assert.equal(s.bolts.length,0);
});
test('Shield is not omnidirectional, does not cover the whole world, and cannot shoot while raised',()=>{
 for(const x of[0,.85]){const s=fresh();C.shield(s,{p:[x,1.65,2.4],normal:[0,0,-1]});s.bolts=[{p:[0,1.65,3.6],v:[0,0,-9],life:3}];tick(s,12);assert.equal(s.blocks,0);assert.equal(s.health,88);}
 const s=fresh();C.shield(s,{p:[0,1.65,2.4],normal:[0,0,-1]});assert.equal(C.fire(s,s.head,[0,0,-1],1),false);assert.equal(C.shield(s,{p:[8,1.6,0],normal:[0,0,-1]}),false);
});
test('A depleted shield breaks and regenerates only after its recovery lock',()=>{
 const s=fresh();s.guard=20;C.shield(s,{p:[0,1.65,2.4],normal:[0,0,-1]});s.bolts=[{p:[0,1.65,2.3],v:[0,0,18],life:1}];tick(s,1);assert.equal(s.blocks,1);assert.equal(s.shield,null);const guard=s.guard;assert.ok(s.guardLock>1.7);tick(s,80);assert.equal(s.guard,guard);tick(s,110);assert.ok(s.guard>guard);
});
test('Pause/invalid tracking can explicitly lower the shield without damage or a synthetic block',()=>{
 const s=fresh();assert.ok(C.shield(s,{p:[0,1.65,2.4],normal:[0,0,-1]}));C.shield(s,null);assert.equal(s.shield,null);assert.equal(s.blocks,0);
});
test('Shard steps carry the player along supported ground and consume one charge',()=>{
 const s=fresh();assert.ok(C.shard(s,[0,0,-1]));assert.ok(s.p[2]<=0&&s.p[2]>=-1.01);assert.equal(s.shardCharges,1);assert.equal(s.shardsUsed,1);assert.equal(C.shard(s,[0,0,-1]),false);tick(s,330);assert.equal(s.shardCharges,2);
});
test('Shard cannot tunnel through walls, cover or unsupported gaps, and failed use is free',()=>{
 const s=fresh();s.world.solids.push({min:[-.8,0,2.3],max:[.8,2,2.4],type:'test-wall'});const p=[...s.p];assert.equal(C.shard(s,[0,0,-1]),false);assert.deepEqual(s.p,p);assert.equal(s.shardCharges,2);
 const q=fresh();q.p=[6,0,3];C.shard(q,[1,0,0]);assert.ok(q.p[0]<7);assert.equal(C.shard(q,[NaN,0,0]),false);
});
test('Crossbow has a real loaded state, deliberate timed reload, and no weapon-swap refill',()=>{
 const s=fresh();assert.ok(C.setWeapon(s,'crossbow'));assert.ok(C.fire(s,s.head,[0,0,-1],1));assert.equal(s.crossbow.loaded,false);assert.equal(C.fire(s,s.head,[0,0,-1],1),false);C.setWeapon(s,'bow');C.setWeapon(s,'crossbow');assert.equal(s.crossbow.loaded,false);assert.ok(C.reload(s));assert.equal(C.reload(s),false);tick(s,50);assert.equal(s.crossbow.loaded,false);tick(s,100);assert.equal(s.crossbow.loaded,true);assert.ok(C.fire(s,s.head,[0,0,-1],1));assert.equal(s.shots,2);
});
test('Crossbow blink preview and actual bolt use the same fixed draw power',()=>{
 const s=fresh();C.setWeapon(s,'crossbow');const a=shot(s,1,-10),p=C.predictBlink(s,a.origin,a.dir,.1);C.fire(s,a.origin,a.dir,.1,'blink');tick(s,180);assert.equal(s.crossbow.loaded,false);assert.equal(!!s.events.find(e=>e.type==='blink'),p.ok);
});
test('Volley produces three distinct physical arrows for one finite charge, not three free shots',()=>{
 const s=fresh();assert.equal(C.fire(s,s.head,[0,0,-1],1,'volley'),false);s.volleyUnlocked=true;s.ammo.volley=1;assert.ok(C.fire(s,s.head,[0,0,-1],1,'volley'));assert.equal(s.arrows.length,3);assert.equal(s.shots,1);assert.equal(s.ammo.volley,0);assert.equal(new Set(s.arrows.map(a=>a.v[0])).size,3);assert.equal(C.fire(s,s.head,[0,0,-1],1,'volley'),false);
});
test('Legacy profile migration preserves renown, purchases and records; ignores unrelated fields',()=>{
 const p=P.clean({version:1,shards:9,best:810,depth:4,heart:true,power:true,secret:'not retained'});assert.equal(p.version,2);assert.equal(p.shards,9);assert.equal(p.best,810);assert.equal(p.depth,4);assert.equal(p.heart,true);assert.equal(p.power,true);assert.equal(p.secret,undefined);assert.equal(p.volley,false);
});
test('Chronicle banks only new counters; two saves cannot duplicate a reward',()=>{
 const s=fresh();s.kills=5;s.headshots=3;s.blocks=5;s.blinks=5;s.sectors=1;const first=P.bank({},s),second=P.bank(first.profile,s,first.receipt);assert.equal(first.unlocked.length,5);assert.deepEqual(second.profile,first.profile);assert.equal(second.unlocked.length,0);const next=C.create('NEXT',1,second.profile);assert.equal(next.ammo.volley,4);assert.equal(next.maxGuard,120);assert.equal(next.maxShards,3);assert.equal(next.quickwind,true);
});
test('Practice cannot advance permanent achievements; future sectors retain earned run counters',()=>{
 const s=fresh();s.kills=9;s.blocks=8;s.headshots=5;assert.equal(P.bank({},s,{},true).profile.stats.kills,0);s.phase='reward';const n=C.reward(s,'power');assert.equal(n.kills,9);assert.equal(n.blocks,8);assert.equal(n.headshots,5);assert.equal(n.power,s.power+.12);
});
test('Enemy attacks lock an observed aim at windup so moving away is a meaningful defense',()=>{
 const s=C.create('BELL-01'),e=s.world.enemies[0];e.p=[0,1.05,-2];e.aware=true;e.cd=0;s.world.enemies=[e];C.step(s,1/90,s.head);const aim=[...e.aim];s.head=[2,1.65,3];tick(s,76);assert.deepEqual(e.aim,aim);assert.ok(s.bolts.length>0);assert.ok(Math.abs(s.bolts[0].v[0])<.01);
});
test('Nightfall changes enemies only when explicitly selected and survives sector transition',()=>{
 const base=C.create('N'),hard=C.create('N',1,{challenge:'nightfall'});assert.ok(hard.world.enemies[0].hp>base.world.enemies[0].hp);hard.phase='reward';const next=C.reward(hard,'supplies');assert.equal(next.challenge,true);
});
