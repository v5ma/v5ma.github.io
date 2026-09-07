const {test}=require('node:test'),assert=require('node:assert/strict'),{context,T,replay}=require('./helpers/flow-fixture.cjs');
const c=context(),normal=x=>JSON.parse(JSON.stringify(x)),routes=c.FlowRouteData.routes;
test('The first chapter has authored curves, distinct returning routes and no mandatory sky gate',()=>{
 const d=c.GroundCampaign.make(0,T);assert.equal(d.ct.length,15);assert.equal(d.gp.flowRoutes.version,3);assert.equal(d.gp.flowRoutes.routes.length,4);assert.equal(d.quota,0);assert.equal(d.stages,0);assert.equal(d.requiredGrapples,0);
 assert.equal(d.ct.filter(p=>p.sky.entry).length,3);assert.equal(d.ct.filter(p=>p.sky.shape==='open-curl').length,2);assert.equal(d.ct.filter(p=>p.sky.shape==='hairpin').length,1);
 assert.ok(Math.max(...d.ct.flat().map(p=>p[1]))-Math.min(...d.ct.flat().map(p=>p[1]))>1400);
 for(let x=0;x<d.width;x++)assert.equal(d.cells[d.ground*d.width+x],T.STEEL);
 assert.ok(d.cells.includes(T.BLOOP)&&d.cells.includes(T.SHIELD)&&d.cells.includes(T.STAR));
});
test('Later chapters and expert identifiers keep their preceding builds',()=>{
 for(const n of[1,2])assert.equal(c.GroundCampaign.encode(c.GroundCampaign.make(n,T)),c.GroundCampaign.encode(c.FlowRoutes.previous(n,T)));
 assert.equal(c.DeliveryCampaign.routes.length,7);assert.equal(c.DeliveryCampaign.build(0,T).stages,4);assert.equal(c.DeliveryCampaign.build(3,T).requiredGrapples,1);
});
test('Portable editor data retains all authored routes, geometry, encounters and music',()=>{
 const d=c.GroundCampaign.make(0,T),code=c.GroundCampaign.encode(d),doc=c.WorkshopCore.decode(code),copy=c.WorkshopCore.decode(c.WorkshopCore.encode(doc));
 assert.equal(copy.paths.length,15);assert.deepEqual(normal(copy.extra.gp.flowRoutes),normal(d.gp.flowRoutes));assert.equal(copy.music,'morning');assert.equal(copy.extra.gp.cast.length,5);
 assert.ok(copy.paths.every(p=>p.meta.network&&p.meta.optional&&p.meta.roadDepth===34));
});
test('Fresh levels and the preserved dense layout never mutate one another',()=>{
 const old=c.FlowRoutes.previous(0,T);assert.equal(old.ct.length,46);const first=c.GroundCampaign.make(0,T);first.ct[0][0][0]=0;first.gp.flowRoutes.routes[0].expected.pop();const second=c.GroundCampaign.make(0,T);assert.equal(second.ct[0][0][0],500);assert.equal(second.gp.flowRoutes.routes[0].expected.length,10);assert.equal(c.FlowRoutes.previous(0,T).ct.length,46);
});
for(const route of routes){test(route.name+' carries its actual landing states through a complete clean route',()=>{
 const r=replay(c,route);assert.equal(r.exit,'road');assert.deepEqual(r.visits,normal(route.expected));assert.deepEqual(r.warnings,[]);assert.ok(r.events.filter(e=>e.type==='catch').slice(1).every(e=>e.airTicks>=6&&e.retention>.72));
 if(route.id==='sky'){assert.ok(r.events.some(e=>e.type==='exit'&&e.id==='m6'&&e.vx<-10));assert.ok(r.frames.some(f=>f.rail==='m7'&&f.vx<0));assert.ok(r.events.some(e=>e.id==='m7'&&e.type==='exit'&&e.vx>10));}
});}
test('All 48 declared speed and entry-offset samples form clean complete routes',()=>{
 let clear=0;for(const route of routes)for(const speed of[6,7.5,9])for(const offset of[90,120,150,180]){const r=replay(c,route,{speed,offset});assert.equal(r.exit,'road');assert.deepEqual(r.warnings,[],'Body clearance '+route.id+':'+speed+':'+offset);assert.deepEqual(r.visits,normal(route.expected));clear++;}assert.equal(clear,48);
});
test('Precision mode can take all four modeled routes without widening snap tolerances',()=>{for(const route of routes){const r=replay(c,route,{mode:'precision'});assert.deepEqual(r.visits,normal(route.expected));assert.deepEqual(r.warnings,[]);}});
test('A misplaced source curve cannot borrow its old route result',()=>{
 const spec=c.FlowRouteData.paths[1].spec,x=spec.x;spec.x+=800;try{const r=replay(c,routes[0]);assert.notDeepEqual(r.visits,normal(routes[0].expected));}finally{spec.x=x;}
});

test('The orchard re-entry really rides under a curve before returning to its top-side exit route',()=>{const r=replay(c,routes.find(r=>r.id==='orchard'));assert.ok(r.events.some(e=>e.type==='catch'&&e.id==='b2'&&e.face===-1&&e.retention>.9));assert.ok(r.events.some(e=>e.type==='catch'&&e.id==='m8'&&e.face===1));});
test('All retained pieces belong to a complete checked road-origin recipe',()=>{const covered=new Set(routes.flatMap(r=>r.expected));assert.deepEqual([...covered].sort(),normal(c.FlowRouteData.paths.map(p=>p.meta.id)).sort());});
test('A meaningful range of braking positions chooses the lower route with no deck crossing',()=>{for(const remaining of[100,110,120,130,140,145]){const r=replay(c,routes.find(r=>r.id==='canal'),{remaining});assert.deepEqual(r.visits,normal(routes.find(r=>r.id==='canal').expected));assert.deepEqual(r.warnings,[]);}});
test('Distinct roadway bodies keep a 70-pixel centerline clearance instead of overlapping',()=>{
 const pieces=c.GroundCampaign.make(0,T).ct;
 function pointDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy);}
 function distance(a,b,c,d){const dx=b[0]-a[0],dy=b[1]-a[1],ex=d[0]-c[0],ey=d[1]-c[1],det=dx*ey-dy*ex;if(det){const u=((c[0]-a[0])*ey-(c[1]-a[1])*ex)/det,v=((c[0]-a[0])*dy-(c[1]-a[1])*dx)/det;if(u>=0&&u<=1&&v>=0&&v<=1)return 0;}return Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b));}
 for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){let min=Infinity;for(let a=1;a<pieces[i].length;a++)for(let b=1;b<pieces[j].length;b++)min=Math.min(min,distance(pieces[i][a-1],pieces[i][a],pieces[j][b-1],pieces[j][b]));assert.ok(min>=70,pieces[i].sky.id+' / '+pieces[j].sky.id+': '+min);}
});

// Timing spread is a control scenario, not an enlarged snap radius. The native
// fork failure had the correct exit velocity but held the brake into flight.
test('The collector accepts delayed brake releases without blocking the other road entrance',()=>{
 const route=routes.find(r=>r.id==='canal');
 for(const remaining of[100,120,140])for(const brakeAfter of[0,2,4,6,8,10,12]){
  const r=replay(c,route,{remaining,brakeAfter});
  assert.deepEqual(r.visits,normal(route.expected),`brake ${remaining}, release delay ${brakeAfter}`);
  assert.deepEqual(r.warnings,[]);assert.equal(r.exit,'road');
 }
 const reentry=replay(c,routes.find(r=>r.id==='reentry'));assert.deepEqual(reentry.warnings,[]);
});
