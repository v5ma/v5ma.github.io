'use strict';
// One additive Gospel study and its two generated navigation entries.
// Existing archive conversations and all other exact revision records are read-only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const SLUG='gnostic-canonical-gospels-telling-the-truth';
const RECEIPT='gospel-synthesis-20261011/publication-receipt.json',MARKER='<!-- gospel-synthesis-addition -->';
const SPEC={slug:SLUG,supplementary:['theology-wiki/research-reports/gospel-synthesis-20261011/source-notes.md'],baseline:'70bf669b241ae51fbca864742dfd086b79f662bf',navigation:{
 home:'59025d80e0997296f7947f8e48a647f2db3ce5617cdd4e05d4e65f155790a26d',
 'topic-jesus':'fca3e6fcbf125795e4e230f8a4fa9f0268d9743bee68731252216e15dbc24949'
},baselineHashes:{
 'public-corpus/page-index.json':'7b2ad3ce6d62923068e165a09d45cad9ab3bcce5fdc1557742f089e722e7e9ee',
 'public-corpus/source-manifest.json':'90664f6cfe7755708b5e343719b2f4a9d6e9eb3e2af3065e34f62ab15d87b92f',
 'public-corpus/snapshot.json':'70b81cbd0bb28eb3961b1286dfc2f0e49c7b3e56a671ad430cceda44b1e4ad30',
 'public-corpus/README.md':'d93339fec297aa9f596842e85495c22e288e7687b794aa811d085655ca39eb3e'
},previousReceipt:{path:'gospel-comparison-20261011/publication-receipt.json',sha256:'788c9e6029501dac0aa468d4be73c9d0bf77fd84dc63d593f2a86f5839ecedfb'}};
const serialize=x=>JSON.stringify(x,null,2)+'\n';
const safe=p=>typeof p==='string'&&!path.isAbsolute(p)&&!p.split(/[\\/]/).includes('..')&&!p.includes('\\');
const encoded=p=>p.split('/').map(encodeURIComponent).join('/');
function apply(root,ref,spec=SPEC){
 if(!/^[a-f0-9]{40}$/.test(ref||''))throw Error('A full committed source revision is required');
 if(!/^[a-z0-9-]+$/.test(spec.slug)||Object.keys(spec.navigation).some(s=>!/^[a-z0-9-]+$/.test(s)))throw Error('Unsafe release slug');
 const site=path.dirname(root),read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p)),outputs=[];
 const write=(p,v)=>{if(!safe(p))throw Error('Unsafe output path');const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n');};
 const git=(...a)=>cp.execFileSync('git',['-C',site,...a],{maxBuffer:64*1024*1024});
 const date=git('show','-s','--format=%cI',ref).toString().trim(),cfg=json('editorial/publication.json'),base='https://github.com/'+cfg.repository;
 const pages=json('data/page-index.json'),records=json('public-corpus/page-index.json'),meta=json('public-corpus/snapshot.json'),supplement=json('public-corpus/source-manifest.json');
 if(hash(read('public-corpus/page-index.json'))!==meta.indexSha256)throw Error('Corpus index mismatch');
 const pageBy=new Map(pages.map(p=>[p.slug,p])),recordBy=new Map(records.map(p=>[p.slug,p]));
 if(pageBy.size!==pages.length||recordBy.size!==records.length)throw Error('Duplicate page');
 const selected=[spec.slug,...Object.keys(spec.navigation)];
 if(recordBy.has(spec.slug)){
  verify(root,spec);
  for(const source of ['theology-wiki/editorial/authorial-articles/'+spec.slug+'.md',...(spec.supplementary||[]),...selected.map(s=>'theology-wiki/content/'+pageBy.get(s).path)]){
   if(!git('show',ref+':'+source).equals(fs.readFileSync(path.join(site,source))))throw Error('Commit the source first: '+source);
  }
  return {addedPages:0,updatedPages:0,preservedPages:records.length,sourceRevision:recordBy.get(spec.slug).sourceRevision};
 }
 for(const [p,digest] of Object.entries(spec.baselineHashes))if(hash(read(p))!==digest)throw Error('Exact predecessor baseline changed: '+p);
 if(spec.previousReceipt&&hash(read(spec.previousReceipt.path))!==spec.previousReceipt.sha256)throw Error('Historical receipt changed');
 const previousNavigation=Object.fromEntries(Object.keys(spec.navigation).map(s=>[s,{record:structuredClone(recordBy.get(s)),source:structuredClone(supplement.find(r=>r.path===recordBy.get(s)?.sourcePath))}]));
 const previousSnapshot=structuredClone(meta);

 // Source and archive bytes outside the declared addition stay read-only.
 for(const row of records.filter(r=>!Object.hasOwn(spec.navigation,r.slug))){
  if(!safe(row.sourcePath)||!safe(row.archivePath)||hash(fs.readFileSync(path.join(site,row.sourcePath)))!==row.sourceSha256||hash(read(row.archivePath))!==row.archiveSha256)throw Error('Unrelated source/archive changed: '+row.slug);
  if(row.transcriptSourcePath&&(!safe(row.transcriptSourcePath)||hash(fs.readFileSync(path.join(site,row.transcriptSourcePath)))!==row.transcriptSha256))throw Error('Original conversation changed: '+row.slug);
 }
 const extras=pages.filter(p=>!recordBy.has(p.slug));
 if(extras.some(p=>p.slug!==spec.slug)||records.some(r=>!pageBy.has(r.slug)))throw Error('Unrelated corpus coverage change');
 const canonical='theology-wiki/editorial/authorial-articles/'+spec.slug+'.md';
 const committed=source=>{if(!safe(source)||!source.startsWith('theology-wiki/')||!source.endsWith('.md'))throw Error('Unsafe release source');const file=path.join(site,source);if(fs.lstatSync(file).isSymbolicLink())throw Error('Symlink source');const b=fs.readFileSync(file);if(!git('show',ref+':'+source).equals(b))throw Error('Commit the source first: '+source);return b;};
 const canonicalBytes=committed(canonical),sources=new Map([[canonical,canonicalBytes]]),updates=[];
 for(const source of spec.supplementary||[])sources.set(source,committed(source));
 for(const slug of selected){
  const p=pageBy.get(slug),old=recordBy.get(slug);
  if(!p||p.sourceFile||!safe(p.path))throw Error('Expected non-conversation release page '+slug);
  if(slug===spec.slug&&(p.kind!=='Developed article'||p.category!=='jesus'))throw Error('Unexpected Gospel article kind/category');
  if(slug!==spec.slug&&(!old||old.sourceSha256!==spec.navigation[slug]&&!meta.additions?.some(a=>a.pages.includes(spec.slug))))throw Error('Navigation baseline changed '+slug);
  const source='theology-wiki/content/'+p.path,bytes=committed(source);sources.set(source,bytes);
  if(slug!==spec.slug){
   const entry='[['+spec.slug+'|'+pageBy.get(spec.slug).title+']]: '+pageBy.get(spec.slug).summary+'\n\n';
   const text=bytes.toString();
   if(text.split(entry).length!==2||hash(text.replace(entry,''))!==spec.navigation[slug])throw Error('Navigation must add exactly the approved article entry: '+slug);
  }
  if(old&&(old.sourcePath!==source||old.archivePath!=='public-corpus/pages/'+slug+'.md'||old.transcriptSourcePath))throw Error('Unexpected existing corpus path');
  const current=old&&old.sourceSha256===hash(bytes)&&old.archiveSha256===hash(bytes)&&hash(read(old.archivePath))===hash(bytes)&&p.publication?.sha256===hash(bytes)&&(slug!==spec.slug||old.canonicalSha256===hash(canonicalBytes));
  if(current)continue;
  const row=old||{slug,title:p.title,kind:p.kind,category:p.category,sourcePath:source,archivePath:'public-corpus/pages/'+slug+'.md',readerUrl:cfg.reader+'?page='+encodeURIComponent(slug),sourceUrl:base+'/blob/'+cfg.branch+'/'+encoded(source),sourceHistoryUrl:base+'/commits/'+cfg.branch+'/'+encoded(source),archiveUrl:base+'/blob/'+cfg.branch+'/theology-wiki/public-corpus/pages/'+slug+'.md'};
  Object.assign(row,{sourceSha256:hash(bytes),sourceBytes:bytes.length,sourceRevision:ref,sourceCommitterDate:date,exactSourceUrl:base+'/blob/'+ref+'/'+encoded(source),archiveSha256:hash(bytes),archiveBytes:bytes.length});
  if(slug===spec.slug)Object.assign(row,{canonicalSourcePath:canonical,canonicalSourceUrl:base+'/blob/'+cfg.branch+'/'+encoded(canonical),canonicalHistoryUrl:base+'/commits/'+cfg.branch+'/'+encoded(canonical),canonicalSha256:hash(canonicalBytes)});
  if(!old){records.push(row);recordBy.set(slug,row);}
  p.publication={sourceUrl:row.sourceUrl,historyUrl:row.sourceHistoryUrl,exactUrl:row.exactSourceUrl,archiveUrl:row.archiveUrl,sourcePath:source,sha256:row.sourceSha256,revision:ref,sourceCommitterDate:date,canonicalSourceUrl:row.canonicalSourceUrl||null,canonicalHistoryUrl:row.canonicalHistoryUrl||null,transcriptExactUrl:null};
  outputs.push([row.archivePath,bytes]);updates.push(slug);
 }
 for(const [source,bytes] of sources){const prior=supplement.find(r=>r.path===source);if(prior&&prior.sha256===hash(bytes))continue;if(!updates.length)throw Error('Supplementary revision requires a separate explicit amendment: '+source);const next={path:source,bytes:bytes.length,sha256:hash(bytes),exactUrl:base+'/blob/'+ref+'/'+encoded(source)};if(prior)Object.assign(prior,next);else supplement.push(next);}
 if(!updates.length){
  if(!meta.additions?.some(a=>a.pages.includes(spec.slug)))throw Error('Missing bounded addition record');
  return {addedPages:0,updatedPages:0,preservedPages:records.length,sourceRevision:recordBy.get(spec.slug).sourceRevision};
 }
 if(!updates.includes(spec.slug)||!Object.keys(spec.navigation).every(s=>updates.includes(s)))throw Error('First publication must include exactly the article and both navigation entries');
 const entry={sourceRevision:ref,sourceCommitterDate:date,sourceCommitUrl:base+'/commit/'+ref,pages:[spec.slug],navigationPages:Object.keys(spec.navigation),markdownSources:[...sources.keys()].sort()};
 meta.additions=[...(meta.additions||[]),entry];meta.additionScope='The full snapshot revision remains the original baseline. Each listed addition and its explicitly listed navigation updates has its own committed source revision. Every unrelated page record and original source conversation keeps its previously recorded version.';
 meta.indexedPages=records.length;meta.markdownSources=supplement.length;meta.indexSha256=hash(JSON.stringify(records,null,2)+'\n');
 const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 outputs.push(['public-corpus/page-index.json',records],['public-corpus/source-manifest.json',supplement],['public-corpus/snapshot.json',meta],['data/page-index.json',pages]);
 outputs.push(['public-corpus/manifest-sha256.csv','slug,archive_path,archive_sha256,archive_bytes,reader_source_path,reader_source_sha256,transcript_sha256\n'+records.map(r=>[r.slug,r.archivePath,r.archiveSha256,r.archiveBytes,r.sourcePath,r.sourceSha256,r.transcriptSha256||''].map(quote).join(',')).join('\n')+'\n']);
 let guide=read('public-corpus/README.md').toString();
 const row=recordBy.get(spec.slug),section='\n\n<!-- gospel-synthesis-addition -->\n## Gospel synthesis addition\n\nThe collection now includes '+records.length+' reader pages. The original full-snapshot revision and all unrelated page histories are unchanged. This addition records ['+row.title+'](pages/'+spec.slug+'.md) and its home and Jesus-topic navigation entries at [source revision '+ref+']('+entry.sourceCommitUrl+'), Git committer date '+date+'. This is a source-version record, not an independent timestamp or a claim about the original date of the ideas.\n\n[Exact article source]('+row.exactSourceUrl+'). [Canonical source]('+row.canonicalSourceUrl+').\n<!-- /gospel-synthesis-addition -->\n';
 if(guide.includes('<!-- gospel-synthesis-addition -->'))throw Error('Existing addition guide requires explicit separate revision');
 outputs.push(['public-corpus/README.md',guide+section]);
 const receipt={schema:'theology-gospel-synthesis-addition/v1',baseline:spec.baseline,sourceRevision:ref,sourceCommitterDate:date,article:{slug:spec.slug,canonical,canonicalSha256:hash(canonicalBytes),source:row.sourcePath,sourceSha256:row.sourceSha256},previousNavigation,previousSnapshot,predecessorHashes:spec.baselineHashes,previousReceipt:spec.previousReceipt||null,navigation:Object.fromEntries(Object.keys(spec.navigation).map(s=>{const r=recordBy.get(s);return [r.sourcePath,{slug:s,before:spec.navigation[s],after:r.sourceSha256}];})),preservedExistingPageRecords:records.length-selected.length,scope:'One new developed article; only home and Jesus-topic navigation records are updated. All original chats and existing article bodies are unchanged.'};
 outputs.push([RECEIPT,receipt]);
 for(const [p,v] of outputs)write(p,v);
 return {addedPages:1,updatedNavigationPages:Object.keys(spec.navigation).length,preservedPages:receipt.preservedExistingPageRecords,sourceRevision:ref};
}
if(require.main===module){try{console.log(JSON.stringify(process.argv[2]==='--check'?verify(path.resolve(__dirname,'..')):apply(path.resolve(__dirname,'..'),process.argv[2]),null,2));}catch(e){console.error(e.stack);process.exitCode=1;}}
module.exports={apply,verify,restoreBaseline,hash,SPEC,RECEIPT};

