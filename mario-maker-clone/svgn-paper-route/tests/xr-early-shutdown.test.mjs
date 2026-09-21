// Executes the pinned vendor reset method with only target ownership represented.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.webgpu.js';
import {protectOpaqueXRFramebuffer} from '../xr-webgl-compat.mjs';
const nativeReset=T.WebGPURenderer.prototype._resetXRState;
function fixture(target=null){
 const calls=[]; const backend={isWebGLBackend:true,_setFramebuffer(){},setXRTarget:v=>calls.push(['xr',v])};
 const renderer={backend,_resetXRState:nativeReset,_frameBufferTarget:target,setOutputRenderTarget:v=>calls.push(['output',v]),setRenderTarget:v=>calls.push(['render',v])};
 return {renderer,calls};
}
test('Pinned preimage throws when a session ends before its first target allocation',()=>{
 const {renderer}=fixture();assert.throws(()=>renderer._resetXRState(),/dispose/);
});
test('The scoped adapter resets an unrendered session without disposing null',()=>{
 const {renderer,calls}=fixture();const restore=protectOpaqueXRFramebuffer(renderer);
 assert.doesNotThrow(()=>renderer._resetXRState());assert.deepEqual(calls,[['xr',null],['output',null],['render',null]]);
 assert.equal(renderer._frameBufferTarget,null);restore();assert.equal(renderer._resetXRState,nativeReset);
});
test('A rendered session retains native reset and exactly one disposal',()=>{
 let disposed=0;const {renderer,calls}=fixture({dispose(){disposed++;}});const restore=protectOpaqueXRFramebuffer(renderer);
 renderer._resetXRState();assert.equal(disposed,1);assert.equal(renderer._frameBufferTarget,null);assert.equal(calls.length,3);restore();
});
test('Genuine disposal errors are not swallowed or relabelled as cancellation',()=>{
 const {renderer}=fixture({dispose(){throw Error('real target fault');}});const restore=protectOpaqueXRFramebuffer(renderer);
 assert.throws(()=>renderer._resetXRState(),/real target fault/);restore();
});
test('Cleanup never overwrites a newer owner of the reset hook',()=>{
 const {renderer}=fixture();const restore=protectOpaqueXRFramebuffer(renderer);const newer=()=>{};renderer._resetXRState=newer;restore();assert.equal(renderer._resetXRState,newer);
});
