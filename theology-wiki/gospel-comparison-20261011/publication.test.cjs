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
  const pages=[['home','Library home'],['topic-jesus','Topic collection'],['unrelated','Developed article']].map(([slug,kind])=>({slug,title:slug,kind,category:'jesus',path:slug==='home'?'home.md':'developed/'+slug+'.md'}));
  write('data/page-index.json',pages);for(const p of pages)write('content/'+p.path,'# '+p.title+'\n\nOriginal '+p.slug+' text.\n');
  const baseline=commit();P.snapshot(root,baseline);commit();
  const spec={slug:'gospel-study',baseline,supplementary:['theology-wiki/research-reports/gospel/claim-audit.md'],navigation:Object.fromEntries(json('public-corpus/page-index.json').filter(x=>x.slug!=='unrelated').map(x=>[x.slug,x.sourceSha256]))};
  const addition={slug:spec.slug,title:'Gospel study',kind:'Developed article',category:'jesus',path:'developed/'+spec.slug+'.md'};
  const prepare=()=>{write('research-reports/gospel/claim-audit.md','Claim audit with source limits.\n');write('data/page-index.json',[...json('data/page-index.json'),addition]);write('content/'+addition.path,'# Gospel study\n\nFull comparative article.\n');write('editorial/authorial-articles/'+spec.slug+'.md','Full comparative article.\n');for(const p of pages.filter(p=>p.slug!=='unrelated'))write('content/'+p.path,read('content/'+p.path)+'\n[['+spec.slug+'|Gospel study]]\n');};
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
test('Unrelated additions and changes to the recorded navigation baseline are rejected',()=>fixture(({root,write,json,commit,spec,prepare})=>{prepare();write('data/page-index.json',[...json('data/page-index.json'),{slug:'unapproved',path:'developed/unapproved.md'}]);const ref=commit(),before=corpusState(root);assert.throws(()=>G.apply(root,ref,spec),/Unrelated corpus coverage change/);assert.deepEqual(corpusState(root),before);write('data/page-index.json',json('data/page-index.json').filter(p=>p.slug!=='unapproved'));const newRef=commit();assert.throws(()=>G.apply(root,newRef,{...spec,navigation:{...spec.navigation,home:'0'.repeat(64)}}),/Navigation baseline changed/);}));
test('Unsafe slugs, abbreviated revisions and conversation substitution fail closed',()=>fixture(({root,write,json,commit,spec,prepare})=>{prepare();const pages=json('data/page-index.json');pages.find(p=>p.slug===spec.slug).sourceFile='raw.txt';write('data/page-index.json',pages);const ref=commit(),before=corpusState(root);assert.throws(()=>G.apply(root,ref.slice(0,7),spec),/full committed/);assert.throws(()=>G.apply(root,ref,{...spec,slug:'../escape'}),/Unsafe release/);assert.throws(()=>G.apply(root,ref,spec),/non-conversation/);assert.deepEqual(corpusState(root),before);}));

test('An uncommitted supplementary audit is rejected before any corpus writes',()=>fixture(({root,write,commit,spec,prepare})=>{prepare();const ref=commit();write('research-reports/gospel/claim-audit.md','Uncommitted audit change\n');const before=corpusState(root);assert.throws(()=>G.apply(root,ref,spec),/Commit the source first/);assert.deepEqual(corpusState(root),before);}));
