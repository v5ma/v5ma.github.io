'use strict';
const test=require('node:test'),a=require('node:assert/strict'),D=require('./pilgrimage-driver.cjs'),{C,P,S}=D;
const meta=()=>({id:'pilgrimage-test-run',banked:0,receipt:{},yaw:0,pitch:0,focus:1});
const create=(seed='BELL-01',stage=0,tier=0)=>C.create(seed,stage+1,{pilgrimage:{stage,tier}});
const cp=s=>S.capture(s,meta());
const restores=c=>S.restore(JSON.parse(JSON.stringify(c))).game;
test('Pilgrimage is two explicitly versioned chapters, not a rewrite of saved Returning Bell geometry',()=>{
 const c=create(),r=C.create('BELL-01',1,{returningBell:'returning-bell-2'}),old=C.create('BELL-01',1,{returningBell:'returning-bell-1'}),end=C.create('BELL-01');
 a.equal(c.world.generator,'lantern-causeway-1');a.equal(r.world.generator,'returning-bell-2');a.equal(old.world.generator,'returning-bell-1');a.equal(end.world.rooms.length,25);
 for(const s of[c,r,old,end])a.deepEqual(restores(cp(s)).world,s.world);
});
test('Both chapter catalogues assemble stable identities with independent decoration and gameplay streams',()=>{
 for(const stage of[0,1]){const s=create('STREAMS',stage);a.deepEqual(create('STREAMS',stage).world,s.world);
  const alt=P.generate('STREAMS',stage+1,stage,k=>VesperEncounters.training(k),0,{decorationSalt:7});
  for(const k of['floors','solids','enemies','pickups','targets'])a.deepEqual(alt[k],P.generate('STREAMS',stage+1,stage,k=>VesperEncounters.training(k))[k]);
  a.notDeepEqual(alt.pipeline.decoration,s.world.pipeline.decoration);a.equal(alt.pipeline.signature,s.world.pipeline.signature);
  a.equal(new Set(Object.values(s.world.pipeline.streams)).size,4);
  a.equal(new Set(s.world.floors.map(f=>f.id)).size,s.world.floors.length);a.equal(new Set(s.world.pickups.map(p=>p.id)).size,s.world.pickups.length);
  a.equal(new Set(s.world.pipeline.modules.flatMap(m=>m.roles.map(r=>r.stableId))).size,s.world.enemies.length);
 }
});
test('Ninety-six seeds cover both families, tiers, mirrors and bent seams with actual 0.42-metre clearance queries',()=>{
 const variants=new Set(),signatures=new Set();for(let i=0;i<48;i++)for(const stage of[0,1]){const s=create('PIPE-'+i,stage,i%3),w=s.world;const v=P.validate(w,C);a.equal(v.ok,true,JSON.stringify(v.failures));
  a.equal(w.rooms.length,9);a.equal(w.enemies.length,6);a.equal(w.pickups.length,5);a.equal(s.discovered.size,1);
  for(const m of w.pipeline.modules)variants.add(m.kind+':'+m.side);signatures.add(w.pipeline.signature);
  for(const st of[[true,false],[false,true],[true,true]]){const state={...s.pilgrimage,shutters:st,gates:[true,true]};P.restore(s,state);a.equal(P.validate(w,C).ok,true);}
 }
 a.equal(variants.size,8);a.ok(signatures.size>40);
});
test('Real movement, reversible controls, service return and reload in the opened gate complete both chapters',()=>{
 for(const stage of[0,1]){const {s,out}=D.chapter('BELL-01',stage,'gallery');a.equal(out.phase,'reward');a.equal(s.targets.size,2);a.equal(s.kills,0);a.deepEqual(s.pilgrimage.gates,[true,true]);a.equal(s.sectors,1);
  a.deepEqual(restores(cp(s)).pilgrimage,s.pilgrimage);a.equal(C.interact(s),false);a.equal(s.sectors,1);
 }
});
test('Ordinary release and signal arrows provide alternate completion without requiring the upper floor or kills',()=>{
 for(const stage of[0,1]){const {s,out}=D.chapter('BELL-01',stage,'direct');a.equal(out.phase,'reward');a.equal(out.shots,4);a.equal(s.targets.size,2);a.equal(s.kills,0);a.deepEqual(s.pilgrimage.gates,[false,false]);a.ok(out.distanceMetres<100);}
});
test('Actual golden trajectories reach the advertised upper landing and leave an ordinary escape',()=>{
 for(const stage of[0,1]){const s=create('BELL-01',stage),m=s.world.pipeline.modules[0];D.walk(s,0,12);D.walk(s,m.side*5,3);
  const target=[m.x+m.side*11,3.2,m.z+2.5],dir=D.aim(s.head,target,.2,'blink'),prediction=C.predictBlink(s,s.head,dir,.2);
  a.equal(prediction.ok,true,JSON.stringify(prediction));D.shoot(s,target,'blink',.2);a.equal(s.blinks,1);a.ok(Math.abs(s.p[1]-3.2)<.02);
  D.path(s,[[m.side*11,3.2,2.5],[m.side*11,3.2,4],[m.side*11,0,12]]);a.ok(Math.abs(s.p[1])<.02);
 }
});
test('A missed brass shot does not consume essential resources or close the ordinary gallery',()=>{
 const s=create(),m=s.world.pipeline.modules[0];D.walk(s,0,12);D.walk(s,0,3);const ammo={...s.ammo};D.shoot(s,[0,6,3-10]);a.equal(s.pilgrimage.shutters[0],false);a.deepEqual(s.ammo,ammo);
 D.walk(s,0,12);D.path(s,m.paths.gallery.slice(1,3));D.walk(s,m.winch[0],m.winch[2]);a.equal(C.interact(s),true);a.equal(s.pilgrimage.shutters[0],true);
});
test('The direct crossing is genuinely blocked until raised, while the sheltered bypass always remains traversable',()=>{
 const s=create(),m=s.world.pipeline.modules[0];a.equal(C.segmentBlocked(s.world,[0,1.5,3],[0,1.5,-8]),true);
 D.walk(s,0,12);D.walk(s,0,3);D.shoot(s,m.release);a.equal(C.segmentBlocked(s.world,[0,1.5,3],[0,1.5,-8]),false);a.equal(P.validate(s.world,C).ok,true);
});
test('Both model and checkpoint refuse to close a shutter on the actual player footprint',()=>{
 const s=create(),m=s.world.pipeline.modules[0];D.walk(s,0,12);D.walk(s,0,3);D.shoot(s,m.release);D.walk(s,0,-4);
 a.equal(P.toggle(s,0,C),false);a.equal(s.pilgrimage.shutters[0],true);a.equal(restores(cp(s)).p[2],s.p[2]);
 const bad=cp(s);bad.state.pilgrimage.shutters[0]=false;a.throws(()=>restores(bad),/supported floor/);
});
test('Open crossing plus in-flight arrows restores against the exact chapter and progression snapshot',()=>{
 const s=create('BELL-01',1,2),m=s.world.pipeline.modules[0];D.walk(s,0,12);D.walk(s,0,3);D.shoot(s,m.release);D.walk(s,0,-4);a.equal(C.fire(s,s.head,[0,0,-1],1,'plain'),true);
 const r=restores(cp(s));for(const k of['p','head','arrows','ammo','pilgrimage','world'])a.deepEqual(r[k],s[k]);
 for(let i=0;i<12;i++){C.step(s,D.DT);C.step(r,D.DT);}a.deepEqual(r.arrows,s.arrows);a.equal(r.health,s.health);
});
test('A future generator, changed identity, fake completion or altered tier cannot reinterpret a saved world',()=>{
 const base=cp(create());for(const mutate of[c=>c.generator='lantern-causeway-2',c=>c.state.pilgrimage.signature='00000000',c=>c.state.pilgrimage.tier=2,c=>c.depth=2,c=>c.state.pilgrimage.stage=1,c=>c.state.portalReady=true,c=>c.state.pilgrimage.shutters=[true],c=>c.state.pilgrimage.extra=true]){const bad=JSON.parse(JSON.stringify(base));mutate(bad);a.throws(()=>restores(bad));}
});
test('A real chapter outcome advances to Ashen Archive and a second outcome continues to legacy Endless',()=>{
 const first=D.chapter('BELL-01',0,'direct').s,next=C.reward(first,'supplies');a.equal(next.world.generator,'ashen-archive-1');a.equal(next.world.depth,2);a.equal(next.sectors,1);a.equal(next.shots,first.shots);a.deepEqual(next.pilgrimage.shutters,[false,false]);a.deepEqual(restores(cp(next)).world,next.world);
 const end=D.chapter('BELL-01',1,'direct').s,legacy=C.reward(end,'power');a.equal(legacy.world.rooms.length,25);a.equal(legacy.pilgrimage,undefined);a.equal(legacy.world.depth,3);
 a.equal(C.reward(create(),'power'),null);
});
test('Source default is Goldwind while valid stored preferences and Classic option remain',()=>{
 const fs=require('node:fs'),text=fs.readFileSync(require.resolve('../goldwind-xr.js'),'utf8');
 a.ok(text.indexOf('<option value="goldwind">')<text.indexOf('<option value="classic">'));
 a.ok(text.includes('el.value=prefs[id]'));a.ok(text.includes('vesperfall-goldwind-v1'));
});
