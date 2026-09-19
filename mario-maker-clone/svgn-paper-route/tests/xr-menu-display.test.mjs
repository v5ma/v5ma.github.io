// Executes the actual dispatch function with isolated UI fixtures, not hardware.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const text=readFileSync(new URL('../xr-play.js',import.meta.url),'utf8');
const fn=text.slice(text.indexOf('function dispatchMenuInput('),text.indexOf('\nfunction selectStart(e)'));
function fixture(navigation=false,pointed=true,visible=true){
 const calls=[],menu={},source={handedness:'right'};
 const rows=['selected','pointed'].map(label=>({label,action:()=>calls.push(label)}));
 const context=vm.createContext({presenting:true,session:{visibilityState:visible?'visible':'visible-blurred'},panel:()=>menu,lastPanel:menu,lastFrame:{},rects:rows,menuCursor:0,menuNavigating:navigation,focusLabel:'selected',lastUI:0,lastMenuAction:null,performance:{now:()=>1},makeMenu(){throw Error('Must not replace displayed targets during activation');},hit:()=>pointed?rows[1]:null});
 vm.runInContext(fn,context);
 return {calls,fire:command=>context.dispatchMenuInput({source,command},{}),context};
}
test('A/X activate the displayed pointed target in aiming mode',()=>{const f=fixture();f.fire('confirm');assert.deepEqual(f.calls,['pointed']);});
test('A/X confirm the navigated selection until aiming resumes',()=>{const f=fixture(true);f.fire('confirm');assert.deepEqual(f.calls,['selected']);});
test('A trigger selects its own pointed target even after grip navigation',()=>{const f=fixture(true);f.fire('select');assert.deepEqual(f.calls,['pointed']);});
test('No-ray confirmation selects the visible focused action',()=>{const f=fixture(false,false);f.fire('confirm');assert.deepEqual(f.calls,['selected']);});
test('System UI visibility blocks direct menu dispatch',()=>{const f=fixture(false,true,false);f.fire('confirm');assert.deepEqual(f.calls,[]);});
