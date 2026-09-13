import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {emptyAquatics,sanitizeAquatics,beginAquatics,advanceAquatics,tickAquatics,readAquatics,saveAquatics,shallowSafe,actionAtAquatics,LAB,POINTS,AQUA_HARBOR,ROUTE,HOME_DOCK,insideLab,movementInLab} from '../aquatics-data.js';
import {AquaticsWorld} from '../aquatics-world.js';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {Fleet} from '../frontier-vehicles.js';
import {emptyFrontier,isWater} from '../frontier-data.js';
await initPhysics();
test('six-stage water mission enforces circuit, isolation, drainage, both cases and delivery order',()=>{
 const s=emptyAquatics();assert.ok(beginAquatics(s));assert.equal(advanceAquatics(s,'pump'),false);assert.equal(advanceAquatics(s,'deliver'),false);
 assert.ok(advanceAquatics(s,'arrive'));assert.ok(advanceAquatics(s,'breaker'));assert.equal(advanceAquatics(s,'pump'),false);assert.ok(advanceAquatics(s,'isolate'));assert.ok(advanceAquatics(s,'pump'));
 for(let i=0;i<500;i++)tickAquatics(s,1/60);
 assert.equal(s.stage,4);assert.ok(shallowSafe(s));assert.ok(advanceAquatics(s,'sample'));assert.equal(s.stage,4);assert.ok(advanceAquatics(s,'archive'));assert.equal(s.stage,5);assert.ok(advanceAquatics(s,'deliver'));assert.equal(s.stage,6);assert.equal(beginAquatics(s),false);assert.equal(advanceAquatics(s,'deliver'),false);
});
test('pause, suspension and Reduced Motion separation: water moves only on live simulation time',()=>{
 const s=emptyAquatics();s.active=true;s.breaker=true;s.intakeClosed=true;s.pumping=true;s.stage=3;
 tickAquatics(s,0);assert.equal(s.water,LAB.high);tickAquatics(s,.1);assert.ok(s.water<LAB.high);const level=s.water;s.active=false;tickAquatics(s,.1);assert.equal(s.water,level);
});
test('save isolation and interrupted drain recovery retain every old record',()=>{
 const map=new Map([['dino-atlas.progress.v1','journal'],['dino-atlas.frontier.v2','fleet'],['dino-atlas.optics.v1','shaders']]);const store={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 const s=emptyAquatics();s.active=true;s.stage=3;s.breaker=true;s.intakeClosed=true;s.pumping=true;for(let i=0;i<100;i++)tickAquatics(s,1/60);saveAquatics(store,s);const copy=readAquatics(store);assert.equal(copy.water,s.water);assert.equal(copy.pumping,true);assert.equal(map.get('dino-atlas.frontier.v2'),'fleet');assert.equal(map.get('dino-atlas.progress.v1'),'journal');assert.equal(map.get('dino-atlas.optics.v1'),'shaders');assert.equal(saveAquatics(null,s),false);
});
test('invalid stage, depth and flags cannot introduce nonfinite motion or unsupported replay rewards',()=>{
 const s=sanitizeAquatics({version:1,stage:99,water:NaN,active:'yes',breaker:false,intakeClosed:true,pumping:true,rewarded:true});assert.equal(s.stage,0);assert.equal(s.water,LAB.high);assert.equal(s.active,false);assert.equal(s.intakeClosed,false);assert.equal(s.pumping,false);assert.equal(s.rewarded,false);
});
test('tools and supplies stay separate: interaction needs correct vehicle, proximity and height',()=>{
 const s=emptyAquatics();s.active=true;s.stage=1;assert.equal(actionAtAquatics(s,POINTS.breaker,'jeep'),null);assert.equal(actionAtAquatics(s,POINTS.breaker,'foot'),'breaker');assert.equal(actionAtAquatics(s,{...POINTS.breaker,y:20},'foot'),null);s.stage=4;s.water=LAB.low;assert.equal(actionAtAquatics(s,POINTS.archive,'foot'),'archive');assert.equal(actionAtAquatics(s,POINTS.archive,'foot',5),null);
});
test('wading modifies only the basin and archive floor, not any old terrain or vehicle physics',()=>{
 const s=emptyAquatics();s.water=LAB.low;assert.equal(movementInLab(s,{x:LAB.x-7,y:1.1,z:0}).scale,.58);assert.equal(movementInLab(s,{x:LAB.x-20,y:3.7,z:0}).scale,1);assert.equal(movementInLab(s,{x:0,y:1,z:0}).scale,1);s.water=LAB.high;assert.ok(movementInLab(s,{x:LAB.x-7,y:1.1,z:0}).deep);assert.ok(!insideLab({x:0,y:1,z:51}));
});
test('new mooring is wet and the ranger landing is dry',()=>{assert.ok(isWater(AQUA_HARBOR.boat.x,AQUA_HARBOR.boat.z,-3));assert.ok(!isWater(AQUA_HARBOR.land.x,AQUA_HARBOR.land.z,1.4));});
function setup(){const prev=globalThis.document;globalThis.document={createElement:()=>({width:1024,height:100,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};const p=new ParkPhysics(),s=emptyAquatics(),f=new Fleet(p,emptyFrontier()),w=new AquaticsWorld(new T.Scene(),p);f.extraHarbors=[AQUA_HARBOR];return {p,s,f,w,close(){p.world.free();globalThis.document=prev;}};}
function move(f,p,w,s,controls,n){for(let i=0;i<n;i++){f.drive(controls,1/60,i/60,0);p.world.step();f.afterStep(1/60);w.update(s,1/60,f.position,{reduced:true});}}
function go(f,p,w,s,x,z,goal){let ok=false;for(let i=0;i<1400;i++){move(f,p,w,s,{x,z},1);if(goal(f.position)){ok=true;break;}}assert.ok(ok,JSON.stringify(f.position));}
test('all pool tasks are connected by real entry stairs, deck, descent and archive door',()=>{
 const t=setup(),{p,s,f,w}=t;try{
 f.active='foot';f.person.setActive(true,{x:AQUA_HARBOR.land.x,y:1.6,z:20});
 go(f,p,w,s,1,0,q=>q.x> -395);assert.ok(f.position.y>3.5,'climbs real exterior stairs');
 go(f,p,w,s,0,1,q=>q.z< -20);assert.ok(f.position.y>3.5,'walks dry west deck to pump');
 s.water=LAB.low;w.update(s,0,f.position,{reduced:true});
 go(f,p,w,s,0,-1,q=>q.z>20);go(f,p,w,s,1,0,q=>q.x> -388.5);go(f,p,w,s,0,1,q=>q.z< -6);assert.ok(f.position.y<1.4,'descends pool steps');
 go(f,p,w,s,1,0,q=>q.x> -363.5);go(f,p,w,s,0,1,q=>q.z< -9.4);assert.ok(Math.hypot(f.position.x-POINTS.archive.x,f.position.z-POINTS.archive.z)<3,'archive reached on foot');
 go(f,p,w,s,1,0,q=>q.x> -359.3);go(f,p,w,s,0,-1,q=>q.z>4.6);assert.ok(Math.hypot(f.position.x-POINTS.sample.x,f.position.z-POINTS.sample.z)<3,'both cases reachable');
 // Return via exactly the same doorway and stairs, without a recovery teleport.
 go(f,p,w,s,0,1,q=>q.z< -6);go(f,p,w,s,-1,0,q=>q.x< -388);go(f,p,w,s,0,-1,q=>q.z>20);assert.ok(f.position.y>3.5,'steps lead back to deck');
 go(f,p,w,s,-1,0,q=>q.x< -409);assert.ok(f.position.y<2,'pier reachable again');
 }finally{t.close();}
});
test('a deep pool has a physical locked access gate and lowering the water opens it',()=>{const t=setup(),{p,s,f,w}=t;try{f.active='foot';f.person.setActive(true,{x:LAB.x-12,y:3.7,z:21});move(f,p,w,s,{z:1},180);assert.ok(f.position.z>18,'deep gate stops movement');s.water=LAB.low;move(f,p,w,s,{z:1},180);assert.ok(f.position.z<13,'low gate permits descent');}finally{t.close();}});
test('new harbor permits actual Y-style disembark/reboard without moving or cloning other vehicles',()=>{const t=setup(),{p,s,f,w}=t;try{f.active='boat';f.current.drive.reset({...AQUA_HARBOR.boat,y:.78});move(f,p,w,s,{},100);assert.ok(f.board());assert.equal(f.mode,'foot');assert.ok(f.board());assert.equal(f.mode,'boat');assert.equal(f.vehicles.length,4);}finally{t.close();}});
test('full boat approach and return path are reachable using the existing real boat physics',()=>{
 const p=new ParkPhysics(),f=new Fleet(p,emptyFrontier());f.active='boat';f.current.drive.reset({...HOME_DOCK.boat,y:.78},-Math.PI/2);
 try{for(const target of [...ROUTE,...ROUTE.slice(0,-1).reverse(),HOME_DOCK.boat]){let ok=false;for(let i=0;i<6500;i++){const pos=f.position,h=Math.atan2(target.x-pos.x,target.z-pos.z),d=Math.atan2(Math.sin(h-f.actor.heading),Math.cos(h-f.actor.heading));f.drive({throttle:Math.abs(d)>1? .35:1,steer:Math.max(-1,Math.min(1,d*2))},1/60,i/60,0);p.world.step();f.afterStep(1/60);if(Math.hypot(f.position.x-target.x,f.position.z-target.z)<13){ok=true;break;}}assert.ok(ok,'reachable boat waypoint '+JSON.stringify(target)+' from '+JSON.stringify(f.position));}}
 finally{p.world.free();}
});
