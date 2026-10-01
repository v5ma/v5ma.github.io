'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {render} = require('./build.cjs');
const md = fs.readFileSync(path.join(__dirname, 'READING.md'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
test('checked-in HTML is a deterministic rendering of canonical Markdown', () => {
  assert.equal(html, render(md));
  assert.equal(render(md), render(md));
});
test('all 15 source definitions are used and every local fragment resolves uniquely', () => {
  assert.equal((md.match(/^\[\^[a-z0-9-]+\]:/gm) || []).length, 15);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), target);
});
test('all substantive text is present without runtime scripts or remote dependencies', () => {
  assert.ok(html.includes('1600–1400 BCE'));
  assert.ok(html.includes('Verin Naver and Nerkin Naver must not be silently substituted'));
  assert.ok(html.includes('1000 BCE is an anachronistic starting date'));
  assert.ok(html.includes('search-indexed excerpt'));
  assert.ok(html.includes('This is a source-linked review candidate'));
  assert.doesNotMatch(html, /<script\b|<iframe\b|<img\b|<link\b/i);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
});
test('renderer rejects missing, duplicate, nested and unused source references', () => {
  assert.throws(() => render('# Title\n\nText.[^missing]'));
  assert.throws(() => render('# Title\n\n[^one]: A\n\n[^one]: B'));
  assert.throws(() => render('# Title\n\nText.[^one]\n\n[^one]: Nested.[^one]'));
  assert.throws(() => render('# Title\n\n[^unused]: Unused.'));
});
test('renderer escapes raw HTML and rejects unsafe links', () => {
  assert.ok(render('# Title\n\n<script>alert(1)</script>').includes('&lt;script&gt;'));
  assert.throws(() => render('# Title\n\n[bad](javascript:alert)'));
});
