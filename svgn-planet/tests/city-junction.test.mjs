/* Replay a recorded, carried-state return-junction stall. Seeded model fixture,
 * separate from the normal-input browser mission and not a mutation API. */
import {test} from 'node:test';import assert from 'node:assert/strict';
import {CITY,coordinates} from '../city-world.mjs';
import {initial} from '../model.mjs';import {initialCity,stepCity} from '../city-model.mjs';
import {street,add,mul,dot,cross,norm,tangent,distance} from '../world.mjs';
function returnToAvenue(){
 const s=initial(),c=initialCity({active:true,stage:4});c.gate=true;
 s.n=[.12665799468479416,.11941372881092079,-.9847325087321422];
 s.north=[.9859358988845565,.09396356026214381,.1382072814057366];s.facing=[...s.north];s.speed=.7541984732824428;
 const goal=street(158,25);let input={};
 for(let i=0;i<1400;i++){
  if(distance(s.n,goal)<1.7)return true;
  if(i%4===0){const toward=tangent(add(goal,mul(s.n,-1)),s.n),right=cross(s.north,s.n),x=dot(right,toward),z=dot(s.north,toward);input={direction:norm(add(mul(right,Math.abs(x)>.22?Math.sign(x):0),mul(s.north,Math.abs(z)>.22?Math.sign(z):0)))};}
  stepCity(s,c,input);
 }return false;
}
test('The old low barrier reproduces the recorded stalled turn; the repositioned prop preserves a clear return junction',()=>{
 const prop=CITY.solids.find(b=>b.id==='vault'),original={t:prop.t,n:[...prop.n]};
 try{prop.t=159;prop.n=street(159,15.2);assert.equal(returnToAvenue(),false);}finally{prop.t=original.t;prop.n=original.n;}
 assert.equal(prop.t,161);assert.equal(prop.h,.55);assert.equal(returnToAvenue(),true);
});
test('The alley crossing keeps a normal walking corner envelope without removing the optional vault obstacle',()=>{
 const p=CITY.solids.find(b=>b.id==='vault');assert.equal(p.h,.55);assert.equal(p.w,1.7);assert.equal(p.d,.45);
 assert.ok(p.t-p.d/2>158+1.7+.38);assert.ok(Math.abs(coordinates(p.n).t-p.t)<1e-9);
});
