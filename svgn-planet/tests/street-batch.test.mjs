import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from '../vendor/three.module.js';import {batchStreetPatch} from '../street-batch.mjs';
test('Static art merging removes draw calls without removing vertices or changing world-space placement',()=>{
 const root=new T.Group();root.position.set(3,5,9);root.rotation.z=.2;const material=new T.MeshStandardMaterial();let triangles=0;
 for(let i=0;i<8;i++){const g=i%2?new T.BoxGeometry(1,2,1):new T.CylinderGeometry(.3,.3,2,8);const m=new T.Mesh(g,material);m.position.set(i,1,i*.3);m.rotation.y=i*.2;m.scale.x=i===2?-1:1;root.add(m);triangles+=(g.index?.count||g.attributes.position.count)/3;}
 root.updateMatrixWorld(true);const before=new T.Box3().setFromObject(root,true);const result=batchStreetPatch(root);const after=new T.Box3().setFromObject(root,true);
 assert.equal(result.solidDraws,1);assert.equal(root.children.length,1);assert.equal(root.children[0].geometry.attributes.position.count/3,triangles);assert.ok(before.min.distanceTo(after.min)<1e-5&&before.max.distanceTo(after.max)<1e-5);
});
test('Nature keeps a shared instance buffer instead of copying each high-detail tree into RAM',()=>{
 const root=new T.Group(),g=new T.BoxGeometry(),mat=new T.MeshStandardMaterial();for(let i=0;i<4;i++){const m=new T.Mesh(g,mat);m.userData.sharedNature=true;m.position.x=i*3;root.add(m);}const result=batchStreetPatch(root);assert.equal(result.natureDraws,1);assert.equal(root.children[0].geometry,g);assert.equal(root.children[0].count,4);const m=new T.Matrix4();root.children[0].getMatrixAt(3,m);assert.equal(m.elements[12],9);
});
