// Explicit production-physics fixture, not a browser or physical-XR playthrough.
import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {buildPark} from '../ranger-world.js';
import {buildFrontier} from '../frontier-world-expanded.js';
import {buildRanchWorld} from '../ranch-world.js';
import {readFrontier} from '../frontier-data.js';
import {Fleet} from '../frontier-vehicles.js';
import {padMotion} from '../ranger-input.js';
import {CHAPTER_STEPS,livingEligibility,emptyLiving,advanceLiving} from '../living-reserve-core.js';
globalThis.document={createElement(){return {width:1024,height:256,getContext(){return new Proxy({measureText:t=>({width:t.length*18})},{get:(o,k)=>k in o?o[k]:()=>{}});}};}};
globalThis.window={dispatchEvent:()=>{}};
await initPhysics();
test('Opening chapter walks its existing roads and restored real gate without teleport or collider removal',()=>{
 const physics=new ParkPhysics(),scene=new T.Scene(),park=buildPark(scene,physics),state=readFrontier(null),fleet=new Fleet(physics,state);buildFrontier(scene,physics,state);buildRanchWorld(scene,physics);let time=0;
 const step=(v={})=>{time+=1/60;fleet.drive(v,1/60,time,0);physics.world.step();fleet.afterStep(1/60);};
 const walk=(x,z)=>{for(let i=0;i<1800;i++){const p=fleet.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.5){for(let j=0;j<8;j++)step();return;}step(padMotion({axes:[dx/d,dz/d,0,0],buttons:[]},'foot'));}assert.fail(`Blocked approach to ${x},${z} from ${JSON.stringify(fleet.position)}`);};
 try{
  for(let i=0;i<120;i++)step();assert.equal(fleet.board(),true);assert.equal(fleet.mode,'foot');
  for(const p of [[-4,54],[-4,45],[5,44],[0,39],[0,24],[-12,13],[0,16],[8,14],[18,14],[24,17],[31,7],[30,-7],[29,-20],[31,-23]])walk(...p);
  const s={...emptyLiving(),active:true,stage:4},ctx={position:fleet.position,mode:fleet.mode,speed:fleet.actor.speed,visible:true};assert.equal(livingEligibility(s,ctx),'');assert.ok(advanceLiving(s,'relay',ctx));park.setPowered(true);physics.world.step();
  for(const p of [[35,-28],[37,-34],[37,-43],[47,-51],[37,-43],[37,-34],[35,-28],[29,-20],[30,-7],[31,7],[24,17],[18,14],[8,14],[0,16],[0,39],[-4,44]])walk(...p);
  assert.ok(Math.hypot(fleet.position.x-CHAPTER_STEPS[6].target.x,fleet.position.z-CHAPTER_STEPS[6].target.z)<1);
 }finally{physics.world.free();}
});
