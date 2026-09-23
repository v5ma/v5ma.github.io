/* CPU/real-Three fixtures, not a browser, hardware or complete adventure claim. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {makeWorld,newState,step,saveData,readSave} from '../model.mjs';
import {attachFrontier} from '../frontier-core.mjs';
import * as core from '../resonance-core.mjs';
const world=makeWorld();
const foot=()=>{const s=attachFrontier(newState());s.mode='foot';core.chooseTool(s,'sling');return s;};
const ticks=(s,n,input={})=>{for(let i=0;i<n;i++)step(s,world,input,1/60);};

test('Sling direction comes from the actual release resolver, not a UI/controller ray',()=>{
 const s=foot();s.resonance.aim=true;s.resonance.aimYaw=.45;
 assert.equal(typeof core.slingSight,'function');const guide=core.slingSight(s,world);
 assert.ok(core.fireTool(s,world));const p=s.resonance.projectiles[0];
 assert.ok(Math.abs(Math.atan2(p.vx,p.vz)-guide.yaw)<1e-10);assert.equal(guide.kind,'direction');assert.ok(guide.length<=4);
});
test('Sight and projectile direction agree when an eligible target is locked',()=>{
 const s=newState();s.mode='foot';s.x=80;s.z=320;core.chooseTool(s,'sling');core.resonanceInput(s,world,{aim:true,cameraYaw:.1},1/60);
 const guide=core.slingSight(s,world);core.fireTool(s,world);const p=s.resonance.projectiles[0];
 assert.equal(guide.locked,'folio-guard');assert.equal(guide.yaw,Math.atan2(p.vx,p.vz));
});
test('No direction indicator is shown while riding, using another tool or not aiming',()=>{
 const s=foot();assert.equal(core.slingSight(s,world),null);s.resonance.aim=true;s.mode='bike';assert.equal(core.slingSight(s,world),null);s.mode='foot';s.resonance.tool='staff';assert.equal(core.slingSight(s,world),null);
});
test('Sight stops before a nearby wall and never invents a hit on a resident',()=>{
 const s=newState();s.mode='foot';s.x=0;s.z=0;core.chooseTool(s,'sling');s.resonance.aim=true;s.resonance.aimYaw=0;
 const w={...world,colliders:[{x:0,z:1.5,hx:1,hz:.18}]};const guide=core.slingSight(s,w);
 assert.equal(guide.blocked,true);assert.ok(guide.length<1.5);assert.equal(guide.kind,'direction');
 const town=foot();town.resonance.aim=true;assert.equal(core.slingSight(town,world).locked,null);
});
test('Shot trail endpoints are recorded by real projectile steps, never extrapolated ahead',()=>{
 const s=foot();core.fireTool(s,world);ticks(s,1);const p=s.resonance.projectiles[0];
 assert.ok(Number.isFinite(p.previousX)&&Number.isFinite(p.previousZ));
 assert.ok(Math.abs((p.z-p.previousZ)-p.vz/60)<1e-10);assert.ok(Math.abs((p.x-p.previousX)-p.vx/60)<1e-10);
});
test('A real wall collision creates a bounded non-damaging impact mark',()=>{
 const s=newState();s.mode='foot';s.x=80;s.z=326;core.chooseTool(s,'sling');s.resonance.aimYaw=0;
 const w={...world,colliders:[...world.colliders,{id:'fixture-wall',x:80,z:326.25,hx:3,hz:.08}]};core.fireTool(s,w);step(s,w,{},1/60);
 assert.equal(s.banditHP,100);assert.equal(s.resonance.projectiles.length,0);assert.equal(s.resonance.impacts.at(-1)?.kind,'wall');
});
test('A genuine sling hit, not an aim lock, creates hit confirmation',()=>{
 const s=newState();s.mode='foot';s.x=80;s.z=320;core.chooseTool(s,'sling');core.resonanceInput(s,world,{aim:true,cameraYaw:0},1/60);
 assert.deepEqual(s.resonance.impacts,[]);core.fireTool(s,world);ticks(s,18,{aim:true,cameraYaw:0});
 assert.ok(s.banditHP<100);assert.ok(s.resonance.impacts.some(m=>m.kind==='hit'));
});
test('Impacts expire with simulation steps, survive pause, and never enter saved progression',()=>{
 const s=foot();s.resonance.impacts=[{kind:'wall',x:s.x,z:s.z,step:s.steps,space:core.slingSpace(s,world)}];
 const raw=JSON.stringify(saveData(s));assert.equal(JSON.parse(raw).resonance.impacts,undefined);const loaded=attachFrontier(newState(readSave(raw,world)));assert.deepEqual(loaded.resonance.impacts,[]);
 ticks(s,30);assert.deepEqual(s.resonance.impacts,[]);
});
test('Workshop refill clears old visual marks without changing the chosen equipment',()=>{
 const s=foot();s.resonance.impacts=[{kind:'hit'}];core.restockResonance(s);assert.deepEqual(s.resonance.impacts,[]);assert.equal(s.resonance.tool,'sling');
});

test('Feedback uses fixed real Three buffers and does not mutate the adventure',async()=>{
 const {createSlingFeedback}=await import('../sling-feedback.mjs');const root=new T.Group(),s=foot();s.resonance.aim=true;
 const fx=createSlingFeedback({root,world,elevation:()=>1.3});const before=JSON.stringify(s);fx.update(s);
 assert.equal(JSON.stringify(s),before);assert.equal(fx.inspect().guide.visible,true);
 const geometries=[],materials=[];root.traverse(o=>{if(o.geometry)geometries.push(o.geometry);if(o.material)materials.push(o.material);});
 const ids=geometries.map(g=>g.uuid);for(let i=0;i<120;i++)fx.update(s);assert.deepEqual(geometries.map(g=>g.uuid),ids);assert.equal(JSON.stringify(s),before);
 assert.ok(materials.every(m=>m.depthTest!==false&&m.depthWrite===false));assert.equal(fx.inspect().renderTargets,0);assert.ok(fx.inspect().maxDraws<=5);
 fx.dispose();assert.equal(root.children.length,0);fx.dispose();
});
test('Feedback renders real pellets and their previous-step trails, then hides after expiry',async()=>{
 const {createSlingFeedback}=await import('../sling-feedback.mjs');const root=new T.Group(),s=foot(),fx=createSlingFeedback({root,world,elevation:()=>1.3});
 core.fireTool(s,world);ticks(s,1);fx.update(s);assert.equal(fx.inspect().pellets,1);assert.equal(fx.inspect().trails,1);assert.equal(fx.inspect().guide.visible,false);
 ticks(s,100);fx.update(s);assert.equal(fx.inspect().pellets,0);assert.equal(fx.inspect().trails,0);fx.dispose();
});
test('A render/pause cycle cannot consume ammunition or create impacts',async()=>{
 const {createSlingFeedback}=await import('../sling-feedback.mjs');const s=foot(),fx=createSlingFeedback({root:new T.Group(),world,elevation:()=>1.3});
 s.resonance.aim=true;const before=JSON.stringify(saveData(s));for(let i=0;i<80;i++)fx.update(s);assert.equal(JSON.stringify(saveData(s)),before);assert.deepEqual(s.resonance.impacts,[]);fx.dispose();
});
