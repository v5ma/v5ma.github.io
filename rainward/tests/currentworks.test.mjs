/* Actual r177 Three objects and explicit preparation collaborators. These do
 * not compile GPU shaders; currentworks-browser.py is the independent gate. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from '../vendor/three.module.js';
import * as W from '../world.mjs';
import * as M from '../model.mjs';
import {completeTask} from '../field-tasks.mjs';
import {graphicsPreset} from '../graphics.mjs';
import {PortalMaterials} from '../world-aperture.mjs';
import {createPortalOcclusion} from '../portal-occlusion.mjs';
import {createCurrentworksEnvironment,gardenTrees} from '../currentworks-environment.mjs';
import {GARDEN_RETURN,applyConservatoryLoop,ARCHIVE_SERVICE_GATE} from '../conservatory-loop.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const locate=(s,x,z)=>Object.assign(s.player,{x,z,y:W.heightAt(x,z),vx:0,vz:0});
function fixture(){const s=M.createGame('conservatory'),scene=new T.Scene(),old=new T.Mesh(new T.PlaneGeometry(3,3),new T.MeshBasicMaterial());old.userData.waterSurface=true;const cards=new T.Group();cards.userData.legacyConservatoryTrees=true;scene.add(old,cards);const env=createCurrentworksEnvironment(scene,W.CURRENT);return {s,scene,old,cards,env,renderer:{calls:0,async compileAsync(){this.calls++;},initTexture(){}},camera:new T.PerspectiveCamera()};}
test('Selected Currentworks bytes retain exact upstream hashes and use the host r177 engine',()=>{
 const lock=JSON.parse(fs.readFileSync(new URL('../vendor/currentworks/source-lock.json',import.meta.url)));
 assert.equal(T.REVISION,'177');assert.equal(lock.water,'0.1.0');assert.equal(lock.trees,'0.1.3');
 for(const [name,entry]of Object.entries(lock.files)){const b=fs.readFileSync(new URL('../vendor/currentworks/'+name,import.meta.url));assert.equal(sha(b),entry.sha256);assert.equal(crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex'),entry.gitBlob);}
});
test('Trees have stable IDs and are planted on existing solid planter footprints, never in a doorway',()=>{
 M.createGame('conservatory');const d=gardenTrees(W.CURRENT);assert.equal(d.length,5);assert.deepEqual(d,gardenTrees(W.CURRENT));assert.equal(new Set(d.map(t=>t.id)).size,5);
 for(const t of d){const o=W.CURRENT.obstacles.find(o=>'garden-'+o.id===t.id);assert.ok(o);assert.equal(t.position[1],o.bottom+o.h);assert.equal(W.solidAt(t.position[0],t.position[2]),true);assert.ok(Math.min(o.w,o.d)/2>t.height*.043);}
});
test('No new environment scene, geometry or graphics ownership appears in the other six chapters',()=>{
 for(const id of Object.keys(W.LEVELS).filter(id=>id!=='conservatory')){M.createGame(id);const scene=new T.Scene(),o=new T.Group();scene.add(o);const env=createCurrentworksEnvironment(scene,W.CURRENT);assert.deepEqual(scene.children,[o]);assert.equal(env.needsPreparation(),false);assert.equal(env.stats().trees,null);env.dispose();assert.deepEqual(scene.children,[o]);}
});
test('Preparation is shared, retains fallback until ready, and cannot mutate a checkpoint or save key',async()=>{
 const f=fixture(),before=M.checkpoint(f.s);try{assert.ok(f.old.visible&&f.cards.visible);assert.equal(f.env.stats().active,false);const a=f.env.prepare(f.renderer,f.camera),b=f.env.prepare(f.renderer,f.camera);assert.equal(a,b);assert.equal(await a,true);assert.equal(f.env.stats().preparations,1);assert.equal(f.renderer.calls,2);f.env.update(f.s);assert.ok(f.env.stats().active);assert.equal(f.old.visible,false);assert.equal(f.cards.visible,false);assert.equal(M.checkpoint(f.s),before);assert.equal(f.env.stats().water.length,3);assert.equal(f.env.stats().renderTargets,0);}finally{f.env.dispose();}
});
test('Failed compilation restores the original visible environment without an unhandled rejection',async()=>{
 const f=fixture();try{assert.equal(await f.env.prepare({compileAsync:async()=>{throw Error('explicit compile fault');}},f.camera),false);f.env.update(f.s);assert.equal(f.env.stats().active,false);assert.match(f.env.stats().error,/compile fault/);assert.ok(f.old.visible&&f.cards.visible);}finally{f.env.dispose();}
});
test('Disposal during an asynchronous prepare cannot revive a replaced chapter',async()=>{
 const f=fixture();let release;const wait=new Promise(r=>release=r),r={compileAsync:()=>wait};const pending=f.env.prepare(r,f.camera);f.env.dispose();release();assert.equal(await pending,false);assert.equal(f.env.stats().active,false);assert.equal(f.env.root.parent,null);assert.ok(f.old.visible&&f.cards.visible);
});
test('Paused host time freezes water and wind; quiet clears wakes and default/low/XR budgets are bounded',async()=>{
 const f=fixture();try{await f.env.prepare(f.renderer,f.camera);locate(f.s,0,-10);f.s.t=1;f.env.update(f.s);for(let i=0;i<20;i++){f.s.t+=.05;f.s.player.x+=.03;f.env.update(f.s);}const before=f.env.stats();assert.ok(before.water[0].emitted>0);
  const materials=[];f.env.root.traverse(o=>{if(o.material&&!materials.includes(o.material))materials.push(o.material);});const wind=materials.find(m=>m.isMeshStandardMaterial);const sh={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};wind.onBeforeCompile(sh,f.renderer);const amplitudes=Array.from(sh.uniforms.cwAmplitude.value);
  for(let i=0;i<20;i++)f.env.update(f.s);assert.equal(f.env.stats().water[0].time,before.water[0].time);assert.deepEqual(Array.from(sh.uniforms.cwAmplitude.value),amplitudes);assert.equal(f.env.stats().water[0].emitted,before.water[0].emitted);
  f.env.settings({quiet:true});f.env.update(f.s);assert.equal(f.env.stats().water[0].liveDisturbances,0);assert.ok(sh.uniforms.cwAmplitude.value.every(x=>x===0));assert.equal(sh.uniforms.cwTime.value,0);
  f.env.settings({low:true,quiet:false});f.env.update(f.s);for(const w of f.env.stats().water){assert.equal(w.quality,'light');assert.equal(w.vertices,2425);assert.ok(w.effectCapacity<=12);}assert.equal(f.env.stats().trees.lod[0],0);
  f.env.settings({low:false});f.env.update(f.s,{xr:true,ar:true});assert.ok(f.env.stats().active);assert.equal(f.env.stats().trees.lod[0],0);assert.equal(f.env.stats().water[0].quality,'light');
 }finally{f.env.dispose();}
});
test('Reduced Graphics preserves the library wind/material hooks instead of silently converting them away',async()=>{
 const f=fixture();try{await f.env.prepare(f.renderer,f.camera);const renderer={shadowMap:{enabled:true},setPixelRatio(){}},g=graphicsPreset(f.scene,renderer);const seen=new Map();f.env.root.traverse(o=>{if(o.material)seen.set(o,o.material);});g.set(true);g.update();for(const [o,m]of seen)assert.equal(o.material,m);g.dispose();}finally{f.env.dispose();}
});
test('Water clipping uses the displaced position and composes with per-eye portal and cutaway shaders on r177',async()=>{
 const f=fixture(),portal=new PortalMaterials(),cut=createPortalOcclusion();try{await f.env.prepare(f.renderer,f.camera);cut.collect([f.env.root]);portal.collect(f.env.root);let water=0,trees=0;const done=new Set();
  f.env.root.traverse(o=>{const m=o.material;if(!m||done.has(m))return;done.add(m);const shader={uniforms:{...(m.uniforms||{})},vertexShader:m.isShaderMaterial?m.vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:m.isShaderMaterial?m.fragmentShader:T.ShaderLib.standard.fragmentShader};m.onBeforeCompile(shader,{});assert.match(shader.fragmentShader,/dinoPortalVisible/);assert.match(shader.fragmentShader,/rwSightCut/);if(m.isShaderMaterial){water++;assert.match(shader.vertexShader,/vClipPosition=-\(modelViewMatrix\*vec4\(p,1.0\)\)/);assert.match(shader.fragmentShader,/clipping_planes_fragment/);}else{trees++;assert.match(shader.vertexShader,/cwBend/);assert.ok(shader.uniforms.cwAmplitude);}});assert.equal(water,3);assert.equal(trees,2);
 }finally{portal.dispose();cut.dispose();f.env.dispose();}
});
test('Turning the effect off restores old surfaces and dispose frees each module-owned geometry exactly once',async()=>{
 const f=fixture();await f.env.prepare(f.renderer,f.camera);const counts=new Map();f.env.root.traverse(o=>{if(o.geometry&&!counts.has(o.geometry)){counts.set(o.geometry,0);o.geometry.addEventListener('dispose',()=>counts.set(o.geometry,counts.get(o.geometry)+1));}});f.env.settings({enabled:false});assert.ok(f.old.visible&&f.cards.visible);f.env.settings({enabled:true});assert.equal(f.old.visible,false);f.env.dispose();f.env.dispose();for(const n of counts.values())assert.equal(n,1);assert.equal(f.env.root.parent,null);assert.ok(f.old.visible&&f.cards.visible);
});
test('The archive catalogue opens the shared-collision maintenance return without altering its existing reward',()=>{
 const s=M.createGame('conservatory'),task=W.CURRENT.tasks.find(t=>t.id==='archive-pages');const reward={...task.reward};assert.equal(W.solidAt(-40,-25),true);locate(s,-40,-3);assert.ok(completeTask(s,'archive-pages'));assert.equal(W.solidAt(-40,-25),false);assert.equal(completeTask(s,'archive-pages'),false);assert.deepEqual(task.reward,reward);
 assert.equal(W.obstruction({x:-40,y:1.4,z:-23},{x:-40,y:1.4,z:-27}),null);const p={x:GARDEN_RETURN[0][0],z:GARDEN_RETURN[0][1]};for(const [x,z]of GARDEN_RETURN.slice(1)){let n=0;while(W.dist(p,{x,z})>.04){const d=W.dist(p,{x,z}),a=Math.min(.08,d);M.move(p,(x-p.x)*a/d,(z-p.z)*a/d,W.HEIGHT.stand);assert.ok(++n<1000,JSON.stringify({p,x,z}));}}
 assert.ok(W.findPath({x:-39,z:-20},{x:-33,z:-27}).length>0);assert.equal(W.findPath(W.START,W.EXIT).length,0);assert.equal(s.objectives.cell,false);assert.equal(s.objectives.crank,false);
});
test('Old complete-page checkpoints restore an open shutter; fresh and inactive preview worlds remain closed',()=>{
 const s=M.createGame('conservatory');locate(s,-40,-3);completeTask(s,'archive-pages');s.checkpoint='archive';const saved=M.checkpoint(s);M.createGame('conservatory');assert.ok(M.restore(saved,false));assert.equal(W.solidAt(-40,-25),true);const restored=M.restore(saved);assert.ok(restored);assert.equal(W.solidAt(-40,-25),false);assert.equal(W.solidAt(restored.player.x,restored.player.z),false);assert.equal(M.checkpoint(restored),saved);
 const copy=structuredClone(W.LEVELS.conservatory),before=JSON.stringify(copy);applyConservatoryLoop(copy);assert.equal(JSON.stringify(copy),before);
});
test('Both original objectives, all shelters and both optional tasks retain pre-sluice approaches',()=>{
 M.createGame('conservatory');for(const p of[...W.CURRENT.shelters,...W.CURRENT.tasks,...W.CURRENT.items.filter(i=>i.objective),W.CURRENT.puzzle.clue,...W.CURRENT.puzzle.wheels])assert.ok(W.findPath(W.START,p).length>0||W.dist(W.START,p)<1,p.id||p.label);
 assert.equal(W.LEVELS.conservatory.water.filter(p=>p.swimmable).length,0);assert.ok(W.LEVELS.conservatory.water.every(p=>p.depth<.4));assert.equal(W.OBSTACLES.find(o=>o.id===ARCHIVE_SERVICE_GATE).openOnTask,'archive-pages');
});
