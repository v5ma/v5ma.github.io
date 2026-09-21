// Repository integration contracts, not a browser or physical-device playtest.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {catalog,MOUNTS,UTILITY_ORDER} from '../field-operations-core.js';
import {sanitizeEconomy,emptyEconomy} from '../frontier-economy-core.js';
import {WORKSPACE_VISIBILITY_CSS} from '../spatial-console.js';
const game=fileURLToPath(new URL('..',import.meta.url));
const read=p=>readFileSync(resolve(game,p),'utf8');

test('Normal npm test covers every maintained model suite, not only the prototype',()=>{
 assert.equal(JSON.parse(read('package.json')).scripts.test,'node --test tests/*.test.mjs');
});
test('Normal npm check uses the complete owned-source checker',()=>{
 assert.equal(JSON.parse(read('package.json')).scripts.check,'node scripts/check-source.mjs');
 assert.ok(existsSync(resolve(game,'scripts/check-source.mjs')));
});
const workflowPath=resolve(game,'../.github/workflows/dino-spatial-console.yml');
test('The rotunda workflow validates master without branch source mutation',{skip:existsSync(workflowPath)?false:'Repository workflow omitted from this source-only checkout'},()=>{
 // Source-only distributions need not include repository workflow files.
 const path=resolve(game,'../.github/workflows/dino-spatial-console.yml');
 assert.ok(existsSync(path),'Run repository tests with the existing scoped workflow present');
 const y=readFileSync(path,'utf8'),model=y.split('  model:')[1].split('  browser:')[0];
 assert.match(y,/branches: \[master\]/);
 assert.doesNotMatch(y,/\.github\/patches|dino-atlas\/rotunda-release|git','push|git push/);
 assert.doesNotMatch(model,/contents: write/);
 assert.match(model,/persist-credentials: false/);
 assert.match(y,/needs\.model\.result == 'success'/);
 assert.match(y,/needs\.browser\.result == 'success'/);
 assert.match(y,/needs\.entry\.result == 'success'/);
});
test('Both full-game entries resolve through the same current personal-UI module chain',()=>{
 const classic=read('index.html'),tidegate=read('tidegate.html');
 const map=JSON.parse(classic.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
 const xrImport=read('ranger.js').match(/from ['"]([^'"]*diorama-xr\.js[^'"]*)['"]/)[1];
 const adapter=map[xrImport];assert.match(adapter,/^\.\/classic-xr\.js\?v=/);
 const shared=read(adapter.split('?')[0]).match(/from ['"]([^'"]*diorama-xr\.js[^'"]*)['"]/)[1];
 const gate=read('tidegate.js').match(/from ['"]([^'"]*diorama-xr\.js[^'"]*)['"]/)[1];
 assert.equal(shared,gate,'One scene must not stay on an older XR adapter');
 const reserve=read('diorama-xr.js').match(/from ['"]([^'"]*xr-reserve\.js[^'"]*)['"]/)[1];
 const personal=read('xr-reserve.js').match(/from ['"]([^'"]*spatial-console\.js[^'"]*)['"]/)[1];
 assert.equal(new URL(shared,'https://game.invalid/').search,new URL(reserve,'https://game.invalid/').search);
 assert.equal(new URL(reserve,'https://game.invalid/').search,new URL(personal,'https://game.invalid/').search);
 assert.match(tidegate,/tidegate\.js\?v=/);
 assert.match(read('classic-xr.js'),/first-person-vr/);assert.match(read('classic-xr.js'),/diorama-ar/);
});
test('All twelve mounted assignments and four vehicle equipment profiles remain integrated',()=>{
 assert.equal(catalog('classic').length,6);assert.equal(catalog('tidegate').length,6);
 assert.deepEqual(Object.keys(MOUNTS).sort(),['boat','buggy','helicopter','jeep']);
 assert.deepEqual(UTILITY_ORDER,['water','zapper','scanner','rescue']);
 for(const name of ['ranger.js','tidegate.js']){assert.match(read(name),/new FieldOperations\(/);assert.match(read(name),/FieldNavigation/);}
});
test('Current reward sanitizer retains Pelagic and Living Herds after older branch reconciliation',()=>{
 const s=emptyEconomy();s.credits=5371;s.rewardLedger=['ranch:school','aaa:storm-response','aaa:living-herds','aaa:pelagic-recovery'];
 const restored=sanitizeEconomy(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(restored.rewardLedger,s.rewardLedger);assert.equal(restored.credits,5371);
});
test('Both current bootstrap styles preserve the closed-workspace guard',()=>{
 for(const name of ['classic-xr.css','tidegate.css'])assert.ok(read(name).includes(WORKSPACE_VISIBILITY_CSS),name);
});
test('Owned runtime has no merge markers or missing literal relative JS imports',()=>{
 const files=readdirSync(game).filter(n=>/\.(?:m?js|css|html)$/.test(n));
 for(const name of files){
  const s=read(name);assert.doesNotMatch(s,/^(?:<{7}|={7}|>{7}|\|{7})(?: .*)?$/m,name);
  if(!/\.m?js$/.test(name))continue;
  for(const m of s.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)){
   const target=resolve(dirname(resolve(game,name)),m[1].split(/[?#]/)[0]);
   assert.ok(existsSync(target),name+' imports missing '+m[1]);
  }
 }
});
