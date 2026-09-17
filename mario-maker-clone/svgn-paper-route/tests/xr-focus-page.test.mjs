import test from 'node:test';
import assert from 'node:assert/strict';
import {focusEntry} from '../xr-ui-core.mjs';
const slider={},other={};
const entries=Array.from({length:10},(_,i)=>({el:i===5||i===6?slider:other,label:String(i)}));
test('Focusing a split-page plus control retains the visible plus page',()=>assert.deepEqual(focusEntry(entries,slider,1),{index:6,page:1,label:'6'}));
test('Focusing its minus on the preceding page keeps the minus visible',()=>assert.deepEqual(focusEntry(entries,slider,0),{index:5,page:0,label:'5'}));
test('An off-page control is revealed without inventing a target',()=>{const unique={};const data=entries.map((x,i)=>i===9?{el:unique,label:'nine'}:x);assert.deepEqual(focusEntry(data,unique,0),{index:9,page:1,label:'nine'});assert.equal(focusEntry(data,{},0),null);});
test('Empty or stale focus pages are bounded',()=>{assert.equal(focusEntry([],slider,NaN),null);assert.equal(focusEntry(entries,slider,100).page,1);});
