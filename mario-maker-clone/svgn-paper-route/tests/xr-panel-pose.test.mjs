import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.webgpu.js';
import {addOverlay,PANEL_ORDER,POINTER_ORDER} from '../xr-overlay.mjs';
for(const angle of [30,90,180])test('Exhibit rotation leaves seated menu heading stable '+angle,()=>{
 const parent=new T.Group();parent.userData.yaw=.3;parent.rotation.y=.3;parent.position.set(1,1.6,2);
 const mesh=new T.Mesh(new T.PlaneGeometry(1.5,1.125),new T.MeshBasicNodeMaterial());mesh.position.set(0,-.08,-1.8);
 addOverlay(T,parent,mesh,PANEL_ORDER);parent.updateMatrixWorld(true);const before=mesh.matrixWorld.clone();
 parent.rotation.y=.3+angle*Math.PI/180;parent.updateMatrixWorld(true);
 assert(mesh.matrixWorld.elements.every((x,i)=>Math.abs(x-before.elements[i])<1e-9));
 mesh.geometry.dispose();mesh.material.dispose();
});
test('Pointer overlay retains normal tracking transform',()=>{
 const parent=new T.Group();parent.userData.yaw=.3;parent.rotation.y=1;
 const mesh=new T.Mesh(new T.SphereGeometry(.01),new T.MeshBasicNodeMaterial());
 const layer=addOverlay(T,parent,mesh,POINTER_ORDER);parent.updateMatrixWorld(true);assert.equal(layer.rotation.y,0);
 mesh.geometry.dispose();mesh.material.dispose();
});
