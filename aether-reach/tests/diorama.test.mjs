import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {OPENINGS,PRESENTATIONS,cleanDiorama,openingState,setOpening,stagePoint,worldPoint,dioramaMove,sessionKind} from '../diorama-core.mjs';
for(const opening of OPENINGS)test('Diorama never seals both viewing faces: '+opening,()=>{
 for(const part of ['top','front'])for(const open of [false,true]){const next=setOpening(opening,part,open),s=openingState(next);assert(OPENINGS.includes(next));assert(s.topOpen||s.frontOpen);assert.equal(s[part+'Open'],open);}
});
test('Invalid stored presentation values normalize without requiring save migration',()=>{
 for(const input of [null,false,[],{}, {mode:'unknown',opening:'sealed',scale:NaN,height:Infinity,yaw:Infinity}]){const c=cleanDiorama(input);assert(PRESENTATIONS.includes(c.mode));assert(OPENINGS.includes(c.opening));assert(c.scale>=.02&&c.scale<=.055);assert(c.height>=.35&&c.height<=1.15);assert(Number.isFinite(c.yaw));}
});
test('AR is an explicit session request, not a silent first-person fallback',()=>{assert.equal(sessionKind('diorama-ar'),'immersive-ar');assert.equal(sessionKind('diorama-vr'),'immersive-vr');assert.equal(sessionKind('first-person-vr'),'immersive-vr');});
test('Table and world transforms roundtrip for all supported scales and rotation',()=>{
 const f={x:-107,y:7,z:-9},a={x:.3,y:.7,z:-1.8},p={x:-111,y:27.5,z:-6};
 for(const scale of [.02,.03,.055])for(const yaw of [0,.8,Math.PI,-1.2]){const c={scale,yaw},q=worldPoint(stagePoint(p,f,a,c),f,a,c);for(const k of ['x','y','z'])assert(Math.abs(q[k]-p[k])<1e-10);}
});
test('Scaled XR rig projects physical head motion without scaling game coordinates or feet',()=>{
 const focus={x:-107,y:7,z:-9},anchor={x:0,y:.5,z:-1.45},config=cleanDiorama({scale:.03,yaw:.4}),origin=worldPoint({x:0,y:0,z:0},focus,anchor,config);
 const rig=new T.Group();rig.position.set(origin.x,origin.y,origin.z);rig.rotation.y=-config.yaw;rig.scale.setScalar(1/config.scale);rig.updateMatrixWorld(true);
 const w=new T.Vector3(focus.x,focus.y,focus.z).applyMatrix4(rig.matrixWorld.clone().invert());assert(w.distanceTo(new T.Vector3(anchor.x,anchor.y,anchor.z))<1e-9);
 const head=new T.Vector3(.12,1.65,0),gameHead=head.clone().applyMatrix4(rig.matrixWorld);assert(gameHead.distanceTo(new T.Vector3(focus.x,focus.y,focus.z))>20);assert.equal(focus.x,-107);
});
test('Table-relative movement has a consistent physical direction regardless of courier aim',()=>{
 for(const yaw of [-2,0,1.2])for(const tableYaw of [0,1,-1]){const [x,y]=dioramaMove([0,-1],yaw,tableYaw);const world={x:Math.sin(yaw)*-y+Math.cos(yaw)*x,z:-Math.cos(yaw)*-y+Math.sin(yaw)*x};const c=Math.cos(tableYaw),s=Math.sin(tableYaw);assert(Math.abs(c*world.x+s*world.z)<1e-10);assert(Math.abs(-s*world.x+c*world.z+1)<1e-10);}
});
