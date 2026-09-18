import test from 'node:test';
import assert from 'node:assert/strict';
import {FIELD_MISSIONS,MOUNTS,UTILITY_ORDER,catalog,freshField,fieldKey,readField,saveField,sanitizeField,beginField,currentField,advanceField,interruptField,raySphere,validWorkPose} from '../field-operations-core.js';
const event=(p,t,mode,extra={})=>({verb:p.verb,target:t.id,valid:true,mode,vehicle:mode,carrier:mode,dt:1/60,...extra});
test('Twelve authored assignments have unique stable IDs, real phase verbs and supported vehicle roles',()=>{
 assert.equal(FIELD_MISSIONS.length,12);assert.equal(new Set(FIELD_MISSIONS.map(m=>m.id)).size,12);
 for(const scene of ['classic','tidegate'])assert.equal(catalog(scene).length,6);
 for(const m of FIELD_MISSIONS){assert.ok(m.brief.length>60);assert.ok(m.stages.length>=2);assert.equal(m.stages.at(-1).verb,'report');for(const v of m.vehicles)assert.ok(MOUNTS[v]);for(const p of m.stages){assert.ok(p.targets.length);for(const t of p.targets)assert.ok(t.kind==='animal'?!!t.uid:[t.x,t.y,t.z].every(Number.isFinite));}}
 assert.equal(new Set(FIELD_MISSIONS.flatMap(m=>m.stages.map(p=>p.verb))).size,12);
});
test('Every jeep, buggy, boat and helicopter has a distinct mounted water, pulse, survey and recovery profile',()=>{
 assert.equal(Object.keys(MOUNTS).length,4);for(const p of Object.values(MOUNTS)){for(const k of UTILITY_ORDER)assert.ok(p[k]);assert.ok(p.origin.every(Number.isFinite));assert.ok(p.scan>p.cable&&p.cable>0);}
 assert.equal(new Set(Object.values(MOUNTS).map(p=>p.name)).size,4);
});
// Pure progression fixtures. These do not claim a native mission playthrough.
for(const m of FIELD_MISSIONS)test(`Model fixture completes ${m.id}, round-trips between phases and never pays twice`,()=>{
 let s=freshField();assert.ok(beginField(s,m.scene,m.id));const vehicle=m.vehicles[0];
 for(let pi=0;pi<m.stages.length;pi++){
  const p=m.stages[pi],mode=['report','install','confirm'].includes(p.verb)?'foot':vehicle;
  for(const t of p.targets){let changed=false;for(let n=0;n<400&&!currentField(s,m.scene)?.record.done.includes(t.id);n++){
    changed=advanceField(s,m.scene,event(p,t,mode,{vehicle,carrier:vehicle}))||changed;
    if(!currentField(s,m.scene)||currentField(s,m.scene).record.stage>pi)break;
   }assert.ok(changed,t.id);}
  s=sanitizeField(JSON.parse(JSON.stringify(s)),m.scene);assert.equal(s.records[m.id].stage,pi+1);
 }
 assert.equal(s.commendations,1);assert.equal(s.active,null);assert.equal(beginField(s,m.scene,m.id),false);
 assert.equal(advanceField(s,m.scene,event(m.stages.at(-1),m.stages.at(-1).targets[0],'foot')),false);assert.equal(s.commendations,1);
});
test('Wrong scene, phase, vehicle, pause and invalid evidence cannot complete work',()=>{
 const s=freshField();assert.equal(beginField(s,'tidegate','classic-cooling'),false);beginField(s,'classic','classic-cooling');const p=currentField(s,'classic').phase,t=p.targets[0];
 for(const changes of [{mode:'foot'},{mode:'boat'},{verb:'report'},{target:'other'},{valid:false},{paused:true}])for(let n=0;n<400;n++)advanceField(s,'classic',event(p,t,'jeep',changes));
 assert.equal(s.records['classic-cooling'].stage,0);assert.deepEqual(s.records['classic-cooling'].units,{});
});
test('Interrupted scans clear partial dwell without discarding already recorded subjects',()=>{
 const s=freshField();beginField(s,'classic','classic-canopy');let p=currentField(s,'classic').phase;
 for(let i=0;i<151;i++)advanceField(s,'classic',event(p,p.targets[0],'helicopter'));
 for(let i=0;i<35;i++)advanceField(s,'classic',event(p,p.targets[1],'helicopter'));
 interruptField(s,'classic');assert.ok(s.records['classic-canopy'].done.includes('giant'));assert.equal(s.records['classic-canopy'].units.armor,undefined);
});
test('Cargo is tied to its actual carrier and cannot be cloned into another assignment',()=>{
 const s=freshField();beginField(s,'classic','classic-cargo');let a=currentField(s,'classic');advanceField(s,'classic',event(a.phase,a.phase.targets[0],'jeep'));
 assert.equal(beginField(s,'classic','classic-cooling'),false);s.active=null;assert.equal(beginField(s,'classic','classic-cargo'),true);
 a=currentField(s,'classic');assert.equal(advanceField(s,'classic',event(a.phase,a.phase.targets[0],'foot',{carrier:'helicopter'})),false);assert.ok(a.record.cargo);
 assert.equal(advanceField(s,'classic',event(a.phase,a.phase.targets[0],'foot',{carrier:'jeep'})),true);assert.equal(a.record.cargo,null);
});
test('Malformed cargo cannot skip recovery and arbitrary score/target values are rejected',()=>{
 const raw={version:1,active:'tidegate-boat-rescue',commendations:999,records:{'tidegate-boat-rescue':{stage:2,done:['bad'],units:{bad:Infinity},cargo:null}},selection:{boat:'laser'}};
 const s=sanitizeField(raw,'tidegate');assert.equal(s.records['tidegate-boat-rescue'].stage,1);assert.equal(s.commendations,0);assert.deepEqual(s.selection,{});
});
test('Saving isolates both scenes and all historic progress; unsupported future field records are read-only',()=>{
 const data=new Map([['dino-atlas.frontier.v2','old-frontier'],['dino-atlas.tidegate.v1','old-district'],[fieldKey('tidegate'),'other-scene']]);const store={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const s=freshField();beginField(s,'classic','classic-cooling');assert.ok(saveField(store,s,'classic'));assert.equal(readField(store,'classic').active,'classic-cooling');assert.equal(data.get(fieldKey('tidegate')),'other-scene');assert.equal(data.get('dino-atlas.frontier.v2'),'old-frontier');assert.equal(data.get('dino-atlas.tidegate.v1'),'old-district');
 data.set(fieldKey('classic'),'{"version":9,"new":"protected"}');assert.equal(saveField(store,s,'classic'),false);assert.ok(data.get(fieldKey('classic')).includes('protected'));
 data.set(fieldKey('classic'),'broken');assert.ok(saveField(store,s,'classic'));assert.equal(readField(null,'classic').active,null);
});
test('Survey and hoist pose gates reject movement, occlusion, wrong height, missing data and excessive range',()=>{
 const p={x:0,y:10,z:0},t={x:0,y:1,z:0};assert.ok(validWorkPose(p,t,{visible:true,range:12}));
 for(const opts of [{visible:false},{visible:true,speed:9},{visible:true,range:5},{visible:true,maxHeight:3},{visible:true,minHeight:12}])assert.equal(validWorkPose(p,t,opts),false);
 assert.equal(validWorkPose({x:NaN,y:1,z:0},t,{visible:true}),false);
});
test('Aim geometry selects a forward target and never an off-axis or behind-muzzle target',()=>{
 const o={x:0,y:1,z:0},d={x:0,y:0,z:-1};assert.equal(raySphere(o,d,{x:0,y:1,z:-10},1),9);assert.equal(raySphere(o,d,{x:0,y:1,z:10},1),null);assert.equal(raySphere(o,d,{x:2,y:1,z:-10},1),null);
});

test('Secured cargo preserves a validated carrier pose and occupancy without expanding the historical district save',()=>{
 const s=freshField();beginField(s,'tidegate','tidegate-cargo');const a=currentField(s,'tidegate');advanceField(s,'tidegate',event(a.phase,a.phase.targets[0],'jeep'));
 s.records['tidegate-cargo'].cargo.pose={x:-29,y:1.4,z:26,heading:Math.PI};s.records['tidegate-cargo'].cargo.occupied=true;
 const saved=sanitizeField(JSON.parse(JSON.stringify(s)),'tidegate');assert.deepEqual(saved.records['tidegate-cargo'].cargo,s.records['tidegate-cargo'].cargo);
 s.records['tidegate-cargo'].cargo.pose.x=99999;const bad=sanitizeField(s,'tidegate');assert.equal(bad.records['tidegate-cargo'].cargo.pose,undefined);assert.ok(bad.records['tidegate-cargo'].cargo);
});
