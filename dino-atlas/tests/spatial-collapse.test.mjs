import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {SpatialConsole,consoleSettings} from '../spatial-console.js';
test('Closing Field immediately restores the compact slate, with no hidden click target gap',()=>{
 const c=Object.create(SpatialConsole.prototype);c.pose={x:1,y:1.15,z:-2,yaw:.4};c.cfg=consoleSettings();c.progress=1;c.trayOpen=true;c.expanded=true;c.dots=[];
 let clears=0,wrist=0;c.xr={active:true,invisible:false,ctx:{modal:()=>null},panel:new T.Group(),clear:()=>clears++};
 c.rotunda=new T.Group();c.column=new T.Group();c.dock={mesh:new T.Group()};c.placeWrist=()=>{wrist++;assert.equal(c.expanded,false);};
 c.hideField();assert.equal(c.trayOpen,false);assert.equal(c.expanded,false);assert.equal(c.xr.panel.visible,false);assert.equal(clears,1);assert.equal(wrist,1);
});
