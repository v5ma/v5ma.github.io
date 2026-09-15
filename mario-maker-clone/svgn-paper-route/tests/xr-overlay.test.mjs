import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.webgpu.js';
import {addOverlay,PANEL_ORDER,POINTER_ORDER} from '../xr-overlay.mjs';
function mesh(){return new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicNodeMaterial());}
test('XR UI sorts after transparent scenery with opaque pixels and no fog or depth interference',()=>{const parent=new T.Group(),ui=mesh(),layer=addOverlay(T,parent,ui);assert.equal(ui.parent,layer);assert.equal(layer.parent,parent);assert.equal(layer.renderOrder,PANEL_ORDER);assert.equal(ui.material.transparent,true);assert.equal(ui.material.opacity,1);for(const k of ['depthTest','depthWrite','fog','toneMapped'])assert.equal(ui.material[k],false);assert.equal(ui.frustumCulled,false);assert.ok(layer.renderOrder>5100);});
test('XR pointing cursor sorts after the panel and keeps world transforms',()=>{const parent=new T.Group(),dot=mesh();parent.position.set(2,3,4);dot.position.set(.2,.3,.4);const layer=addOverlay(T,parent,dot,POINTER_ORDER);parent.updateMatrixWorld(true);assert.ok(layer.renderOrder>PANEL_ORDER);const position=new T.Vector3();dot.getWorldPosition(position);assert.ok(position.distanceTo(new T.Vector3(2.2,3.3,4.4))<1e-12);});
test('Overlay ownership rejects invalid objects before scene mutation',()=>{const parent=new T.Group();assert.throws(()=>addOverlay(T,parent,{},NaN),TypeError);assert.equal(parent.children.length,0);});
