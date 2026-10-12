'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const decodeAttribute=s=>s.replace(/&(amp|lt|gt|quot|#39);/g,(_,e)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"})[e]);
function renderer(){
 let source=read('assets/js/theology-reader.js');
 const end='  init();\n})();';assert(source.includes(end),'Instrument only the known initialization boundary');
 source=source.replace(end,'  globalThis.testReader={renderInline,renderMarkdown,hydratePages};\n})();');
 const context={document:{getElementById:()=>null},window:{location:{href:'http://localhost/theology-wiki/san-reader.html',pathname:'/theology-wiki/san-reader.html',protocol:'http:',origin:'http://localhost',hostname:'localhost'},WIKI_READER_CONFIG:{crossWiki:{currentWiki:'theology'}}},URL,URLSearchParams};
 vm.createContext(context);vm.runInContext(source,context);const pages=JSON.parse(read('data/page-index.json'));context.testReader.hydratePages(pages);return {...context.testReader,pages};
}
function hrefs(html){return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map(m=>decodeAttribute(m[1]));}
const R=renderer();
test('Markdown source links retain exact ampersand-delimited query parameters',()=>{
 const url='https://www.biblegateway.com/passage/?search=John+17&version=NRSVUE',html=R.renderInline('[John 17]('+url+')',{});
 assert.deepEqual(hrefs(html),[url]);assert.equal(new URL(hrefs(html)[0]).searchParams.get('version'),'NRSVUE');assert(!html.includes('&amp;amp;version'));
});
test('Every inline Gospel citation retains its exact complete destination',()=>{
 const slug='gnostic-canonical-gospels-telling-the-truth',canonical=read('editorial/authorial-articles/'+slug+'.md'),page=R.pages.find(p=>p.slug===slug);assert(page);
 const expected=new Set([...canonical.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(m=>m[1]));
 const actual=new Set(hrefs(R.renderMarkdown(read('content/'+page.path),page)));
 assert(expected.size>=15);for(const url of expected)assert(actual.has(url),url);
});
test('Destination escaping is reversed once without recursively decoding authored entity text',()=>{
 const url='https://example.invalid/?raw=1&literal=&amp;version=literal&less=&lt;value&gt;';
 assert.deepEqual(hrefs(R.renderInline('[literal]('+url+')',{})),[url]);
});
test('Quoted query values remain escaped inside one safe href attribute',()=>{
 const url='https://example.invalid/?q=" onmouseover="alert(1)&single=\'quoted\'&tag=<value>';
 const html=R.renderInline('[link]('+url+')',{});
 assert.match(html,/^<a href="[^"]*">link<\/a>$/);assert.deepEqual(hrefs(html),[url]);
 assert(html.includes('&quot;'));assert(html.includes('&#39;'));assert(html.includes('&lt;value&gt;'));assert(!html.includes('<value>'));
});
test('Unsafe Markdown schemes stay blocked after destination normalization',()=>{
 for(const url of ['javascript:alert(1)','vbscript:msgbox(1)','data:text/html,<script>bad</script>','file:///etc/passwd','blob:https://example.invalid/id']){
  const html=R.renderInline('[unsafe]('+url+')',{});assert.deepEqual(hrefs(html),[],url);assert(html.includes('wiki-missing'),url);assert(!html.includes('<script>'),url);
 }
});
test('Link labels remain escaped while ordinary external and local routes retain behavior',()=>{
 const html=R.renderInline('[<script>bad</script>](https://example.invalid/a?one=1&two=2)',{});assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert.deepEqual(hrefs(html),['https://example.invalid/a?one=1&two=2']);
 const page=R.pages.find(p=>p.slug==='home');const local=R.renderInline('[Library](home.md)',page);assert(hrefs(local)[0].includes('page=home'));
});


test('Both reader entry points pin the actual runtime content hash',()=>{
 const digest=require('node:crypto').createHash('sha256').update(read('assets/js/theology-reader.js')).digest('hex').slice(0,16);
 for(const page of ['index.html','san-reader.html']){
  const keys=[...read(page).matchAll(/\.\/assets\/js\/theology-reader\.js\?v=([^"'\s]+)/g)].map(m=>m[1]);
  assert(keys.length>0,page);assert(keys.every(key=>key===digest),page);
 }
});

test('Repeated identical leading titles render once in the page shell without a duplicate body title',()=>{
 const slug='gnostic-canonical-gospels-telling-the-truth',page=R.pages.find(p=>p.slug===slug),source=read('content/'+page.path);
 assert.equal(source.split('# '+page.title+'\n').length-1,2,'Keep both canonical/generated source headings unchanged');
 const html=R.renderMarkdown(source,page);assert(!html.startsWith('<h2>'+page.title+'</h2>'));assert(html.startsWith('<h3>A shared way of reading</h3>'));
 const title='An exact title',body='# '+title+'\n\n# '+title+'\n\n# '+title+'\n\n## First section\n\nThe complete body stays.\n\n## '+title+'\n\nA later matching heading stays.';
 assert.equal(R.renderMarkdown(body,{title}),'<h3>First section</h3>\n<p>The complete body stays.</p>\n<h3>An exact title</h3>\n<p>A later matching heading stays.</p>');
});
test('Title deduplication stops at a different heading or intervening prose',()=>{
 const page={title:'An exact title'};
 assert.equal(R.renderMarkdown('# An exact title\n\n## Another heading\n\n# An exact title\n\nBody.',page),'<h3>Another heading</h3>\n<h2>An exact title</h2>\n<p>Body.</p>');
 assert.equal(R.renderMarkdown('# An exact title\n\nOpening prose.\n\n# An exact title\n\nBody.',page),'<p>Opening prose.</p>\n<h2>An exact title</h2>\n<p>Body.</p>');
 assert.equal(R.renderMarkdown('# An exact title\n\n# An exact title!\n\nBody.',page),'<h2>An exact title!</h2>\n<p>Body.</p>');
});
