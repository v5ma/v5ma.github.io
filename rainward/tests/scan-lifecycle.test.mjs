import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from '../vendor/three.module.js';
import {createScannedAssets} from '../scanned-assets.mjs';import {compactVisibleInstances,createStaticCulling} from '../scan-culling.mjs';import {LEVELS} from '../world.mjs';
test('Disposing the scanned layer also releases the replaced procedural textures exactly once',()=>{
 const color=new T.Texture(),normal=new T.Texture(),packed=new T.Texture(),released=[];
 for(const t of [color,normal,packed])t.addEventListener('dispose',()=>released.push(t.uuid));
 const material=new T.MeshStandardMaterial({map:color,bumpMap:normal,roughnessMap:packed});
 const layer=createScannedAssets(new T.Scene(),{},LEVELS.district,{heightAt:()=>0});
 layer.bind(material,'stone');layer.bind(material,'brick');layer.dispose();layer.dispose();
 assert.equal(released.length,3);assert.equal(new Set(released).size,3);
});

test('Scattered scan batches only submit individual instances intersecting the real camera',()=>{
 const geometry=new T.BoxGeometry(),material=new T.MeshBasicMaterial(),mesh=new T.InstancedMesh(geometry,material,3);
 const matrices=[new T.Matrix4().makeTranslation(0,0,-5),new T.Matrix4().makeTranslation(50,0,-5),new T.Matrix4().makeTranslation(0,0,5)];
 const camera=new T.PerspectiveCamera(60,1,.1,100);camera.updateMatrixWorld();const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const serialized=matrices.map(m=>m.toArray());assert.equal(compactVisibleInstances(mesh,matrices,frustum),1);assert.equal(mesh.count,1);const read=new T.Matrix4();mesh.getMatrixAt(0,read);assert.deepEqual(read.toArray(),matrices[0].toArray());assert.deepEqual(matrices.map(m=>m.toArray()),serialized);assert.equal(mesh.geometry,geometry);
 camera.rotation.y=Math.PI;camera.updateMatrixWorld();frustum.setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));assert.equal(compactVisibleInstances(mesh,matrices,frustum),1);mesh.getMatrixAt(0,read);assert.deepEqual(read.toArray(),matrices[2].toArray());
});

test('Conservative scan culling retains out-of-view shadow casters',()=>{
 const mesh=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),1);mesh.castShadow=true;
 const camera=new T.PerspectiveCamera(60,1,.1,100);camera.updateMatrixWorld();const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 assert.equal(compactVisibleInstances(mesh,[new T.Matrix4().makeTranslation(30,0,-5)],frustum),1);
});

test('The reduced tier culls offscreen static shadow casters only when their shadow pass is disabled',()=>{
 const scene=new T.Scene(),mesh=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),2);mesh.castShadow=true;
 mesh.setMatrixAt(0,new T.Matrix4().makeTranslation(0,0,-5));mesh.setMatrixAt(1,new T.Matrix4().makeTranslation(30,0,-5));scene.add(mesh);
 const camera=new T.PerspectiveCamera(60,1,.1,100);camera.updateMatrixWorld();const c=createStaticCulling(scene);c.update(camera,true);assert.equal(mesh.count,2);c.update(camera,false);assert.equal(mesh.count,1);assert.equal(c.stats().authored,2);c.update(camera,true);assert.equal(mesh.count,2);
});
test('Static visibility does not resurrect a procedural backdrop hidden by the scanned layer',()=>{
 const scene=new T.Scene(),mesh=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),1);mesh.setMatrixAt(0,new T.Matrix4().makeTranslation(0,0,-5));scene.add(mesh);
 const c=createStaticCulling(scene),camera=new T.PerspectiveCamera(60,1,.1,100);camera.updateMatrixWorld();mesh.visible=false;c.update(camera,false);assert.equal(mesh.visible,false);assert.equal(c.stats().submitted,0);mesh.visible=true;c.update(camera,false);assert.equal(c.stats().submitted,1);
});
