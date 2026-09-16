import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {buildTidegate} from '../tidegate-world.js';
import {TidegateFleet} from '../tidegate-actors.js';
import {emptyDistrict,applyDistrict,sanitizeDistrict,stepHerd,herdClear} from '../tidegate-core.js';
import {FIELD_ROUTES,MAINTENANCE_DOOR,routeOpen,bridgeReadout} from '../tidegate-routes.js';
// Unit geometry fixtures, not browser playthroughs or physical-device evidence.
globalThis.document={createElement(){return {width:1024,height:256,getContext(){return new Proxy({measureText:t=>({width:t.length*18})},{get:(o,k)=>k in o?o[k]:()=>{}});}};}};
await initPhysics();
function setup(state=emptyDistrict()){
 const physics=new ParkPhysics(),scene=new T.Scene(),world=buildTidegate(scene,physics,state),fleet=new TidegateFleet(physics,world,state,()=>{});
 return {state,physics,world,fleet,time:0};
}
function tick(g,input={},n=1){for(let i=0;i<n;i++){g.time+=1/60;g.world.update(1/60,g.time,g.state,g.fleet.position,false);g.fleet.step(input,1/60,g.time,0);g.physics.world.step();g.fleet.after(1/60);}}
function walk(g,x,z){for(let i=0;i<2800;i++){const p=g.fleet.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.7){tick(g,{},4);return;}tick(g,{x:dx/d,z:-dz/d});}assert.fail(`Route blocked to ${x},${z}: ${JSON.stringify(g.fleet.position)}`);}
test('Sluice and machinery are connected through the narrow north door using actual walking',()=>{
 const g=setup();try{tick(g,{},60);for(const p of [[-34,43],[-25,43],[-25,15],[-48,-12],[-35,-22],[-35,-26],[-35,-30],[-35,-38],[-12,-36],[12,-36],[17,-36],[17,-20],[15,-8],[32,-8],[32,-4.5],[36,-4.5],[32,-8],[32,-4],[32,0],[32,8],[30,8]])walk(g,...p);
 assert.equal(g.state.gearbox,false,'Entering a new door never manufactures objective completion');assert.ok(g.fleet.position.y<2,'Ground-floor aisle, not roof teleport');
 }finally{g.physics.world.free();}
});
test('Every open map foot polyline fits real collision; closed crossings are not advertised as open',()=>{
 for(const route of FIELD_ROUTES.filter(r=>r.kind==='foot')){const state={...emptyDistrict(),gearbox:true,bridge:true,drained:true},g=setup(state);try{
  // Labeled per-segment geometry fixture. End-to-end evidence lives in the browser tour.
  g.fleet.person.setActive(true,{x:route.points[0][0],y:1.2,z:route.points[0][1]});tick(g,{},45);
  for(const p of route.points.slice(1))walk(g,...p);
 }finally{g.physics.world.free();}}
 const s=emptyDistrict();assert.equal(routeOpen(FIELD_ROUTES.find(r=>r.id==='lock-return'),s),false);assert.equal(routeOpen(FIELD_ROUTES.find(r=>r.id==='bridge-return'),s),false);
 assert.ok(FIELD_ROUTES.filter(r=>!r.condition).every(r=>routeOpen(r,s)));
});
test('Maintenance opening admits the ranger but the real jeep body cannot enter',()=>{
 const g=setup();try{tick(g,{},60);const v=g.fleet.vehicles.find(v=>v.type==='jeep');v.drive.reset({x:MAINTENANCE_DOOR.x,y:1.5,z:-9},0);g.fleet.person.setActive(false);g.fleet.active=v.id;tick(g,{throttle:1},300);assert.ok(v.drive.position.z<-2,'Vehicle must be stopped by the real door jambs');
 g.fleet.person.setActive(true,{x:32,y:1.2,z:-4});g.fleet.active='foot';walk(g,32,2);assert.ok(g.fleet.position.z>1.3);
 }finally{g.physics.world.free();}
});
test('Bridge readout agrees with every legal bridge attempt rather than a feeder or observed checkbox',()=>{
 for(const gearbox of [false,true])for(const feeder of [false,true])for(const observed of [false,true])for(const clear of [false,true])for(const boatClear of [false,true]){
 const state={...emptyDistrict(),gearbox,feeder,observed},animals=[{x:clear?48:22,z:24,radius:1.6}],boat={x:0,z:boatClear?38:24};
 const readout=bridgeReadout(state,animals,boat),result=applyDistrict({...state},'bridge',{animals,boat});assert.equal(readout.id==='clear',result.changed);
 }
});
test('Natural herd clearance recurs without requiring observation, feeder or tool expenditure',()=>{
 const s=emptyDistrict(),herd=Array.from({length:4},(_,index)=>({index,x:21+(index%2)*4,z:23+Math.floor(index/2)*4,phase:index*.7,angle:0,radius:1.6}));let transitions=0,last=false,maxWait=0,wait=0;
 for(let i=0;i<60*120;i++){for(const a of herd)stepHerd(a,1/60,i/60,s);const clear=herdClear(herd);if(clear&&!last)transitions++;last=clear;wait=clear?0:wait+1/60;maxWait=Math.max(maxWait,wait);}
 assert.ok(transitions>=3);assert.ok(maxWait<30);assert.equal(s.observed,false);assert.equal(s.feeder,false);
});
test('Refit retains v1 layout, inventory, flags and single report across old-save round trips',()=>{
 const old={...emptyDistrict(),gearbox:true,bridge:true,drained:true,observed:true,complete:true,reportCount:1,position:{x:33,y:1.1,z:10},ammo:[47,6],reserve:[208,17]};assert.deepEqual(sanitizeDistrict(JSON.parse(JSON.stringify(old))),old);
});
test('Historical open-ground checkpoint beside the maintenance wall is not occupied by new resupply geometry',()=>{
 // Explicit old-save fixture for collision compatibility, not a browser completion.
 const state={...emptyDistrict(),position:{x:35,y:1.2,z:-8.8}},g=setup(state);
 try{g.physics.world.step();const overlap=g.physics.world.intersectionWithShape(state.position,{x:0,y:0,z:0,w:1},g.fleet.person.collider.shape,undefined,undefined,g.fleet.person.collider);assert.ok(!overlap,'A new cabinet must not overlap a previously valid checkpoint');}
 finally{g.physics.world.free();}
});
