'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
function verify(){
 if(fs.existsSync(path.join(root,'comparative-religion/revision-receipt.json')))return require('../comparative-religion/verify-preservation.cjs').verify().legacy;
 const baseline=load('tests/fixtures/restoration-baseline-hashes.json'),prior=load('scripture-concordance/revision-receipt.json'),current=load('research-expansion-20260918/revision-receipt.json'),manifest=load('research-expansion-20260918/manifest.json');
 assert.equal(baseline.baseline,'eebe9c097f1ac6795a63ccb258a87067f91460c9');assert.ok(Object.keys(baseline.files).length>90);
 const paths=slugs=>slugs.flatMap(s=>['content/developed/'+s+'.md','data/listening/'+s+'.json','products/transcripts/'+s+'.txt']).sort();
 assert.deepEqual(Object.keys(prior.files).sort(),paths(['trump-first-beast-of-revelation','antichrist-as-a-pattern-of-conduct']));
 assert.deepEqual(Object.keys(current.files).sort(),paths(manifest.articles.map(a=>a.slug)));
 assert.equal(current.edition_date,'2026-09-18');
 for(const[p,before]of Object.entries(baseline.files)){assert.ok(!(prior.files[p]&&current.files[p]));const update=current.files[p]||prior.files[p];if(update)assert.equal(update.before,before,p);assert.equal(digest(p),update?update.after:before,p);}
 for(const p of [...Object.keys(prior.files),...Object.keys(current.files)])assert.ok(Object.hasOwn(baseline.files,p),p);
 return {unchangedBaseline:baseline.baseline,priorDeclared:6,newDeclared:9};
}
module.exports={verify};if(require.main===module)console.log(JSON.stringify(verify()));
