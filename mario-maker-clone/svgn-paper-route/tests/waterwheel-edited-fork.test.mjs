import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from '../waterwheel-layout-core.mjs';
import {FORK} from '../waterwheel-fork-core.mjs';
const require=createRequire(import.meta.url),{T}=require('../../../tests/helpers/flow-fixture.cjs');
test('Render fixture: stripes follow the loaded edited runway without rewriting it',async()=>{
 const {populate}=await import('../waterwheel-preview-art.mjs');
 function inspect(course){
  const stripes=[],root={userData:{}};
  const metal={rod:(a,b,r)=>{if(r===3)stripes.push({a,b});},ell:()=>{}};
  populate({course,root,metal,far:{box:()=>{}},sign:()=>({userData:{}})});
  return {stripes,root};
 }
 const original=build(T),edited=build(T);
 edited.ct.find(p=>p.sky.id===FORK.launch).forEach(p=>p[0]+=700);
 const before=JSON.stringify(edited),a=inspect(original),b=inspect(edited);
 assert(a.stripes.length>=4);assert.equal(a.stripes.length,b.stripes.length);
 for(let i=0;i<a.stripes.length;i++)assert(Math.abs(b.stripes[i].a[0]-a.stripes[i].a[0]-700)<1e-8);
 assert.equal(JSON.stringify(edited),before);
 const ground=inspect(build(T,{groundOnly:true}));assert.equal(ground.stripes.length,0);assert.equal(ground.root.userData.waterwheelFork,undefined);
});
