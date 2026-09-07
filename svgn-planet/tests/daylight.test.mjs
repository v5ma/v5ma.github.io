import {test} from 'node:test';import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createSky} from '../sky.mjs';import {canopyGeometry} from '../foliage.mjs';
import {CAMERA_PRESETS,chooseGraphics} from '../presentation.mjs';
import {initial,step,saveData,readSave,WORLD} from '../model.mjs';
test('Daylight is a background draw through the actual inverse camera, not a close sphere or reference image',()=>{
 const scene=new T.Scene(),sky=createSky(scene),camera=new T.PerspectiveCamera(62,1.6,.1,880);camera.position.set(0,112,8);camera.lookAt(0,111,0);camera.updateMatrixWorld();const up=new T.Vector3(0,1,0);sky.update(camera,up,true);
 assert.equal(sky.mesh.geometry.attributes.position.count,3);assert.equal(sky.mesh.material.depthWrite,false);assert.equal(sky.mesh.material.depthTest,false);assert.equal(sky.mesh.material.toneMapped,false);assert.equal(sky.mesh.frustumCulled,false);
 const wanted=new T.Matrix4().multiplyMatrices(camera.matrixWorld,camera.projectionMatrixInverse);assert.deepEqual(sky.mesh.material.uniforms.rays.value.elements,wanted.elements);assert.deepEqual(sky.mesh.material.uniforms.eye.value.toArray(),camera.position.toArray());
 assert.equal(sky.inspect().rendered,0);sky.mesh.onAfterRender();assert.equal(sky.inspect().rendered,1);sky.update(camera,up,false);assert.equal(sky.mesh.visible,false);
});
test('Radial horizon tracks a reversed hemisphere without altering the camera or live normal',()=>{
 const sky=createSky(new T.Scene()),camera=new T.PerspectiveCamera();camera.position.set(0,-112,8);camera.lookAt(0,-111,0);camera.updateMatrixWorld();const up=new T.Vector3(0,-1,0),before=camera.matrixWorld.toArray();sky.update(camera,up,true);assert.deepEqual(sky.mesh.material.uniforms.up.value.toArray(),[0,-1,0]);assert.deepEqual(camera.matrixWorld.toArray(),before);assert.deepEqual(up.toArray(),[0,-1,0]);
});
test('Leafy canopies have deterministic bounded, finite geometry rather than a balloon per cluster',()=>{
 const a=canopyGeometry(300,1.4),b=canopyGeometry(300,1.4),c=canopyGeometry(301,1.4);
 assert.equal(a.attributes.position.count,128*6);assert.deepEqual(a.attributes.position.array,b.attributes.position.array);assert.notDeepEqual(a.attributes.position.array,c.attributes.position.array);
 assert.ok([...a.attributes.position.array,...a.attributes.normal.array].every(Number.isFinite));assert.ok(a.boundingSphere.radius<3);assert.equal(a.attributes.uv.count,a.attributes.position.count);assert.equal(a.attributes.color.count,a.attributes.position.count);
});
test('The visual pass retains both the close camera and bounded touch graphics',()=>{
 assert.ok(CAMERA_PRESETS.street.distance<9);for(const [width,height]of[[390,844],[844,390]]){const q=chooseGraphics({width,height,touch:true,dpr:3});assert.equal(q.shadows,false);assert.ok(width*height*q.pixelRatio*q.pixelRatio<=480001);}
});
test('Completed saves still enter a playable simulation, not a terminal title or finish state',()=>{
 const s=initial({delivered:WORLD.homes.map(h=>h.id),complete:true,stamps:[],ride:true}),old=[...s.n];for(let i=0;i<120;i++)step(s,{direction:s.north});assert.ok(s.steps===120&&s.distance>1);assert.notDeepEqual(s.n,old);const restored=initial(readSave(JSON.stringify(saveData(s))));assert.equal(restored.complete,true);assert.equal(restored.delivered.size,8);
});
