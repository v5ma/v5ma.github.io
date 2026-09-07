const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../core.js'),A=require('../architecture.js');
function walk(s,x,z){let ticks=0;while(ticks++<1200){const dx=x-s.p[0],dz=z-s.p[2],d=Math.hypot(dx,dz);if(d<.045)return;C.move(s,dx/d*.03,dz/d*.03);}throw Error('No movement route to '+[x,z]+' from '+s.p);}
test('Real movement ascends the stair, crosses the gallery and descends without position reassignment',()=>{
 const s=C.create('BELL-01');walk(s,0,4.6);walk(s,-4.65,4.6);walk(s,-4.65,-4.85);assert.equal(s.p[1],3.2);walk(s,3.9,-4.85);assert.equal(s.p[1],3.2);walk(s,-4.65,-4.85);walk(s,-4.65,4.6);walk(s,0,3);assert.equal(s.p[1],0);
});
test('100 seeds retain every ground connection under the tall walls and optional balcony',()=>{
 for(let i=0;i<100;i++){const w=C.generate('GOTHIC-'+i);for(const [a,b]of w.edges){const r=w.rooms[a],q=w.rooms[b];for(let k=0;k<=60;k++)assert.ok(C.walkable(w,[r.x+(q.x-r.x)*k/60,0,r.z+(q.z-r.z)*k/60]));}assert.equal(w.architecture.floorIDs.length,3);assert.equal(w.enemies.length,5);assert.equal(w.edges.length,10);}
});
test('Upper floors do not make the ground underneath nonwalkable or pull a passerby upward',()=>{
 const s=C.create('BELL-01');walk(s,0,-5);assert.equal(s.p[1],0);assert.ok(C.walkable(s.world,[0,0,-4.85]));assert.ok(C.walkable(s.world,[0,3.2,-4.85]));
});
test('Floor impact selects the first physical surface and blink preserves its height',()=>{
 const s=C.create('BELL-01'),hit=C.floorHit(s.world,[2,5,-4.85],[2,0,-4.85]);assert.ok(hit);assert.equal(hit.p[1],3.2);assert.ok(C.blink(s,hit.p));assert.equal(s.p[1],3.2);assert.ok(C.blink(s,[0,0,0]));assert.equal(s.p[1],0);
});
test('A projectile cannot tunnel upward through the solid gallery slab',()=>{
 const s=C.create('BELL-01');assert.ok(C.segmentBlocked(s.world,[0,1.6,-4.85],[0,5,-4.85]));assert.ok(!C.segmentBlocked(s.world,[0,1.6,2],[0,1.6,-3]));
});
test('Front balustrade blocks falling off the gallery and lower route remains open',()=>{
 const s=C.create('BELL-01');walk(s,0,4.6);walk(s,-4.65,4.6);walk(s,-4.65,-4.85);walk(s,2,-4.85);for(let i=0;i<150;i++)C.move(s,0,.04);assert.equal(s.p[1],3.2);assert.ok(s.p[2]<-4.45);
});
test('Stair elevation changes continuously and rising floor footprint remains supported',()=>{const w=C.generate('ARCH'),f=w.floors.find(f=>f.type==='stair');let last=0;for(let k=0;k<=100;k++){const p=[f.x,k/100*3.2,4.6-k/100*8.8],y=A.floorAt(w,p);assert.ok(Math.abs(y-last)<.04);last=y;assert.ok(C.walkable(w,p));}});
test('Reject invalid vertical teleport guesses, gaps and actual wall material',()=>{const s=C.create('BELL-01');assert.equal(C.blink(s,[0,8,-4.85]),false);assert.equal(C.blink(s,[10,0,10]),false);assert.equal(C.blink(s,[6,0,6]),false);});
