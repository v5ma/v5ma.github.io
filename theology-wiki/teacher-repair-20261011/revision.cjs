'use strict';
// A bounded successor to PR 230. Its receipt and earlier source bytes stay immutable.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const revision=require('./revision.json'),root=path.resolve(__dirname,'..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const read=(base,p)=>fs.readFileSync(path.join(base,p));
function verifyCanonical(base=root){
 assert.equal(hash(read(base,'teacher-repair-20261011/revision.json')),'62d555d1f65870e44220fa24b858e94f8cd75acd0dbaa815d6cc9a362a734b90','Reviewed Teacher repair receipt changed');
 assert.equal(revision.schema_version,1);assert.equal(revision.slug,'jesus-teacher-of-righteousness-hypothesis');
 assert.equal(revision.review_base_commit,'70bf669b241ae51fbca864742dfd086b79f662bf');
 assert.equal(revision.prior_revision_receipt.path,'research-expansion-20260918/teacher-revision-20261011.json');
 assert.equal(revision.prior_revision_receipt.sha256,'cfe4472be8c85b4de1f59a0c1629a4a270359b59cb27a1ac454c9947aa5c8a33');
 assert.equal(hash(read(base,revision.prior_revision_receipt.path)),revision.prior_revision_receipt.sha256,'PR 230 receipt changed');
 const prior=JSON.parse(read(base,revision.prior_revision_receipt.path));
 assert.equal(revision.canonical.path,prior.canonical.path);assert.equal(revision.canonical.before,prior.canonical.sha256);
 assert.equal(revision.historical_canonical.path,'tests/fixtures/teacher-canonical-before-structure-20261011.md');
 assert.equal(revision.historical_canonical.git_blob,'74a6ec271fa0dc2606bf2a13c3fc58d167fb7752');
 const historical=read(base,revision.historical_canonical.path);
 assert.equal(blob(historical),revision.historical_canonical.git_blob,'PR 230 canonical snapshot changed');
 assert.equal(hash(historical),revision.canonical.before,'PR 230 canonical hash changed');
 assert.equal(revision.canonical.after,'e8534bdf8b7c48568e84637dc59b7fe2db6f3f14d7c2c2f65e31faa01fbd05df');
 assert.equal(hash(read(base,revision.canonical.path)),revision.canonical.after,'Reviewed Teacher repair changed');
 const meta=JSON.parse(read(base,'editorial/authorial.json')).articles.find(a=>a.slug===revision.slug);
 assert.equal(meta.updated,revision.metadata.updated,'Approved Teacher date changed');
 assert.equal(meta.summary,revision.metadata.summary_after,'Reviewed Teacher summary changed');
 return historical;
}
function derivativeHash(p,priorHash,base=root){
 const paths=['content/developed/'+revision.slug+'.md','data/listening/'+revision.slug+'.json','products/transcripts/'+revision.slug+'.txt'].sort();
 assert.deepEqual(Object.keys(revision.files).sort(),paths,'Only three Teacher derivatives may be amended');
 const row=revision.files[p];assert.ok(row,'Unapproved Teacher derivative');
 assert.equal(row.before,priorHash,'Teacher repair must chain from PR 230: '+p);
 assert.equal(hash(read(base,p)),row.after,'Reviewed Teacher derivative changed: '+p);return row.after;
}
module.exports={revision,verifyCanonical,derivativeHash,hash};
