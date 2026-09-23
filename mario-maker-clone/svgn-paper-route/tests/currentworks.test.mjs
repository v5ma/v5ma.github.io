import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../vendor/three.webgpu.js';
import {createGarden} from '../currentworks-environment.mjs';
import {UNIT,CLOUDS,ISLANDS,BUDGET,enabled,inRange,nearViewer} from '../currentworks-core.mjs';
import {createPath} from '../depth-path-core.mjs';
import {createDepthWarp} from '../depth-path.mjs';
const hashes={'toon.js':'11e08ec750590dad8d0e92b97018d1789e8de4c1','cloudlets.js':'d6f4d431f1d648b44aab534aa6b36d6e341a7bda','islands.js':'9a3bb58f2e47ace5f5ae00636083509f0a1c09f7'};
for(const [name,sha] of Object.entries(hashes))test('Pinned original Currentworks '+name+' matches inspected library source',()=>{
 const b=readFileSync(new URL('../vendor/currentworks/'+name,import.meta.url));assert.equal(createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex'),sha);
});
test('Only 3D Workshop preview receives graphics, preserving ordinary campaigns and Classic',()=>{
 assert(enabled({preview:true,testing:true,view:'3d'}));
 for(const changes of [{preview:false},{testing:false},{view:'2d'},{look:'classic'}])assert(!enabled({preview:true,testing:true,view:'3d',...changes}));
 assert(!enabled());
});
test('Authored cloud and island budgets stay behind the collision plane',()=>{
 assert.equal(CLOUDS.length,BUDGET.clouds);assert.equal(ISLANDS.length,BUDGET.islands);
 for(const d of [...CLOUDS,...ISLANDS]){assert(Object.isFrozen(d.position));assert(d.position[2]*UNIT<-140);}
 assert.equal(new Set([...CLOUDS,...ISLANDS].map(d=>d.id)).size,10);
});
test('Pausable original clock and quiet setting never advance ornament independently',()=>{
 const s=new T.Scene(),g=createGarden(s);g.update({time:1,riderX:1100,xr:true});
 const a=g.clouds.group.children.map(m=>m.position.toArray());
 g.update({time:1,riderX:1100,xr:true});assert.deepEqual(g.clouds.group.children.map(m=>m.position.toArray()),a);
 g.update({time:12,riderX:1100,xr:true,quiet:true});assert.deepEqual(g.clouds.group.children.map(m=>m.position.toArray()),CLOUDS.map(d=>[...d.position]));
 assert(g.stats.clouds.levels.every(i=>i===2));assert.equal(g.stats.renderTargets,0);assert.equal(g.stats.colliders,0);g.dispose();
});
test('Library materials are actual same-revision node materials, borrowed not duplicated',()=>{
 const g=createGarden(new T.Scene());assert.equal(T.REVISION,'177');
 assert(g.clouds.group.children.every(o=>o.material.isMeshToonNodeMaterial));
 assert(g.islands.group.children.every(o=>o.material.isMeshToonNodeMaterial));
 assert.equal(g.stats.materials,6);assert.equal(g.style.gradient.colorSpace,T.NoColorSpace);g.dispose();
});
test('Near-head suppression follows the deformed center, not obsolete flat coordinates',()=>{
 const scene=new T.Scene(),g=createGarden(scene),path=createPath();scene.scale.setScalar(.0025);scene.position.set(0,1,0);
 g.update({time:0,riderX:1190,xr:true,quiet:true,curved:true});const cloud=g.clouds.group.children[1];
 const local=cloud.position.clone().multiplyScalar(UNIT);const p=path.project(local.toArray());p[0]-=path.sample(1190).x-1190;
 const eye=new T.Vector3(...p).applyMatrix4(scene.matrixWorld).toArray();
 g.update({time:0,riderX:1190,xr:true,quiet:true,curved:true,viewer:eye});assert.equal(cloud.visible,false);
 g.update({time:0,riderX:1190,xr:true,quiet:true,curved:true,viewer:[0,0,8]});assert.equal(cloud.visible,true);g.dispose();
});
test('Common eye observation gives stable coarse LOD and bounded hysteresis',()=>{
 assert(inRange(1100,1000));assert(!inRange(8000,1000));assert(!inRange(NaN,0));
 assert(nearViewer(.99,1));assert(!nearViewer(1.05,1));assert(nearViewer(1.05,1,true));assert(!nearViewer(1.2,1,true));
});
test('Invalid updates preserve existing presentation state',()=>{
 const g=createGarden(new T.Scene());g.update({time:2,riderX:1100});const p=g.clouds.group.children.map(o=>o.position.toArray());
 assert.equal(g.update({time:NaN,riderX:1100}),false);assert.equal(g.update({time:5,riderX:1100,viewer:[1,NaN,2]}),false);
 assert.deepEqual(g.clouds.group.children.map(o=>o.position.toArray()),p);g.dispose();
});
test('Repeated frames do not grow resources and disposal frees only module-owned assets once',()=>{
 const scene=new T.Scene(),old=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicNodeMaterial());scene.add(old);let oldDispose=0;old.geometry.addEventListener('dispose',()=>oldDispose++);
 const g=createGarden(scene);g.update({time:0,riderX:1100});const geometry=new Set(),material=new Set();
 g.group.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)material.add(o.material);});
 const counts=new Map();for(const o of [...geometry,...material,g.style.gradient])o.addEventListener('dispose',()=>counts.set(o,(counts.get(o)||0)+1));
 for(let i=0;i<120;i++)g.update({time:i/60,riderX:1100,xr:true});
 assert.equal(g.stats.clouds.geometryCount,18);assert.equal(g.stats.materials,6);
 g.dispose();g.dispose();assert.equal(g.group.parent,null);assert.equal(old.parent,scene);assert.equal(oldDispose,0);
 assert([...counts.values()].every(n=>n===1));assert.equal(g.stats.materials,0);old.geometry.dispose();old.material.dispose();
});
test('Backdrop meshes have no raycast ownership or loops and never mutate campaign truth',()=>{
 const g=createGarden(new T.Scene());g.group.traverse(o=>{if(o.isMesh){const hits=[];o.raycast({},hits);assert.equal(hits.length,0);}});g.dispose();
 const source=readFileSync(new URL('../currentworks-environment.mjs',import.meta.url),'utf8');
 for(const token of ['requestAnimationFrame(','setInterval(','localStorage','startRoute(','new T.WebGPURenderer','player.x='])assert(!source.includes(token),token);
});
for(const which of ['cloud','island'])test('Actual r177 GLSL builder combines '+which+' Toon ramp with existing curved positions',()=>{
 const before=globalThis.ImageBitmap;globalThis.ImageBitmap=class{};
 try{
  const renderer=new T.WebGPURenderer({canvas:{width:32,height:32},forceWebGL:true});
  const scene=new T.Scene(),g=createGarden(scene);g.update({time:0,riderX:1190,xr:true});
  const warp=createDepthWarp(scene);warp.update(true,1190);const o=which==='cloud'?g.clouds.group.children[1]:g.islands.group.children[1];
  const b=renderer.backend.createNodeBuilder(o,renderer);b.scene=scene;b.camera=new T.PerspectiveCamera();b.build();
  assert(b.vertexShader.includes('texelFetch('));assert(o.material.gradientMap===g.style.gradient);assert(b.fragmentShader.includes('void main'));
  warp.dispose();g.dispose();
 }finally{if(before===undefined)delete globalThis.ImageBitmap;else globalThis.ImageBitmap=before;}
});
