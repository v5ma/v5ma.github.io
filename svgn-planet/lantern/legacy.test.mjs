import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SAVE_KEY} from './core.mjs';
const base=new URL('../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('legacy-layout.json',base),'utf8'));
test('Legacy geometry, game modules, assets and entry match the archived layout',()=>{assert.ok(manifest.files.length>50);for(const f of manifest.files){const actual=createHash('sha256').update(readFileSync(new URL(f.path,base))).digest('hex');assert.equal(actual,f.sha256,f.path);}});
test('New chapter storage is never the original save identity',()=>{assert.notEqual(SAVE_KEY,'svgn.paper-delivery-3d.v1');assert.notEqual(SAVE_KEY,'svgn.little-planet.v1');});
test('New entry preserves explicit access to the original game',()=>{const entry=readFileSync(new URL('index.html',base),'utf8'),chapter=readFileSync(new URL('lantern-ward.html',base),'utf8');assert.ok(entry.includes('lantern-ward.html'));assert.ok(entry.includes('legacy.html'));assert.ok(chapter.includes('href="./legacy.html"'));});
