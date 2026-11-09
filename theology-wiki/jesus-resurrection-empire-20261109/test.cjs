'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {build}=require('./build.cjs'),cfg=require('./manifest.json'),root=__dirname;
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const stripCanonPilate=s=>s.replace(/\n## New comparisons: canon boundaries and Pilate’s reception\n[\s\S]*?(?=\n## Sources and access notes)/,'');
const stripEusebius=s=>stripCanonPilate(s).replace(/\n## Reading the history of orthodoxy\n[\s\S]*?(?=\n## Sources and access notes)/,'');
const stripInheritances=s=>s.replace(/\n## Samaritan textual affinities: a concrete two-way bridge\n[\s\S]*?(?=\n## Enoch, Jubilees)/,'').replace(/\n## Alternative inheritances: a comparison of authority claims\n[\s\S]*?(?=\n## Sources and access notes)/,'');
test('fifteen complete chapters build deterministically and generated outputs are current',()=>{
 assert.equal(cfg.pages.length,15);assert.equal(new Set(cfg.pages.map(p=>p.slug)).size,15);
 assert.deepEqual(build(true),{pages:15,searchSections:156,outputs:19});
 for(const p of cfg.pages){const s=read(p.source);assert.ok(s.split(/\s+/).length>1000,p.slug);assert.ok(s.includes('Sources and access notes'));assert.equal((s.match(/^# /gm)||[]).length,1);}
});
test('search covers every chapter and each section links to its real heading',()=>{
 const data=JSON.parse(read('search-index.json'));assert.equal(new Set(data.map(x=>x.kind)).size,15);
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
 assert.equal(latest.entries.filter(x=>x.date==='2026-11-09'&&x.href.startsWith('../jesus-resurrection-empire-20261109/')).length,15);
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
  const text=stripEusebius(stripInheritances(read('sources/'+slug+'.md')));
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


test('all nine published chapter bodies and their existing wikilinks are preserved',()=>{
 const baseline=require('./origins-prior-source-hashes.json');assert.equal(Object.keys(baseline).length,9);
 for(const [slug,expected] of Object.entries(baseline)){
  const text=stripEusebius(stripInheritances(read('sources/'+slug+'.md')));
  const old=text.replace(/\n## Further connections: John, Constantine and the scrolls\n[\s\S]*?(?=\n## Sources and access notes)/,'');
  assert.equal(crypto.createHash('sha256').update(old).digest('hex'),expected,slug);
  assert.ok(text.includes('## Further connections: John, Constantine and the scrolls'),slug);
 }
});
test('new origins studies retain chronological and evidential distinctions',()=>{
 const m=read('sources/mandaean-origins-john-and-migration.md'),c=read('sources/constantine-consolidation-and-christian-diversity.md'),d=read('sources/dead-sea-scrolls-jewish-diversity-and-empire.md');
 for(const t of ['does not establish it','Müller-Kessler','Mesopotamian','Artabanus','late 20s or early 30s','70 CE','pp. 83–87','do not identify','migration'])assert.ok(m.includes(t),t);
 for(const t of ['**313:**','**325:**','**337:**','**367:**','**380:**','fifty copies','do not promulgate a complete New Testament','real-time split','Romans 13:1–7','Revelation 17–18','Mark 10:42–45','Barnabas','coercion'])assert.ok(c.includes(t),t);
 for(const t of ['not Christian Gospels','textual plurality','1QpHab','VI.2–5','Kittim','Ethiopian','does not say those angels created','not a modern ideal','unbroken Qumran'])assert.ok(d.includes(t),t);
 assert.doesNotMatch(m+c+d,/libfile_|Pasted text|supplied summaries/);
});
test('all new articles connect outward and receive reciprocal links',()=>{
 const newSlugs=cfg.pages.slice(9).map(x=>x.slug);
 for(const slug of newSlugs){
  const source=read('sources/'+slug+'.md');assert.ok((source.match(/\[\[/g)||[]).length>=8,slug);
  assert.ok(cfg.pages.slice(0,9).some(x=>read(x.source).includes('[['+slug+'|')),slug);
  assert.ok(JSON.parse(read('search-index.json')).some(x=>x.kind===slug));
 }
});

test('Eusebius extension preserves all twelve earlier chapter bodies',()=>{
 const baseline=require('./eusebius-prior-source-hashes.json');assert.equal(Object.keys(baseline).length,12);
 let reciprocal=0;
 for(const [slug,expected] of Object.entries(baseline)){
  const source=read('sources/'+slug+'.md');
  assert.equal(crypto.createHash('sha256').update(stripEusebius(stripInheritances(source))).digest('hex'),expected,slug);
  if(source.includes('[[eusebius-bauer-orthodoxy-and-heresy|'))reciprocal++;
 }
 assert.equal(reciprocal,6);
});
test('Eusebius and Bauer chapter preserves chronology, geography, criticism and evidence limits',()=>{
 const slug='eusebius-bauer-orthodoxy-and-heresy',s=read('sources/'+slug+'.md'),h=read(slug+'.html');
 assert.doesNotMatch(h,/\*/,'No unrendered emphasis markers');
 for(const term of ['**1934**','**1971**','Hegesippus','3.25','3.32.7','4.7.1','Irenaeus','Tertullian','Edessa','Egypt','Ephesus, Magnesia, Tralles and Philadelphia','Rome','Harnack','Turner','Robinson','Harrington','Jorgensen','Williams','Nag Hammadi','demographic survey','not automatically','full article was not reviewed'])assert.ok(s.includes(term),term);
 assert.match(s,/did not establish that every alternative was earlier/);
 for(let n=1;n<=19;n++)assert.ok(h.includes('id="ref-'+n+'"'),n);
 assert.ok((s.match(/\[\[/g)||[]).length>=12);
 const map=require('../purpose/reading-map.json');assert.ok(map.some(x=>x.links.some(l=>l.href.endsWith('/'+slug+'.html'))));
 assert.ok(JSON.parse(read('search-index.json')).some(x=>x.kind===slug&&x.text.includes('1934')));
});



test('canon and Pilate extension preserves all thirteen earlier source bodies',()=>{
 const baseline=require('./canon-pilate-prior-source-hashes.json');assert.equal(Object.keys(baseline).length,13);
 for(const [slug,expected] of Object.entries(baseline))assert.equal(crypto.createHash('sha256').update(stripCanonPilate(read('sources/'+slug+'.md'))).digest('hex'),expected,slug);
});
test('new canon and Pilate studies have specific evidence, counterexamples and reciprocal routes',()=>{
 const canon=read('sources/dead-sea-scrolls-and-eusebian-canon.md'),pilate=read('sources/pilate-from-roman-prefect-to-christian-memory.md');
 for(const term of ['3.25','3.9–3.10','CD 16:1–3','graded','Revelation 17–18','4Q246','68 CE','does not document the exact fate','Ethiopian'])assert.ok(canon.includes(term),term);
 for(const term of ['299–305','18.55–59','Luke 13:1','not Pilate','2.7','Senne 25','6.12','sixth-century','collective anti-Jewish'])assert.ok(pilate.includes(term),term);
 for(const slug of ['dead-sea-scrolls-and-eusebian-canon','pilate-from-roman-prefect-to-christian-memory']){
  const links=cfg.pages.slice(0,13).filter(p=>read(p.source).includes('[['+slug+'|'));assert.equal(links.length,6,slug);
  assert.ok(require('../purpose/reading-map.json').some(x=>x.links.some(l=>l.href.endsWith('/'+slug+'.html'))));
 }
});

test('portrayal revision retains every earlier paragraph of the two expanded studies',()=>{
 const baseline=require('./portrayal-prior-source-hashes.json');
 for(const [file,expected] of Object.entries(baseline)){
  const original=read('sources/'+file)
   .replace(/\n## The historical question is how Pilate is portrayed\n[\s\S]*?(?=\n## The governor in Philo and Josephus)/,'')
   .replace(/\n## Track responsibility through each Gospel\n[\s\S]*?(?=\n## The Gospel of Peter intensifies the transfer)/,'')
   .replace(/\n## Three ways a contested past becomes authoritative\n[\s\S]*?(?=\n## Sources and access notes)/,'')
   .replace(/\n12\. \[Helen K\. Bond,[\s\S]*$/,'\n');
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),expected,file);
 }
});

test('portrayal, scholarly disagreement and authority comparisons remain explicit and searchable',()=>{
 const p=read('sources/pilate-from-roman-prefect-to-christian-memory.md'),c=read('sources/dead-sea-scrolls-and-eusebian-canon.md');
 for(const term of ['not an attempt to read his heart','Jewish writers','Matthew alone','Callie Callon','Bruce Chilton','Warren Carter','three independent witnesses','never inherited culpability'])assert.ok(p.includes(term),term);
 for(const term of ['Narrative authority','Institutional authority','Surviving evidence','1934','1971','massacre of all manuscript owners'])assert.ok(c.includes(term),term);
 const data=require('./search-index.json');for(const term of ['Callon','Chilton','Narrative authority'])assert.ok(data.some(r=>r.text.includes(term)),term);
 for(let n=1;n<=16;n++)assert.ok(read('pilate-from-roman-prefect-to-christian-memory.html').includes('id="ref-'+n+'"'),n);
});
