'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(manifest) {
  assert.equal(manifest.schema, 1);
  assert.ok(Array.isArray(manifest.entries) && manifest.entries.length);
  const seen = new Set(); let previous = '9999-12-31';
  for (const e of manifest.entries) {
    for (const key of ['date','kind','title','href','summary','category']) assert.ok(typeof e[key] === 'string' && e[key].trim(), key);
    assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/);
    const date = new Date(e.date+'T00:00:00Z');
    assert.ok(Number.isFinite(+date) && date.toISOString().slice(0,10) === e.date, 'Invalid calendar date');
    assert.ok(e.date <= previous, 'Entries must be newest first'); previous = e.date;
    assert.ok(['New','Updated'].includes(e.kind));
    assert.match(e.href, /^\.\.\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.html(?:\?page=[a-z0-9-]+)?$/);
    const url = new URL(e.href, 'https://wiki.example/theology-wiki/latest/');
    assert.equal(url.origin, 'https://wiki.example');
    assert.ok(url.pathname.startsWith('/theology-wiki/'));
    assert.ok(!seen.has(e.href), 'Duplicate entry'); seen.add(e.href);
  }
  return manifest;
}
function render(manifest) {
  validate(manifest);
  const dates = [...new Set(manifest.entries.map(e => e.date))];
  const dateLabel = d => new Intl.DateTimeFormat('en-US', {year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'));
  const groups = dates.map(d => `<section class="release" aria-labelledby="release-${d}">\n<h2 id="release-${d}"><time datetime="${d}">${dateLabel(d)}</time></h2>\n<ul class="entries">\n${manifest.entries.filter(e => e.date === d).map(e => `<li class="entry"><div class="meta"><span class="badge ${e.kind.toLowerCase()}">${e.kind}</span><span>${escape(e.category)}</span></div><h3><a href="${escape(e.href)}">${escape(e.title)}</a></h3><p>${escape(e.summary)}</p></li>`).join('\n')}\n</ul>\n</section>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Latest additions | Theology Wiki</title>
<meta name="description" content="New chapters and substantive updates to the Theology Wiki, organized by wiki release date.">
<link rel="stylesheet" href="latest.css">
</head>
<body>
<a class="skip" href="#main">Skip to latest additions</a>
<header>
<p class="eyebrow">Theology Wiki · Release log</p>
<h1>Latest additions</h1>
<p class="lede">New chapters, fresh questions, and substantive updates to the inquiry.</p>
<nav aria-label="Wiki navigation"><a href="../san-reader.html?page=home">Theology Wiki</a><a href="./index.html" aria-current="page">Latest</a><a href="../index.html">Original reader</a><a href="../jesus-ethics-20261105/index.html">Jesus, Easter and ethics</a><a href="../prophecy-patterns-20261105/index.html">Prophecy and patterns</a></nav>
</header>
<main id="main">
<div class="note"><p>This is a selected release log, not an exhaustive commit history. Dates mark publication or substantive updates on this wiki, not the dates of source conversations or original composition.</p><p>The November 6 release introduces five chapters and one proposed research protocol. They were prepared earlier and are first published here in this release.</p></div>
<nav class="dates" aria-label="Jump to release">${dates.map(d => `<a href="#release-${d}">${dateLabel(d)}</a>`).join('')}</nav>
${groups}
</main>
<footer><p>Explore the <a href="../san-reader.html?page=home">full Theology Wiki</a> for related arguments, sources and reading paths.</p></footer>
</body>
</html>
`;
}
if (require.main === module) {
  const html = render(JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8')));
  const output = path.join(__dirname,'index.html');
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(output,'utf8'), html, 'Run node latest/build.cjs');
  else fs.writeFileSync(output, html);
}
module.exports = {validate,render};
