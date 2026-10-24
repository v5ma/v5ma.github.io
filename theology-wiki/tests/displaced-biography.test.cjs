'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),D=require('../tools/displaced-biography-revision.cjs'),P=require('../tools/publication.cjs');
const read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p)),r=json('editorial/displaced-biography-20261024.json');
test('October clarification preserves three complete prior canonical bodies and records attachment scope',()=>{
 assert.equal(r.articles.length,3);assert.deepEqual(r.attachments.map(a=>[a.bytes,a.lines]),[[6123,26],[5158,40]]);
 for(const a of r.articles){const prior=D.preservedCanonical(root,a.canonical.path);assert.equal(prior.length,a.canonical.beforeBytes);assert.equal(P.hash(prior),a.canonical.before);assert.equal(P.hash(read(a.canonical.path)),a.canonical.after);}
});
test('Dedicated overview retains biography displacement, five date layers and the stronger identity claim',()=>{
 const pages=json('data/page-index.json'),p=pages.find(p=>p.slug===r.overview.slug);assert(p);assert.equal(p.kind,'Navigator');assert.equal(p.updated,'2026-10-24');assert(!p.sourceFile);
 const body=read('content/'+p.path).toString();
 for(const s of ['same founder','biography, not the physical scrolls','Material manuscript','Composition and revision','Remembered founder','Proposed identification','Gospel setting','30–50 CE','200–150 BCE'])assert(body.includes(s),s);
 for(const a of r.articles)assert(body.includes(a.slug));
 assert(!body.includes('computational-god-capabilities-bridge'));
});
test('New overview and three amendments preserve every unrelated exact-version record',()=>{
 const rows=JSON.parse(require('../tools/political-studies-publication.cjs').historicalCorpusRead(root,'public-corpus/page-index.json')),excluded=new Set([r.overview.slug,...r.articles.map(a=>a.slug)]);
 assert.equal(rows.length,441);assert.equal(P.hash(JSON.stringify(rows.filter(x=>!excluded.has(x.slug)))),r.previousCorpus.unchangedRecordsSha256);
 const current=rows.find(x=>x.slug===r.overview.slug);assert.equal(P.hash(read(current.archivePath)),current.archiveSha256);assert.equal(current.archiveSha256,P.hash(read('content/developed/'+current.slug+'.md')));
 assert.equal(P.check(root).verifiedTranscripts,354);
});
