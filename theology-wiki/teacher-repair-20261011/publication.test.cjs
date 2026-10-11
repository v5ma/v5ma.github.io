'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const P=require('../tools/publication.cjs'),T=require('./publication.cjs');
const SLUG='jesus-teacher-of-righteousness-hypothesis';
function fixture(run){
 const site=fs.mkdtempSync(path.join(os.tmpdir(),'teacher-structure-publication-')),root=path.join(site,'theology-wiki');
 const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');};
 const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
 const git=(...a)=>cp.execFileSync('git',['-C',site,...a],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const commit=()=>{git('add','.');git('-c','user.name=Publication fixture','-c','user.email=publication-fixture@example.invalid','commit','-m','Exact source fixture');return git('rev-parse','HEAD');};
 try{
  git('init');write('editorial/publication.json',{owner:'Fixture',repository:'example/repository',branch:'master',reader:'https://example.invalid/reader',pages:[]});
  const pages=[['home','Library home'],['topic-jesus','Topic collection'],[SLUG,'Developed article'],['unrelated','Developed article']].map(([slug,kind])=>({slug,title:slug,kind,category:'jesus',path:slug==='home'?'home.md':'developed/'+slug+'.md'}));
  write('data/page-index.json',pages);for(const p of pages)write('content/'+p.path,'# '+p.title+'\n\nOriginal text for '+p.slug+'.\n');
  write('editorial/authorial-articles/'+SLUG+'.md','Original Teacher canonical.\n');
  const baseline=commit();P.snapshot(root,baseline);commit();
  const spec={slug:SLUG,canonical:{after:null},navigation:{}};
  for(const slug of ['home','topic-jesus']){const row=json('public-corpus/page-index.json').find(r=>r.slug===slug);spec.navigation[row.sourcePath]={slug,before:row.sourceSha256,after:null};}
  const prepare=()=>{write('editorial/authorial-articles/'+SLUG+'.md','Reframed Teacher canonical.\n');spec.canonical.after=P.hash(read('editorial/authorial-articles/'+SLUG+'.md'));write('content/developed/'+SLUG+'.md','# Teacher\n\nFive staged inquiries.\n');for(const source of Object.keys(spec.navigation)){const p=source.replace('theology-wiki/','');write(p,read(p)+'\nRevised Teacher summary.\n');spec.navigation[source].after=P.hash(read(p));}};
  run({root,read,json,write,commit,git,spec,prepare,baseline});
 }finally{fs.rmSync(site,{recursive:true,force:true});}
}
function state(root){const rows={};function visit(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,x.name);if(x.isDirectory())visit(p);else rows[path.relative(root,p)]=P.hash(fs.readFileSync(p));}}visit(path.join(root,'public-corpus'));rows['data/page-index.json']=P.hash(fs.readFileSync(path.join(root,'data/page-index.json')));return rows;}
test('Teacher amendment revises one article and two exact summaries without redating other histories',()=>fixture(({root,read,json,commit,spec,prepare,baseline})=>{
 const old=json('public-corpus/page-index.json').find(r=>r.slug==='unrelated'),oldSource=json('public-corpus/source-manifest.json').find(r=>r.path===old.sourcePath),oldBytes=read(old.archivePath);
 prepare();const ref=commit(),report=T.apply(root,ref,spec);assert.equal(report.amendedPages,1);assert.equal(report.amendedNavigationPages,2);
 const meta=json('public-corpus/snapshot.json');assert.equal(meta.sourceRevision,baseline);assert.equal(meta.amendments[0].sourceRevision,ref);assert.equal(meta.navigationAmendments[0].sourceRevision,ref);
 assert.deepEqual(json('public-corpus/page-index.json').find(r=>r.slug==='unrelated'),old);assert.deepEqual(json('public-corpus/source-manifest.json').find(r=>r.path===old.sourcePath),oldSource);assert.equal(read(old.archivePath),oldBytes);
 assert.equal(P.check(root).verifiedPages,4);const before=state(root);assert.equal(T.apply(root,ref,spec).amendedNavigationPages,0);assert.deepEqual(state(root),before);
 const later=commit();assert.notEqual(later,ref);assert.equal(T.apply(root,later,spec).amendedPages,0);assert.deepEqual(state(root),before);
}));
test('Uncommitted navigation is rejected before any article or corpus writes',()=>fixture(({root,read,write,commit,spec,prepare})=>{prepare();const ref=commit(),before=state(root);write('content/home.md',read('content/home.md')+'Uncommitted.\n');assert.throws(()=>T.apply(root,ref,spec),/Commit the source first/);assert.deepEqual(state(root),before);}));
test('Unreviewed canonical and navigation bytes are rejected before writes',()=>fixture(({root,write,commit,spec,prepare})=>{prepare();write('editorial/authorial-articles/'+SLUG+'.md','Different canonical.\n');const ref=commit(),before=state(root);assert.throws(()=>T.apply(root,ref,spec),/Unexpected Teacher canonical revision/);assert.deepEqual(state(root),before);}));
test('A wrong navigation predecessor, unrelated page or short ref fails closed',()=>fixture(({root,commit,spec,prepare})=>{prepare();const ref=commit(),before=state(root);assert.throws(()=>T.apply(root,ref.slice(0,7),spec),/full committed/);const bad=JSON.parse(JSON.stringify(spec));bad.navigation['theology-wiki/content/home.md'].before='0'.repeat(64);assert.throws(()=>T.apply(root,ref,bad),/Unexpected Teacher navigation baseline/);bad.navigation['theology-wiki/content/developed/unrelated.md']={};assert.throws(()=>T.apply(root,ref,bad),/Only the two reviewed/);assert.deepEqual(state(root),before);}));
test('Conversation substitution is rejected before writes',()=>fixture(({root,write,json,commit,spec,prepare})=>{prepare();const pages=json('data/page-index.json');pages.find(p=>p.slug==='home').sourceFile='raw.txt';write('data/page-index.json',pages);const ref=commit(),before=state(root);assert.throws(()=>T.apply(root,ref,spec),/must not be a conversation/);assert.deepEqual(state(root),before);}));
