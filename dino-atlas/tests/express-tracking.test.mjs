import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {ReserveXR} from '../xr-reserve.js';
import {CruiseState} from '../active-controls.js';
import {EdgeGate} from '../xr-actions.js';
test('Temporary pose loss disarms express and requires button release even while source stays connected',()=>{
 const x=Object.create(ReserveXR.prototype),camera=new T.PerspectiveCamera();
 const source={handedness:'left',gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({value:0}))}};
 const ray=new T.Group();ray.visible=false;
 x.rig=new T.Group();x.rig.add(camera);x.originOffset=new T.Vector3();x.quaternion=new T.Quaternion();x.panel=new T.Group();x.rig.add(x.panel);
 x.active=true;x.context=null;x.paintClock=0;x.holds=new Map([[source,{tile:{}}]]);x.consumed=new Set([source]);x.gate=new EdgeGate();x.sources=new Map();
 x.ctx={camera,fleet:{mode:'helicopter',position:{x:0,y:10,z:0}},modal:()=>null,renderer:{xr:{isPresenting:false}},action:()=>{throw Error('No action expected during pose loss');}};
 const c=new CruiseState(4);c.toggle('helicopter');let toggles=0;
 x.travel={activeLayout:true,reset:()=>c.reset(),toggle:()=>{toggles++;c.toggle('helicopter');}};
 x.controllers=[{source,ray,line:new T.Group(),hand:new T.Group(),joints:{visible:true}}];x.session={inputSources:[source]};x.hit=()=>null;x.draw=()=>{};
 const old=globalThis.document;globalThis.document={hidden:false};
 try{
  source.gamepad.buttons[3].value=1;x.update(1/60);
  assert.equal(c.active,false);assert.equal(toggles,0);assert.equal(x.holds.size,0);assert.equal(x.consumed.size,0);assert.ok(x.gate.neutral.has(source));
  ray.visible=true;x.update(1/60);assert.equal(toggles,0);assert.equal(c.active,false);
  source.gamepad.buttons[3].value=0;x.update(1/60);assert.ok(!x.gate.neutral.has(source));
  source.gamepad.buttons[3].value=1;x.update(1/60);assert.equal(toggles,1);assert.equal(c.active,true);
 }finally{globalThis.document=old;}
});
