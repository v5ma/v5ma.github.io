'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const P=require('../tools/publication.cjs'),G=require('./publication.cjs');
function fixture(run){
 const site=fs.mkdtempSync(path.join(os.tmpdir(),'gospel-addition-')),root=path.join(site,'theology-wiki');
 const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');};
 const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
 const git=(...a)=>cp.execFileSync('git',['-C',site,...a],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const commit=()=>{git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','Fixture source');return git('rev-parse','HEAD');};
 try{
  git('init');write('editorial/publication.json',{owner:'Fixture',repository:'example/repository',branch:'master',reader:'https://example.invalid/reader',pages:[]});
  // This synthetic corpus predates later releases. Identity receipts exercise the
  // real historical readers without weakening their production fail-closed rules.
  write('editorial/political-studies-20261024.json',{slugs:[],previousCorpus:{hashes:{}}});
  write('editorial/displaced-biography-20261024.json',{articles:[],overview:{slug:'absent-fixture-overview'},previousCorpus:{hashes:{}}});
  write('editorial/joseph-revision-20261023.json',{previous_corpus:{hashes:{}}});
  const pages=[['home','Library home'],['topic-jesus','Topic collection'],['unrelated','Developed article']].map(([slug,kind])=>({slug,title:slug,kind,category:'jesus',path:slug==='home'?'home.md':'developed/'+slug+'.md'}));
  write('data/page-index.json',pages);for(const p of pages)write('content/'+p.path,'# '+p.title+'\n\nOriginal '+p.slug+' text.\n');
  const baseline=commit();P.snapshot(root,baseline);commit();
  const spec={slug:'gospel-study',baseline,supplementary:['theology-wiki/research-reports/gospel/claim-audit.md'],navigation:Object.fromEntries(json('public-corpus/page-index.json').filter(x=>x.slug!=='unrelated').map(x=>[x.slug,x.sourceSha256]))};
  const addition={slug:spec.slug,title:'Gospel study',summary:'A bounded constructive comparison.',kind:'Developed article',category:'jesus',path:'developed/'+spec.slug+'.md'};
 spec.baselineHashes=Object.fromEntries(['public-corpus/page-index.json','public-corpus/source-manifest.json','public-corpus/snapshot.json','public-corpus/README.md'].map(p=>[p,G.hash(read(p))]));
  const prepare=()=>{write('research-reports/gospel/claim-audit.md','Claim audit with source limits.\n');write('data/page-index.json',[...json('data/page-index.json'),addition]);write('content/'+addition.path,'# Gospel study\n\nFull comparative article.\n');write('editorial/authorial-articles/'+spec.slug+'.md','Full comparative article.\n');for(const p of pages.filter(p=>p.slug!=='unrelated'))write('content/'+p.path,read('content/'+p.path)+'[['+spec.slug+'|'+addition.title+']]: '+addition.summary+'\n\n');};
  run({root,write,read,json,git,commit,baseline,spec,prepare});
 }finally{fs.rmSync(site,{recursive:true,force:true});}
}
function corpusState(root){const out={};function visit(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,x.name);if(x.isDirectory())visit(p);else out[path.relative(root,p)]=G.hash(fs.readFileSync(p));}}visit(path.join(root,'public-corpus'));out['data/page-index.json']=G.hash(fs.readFileSync(path.join(root,'data/page-index.json')));return out;}
test('One addition updates only its article and two navigators, preserving other exact histories',()=>fixture(({root,read,json,commit,baseline,spec,prepare})=>{
 const old=json('public-corpus/page-index.json').find(r=>r.slug==='unrelated'),oldSource=json('public-corpus/source-manifest.json').find(r=>r.path===old.sourcePath),oldArchive=read(old.archivePath);
 prepare();const ref=commit(),report=G.apply(root,ref,spec);assert.equal(report.addedPages,1);assert.equal(report.updatedNavigationPages,2);assert.equal(report.preservedPages,1);
 const records=json('public-corpus/page-index.json'),meta=json('public-corpus/snapshot.json'),row=records.find(r=>r.slug===spec.slug);
 assert.deepEqual(records.find(r=>r.slug==='unrelated'),old);assert.equal(read(old.archivePath),oldArchive);assert.deepEqual(json('public-corpus/source-manifest.json').find(r=>r.path===old.sourcePath),oldSource);
 assert.equal(meta.sourceRevision,baseline);assert.equal(meta.indexedPages,4);assert.equal(meta.markdownSources,6);assert.equal(meta.additions[0].sourceRevision,ref);assert.equal(row.sourceRevision,ref);assert.equal(row.canonicalSha256,G.hash(read('editorial/authorial-articles/'+spec.slug+'.md')));assert.equal(read(row.archivePath),read('content/developed/'+spec.slug+'.md'));assert.equal(P.check(root).verifiedPages,4);
 const before=corpusState(root);assert.equal(G.apply(root,ref,spec).addedPages,0);assert.deepEqual(corpusState(root),before);const later=commit();assert.notEqual(later,ref);assert.equal(G.apply(root,later,spec).sourceRevision,ref);assert.deepEqual(corpusState(root),before);
}));
test('Uncommitted article bytes are rejected before any corpus writes',()=>fixture(({root,write,commit,spec,prepare})=>{prepare();const ref=commit();write('content/developed/'+spec.slug+'.md','Uncommitted\n');const before=corpusState(root);assert.throws(()=>G.apply(root,ref,spec),/Commit the source first/);assert.deepEqual(corpusState(root),before);}));
test('Unrelated additions and changes to the recorded navigation baseline are rejected',()=>fixture(({root,write,json,commit,spec,prepare})=>{prepare();write('data/page-index.json',[...json('data/page-index.json'),{slug:'unapproved',path:'developed/unapproved.md'}]);const ref=commit(),before=corpusState(root);assert.throws(()=>G.apply(root,ref,spec),/Unrelated corpus coverage change/);assert.deepEqual(corpusState(root),before);write('data/page-index.json',json('data/page-index.json').filter(p=>p.slug!=='unapproved'));const newRef=commit();assert.throws(()=>G.apply(root,newRef,{...spec,navigation:{...spec.navigation,home:'0'.repeat(64)}}),/Navigation baseline changed|approved article entry/);}));
test('Unsafe slugs, abbreviated revisions and conversation substitution fail closed',()=>fixture(({root,write,json,commit,spec,prepare})=>{prepare();const pages=json('data/page-index.json');pages.find(p=>p.slug===spec.slug).sourceFile='raw.txt';write('data/page-index.json',pages);const ref=commit(),before=corpusState(root);assert.throws(()=>G.apply(root,ref.slice(0,7),spec),/full committed/);assert.throws(()=>G.apply(root,ref,{...spec,slug:'../escape'}),/Unsafe release/);assert.throws(()=>G.apply(root,ref,spec),/non-conversation/);assert.deepEqual(corpusState(root),before);}));

