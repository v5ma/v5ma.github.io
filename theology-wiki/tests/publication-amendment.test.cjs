'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const P=require('../tools/publication.cjs');
function fixture(run){
 const site=fs.mkdtempSync(path.join(os.tmpdir(),'theology-amendment-')),root=path.join(site,'theology-wiki');
 const write=(p,value)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');};
 const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
 const git=(...args)=>cp.execFileSync('git',['-C',site,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const commit=()=>{git('add','.');git('-c','user.name=Publication test','-c','user.email=publication-test@example.invalid','commit','-m','Exact fixture source');return git('rev-parse','HEAD');};
 try{
  git('init');
  write('editorial/publication.json',{owner:'Fixture',repository:'example/repository',branch:'master',reader:'https://example.invalid/reader',pages:[]});
  const pages=['teacher','unrelated'].map(slug=>({slug,title:slug,kind:'Developed article',category:'context',path:'developed/'+slug+'.md'}));
  write('data/page-index.json',pages);
  for(const p of pages){write('content/'+p.path,'# '+p.title+'\n\nOriginal '+p.slug+' source.\n');write('editorial/authorial-articles/'+p.slug+'.md','# '+p.title+'\n\nCanonical '+p.slug+'.\n');}
  const baseline=commit();P.snapshot(root,baseline);commit();
  run({root,write,read,json,git,commit,baseline});
 }finally{fs.rmSync(site,{recursive:true,force:true});}
}
const outputs=['public-corpus/page-index.json','public-corpus/source-manifest.json','public-corpus/snapshot.json','public-corpus/manifest-sha256.csv','public-corpus/README.md','public-corpus/pages/teacher.md','public-corpus/pages/unrelated.md','data/page-index.json'];
test('A bounded amendment pins committed article bytes and preserves unrelated versions',()=>fixture(({root,write,read,json,commit,baseline})=>{
 const unrelated=json('public-corpus/page-index.json').find(r=>r.slug==='unrelated'),unrelatedBytes=read('public-corpus/pages/unrelated.md');
 const priorSupplement=json('public-corpus/source-manifest.json').filter(r=>!r.path.includes('/teacher.md'));
 write('content/developed/teacher.md','# teacher\n\nExpanded argument.\n');
 write('editorial/authorial-articles/teacher.md','# teacher\n\nExpanded canonical argument.\n');
 const ref=commit(),report=P.amendArticle(root,ref,'teacher');assert.equal(report.amendedPages,1);assert.equal(report.amendedMarkdownSources,2);assert.equal(report.preservedPages,1);
 const records=json('public-corpus/page-index.json'),target=records.find(r=>r.slug==='teacher'),meta=json('public-corpus/snapshot.json');
 assert.equal(target.sourceRevision,ref);assert.equal(target.sourceSha256,P.hash(read('content/developed/teacher.md')));assert.equal(target.canonicalSha256,P.hash(read('editorial/authorial-articles/teacher.md')));
 assert.equal(read('public-corpus/pages/teacher.md'),read('content/developed/teacher.md'));assert.deepEqual(records.find(r=>r.slug==='unrelated'),unrelated);assert.equal(read('public-corpus/pages/unrelated.md'),unrelatedBytes);
 assert.deepEqual(json('public-corpus/source-manifest.json').filter(r=>!r.path.includes('/teacher.md')),priorSupplement);assert.equal(meta.sourceRevision,baseline);assert.equal(meta.amendments[0].sourceRevision,ref);assert.deepEqual(meta.amendments[0].pages,['teacher']);
 assert.equal(meta.indexSha256,P.hash(read('public-corpus/page-index.json')));assert(read('public-corpus/README.md').includes(target.exactSourceUrl));assert.equal(P.check(root).verifiedPages,2);
 const before=outputs.map(f=>P.hash(read(f)));assert.equal(P.amendArticle(root,ref,'teacher').amendedPages,0);assert.deepEqual(outputs.map(f=>P.hash(read(f))),before);
 const later=commit();assert.notEqual(later,ref);assert.equal(P.amendArticle(root,later,'teacher').amendedPages,0);assert.deepEqual(outputs.map(f=>P.hash(read(f))),before);
}));
test('An amendment rejects uncommitted canonical or reader text before any output writes',()=>fixture(({root,write,read,git})=>{
 const ref=git('rev-parse','HEAD'),before=outputs.map(f=>P.hash(read(f)));
 write('editorial/authorial-articles/teacher.md','Uncommitted canonical change\n');assert.throws(()=>P.amendArticle(root,ref,'teacher'),/Commit the source first/);assert.deepEqual(outputs.map(f=>P.hash(read(f))),before);
}));
test('Amendments reject conversations, unsafe slugs and incomplete commit identifiers',()=>fixture(({root,write,read,json,git})=>{
 const ref=git('rev-parse','HEAD');assert.throws(()=>P.amendArticle(root,ref,'../teacher'),/Explicit unique/);assert.throws(()=>P.amendArticle(root,ref.slice(0,7),'teacher'),/full committed/);
 const pages=json('data/page-index.json');pages[0].sourceFile='original-public-conversation.txt';write('data/page-index.json',pages);
 const before=outputs.map(f=>P.hash(read(f)));assert.throws(()=>P.amendArticle(root,ref,'teacher'),/non-conversation article/);assert.deepEqual(outputs.map(f=>P.hash(read(f))),before);
}));
