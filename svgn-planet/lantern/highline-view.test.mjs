import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {addHighlineStair,createHighlineView} from './highline-view.mjs';
import {HIGHLINE_FLOORS,HIGHLINE_WALLS} from './highline-layout.mjs';
import {fresh,floorHeight} from './core.mjs';

test('Actual Three stair instances agree with their shared support slope and use bounded draw groups',()=>{
 const group=new T.Group(),f=HIGHLINE_FLOORS.find(f=>f.stairs),materials=new Map();
 const material=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c}));return materials.get(c);};
 addHighlineStair(group,f,material,floorHeight);assert.equal(group.children.length,2);const treads=group.children[0];assert.ok(treads.isInstancedMesh);assert.equal(treads.count,16);
 const matrix=new T.Matrix4(),position=new T.Vector3();for(let i=0;i<treads.count;i++){treads.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);assert.ok(Math.abs(position.y+.13-floorHeight(f,position.z))<1e-5);}
});
test('Actual Three upper windows inherit real wall cutaways and relay feedback comes from saved progress',()=>{
 const world=new T.Group(),wallMeshes=HIGHLINE_WALLS.map(w=>{const m=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:w.color}));world.add(m);return {w,m};});
 const box=(g,c,x,y,z,w,h,d)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c}));m.position.set(x,y,z);g.add(m);return m;};
 const label=(text,x,y,z,w,h,bg,c,g)=>box(g,0xffffff,x,y,z,w,h,.01); // No DOM or GPU is claimed by this object fixture.
 const view=createHighlineView({world,wallMeshes,box,cyl:(g,c,x,y,z,r,h)=>box(g,c,x,y,z,r*2,h,r*2),label});
 assert.ok(view.inspect().windows>40);const facade=wallMeshes.find(v=>v.w.id==='highline-print-front');assert.ok(facade.m.children[0].isInstancedMesh);facade.m.visible=false;assert.equal(facade.m.children[0].parent.visible,false);
 const s=fresh();view.update(s);assert.equal(view.inspect().repeaterRestored,false);s.campaign.progress.highline=4;view.update(s);assert.equal(view.inspect().repeaterRestored,true);assert.equal(view.inspect().forcedCamera,false);
});
