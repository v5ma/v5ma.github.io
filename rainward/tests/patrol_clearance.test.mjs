import {test} from 'node:test';import assert from 'node:assert/strict';
import * as W from '../world.mjs';import * as M from '../model.mjs';
test('Every authored patrol starts and turns clear of actual collision geometry',()=>{
 for(const level of Object.keys(W.LEVELS)){
  const s=M.createGame(level);
  for(const e of s.enemies)for(const [x,z]of e.points)assert.equal(W.solidAt(x,z,1.72),false,`${level}/${e.id}: ${x},${z}`);
 }
});
test('The Rootback patrol is not embedded in a newly collidable glasshouse column',()=>{
 const s=M.createGame('conservatory'),e=s.enemies.find(e=>e.id==='rootback'),start={x:e.x,z:e.z};
 assert.equal(W.solidAt(e.x,e.z,2.5,.8),false);
 for(let i=0;i<300;i++)M.update(s,{},1/60);
 assert.ok(Math.hypot(e.x-start.x,e.z-start.z)>2,'The visible creature must actually travel, not animate in place.');assert.equal(e.state,'patrol');
});
