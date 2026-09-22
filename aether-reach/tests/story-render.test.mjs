/* CPU geometry fixtures use the pinned Three stereo culling calculation.
 * These are not a GPU render or physical-device test. Native eye draws and
 * screenshots must separately verify the actual application. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
import {keepRoomUIInEyeViews} from '../field-rotunda.mjs';
const source=readFileSync(new URL('../vendor/three.module.js',import.meta.url),'utf8');
const start=source.indexOf('function setProjectionFromUnion('),end=source.indexOf('function updateCamera( camera, parent )',start);
assert(start>=0&&end>start,'Pinned renderer must still expose the inspected union implementation');
const union=new Function('Vector3',`const cameraLPos=new Vector3(),cameraRPos=new Vector3();${source.slice(start,end)};return setProjectionFromUnion;`)(T.Vector3);
const frustum=c=>new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse));
function fixture(worldScale=.03){
 const rig=new T.Group();rig.scale.setScalar(1/worldScale);rig.position.set(3,0,40);
 const root=new T.Group();root.position.set(0,0,-1.05);rig.add(root);
 const panel=new T.Mesh(new T.PlaneGeometry(1.36,1.02),new T.MeshBasicMaterial());panel.position.y=1.12;panel.scale.setScalar(.82);root.add(panel);
 const button=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial());button.position.set(0,(.5-315.5/768)*1.02,.025);button.scale.set(974/1024*1.36,51/768*1.02,.025);panel.add(button);rig.updateMatrixWorld(true);
 const eyes=[-.032,.032].map(x=>{const c=new T.PerspectiveCamera();c.projectionMatrix.fromArray([1.8,0,0,0,0,1.5,0,0,0,0,-1.0001,-1,0,0,-.12,0]);c.matrixWorld.multiplyMatrices(rig.matrixWorld,new T.Matrix4().makeTranslation(x,1.65,0));c.matrixWorldInverse.copy(c.matrixWorld).invert();return c;});
 const combined=new T.PerspectiveCamera();union(combined,...eyes);return {panel,button,eyes,combined};
}
test('Pinned stereo union reproduces the missing thin panel while raised buttons remain',()=>{
 const {panel,button,eyes,combined}=fixture();assert(eyes.every(e=>frustum(e).intersectsObject(panel)));assert.equal(frustum(combined).intersectsObject(panel),false);assert.equal(frustum(combined).intersectsObject(button),true);
});
test('Room UI policy retains per-eye content at all supported diorama scales without changing world culling',()=>{
 for(const scale of [.015,.03,.08,1]){const {panel,button,combined}=fixture(scale),before=panel.matrixWorld.clone(),world=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());
  assert.equal(keepRoomUIInEyeViews(panel),panel);keepRoomUIInEyeViews(button);assert(!panel.frustumCulled||frustum(combined).intersectsObject(panel));assert(!button.frustumCulled||frustum(combined).intersectsObject(button));assert(world.frustumCulled);assert(panel.matrixWorld.equals(before));assert.equal(panel.visible,true);panel.visible=false;assert.equal(panel.visible,false);
 }
});
test('Actual rotunda configures both panel and raised buttons and reports real draw completion',()=>{
 const s=readFileSync(new URL('../field-rotunda.mjs',import.meta.url),'utf8');assert(s.includes('keepRoomUIInEyeViews(panel)'));assert(s.includes('keepRoomUIInEyeViews(m)'));assert(s.includes('panel.onAfterRender=()=>{panelDraws++;}'));assert(s.includes('menu&&panel.visible?buttons.filter'));
});
