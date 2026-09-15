// Authoring-contract checks only. This module is NOT imported by the game.
// No collision, runtime save migration, rendering or hardware claims are made.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync(new URL('./waterwheel-quarter.design.json',import.meta.url),'utf8'));
const nodes=new Set(d.physical.nodes.map(n=>n.id));
const initial=Object.fromEntries(Object.entries(d.flags).map(([k,v])=>[k,v.initial]));
const available=(e,flags)=>e.requires.every(k=>flags[k]===true);
function distance(a,b,flags){
 const queue=[[a,0]],seen=new Set([a]);
 for(let i=0;i<queue.length;i++){
  const [n,steps]=queue[i];if(n===b)return steps;
  for(const e of d.physical.edges){
   if(!available(e,flags))continue;
   const next=e.a===n?e.b:e.bidirectional&&e.b===n?e.a:null;
   if(next&&!seen.has(next)){seen.add(next);queue.push([next,steps+1]);}
  }
 }
 return Infinity;
}
test('Contract distinguishes proposed content and geometry from implemented runtime',()=>{
 assert.equal(d.status,'design-only-not-runtime');assert.equal(d.physicsGeometryImplemented,false);assert.equal(d.presentation.runtimeImplemented,false);assert.equal(d.saveContract.migrationImplemented,false);
});
test('Every place has a distinct identity, ordinary purpose, landmark and information role',()=>{
 assert.equal(nodes.size,d.physical.nodes.length);for(const n of d.physical.nodes)for(const key of ['label','purpose','landmark','information'])assert.ok(n[key]?.trim(),`${n.id}: ${key}`);
});
test('All authored links reference real places and declared conditions',()=>{
 const ids=new Set();for(const e of d.physical.edges){assert.ok(!ids.has(e.id));ids.add(e.id);assert.ok(nodes.has(e.a)&&nodes.has(e.b));assert.notEqual(e.a,e.b);for(const key of e.requires)assert.ok(Object.hasOwn(d.flags,key));}
});
for(const route of d.approaches)test(`${route.id} has its own complete logical route without requiring other approaches`,()=>{
 const flags={...initial,...Object.fromEntries(route.flags.map(k=>[k,true]))};
 assert.equal(route.path[0],d.physical.start);assert.equal(route.path.at(-1),d.physical.objective);
 for(let i=1;i<route.path.length;i++)assert.ok(d.physical.edges.some(e=>available(e,flags)&&((e.a===route.path[i-1]&&e.b===route.path[i])||(e.bidirectional&&e.b===route.path[i-1]&&e.a===route.path[i]))),`${route.id} ${route.path[i-1]} -> ${route.path[i]}`);
 assert.ok(route.advantage&&route.tradeoff);
});
test('Condition controls can be reached from the initial graph without granting themselves first',()=>{
 for(const flag of Object.values(d.flags))assert.ok(Number.isFinite(distance(d.physical.start,flag.grantAt,initial)),flag.grantAt);
});
test('A return and the objective remain logically reachable in all eight condition combinations',()=>{
 const keys=Object.keys(initial);
 for(let bits=0;bits<8;bits++){
  const flags=Object.fromEntries(keys.map((k,i)=>[k,!!(bits&(1<<i))]));
  assert.ok(Number.isFinite(distance(d.physical.start,d.physical.objective,flags)));
  for(const n of nodes)assert.ok(Number.isFinite(distance(n,d.physical.start,flags)),`${bits}: ${n}`);
 }
});
test('The permanent arch shortcut is initially closed and reduces logical return hops',()=>{
 const edge=d.physical.edges.find(e=>e.id==='workshop-shortcut');assert.ok(!available(edge,initial));
 const opened={...initial,archOpen:true};assert.ok(available(edge,opened));assert.equal(d.flags.archOpen.grantAt,'return-landing');assert.equal(d.flags.archOpen.persistent,true);
 assert.ok(distance('hoist-gallery','workshop',opened)<distance('hoist-gallery','workshop',initial));
});
test('No height-changing connection is mislabeled as ordinary flat public walking',()=>{
 const band=new Map(d.physical.nodes.map(n=>[n.id,n.band]));
 for(const e of d.physical.edges)if(band.get(e.a)!==band.get(e.b))assert.notEqual(e.traversal,'public-walk',e.id);
});
test('Behavior and information refer to the same physical places',()=>{
 for(const a of d.behavioral){assert.ok(a.request&&a.recovery);for(const n of a.normalPlaces)assert.ok(nodes.has(n));}
 for(const n of Object.values(d.information))assert.ok(nodes.has(n));
});
test('Exactly the requested three enclosure configurations exist, never both closed',()=>{
 const states=d.presentation.apertureStates;assert.deepEqual(Object.keys(states).sort(),['corner','front','overhead']);
 assert.deepEqual(states.overhead,{topOpen:true,frontOpen:false});assert.deepEqual(states.front,{topOpen:false,frontOpen:true});assert.deepEqual(states.corner,{topOpen:true,frontOpen:true});
 for(const v of Object.values(states))assert.ok(v.topOpen||v.frontOpen);
 assert.equal(d.presentation.defaultAperture,'corner');
});
test('Every proposed aperture change has a legal open-first transition',()=>{
 const states=Object.values(d.presentation.apertureStates);
 for(const a of states)for(const b of states){
  // Union opens any required face before another is closed.
  const middle={topOpen:a.topOpen||b.topOpen,frontOpen:a.frontOpen||b.frontOpen};
  for(const v of [a,middle,b])assert.ok(v.topOpen||v.frontOpen);
 }
});
test('Progress, safe-town rules and actor authority remain explicit requirements',()=>{
 assert.equal(d.safeTown,true);assert.equal(d.objectiveContract.allApproachesRequired,false);assert.equal(d.objectiveContract.remoteObserverCanCollect,false);assert.equal(d.objectiveContract.paysOnce,true);
 assert.equal(d.presentation.oneSimulation,true);assert.equal(d.presentation.observerMotionChangesActor,false);assert.equal(d.presentation.cutawaysChangeCollision,false);
 assert.equal(d.saveContract.mainKey,'svgn.leonardos-guild.v1');assert.equal(d.saveContract.outerVersion,2);assert.equal(d.saveContract.destructiveResetAllowed,false);
});
