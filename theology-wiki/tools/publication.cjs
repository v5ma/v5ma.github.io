'use strict';
// Additive reader integration and public Markdown preservation. Never rewrites original sources.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const C=require('../assets/js/research-core.js'),L=require('../assets/js/listening-core.js');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const ORIGIN='Public corpus and computational bridge 2026-10-03';
const safe=p=>typeof p==='string'&&!path.isAbsolute(p)&&!p.split(/[\\/]/).includes('..')&&!p.includes('\\');
function io(root){return {read:p=>fs.readFileSync(path.join(root,p),'utf8'),json:p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),write(p,value){if(!safe(p))throw Error('Unsafe output path '+p);const dest=path.join(root,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');}};}
const encoded=p=>p.split('/').map(encodeURIComponent).join('/');
function integrate(root=path.resolve(__dirname,'..')){
 const {read,json,write}=io(root),cfg=json('editorial/publication.json');
 const pages=json('data/page-index.json'),by=new Map(pages.map(p=>[p.slug,p])),bodies=new Map();
 for(const spec of cfg.pages){
  if(!/^[a-z0-9-]+$/.test(spec.slug)||!safe(spec.source))throw Error('Unsafe publication page');
  const prior=by.get(spec.slug);if(prior&&!prior.publicationEdition)throw Error('Refusing to replace pre-existing route '+spec.slug);
  let body=read(spec.source).replace(/^# [^\n]+\n+/,'');
  body=body.replace('[Read the publication-verification guide](../PUBLICATION-HISTORY.md)','[[publication-history|Read the publication-verification guide]]').replace('[Read Computational Divine Immanence](../content/developed/computational-divine-immanence.md)','[[computational-divine-immanence|Read Computational Divine Immanence]]');
  if(spec.slug==='publication-history'){
   body=body.replace(/\]\(research-notes\/computational-god-consciousness-and-theodicy\.md\)/g,'](https://github.com/'+cfg.repository+'/blob/master/theology-wiki/research-notes/computational-god-consciousness-and-theodicy.md)');
  }
  if(spec.slug!=='computational-god-capabilities-bridge'&&spec.slug!=='publication-history')body+='\n\n## Connect the argument\n\n[[computational-god-capabilities-bridge|The Computational God: Creation, Consciousness, and Capabilities]] connects this study to divine immanence, the necessary-ground argument, possible minds, and repair. [[publication-history|Publication history]] distinguishes the source edition from this reader integration.\n';
  const row={...prior,...spec,path:'developed/'+spec.slug+'.md',topic:spec.category==='machines'?'God, minds & machines':'Research context',tags:[spec.category,spec.kind==='Navigator'?'navigation':'developed','public-backup'],aliases:spec.slug==='computational-god-capabilities-bridge'?['computational God bridge','God capabilities','divine powers']:[],editionGenerated:true,publicationEdition:cfg.version,sourceFiles:['developed/'+spec.slug+'.md'],references:[],readMinutes:Math.max(1,Math.ceil(body.split(/\s+/).length/200)),attribution:'AI-assisted authorial exposition. Original source wording and source dates remain separately inspectable.',claimType:spec.kind==='Navigator'?'Publication and preservation guide':'Philosophical and theological argument',xrRoomId:'theology-'+spec.slug,xrDeckId:'theology-reader'};
  delete row.source;
  const text='---\ntitle: '+JSON.stringify(row.title)+'\nslug: '+JSON.stringify(row.slug)+'\nsummary: '+JSON.stringify(row.summary)+'\ntopic: '+JSON.stringify(row.topic)+'\nstatus: '+JSON.stringify(row.kind)+'\nupdated: '+JSON.stringify(row.updated)+'\nreader_integrated: "2026-10-03"\ncanonical_source: '+JSON.stringify(spec.source)+'\n---\n\n# '+row.title+'\n\n'+body.trim()+'\n';
  write('content/'+row.path,text);bodies.set(row.slug,text);
  if(prior)Object.assign(prior,row);else{pages.push(row);by.set(row.slug,row);}
 }
 const relations=json('data/relationships.json');relations.edges=relations.edges.filter(e=>e.origin!==ORIGIN);
 const bridge='computational-god-capabilities-bridge';
 for(const [slug,why] of Object.entries(cfg.bridgeConnections)){
  if(!by.has(slug))throw Error('Missing bridge destination '+slug);
  relations.edges.push({from:bridge,to:slug,type:'conceptual connection',why,origin:ORIGIN},{from:slug,to:bridge,type:'connecting study',why:'The bridge explains how this argument relates to creation, consciousness, and divine capabilities. '+why,origin:ORIGIN});
 }
 for(const from of ['home','topic-machines','reading-paths','connected-arguments'])relations.edges.push({from,to:bridge,type:'reading route',why:'A connected route through computational theology and possible minds.',origin:ORIGIN});
 relations.edges.push({from:'home',to:'publication-history',type:'public preservation',why:'Inspect the public backup, version links, and recorded dates.',origin:ORIGIN});
 const graph=json('data/graph.json');
 for(const p of pages){
  const targets=new Set(graph.related[p.slug]||[]);
  if(bodies.has(p.slug)){targets.clear();for(const m of bodies.get(p.slug).matchAll(/\[\[([^\]|#]+)(?:[^\]]*)\]\]/g)){if(!by.has(m[1]))throw Error('Broken new wikilink '+p.slug+' -> '+m[1]);targets.add(m[1]);}}
  for(const e of relations.edges.filter(e=>e.from===p.slug))targets.add(e.to);
  p.related=[...targets].filter(s=>s!==p.slug&&by.has(s));graph.related[p.slug]=p.related;
 }
 const backlinks=Object.fromEntries(pages.map(p=>[p.slug,[]]));for(const p of pages)for(const s of p.related)backlinks[s].push(p.slug);
 for(const p of pages){p.backlinks=backlinks[p.slug];p.backlinkCount=p.backlinks.length;}
 const research=json('data/research.json');research.backlinks=backlinks;research.developedCount=pages.filter(p=>p.kind==='Developed article').length;
 research.publicationEdition=cfg.version;research.paths=research.paths.filter(p=>p.id!=='computational-god-capabilities');research.paths.push({id:'computational-god-capabilities',title:'The Computational God: creation, consciousness and repair',pages:['computational-god-capabilities-bridge','computational-divine-immanence','computational-argument-map','cosmic-thought-and-transcendence','computational-god-consciousness-and-theodicy','religion-for-conscious-robots','apocalyptic-repair-theology']});
 const search=json('data/search.json');
 for(const spec of cfg.pages){let i=search.ids.indexOf(spec.slug);if(i<0){i=search.ids.length;search.ids.push(spec.slug);}for(const [term,values] of Object.entries(search.postings)){const filtered=values.filter(x=>x!==i&&x!==spec.slug);if(filtered.length)search.postings[term]=filtered;else delete search.postings[term];}const p=by.get(spec.slug);for(const t of C.tokens(bodies.get(spec.slug)+' '+p.title+' '+p.summary+' '+p.aliases.join(' ')))if(t.length<=60)(search.postings[t]??=[]).push(i);}
 write('data/page-index.json',pages);write('data/research.json',research);write('data/graph.json',graph);write('data/relationships.json',relations);write('data/search.json',JSON.stringify(search)+'\n');
 const library=json('data/listening-library.json');
 for(const spec of cfg.pages.filter(x=>x.kind!=='Navigator')){
  const p=by.get(spec.slug),source='content/'+p.path,bytes=fs.readFileSync(path.join(root,source)),segments=L.segment(bytes.toString('utf8'));
  const narration={schema:'theology-narration/v1',slug:p.slug,title:p.title,source,sourceSha256:hash(bytes),policy:'Full source-matched reading text. Device speech only; no recorded voice or audio file is claimed.',segments};
  const text=JSON.stringify(narration,null,2)+'\n';write('data/listening/'+p.slug+'.json',text);write('products/transcripts/'+p.slug+'.txt',segments.map(s=>s.text).join('\n\n')+'\n');
  const record={slug:p.slug,title:p.title,summary:p.summary,category:p.category,kind:p.kind,chapters:[],source,sourceSha256:narration.sourceSha256,narration:'data/listening/'+p.slug+'.json',narrationSha256:hash(text),transcript:'products/transcripts/'+p.slug+'.txt',segments:segments.length,words:segments.filter(s=>!s.notes).reduce((n,s)=>n+s.text.split(/\s+/).length,0)};
  const i=library.articles.findIndex(x=>x.slug===p.slug);if(i<0)library.articles.push(record);else library.articles[i]=record;
 }
 write('data/listening-library.json',library);
 for(const name of ['san-reader.html','index.html']){
  let html=read(name);
  html=html.replace('"canonicalBase": "https://v5ma.github.io/theology-wiki/san-reader.html"','"canonicalBase": "https://wiki.onlyonedevil.com/theology-wiki/san-reader"');
  for(const [type,file] of [['js','publication-tools.js'],['css','publication.css']]){
   const version=hash(read('assets/'+type+'/'+file)).slice(0,16),tag=type==='js'?'<script src="./assets/js/'+file+'?v='+version+'"></script>':'<link rel="stylesheet" href="./assets/css/'+file+'?v='+version+'">';
   const re=new RegExp(type==='js'?'<script src="\\./assets/js/'+file+'[^\"]*"><\\/script>':'<link rel="stylesheet" href="\\./assets/css/'+file+'[^\"]*">');
   if(re.test(html))html=html.replace(re,tag);else html=html.replace('</head>',tag+'\n</head>');
  }
  html=html.replace(/(\.\/assets\/js\/research-tools\.js\?v=)[^"']+/g,'$1'+hash(read('assets/js/research-tools.js')).slice(0,16));
  // The public repository no longer ships san-wiki-shell. Use the existing local stylesheet.
  html=html.replace("window.SAN_PUBLIC_WIKI_ASSET_ROOT = '../san-wiki-shell/assets';","window.SAN_PUBLIC_WIKI_ASSET_ROOT = './assets';");
  html=html.replace(/\s*<link id="san-dynamic-timeline-stylesheet" rel="stylesheet">/,'').replace(/\s*document\.getElementById\('san-dynamic-timeline-stylesheet'\)\.href = [^;]+;/,'');
  write(name,html);
 }
 const report=json('data/build-report.json');Object.assign(report,{publicationEdition:cfg.version,pages:pages.length,developedArticles:research.developedCount,bridgeStudies:pages.filter(p=>p.kind==='Bridge study').length,listeningArticles:library.articles.length,explainedRelationships:relations.edges.length,links:Object.values(graph.related).reduce((n,a)=>n+a.length,0),searchTerms:Object.keys(search.postings).length,readingPaths:research.paths.length});write('data/build-report.json',report);
 return {pages:pages.length,integratedPages:cfg.pages.length,developedArticles:research.developedCount,bridgeStudies:report.bridgeStudies};
}
function snapshot(root,ref){
 const {read,json,write}=io(root),cfg=json('editorial/publication.json'),site=path.dirname(root);
 if(!/^[a-f0-9]{40}$/.test(ref||''))throw Error('A full committed source revision is required');
 const git=args=>cp.execFileSync('git',['-C',site,...args],{maxBuffer:100*1024*1024});
 const date=git(['show','-s','--format=%cI',ref]).toString().trim();
 const base='https://github.com/'+cfg.repository,records=[],pages=json('data/page-index.json');
 for(const p of pages){
  if(!/^[a-z0-9-]+$/.test(p.slug)||!safe(p.path))throw Error('Unsafe archive page');
  const source='theology-wiki/content/'+p.path,bytes=fs.readFileSync(path.join(site,source));
  if(!git(['show',ref+':'+source]).equals(bytes))throw Error('Commit the source first: '+source);
  const row={slug:p.slug,title:p.title,kind:p.kind,category:p.category,sourcePath:source,sourceSha256:hash(bytes),sourceBytes:bytes.length,archivePath:'public-corpus/pages/'+p.slug+'.md',readerUrl:cfg.reader+'?page='+encodeURIComponent(p.slug),sourceUrl:base+'/blob/'+cfg.branch+'/'+encoded(source),sourceHistoryUrl:base+'/commits/'+cfg.branch+'/'+encoded(source),exactSourceUrl:base+'/blob/'+ref+'/'+encoded(source),sourceRevision:ref,sourceCommitterDate:date};
  const spec=cfg.pages.find(x=>x.slug===p.slug);let canonical=spec?.source;
  if(!canonical&&fs.existsSync(path.join(root,'editorial/authorial-articles/'+p.slug+'.md')))canonical='editorial/authorial-articles/'+p.slug+'.md';
  if(canonical){row.canonicalSourcePath='theology-wiki/'+canonical;row.canonicalSourceUrl=base+'/blob/'+cfg.branch+'/'+encoded(row.canonicalSourcePath);row.canonicalHistoryUrl=base+'/commits/'+cfg.branch+'/'+encoded(row.canonicalSourcePath);row.canonicalSha256=hash(fs.readFileSync(path.join(root,canonical)));}
  let projection=bytes;
  if(p.sourceFile){
   if(!C.safeSourceFile(p.sourceFile))throw Error('Unsafe transcript');
   const sourcePath='theology-sources/chats/'+p.sourceFile,raw=fs.readFileSync(path.join(site,sourcePath));
   if(!git(['show',ref+':'+sourcePath]).equals(raw)||hash(raw)!==p.sourceSha256)throw Error('Original transcript mismatch '+p.slug);
   row.transcriptSourcePath=sourcePath;row.transcriptSha256=hash(raw);row.transcriptBytes=raw.length;row.transcriptExactUrl=base+'/blob/'+ref+'/'+encoded(sourcePath);
   projection=Buffer.from('# '+p.title+'\n\nPublic backup of the complete source conversation. Export speaker labels and embedded quotations retain their original attribution. The original bytes are available at the link below; this Markdown projection normalizes line endings. The snapshot source date is not the date of every turn.\n\n[Read the original text at this exact revision]('+row.transcriptExactUrl+'). [Open the interactive reader]('+row.readerUrl+').\n\n'+raw.toString('utf8').replace(/\r\n/g,'\n'));
  }
  write(row.archivePath,projection.toString('utf8'));row.archiveSha256=hash(projection);row.archiveBytes=projection.length;row.archiveUrl=base+'/blob/'+cfg.branch+'/theology-wiki/'+encoded(row.archivePath);records.push(row);
  p.publication={sourceUrl:row.sourceUrl,historyUrl:row.sourceHistoryUrl,exactUrl:row.exactSourceUrl,archiveUrl:row.archiveUrl,sourcePath:source,sha256:row.sourceSha256,revision:ref,sourceCommitterDate:date,canonicalSourceUrl:row.canonicalSourceUrl||null,canonicalHistoryUrl:row.canonicalHistoryUrl||null,transcriptExactUrl:row.transcriptExactUrl||null};
 }
 const supplement=[];function walk(dir){for(const x of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,x.name);if(x.isSymbolicLink())continue;if(x.isDirectory()){if(p!==path.join(root,'public-corpus'))walk(p);}else if(x.name.endsWith('.md')){const rel=path.relative(site,p).split(path.sep).join('/'),bytes=fs.readFileSync(p);if(!git(['show',ref+':'+rel]).equals(bytes))throw Error('Uncommitted Markdown source '+rel);supplement.push({path:rel,bytes:bytes.length,sha256:hash(bytes),exactUrl:base+'/blob/'+ref+'/'+encoded(rel)});}}}
 walk(root);supplement.sort((a,b)=>a.path.localeCompare(b.path));
 const meta={schema:'theology-public-corpus/v1',owner:cfg.owner,description:'Time-stamped public backup of the Theology Wiki; original sources, authorial prose, AI-assisted developments and quotations retain distinct attribution.',sourceRevision:ref,sourceCommitterDate:date,dateScope:'Git committer date of the source revision, not an independent timestamp or the first publication of every idea. Inspect GitHub verification and PR events separately.',sourceCommitUrl:base+'/commit/'+ref,sourceCommitApi:'https://api.github.com/repos/'+cfg.repository+'/git/commits/'+ref,corpusHistoryUrl:base+'/commits/'+cfg.branch+'/theology-wiki/public-corpus/snapshot.json',reader:cfg.reader,indexedPages:records.length,sourceConversations:records.filter(r=>r.transcriptSourcePath).length,markdownSources:supplement.length,indexSha256:hash(JSON.stringify(records,null,2)+'\n'),projection:'Article Markdown is copied byte-for-byte. Conversation projections include the full exported conversation, with a wrapper and normalized line endings; raw transcript hashes are recorded separately.',externalTimestampStatus:'No external trusted timestamp, DOI deposit or independent archive capture is claimed.'};
 write('public-corpus/page-index.json',records);write('public-corpus/source-manifest.json',supplement);write('public-corpus/snapshot.json',meta);
 const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';write('public-corpus/manifest-sha256.csv','slug,archive_path,archive_sha256,archive_bytes,reader_source_path,reader_source_sha256,transcript_sha256\n'+records.map(r=>[r.slug,r.archivePath,r.archiveSha256,r.archiveBytes,r.sourcePath,r.sourceSha256,r.transcriptSha256||''].map(quote).join(',')).join('\n')+'\n');
 write('public-corpus/README.md','# Theology Wiki: Time-stamped Public Backup\n\nThis public Markdown corpus preserves Micah Blumberg\'s Theology Wiki for citation, version comparison, and examination of publication history, including future attribution or plagiarism disputes. Original sources, quoted material, AI replies, and AI-assisted authorial developments retain their stated authorship. It is a preservation record, not a declaration that every quoted idea originated here.\n\nThe corpus contains '+records.length+' indexed reader pages, including full Markdown projections of '+meta.sourceConversations+' already-public source conversations. The source manifest also records '+supplement.length+' Markdown files, including supplementary studies outside the main reader. Nothing was taken from a private repository.\n\n[Open the live reader]('+cfg.reader+'). [Read the publication-verification guide](../PUBLICATION-HISTORY.md). [Browse the page index](page-index.json). [Verify file hashes](manifest-sha256.csv). [Inspect snapshot metadata](snapshot.json). [Inspect all Markdown source hashes](source-manifest.json).\n\nThe snapshot is based on [source revision '+ref+']('+base+'/commit/'+ref+'), whose Git committer date is '+date+'. This is not a newly assigned original-publication date. GitHub\'s separately recorded verification and pull-request events can be inspected through the guide. The [corpus history]('+meta.corpusHistoryUrl+') records later backups. No backdating, external archive capture, or legal priority certification is claimed.\n\nArticle files are byte-identical copies of their reader Markdown at the recorded revision. Conversation projections preserve the complete public transcript with line-ending normalization; exact raw transcript links and hashes are included in the index. Previous source files and their Git histories remain in place.\n\nTo cite an exact source version, use the commit-specific link in the index rather than only a moving master-branch link. To retain a copy independently of this hosting service, download or clone the public repository and retain the manifest with the files.\n\n## Browse the backed-up pages\n\n'+records.map(r=>'['+r.title.replace(/[\[\]]/g,'')+'](pages/'+r.slug+'.md) - [Live reader]('+r.readerUrl+') - [Source history]('+r.sourceHistoryUrl+') - [Exact source]('+r.exactSourceUrl+').').join('\n\n')+'\n');
 write('data/page-index.json',pages);return meta;
}
function check(root=path.resolve(__dirname,'..')){
 const {json}=io(root),site=path.dirname(root),records=json('public-corpus/page-index.json'),meta=json('public-corpus/snapshot.json'),pages=json('data/page-index.json');
 if(hash(fs.readFileSync(path.join(root,'public-corpus/page-index.json')))!==meta.indexSha256)throw Error('Corpus index mismatch');
 if(records.length!==pages.length||new Set(records.map(r=>r.slug)).size!==pages.length)throw Error('Corpus coverage mismatch');
 for(const r of records){if(hash(fs.readFileSync(path.join(root,r.archivePath)))!==r.archiveSha256||hash(fs.readFileSync(path.join(site,r.sourcePath)))!==r.sourceSha256)throw Error('Archive/source mismatch '+r.slug);if(r.transcriptSourcePath&&hash(fs.readFileSync(path.join(site,r.transcriptSourcePath)))!==r.transcriptSha256)throw Error('Transcript mismatch');const p=pages.find(p=>p.slug===r.slug);if(p?.publication?.sha256!==r.sourceSha256)throw Error('Reader provenance mismatch');}
 for(const r of json('public-corpus/source-manifest.json'))if(hash(fs.readFileSync(path.join(site,r.path)))!==r.sha256)throw Error('Supplementary source mismatch '+r.path);
 return {verifiedPages:records.length,verifiedTranscripts:meta.sourceConversations,verifiedMarkdownSources:meta.markdownSources,sourceRevision:meta.sourceRevision};
}
if(require.main===module){try{const root=path.resolve(__dirname,'..'),args=process.argv.slice(2);console.log(JSON.stringify(args[0]==='--snapshot'?snapshot(root,args[1]):args[0]==='--check'?check(root):integrate(root),null,2));}catch(e){console.error(e.stack);process.exitCode=1;}}
module.exports={integrate,snapshot,check,hash};
