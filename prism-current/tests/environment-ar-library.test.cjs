/* Pure API/data tests. Not GPU execution, AR playability or physical approval. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const Toon=require('../modules/environment/toon'),Cloud=require('../modules/environment/cloudlets');
test('Toon bands copy ordered input and produce an exact bounded light ramp',()=>{
 const input=Object.freeze([.2,.5,.8,1]),out=Toon.bands(input);assert.notEqual(input,out);assert.deepEqual(out,input);
 assert.deepEqual([...Toon.ramp(input)],[51,128,204,255]);assert.ok(Object.isFrozen(Toon.DEFAULT_BANDS));
});
test('Invalid toon ramps are rejected rather than silently changing the style',()=>{
 for(const v of [null,1,[],[.2],[1,.5],[.2,.2],[NaN,.8],[-1,.5],[0,2],Array(9).fill(1)])assert.throws(()=>Toon.bands(v),TypeError);
 assert.throws(()=>Toon.create({}),/THREE/);
});
test('Cloud descriptors copy placement and preserve seed identity across ordering',()=>{
 const a=Object.freeze({id:'left',position:Object.freeze([-3,2,-4])}),b={id:'right',position:[3,2,-4]};
 const x=Cloud.descriptors([a,b]),y=Cloud.descriptors([b,a]);assert.equal(x[0].seed,y[1].seed);assert.notEqual(x[0].position,a.position);
 assert.equal(x[0].radius,.6);assert.equal(x[0].drift,.08);assert.deepEqual(Cloud.descriptors([]),[]);
});
test('Cloud descriptor budget and invalid coordinates are checked before allocation',()=>{
 assert.throws(()=>Cloud.descriptors(Array.from({length:9},(_,id)=>({id,position:[0,0,0]}))),RangeError);
 for(const v of [[{id:'a',position:[0,NaN,0]}],[{id:'a',position:[0,0]}],[{id:'',position:[0,0,0]}],[{id:'a',position:[0,0,0]},{id:'a',position:[1,0,0]}]])assert.throws(()=>Cloud.descriptors(v),TypeError);
 assert.throws(()=>Cloud.create({}),/THREE/);
});
test('Cloud generation is seeded, varied and fixed at seven lobes',()=>{
 const x=Cloud.shape(4,.6);assert.deepEqual(x,Cloud.shape(4,.6));assert.notDeepEqual(x,Cloud.shape(5,.6));assert.equal(x.length,7);
 for(const l of x){assert.equal(l.center.length,3);assert.ok(l.scale.every(v=>v>0&&Number.isFinite(v)));}
});
test('Cloud bounds enclose every analytic lobe and every corner conservatively',()=>{
 for(let seed=0;seed<100;seed++){
  const s=Cloud.shape(seed,1),e=Cloud.extent(s);
  for(const l of s)for(let k=0;k<3;k++){assert.ok(l.center[k]-l.scale[k]>=e.min[k]-1e-12);assert.ok(l.center[k]+l.scale[k]<=e.max[k]+1e-12);}
  for(let i=0;i<8;i++)assert.ok(Math.hypot(...e.min.map((v,k)=>i&(1<<k)?e.max[k]:v))<=e.radius+1e-10);
 }
});
test('Cloud drift is bounded, host-clock driven, stationary when quiet or paused',()=>{
 const d=Cloud.descriptors([{id:'a',position:[2,3,-4],radius:1,drift:2,bob:2}])[0];assert.equal(d.drift,.15);assert.equal(d.bob,.08);
 for(let t=0;t<500;t+=.17){const o=Cloud.offset(t,d);assert.ok(Math.abs(o[0])<=.15&&Math.abs(o[1])<=.08&&Math.abs(o[2])<=.15*.35);assert.deepEqual(o,Cloud.offset(t,d));}
 assert.deepEqual(Cloud.offset(7,d,true),[0,0,0]);
});
test('Cloud LOD has hysteresis and an explicit shared XR detail cap',()=>{
 assert.equal(Cloud.level(9,null,'cinematic'),0);assert.equal(Cloud.level(10.5,0,'cinematic'),0);assert.equal(Cloud.level(11.3,0,'cinematic'),1);
 assert.equal(Cloud.level(9.5,1,'cinematic'),1);assert.equal(Cloud.level(8.7,1,'cinematic'),0);
 for(const q of ['light','balanced','cinematic'])assert.equal(Cloud.level(0,null,q,true),2);
 assert.equal(Cloud.level(0,null,'balanced'),1);assert.equal(Cloud.level(40,null,'cinematic'),2);
});
test('The new modules do not own input, saves, the renderer, background or animation scheduling',()=>{
 for(const name of ['toon','cloudlets']){
  const s=fs.readFileSync(__dirname+'/../modules/environment/'+name+'.js','utf8');
  assert.doesNotMatch(s,/requestAnimationFrame|performance\.now|Date\.now|localStorage|document\.|fetch\(|new T\.WebGLRenderer|scene\.background\s*=/);
 }
});
test('Both explicit ES facades expose the same implementations',async()=>{
 assert.equal((await import('../modules/environment/toon.mjs')).default,Toon);assert.equal((await import('../modules/environment/cloudlets.mjs')).default,Cloud);
});
