import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newState,makeWorld,step,saveData,readSave} from '../model.mjs';
import {attachFrontier} from '../frontier-core.mjs';
import {attachQuarter,quarterAct,quarterEnter,quarterState,quarterSurface} from '../quarter-core.mjs';
import {QUARTER_SITES,QUARTER_FLOORS,QUARTER_GATE} from '../quarter-data.mjs';
import {QUARTER_OBSERVATIONS,normalizeObservations,quarterNotebook,quarterPlace,mapLayer,floorOnLayer} from '../quarter-notes.mjs';
const world=makeWorld(),fresh=()=>attachQuarter(attachFrontier(newState()),null,{fresh:true});
// Deliberately positioned CPU fixtures, not native walking evidence.
function at(s,id){const p=QUARTER_SITES.find(p=>p.id===id);Object.assign(s,{x:p.x,z:p.z,speed:0,lift:0});s.quarter.groundY=p.y;}
for(const id of Object.keys(QUARTER_OBSERVATIONS))test(`The ${id} observation requires a stopped, grounded visit on its actual floor`,()=>{
 const s=fresh();assert.equal(quarterAct(s,id,'read').ok,false);assert.deepEqual(s.quarter.observations,[]);
 at(s,id);s.speed=1;assert.equal(quarterAct(s,id,'read').ok,false);s.speed=0;s.lift=.2;assert.equal(quarterAct(s,id,'read').ok,false);s.lift=0;
 assert.ok(quarterAct(s,id,'read').ok);assert.deepEqual(s.quarter.observations,[id]);quarterAct(s,id,'read');assert.deepEqual(s.quarter.observations,[id]);assert.equal(s.credits,0);assert.equal(s.life.xp,0);
});
test('The gallery cannot reveal the ledger from its vertically overlapping floor',()=>{const s=fresh();at(s,'cellar');s.quarter.groundY=3.2;assert.equal(quarterAct(s,'cellar','read').ok,false);assert.deepEqual(s.quarter.observations,[]);});
test('An observation survives the original save format without forcing a new game or replay',()=>{const s=fresh();at(s,'loft');quarterAct(s,'loft','read');const raw=readSave(JSON.stringify(saveData(s)),world),resumed=attachQuarter(attachFrontier(newState(raw),raw.frontier),raw.quarter);assert.deepEqual(resumed.quarter.observations,['loft']);assert.equal(resumed.x,-20);assert.equal(resumed.credits,0);assert.equal(raw.version,2);});
test('Old Quarter saves get empty notes without losing any completed work',()=>{const q=quarterState({active:true,archOpen:true,goodsAccess:true,parcel:true,reported:true,delivery:3});assert.deepEqual(q.observations,[]);assert.ok(q.archOpen&&q.reported);assert.equal(q.delivery,3);});
test('Malformed notes are bounded, deduplicated and cannot introduce arbitrary content',()=>{for(const raw of [null,'cellar',{},42])assert.deepEqual(normalizeObservations(raw),[]);assert.deepEqual(normalizeObservations(['cellar','invented','cellar','__proto__','precision']),['precision','cellar']);});
test('Opening a notebook or changing its floor view cannot manufacture observations or progress',()=>{const s=fresh(),before=JSON.stringify(s);assert.deepEqual(quarterNotebook(s),[]);for(const f of QUARTER_FLOORS){mapLayer('current',s);floorOnLayer(f,'upper');quarterPlace(s);}assert.equal(JSON.stringify(s),before);});
test('Every authored walking floor has a meaningful, non-generic place cue',()=>{const s=fresh();for(const f of QUARTER_FLOORS){s.quarter.surface=f.id;const p=quarterPlace(s);assert.notEqual(p.name,'Waterwheel Quarter',f.id);assert.ok(p.hint.length>30,f.id);}});
test('The floor map separates the cellar from the overlapping raised gallery and includes connecting ramps',()=>{
 const cellar=QUARTER_FLOORS.find(f=>f.id==='maintenance-cellar'),gallery=QUARTER_FLOORS.find(f=>f.id==='hoist-gallery'),ramp=QUARTER_FLOORS.find(f=>f.id==='channel-ramp');
 assert.ok(floorOnLayer(cellar,'service'));assert.ok(!floorOnLayer(cellar,'upper'));assert.ok(floorOnLayer(gallery,'upper'));assert.ok(!floorOnLayer(gallery,'service'));assert.ok(floorOnLayer(ramp,'street')&&floorOnLayer(ramp,'service'));
 const s=fresh();for(const [y,expected]of [[-2.6,'service'],[0,'street'],[1.6,'upper']]){s.quarter.groundY=y;assert.equal(mapLayer('current',s),expected);}assert.equal(mapLayer('invented',s),'all');
});
test('Every legitimate parcel route remains payable without collecting optional observations',()=>{const s=fresh();at(s,'parcel');assert.ok(quarterAct(s,'parcel','recover').ok);at(s,'workshop');assert.ok(quarterAct(s,'workshop','report').ok);assert.equal(s.credits,60);assert.deepEqual(s.quarter.observations,[]);assert.equal(quarterNotebook(s).find(n=>n.id==='commission-found').title,'The missing commission is safe');});
test('Entering the Quarter cannot suspend an active old road test or erase its result',()=>{const s=attachQuarter(attachFrontier(newState()),null);s.mode='foot';s.x=QUARTER_GATE.x;s.z=QUARTER_GATE.z;s.cycle.active={gate:1,seconds:12};const before=structuredClone(s.cycle);assert.equal(quarterEnter(s),false);assert.deepEqual(s.cycle,before);s.cycle.active=null;s.cycle.pending={seconds:27};assert.equal(quarterEnter(s),true);assert.deepEqual(s.cycle.pending,{seconds:27});});
test('Resident feet sample the actual ramp rather than interpolating through its top landing',()=>{const s=fresh();for(let i=0;i<2400;i++){step(s,world,{},1/60);for(const a of s.quarter.actors){const f=quarterSurface(a.x,a.z,a.y);assert.ok(f,a.id);assert.ok(Math.abs(f.y-a.y)<1e-8,a.id);}}});
