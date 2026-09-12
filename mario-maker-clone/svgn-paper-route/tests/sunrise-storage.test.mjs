import test from 'node:test';
import assert from 'node:assert/strict';
import {mission} from '../sunrise-core.mjs';
test('a session-only earned seal is never described as banked on the device',()=>{const m=mission(null,{marketPilot:true,finishes:1},false);assert.equal(m.banked,false);assert.equal(m.steps[2].done,true);assert.equal(m.saveOK,false);});
