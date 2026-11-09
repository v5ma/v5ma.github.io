'use strict';
// Local, deterministic supplemental edition. Does not modify the main reader or archive.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=__dirname;
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const slug=x=>x.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function metadata(text){const m=text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/),out={};if(m)for(const line of m[1].split('\n')){const a=line.match(/^([a-z_]+):\s*(.*)$/);if(a)out[a[1]]=a[2].startsWith('"')?JSON.parse(a[2]):a[2];}return {meta:out,body:text.slice(m?.[0].length||0).trim()};}
function safeHref(href){if(/^(?:https?:\/\/|#|\.\.?\/)/.test(href)||/^[a-zA-Z0-9_-]+(?:\/|\.)/.test(href))return href;throw Error('Unsupported link '+href);}
function createRenderer(known,newPages){
 const wikilinks=new Set();
 function inline(s,links=true){
  const re=/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^\s]+?)\)(?=[\s.,;:!?)]|$)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[(\d+)\]/g;
  let out='',pos=0,m;
  while((m=re.exec(s))){out+=esc(s.slice(pos,m.index));pos=re.lastIndex;
   if(m[1]){const [target,fragment]=m[1].split('#');if(!known.has(target)&&!newPages.has(target))throw Error('Unknown wikilink '+target);wikilinks.add(target);const href=newPages.has(target)?target+'.html'+(fragment?'#'+fragment:''):'https://wiki.onlyonedevil.com/theology-wiki/san-reader.html?page='+encodeURIComponent(target)+(fragment?'#'+fragment:'');out+='<a href="'+esc(href)+'">'+esc(m[2]||target)+'</a>';}
   else if(m[3])out+='<a href="'+esc(safeHref(m[4]))+'">'+inline(m[3],false)+'</a>';
   else if(m[5])out+='<strong>'+esc(m[5])+'</strong>';
   else if(m[6])out+='<em>'+esc(m[6])+'</em>';
   else if(m[7])out+='<code>'+esc(m[7])+'</code>';
   else out+=links?'<a class="citation" href="#ref-'+m[8]+'" aria-label="Source '+m[8]+'">['+m[8]+']</a>':'['+m[8]+']';
  }
  return out+esc(s.slice(pos));
 }
 function render(body){const lines=body.replace(/^# [^\n]+\n+/,'').split(/\r?\n/),html=[],sections=[],headings=[],seen=new Map();let paragraph=[],list=null,inSources=false,current={anchor:'main',heading:'Introduction',text:''};sections.push(current);
  const flush=()=>{if(paragraph.length){html.push('<p>'+inline(paragraph.join(' '))+'</p>');paragraph=[];}};
  const close=()=>{if(list){html.push('</'+list+'>');list=null;}};
  for(const line of lines){const h=line.match(/^(#{2,4})\s+(.+)$/),li=line.match(/^(?:(\d+)\. |([-*]) )(.+)$/);
   if(h){flush();close();const base=slug(h[2]),n=seen.get(base)||0;seen.set(base,n+1);const id=base+(n?'-'+(n+1):'');html.push('<h'+h[1].length+' id="'+id+'">'+inline(h[2])+'</h'+h[1].length+'>');headings.push({id,title:h[2],level:h[1].length});if(h[1].length===2){inSources=/^Sources and access notes/.test(h[2]);current={anchor:id,heading:h[2],text:''};sections.push(current);}else if(current){current.text+=h[2]+'\n';}continue;}
   if(current)current.text+=line+'\n';
   if(li){flush();const tag=li[1]?'ol':'ul';if(list!==tag){close();html.push('<'+tag+(li[1]?' start="'+li[1]+'"':'')+'>');list=tag;}html.push('<li'+(inSources&&li[1]?' id="ref-'+li[1]+'"':'')+'>'+inline(li[3],!inSources)+'</li>');continue;}
   if(!line.trim()){flush();close();continue;}
   close();paragraph.push(line.trim());
  }
  flush();close();return {html:html.join('\n'),sections:sections.filter(s=>s.text.trim()),headings};
 }
 return {render,wikilinks};
}
function build(){
 const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.json'),'utf8'));
 const known=new Set(cfg.verifiedReaderRoutes.map(x=>x.slug)),newPages=new Set(cfg.pages.map(p=>p.slug));
 const renderer=createRenderer(known,newPages),outputs=[],docs=[],search=[];
 const write=(name,content)=>{if(name.includes('..')||path.isAbsolute(name))throw Error('Unsafe output');fs.writeFileSync(path.join(ROOT,name),content);outputs.push({path:name,bytes:Buffer.byteLength(content),sha256:hash(content)});};
 const link=(text,url)=>'<a href="'+esc(url)+'">'+esc(text)+'</a>';
 const nav=current=>'<nav aria-label="Series navigation">'+[['index.html','Overview'],...cfg.pages.map(p=>[p.slug+'.html',p.navLabel])].map(([url,label])=>'<a href="'+url+'"'+(current===url?' aria-current="page"':'')+'>'+esc(label)+'</a>').join('')+'</nav>';
 const cloudsBridge='<aside class="resources" aria-label="New comparative reading"><h2>Clouds, a thousand years and symbolic language</h2><p>November 9, 2026 editorial continuation: distinguish recurring images, historical patterns and final events without attributing a new argument to an older conversation.</p><p><a href="../clouds-and-millennium-20261109/clouds-and-millennium.html">Read the source-based amillennial and premillennial comparison</a></p></aside>';
 const shell=(title,desc,body,current,withSearch=false)=>'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="'+esc(desc)+'"><title>'+esc(title)+' | Theology Wiki</title><link rel="stylesheet" href="series.css"></head><body><a class="skip" href="#main">Skip to content</a><header><p class="eyebrow">THEOLOGY WIKI · WORKING CHAPTERS · PUBLISHED NOVEMBER 6, 2026</p><h1>'+esc(title)+'</h1><p class="lede">'+esc(desc)+'</p>'+'<nav aria-label="Wiki navigation">'+link('Theology Wiki','../san-reader.html?page=home')+link('Latest','../latest/index.html')+'</nav>'+nav(current)+'</header><main id="main">'+body+cloudsBridge+'</main><footer><p>Published working edition. These chapters develop the author’s argument; the companion protocol proposes tests. The demonstrations use synthetic data and do not establish historical or theological validation.</p><p>'+link('Editorial and build notes','README.md')+' · '+link('Return to the main Theology Wiki','https://wiki.onlyonedevil.com/theology-wiki/san-reader.html?page=home')+'</p></footer>'+(withSearch?'<script src="search-data.js"></script><script src="search.js"></script>':'')+'</body></html>\n';
 for(const p of cfg.pages){
  const bytes=fs.readFileSync(path.join(ROOT,p.source));const {meta,body}=metadata(bytes.toString('utf8'));const title=meta.title||body.match(/^# (.+)$/m)?.[1];if(!title||meta.slug&&meta.slug!==p.slug)throw Error('Source metadata mismatch '+p.source);
  const desc=meta.summary||p.summary,result=renderer.render(body),words=body.split(/\s+/).length;
  const doc={...p,title,summary:desc,sourceSha256:hash(bytes),words,readMinutes:Math.ceil(words/220),sections:result.sections.length};docs.push(doc);
  const toc='<details class="contents" open><summary>In this '+(p.kind==='chapter'?'chapter':'appendix')+'</summary><ol>'+result.headings.filter(h=>h.level===2).map(h=>'<li>'+link(h.title,'#'+h.id)+'</li>').join('')+'</ol></details>';
  const resources='<aside class="resources"><h2>Read and reproduce</h2><p>'+link('Original Markdown',p.source)+(p.kind==='research'?' · '+link('Python demonstration','research/pattern_validation_demo.py')+' · '+link('Synthetic results JSON','research/pattern_validation_demo_results.json')+' · '+link('Register structure audit','research/pattern_register_audit.json'):' · '+link('Mathematical research protocol','pattern-validation-protocol.html'))+'</p><p>The source file is preserved separately from this rendered page. No earlier conversation, forecast date or public-corpus record is rewritten.</p></aside>';
  const idx=cfg.pages.indexOf(p),sequence='<nav class="sequence" aria-label="Continue reading">'+(idx?link('← '+cfg.pages[idx-1].navLabel,cfg.pages[idx-1].slug+'.html'):link('← Overview','index.html'))+(idx<cfg.pages.length-1?link(cfg.pages[idx+1].navLabel+' →',cfg.pages[idx+1].slug+'.html'):'')+'</nav>';
  write(p.slug+'.html',shell(title,desc,'<p class="edition">'+(p.kind==='chapter'?'Working authorial chapter':'Proposed research protocol')+' · '+doc.readMinutes+' minute read · '+link('Download Markdown',p.source)+'</p>'+toc+'<article class="prose">'+result.html+'</article>'+resources+sequence,p.slug+'.html'));
  for(const s of result.sections)search.push({title,kind:p.kind,heading:s.heading,url:p.slug+'.html#'+s.anchor,text:s.text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,'$2').replace(/\[([^\]]+)\]\([^\s]+\)/g,'$1').replace(/[*`]/g,'').replace(/\s+/g,' ').trim()});
 }
 const cards=docs.map((d,i)=>'<article class="card"><p class="eyebrow">'+(d.kind==='chapter'?'CHAPTER '+(i+1):'RESEARCH APPENDIX')+'</p><h2>'+link(d.title,d.slug+'.html')+'</h2><p>'+esc(d.summary)+'</p><p class="meta">'+d.readMinutes+' minute read · '+d.sections+' sections · '+link('Markdown',d.source)+'</p></article>').join('\n');
 const searchUI='<section class="search" aria-labelledby="search-title"><h2 id="search-title">Search the chapters and protocol</h2><form id="search-form" role="search"><div><label for="query">Words or a phrase</label><input type="search" id="query" name="q" placeholder="Try “causal feedback” or “Brier”" autocomplete="off"></div><div><label for="scope">Search in</label><select id="scope"><option value="">All three texts</option><option value="chapter">Chapters</option><option value="research">Research protocol</option></select></div><button type="button" id="reset">Clear</button></form><p id="search-status" role="status" aria-live="polite">Search runs on this device. It covers these three complete texts only.</p><div id="search-results"></div><noscript><p>Search needs JavaScript. The complete chapters and their contents lists remain available below.</p></noscript></section>';
 write('index.html',shell('Prophecy, patterns and the work of correction','Two connected chapters on partial predictive success, recurring structures of power, and the truthful work of repair. A mathematical appendix turns the questions into a testable research design.','<p class="notice"><strong>Published November 6, 2026.</strong> These working chapters complement the resurrection and Jesus-ethics studies. The argument, the proposed tests and the synthetic examples retain distinct evidential roles.</p><section class="cards" aria-label="Chapter contents">'+cards+'</section>'+searchUI+'<section class="connections"><h2>Continue the existing inquiry</h2><p>'+cfg.verifiedReaderRoutes.filter(x=>['antichrist-as-a-pattern-of-conduct','apocalyptic-repair-theology','forecast-ledger','christ-as-an-inner-model'].includes(x.slug)).map(x=>link(x.title,'https://wiki.onlyonedevil.com/theology-wiki/san-reader.html?page='+x.slug)).join(' · ')+'</p><p>These links return to existing main-reader studies. Their source text and publication history are unchanged.</p></section>','index.html',true));
 write('search-index.json',JSON.stringify(search,null,2)+'\n');write('search-data.js','window.PROPHECY_SEARCH='+JSON.stringify(search).replace(/</g,'\\u003c')+';\n');
 const report={schema:'theology-prophecy-supplement/v1',status:'release_edition',publicationDate:cfg.publicationDate,date:cfg.date,baseRevision:cfg.baseRevision,scope:'Standalone supplemental section; main reader search and listening are not regenerated.',pages:docs.map(({slug,title,source,sourceSha256,words,readMinutes,sections})=>({slug,title,source,sourceSha256,words,readMinutes,sections})),searchSections:search.length,wikilinks:[...renderer.wikilinks].sort(),outputs};
 fs.writeFileSync(path.join(ROOT,'build-report.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module)console.log(JSON.stringify(build(),null,2));
module.exports={build,metadata,createRenderer,safeHref};
