import test from 'node:test';import assert from 'node:assert/strict';
import {activeTrackedMotion,activeXboxMotion,CruiseState,cruiseFactor,normalizedStick,readTravel,writeTravel,TRAVEL_KEY,navigationBearing} from '../active-controls.js';
import {trackedMotion,mergeMotion} from '../xr-actions.js';
const source=handedness=>({handedness,gamepad:{mapping:'xr-standard',axes:[0,0,0,0],buttons:Array.from({length:6},()=>({value:0,pressed:false}))}});
test('Active Quest triggers aim and fire without driving or changing helicopter height in every mode',()=>{
 for(const mode of ['foot','jeep','buggy','boat','helicopter']){const l=source('left'),r=source('right');l.gamepad.buttons[0].value=r.gamepad.buttons[0].value=1;const v=activeTrackedMotion([l,r],mode);assert.equal(v.aim,true);assert.equal(v.fire,true);assert.equal(v.throttle,0);assert.equal(v.climb,0);assert.equal(v.jump,false);}
});
test('Active Quest grips cannot jump, fire, accelerate or change height',()=>{
 for(const mode of ['foot','jeep','boat','helicopter']){const l=source('left'),r=source('right');l.gamepad.buttons[1].value=r.gamepad.buttons[1].value=1;const v=activeTrackedMotion([l,r],mode);for(const k of ['fire','aim','jump','brake'])assert.equal(v[k],false);assert.equal(v.throttle,0);assert.equal(v.climb,0);}
});
test('Active vehicle locomotion stays independent from firing, with helicopter vertical stick and A brake',()=>{
 const l=source('left'),r=source('right');l.gamepad.axes[3]=-1;r.gamepad.axes[3]=-1;l.gamepad.buttons[0].value=r.gamepad.buttons[0].value=1;
 let v=activeTrackedMotion([l,r],'boat');assert.equal(v.throttle,1);assert.ok(v.aim&&v.fire&&v.independentTools);
 v=activeTrackedMotion([l,r],'helicopter');assert.equal(v.climb,1);assert.equal(v.z,1);r.gamepad.buttons[4].value=1;assert.equal(activeTrackedMotion([l,r],'helicopter').brake,true);assert.equal(activeTrackedMotion([l,r],'foot').jump,true);
 assert.equal(mergeMotion({x:0,z:0},v).independentTools,true);
});
test('Blocked tracked pointers and hands cannot leak tool inputs',()=>{
 const l=source('left'),r=source('right');r.gamepad.buttons[0].value=1;l.gamepad.axes[3]=-1;assert.equal(activeTrackedMotion([l,r],'jeep',new Set([r])).fire,false);assert.equal(activeTrackedMotion([l,r],'jeep',new Set([l])).throttle,0);r.hand=new Map();assert.equal(activeTrackedMotion([r]).fire,false);
});
test('Legacy XR motion contract is still available without migration',()=>{const r=source('right');r.gamepad.buttons[0].value=1;assert.equal(trackedMotion([r],'helicopter').climb,1);assert.equal(trackedMotion([r],'helicopter').fire,false);});
test('Express toggle remains enabled for 60 minutes without depletion; brake, modal and vehicle changes cancel it',()=>{
 const c=new CruiseState(4);assert.equal(c.toggle('helicopter'),true);
 for(let seconds=0;seconds<3601;seconds++)assert.equal(c.apply({},'helicopter').cruise,4);
 assert.equal(c.apply({brake:true},'helicopter').cruise,1);assert.equal(c.toggle('helicopter'),true);assert.equal(c.apply({},'helicopter',true).cruise,1);c.toggle('boat');assert.equal(c.apply({},'foot').cruise,1);assert.equal(c.toggle('foot'),false);
 c.toggle('jeep');assert.equal(c.apply({},'boat').cruise,1);c.toggle('boat');c.reset();assert.equal(c.active,false);
});
test('Travel settings use only the new key, validate unsafe values and never persist armed speed',()=>{
 const old='unchanged-sentinel',data=new Map([['dino-atlas.presentation.v1',old],['dino-atlas.tidegate.v1',old],['dino-atlas.grounded-controls.v1',old]]),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.equal(readTravel(storage).xrLayout,'active');assert.equal(readTravel(storage).xboxLayout,'legacy');assert.ok(writeTravel(storage,{multiplier:Infinity,active:true,xrLayout:'legacy',xboxLayout:'active'}));const restored=readTravel(storage);assert.equal(restored.multiplier,4);assert.equal(restored.xrLayout,'legacy');assert.equal(restored.xboxLayout,'active');assert.equal(restored.active,undefined);for(const [k,v] of data)if(k!==TRAVEL_KEY)assert.equal(v,old);
 assert.equal(readTravel({getItem:()=>'{'}).multiplier,4);assert.equal(writeTravel(null,{}),false);
});
test('Xbox active triggers do not pilot, its stick drives, and D-pad controls altitude',()=>{
 const p={axes:[0,-1,0,0],buttons:Array.from({length:17},()=>({value:0}))};p.buttons[6].value=p.buttons[7].value=1;
 const v=activeXboxMotion(p,'boat');assert.equal(v.throttle,1);assert.ok(v.aim&&v.fire);p.axes[1]=0;p.buttons[12].value=1;assert.equal(activeXboxMotion(p,'helicopter').climb,1);assert.equal(activeXboxMotion(p,'helicopter').throttle,0);
});
test('Speed multipliers are finite and diagonals are normalized',()=>{for(const n of [Infinity,NaN,-2,100,0])assert.equal(cruiseFactor({cruise:n}),1);assert.equal(cruiseFactor({cruise:8}),8);const s=normalizedStick(1,1);assert.ok(Math.abs(Math.hypot(s.x,s.z)-1)<1e-12);});
test('Destination bearing handles all compass directions and height without inventing path reachability',()=>{
 const p={x:0,y:1,z:0};assert.equal(navigationBearing(p,{x:0,z:-10}).compass,'N');assert.equal(navigationBearing(p,{x:10,z:0}).compass,'E');assert.equal(navigationBearing(p,{x:0,z:10}).compass,'S');assert.equal(navigationBearing(p,{x:-10,z:0}).compass,'W');assert.ok(Math.abs(navigationBearing(p,{x:-10,z:0},Math.PI/2).relative)<1e-10);assert.equal(navigationBearing(p,{x:0,y:10,z:0}).height,9);assert.equal(navigationBearing(p,null),null);
});
test('Unconnected XR cannot override Xbox tool semantics and the active foot layout retains running',()=>{assert.equal(activeTrackedMotion([]).independentTools,false);const l=source('left');l.gamepad.buttons[3].value=1;assert.equal(activeTrackedMotion([l],'foot').boost,true);assert.equal(activeTrackedMotion([l],'helicopter').boost,false);});
