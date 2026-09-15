import test from 'node:test';
import assert from 'node:assert/strict';
import {noticePlacement} from '../sensory-core.mjs';
test('Optional notice placement clears the measured HUD and drops notices without safe space',()=>{const host={top:114,bottom:800};assert.equal(noticePlacement(host,40,[{top:672,height:38},{top:723,height:57}]),140);assert.equal(noticePlacement(host,60,[{top:170,height:60}]),null);assert.equal(noticePlacement(host,40,[]),null);assert.equal(noticePlacement(host,0,[{top:672,height:38}]),null);assert.equal(noticePlacement(host,40,[{top:672,height:0}]),null);});
