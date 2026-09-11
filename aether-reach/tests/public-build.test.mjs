import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const runtime=['controller-profile.mjs','ui-navigation.mjs','rooftop-world.mjs','climbing.mjs','expedition-world.mjs','expedition-core.mjs','expedition-ui.mjs','expedition-scene.mjs','app.mjs','glide.mjs','flight-ui.mjs','model.mjs','scene.mjs','input-core.mjs','controllers.mjs','xr-session.mjs','tactics-core.mjs','tactics-ui.mjs','tactics-scene.mjs','luminous-art.mjs','luminous-gear.mjs','visual-settings.mjs'];
test('Runtime imports stay in the public project without private/network/test loaders',()=>{
 for(const file of runtime){const s=read(file);for(const m of s.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){assert.ok(m[1].startsWith('./'),file+': '+m[1]);assert.ok(!m[1].includes('..'));assert.ok(!m[1].includes('tests/'));assert.ok(fs.existsSync(path.join(dir,m[1])));}assert.doesNotMatch(s,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);assert.doesNotMatch(s,/document\.cookie|\.sendBeacon\(/);}
});
test('All direct game script, stylesheet and image references resolve in the public game folder',()=>{
 const html=read('index.html');for(const m of html.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g)){assert.ok(m[1].startsWith('./'),m[1]);assert.ok(fs.existsSync(path.join(dir,m[1])));}assert.match(read('vendor/LICENSE'),/MIT License/);
});
// Compare destinations, not serialized attribute order or cache-busting queries.
// Other games can publish versioned links without breaking Aether's release checks.
function primaryDestinations(html){
 const base=new URL('https://v5ma.github.io/'),destinations=new Set();
 for(const match of html.matchAll(/<a\b[^>]*>/gi)){
  const tag=match[0],classes=tag.match(/\bclass\s*=\s*(["'])(.*?)\1/i)?.[2]?.split(/\s+/)||[];
  const href=tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
  if(!classes.includes('primary-link')||!href)continue;
  const url=new URL(href.replaceAll('&amp;','&'),base);
  if(url.origin===base.origin)destinations.add(url.pathname);
 }
 return destinations;
}
test('The public homepage retains all four project destinations, including versioned launch links',()=>{
 const html=fs.readFileSync(path.join(dir,'../index.html'),'utf8'),destinations=primaryDestinations(html);
 for(const route of ['aether-reach/index.html','mario-maker-clone/svgn-paper-route/index.html','theology-wiki/san-reader.html','dino-atlas/index.html'])assert.ok(destinations.has('/'+route),route);
});
test('Homepage destination checks accept cache parameters but reject external and non-primary links',()=>{
 const routes=primaryDestinations(`<a href="./aether-reach/index.html?v=0.6.0#play" class="wide primary-link">Play</a><a class="primary-link" href="https://example.com/dino-atlas/index.html">External</a><a href="./theology-wiki/san-reader.html" class="secondary-link">Secondary</a>`);
 assert.deepEqual([...routes],['/aether-reach/index.html']);
});
test('The game and roadmap have separate namespaced local persistence',()=>{
 const app=read('app.mjs');assert.match(app,/SAVE='aether-reach\.expedition\.v1'/);assert.match(app,/SETTINGS='aether-reach\.settings\.v1'/);assert.doesNotMatch(app,/localStorage\.clear\(/);const model=read('model.mjs');assert.match(model,/JSON\.stringify\(\{version:1,relays:/);assert.match(model,/checkpoint:s\.checkpoint/);const board=read('roadmap.mjs');assert.match(board,/key='aether-reach\.roadmap\.v1'/);assert.doesNotMatch(board,/localStorage\.clear\(|\.expedition\.v1/);
});
