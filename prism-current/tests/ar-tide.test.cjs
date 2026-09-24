'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs');
const I=require('../modules/environment/islands'),O=require('../modules/environment/water-optics'),R=require('../river/rotunda');
test('Island descriptions reject duplicate ids and copy stable placements',()=>{
 const p=Object.freeze([1,2,3]),d=I.descriptors([{id:'a',seed:17,position:p}])[0];A.deepEqual(d.position,p);A.notEqual(d.position,p);A.equal(d.seed,17);
 A.throws(()=>I.descriptors([{id:'a',position:p},{id:'a',position:p}]),TypeError);A.throws(()=>I.descriptors(Array(9).fill({})),RangeError);
 for(const position of [[NaN,0,0],[0,0],null])A.throws(()=>I.descriptors([{id:1,position}]),TypeError);
});
test('Island data is deterministic, bounded and fully triangulated',()=>{
 const d=I.descriptors([{id:1,position:[0,0,0],radius:.95,depth:.7}])[0],x=I.data(d);A.deepEqual(x,I.data(d));A.notDeepEqual(x,I.data({...d,seed:20}));
 A.equal(x.indices.length/3,200);A.ok(x.positions.every(Number.isFinite));A.ok(x.indices.every(i=>i>=0&&i<x.positions.length/3));
 for(let i=0;i<x.positions.length;i+=3)A.ok(Math.hypot(x.positions[i],x.positions[i+2])<=.95+1e-10);
 A.deepEqual(x.socket,[0,.08,0]);
});
test('Optics requires the actual water surface and has explicit ownership',()=>{
 A.throws(()=>O.attach({},{}),TypeError);const s=fs.readFileSync(__dirname+'/../modules/environment/water-optics.js','utf8');
 A.match(s,/material.fragmentShader=old/);A.doesNotMatch(s,/localStorage|requestAnimationFrame|new T\.Texture/);
});
test('AR scenery preferences migrate without replacing opacity or health records',()=>{
 A.equal(R.preferences(null).arScenery,'islands');A.equal(R.preferences('{"arScenery":"minimal","opacity":0.23}').arScenery,'minimal');
 A.equal(R.preferences('{"arScenery":"garbage"}').arScenery,'islands');A.equal(R.preferences('{"opacity":0.23}').opacity,.23);
});
test('AR scene geometry and scripts are explicit and independent of core mechanics',()=>{
 const html=fs.readFileSync(__dirname+'/../index.html','utf8'),code=fs.readFileSync(__dirname+'/../river/ar-islands.js','utf8');
 for(const name of ['toon','cloudlets','islands','water-optics'])A.ok(html.indexOf('/'+name+'.js')<html.indexOf('/ar-islands.js'));
 A.ok(html.indexOf('/bank-trees.js')<html.indexOf('/ar-islands.js'));
 A.doesNotMatch(code,/\.health\s*=|\.score\s*=|\.time\s*=|camera\.position\.(set|copy)|localStorage|requestAnimationFrame/);
});
test('Island footprint conservatively clears the established central approach',()=>{
 const art=require('../river/ar-islands');for(const d of art.ISLANDS)A.ok(Math.abs(d.position[0])-d.radius>3.5);
});
test('Explicit island and optics ES facades reuse the exact implementations',async()=>{
 A.equal((await import('../modules/environment/islands.mjs')).default,I);A.equal((await import('../modules/environment/water-optics.mjs')).default,O);
});
