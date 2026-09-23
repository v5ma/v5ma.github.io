// Production-physics route fixture, not a physical-device or native browser test.
import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {buildPark} from '../ranger-world.js';import {buildFrontier} from '../frontier-world-expanded.js';
import {buildRanchWorld} from '../ranch-world.js';import {readFrontier} from '../frontier-data.js';
import {Fleet} from '../frontier-vehicles.js';import {padMotion} from '../ranger-input.js';
import {firstLightRoute,TRAIL_NODES,TRAIL_EDGES} from '../first-light-route.js';
globalThis.document={createElement(){return {width:1024,height:256,getContext(){return new Proxy({measureText:t=>({width:t.length*18})},{get:(o,k)=>k in o?o[k]:()=>{}});}};}};
globalThis.window={dispatchEvent:()=>{}};await initPhysics();
function world(){const physics=new ParkPhysics(),scene=new T.Scene(),park=buildPark(scene,physics),state=readFrontier(null),fleet=new Fleet(physics,state);buildFrontier(scene,physics,state);buildRanchWorld(scene,physics);let time=0;
 const step=(v={})=>{time+=1/60;fleet.drive(v,1/60,time,0);physics.world.step();fleet.afterStep(1/60);};
 const walk=p=>{for(let i=0;i<1800;i++){const a=fleet.position,dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz);if(d<.45){for(let j=0;j<8;j++)step();return;}step(padMotion({axes:[dx/d,dz/d,0,0],buttons:[]},'foot'));}assert.fail('Blocked suggested trail '+JSON.stringify({goal:p,position:fleet.position}));};
 return {physics,park,fleet,step,walk};}
test('Generated First Light trails are physically walkable from the actual bay through all chapter destinations and back',()=>{
 const {physics,park,fleet,step,walk}=world();try{
 for(let i=0;i<120;i++)step();assert.equal(fleet.board(),true);
 for(let stage=0;stage<7;stage++){
  if(stage===5){park.setPowered(true);physics.world.step();}
  const route=firstLightRoute(stage,fleet.position);assert.ok(['trail','at-goal'].includes(route.mode),'join '+stage+' '+JSON.stringify(route));
  for(const point of route.points)walk(point);
  const again=firstLightRoute(stage,fleet.position);assert.equal(again.mode,'at-goal');
 }
 }finally{physics.world.free();}
});
test('Each advertised graph segment clears original geometry in both directions; endpoints are explicit fixture setup',()=>{
 const {physics,park,fleet,step,walk}=world();try{
 for(let i=0;i<120;i++)step();fleet.board();park.setPowered(true);physics.world.step();
 const nodes=new Map(TRAIL_NODES.map(n=>[n.id,n]));
 for(const edge of TRAIL_EDGES)for(const [from,to] of [edge,[...edge].reverse()]){
  const p=nodes.get(from);fleet.person.setActive(true,{x:p.x,y:1,z:p.z});for(let i=0;i<30;i++)step();walk(nodes.get(to));
 }
 }finally{physics.world.free();}
});
