'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const slug='gmirkin-hellenistic-bible-theory';
const source=read('assets/js/research-tools.js');
const page=JSON.parse(read('data/page-index.json')).find(p=>p.slug===slug);
const document={querySelector:()=>null,addEventListener:()=>{}};
const window={TheologyResearchCore:require('../assets/js/research-core.js'),addEventListener:()=>{}};
const sandbox={window,document,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>({})}),URL,URLSearchParams,location:{href:'https://example.test/theology-wiki/san-reader.html',origin:'https://example.test'}};
vm.runInNewContext(source.replace('window.TheologyExtension={navigation};','window.TheologyExtension={navigation,archiveFootnote,sourceCard,a,qualifyArchiveLinks};'),sandbox);
const api=window.TheologyExtension;
test('the editorial footnote applies only to the existing archived conversation',()=>{
 const note=api.archiveFootnote(page);
 assert.match(note,/role="note"/);assert.match(note,/contested minority hypothesis/);
 assert.match(note,/not a foundation of this wiki/);
 assert.equal(api.archiveFootnote({...page,slug:'home'}),'');
 assert.equal(api.archiveFootnote({...page,slug:'flood-inheritance-and-deep-time'}),'');
});
test('reception, earlier Israel, and the Torah dating boundary are source-linked',()=>{
 const note=api.archiveFootnote(page);
 for(const text of ['West, 2026','1208 BCE','Mesha stele','Omri as king of Israel','Neither inscription establishes the Torah’s final composition date','historical conversation is retained unchanged'])assert.ok(note.includes(text),text);
 const urls=[...note.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(urls.length,3);for(const url of urls)assert.equal(new URL(url).protocol,'https:');
});
test('runtime source card includes the visible note before the unmodified transcript area',()=>{
 const html=api.sourceCard(page);
 assert.equal((html.match(/id="gmirkin-editorial-footnote"/g)||[]).length,1);
 assert.ok(html.indexOf('gmirkin-editorial-footnote')<html.indexOf('id="source-transcript"'));
 assert.ok(html.includes(page.sourceSha256));assert.ok(html.includes('Read the full conversation'));
});
test('existing links qualify the archive without changing destinations or other links',()=>{
 assert.match(api.a(slug,'Existing label'),/Existing label<small class="archive-link-context"> \(archived minority hypothesis\)/);
 assert.ok(api.a(slug).includes('?page='+slug));
 assert.ok(!api.a('topic-origins').includes('archive-link-context'));
 const bad={closest:()=>false,querySelector:()=>null,getAttribute:()=> 'https://%/'+slug};
 assert.doesNotThrow(()=>api.qualifyArchiveLinks({querySelectorAll:()=>[bad]}));
});
test('original conversation bytes and manifest identity are unchanged',()=>{
 const bytes=fs.readFileSync(path.join(root,'..','theology-sources/chats',page.sourceFile));
 assert.equal(bytes.length,7350);assert.equal(bytes.length,page.sourceBytes);
 const digest=crypto.createHash('sha256').update(bytes).digest('hex');
 assert.equal(digest,'b63722ad06e4df6be3b663e5267e8f50ace76eafd646319fb3c5cd8996040509');
 assert.equal(digest,page.sourceSha256);
});
test('both reader entry points pin the corrected runtime hash',()=>{
 const token=crypto.createHash('sha256').update(source).digest('hex').slice(0,16);
 for(const file of ['index.html','san-reader.html'])assert.ok(read(file).includes('research-tools.js?v='+token),file);
});
test('the correction does not add a study route or a home/latest feature',()=>{
 const pages=JSON.parse(read('data/page-index.json'));
 assert.equal(pages.filter(p=>p.slug===slug).length,1);
 assert.ok(!pages.some(p=>p.slug.includes('genesis-berossus')));
 for(const file of ['content/home.md','latest/index.html','purpose/index.html'])assert.ok(!read(file).includes(slug),file);
});
