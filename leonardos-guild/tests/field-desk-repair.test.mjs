/* Scene-graph fixtures, not browser or physical-headset evidence. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createFieldDesk} from '../xr-field-desk.mjs';
import {createCampaignState} from '../campaign-entry.mjs';
import {saveData} from '../model.mjs';

function fixture(height=1.2,reference='local-floor'){
 const saved=new Map(['document','localStorage'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const text=[];const context=new Proxy({fillText(value){text.push(value);},measureText(value){return {width:String(value).length*16};}},{get:(target,key)=>target[key]||(()=>{})});
 globalThis.document={createElement:()=>({getContext:()=>context}),getElementById:()=>null};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 const scene=new T.Scene(),stage=new T.Group();scene.add(stage);stage.position.set(2,height-1.6,4);
 const panel=new T.Mesh(new T.PlaneGeometry(1.1,1.65),new T.MeshBasicMaterial());stage.add(panel);
 const state=createCampaignState(),desk=createFieldDesk({panel,stage,getState:()=>state,getObjective:()=>({title:'Deliver the plans',hint:'Vinci'}),back(){}});
 const pose={transform:{position:{x:2,y:height,z:4},orientation:new T.Quaternion()}};
 desk.tick(0,null,reference);desk.update(true,null,false,pose);desk.modify('status');desk.tick(200,null,reference);
 return {desk,scene,state,pose,text,restore(){for(const [key,descriptor]of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}};
}
for(const height of [.9,1.2,1.9])test(`Floor HUD uses the actual local-floor origin at eye height ${height}`,()=>{
 const f=fixture(height);try{const hud=f.scene.getObjectByName('Compact tool and objective status');assert.equal(hud.visible,true);assert.ok(Math.abs(hud.position.y-.25)<1e-9,`HUD should be 0.25 m above the floor, not ${hud.position.y}`);}finally{f.restore();}
});
test('Local fallback uses its explicitly estimated floor, with no game-state or save mutation',()=>{
 const f=fixture(1.2,'local');try{const before=JSON.stringify(saveData(f.state));const hud=f.scene.getObjectByName('Compact tool and objective status');assert.ok(Math.abs(hud.position.y-(-.4+.25))<1e-9);f.desk.modify('raise');f.desk.modify('larger');f.desk.tick(400,null,'local');assert.equal(JSON.stringify(saveData(f.state)),before);}finally{f.restore();}
});
test('Floor HUD remains stationary when the player looks away or moves their head',()=>{
 const f=fixture();try{const hud=f.scene.getObjectByName('Compact tool and objective status'),before=hud.matrixWorld.toArray();f.pose.transform.position.x+=.7;f.pose.transform.orientation.setFromEuler(new T.Euler(.4,.8,.3));f.desk.update(true,null,false,f.pose);f.desk.tick(400,null,'local-floor');assert.deepEqual(hud.matrixWorld.toArray(),before);}finally{f.restore();}
});
