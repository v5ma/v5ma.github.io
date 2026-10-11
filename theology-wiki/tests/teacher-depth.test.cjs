'use strict';
// Focused article checks only. These do not certify a full site rebuild.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),slug='jesus-teacher-of-righteousness-hypothesis';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const canonical=read(`editorial/authorial-articles/${slug}.md`);
const generated=read(`content/developed/${slug}.md`);
const metadata=json('editorial/authorial.json').articles.find(p=>p.slug===slug);
const pages=json('data/page-index.json'),page=pages.find(p=>p.slug===slug);
const references=[...require('../editorial/expansion.cjs').references,...require('../editorial/depth.cjs').references];
const presentation=json('editorial/authorial-presentation.json');

test('Teacher canonical source reproduces the generated article with current metadata',()=>{
 let body=canonical;
 body+='\n\n## Source conversations\n\n'+page.references.map(s=>`[[${s.slug}|${s.title}]] is the archived discussion dated ${s.date||'unknown'} (UTC export metadata).`).join('\n\n')+'\n\n'+metadata.attribution;
 body+='\n\n## External sources and access notes\n\n'+metadata.externalSources.map(id=>{const r=references.find(r=>r.id===id);assert(r,`Missing reference ${id}`);return `[${r.title}](${r.url})\n\n${r.scope} Consulted ${r.accessed}.`;}).join('\n\n');
 for(const [old,replacement] of Object.entries(presentation))body=body.split(old).join(replacement);
 const expected=`---\ntitle: ${JSON.stringify(metadata.title)}\nslug: ${JSON.stringify(metadata.slug)}\nsummary: ${JSON.stringify(metadata.summary)}\ntopic: ${JSON.stringify(page.topic)}\nstatus: ${JSON.stringify(metadata.kind)}\nupdated: ${JSON.stringify(metadata.updated)}\n---\n\n# ${metadata.title}\n\n${body.trim()}\n`;
 assert.equal(generated,expected);
 assert.equal(read(`public-corpus/pages/${slug}.md`),expected);
});

test('Every Teacher wikilink resolves to an indexed page',()=>{
 const known=new Set(pages.map(p=>p.slug));
 for(const m of generated.matchAll(/\[\[([^\]|#]+)(?:[^\]]*)\]\]/g))assert(known.has(m[1])||m[1]==='index',m[1]);
});

test('The constructive identity, transmission and succession arguments remain explicit',()=>{
 for(const phrase of ['same individual','one founder, several generations','descendants','Judea–Egypt','34 candidate parallels','ten diagnostic non-equivalences','124-137 years','CD XX, 13–15','434 years','483 years','490 years','restored wording'])assert(canonical.includes(phrase),phrase);
 assert(canonical.indexOf('## The constructive case')<canonical.indexOf('## Paul supplies constraints'));
 assert(canonical.includes('not numerical proof'));
});

test('Public source anchors retain revision and speaker attribution without private chat URLs',()=>{
 assert(canonical.includes('c6e2b09f79c0bb3bd0a0e45b54b72c35d1ca1852/theology-wiki/public-corpus/pages/'));
 assert(canonical.includes('the October 2025 AI reply'));
 assert(canonical.includes('snapshot metadata, not independent timestamps'));
 assert(!/https?:\/\/(?:chatgpt\.com|chat\.openai\.com)\//i.test(canonical));
 assert(!/(?:cite|filecite)|sediment:\/\/|token=/.test(canonical));
 const forbidden=/\bMicah (?:proposes|suggests|compares|argues|writes|asks|develops)|\b(?:He writes that|he suggests that)/;
 assert(!forbidden.test(canonical));
 for(const [old,replacement] of Object.entries(presentation))assert.equal(canonical.split(old).join(replacement),canonical);
});
