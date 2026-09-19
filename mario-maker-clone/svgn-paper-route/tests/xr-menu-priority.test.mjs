import test from 'node:test';
import assert from 'node:assert/strict';
import {createMenuInput} from '../xr-menu-input.mjs';
const source=handedness=>({handedness,profiles:['oculus-touch-v3'],gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:8},()=>({pressed:false,value:0}))}});
function fixture(){const l=source('left'),r=source('right'),input=createMenuInput();input.seed([l,r]);input.sample([l,r],{menu:true,now:0});return {l,r,input,read:(args={})=>input.sample([l,r],{menu:true,now:100,...args})};}
for(const [index,command]of [[0,'select'],[4,'confirm'],[5,'back']])test(command+' takes priority over concurrent navigation from the other controller',()=>{const f=fixture();f.l.gamepad.axes[3]=.8;f.r.gamepad.buttons[index].pressed=true;const events=f.read();assert.equal(events[0].command,command);assert(events.some(e=>e.command==='next'));assert.equal(f.read({now:101}).length,0);});
test('A held stick does not scroll after system UI until individually released',()=>{const f=fixture();f.l.gamepad.axes[3]=.8;f.read({visible:false});assert.equal(f.read({now:2000}).length,0);f.r.gamepad.buttons[5].pressed=true;assert.equal(f.read({now:2001})[0].command,'back');f.l.gamepad.axes[3]=0;f.read({now:2002});f.l.gamepad.axes[3]=.8;assert.equal(f.read({now:2003})[0].command,'next');});
test('Gameplay-to-menu transition gates only the held stick, not recovery buttons',()=>{const f=fixture();f.l.gamepad.axes[3]=.8;f.read({menu:false});assert.equal(f.read({now:2000}).length,0);f.r.gamepad.buttons[4].pressed=true;assert.equal(f.read({now:2001})[0].command,'confirm');});
