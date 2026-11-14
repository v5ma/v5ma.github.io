'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=__dirname,read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'),cfg=JSON.parse(read('manifest.json'));
test('all manifest studies build deterministically',()=>{assert.equal(cfg.pages.length,8);assert.equal(require('./build.cjs').build(true).pages,cfg.pages.length);});
test('evidence studies have source links and access or review status',()=>{for(const p of cfg.pages){const src=read('sources/'+p.slug+'.md');assert.match(src,/https:\/\//);assert.match(src,/access|review status|Review status/);assert.doesNotMatch(src,/(^|\n)(Micah Blumberg|Self Aware Networks GPT):/);assert.doesNotMatch(src,/human-authored|100% verified|bulletproof/i);}});
test('all local HTML links and anchors resolve',()=>{for(const name of ['index',...cfg.pages.map(p=>p.slug)]){const html=read(name+'.html');for(const m of html.matchAll(/href="([^"]+)"/g)){const href=m[1].replace(/&amp;/g,'&'),u=new URL(href,'https://wiki.example/theology-wiki/evidence-review-20261109/'+name+'.html');if(u.origin!=='https://wiki.example')continue;const file=path.join(ROOT,'..','..',decodeURIComponent(u.pathname));assert.ok(fs.existsSync(file),name+': '+href);if(u.hash&&file.endsWith('.html'))assert.ok(fs.readFileSync(file,'utf8').includes('id="'+decodeURIComponent(u.hash.slice(1))+'"'),href);}}});
test('search covers each study and only existing sections',()=>{const rows=JSON.parse(read('search-index.json'));assert.deepEqual(new Set(rows.map(r=>r.kind)),new Set(cfg.pages.map(p=>p.slug)));for(const r of rows){const [file,id]=r.url.split('#');assert.ok(read(file).includes('id="'+id+'"'));}assert.ok(rows.some(r=>r.text.includes('4Q114')));assert.ok(rows.some(r=>r.text.includes('KH1')));});
test('all conversations receive reliability warning, selected routes receive accurate companions',()=>{const ctx={window:{}};vm.runInNewContext(read('reader-guide.js'),ctx);for(const slug of [...Object.keys(cfg.archiveCompanions),'unreviewed-example']){const out=ctx.window.TheologyReview.sourceGuide({slug});assert.match(out,/not verified historical authority/);assert.match(out,/preservation, not factual accuracy/);assert.equal(out.includes('class="evidence-companion"'),slug in cfg.archiveCompanions);}assert.equal(Object.keys(cfg.archiveCompanions).length,8);});
test('reader wiring retains transcript path and original turn behavior',()=>{const src=read('../assets/js/research-tools.js');assert.match(src,/TheologyReview\?\.sourceGuide\(p\)/);assert.match(src,/TheologyReview\?\.enhance\(p\)/);assert.match(src,/Source hash differs from the recorded manifest/);assert.match(src,/sourceTurns=C\.splitTranscript/);assert.match(src,/has\('turn'\)\)loadSource\(p\)/);for(const p of ['index.html','san-reader.html'])assert.match(read('../'+p),/evidence-review-20261109\/reader-guide\.js/);});
test('artifact distinctions and unrevised archive warning remain explicit',()=>{const d=read('sources/dead-sea-scrolls-dating.md'),m=read('sources/linguistic-epigraphic-matrix.md'),policy=read('sources/evidence-and-editorial-method.md');assert.match(d,/4Q114/);assert.match(d,/4Q109/);assert.match(d,/Neither identifies an autograph/);assert.match(m,/existence, circulation, authority and observance/);assert.match(policy,/not a completed claim-by-claim review/);assert.match(policy,/not independently peer-reviewed/i);});

test('Paul and James companion preserves evidence distinctions and search coverage',()=>{const s=read('sources/paul-james-and-contested-authority.md');assert.match(s,/James does not name Paul/);assert.match(s,/Neither observation alone proves pseudonymous authorship/);assert.match(s,/late-second-century opponent/);assert.ok(JSON.parse(read('search-index.json')).some(r=>r.kind==='paul-james-and-contested-authority'&&r.text.includes('Antioch')));for(const slug of ['paul-vs-james-movement','churches-rejecting-paul-s-writings','paul-vs-jesus-teachings','jesus-vs-paul-on-salvation'])assert.equal(cfg.archiveCompanions[slug],'paul-james-and-contested-authority');});


test('Dan summary preserves attribution and contested-source boundaries',()=>{const s=read('sources/dan-mcclellan-texts-history-and-method.md');assert.match(s,/not a text written or approved by McClellan/);assert.match(s,/original response video's title, URL/);assert.match(s,/does not establish that the community invented it/);assert.match(s,/Two-Source model/);assert.match(s,/Farrer model/);assert.match(s,/does not imply his endorsement/);assert.ok(JSON.parse(read('search-index.json')).some(r=>r.kind==='dan-mcclellan-texts-history-and-method'));});

test('Hyksos study separates dates, identity and memory',()=>{const s=read('sources/hyksos-thera-and-exodus-memory.md');assert.match(s,/Research question contributed by Micah Blumberg/);assert.match(s,/not a fresh recalibration/);assert.match(s,/not a statistical score/);assert.match(s,/not a demonstrated chain/);assert.ok(JSON.parse(read('search-index.json')).some(r=>r.kind==='hyksos-thera-and-exodus-memory'));});

test('city comparison preserves archaeological and textual distinctions',()=>{const s=read('sources/hyksos-thera-and-exodus-memory.md');assert.match(s,/Lachish is not a clean negative case/);assert.match(s,/not a city Joshua is said to destroy/);assert.match(s,/settlement levels|Settlement levels/);assert.match(s,/thirteen of sixteen/);assert.match(s,/not simply accepting every conventional 1550 date/);for(const city of ['Hazor','Hebron','Bethel','Shiloh','Gibeon','et-Tell','Arad','Heshbon','Dibon','Lachish'])assert.ok(s.includes(city));});

test('conditional reconstruction distinguishes sources, sequence and chronology', () => {
  const text = fs.readFileSync(path.join(__dirname, 'sources/hyksos-thera-and-exodus-memory.md'), 'utf8');
  for (const phrase of ['Micah Blumberg', '1510 BCE', 'after his reign', 'assigned to Ephraim', 'before the collective departure', 'above', 'not a fixed synchronism']) assert.ok(text.includes(phrase), phrase);
});

test('calf and chronology update retains competing witnesses and local limits', () => {
 const text=fs.readFileSync(path.join(__dirname,'sources/hyksos-thera-and-exodus-memory.md'),'utf8');
 for(const phrase of ['Deuteronomy 10:1–5','1492 BCE','local gate evidence',"Aaron's origin"]) { assert.ok(text.includes(phrase),phrase); }
});

test('regional memory comparison distinguishes textual integration from population history', () => {
 const text=fs.readFileSync(path.join(__dirname,'sources/hyksos-thera-and-exodus-memory.md'),'utf8');
 for(const phrase of ['Joshua 24:5–7','MacDonald','favissa','old age','not identical names','literary integration and actual Bronze Age population integration']) assert.ok(text.includes(phrase),phrase);
});

test('positive comparison keeps shared criteria and duration alternatives',()=>{const s=read('sources/hyksos-thera-and-exodus-memory.md');for(const phrase of ['The positive comparative case','Forty days and forty years','No aggregate score','Candelora','Höflmayer'])assert.ok(s.includes(phrase),phrase);});

test('transmission comparison distinguishes direct events and cultural memory',()=>{const s=read('sources/hyksos-thera-and-exodus-memory.md');for(const phrase of ['Avaris → Midian → Canaan','Killebrew','Hendel','Papyrus Anastasi V','not an established archaeological observation'])assert.ok(s.includes(phrase),phrase);});
