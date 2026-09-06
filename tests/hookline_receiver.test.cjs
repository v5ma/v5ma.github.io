/* Carried-state fixtures, not substitutes for the native ordinary-input run.
 * Fast landing: CI 34050802733. Premature finish: CI 34053304791. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root=__dirname+'/../mario-maker-clone/svgn-paper-route/';
const c={console,btoa,atob};vm.createContext(c);
for(const f of ['campaign.js','sky-routes.js','grapple-core.js','rail-grip-core.js','open-course.js','workshop-core.js','bezier-core.js','ride-lab-core.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),c);
const K=c.GrappleCore,W=c.WorkshopCore,d=c.OpenCourse.build(3,{STEEL:1,GOAL:8}),rails=d.ct.map(p=>K.rail(p,p.sky));
function launch(speed,receiver=rails[3],goalX=d.goal.x*36){
 const p={x:0,y:0,w:26,h:30,vx:0,vy:0,track:rails[2],trackS:rails[2].len,speed,_railFace:1,roll:0,trackCD:6,_airTicks:0};K.pose(p,p.track,p.trackS);p.track=null;
 let caught=false,won=false,face=null,air=0,landed=false,completed=false,earlyGoal=0,exitTick=null,finishTick=null;
 for(let tick=0;tick<360;tick++){
  if(p.trackCD>0)p.trackCD--;
  if(p.track){
   const exit=K.ride(p,{right:true});
   if(exit?.exit===1){completed=true;exitTick=tick;}
  }else{
   const old={x:p.x,y:p.y};K.flight(p,{right:true});p._airTicks++;air++;
   // Resolve the actual depot floor BEFORE optional contact, as the app does.
   const tx=Math.floor((p.x+p.w/2)/36),row=d.ground;
   if(tx>=0&&tx<d.width&&d.cells[row*d.width+tx]===1&&p.vy>=0&&p.y+p.h>=row*36&&old.y+p.h<=row*36+2){p.y=row*36-p.h-.01;p.vy=0;landed=true;}
   if(!landed){const hit=K.catchRail(p,old,[receiver],'loop-2');if(hit){caught=true;face=hit.face;}}
  }
  // Catching the final rail is NOT completion: its physical exit must precede
  // the visible goal. Earlier fixtures failed to represent this real gate.
  if(p.x+p.w>=goalX&&p.x<=goalX+36&&p.y+p.h>=2268&&p.y<=2304){
   if(caught&&completed){won=true;finishTick=tick;break;}else earlyGoal++;
  }
  if(p.y>2900||p.x>5350)break;
 }
 return {caught,won,face,air,landed,completed,earlyGoal,exitTick,finishTick};
}
test('The observed high-speed failure now catches the real receiver and exits before finishing',()=>{
 const speed=Math.hypot(16.036379505722408,16.288609540936154),result=launch(speed);
 assert.ok(result.caught&&result.completed&&result.won);assert.equal(result.face,1);assert.ok(result.air>30);assert.ok(result.finishTick>=result.exitTick);
 const pts=[[4140,1990],...W.cubic([4140,1990],[4260,2100],[4300,2304],[4460,2304],28).slice(1),[4750,2304]];
 const old=K.rail(pts,rails[3].sky),previous=launch(speed,old);assert.equal(previous.caught,false);assert.equal(previous.won,false);
});
test('The rolling receiver accepts 25 launch speeds through the complete rail-exit and finish sequence',()=>{
 for(let speed=18;speed<=24;speed+=.25){const r=launch(speed);assert.ok(r.caught&&r.completed&&r.won,'exit speed '+speed);assert.equal(r.face,1);assert.ok(r.finishTick>=r.exitTick);}
});
test('35 earlier whip-landing states keep their complete carried-state receiving connection',()=>{
 for(let startS=1050;startS<=1450;startS+=100)for(let speed=20;speed<=26;speed++){
  const p={w:26,h:30,x:0,y:0,vx:0,vy:0,speed,track:rails[2],trackS:startS,_railFace:1,trackCD:0,dir:1,roll:0,onGround:true};K.pose(p,rails[2],startS);let braking=false,from=null,caught=false;
  for(let tick=0;tick<260;tick++){
   if(p.track){braking=p.track===rails[2]&&p.x<3300&&p.speed>(braking?18:19);const old=p.track;if(K.ride(p,braking?{left:true}:{right:true})){from=old.sky.id;p._airTicks=0;}}
   else{const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;p._airTicks++;K.flight(p,{right:true});const hit=K.catchRail(p,old,rails,from);if(hit){assert.equal(hit.tr.sky.id,'loop-3');assert.equal(hit.face,1);assert.ok(p._airTicks>3);caught=true;break;}}
   if(p.y>2900)break;
  }
  assert.ok(caught,`incoming ${startS} at ${speed}`);
 }
});
test('The captured fast launch has a clean conservative body/deck approach',()=>{
 const doc=W.empty(d.width,d.height);doc.cells=d.cells;doc.paths=d.ct.map((p,i)=>({points:p.map(x=>[...x]),meta:{...p.sky},anchors:null}));
 const report=c.RideLabCore.trace(doc,{ticks:220,control:'forward'},{x:3564.897537565512,y:2033.1623701585731,w:26,h:30,vx:16.036379505722408,vy:-16.288609540936154,speed:22.857914787412913,railIndex:null,trackCD:6,_airTicks:0,nitroT:0,roll:0,_railFace:1});
 assert.notEqual(report.status,'clearance-warning',JSON.stringify(report.warning));assert.ok(report.events.some(e=>e.type==='catch'&&e.id==='loop-3'&&e.face===1));
});
test('Terminal geometry remains within the same world, level ID and mandatory grip sequence',()=>{
 assert.equal(d.id,'hookline-run');assert.equal(d.stages,4);assert.equal(d.requiredGrapples,1);assert.equal(d.minTransfers,3);assert.equal(d.quota,2);
 const p=d.ct[3];assert.equal(p.sky.id,'loop-3');assert.ok(p.every(q=>q[0]>4100&&q[0]<d.width*36&&q[1]>=1989&&q[1]<=2304.001));
 for(let i=1;i<p.length;i++)assert.ok(p[i][0]>p[i-1][0]);
});
test('The native failed finish trace is rejected by the old goal and accepted only after a real rail exit',()=>{
 const speed=Math.hypot(14.477822227979873,14.705538316207807);
 const oldGoal=launch(speed,rails[3],141*36),fixed=launch(speed);
 assert.ok(oldGoal.caught&&oldGoal.completed);assert.ok(oldGoal.earlyGoal>0);assert.equal(oldGoal.won,false);
 assert.ok(fixed.won&&fixed.completed);assert.ok(fixed.finishTick>=fixed.exitTick);assert.equal(fixed.earlyGoal,0);
});
test('Visible depot and populated goal tile follow the final lip with solid landing space',()=>{
 assert.equal(d.cells[63*d.width+d.goal.x],8);
 assert.ok(d.goal.x*36>d.ct[3].at(-1)[0]);
 assert.ok((d.goal.x+1)*36<=d.width*36);
 for(let x=Math.floor(d.ct[3].at(-1)[0]/36);x<d.width;x++)assert.equal(d.cells[d.ground*d.width+x],1);
});
