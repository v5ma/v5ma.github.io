import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {CHAPTER_STEPS} from '../living-reserve-core.js';
import {firstLightRoute,firstLightTask,trailMarks,TRAIL_NODES,TRAIL_EDGES,TRAIL_BUILD} from '../first-light-route.js';
import {FirstLightTrail} from '../first-light-trail.js';
import {PortalMaterials} from '../diorama-portal.js';
const pos=(x,z,y=1)=>({x,y,z});
const state=stage=>({version:1,stage,active:true,observation:null});
test('Every foot-trail endpoint is a unique finite place in the original First Light corridor',()=>{
 assert.equal(new Set(TRAIL_NODES.map(n=>n.id)).size,TRAIL_NODES.length);
 for(const n of TRAIL_NODES)assert.ok([n.x,n.y,n.z].every(Number.isFinite));
 for(const e of TRAIL_EDGES){assert.equal(e.length,2);assert.ok(e.every(id=>TRAIL_NODES.some(n=>n.id===id)));}
});
test('The route to Ivo uses the actual north-ramp bypass rather than the straight gold bearing',()=>{
 const r=firstLightRoute(2,pos(-12,13));assert.equal(r.mode,'trail');
 assert.ok(r.ids.indexOf('west')>=0&&r.ids.indexOf('east')>r.ids.indexOf('west'));assert.equal(r.ids.at(-1),'ivo');
 for(const p of r.points.filter(p=>p.x>=8&&p.x<=18))assert.ok(p.z<=14);
});
test('Research access is not advertised across the closed gate and the restored route leads back home',()=>{
 for(let s=0;s<5;s++){const r=firstLightRoute(s,pos(37,-43));assert.ok(!r.ids.includes('back'));}
 const out=firstLightRoute(5,pos(31,-23));assert.ok(out.ids.includes('front')&&out.ids.includes('back'));assert.equal(out.ids.at(-1),'recorder');
 const back=firstLightRoute(6,pos(47,-51));assert.ok(back.ids.includes('back')&&back.ids.includes('front'));assert.equal(back.ids.at(-1),'leena');
});
test('Passing a turn recomputes the next turn without a visited flag or mandatory waypoint',()=>{
 const r=firstLightRoute(2,pos(18,14));assert.equal(r.next.id,'ivo');
 const shortcut=firstLightRoute(2,pos(24,17));assert.equal(shortcut.mode,'at-goal');assert.deepEqual(shortcut.points,[]);
});
test('Routes end in the existing interaction radius instead of demanding the exact marker center',()=>{
 assert.equal(firstLightRoute(0,pos(8,44)).mode,'at-goal');assert.equal(firstLightRoute(1,pos(-18,13)).mode,'at-goal');
 assert.equal(firstLightRoute(0,pos(0,44)).mode,'trail');
});
test('Vehicles, elevated players and distant free exploration never receive a misleading ground connector',()=>{
 assert.equal(firstLightRoute(2,pos(0,16),'helicopter').mode,'vehicle');assert.equal(firstLightRoute(2,pos(0,16,8)).mode,'elevated');
 const r=firstLightRoute(2,pos(150,150));assert.equal(r.mode,'off-route');assert.deepEqual(trailMarks(r),[]);
 assert.ok(r.points[0].x!==150||r.points[0].z!==150);
});
test('Invalid input and completed chapters cannot produce nonfinite guides',()=>{
 for(const s of [-1,7,1.2,NaN,'constructor'])assert.equal(firstLightRoute(s,pos(0,20)),null);
 assert.equal(firstLightRoute(0,pos(NaN,2)),null);assert.equal(firstLightTask({stage:7,active:false}),null);
 assert.equal(firstLightTask({...state(0),active:false},{position:pos(0,51)}),null);
});
test('READY is only shown when the original interaction rules really permit the task',()=>{
 const c={position:pos(5,44),mode:'foot',speed:0,visible:true};assert.match(firstLightTask(state(0),c).detail,/READY: Talk to Mara/);
 for(const changed of [{visible:false},{speed:2},{mode:'jeep'}])assert.doesNotMatch(firstLightTask(state(0),{...c,...changed}).detail,/READY:/);
 const watch={position:pos(-12,13),mode:'foot',speed:0,visible:true};assert.doesNotMatch(firstLightTask(state(1),watch).detail,/READY:/);
 assert.match(firstLightTask(state(1),{...watch,animal:{species:'diplodocus'}}).detail,/diplodocus is visible/);
});
test('Approach copy explains the current next turn and preserves all seven original goals',()=>{
 for(let stage=0;stage<7;stage++){const task=firstLightTask(state(stage),{position:pos(0,51),mode:'foot',speed:0,visible:true});
 assert.equal(task.done,stage);assert.equal(task.total,7);assert.deepEqual(task.target,CHAPTER_STEPS[stage].target);assert.match(task.name,/^First Light \/ /);assert.equal(task.hint,task.detail);}
 assert.match(firstLightTask(state(2),{position:pos(-12,13),mode:'foot',speed:0,visible:true}).detail,/NEXT: Valley junction/);
});
test('Computing and redisplaying a route never mutates the chapter, animal or position',()=>{
 const s=state(1),c={position:pos(-12,13),mode:'foot',speed:0,visible:true,animal:{species:'stegosaurus',uid:'resident-1'}},before=JSON.stringify([s,c]);
 for(let i=0;i<8;i++){const t=firstLightTask(s,c);trailMarks(t.route);}
 assert.equal(JSON.stringify([s,c]),before);
});
test('Ground marks are bounded, static, on known route segments and away from the final interaction',()=>{
 const r=firstLightRoute(6,pos(47,-51)),a=trailMarks(r),b=trailMarks(r);assert.deepEqual(a,b);assert.ok(a.length>3&&a.length<=24);
 for(const m of a)assert.ok([m.x,m.y,m.z,m.yaw].every(Number.isFinite)&&m.y===.105);
 assert.ok(trailMarks(r,{spacing:.01,limit:999,length:999}).length<=24);assert.deepEqual(trailMarks(r,{limit:0}),[]);
});
test('Trail geometry remains in the existing root and switching off removes its map/ground guidance',()=>{
 const root=new T.Group(),trail=new FirstLightTrail(root),r=firstLightRoute(2,pos(-12,13));trail.update(r,true);
 assert.equal(trail.root.parent,root);assert.ok(trail.root.visible&&trail.mesh.count>0);assert.equal(trail.geometry.attributes.position.count,6);assert.equal(trail.snapshot().build,TRAIL_BUILD);
 const original=trail.mesh.instanceMatrix.array.slice();trail.update(r,true);assert.deepEqual(trail.mesh.instanceMatrix.array,original);
 trail.update(r,false);assert.equal(trail.root.visible,false);assert.equal(trail.mesh.count,0);assert.equal(trail.route,null);trail.dispose();
});
test('The real r177 material accepts the normal instanced per-eye portal shader wrapper',()=>{
 const root=new T.Group(),trail=new FirstLightTrail(root),portal=new PortalMaterials();portal.collect(root);
 assert.ok(portal.entries.has(trail.material));const shader={vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader,uniforms:{}};
 trail.material.onBeforeCompile(shader,null);assert.match(shader.vertexShader,/dinoPortalOriginalVertex/);assert.match(shader.fragmentShader,/dinoPortalVisible/);portal.dispose();trail.dispose();
});
test('Disposing the trail is idempotent and does not dispose another scene object',()=>{
 const root=new T.Group(),other=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()),trail=new FirstLightTrail(root);root.add(other);let count=0;
 trail.material.addEventListener('dispose',()=>count++);trail.dispose();trail.dispose();assert.equal(count,1);assert.equal(other.parent,root);
 trail.update(firstLightRoute(2,pos(-12,13)),true);assert.equal(trail.root.visible,false);assert.equal(trail.mesh.count,0);
});

test('The main entry versions changed navigation/story dependencies and explains the optional trail',async()=>{
 const {readFileSync}=await import('node:fs');const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const imports=JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]).imports;
 assert.equal(imports['./living-reserve.js?v=story1'],'./living-reserve.js?v=trail1');
 assert.equal(imports['./field-navigation.js'],'./field-navigation.js?v=trail1');assert.match(html,/amber foot trail/i);
});
