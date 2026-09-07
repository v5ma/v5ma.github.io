import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';import * as T from '../vendor/three.module.js';import {ribbonUV} from '../street-art.mjs';import {road} from '../art.mjs';import {street} from '../world.mjs';
const root=new URL('../assets/street-art/',import.meta.url);const g=JSON.parse(readFileSync(new URL('street-art.gltf',root)));
test('The curated glTF library has 27 original Standard model roots, one valid buffer and only local files',()=>{
 assert.equal(g.scenes[0].nodes.length,27);assert.equal(g.buffers.length,1);assert.equal(readFileSync(new URL(g.buffers[0].uri,root)).length,g.buffers[0].byteLength);
 for(const im of g.images){assert.ok(!im.uri.includes('..')&&!im.uri.includes(':'));assert.ok(readFileSync(new URL(im.uri,root)).length>100);}
 for(const b of g.bufferViews)assert.ok(b.byteOffset+b.byteLength<=g.buffers[0].byteLength);
});
test('The asset register retains source CC0 licenses and the exact curated material files',()=>{
 const r=JSON.parse(readFileSync(new URL('asset-register.json',root)));assert.ok(r.sources.filter(s=>s.type==='pack').every(s=>s.license==='CC0-1.0'&&s.edition==='Standard'));
 for(const s of r.sources){if(s.type==='texture')assert.equal(createHash('sha256').update(readFileSync(new URL(s.output,root))).digest('hex'),s.sha256);if(s.type==='material')for(const f of s.files)assert.equal(createHash('sha256').update(readFileSync(new URL(f.file,root))).digest('hex'),f.sha256);}
});
test('Road UVs use meter-scaled coordinates without changing a single collision or geometry position',()=>{
 const points=[street(0),street(3),street(6)],m=road(new T.Group(),points,6.4,'#777777');const before=[...m.geometry.attributes.position.array];ribbonUV(m.geometry,points,6.4,3);assert.deepEqual([...m.geometry.attributes.position.array],before);const uv=m.geometry.attributes.uv;assert.equal(uv.count,m.geometry.attributes.position.count);assert.ok(Math.abs(uv.getY(7)-2)<.001);assert.ok(Math.abs(uv.getX(2)-6.4/3)<.001);
});
