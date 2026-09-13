import {test} from 'node:test';import assert from 'node:assert/strict';
import {makeWorld,newState,attack,step} from '../model.mjs';
import {attachFrontier} from '../frontier-core.mjs';
test('Town staff practice acknowledges input without causing damage, aggro or rewards',()=>{const w=makeWorld(),s=attachFrontier(newState());s.mode='foot';Object.assign(s,w.bandit);assert.equal(attack(s,w),false);assert.ok(s.attackT>0);assert.equal(s.events.at(-1).type,'swing');assert.equal(s.banditHP,100);const events=s.events.length;attack(s,w);assert.equal(s.events.length,events);for(let i=0;i<120;i++)step(s,w,{},1/60);assert.equal(s.health,100);assert.equal(s.defeated,false);assert.equal(s.credits,0);});
