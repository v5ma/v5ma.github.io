#!/usr/bin/env node
'use strict';
// Rebuild only the Theology collection. Published source bytes and other projects are read-only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),SITE=path.dirname(ROOT);
const C=require('../assets/js/research-core.js'),base=require('../editorial/edition.cjs'),X=require('../editorial/expansion.cjs');
const E={...base,version:X.version,articles:[...X.articles,...base.articles],paths:[...X.paths,...base.paths]};
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'),json=p=>JSON.parse(read(p).replace(/^\uFEFF/,''));
const write=(p,value)=>{const target=path.join(ROOT,p);if(!target.startsWith(ROOT+path.sep))throw Error('Out-of-scope write');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);};
const emit=(p,value)=>write(p,JSON.stringify(value,null,2)+'\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const metadata=(text,name)=>text.match(new RegExp('^'+name+':\\s*"?([^"\\r\\n]+)"?','m'))?.[1]?.trim()||'';
const topicRules=[
 ['apocalypse',/antichrist|anti-christ|revelation|prophe|horsemen|horseman|beasts|gog|magog|rapture|apocaly|eschatolog|daniel/],
 ['gnosis',/gnostic|gnosis|sophia|archon|pleroma|judas|henosis/],
 ['practice',/hicks|attraction|faith|comfort|joy|spiritual experience|psychedelic|meditation|dream|oneness|awakening|vessel|dmt|positive thinking|focus your energy/],
 ['origins',/qumran|scroll|egypt|canaan|sumer|exodus|yahweh|yahwey|elohim|enki|enoch|ancient|moses|abraham|temple|textual|bible text|pilate|herod|midian|assyri|maccabee|talmud|torah|resurrection|inanna|joseph|hellenistic/],
 ['machines',/\bagi\b|\bai\b|robot|conscious|information|mind of god|proof of god|science|quantum|riemann|neuro|thermodyn|coherence|god.*existence|self.*existence/],
 ['traditions',/samaritan|islam|muslim|sunni|shia|buddh|kabbalah|zoroastr|judaism|christianity|catholic|calvary|monothe|religion|church/],
 ['jesus',/jesus|christ|paul|gospel|galatians|samuel|moral|salvation|divine|sin|biblical|bible/]
];
function category(title){return topicRules.find(([,re])=>re.test(C.normalize(title)))?.[0]||'context';}
function front(p,body){return `---\ntitle: ${JSON.stringify(p.title)}\nslug: ${JSON.stringify(p.slug)}\nsummary: ${JSON.stringify(p.summary)}\ntopic: ${JSON.stringify(p.topic||p.category)}\nstatus: ${JSON.stringify(p.kind)}\nupdated: ${JSON.stringify(p.updated||X.updated)}\n---\n\n# ${p.title}\n\n${body.trim()}\n`;}
function patchOnce(text,old,value){if(!text.includes(old))throw Error('Reader baseline changed: '+old.slice(0,65));return text.replace(old,value);}
function build(){
 const manifest=JSON.parse(fs.readFileSync(path.join(SITE,'theology-sources/manifest.json'),'utf8').replace(/^\uFEFF/,''));
 const chats=new Map(),postings=Object.create(null),bodies=new Map(),sourceById=new Map();
 for(const m of manifest){
  if(!C.safeSourceFile(m.name))throw Error('Unsafe source name '+m.name);
  const bytes=fs.readFileSync(path.join(SITE,'theology-sources/chats',m.name));
  if(bytes.length!==m.bytes||sha(bytes)!==m.sha256.toLowerCase())throw Error('Source integrity mismatch '+m.name);
  const text=bytes.toString('utf8'),turns=C.splitTranscript(text),id=m.name.match(/^gpt2026dragon(\d+)_/)[1];
  chats.set(m.name,{...m,sha256:m.sha256.toLowerCase(),id,text,turns,date:C.dateFromExport(text)});
 }
 let pages=json('data/page-index.json').filter(p=>!p.editionGenerated).map(p=>({...p}));
 const bySlug=new Map(pages.map(p=>[p.slug,p]));
 for(const p of pages){
  const raw=read('content/'+p.path),clean=C.cleanRouting(raw),file=metadata(raw,'source_export_file');
  p.aliases=[...new Set([...(Array.isArray(p.aliases)?p.aliases:[]),...(X.aliases[p.slug]||[])])];
  p.category=category(p.title);p.kind='Legacy research note';p.topic=E.categories.find(c=>c.id===p.category).title;p.related=[];delete p.renderMode;
  const s=chats.get(file);
  if(s){
   const first=s.turns.find(t=>t.speaker==='Micah Blumberg')?.text||s.turns[0]?.text||'';
   p.kind='Conversation record';p.sourceFile=file;p.sourceSha256=s.sha256;p.sourceBytes=s.bytes;p.date=s.date;p.turnCount=s.turns.length;
   p.summary=first.split(/\n\s*\n/).find(x=>x.trim())?.replace(/\s+/g,' ').slice(0,350)||p.title;
   if(first.length>p.summary.length&&p.summary.length>=350)p.summary=p.summary.slice(0,347)+'...';
   p.tags=[p.category,'conversation'];p.primaryExcerpt=first.slice(0,1400);sourceById.set(s.id,p);
   bodies.set(p.slug,s.text);
  }else {bodies.set(p.slug,clean);p.tags=[p.category,'legacy'];}
 }
 if(sourceById.size!==manifest.length)throw Error('Every chat needs exactly one indexed conversation record: '+sourceById.size+' / '+manifest.length);
 function add(p,body){
  const existing=bySlug.get(p.slug);if(existing&&p.slug!=='home')throw Error('Refusing to overwrite existing page '+p.slug);
  const row={...p,aliases:[...new Set([...(p.aliases||[]),...(X.aliases[p.slug]||[])])],path:p.path||'developed/'+p.slug+'.md',topic:E.categories.find(c=>c.id===p.category)?.title||'Theology',tags:[p.category,p.kind==='Developed article'?'developed':'navigation'],editionGenerated:p.slug!=='home',xrRoomId:'theology-'+p.slug,xrDeckId:'theology-reader'};
  row.sourceFiles=[row.path];row.references=(p.sourceIds||[]).map(id=>{const s=sourceById.get(id);if(!s)throw Error('Unknown source ID '+id);return {slug:s.slug,file:s.sourceFile,title:s.title,date:s.date,sha256:s.sourceSha256};});
  if(row.references.length)body+='\n\n## Source conversations\n\n'+row.references.map(s=>`[[${s.slug}|${s.title}]] is the archived discussion dated ${s.date||'unknown'} (UTC export metadata).`).join('\n\n')+'\n\n'+p.attribution;
  if(p.externalSources?.length){
   const refs=p.externalSources.map(id=>{const r=X.references.find(x=>x.id===id);if(!r)throw Error('Unknown external reference '+id);const url=new URL(r.url);if(url.protocol!=='https:'||url.username||url.password)throw Error('Unsafe citation '+id);return r;});
   body+='\n\n## External sources and access notes\n\n'+refs.map(r=>`[${r.title}](${r.url})\n\n${r.scope} Consulted ${r.accessed}.`).join('\n\n');
  }
  const followups={'apocalyptic-repair-theology':['trump-first-beast-of-revelation','ukraine-russia-forecast-record'],'christ-as-an-inner-model':['jesus-teacher-of-righteousness-hypothesis'],'gnosticism-and-temple-trauma':['jesus-teacher-of-righteousness-hypothesis','moses-volcano-and-exodus-chronology'],'samaritan-texts-and-sacred-authority':['el-in-ancient-egypt','kenite-hypothesis-and-yahweh-origins']};
  if(followups[p.slug])body+='\n\n## Related investigations\n\n'+followups[p.slug].map(id=>{const dest=X.articles.find(x=>x.slug===id);return `[[${id}|${dest.title}]]`;}).join('\n\n');
  if(p.art)body+=`\n\n## Visual context\n\nSee [[image-collection|the credited image collection]] for the artwork shown with this article.`;
  row.readMinutes=Math.max(1,Math.ceil(body.split(/\s+/).length/200));
  if(existing){Object.assign(existing,row);bySlug.set(row.slug,existing);}else{pages.push(row);bySlug.set(row.slug,row);}
  write('content/'+row.path,front(row,body));bodies.set(row.slug,body);
 }
 for(const p of E.articles)add(p,p.body);
 for(const [slug,names] of Object.entries(X.aliases))if(!bySlug.has(slug))throw Error('Alias destination missing '+slug);
 const ledger=JSON.parse(JSON.stringify(X.ledger));
 for(const e of ledger.entries){
  if(e.sourceId){const p=sourceById.get(e.sourceId);if(!p)throw Error('Unknown ledger source '+e.sourceId);e.sourceSlug=p.slug;e.sourceHash=p.sourceSha256;e.sourceFile=p.sourceFile;const t=chats.get(p.sourceFile).turns[e.turn-1];if(!t||t.speaker!=='Micah Blumberg')throw Error('Ledger turn must be an author turn');}
  if(e.reference){const r=X.references.find(r=>r.id===e.reference);if(!r)throw Error('Unknown ledger reference');e.sourceURL=r.url;e.sourceTitle=r.title;}
  delete e.sourceId;
 }
 const ledgerBody='This register separates predictions, interpretation updates and recovery leads. No outcome audit has been performed, and no fulfilled-prediction count is claimed. Criteria below are proposed editorial tests, not the author\'s original preregistration.\n\n'+ledger.entries.map(e=>`## ${e.date}: ${e.title}\n\n${e.recordType}. ${e.sourceStatus}. Evaluation: ${e.evaluation}.\n\n${e.claim}\n\nDate basis: ${e.dateBasis}\n\nHorizon: ${e.horizon}\n\nMechanism: ${e.mechanism}\n\nConditions: ${e.conditions}\n\n${e.criterion}\n\n${e.sourceSlug?`[[${e.sourceSlug}|Read the original conversation]] (turn ${e.turn}).`:e.sourceURL?`[Read the source publication](${e.sourceURL})`:'Source recovery is pending; this is not a new transcript.'}`).join('\n\n')+'\n\nContinue with [[ukraine-russia-forecast-record|the Ukraine and Russia forecast record]], [[trump-first-beast-of-revelation|Trump and the First Beast]] or [[research-method|the editorial method]].';
 add({slug:'forecast-ledger',title:'Dated forecast ledger',category:'apocalypse',kind:'Navigator',summary:'A dated source register of predictions, interpretation updates and recovery leads, without retrospective scoring.'},ledgerBody);
 emit('data/forecast-ledger.json',ledger);
 emit('data/external-sources.json',X.references);
 add({...E.method,updated:'2026-09-04'},E.method.body);
 for(const c of E.categories){
  const records=pages.filter(p=>p.category===c.id&&p.sourceFile).sort((a,b)=>a.title.localeCompare(b.title));
  const developed=E.articles.filter(p=>p.category===c.id);
  const body=`${c.description}\n\n## Start with a developed argument\n\n${developed.length?developed.map(p=>`[[${p.slug}|${p.title}]]: ${p.summary}`).join('\n\n'):`[[research-method|From a conversation to a developed article]] explains how context becomes a source-grounded argument.`}\n\n## Browse the source discussions\n\nThese ${records.length} conversations are grouped using provisional topic assignments. Their original words are unchanged; a topic assignment does not imply endorsement of every statement in the discussion.\n\n${records.map(p=>`[[${p.slug}|${p.title}]] (${p.date||'date unavailable'}).`).join('\n\n')}\n\nReturn to [[home|the library]] or open [[sources-index|the full conversation catalogue]].`;
  add({slug:'topic-'+c.id,title:c.title,summary:c.description,category:c.id,kind:'Topic collection'},body);
 }
 const home=`The Theology Wiki follows Micah Blumberg's questions about awakening, religious authority, historical catastrophe and the possibility of repair. Begin with a developed argument, then follow its links into the conversations that shaped it.\n\n## Ideas developed from the conversations\n\n${E.articles.map(p=>`[[${p.slug}|${p.title}]]: ${p.summary}`).join('\n\n')}\n\n## Explore a subject\n\n${E.categories.map(c=>`[[topic-${c.id}|${c.title}]]: ${c.description}`).join('\n\n')}\n\n## Follow a longer question\n\n[[forecast-ledger|The dated forecast ledger]] distinguishes predictions from outcomes and recovery leads. [[reading-paths|Reading paths]] connect several arguments. [[sources-index|The conversation catalogue]] opens all ${manifest.length} published chats. [[connections|The connection map]] shows actual article links. [[image-collection|The image collection]] identifies every artwork and its source.\n\n## About this edition\n\n${E.articles.length} developed articles accompany the source archive. They are AI-assisted editorial syntheses, not replacement transcripts or newly attributed quotations. The rest of the collection includes source records and legacy research notes. [[research-method|Read the editorial method]] for speaker attribution, dates, claim status and source integrity.`;
 add({slug:'home',path:'home.md',title:'Theology Wiki',category:'context',kind:'Library home',summary:'Explore original questions, developed arguments and 354 source conversations.'},home);
 add({slug:'reading-paths',title:'Reading paths',category:'context',kind:'Navigator',summary:'Follow a question across the developed articles.'},E.paths.map(p=>`## ${p.title}\n\n${p.description}\n\n${p.pages.map(s=>`[[${s}|${bySlug.get(s).title}]]`).join('\n\n')}`).join('\n\n'));
 add({slug:'connections',title:'Connections between ideas',category:'context',kind:'Navigator',summary:'Explore explicit wikilinks and source relationships without treating resemblance as equivalence.'},'## Follow an argument\n\nChoose a page in the connection explorer below. Lines represent explicit reader links; incoming and outgoing relationships are also listed in text.\n\n[[reading-paths|Reading paths]] offer a guided alternative.');
 add({slug:'image-collection',title:'Images, manuscripts and interpretation',category:'context',kind:'Navigator',summary:'Historical artworks with their dates, institutional records, credits and reasons for inclusion.'},'## A picture also needs a source\n\nThe collection distinguishes historical objects from later interpretations of sacred narratives. Each image includes its museum record and public-domain status. An illustration is not independent verification of the theology it accompanies.');
 // Existing source-index remains at its established URL; only its generated landing content changes.
 const sourceIndex=bySlug.get('sources-index');sourceIndex.kind='Source catalogue';sourceIndex.category='context';sourceIndex.summary='Search, sort and open all 354 original conversations, with speaker labels and UTC export dates.';sourceIndex.primaryExcerpt='';
 const sb='## Read the conversations behind the ideas\n\nThe full catalogue below preserves the 354 published AI chats. Search matches may come from either speaker, not necessarily from Micah\'s own statements. Dates are export metadata, not independent publication certificates.\n\n'+E.categories.map(c=>`[[topic-${c.id}|${c.title}]]`).join('\n\n');
 write('content/'+sourceIndex.path,front(sourceIndex,sb));bodies.set(sourceIndex.slug,sb);
 const graph={},backlinks={};for(const p of pages){graph[p.slug]=[];backlinks[p.slug]=[];}
 for(const p of pages){
  let targets;
  if(p.sourceFile)targets=['topic-'+p.category];
  else targets=[...String(bodies.get(p.slug)||'').matchAll(/\[\[([^\]|#]+)(?:[^\]]*)\]\]/g)].map(m=>m[1]);
  // Index is an established alias used in legacy home/source pages.
  if(p.editionGenerated||p.slug==='home'){for(const t of targets)if(!bySlug.has(t)&&t!=='index')throw Error('Broken authored wikilink '+p.slug+' -> '+t);}
  p.related=[...new Set(targets.map(s=>s==='index'?'sources-index':s).filter(s=>s!==p.slug&&bySlug.has(s)))];graph[p.slug]=p.related;
  for(const target of p.related)backlinks[target].push(p.slug);
  const text=bodies.get(p.slug)||'';for(const term of C.tokens(text+' '+p.title+' '+p.summary+' '+(p.aliases||[]).join(' '))){if(term.length>60)continue;(postings[term]??=[]).push(pages.indexOf(p));}
 }
 const seenRefs=new Set();for(const r of X.references){if(seenRefs.has(r.id))throw Error('Duplicate external reference');seenRefs.add(r.id);}
 for(const p of pages){p.backlinkCount=backlinks[p.slug].length;p.backlinks=backlinks[p.slug];delete p.body;delete p.sourceIds;}
 emit('data/page-index.json',pages);emit('data/graph.json',{schema:'theology-source-edition/v2',related:graph});
 emit('data/research.json',{version:E.version,categories:E.categories,paths:E.paths,sourceCount:manifest.length,developedCount:E.articles.length,featured:X.articles.map(p=>p.slug),forecastRecords:ledger.entries.length,sourceIntegrity:'354/354 matched existing SHA-256 manifest',backlinks});
 write('data/search.json',JSON.stringify({version:E.version,ids:pages.map(p=>p.slug),scope:'All published chat text, both speakers, and reader text. AND keyword search; not author endorsement.',postings})+'\n');
 patchReaders();
 const report={version:E.version,pages:pages.length,readingPaths:E.paths.length,forecastRecords:ledger.entries.length,externalSources:X.references.length,sourceChats:manifest.length,verifiedHashes:chats.size,developedArticles:E.articles.length,topicCollections:E.categories.length,links:Object.values(graph).reduce((n,x)=>n+x.length,0),searchTerms:Object.keys(postings).length,sourceBytes:[...chats.values()].reduce((n,x)=>n+x.bytes,0)};
 emit('data/build-report.json',report);return report;
}
function patchReaders(){
 const integration=path.join(SITE,'scripts/prepare-interactive-site.py');
 if(fs.existsSync(integration)){
  const old=fs.readFileSync(integration,'utf8');
  const needle="(ROOT/'theology-wiki/san-reader.html').write_text(s)";
  if(!old.includes('Preserve the Theology source edition')){
   if(!old.includes(needle))throw Error('Legacy integration baseline changed');
   fs.writeFileSync(integration,old.replace(needle,"# Preserve the Theology source edition rather than regenerating its old shell.\nif '<!-- theology-source-edition-assets -->' not in (ROOT/'theology-wiki/san-reader.html').read_text():\n    "+needle));
  }
 }

 let runtime=fs.readFileSync(path.join(SITE,'san-wiki-shell/assets/js/wiki-app.js'),'utf8');
 runtime=patchOnce(runtime,'  const state = {','  let renderGeneration = 0;\n  const state = {');
 runtime=patchOnce(runtime, `return '<a class="wiki-link" href="' + escapeHtml(localPageHref(page.slug)) + '">' + escapeHtml(label) + '</a>';`, `return '<a class="wiki-link" data-page="' + escapeHtml(page.slug) + '" href="' + escapeHtml(localPageHref(page.slug)) + '">' + escapeHtml(label) + '</a>';`);
 runtime=patchOnce(runtime, '(_match, target) => renderWikilink(target)', '(_match, target) => renderWikilink(target.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,String.fromCharCode(34)).replace(/&#39;/g,String.fromCharCode(39)))');

 runtime=patchOnce(runtime,"    if (localPreviewHost) return true;","    if (localPreviewHost && url.origin === window.location.origin && /^\\/(?:theology-wiki|theology-sources)\\//.test(pathname)) return false;\n    if (localPreviewHost) return true;");
 runtime=patchOnce(runtime,'  function renderPageList() {','  function renderPageList() {\n    if (window.TheologyExtension && state.pages.length) { window.TheologyExtension.navigation(state.pages, state.currentPage, state.searchTerm); return; }');
 runtime=patchOnce(runtime,'    const raw = cleanMarkdownHref(href);','    const raw = cleanMarkdownHref(href);\n    if (/^(?:javascript|vbscript|file|data|blob):/i.test(raw)) return "#unsafe-link";');
 runtime=patchOnce(runtime,'    state.currentPage = page;','    const generation = ++renderGeneration;\n    state.currentPage = page;\n    window.dispatchEvent(new CustomEvent("theology:loading", {detail:{slug:page.slug}}));');
 runtime=patchOnce(runtime,'      const markdown = await fetchText(path);','      const markdown = await fetchText(path);\n      if (generation !== renderGeneration) return;');
 runtime=patchOnce(runtime,'      applyPublicLinkPolicy(elements.articleBody);','      applyPublicLinkPolicy(elements.articleBody);\n      window.dispatchEvent(new CustomEvent("theology:page", {detail:page}));');
 runtime=patchOnce(runtime,"      elements.articleBody.innerHTML = '<p class=\"wiki-error\">Could not load source markdown: '","      if (generation !== renderGeneration) return;\n      elements.articleBody.innerHTML = '<p class=\"wiki-error\">Could not load source markdown: '");
 runtime=patchOnce(runtime,'  function showMissingPage(slug) {','  function showMissingPage(slug) {\n    ++renderGeneration;\n    window.dispatchEvent(new CustomEvent("theology:loading", {detail:{slug}}));');
 runtime=patchOnce(runtime,'  function navigateToPage(slug, pushState) {','  function navigateToPage(slug, pushState, requestedHref) {');
 runtime=patchOnce(runtime,"      const params = new URLSearchParams(window.location.search || '');\n      params.set(CONTRACT.routeParam, normalized);\n      window.history.pushState({}, '', window.location.pathname + '?' + params.toString());","      const requested = requestedHref ? new URL(requestedHref, window.location.href) : null;\n      const params = new URLSearchParams(requested ? requested.search : window.location.search || '');\n      if (!requested) { params.delete('turn'); params.delete('focus'); }\n      params.set(CONTRACT.routeParam, normalized);\n      window.history.pushState({}, '', window.location.pathname + '?' + params.toString() + (requested?.hash || '')); ");
 runtime=patchOnce(runtime,"      document.addEventListener('click', (event) => {","      document.addEventListener('click', (event) => {\n        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;");
 runtime=patchOnce(runtime,'        navigateToPage(slug, true);','        navigateToPage(slug, true, href);');
 runtime=patchOnce(runtime,'      hydratePages(pageIndex);','      hydratePages(pageIndex);\n      window.TheologyReader = { pages: () => state.pages.slice(), current: () => state.currentPage, refresh: renderPageList, navigate: navigateToPage };\n      state.searchTerm = new URLSearchParams(window.location.search).get("q") || "";\n      if (elements.search) elements.search.value = state.searchTerm;\n      window.dispatchEvent(new CustomEvent("theology:ready"));');
 runtime=patchOnce(runtime,'      const page = findPageByRoute(requested) || findPageByRoute(CONTRACT.fallbackSlug) || state.pages[0];','      const page = findPageByRoute(requested);');
 write('assets/js/theology-reader.js','/* Theology-local SAN runtime adapter, generated by tools/build.cjs. Do not edit the shared SAN reader. */\n'+runtime);
 let html=read('san-reader.html');
 if(!html.includes('theology-source-edition-assets')){
  html=patchOnce(html,'The public SAN Wiki reader shell. SAN article content is intentionally omitted from this package.','Theology Wiki: source-grounded articles and 354 archived conversations by Micah Blumberg.');
  html=patchOnce(html,'</head>','  <!-- theology-source-edition-assets -->\n  <link rel="stylesheet" href="./assets/css/research.css?v='+E.version+'">\n</head>');
  html=patchOnce(html,'THEOLOGY COLLECTION / SAN READER','MICAH BLUMBERG / THEOLOGY RESEARCH');
  html=patchOnce(html,'Explore the theology collection in the SAN wiki reader: search the library, follow linked ideas, and navigate each article by its outline.','Follow the argument. Read the conversation. Explore awakening, authority and repair through a connected research library.');
  html=patchOnce(html,'    (function () {\n      const readerScript = document.createElement(\'script\');','    (function () {\n      const readerScript = document.createElement(\'script\');');
  html=patchOnce(html,"      readerScript.src = (window.SAN_PUBLIC_WIKI_ASSET_ROOT || '/wiki/assets') + '/js/wiki-app.js?v=20260902-san-asset-route-3';","      readerScript.src = './assets/js/theology-reader.js?v="+E.version+"';");
  html=patchOnce(html,"  <script>\n    (function () {\n      const readerScript",'  <script src="./assets/js/research-core.js?v='+E.version+'"></script>\n  <script src="./assets/js/research-tools.js?v='+E.version+'"></script>\n  <script>\n    (function () {\n      const readerScript');
  html=html.replace('input:not([disabled]), summary','input:not([disabled]), select:not([disabled]), summary');
 }
 html=html.replace(/(\.\/assets\/(?:js|css)\/(?:research-core\.js|research-tools\.js|theology-reader\.js|research\.css)\?v=)[^"'\s]+/g,'$1'+E.version);
 write('san-reader.html',html);
 // The older reader shares the same local adapter and additions; the preferred SAN entry point remains unchanged.
 let original=read('index.html');
 if(!original.includes('theology-source-edition-assets')){
  original=original.replace('</head>','<!-- theology-source-edition-assets --><link rel="stylesheet" href="./assets/css/research.css?v='+E.version+'"></head>');
  original=original.replace(/<script src="\.\/assets\/js\/wiki-app\.js[^\"]*" defer><\/script>/,'<script src="./assets/js/research-core.js?v='+E.version+'"></script><script src="./assets/js/research-tools.js?v='+E.version+'"></script><script src="./assets/js/theology-reader.js?v='+E.version+'" defer></script>');
 }
 original=original.replace(/(\.\/assets\/(?:js|css)\/(?:research-core\.js|research-tools\.js|theology-reader\.js|research\.css)\?v=)[^"'\s]+/g,'$1'+E.version);
 write('index.html',original);
}
if(require.main===module){try{console.log(JSON.stringify(build(),null,2));}catch(e){console.error(e.stack);process.exitCode=1;}}
module.exports={build,category};
