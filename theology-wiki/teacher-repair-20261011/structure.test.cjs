'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),R=require('./revision.cjs'),slug=R.revision.slug;
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const body=read('editorial/authorial-articles/'+slug+'.md'),old=read(R.revision.historical_canonical.path);
test('Teacher repair states the identity question and direct comparison before Thomas',()=>{
 const headings=['## First inquiry:','## External chronology','## Second inquiry:','## Third inquiry:','## Fourth inquiry:','## Fifth inquiry:','## What would change the comparison'];
 let previous=-1;for(const h of headings){const at=body.indexOf(h);assert(at>previous,h);previous=at;}
 assert(body.indexOf('could the Teacher of Righteousness')<body.indexOf('### Hidden instruction'));
 assert(body.includes("The Teacher's brother James is proposed as an early successor"));
 assert(body.includes('This source does not report a Yahad-to-James-to-Carpocrates succession chain'));
});
test('Teacher repair retains the full earlier comparisons and all external source links',()=>{
 for(const heading of old.match(/^### .+/gm)||[])assert(body.includes(heading),heading);
 const urls=s=>new Set(s.match(/https?:\/\/[^\s)]+/g)||[]),current=urls(body);
 for(const url of urls(old))assert(current.has(url),url);
 assert(body.split(/\s+/).length>old.split(/\s+/).length,'The repair must preserve the developed depth');
 assert(body.includes('[[living-jesus-thomas-john-and-synoptics|'));
 R.verifyCanonical();
});
test('Five-inquiry summary follows the Teacher article into reading and listening metadata',()=>{
 const summary=R.revision.metadata.summary_after;
 assert.equal(json('data/page-index.json').find(p=>p.slug===slug).summary,summary);
 assert.equal(json('data/listening-library.json').articles.find(p=>p.slug===slug).summary,summary);
 for(const p of ['content/home.md','content/developed/topic-jesus.md'])assert(read(p).includes(summary),p);
 const narration=json('data/listening/'+slug+'.json'),spoken=narration.segments.map(s=>s.text).join(' ');
 for(const word of ['First inquiry:','Second inquiry:','Third inquiry:','Fourth inquiry:','Fifth inquiry:'])assert(spoken.includes(word),word);
 assert.equal(narration.sourceSha256,R.hash(read('content/developed/'+slug+'.md')));
});

require('./semantic.test.cjs');
