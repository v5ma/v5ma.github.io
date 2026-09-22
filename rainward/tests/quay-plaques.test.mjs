/* Actual Three-object plaque fixtures; not pixel or device acceptance. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import * as W from '../world.mjs';
import * as M from '../model.mjs';
import {createReclaimedPlacesArt} from '../reclaimed-places-art.mjs';
function artFixture(chapter){
 const scene=new T.Scene(),labels=[];
 const A={add(){},label(text,x,y,z,w,h,bg,fg,rotation){const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({side:T.DoubleSide}));o.position.set(x,y,z);o.rotation.y=rotation||0;o.name=text;scene.add(o);labels.push(text);return o;},mesh(shape,scale,color){const o=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color}));o.scale.set(...scale);return o;}};
 createReclaimedPlacesArt(scene,A,chapter);
 return {scene,labels,dispose(){const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}};
}
// Regression from actual a1b74d4 browser screenshots: a doorway-sized plaque
// filled the over-shoulder view, and an outward-facing double-sided sign read
// backward from inside. Plaques now sit on the actual piers, outside the opening.
test('Quay entry and exit plaques stay on solid door piers and face the approaching survivor',()=>{
 M.createGame('district');const f=artFixture(W.CURRENT);try{
  for(const [name,z]of [['PUMP 03\nQUAY SERVICE',-24.98],['NORTH QUAY\nTRANSMITTER',-40.48]]){
   const sign=f.scene.getObjectByName(name);assert.ok(sign);sign.updateMatrixWorld(true);const b=new T.Box3().setFromObject(sign);
   assert.ok(b.max.x< -33,'Plaque must not cover the two-metre doorway');assert.ok(b.min.x> -34.5);assert.equal(sign.position.z,z);assert.ok(b.max.y<2);
   assert.equal(sign.material.side,T.FrontSide);assert.ok(new T.Vector3(0,0,1).applyQuaternion(sign.quaternion).z>.99);
  }
  const freight=f.scene.getObjectByName('COASTAL FREIGHT\nNIGHT DISPATCH');freight.updateMatrixWorld(true);const b=new T.Box3().setFromObject(freight);assert.ok(b.min.y>=.6&&b.max.y<=1.1,'Freight plaque stays on the physical baggage screen, not in the open sightline');
 }finally{f.dispose();}
});
test('Every new place plaque renders only its readable face rather than mirrored backside text',()=>{
 for(const id of ['district','terminus']){M.createGame(id);const f=artFixture(W.CURRENT);try{for(const name of f.labels)assert.equal(f.scene.getObjectByName(name).material.side,T.FrontSide,name);}finally{f.dispose();}}
});
