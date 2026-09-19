'use strict';
// Explicit, idempotent correction of abbreviated locators exposed by the first contract run.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourcePath=path.join(__dirname,'sources.json'),raw=fs.readFileSync(sourcePath),data=JSON.parse(raw);const incomplete=data.sources.filter(x=>x.locator.length<=15);
if(incomplete.length){assert.equal(sha(raw),'6e031ae84015113d0e1ec7b32a2dcbb9b1fc34fbd4fccda4a924be47f893fe2b');assert.equal(incomplete.length,14);for(const x of incomplete)x.locator=x.title.split(',')[0]+': '+x.locator;fs.writeFileSync(sourcePath,JSON.stringify(data,null,2)+'\n');}
const file=path.join(__dirname,'studies.json'),text=fs.readFileSync(file,'utf8'),old='Its opposite would reduce vulnerability without withdrawing from responsibility.',replacement='Its opposite would reduce vulnerability without withdrawing from shared responsibility.';
if(text.includes(old)){assert.equal(sha(Buffer.from(text)),'3bd18a4cae7828ed3466e7e076fa735a51e8161ae0694609bcec77ddbe034813');assert.equal(text.split(old).length,2);fs.writeFileSync(file,text.replace(old,replacement));}else assert.ok(text.includes(replacement));
console.log(JSON.stringify({expanded_source_locators:incomplete.length,shared_responsibility_explicit:true,tests_unchanged:true}));
