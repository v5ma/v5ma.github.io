/* Model fixtures only. Native acceptance still drives the complete course using
 * real keys and one attempt. The saved late release comes from run 34067294589. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const {context,T}=require('./helpers/flow-fixture.cjs');
const c=context(),W=c.WorkshopCore,d=c.OpenCourse.build(3,T);
function run(seed,old=false){
 const fork=c.RailGripCore.create(),K=fork.physics;
 const rails=d.ct.map((a,i)=>K.rail(i===2&&old?[[1760,1840],...W.cubic([1760,1840],[1860,2020],[1900,2190],[2100,2190],28).slice(1),[3400,2190],...W.cubic([3400,2190],[3500,2190],[3530,2130],[3595,2065],28).slice(1)]:a,a.sky));
 const p={...seed,w:26,h:30,trackCD:6,_airTicks:0,roll:0};let from=null,braking=false;const visits=[];
 for(let tick=0;tick<650;tick++){
  if(p.trackCD>0)p.trackCD--;
  if(p.track){const t=p.track;braking=t===rails[2]&&p.x<3300&&p.speed>(braking?18:19);if(K.ride(p,braking?{left:true}:{right:true})){from=t.sky.id;p._airTicks=0;}}
  else{const old={x:p.x,y:p.y};K.flight(p,{right:true});p._airTicks++;const hit=K.catchRail(p,old,rails,from);if(hit){visits.push({id:hit.tr.sky.id,face:hit.face,air:p._airTicks});from=null;}}
  if(visits.some(v=>v.id==='loop-3')||p.y>2900||p.x>5328)break;
 }
 return visits;
}
const failed={x:1409.3082708248971,y:1690.059240907816,vx:-1.18482442532461,vy:-25.97298964465112};
test('The captured late whip release meets a real recovery curve instead of falling past its old open edge',()=>{
 assert.equal(run(failed,true).some(v=>v.id==='loop-2'),false);
 const path=run(failed);assert.deepEqual(path.map(v=>v.id),['loop-2','loop-3']);assert.ok(path.every(v=>v.face===1&&v.air>5));
});
test('Forty declared release angles and rope lengths recover through both receiving sections',()=>{
 for(const radius of[88,98,108.42090494681489,118,128])for(const angle of[-.3,0,.3,.6,.9,1.2,1.5,1.62]){
  const seed={x:1314+Math.sin(angle)*radius-13,y:1710+Math.cos(angle)*radius-15,vx:26*Math.cos(angle),vy:-26*Math.sin(angle)};
  assert.deepEqual(run(seed).map(v=>v.id),['loop-2','loop-3'],`radius=${radius}, angle=${angle}`);
 }
});
test('The observed late approach clears the drawn deck in the independent Ride Lab audit',()=>{
 const doc=W.empty(d.width,d.height);doc.cells=d.cells;doc.paths=d.ct.map(p=>({points:p.map(v=>[...v]),anchors:null,meta:{...p.sky}}));
 const trace=c.RideLabCore.trace(doc,{ticks:180,control:'forward'}, {...failed,w:26,h:30,trackCD:6,_airTicks:0,railIndex:null});
 assert.notEqual(trace.status,'clearance-warning',JSON.stringify(trace.warning));assert.ok(trace.events.some(e=>e.type==='catch'&&e.id==='loop-2'&&e.face===1));
});
test('The recovery mouth retains the established downstream launch and its completion rules',()=>{
 assert.deepEqual(Array.from(d.ct[2].at(-1)),[3595,2065]);
 assert.ok(d.ct[2].some(p=>Math.abs(p[0]-1760)<1e-7&&Math.abs(p[1]-1840)<1e-7));
 assert.equal(d.stages,4);assert.equal(d.minTransfers,3);assert.equal(d.requiredGrapples,1);assert.equal(d.quota,2);
});
