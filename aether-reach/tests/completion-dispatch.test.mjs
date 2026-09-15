import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createState,combatUse,EXTRACTION,nearby,saveState,readSave} from '../model.mjs';
test('The contextual use route wins and emits completion/save at the real extraction console',()=>{
 const s=createState();Object.assign(s.p,EXTRACTION);s.relays=new Set(['garden','spire','foundry']);
 assert.equal(nearby(s).type,'exit');assert.equal(combatUse(s),true);assert.equal(s.won,true);
 assert.deepEqual(s.events.slice(-2).map(e=>e.type),['win','save']);
 assert.equal(readSave(saveState(s)).relays.length,3);
});
test('Handled contextual actions flush their events before won state stops the simulation loop',()=>{
 const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 assert.ok(source.includes('if(skirmishUI?.action(name)){events();return;}'));
});
