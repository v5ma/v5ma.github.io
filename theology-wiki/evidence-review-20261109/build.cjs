'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createRenderer}=require('../jesus-ethics-20261105/build.cjs');
const ROOT=__dirname,esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function build(check=false){
 const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.json'),'utf8'));
 const renderer=createRenderer(new Set(),new Set(cfg.pages.map(p=>p.slug))),outputs={},search=[];
 const link=(label,href)=>'<a href="'+esc(href)+'">'+esc(label)+'</a>';
 const nav=current=>'<nav aria-label="Evidence studies">'+[{slug:'index',navLabel:'Overview'},...cfg.pages].map(p=>'<a href="'+p.slug+'.html"'+(p.slug===current?' aria-current="page"':'')+'>'+esc(p.navLabel)+'</a>').join('')+'</nav>';
 const shell=(title,summary,body,current,searchable=false)=>'<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="'+esc(summary)+'"><title>'+esc(title)+' | Theology Wiki</title><link rel="stylesheet" href="series.css"></head><body><a class="skip" href="#main">Skip to content</a><header><p class="eyebrow">THEOLOGY WIKI · EVIDENCE EDITION · NOVEMBER 9, 2026</p><h1>'+esc(title)+'</h1><p class="lede">'+esc(summary)+'</p><nav aria-label="Wiki navigation">'+link('Theology Wiki','../san-reader.html?page=home')+link('Latest','../latest/index.html')+link('Explained graph','../san-reader.html?page=connections')+'</nav>'+nav(current)+'</header><main id="main">'+body+'</main><footer><p>'+esc(cfg.status)+'. Historical evidence, scholarly interpretation and working hypotheses remain distinct.</p><p>'+link('Editorial method','evidence-and-editorial-method.html')+' · '+link('Build and preservation notes','README.md')+'</p></footer>'+(searchable?'<script src="search-data.js"></script><script src="search.js"></script>':'')+'</body></html>\n';
 for(const p of cfg.pages){
  if(!/^[a-z0-9-]+$/.test(p.slug))throw Error('Unsafe slug');
  const src=fs.readFileSync(path.join(ROOT,'sources',p.slug+'.md'),'utf8');
  if(src.match(/^# (.+)$/m)?.[1]!==p.title)throw Error('Title mismatch '+p.slug);
  const result=renderer.render(src);
  // Native open details retain every paragraph without JavaScript and allow comparison sections to be collapsed.
  const comparisonIds={
   'dead-sea-scrolls-dating':['counterarguments-and-limits'],
   'revelation-and-symbolic-language':['interpretation-and-continuing-disagreement'],
   'linguistic-epigraphic-matrix':['hebrew-language-competing-chronological-models','greek-influence-what-an-objection-actually-shows']
  };
  for(const id of comparisonIds[p.slug]||[]){
   const marker='<h2 id="'+id+'">',start=result.html.indexOf(marker);
   if(start<0)throw Error('Missing comparison section '+id);
   const next=result.html.indexOf('<h2 ',start+marker.length),end=next<0?result.html.length:next;
   result.html=result.html.slice(0,start)+'<details class="counterargument" open><summary>Compare interpretations and objections</summary>'+result.html.slice(start,end)+'</details>'+result.html.slice(end);
  }
  const toc='<details class="contents" open><summary>In this study</summary><ol>'+result.headings.filter(h=>h.level===2).map(h=>'<li>'+link(h.title,'#'+h.id)+'</li>').join('')+'</ol></details>';
  const archives=Object.entries(cfg.archiveCompanions).filter(([,s])=>s===p.slug).map(([s])=>link(s.replace(/-/g,' '),'../san-reader.html?page='+s));
  const archive=archives.length?'<aside class="resources"><h2>Preserved research record</h2><p>These earlier conversations are retained for attribution and intellectual history. They are not independent evidence for historical claims.</p><p>'+archives.join(' · ')+'</p></aside>':'';
  outputs[p.slug+'.html']=shell(p.title,p.summary,'<p class="edition">Evidence-led study · '+Math.ceil(src.split(/\s+/).length/220)+' minute read · '+link('Editorial source','sources/'+p.slug+'.md')+'</p>'+toc+'<article class="prose">'+result.html+'</article>'+archive,p.slug);
  for(const s of result.sections)search.push({title:p.title,kind:p.slug,heading:s.heading,url:p.slug+'.html#'+s.anchor,text:s.text.replace(/\[([^\]]+)\]\([^\s]+\)/g,'$1').replace(/[*`]/g,'').replace(/\s+/g,' ').trim()});
 }
 const cards=cfg.pages.map(p=>'<article class="card"><p class="eyebrow">EVIDENCE & INTERPRETATION</p><h2>'+link(p.title,p.slug+'.html')+'</h2><p>'+esc(p.summary)+'</p></article>').join('');
 const searchUI='<section class="search" aria-labelledby="search-title"><h2 id="search-title">Search these five studies</h2><form id="search-form" role="search"><div><label for="query">Words or a phrase</label><input type="search" id="query" name="q" placeholder="Try 1QpHab, violence or loanwords" autocomplete="off"></div><div><label for="scope">Search in</label><select id="scope"><option value="">All studies</option>'+cfg.pages.map(p=>'<option value="'+p.slug+'">'+esc(p.navLabel)+'</option>').join('')+'</select></div><button type="button" id="reset">Clear</button></form><p id="search-status" role="status" aria-live="polite">Search runs on this device and covers these five complete studies.</p><div id="search-results"></div><noscript><p>Search needs JavaScript. Every study remains readable through the links above.</p></noscript></section>';
 const map='<section class="connections"><h2>Follow the evidence</h2><div class="evidence-flow" aria-label="Reading sequence"><p>'+link('Name the claim','evidence-and-editorial-method.html')+' → '+link('Inspect the witness','linguistic-epigraphic-matrix.html')+' → '+link('Separate dating from identity','dead-sea-scrolls-dating.html')+'</p><p>'+link('Test a literary interpretation','revelation-and-symbolic-language.html')+' → '+link('Compare historical explanations','why-christianity-spread.html')+'</p></div><p>These arrows are a reading route, not a chain of historical proof. The existing '+link('interactive connection graph','../san-reader.html?page=connections')+' provides linked nodes and full text alternatives.</p></section>';
 outputs['index.html']=shell('Evidence before interpretation','Cited studies, specific counterarguments and a preserved research record.','<p class="notice"><strong>Start with the argument and its evidence.</strong> These five studies replace conversational shortcuts with inspectable sources. This is a first review of selected subjects, not a completed audit of the 354-conversation archive. Original conversations remain available as historical records.</p>'+map+'<section class="cards" aria-label="Evidence study contents">'+cards+'</section>'+searchUI,'index',true);
 outputs['search-index.json']=JSON.stringify(search,null,2)+'\n';
 outputs['search-data.js']='window.INQUIRY_SEARCH='+JSON.stringify(search).replace(/</g,'\\u003c')+';\n';
 const routes=Object.fromEntries(Object.entries(cfg.archiveCompanions).map(([archive,slug])=>[archive,{slug,title:cfg.pages.find(p=>p.slug===slug).title}]));
 outputs['reader-guide.js']=`/* Evidence companions. Source records and their turn links remain unchanged. */\n(()=>{'use strict';const routes=${JSON.stringify(routes).replace(/</g,'\\u003c')};const base='./evidence-review-20261109/';const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));\nwindow.TheologyReview={sourceGuide(p){const r=routes[p.slug];return '<aside class="research-section evidence-source-guide" aria-label="Evidence and archive status"><p><strong>Research record, not verified historical authority.</strong> Archived replies can contain errors. An unchanged file hash confirms preservation, not factual accuracy.</p>'+(r?'<p><a class="evidence-companion" href="'+base+r.slug+'.html">Read the evidence-led study: '+esc(r.title)+'</a></p>':'')+'<p><a href="'+base+'evidence-and-editorial-method.html">Evidence labels, citations and corrections</a></p></aside>';},enhance(p){if(p.slug!=='home')return;const body=document.querySelector('#article-body');if(!body||body.querySelector('#evidence-edition-entry'))return;const s=document.createElement('section');s.id='evidence-edition-entry';s.className='research-section';s.innerHTML='<h2>Evidence before interpretation</h2><p>Read cited studies of Revelation, the Dead Sea Scrolls, language and inscriptions, and early Christian community. Arguments, counterarguments and original records stay distinct.</p><p><a href="'+base+'index.html">Open the five evidence-led studies</a></p>';body.prepend(s);}};})();\n`;
 outputs['build-report.json']=JSON.stringify({schema:1,date:cfg.publicationDate,pages:cfg.pages.length,searchSections:search.length,outputs:Object.entries(outputs).map(([name,value])=>({path:name,bytes:Buffer.byteLength(value),sha256:hash(value)}))},null,2)+'\n';
 for(const [name,value] of Object.entries(outputs)){const target=path.join(ROOT,name);if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==value)throw Error('Stale output '+name);}else fs.writeFileSync(target,value);}
 return {pages:cfg.pages.length,searchSections:search.length,outputs:Object.keys(outputs).length};
}
if(require.main===module)console.log(JSON.stringify(build(process.argv.includes('--check'))));
module.exports={build};
