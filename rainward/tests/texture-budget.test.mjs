import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from '../vendor/three.module.js';
import {reducedTextureSize,reducedColorMap} from '../texture-budget.mjs';import {compactVisibleInstances} from '../scan-culling.mjs';import {createGame,interactable,interact} from '../model.mjs';
test('Reduced color textures retain aspect ratio and never upscale small maps',()=>{
 assert.deepEqual(reducedTextureSize(2048,1024),{width:512,height:256});assert.deepEqual(reducedTextureSize(256,128),{width:256,height:128});
});
test('The public reduced tier owns a smaller image without replacing the full-quality source or UV transform',()=>{
 const image={width:2048,height:2048},source=new T.Texture(image);source.flipY=false;source.repeat.set(3,4);source.wrapS=T.RepeatWrapping;source.colorSpace=T.SRGBColorSpace;
 const draws=[],canvas={getContext(){return {drawImage(...args){draws.push(args);}};}};
 const low=reducedColorMap(source,()=>canvas);assert.equal(canvas.width,512);assert.equal(canvas.height,512);assert.equal(source.image,image);assert.notEqual(low.source,source.source);assert.equal(low.image,canvas);assert.deepEqual(low.repeat,source.repeat);assert.equal(low.wrapS,source.wrapS);assert.equal(low.flipY,false);assert.equal(low.colorSpace,T.SRGBColorSpace);assert.equal(draws.length,1);assert.equal(draws[0][0],image);
});
test('Tall narrow offscreen cliff bounds do not force a whole batch into the visible draw',()=>{
 const mesh=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),1),camera=new T.PerspectiveCamera(60,1,.1,100);camera.updateMatrixWorld();const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const matrix=new T.Matrix4().compose(new T.Vector3(50,0,-5),new T.Quaternion(),new T.Vector3(1,100,1));assert.equal(compactVisibleInstances(mesh,[matrix],frustum),0);
});
test('A nearby supply bag cannot steal the interaction from a closer shelter',()=>{
 const s=createGame();Object.assign(s.player,{x:.223,z:26.907});assert.equal(interactable(s).kind,'shelter');assert.ok(interact(s));assert.ok(s.events.some(e=>e.type==='checkpoint'));assert.equal(s.taken.size,0);
 Object.assign(s.player,{x:1.3,z:25.5});assert.equal(interactable(s).kind,'item');assert.ok(interact(s));assert.ok(s.taken.has('rations'));
});
