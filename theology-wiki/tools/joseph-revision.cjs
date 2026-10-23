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
 return updated;
}
module.exports={applyDerivativeRevision};
