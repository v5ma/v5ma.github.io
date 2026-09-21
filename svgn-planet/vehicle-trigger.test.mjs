import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONSOLE_DEFAULTS as D,CONSOLE_KEY,parseConsolePrefs,loadConsolePrefs,saveConsolePrefs,triggerVehicleSpeed} from './console-state.mjs';
import {vehicleDriveHand,vehicleTriggerSignal,vehicleControlCaption} from './vehicle-trigger.mjs';

test('Legacy console preferences keep the existing primary trigger without rewriting storage',()=>{
 const old={...D};delete old.driveHand;let writes=0;const raw=JSON.stringify(old),r=loadConsolePrefs({getItem:()=>raw,setItem(){writes++;}});
 assert.equal(r.prefs.driveHand,'primary');assert.equal(r.blocked,false);assert.equal(writes,0);assert.deepEqual(old,JSON.parse(raw));
});
test('Physical trigger choices do not silently swap with dominant-hand preferences',()=>{
 for(const dominant of ['left','right']){assert.equal(vehicleDriveHand('left',dominant),'left');assert.equal(vehicleDriveHand('right',dominant),'right');assert.equal(vehicleDriveHand('primary',dominant),dominant);}
});
test('Chosen physical trigger drives and opposite trigger brakes, in either source order',()=>{
 for(const choice of ['left','right'])for(const dominant of ['left','right'])for(const hands of [['left','right'],['right','left']]){
  const other=choice==='left'?'right':'left';
  let result={boost:false,brake:false};for(const hand of hands){const v=vehicleTriggerSignal(choice,dominant,hand,hand===choice);result.boost||=v.boost;result.brake||=v.brake;}
  assert.deepEqual(result,{boost:true,brake:false});assert.deepEqual(vehicleTriggerSignal(choice,dominant,other,true),{boost:false,brake:true});
  assert.deepEqual(vehicleTriggerSignal(choice,dominant,choice,false),{boost:false,brake:false});
 }
});
test('Existing primary profile keeps its old off-trigger behavior',()=>{
 assert.deepEqual(vehicleTriggerSignal('primary','right','left',true),{boost:false,brake:false});assert.deepEqual(vehicleTriggerSignal('primary','left','left',true),{boost:true,brake:false});
});
test('Unknown hands cannot drive and invalid preferences are rejected, not overwritten',()=>{
 assert.deepEqual(vehicleTriggerSignal('left','right','none',true),{boost:false,brake:false});assert.throws(()=>vehicleDriveHand('feet'));assert.throws(()=>parseConsolePrefs({...D,driveHand:'feet'}));
 let writes=0;assert.equal(loadConsolePrefs({getItem:()=>JSON.stringify({...D,driveHand:'feet'}),setItem:()=>writes++}).blocked,true);assert.equal(writes,0);
});
test('A chosen trigger is saved independently of all original and competing preference keys',()=>{
 const keys=['svgn.paper-delivery-3d.v1','svgn.lantern-ward.v1','svgn.signal-city.v1','svgn.neighborhood-field-desk.v1'];const data=new Map(keys.map(k=>[k,'leave-exactly-this'])),store={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.ok(saveConsolePrefs(store,{...D,driveHand:'left'}));assert.equal(loadConsolePrefs(store).prefs.driveHand,'left');for(const k of keys)assert.equal(data.get(k),'leave-exactly-this');assert.equal(data.size,keys.length+1);assert.ok(data.has(CONSOLE_KEY));
});
test('On-foot, disabled vehicle speed, and Courier labels keep their original meaning',()=>{
 assert.equal(triggerVehicleSpeed({ride:'foot'}),false);assert.equal(triggerVehicleSpeed({ride:false}),false);assert.equal(triggerVehicleSpeed({ride:true},false),false);
 assert.equal(vehicleControlCaption({...D,driveHand:'left'},'action','right',false),'Primary grip: interact / trigger: action');
 assert.equal(vehicleControlCaption({...D,driveHand:'left'},'courier','right',true),'Off trigger: speed / primary grip: throw');
 assert.match(vehicleControlCaption({...D,triggerDrive:false},'action','right',true),/stick click/);
 assert.match(vehicleControlCaption({...D,driveHand:'left'},'action','left',true),/LT speed \/ RT brake/);
});
