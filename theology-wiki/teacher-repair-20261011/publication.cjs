'use strict';
// Amend one reviewed article and exactly its two generated summary navigators.
// The original corpus snapshot and every unrelated source-version record stay intact.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const P=require('../tools/publication.cjs'),SPEC=require('./revision.json');
const SLUG='jesus-teacher-of-righteousness-hypothesis',NAV=['theology-wiki/content/developed/topic-jesus.md','theology-wiki/content/home.md'];
const encoded=p=>p.split('/').map(encodeURIComponent).join('/');
function apply(root,ref,spec=SPEC){
 if(!/^[a-f0-9]{40}$/.test(ref||''))throw Error('A full committed source revision is required');
 assert.equal(spec.slug,SLUG,'Unexpected Teacher slug');assert.deepEqual(Object.keys(spec.navigation).sort(),NAV,'Only the two reviewed Teacher summary navigators may be amended');
 const site=path.dirname(root),read=p=>fs.readFileSync(path.join(root,p)),json=p=>JSON.parse(read(p));
 const git=(...a)=>cp.execFileSync('git',['-C',site,...a],{maxBuffer:64*1024*1024});
 const committed=source=>{const file=path.join(site,source);assert(!fs.lstatSync(file).isSymbolicLink(),'Symlink amendment source');const bytes=fs.readFileSync(file);assert(git('show',ref+':'+source).equals(bytes),'Commit the source first: '+source);return bytes;};
 const cfg=json('editorial/publication.json'),base='https://github.com/'+cfg.repository,date=git('show','-s','--format=%cI',ref).toString().trim();
 const pages=json('data/page-index.json'),records=json('public-corpus/page-index.json'),supplement=json('public-corpus/source-manifest.json'),meta=json('public-corpus/snapshot.json');
 assert.equal(P.hash(read('public-corpus/page-index.json')),meta.indexSha256,'Corpus index mismatch');
 assert.equal(records.length,pages.length,'Corpus coverage mismatch');
 assert.equal(new Set(records.map(r=>r.slug)).size,records.length,'Duplicate corpus record');
 assert.equal(P.hash(committed('theology-wiki/editorial/authorial-articles/'+SLUG+'.md')),spec.canonical.after,'Unexpected Teacher canonical revision');
 const changes=[];
 // Complete all navigation validation before the article amendment writes anything.
 for(const source of NAV){
  const rule=spec.navigation[source],expectedSlug=source.endsWith('/home.md')?'home':'topic-jesus';assert.equal(rule.slug,expectedSlug);
  const p=pages.find(p=>p.slug===rule.slug),r=records.find(r=>r.slug===rule.slug),s=supplement.find(x=>x.path===source);
  assert(p&&r&&s,'Missing navigation source record');assert(!p.sourceFile&&!r.transcriptSourcePath,'Navigation must not be a conversation');
  assert.equal(p.kind,rule.slug==='home'?'Library home':'Topic collection','Unexpected navigation kind');
  assert.equal(source,'theology-wiki/content/'+p.path);assert.equal(r.sourcePath,source);assert.equal(r.archivePath,'public-corpus/pages/'+rule.slug+'.md');
  const bytes=committed(source);assert.equal(P.hash(bytes),rule.after,'Unreviewed Teacher navigation bytes');
  assert([rule.before,rule.after].includes(r.sourceSha256),'Unexpected Teacher navigation baseline');
  assert.equal(P.hash(read(r.archivePath)),r.sourceSha256,'Navigation archive mismatch');assert.equal(s.sha256,r.sourceSha256,'Navigation supplement mismatch');
  assert.equal(p.publication?.sha256,r.sourceSha256,'Navigation reader provenance mismatch');
  if(r.sourceSha256!==rule.after)changes.push({source,rule,bytes});
 }
 assert(changes.length===0||changes.length===2,'Both Teacher summary navigators must change together');
 if(changes.length)assert(!read('public-corpus/README.md').toString().includes('<!-- teacher-structure-navigation-amendment -->'),'Teacher navigation amendment already recorded');
 const article=P.amendArticle(root,ref,SLUG);
 if(!changes.length)return {...article,amendedNavigationPages:0};
 assert.equal(changes.length,2,'Both Teacher summary navigators must change together');
 const nextPages=json('data/page-index.json'),nextRecords=json('public-corpus/page-index.json'),nextSupplement=json('public-corpus/source-manifest.json'),nextMeta=json('public-corpus/snapshot.json'),outputs=[];
 for(const {source,rule,bytes}of changes){
  const r=nextRecords.find(r=>r.slug===rule.slug),p=nextPages.find(p=>p.slug===rule.slug),s=nextSupplement.find(x=>x.path===source);
  Object.assign(r,{sourceSha256:rule.after,sourceBytes:bytes.length,archiveSha256:rule.after,archiveBytes:bytes.length,sourceRevision:ref,sourceCommitterDate:date,exactSourceUrl:base+'/blob/'+ref+'/'+encoded(source)});
  p.publication={...p.publication,sha256:rule.after,revision:ref,sourceCommitterDate:date,exactUrl:r.exactSourceUrl};
  Object.assign(s,{bytes:bytes.length,sha256:rule.after,exactUrl:r.exactSourceUrl});outputs.push([r.archivePath,bytes]);
 }
 const entry={sourceRevision:ref,sourceCommitterDate:date,sourceCommitUrl:base+'/commit/'+ref,article:SLUG,pages:changes.map(x=>x.rule.slug).sort(),markdownSources:changes.map(x=>x.source).sort(),scope:'Exactly the two generated navigation summaries for the structurally revised Teacher article.'};
 nextMeta.navigationAmendments=[...(nextMeta.navigationAmendments||[]),entry];nextMeta.indexSha256=P.hash(JSON.stringify(nextRecords,null,2)+'\n');
 outputs.push(['data/page-index.json',nextPages],['public-corpus/page-index.json',nextRecords],['public-corpus/source-manifest.json',nextSupplement],['public-corpus/snapshot.json',nextMeta]);
 const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 outputs.push(['public-corpus/manifest-sha256.csv','slug,archive_path,archive_sha256,archive_bytes,reader_source_path,reader_source_sha256,transcript_sha256\n'+nextRecords.map(r=>[r.slug,r.archivePath,r.archiveSha256,r.archiveBytes,r.sourcePath,r.sourceSha256,r.transcriptSha256||''].map(quote).join(',')).join('\n')+'\n']);
 let guide=read('public-corpus/README.md').toString();
 const section='\n\n<!-- teacher-structure-navigation-amendment -->\n## Teacher article navigation amendment\n\nThe Teacher article summary in the home and Jesus-topic pages was revised at [source revision '+ref+']('+entry.sourceCommitUrl+'), Git committer date '+date+'. The original snapshot, Gospel addition receipt and all unrelated page histories remain unchanged. The article has its own bounded amendment above.\n<!-- /teacher-structure-navigation-amendment -->\n';
 assert(!guide.includes('<!-- teacher-structure-navigation-amendment -->'),'Teacher navigation amendment already recorded');
 for(const {source,rule}of changes){const old=records.find(r=>r.slug===rule.slug),next=nextRecords.find(r=>r.slug===rule.slug);guide=guide.split(old.exactSourceUrl).join(next.exactSourceUrl);}
 outputs.push(['public-corpus/README.md',guide.trimEnd()+section]);
 for(const [p,v]of outputs)fs.writeFileSync(path.join(root,p),typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n');
 return {...article,amendedNavigationPages:changes.length};
}
module.exports={apply};
if(require.main===module){try{console.log(JSON.stringify(apply(path.resolve(__dirname,'..'),process.argv[2]),null,2));}catch(e){console.error(e.stack);process.exitCode=1;}}
