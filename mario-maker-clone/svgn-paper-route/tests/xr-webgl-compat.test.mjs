import test from 'node:test';
import assert from 'node:assert/strict';
import {protectOpaqueXRFramebuffer} from '../xr-webgl-compat.mjs';
function fixture(){
  const bound=[],delegated=[];
  const backend={isWebGLBackend:true,gl:{FRAMEBUFFER:36160},_xrFramebuffer:{opaque:true},state:{bindFramebuffer:(...v)=>bound.push(v)},_setFramebuffer(d){delegated.push([this,d]);return 42;}};
  const original=backend._setFramebuffer,restore=protectOpaqueXRFramebuffer({backend});
  return {backend,bound,delegated,original,restore};
}
test('Opaque native XR framebuffer is bound without replacing any attachment',()=>{
  const f=fixture(),d={textures:[{}],renderTarget:{isXRRenderTarget:true,hasExternalTextures:false,samples:0}};
  f.backend._setFramebuffer(d);assert.deepEqual(f.bound,[[36160,f.backend._xrFramebuffer]]);assert.equal(f.delegated.length,0);
  f.restore();assert.equal(f.backend._setFramebuffer,f.original);
});
test('Projection textures and ordinary rendering delegate to the pinned backend',()=>{
  for(const renderTarget of [{isXRRenderTarget:true,hasExternalTextures:true,samples:0},{isXRRenderTarget:false,samples:0},null,{isXRRenderTarget:true,hasExternalTextures:false,samples:4}]){
    const f=fixture(),d={textures:[{}],renderTarget};assert.equal(f.backend._setFramebuffer(d),42);assert.equal(f.delegated[0][0],f.backend);assert.equal(f.bound.length,0);f.restore();
  }
});
test('Default framebuffer and missing XR handles do not enter compatibility path',()=>{
  const f=fixture(),d={textures:null,renderTarget:{isXRRenderTarget:true,samples:0}};f.backend._setFramebuffer(d);f.backend._xrFramebuffer=null;f.backend._setFramebuffer({...d,textures:[{}]});assert.equal(f.delegated.length,2);assert.equal(f.bound.length,0);
});
test('Restore is idempotent and does not overwrite a later owner',()=>{
  const f=fixture(),other=()=>{};f.backend._setFramebuffer=other;f.restore();f.restore();assert.equal(f.backend._setFramebuffer,other);
});
test('Unsupported backend fails before installing any adapter',()=>{
  assert.throws(()=>protectOpaqueXRFramebuffer({backend:{isWebGPUBackend:true}}),/unavailable/);
});
