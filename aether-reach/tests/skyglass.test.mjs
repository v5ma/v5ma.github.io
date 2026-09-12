import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {skyglassBudget,makeRiftMaterial,patchCloudShader,installCloudShade} from '../skyglass-shaders.mjs';
import {createState,saveState} from '../model.mjs';
test('Skyglass has explicit desktop, light, disabled and XR rendering budgets',()=>{
 assert.equal(skyglassBudget('prismatic').castLimit,12);assert.equal(skyglassBudget('low').cloudStrength,0);
 assert.equal(skyglassBudget('prismatic',true).castLimit,4);assert.equal(skyglassBudget('prismatic',true).riftMotion,0);
 assert.equal(skyglassBudget('balanced',false,false).cloudStrength,0);
});
test('Rift shimmer is transparent, depth-tested, fog-aware and bounded without extra render passes',()=>{
 const m=makeRiftMaterial();assert.equal(m.depthTest,true);assert.equal(m.depthWrite,false);assert.equal(m.fog,true);assert.equal(m.wireframe,false);
 assert.match(m.fragmentShader,/clamp\(alpha,0\.,\.55\)/);assert.doesNotMatch(m.fragmentShader,/sampler2D|for\s*\(/);m.dispose();
});
test('Cloud shade patches the pinned physical-lighting material without replacing its lighting or texture paths',()=>{
 const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
 const time={value:2},strength={value:.13};patchCloudShader(shader,time,strength);
 assert.equal(shader.uniforms.skyClock,time);assert.match(shader.fragmentShader,/#include <lights_physical_fragment>/);
 assert.match(shader.fragmentShader,/#include <map_fragment>/);assert.match(shader.vertexShader,/#include <project_vertex>/);
 assert.throws(()=>patchCloudShader({uniforms:{},vertexShader:'',fragmentShader:''},time,strength));
});
test('Cloud shade survives late texture replacement, freezes under reduced motion, and leaves saves untouched',()=>{
 const old=new T.MeshStandardMaterial(),deck=new T.Mesh(new T.BoxGeometry(10,1,10),old),s=createState(),before=saveState(s),shade=installCloudShade([deck]);
 assert.notEqual(deck.material,old);const first=deck.material;shade.attach();assert.equal(deck.material,first);
 const late=new T.MeshStandardMaterial({roughness:.96});deck.material=late;shade.attach();assert.notEqual(deck.material,late);assert.equal(deck.material.roughness,.96);
 shade.update(19,{reduced:true});assert.equal(shade.stats().clock,0);shade.update(20,{immersive:true});assert.equal(shade.stats().strength,0);
 shade.setEnabled(false);shade.update(100);assert.equal(shade.stats().strength,0);assert.equal(saveState(s),before);
 shade.dispose();assert.equal(deck.material,late);assert.equal(shade.stats().decks,0);deck.geometry.dispose();late.dispose();old.dispose();
});
