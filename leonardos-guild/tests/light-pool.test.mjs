import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PointLight,Vector3} from '../vendor/three.module.js';
import {updateLightPool} from '../light-pool.mjs';
const fresh=()=>Array.from({length:3},()=>new PointLight());
const candidates=()=>[1,2,3].map((d,i)=>({d,pos:new Vector3(i,2,4),inside:true}));
test('Battery removes all local lights from scene traversal, not merely their intensity',()=>{
 const lights=fresh();assert.equal(updateLightPool(lights,candidates(),0,1),0);
 assert.ok(lights.every(l=>!l.visible&&l.intensity===0&&!l.castShadow));
});
test('Quality and Balanced enforce actual visibility budgets when switching live',()=>{
 const lights=fresh(),targets=candidates();assert.equal(updateLightPool(lights,targets,3,1),3);
 assert.equal(updateLightPool(lights,targets,1,1),1);assert.deepEqual(lights.map(l=>l.visible),[true,false,false]);
 assert.deepEqual(lights[0].position.toArray(),[0,2,4]);assert.ok(lights.every(l=>!l.castShadow));
});
test('Distant and daytime outdoor lamps never leave invisible illumination costs enabled',()=>{
 const lights=fresh(),targets=candidates().map(t=>({...t,inside:false}));
 assert.equal(updateLightPool(lights,targets,3,0),0);assert.ok(lights.every(l=>!l.visible));
 targets[1].d=17;targets[2].d=25;assert.equal(updateLightPool(lights,targets,3,.5),1);assert.equal(lights[0].intensity,6);
 assert.equal(updateLightPool(lights,[],3,1),0);assert.ok(lights.every(l=>!l.visible));
});