// Reconstruct the exact predecessor state, never waive a historical hash guard.
function restoreBaseline(root,spec=SPEC){
 const read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p));
 const receipt=json(RECEIPT),records=json('public-corpus/page-index.json'),sources=json('public-corpus/source-manifest.json'),meta=json('public-corpus/snapshot.json');
 if(!/^[a-f0-9]{40}$/.test(receipt.sourceRevision||''))throw Error('Invalid successor revision');
 if(receipt.schema!=='theology-gospel-synthesis-addition/v1'||receipt.baseline!==spec.baseline||receipt.article?.slug!==spec.slug)throw Error('Unexpected successor receipt');
 if(JSON.stringify(receipt.predecessorHashes)!==JSON.stringify(spec.baselineHashes)||JSON.stringify(receipt.previousReceipt)!==JSON.stringify(spec.previousReceipt||null))throw Error('Predecessor guards changed');
 if(spec.previousReceipt&&hash(read(spec.previousReceipt.path))!==spec.previousReceipt.sha256)throw Error('Historical receipt changed');
 const nav=Object.keys(spec.navigation),articleSource='theology-wiki/content/developed/'+spec.slug+'.md',canonical='theology-wiki/editorial/authorial-articles/'+spec.slug+'.md';
 const added=new Set([articleSource,canonical,...(spec.supplementary||[])]);
 if(Object.keys(receipt.previousNavigation).sort().join(',')!==nav.slice().sort().join(','))throw Error('Unexpected navigation predecessor scope');
 const priorRecords=records.filter(r=>r.slug!==spec.slug).map(r=>nav.includes(r.slug)?receipt.previousNavigation[r.slug].record:r);
 const priorSources=sources.filter(r=>!added.has(r.path)).map(r=>Object.values(receipt.previousNavigation).find(n=>n.record.sourcePath===r.path)?.source||r);
 const additions=meta.additions||[],entry=additions[additions.length-1];
 if(!entry||JSON.stringify(entry.pages)!==JSON.stringify([spec.slug])||JSON.stringify(entry.navigationPages)!==JSON.stringify(nav)||entry.sourceRevision!==receipt.sourceRevision)throw Error('Unexpected successor addition');
 const priorMeta={...meta,indexedPages:priorRecords.length,markdownSources:priorSources.length,indexSha256:hash(serialize(priorRecords)),additions:additions.slice(0,-1)};
 if(!Object.hasOwn(receipt.previousSnapshot,'additions'))delete priorMeta.additions;
 if(!Object.hasOwn(receipt.previousSnapshot,'additionScope'))delete priorMeta.additionScope;
 const guide=read('public-corpus/README.md').toString(),at=guide.indexOf('\n\n'+MARKER);
 if(at<0||guide.indexOf(MARKER,at+3)!==-1)throw Error('Missing or duplicate successor guide');
 const previous={'public-corpus/page-index.json':serialize(priorRecords),'public-corpus/source-manifest.json':serialize(priorSources),'public-corpus/snapshot.json':serialize(priorMeta),'public-corpus/README.md':guide.slice(0,at)};
 for(const [p,digest] of Object.entries(spec.baselineHashes))if(hash(previous[p])!==digest)throw Error('Historical predecessor reconstruction failed: '+p);
 if(serialize(priorMeta)!==serialize(receipt.previousSnapshot))throw Error('Snapshot predecessor changed');
 return {records:priorRecords,sources:priorSources,meta:priorMeta,guide:previous['public-corpus/README.md']};
}
function verify(root,spec=SPEC){
 const previous=restoreBaseline(root,spec),site=path.dirname(root),read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p));
 const receipt=json(RECEIPT),rows=json('public-corpus/page-index.json'),pages=json('data/page-index.json'),sources=json('public-corpus/source-manifest.json'),meta=json('public-corpus/snapshot.json');
 if(hash(read('public-corpus/page-index.json'))!==meta.indexSha256||rows.length!==previous.records.length+1||meta.indexedPages!==rows.length||meta.markdownSources!==sources.length)throw Error('Successor corpus coverage mismatch');
 if(new Set(rows.map(r=>r.slug)).size!==rows.length||new Set(pages.map(r=>r.slug)).size!==pages.length||rows.length!==pages.length||pages.some(p=>!rows.some(r=>r.slug===p.slug)))throw Error('Successor reader coverage mismatch');
 if(new Set(sources.map(r=>r.path)).size!==sources.length||sources.length!==previous.sources.length+2+(spec.supplementary||[]).length)throw Error('Successor source coverage mismatch');
 const nav=Object.keys(spec.navigation),article=pages.find(p=>p.slug===spec.slug),cfg=json('editorial/publication.json'),base='https://github.com/'+cfg.repository;
 if(Object.keys(receipt.navigation).sort().join(',')!==nav.map(s=>'theology-wiki/content/'+pages.find(p=>p.slug===s).path).sort().join(','))throw Error('Unexpected successor navigation scope');
 if(!article||article.kind!=='Developed article'||article.category!=='jesus'||article.sourceFile)throw Error('Unexpected successor article');
 const expectedSources=['theology-wiki/editorial/authorial-articles/'+spec.slug+'.md',...(spec.supplementary||[]),...[...nav,spec.slug].map(s=>rows.find(r=>r.slug===s).sourcePath)].sort();
 const entry=meta.additions.at(-1);
 if(JSON.stringify(entry.markdownSources)!==JSON.stringify(expectedSources)||entry.sourceCommitterDate!==receipt.sourceCommitterDate)throw Error('Successor source receipt mismatch');
 for(const slug of [spec.slug,...nav]){
  const row=rows.find(r=>r.slug===slug),p=pages.find(p=>p.slug===slug);
  if(!row||row.transcriptSourcePath||row.sourceRevision!==receipt.sourceRevision||row.sourceCommitterDate!==receipt.sourceCommitterDate||p.sourceFile||row.archivePath!=='public-corpus/pages/'+slug+'.md'||row.sourcePath!=='theology-wiki/content/'+p.path)throw Error('Successor page record mismatch: '+slug);
  const bytes=fs.readFileSync(path.join(site,row.sourcePath));
  if(row.sourceSha256!==hash(bytes)||row.sourceBytes!==bytes.length||row.archiveSha256!==hash(bytes)||row.archiveBytes!==bytes.length||!read(row.archivePath).equals(bytes)||p.publication?.sha256!==row.sourceSha256||p.publication?.revision!==row.sourceRevision||p.publication?.exactUrl!==row.exactSourceUrl||row.exactSourceUrl!==base+'/blob/'+receipt.sourceRevision+'/'+encoded(row.sourcePath))throw Error('Successor bytes or provenance mismatch: '+slug);
  if(nav.includes(slug)){
   const n=receipt.navigation[row.sourcePath],old=receipt.previousNavigation[slug];
   if(!n||n.slug!==slug||n.before!==spec.navigation[slug]||n.after!==row.sourceSha256||old.record.sourceSha256!==n.before||old.source.sha256!==n.before)throw Error('Successor navigation chain mismatch: '+slug);
   const line='[['+spec.slug+'|'+article.title+']]: '+article.summary+'\n\n',text=bytes.toString();
   if(text.split(line).length!==2||hash(text.replace(line,''))!==n.before)throw Error('Navigation must add exactly the approved article entry: '+slug);
  }
 }
 if(receipt.article.canonical!=='theology-wiki/editorial/authorial-articles/'+spec.slug+'.md')throw Error('Unexpected canonical path');
 const row=rows.find(r=>r.slug===spec.slug),canonical=fs.readFileSync(path.join(site,receipt.article.canonical));
 if(receipt.article.canonical!=='theology-wiki/editorial/authorial-articles/'+spec.slug+'.md'||receipt.article.source!==row.sourcePath||row.canonicalSha256!==hash(canonical)||receipt.article.canonicalSha256!==hash(canonical)||receipt.article.sourceSha256!==row.sourceSha256)throw Error('Successor canonical mismatch');
 for(const source of expectedSources){const r=sources.find(r=>r.path===source),b=fs.readFileSync(path.join(site,source));if(!r||r.sha256!==hash(b)||r.bytes!==b.length||!r.exactUrl.includes('/blob/'+receipt.sourceRevision+'/'))throw Error('Successor supplementary mismatch: '+source);}
 return {verifiedPages:rows.length,preservedExistingPageRecords:previous.records.length-nav.length,sourceRevision:receipt.sourceRevision};
}
