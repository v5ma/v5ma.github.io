'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),ledger=require('./semantic-retention-ledger.json');
test('The reviewed semantic ledger pins all three canonical versions and every current anchor',()=>{
 for(const snapshot of Object.values(ledger.snapshots)){
  assert(snapshot.path.startsWith('theology-wiki/')&&!snapshot.path.includes('..'));
  const bytes=fs.readFileSync(path.join(root,'..',snapshot.path));
  assert.equal(bytes.length,snapshot.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),snapshot.sha256);
  assert(snapshot.source_url.startsWith('https://github.com/v5ma/v5ma.github.io/blob/'));
 }
 assert.equal(ledger.rows.length,110);assert.equal(new Set(ledger.rows.map(r=>r.id)).size,110);
 const lines=fs.readFileSync(path.join(root,'..',ledger.snapshots.candidate232.path),'utf8').split('\n');
 for(const row of ledger.rows){assert(row.semantic_content&&row.assessment&&row.reason,row.id);assert(Number.isInteger(row.candidate232.line)&&row.candidate232.line>0,row.id);assert(lines[row.candidate232.line-1].includes(row.candidate232.anchor),row.id);}
});
test('The audit distinguishes canonical retention, restored omissions and unexpanded source candidates',()=>{
 assert.equal(require('./restoration-verification.json').length,6);
 assert.equal(require('./source-example-ledger.json').length,44);
 assert.equal(require('./additional-source-branches.json').length,10);
 const report=fs.readFileSync(path.join(__dirname,'SEMANTIC-RETENTION-AUDIT.md'),'utf8');
 assert(report.includes('not independent validation of the historical hypothesis'));
 assert(report.includes('Do not describe this result as a lossless reproduction of every source conversation'));
 assert(!report.includes('/workspace/'));
});
