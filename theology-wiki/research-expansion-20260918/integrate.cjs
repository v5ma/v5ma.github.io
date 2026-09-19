'use strict';
// Idempotent integration. Original canonical bodies remain byte-identical within each result.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),manifest=require('./manifest.json');
const blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const records=[];
for(const row of manifest.articles){
 const p=path.join(root,'editorial/authorial-articles',row.slug+'.md'),current=fs.readFileSync(p),extra=fs.readFileSync(path.join(__dirname,row.supplement));
 let original=current;
 if(row.position==='prepend'&&current.subarray(0,extra.length).equals(extra))original=current.subarray(extra.length);
 if(row.position==='append'&&current.length>=extra.length&&current.subarray(current.length-extra.length).equals(extra))original=current.subarray(0,current.length-extra.length);
 if(blob(original)!==row.original_git_blob)throw Error('Original canonical body changed: '+row.slug);
 const combined=row.position==='prepend'?Buffer.concat([extra,original]):Buffer.concat([original,extra]);
 if(!current.equals(combined))fs.writeFileSync(p,combined);
 records.push({slug:row.slug,position:row.position,original_git_blob:row.original_git_blob,original_bytes:original.length,supplement:row.supplement,supplement_bytes:extra.length,integrated_git_blob:blob(combined)});
}
const metadata=path.join(root,'editorial/authorial.json'),meta=JSON.parse(fs.readFileSync(metadata));
if(meta.updated>manifest.edition_date)throw Error('A newer authorial edition requires reconciliation before integration.');
meta.version=manifest.version;meta.updated=manifest.edition_date;
for(const row of manifest.articles){const article=meta.articles.find(a=>a.slug===row.slug);if(!article)throw Error('Missing article metadata');article.summary=row.summary;article.updated=manifest.edition_date;}
const teacher=meta.articles.find(a=>a.slug==='jesus-teacher-of-righteousness-hypothesis');
teacher.aliases=[...new Set([...(teacher.aliases||[]),'Earlier-Founder Jesus-Teacher Identity Hypothesis'])];
fs.writeFileSync(metadata,JSON.stringify(meta,null,2)+'\n');
const productPath=path.join(root,'editorial/products.json'),products=JSON.parse(fs.readFileSync(productPath));products.version=manifest.version;fs.writeFileSync(productPath,JSON.stringify(products,null,2)+'\n');
// Historical tooling must not downgrade a later, explicitly integrated edition.
const oldPath=path.join(root,'scripture-concordance/integrate.cjs');let old=fs.readFileSync(oldPath,'utf8');
const before="meta.version='2026.09.17-scripture-concordance-1';meta.updated='2026-09-17';";
const after="if(meta.updated<='2026-09-17'){meta.version='2026.09.17-scripture-concordance-1';meta.updated='2026-09-17';}";
if(old.includes(before)&&!old.includes(after))old=old.replace(before,after);else if(!old.includes(after))throw Error('Unexpected historical integration metadata contract');
fs.writeFileSync(oldPath,old);
const reconcilePath=path.join(root,'scripture-concordance/reconcile.cjs');let prior=fs.readFileSync(reconcilePath,'utf8');
const dispatch="if(require('node:fs').existsSync(require('node:path').join(__dirname,'../research-expansion-20260918/manifest.json'))){require('../research-expansion-20260918/reconcile.cjs');return;}\n";
if(!prior.includes(dispatch))prior=prior.replace("'use strict';\n","'use strict';\n"+dispatch);
fs.writeFileSync(reconcilePath,prior);
const testPath=path.join(root,'tests/restoration.test.cjs');let tests=fs.readFileSync(testPath,'utf8');
const oldTest=tests.split('\n').find(line=>line.startsWith("test('Prior source baseline remains intact except six explicitly versioned article derivatives'"));
const newTest="test('Prior source baseline retains exactly the authorized September 17 and September 18 derivatives',()=>{require('../research-expansion-20260918/verify-preservation.cjs').verify();});";
if(oldTest)tests=tests.replace(oldTest,newTest);else if(!tests.includes(newTest))throw Error('Unexpected restoration preservation test');
fs.writeFileSync(testPath,tests);
const readme=path.join(root,'README.md'),text=fs.readFileSync(readme,'utf8');
const addition='\nThe September 18 identity-agency-scarcity edition expands three existing canonical articles without replacing their original bodies. The Earlier-Founder Jesus-Teacher Identity Hypothesis remains a distinct identification proposal; the will study treats exaltation and dependence together; the forecast study connects AI authority and material access with dated 2027 scenarios. [The evidence and scenario notebook](research-expansion-20260918/index.html) provides source links, constraints and six separately labeled future review scenarios. Original forecasts, original chats, the scripture concordance and corpus snapshots remain unchanged. Main search and listening text are regenerated.\n';
if(!text.includes('The September 18 identity-agency-scarcity edition'))fs.writeFileSync(readme,text+addition);
fs.writeFileSync(path.join(__dirname,'integration-receipt.json'),JSON.stringify({schema_version:1,edition_date:manifest.edition_date,base_commit:manifest.base_commit,articles:records},null,2)+'\n');
console.log(JSON.stringify({integrated:records.map(r=>r.slug),version:manifest.version}));
