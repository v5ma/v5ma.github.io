/* Unit fixtures isolate geometry, sensing and saves; NOT an end-to-end journey. */
import {test} from 'node:test';import assert from 'node:assert/strict';
import * as M from '../model.mjs';import * as W from '../world.mjs';
import {completeTask} from '../field-tasks.mjs';import {updatePatrol} from '../awareness.mjs';
import {FREIGHT_CUT_GATE,FREIGHT_CUT_TASK,freightCutState,FREIGHT_CUT_REVISION,FREIGHT_CUT_ROUTES} from '../freight-cut.mjs';
function powered(){const s=M.createGame();Object.assign(s.player,{x:-22,z:-3.5});M.interact(s);Object.assign(s.player,{x:18,z:-11});assert.ok(M.interact(s));return s;}
test('The freight cut adds no chapter, task, objective, reward or shelter',()=>{M.createGame();assert.equal(FREIGHT_CUT_REVISION,'freight-cut-4');assert.equal(Object.keys(W.LEVELS).length,7);assert.equal(W.LEVELS.district.tasks.length,3);const radio=W.LEVELS.district.tasks.find(t=>t.id===FREIGHT_CUT_TASK);assert.deepEqual(radio.requires,['cell']);assert.deepEqual(radio.reward,{canister:2,ammo:4});assert.equal(!!radio.required,false);assert.deepEqual(W.SHELTERS.map(s=>s.id),['start','clinic']);assert.deepEqual(W.ITEMS.filter(i=>i.objective).map(i=>[i.id,i.x,i.z]),[['clinic-cell',-22,-3.5],['depot-crank',22.3,-26.7]]);});
test('Repair remains local, battery-dependent and single reward; no remote or early release',()=>{const s=M.createGame();assert.equal(completeTask(s,FREIGHT_CUT_TASK),false);Object.assign(s.player,{x:18,z:-11});assert.equal(M.interact(s),false);assert.ok(W.solidAt(14,-24));Object.assign(s.player,{x:-22,z:-3.5});assert.ok(M.interact(s));assert.equal(completeTask(s,FREIGHT_CUT_TASK),false);Object.assign(s.player,{x:18,z:-11});assert.ok(M.interact(s));const raw=M.checkpoint(s);assert.equal(completeTask(s,FREIGHT_CUT_TASK),false);assert.equal(M.checkpoint(s),raw);assert.match(s.hint,/WEST LOADING OPEN/);});
test('Closed shutter stops every stance and shots; opened shutter clears the exact same volume',()=>{const s=M.createGame();for(const stance of ['stand','crouch','prone']){const p={x:12,z:-24};M.move(p,4,0,W.HEIGHT[stance]);assert.ok(p.x<14);}const a={x:11,y:1.4,z:-24},b={x:17,y:1.4,z:-24};assert.equal(W.obstruction(a,b)?.o.id,FREIGHT_CUT_GATE);powered();assert.equal(W.obstruction(a,b),null);for(const stance of ['stand','crouch','prone']){const p={x:12,z:-24};M.move(p,4,0,W.HEIGHT[stance]);assert.ok(p.x>15.9);}assert.ok(W.solidAt(14,-27)&&W.solidAt(14,-20));});
test('Both original freight entrances, objectives and patrol destinations stay reachable while unpowered',()=>{const s=M.createGame();for(const point of [{x:21,z:-32},{x:21,z:-10},...W.ITEMS,...W.PATROLS.flatMap(e=>e.points.map(([x,z])=>({x,z})))])assert.ok(W.findPath(s.player,point).length||W.dist(s.player,point)<1,JSON.stringify(point));});
function measure(open){const s=open?powered():M.createGame();s.enemies=[];Object.assign(s.player,{x:17,z:-24,y:0});let distance=0;const path=W.findPath(s.player,{x:11,z:-24});for(const q of [...path,{x:11,z:-24}]){let n=0;while(W.dist(q,s.player)>.12){const dx=q.x-s.player.x,dz=q.z-s.player.z,d=Math.hypot(dx,dz),old={x:s.player.x,z:s.player.z};M.update(s,{x:dx/d,z:dz/d},1/60);distance+=W.dist(old,s.player);assert.ok(++n<3000);}}return {seconds:s.t,distance,health:s.player.hp};}
test('Actual accelerated body motion measures a shorter lateral return after repair',()=>{const closed=measure(false),open=measure(true);assert.ok(open.seconds<closed.seconds*.7,JSON.stringify({closed,open}));assert.ok(open.distance<closed.distance*.7);assert.equal(open.health,100);console.log('FREIGHT_ROUTE_METRIC',JSON.stringify({scope:'isolated model movement; standing, no sprint, no enemies',closed,open}));});
test('The lower market circuit no longer occupies the clinic observation ramp; all five enemies keep their rules',()=>{
 const s=M.createGame(),market=s.enemies.find(e=>e.id==='watch-2');
 assert.deepEqual(market.points,[[-10,-16],[-24,-16],[-24,-22],[-10,-22]]);
 assert.deepEqual(s.enemies.map(e=>[e.id,e.type,e.hp]),[['watch-1','watcher',2],['watch-2','watcher',2],['watch-3','watcher',2],['watch-4','watcher',2],['drifter','drifter',3]]);
 for(const [x,z]of market.points){assert.equal(W.heightAt(x,z),0);assert.equal(W.solidAt(x,z,1.72,.6),false);}
 assert.ok(W.findPath(market,{x:-22,z:-10}).length,'The observation ramp is still shared NPC navigation');
});
test('Market cover uses actual floor heights and the freight marks follow the open south edge of the fountain',()=>{
 const s=M.createGame(),e=s.enemies.find(e=>e.id==='watch-2');Object.assign(e,{x:-10,z:-17,yaw:-Math.PI/2});
 Object.assign(s.player,{x:-5.2,z:-17,stance:'stand'});assert.equal(M.visible(s,e),true);
 s.player.stance='crouch';assert.equal(M.visible(s,e),false);
 const eye=W.HEIGHT.crouch*.72;
 assert.equal(W.obstruction({x:-10,y:W.heightAt(-10,-17)+1.52,z:-17},{x:-5.2,y:eye,z:-17})?.o.id,'market-low');
 assert.equal(W.obstruction({x:0,y:1.52,z:-11},{x:0,y:eye,z:-18.5})?.o.id,'fountain');
 assert.equal(W.obstruction({x:0,y:1.52,z:-11},{x:0,y:W.HEIGHT.stand*.72,z:-18.5}),null,'The same rim does not protect a standing torso');
 for(const [x,z]of [[-5.2,-14.2],[-4.4,-18.6],[0,-18.7],[4.5,-18.5],[8.8,-17]])assert.equal(W.solidAt(x,z,W.HEIGHT.crouch),false,'A floor cue cannot be buried inside a cover block');
 assert.equal(W.coverAt({x:9,z:-17}),true);
 for(const [x,z]of FREIGHT_CUT_ROUTES.approach.points)assert.ok(W.findPath({x:-8,z:-10},{x,z}).length||Math.hypot(x+8,z+10)<1);
});
test('The extended pallet reaches the loading decision without sealing either flank or the spindle',()=>{
 const s=powered(),e=s.enemies.find(e=>e.id==='watch-3');Object.assign(e,{x:23,z:-22,yaw:Math.PI/2});
 Object.assign(s.player,{x:16.2,z:-24,stance:'crouch'});assert.equal(M.visible(s,e),false);
 assert.equal(W.solidAt(16.2,-24,W.HEIGHT.crouch),false);
 assert.equal(W.solidAt(17.8,-23,W.HEIGHT.prone),false,'An older ground drop is not buried by the extended screen');
 assert.equal(W.solidAt(17.8,-23,W.HEIGHT.crouch),true,'Crawl clearance is not standing or crouched passage');
 for(const q of [{x:18,z:-11},{x:17,z:-27},{x:22.3,z:-26.7},{x:11,z:-24}])assert.ok(W.findPath({x:16,z:-24},q).length);
});
test('The aisle screen makes crouching meaningful, leaves standing exposed, and preserves watch-3 patrol clearance',()=>{const s=powered(),e=s.enemies.find(e=>e.id==='watch-3');assert.equal(W.solidAt(19,-19,1.72,.60),false);Object.assign(e,{x:23,z:-19,yaw:Math.PI/2});Object.assign(s.player,{x:16.2,z:-19,stance:'stand'});assert.equal(M.visible(s,e),true);s.player.stance='crouch';assert.equal(M.visible(s,e),false);assert.equal(W.obstruction({x:23,y:1.52,z:-19},{x:16.2,y:W.HEIGHT.crouch*.72,z:-19})?.o.id,'freight-aisle-screen');assert.ok(W.findPath({x:18,z:-11},{x:22.3,z:-26.7}).length);});
test('The sorting baffle breaks the quay sightline but does not enclose a safe room',()=>{M.createGame();assert.equal(W.obstruction({x:11,y:1.5,z:-30},{x:11,y:1.5,z:-24})?.o.id,'freight-sorting-baffle');for(const q of [{x:9,z:-21},{x:6,z:-24},{x:14,z:-28}])assert.ok(W.findPath({x:11,z:-24},q).length);});
test('The opened passage exposes a real sightline to the watcher, not a player-only shortcut',()=>{const s=powered(),e=s.enemies.find(e=>e.id==='watch-3');Object.assign(e,{x:17,z:-24,yaw:Math.PI/2});Object.assign(s.player,{x:11,z:-24,stance:'stand'});assert.equal(M.visible(s,e),true);W.syncRouteGates([]);assert.equal(M.visible(s,e),false);});
test('An investigating lookout physically navigates through the opened loading passage',()=>{const s=powered(),e=s.enemies.find(e=>e.id==='watch-3');Object.assign(s.player,{x:0,z:27});Object.assign(e,{x:17,z:-24,yaw:0,state:'patrol',lastNoise:0});M.noise(s,11,-24,18,'bottle');let crossed=false;for(let i=0;i<420;i++){s.t+=1/60;updatePatrol(s,e,1/60);if(e.x<13.4&&Math.abs(e.z+24)<1)crossed=true;}assert.ok(crossed,JSON.stringify(e));});
test('Version-4 checkpoints restore existing radio state without adding fields or replaying rewards',()=>{const old=M.checkpoint(M.createGame()),s=powered();s.checkpoint='clinic';const saved=M.checkpoint(s),keys=Object.keys(JSON.parse(old));assert.deepEqual(Object.keys(JSON.parse(saved)),keys);assert.equal(JSON.parse(saved).version,4);const restored=M.restore(saved);assert.ok(freightCutState(restored).open);assert.equal(W.solidAt(14,-24),false);assert.deepEqual(JSON.parse(M.checkpoint(restored)).player,JSON.parse(saved).player);assert.ok(M.restore(old));assert.equal(W.solidAt(14,-24),true);});
test('Previewing another checkpoint never changes the active passage; fresh starts reseal it',()=>{const saved=M.checkpoint(powered());M.createGame();assert.ok(W.solidAt(14,-24));assert.ok(M.restore(saved,false));assert.ok(W.solidAt(14,-24));M.restore(saved);assert.equal(W.solidAt(14,-24),false);M.createGame();assert.ok(W.solidAt(14,-24));});
test('The receiver remains optional for extraction, including the freight-first route',()=>{const s=M.createGame();for(const [x,z]of [[22.3,-26.7],[-22,-3.5]]){Object.assign(s.player,{x,z});assert.ok(M.interact(s));}Object.assign(s.player,{x:0,z:-43});assert.ok(M.interact(s));assert.equal(s.status,'won');assert.equal(s.completedTasks.includes(FREIGHT_CUT_TASK),false);});
