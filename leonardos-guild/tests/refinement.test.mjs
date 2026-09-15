/* CPU tests use the actual shared Three rig; no actor physics or save writes. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createPersonRig} from '../character-rig.mjs';
import {animatePerson,inspectMotion} from '../character-motion.mjs';
import {soleContact} from '../foot-ik.mjs';
const close=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
const rig=()=>createPersonRig({trim:new T.MeshStandardMaterial({vertexColors:true})});
const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

test('A stationary quarter-turn lifts and replants each boot instead of leaving both twisted',()=>{
 const p=rig();let steps=0,lift=0;
 for(let i=0;i<=180;i++){
  p.root.rotation.y=Math.min(i,90)*Math.PI/180;
  animatePerson(p,i/60,{motion:'idle',ground:()=>0});
  const feet=p.root.guildRig.feet,turning=feet.filter(f=>f.replant).length;
  assert.ok(turning<=1,'At most one stationary foot is stepping');steps+=turning;
  lift=Math.max(lift,...feet.map(f=>f.actual.y-.1375));
 }
 assert.ok(steps>0);assert.ok(lift>.02);
 for(const f of p.root.guildRig.feet){assert.ok(f.locked);assert.ok(Math.abs(angle(Math.PI/2,f.heading))<.55);assert.ok(f.error<1e-6);}
 close(p.root.position.length(),0);
});

test('Turn placement remains continuous across the -pi/pi heading seam',()=>{
 const p=rig();let previous=null,maxStep=0;
 for(let i=0;i<210;i++){
  p.root.rotation.y=Math.atan2(Math.sin(2.8+Math.min(i,140)*.012),Math.cos(2.8+Math.min(i,140)*.012));
  animatePerson(p,i/60,{motion:'idle',ground:()=>0});const feet=p.root.guildRig.feet;
  if(previous)for(let j=0;j<2;j++)maxStep=Math.max(maxStep,feet[j].actual.distanceTo(previous[j]));
  previous=feet.map(f=>f.actual.clone());
 }
 assert.ok(maxStep<.05,`Foot displacement ${maxStep}`);
 assert.ok(p.root.guildRig.feet.every(f=>f.locked&&Math.abs(angle(p.root.rotation.y,f.heading))<.55));
});

test('Support normals and heading come from a bounded shallow floor plane',()=>{
 const contact=soleContact((x,z)=>2+x*.12+z*.2,1,2,2.52,1,.4);
 const expected=new T.Vector3(-.12,1,-.2).normalize();
 close(contact.normal.distanceTo(expected),0);
 close(new T.Vector3(0,1,0).applyQuaternion(contact.rotation).distanceTo(expected),0);
 close(contact.height,2.52);
});

test('The actual shared boot meshes sit on the sampled plane without toes cutting into it',()=>{
 const p=rig(),ground=(x,z)=>2+x*.12+z*.20;p.root.position.y=2;p.root.rotation.y=.4;
 animatePerson(p,0,{motion:'idle',ground});p.root.updateWorldMatrix(true,true);
 for(const ankle of p.root.guildRig.ankles){
  const up=new T.Vector3(0,1,0).applyQuaternion(ankle.getWorldQuaternion(new T.Quaternion()));
  close(up.distanceTo(new T.Vector3(-.12,1,-.2).normalize()),0);
  let minimum=Infinity;
  ankle.traverse(mesh=>{if(!mesh.isMesh)return;const positions=mesh.geometry.attributes.position;
   for(let i=0;i<positions.count;i++){const v=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);minimum=Math.min(minimum,v.y-ground(v.x,v.z));}
  });
  assert.ok(minimum>=-1e-6&&minimum<1e-5,`Sole-plane gap ${minimum}`);
 }
});

test('Abrupt ledges, walls, missing samples and invalid scale use a finite level support plane',()=>{
 for(const ground of[()=>NaN,()=>{throw Error('floor unavailable');},(x)=>x>0?1:0,(x)=>x*20]){
  const result=soleContact(ground,0,0,0,NaN,NaN);
  assert.deepEqual(result.normal.toArray(),[0,1,0]);assert.ok([...result.rotation].every(Number.isFinite));
 }
});

test('Pause freezes a partly completed turn step, then resumes without resetting the anchor',()=>{
 const p=rig();animatePerson(p,0,{motion:'idle',ground:()=>0});
 p.root.rotation.y=.9;animatePerson(p,.05,{motion:'idle',ground:()=>0});
 assert.ok(p.root.guildRig.feet.some(f=>f.replant));const before=inspectMotion(p);
 for(let i=0;i<20;i++)animatePerson(p,.05,{motion:'idle',ground:()=>0});
 assert.deepEqual(inspectMotion(p),before);
 for(let i=1;i<=50;i++)animatePerson(p,.05+i/60,{motion:'idle',ground:()=>0});
 assert.ok(p.root.guildRig.feet.every(f=>f.locked&&!f.replant));
});

test('Jump and region changes discard unfinished cosmetic turn steps',()=>{
 const p=rig();animatePerson(p,0,{motion:'idle'});p.root.rotation.y=.9;animatePerson(p,.05,{motion:'idle'});
 animatePerson(p,.1,{motion:'jump'});assert.equal(p.root.guildRig.feet,null);
 p.root.position.set(300,4,20);animatePerson(p,.2,{motion:'idle',level:10,ground:()=>4});
 assert.ok(p.root.guildRig.feet.every(f=>!f.replant&&f.anchor.x>299&&f.anchor.y>4));
});

import {createTapHold} from '../quick-actions.mjs';
import {createXRAxisGate,createXRRepeat,createXRContextButton,xrWheelCommand,xrButtons} from '../xr-input.mjs';

test('A long LB hold hidden by a stalled frame cannot become an accidental quick swap',()=>{
 const tap=createTapHold();tap.update({pressed:true,down:true,now:0});
 assert.equal(tap.update({released:true,down:false,now:550}),null);
 tap.update({pressed:true,down:true,now:600});assert.equal(tap.update({released:true,down:false,now:680}),'tap');
});
test('Malformed or backwards tap timestamps cancel instead of triggering a command',()=>{
 for(const now of[NaN,Infinity,-1]){const tap=createTapHold();tap.update({pressed:true,down:true,now:10});assert.equal(tap.update({released:true,now}),null);}
});
test('A held XR stick must center after connection, UI handoff and lost tracking',()=>{
 const gate=createXRAxisGate();assert.deepEqual(gate.read(true,1,0),{x:0,y:0});
 gate.read(true,0,0);assert.deepEqual(gate.read(true,1,-.5),{x:1,y:-.5});gate.reset();
 assert.deepEqual(gate.read(true,1,-.5),{x:0,y:0});gate.read(true,0,0);gate.read(false,1,1);
 assert.deepEqual(gate.read(true,1,1),{x:0,y:0});
});
test('XR menu navigation repeats at bounded intervals and resets on release',()=>{
 const repeat=createXRRepeat();assert.equal(repeat.read(0,1,0),'down');assert.equal(repeat.read(0,1,100),'');
 assert.equal(repeat.read(0,1,340),'down');assert.equal(repeat.read(0,1,400),'');assert.equal(repeat.read(0,1,480),'down');
 assert.equal(repeat.read(0,0,500),'');assert.equal(repeat.read(0,1,520),'down');repeat.reset();assert.equal(repeat.read(1,0,0),'right');
});
test('XR context input reloads promptly and adds one deliberate hold-to-interact action',()=>{
 const button=createXRContextButton();assert.equal(button.read({pressed:true,down:true,now:0,canReload:true}),'reload');
 assert.equal(button.read({down:true,now:400}),null);assert.equal(button.read({down:true,now:450}),'interact');
 assert.equal(button.read({down:true,now:900}),null);assert.equal(button.read({released:true,now:950}),null);
});
test('A normal XR interaction is not repeated by holding its button',()=>{
 const button=createXRContextButton();assert.equal(button.read({pressed:true,down:true,now:0}),'interact');
 assert.equal(button.read({down:true,now:500}),null);
});
test('Menu entry or tracking loss cancels an unfinished reload-to-interact hold',()=>{
 const button=createXRContextButton();button.read({pressed:true,down:true,now:0,canReload:true});button.reset();
 assert.equal(button.read({down:true,now:600}),null);
});
test('XR radial selection, variants, confirm and cancel are mapped without pointing at a panel',()=>{
 const edges=Array.from({length:6},()=>({pressed:false,released:false}));
 assert.deepEqual(xrWheelCommand('right',{x:1,y:0},edges),{close:null,x:1,y:0,variant:0});
 assert.equal(xrWheelCommand('left',{x:0,y:0},edges,{direction:'right'}).variant,1);
 edges[4].pressed=true;assert.deepEqual(xrWheelCommand('right',{},edges),{close:true});
 edges[5].pressed=true;assert.deepEqual(xrWheelCommand('right',{},edges),{close:false});
});
test('Only the opening XR grip can confirm on release',()=>{
 const edges=Array.from({length:6},()=>({pressed:false,released:false}));edges[1].released=true;
 assert.equal(xrWheelCommand('left',{},edges,{owner:false}).close,null);
 assert.equal(xrWheelCommand('left',{},edges,{owner:true}).close,true);
});
test('Missing controller arrays remain neutral instead of crashing the XR frame',()=>{
 const result=xrButtons({gamepad:{mapping:'xr-standard'}});assert.equal(result.x,0);assert.equal(result.y,0);assert.ok(result.buttons.every(v=>!v));
});
