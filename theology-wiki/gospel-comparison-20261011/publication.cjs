'use strict';
// One additive Gospel study and its two generated navigation entries.
// Existing archive conversations and all other exact revision records are read-only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const SLUG='living-jesus-thomas-john-and-synoptics';
const SPEC={slug:SLUG,supplementary:['theology-wiki/research-reports/gospel-comparisons-20261011/claim-audit.md'],baseline:'22dd281d9296e5ca5794a8cd83c3dde47147337f',navigation:{
 home:'9e6460b7cd163471437b2aa4d75cfad09d42bcd0c97d80aa451cb70d6afb9a5f',
 'topic-jesus':'e5dcad41386711c30fd9235b878cf7480bc5bb5f347d670784f4d6716dee94e7'
}};
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
 for(const slug of Object.keys(spec.navigation)){const row=recordBy.get(slug),escaped=encoded(row.sourcePath).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');guide=guide.replace(new RegExp('https://github\\.com/'+cfg.repository+'/blob/[a-f0-9]{40}/'+escaped,'g'),row.exactSourceUrl);}
 const row=recordBy.get(spec.slug),section='\n\n<!-- gospel-comparison-addition -->\n## Gospel comparison addition\n\nThe collection now includes '+records.length+' reader pages. The original full-snapshot revision and all unrelated page histories are unchanged. This addition records ['+row.title+'](pages/'+spec.slug+'.md) and its home and Jesus-topic navigation entries at [source revision '+ref+']('+entry.sourceCommitUrl+'), Git committer date '+date+'. This is a source-version record, not an independent timestamp or a claim about the original date of the ideas.\n\n[Exact article source]('+row.exactSourceUrl+'). [Canonical source]('+row.canonicalSourceUrl+').\n<!-- /gospel-comparison-addition -->\n';
 if(guide.includes('<!-- gospel-comparison-addition -->'))throw Error('Existing addition guide requires explicit separate revision');
 outputs.push(['public-corpus/README.md',guide.trimEnd()+section]);
 const receipt={schema:'theology-gospel-addition/v1',baseline:spec.baseline,sourceRevision:ref,sourceCommitterDate:date,article:{slug:spec.slug,canonical,canonicalSha256:hash(canonicalBytes),source:row.sourcePath,sourceSha256:row.sourceSha256},navigation:Object.fromEntries(Object.keys(spec.navigation).map(s=>{const r=recordBy.get(s);return [r.sourcePath,{slug:s,before:spec.navigation[s],after:r.sourceSha256}];})),preservedExistingPageRecords:records.length-selected.length,scope:'One new developed article; only home and Jesus-topic navigation records are updated. All original chats and existing article bodies are unchanged.'};
 outputs.push(['gospel-comparison-20261011/publication-receipt.json',receipt]);
 for(const [p,v] of outputs)write(p,v);
 return {addedPages:1,updatedNavigationPages:Object.keys(spec.navigation).length,preservedPages:receipt.preservedExistingPageRecords,sourceRevision:ref};
}
if(require.main===module){try{console.log(JSON.stringify(apply(path.resolve(__dirname,'..'),process.argv[2]),null,2));}catch(e){console.error(e.stack);process.exitCode=1;}}
module.exports={apply,hash,SPEC};
