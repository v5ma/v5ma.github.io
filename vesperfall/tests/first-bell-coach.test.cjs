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

// Core event receipts model the same facts emitted by the real quiver input
// handlers. The native browser regression dispatches the whole input gesture
// in one event turn and checks that no intermediate render frame is required.
test('Rapid quiver open/select is credited between frames, but cancel and stale receipts are not',()=>{
 const s=C.create(), c={base:{seq:s.eventSeq||0,type:s.type},open:false};
 C.emit(s,'focus-open');s.type='cinder';C.emit(s,'focus-select',{arrow:s.type});
 assert.equal(F.quiverLessonComplete(s,c,false),true);
 assert.equal(F.quiverLessonComplete(s,{base:{seq:s.eventSeq,type:'plain'},open:false},false),false);
 const cancelled=C.create(), cc={base:{seq:0,type:'plain'},open:false};
 C.emit(cancelled,'focus-open');C.emit(cancelled,'focus-cancel');
 assert.equal(F.quiverLessonComplete(cancelled,cc,false),false);
 cancelled.type='cinder';
 assert.equal(F.quiverLessonComplete(cancelled,cc,false),false);
 const held=C.create(), hc={base:{seq:0,type:'plain'},open:false};
 C.emit(held,'focus-open');held.type='cinder';C.emit(held,'focus-select',{arrow:held.type});
 assert.equal(F.quiverLessonComplete(held,hc,true),false);
 assert.equal(F.quiverLessonComplete(held,hc,false),true);
});