test('An uncommitted supplementary audit is rejected before any corpus writes',()=>fixture(({root,write,commit,spec,prepare})=>{prepare();const ref=commit();write('research-reports/gospel/claim-audit.md','Uncommitted audit change\n');const before=corpusState(root);assert.throws(()=>G.apply(root,ref,spec),/Commit the source first/);assert.deepEqual(corpusState(root),before);}));


test('The exact predecessor can be reconstructed after publication',()=>fixture(({root,json,read,commit,spec,prepare})=>{
 const records=json('public-corpus/page-index.json'),sources=json('public-corpus/source-manifest.json'),meta=json('public-corpus/snapshot.json'),guide=read('public-corpus/README.md');
 prepare();G.apply(root,commit(),spec);assert.deepEqual(G.restoreBaseline(root,spec),{records,sources,meta,guide});assert.equal(G.verify(root,spec).verifiedPages,4);
}));
test('An unrelated exact record cannot be changed under a successor receipt',()=>fixture(({root,json,write,commit,spec,prepare})=>{
 prepare();G.apply(root,commit(),spec);const rows=json('public-corpus/page-index.json');rows.find(r=>r.slug==='unrelated').sourceRevision='f'.repeat(40);write('public-corpus/page-index.json',rows);
 assert.throws(()=>G.verify(root,spec),/Historical predecessor reconstruction failed/);
}));
test('An unrelated supplementary source or prior addition cannot be changed',()=>fixture(({root,json,write,commit,spec,prepare})=>{
 prepare();G.apply(root,commit(),spec);const sources=json('public-corpus/source-manifest.json');sources.find(r=>r.path.endsWith('unrelated.md')).exactUrl='https://example.invalid/changed';write('public-corpus/source-manifest.json',sources);assert.throws(()=>G.verify(root,spec),/Historical predecessor reconstruction failed/);
}));
test('First publication rejects navigation edits beyond one exact new entry without writing',()=>fixture(({root,read,write,commit,spec,prepare})=>{
 prepare();write('content/home.md',read('content/home.md').replace('Original home text.','Changed old text.'));const ref=commit(),before=corpusState(root);assert.throws(()=>G.apply(root,ref,spec),/approved article entry/);assert.deepEqual(corpusState(root),before);
}));
test('A repeated publication rejects altered metadata, archive and uncommitted audit',()=>fixture(({root,read,write,json,commit,spec,prepare})=>{
 prepare();const ref=commit();G.apply(root,ref,spec);const pages=json('data/page-index.json');pages.find(p=>p.slug===spec.slug).publication.revision='e'.repeat(40);write('data/page-index.json',pages);assert.throws(()=>G.apply(root,ref,spec),/Successor bytes or provenance mismatch/);
}));
test('The immutable historical receipt is checked on initial and repeated publication',()=>fixture(({root,write,read,commit,spec,prepare})=>{
 write('gospel-comparison-20261011/publication-receipt.json','Original receipt\n');spec.previousReceipt={path:'gospel-comparison-20261011/publication-receipt.json',sha256:G.hash(read('gospel-comparison-20261011/publication-receipt.json'))};
 prepare();const ref=commit();G.apply(root,ref,spec);write(spec.previousReceipt.path,'Changed receipt\n');assert.throws(()=>G.verify(root,spec),/Historical receipt changed/);
}));

