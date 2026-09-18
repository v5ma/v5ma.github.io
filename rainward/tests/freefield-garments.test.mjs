import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {finishBodyMaterial} from '../rainworn-humans.mjs';
test('Retained body surfaces receive distinct rainwear, trousers and boots without changing source materials',()=>{
 const fabric=new T.DataTexture(new Uint8Array([220,220,220,255]),1,1),materials=[];
 for(const [name,color]of [['jacket',0x78816a],['trousers',0x3d4748],['boots',0x252c2b]]){
  const source=new T.MeshStandardMaterial({color:0x999999,roughness:.4});source.name=name;
  const result=finishBodyMaterial(source,{enemy:false},fabric);materials.push(source,result);
  assert.notEqual(result,source);assert.equal(source.color.getHex(),0x999999);assert.equal(source.map,null);
  assert.equal(result.color.getHex(),color);assert.ok(result.roughness>=.8);assert.equal(result.map,name==='boots'?null:fabric);
 }
 materials.forEach(m=>m.dispose());fabric.dispose();
});
test('The material correction does not replace the face texture, skin tint or normal map',()=>{
 const texture=new T.DataTexture(new Uint8Array([210,180,150,255]),1,1),source=new T.MeshStandardMaterial({color:0xba9876,map:texture,normalMap:texture,roughness:.73});source.name='skin';source.normalScale.set(.52,.52);
 const result=finishBodyMaterial(source,{enemy:false},null);assert.equal(result.map,texture);assert.equal(result.normalMap,texture);assert.equal(result.color.getHex(),source.color.getHex());assert.deepEqual(result.normalScale,source.normalScale);assert.equal(result.roughness,source.roughness);
 result.dispose();source.dispose();texture.dispose();
});
test('Existing role colors distinguish patrol rainwear without adding outfits or geometry',()=>{
 const m=new T.MeshStandardMaterial();m.name='jacket';const a=finishBodyMaterial(m,{enemy:true,role:'raider'},null),b=finishBodyMaterial(m,{enemy:true,role:'marksman'},null);assert.notEqual(a.color.getHex(),b.color.getHex());a.dispose();b.dispose();m.dispose();
});
