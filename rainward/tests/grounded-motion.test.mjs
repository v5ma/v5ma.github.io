import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {actor,pose} from './grounded-pose.mjs';
import {twoBonePoints,FootContact,groundSample} from '../grounded-motion.mjs';
const player=(extra={})=>({x:0,z:0,yaw:0,hp:100,stance:'stand',speed:0,...extra});
const build=()=>actor(new T.Scene(),null,0x748473);
const at=b=>b.getWorldPosition(new T.Vector3());
test('Two-bone triangles retain limb lengths for reachable, folded, straight and unreachable targets',()=>{
 for(const target of [[0,0,0],[0,-1e-10,0],[0,-.5,0],[.1,-.65,.2],[0,-100,0],[1,0,0]])for(const pole of [[0,-1,0],[0,0,-1],[1,0,0]]){
  const h=new T.Vector3(),r=twoBonePoints(h,new T.Vector3(...target),.43,.397,new T.Vector3(...pole));
  assert.ok(r.knee.toArray().every(Number.isFinite)&&r.end.toArray().every(Number.isFinite));
  assert.ok(Math.abs(h.distanceTo(r.knee)-.43)<1e-6);assert.ok(Math.abs(r.knee.distanceTo(r.end)-.397)<1e-6);
  assert.ok(h.distanceTo(r.end)<.827);if(Math.hypot(...target)>.034&&Math.hypot(...target)<.814)assert.ok(r.end.distanceTo(new T.Vector3(...target))<1e-6);
 }
 assert.throws(()=>twoBonePoints(new T.Vector3(),new T.Vector3(),0,.4),RangeError);
});
test('Foot target stays world-locked, and unlock/relock transitions preserve position continuity',()=>{
 const f=new FootContact();f.update(new T.Vector3(),true,1/60);
 for(let i=0;i<30;i++)f.update(new T.Vector3(i*.001,0,0),true,1/60);
 assert.equal(f.point.length(),0);const before=f.point.clone();f.update(new T.Vector3(.1,.04,0),false,1/60);assert.ok(f.point.distanceTo(before)<1e-8);
 for(let i=0;i<20;i++)f.update(new T.Vector3(.1,.04,0),false,1/60);assert.ok(f.point.distanceTo(new T.Vector3(.1,.04,0))<1e-8);
 f.update(new T.Vector3(.1,.04,0),true,1/60);for(let i=0;i<20;i++)f.update(new T.Vector3(.13,0,0),true,1/60);assert.ok(f.point.distanceTo(new T.Vector3(.1,.04,0))<1e-8);
});
test('An unreachable plant cannot immediately relock before lift-off',()=>{
 const f=new FootContact(),p=new T.Vector3();f.update(p,true,.016);f.update(p,true,.016,true);assert.equal(f.locked,false);
 f.update(p,true,.016);assert.equal(f.locked,false);f.update(p,false,.016);f.update(p,true,.016);assert.equal(f.locked,true);
});
test('Ground queries accept continuous slopes and reject cliffs, nonfinite terrain and steep walls',()=>{
 const sample=groundSample((x,z)=>x*.2+z*.3,0,0);assert.ok(sample);assert.ok(sample.normal.distanceTo(new T.Vector3(-.2,1,-.3).normalize())<1e-10);
 assert.equal(groundSample((x)=>x<0?0:1,0,0),null);assert.equal(groundSample(()=>NaN,0,0),null);assert.equal(groundSample(x=>x*4,0,0),null);
});
for(const fps of [30,60,120])test(`Actual ankle transforms hold settled plants below 2 mm at ${fps} Hz across five travel speeds`,()=>{
 for(const speed of [0,.8,2,3.6,6]){const a=build();let samples=0,max=0;for(let i=0;i<fps*5;i++){
  pose(a,player({z:-i/fps*speed,speed}),i/fps);
  for(let j=0;j<2;j++){const f=a.motion.feet[j];if(f.locked&&f.age>.11){samples++;max=Math.max(max,at(a.bones[j?16:13]).distanceTo(f.anchor));}}
 }assert.ok(samples>10,`speed ${speed} has real measured plants`);assert.ok(max<.002,`${speed}: ${max}`);}
});
test('Stationary roots do not march when requested speed is blocked by collision',()=>{const a=build();for(let i=0;i<90;i++)pose(a,player({speed:6}),i/60);assert.equal(a.motion.phase,0);assert.equal(a.motion.stats.locked,2);});
test('Terrain height is applied once and each planted sole follows the supporting slope',()=>{
 for(const slope of [-.57,-.3,.3,.57]){const a=build(),ground=(x,z)=>2+slope*z;let measured=0,max=0;
  for(let i=0;i<180;i++){const p=player({z:-i/60*.8,speed:.8});pose(a,p,i/60,false,ground);assert.equal(a.root.position.y,ground(p.x,p.z));
   for(let j=0;j<2;j++){const f=a.motion.feet[j];if(i>30&&f.locked&&f.age>.11){measured++;max=Math.max(max,at(a.bones[j?16:13]).distanceTo(f.anchor));}}
  }assert.ok(measured>10);assert.ok(max<.012,`slope ${slope} residual ${max}`);
 }
});
test('Lateral and backward movement retain finite independent leg chains',()=>{const a=build();for(let i=0;i<160;i++){pose(a,player({x:i/80,z:i/120,speed:1}),i/60);for(const b of a.bones)assert.ok(b.matrixWorld.elements.every(Number.isFinite));}assert.ok(a.motion.stats.plants>3);});
test('Large turns release a planted foot instead of twisting a stationary knee indefinitely',()=>{const a=build();for(let i=0;i<50;i++)pose(a,player(),i/60);for(let i=50;i<110;i++)pose(a,player({yaw:Math.PI}),i/60);assert.ok(a.motion.stats.plants>2);for(const b of a.bones)assert.ok(b.matrixWorld.elements.every(Number.isFinite));});
test('A shelter restore drops old world-space contact history',()=>{const a=build();pose(a,player(),0);pose(a,player(),.016);pose(a,player({x:30,z:-10}),.032);for(const f of a.motion.feet)assert.ok(Math.abs(f.point.x-30)<.2);});
test('Stance and aim blending change render poses without assigning any gameplay fields',()=>{const a=build();pose(a,player(),0);const before=a.bones[5].quaternion.clone(),p=Object.freeze(player({aim:true}));pose(a,p,1/60);assert.ok(a.bones[5].quaternion.angleTo(before)<.5);assert.ok(a.bones[5].quaternion.angleTo(before)>.05);assert.equal(p.aim,true);});
test('Swimming has distinct tread/stroke articulation and never keeps ground locks or visible guns',()=>{
 const a=build();for(let i=0;i<60;i++)pose(a,player(),i/60);
 let tread;for(let i=60;i<120;i++)pose(a,player({waterMode:'swim',swimDepth:.64}),i/60);tread=a.rig.rotation.x;
 for(let i=120;i<210;i++)pose(a,player({z:-(i-120)/60*2,waterMode:'swim',swimDepth:.64,aim:true,equipped:'rifle'}),i/60);
 assert.ok(Math.abs(a.rig.rotation.x-tread)>.7);assert.equal(a.motion.stats.locked,0);assert.equal(a.motion.stats.groundSolves,0);assert.equal(a.weapon.visible,false);assert.equal(a.longWeapon.visible,false);assert.equal(a.tools.visible,false);
});
test('Prone, vault, dodge and death release IK; returning to dry ground safely reacquires it',()=>{const a=build();let i=0;for(const change of [{},{stance:'prone'},{vault:{t:.2,duration:.6}},{dodge:.4},{hp:0},{}]){for(let k=0;k<45;k++,i++)pose(a,player(change),i/60);if(Object.keys(change).length)assert.equal(a.motion.stats.locked,0);else assert.equal(a.motion.stats.locked,2);}});

// At Free Stride speed, one stance is shorter than the old fixed 110 ms
// settle requirement. Test the actual completed easing interval, not an
// impossible walking-duration contact. The original walking tests stay intact.
for(const fps of [30,60,120])test(`Fast-run plants finish their easing and hold the real ankle at ${fps} Hz`,()=>{
 for(const speed of [9,14]){const a=build();let samples=0,max=0;for(let i=0;i<fps*5;i++){
  pose(a,player({z:-i/fps*speed,speed}),i/fps);
  for(let j=0;j<2;j++){const f=a.motion.feet[j];if(i>fps&&f.locked&&f.elapsed>=f.duration){samples++;max=Math.max(max,at(a.bones[j?16:13]).distanceTo(f.anchor));}}
 }assert.ok(samples>10,`speed ${speed} has actual completed plants`);assert.ok(max<.002,`${speed}: ${max}`);}
});
