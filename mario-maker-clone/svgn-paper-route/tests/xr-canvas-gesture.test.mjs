import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const text=readFileSync(new URL('../xr-play.js',import.meta.url),'utf8');
const fn=text.slice(text.indexOf('function pointerEvent('),text.indexOf('\nfunction release(){'));
function fixture(id,claim=()=>false){
 const events=[];
 class InputEvent extends Event{constructor(type,init){super(type,init);Object.assign(this,{clientX:init.clientX,clientY:init.clientY,buttons:init.buttons,pointerId:init.pointerId});}}
 const target={id,getBoundingClientRect:()=>({left:5,top:10,width:100,height:80}),dispatchEvent:e=>{events.push(e);if(claim(e.type))e.preventDefault();return !e.defaultPrevented;}};
 const state={target,source:{},hit:{x:.2,y:.3}};
 const c=vm.createContext({screenPointer:state,screenSource:target,PointerEvent:InputEvent,MouseEvent:InputEvent});
 vm.runInContext(fn,c);
 return {events,state,fire:type=>c.pointerEvent(type,state.hit)};
}
test('Claimed legacy curve pointer gestures never start mouse painting',()=>{
 const f=fixture('cv',t=>t==='pointerdown');for(const t of ['pointerdown','pointermove','pointerup'])f.fire(t);
 assert.deepEqual(f.events.map(e=>e.type),['pointerdown','pointermove','pointerup']);
});
test('Unclaimed legacy canvas retains ordinary mouse down, move and up',()=>{
 const f=fixture('cv');for(const t of ['pointerdown','pointermove','pointerup'])f.fire(t);
 assert.deepEqual(f.events.map(e=>e.type),['pointerdown','mousedown','pointermove','mousemove','pointerup','mouseup']);
 assert.equal(f.events[1].clientX,25);assert.equal(f.events[1].clientY,34);assert.equal(f.state.mouseCompat,false);
});
test('Tracking loss terminates legacy mouse painting once through its undo path',()=>{
 const f=fixture('cv');f.fire('pointerdown');f.fire('pointercancel');f.fire('pointercancel');
 assert.deepEqual(f.events.map(e=>e.type),['pointerdown','mousedown','pointercancel','mouseup','pointercancel']);
 assert.equal(f.events[3].buttons,0);assert.equal(f.state.mouseCompat,false);
});
test('Modern Workshop receives only its native pointer cancellation sequence',()=>{
 const f=fixture('maker-canvas');for(const t of ['pointerdown','pointermove','pointercancel'])f.fire(t);
 assert.deepEqual(f.events.map(e=>e.type),['pointerdown','pointermove','pointercancel']);
});
test('A claimed move suppresses compatibility painting while termination still releases it',()=>{
 const f=fixture('cv',t=>t==='pointermove');for(const t of ['pointerdown','pointermove','pointerup'])f.fire(t);
 assert.deepEqual(f.events.map(e=>e.type),['pointerdown','mousedown','pointermove','pointerup','mouseup']);
});
