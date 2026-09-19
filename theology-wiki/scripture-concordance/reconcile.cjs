/* Reconcile the explicit September 17 content revision with existing release contracts. */
'use strict';
if(require('node:fs').existsSync(require('node:path').join(__dirname,'../research-expansion-20260918/manifest.json'))){require('../research-expansion-20260918/reconcile.cjs');return;}
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(process.argv.includes('--metadata')){
 const file=path.join(root,'editorial/products.json'),data=JSON.parse(fs.readFileSync(file));
 data.version=JSON.parse(read('editorial/authorial.json')).version;
 fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
 const file2=path.join(root,'tests/restoration.test.cjs'),text=fs.readFileSync(file2,'utf8');
 const before="test('All prior complete studies, narration, transcript and planning files retain pinned bytes',()=>{const fixture=json('tests/fixtures/restoration-baseline-hashes.json');assert.equal(fixture.baseline,'eebe9c097f1ac6795a63ccb258a87067f91460c9');assert(Object.keys(fixture.files).length>90);for(const [p,hash] of Object.entries(fixture.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),hash,p);});";
 const after="test('Prior source baseline remains intact except six explicitly versioned article derivatives',()=>{const fixture=json('tests/fixtures/restoration-baseline-hashes.json'),revision=json('scripture-concordance/revision-receipt.json');assert.equal(fixture.baseline,'eebe9c097f1ac6795a63ccb258a87067f91460c9');assert(Object.keys(fixture.files).length>90);const allowed=['trump-first-beast-of-revelation','antichrist-as-a-pattern-of-conduct'].flatMap(s=>['content/developed/'+s+'.md','data/listening/'+s+'.json','products/transcripts/'+s+'.txt']).sort();assert.deepEqual(Object.keys(revision.files).sort(),allowed);for(const [p,hash] of Object.entries(fixture.files)){const change=revision.files[p];if(change)assert.equal(change.before,hash,p);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),change?change.after:hash,p);}});";
 if(text.includes(before))fs.writeFileSync(file2,text.replace(before,after));else if(!text.includes(after))throw Error('Unexpected restoration test contract');
 console.log('Synchronized product cache edition; preserved the original baseline fixture and declared six derivative revisions.');
}else{
 const fixture=JSON.parse(read('tests/fixtures/restoration-baseline-hashes.json'));
 const allowed=new Set(['trump-first-beast-of-revelation','antichrist-as-a-pattern-of-conduct'].flatMap(s=>['content/developed/'+s+'.md','data/listening/'+s+'.json','products/transcripts/'+s+'.txt']));
 const files={};for(const[p,before]of Object.entries(fixture.files)){const after=sha(fs.readFileSync(path.join(root,p)));if(allowed.has(p)){files[p]={before,after};}else if(before!==after)throw Error('Unexpected change to restoration baseline: '+p);}
 if(Object.keys(files).length!==6)throw Error('Expected exactly six declared article derivatives');
 fs.writeFileSync(path.join(__dirname,'revision-receipt.json'),JSON.stringify({schema_version:1,edition_date:'2026-09-17',baseline:fixture.baseline,scope:'Only the two requested article bodies and their regenerated narration and transcript. Original canonical prefixes are verified by integration-receipt.json; every other restoration-baseline file remains byte-identical.',files},null,2)+'\n');
 console.log(JSON.stringify({declared_derivative_revisions:Object.keys(files)}));
}
