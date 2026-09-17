// Isolated real-Rapier vehicle fixtures, NOT fabricated mission playthroughs.
import test from 'node:test';import assert from 'node:assert/strict';
import {initPhysics,ParkPhysics,RangerJeep} from '../ranger-physics.js';
import {FlightBoat} from '../frontier-vehicles.js';
await initPhysics();
function jeep(cruise){const p=new ParkPhysics(),v=new RangerJeep(p,{x:0,z:250});let maximum=0;try{for(let i=0;i<600;i++){v.drive({throttle:1,cruise},1/60);p.world.step();maximum=Math.max(maximum,Math.abs(v.speed));}return maximum;}finally{p.world.free();}}
test('Actual jeep reaches materially higher express speed with real wheel physics',()=>{const normal=jeep(1),fast=jeep(4);console.log({normal,fast});assert.ok(fast>normal*2.2);assert.ok(Number.isFinite(fast)&&fast<110);});
function helicopter(cruise){const p=new ParkPhysics(),v=new FlightBoat(p,{type:'helicopter',x:0,z:150,heading:0});v.reset({x:0,y:20,z:150},0);let max=0;try{for(let i=0;i<120;i++){v.drive({z:1,cameraYaw:0,cruise},1/60,i/60);p.world.step();max=Math.max(max,v.speed);}return max;}finally{p.world.free();}}
test('Actual helicopter express acceleration exceeds normal flight without scaling simulation time',()=>{const normal=helicopter(1),fast=helicopter(4);console.log({normal,fast});assert.ok(fast>normal*3.4);});
test('Fast jeep stops against a thin solid wall rather than skipping through it',()=>{
 const p=new ParkPhysics(),v=new RangerJeep(p,{x:0,z:80});p.box(0,10,0,35,10,.2);let minimum=80,contact=false;
 try{for(let i=0;i<360;i++){v.drive({throttle:1,cruise:8},1/60);p.world.step();minimum=Math.min(minimum,v.position.z);if(v.position.z<4)contact=true;assert.ok([v.position.x,v.position.y,v.position.z].every(Number.isFinite));}assert.ok(contact);assert.ok(minimum>0,'CCD must preserve the wall collision');}finally{p.world.free();}
});
import {DistrictCraft} from '../tidegate-actors.js';import {emptyDistrict} from '../tidegate-core.js';
function districtSpeed(type,cruise){const p=new ParkPhysics(),state=emptyDistrict(),v=new DistrictCraft(p,type,type==='boat'?{x:0,y:.85,z:-35}:{x:-50,y:12,z:0},state);let speed=0;
 try{for(let i=0;i<60;i++){v.drive(type==='boat'?{throttle:1,cruise}:{x:1,cruise},1/60);p.world.step();speed=Math.max(speed,v.speed);}return speed;}finally{p.world.free();}}
test('Tidegate boat and helicopter both receive sustained express acceleration in real physics fixtures',()=>{for(const type of ['boat','helicopter']){const normal=districtSpeed(type,1),fast=districtSpeed(type,4);console.log({type,normal,fast});assert.ok(fast>normal*3.3);}});

test('Express helicopter preserves thin-wall collision at the optional 8x setting',()=>{
 const p=new ParkPhysics(),v=new FlightBoat(p,{type:'helicopter',x:0,z:150,heading:0});v.reset({x:0,y:20,z:150},0);p.box(0,25,100,35,25,.2);let min=150,max=0;
 try{for(let i=0;i<300;i++){v.drive({z:1,cameraYaw:0,cruise:8},1/60,i/60);p.world.step();min=Math.min(min,v.position.z);max=Math.max(max,v.speed);}assert.ok(max>80);assert.ok(min>100&&min<104,'Actual collision must stop the craft, not skip the wall');}finally{p.world.free();}
});
