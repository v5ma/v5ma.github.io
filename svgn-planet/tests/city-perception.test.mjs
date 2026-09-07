import {test} from 'node:test';import assert from 'node:assert/strict';
import {patrolFanGeometry} from '../city-scene.mjs';
import {initial} from '../model.mjs';import * as C from '../city-model.mjs';import {street,add,mul,tangent,distance} from '../world.mjs';
test('Patrol direction overlay extends forward (-Z), matches sight angle and follows ground curvature',()=>{
 for(const r of[8,13,14]){const a=patrolFanGeometry(r).attributes.position;assert.equal(a.count,96);for(let i=0;i<a.count;i++){assert.ok(a.getZ(i)<=.0001);assert.ok(a.getY(i)<=.0001);assert.ok(a.getY(i)>-1.1);const length=Math.hypot(a.getX(i),a.getZ(i));if(length>.01){assert.ok(-a.getZ(i)/length>=.25-1e-6);assert.ok(Math.abs(length-110*Math.sin(r/110))<1e-5);}}}
});
test('A player can recover from interception and retain the collected file instead of quitting',()=>{
 const s=initial(),c=C.initialCity({active:true,stage:3,approach:'drone'});s.n=street(183,25.5);c.trace=1;c.integrity=20;c.guards[0].n=[...s.n];C.stepCity(s,c,{});assert.ok(c.events.some(e=>e.type==='safe-retry'));assert.equal(c.integrity,100);assert.equal(c.stage,3);assert.equal(c.approach,'drone');
 const before=[...s.n];const to=street(158,13);for(let i=0;i<150;i++)C.stepCity(s,c,{direction:tangent(add(to,mul(s.n,-1)),s.n)});assert.ok(distance(before,s.n)>1);assert.equal(c.completed,false);
});
