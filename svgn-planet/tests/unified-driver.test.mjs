import {test} from 'node:test';
import assert from 'node:assert/strict';
import {approachAxes} from './unified-driver.mjs';
import {fresh,tick,serialize} from '../lantern/core.mjs';
const dead=v=>Math.abs(v)<.16?0:Math.sign(v)*(Math.abs(v)-.16)/.84;
for(const schedule of [[1/60],[.05],[1/60,.05,.025]])test('Input driver reaches and stops at Mara under sampled render intervals '+schedule.join(','),()=>{
 const state=fresh(),before=serialize(state);let reached=false;
 for(let sample=0;sample<300;sample++){
  const a=approachAxes(-10-state.x,14-state.z);
  if(a.distance<.3&&state.speed<.05){reached=true;break;}
  // Two rendered frame samples; the simulation still uses its normal fixed substeps.
  for(let frame=0;frame<2;frame++){const dt=schedule[(sample*2+frame)%schedule.length];for(let remaining=dt;remaining>1e-7;remaining-=1/60)tick(state,{x:dead(a.axes[0]),z:dead(a.axes[1]),brake:a.brake},Math.min(1/60,remaining));}
 }
 assert.ok(reached,JSON.stringify({x:state.x,z:state.z,speed:state.speed}));
 assert.ok(state.distance<6,'Driver must not oscillate for a 99 metre trip to a nearby desk');
 assert.equal(state.watch.stage,before.watch.stage);assert.equal(state.credits,before.credits);
});
test('Driver input is bounded, releases/brakes at target and rejects invalid samples',()=>{
 assert.deepEqual(approachAxes(0,0).axes,[0,0,0,0]);assert.ok(approachAxes(0,0).brake);
 assert.ok(Math.hypot(...approachAxes(100,100).axes)<=1);assert.throws(()=>approachAxes(NaN,0));
});
