'use strict';
// Exact, repeatable migration of a sourced addendum into the existing article and reader.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dir=__dirname,read=n=>fs.readFileSync(path.join(dir,n),'utf8'),sha=t=>crypto.createHash('sha256').update(t).digest('hex'),plan=JSON.parse(read('apollo-update.json')),receiptPath=path.join(dir,'apollo-revision-receipt.json');
const expected={
 'studies.json':'02a0572119f1c27e77caebc0e8ef630d335ec3aedf1c65b70c5d57bc1694d869',
 'sources.json':'e5a6fc4b553a76c9a44f2ae815c66c6ed82597629e244834904cea9ba1bd1385',
 'records.json':'4858e9232ab25e749b29627a0cd6438833ef94be353f18aa2197fd3f98fc0ee2',
 'manifest.json':'93da4f50de6d540ac4fb9b97aec3c6f32378f0544af4e0bee4a8fc50313d273d',
 'build.cjs':'277e44af910b82f26961b327fe3e877dd1f0952d28292b11c6bceed752310495',
 'research.test.cjs':'83c9d50e255a1e37124125ba52e0b6a80e0215f1a3f9f80e91ad28669a317ca3',
 'README.md':'162d1a859368dad55e9519b752a60bf7a0779b72f72d73f4b56b05229f2e8eb0',
 'browser_checks.py':'a3ab24beace6f273ccd0c32e9dccb179cc0450970f57e1916cb61ac2b24ecfba',
 'hosted_checks.py':'d62feaf82220612743c66a45e5a9fd4b0cb4bac4f247cc28c03de5af087bd551'
};
function once(t,a,b){assert.equal(t.split(a).length,2,'Expected one occurrence of '+a);return t.replace(a,b);}
function run(){
 if(fs.existsSync(receiptPath)){const r=JSON.parse(fs.readFileSync(receiptPath));assert.equal(r.plan_sha256,sha(read('apollo-update.json')));for(const[n,v]of Object.entries(r.files))assert.equal(sha(read(n)),v.after,n);console.log('Apollo addendum already integrated; exact inputs verified.');return;}
 const current={};for(const[n,h]of Object.entries(expected)){current[n]=read(n);assert.equal(sha(current[n]),h,n+' differs from reviewed baseline');}
 const studies=JSON.parse(current['studies.json']),sources=JSON.parse(current['sources.json']),records=JSON.parse(current['records.json']),manifest=JSON.parse(current['manifest.json']);
 assert.equal(plan.edition_date,'2026-09-19');assert.equal(plan.new_sources.length,13);assert.equal(plan.new_comparisons.length,4);assert.equal(plan.additional_sections.length,5);
 const study=studies.studies.find(s=>s.slug===plan.target_study);assert.ok(study);assert.equal(study.sections.length,4);
 const art=study.sections[2];assert.ok(art.paragraphs[1].startsWith("Us Weekly's November 2015"));const originalArt=art.paragraphs[1];art.paragraphs[1]=plan.revised_artwork_paragraph;art.source_ids.push('apollo-mullins');study.sections.push(...plan.additional_sections);study.summary='Reported Apollo imagery, ancient destruction wordplay, distinct dawn figures and the modern interpretive chain, with the limits of each source retained.';studies.edition_date=plan.edition_date;
 const originalSourceIds=new Set(sources.sources.map(s=>s.id));for(const s of plan.new_sources)assert.ok(!originalSourceIds.has(s.id));sources.sources.push(...plan.new_sources);sources.latest_addition_date=plan.edition_date;sources.review_note='The original source entries retain their September 18 scope. Thirteen new records are individually dated September 19; this update does not claim a fresh review of every earlier source.';
 records.comparisons.push(...plan.new_comparisons);records.latest_addition_date=plan.edition_date;
 manifest.edition_date=plan.edition_date;manifest.latest_update_base=plan.base_commit;manifest.scope='Three sourced studies, ten preserved dated AI records and sixteen comparison questions. The September 19 addition develops Apollo/Apollyon wordplay within the existing study. Thirteen added sources bring the register to forty-three. Earlier dates, principal articles and original conversations remain unchanged; search is local.';
 const out={};for(const[n,o]of [['studies.json',studies],['sources.json',sources],['records.json',records],['manifest.json',manifest]])out[n]=JSON.stringify(o,null,2)+'\n';
 let b=once(current['build.cjs'],'SEPTEMBER 18, 2026','SEPTEMBER 19, 2026');b=once(b,"'Twelve comparison questions'","d.comparisons.length+' comparison questions'");out['build.cjs']=b;
 let tests=once(current['research.test.cjs'],'assert.equal(d.comparisons.length,12);','assert.equal(d.comparisons.length,16);');tests=once(tests,'assert.equal(src.sources.length,30);','assert.equal(src.sources.length,43);');tests=once(tests,'assert.equal(ids.size,30);','assert.equal(ids.size,43);');out['research.test.cjs']=tests;
 out['README.md']='September 19 update: the existing gold-apollo-and-fortresses study now incorporates five additional sections on the ancient Apollo/destruction wordplay, Reni\'s distinct figures, Daniel\'s estate/fortress wording, Revelation\'s two trumpet episodes and the supplied writers\' interpretations. Thirteen individually dated source entries and four comparison records were added. The article, local search, sources and plain-text reading are regenerated together; no additional detached reader is created. The current totals are three studies, ten unchanged AI timeline records, sixteen comparisons and forty-three source entries. The original September 18 notes below describe the preceding edition.\n\n'+current['README.md'];
 const marker='  Path(args.screenshots).mkdir(parents=True,exist_ok=True)';
 const browser="  page.goto(base+'gold-apollo-and-fortresses.html#section-5',wait_until='networkidle');assert 'Aeschylus' in page.locator('#section-5').inner_text();checks.append('The existing article route renders the new ancient-wordplay section.')\n  page.goto(base+'sources.html#apollo-mullins',wait_until='networkidle');assert page.locator('main article').count()==43;assert 'caption' in page.locator('#apollo-mullins').inner_text();checks.append('All forty-three source entries include the newly scoped Mullins caption.')\n  page.goto(base+'comparisons.html',wait_until='networkidle');page.select_option('#kind','Ancient literary wordplay');assert page.locator('.filter-record:visible').count()==1;checks.append('The new ancient-wordplay comparison is individually filterable.')\n";
 out['browser_checks.py']=once(current['browser_checks.py'],marker,browser+marker);
 out['hosted_checks.py']=once(current['hosted_checks.py'],"'manifest.json','reader.js','README.md'","'manifest.json','reader.js','README.md','apollo-update.json','apollo-revision-receipt.json'");
 const files={};for(const[n,t]of Object.entries(out)){files[n]={before:expected[n],after:sha(t)};fs.writeFileSync(path.join(dir,n),t);}
 fs.writeFileSync(receiptPath,JSON.stringify({schema_version:1,edition_date:plan.edition_date,base_commit:plan.base_commit,plan_sha256:sha(read('apollo-update.json')),original_artwork_paragraph:originalArt,preserved_timeline_sha256:sha(JSON.stringify(JSON.parse(current['records.json']).timeline)),files},null,2)+'\n');console.log(JSON.stringify({source_total:sources.sources.length,comparison_total:records.comparisons.length,article_sections:study.sections.length}));
}
run();
