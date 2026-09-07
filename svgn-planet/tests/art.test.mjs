import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {mesh,batchStatic,road,mailbox} from '../art.mjs';
import {at,WORLD} from '../model.mjs';
test('Static batching preserves transformed tree positions, shapes and materials',()=>{
 const scene=new T.Scene(),group=new T.Group();scene.add(group);group.position.set(2,3,4);group.rotation.z=.2;
 for(let i=0;i<12;i++)mesh(group,'cone','#238d61',[i*.7,2,Math.sin(i)],[.8,1.7,.9],[.1,i*.3,0]);
 scene.updateMatrixWorld(true);const before=group.children.map(o=>o.matrixWorld.clone());batchStatic(group);scene.updateMatrixWorld(true);assert.equal(group.children.length,1);const m=group.children[0];assert.equal(m.count,12);
 for(let i=0;i<12;i++){const got=new T.Matrix4();m.getMatrixAt(i,got);got.premultiply(m.matrixWorld);got.elements.forEach((n,j)=>assert.ok(Math.abs(n-before[i].elements[j])<1e-5));}
});
test('Curved road fronts face away from the planet rather than lighting their underside',()=>{
 const scene=new T.Scene(),r=road(scene,[at(-3,0),at(0,0),at(3,0)],1,'#e4c782'),p=r.geometry.attributes.position;
 for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);assert.ok(b.sub(a).cross(c.sub(a)).dot(a)>0);}
});
test('Mailbox delivery flags have independent materials',()=>{const scene=new T.Scene(),a=mailbox(scene,WORLD.sites[1]),b=mailbox(scene,WORLD.sites[2]);assert.notEqual(a.flag.material,b.flag.material);const col=b.flag.material.color.getHex();a.flag.material.color.set('#70c5a4');assert.equal(b.flag.material.color.getHex(),col);});
