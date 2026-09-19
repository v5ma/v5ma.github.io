'use strict';
// Correct the guarded input version after reading the actual current source, without weakening the guard.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const p=path.join(__dirname,'integrate.cjs');let s=fs.readFileSync(p,'utf8');
const old="patch('expansion.test.cjs','b721afb2b3ec0403558926667afcbff35d28a45c0ac2c6aa98fd91fe5bd5b8e1'";
const updated="patch('expansion.test.cjs','923d5d178f3c893bb932720b20ce57686d87d35db37e9580c5181122d65ec082'";
if(s.includes(old)){
 const raw=fs.readFileSync(path.join(__dirname,'../research-expansion-20260918/expansion.test.cjs'));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'923d5d178f3c893bb932720b20ce57686d87d35db37e9580c5181122d65ec082');
 assert.equal(s.split(old).length-1,1);s=s.replace(old,updated);fs.writeFileSync(p,s);console.log('Recovered compatibility guard now pins the actual Board-of-Peace-era test source.');
}else{assert.ok(s.includes(updated));console.log('Compatibility guard was already corrected.');}
