const {test}=require('node:test'),assert=require('node:assert/strict');
const {replay,document,peg,T}=require('./helpers/sky-post-fixture.cjs');
const P=require('../mario-maker-clone/svgn-paper-route/sky-post-core.js');
test('One optional balcony and one real peg extend rather than replace the four current lines',()=>{
 const before=SkyPostRoute.previous(0,T);assert.equal(document.ct.length,before.ct.length+1);assert.deepEqual(document.ct.slice(0,-1),before.ct);assert.deepEqual(document.gp.flowRoutes,before.gp.flowRoutes);
 assert.equal(document.gp.skyNetwork.pegCount,before.gp.skyNetwork.pegCount+1);assert.equal(document.cells[peg.ty*document.width+peg.tx],60);assert.equal(document.quota,0);assert.equal(document.requiredGrapples,0);
 for(let y=document.ground-3;y<document.height;y++)for(let x=0;x<document.width;x++)assert.equal(document.cells[y*document.width+x],before.cells[y*document.width+x]);
 for(const n of [1,2])assert.deepEqual(GroundCampaign.make(n,T),SkyPostRoute.previous(n,T));
});
test('All 49 declared cast-position and release-angle cases carry momentum from the runway through the relay and Festival',()=>{
 let count=0;for(let x=4510;x<=4618;x+=18)for(let i=0;i<7;i++){
  const r=replay({castX:x,angle:.8+i*.05});assert.equal(r.status,'road');assert.ok(r.cast&&r.released);assert.deepEqual(r.warnings,[],`x=${x}, angle=${.8+i*.05}`);
  assert.deepEqual(r.events.filter(e=>e.type==='catch').map(e=>e.id),['m0','m1','m2','m3','m4','m5','sky-post','m8']);count++;
 }assert.equal(count,49);
});
test('Precision grip and two additional wind-ups still use the same physical receiver',()=>{
 for(const turns of [1,2,3])for(const mode of ['precision','forgiving']){const r=replay({mode,turns});assert.deepEqual(r.warnings,[]);assert.equal(r.status,'road');assert.ok(r.events.some(e=>e.type==='catch'&&e.id==='sky-post'));assert.ok(r.events.some(e=>e.type==='catch'&&e.id==='m8'));}
});
test('The relay survives declared initial speed variations rather than resetting at High Garden',()=>{
 for(const speed of [6,7.5,9])for(const castX of [4530,4550,4570]){const r=replay({speed,castX});assert.deepEqual(r.warnings,[]);assert.ok(r.events.some(e=>e.type==='catch'&&e.id==='sky-post'));assert.equal(r.status,'road');}
});
test('A repeated catch or repeated finish cannot farm a route stamp',()=>{const p=P.create();for(const id of P.ROUTES.find(r=>r.id==='high').path){p.step({type:'catch',id});p.step({type:'catch',id});}assert.deepEqual(p.finish(),['high']);assert.deepEqual(p.finish(),['high']);});
test('An actual named peg release is required for the relay stamp',()=>{
 for(const released of [false,true]){const p=P.create();if(released)p.step({type:'release',peg:peg.id});p.step({type:'catch',id:'sky-post'});p.step({type:'catch',id:'m8'});assert.equal(p.finish().includes('relay'),released);}
});
test('Road landings and retries reset incomplete chains without manufacturing discoveries',()=>{
 const p=P.create();p.step({type:'catch',id:'e4'});p.step({type:'road'});p.step({type:'catch',id:'b2',face:-1});p.step({type:'catch',id:'m8'});assert.deepEqual(p.finish(),[]);
 const q=P.create();q.step({type:'release',peg:peg.id});q.step({type:'retry'});q.step({type:'catch',id:'sky-post'});q.step({type:'catch',id:'m8'});assert.deepEqual(q.finish(),[]);
});
test('The road is a positive discovery; underside stamps need an underside contact',()=>{
 assert.deepEqual(P.create().finish(),['street']);for(const face of [1,-1]){const p=P.create();for(const id of ['e4','b2','m8'])p.step({type:'catch',id,face});assert.equal(p.finish().includes('underside'),face===-1);}
});
test('Corrupt storage, unknown IDs, negative counts and unbounded duplicate writes are rejected',()=>{
 for(const s of [null,'{','null','[]','{"version":2,"stamps":{"street":{}}}'])assert.deepEqual(P.parse(s),{version:1,stamps:{}});
 const dirty={version:1,stamps:{unknown:{first:1,finishes:1},street:{first:-4,finishes:10},relay:{first:1,finishes:999999}}};assert.deepEqual(P.parse(JSON.stringify(dirty)),{version:1,stamps:{relay:{first:1,finishes:9999}}});
 const initial=P.parse(null),done=P.complete(initial,['relay','relay','unknown'],100);assert.deepEqual(done,{version:1,stamps:{relay:{first:100,finishes:1}}});assert.deepEqual(initial,{version:1,stamps:{}});
 assert.throws(()=>P.complete(initial,['street'],NaN));
});
