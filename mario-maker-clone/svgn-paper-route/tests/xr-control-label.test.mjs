import test from 'node:test';
import assert from 'node:assert/strict';
import {controlLabel} from '../xr-ui-core.mjs';
const base={getAttribute:()=>null,matches:()=>false,labels:[]};
test('Rendered control text excludes non-rendered style contents',()=>assert.equal(controlLabel({...base,innerText:'  Controller guide  ',textContent:'#control {display:block}Controller guide'}),'Controller guide'));
test('Route cards expose a concise route name rather than concatenated metadata',()=>assert.equal(controlLabel({...base,matches:()=>true,querySelector:()=>({innerText:'Sunrise Borough'}),innerText:`START HERE\nSunrise Borough\nLong description\nBronze`}),'Play Sunrise Borough'));
test('Explicit accessible names retain priority and fixture fallback remains readable',()=>{assert.equal(controlLabel({...base,getAttribute:()=> 'Exit XR',innerText:'Close'}),'Exit XR');assert.equal(controlLabel({...base,textContent:'Undo'}),'Undo');});
