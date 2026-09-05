
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {load,T,root}=require('./flow-fixture.cjs');
const c=load(['route-flow-core.js','workshop-core.js','route-flow-plans.js','route-flow-world.js']),F=c.RouteFlow,K=c.GrappleCore;
const old=load();
function doc(i){return c.GroundCampaign.make(i,T);}
function polygon(){return [[10,10],[100,10]];}
test('Nearby endpoints alone are not evidence of a rideable transition',()=>{
 const a=F.rail([[100,150],[200,150]],{id:'a',kind:'open'}),b=F.rail([[230,40],[300,40]],{id:'b',kind:'open'});
 const r=F.trace(F.actor(a,20,12),[a,b],{ground:550,worldWidth:1000});
 assert.notEqual(r.target,'b');assert.equal(r.status,'ground');
});
test('Clearance detects crossings and narrowly separated roads',()=>{
 const a=F.rail([[10,10],[100,100]],{id:'a'}),b=F.rail([[10,100],[100,10]],{id:'b'});
 assert.equal(F.overlaps([a,b])[0].kind,'crossing');
 const x=F.rail([[0,0],[500,0]],{id:'x'}),y=F.rail([[0,40],[500,40]],{id:'y'});
 assert.equal(F.overlaps([x,y])[0].distance,40);
});
test('The simulated state advances via the same shared rail step as play',()=>{
 const t=F.rail([[100,200],[200,200],[400,100]],{id:'t',kind:'open'});
 const p=F.actor(t,20,12),q=F.clone(p);K.ride(q,{right:true});
 const r=F.trace(p,[t],{ground:1000,maxTicks:1});
 assert.equal(r.p.x,q.x);assert.equal(r.p.y,q.y);assert.equal(r.p.speed,q.speed);
});
test('An erased ground tile cannot be reported as a safe ground return',()=>{
 const d={w:30,h:40,cells:new Uint8Array(1200)},p={x:200,y:250,w:26,h:30,vx:1,vy:15,track:null,_airTicks:0,trackCD:0};
 const r=F.trace(p,[],{ground:300,doc:d,maxTicks:10});assert.notEqual(r.status,'ground');
});
test('Fingerprints invalidate geometry, tile, ground-height and movement rule changes',()=>{
 const d=c.WorkshopCore.starter(),fp=F.fingerprint(d),q=c.WorkshopCore.decode(c.WorkshopCore.encode(d));
 assert.equal(F.fingerprint(q),fp);q.paths[0].points[0][0]++;assert.notEqual(F.fingerprint(q),fp);
 const x=c.WorkshopCore.starter();x.cells[10]=60;assert.notEqual(F.fingerprint(x),fp);
 const y=c.WorkshopCore.starter();y.extra.gp.ground--;assert.notEqual(F.fingerprint(y),fp);
});
test('Receiver proposals are conditional, clear, and tested across entry speeds',()=>{
 const d=c.WorkshopCore.starter(),p=F.propose(d,'loop-0');
 assert.equal(p.fingerprint,F.fingerprint(d));assert.equal(p.evidence.entryAssumed,true);assert.ok(p.evidence.speeds.length>=3);
 assert.equal(p.evidence.witness.status,'caught');assert.equal(d.paths.length,2);
 for(const q of d.paths)assert.ok(F.separation(p.points,q.points,76)>=76);
});
test('Unreachable added surfaces are not promoted to reachable through metadata',()=>{
 const d=c.WorkshopCore.starter();d.paths.push({points:[[2500,200],[2600,200]],meta:{id:'isolated',kind:'open',entry:true},anchors:null});
 const w=F.witnesses(d,{maxStates:200});assert.ok(w.unproven.includes('isolated'));
});
for(let i=0;i<3;i++){
 test('Chapter '+(i+1)+' has zero geometric conflicts and unchanged safe lower road',()=>{
  const d=doc(i),p=old.GroundCampaign.make(i,T),rails=d.ct.map(t=>F.rail(t,t.sky));
  assert.equal(rails.length,30+i*4);assert.equal(F.overlaps(rails).length,0);
  for(let y=d.ground-2;y<d.height;y++)for(let x=0;x<d.width;x++)assert.equal(d.cells[y*d.width+x],p.cells[y*d.width+x]);
  assert.equal(d.goal.x,p.goal.x);assert.equal(d.gp.finishOnly,p.gp.finishOnly);
 });
 test('Chapter '+(i+1)+' carries compatible arrival states through every authored surface',()=>{
  const d=doc(i),r=JSON.parse(fs.readFileSync(path.join(root,'planning/flow-reports/chapter-'+i+'.json')));
  assert.equal(F.fingerprint(d),r.layoutHash);
  assert.equal(r.modelHash,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'grapple-core.js'))).digest('hex'));
  const rs=d.ct.map(t=>F.rail(t,t.sky)),w=r.witnesses;assert.equal(w.unproven.length,0);assert.equal(w.truncated,false);
  // Reproduce every node's complete state path from its actual ground entry.
  for(const [id,route]of Object.entries(w.routes)){
   const t=rs.find(t=>t.sky.id===route.entry),seeds=F.groundSeed(t,rs,d.ground*36,d);
   const seed=seeds.find(s=>s.offset===route.entrySpec.offset&&s.speed===route.entrySpec.speed);assert.ok(seed,'entry seed '+id);
   let p=seed.p;
   for(const step of route.controls){const z=F.trace(p,rs,{...step,doc:d,ground:d.ground*36,worldWidth:d.width*36});assert.equal(z.target,step.to);p=z.p;}
   assert.equal(p.track.sky.id,id);
  }
 });
 test('Chapter '+(i+1)+' keeps native save metadata and witnessed peg placements',()=>{
  const d=doc(i),a=c.WorkshopCore.decode(c.DeliveryCampaign.encode(d));
  assert.equal(a.paths.length,d.ct.length);assert.ok(a.extra.gp.flow);
  const p=c.FLOW_PLANS.chapters[i];for(const peg of p.pegs)assert.equal(d.cells[Math.floor(peg.y/36)*d.width+Math.floor(peg.x/36)],T.PEG);
 });
}
test('Legacy expert routes still use their original geometry and requirements',()=>{
 for(let i=0;i<4;i++){const a=c.DeliveryCampaign.build(i,T),b=old.DeliveryCampaign.build(i,T);assert.equal(JSON.stringify(a.ct),JSON.stringify(b.ct));assert.equal(a.stages,b.stages);assert.equal(a.requiredGrapples,b.requiredGrapples);}
});
test('Roadmap dependencies reference existing tasks and contain no cycles',()=>{
 const p=JSON.parse(fs.readFileSync(path.join(root,'planning/roadmap.json'))),ids=new Map(p.tasks.map(t=>[t.id,t])),seen=new Set(),open=new Set();
 function walk(id){assert.ok(ids.has(id));assert.ok(!open.has(id));if(seen.has(id))return;open.add(id);for(const d of ids.get(id).dependsOn)walk(d);open.delete(id);seen.add(id);}
 p.tasks.forEach(t=>walk(t.id));assert.equal(ids.size,p.tasks.length);
});
