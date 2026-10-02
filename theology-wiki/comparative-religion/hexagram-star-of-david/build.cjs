'use strict';
// Canonical input: READING.md. Dependency-free, static and offline-readable output.
const fs = require('node:fs');
const path = require('node:path');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(markdown) {
  const blocks = markdown.trim().split(/\n\s*\n/), notes = new Map();
  for (const block of blocks) {
    const m = block.match(/^\[\^([a-z0-9-]+)\]: ([\s\S]+)$/);
    if (m) {
      if (notes.has(m[1])) throw Error('Duplicate source: ' + m[1]);
      notes.set(m[1], {number: notes.size + 1, text: m[2], count: 0});
    }
  }
  function inline(text, allowNotes = true) {
    const pattern = /\[\^([a-z0-9-]+)\]|\[([^\]\n]+)\]\(([^\s)]+)\)/g;
    let out = '', end = 0;
    for (const m of text.matchAll(pattern)) {
      out += esc(text.slice(end, m.index));
      if (m[1]) {
        if (!allowNotes || !notes.has(m[1])) throw Error('Unknown or nested source: ' + m[1]);
        const n = notes.get(m[1]); n.count++;
        out += `<sup><a id="cite-${m[1]}-${n.count}" href="#source-${m[1]}" aria-label="Source ${n.number}">[${n.number}]</a></sup>`;
      } else {
        const url = new URL(m[3]);
        if (url.protocol !== 'https:') throw Error('Only HTTPS source links are permitted');
        out += `<a href="${esc(url.href)}">${esc(m[2])}</a>`;
      }
      end = m.index + m[0].length;
    }
    return out + esc(text.slice(end));
  }
  let title = '', body = ''; const headings = [];
  for (const b of blocks) {
    if (/^\[\^/.test(b)) continue;
    if (b.startsWith('# ')) {
      if (title) throw Error('Exactly one title is required');
      title = b.slice(2).trim();
    } else if (b.startsWith('## ')) {
      const text = b.slice(3).trim();
      if (text === 'Sources and reading scope') continue;
      const id = 'section-' + (headings.length + 1); headings.push({id, text});
      body += `<h2 id="${id}">${esc(text)}</h2>\n`;
    } else body += `<p${b.startsWith('Research edition') ? ' class="meta"' : ''}>${inline(b)}</p>\n`;
  }
  if (!title) throw Error('Missing title');
  const sources = [...notes].map(([id,n]) => {
    if (!n.count) throw Error('Unused source: ' + id);
    const back = Array.from({length:n.count},(_,i) => `<a href="#cite-${id}-${i+1}" aria-label="Back to citation ${n.number}, occurrence ${i+1}">↩${i+1}</a>`).join(' ');
    return `<li id="source-${id}"><p>${inline(n.text,false)} <span class="backlinks">${back}</span></p></li>`;
  }).join('\n');
  const toc = headings.map(h => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('');
  return `<!doctype html>
<!-- Generated from READING.md by build.cjs. -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="The hexagram before and beyond its modern national role: Armenian archaeology, Hindu and Buddhist symbolism, the Islamic Seal of Solomon, and the later Star of David."><title>${esc(title)} | Theology Wiki</title><style>
:root{color-scheme:light}*{box-sizing:border-box}html{scroll-padding-top:1rem}body{margin:0;background:#f7f5ef;color:#18282e;font:18px/1.72 Georgia,serif}header,main,footer{max-width:820px;margin:auto;padding:2rem 1.4rem}header{padding-top:3rem;padding-bottom:1.4rem;border-bottom:2px solid #a3b9b5}nav,.eyebrow,.meta,.toc,footer{font-family:system-ui,sans-serif}nav{display:flex;flex-wrap:wrap;gap:.6rem 1.5rem;font-size:.9rem}a{color:#18585c;text-underline-offset:.16em;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #9b582b;outline-offset:3px}.eyebrow{font-size:.78rem;letter-spacing:.14em;font-weight:700}h1{font-size:clamp(2rem,5.8vw,3.2rem);line-height:1.14;margin:.8rem 0 1.4rem}h2{font:700 1.4rem/1.35 system-ui,sans-serif;margin:2.8rem 0 1rem}p{margin:1rem 0}.meta{font-size:.85rem;color:#425b61}.toc{font-size:.92rem;background:#edf0e9;padding:1.1rem 1.4rem;margin:0 0 2rem}.toc summary{cursor:pointer;font-weight:700}.toc ol{padding-left:1.3rem}.toc li{margin:.35rem 0}sup{line-height:0;font:.7em system-ui,sans-serif}sup a{text-decoration:none;margin-left:.15em}.sources{font-size:.92rem;padding-left:1.6rem}.sources li{padding-left:.3rem;margin:1rem 0}footer{font-size:.86rem;border-top:1px solid #a3b9b5}.skip{position:absolute;left:-10000px;top:0}.skip:focus{left:1rem;top:1rem;background:white;padding:.5rem}main>p:first-of-type{margin-top:0}@media(max-width:480px){body{font-size:17px}header,main,footer{padding-left:1rem;padding-right:1rem}}@media print{body{background:white;color:black;font-size:11pt}header,main,footer{max-width:none;padding:.3in}nav,.toc,.skip,.backlinks{display:none}h2{break-after:avoid}a{color:inherit}li{break-inside:avoid}}
</style></head><body><a class="skip" href="#main">Skip to article</a><header><p class="eyebrow">THEOLOGY WIKI / COMPARATIVE RELIGION</p><h1>${esc(title)}</h1><nav aria-label="Article navigation"><a href="../index.html">Comparative studies</a><a href="../../san-reader.html">Theology Wiki reader</a><a href="READING.md">Markdown text</a><a href="#sources">Sources and further reading</a></nav></header><main id="main"><details class="toc"><summary>On this page</summary><ol>${toc}<li><a href="#sources">Sources and reading scope</a></li></ol></details>${body}<section aria-labelledby="sources"><h2 id="sources">Sources and reading scope</h2><ol class="sources">${sources}</ol></section></main><footer><p>Research draft • 1 October 2026 • Prepared with AI assistance for the Theology Wiki. Author review pending.</p></footer></body></html>
`;
}
if (require.main === module) {
  const html = render(fs.readFileSync(path.join(__dirname,'READING.md'),'utf8'));
  const output = path.join(__dirname,'index.html');
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(output,'utf8') !== html) throw Error('Stale generated index.html');
    console.log('Generated HTML matches canonical Markdown.');
  } else {fs.writeFileSync(output,html);console.log('Built index.html from READING.md.');}
}
module.exports = {render};
