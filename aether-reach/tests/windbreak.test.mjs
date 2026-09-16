/* Labeled model fixtures: isolated geometry/damage/save invariants, not playthroughs. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,interact,nearby,occupied,clearLine,fire,saveState,readSave,groundAt} from '../model.mjs';
import {WINDBREAK_CONTROLS,WINDBREAK_SCREENS,windbreakMode,windbreakSolid,canShiftWindbreak,inReceiverEncounter} from '../bellwether-windbreak.mjs';
const place=(s,x,y,z)=>Object.assign(s.p,{x,y,z,vx:0,vy:0,vz:0,grounded:true,yaw:0,pitch:0});
const fixture=()=>{const s=createState();s.drones=[];s.bellwether.stage=3;place(s,-111,27.5,-6);return s;};
const eye=(x,z)=>({x,y:29,z});
const run=(s,t,input={})=>{for(let i=0;i<t*120;i++)step(s,{explorer:true,...input},1/120);};
const select=s=>{place(s,...Object.values(WINDBREAK_CONTROLS[0]).slice(-3));};
test('A shared windbreak trades receiver safety for the gallery firing lane, in both directions',()=>{
 const s=fixture(),north=eye(-110,-15),west=eye(-111,-6),east=eye(-102,-6);
 assert(clearLine(north,west,s));assert(!clearLine(north,east,s));s.bellwether.windbreak=1;
 assert(!clearLine(north,west,s));assert(!clearLine(west,north,s));assert(clearLine(north,east,s));
 assert(clearLine(eye(-103,-15),west,s),'The other boarder can still contest the receiver');
});
test('Actual bullets and player shots obey the same changing cover',()=>{
 for(const mode of [0,1]){
  const s=fixture();s.bellwether.windbreak=mode;s.p.invuln=0;
  s.drones=[{id:'fixture-target',kind:'target',hp:100,maxHp:100,x:-111,y:28.8,z:-15,origin:{x:-111,y:28.8,z:-15}}];
  s.p.pitch=Math.atan2(28.8-(s.p.y+1.62),9);fire(s);assert.equal(s.drones[0].hp,mode?100:66);
  s.bullets=[{x:-111,y:28.5,z:-15,vx:0,vy:0,vz:20,life:2,damage:20}];
  run(s,.55);assert.equal(s.p.shield,mode?60:49.4);
 }
});
test('Controls are direct contextual actions and cannot start, finish or pay the mission',()=>{
 const s=fixture();place(s,-112,27.5,-3.5);assert.equal(nearby(s).id,'bell-windbreak-west');
 const credits=s.kit.credits;assert(interact(s));assert.equal(windbreakMode(s),1);assert(interact(s));assert.equal(windbreakMode(s),0);
 assert.equal(s.bellwether.stage,3);assert.equal(s.kit.credits,credits);assert.equal(s.bellwether.encounter,null);
 s.bellwether.stage=2;assert.notEqual(nearby(s)?.id,'bell-windbreak-west');
});
test('Destination interlock rejects an occupied screen without moving or crushing either actor',()=>{
 const s=fixture();place(s,-112,27.5,-3.5);s.drones=[{id:'fixture-person',hp:50,humanoid:true,x:-110,y:28.55,z:-11.7}];
 assert(!canShiftWindbreak(s));assert.equal(interact(s),false);assert.equal(windbreakMode(s),0);assert.equal(s.drones[0].hp,50);
 s.drones=[];place(s,-110,27.5,-11.7);assert(!canShiftWindbreak(s));
});
test('New optional save field is bounded, old saves remain neutral and completion reward stays once-only',()=>{
 for(const value of [null,0,-1,99,NaN,'1',{},true])assert.equal(windbreakMode(createState({version:1,bellwether:{windbreak:value}})),0);
 const s=fixture();s.bellwether.windbreak=1;const saved=saveState(s);assert.equal(JSON.parse(saved).version,1);assert.equal(readSave(saved).bellwether.windbreak,1);
 const loaded=createState(saved);assert.equal(windbreakMode(loaded),1);assert.equal(loaded.bellwether.stage,3);assert.deepEqual(loaded.kit.owns,['arc']);
 loaded.bellwether.stage=5;place(loaded,-84,7,-4);const credits=loaded.kit.credits;interact(loaded);interact(loaded);assert.equal(loaded.kit.credits,credits+300);
 assert.equal(createState(saveState(loaded)).bellwether.stage,6);
});
test('Real walking reaches both flanks in either screen state, with the rechargeable starter weapon',()=>{
 const reports=[];
 for(const mode of [0,1])for(const [name,points] of [
  ['receiver',[[-111,-6],[-109,-6],[-107,-8],[-107,-14],[-110,-15]]],
  ['gallery',[[-102,-3.5],[-103.5,-6],[-103.5,-9],[-103.5,-13],[-103,-15]]]
 ]){
  const s=fixture();s.bellwether.windbreak=mode;place(s,points[0][0],27.5,points[0][1]);const start=s.time;let distance=0;
  for(const[x,z]of points.slice(1)){let frames=0;for(;frames<2400;frames++){
   const dx=x-s.p.x,dz=z-s.p.z,d=Math.hypot(dx,dz);if(d<.14)break;s.p.yaw=Math.atan2(dx,-dz);const a={...s.p};step(s,{moveZ:Math.min(1,d*2),explorer:true},1/120);distance+=Math.hypot(s.p.x-a.x,s.p.z-a.z);
  }assert(frames<2400,`${mode}/${name} blocked at ${JSON.stringify(s.p)}`);assert(Math.abs(s.p.y-27.5)<.1);}
  assert.equal(s.stats.rescues,0);assert.deepEqual(s.kit.owns,['arc']);reports.push({mode,name,seconds:Math.round((s.time-start)*100)/100,meters:Math.round(distance*100)/100});
 }
 console.log('ROUTE_FIXTURES '+JSON.stringify(reports));
});
test('A live rooftop encounter survives a real stair retreat and return without replaying enemies',()=>{
 const s=fixture();interact(s);assert.equal(s.bellwether.encounter,'roof');const ids=s.drones.filter(e=>e.bellwetherEnemy).map(e=>e.id);
 place(s,-99,27.5,-6); // Labeled fixture begins at the existing supported stair entrance.
 const walk=z=>{for(let i=0;i<2000&&Math.abs(s.p.z-z)>.14;i++){s.p.yaw=s.p.z>z?0:Math.PI;step(s,{moveZ:Math.min(1,Math.abs(s.p.z-z)*2),explorer:true},1/120);}};
 walk(-18.5);assert(Math.abs(s.p.y-22)<.3);assert.equal(s.bellwether.encounter,'roof');assert.equal(s.bellwether.hold,0);assert.equal(s.bellwether.galleryRetreats,1);
 walk(-6);assert(Math.abs(s.p.y-27.5)<.3);assert.equal(s.bellwether.encounter,'roof');assert.deepEqual(s.drones.filter(e=>e.bellwetherEnemy).map(e=>e.id),ids);assert.equal(s.stats.rescues,0);
 place(s,-90,7,-6);run(s,.1);assert.equal(s.bellwether.encounter,null);assert.equal(s.bellwether.stage,4);
});
test('Both raised screen positions block collision and leave receiver, controls and entry supports clear',()=>{
 const s=fixture();
 for(const mode of [0,1]){s.bellwether.windbreak=mode;const b=windbreakSolid(s);assert(occupied((b.x1+b.x2)/2,27.5,(b.z1+b.z2)/2,s));
  for(const[x,z]of [[-111,-6],[-107,-2.1],[-99.8,-6],[-112,-3.5],[-102,-3.5]]){assert(!occupied(x,27.5,z,s),`${mode}: ${x},${z}`);assert(Math.abs(groundAt(x,z,28).y-27.5)<.1);}
 }
 assert(inReceiverEncounter({x:-99,y:22,z:-18.5}));assert(!inReceiverEncounter({x:-99,y:7,z:-18.5}));
});

test('An XR gun origin across the active screen is rejected before ammo is spent',()=>{
 const s=fixture();s.bellwether.windbreak=1;place(s,-110,27.5,-10.8);const ammo=s.p.ammo;
 assert.equal(fire(s,{origin:{x:-110,y:29,z:-12.3},direction:{x:0,y:0,z:-1}}),false);assert.equal(s.p.ammo,ammo);
});
