import {test} from 'node:test';import assert from 'node:assert/strict';import * as M from '../model.mjs';
const w=M.makeWorld();
test('Every optional beacon trail has a clear corridor using the same visible obstacle data',()=>{for(const b of w.beacons){const p=w.paths.find(p=>p.id===b.id);for(let i=0;i<=60;i++){const n=M.unit(M.add(M.scale(p.nodes[0],1-i/60),M.scale(p.nodes[1],i/60)));assert.ok(!w.colliders.some(c=>M.distance(n,c.n)<c.radius+.65),b.id+' trail obstacle');}}});
