'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createRenderer}=require('../jesus-ethics-20261105/build.cjs');
const ROOT=__dirname,hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tag='<!-- theology-alternative-inheritances-assets --><script defer src="./alternative-inheritances-20261109/reader-links.js?v=20261109-1"></script>\n';
const stripIntegration=s=>s.replace(tag,'');
const integrate=s=>{const clean=stripIntegration(s),anchor=clean.includes('<!-- theology-purpose-assets -->')?'<!-- theology-purpose-assets -->':'</head>';return clean.replace(anchor,tag+anchor);};
const a=(text,href)=>'<a href="'+esc(href)+'">'+esc(text)+'</a>';
function build(check=false){
 const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.json'))),pages=JSON.parse(fs.readFileSync(path.join(ROOT,'../data/page-index.json'))),known=new Set(pages.map(p=>p.slug));
 for(const c of cfg.connections)if(!known.has(c.slug))throw Error('Unknown reader route '+c.slug);
 for(const row of cfg.matrix)for(const k of ['from','to'])if(!known.has(row[k]))throw Error('Unknown matrix route '+row[k]);
 const source=fs.readFileSync(path.join(ROOT,cfg.source),'utf8'),renderer=createRenderer(known,new Set()),r=renderer.render(source),reader=slug=>'../san-reader.html?page='+slug;
 if(source.match(/^# (.+)$/m)?.[1]!==cfg.title)throw Error('Title mismatch');
 const labels=Object.fromEntries(cfg.connections.map(c=>[c.slug,c.label]));
 const matrix='<section class="matrix" aria-label="Cross-reference matrix"><div class="table-scroll" tabindex="0" role="region" aria-label="Cross-reference matrix, scroll horizontally if needed"><table><caption>Alternative inheritances: two-way reading routes, evidence and limits</caption><thead><tr><th scope="col">Question and route</th><th scope="col">Relationship</th><th scope="col">Evidence and limit</th></tr></thead><tbody>'+cfg.matrix.map(row=>'<tr><th scope="row">'+esc(row.question)+'<br>'+a(labels[row.from],reader(row.from))+' ↔ '+a(labels[row.to],reader(row.to))+'</th><td>'+esc(row.type)+'</td><td>'+esc(row.basis)+'<br><strong>Limit:</strong> '+esc(row.limit)+'</td></tr>').join('')+'</tbody></table></div></section>';
 let html=r.html.replaceAll('https://wiki.onlyonedevil.com/theology-wiki/san-reader.html?page=',reader(''));
 const marker='<h2 id="use-the-navigation-already-present">';if(!html.includes(marker))throw Error('Missing matrix insertion');html=html.replace(marker,matrix+'\n'+marker);
 const links='<section class="connections" id="connected-reading"><h2>Continue through the inquiry</h2><ul>'+cfg.connections.map(c=>'<li>'+a(c.label,reader(c.slug))+': '+esc(c.relationship)+'.</li>').join('')+cfg.staticConnections.map(c=>'<li>'+a(c.label,c.href)+': '+esc(c.reason)+'</li>').join('')+'</ul></section>';
 const body='<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="'+esc(cfg.summary)+'"><title>'+esc(cfg.title)+' | Theology Wiki</title><link rel="canonical" href="https://v5ma.github.io/theology-wiki/alternative-inheritances-20261109/alternative-inheritances.html"><link rel="stylesheet" href="series.css"></head><body><a class="skip" href="#main">Skip to content</a><header><p class="eyebrow">THEOLOGY WIKI · CONNECTED READING · NOVEMBER 9, 2026</p><h1>'+esc(cfg.title)+'</h1><p class="lede">'+esc(cfg.summary)+'</p><nav aria-label="Wiki navigation">'+a('Theology Wiki',reader('home'))+a('Latest','../latest/index.html')+a('Cross-reference matrix','#cross-reference-matrix-alternative-inheritances')+a('Connection explorer',reader('connections'))+'</nav></header><main id="main"><p class="edition">Dated editorial guide · '+Math.ceil(source.split(/\s+/).length/220)+' minute read · '+a('Source Markdown',cfg.source)+'</p><details class="contents" open><summary>In this guide</summary><ol>'+r.headings.filter(h=>h.level===2).map(h=>'<li>'+a(h.title,'#'+h.id)+'</li>').join('')+'</ol></details><article class="prose">'+html+'</article>'+links+'</main><footer><p>A navigation edge identifies a question, not proof of descent. Original conversations retain their own speaker attribution and dates.</p><p>'+a('Build, source and verification notes','README.md')+'</p></footer></body></html>\n';
 const search=r.sections.map(s=>({title:cfg.title,heading:s.heading,url:cfg.slug+'.html#'+s.anchor,text:s.text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g,'$2').replace(/\[([^\]]+)\]\([^\s]+\)/g,'$1').replace(/[*`]/g,'').replace(/\s+/g,' ').trim()}));
 const data={...cfg,connections:cfg.connections.map(c=>({...c,html:renderer.render(c.context).html})),search};
 const outputs={[cfg.slug+'.html']:body,'index.html':body,'search-index.json':JSON.stringify(search,null,2)+'\n','reader-links.js':'window.ALTERNATIVE_INHERITANCES='+JSON.stringify(data).replace(/</g,'\\u003c')+';\n'+fs.readFileSync(path.join(ROOT,'reader-extension.js'),'utf8')};
 outputs['build-report.json']=JSON.stringify({schema:1,source:cfg.source,sourceSha256:hash(source),baseRevision:cfg.baseRevision,words:source.split(/\s+/).length,sections:search.length,reciprocalConnections:cfg.connections.length,matrixRows:cfg.matrix.length,wikilinks:[...renderer.wikilinks].sort(),outputs:Object.entries(outputs).map(([p,s])=>({path:p,sha256:hash(s)}))},null,2)+'\n';
 for(const [p,s] of Object.entries(outputs)){const f=path.join(ROOT,p);if(check){if(fs.readFileSync(f,'utf8')!==s)throw Error('Stale '+p);}else fs.writeFileSync(f,s);}
 for(const p of ['../index.html','../san-reader.html']){const f=path.join(ROOT,p),old=fs.readFileSync(f,'utf8'),updated=integrate(old);if(check){if(old!==updated)throw Error('Missing integration '+p);}else fs.writeFileSync(f,updated);}
 return {words:source.split(/\s+/).length,sections:search.length,connections:cfg.connections.length,matrixRows:cfg.matrix.length};
}
if(require.main===module)console.log(JSON.stringify(build(process.argv.includes('--check'))));
module.exports={build,integrate,stripIntegration,tag};
