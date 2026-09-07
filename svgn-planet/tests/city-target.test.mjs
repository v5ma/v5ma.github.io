import {test} from 'node:test';import assert from 'node:assert/strict';
import {initial} from '../model.mjs';import * as C from '../city-model.mjs';import {street,tangent,distance} from '../world.mjs';import {coordinates} from '../city-world.mjs';
test('A moving taxi cannot repeatedly replace a selected stationary terminal and reset its dwell',()=>{
 const s=initial(),c=C.initialCity({active:true,stage:2});s.n=[.22519030922613154,.180353478338577,-.9574768652462657];s.north=tangent([0,0,-1],s.n);const taxi=c.vehicles[1];taxi.n=street(157.98,26.5);taxi.travelDirection=1;C.scan(s,c);
 for(let i=0;i<8&&C.selectedDevice(s,c)?.id!=='power';i++)C.cycleDevice(s,c);assert.equal(C.selectedDevice(s,c).id,'power');
 for(let i=0;i<80;i++){C.stepCity(s,c,{hack:true});if(c.scan>0)assert.equal(C.selectedDevice(s,c).id,'power');}
 assert.equal(c.power,true);assert.equal(c.events.filter(e=>e.type==='hack'&&e.id==='power').length,1);
});
test('Taxi turns only when leaving the shuttle segment, not on every frame outside one endpoint',()=>{
 const s=initial(),c=C.initialCity();const v=c.vehicles[1];v.n=street(158.05,26.5);v.travelDirection=1;for(let i=0;i<180;i++)C.stepCity(s,c,{});assert.ok(coordinates(v.n).t<149);assert.equal(v.travelDirection,-1);
});
test('Resetting the courier clears transient car/drone ownership while retaining city progression',()=>{
 const c=C.initialCity({active:true,stage:3,nitro:true,credits:20});c.car='press';c.drone.active=true;c.vehicles[0].speed=13;const reset=C.initialCity(C.citySave(c));assert.equal(reset.car,null);assert.equal(reset.drone.active,false);assert.ok(reset.vehicles.every(v=>v.speed===0));assert.equal(reset.stage,3);assert.equal(reset.nitro,true);assert.equal(reset.credits,20);
});
test('An unsupported garage operation cannot spend money and an inconsistent completed save is recoverable',()=>{
 const s=initial(),c=C.initialCity();s.n=C.CITY.garage.n;assert.equal(C.garageAction(s,c,'fake'),false);assert.equal(c.credits,80);const d=C.readCitySave(JSON.stringify({v:1,stage:5,completed:false}));assert.equal(d.stage,4);assert.equal(d.completed,false);
});
