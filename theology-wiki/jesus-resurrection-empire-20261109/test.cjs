'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {build}=require('./build.cjs'),cfg=require('./manifest.json'),root=__dirname;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('nine complete chapters build deterministically and generated outputs are current',()=>{
 assert.equal(cfg.pages.length,9);assert.equal(new Set(cfg.pages.map(p=>p.slug)).size,9);
 assert.deepEqual(build(true),{pages:9,searchSections:73,outputs:13});
 for(const p of cfg.pages){const s=read(p.source);assert.ok(s.split(/\s+/).length>1000,p.slug);assert.ok(s.includes('Sources and access notes'));assert.equal((s.match(/^# /gm)||[]).length,1);}
});
test('search covers every chapter and each section links to its real heading',()=>{
 const data=JSON.parse(read('search-index.json'));assert.equal(new Set(data.map(x=>x.kind)).size,9);
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
 assert.equal(latest.entries.filter(x=>x.date==='2026-11-09'&&x.href.startsWith('../jesus-resurrection-empire-20261109/')).length,9);
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

test('wikilinks resolve to verified reader routes or companion pages and are indexed as readable text',()=>{
 const known=new Set(cfg.verifiedReaderRoutes.map(x=>x.slug)),local=new Set(cfg.pages.map(x=>x.slug));
 const reader=JSON.parse(fs.readFileSync(path.join(root,'../data/page-index.json'),'utf8'));
 for(const slug of known)assert.ok(reader.some(x=>x.slug===slug),slug);
 let count=0;
 for(const p of cfg.pages){const source=read(p.source),html=read(p.slug+'.html');
  for(const m of source.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)){
   count++;assert.ok(known.has(m[1])||local.has(m[1]),m[1]);
   const href=local.has(m[1])?m[1]+'.html':'../san-reader.html?page='+m[1];assert.ok(html.includes('href="'+href+'"'),href);
  }
  assert.ok(!html.includes('[['),p.slug);
 }
 assert.ok(count>=50,count);assert.ok(!read('search-index.json').includes('[['));
});
test('the four earlier source bodies are unchanged apart from additive bridge sections',()=>{
 const hashes=require('./prior-source-hashes.json');
 for(const [slug,expected] of Object.entries(hashes)){
  const text=read('sources/'+slug+'.md');
  const original=text.replace(/\n## (A new comparison: competing meanings of the cross|The next step: Nag Hammadi and competing crosses|Compare salvation language beyond the early formulas|Beyond Pilate: who controls the meaning of the cross\?)\n[\s\S]*?(?=\n## Sources and access notes)/,'');
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),expected,slug);
  assert.match(text,/\[\[(?:competing-crosses-and-imperial-capture|ransom-revelation-and-defeated-rulers)/);
 }
});
test('new studies preserve textual distinctions and bounded interpretation',()=>{
 const ap=read('sources/laughing-jesus-apocalypse-of-peter.md'),truth=read('sources/gospel-of-truth-cross-and-knowledge.md'),canon=read('sources/canon-coercion-and-nag-hammadi-survival.md'),ransom=read('sources/ransom-revelation-and-defeated-rulers.md');
 for(const x of ['81.3–24','79.22–31','ransom','translation difference','unknown'])assert.ok(ap.includes(x),x);
 for(const x of ['18.21–31','not established','not one uninterrupted quotation','does not explicitly identify Error as Rome','life for many'])assert.ok(truth.includes(x),x);
 for(const x of ['3.64–66','367','remains debated','funerary','monastic','not a cache of Christian Gospels'])assert.ok(canon.includes(x),x);
 for(const x of ['Mark 10:42–45','1 Corinthians 2:6–8','Colossians 2:13–15','Neither saying names a recipient'])assert.ok(ransom.includes(x),x);
 for(const p of cfg.pages){const html=read(p.slug+'.html');for(const m of html.matchAll(/class="citation" href="#(ref-\d+)"/g))assert.ok(html.includes('id="'+m[1]+'"'),p.slug+': '+m[1]);}
});
