'use strict';
// Two new pages only. Prior corpus records retain their exact versions and dates.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const P=require('./publication.cjs'),hash=P.hash,root=path.resolve(__dirname,'..');
const receipt='editorial/political-studies-20261024.json',serialize=x=>JSON.stringify(x,null,2)+'\n';
const load=base=>JSON.parse(fs.readFileSync(path.join(base,receipt)));
function historicalCorpusRead(base,p){
 const read=q=>fs.readFileSync(path.join(base,q)),r=load(base),slugs=new Set(r.slugs);
 if(p==='data/page-index.json')return Buffer.from(serialize(JSON.parse(read(p)).filter(x=>!slugs.has(x.slug))));
 if(!Object.hasOwn(r.previousCorpus.hashes,p))return read(p);
 let text;
 if(p==='public-corpus/page-index.json')text=serialize(JSON.parse(read(p)).filter(x=>!slugs.has(x.slug)));
 else if(p==='public-corpus/source-manifest.json')text=serialize(JSON.parse(read(p)).filter(x=>!r.slugs.some(s=>x.path==='theology-wiki/editorial/publication-articles/'+s+'.md'||x.path==='theology-wiki/content/developed/'+s+'.md')));
 else if(p==='public-corpus/snapshot.json')text=serialize(r.previousCorpus.snapshot);
 else text=read(p).toString().replace(/\n\n<!-- political-studies-addition -->[\s\S]*$/,'');
 assert.equal(hash(text),r.previousCorpus.hashes[p],'Earlier corpus changed: '+p);
 return Buffer.from(text);
}
function publish(ref,base=root){
 assert.match(ref,/^[a-f0-9]{40}$/);
 const read=p=>fs.readFileSync(path.join(base,p)),json=p=>JSON.parse(read(p)),write=(p,x)=>fs.writeFileSync(path.join(base,p),typeof x==='string'?x:serialize(x));
 const r=load(base),cfg=json('editorial/publication.json'),site=path.dirname(base),git=(...args)=>cp.execFileSync('git',['-C',site,...args],{maxBuffer:32*1024*1024});
 const records=json('public-corpus/page-index.json'),sources=json('public-corpus/source-manifest.json'),meta=json('public-corpus/snapshot.json'),pages=json('data/page-index.json');
 if(r.slugs.every(s=>records.some(x=>x.slug===s))){P.check(base);return {alreadyPublished:true};}
 assert.equal(records.length,441);assert.equal(pages.length,443);assert.equal(sources.length,567);
 for(const p of Object.keys(r.previousCorpus.hashes))assert.equal(hash(read(p)),r.previousCorpus.hashes[p],'Predecessor mismatch: '+p);
 assert.equal(hash(JSON.stringify(records)),r.previousCorpus.unchangedRecordsSha256);
 const date=git('show','-s','--format=%cI',ref).toString().trim(),url='https://github.com/'+cfg.repository,enc=s=>s.split('/').map(encodeURIComponent).join('/');
 const prepared=[];
 // Validate all committed inputs before writing any publication metadata.
 for(const slug of r.slugs){
  const p=pages.find(x=>x.slug===slug),spec=cfg.pages.find(x=>x.slug===slug);assert(p&&!p.sourceFile&&p.kind==='Developed article'&&spec);
  const canonical='theology-wiki/'+spec.source,source='theology-wiki/content/'+p.path;
  const bytes=fs.readFileSync(path.join(site,source)),cb=fs.readFileSync(path.join(site,canonical));
  for(const [s,b] of [[source,bytes],[canonical,cb]]){assert(git('show',ref+':'+s).equals(b),'Commit the source first: '+s);assert(!sources.some(x=>x.path===s));}
  const row={slug,title:p.title,kind:p.kind,category:p.category,sourcePath:source,sourceSha256:hash(bytes),sourceBytes:bytes.length,archivePath:'public-corpus/pages/'+slug+'.md',readerUrl:cfg.reader+'?page='+slug,sourceUrl:url+'/blob/master/'+enc(source),sourceHistoryUrl:url+'/commits/master/'+enc(source),exactSourceUrl:url+'/blob/'+ref+'/'+enc(source),sourceRevision:ref,sourceCommitterDate:date,canonicalSourcePath:canonical,canonicalSourceUrl:url+'/blob/master/'+enc(canonical),canonicalHistoryUrl:url+'/commits/master/'+enc(canonical),canonicalSha256:hash(cb),archiveSha256:hash(bytes),archiveBytes:bytes.length,archiveUrl:url+'/blob/master/theology-wiki/public-corpus/pages/'+slug+'.md'};
  prepared.push({p,row,bytes,sources:[[canonical,cb],[source,bytes]]});
 }
 for(const {p,row,bytes,sources:added} of prepared){
  records.push(row);for(const [s,b] of added)sources.push({path:s,bytes:b.length,sha256:hash(b),exactUrl:url+'/blob/'+ref+'/'+enc(s)});
  write(row.archivePath,bytes.toString());
  p.publication={sourceUrl:row.sourceUrl,historyUrl:row.sourceHistoryUrl,exactUrl:row.exactSourceUrl,archiveUrl:row.archiveUrl,sourcePath:row.sourcePath,sha256:row.sourceSha256,revision:ref,sourceCommitterDate:date,canonicalSourceUrl:row.canonicalSourceUrl,canonicalHistoryUrl:row.canonicalHistoryUrl,transcriptExactUrl:null};
 }
 meta.indexedPages=records.length;meta.markdownSources=sources.length;meta.indexSha256=hash(serialize(records));
 meta.additions.push({sourceRevision:ref,sourceCommitterDate:date,sourceCommitUrl:url+'/commit/'+ref,pages:r.slugs,navigationPages:[],markdownSources:prepared.flatMap(x=>x.sources.map(([s])=>s)).sort(),scope:r.scope});
 write('public-corpus/page-index.json',records);write('public-corpus/source-manifest.json',sources);write('public-corpus/snapshot.json',meta);write('data/page-index.json',pages);
 const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 write('public-corpus/manifest-sha256.csv','slug,archive_path,archive_sha256,archive_bytes,reader_source_path,reader_source_sha256,transcript_sha256\n'+records.map(x=>[x.slug,x.archivePath,x.archiveSha256,x.archiveBytes,x.sourcePath,x.sourceSha256,x.transcriptSha256||''].map(quote).join(',')).join('\n')+'\n');
 write('public-corpus/README.md',read('public-corpus/README.md').toString()+'\n\n<!-- political-studies-addition -->\n## Political signs and execution-broadcast studies\n\nTwo independently attributed studies were added at [source revision '+ref+']('+url+'/commit/'+ref+'), Git committer date '+date+': '+prepared.map(x=>'['+x.p.title+'](pages/'+x.p.slug+'.md)').join('; ')+'. The corpus now contains 443 reader pages. All 441 prior page records and all 354 original source conversations retain their recorded versions and bytes. This date identifies the new edition, not the origin or truth of its claims.\n<!-- /political-studies-addition -->\n');
 for(const p of Object.keys(r.previousCorpus.hashes))historicalCorpusRead(base,p);
 return {addedPages:2,preservedPages:441,...P.check(base)};
}
if(require.main===module)try{console.log(JSON.stringify(publish(process.argv[2]),null,2));}catch(e){console.error(e.stack);process.exitCode=1;}
module.exports={historicalCorpusRead,publish};
