'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),P=require('../tools/publication.cjs'),C=require('../assets/js/research-core.js'),L=require('../assets/js/listening-core.js');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const cfg=json('editorial/publication.json'),pages=json('data/page-index.json'),by=new Map(pages.map(p=>[p.slug,p]));
test('Four added routes retain distinct source dates, authorship and connected arguments',()=>{
 assert.equal(pages.length,438);assert.equal(pages.filter(p=>p.sourceFile).length,354);assert.equal(pages.filter(p=>p.kind==='Developed article').length,31);
 for(const spec of cfg.pages){const p=by.get(spec.slug);assert(p);assert.equal(p.updated,spec.updated);assert(read('content/'+p.path).includes('canonical_source: '+JSON.stringify(spec.source)));}
 assert.equal(by.get('cosmic-thought-and-transcendence').updated,'2026-09-09');assert.equal(by.get('computational-god-capabilities-bridge').updated,'2026-10-03');
 assert(read(cfg.pages[1].source).includes('new connective exposition'));
});
test('Every new wikilink and bidirectional bridge connection resolves',()=>{
 const graph=json('data/graph.json').related,rels=json('data/relationships.json');
 for(const p of cfg.pages)for(const m of read('content/'+by.get(p.slug).path).matchAll(/\[\[([^\]|#]+)[^\]]*\]\]/g))assert(by.has(m[1]),m[1]);
 for(const slug of Object.keys(cfg.bridgeConnections)){assert(graph[slug].includes('computational-god-capabilities-bridge'));assert(graph['computational-god-capabilities-bridge'].includes(slug));assert(rels.edges.some(e=>e.from===slug&&e.to==='computational-god-capabilities-bridge'));}
});
test('Full-text search covers the actual new prose rather than only page titles',()=>{
 const search=json('data/search.json');assert.equal(new Set(search.ids).size,pages.length);
 assert(C.select(pages,'unpleasant evolutionary implementation',{kind:'all'},search).some(p=>p.slug==='computational-god-capabilities-bridge'));
 assert(C.select(pages,'cognitive functions consciousness',{kind:'article'},search).some(p=>p.slug==='computational-god-consciousness-and-theodicy'));
});
test('New device-reading texts contain the complete source-matched article; prior recordings are not relabeled',()=>{
 const lib=json('data/listening-library.json');assert.equal(lib.articles.length,37);
 for(const spec of cfg.pages.filter(x=>x.kind!=='Navigator')){const item=lib.articles.find(x=>x.slug===spec.slug),source=read(item.source),n=json(item.narration);assert.equal(item.sourceSha256,P.hash(source));assert.deepEqual(n.segments,L.segment(source));assert.equal(P.hash(read(item.narration)),item.narrationSha256);assert(!json('products/media/manifest.json').assets.some(x=>x.id===spec.slug));}
});
test('Every reader page and full public transcript has a hash-checked public Markdown backup',()=>{
 const report=P.check(root);assert.equal(report.verifiedPages,438);assert.equal(report.verifiedTranscripts,354);
 const records=json('public-corpus/page-index.json');for(const p of pages){const r=records.find(r=>r.slug===p.slug);assert(r);assert(p.publication.sourceUrl.startsWith('https://github.com/v5ma/v5ma.github.io/blob/master/'));assert(r.exactSourceUrl.includes('/blob/'+r.sourceRevision+'/'));if(!p.sourceFile)assert.equal(read(r.archivePath),read('content/'+p.path));}
});
test('Both reader entries expose the same local extension without missing shared stylesheet dependencies',()=>{
 for(const name of ['index.html','san-reader.html']){const s=read(name);assert(s.includes('./assets/js/publication-tools.js'));assert(s.includes('./assets/css/publication.css'));assert(!s.includes("'../san-wiki-shell/assets'"));}
 assert(read('assets/js/research-tools.js').includes('window.TheologyPublication?.enhance(p)'));
 assert(read('tools/build.cjs').includes("require('./publication.cjs').integrate(ROOT)"));
});
test('Repeated integration and snapshot checks are deterministic',()=>{
 const tracked=['data/page-index.json','data/research.json','data/graph.json','data/relationships.json','data/search.json','data/listening-library.json','san-reader.html','index.html'];
 const before=tracked.map(f=>P.hash(read(f)));P.integrate(root);assert.deepEqual(tracked.map(f=>P.hash(read(f))),before);P.check(root);
});
