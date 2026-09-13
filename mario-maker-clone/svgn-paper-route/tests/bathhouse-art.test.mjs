import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.webgpu.js';
import '../cloudview-assets.js';
import {populate,update,stats} from '../bathhouse-art.js';
import {make,DRAIN_TICKS,RAIL} from '../bathhouse-core.mjs';
const tiles={STEEL:1,START:15,GOAL:8,MAILBOX:63,CHECK:13,GEAR:5,SHIELD:43};
function scene(){
 const parent=new T.Scene(),root=new T.Group();parent.add(root);
 const kit=CloudAssets.create(T),metal=new kit.Batch();
 const engineTypes={...T};delete engineTypes.TSL;
 const m={THREE:engineTypes,makeSingle(g,mat){const o=new T.InstancedMesh(g,mat,1);o.setMatrixAt(0,new T.Matrix4());return o;}};
 const sign=(text,x,y,z,w,h)=>{const o=m.makeSingle(new T.PlaneGeometry(w,h),new T.MeshBasicNodeMaterial());o.position.set(x,y,z);o.userData.text=text;root.add(o);return o;};
 const course=make(tiles),original=JSON.stringify(course);populate({course,m,root,kit,metal,sign});metal.finish(m,root);assert.equal(JSON.stringify(course),original);return {root,parent};
}
test('bathhouse scene construction contains three physical node-water planes',()=>{const {root}=scene(),pools=root.children.filter(o=>o.name==='Tideglass refractive-style water');assert.equal(pools.length,3);for(const o of pools){assert(o.material.normalNode.isNode);assert(o.material.opacityNode.isNode);assert.equal(o.material.positionNode,null);assert.equal(o.material.depthWrite,false);}});
test('pool water planes are behind the collision plane and above their basin floors',()=>{const {root}=scene();const water=root.children.filter(o=>o.name==='Tideglass refractive-style water');assert(water.every(o=>o.position.z+o.geometry.parameters.height/2<-100&&o.position.y>-2315));});
test('no continuous pool-spanning surface occludes the basins',()=>{const {root}=scene();const walking=root.children.filter(o=>o.name==='Wet tiled promenade');assert.equal(walking.length,1);assert.equal(walking[0].geometry.parameters.height,175);});
test('new geometries have only finite positions and valid bounds',()=>{const {root}=scene();let checked=0;root.traverse(o=>{if(o.geometry){assert([...o.geometry.attributes.position.array].every(Number.isFinite));o.geometry.computeBoundingSphere();assert(Number.isFinite(o.geometry.boundingSphere.radius));checked++;}});assert(checked>35);});
test('drain moves only scenic water and sluice and reveals the matching rail',()=>{const {root}=scene();const gate=root.getObjectByName('Mirror Pool lifting sluice'),rail=root.getObjectByName('Revealed waterline deck'),water=root.children.filter(o=>o.name==='Tideglass refractive-style water');const y=water.map(o=>o.position.y),gy=gate.position.y;update({drain:0},0);assert(!rail.visible);update({drain:DRAIN_TICKS},150);assert(rail.visible);assert.equal(water[1].position.y,y[1]-128);assert.equal(water[0].position.y,y[0]);assert.equal(water[2].position.y,y[2]);assert.equal(gate.position.y,gy+174);});
test('draw counters identify visible water, tiles and portal materials',()=>{const {root}=scene();for(const o of root.children)if(o.geometry)o.onAfterRender();const s=stats();assert.equal(s.waterDraws,3);assert.equal(s.portalDraws,2);assert(s.tileDraws>20);});
test('all owned mesh resources remain under the disposable scene root',()=>{const {root}=scene();let meshes=0,geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry){meshes++;geometries.add(o.geometry);materials.add(o.material);}});assert(meshes>30);let g=0,m=0;for(const x of geometries){x.addEventListener('dispose',()=>g++);x.dispose();}for(const x of materials){x.addEventListener('dispose',()=>m++);x.dispose();}assert.equal(g,geometries.size);assert.equal(m,materials.size);});

test('raised Mirror Pool has retaining walls above its initial waterline',()=>{const {root}=scene();const water=root.children.filter(o=>o.name==='Tideglass refractive-style water')[1],glass=root.getObjectByName('Raised pool retaining glass');assert(glass);assert(glass.position.y+glass.geometry.parameters.height/2>water.position.y);assert(root.getObjectByName('Raised pool rear retaining wall'));});
