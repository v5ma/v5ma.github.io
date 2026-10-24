'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),P=require('../tools/publication.cjs'),R=require('../tools/political-studies-publication.cjs'),C=require('../assets/js/research-core.js'),L=require('../assets/js/listening-core.js');
const read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p)),r=json('editorial/political-studies-20261024.json');
test('New political studies preserve every preceding exact page history and every archived conversation',()=>{
 const rows=json('public-corpus/page-index.json');assert.equal(rows.length,443);
 assert.equal(P.hash(JSON.stringify(rows.filter(x=>!r.slugs.includes(x.slug)))),r.previousCorpus.unchangedRecordsSha256);
 for(const p of Object.keys(r.previousCorpus.hashes))assert.equal(P.hash(R.historicalCorpusRead(root,p)),r.previousCorpus.hashes[p]);
 assert.equal(P.check(root).verifiedTranscripts,354);
});
test('Timeline retains all fifteen attributed themes and does not invent original video metadata or completed forecasts',()=>{
 const body=read('editorial/publication-articles/'+r.slugs[0]+'.md').toString();
 const ledger=body.split('## The complete fifteen-theme ledger')[1].split('## Textual controls')[0];assert.equal([...ledger.matchAll(/^\d+\. /gm)].length,15);
 for(const s of ['Brother Paul','original YouTube URL and upload date remain unverified','not proof of the original upload date','June 2016 qualification','beginning of removal','not a completed mint sale','has not independently recalculated','November 5, 2026','Neither image is an explicit spoken declaration'])assert(body.includes(s),s);
 assert(!body.includes('truncated'));assert(body.includes('## Open research and forecast register'));
});
test('Execution study leads with cancellation, retains Jeffress reversal and bounds the John and treason analogies',()=>{
 const body=read('editorial/publication-articles/'+r.slugs[1]+'.md').toString(),lead=body.split('## A dated chronology')[0];
 for(const s of ['October 15, 2026','**not** be livestreamed','subsequently supported that decision','had not taken place'])assert(lead.includes(s),s);
 for(const s of ['I support President Trump','not an established result','does not turn Hasan into a persecuted Christian disciple','not attributed here to Brother Paul','Romans 13','Article III, Section 3'])assert(body.includes(s),s);
});
test('Both studies have connected reader routes, full-prose search, complete listening text and independent publication records',()=>{
 const pages=json('data/page-index.json'),search=json('data/search.json'),graph=json('data/graph.json').related,library=json('data/listening-library.json');
 assert.equal(library.articles.length,41);
 for(const slug of r.slugs){const p=pages.find(x=>x.slug===slug);assert(p&&!p.sourceFile);assert.equal(p.kind,'Developed article');assert.equal(p.updated,'2026-10-24');
  const body=read('content/'+p.path).toString(),a=library.articles.find(x=>x.slug===slug),n=json(a.narration);assert.equal(a.sourceSha256,P.hash(body));assert.deepEqual(n.segments,L.segment(body));assert.equal(read(a.transcript).toString(),n.segments.map(s=>s.text).join('\n\n')+'\n');
  for(const from of ['trump-first-beast-of-revelation','antichrist-as-a-pattern-of-conduct','topic-apocalypse'])assert(graph[from].includes(slug));
  assert(graph[slug].includes(r.slugs.find(s=>s!==slug)));assert(p.publication?.exactUrl.includes('/blob/'+p.publication.revision+'/'));assert(p.publication.canonicalSourceUrl.endsWith('/editorial/publication-articles/'+slug+'.md'));
 }
 assert(C.select(pages,'crowned pilot',{kind:'article'},search).some(x=>x.slug===r.slugs[0]));
 assert(C.select(pages,'spectatorship',{kind:'article'},search).some(x=>x.slug===r.slugs[1]));
});
