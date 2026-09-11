const {test}=require('node:test'),A=require('node:assert/strict'),C=require('../core');
function moveTo(s,p){let count=0;while(Math.hypot(s.p[0]-p[0],s.p[2]-p[2])>.008&&count++<2400){const dx=p[0]-s.p[0],dz=p[2]-s.p[2],l=Math.hypot(dx,dz);C.move(s,dx/l*Math.min(.04,l),dz/l*Math.min(.04,l));}A.ok(Math.hypot(s.p[0]-p[0],s.p[2]-p[2])<.009,JSON.stringify({from:s.p,to:p}));}
function route(s,id){for(const n of C.route(s.world,C.roomAt(s.world,s.p),id)){const r=s.world.rooms[n];moveTo(s,[r.x,0,r.z]);}}
test('100 seeds have connected varying footprints, with reversible upper crossings and 6.4m belfries',()=>{
 const layouts=new Set();for(let i=0;i<100;i++){
  const s=C.create('CATHEDRAL-'+i);s.world.enemies=[];const w=s.world;layouts.add(JSON.stringify(w.rooms.map(r=>[r.x,r.z,r.w,r.d,r.planFamily])));A.equal(new Set(w.rooms.map(r=>r.planFamily)).size,22);A.equal(w.edges.length,38);
  for(const r of w.rooms)A.ok(C.route(w,1,r.id).length);
  const br=w.architecture.routes[0];A.ok(br);route(s,br.from);moveTo(s,br.entry);moveTo(s,[br.entry[0],3.2,br.a[2]]);A.ok(Math.abs(s.p[1]-3.2)<.01);moveTo(s,br.a);moveTo(s,br.b);moveTo(s,[br.exit[0],3.2,br.b[2]]);moveTo(s,br.exit);A.ok(s.p[1]<.05);
  moveTo(s,[br.exit[0],3.2,br.b[2]]);moveTo(s,br.b);moveTo(s,br.a);moveTo(s,[br.entry[0],3.2,br.a[2]]);moveTo(s,br.entry);A.ok(s.p[1]<.05);
  const t=w.architecture.tower;route(s,t.room);const r=w.rooms[t.room],entry=[r.x-4.85,0,r.z+4.75];moveTo(s,entry);moveTo(s,[entry[0],3.2,r.z-4.85]);moveTo(s,t.entry);moveTo(s,t.top);A.ok(Math.abs(s.p[1]-6.4)<.01);moveTo(s,t.reward);moveTo(s,t.top);moveTo(s,t.entry);A.ok(Math.abs(s.p[1]-3.2)<.01);
 }
 A.equal(layouts.size,100);
});
test('Higher routes reward exploration exactly once at the correct elevation',()=>{
 const s=C.create('BELL-01');s.world.enemies=[];s.health=50;const p=s.world.pickups.find(p=>p.id==='relic-belfry');s.p=[p.p[0],0,p.p[2]];C.step(s,1/90);A.equal(p.taken,false);s.p=[p.p[0],6.4,p.p[2]];C.step(s,1/90);A.equal(p.taken,true);A.equal(s.score,100);A.equal(s.health,62);C.step(s,1/90);A.equal(s.score,100);A.equal(s.ammo.relic,undefined);
});
test('Same seed/depth rebuilds exactly; new depth reshapes the plan',()=>{const a=C.generate('BELL-01',1),b=C.generate('BELL-01',1),c=C.generate('BELL-01',2);A.deepEqual(a,b);A.notDeepEqual(a.rooms,c.rooms);});
test('New skybridge deck blocks shots from below; landing requires height-aware clearance',()=>{
 const s=C.create('BELL-01'),r=s.world.architecture.routes[0],p=[(r.a[0]+r.b[0])/2,3.2,r.a[2]];s.world.enemies=[];A.ok(C.landing(s,p).ok);A.ok(C.segmentBlocked(s.world,[p[0],1,p[2]],[p[0],4,p[2]]));A.equal(C.landing(s,[p[0],0,p[2]]).ok,false);
});
