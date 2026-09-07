import {test} from 'node:test';import assert from 'node:assert/strict';import * as W from '../world.mjs';
test('Navigation leaves a real body-width margin around narrow gate piers',()=>{const route=W.findPath({x:16,z:-38},W.EXIT);assert.ok(route.length>0);for(const p of route)assert.equal(W.solidAt(p.x,p.z,W.HEIGHT.stand,.59),false);assert.ok(!route.some(p=>p.x===4&&p.z<=-42&&p.z>=-44));});
