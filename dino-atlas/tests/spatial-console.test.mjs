import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {readFileSync} from 'node:fs';
import {consoleSettings,readConsole,saveConsole,summonPose,SPATIAL_KEY,SpatialConsole} from '../spatial-console.js';

test('Workspace validates height, distance and scale without serializing game state',()=>{
 assert.deepEqual(consoleSettings({height:Infinity,distance:NaN,scale:-9,wrist:false,active:true}),{version:1,height:1.15,distance:1.25,scale:.55,wrist:false});
 assert.equal(consoleSettings({height:99,distance:99,scale:99}).height,1.8);
 assert.equal(consoleSettings(null).height,1.15);
});
test('Workspace storage is isolated and corrupt or unavailable storage has usable defaults',()=>{
 const data=new Map([['dino-atlas.frontier.v2','old-save'],['dino-atlas.presentation.v1','old-portal']]);const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.ok(saveConsole(storage,{height:.8}));assert.equal(readConsole(storage).height,.8);assert.equal(data.size,3);assert.equal(data.get('dino-atlas.frontier.v2'),'old-save');assert.equal(data.get('dino-atlas.presentation.v1'),'old-portal');
 data.set(SPATIAL_KEY,'broken');assert.equal(readConsole(storage).height,1.15);assert.equal(saveConsole(null,{}),false);
});
test('Summoning uses horizontal placement and subsequent head motion cannot mutate captured pose',()=>{
 const head={x:2,y:1.2,z:3},p=summonPose(head,Math.PI/2,{height:.85,distance:1});assert.ok(Math.abs(p.x-1)<1e-9);assert.equal(p.y,.85);head.x=200;head.y=4;assert.equal(p.x,1);assert.equal(p.z,3);
});
function fixture(){
 const c=Object.create(SpatialConsole.prototype);c.pose={x:1,y:1.15,z:-2,yaw:.4};c.cfg=consoleSettings();c.progress=1;c.trayOpen=false;
 c.xr={active:true,invisible:false,ctx:{modal:()=>null},panel:new T.Mesh(new T.PlaneGeometry(1.45,1.45),new T.MeshBasicMaterial())};c.rotunda=new T.Group();c.column=new T.Group();c.dock={mesh:new T.Group()};return c;
}
test('Collapsed field panel is invisible and modal opens in same reference pose, not camera pose',()=>{
 const c=fixture();c.positionPanel();assert.equal(c.xr.panel.visible,false);assert.equal(c.dock.mesh.visible,true);
 c.xr.ctx.modal=()=>({id:'map-dialog'});c.positionPanel();assert.equal(c.xr.panel.visible,true);assert.equal(c.xr.panel.position.x,1);assert.equal(c.xr.panel.position.z,-2);assert.equal(c.dock.mesh.visible,false);
 const before=c.xr.panel.matrixWorld.clone();c.xr.ctx.camera={position:new T.Vector3(200,90,100)};c.positionPanel();assert.deepEqual(c.xr.panel.matrixWorld.elements,before.elements);
});
test('Explicit field tray enables hand controls but loss of session visibility hides it',()=>{
 const c=fixture();c.trayOpen=true;c.positionPanel();assert.equal(c.xr.panel.visible,true);c.xr.invisible=true;c.positionPanel();assert.equal(c.xr.panel.visible,false);
});
test('Changing workspace scale and height cannot change world or diorama transforms',()=>{
 const c=fixture();c.xr.stage=new T.Group();c.xr.stage.position.set(9,8,7);c.xr.anchor=new T.Vector3(3,2,1);c.cfg.scale=1.1;c.cfg.height=.65;c.positionPanel();assert.deepEqual(c.xr.anchor.toArray(),[3,2,1]);assert.deepEqual(c.xr.stage.position.toArray(),[9,8,7]);assert.equal(c.xr.panel.scale.x,1.1);
});
test('Shared renderer routes actual menu hit tests and post-draw placement through workspace',()=>{
 const a=readFileSync(new URL('../xr-reserve.js',import.meta.url),'utf8'),b=readFileSync(new URL('../diorama-xr.js',import.meta.url),'utf8');
 assert.match(a,/this.console=new SpatialConsole\(this\)/);assert.match(a,/this.console\.update\(dt,root\)/);assert.match(a,/this.console\?\.hit\(entry\)/);assert.match(b,/if\(this.console\)\{this.console.positionPanel\(\);return;\}/);
});
