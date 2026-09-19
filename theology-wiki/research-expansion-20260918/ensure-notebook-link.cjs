'use strict';
// Exact migration after a real browser check exposed the missing reciprocal notebook link.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const extraPath=path.join(__dirname,'divine-agency.md'),articlePath=path.join(__dirname,'../editorial/authorial-articles/divine-will-and-self-authorizing-power.md');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const url='https://v5ma.github.io/theology-wiki/research-expansion-20260918/index.html';
const old=fs.readFileSync(extraPath);if(old.toString().includes(url)){console.log('Notebook backlink is already present.');}else{
 assert.equal(sha(old),'3abc8fa83732b8321e36280fa381e954388e3fc21d04affeae44732491fbe09d');
 const current=fs.readFileSync(articlePath);assert.equal(blob(current),'3a8addfe0a4ca70ace47bafaff1ac18576bc6015');assert.ok(current.subarray(current.length-old.length).equals(old));
 const original=current.subarray(0,current.length-old.length);assert.equal(blob(original),'efa4b3564e5469132c893688865d9ba78accdd58');
 const marker='## Sources for the divine-agency extension';assert.ok(old.toString().includes(marker));
 const paragraph='The [evidence and scenario notebook]('+url+') places the attributed sayings beside the historical constraints and the AI-and-scarcity scenarios. Its separate record types keep a philosophical account of inward formation distinct from a historical identity claim or a measured forecast.\n\n';
 const updated=Buffer.from(old.toString().replace(marker,paragraph+marker));fs.writeFileSync(extraPath,updated);fs.writeFileSync(articlePath,Buffer.concat([original,updated]));console.log('Added the missing reciprocal link without changing the original canonical body.');
}
