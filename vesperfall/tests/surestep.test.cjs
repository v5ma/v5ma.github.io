'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const M=require('../surestep-model.js'),C=require('../core.js');
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('Damage shortcut always includes unlimited Standard and never Blink',()=>{
 a.deepEqual(M.activeDamage({ammo:{}}),['plain']);
 a.equal(M.nextDamage({type:'blink',ammo:{cinder:4}}),'plain');
 a.equal(M.nextDamage({type:'plain',ammo:{}}),'plain');
});
test('Damage cycle respects all combinations of ammo and unlocks without mutation',()=>{
 for(let mask=0;mask<64;mask++){
  const s={type:'plain',ammo:{cinder:mask&1?2:0,frost:mask&2?2:0,volley:mask&4?2:0,ricochet:mask&8?2:0},volleyUnlocked:!!(mask&16),ricochetUnlocked:!!(mask&32)};
  const before=JSON.stringify(s),types=M.activeDamage(s);
  a.equal(JSON.stringify(s),before);a.ok(!types.includes('blink'));
  a.equal(types.includes('volley'),!!(mask&4)&&!!(mask&16));
  a.equal(types.includes('ricochet'),!!(mask&8)&&!!(mask&32));
  for(let i=0;i<types.length;i++)a.equal(M.nextDamage({...s,type:types[i]}),types[(i+1)%types.length]);
 }
});
test('Empty, corrupt and unavailable damage types are skipped',()=>{
 a.deepEqual(M.activeDamage({ammo:{cinder:NaN,frost:-1,volley:Infinity,ricochet:'9'},volleyUnlocked:true,ricochetUnlocked:true}),['plain']);
 a.equal(M.nextDamage({type:'cinder',ammo:{cinder:0,frost:3}}),'plain');
});
test('Two-bone solver handles singular and unreachable targets without stretching',()=>{
 for(const target of[[0,0,0],[0,-1e-12,0],[0,-100,0],[0,100,0],[10,0,0],[0,0,10]]){
  const hip=[0,0,0],s=M.twoBone(hip,target,[0,-1,0]);
  a.ok(s.knee.every(Number.isFinite)&&s.ankle.every(Number.isFinite));
  a.ok(Math.abs(distance(hip,s.knee)-.48)<1e-7);a.ok(Math.abs(distance(s.knee,s.ankle)-.46)<1e-7);
 }
 a.equal(M.twoBone([NaN,0,0],[0,0,0]),null);a.equal(M.twoBone([0,0,0],[0,0,0],[0,0,1],-1,1),null);
});
test('Two-bone solver preserves lengths and reachable targets across deterministic fixtures',()=>{
 for(let i=0;i<2000;i++){
  const hip=[Math.sin(i),1+Math.cos(i),Math.sin(i*.7)];
  const target=hip.map((v,k)=>v+Math.sin(i*(k+1)*.317)*.47);
  const s=M.twoBone(hip,target,[0,0,1]);
  a.ok(Math.abs(distance(hip,s.knee)-.48)<1e-7);a.ok(Math.abs(distance(s.knee,s.ankle)-.46)<1e-7);
  if(distance(hip,target)>.021)a.ok(distance(s.ankle,target)<1e-7);
 }
});
for(const speed of[0,1.05,1.7,5.5,8.4])test('World-space stance lock and exact bone lengths at '+speed+' metres/second',()=>{
 const gait=new M.Gait();let old,locks=0;
 for(let frame=0;frame<900;frame++){
  const pose=gait.update([0,1.05,frame/90*speed],0,frame/90,()=>0);
  for(let j=0;j<2;j++){
   const leg=pose.legs[j];a.ok(!leg.clamped,'Reach correction must preserve this flat-ground stride');
   a.ok(Math.abs(distance(leg.hip,leg.knee)-.48)<1e-7);a.ok(Math.abs(distance(leg.knee,leg.ankle)-.46)<1e-7);
   a.ok(leg.ankle[1]>=.105-1e-7);
   if(old?.legs[j].locked&&leg.locked){a.ok(distance(old.legs[j].ankle,leg.ankle)<1e-7);locks++;}
  }
  old=pose;
 }
 a.ok(locks>5);
});
test('Paused/frozen poses remain stable and teleport/clock changes reset contact history',()=>{
 const gait=new M.Gait();gait.update([0,1.05,0],0,0,()=>0);
 const before=gait.update([0,1.05,.2],0,.1,()=>0);
 const paused=gait.update([0,1.05,.2],0,.1,()=>0);a.deepEqual(before.legs,paused.legs);
 const frozen=gait.update([0,1.05,.2],0,.2,()=>0,true);a.deepEqual(before.legs,frozen.legs);
 const warped=gait.update([20,1.05,20],0,.3,()=>0);a.ok(warped.reset);a.ok(warped.legs.every(l=>Math.abs(l.ankle[0]-20)<.3));
 a.ok(gait.update([20,1.05,20],0,0,()=>0).reset);
});
test('Feet use the actual slope and retain finite poses through turning and loss of ground',()=>{
 const gait=new M.Gait();
 for(let i=0;i<400;i++){
  const z=i/90,pose=gait.update([0,1.05+z*.2,z],Math.sin(i/90)*.6,i/90,p=>p[2]*.2);
  for(const l of pose.legs){a.ok(l.ankle.every(Number.isFinite));a.ok(l.target[1]>=l.target[2]*.2+.105-1e-7);}
 }
 a.ok(gait.update([0,1.05,0],0,0,()=>null).legs.every(l=>l.ankle.every(Number.isFinite)));
});
test('Gait and quick selection do not alter the existing simulation or save payload',()=>{
 const s=C.create('SURESTEP-SAVE'),before=JSON.stringify(s),gait=new M.Gait();
 for(let i=0;i<100;i++){gait.update([...s.world.enemies[0].p],0,i/90,p=>C.floorAt(s.world,p));M.nextDamage(s);}
 a.equal(JSON.stringify(s),before);
});
test('Pinches require open fingers and never fire repeatedly while held',()=>{
 const p=new M.Pinch();a.equal(p.update(.015),false);a.equal(p.update(.015),false);
 a.equal(p.update(.045),false);a.equal(p.update(.027),false);a.equal(p.update(.019),true);
 for(let i=0;i<20;i++)a.equal(p.update(.024),false);
 p.update(.045);a.equal(p.update(.015),true);
});
test('Missing joints, invalid samples and transitions require another neutral gesture',()=>{
 const p=new M.Pinch();p.update(.05);a.equal(p.update(.015,false),false);
 a.equal(p.update(.015),false);p.update(.05);p.reset();a.equal(p.update(.015),false);
 p.update(.05);p.update(NaN);a.equal(p.update(.015),false);
});
test('Hand hits reject panel margins, row gaps, negative coordinates and stale rows',()=>{
 for(let i=0;i<6;i++)a.equal(M.menuHit(.5,1-(220+i*75)/768,6),i);
 a.equal(M.menuHit(.01,.7,6),-1);a.equal(M.menuHit(.5,1-260/768,6),-1);
 a.equal(M.menuHit(.5,1-600/768,2),-1);a.equal(M.menuHit(NaN,.5,6),-1);
});
test('Runtime requests optional hands and retains controller-only combat and menu parity',()=>{
 const dir=__dirname+'/../',html=fs.readFileSync(dir+'index.html','utf8'),controls=fs.readFileSync(dir+'dominion-controls.js','utf8'),hands=fs.readFileSync(dir+'quest-hands.js','utf8');
 a.ok(html.includes('optionalFeatures: bounded-floor, hand-tracking'));
 for(const id of['tidelight-quality','tidelight-ripples','tidelight-caustics'])a.ok(controls.includes(id));
 a.ok(controls.includes("if(edge(13))g.setType('blink');else if(edge(14))g.setType(VesperSurestep.nextDamage(g.game))"));
 a.ok(hands.includes('frame.getJointPose'));a.ok(hands.includes('g.arsenal?.loseTracking()'));
 a.ok(!hands.includes('localStorage.setItem'));
});