test('An unrelated article edit is rejected before any publication writes',()=>fixture(({root,read,write,commit,spec,prepare})=>{
 prepare();write('content/developed/unrelated.md','Rewritten old article\n');const ref=commit(),before=corpusState(root);assert.throws(()=>G.apply(root,ref,spec),/Unrelated source\/archive changed/);assert.deepEqual(corpusState(root),before);
}));
test('A changed predecessor guide is rejected before first publication',()=>fixture(({root,read,write,commit,spec,prepare})=>{
 prepare();write('public-corpus/README.md',read('public-corpus/README.md')+'Changed old guide\n');const ref=commit(),before=corpusState(root);assert.throws(()=>G.apply(root,ref,spec),/Exact predecessor baseline changed/);assert.deepEqual(corpusState(root),before);
}));
test('A repeated run rejects changed narration-source notes without rewriting the receipt',()=>fixture(({root,write,read,commit,spec,prepare})=>{
 prepare();const ref=commit();G.apply(root,ref,spec);const receipt=read(G.RECEIPT);write('research-reports/gospel/claim-audit.md','Changed notes\n');assert.throws(()=>G.apply(root,ref,spec),/Successor supplementary mismatch/);assert.equal(read(G.RECEIPT),receipt);
}));
test('The prior snapshot date and source revision cannot be rewritten by the successor',()=>fixture(({root,write,json,commit,spec,prepare})=>{
 prepare();G.apply(root,commit(),spec);const m=json('public-corpus/snapshot.json');m.sourceRevision='f'.repeat(40);write('public-corpus/snapshot.json',m);assert.throws(()=>G.verify(root,spec),/Historical predecessor reconstruction failed/);
}));
test('The successor cannot redirect exact-source links while retaining valid hashes',()=>fixture(({root,write,json,commit,spec,prepare})=>{
 prepare();G.apply(root,commit(),spec);const rows=json('public-corpus/page-index.json'),pages=json('data/page-index.json');rows.find(r=>r.slug===spec.slug).exactSourceUrl='https://example.invalid/wrong';pages.find(p=>p.slug===spec.slug).publication.exactUrl='https://example.invalid/wrong';write('public-corpus/page-index.json',rows);write('data/page-index.json',pages);const m=json('public-corpus/snapshot.json');m.indexSha256=G.hash(JSON.stringify(rows,null,2)+'\n');write('public-corpus/snapshot.json',m);assert.throws(()=>G.verify(root,spec),/Successor bytes or provenance mismatch/);
}));

