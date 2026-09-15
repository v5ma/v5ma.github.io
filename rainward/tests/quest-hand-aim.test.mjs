import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createXRInput} from '../xr-input.mjs';

test('Left hand movement pinch does not inherit the controller aiming modifier',()=>{
 const input=createXRInput(),left={id:'left-hand',side:'left',hand:true,pinch:false,move:[0,0]},right={id:'right-hand',side:'right',hand:true,pinch:false},sources=[left,right];
 input.sample(sources,.016);input.sample(sources,.016);left.pinch=true;left.move=[.6,-.8];
 const frame=input.sample(sources,.016);
 assert.deepEqual(frame.move,[.6,-.8]);assert.equal(frame.aim,false);assert.equal(frame.fire,false);
 assert.deepEqual(frame.actions,[]);
});
test('Armed hand fire mode aims only during a deliberate right pinch and releases fully',()=>{
 const input=createXRInput(),left={id:'left-hand',side:'left',hand:true,pinch:false,move:[0,0]},right={id:'right-hand',side:'right',hand:true,pinch:false},sources=[left,right],step=()=>input.sample(sources,.016,{handFire:true});
 step();step();left.pinch=true;left.move=[0,-1];
 assert.equal(step().aim,false);right.pinch=true;const held=step();assert.ok(held.aim&&held.fire);assert.deepEqual(held.move,[0,-1]);
 right.pinch=false;const released=step();assert.equal(released.aim,false);assert.equal(released.fire,false);assert.deepEqual(released.move,[0,-1]);
});
