import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from '../vendor/three.module.js';
import {lightOpticsMaterial,prepareCrystal,gemGeometry} from '../jewel-materials.mjs';
test('Light glass retains transparency with a single environment sample and no physical-light or transmission pass',()=>{
 const high=new T.MeshPhysicalMaterial({color:'#d4edf0',transmission:.97});high.userData.opticsRole='glass';const env=new T.DataTexture(),low=lightOpticsMaterial(high,env);
 assert.ok(low.isShaderMaterial&&!low.lights);assert.equal(low.transparent,true);assert.equal(low.depthWrite,false);assert.equal(low.uniforms.env.value,env);assert.equal(low.uniforms.glass.value,1);assert.equal(low.fragmentShader.match(/texture2D/g).length,1);assert.equal(low.userData.opticsHigh,high);assert.equal(high.transmission,.97);
});
test('Shiny low-power materials share the source environment and do not change its color inputs',()=>{
 const m=new T.MeshPhysicalMaterial({color:'#e9c075',metalness:1}),env=new T.DataTexture(),low=lightOpticsMaterial(m,env);assert.equal(low.transparent,false);assert.equal(low.uniforms.metal.value,1);assert.equal(low.depthWrite,true);assert.notEqual(low.uniforms.tint.value,m.color);assert.ok(low.uniforms.tint.value.equals(m.color));
});
test('Replacing the small rectangular postmark clears its old flattened scale so the gemstone has visible volume',()=>{
 const m=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());m.scale.set(.38,.28,.04);m.position.set(2,3,4);const g=gemGeometry(.42),mat=new T.MeshPhysicalMaterial();prepareCrystal(m,g,mat);
 assert.equal(m.geometry,g);assert.equal(m.material,mat);assert.deepEqual(m.scale.toArray(),[1,1,1]);assert.equal(m.position.x,2);assert.equal(m.position.z,4);assert.ok(g.boundingSphere.radius<.6);assert.equal(m.castShadow,false);
});
