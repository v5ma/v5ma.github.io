'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {render,integrate,stripIntegration,banner,assets}=require('./build.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(__dirname,p),'utf8');
const html=read('index.html'),letter=read('letter.txt'),map=JSON.parse(read('reading-map.json'));
const decode=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
test('the nine selected letter paragraphs are preserved exactly and in order',()=>{
 const source=JSON.parse(read('source-integrity.json'));
 assert.equal(crypto.createHash('sha256').update(letter).digest('hex'),source.sha256);
 const quoted=html.match(/<blockquote class="letter"[^>]*>([\s\S]*?)<\/blockquote>/)[1];
 const paragraphs=[...quoted.matchAll(/<p(?: class="[^"]*")?>([\s\S]*?)<\/p>/g)].map(x=>decode(x[1]));
 assert.equal(paragraphs.length,9);assert.equal(source.paragraphs,9);
 assert.deepEqual(paragraphs,letter.trimEnd().split('\n\n'));
 assert.ok(letter.includes("I'm searching for the Unorthodox Interpretation that changes the Orthodox Interpretation."));
 assert.ok(letter.includes('what the earliest Christians believed about resurrection'));
 assert.ok(letter.includes('How was his teaching corrupted by others'));
 assert.ok(!html.includes('Darlene'));assert.ok(!html.includes('desalination'));
});
test('the static page rebuilds deterministically',()=>assert.equal(html,render()));
test('all eight existing collections contribute and retain their own topic routes',()=>{
 const research=JSON.parse(fs.readFileSync(path.join(root,'data/research.json'),'utf8'));
 assert.equal(map.length,8);
 assert.deepEqual(map.map(x=>x.id).sort(),research.categories.map(x=>x.id).sort());
 for(const s of map){assert.equal(s.topic,'topic-'+s.id);assert.ok(s.contribution.length>200);assert.ok(s.links.length>=3);assert.ok(html.includes('id="'+s.id+'"'));}
 assert.match(html,/competing hypotheses/);assert.match(html,/living tradition has its own history/);
});
test('all reader routes exist, all local targets exist, and every fragment resolves',()=>{
 const index=JSON.parse(fs.readFileSync(path.join(root,'data/page-index.json'),'utf8'));
 const slugs=new Set(index.map(x=>x.slug));
 // A sparse connector checkout can supply the verified repository inventory. CI uses the actual full checkout.
 const inventoryPath=path.join(root,'..','repository-paths.json');
 const inventory=fs.existsSync(inventoryPath)?new Set(JSON.parse(fs.readFileSync(inventoryPath,'utf8'))):null;
 for(const m of html.matchAll(/href="([^"]+)"/g)){
  const href=decode(m[1]);if(href.startsWith('https://'))continue;
  if(href.startsWith('#')){assert.ok(html.includes('id="'+href.slice(1)+'"'),href);continue;}
  const u=new URL(href,'https://example.test/theology-wiki/purpose/index.html');
  assert.equal(u.origin,'https://example.test');
  if(u.searchParams.has('page'))assert.ok(slugs.has(u.searchParams.get('page')),href);
  const local=path.resolve(__dirname,href.split('?')[0].split('#')[0]);
  const repoPath=path.relative(path.dirname(root),local);
  assert.ok(fs.existsSync(local)||inventory?.has(repoPath),href);
 }
});
test('entrances are additive, idempotent and ahead of reader navigation',()=>{
 for(const file of ['index.html','san-reader.html']){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  assert.equal(integrate(text),text);assert.equal(integrate(stripIntegration(text)),text);
  assert.equal(text.split('id="purpose-entry-title"').length-1,1);
  assert.ok(text.indexOf(banner)<text.indexOf('<nav class="wiki-family-strip"'));
  assert.ok(text.includes(assets));
 }
 const runtime=fs.readFileSync(path.join(root,'assets/js/depth-tools.js'),'utf8');
 assert.match(runtime,/strip.innerHTML=.*purpose\/index\.html/);
});
test('semantic navigation, title, skip link and no-script reading remain available',()=>{
 assert.ok(!html.includes('<script'));assert.equal([...html.matchAll(/<h1[> ]/g)].length,1);
 assert.match(html,/<html lang="en">/);assert.match(html,/name="viewport"/);
 assert.match(html,/class="skip" href="#main"/);assert.match(html,/id="main"/);
 const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);
 for(const id of ['letter','reading-map','method','begin'])assert.ok(ids.includes(id));
});
