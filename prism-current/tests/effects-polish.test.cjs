'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const F=require('../modules/environment/fire');
test('Curl density data is deterministic RGBA with the original scalar density in alpha',()=>{
 const a=F.flowData(16,73),d=F.noiseData(16,73);A.equal(a.length,16384);A.deepEqual(a,F.flowData(16,73));A.notDeepEqual(a,F.flowData(16,74));
 for(let i=0;i<d.length;i++)A.equal(a[i*4+3],d[i]);
 A.throws(()=>F.flowData(31),RangeError);
});
test('Encoded periodic curl is bounded and approximately divergence-free after byte quantization',()=>{
 const n=16,a=F.flowData(n,8),at=(x,y,z,k)=>(a[(((z+n)%n*n+(y+n)%n)*n+(x+n)%n)*4+k]/255-.5)*2;
 let max=0;const varied=[new Set(),new Set(),new Set()];
 for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const divergence=(at(x+1,y,z,0)-at(x-1,y,z,0)+at(x,y+1,z,1)-at(x,y-1,z,1)+at(x,y,z+1,2)-at(x,y,z-1,2))*.5;
  max=Math.max(max,Math.abs(divergence));for(let k=0;k<3;k++)varied[k].add(at(x,y,z,k));
 }
 A.ok(max<=3/255+1e-10);for(const v of varied)A.ok(v.size>100);
});
test('Curling fire retains exactly two density-volume reads and unchanged per-quality caps',()=>{
 A.equal((F.shaders.fragmentShader.match(/texture\(fireNoise/g)||[]).length,2);
 A.doesNotMatch(F.shaders.fragmentShader,/q\.x\+=sin|q\.z\+=cos/);
 A.match(F.shaders.fragmentShader,/q\.y-=lift/);
 A.deepEqual(F.QUALITY.light,{volumes:2,steps:12,sparks:32});A.deepEqual(F.QUALITY.balanced,{volumes:3,steps:20,sparks:64});
 A.match(F.shaders.fragmentShader,/quiet>\.5\?\.28:\.88/);A.match(F.shaders.fragmentShader,/smoothstep\(\.25,1.0,length\(eyeLocal\)\)/);
});
test('Explicit ES fire facade exposes the new generator without another engine',async()=>A.equal((await import('../modules/environment/fire.mjs')).flowData,F.flowData));
test('Optical loading preparation is invoked before declaring the AR scene ready',()=>{
 const s=fs.readFileSync(__dirname+'/../river/ar-islands.js','utf8');
 A.match(s,/await optics\.prepare\(renderer,camera,scene\.object3D,water\);if\(disposed\)return;ready=true/);
 const o=fs.readFileSync(__dirname+'/../modules/environment/water-optics.js','utf8');
 A.match(o,/new T\.WebGLRenderTarget\(24,24/);A.match(o,/target\.dispose\(\)/);A.doesNotMatch(o,/requestAnimationFrame|localStorage|setInterval/);
});
