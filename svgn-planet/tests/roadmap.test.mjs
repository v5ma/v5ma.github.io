import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('The development board has versioned statuses, unique work items, valid prerequisites and no dependency cycles',()=>{
 const d=JSON.parse(readFileSync(new URL('../development/backlog.json',import.meta.url)));assert.equal(d.cards.length,23);const all=new Map(d.cards.map(c=>[c.id,c]));assert.equal(all.size,23);const seen=new Set(),active=new Set();
 function visit(id){if(seen.has(id))return;assert.ok(all.has(id),'unknown dependency '+id);assert.ok(!active.has(id),'cyclic dependency '+id);active.add(id);const c=all.get(id);assert.ok(d.columns.includes(c.column));assert.ok(c.title&&c.acceptance&&c.detail);c.depends.forEach(visit);active.delete(id);seen.add(id);}all.forEach(c=>visit(c.id));assert.equal(seen.size,23);assert.equal(d.cards.filter(c=>c.column==='Implemented').length,6);
});
