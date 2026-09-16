/* Constructed legacy-drop unit fixture, never claimed as earned native progress. */
import {test} from 'node:test';import assert from 'node:assert/strict';
import * as M from '../model.mjs';import * as W from '../world.mjs';
test('Older drops below the new sorting screen stay collectible exactly once',()=>{
 const source=M.createGame(),enemy=source.enemies.find(e=>e.id==='watch-3');
 Object.assign(enemy,{hp:0,x:10.9,z:-26.4,dropMade:true});source.drops=[{id:enemy.id,x:10.9,z:-26.4,items:{ammo:3,cloth:1}}];
 const raw=M.checkpoint(source),restored=M.restore(raw);assert.ok(restored);
 assert.equal(W.solidAt(10.9,-26.4,W.HEIGHT.prone),false);assert.equal(W.solidAt(10.9,-26.4,W.HEIGHT.stand),true);
 Object.assign(restored.player,{x:10.9,z:-25.4});assert.equal(M.interactable(restored).kind,'loot');const before=restored.player.reserve;
 assert.ok(M.interact(restored));assert.equal(restored.player.reserve,before+3);assert.equal(restored.player.cloth,1);
 const again=M.restore(M.checkpoint(restored));assert.ok(again);assert.equal(again.drops.find(d=>d.id===enemy.id).items.ammo,0);assert.equal(again.drops.find(d=>d.id===enemy.id).items.cloth,0);
});
