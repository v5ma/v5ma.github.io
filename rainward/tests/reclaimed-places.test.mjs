/* Geometry/restore/Three-object fixtures. Position assignments in these tests
 * are explicitly NOT native playthrough or living-encounter evidence. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../vendor/three.module.js';
import * as W from '../world.mjs';
import * as M from '../model.mjs';
import {completeTask} from '../field-tasks.mjs';
import {PLACES_REVISION,PLACE_ROUTES,applyReclaimedPlaces,DISPATCH_ESCAPE,WORKSHOP_ESCAPE} from '../reclaimed-places.mjs';
import {createReclaimedPlacesArt} from '../reclaimed-places-art.mjs';
const baseline=JSON.parse(fs.readFileSync(new URL('../evidence/reclaimed-places-20260922/gameplay-contract.json',import.meta.url)));
const fields=['bounds','start','exit','shelters','items','patrols','puzzle'];
const locate=(s,x,z)=>Object.assign(s.player,{x,z,y:W.heightAt(x,z),vx:0,vz:0});
function actualWalk(points){
 const p={x:points[0][0],z:points[0][1]};assert.equal(W.solidAt(p.x,p.z),false,'start '+JSON.stringify(p));
 for(const [x,z]of points.slice(1)){let steps=0;while(Math.hypot(x-p.x,z-p.z)>.04){const d=Math.hypot(x-p.x,z-p.z),step=Math.min(.08,d);M.move(p,(x-p.x)*step/d,(z-p.z)*step/d,W.HEIGHT.stand);assert.ok(++steps<5000,'blocked at '+JSON.stringify({p,x,z}));}}
 return p;
}
test('All seven expedition identities, resources, patrols, puzzle solutions and task rewards remain unchanged',()=>{
 assert.equal(baseline.source,'5bb879e6533903a63e8d70ffc6f94eba77318b87');assert.deepEqual(Object.keys(W.LEVELS),Object.keys(baseline.levels));

 const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 for(const [id,data]of Object.entries(W.LEVELS)){const expected=baseline.levels[id];for(const key of fields)if(Object.hasOwn(expected,key))assert.equal(hash(data[key]),expected[key],id+'/'+key);
  const tasks=data.tasks.map(t=>Object.fromEntries(['id','x','z','requires','reward','required','kind'].filter(k=>Object.hasOwn(t,k)).map(k=>[k,t[k]])));assert.equal(hash(tasks),expected.tasks,id+' task contract');}
});
test('Only Floodgate and Terminus receive the layout revision and applying it twice is harmless',()=>{
 for(const [id,d]of Object.entries(W.LEVELS)){const copy=structuredClone(d),before=JSON.stringify(copy);assert.equal(applyReclaimedPlaces(copy),copy);assert.equal(JSON.stringify(copy),before);assert.equal(d.placesRevision,['district','terminus'].includes(id)?PLACES_REVISION:undefined);}
 assert.throws(()=>applyReclaimedPlaces({id:'district',obstacles:[]}),/Review changed/);
 assert.throws(()=>applyReclaimedPlaces({id:'terminus',obstacles:[]}),/Review changed/);
});
test('Quay recovery, open verge and east commitment routes use real swept standing movement',()=>{
 M.createGame('district');for(const [id,r]of Object.entries(PLACE_ROUTES.district)){const p=actualWalk(r.points);assert.ok(W.dist(p,W.EXIT)<.1,id);}
});
test('The reclaimed ruin has usable rooms and multiple exits rather than a decorative solid box',()=>{
 M.createGame('district');for(const p of[[-32,-28],[-31,-32],[-31,-34],[-32,-38]])assert.equal(W.solidAt(...p),false);
 actualWalk([[-32,-24],[-32,-28],[-28.5,-28],[-27,-28]]);
 actualWalk([[-32,-38],[-32,-42],[-28,-42]]);
 assert.equal(W.solidAt(-34.25,-35),true);
});
test('New cover distinguishes crouching from standing using the real line-of-sight geometry',()=>{
 M.createGame('district');
 for(const [observer,target,id]of[[{x:-20,z:-37},{x:-32,z:-37},'quay-observation-sill'],[{x:11,z:-36},{x:11,z:-40.5},'quay-baggage-screen']]){
  const eye={...observer,y:1.45},crouch={...target,y:W.HEIGHT.crouch*.82},stand={...target,y:W.HEIGHT.stand*.82};
  assert.equal(W.obstruction(eye,crouch)?.o.id,id);assert.equal(W.obstruction(eye,stand),null);
 }
});
test('A pursuer can navigate every quay door; the new recovery route is not an unreachable safe perch',()=>{
 M.createGame('district');for(const target of[{x:-32,z:-28},{x:-31,z:-34},{x:-32,z:-38}])assert.ok(W.findPath({x:-3,z:-38},target).length>0);
});
test('Both old station routes remain legal while new shutters are closed and no doorway bypasses the signal puzzle',()=>{
 const s=M.createGame('terminus');assert.equal(W.findPath(W.START,W.EXIT).length,0);
 for(const i of W.ITEMS.filter(i=>i.objective))assert.ok(W.findPath(W.START,i).length>0,i.id);
 for(const gate of[DISPATCH_ESCAPE,WORKSHOP_ESCAPE])assert.equal(W.OBSTACLES.find(o=>o.id===gate).disabled,false);
 s.puzzle.wheels=[1,0,1];s.puzzle.solved=true;W.syncGates(s.puzzle);assert.ok(W.findPath(W.START,W.EXIT).length>0);
 for(const gate of[DISPATCH_ESCAPE,WORKSHOP_ESCAPE])assert.equal(W.OBSTACLES.find(o=>o.id===gate).disabled,false);
});
test('The dispatch desk opens the actual lateral doorway without duplicating its original reward',()=>{
 const s=M.createGame('terminus');locate(s,32,20);const t=W.CURRENT.tasks.find(t=>t.id==='last-dispatch'),before=s.player.reserve;
 assert.equal(W.solidAt(20,-22),true);assert.ok(completeTask(s,t.id));assert.equal(s.player.reserve,before+t.reward.ammo);assert.equal(W.solidAt(20,-22),false);
 const rayA={x:18,y:1.4,z:-22},rayB={x:23,y:1.4,z:-22};assert.equal(W.obstruction(rayA,rayB),null);assert.equal(completeTask(s,t.id),false);assert.equal(s.player.reserve,before+t.reward.ammo);
 actualWalk(PLACE_ROUTES.terminus.dispatch.points);assert.equal(W.findPath(W.START,W.EXIT).length,0,'signal gate still closed');
});
test('The goods exit requires the existing safe-power radio dependency; the key and prism are still required to finish',()=>{
 const s=M.createGame('terminus');locate(s,-31,-23);assert.equal(completeTask(s,'station-radio'),false);assert.equal(W.solidAt(-32,-27),true);
 s.puzzle.wheels=[1,0,1];s.puzzle.solved=true;W.syncGates(s.puzzle);assert.ok(completeTask(s,'station-radio'));assert.equal(W.solidAt(-32,-27),false);assert.equal(W.obstruction({x:-32,y:1.4,z:-25},{x:-32,y:1.4,z:-29}),null);
 actualWalk(PLACE_ROUTES.terminus.workshop.points);locate(s,W.EXIT.x,W.EXIT.z);assert.equal(M.interact(s),false);assert.equal(s.status,'playing');
});
test('The station outer aisle is physically traversable and can be reached by the existing creature navigation',()=>{
 M.createGame('terminus');actualWalk(PLACE_ROUTES.terminus.dispatchOuter.points);assert.ok(W.findPath({x:27,z:-19},{x:38,z:-4}).length>0);
});
test('Saved gate progress restores and inactive checkpoint previews cannot open the active station',()=>{
 const s=M.createGame('terminus');locate(s,32,20);completeTask(s,'last-dispatch');s.puzzle.wheels=[1,0,1];s.puzzle.solved=true;W.syncGates(s.puzzle);locate(s,-31,-23);completeTask(s,'station-radio');const saved=M.checkpoint(s);
 M.createGame('terminus');assert.ok(M.restore(saved,false));for(const id of[DISPATCH_ESCAPE,WORKSHOP_ESCAPE])assert.equal(W.OBSTACLES.find(o=>o.id===id).disabled,false);
 const restored=M.restore(saved);assert.deepEqual(restored.completedTasks,s.completedTasks);for(const id of[DISPATCH_ESCAPE,WORKSHOP_ESCAPE])assert.equal(W.OBSTACLES.find(o=>o.id===id).disabled,true);
 assert.deepEqual(JSON.parse(M.checkpoint(restored)).player,JSON.parse(saved).player);
});
test('All original shelter slots and legacy v1-v4 checkpoints remain accepted',()=>{
 for(const id of Object.keys(W.LEVELS))for(const shelter of W.LEVELS[id].shelters){const s=M.createGame(id);s.checkpoint=shelter.id;const raw=JSON.parse(M.checkpoint(s));for(const version of[1,2,3,4]){if(version===1&&id!=='district')continue;const value={...raw,version};if(version===1)delete value.level;const restored=M.restore(JSON.stringify(value));assert.ok(restored,id+'/'+shelter.id+'/'+version);assert.equal(restored.player.x,shelter.x);assert.equal(restored.player.z,shelter.z);assert.equal(W.solidAt(shelter.x,shelter.z),false);}}
});
test('Raised new racks and baggage screens preserve legacy drops at their old coordinates and quantities',()=>{
 for(const [level,x,z,approachX,approachZ]of[['district',11,-39,11,-40.1],['district',-12,-42,-12,-43.1],['terminus',31,-7.5,29.6,-7.5],['terminus',35.8,5,35.8,6.1]]){
  const s=M.createGame(level),e=s.enemies[0];Object.assign(e,{hp:0,x,z,dropMade:true});s.drops=[{id:e.id,x,z,items:{ammo:3,cloth:1}}];const restored=M.restore(M.checkpoint(s));assert.ok(restored);assert.equal(W.solidAt(x,z,W.HEIGHT.prone),false);locate(restored,approachX,approachZ);assert.equal(M.interactable(restored)?.kind,'loot');const n=restored.player.reserve;assert.ok(M.interact(restored));assert.equal(restored.player.reserve,n+3);assert.equal(restored.player.cloth,1);const again=M.restore(M.checkpoint(restored));assert.deepEqual(again.drops[0].items,{ammo:0,cloth:0});
 }
});
function artFixture(chapter){
 const scene=new T.Scene(),adds=[],labels=[],geometries=[],materials=[];
 const A={add(...a){adds.push(a);},label(text,x,y,z,w,h,bg,fg,rotation){const o=new T.Object3D();o.position.set(x,y,z);o.name=text;scene.add(o);labels.push(text);return o;},mesh(shape,scale,color){const g=new T.BoxGeometry(1,1,1),m=new T.MeshBasicMaterial({color}),o=new T.Mesh(g,m);geometries.push(g);materials.push(m);o.scale.set(...scale);return o;}};
 const art=createReclaimedPlacesArt(scene,A,chapter);
 return {scene,art,adds,labels,dispose(){const gs=new Set(geometries),ms=new Set(materials);scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}};
}
test('Every static new collision box has an exactly matching rendered body including raised bottoms',()=>{
 for(const id of['district','terminus']){M.createGame(id);const f=artFixture(W.CURRENT);try{for(const o of W.CURRENT.obstacles.filter(o=>o.placeArt&&!o.openOnTask))assert.ok(f.adds.some(a=>a[0]==='box'&&a[1]===o.x&&a[2]===o.bottom+o.h/2&&a[3]===o.z&&a[4]===o.w&&a[5]===o.h&&a[6]===o.d),o.id);assert.ok(f.adds.length<100);assert.ok(f.labels.length<12);}finally{f.dispose();}}
});
test('Visible shutters open atomically with task completion and close again after a fresh game',()=>{
 const s=M.createGame('terminus'),f=artFixture(W.CURRENT);try{for(const id of[DISPATCH_ESCAPE,WORKSHOP_ESCAPE]){const door=f.scene.getObjectByName(id),o=W.OBSTACLES.find(o=>o.id===id);f.art.update(s);assert.equal(door.scale.y,o.h);s.completedTasks.push(o.openOnTask);W.syncRouteGates(s.completedTasks);f.art.update(s);assert.ok(door.scale.y<.11);assert.ok(door.position.y>=o.h);assert.ok(o.disabled);}const fresh=M.createGame('terminus');f.art.update(fresh);for(const id of[DISPATCH_ESCAPE,WORKSHOP_ESCAPE])assert.equal(f.scene.getObjectByName(id).scale.y,3.2);}finally{f.dispose();}
});
test('Both ordinary scene builders use the shared art and do not double-render the new walls or closed shutters',()=>{
 for(const name of['district.mjs','terminus-art.mjs']){const s=fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');assert.match(s,/createReclaimedPlacesArt\(scene,A,CURRENT\)/);assert.match(s,/o\.placeArt/);}
 assert.match(fs.readFileSync(new URL('../terminus-art.mjs',import.meta.url),'utf8'),/places\.update\(s\)/);
});

test('The quay lookout sign stays below the observation sill instead of obscuring its sightline',()=>{
 M.createGame('district');const f=artFixture(W.CURRENT);try{const sign=f.scene.getObjectByName('QUAY LOOKOUT\nNORTH TRANSMITTER');assert.ok(sign);assert.ok(sign.position.y+.35/2<1.05);}finally{f.dispose();}
});
