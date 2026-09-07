/* Conservative approach checks for authored activity placement. These finite
 * samples do not substitute for the separate real keyboard/3D journeys. */
import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeWorld,newState,blocked} from '../model.mjs';
import {targets,nearest,use,stats} from '../life-core.mjs';
const w=makeWorld();
function approach(s,target){
 for(const radius of [.7,1.5,2.4,3.1])for(let i=0;i<24;i++){
  s.x=target.x+Math.cos(i*Math.PI/12)*radius;s.z=target.z+Math.sin(i*Math.PI/12)*radius;
  if(!blocked(s.x,s.z,.33,w,s)&&nearest(s,w)?.id===target.id)return {x:s.x,z:s.z};
 }return null;
}
test('Each resident, object, cat and stair has a walkable unambiguous approach in its floor',()=>{
 const s=newState();s.mode='foot';s.life.flags.garden=true;
 for(const inside of [null,'inn','workshop']){s.life.inside=inside;for(const t of targets(s,w))assert.ok(approach(s,t),`No reachable interaction approach for ${t.id} on ${inside||'ground'}`);}
});
test('Garden pigment is outside the sealed house instead of requiring a wall-crossing',()=>{
 const s=newState();s.mode='foot';s.life.flags.garden=true;const plant=targets(s,w).find(t=>t.id==='pigment-red');assert.equal(plant.x,-14);assert.ok(approach(s,plant));
 for(let i=0;i<24;i++){const x=-23+Math.cos(i*Math.PI/12)*3.1,z=460+Math.sin(i*Math.PI/12)*3.1;assert.ok(blocked(x,z,.33,w,s),'The rejected prior plant position has no walkable approach');}
});
test('Cellar stairs, evidence and thief have distinct nearby interaction targets',()=>{
 const s=newState();s.life.inside='inn';s.mode='foot';
 for(const [x,z,id]of [[108,174.5,'up-inn'],[101,175,'ledger'],[105,179,'rocco']]){s.x=x;s.z=z;assert.equal(nearest(s,w)?.id,id);}
});
test('The original bicycle remains a free equipment choice after buying a new variant',()=>{
 const s=newState();s.mode='foot';s.credits=150;s.life.quests.ink=3;s.x=-25;s.z=215.6;
 assert.ok(use(s,w,'bartolo','buy:cargo').ok);const paid=s.credits;assert.equal(s.life.bike,'cargo');
 assert.ok(use(s,w,'bartolo','buy:standard').ok);assert.equal(s.life.bike,'standard');assert.equal(s.credits,paid);assert.equal(stats(s).maxPapers,20);
});
