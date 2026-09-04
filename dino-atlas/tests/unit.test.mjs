import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DINOS,PERIODS,PATCHES,STORAGE_KEY,emptyProgress,sanitizeProgress,readProgress,writeProgress,addDiscovery,brushPatch,digPercent,journalText,escapeHTML,inPeriod} from '../core.js';
import {buildWorld} from '../world.js';
import {dinosaurArt,landscapeArt} from '../art.js';
test('Six unique animals are assigned to three distinct periods',()=>{
  assert.equal(DINOS.length,6);assert.equal(new Set(DINOS.map(d=>d.id)).size,6);
  for(const period of PERIODS){assert.equal(inPeriod(period.id).length,2);assert.ok(period.start>period.stop&&period.stop>period.end);}
  for(const d of DINOS){assert.ok(d.correct>=0&&d.correct<d.answers.length);assert.ok(d.source.startsWith('https://www.nhm.ac.uk/'));assert.ok(d.evidence&&d.inference&&d.unknown);}
});
test('Unknown or incompatible saved data becomes a clean journal',()=>{
  for(const value of [null,{},[],false,{version:2,observed:['diplodocus']}])assert.deepEqual(sanitizeProgress(value),emptyProgress());
});
test('Saved entries are deduplicated, whitelisted, bounded, and sanitized',()=>{
  const p=sanitizeProgress({version:1,observed:['diplodocus','diplodocus','bad',3],excavated:'bad',notes:{diplodocus:'a'.repeat(900),other:'no'},digs:{diplodocus:Array(48).fill(99),stegosaurus:Array(48).fill(NaN)}});
  assert.deepEqual(p.observed,['diplodocus']);assert.equal(p.notes.diplodocus.length,400);assert.equal(p.notes.other,undefined);assert.ok(p.digs.diplodocus.every(n=>n===2));assert.ok(p.digs.stegosaurus.every(n=>n===0));
});
test('Discoveries are awarded once and invalid identifiers cannot be inserted',()=>{
  const p=emptyProgress();assert.equal(addDiscovery(p,'observed','diplodocus'),true);assert.equal(addDiscovery(p,'observed','diplodocus'),false);assert.equal(addDiscovery(p,'bad','diplodocus'),false);assert.equal(addDiscovery(p,'observed','fake'),false);assert.equal(p.observed.length,1);
});
test('A dig needs two passes across every patch; completion records the animal once',()=>{
  const p=emptyProgress();for(let i=0;i<PATCHES;i++)brushPatch(p,'stegosaurus',i);
  assert.equal(digPercent(p,'stegosaurus'),50);assert.equal(p.excavated.length,0);
  for(let i=0;i<PATCHES;i++)brushPatch(p,'stegosaurus',i);
  assert.equal(digPercent(p,'stegosaurus'),100);assert.deepEqual(p.excavated,['stegosaurus']);assert.deepEqual(p.observed,['stegosaurus']);
  for(let i=0;i<PATCHES;i++)brushPatch(p,'stegosaurus',i);assert.equal(p.excavated.length,1);assert.equal(digPercent(p,'stegosaurus'),100);
});
test('Invalid brush positions do not change a journal',()=>{
  const p=emptyProgress();for(const i of [-1,48,1.5,NaN,'2'])assert.equal(brushPatch(p,'diplodocus',i),false);assert.equal(brushPatch(p,'unknown',0),false);assert.deepEqual(p,emptyProgress());
});
test('Storage round trips and quota failures are handled',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};const p=emptyProgress();addDiscovery(p,'observed','triceratops');
  assert.equal(writeProgress(storage,p),true);assert.equal(map.has(STORAGE_KEY),true);assert.deepEqual(readProgress(storage).progress,p);
  assert.equal(writeProgress({setItem(){throw Error('Quota exceeded');}},p),false);assert.equal(readProgress(null).available,false);
  map.set(STORAGE_KEY,'not json');assert.deepEqual(readProgress(storage).progress,emptyProgress());
});
test('HTML escaping protects journal notes and text export stays plain text',()=>{
  const text='<img src=x onerror="alert(1)">&\'';assert.equal(escapeHTML(text),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
  const p=emptyProgress();p.notes.diplodocus=text;assert.ok(journalText(p).includes(text));assert.ok(journalText(p).includes('Diplodocus'));assert.ok(!journalText(p).includes('Tyrannosaurus rex'));
});
test('All six procedural 3D models contain finite position and color triangles',()=>{
  for(const d of DINOS){const vertices=buildWorld(d);assert.ok(vertices instanceof Float32Array);assert.ok(vertices.length>1000);assert.equal(vertices.length%18,0);assert.ok(vertices.every(Number.isFinite));for(let i=0;i<vertices.length;i++)if(i%6>=3)assert.ok(vertices[i]>=0&&vertices[i]<=1);}
});
test('Each animal has accessible original illustration and fossil views',()=>{
  for(const d of DINOS){assert.ok(dinosaurArt(d).includes('aria-label="Stylized illustration of '+d.name));assert.ok(dinosaurArt(d,true).includes('Simplified skeleton illustration'));assert.ok(landscapeArt(d).includes('Illustrated field view'));}
});
