import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,nearby,saveState} from '../model.mjs';
import {fieldGuidance} from '../field-guide-core.mjs';
test('Starting broadcast console explains its lock without competing with the first dispatch',()=>{
 const s=createState(),before=saveState(s),n=nearby(s);assert.equal(n.type,'exit');
 const g=fieldGuidance(s,n,'Right grip');assert.equal(g.goal.id,'dispatch-board');assert.equal(g.canInteract,false);assert.match(g.interaction,/for later/);assert(!g.interaction.startsWith('Right grip'));assert.equal(saveState(s),before);
});
test('Model fixture: restored broadcast offers the actual use action and never changes the save',()=>{
 const s=createState();s.relays=new Set(['garden','foundry','spire']);const before=saveState(s),g=fieldGuidance(s,nearby(s),'X');assert(g.canInteract);assert.match(g.interaction,/^X \/ Broadcast/);assert.equal(saveState(s),before);
});
