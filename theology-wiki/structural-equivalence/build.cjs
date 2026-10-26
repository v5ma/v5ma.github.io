'use strict';
// Additive, deterministic supplement. Original articles and archive bytes are not inputs to rewrite.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=__dirname,WIKI=path.resolve(ROOT,'..');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=x=>x.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function href(value){
 const url=new URL(value,'https://wiki.onlyonedevil.com/theology-wiki/structural-equivalence/');
 if(url.protocol!=='https:'||url.username||url.password)throw Error('Unsafe source link');
 if(/chatgpt\.com|\/v5ma2026(?:\/|$)/i.test(value))throw Error('Private source link is outside this public supplement');
 return esc(value);
}
function inline(text){
 const re=/\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*/g;let out='',from=0,m;
 while((m=re.exec(text))){out+=esc(text.slice(from,m.index));out+=m[1]?'<a href="'+href(m[2])+'">'+esc(m[1])+'</a>':'<strong>'+esc(m[3])+'</strong>';from=re.lastIndex;}
 return out+esc(text.slice(from));
}
function render(md){
 const blocks=md.trim().split(/\n\s*\n/),toc=[],ids=new Set();let title='',body='';
 for(const block of blocks){const m=block.match(/^(#{1,3}) (.+)$/);
  if(m){const level=m[1].length,text=m[2];if(level===1){if(title)throw Error('Duplicate title');title=text;continue;}
   const id=slug(text);if(ids.has(id))throw Error('Duplicate heading');ids.add(id);toc.push({id,title:text,level});body+='<h'+level+' id="'+id+'">'+esc(text)+'</h'+level+'>\n';
  }else body+='<p>'+inline(block.replace(/\n/g,' '))+'</p>\n';
 }
 if(!title||toc.length<8)throw Error('Incomplete authorial supplement');return {title,body,toc};
}
function integrateNavigation(){
 const block='<!-- structural-equivalence-navigation:start -->\n    <nav class="wiki-family-strip" style="z-index:0" aria-label="Method and historical genealogy">\n      <a class="wiki-family-link" href="./structural-equivalence/index.html">New: Structural equivalence and the genealogy of ideas</a>\n      <a class="wiki-family-link" href="./comparative-religion/egypt-emanation/egypt-iran-contact.html">Egypt and Iran: Ma’at, Asha and genealogy</a>\n      <a class="wiki-family-link" href="./comparative-religion/egypt-emanation/moses-jesus-mammon/index.html">Egyptian care, Moses, Jesus and Mammon</a>\n    </nav>\n    <!-- structural-equivalence-navigation:end -->';
 for(const name of ['index.html','san-reader.html']){
  const file=path.join(WIKI,name);let text=fs.readFileSync(file,'utf8');
  const re=/<!-- structural-equivalence-navigation:start -->[\s\S]*?<!-- structural-equivalence-navigation:end -->/;
  if(re.test(text))text=text.replace(re,block);else{const anchor='    <section class="layout">';if(text.split(anchor).length!==2)throw Error('Reader navigation anchor changed: '+name);text=text.replace(anchor,'    '+block+'\n\n'+anchor);}
  fs.writeFileSync(file,text);
 }
}
function build(){
 const md=fs.readFileSync(path.join(ROOT,'article.md'),'utf8');
 if(/chatgpt\.com|\/v5ma2026\/|D:\\|\/user_notes\//i.test(md))throw Error('Non-public source material detected');
 const {title,body,toc}=render(md);
 const html='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Micah Blumberg explains signature clusters, narrative architecture and four applications of structural equivalence, including religious genealogy."><title>'+esc(title)+' | Theology Wiki</title><link rel="stylesheet" href="style.css"></head><body><a class="skip" href="#article">Skip to the full explanation</a><header><p class="eyebrow">THEOLOGY WIKI · METHOD AND HISTORICAL GENEALOGY</p><h1>'+esc(title)+'</h1><nav aria-label="Research navigation"><a href="../san-reader.html">Theology reader</a><a href="../comparative-religion/egypt-emanation/egypt-iran-contact.html">Egypt and Iran</a><a href="../comparative-religion/egypt-emanation/moses-jesus-mammon/index.html">Moses, Jesus and Mammon</a><a href="article.md">Source Markdown</a></nav></header><main><nav class="contents" aria-label="On this page"><h2>On this page</h2><ol>'+toc.map(t=>'<li><a href="#'+t.id+'">'+esc(t.title)+'</a></li>').join('')+'</ol></nav><article id="article">'+body+'</article></main><footer><p>Authorial explanation, October 26, 2026. This supplementary study is linked from both Theology reader entry points. Earlier studies and original conversations remain available in their existing forms.</p><p><a href="../san-reader.html">Return to the Theology Wiki</a> · <a href="article.md">Read or save the full Markdown</a></p></footer></body></html>\n';
 fs.writeFileSync(path.join(ROOT,'index.html'),html);integrateNavigation();
 const report={schema:1,date:'2026-10-26',scope:'Additive authorial method explanation and visible navigation; prior articles, conversation corpus and main search/listening indexes are unchanged.',source:'article.md',sourceSha256:hash(md),outputs:[{path:'index.html',sha256:hash(html)},{path:'style.css',sha256:hash(fs.readFileSync(path.join(ROOT,'style.css')))}],sections:toc.map(x=>x.id)};
 fs.writeFileSync(path.join(ROOT,'build-report.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module)console.log(JSON.stringify(build(),null,2));
module.exports={build,render,inline,href};