test('Source-only CI refuses uncommitted generated readers and leaves them available for the bounded review export',()=>fixture(({root,read,write,git,commit,spec,prepare})=>{
 write('research-reports/gospel/claim-audit.md','Claim audit with source limits.\n');
 write('editorial/authorial-articles/'+spec.slug+'.md','Full comparative article.\n');
 const sourceOnly=commit();prepare();const before=corpusState(root);
 assert.throws(()=>G.apply(root,sourceOnly,spec),/Command failed|Commit the source first/);
 assert.deepEqual(corpusState(root),before);
 const changed=git('diff','--name-only','--','theology-wiki').split('\n'),added=git('ls-files','--others','--exclude-standard','--','theology-wiki').split('\n');
 const exportable=[...new Set([...changed,...added])].filter(p=>/^theology-wiki\/[a-zA-Z0-9_./-]+\.(?:json|md|txt|html|js|css|csv|cjs)$/.test(p));
 for(const p of ['theology-wiki/content/developed/'+spec.slug+'.md','theology-wiki/content/home.md','theology-wiki/content/developed/topic-jesus.md','theology-wiki/data/page-index.json'])assert(exportable.includes(p),p);
 const generatedRef=commit();assert.equal(G.apply(root,generatedRef,spec).addedPages,1);const proof=corpusState(root);const finalRef=commit();assert.equal(G.apply(root,finalRef,spec).sourceRevision,generatedRef);assert.deepEqual(corpusState(root),proof);
}));


test('A declared exact home count update reconstructs its immutable predecessor and rejects any other count',()=>fixture(({root,read,write,commit,spec,prepare})=>{
 spec.navigationReplacements={home:[['Original home text.','Original home text. 31 articles.']]};
 prepare();write('content/home.md',read('content/home.md').replace('Original home text.','Original home text. 31 articles.'));
 const ref=commit();assert.equal(G.apply(root,ref,spec).addedPages,1);assert.equal(G.verify(root,spec).verifiedPages,4);const proof=corpusState(root);assert.equal(G.apply(root,commit(),spec).addedPages,0);assert.deepEqual(corpusState(root),proof);
 write('content/home.md',read('content/home.md').replace('31 articles.','32 articles.'));assert.throws(()=>G.restoreNavigation(read('content/home.md'),'home',jsonArticle(root,spec.slug),spec),/Navigation count update/);
}));
function jsonArticle(root,slug){return JSON.parse(fs.readFileSync(path.join(root,'data/page-index.json'))).find(p=>p.slug===slug);}

test('A missing later-release receipt still fails closed without corpus writes',()=>fixture(({root,commit,spec,prepare})=>{
 prepare();G.apply(root,commit(),spec);const before=corpusState(root);
 fs.unlinkSync(path.join(root,'editorial/displaced-biography-20261024.json'));
 assert.throws(()=>G.verify(root,spec),/ENOENT/);assert.deepEqual(corpusState(root),before);
}));
