import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {ReserveXR} from '../xr-reserve.js';
test('Snap-turn pivot survives later simulation frames with a room-scale head offset',()=>{
 const x=Object.create(ReserveXR.prototype);x.originOffset=new T.Vector3();x.rig=new T.Group();
 const camera=new T.PerspectiveCamera();camera.position.set(.45,1.67,-.32);x.rig.add(camera);
 x.ctx={fleet:{position:{x:30,y:1,z:40},mode:'foot'},renderer:{xr:{getCamera:()=>camera}}};
 x.position();const before=camera.getWorldPosition(new T.Vector3());x.snap(Math.PI/6);x.position();
 assert.ok(before.distanceTo(camera.getWorldPosition(new T.Vector3()))<1e-8);
 x.ctx.fleet.position.x+=2;x.position();const after=camera.getWorldPosition(new T.Vector3());
 assert.ok(Math.abs(after.x-before.x-2)<1e-8);assert.ok(Math.abs(after.z-before.z)<1e-8);
});
