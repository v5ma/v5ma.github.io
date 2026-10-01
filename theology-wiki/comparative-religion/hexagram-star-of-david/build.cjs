'use strict';
// Canonical input: READING.md. No dependencies or runtime network requests.
const fs = require('node:fs');
const path = require('node:path');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(markdown) {
  const blocks = markdown.trim().split(/\n\s*\n/);
  const notes = new Map();
  for (const block of blocks) {
    const match = block.match(/^\[\^([a-z0-9-]+)\]: ([\s\S]+)$/);
    if (match) {
      if (notes.has(match[1])) throw Error('Duplicate source: ' + match[1]);
      notes.set(match[1], {number: notes.size + 1, text: match[2], count: 0});
    }
  }
  function inline(text, allowNotes = true) {
    const pattern = /\[\^([a-z0-9-]+)\]|\[([^\]\n]+)\]\(([^\s)]+)\)/g;
    let out = '', end = 0;
    for (const match of text.matchAll(pattern)) {
      out += esc(text.slice(end, match.index));
      if (match[1]) {
        if (!allowNotes || !notes.has(match[1])) throw Error('Unknown or nested source: ' + match[1]);
        const note = notes.get(match[1]); note.count++;
        out += '<sup><a id="cite-' + match[1] + '-' + note.count + '" href="#source-' + match[1] + '" aria-label="Source ' + note.number + '">[' + note.number + ']</a></sup>';
      } else {
        const url = new URL(match[3]);
        if (url.protocol !== 'https:') throw Error('Only HTTPS source links are permitted');
        out += '<a href="' + esc(url.href) + '">' + esc(match[2]) + '</a>';
      }
      end = match.index + match[0].length;
    }
    return out + esc(text.slice(end));
  }
  let title = '', body = '', headingCount = 0;
  const headings = [];
  for (const block of blocks) {
    if (/^\[\^/.test(block)) continue;
    if (block.startsWith('# ')) {
      if (title) throw Error('Exactly one article title is required');
      title = block.slice(2).trim();
    } else if (block.startsWith('## ')) {
      const heading = block.slice(3).trim();
      if (heading === 'Sources and reading scope') continue;
      const id = 'section-' + (++headingCount);
      headings.push({id, title: heading});
      body += '<h2 id="' + id + '">' + esc(heading) + '</h2>\n';
    } else {
      body += '<p' + (block.startsWith('Research edition') ? ' class="meta"' : '') + '>' + inline(block) + '</p>\n';
    }
  }
  if (!title) throw Error('Missing title');
  const sources = [...notes].map(([id, note]) => {
    if (!note.count) throw Error('Unused source: ' + id);
    const back = Array.from({length: note.count}, (_, i) => '<a href="#cite-' + id + '-' + (i + 1) + '" aria-label="Back to citation ' + note.number + ', occurrence ' + (i + 1) + '">↩' + (i + 1) + '</a>').join(' ');
    return '<li id="source-' + id + '"><p>' + inline(note.text, false) + ' <span class="backlinks">' + back + '</span></p></li>';
  }).join('\n');
  const toc = headings.map(h => '<li><a href="#' + h.id + '">' + esc(h.title) + '</a></li>').join('');
  return '<!doctype html>\n<!-- Generated from READING.md by build.cjs. -->\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="A source-linked history of the hexagram in Armenian, Hindu, Buddhist, Jewish and Islamic contexts, distinguishing ancient occurrences from later communal and national meanings."><title>' + esc(title) + ' | Theology Wiki</title><style>\n'
    + ':root{color-scheme:light}*{box-sizing:border-box}html{scroll-padding-top:1rem}body{margin:0;background:#f7f5ef;color:#18282e;font:18px/1.72 Georgia,serif}header,main,footer{max-width:820px;margin:auto;padding:2rem 1.4rem}header{padding-top:3rem;padding-bottom:1.4rem;border-bottom:2px solid #a3b9b5}nav,.eyebrow,.meta,.toc,footer{font-family:system-ui,sans-serif}nav{display:flex;flex-wrap:wrap;gap:.6rem 1.5rem;font-size:.9rem}a{color:#18585c;text-underline-offset:.16em;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #9b582b;outline-offset:3px}.eyebrow{font-size:.78rem;letter-spacing:.14em;font-weight:700}h1{font-size:clamp(2rem,5.8vw,3.2rem);line-height:1.14;margin:.8rem 0 1.4rem}h2{font:700 1.4rem/1.35 system-ui,sans-serif;margin:2.8rem 0 1rem}p{margin:1rem 0}.meta{font-size:.85rem;color:#425b61}.toc{font-size:.92rem;background:#edf0e9;padding:1.1rem 1.4rem;margin:0 0 2rem}.toc summary{cursor:pointer;font-weight:700}.toc ol{padding-left:1.3rem}.toc li{margin:.35rem 0}sup{line-height:0;font: .7em system-ui,sans-serif}sup a{text-decoration:none;margin-left:.15em}.sources{font-size:.92rem;padding-left:1.6rem}.sources li{padding-left:.3rem;margin:1rem 0}.backlinks{white-space:normal}footer{font-size:.86rem;border-top:1px solid #a3b9b5}.skip{position:absolute;left:-10000px;top:0}.skip:focus{left:1rem;top:1rem;background:white;padding:.5rem}main>p:first-of-type{margin-top:0}@media(max-width:480px){body{font-size:17px}header,main,footer{padding-left:1rem;padding-right:1rem}}@media print{body{background:white;color:black;font-size:11pt}header,main,footer{max-width:none;padding:.3in}nav,.toc,.skip,.backlinks{display:none}h2{break-after:avoid}a{color:inherit}li{break-inside:avoid}}\n'
    + '</style></head><body><a class="skip" href="#main">Skip to article</a><header><p class="eyebrow">THEOLOGY WIKI / COMPARATIVE RELIGION</p><h1>' + esc(title) + '</h1><nav aria-label="Article navigation"><a href="../index.html">Comparative studies</a><a href="../../san-reader.html">Theology Wiki reader</a><a href="READING.md">Markdown text</a><a href="#sources">Sources and access limits</a></nav></header><main id="main"><details class="toc"><summary>On this page</summary><ol>' + toc + '<li><a href="#sources">Sources and reading scope</a></li></ol></details>' + body + '<section aria-labelledby="sources"><h2 id="sources">Sources and reading scope</h2><ol class="sources">' + sources + '</ol></section></main><footer><p>Review candidate dated 1 October 2026. Prepared with AI assistance; source scopes and unresolved questions remain explicit. This article does not assert exclusive cultural ownership of a geometric form.</p></footer></body></html>\n';
}
if (require.main === module) {
  const md = fs.readFileSync(path.join(__dirname, 'READING.md'), 'utf8');
  const html = render(md);
  const output = path.join(__dirname, 'index.html');
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(output, 'utf8') !== html) throw Error('Stale generated index.html');
    console.log('Generated HTML matches canonical Markdown.');
  } else {
    fs.writeFileSync(output, html);
    console.log('Built index.html from READING.md.');
  }
}
module.exports = {render};
