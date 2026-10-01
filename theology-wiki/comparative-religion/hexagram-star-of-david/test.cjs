'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {render} = require('./build.cjs');
const md = fs.readFileSync(path.join(__dirname,'READING.md'),'utf8');
const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
test('checked-in HTML deterministically renders canonical Markdown', () => {
  assert.equal(html,render(md));
  assert.equal(render(md),render(md));
});
test('all 18 source definitions are used and local fragments resolve uniquely', () => {
  assert.equal((md.match(/^\[\^[a-z0-9-]+\]:/gm)||[]).length,18);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for (const [,target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target),target);
});
test('article evidence and access scopes survive rendering without remote dependencies', () => {
  for (const text of ['1610–1550 BCE','1600–1400 BCE','Shatkona','Seal of Solomon','Ardath','28 October 1948','full article returned 403','Author review pending']) assert.ok(html.includes(text),text);
  assert.doesNotMatch(html,/<script\b|<iframe\b|<img\b|<link\b/i);
  assert.equal((html.match(/<h1>/g)||[]).length,1);
});
test('renderer rejects missing, duplicate, nested and unused references', () => {
  assert.throws(()=>render('# Title\n\nText.[^missing]'));
  assert.throws(()=>render('# Title\n\n[^one]: A\n\n[^one]: B'));
  assert.throws(()=>render('# Title\n\nText.[^one]\n\n[^one]: Nested.[^one]'));
  assert.throws(()=>render('# Title\n\n[^unused]: Unused.'));
});
test('renderer escapes raw HTML, requires one title and rejects unsafe links', () => {
  assert.ok(render('# Title\n\n<script>alert(1)</script>').includes('&lt;script&gt;'));
  assert.throws(()=>render('# Title\n\n[bad](javascript:alert)'));
  assert.throws(()=>render('No title'));
  assert.throws(()=>render('# One\n\n# Two'));
});
