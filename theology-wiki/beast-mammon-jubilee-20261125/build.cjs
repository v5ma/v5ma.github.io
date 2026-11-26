'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const WIKI = path.dirname(ROOT);
const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const slugify = x => x.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function safeHref(href) {
  if (/^(?:https?:\/\/|#|\.\.?\/)/.test(href) || /^[a-zA-Z0-9_-]+(?:\/|\.)/.test(href)) return href;
  throw Error('Unsupported link ' + href);
}

function createRenderer(known, newPages) {
  const wikilinks = new Set();
  function inline(s, links = true) {
    const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^\s]+?)\)(?=[\s.,;:!?)]|$)|\*\*((?:(?!\*\*).)+)\*\*|\*([^*]+)\*|`([^`]+)`|\[(\d+)\]/g;
    let out = '', pos = 0, m;
    while ((m = re.exec(s))) {
      out += esc(s.slice(pos, m.index));
      pos = re.lastIndex;
      if (m[1]) {
        const [target, fragment] = m[1].split('#');
        if (!known.has(target) && !newPages.has(target)) throw Error('Unknown wikilink ' + target);
        wikilinks.add(target);
        const href = newPages.has(target)
          ? target + '.html' + (fragment ? '#' + fragment : '')
          : '../san-reader.html?page=' + encodeURIComponent(target) + (fragment ? '#' + fragment : '');
        out += '<a href="' + esc(href) + '">' + esc(m[2] || target) + '</a>';
      } else if (m[3]) {
        out += '<a href="' + esc(safeHref(m[4])) + '">' + inline(m[3], false) + '</a>';
      } else if (m[5]) {
        out += '<strong>' + inline(m[5], links) + '</strong>';
      } else if (m[6]) {
        out += '<em>' + inline(m[6], links) + '</em>';
      } else if (m[7]) {
        out += '<code>' + esc(m[7]) + '</code>';
      } else {
        out += links ? '<a class="citation" href="#ref-' + m[8] + '" aria-label="Source ' + m[8] + '">[' + m[8] + ']</a>' : '[' + m[8] + ']';
      }
    }
    return out + esc(s.slice(pos));
  }

  function parseTableRow(line) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  }

  function render(body) {
    const lines = body.replace(/^# [^\n]+\n+/, '').split(/\r?\n/);
    const html = [], sections = [], headings = [], seen = new Map();
    let paragraph = [], list = null, inSources = false;
    let current = {anchor: 'main', heading: 'Introduction', text: ''};
    sections.push(current);

    const flush = () => {
      if (paragraph.length) {
        html.push('<p>' + inline(paragraph.join(' ')) + '</p>');
        paragraph = [];
      }
    };
    const close = () => {
      if (list) {
        html.push('</' + list + '>');
        list = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const h = line.match(/^(#{2,4})\s+(.+)$/);
      if (h) {
        flush();
        close();
        const base = slugify(h[2]);
        const n = seen.get(base) || 0;
        seen.set(base, n + 1);
        const id = base + (n ? '-' + (n + 1) : '');
        html.push('<h' + h[1].length + ' id="' + id + '">' + inline(h[2]) + '</h' + h[1].length + '>');
        headings.push({id, title: h[2], level: h[1].length});
        if (h[1].length === 2) {
          inSources = /^Sources and access notes/.test(h[2]);
          current = {anchor: id, heading: h[2], text: ''};
          sections.push(current);
        } else if (current) {
          current.text += h[2] + '\n';
        }
        continue;
      }

      if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|[\s:-]+\|/.test(lines[i + 1].trim())) {
        flush();
        close();
        const headers = parseTableRow(line);
        const bodyRows = [];
        i += 2;
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          bodyRows.push(parseTableRow(lines[i]));
          i++;
        }
        i--;
        const thead = '<thead><tr>' + headers.map(c => '<th scope="col">' + inline(c) + '</th>').join('') + '</tr></thead>';
        const tbody = '<tbody>' + bodyRows.map(row => '<tr>' + row.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody>';
        html.push('<div class="matrix"><div class="table-scroll"><table>' + thead + tbody + '</table></div></div>');
        if (current) {
          current.text += headers.join(' ') + '\n' + bodyRows.map(r => r.join(' ')).join('\n') + '\n';
        }
        continue;
      }

      if (current) current.text += line + '\n';

      const li = line.match(/^(?:(\d+)\. |([-*]) )(.+)$/);
      if (li) {
        flush();
        const tag = li[1] ? 'ol' : 'ul';
        if (list !== tag) {
          close();
          html.push('<' + tag + (li[1] ? ' start="' + li[1] + '"' : '') + '>');
          list = tag;
        }
        html.push('<li' + (inSources && li[1] ? ' id="ref-' + li[1] + '"' : '') + '>' + inline(li[3], !inSources) + '</li>');
        continue;
      }

      if (!line.trim()) {
        flush();
        close();
        continue;
      }

      close();
      paragraph.push(line.trim());
    }
    flush();
    close();
    return {html: html.join('\n'), sections: sections.filter(s => s.text.trim()), headings};
  }
  return {render, wikilinks};
}

function build(check = false) {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const known = new Set(JSON.parse(fs.readFileSync(path.join(WIKI, 'data/page-index.json'), 'utf8')).map(p => p.slug));
  const newPages = new Set(cfg.pages.map(p => p.slug));
  const renderer = createRenderer(known, newPages);
  const outputs = {};
  const docs = [];
  const search = [];

  const link = (label, href) => '<a href="' + esc(href) + '">' + esc(label) + '</a>';
  const nav = current => '<nav aria-label="Cluster navigation">'
    + [{slug: 'index', navLabel: 'Cluster Hub'}, ...cfg.pages]
        .map(p => '<a href="' + p.slug + '.html"' + (p.slug === current ? ' aria-current="page"' : '') + '>' + esc(p.navLabel) + '</a>')
        .join('')
    + '</nav>';

  const shell = (title, summary, body, current, searchable = false) =>
    '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<meta name="description" content="' + esc(summary) + '">'
    + '<title>' + esc(title) + ' | Theology Wiki</title>'
    + '<link rel="stylesheet" href="series.css"></head><body>'
    + '<a class="skip" href="#main">Skip to content</a>'
    + '<header><p class="eyebrow">THEOLOGY WIKI · PATTERN THEOLOGY &amp; ANTI-MAMMON EDITION · ' + esc(cfg.publicationDate) + '</p>'
    + '<h1>' + esc(title) + '</h1><p class="lede">' + esc(summary) + '</p>'
    + '<nav aria-label="Wiki navigation">'
    + link('Theology Wiki', '../san-reader.html?page=home')
    + link('Latest', '../latest/index.html')
    + link('Discover', '../discover/index.html')
    + link('Connections', '../connections/index.html')
    + '</nav>' + nav(current) + '</header>'
    + '<main id="main">' + body + '</main>'
    + '<footer><p>' + esc(cfg.status) + '. Primary texts, peer-reviewed scholarship, rabbinic reception, and constructive theology remain explicitly distinguished.</p>'
    + '<p>' + link('Cluster Hub', 'index.html') + ' · ' + link('Build and preservation notes', 'README.md') + ' · ' + link('Main Theology Wiki', '../san-reader.html?page=home') + '</p></footer>'
    + (searchable ? '<script src="search-data.js"></script><script src="search.js"></script>' : '')
    + '</body></html>\n';

  for (let idx = 0; idx < cfg.pages.length; idx++) {
    const p = cfg.pages[idx];
    if (!/^[a-z0-9-]+$/.test(p.slug)) throw Error('Unsafe slug ' + p.slug);
    const src = fs.readFileSync(path.join(ROOT, p.source), 'utf8').replace(/\r\n/g, '\n');
    const h1 = src.match(/^# (.+)$/m)?.[1];
    if (h1 !== p.title) throw Error('Title mismatch for ' + p.slug + ': ' + h1 + ' !== ' + p.title);
    const result = renderer.render(src);
    const words = src.split(/\s+/).length;
    const readMinutes = Math.max(1, Math.ceil(words / 220));
    docs.push({...p, words, readMinutes, sections: result.sections.length, sourceSha256: hash(src)});

    const toc = '<details class="contents" open><summary>In this study</summary><ol>'
      + result.headings.filter(h => h.level === 2).map(h => '<li>' + link(h.title.replace(/[*`]/g, ''), '#' + h.id) + '</li>').join('')
      + '</ol></details>';

    const prev = idx === 0 ? link('Cluster Hub', 'index.html') : link(cfg.pages[idx - 1].navLabel, cfg.pages[idx - 1].slug + '.html');
    const next = idx < cfg.pages.length - 1 ? link(cfg.pages[idx + 1].navLabel, cfg.pages[idx + 1].slug + '.html') : link('All Theology Wiki pages', '../discover/index.html');
    const sequence = '<nav class="sequence" aria-label="Continue reading">' + prev + next + '</nav>';

    outputs[p.slug + '.html'] = shell(
      p.title,
      p.summary,
      '<p class="edition">Source-audited edition · ' + readMinutes + ' minute read · ' + link('Source Markdown', p.source) + '</p>'
      + toc + '<article class="prose">' + result.html + '</article>' + sequence,
      p.slug
    );

    for (const s of result.sections) {
      search.push({
        title: p.title,
        kind: p.slug,
        heading: s.heading,
        url: p.slug + '.html#' + s.anchor,
        text: s.text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[([^\]]+)\]\([^\s]+\)/g, '$1').replace(/[*`|]/g, '').replace(/\s+/g, ' ').trim()
      });
    }
  }

  const cards = docs.map(d =>
    '<article class="card"><p class="eyebrow">' + esc(d.cardLabel) + '</p>'
    + '<h2>' + link(d.title, d.slug + '.html') + '</h2>'
    + '<p>' + esc(d.summary) + '</p>'
    + '<p class="meta">' + d.readMinutes + ' minute read · ' + d.sections + ' sections · ' + link('Markdown', d.source) + '</p></article>'
  ).join('\n');

  const searchUI = '<section class="search" aria-labelledby="search-title"><h2 id="search-title">Search this cluster</h2>'
    + '<form id="search-form" role="search"><div><label for="query">Words or a phrase</label>'
    + '<input type="search" id="query" name="q" placeholder="Try 616, therion, aphesis, agorazo, or Kittim" autocomplete="off"></div>'
    + '<div><label for="scope">Search in</label><select id="scope"><option value="">All five studies</option>'
    + cfg.pages.map(p => '<option value="' + p.slug + '">' + esc(p.navLabel) + '</option>').join('')
    + '</select></div><button type="button" id="reset">Clear</button></form>'
    + '<p id="search-status" role="status" aria-live="polite">Search runs on this device and covers all five studies in this cluster.</p>'
    + '<div id="search-results"></div><noscript><p>Search requires JavaScript. Every study remains readable through the cards above.</p></noscript></section>';

  const clusterMap = '<section class="connections"><h2>Cluster navigation map</h2>'
    + '<p><strong>1. Textual and diagnostic core:</strong> ' + link("Solomon's 666 talents and the Mammon Beast pattern", 'solomon-666-and-the-mammon-beast-pattern.html') + ' — 1 Kings 10:14, Papyrus 115 (616), therion/theriou, 600 + 10 + 6, rabbinic reception, 5-marker rubric, case studies, and FAQ.</p>'
    + '<p><strong>2. Counter-economy:</strong> ' + link('Jubilee release and the counter-economy of Revelation 14', 'jubilee-release-and-the-counter-economy-of-revelation-14.html') + ' — Leviticus 25 (deror/aphesis), Luke 4, Acts 2 and 4, and the verbatim agorazo thread across Revelation 13, 14, and 18.</p>'
    + '<p><strong>3. Second Temple and early apocalypses:</strong> ' + link('King of the Kittim, Qumran, and anti-Mammon apocalypses', 'king-of-the-kittim-qumran-and-anti-mammon-apocalypses.html') + ' — War Scroll, Temple Scroll, Damascus Document, Ethiopic Apocalypse of Peter, Gospel of Thomas, Apocryphon of John, and audited boundaries.</p>'
    + '<p><strong>4. Prospective observation and lexical reference:</strong> ' + link('Deterrence, reciprocity and the crisis of alliance trust', 'deterrence-reciprocity-and-alliance-trust.html') + ' and ' + link('Primary-language glossary', 'primary-language-glossary.html') + '.</p>'
    + '<p><strong>Connected Theology Wiki routes:</strong> '
    + link('Antichrist as a pattern of conduct', '../san-reader.html?page=antichrist-as-a-pattern-of-conduct') + ' · '
    + link('Trump and the First Beast', '../san-reader.html?page=trump-first-beast-of-revelation') + ' · '
    + link('Ukraine, Russia and the forecast record', '../san-reader.html?page=ukraine-russia-forecast-record') + ' · '
    + link('Terms used in this inquiry', '../san-reader.html?page=glossary') + ' · '
    + link('Revelation evidence review', '../evidence-review-20261109/revelation-and-symbolic-language.html') + ' · '
    + link('RPPA and economic power', '../rppa-power-20261109/rppa-battles-economic-power-and-gaza.html') + '</p></section>';

  outputs['index.html'] = shell(
    cfg.title,
    cfg.summary,
    '<p class="notice"><strong>Published November 25, 2026.</strong> Five connected, source-audited studies developing the recurring Mammon Beast pattern, Jubilee counter-economy, Qumran and early apocalyptic parallels, verified Greek and Hebrew terms, and prospective alliance-reciprocity logging. Historical evidence, critical scholarship, and constructive theology remain distinct.</p>'
    + clusterMap + '<section class="cards" aria-label="Cluster studies">' + cards + '</section>' + searchUI,
    'index',
    true
  );

  outputs['search-index.json'] = JSON.stringify(search, null, 2) + '\n';
  outputs['search-data.js'] = 'window.BMJ_SEARCH=' + JSON.stringify(search).replace(/</g, '\\u003c') + ';\n';
  outputs['build-report.json'] = JSON.stringify({
    schema: 1,
    date: cfg.publicationDate,
    pages: docs.length,
    searchSections: search.length,
    wikilinks: [...renderer.wikilinks].sort(),
    docs: docs.map(({slug, title, source, sourceSha256, words, readMinutes, sections}) => ({slug, title, source, sourceSha256, words, readMinutes, sections})),
    outputs: Object.entries(outputs).map(([name, value]) => ({path: name, bytes: Buffer.byteLength(value), sha256: hash(value)}))
  }, null, 2) + '\n';

  for (const [name, value] of Object.entries(outputs)) {
    const target = path.join(ROOT, name);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== value) {
        throw Error('Stale output ' + name);
      }
    } else {
      fs.writeFileSync(target, value, 'utf8');
    }
  }
  return {pages: docs.length, searchSections: search.length, outputs: Object.keys(outputs).length, wikilinks: renderer.wikilinks.size};
}

if (require.main === module) {
  console.log(JSON.stringify(build(process.argv.includes('--check')), null, 2));
}
module.exports = {build, createRenderer};
