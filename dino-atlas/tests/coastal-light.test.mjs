import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {DEFAULT_OPTICS,OPTICS_KEY,sanitizeOptics,readOptics,saveOptics,visualStep,effectivePreset,CoastalMaterials,classifySurface} from '../coastal-shaders.js';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {buildPark} from '../ranger-world.js';
import {buildFrontier} from '../frontier-world-expanded.js';
import {buildRanchWorld} from '../ranch-world.js';
import {emptyFrontier} from '../frontier-data.js';
await initPhysics();
test('optics settings reject unknown presets, invalid strength and non-boolean toggles',()=>{
 assert.deepEqual(sanitizeOptics(null),DEFAULT_OPTICS);assert.deepEqual(sanitizeOptics({version:99}),DEFAULT_OPTICS);
 const s=sanitizeOptics({version:1,preset:'raytracing',water:'false',wind:false,bloom:Infinity});assert.equal(s.preset,'balanced');assert.equal(s.water,true);assert.equal(s.wind,false);assert.equal(s.bloom,.32);
 assert.equal(sanitizeOptics({version:1,bloom:5}).bloom,.8);assert.equal(sanitizeOptics({version:1,bloom:-1}).bloom,0);
});
test('the shader preference namespace leaves all prior game records untouched',()=>{
 const store=new Map([['dino-atlas.progress.v1','journal'],['dino-atlas.frontier.v2','fleet'],['dino-atlas.aaa-director.v1','story']]);const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 assert.ok(saveOptics(storage,{...DEFAULT_OPTICS,preset:'cinematic'}));assert.equal(readOptics(storage).preset,'cinematic');assert.equal(store.get('dino-atlas.progress.v1'),'journal');assert.equal(store.get('dino-atlas.frontier.v2'),'fleet');assert.equal(store.get('dino-atlas.aaa-director.v1'),'story');assert.ok(store.has(OPTICS_KEY));assert.equal(saveOptics(null,DEFAULT_OPTICS),false);
});
test('Cinematic falls back to Balanced on Low or lacking float targets; Classic is unconditional',()=>{
 const s={...DEFAULT_OPTICS,preset:'cinematic'};assert.equal(effectivePreset(s,false,true),'cinematic');assert.equal(effectivePreset(s,true,true),'balanced');assert.equal(effectivePreset(s,false,false),'balanced');assert.equal(effectivePreset({...s,preset:'classic'},true,false),'classic');
});
test('pause and Reduced Motion freeze visual time; invalid or long intervals are bounded',()=>{
 assert.equal(visualStep(5,0,false),5);assert.equal(visualStep(5,.1,true),5);assert.equal(visualStep(5,NaN,false),5);assert.equal(visualStep(5,-2,false),5);assert.equal(visualStep(5,100,false),5.1);
});
test('unknown geometry and animal meshes are not silently replaced',()=>{
 assert.equal(classifySurface(new T.Mesh(new T.SphereGeometry(),new T.MeshStandardMaterial())),null);
 assert.equal(classifySurface(new T.Mesh(new T.CircleGeometry(419.7),new T.MeshStandardMaterial({color:0x849466}))),null);
});
test('maintained world selectors, reversible materials, fixed pool bounds and unchanged collision',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({width:1024,height:100,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 const p=new ParkPhysics(),scene=new T.Scene(),s=emptyFrontier();
 try{
  buildPark(scene,p);buildFrontier(scene,p,s);buildRanchWorld(scene,p);const bodies=p.world.bodies.len(),colliders=p.world.colliders.len(),fx=new CoastalMaterials(scene),counts=fx.snapshot().targets;
  console.log('Optics targets:',counts);assert.equal(counts.water,6);assert.ok(counts.canopy>=3);assert.ok(counts.wet>=15);assert.equal(counts.energy,46);assert.equal(p.world.bodies.len(),bodies);assert.equal(p.world.colliders.len(),colliders);
  const geometry=new Map(fx.bindings.map(b=>[b.mesh,b.mesh.geometry]));fx.apply(DEFAULT_OPTICS,'balanced');
  for(const b of fx.bindings)assert.equal(b.mesh.material,b.enhanced);
  const versions=fx.materials.map(m=>m.version),materials=fx.materials.length;
  for(let i=0;i<300;i++){fx.impact({x:-164,z:-155});fx.update(.1,{boat:{x:-164+i*.1,z:-155,speed:12},night:true,storm:.5});}
  assert.equal(fx.materials.length,materials);assert.deepEqual(fx.materials.map(m=>m.version),versions);assert.equal(fx.wakes.length,12);assert.equal(fx.impacts.length,6);
  const clock=fx.clock;fx.update(0,{boat:{x:0,z:0,speed:12}});assert.equal(fx.clock,clock);
  fx.update(.1,{reduced:true});assert.equal(fx.clock,clock);assert.equal(fx.uniforms.atlasWind.value,0);assert.equal(fx.wakes.length,0);assert.equal(fx.impacts.length,0);
  fx.apply({...DEFAULT_OPTICS,water:false},'balanced');for(const b of fx.bindings.filter(b=>b.kind==='water'))assert.equal(b.mesh.material,b.original);
  fx.apply(DEFAULT_OPTICS,'classic');for(const b of fx.bindings){assert.equal(b.mesh.material,b.original);assert.equal(b.mesh.geometry,geometry.get(b.mesh));assert.equal(b.mesh.customDepthMaterial,b.depth);}
  fx.dispose();assert.equal(p.world.bodies.len(),bodies);assert.equal(p.world.colliders.len(),colliders);
 }finally{p.world.free();globalThis.document=previous;}
});
test('custom material shaders retain engine fog, shadow and tone/color outputs',()=>{
 const scene=new T.Scene(),water=new T.Mesh(new T.RingGeometry(420,535),new T.MeshStandardMaterial());scene.add(water);const fx=new CoastalMaterials(scene),material=fx.bindings[0].enhanced;
 const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);
 for(const chunk of ['fog_fragment','tonemapping_fragment','colorspace_fragment','lights_fragment_begin'])assert.ok(shader.fragmentShader.includes('#include <'+chunk+'>'));
 assert.ok(shader.fragmentShader.includes('atlasWaterNormal'));assert.ok(shader.vertexShader.includes('vAtlasWorld='));assert.ok(shader.uniforms.atlasWake.value.length===12);assert.ok(material.customProgramCacheKey().includes('water'));fx.dispose();
});
