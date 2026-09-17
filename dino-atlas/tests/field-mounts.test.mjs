// Model/real-Rapier fixtures, not native controller acceptance or hardware tests.
import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';import R from '../vendor/rapier.mjs';
import {initPhysics,ParkPhysics,RangerJeep} from '../ranger-physics.js';
import {FieldOperations} from '../field-operations.js';
import {freshField,beginField,catalog,MOUNTS,saveField} from '../field-operations-core.js';
import {makeJeep} from '../ranger-art.js';import {makeBoat,makeHelicopter} from '../frontier-art.js';
import {FlightBoat} from '../frontier-vehicles.js';
import {buildTidegate} from '../tidegate-world.js';import {emptyDistrict} from '../tidegate-core.js';
import {buildPark} from '../ranger-world.js';import {buildFrontier} from '../frontier-world.js';import {emptyFrontier} from '../frontier-data.js';
globalThis.document={createElement(){return {width:1024,height:256,getContext(){return new Proxy({measureText:t=>({width:t.length*18})},{get:(o,k)=>k in o?o[k]:()=>{}});}};}};
await initPhysics();
function fixture(scene='tidegate',type='jeep',pos={x:-34,y:1.4,z:23}){
 const physics=new ParkPhysics(),drive=['jeep','buggy'].includes(type)?new RangerJeep(physics,{x:pos.x,z:pos.z}):new FlightBoat(physics,{type,x:pos.x,z:pos.z,heading:0});
 // Labeled actor fixture: tests physics/raycast integration only, not level travel.
 drive.reset(pos,0);const vehicle={id:type,type,drive,model:type==='boat'?makeBoat():type==='helicopter'?makeHelicopter():makeJeep()};
 const fleet={current:vehicle,vehicles:[vehicle],actor:drive,mode:type,get position(){return drive.position;}};
 const ops=Object.create(FieldOperations.prototype);ops.ctx={physics,fleet,sceneKey:scene,animals:[],input:{device:'gamepad',travel:{settings:{xboxLayout:'active'}}},modal:()=>null,notify:()=>{},tools:{tool:{id:'water'}}};
 Object.assign(ops,{s:freshField(),group:new T.Group(),rigs:new Map(),clock:0,entities:new Map(),entityCache:new Map(),entityKey:null,used:false,beamAge:1});
 ops.beam=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({transparent:true}));ops.group.add(ops.beam);ops.save=()=>{};ops.attach(vehicle);physics.world.step();return {ops,physics,drive};
}
function point(ops,target){const mount=ops.mountRay(ops.ctx.fleet.position,{x:0,y:0,z:1});const d=new T.Vector3(target.x,target.y,target.z).sub(mount.origin).normalize();return {yaw:Math.atan2(-d.x,-d.z),pitch:-Math.asin(d.y)};}
test('All four real vehicle models carry distinct visible paired barrels, survey mast and recovery basket without new collision',()=>{
 for(const type of Object.keys(MOUNTS)){const g=fixture('classic',type,{x:0,y:12,z:0});try{const count=g.physics.world.colliders.len();assert.equal(g.ops.rigs.size,1);const r=g.ops.rigs.get(type);assert.equal(r.root.parent,g.ops.ctx.fleet.current.model);assert.ok(r.turret.children.length>=4);assert.equal(r.cargo.visible,false);assert.equal(g.physics.world.colliders.len(),count);const ray=g.ops.mountRay(g.drive.position,{x:1,y:0,z:0});assert.ok(ray.origin.toArray().every(Number.isFinite));assert.equal(ray.direction.length(),1);}finally{g.physics.world.free();}}
});
test('Production scanner requires clear physical sight and uninterrupted dwell before water stage',()=>{
 const g=fixture();try{const o=g.ops;beginField(o.s,'tidegate','tidegate-cooling');o.s.selection.jeep='scanner';const t=o.active.phase.targets[0],aim=point(o,t);const wall=g.physics.box(-30,3,23,.15,4,12);g.physics.world.step();
 for(let i=0;i<180;i++)o.fireSpecial(aim.yaw,aim.pitch,null);assert.equal(o.active.record.stage,0);assert.deepEqual(o.active.record.units,{});
 g.physics.world.removeRigidBody(wall);g.physics.world.step();for(let i=0;i<60;i++)o.fireSpecial(aim.yaw,aim.pitch,null);assert.ok(o.active.record.units[t.id]>.5);o.used=false;o.tick(1/60);assert.deepEqual(o.active.record.units,{});
 for(let i=0;i<125;i++)o.fireSpecial(aim.yaw,aim.pitch,null);assert.equal(o.active.phase.verb,'water');
 }finally{g.physics.world.free();}
});
test('Friendly crew reject offensive-tool credit; scanning and hoisting attach cargo to the actual boat',()=>{
 const g=fixture('tidegate','boat',{x:6,y:.8,z:39});try{const o=g.ops;beginField(o.s,'tidegate','tidegate-boat-rescue');o.ensureEntities();const t=o.active.phase.targets[0],aim=point(o,t),ray=o.makeRay(aim.yaw,aim.pitch,null);
 for(let i=0;i<100;i++)o.toolHit('zapper',ray.origin,ray.direction,20);assert.equal(o.active.record.stage,0);assert.deepEqual(o.active.record.units,{});
 o.s.selection.boat='scanner';for(let i=0;i<125;i++)o.fireSpecial(aim.yaw,aim.pitch,null);assert.equal(o.active.phase.verb,'rescue');
 o.s.selection.boat='rescue';for(let i=0;i<185;i++)o.fireSpecial(aim.yaw,aim.pitch,null);assert.equal(o.active.phase.verb,'deliver');assert.deepEqual(o.active.record.cargo,{id:t.id,carrier:'boat'});o.tick(1/60);assert.equal(o.rigs.get('boat').cargo.visible,true);assert.equal(o.entities.get(t.id).model.visible,false);
 o.s.active=null;o.tick(1/60);assert.equal(o.rigs.get('boat').cargo.visible,true);
 }finally{g.physics.world.free();}
});
test('A connected helicopter moving vertically cannot complete a stable scanner or rescue hold',()=>{
 const g=fixture('tidegate','helicopter',{x:46,y:15,z:18});try{const o=g.ops;beginField(o.s,'tidegate','tidegate-roof-rescue');o.s.selection.helicopter='scanner';g.drive.body.setLinvel({x:0,y:10,z:0},true);const aim=point(o,o.active.phase.targets[0]);for(let i=0;i<200;i++)o.fireSpecial(aim.yaw,aim.pitch,null);assert.equal(o.active.record.stage,0);assert.deepEqual(o.active.record.units,{});}finally{g.physics.world.free();}
});
test('Mounted first-person XR uses pointer aim but originates at vehicle equipment, not a hand across a wall',()=>{
 const g=fixture();try{const o=g.ops,target={x:-20,y:1.2,z:23},dir=new T.Vector3(1,0,0),pointer={origin:new T.Vector3(-22,1.2,23),direction:dir};const xr={active:true,diorama:false,aimRay:pointer,aimFrom:()=>pointer};const ray=o.aim(g.drive.position,dir,xr);assert.ok(ray.origin.distanceTo(pointer.origin)>5);const wall=g.physics.box(-30,3,23,.15,4,12);g.physics.world.step();const hit=g.physics.world.castRay(new R.Ray(ray.origin,ray.direction),40,true,undefined,undefined,g.drive.collider,g.drive.body);assert.ok(hit&&hit.timeOfImpact<10);assert.notEqual(ray.origin,pointer.origin);}finally{g.physics.world.free();}
});
test('Familiar two-tool cycling remains available; the Active vehicle profile exposes all four attachments',()=>{
 const g=fixture();try{const o=g.ops;o.ctx.input.travel.settings.xboxLayout='legacy';assert.equal(o.extendedCycle,false);o.ctx.input.travel.settings.xboxLayout='active';assert.equal(o.extendedCycle,true);o.ctx.input.travel.settings.xboxLayout='legacy';o.s.selection.jeep='scanner';assert.equal(o.extendedCycle,true);}finally{g.physics.world.free();}
});
test('New task props are not embedded in original solid walls in either authored world',()=>{
 for(const scene of ['classic','tidegate']){const physics=new ParkPhysics(),s=new T.Scene();try{if(scene==='tidegate')buildTidegate(s,physics,emptyDistrict());else{buildPark(s,physics);buildFrontier(s,physics,emptyFrontier());}physics.world.step();const targets=[...new Map(catalog(scene).flatMap(m=>m.stages.flatMap(p=>p.targets)).map(t=>[t.id,t])).values()];for(const t of targets){if(['animal','desk','watch'].includes(t.kind))continue;const overlap=physics.world.intersectionWithShape({x:t.x,y:t.y,z:t.z},{x:0,y:0,z:0,w:1},new R.Ball(.32));assert.equal(!!overlap,false,scene+' '+t.id+' occupies a historical solid');}}finally{physics.world.free();}}
});
