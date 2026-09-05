import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from '../mario-maker-clone/svgn-paper-route/vendor/three.module.js';
const ctx={};vm.createContext(ctx);vm.runInContext(readFileSync(new URL('../mario-maker-clone/svgn-paper-route/cloudview-chunks.js',import.meta.url),'utf8'),ctx);
test('Spatial culling retains every triangle and its color, normal and UV data',()=>{
  const p=[],n=[],c=[],uv=[];
  for(let i=0;i<25;i++){for(const a of[[0,0,0],[2,0,0],[1,3,0]]){p.push(a[0]+i*400,a[1],i%2*-900);n.push(0,0,1);c.push(i/25,.3,.8);uv.push(i/25,.4);}}
  const g=new T.BufferGeometry();for(const [key,array,size]of[['position',p,3],['normal',n,3],['color',c,3],['uv',uv,2]])g.setAttribute(key,new T.Float32BufferAttribute(array,size));
  const chunks=Array.from(ctx.CloudDepthChunks.split(T,g));assert.ok(chunks.length>1);
  assert.equal(chunks.reduce((s,v)=>s+v.geometry.attributes.position.count,0),75);
  const tuples=a=>{const r=[];for(let i=0;i<a.attributes.position.count;i++)r.push(['position','normal','color','uv'].flatMap(k=>{const x=a.attributes[k];return Array.from(x.array.slice(i*x.itemSize,(i+1)*x.itemSize));}).join(','));return r;};
  assert.deepEqual(chunks.flatMap(x=>tuples(x.geometry)).sort(),tuples(g).sort());
  for(const chunk of chunks){assert.ok(Number.isFinite(chunk.geometry.boundingSphere.radius));chunk.geometry.dispose();}g.dispose();
});
