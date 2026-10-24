'use strict';
// Focused source/reader gates. Historical publication guards live in their original suites.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const slug = 'gnostic-canonical-gospels-telling-the-truth';
const comparison = 'living-jesus-thomas-john-and-synoptics';
const canonical = read('editorial/authorial-articles/' + slug + '.md');
const originalSha256 = '2bbf0a7cf19fde46426911fbaeaf64f1bf0e818300c3afa474441c3480be466f';
const comparisonLabel = 'The Living Jesus in Thomas, John, and the Synoptics';
const originalLink = '[' + comparisonLabel + '](san-reader.html?page=' + comparison + ')';
const wikiLink = '[[' + comparison + '|' + comparisonLabel + ']]';
const pages = () => json('data/page-index.json');
const article = () => {
  const value = pages().find(p => p.slug === slug);
  assert(value, 'The synthesis must be present in the built reader index');
  return value;
};
const cases = [
  {
    title: '1. Faith and knowledge can belong to one relationship',
    claims: ['Gospel of Truth', 'John 17:3', 'Trust can open a relationship', 'feed hungry people', 'Matthew 25:31–46', 'This does not establish that every text means the same thing by knowledge'],
  },
  {
    title: '2. The cross can save and reveal at the same time',
    claims: ['presents his death as life-giving', 'John 12:23–33', 'Mark 8:31–35', 'costly discipleship', 'do not provide one identical explanation', 'saving knowledge makes the cross irrelevant'],
  },
  {
    title: '3. Outward signs can communicate inward life',
    claims: ['baptism, anointing, eucharist, redemption, and bridal chamber', 'John 3:5', 'Calling a rite symbolic need not make it empty', 'does not prove identical rituals or theology', 'exact ritual form should not be supplied from imagination', '67–68'],
  },
  {
    title: '4. Resurrection can have a present dimension without exhausting its meaning',
    claims: ['resurrection must be received during life', 'John 5:24–29', 'future resurrection from the graves', 'reverses the expected sequence', 'Luke 24:36–43', 'embodied presence through touch and eating', "would fail to preserve Luke's narrative claim", 'does not demonstrate complete agreement'],
  },
  {
    title: '5. Personal revelation can lead back into shared witness',
    claims: ['Andrew and Peter challenge her account', 'Levi defends her', 'John 20:17–18', "a woman's encounter consequential", 'cannot verify', 'establish its authorship', 'make its missing pages recoverable', 'every private revelation reliable'],
  },
  {
    title: '6. Alienation from the world is a useful bridge with a real boundary',
    claims: ['John 1:1–14', "Philip describes the world's origin as a mistake", 'Judas distinguishes the God served by the disciples', 'cosmology of lower rulers', 'stronger claims than a critique of corrupt human society', 'further theological move', 'does not by itself reconcile their descriptions of the creator', 'contested and often condemnatory'],
  },
];
function section(title) {
  const start = canonical.indexOf('## ' + title + '\n');
  assert(start >= 0, title);
  const end = canonical.indexOf('\n## ', start + 3);
  return canonical.slice(start, end < 0 ? undefined : end);
}
function targets(text) {
  return [...new Set([
    ...[...text.matchAll(/\[\[([^\]|#]+)/g)].map(m => m[1]),
    ...[...text.matchAll(/\[[^\]]+\]\((?:\.\/)?san-reader\.html\?page=([a-z0-9-]+)\)/g)].map(m => m[1]),
  ])];
}

test('Canonical synthesis preserves every agreed source byte except the exact internal-link syntax conversion', () => {
  // The hash is the complete original article, not a summary or selected quotations.
  // Only this one explicitly identified link can change representation; its label cannot change.
  assert.equal(hash(canonical.split(wikiLink).join(originalLink)), originalSha256);
  assert.equal(canonical.split(originalLink).length + canonical.split(wikiLink).length - 2, 1);
  assert(canonical.trim().split(/\s+/).length > 1800);
});

test('Canonical synthesis remains a constructive proposal and distinguishes the noncanonical writings', () => {
  for (const phrase of [
    'This is a constructive theological proposal to test against the texts.',
    'genuine agreements and for differences that remain',
    "classification and relationship to the canonical traditions remain disputed",
    'Philip is usually associated with Valentinian Christianity',
    'Mary preserves a dialogue and a disputed revelation, with substantial portions missing',
    'Judas presents a sharply polemical account with a distinctive cosmology',
  ]) assert(canonical.includes(phrase), phrase);
  assert.doesNotMatch(canonical, /\b(?:I|we) (?:personally )?(?:believe|profess|confess)|\bMicah(?: Blumberg)?(?:'s|’s)? (?:faith|religion|beliefs|believes|professes|confesses)\b/i);
  assert.equal([...canonical.matchAll(/^## [1-6]\. /gm)].length, 6);
});

for (const item of cases) {
  test('Canonical detailed case retains evidence and limits: ' + item.title, () => {
    const text = section(item.title);
    assert(text.trim().split(/\s+/).length >= 130, 'Keep the full comparison, not a short replacement');
    assert(text.includes('**The apparent conflict:**'));
    assert(text.includes('**The shared reading:**'));
    assert.match(text, /\*\*(?:What remains open|The important limit|Where that reading reaches its limit):\*\*/);
    for (const phrase of item.claims) assert(text.includes(phrase), phrase);
    assert([...text.matchAll(/\]\(https:\/\//g)].length >= 2, 'Both textual sides retain inspectable citations');
  });
}

test('Canonical conclusion preserves interpretive discipline instead of asserting complete reconciliation', () => {
  const text = section('What “both true” can responsibly mean');
  assert(text.includes('the story calls for participation, and participation remains answerable to the story'));
  assert.deepEqual([...text.matchAll(/^(\d)\. /gm)].map(m => m[1]), ['1', '2', '3', '4']);
  for (const phrase of [
    'Compatibility, historical reliability, and scriptural authority remain separate judgments',
    'without proving that their authors meant the same thing',
    'without assigning it canonical authority',
    'Where the texts resist that synthesis, allowing them to resist makes the inquiry more trustworthy',
  ]) assert(text.includes(phrase), phrase);
});

test('Synthesis is the 31st canonical authorial study and 440th reader page without an invented source conversation', () => {
  const registry = json('editorial/authorial.json');
  assert.equal(registry.articles.length, 31);
  assert.equal(new Set(registry.articles.map(p => p.slug)).size, 31);
  const source = registry.articles.find(p => p.slug === slug);
  assert(source);
  assert.deepEqual(source.sourceIds, []);
  assert.match(source.attribution, /Authorial working edition/);
  assert.match(source.attribution, /constructive|interpretive synthesis/i);
  assert.doesNotMatch(source.attribution, /\b(?:Micah(?: Blumberg)?|the author) (?:personally )?(?:believes|professes|confesses|holds as a personal belief)\b/i);
  const index = pages(), built = article();
  assert.equal(index.length, 443);
  assert.equal(new Set(index.map(p => p.slug)).size, 443);
  assert.equal(built.kind, 'Developed article');
  assert.equal(built.category, 'jesus');
  assert.equal(built.title, canonical.match(/^# (.+)$/m)[1]);
  assert.equal(built.updated, source.updated);
  assert.equal(built.attribution, source.attribution);
  assert.deepEqual(built.references, []);
  assert(!built.sourceFile, 'Current constructive writing is not a recovered conversation');
  const body = read('content/' + built.path);
  assert.equal(body.split(canonical.trim()).length - 1, 1, 'The complete canonical text appears once');
  assert(body.includes(built.attribution));
});

test('Synthesis links and its full argument are discoverable in real graph, search and reader data', () => {
  const index = pages(), built = article(), graph = json('data/graph.json').related;
  const links = targets(canonical);
  assert(links.includes(comparison));
  for (const target of links) {
    assert(index.some(p => p.slug === target), target);
    assert(built.related.includes(target), target);
    assert(graph[slug].includes(target), target);
  }
  for (const from of ['home', 'topic-jesus']) {
    assert(graph[from].includes(slug), from);
    assert(built.backlinks.includes(from), from);
    assert(targets(read('content/' + index.find(p => p.slug === from).path)).includes(slug), from);
  }
  const C = require('../assets/js/research-core.js'), search = json('data/search.json');
  // These are in the detailed body, not merely the title.
  for (const query of ['bridal chamber', 'embodied presence', 'lower rulers', 'historical reliability']) {
    assert(C.select(index, query, {kind: 'article'}, search).some(p => p.slug === slug), query);
  }
  const linksToSources = [...canonical.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(m => m[1]);
  assert(new Set(linksToSources).size >= 15);
  for (const value of linksToSources) {
    const url = new URL(value);
    assert.equal(url.protocol, 'https:');
    assert(!url.username && !url.password);
  }
});

test('Synthesis narration and transcript retain the whole canonical argument and source notes with verified hashes', () => {
  const L = require('../assets/js/listening-core.js');
  const built = article();
  const rows = json('data/listening-library.json').articles.filter(a => a.slug === slug);
  assert.equal(rows.length, 1);
  const lib = rows[0], bytes = read(lib.source), narrationBytes = read(lib.narration), narration = JSON.parse(narrationBytes);
  assert.equal(lib.source, 'content/' + built.path);
  assert.equal(narration.slug, slug);
  assert.equal(narration.title, built.title);
  assert.equal(narration.source, lib.source);
  assert.equal(lib.sourceSha256, hash(bytes));
  assert.equal(narration.sourceSha256, hash(bytes));
  assert.equal(lib.narrationSha256, hash(narrationBytes));
  assert.deepEqual(narration.segments, L.segment(bytes));
  assert.equal(lib.segments, narration.segments.length);
  assert.equal(read(lib.transcript), narration.segments.map(s => s.text).join('\n\n') + '\n');
  assert(narration.segments.map(s => s.text).join(' ').includes(L.plain(canonical)), 'Narration cannot silently abridge the full argument');
  for (const item of cases) assert(narration.segments.some(s => s.section === item.title && !s.notes), item.title);
  assert(narration.segments.some(s => s.section === 'External sources and access notes' && s.notes));
  assert(!json('products/media/manifest.json').assets.some(a => a.id === slug), 'Device read-aloud is not a new prerecorded study');
});

test('Synthesis reader source and canonical source are backed by their own exact publication records', () => {
  const built = article();
  const records = json('public-corpus/page-index.json');
  assert.equal(records.length, 443);
  const record = records.find(r => r.slug === slug);
  assert(record);
  const body = read('content/' + built.path);
  assert.equal(record.canonicalSha256, hash(canonical));
  assert.equal(record.sourceSha256, hash(body));
  assert.equal(record.archiveSha256, hash(body));
  assert.equal(read(record.archivePath), body);
  assert.equal(built.publication.sha256, record.sourceSha256);
  assert.equal(built.publication.revision, record.sourceRevision);
  assert.equal(built.publication.exactUrl, record.exactSourceUrl);
  assert(built.publication.exactUrl.includes('/blob/' + record.sourceRevision + '/'));
  assert(built.publication.canonicalSourceUrl.endsWith('/editorial/authorial-articles/' + slug + '.md'));
  assert.equal(built.publication.transcriptExactUrl, null);
});

test('Successor provenance reconstructs the exact 439-page predecessor and preserves its historical receipt', () => {
  const S = require('./publication.cjs');
  const report = S.verify(root);
  assert.equal(report.verifiedPages, 440);
  assert.equal(report.preservedExistingPageRecords, 437);
  const prior = S.restoreBaseline(root);
  assert.equal(prior.records.length, 439);
  assert.equal(prior.meta.additions.length, 1);
  assert.equal(prior.meta.additions[0].pages[0], comparison);
  assert.equal(hash(read(S.SPEC.previousReceipt.path)), S.SPEC.previousReceipt.sha256);
});

test('Generated navigation keeps the existing text and updates only the new entry plus the authorial count', () => {
  const S = require('./publication.cjs'), index = pages(), built = article();
  for (const slug of ['home', 'topic-jesus']) {
    const page = index.find(p => p.slug === slug), text = read('content/' + page.path);
    assert.equal(hash(S.restoreNavigation(text, slug, built)), S.SPEC.navigation[slug]);
    if (slug === 'home') {
      const counts = [...text.matchAll(/^(\d+) developed articles accompany the archive\./gm)];
      assert.equal(counts.length, 1);
      assert.equal(Number(counts[0][1]), json('editorial/authorial.json').articles.length);
      assert.equal(Number(counts[0][1]), 31);
    }
  }
});
