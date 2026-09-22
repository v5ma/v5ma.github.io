/* CPU scene-graph fixture with a synthetic canvas. Not browser/headset evidence. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createVaultArt} from '../vault-art.mjs';
import {vaultState,vaultHint} from '../vault-core.mjs';
import {VAULT_NODES} from '../vault-data.mjs';
function scene(t){
 const old=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{},set:()=>true})})}});
 t.after(()=>{if(old)Object.defineProperty(globalThis,'document',old);else delete globalThis.document;});
 const root=new T.Group(),art=createVaultArt(root),group=root.children[0],camera=new T.PerspectiveCamera();
 const labelAt=(x,z)=>group.children.find(o=>o.geometry?.type==='PlaneGeometry'&&o.position.x===x&&o.position.z===z);
 return {art,camera,labelAt};
}
test('Approaching a survey control clears its oversized label without hiding the actionable prompt',t=>{
 const {art,camera,labelAt}=scene(t);
 for(const node of VAULT_NODES){
  const s={x:node.x,z:node.z,mode:'foot',speed:0,lift:0,frontier:{zone:'badlands'},vault:vaultState()};
  art.update(s,camera);assert.equal(labelAt(node.x,node.z).visible,false,node.id+' must not place its banner through the first-person head');
  assert.ok(vaultHint(s).includes(node.name));
  s.z+=4;art.update(s,camera);assert.equal(labelAt(node.x,node.z).visible,true,node.id+' remains legible on approach');
  s.z+=8;art.update(s,camera);assert.equal(labelAt(node.x,node.z).visible,false,node.id+' is culled at distance');
 }
});
test('The survey approach and doorway signs also clear at close range',t=>{
 const {art,camera,labelAt}=scene(t),s={x:310,z:23,vault:vaultState()};
 art.update(s,camera);assert.equal(labelAt(310,23).visible,false);
 s.x=326.7;s.z=25;art.update(s,camera);assert.equal(labelAt(326.7,25).visible,false);
 s.x=321;art.update(s,camera);assert.equal(labelAt(326.7,25).visible,true);
});
