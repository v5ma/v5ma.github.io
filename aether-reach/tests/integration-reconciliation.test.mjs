/* Source/provenance fixtures only, not gameplay or device acceptance. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const game=path.join(root,'aether-reach');
const read=p=>fs.readFileSync(path.join(game,p),'utf8');
test('Recovered modules retain their original bytes without becoming runtime entry points',()=>{
 const m=JSON.parse(read('history/unmerged/SOURCE-MANIFEST.json'));
 assert.equal(m.candidates.length,2);
 for(const candidate of m.candidates){
  assert.equal(candidate.roadmapTask,'P05');
  for(const [name,spec] of Object.entries(candidate.files)){
   assert.ok(name.startsWith('aether-reach/history/unmerged/'));
   assert.ok(name.endsWith('.reference'));
   const bytes=fs.readFileSync(path.join(root,name));
   assert.equal(bytes.length,spec.bytes);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),spec.sha256);
   assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),spec.blob);
  }
 }
});
test('Current runtime does not import preserved candidates or unresolved conflict markers',()=>{
 for(const name of fs.readdirSync(game).filter(n=>/\.(?:mjs|js|html|css)$/.test(n))){
  const text=read(name);
  assert.doesNotMatch(text,/^(?:<<<<<<<|=======|>>>>>>>)(?: |$)/m,name);
  assert.doesNotMatch(text,/(?:from\s*|import\s*\(?\s*|src=)["'][^"']*(?:history\/unmerged|tideglass-|city-state|skiff\.mjs)/,name);
 }
});
test('Direct master validation and post-deployment verification are wired to existing workflows',()=>{
 const native=fs.readFileSync(path.join(root,'.github/workflows/aether-rotunda.yml'),'utf8');
 assert.match(native,/branches: \[master\]/);
 assert.doesNotMatch(native,/branches: \[aether\//);
 assert.match(native,/release_evidence_test\.py/);
 const published=fs.readFileSync(path.join(root,'.github/workflows/aether-published.yml'),'utf8');
 assert.match(published,/workflow_run:/);
 assert.match(published,/pages build and deployment/);
 assert.ok(published.includes('ref: ${{ github.sha }}'));
 assert.ok(!published.includes('ref: ${{ github.event.workflow_run.head_sha'));

 const archive=fs.readFileSync(path.join(root,'.github/workflows/aether-release-backup.yml'),'utf8');
 assert.match(archive,/tools\/release_evidence\.py/);
 assert.doesNotMatch(archive,/pr = next\(/);
});
test('Current collision, configured rail reversal and direct window reload stay authoritative',()=>{
 const model=read('model.mjs');
 for(const name of ['windbreakSolid','BELL_DECKS','BELL_STREET_SOLIDS','bellShortcutOpen','presentationSolids'])assert.ok(model.includes(name),name);
 assert.match(model,/p\.speed<=tune\.brake\+1e-6/);
 assert.doesNotMatch(model,/p\.speed<=6&&!p\.rail\.reverseLatched/);
 assert.match(read('window-controls.mjs'),/B[^|\n]*reload/i);
 assert.doesNotMatch(read('app.mjs'),/localStorage\.clear\(/);
});
