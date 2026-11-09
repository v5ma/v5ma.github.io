'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {build}=require('./build.cjs'),cfg=require('./manifest.json'),root=__dirname;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('four complete chapters build deterministically and generated outputs are current',()=>{
 assert.equal(cfg.pages.length,4);assert.equal(new Set(cfg.pages.map(p=>p.slug)).size,4);
 assert.deepEqual(build(true),{pages:4,searchSections:27,outputs:8});
 for(const p of cfg.pages){const s=read(p.source);assert.ok(s.split(/\s+/).length>1000,p.slug);assert.ok(s.includes('Sources and access notes'));assert.equal((s.match(/^# /gm)||[]).length,1);}
});
test('search covers every chapter and each section links to its real heading',()=>{
 const data=JSON.parse(read('search-index.json'));assert.equal(new Set(data.map(x=>x.kind)).size,4);
 for(const r of data){const [file,id]=r.url.split('#');assert.ok(read(file).includes('id="'+id+'"'),r.url);assert.ok(r.text.length);}
 for(const term of ['Pilate','Hebrews','Athanasius','Unorthodox'])assert.ok(data.some(r=>(r.text+r.heading).includes(term)),term);
});
test('all new static pages have accessible structure and valid local targets/fragments',()=>{
 for(const file of ['index.html',...cfg.pages.map(p=>p.slug+'.html')]){
  const h=read(file);assert.match(h,/<html lang="en">/);assert.match(h,/name="viewport"/);assert.match(h,/class="skip" href="#main"/);assert.equal((h.match(/<h1>/g)||[]).length,1);
  const ids=[...h.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,file);
  for(const m of h.matchAll(/(?:href|src)="([^"]+)"/g)){
   const url=m[1].replace(/&amp;/g,'&');if(/^https?:/.test(url))continue;
   const [base,frag]=url.split('#');const target=path.resolve(root,base.split('?')[0]||file);
   assert.ok(fs.existsSync(target),file+' => '+url);
   if(frag&&!base.includes('?'))assert.ok(fs.readFileSync(target,'utf8').includes('id="'+frag+'"'),file+' => '+url);
  }
 }
});
test('Latest includes each new page once without removing the previous release records',()=>{
 const latest=JSON.parse(fs.readFileSync(path.join(root,'../latest/manifest.json'),'utf8'));
 assert.equal(latest.entries.filter(x=>x.date==='2026-11-09').length,4);
 for(const p of cfg.pages)assert.equal(latest.entries.filter(x=>x.href==='../jesus-resurrection-empire-20261109/'+p.slug+'.html').length,1);
 assert.ok(latest.entries.some(x=>x.date==='2026-11-07'));assert.equal(latest.entries.filter(x=>x.date==='2026-11-06').length,6);
});
test('source integrity, primary comparisons and attribution boundaries remain explicit',()=>{
 const report=JSON.parse(read('build-report.json'));
 for(const p of report.pages){assert.equal(crypto.createHash('sha256').update(read(p.source)).digest('hex'),p.sourceSha256);assert.doesNotMatch(read(p.source),/Darlene|Sentinel_|CalpicoFile_|libfile_|white flag|checkmate/);}
 const purpose=read(cfg.pages[0].source),creeds=read(cfg.pages[2].source),empire=read(cfg.pages[3].source);
 assert.match(purpose,/Unorthodox Interpretation that changes the Orthodox Interpretation/);assert.match(purpose,/manuscript/);assert.match(purpose,/settled belief/);
 for(const term of ['Galatians','Philippians','Colossians','Hebrews','Genesis','Mark 12','full article'])assert.ok(creeds.includes(term),term);
 for(const term of ['Philo','Josephus','Bond','Carter','state authorship','collectively'])assert.ok(empire.includes(term),term);
});
