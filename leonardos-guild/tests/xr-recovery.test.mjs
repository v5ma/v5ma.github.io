import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createSpatialXR} from '../spatial-xr.mjs';
import {QUARTER_BOUNDS} from '../quarter-data.mjs';
import {quarterState} from '../quarter-core.mjs';
// Browser WebIDL attributes are inherited accessors, not object-spread fields.
const values=new WeakMap();
class Point {constructor(x,y,z,w=1){values.set(this,[x,y,z,w]);}get x(){return values.get(this)[0];}get y(){return values.get(this)[1];}get z(){return values.get(this)[2];}get w(){return values.get(this)[3];}}
for(const type of ['immersive-vr','immersive-ar'])test(`${type}: inherited WebXR position getters produce a finite visible eye transform`,async()=>{
 const scene=new T.Scene(),stage=new T.Group(),game=new T.Scene(),avatar=new T.Group();avatar.userData.guildControlled=true;avatar.position.set(-20,0,-13);game.add(avatar);scene.add(stage);
 const state={x:-20,z:-13,yaw:0,lift:0,mode:'foot',quarter:quarterState({active:true}),resonance:{aim:false}},original=JSON.stringify(state);
 const spatial=createSpatialXR({scene,stage,view:{scene:game,spatial:{bounds:QUARTER_BOUNDS,setPresentation(){},setSkipRender(){}},headBlocked:()=>false},getState:()=>state,release(){},openOptions(){}});
 const eye=new Point(.3,1.55,-.2),orientation=new Point(0,0,0,1);assert.deepEqual({...eye},{});
 await spatial.begin('first-person',{},null,type);spatial.poll({transform:{position:eye,orientation}}, {}, {});
 let drawn=false;spatial.draw({xr:{getCamera:()=>({cameras:[{},{}]})},render(){drawn=true;const p=avatar.parent.localToWorld(new T.Vector3(state.x,1.65,state.z));assert.ok(p.toArray().every(Number.isFinite),'Real DOMPoint getters must not turn the world matrix into NaN');assert.ok(p.distanceTo(new T.Vector3(eye.x,eye.y,eye.z))<1e-8);}},{});
 assert.ok(drawn);assert.equal(JSON.stringify(state),original);assert.equal(game.children[0],avatar);assert.equal(avatar.visible,true);
});

import {xrPosition,checkedEyeMatrix,guardFrame,createMenuAnchor,createDialogBridge} from '../xr-recovery.mjs';
test('Invalid tracked origins are explicit failures instead of successful blank frames',()=>{
 assert.throws(()=>xrPosition({x:NaN,y:1,z:0}),TypeError);assert.throws(()=>checkedEyeMatrix(new T.Matrix4().makeTranslation(NaN,0,0)),TypeError);
});
test('A failed UI frame returns to the loop and reports its error exactly once',()=>{
 let frames=0,errors=[];const wrapped=guardFrame(()=>{if(++frames===1)throw Error('dialog fault');},e=>errors.push(e.message));wrapped(0,{});wrapped(1,{});assert.equal(frames,2);assert.deepEqual(errors,['dialog fault']);
});
test('Opening a menu puts it in the current gaze, above scenery, and looking aside cannot drag it',()=>{
 const scene=new T.Scene(),stage=new T.Group(),panel=new T.Mesh(new T.PlaneGeometry(1.1,1.65),new T.MeshBasicMaterial());scene.add(stage);stage.add(panel);panel.position.set(1.61,1.6,-2.37);const home=panel.position.clone(),anchor=createMenuAnchor(panel,stage),root={};
 anchor.update(true,root,true,null);anchor.update(true,root,true,{transform:{position:new Point(0,1.6,0),orientation:new T.Quaternion()}});assert.equal(anchor.inspect().placements,1,'Missing initial tracking must not mark the menu already placed');
 for(const yaw of[0,.7,-2]){anchor.reset();const q=new T.Quaternion().setFromEuler(new T.Euler(-.25,yaw,.3,'YXZ')),eye=new Point(.3,1.6,.2),pose={transform:{position:eye,orientation:q}};anchor.update(true,root,true,pose);const position=panel.getWorldPosition(new T.Vector3()),view=position.clone().sub(new T.Vector3(eye.x,eye.y,eye.z)).normalize();assert.ok(view.distanceTo(new T.Vector3(0,0,-1).applyQuaternion(q))<1e-7);const normal=new T.Vector3(0,0,1).applyQuaternion(panel.getWorldQuaternion(new T.Quaternion()));assert.ok(normal.dot(view)<-.999);const before=anchor.inspect();anchor.update(true,root,true,{transform:{position:new Point(1,2,1),orientation:q}});assert.deepEqual(anchor.inspect().matrix,before.matrix);assert.equal(panel.material.depthTest,false);}
 anchor.update(false,null,false,null);assert.equal(panel.parent,stage);assert.ok(panel.position.equals(home));
});
test('XR dialogs keep existing handlers and open state without native modal capture; desktop is restored',()=>{
 let active=false;class Dialog {constructor(){this.open=false;this.isConnected=true;this.modal=false;this.returnValue='';}showModal(){this.open=true;this.modal=true;}show(){this.open=true;this.modal=false;}close(){this.open=false;}}
 const original=Dialog.prototype.showModal,env={HTMLDialogElement:Dialog,document:{querySelectorAll(){return [];}}},bridge=createDialogBridge(()=>active,env),a=new Dialog();a.showModal();assert.ok(a.modal);a.close();active=true;a.showModal();assert.ok(a.open);assert.equal(a.modal,false);a.showModal();assert.equal(bridge.inspect().bridged,1);active=false;bridge.restore();assert.ok(a.open&&a.modal);bridge.dispose();assert.equal(Dialog.prototype.showModal,original);
});
