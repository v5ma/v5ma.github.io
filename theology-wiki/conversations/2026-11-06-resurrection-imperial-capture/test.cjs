'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {outputs,prose} = require('./build.cjs');
const data = require('./transcript.json');
const integrity = require('./source-integrity.json');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const html = outputs()['index.html'];
test('all 17 messages and both supplied texts match their recorded hashes', () => {
  assert.equal(hash(fs.readFileSync(path.join(__dirname,'transcript.json'))),integrity.sha256);
  assert.equal(data.turns.length,17);
  assert.equal(data.turns.filter(t=>t.speaker==='User').length,6);
  assert.equal(data.turns.filter(t=>t.speaker==='dot').length,11);
  assert.equal(data.turns.flatMap(t=>t.attachments||[]).length,2);
  data.turns.forEach((t,i) => {
    const original=integrity.turns[i];
    assert.equal(t.id,'turn-'+(i+1)); assert.equal(t.id,original.id);
    assert.equal(t.speaker,original.speaker); assert.equal(hash(t.text),original.sha256);
    (t.attachments||[]).forEach((a,j)=>{assert.equal(a.name,original.attachments[j].name);assert.equal(hash(a.text),original.attachments[j].sha256);});
  });
});
test('all source wording is retained in generated Markdown and outputs are deterministic', () => {
  for(const [name,text] of Object.entries(outputs())) assert.equal(fs.readFileSync(path.join(__dirname,name),'utf8'),text);
  assert.deepEqual(outputs(),outputs(JSON.parse(JSON.stringify(data))));
  for(const t of data.turns) {
    assert.ok(outputs()['transcript.md'].includes(t.text));
    for(const a of t.attachments||[]) assert.ok(outputs()['transcript.md'].includes(a.text));
  }
});
test('speakers, attachment attribution, source uncertainty and clarified scope remain visible', () => {
  assert.equal((html.match(/class="turn user"/g)||[]).length,6);
  assert.equal((html.match(/class="turn assistant"/g)||[]).length,11);
  assert.equal((html.match(/class="prose attachment-text"/g)||[]).length,2);
  assert.ok(html.includes('not an independently fact-checked article'));
  assert.ok(html.includes('not authorship of every sentence'));
  assert.ok(html.includes('not proof that it was invented'));
  assert.ok(html.includes('Mathew, Mark, Luke, and John.'));
  assert.ok(html.includes('not collective Jewish responsibility'));
});
test('HTML has unique anchors, exact source URLs, safe markup and complete static content', () => {
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(m[1]),m[1]);
  for(const t of data.turns) for(const m of t.text.matchAll(/\]\((https?:\/\/[^\s)]+)\)/g)) assert.ok(html.includes(m[1].replace(/&/g,'&amp;')),m[1]);
  assert.ok(!html.includes('<script'));
  assert.match(prose('<script>alert(1)</script>','test'),/&lt;script&gt;/);
  assert.match(html,/<html lang="en">/);assert.match(html,/name="viewport"/);
  assert.match(html,/class="skip" href="#main"/);
});
test('local navigation resolves and Latest adds this release without replacing prior entries', () => {
  for(const m of html.matchAll(/href="([^"#]+)"/g)) if(!m[1].startsWith('http')) assert.ok(fs.existsSync(path.resolve(__dirname,m[1].split('?')[0])),m[1]);
  const manifest=require('../../latest/manifest.json');
  const releases=manifest.entries.filter(e=>e.href==='../conversations/2026-11-06-resurrection-imperial-capture/index.html');
  assert.equal(releases.length,1);
  assert.equal(releases[0].date,'2026-11-07');
  assert.equal(releases[0].kind,'New');
  assert.equal(manifest.entries.filter(e=>e.date==='2026-11-06').length,6);
});
test('public transcript exposes no internal identifiers or unrelated metadata', () => {
  const raw=fs.readFileSync(path.join(__dirname,'transcript.json'),'utf8');
  assert.doesNotMatch(raw,/Sentinel_|CalpicoFile_|libfile_|author_id|request_id|room_id|message_metadata|library_attachments/);
  assert.deepEqual(Object.keys(data),['schema','title','conversation_date','publication_date','turns']);
});
