import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.webgpu.js';
import {PROFILE,depth,accepts,createPath} from '../depth-path-core.mjs';
import {createDepthWarp} from '../depth-path.mjs';
import {build} from '../waterwheel-layout-core.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{T:tiles}=require('../../../tests/helpers/flow-fixture.cjs');
const p=createPath(),near=(a,b,t=1e-4)=>assert(Math.abs(a-b)<t,`${a} != ${b}`);
test('Only the explicit versioned profile enables curved presentation',()=>{assert(accepts({version:1,id:PROFILE.id}));for(const v of [undefined,null,{}, {version:2,id:PROFILE.id},{version:1,id:'unknown'}])assert(!accepts(v));});
test('The new path goes away and returns toward the viewer without changing up',()=>{near(p.sample(1190).z,-100,.01);near(p.sample(2290).z,100,.01);near(p.sample(3500).z,0);for(let s=0;s<9300;s+=17){near(p.project([s,42,0])[1],42);assert(p.sample(s).tx>.92);}});
test('Horizontal coordinate is distance, not a nonuniform spline parameter',()=>{for(let s=0;s<9300;s+=.5){const a=p.sample(s),b=p.sample(s+.5);near(Math.hypot(b.x-a.x,b.z-a.z),.5,.00004);near(Math.hypot(a.tx,a.tz),1);}});
test('Bends are finite and smooth into a straight entry and exit',()=>{for(const s of [PROFILE.start,PROFILE.end]){near(depth(s).dz,0);near(depth(s).z,0);const a=p.sample(s-1),b=p.sample(s+1);assert(Math.abs(a.tz-b.tz)<.0002);}for(const s of [-100,10000])assert(Number.isFinite(p.sample(s).x));assert.throws(()=>p.sample(NaN));assert.throws(()=>p.project([1,2,Infinity]));});
test('Rigid actor mapping preserves distances through either depth bend',()=>{for(const s of [700,980,1300,1980,2360,2700]){const a=[s-12,-50,10],b=[s+25,-15,35],x=p.rigid(a,[s,22]),y=p.rigid(b,[s,22]);near(Math.hypot(...x.map((v,i)=>v-y[i])),Math.hypot(...a.map((v,i)=>v-b[i])),1e-8);}});
test('Surface thickness never folds distant scenery into the gameplay corridor',()=>{for(let s=600;s<2900;s+=5)for(const d of [-2400,-180,-43,0,43,180,1200]){const a=p.project([s-.1,0,d]),b=p.project([s+.1,0,d]),c=p.project([s,0,d-.1]),e=p.project([s,0,d+.1]);const det=((b[0]-a[0])*(e[2]-c[2])-(b[2]-a[2])*(e[0]-c[0]))/.04;assert(det>.5&&det<1.5,`${s}/${d}/${det}`);}});
test('Arc table fits the minimum 4096-pixel texture limit with bounded finite entries',()=>{assert(PROFILE.samples<4096);assert(p.data.every(Number.isFinite));assert.equal(p.data.length,4*PROFILE.samples);});
test('Adding optional metadata never changes the road, rails or delivery contract',()=>{const original=build(tiles),candidate=build(tiles);candidate.gp.waterwheel.depthPath={version:1,id:PROFILE.id};delete candidate.gp.waterwheel.depthPath;assert.deepEqual(candidate,original);assert.equal(original.quota,0);assert.equal(original.boxes.length,12);});
test('Warp touches render fields only and restores classic and node material ownership',()=>{
 const scene=new T.Scene(),materials=[new T.MeshStandardNodeMaterial(),new T.MeshStandardMaterial()];
 const meshes=materials.map(m=>new T.Mesh(new T.BoxGeometry(1,1,1),m));meshes.forEach(m=>scene.add(m));
 const prior=materials.map(m=>({position:m.positionNode,normal:m.normalNode,ownP:Object.hasOwn(m,'positionNode'),ownN:Object.hasOwn(m,'normalNode')}));
 const mask=T.TSL.bool(true);materials[0].maskNode=mask;const warp=createDepthWarp(scene);
 warp.update(true,1100);assert.equal(warp.diagnostics.materials,2);assert(meshes.every(m=>!m.frustumCulled));assert(materials.every(m=>m.positionNode.isNode));assert(materials.every((m,i)=>m.normalNode===prior[i].normal));assert.equal(materials[0].maskNode,mask);
 warp.update(false);for(let i=0;i<2;i++){assert.equal(materials[i].positionNode,prior[i].position);assert.equal(materials[i].normalNode,prior[i].normal);assert.equal(Object.hasOwn(materials[i],'positionNode'),prior[i].ownP);assert.equal(Object.hasOwn(materials[i],'normalNode'),prior[i].ownN);assert(meshes[i].frustumCulled);}
 warp.dispose();materials.forEach(m=>m.dispose());meshes.forEach(m=>m.geometry.dispose());
});
test('Removed materials and newer hook owners are preserved on cleanup',()=>{
 const scene=new T.Scene(),m=new T.MeshBasicNodeMaterial(),mesh=new T.Mesh(new T.BoxGeometry(),m);scene.add(mesh);const warp=createDepthWarp(scene);warp.update(true);const newer=T.TSL.vec3(3);m.positionNode=newer;scene.remove(mesh);warp.update(true);assert.equal(warp.diagnostics.materials,0);assert.equal(m.positionNode,newer);assert(mesh.frustumCulled);warp.dispose();m.dispose();mesh.geometry.dispose();
});
