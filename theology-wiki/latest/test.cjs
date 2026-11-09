'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {validate,render} = require('./build.cjs');
const {stripIntegration} = require('../purpose/build.cjs');
const {stripIntegration: stripInheritances} = require('../alternative-inheritances-20261109/build.cjs');
const {tag: cloudsTag} = require('../clouds-and-millennium-20261109/build.cjs');
const {tag: rppaTag} = require('../rppa-power-20261109/build.cjs');
const manifest = require('./manifest.json');
const clone = () => JSON.parse(JSON.stringify(manifest));
test('manifest is valid and generated HTML is deterministic and current', () => {
  validate(manifest);
  assert.equal(render(manifest),render(clone()));
  assert.equal(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),render(manifest));
});
test('invalid dates, order, duplicates, unsafe links, and unknown labels fail', () => {
  for (const edit of [m=>m.entries[0].date='2026-02-30', m=>m.entries[0].date='2026-1-2', m=>m.entries.reverse(), m=>m.entries.splice(1,0,m.entries[0]), m=>m.entries[0].href='https://example.com/', m=>m.entries[0].href='../../index.html', m=>m.entries[0].href='../%2e%2e/index.html', m=>m.entries[0].kind='Old']) {
    const m=clone(); edit(m); assert.throws(()=>validate(m));
  }
});
test('six required additions have first publication date and correct status', () => {
  const required = ['would-jesus-oppose-the-resurrection-gospel','early-resurrection-accounts-and-source-criticism','christianity-after-bodily-resurrection','prophecy-recurring-patterns-and-corrective-word','prophecy-partial-success-and-causal-feedback','pattern-validation-protocol'];
  const additions=manifest.entries.filter(e=>e.date==='2026-11-06');
  assert.equal(additions.length,6);
  for (const slug of required) assert.ok(additions.some(e=>e.href.endsWith('/'+slug+'.html') && e.kind==='New'));
  assert.match(additions.find(e=>e.href.includes('pattern-validation-protocol')).summary,/synthetic, not empirical validation/);
  assert.equal(manifest.entries.find(e=>e.href.includes('exodus-to-temple')).kind,'Updated');
});
test('all locally available direct chapter links resolve', () => {
  for (const e of manifest.entries.filter(e=>e.date==='2026-11-06')) assert.ok(fs.existsSync(path.resolve(__dirname,e.href)),e.href);
});
test('entry point additions are exact and original bytes including source prose are preserved', () => {
  const hashes=require('./nav-preservation.json');
  for (const [name,hash] of Object.entries(hashes)) {
    const original=fs.readFileSync(path.join(__dirname,'..',name),'utf8');
    const pattern=/^ +<a class="wiki-family-link" href="\.\/latest\/index\.html">Latest<\/a>\r?\n/gm;
    assert.equal([...original.matchAll(pattern)].length,1);
    assert.equal(crypto.createHash('sha256').update(stripIntegration(stripInheritances(original.replace(cloudsTag,'').replace(rppaTag,''))).replace('<!-- evidence-review-assets --><script src="./evidence-review-20261109/reader-guide.js?v=20261109-1"></script>','').replace(pattern,'').replace(/&amp;release=20261106/g,'').replace(/research-tools\.js\?v=[a-f0-9]+/g,'research-tools.js?v=0bb91b3092c1cf07')).digest('hex'),hash);
  }
});
test('static accessible navigation and selected-release notice are present without JavaScript', () => {
  const html=render(manifest);
  assert.match(html,/<html lang="en">/); assert.match(html,/name="viewport"/);
  assert.match(html,/class="skip" href="#main"/); assert.match(html,/id="main"/);
  assert.match(html,/aria-current="page">Latest/); assert.match(html,/selected release log, not an exhaustive commit history/);
  assert.ok(!html.includes('<script'));
  for(const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes('id="'+match[1]+'"'));
});

test('runtime navigation includes Latest and both supplements after reader enhancement', () => {
  const script=fs.readFileSync(path.join(__dirname,'../assets/js/depth-tools.js'),'utf8');
  assert.match(script,/strip.innerHTML=.*latest\/index\.html/);
  for(const section of ['jesus-ethics-20261105','prophecy-patterns-20261105']) assert.ok(script.includes('./'+section+'/index.html'));
});

