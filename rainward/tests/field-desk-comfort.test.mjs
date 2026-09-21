import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from '../vendor/three.module.js';
import {createFieldDesk,deskOptions} from '../field-desk.mjs';
test('Reset restores only layout while preserving the player pedestal and motion choices',()=>{
 const rig=new T.Group(),panel=new T.Mesh(new T.PlaneGeometry(1.45,1.45),new T.MeshBasicMaterial());rig.add(panel);
 const desk=createFieldDesk(panel,rig,null);desk.place('pause',{position:new T.Vector3(0,1.65,0),orientation:new T.Quaternion()});
 for(const id of ['desk-pedestal','desk-motion','desk-larger','desk-raise'])desk.actions().find(a=>a.id===id).run();
 desk.actions().find(a=>a.id==='desk-reset').run();const options=desk.stats().options;
 assert.equal(options.pedestal,false);assert.equal(options.motion,true);assert.equal(options.height,deskOptions().height);assert.equal(options.scale,deskOptions().scale);
 desk.dispose();panel.geometry.dispose();panel.material.dispose();
});
