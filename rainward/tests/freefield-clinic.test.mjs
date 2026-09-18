import {test} from 'node:test';import assert from 'node:assert/strict';import * as M from '../model.mjs';import * as W from '../world.mjs';
test('The clinic valve gains directional privacy without sealing pursuit or burying old drops',()=>{
 const s=M.createGame('meridian'),floor=W.heightAt(-42,29),p={x:-42,y:floor+1.24,z:29};
 assert.equal(W.obstruction({x:-31.5,y:W.heightAt(-31.5,29)+1.52,z:29},p)?.o.id,'clinic-privacy-screen');
 for(const z of [23,33])assert.ok(W.findPath({x:-35,z:28},{x:-42,z}).length,'Both screen flanks stay navigable');
 assert.equal(W.solidAt(-38.8,28,W.HEIGHT.prone-.01),false,'Legacy ground supplies remain reachable beneath the raised screen');
 assert.equal(JSON.parse(M.checkpoint(s)).version,4);assert.equal(W.CURRENT.items.length,9);assert.equal(W.CURRENT.patrols.length,9);
});
