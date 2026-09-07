import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const runtime=['app.mjs','glide.mjs','flight-ui.mjs','model.mjs','scene.mjs','input-core.mjs','controllers.mjs','xr-session.mjs'];
test('Runtime imports stay in the public project without private/network/test loaders',()=>{
 for(const file of runtime){const s=read(file);for(const m of s.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){assert.ok(m[1].startsWith('./'),file+': '+m[1]);assert.ok(!m[1].includes('..'));assert.ok(!m[1].includes('tests/'));assert.ok(fs.existsSync(path.join(dir,m[1])));}assert.doesNotMatch(s,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);assert.doesNotMatch(s,/document\.cookie|\.sendBeacon\(/);}
});
test('All direct game script, stylesheet and image references resolve in the public game folder',()=>{
 const html=read('index.html');for(const m of html.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g)){assert.ok(m[1].startsWith('./'),m[1]);assert.ok(fs.existsSync(path.join(dir,m[1])));}assert.match(read('vendor/LICENSE'),/MIT License/);
});
test('The public homepage retains all four project entries',()=>{
 const html=fs.readFileSync(path.join(dir,'../index.html'),'utf8');for(const route of ['aether-reach/index.html','mario-maker-clone/svgn-paper-route/index.html','theology-wiki/san-reader.html','dino-atlas/index.html'])assert.ok(html.includes('class="primary-link" href="./'+route+'"'),route);
});
test('The game and roadmap have separate namespaced local persistence',()=>{
 const app=read('app.mjs');assert.match(app,/SAVE='aether-reach\.expedition\.v1'/);assert.match(app,/SETTINGS='aether-reach\.settings\.v1'/);assert.doesNotMatch(app,/localStorage\.clear\(/);const model=read('model.mjs');assert.match(model,/JSON\.stringify\(\{version:1,relays:/);assert.match(model,/checkpoint:s\.checkpoint/);const board=read('roadmap.mjs');assert.match(board,/key='aether-reach\.roadmap\.v1'/);assert.doesNotMatch(board,/localStorage\.clear\(|\.expedition\.v1/);
});
