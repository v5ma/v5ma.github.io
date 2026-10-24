'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const receiptPath='editorial/displaced-biography-20261024.json';
const load=base=>JSON.parse(fs.readFileSync(path.join(base,receiptPath)));
const serialize=x=>JSON.stringify(x,null,2)+'\n';
function preservedCanonical(base,p){
 const bytes=fs.readFileSync(path.join(base,p)),r=load(base),row=r.articles.find(a=>a.canonical.path===p);
 if(!row)return bytes;
 assert.equal(hash(bytes),row.canonical.after,'Additive canonical changed: '+p);
 const prior=bytes.subarray(0,row.canonical.beforeBytes);
 assert.equal(hash(prior),row.canonical.before,'Original canonical prefix changed: '+p);
 return prior;
}
function verifyHistoricalDerivative(base,p,expected){
 const r=load(base),row=r.files[p],actual=hash(fs.readFileSync(path.join(base,p)));
 if(!row){assert.equal(actual,expected);return;}
 assert.equal(row.before,expected,'Unexpected historical derivative: '+p);
 assert.equal(actual,row.after,'Additive derivative changed: '+p);
}
function applyDerivativeRevision(expected,base=root){
 const r=load(base),updated={...expected};
 assert.equal(r.reviewBase,'7e40a2b0fb95bfe487539d8f72fa8d51100cfe51');
 assert.deepEqual(r.articles.map(a=>a.slug).sort(),['daniel-jubilee-and-the-teachers-time','jesus-teacher-of-righteousness-hypothesis','sacred-inheritance-and-rival-continuations']);
 const allowed=r.articles.flatMap(a=>['content/developed/'+a.slug+'.md','data/listening/'+a.slug+'.json','products/transcripts/'+a.slug+'.txt']).sort();
 assert.deepEqual(Object.keys(r.files).sort(),allowed);
 for(const a of r.articles)preservedCanonical(base,a.canonical.path);
 for(const p of allowed){assert.equal(expected[p],r.files[p].before,'Unexpected predecessor: '+p);verifyHistoricalDerivative(base,p,expected[p]);updated[p]=r.files[p].after;}
 return updated;
}
// Exact predecessor reconstruction lets historical release guards keep their hashes.
function historicalCorpusRead(base,p){
 const read=q=>fs.readFileSync(path.join(base,q));
 const r=load(base),prior=r.previousCorpus,slugs=new Set(r.articles.map(a=>a.slug));
 if(p==='data/page-index.json')return Buffer.from(serialize(JSON.parse(read(p)).filter(x=>x.slug!==r.overview.slug)));
 if(!Object.hasOwn(prior.hashes,p))return read(p);
 let text;
 if(p==='public-corpus/page-index.json')text=serialize(JSON.parse(read(p)).filter(x=>x.slug!==r.overview.slug).map(x=>prior.records.find(y=>y.slug===x.slug)||x));
 else if(p==='public-corpus/source-manifest.json')text=serialize(JSON.parse(read(p)).filter(x=>!r.overview.sources.includes(x.path)).map(x=>prior.sources.find(y=>y.path===x.path)||x));
 else if(p==='public-corpus/snapshot.json')text=serialize(prior.snapshot);
 else {
  text=read(p).toString().replace(/\n\n<!-- displaced-biography-overview -->[\s\S]*?<!-- \/displaced-biography-overview -->\n*/,'');
  text=text.replace(/<!-- bounded-article-amendments -->[\s\S]*?<!-- \/bounded-article-amendments -->\n*/,prior.amendmentSection);
  const rows=JSON.parse(read('public-corpus/page-index.json'));
  for(const old of prior.records){const now=rows.find(x=>x.slug===old.slug);text=text.split(now.exactSourceUrl).join(old.exactSourceUrl);}
 }
 assert.equal(hash(text),prior.hashes[p],'Exact predecessor corpus changed: '+p);
 return Buffer.from(text);
}
function publish(ref,base=root){
 assert.match(ref,/^[a-f0-9]{40}$/);
 const read=p=>fs.readFileSync(path.join(base,p)),json=p=>JSON.parse(read(p));
 const write=(p,x)=>fs.writeFileSync(path.join(base,p),typeof x==='string'?x:serialize(x));
 const r=load(base),cfg=json('editorial/publication.json'),site=path.dirname(base),git=(...a)=>cp.execFileSync('git',['-C',site,...a],{maxBuffer:32*1024*1024});
 const p=json('data/page-index.json').find(x=>x.slug===r.overview.slug),records=json('public-corpus/page-index.json');
 if(records.some(x=>x.slug===p.slug)){require('./publication.cjs').check(base);return {alreadyPublished:true,slug:p.slug};}
 const meta=json('public-corpus/snapshot.json'),sources=json('public-corpus/source-manifest.json');
 assert.equal(records.length,440);assert.equal(hash(read('public-corpus/page-index.json')),meta.indexSha256);
 for(const a of r.articles)for(const f of [a.canonical.path,'content/developed/'+a.slug+'.md'])assert(git('show',ref+':theology-wiki/'+f).equals(read(f)),'Commit the source first: '+f);
 const canonical=r.overview.sources[0],source=r.overview.sources[1],bytes=read(source.slice('theology-wiki/'.length)),canonicalBytes=read(canonical.slice('theology-wiki/'.length));
 assert(git('show',ref+':'+source).equals(bytes));assert(git('show',ref+':'+canonical).equals(canonicalBytes));
 const date=git('show','-s','--format=%cI',ref).toString().trim(),url='https://github.com/'+cfg.repository,enc=p=>p.split('/').map(encodeURIComponent).join('/');
 const row={slug:p.slug,title:p.title,kind:p.kind,category:p.category,sourcePath:source,sourceSha256:hash(bytes),sourceBytes:bytes.length,archivePath:'public-corpus/pages/'+p.slug+'.md',readerUrl:cfg.reader+'?page='+p.slug,sourceUrl:url+'/blob/master/'+enc(source),sourceHistoryUrl:url+'/commits/master/'+enc(source),exactSourceUrl:url+'/blob/'+ref+'/'+enc(source),sourceRevision:ref,sourceCommitterDate:date,canonicalSourcePath:canonical,canonicalSourceUrl:url+'/blob/master/'+enc(canonical),canonicalHistoryUrl:url+'/commits/master/'+enc(canonical),canonicalSha256:hash(canonicalBytes),archiveSha256:hash(bytes),archiveBytes:bytes.length,archiveUrl:url+'/blob/master/theology-wiki/public-corpus/pages/'+p.slug+'.md'};
 records.push(row);
 for(const s of [canonical,source]){assert(!sources.some(x=>x.path===s));const b=fs.readFileSync(path.join(site,s));sources.push({path:s,bytes:b.length,sha256:hash(b),exactUrl:url+'/blob/'+ref+'/'+enc(s)});}
 // Preserve existing source-record order; the new records append deterministically.
 meta.indexedPages=records.length;meta.markdownSources=sources.length;meta.indexSha256=hash(serialize(records));
 meta.additions.push({sourceRevision:ref,sourceCommitterDate:date,sourceCommitUrl:url+'/commit/'+ref,pages:[p.slug],navigationPages:[],markdownSources:[canonical,source].sort(),scope:'One hypothesis overview; prior records are preserved. Three separately recorded article amendments retain their old bodies.'});
 write(row.archivePath,bytes.toString());write('public-corpus/page-index.json',records);write('public-corpus/source-manifest.json',sources);write('public-corpus/snapshot.json',meta);
 const pages=json('data/page-index.json');pages.find(x=>x.slug===p.slug).publication={sourceUrl:row.sourceUrl,historyUrl:row.sourceHistoryUrl,exactUrl:row.exactSourceUrl,archiveUrl:row.archiveUrl,sourcePath:source,sha256:row.sourceSha256,revision:ref,sourceCommitterDate:date,canonicalSourceUrl:row.canonicalSourceUrl,canonicalHistoryUrl:row.canonicalHistoryUrl,transcriptExactUrl:null};write('data/page-index.json',pages);
 write('public-corpus/README.md',read('public-corpus/README.md').toString()+'\n\n<!-- displaced-biography-overview -->\n## Earlier-Teacher overview addition\n\n['+p.title+'](pages/'+p.slug+'.md) is an additive overview at [source revision '+ref+']('+url+'/commit/'+ref+'), Git committer date '+date+'. This date records this edition, not the origin or truth of the hypothesis. The corpus now contains 441 reader pages and preserves all 354 original conversations.\n<!-- /displaced-biography-overview -->\n');
 const amended=require('./publication.cjs').amend(base,ref,r.articles.map(a=>a.slug));
 require('./publication.cjs').check(base);
 return {addedPages:1,...amended};
}
if(require.main===module)try{console.log(JSON.stringify(publish(process.argv[2]),null,2));}catch(e){console.error(e.stack);process.exitCode=1;}
module.exports={preservedCanonical,verifyHistoricalDerivative,applyDerivativeRevision,historicalCorpusRead,publish};
