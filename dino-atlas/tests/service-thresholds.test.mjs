// Labeled real-Rapier geometry fixtures. These do not replace native input journeys.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {buildTidegate} from '../tidegate-world.js';
import {TidegateFleet} from '../tidegate-actors.js';
import {emptyDistrict,POINTS,gap} from '../tidegate-core.js';
import {FIELD_ROUTES} from '../tidegate-routes.js';
import {padMotion} from '../ranger-input.js';
globalThis.document={createElement(){return {width:1024,height:256,getContext(){return new Proxy({measureText:t=>({width:t.length*18})},{get:(o,k)=>k in o?o[k]:()=>{}});}};}};
await initPhysics();
function fixture(p){
 const state={...emptyDistrict(),gearbox:true,drained:true},physics=new ParkPhysics();
 const world=buildTidegate(new T.Scene(),physics,state),fleet=new TidegateFleet(physics,world,state,()=>{});
 // Explicit initial position from a failed native trace or a threshold probe.
 fleet.person.setActive(true,p);let time=0;
 const step=(v={})=>{time+=1/60;fleet.step(v,1/60,time,0);physics.world.step();fleet.after(1/60);};
 for(let i=0;i<8;i++)step();
 return {physics,fleet,step};
}
function walk(g,x,z,limit=360){
 for(let i=0;i<limit;i++){const p=g.fleet.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.35)return i/60;g.step(padMotion({axes:[dx/d,dz/d,0,0],buttons:[]},'foot'));}
 assert.fail(`Threshold blocked toward ${x},${z}: ${JSON.stringify(g.fleet.position)}`);
}
test('Native failed northwest bridge-pad approach can walk to the control without jumping',()=>{
 const g=fixture({x:15.502336502075195,y:.9131795763969421,z:21.124900817871094});
 try{walk(g,15,24);walk(g,18,26);assert.ok(gap(g.fleet.position,POINTS.bridge)<3.3);}finally{g.physics.world.free();}
});
test('Sluice pad supports short ordinary approaches from each service-loop direction',()=>{
 for(const p of [{x:15,y:1.2,z:-12},{x:19,y:1.2,z:-8},{x:11,y:1.2,z:-8}]){
  const g=fixture(p);try{const seconds=walk(g,15,-8);assert.ok(seconds<4,'Four-meter operational approach should not stall at the lip');}finally{g.physics.world.free();}
 }
});
test('Mapped home endpoints finish comfortably inside the unchanged report reach',()=>{
 for(const id of ['lock-return','bridge-return']){const p=FIELD_ROUTES.find(r=>r.id===id).points.at(-1);assert.ok(gap({x:p[0],z:p[1]},POINTS.report)+.75<3.3,`${id}: map endpoint must allow normal stopping tolerance`);}
});

// September 16 native harbor failure: a walking approach from the drained bed
// settled lower than a freshly spawned fixture; never lift the browser player.
test('Native harbor return escapes the sluice lip from its actual settled failure pose',()=>{
 const g=fixture({x:12.624899864196777,y:.7870328426361084,z:-7.857004642486572});
 try{walk(g,15,-8,300);assert.ok(gap(g.fleet.position,POINTS.sluice)<.7);}finally{g.physics.world.free();}
});
test('Drained crossing rejoins the sluice from both directions at ordinary pad deadzones',()=>{
 for(const z of [-8.3,-8,-7.7]){
  const g=fixture({x:-12,y:1.2,z});
  try{walk(g,0,z);walk(g,15,z,480);walk(g,0,z,480);walk(g,-12,z,480);}finally{g.physics.world.free();}
 }
});
