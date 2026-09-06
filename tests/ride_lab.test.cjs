const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root=__dirname+'/../mario-maker-clone/svgn-paper-route/';
const c={console,btoa,atob,T:{STEEL:1,START:15,NITRO:27,GOAL:8},document:{readyState:'loading',addEventListener(){}}};c.window=c;vm.createContext(c);
for(const f of['workshop-core.js','bezier-core.js','grapple-core.js','rail-grip-core.js','ride-lab-core.js','rail-training.js']){
 let text=fs.readFileSync(root+f,'utf8');if(f==='rail-training.js')text=text.replace("if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();",'window.RailTraining={document:makeDocument};');vm.runInContext(text,c);
}
const W=c.WorkshopCore,B=c.BezierCore,L=c.RideLabCore,K=c.GrappleCore,G=c.RailGripCore,normal=x=>JSON.parse(JSON.stringify(x));
function settings(d,s=6){return {index:0,speed:s,fraction:154/W.length(d.paths[0].points),nitro:true,ticks:400};}
function blank(){const d=W.empty(100,68);d.paths=[];return d;}
function path(points,id){return {points,meta:{version:1,id,stage:0,kind:'open',begin:0,end:1,network:true},anchors:null};}
function joint(){const d=blank();d.paths=[path([[200,500],[350,500]],'a'),path([[600,400],[800,350]],'b')];return d;}
test('Rehearsals do not mutate live grip settings, collision function, telemetry or draft',()=>{
 const d=c.RailTraining.document(),before=W.encode(d);G.configure({mode:'precision',solid:()=>true});const n=G.history.length;
 const t=L.trace(d,{...settings(d),mode:'forgiving'});assert.equal(G.mode,'precision');assert.equal(G.history.length,n);assert.equal(W.encode(d),before);assert.equal(t.visited.length,3);G.configure({mode:'forgiving',solid:()=>false});
});
test('Private physics is behavior-identical to the live open-rail functions',()=>{
 const t=K.rail(W.piece('ramp',300,1200).points,{kind:'open',id:'test'}),p={x:0,y:0,w:26,h:30,track:t,trackS:80,speed:11,roll:0,_railFace:1};K.pose(p,t,80);const q={...p,_bside:{...p._bside}},isolated=G.create();
 for(let i=0;i<35;i++){if(p.track){K.ride(p,{right:true});isolated.physics.ride(q,{right:true});}else{K.flight(p,{right:true});isolated.physics.flight(q,{right:true});}for(const key of['x','y','vx','vy','speed','trackS'])assert.equal(p[key],q[key]);}
});
test('The improved yard has 6 carried-state entry speeds with top/underside/top and no deck warning',()=>{
 for(const speed of[4.5,5,5.5,6,6.5,7]){const d=c.RailTraining.document(),t=L.trace(d,settings(d,speed));assert.equal(t.status,'terrain-landing');assert.deepEqual(normal(t.events.filter(e=>e.type==='catch').map(e=>e.face)),[-1,1]);assert.equal(t.visited.length,3);assert.ok(t.events.filter(e=>e.type==='catch').every(e=>e.airTicks>=6&&e.retention>.8));}
});
test('The audit catches the old blunt receiving lip before labeling a later catch successful',()=>{
 const d=c.RailTraining.document();d.paths[2].points=W.cubic([1910,1900],[2130,2110],[2500,2050],[2870,2050],64);const t=L.trace(d,settings(d));assert.equal(t.status,'clearance-warning');assert.equal(t.warning.id,'grip-2');assert.equal(t.visited.length,2);
});
test('Speed comparisons are explicit independent scenarios, not a concatenated fake path',()=>{
 const d=c.RailTraining.document(),r=L.compare(d,settings(d));assert.equal(r.length,5);assert.deepEqual(normal(r.map(t=>t.settings.speed)),[4,5,6,7,8]);assert.ok(r.every(t=>t.frames[0].tick===0));
});
test('Backward motion stays signed and is not forced toward the next positive endpoint',()=>{
 const d=blank();d.paths=[path([[200,700],[900,700]],'reverse')];const t=L.trace(d,{index:0,fraction:.7,speed:-8,control:'reverse',ticks:30});assert.ok(t.frames.at(-1).x<t.frames[0].x);assert.ok(t.frames.every(f=>f.vx<0));
});
test('Slow underside grip releases and cannot be reported as a permanent stationary hang',()=>{
 const d=blank();d.paths=[path([[100,600],[2000,600]],'under')];const t=L.trace(d,{index:0,fraction:.5,face:-1,speed:1,control:'coast',ticks:60});assert.ok(t.events.some(e=>e.reason==='slow-release'));
});
test('Solid terrain ends the scenario without pretending the rider passed through it',()=>{
 const d=c.RailTraining.document();for(let y=30;y<65;y++)d.cells[y*d.w+30]=1;const t=L.trace(d,settings(d));assert.equal(t.status,'terrain-blocked');assert.ok(t.frames.at(-1).x<1140);
});
test('Bad requests and timed loops are rejected before expensive work',()=>{
 const d=c.RailTraining.document();for(const opts of[{speed:NaN},{speed:50},{ticks:10000},{index:999},{fraction:2},{face:0},{mode:'magic'},{control:'teleport'}])assert.throws(()=>L.trace(d,{...settings(d),...opts}));d.paths[0].meta.kind='timed';assert.throws(()=>L.trace(d,settings(d)),/Timed/);
});
test('Observing a live rider uses a clone and never changes its attached track or peg',()=>{
 const d=c.RailTraining.document(),p={x:1300,y:1200,w:26,h:30,vx:10,vy:4,speed:0,railIndex:null,trackCD:0,nitroT:0,roll:0,peg:{id:'p',x:1350,y:1170,r:60,th:1,om:.2,loops:1}};
 const before=JSON.stringify(p),t=L.trace(d,{ticks:30},p);assert.equal(JSON.stringify(p),before);assert.ok(t.frames.length>1);
});
test('Smooth joins preserve both original cubic segments and tangent-aligned connector endpoints',()=>{
 const d=joint();for(const p of d.paths)B.convert(p);const originals=normal(d.paths.map(p=>p.bezier)),info=L.smoothJoin(d,[1,0]);assert.equal(d.paths.length,1);assert.equal(info.index,0);const nodes=d.paths[0].bezier;assert.equal(nodes.length,4);assert.deepEqual(normal(B.controls(nodes[0],nodes[1])),normal(B.controls(originals[0][0],originals[0][1])));assert.deepEqual(normal(B.controls(nodes[2],nodes[3])),normal(B.controls(originals[1][0],originals[1][1])));assert.ok(info.tangentAgreement>.999999);assert.equal(W.encode(W.decode(W.encode(d))),W.encode(d));
});
test('A rejected bridge changes neither source geometry nor authoring handles',()=>{
 const d=joint();for(let y=8;y<22;y++)d.cells[y*d.w+12]=1;const before=W.encode(d);assert.throws(()=>L.smoothJoin(d,[0,1]),/terrain/);assert.equal(W.encode(d),before);
 const far=joint();W.transform(far.paths[1],{dx:1400});assert.throws(()=>L.smoothJoin(far,[0,1]),/600/);assert.throws(()=>L.smoothJoin(far,[0,0]),/different/);
});
test('A bridge crossing another rail is rejected instead of creating an attractive overlap',()=>{
 const d=joint();d.paths.push(path([[480,300],[480,700]],'block'));const before=W.encode(d);assert.throws(()=>L.smoothJoin(d,[0,1]),/crosses/);assert.equal(W.encode(d),before);
});
test('Undo and redo round-trip the complete smooth join, not only the visible sampled line',()=>{
 const d=joint(),old=W.encode(d),h=new W.History(old);L.smoothJoin(d,[0,1]);const joined=W.encode(d);h.push(joined);assert.equal(h.undo(),old);assert.equal(h.redo(),joined);assert.equal(W.decode(old).paths.length,2);
});
