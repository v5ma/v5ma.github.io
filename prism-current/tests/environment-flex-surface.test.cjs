/* Pure geometry contracts; no GPU, DOM form or physical controller claims. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const F=require('../modules/environment/flex-surface');
const close=(x,y,e=1e-7)=>A.ok(Math.abs(x-y)<e,`${x} differs from ${y}`);
test('Flex options reject malformed/budget-exceeding input without allocating',()=>{
 for(const x of [null,[],2,{width:0},{height:Infinity},{columns:65},{rows:33},{columns:2.1}])A.throws(()=>F.options(x));
 A.deepEqual(F.options(),{width:1.2,height:.8,columns:32,rows:8,readableBack:true});
});
test('Flex shape bounds fold and localized pull and copies host data',()=>{
 const cfg=F.options(),p=Object.freeze({u:.6,v:.4,radius:.3,strength:.05}),input=Object.freeze({bend:.8,pull:p}),out=F.shape(input,cfg);
 A.deepEqual(out,input);A.notEqual(out.pull,p);
 for(const x of [null,{bend:Infinity},{bend:3},{pull:5},{pull:{strength:.3}},{pull:{radius:.001}},{pull:{u:2}}])A.throws(()=>F.shape(x,cfg));
 A.equal(F.shape({pull:{strength:0}},cfg).pull,null);
});
test('Flat surface has exact local placement and front-facing unit normal',()=>{
 const cfg=F.options(),s=F.shape();for(const [u,v]of [[0,0],[.25,.75],[1,1]]){
  const p=F.evaluate(u,v,s,cfg);close(p.position[0],(u-.5)*cfg.width);close(p.position[1],(v-.5)*cfg.height);close(p.position[2],0);A.deepEqual(p.normal,[-0,-0,1]);
 }
});
test('Tiny signed bend converges smoothly to a flat surface without cancellation',()=>{
 const cfg=F.options();for(const a of [-1e-10,1e-10]){const p=F.evaluate(.73,.4,F.shape({bend:a}),cfg);close(p.position[0],(.73-.5)*cfg.width,1e-12);close(p.position[2],cfg.width*a*.73**2/2,1e-18);}
});
test('Pinned edge never shifts even under maximal allowed localized pull',()=>{
 const cfg=F.options();for(const bend of [-2.4,-.5,0,.5,2.4])for(const v of [0,.25,.75,1]){
  const p=F.evaluate(0,v,F.shape({bend,pull:{u:0,v:.5,strength:.08,radius:.12}},cfg),cfg);close(p.position[0],-.6);close(p.position[1],(v-.5)*.8);close(p.position[2],0);
 }
});
test('Analytic surface derivatives match centered finite differences',()=>{
 const cfg=F.options(),e=1e-5;
 for(const bend of [-2.4,-.02,0,.4,2.4])for(const pull of [null,{u:.6,v:.3,strength:.07,radius:.19}])for(const [u,v]of [[.1,.1],[.5,.5],[.9,.8]]){
  const s=F.shape({bend,pull},cfg),p=F.evaluate(u,v,s,cfg),l=F.evaluate(u-e,v,s,cfg),r=F.evaluate(u+e,v,s,cfg),b=F.evaluate(u,v-e,s,cfg),t=F.evaluate(u,v+e,s,cfg);
  for(let i=0;i<3;i++){close(p.dx[i],(r.position[i]-l.position[i])/(2*e*cfg.width));close(p.dy[i],(t.position[i]-b.position[i])/(2*e*cfg.height));}
  close(Math.hypot(...p.normal),1);close(p.normal.reduce((sum,n,i)=>sum+n*p.dx[i],0),0);close(p.normal.reduce((sum,n,i)=>sum+n*p.dy[i],0),0);
 }
});
test('Strong legal folds and pulls retain finite nondegenerate normals',()=>{
 const cfg=F.options();for(let i=0;i<600;i++){
  const u=((i*71)%601)/601,v=((i*131)%599)/599,bend=Math.sin(i)*2.4,pull={u:.6,v:.4,strength:Math.cos(i)*.08,radius:.12};
  const p=F.evaluate(u,v,F.shape({bend,pull},cfg),cfg);A.ok([...p.position,...p.normal].every(Number.isFinite));close(Math.hypot(...p.normal),1);
 }
});
test('A zero-strength pull does not deform a curved surface',()=>{
 const cfg=F.options();A.deepEqual(F.evaluate(.8,.6,F.shape({bend:1}),cfg),F.evaluate(.8,.6,F.shape({bend:1,pull:{strength:0}}),cfg));
});
test('Surface query rejects out-of-range coordinates',()=>{
 const cfg=F.options();for(const p of [[-1,0],[1,2],[NaN,0],[0,Infinity]])A.throws(()=>F.evaluate(...p,F.shape(),cfg));
});
test('Module has no input capture, clock, renderer or DOM ownership',()=>{
 const s=fs.readFileSync(__dirname+'/../modules/environment/flex-surface.js','utf8');
 A.doesNotMatch(s,/requestAnimationFrame|performance\.now|Date\.now|localStorage|document\.|fetch\(|new T\.WebGLRenderer|addEventListener|setPointerCapture/);
 A.match(s,/intersectObjects\(group.children/);A.match(s,/backGeometry.setAttribute\('position',positions\)/);
});
test('Explicit ES facade is the exact same implementation',async()=>A.equal((await import('../modules/environment/flex-surface.mjs')).default,F));
test('Three namespace validation fails before construction',()=>A.throws(()=>F.create({}),/THREE/));
