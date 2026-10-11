'use strict';
// PR #230 supersedes one canonical article; the September 18 edition stays immutable.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const slug = 'jesus-teacher-of-righteousness-hypothesis';
const revision = require('./teacher-revision-20261011.json');
const repair = require('../teacher-repair-20261011/revision.cjs');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const blob = b => crypto.createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
const read = (base, p) => fs.readFileSync(path.join(base, p));
const load = (base, p) => JSON.parse(read(base, p));

function verifyCanonical(base = root) {
  assert.equal(revision.schema_version, 1);
  assert.equal(revision.slug, slug);
  assert.equal(revision.revision_date, '2026-10-11');
  assert.equal(revision.review_base_commit, '28e24049f2310d8c0027c04a2424c9491040c330');
  assert.equal(revision.pull_request, 'https://github.com/v5ma/v5ma.github.io/pull/230');
  assert.equal(revision.canonical.path, 'editorial/authorial-articles/' + slug + '.md');
  assert.equal(revision.historical_canonical.path, 'tests/fixtures/teacher-canonical-before-20261011.md');
  assert.equal(revision.prior_revision_receipt.path, 'research-expansion-20260918/revision-receipt.json');
  assert.equal(revision.prior_revision_receipt.sha256, '7c5e77b4754aa87828395faeed4e9a1f3bd100dd2202d0b748660c079cbc5880');
  assert.equal(hash(read(base, revision.prior_revision_receipt.path)), revision.prior_revision_receipt.sha256, 'Historical derivative receipt changed');
  const receipt = load(base, 'research-expansion-20260918/integration-receipt.json');
  const row = receipt.articles.find(r => r.slug === slug);
  assert.ok(row, 'Missing historical Teacher integration receipt');
  const historical = read(base, revision.historical_canonical.path);
  const extra = read(base, 'research-expansion-20260918/teacher-identity.md');
  assert.equal(row.position, 'prepend');
  assert.equal(row.original_git_blob, 'd801512a0a4a964c6f694ff06e0259b334c85b85');
  assert.equal(row.integrated_git_blob, '8250a4017dae7fb5e79228831e7d5b73f55b347f');
  assert.equal(revision.historical_canonical.git_blob, row.integrated_git_blob);
  assert.equal(blob(historical), row.integrated_git_blob, 'Historical canonical snapshot changed');
  assert.equal(extra.length, row.supplement_bytes);
  assert.ok(historical.subarray(0, extra.length).equals(extra), 'Historical supplement changed');
  const original = historical.subarray(extra.length);
  assert.equal(original.length, row.original_bytes);
  assert.equal(blob(original), row.original_git_blob, 'Original canonical body changed');
  repair.verifyCanonical(base);
  const article = load(base, 'editorial/authorial.json').articles.find(a => a.slug === slug);
  assert.equal(article.updated, revision.revision_date, 'Approved Teacher date changed');
  return historical;
}

function applyDerivativeRevision(expected, base = root) {
  verifyCanonical(base);
  const paths = ['content/developed/' + slug + '.md', 'data/listening/' + slug + '.json', 'products/transcripts/' + slug + '.txt'].sort();
  assert.deepEqual(Object.keys(revision.files).sort(), paths, 'Only the three Teacher derivatives may supersede prior hashes');
  const prior = load(base, revision.prior_revision_receipt.path);
  const updated = { ...expected };
  for (const p of paths) {
    const row = revision.files[p];
    assert.equal(row.before, prior.files[p].after, 'Teacher revision must chain from the historical receipt: ' + p);
    assert.equal(expected[p], row.before, 'Unexpected prior derivative version: ' + p);
    updated[p] = repair.derivativeHash(p, row.after, base);
  }
  return updated;
}

module.exports = { slug, revision, repair: repair.revision, verifyCanonical, applyDerivativeRevision };
