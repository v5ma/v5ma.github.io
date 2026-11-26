'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {build} = require('./build.cjs');

const ROOT = __dirname;
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const cfg = JSON.parse(read('manifest.json'));

test('all five cluster studies and index rebuild deterministically', () => {
  assert.equal(cfg.pages.length, 5);
  const res = build(true);
  assert.equal(res.pages, 5);
  assert.ok(res.searchSections >= 20);
});

test('all internal anchors, citations, tables, and local links resolve cleanly', () => {
  for (const name of ['index', ...cfg.pages.map(p => p.slug)]) {
    const html = read(name + '.html');
    assert.doesNotMatch(html, /\[\[|\*\*/);
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, 'Duplicate id in ' + name);
    for (const m of html.matchAll(/href="([^"]+)"/g)) {
      const href = m[1].replace(/&amp;/g, '&');
      if (href.startsWith('#')) {
        assert.ok(ids.includes(href.slice(1)), name + ': missing anchor ' + href);
        continue;
      }
      const u = new URL(href, 'https://wiki.example/theology-wiki/beast-mammon-jubilee-20261125/' + name + '.html');
      if (u.origin !== 'https://wiki.example') continue;
      const target = path.join(ROOT, '..', '..', decodeURIComponent(u.pathname));
      assert.ok(fs.existsSync(target), name + ': broken local link ' + href);
    }
  }
  assert.doesNotMatch(read('search.js'), /innerHTML\s*=/);
});

test('primary-source scholarship and critical corrections remain explicit', () => {
  const sol = read('sources/solomon-666-and-the-mammon-beast-pattern.md');
  for (const phrase of ['New Testament Studies', 'Tyndale Bulletin', 'Williams', 'Oberweis', 'Beale', 'Sanhedrin', 'Gittin', 'Targum Sheni', 'Testament of Solomon', '600 + 10 + 6', 'set aside as weak', 'agorazo']) {
    assert.ok(sol.includes(phrase), 'Missing in Solomon study: ' + phrase);
  }
  assert.doesNotMatch(sol, /Journal of Theological Studies/i);

  const jub = read('sources/jubilee-release-and-the-counter-economy-of-revelation-14.md');
  for (const phrase of ['deror', 'aphesis', 'agorazo', 'constructive canonical synthesis', 'sectarian exclusion']) {
    assert.ok(jub.includes(phrase), 'Missing in Jubilee study: ' + phrase);
  }

  const qum = read('sources/king-of-the-kittim-qumran-and-anti-mammon-apocalypses.md');
  for (const phrase of ['melek ha-kittim', 'ha-kohen ha-rasha', 'hon ha-risha', 'physical and ritual purity of the military camp', 'silver and gold and precious stones', 'completely different text', 'Apocryphon of John', 'Teachings of Silvanus', 'John the Baptist']) {
    assert.ok(qum.includes(phrase), 'Missing in Qumran/Nag Hammadi study: ' + phrase);
  }

  const det = read('sources/deterrence-reciprocity-and-alliance-trust.md');
  for (const phrase of ['Article 5', 'Estonia', 'not assessed as a prophetic hit', 'Daniel 7:8', 'Revelation 16:13']) {
    assert.ok(det.includes(phrase), 'Missing in deterrence study: ' + phrase);
  }

  const glo = read('sources/primary-language-glossary.md');
  for (const phrase of ['charagma', 'mamonas', 'arithmos anthropou', 'theriou', 'agorazo', 'aphesis', 'hon ha-risha', 'melek ha-kittim']) {
    assert.ok(glo.includes(phrase), 'Missing in glossary: ' + phrase);
  }
});

test('search index covers every study and resolves to valid anchors', () => {
  const rows = JSON.parse(read('search-index.json'));
  assert.deepEqual(new Set(rows.map(r => r.kind)), new Set(cfg.pages.map(p => p.slug)));
  for (const r of rows) {
    const [file, id] = r.url.split('#');
    assert.ok(read(file).includes('id="' + id + '"'), r.url);
  }
});
