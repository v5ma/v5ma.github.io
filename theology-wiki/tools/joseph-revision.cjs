'use strict';
// A bounded successor receipt preserves the older Hyksos receipt and source bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function applyDerivativeRevision(expected){
 const read=p=>fs.readFileSync(path.join(root,p));
 const r=JSON.parse(read('editorial/joseph-revision-20261023.json'));
 assert.equal(r.schema_version,1);
 assert.equal(r.review_base_commit,'247c0f7679797ce98669026c37da74440c9b5e85');
 assert.equal(r.slug,'exodus-to-temple-competing-chronologies');
 assert.equal(r.canonical.path,'editorial/authorial-articles/'+r.slug+'.md');
 assert.equal(r.prior_receipt.path,'research-reports/hyksos-avaris-20260922/revision-receipt.json');
 assert.equal(hash(read(r.prior_receipt.path)),r.prior_receipt.sha256,'Historical Hyksos receipt changed');
 const body=read(r.canonical.path);
 assert.equal(hash(body),r.canonical.sha256,'Joseph canonical changed');
 assert.equal(hash(body.subarray(0,r.canonical.preserved_bytes)),r.canonical.preserved_sha256,'Original canonical bytes changed');
 assert(body.subarray(r.canonical.preserved_bytes).toString('utf8').startsWith('\n## Joseph before Hyksos rule: a formative-period hypothesis'));
 const allowed=['content/developed/'+r.slug+'.md','data/listening/'+r.slug+'.json','products/transcripts/'+r.slug+'.txt'].sort();
 assert.deepEqual(Object.keys(r.files).sort(),allowed,'Only three article derivatives may advance');
 const updated={...expected};
 for(const p of allowed){assert.equal(r.files[p].before,expected[p],'Unexpected prior version: '+p);assert.equal(hash(read(p)),r.files[p].after,'Joseph derivative changed: '+p);updated[p]=r.files[p].after;}
 return require('./displaced-biography-revision.cjs').applyDerivativeRevision(updated);
}
// Undo only this later corpus amendment when verifying an older Gospel addition.
// Its original predecessor digest guards still run against the reconstructed bytes.
function historicalCorpusRead(base,p){
 const read=q=>require('./displaced-biography-revision.cjs').historicalCorpusRead(base,q);
 const r=JSON.parse(read('editorial/joseph-revision-20261023.json')),prior=r.previous_corpus;
 if(!prior||!Object.hasOwn(prior.hashes,p))return read(p);
 let text;
 if(p==='public-corpus/page-index.json'){
  const rows=JSON.parse(read(p)).map(x=>x.slug===r.slug?prior.record:x);
  text=JSON.stringify(rows,null,2)+'\n';
 }else if(p==='public-corpus/source-manifest.json'){
  const rows=JSON.parse(read(p)).map(x=>prior.sources.find(s=>s.path===x.path)||x);
  text=JSON.stringify(rows,null,2)+'\n';
 }else if(p==='public-corpus/snapshot.json')text=JSON.stringify(prior.snapshot,null,2)+'\n';
 else {
  text=read(p).toString();
  const section=/<!-- bounded-article-amendments -->[\s\S]*?<!-- \/bounded-article-amendments -->\n*/;
  text=text.replace(section,prior.amendment_section);
  const current=JSON.parse(read('public-corpus/page-index.json')).find(x=>x.slug===r.slug);
  text=text.split(current.exactSourceUrl).join(prior.record.exactSourceUrl);
 }
 assert.equal(hash(text),prior.hashes[p],'Later amendment must reconstruct exact prior corpus: '+p);
 return Buffer.from(text);
}
module.exports={applyDerivativeRevision,historicalCorpusRead};
