const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../core.js');require('../first-bell.js');const F=globalThis.FirstBell;
test('The coach recognizes a real swept hit on the bell directly ahead, not the neighboring target',()=>{
 const s=C.create('BELL-01');s.world.enemies=[];s.unscored=true;
 assert.equal(F.practiceBellHit(s),false);
 assert.deepEqual(s.world.targets[F.PRACTICE_BELL],[0,1.5,-4]);
 assert.ok(C.fire(s,[0,1.65,2.82],[0,0,-1],1));
 for(let i=0;i<60;i++)C.step(s,1/90);
 assert.equal(s.shots,1);assert.equal(F.practiceBellHit(s),true);
 const other=C.create();other.targets.add(0);assert.equal(F.practiceBellHit(other),false);
});
