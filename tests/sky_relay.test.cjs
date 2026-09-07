const {test}=require('node:test'),assert=require('node:assert/strict'),{setup,T,compile,replay}=require('./helpers/relay-fixture.cjs');
const c=setup(),norm=x=>JSON.parse(JSON.stringify(x));
test('The relay adds one clear upper road and peg, without replacing any existing route',()=>{
 const before=c.SkyRelay.previous(0,T),after=c.GroundCampaign.make(0,T);assert.equal(after.ct.length,16);assert.deepEqual(norm(after.ct.slice(0,15)),norm(before.ct));
 assert.equal(after.gp.skyNetwork.pegCount,2);assert.equal(after.cells[18*after.width+124],T.PEG);assert.equal(after.gp.skyRelay.bonus,400);assert.equal(after.gp.flowRoutes.routes.length,5);
 for(let x=0;x<after.width;x++)assert.equal(after.cells[60*after.width+x],T.STEEL);assert.equal(after.quota,0);assert.equal(after.requiredGrapples,0);
 for(const n of[1,2])assert.equal(c.GroundCampaign.encode(c.GroundCampaign.make(n,T)),c.GroundCampaign.encode(c.SkyRelay.previous(n,T)));
});
test('The complete relay, peg and bonus metadata survives editable export without changing the source document',()=>{
 const d=c.GroundCampaign.make(0,T),code=c.GroundCampaign.encode(d),W=c.WorkshopCore,copy=W.decode(W.encode(W.decode(code)));
 assert.equal(copy.paths.length,16);assert.deepEqual(norm(copy.extra.gp.skyRelay),norm(d.gp.skyRelay));assert.deepEqual(norm(copy.extra.gp.flowRoutes),norm(d.gp.flowRoutes));assert.equal(copy.music,'morning');
 copy.paths.at(-1).points[0][0]+=100;assert.equal(c.GroundCampaign.make(0,T).ct.at(-1)[0][0],5250);
});
test('The full 49-case cast/release grid rides from the street to the relay and Festival without crossing a deck',()=>{
 for(const castX of[4510,4530,4550,4570,4590,4610,4630])for(const angle of[.80,.85,.90,.95,1,1.05,1.10]){
  const r=replay({castX,angle,record:false}),label=`cast ${castX}, angle ${angle}`;
  assert.equal(r.status,'road',label);assert.ok(r.cast&&r.released&&r.turns>=1,label);assert.deepEqual(r.warnings,[],label);
  assert.deepEqual(r.events.filter(e=>e.type==='catch').map(e=>e.id),['m0','m1','m2','m3','m4','m5','cloudpost-relay','m8'],label);
 }
});
test('The relay also works at three entry speeds in Precision grip with no assistance increase',()=>{for(const speed of[6,7.5,9]){
 const r=replay({speed,mode:'precision',record:false});assert.equal(r.status,'road');assert.deepEqual(r.warnings,[]);assert.ok(r.events.some(e=>e.type==='catch'&&e.id==='cloudpost-relay'));}
});
test('The runway, four prior route recipes and collision parameters are untouched by the additional builder',()=>{
 const {replay:old}=require('./helpers/flow-fixture.cjs');
 for(const route of c.FlowRouteData.routes){const r=old(c,route);assert.equal(r.exit,'road');assert.deepEqual(r.visits,norm(route.expected));assert.deepEqual(r.warnings,[]);}
});
