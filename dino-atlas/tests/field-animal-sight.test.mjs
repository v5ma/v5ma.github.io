// Real collider geometry fixtures, not travel or physical headset acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import R from '../vendor/rapier.mjs';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {ALL_ANIMALS,createResident} from '../frontier-data.js';
import {makeResident} from '../frontier-art.js';
import {calibrateResident} from '../ranch-game.js';
import {FieldOperations} from '../field-operations.js';
import {freshField,beginField} from '../field-operations-core.js';
await initPhysics();
function fixture(){
 const physics=new ParkPhysics(),animals=ALL_ANIMALS.slice(0,3).map((d,i)=>{const a=createResident(d,i);a.model=makeResident(a);calibrateResident(a);a.collider=physics.animal(a.radius,a.x,a.z,a.collisionHeight);return a;});
 physics.world.step();const o=Object.create(FieldOperations.prototype);o.s=freshField();o.ctx={sceneKey:'classic',animals};beginField(o.s,'classic','classic-canopy');return {physics,o,animals};
}
test('Aerial survey recognizes actual cylinder hits at oblique angles, not only a spherical proxy',()=>{
 const {physics,o,animals}=fixture();
 try{for(const a of animals){const center=a.collider.translation();for(const [dx,dy,dz] of [[12,8,0],[0,10,18],[14,7,10],[0,16,0]]){
  const origin=new T.Vector3(center.x+dx,center.y+dy,center.z+dz),direction=new T.Vector3(center.x,center.y,center.z).sub(origin).normalize(),ray=new R.Ray(origin,direction),physical=physics.world.castRay(ray,64,true);
  assert.equal(physical?.collider.handle,a.collider.collider(0).handle,'Geometry fixture must actually hit its intended resident');
  const chosen=o.firstTarget({origin,direction},physical.timeOfImpact);
  assert.equal(chosen?.target.uid,a.uid,`${a.uid} scan missed its own real body from ${dx},${dy},${dz}`);
 }} }finally{physics.world.free();}
});
test('Physical blockers still prevent selecting an animal behind them',()=>{
 const {physics,o,animals}=fixture();
 try{const a=animals[0],p=a.collider.translation(),origin=new T.Vector3(p.x+14,p.y+10,p.z),direction=new T.Vector3(p.x,p.y,p.z).sub(origin).normalize();physics.box(p.x+7,p.y+5,p.z,.25,3,4);physics.world.step();const physical=physics.world.castRay(new R.Ray(origin,direction),64,true);assert.ok(physical&&physical.collider.handle!==a.collider.collider(0).handle);assert.equal(o.firstTarget({origin,direction},physical.timeOfImpact),null);}finally{physics.world.free();}
});
