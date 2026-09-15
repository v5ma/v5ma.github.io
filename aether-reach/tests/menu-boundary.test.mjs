import test from 'node:test';
import assert from 'node:assert/strict';
import {InputSampler,snapshotPad} from '../input-core.mjs';
const pad=()=>({id:'test',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
const hold=(p,i,v)=>p.buttons[i]={pressed:v,value:v?1:0};
test('Menu boundary accepts a fresh Back while suppressing its opening button',()=>{
 const p=pad(),s=new InputSampler();hold(p,0,true);const before=snapshotPad(p);hold(p,1,true);
 s.reset();s.read(before,'p');const next=s.read(p,'p');assert.equal(next.edges.back,true);assert.equal(next.edges.jump,false);assert.equal(next.held.jump,false);
});
test('Menu close and remapped trigger remain neutral-gated until released',()=>{
 const p=pad(),s=new InputSampler();hold(p,1,true);hold(p,6,true);const before=snapshotPad(p),profile={bindings:{back:1,fire:6}};
 s.reset();s.read(before,'p',false,profile);let v=s.read(p,'p',false,profile);assert.equal(v.held.fire,false);assert.equal(v.edges.back,false);
 hold(p,6,false);s.read(p,'p',false,profile);hold(p,6,true);v=s.read(p,'p',false,profile);assert.equal(v.edges.fire,true);
});
test('Physical button snapshots do not alias a mutable browser Gamepad',()=>{
 const p=pad(),before=snapshotPad(p);p.buttons[1].pressed=true;p.buttons[1].value=1;p.axes[0]=1;assert.equal(before.buttons[1].pressed,false);assert.equal(before.axes[0],0);assert.equal(snapshotPad(null),null);
});
