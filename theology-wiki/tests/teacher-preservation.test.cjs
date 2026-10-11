'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const R = require('../research-expansion-20260918/teacher-revision.cjs');
const prior = require('../research-expansion-20260918/revision-receipt.json');
const expected = Object.fromEntries(Object.entries(prior.files).map(([p, v]) => [p, v.after]));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const essential = [R.revision.canonical.path, R.revision.historical_canonical.path,
  R.repair.historical_canonical.path, R.repair.prior_revision_receipt.path,
  'teacher-repair-20261011/revision.cjs', 'teacher-repair-20261011/revision.json',
  R.revision.prior_revision_receipt.path, 'research-expansion-20260918/integration-receipt.json',
  'research-expansion-20260918/teacher-identity.md', 'editorial/authorial.json', ...Object.keys(R.revision.files)];

function fixture(t, files = essential) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-preservation-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  for (const p of new Set(files)) {
    fs.mkdirSync(path.dirname(path.join(base, p)), { recursive: true });
    fs.copyFileSync(path.join(root, p), path.join(base, p));
  }
  return base;
}

test('Teacher revisions preserve the original body, September 18 edition and PR 230 source', () => {
  assert.equal(R.verifyCanonical().length, 19969);
  const actual = R.applyDerivativeRevision(expected);
  for (const p of Object.keys(expected)) assert.equal(actual[p], R.repair.files[p]?.after || expected[p]);
  assert.deepEqual(Object.keys(actual), Object.keys(expected));
  assert.equal(R.applyDerivativeRevision({ ...expected, 'unrelated-original.md': 'untouched' })['unrelated-original.md'], 'untouched');
});

test('the Teacher revision rejects an unexpected predecessor rather than silently replacing it', () => {
  const p = Object.keys(R.revision.files)[0];
  assert.throws(() => R.applyDerivativeRevision({ ...expected, [p]: 'unreviewed-version' }), /Unexpected prior derivative version/);
  const missing = { ...expected }; delete missing[p];
  assert.throws(() => R.applyDerivativeRevision(missing), /Unexpected prior derivative version/);
});

for (const p of essential.filter(p => !['editorial/authorial.json', 'teacher-repair-20261011/revision.cjs'].includes(p))) {
  test('Teacher preservation rejects modified bytes: ' + p, t => {
    const base = fixture(t);
    fs.appendFileSync(path.join(base, p), '\nUnexpected change\n');
    assert.throws(() => R.applyDerivativeRevision(expected, base));
  });
}

test('Teacher preservation rejects a downgraded article date', t => {
  const base = fixture(t), p = path.join(base, 'editorial/authorial.json');
  const metadata = JSON.parse(fs.readFileSync(p));
  metadata.articles.find(a => a.slug === R.slug).updated = '2026-09-18';
  fs.writeFileSync(p, JSON.stringify(metadata));
  assert.throws(() => R.verifyCanonical(base), /Approved Teacher date changed/);
});

test('historical integration is byte-idempotent and cannot restore the obsolete Teacher article', t => {
  const manifest = require('../research-expansion-20260918/manifest.json');
  const files = [...essential, 'README.md', 'editorial/products.json', 'tests/restoration.test.cjs',
    'comparative-religion/manifest.json', 'research-expansion-20260918/integrate.cjs',
    'research-expansion-20260918/manifest.json', 'research-expansion-20260918/teacher-revision.cjs',
    'research-expansion-20260918/teacher-revision-20261011.json',
    'scripture-concordance/integrate.cjs', 'scripture-concordance/reconcile.cjs',
    'scripture-concordance/integration-receipt.json',
    'scripture-concordance/first-beast-supplement.md', 'scripture-concordance/conduct-supplement.md',
    'editorial/authorial-articles/trump-first-beast-of-revelation.md',
    'editorial/authorial-articles/antichrist-as-a-pattern-of-conduct.md',
    ...manifest.articles.flatMap(a => ['editorial/authorial-articles/' + a.slug + '.md', 'research-expansion-20260918/' + a.supplement])];
  const base = fixture(t, files);
  const snapshot = () => [...new Set(files)].map(p => [p, hash(fs.readFileSync(path.join(base, p)))]);
  const before = snapshot();
  for (let n = 0; n < 2; n++) {
    cp.execFileSync(process.execPath, [path.join(base, 'research-expansion-20260918/integrate.cjs')]);
    cp.execFileSync(process.execPath, [path.join(base, 'scripture-concordance/integrate.cjs')]);
    assert.deepEqual(snapshot(), before);
  }
});
