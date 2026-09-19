'use strict';
// Explicit extension of the original immutable baseline; previous six declared changes remain pinned.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),manifest=require('./manifest.json'),load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
if(process.argv.includes('--metadata')){
 const file=path.join(root,'editorial/products.json'),p=JSON.parse(fs.readFileSync(file));p.version=load('editorial/authorial.json').version;fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
}else{
 const baseline=load('tests/fixtures/restoration-baseline-hashes.json'),prior=load('scripture-concordance/revision-receipt.json');
 const expected=manifest.articles.flatMap(a=>['content/developed/'+a.slug+'.md','data/listening/'+a.slug+'.json','products/transcripts/'+a.slug+'.txt']);const allowed=new Set(expected),files={};
 assert.equal(Object.keys(prior.files).length,6);
 for(const[p,before]of Object.entries(baseline.files)){const after=sha(p);if(allowed.has(p))files[p]={before,after};else if(prior.files[p]){assert.equal(prior.files[p].before,before,p);assert.equal(prior.files[p].after,after,p);}else assert.equal(after,before,p);}
 assert.deepEqual(Object.keys(files).sort(),expected.sort());
 const receipt={schema_version:1,edition_date:manifest.edition_date,baseline:baseline.baseline,scope:'Exactly three requested article bodies and their narration JSON and text transcripts. The previous six derivative revisions remain unchanged; every other pinned file retains its original bytes.',files};
 fs.writeFileSync(path.join(__dirname,'revision-receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(require('./verify-preservation.cjs').verify()));
}
