import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from '../vendor/three.module.js';
import {worldTexturing,reducedWorldTexturing} from '../surface-work.mjs';import {graphicsPreset} from '../graphics.mjs';
test('Reduced projection computes world scale before interpolation and uses one color lookup',()=>{
 const m=reducedWorldTexturing(new T.MeshLambertMaterial(),2.4),shader={vertexShader:'#include <project_vertex>',fragmentShader:'#include <map_fragment>'};m.onBeforeCompile(shader);
 assert.match(shader.vertexShader,/rwWorld=.*2.400/);assert.match(shader.vertexShader,/instanceMatrix/);assert.equal((shader.fragmentShader.match(/texture2D/g)||[]).length,1);assert.ok(!shader.fragmentShader.includes('dFdx'));assert.ok(!shader.fragmentShader.includes('pow('));assert.equal(m.userData.surfaceTier,'single-projection');
});
test('Reduced map sampling never mutates the full-quality texture or geometry',()=>{
 const scene=new T.Scene(),map=new T.Texture();map.anisotropy=4;const material=worldTexturing(new T.MeshStandardMaterial({map}),2.4),mesh=new T.Mesh(new T.BoxGeometry(),material);scene.add(mesh);
 const g=graphicsPreset(scene,{shadowMap:{enabled:true},setPixelRatio(){}}),geometry=mesh.geometry;
 g.set(true);assert.notEqual(mesh.material.map,map);assert.equal(mesh.material.map.anisotropy,1);assert.equal(map.anisotropy,4);assert.equal(mesh.geometry,geometry);assert.equal(mesh.material.userData.surfaceTier,'single-projection');
 material.color.setHex(0xffaa22);material.emissive.setHex(0x552200);g.update();assert.equal(mesh.material.color.getHex(),material.color.getHex());assert.equal(mesh.material.emissive.getHex(),material.emissive.getHex());g.set(false);assert.equal(mesh.material,material);assert.equal(mesh.material.map,map);g.dispose();
});
