/* Controlled real-Three lifecycle fixtures; not browser or hardware acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createCurrentworks} from '../currentworks-view.mjs';

function fixture(){
 const scene=new T.Scene(),sun=new T.DirectionalLight(),fallback=new T.Group();
 const sky=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial());
 sky.name='Unrelated async sky loader';scene.add(sun,sky,fallback);
 const fx=createCurrentworks({scene,patches:new Map(),foliageFallback:fallback});
 return {scene,sun,sky,fx,root:scene.getObjectByName('Aether Currentworks environment')};
}
function materialsOf(object){
 const values=new Set();object.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])values.add(m);});
 return values;
}
test('Async environment preparation cannot poll a sky material disposed by an independent loader',async()=>{
 const f=fixture(),camera=new T.PerspectiveCamera(),calls=[];let skyDisposals=0;
 try{
  await f.fx.prepare({compileAsync:async(object,eye,target)=>{
   calls.push({object,eye,target});
   // Mirrors r177 program-property removal on material disposal. The sky
   // replacement occurs after compilation takes its material set.
   const materials=materialsOf(object),programs=new Map();
   for(const material of materials){
    programs.set(material,{isReady:()=>true});
    material.addEventListener('dispose',()=>programs.delete(material));
   }
   if(object===f.root||object===f.scene){
    const old=f.sky.material;f.sky.material=new T.MeshBasicMaterial();
    old.dispose();skyDisposals++;
   }
   await Promise.resolve();
   for(const material of materials)programs.get(material).isReady();
  }},camera);
  assert.equal(skyDisposals,1,'The independent sky replacement was exercised');
  assert.equal(f.fx.stats().error,null);
  assert.equal(f.fx.stats().ready,true);
  const hostCall=calls.find(c=>c.object===f.root);
  assert(hostCall,'Compile only the owned environment group');
  assert.equal(hostCall.eye,camera);
  assert.equal(hostCall.target,f.scene,'Retain real host lighting/environment');
  assert(!calls.some(c=>c.object===f.scene),'Never compile the mutable host scene');
 }finally{f.fx.dispose();f.sky.geometry.dispose();f.sky.material.dispose();}
});
test('Synchronous fallback also uses owned objects with the host lighting scene',async()=>{
 const f=fixture(),camera=new T.PerspectiveCamera(),calls=[];
 try{
  await f.fx.prepare({compile:(object,eye,target)=>calls.push({object,eye,target})},camera);
  assert.equal(f.fx.stats().ready,true);
  assert(calls.some(c=>c.object===f.root&&c.eye===camera&&c.target===f.scene));
  assert(!calls.some(c=>c.object===f.scene));
  assert.equal(f.sun.parent,f.scene);assert.equal(f.sky.parent,f.scene);
 }finally{f.fx.dispose();f.sky.geometry.dispose();f.sky.material.dispose();}
});
