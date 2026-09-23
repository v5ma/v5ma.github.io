// Real r177 objects and production physics, with a Canvas2D collaborator only.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import * as T from '../vendor/three.module.js';
import {initPhysics,ParkPhysics} from '../ranger-physics.js';
import {buildPark} from '../ranger-world.js';
import {buildFrontier} from '../frontier-world-expanded.js';
import {buildRanchWorld} from '../ranch-world.js';
import {emptyFrontier} from '../frontier-data.js';
import {CurrentworksReserve,WATER_SHAPES,ownsWater} from '../currentworks-reserve.js';
import {storyFocus,STORY_FOCUS_STYLE} from '../story-focus.js';
import {PortalMaterials} from '../diorama-portal.js';
import {roadDistance} from '../ranger-data.js';
globalThis.document={createElement(){return {width:1024,height:256,getContext(){return new Proxy({measureText:t=>({width:t.length*18})},{get:(o,k)=>k in o?o[k]:()=>{}});}};}};
globalThis.window={dispatchEvent:()=>{}};
await initPhysics();
function fixture(){const physics=new ParkPhysics(),scene=new T.Scene();buildPark(scene,physics);buildFrontier(scene,physics,emptyFrontier());buildRanchWorld(scene,physics);const ctx={scene,settings:{low:false,reduced:false},renderer:{xr:{isPresenting:false}},fleet:{position:{x:0,y:1,z:51},vehicles:[{id:'test-boat',type:'boat',drive:{position:{x:-164,y:1,z:-155}}}]}};return {physics,ctx,fx:new CurrentworksReserve(ctx)};}
const frame={preset:'balanced',water:true,wind:true};
test('Currentworks module snapshots remain exact upstream Git blobs, not altered engine copies',()=>{
 for(const [path,wanted]of Object.entries({'water.js':'85f37fe643592f88b66d8b37c2dc4846706d6f7b','water.mjs':'dbe750438d841826231e3ac96c5981d0ba4f3bec','trees.js':'4c4ff287382b908865e8cbc941f564c01dc16b23','trees.mjs':'2e2a3ac3ceb6f6d6c0ead0cd578aa0ffe6d48a59'})){
  const b=readFileSync(new URL('../vendor/currentworks/'+path,import.meta.url));assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),wanted);
 }assert.equal(T.REVISION,'177');
});
test('Water ownership keeps dry corners, overlapping lagoons and the existing canal uncovered',()=>{
 assert.ok(ownsWater(0,{x:-27,z:-32}));assert.ok(!ownsWater(0,{x:-14,z:-19}));
 for(let x=-285;x<-80;x+=2)for(let z=-220;z<-90;z+=2){const count=WATER_SHAPES.filter((_,i)=>ownsWater(i,{x,z})).length;assert.ok(count<=1);if(x>=-479&&x<=-221&&Math.abs(z+152)<=18)assert.equal(count,0);}
 assert.ok(!ownsWater(4,{x:0,z:0}));assert.ok(!ownsWater(0,{x:NaN,z:0}));
});
test('Three real water surfaces and seeded trees reuse original solids and restore exact instance matrices',()=>{
 const {physics,ctx,fx}=fixture();try{
  assert.equal(fx.failed,false,fx.failure);assert.equal(fx.water.length,3);assert.ok(fx.descriptors.length>=4,'Expected several visible central grove replacements');
  const bodies=physics.world.bodies.len(),colliders=physics.world.colliders.len();
  fx.update(.1,frame);assert.equal(fx.snapshot().active,true);assert.ok(fx.water.every(r=>r.water.mesh.visible&&!r.original.visible));
  assert.ok(fx.replacements.every(r=>{const m=new T.Matrix4();r.mesh.getMatrixAt(r.index,m);return m.elements[0]===0;}));
  for(const d of fx.descriptors)assert.ok(roadDistance(d.position[0],d.position[2])>d.radius+6);
  const materials=fx.forest.stats.materials,geometries=fx.forest.stats.geometries;
  for(let i=0;i<20;i++)fx.update(.1,frame);
  assert.equal(fx.forest.stats.materials,materials);assert.equal(fx.forest.stats.geometries,geometries);
  assert.equal(physics.world.bodies.len(),bodies);assert.equal(physics.world.colliders.len(),colliders);
  fx.update(0,{...frame,preset:'classic'});assert.ok(!fx.root.visible);assert.ok(fx.water.every(r=>r.original.visible));
  for(const r of fx.replacements){const m=new T.Matrix4();r.mesh.getMatrixAt(r.index,m);assert.deepEqual([...m.elements].map(Math.fround),[...r.matrix.elements].map(Math.fround));}
 }finally{fx.dispose();physics.world.free();}
});
test('Pause freezes effects, Reduced Motion flattens water and wind, and XR/Low cap detail',()=>{
 const {physics,ctx,fx}=fixture();try{
  fx.update(.1,frame);const time=fx.time;fx.update(0,frame);assert.equal(fx.time,time);
  ctx.settings.reduced=true;fx.update(.1,frame);assert.ok(fx.water.every(r=>r.water.uniforms.time.value===0&&r.water.uniforms.motion.value===0));assert.ok(fx.forest.uniforms.cwAmplitude.value.every(v=>v===0));
  ctx.settings.reduced=false;ctx.renderer.xr.isPresenting=true;fx.update(.1,frame);assert.equal(fx.forest.stats.quality,'light');assert.ok(fx.water.every(r=>r.water.stats.quality==='light'));
  ctx.renderer.xr.isPresenting=false;ctx.settings.low=true;fx.update(.1,frame);assert.equal(fx.forest.stats.quality,'light');
  fx.update(0,{...frame,water:false,wind:false});assert.ok(fx.water.every(r=>r.original.visible&&!r.water.mesh.visible));assert.ok(fx.forest.uniforms.cwAmplitude.value.every(v=>v===0));
 }finally{fx.dispose();physics.world.free();}
});
test('r177 standard-tree and custom-water shader hooks compose with the production portal mask',()=>{
 const {physics,fx}=fixture(),portal=new PortalMaterials();try{
  portal.collect(fx.root);const mats=new Set();fx.root.traverse(o=>{if(o.material)mats.add(o.material);});
  for(const m of mats){const s=m.isShaderMaterial?{uniforms:{...m.uniforms},vertexShader:m.vertexShader,fragmentShader:m.fragmentShader}:{uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};m.onBeforeCompile(s);assert.match(s.vertexShader,/dinoPortalOriginalVertex/);assert.match(s.fragmentShader,/dinoPortalVisible/);if(!m.isShaderMaterial){assert.match(s.vertexShader,/transformed.xz\+=cwDirection/);assert.match(s.fragmentShader,/vCWUv/);}else assert.match(s.fragmentShader,/atlasEllipse/);}
 }finally{portal.dispose();fx.dispose();physics.world.free();}
});
test('Pinned-tree geometry retains the marked-road clearance at every generated detail',()=>{
 const {physics,fx}=fixture();try{
  fx.forest.group.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);assert.ok(roadDistance(x,z)>4.5,'Tree geometry intrudes on route');}});
 }finally{fx.dispose();physics.world.free();}
});
test('Dispose is idempotent and frees only Currentworks resources',()=>{
 const {physics,ctx,fx}=fixture();try{const child=ctx.scene.children.find(o=>o!==fx.root);fx.update(.1,frame);fx.dispose();fx.dispose();assert.equal(fx.forest.stats.disposed,true);assert.ok(fx.water.every(r=>r.water.stats.disposed&&r.original.visible));assert.ok(ctx.scene.children.includes(child));assert.equal(fx.root.parent,null);}finally{physics.world.free();}
});
test('First Light focus is selected-task driven and suppresses copy rather than actions or map',()=>{
 assert.ok(storyFocus({name:'First Light / Meet Mara'}));assert.ok(!storyFocus(null));assert.ok(!storyFocus({name:'Storm Response'}));assert.match(STORY_FOCUS_STYLE,/#ranch-status/);assert.match(STORY_FOCUS_STYLE,/data-mode="foot"/);for(const id of ['#field-kit','#minimap','#interact-button','#reload-button'])assert.ok(!STORY_FOCUS_STYLE.includes(id));
});
