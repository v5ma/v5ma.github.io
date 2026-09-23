import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Atlas has one shared focused goal, not a second marker for the stale saved task',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 assert.match(app,/drawGoalGuide\(g,state,X,Z,w,h\)/);
 assert.doesNotMatch(app,/expeditionGoal\(state\)/);
 assert.doesNotMatch(app,/strokeRect\(-7,-7,14,14\)/);
});
