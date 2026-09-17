// Real Rapier route fixture. This is not a native input journey or headset test.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {buildTidegate} from '../tidegate-world.js';
import {TidegateFleet} from '../tidegate-actors.js';
import {emptyDistrict,gap} from '../tidegate-core.js';
import {padMotion} from '../ranger-input.js';
globalThis.document={createElement(){return {width:1024,height:256,getContext(){return new Proxy({measureText:t=>({width:t.length*18})},{get:(o,k)=>k in o?o[k]:()=>{}});}};}};
await initPhysics();
test('Rescue dock approach allows ordinary stopping tolerance inside unchanged boarding reach',()=>{
 const state=emptyDistrict(),physics=new ParkPhysics(),world=buildTidegate(new T.Scene(),physics,state),fleet=new TidegateFleet(physics,world,state,()=>{});let time=0;
 const step=(motion={})=>{time+=1/60;fleet.step(motion,1/60,time,0);physics.world.step();fleet.after(1/60);};
 const walk=(x,z)=>{for(let i=0;i<900;i++){const p=fleet.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.55){for(let n=0;n<15;n++)step();return;}step(padMotion({axes:[dx/d,dz/d,0,0],buttons:[]},'foot'));}assert.fail('Blocked ordinary dock approach');};
 try{
  for(let i=0;i<15;i++)step();
  walk(-35,43);walk(-25,43);walk(-13,38);
  const boat=fleet.vehicles.find(v=>v.type==='boat');
  assert.ok(gap(fleet.position,boat.drive.position)<7,'Do not stop outside the existing reach');
  assert.equal(fleet.nearest()?.id,'boat');assert.equal(fleet.board(),true);assert.equal(fleet.mode,'boat');
  assert.equal(state.gearbox,false);assert.equal(state.bridge,false);assert.equal(state.drained,false);
 }finally{physics.world.free();}
});
