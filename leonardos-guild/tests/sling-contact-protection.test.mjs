/* Isolated CPU reducer fixtures, not native player journeys. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeWorld,newState} from '../model.mjs';
import {attachFrontier,enterBadlands} from '../frontier-core.mjs';
import * as core from '../resonance-core.mjs';
const world=makeWorld();
const foot=()=>{const s=attachFrontier(newState());s.mode='foot';core.chooseTool(s,'sling');return s;};
// Isolated reducer fixtures put an actor near the camp boundary deliberately.
// They test protection/confirmation, not movement or a native playthrough.
for(const inside of ['shooter','target'])test('Camp protection for '+inside+' cannot fabricate a successful hit mark',()=>{
 const s=foot();s.x=0;s.z=-17;s.speed=0;assert.ok(enterBadlands(s).ok);
 s.x=300;s.z=inside==='shooter'?35:43;
 const enemy=s.frontier.enemies[0];enemy.x=300;enemy.z=inside==='shooter'?43:35;
 const hp=enemy.hp;const credits=s.credits,cargo=JSON.stringify(s.frontier.cargo);
 core.resonanceInput(s,world,{aim:true,cameraYaw:inside==='shooter'?0:Math.PI},1/60);
 assert.ok(core.fireTool(s,world));
 for(let i=0;i<20;i++)core.resonanceStep(s,world,{},1/60);
 assert.equal(enemy.hp,hp);assert.equal(s.credits,credits);assert.equal(JSON.stringify(s.frontier.cargo),cargo);
 assert.equal(s.resonance.projectiles.length,0);assert.equal(s.resonance.impacts.some(m=>m.kind==='hit'),false);
});
test('An actual unprotected frontier hit still creates its confirmation exactly once',()=>{
 const s=foot();s.x=0;s.z=-17;s.speed=0;assert.ok(enterBadlands(s).ok);s.z=43;
 const enemy=s.frontier.enemies[0],hp=enemy.hp;
 core.resonanceInput(s,world,{aim:true,cameraYaw:0},1/60);assert.ok(core.fireTool(s,world));
 for(let i=0;i<40;i++)core.resonanceStep(s,world,{},1/60);
 assert.equal(enemy.hp,hp-26);assert.equal(s.resonance.impacts.filter(m=>m.kind==='hit').length,1);
});
