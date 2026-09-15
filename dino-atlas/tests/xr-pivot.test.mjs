import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {ReserveXR} from '../xr-reserve.js';
test('Snap-turn pivot survives later simulation frames with a room-scale head offset',()=>{
 const x=Object.create(ReserveXR.prototype);x.originOffset=new T.Vector3();x.rig=new T.Group();
 const camera=new T.PerspectiveCamera();camera.position.set(.45,1.67,-.32);x.rig.add(camera);
 x.ctx={camera,fleet:{position:{x:30,y:1,z:40},mode:'foot'},renderer:{xr:{getCamera:()=>camera}}};
 x.position();const before=camera.getWorldPosition(new T.Vector3());x.snap(Math.PI/6);x.position();
 assert.ok(before.distanceTo(camera.getWorldPosition(new T.Vector3()))<1e-8);
 x.ctx.fleet.position.x+=2;x.position();const after=camera.getWorldPosition(new T.Vector3());
 assert.ok(Math.abs(after.x-before.x-2)<1e-8);assert.ok(Math.abs(after.z-before.z)<1e-8);
});
test('Tracked head pose is transferred to the parented application camera before UI placement',()=>{
 const x=Object.create(ReserveXR.prototype),camera=new T.PerspectiveCamera(),rig=new T.Group();rig.position.set(15,0,30);rig.add(camera);let updates=0;
 x.ctx={camera,renderer:{xr:{isPresenting:true,updateCamera(c){assert.equal(c,camera);updates++;c.position.set(.2,1.6,-.3);},getCamera(){throw Error('Do not treat unparented stereo camera as the world-space head');}}}};
 assert.equal(x.headCamera(),camera);assert.equal(updates,1);const head=camera.getWorldPosition(new T.Vector3());assert.ok(head.distanceTo(new T.Vector3(15.2,1.6,29.7))<1e-8);
});
