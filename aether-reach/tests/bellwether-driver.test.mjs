import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {InputSampler} from '../input-core.mjs';
const context={window:{}};
vm.runInNewContext(readFileSync(new URL('./bellwether-input.js',import.meta.url),'utf8'),context);
const axes=context.window.BlackoutDriver.approachAxes;
test('The physical Bellwether driver encodes slow movement above the actual deadzone',()=>{
 const sampler=new InputSampler();
 for(const distance of [.14,.17,.25,.7,2]){
  const input=sampler.read({connected:true,mapping:'standard',axes:axes(distance,0,0),buttons:[]});
  assert(input.move[1]<0);
  assert(Math.abs(input.move[1]+Math.min(1,distance))<1e-9);
 }
});
test('The driver stops translation while facing away from the next landing',()=>{
 assert.equal(axes(.14,.4,0)[1],0);
});
