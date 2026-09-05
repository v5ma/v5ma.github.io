/* Reader-depth edition. All requests are same-origin public source material. */
(() => {
'use strict';
const C=window.TheologyResearchCore,esc=C.esc,$=s=>document.querySelector(s);
const current=()=>window.TheologyReader?.current(),pages=()=>window.TheologyReader?.pages()||[];
const url=(slug,turn)=>'?page='+encodeURIComponent(slug)+(turn?'&turn='+turn+'#source-transcript':'');
const link=(slug,label,turn)=>`<a data-page="${esc(slug)}" href="${url(slug,turn)}">${esc(label||pages().find(p=>p.slug===slug)?.title||slug)}</a>`;
let data=null,relations=null;const controllers=new Map(),sourceCache=new Map();
const ready=Promise.all(['depth','relationships'].map(name=>fetch('./data/'+name+'.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(name+' unavailable');return r.json();}))).then(([d,r])=>{data=d;relations=r;return true;}).catch(()=>false);
function shell(){
 const strip=$('.wiki-family-strip');if(!strip)return;
 strip.setAttribute('aria-label','Theology library');
 strip.innerHTML=link('home','Library')+link('sources-index','Conversations')+link('reading-paths','Reading paths')+`<details class="depth-site-menu"><summary>More</summary><div>${link('connections','Connections')}${link('forecast-ledger','Forecast register')}${link('glossary','Glossary')}${link('image-collection','Image credits')}${link('research-method','Editorial method')}<a href="../index.html">All projects</a><a href="./index.html">Legacy reader</a></div></details>`;
 const hero=$('.hero .hero-text');if(hero)hero.hidden=true;
 const name=$('.hero h1');if(name)name.innerHTML=link('home','Theology Wiki');
}
function home(body,info){
 const featured=(data?.featured||['apocalyptic-repair-theology','trump-first-beast-of-revelation','jesus-teacher-of-righteousness-hypothesis']).map(s=>pages().find(p=>p.slug===s)).filter(Boolean);
 body.innerHTML=`<section class="depth-home-intro"><p class="depth-eyebrow">Inheritance. Authority. Transformation. Repair.</p><h2 id="depth-start" tabindex="-1">Begin with a question.</h2><p>Explore Micah Blumberg's theology through developed arguments and the conversations behind them.</p></section><div class="research-cards depth-featured">${featured.map(p=>`<article class="research-card"><p class="depth-eyebrow">${esc(p.slug==='apocalyptic-repair-theology'?'How do we repair?':p.slug==='trump-first-beast-of-revelation'?'When does authority become domination?':'What survives a teacher?')}</p><h3>${link(p.slug,p.title)}</h3><p>${esc(p.summary)}</p></article>`).join('')}</div><section class="depth-route-banner"><h3>${link('guide-to-the-inquiry','How these questions connect')}</h3><p>Follow the thread from sacred inheritance to moral authority, inward change and practical repair.</p><div>${link('reading-paths','Choose a reading path')}${link('glossary','Look up a term')}</div></section><section class="depth-library"><h3>Continue the inquiry</h3><div class="depth-article-index">${pages().filter(p=>p.kind==='Developed article'&&!featured.some(f=>f.slug===p.slug)).map(p=>`<p>${link(p.slug,p.title)}<span>${esc(p.summary)}</span></p>`).join('')}</div></section><section class="depth-subjects"><h3>Browse a subject</h3>${(info?.categories||[]).map(c=>link('topic-'+c.id,c.title)).join('')}</section><footer class="depth-home-footer"><p>${info?.developedCount||14} developed articles. ${info?.sourceCount||354} preserved conversations. ${link('sources-index','Search the conversation archive')}.</p><p>Editorial synthesis is distinguished from original voices. ${link('research-method','Read the method')}.</p></footer>`;
}
function foldSources(body){
 const heading=[...body.querySelectorAll('h2,h3')].find(h=>h.textContent==='Source conversations');if(!heading)return;
 const notes=document.createElement('details');notes.className='depth-source-notes';notes.innerHTML='<summary>Sources and editorial notes</summary>';
 heading.before(notes);let node=heading;while(node){const next=node.nextSibling;notes.append(node);node=next;}
}
function explain(p,body){
 const rows=(relations?.edges||[]).filter(r=>r.from===p.slug&&r.type!=='source');
 const anchors=(relations?.anchors||[]).filter(r=>r.from===p.slug);
 if(rows.length){
  const host=document.createElement('section');host.className='depth-relationships';host.setAttribute('aria-label','Explained relationships');
  const card=r=>`<article><span class="research-badge">${esc(r.type)}</span><h3>${link(r.to)}</h3><p>${esc(r.why)}</p></article>`;
  host.innerHTML='<h2>Why these ideas connect</h2>'+rows.slice(0,3).map(card).join('')+(rows.length>3?'<details><summary>More relationships</summary>'+rows.slice(3).map(card).join('')+'</details>':'');
  const notes=body.querySelector('.depth-source-notes');if(notes)notes.before(host);else body.append(host);
 }
 if(anchors.length){
  const host=document.createElement('section');host.className='depth-author-anchors';host.innerHTML='<h3>The original author turns</h3><p>These links open the exact source turn. A user turn can contain pasted quotations.</p>'+anchors.map(a=>`<p>${link(a.to,'Read turn '+a.turn,a.turn)}<span>${esc(a.why)}</span></p>`).join('');
  const notes=body.querySelector('.depth-source-notes');if(notes)notes.prepend(host);else body.append(host);
 }
}
function chronology(body){
 const heading=[...body.querySelectorAll('h2,h3')].find(h=>h.textContent==='Working chronology');if(!heading||!data)return;
 const extra=[
  {date:'Relative intervals',layer:'Textual constraint',title:'Galatians 1 and 2',account:'Persecution, revelation and visits to named leaders appear in Paul\'s account. The absolute 37-50 CE range is not supplied by these passages alone.',external:'https://ebible.org/engwebp/GAL01.htm'},
  {date:'Living memory',layer:'Textual constraint',title:'1 Corinthians 15:3-8',account:'The statement that many witnesses remain alive requires its own explanation in an early-founder reconstruction. Community survival alone does not resolve it.',external:'https://ebible.org/engwebp/1CO15.htm'},
  {date:'Material and copying',layer:'Manuscript-dating distinction',title:'The 2025 Enoch study',account:'The study estimates manuscript dates from radiocarbon and handwriting. It does not identify the Teacher or date a death.',external:'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0323185'}
 ];
 const rows=[...data.chronology,...extra],host=document.createElement('section');host.id='depth-chronology';
 host.innerHTML='<p class="depth-chronology-intro">Proposed dates and textual constraints are separate layers. The sequence below is the author\'s reconstruction, not a merged historical timeline.</p><label>Show a layer<select id="chronology-layer"><option value="all">All layers</option><option value="proposal">Proposed sequence</option><option value="constraint">Textual and manuscript constraints</option><option value="arithmetic">Elapsed-time calculation</option></select></label><p id="chronology-count" role="status" class="research-small"></p><div class="depth-timeline"></div>';
 const prose=document.createElement('details');prose.className='depth-chronology-prose';prose.innerHTML='<summary>Read the proposed sequence as prose</summary>';
 let n=heading.nextSibling;while(n&&!(n.nodeType===1&&/^H[23]$/.test(n.tagName))){const next=n.nextSibling;prose.append(n);n=next;}
 heading.after(host);host.after(prose);
 const draw=()=>{const value=host.querySelector('select').value;let shown=rows.filter(c=>value==='all'||(value==='constraint'&&!!c.external)||(value==='arithmetic'&&c.layer.startsWith('Arithmetic'))||(value==='proposal'&&!c.external&&!c.layer.startsWith('Arithmetic')));host.querySelector('#chronology-count').textContent=shown.length+' of '+rows.length+' records';host.querySelector('.depth-timeline').innerHTML=shown.map(c=>`<article class="depth-time-card"><p class="depth-time-date">${esc(c.date)}</p><span class="research-badge">${esc(c.layer)}</span><h3>${esc(c.title)}</h3><p>${esc(c.account)}</p>${c.external?`<a href="${esc(c.external)}" target="_blank" rel="noopener noreferrer">Read the primary source</a>`:link(c.sourceSlug,'Read the proposed source sequence',c.turn)}</article>`).join('');};host.querySelector('select').addEventListener('change',draw);draw();
}
function glossary(body){
 if(!data)return;
 body.innerHTML='<p>These entries explain usage in this collection. Meanings in other texts and traditions may differ.</p><label class="depth-glossary-label">Find a term<input id="glossary-search" type="search" placeholder="Try TOR, coherence or repair"></label><p id="glossary-count" class="research-small" role="status"></p><div id="glossary-results"></div>';
 const draw=()=>{const ts=C.tokens($('#glossary-search').value),found=data.glossary.filter(g=>ts.every(t=>C.tokens(g.term+' '+g.text).includes(t)));$('#glossary-count').textContent=found.length+' of '+data.glossary.length+' terms';$('#glossary-results').innerHTML=found.length?found.map(g=>`<section class="depth-glossary-entry"><h3>${esc(g.term)}</h3><p>${esc(g.text)}</p>${link(g.page,'Read the connected article')}</section>`).join(''):'<p>No terms match. Try another word.</p>';};$('#glossary-search').addEventListener('input',draw);draw();
}
async function enhance(p,info){
 await ready;if(current()?.slug!==p.slug)return;
 const body=$('#article-body');if(!body)return;
 if(p.slug==='home')home(body,info);
 if(p.sourceFile){const summary=$('#article-summary');if(summary)summary.textContent='Read the preserved conversation, filter by speaker, or open the source file. Dates identify export metadata, not every later turn.';}
 if(p.kind==='Developed article'){foldSources(body);explain(p,body);}
 if(p.slug==='jesus-teacher-of-righteousness-hypothesis')chronology(body);
 if(p.slug==='glossary')glossary(body);
 document.querySelectorAll('.wiki-family-strip a[aria-current]').forEach(a=>a.removeAttribute('aria-current'));
 document.querySelector(`.wiki-family-strip a[data-page="${p.slug}"]`)?.setAttribute('aria-current','page');
 body.dataset.depthReady=p.slug;
}
function edge(from,to){return relations?.edges.find(r=>r.from===from&&r.to===to);}
function graphEdges(slug){return (relations?.edges||[]).filter(r=>r.from===slug||r.to===slug);}
async function snippets(container,matches,query){
 controllers.get(container)?.abort();const controller=new AbortController();controllers.set(container,controller);
 const items=[...container.querySelectorAll('[data-excerpt-slug]')].slice(0,6);
 await Promise.all(items.map(async target=>{
  const match=matches.get(target.dataset.excerptSlug),p=pages().find(p=>p.slug===match?.slug);if(!p?.sourceFile)return;
  try{
   let parsed=sourceCache.get(p.sourceFile);
   if(!parsed){
    const r=await fetch('../theology-sources/chats/'+encodeURIComponent(p.sourceFile),{signal:controller.signal});if(!r.ok)return;
    const bytes=await r.arrayBuffer();if(bytes.byteLength!==p.sourceBytes)return;
    if(crypto.subtle){const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==p.sourceSha256)return;}
    parsed=C.splitTranscript(new TextDecoder().decode(bytes));if(sourceCache.size>=8)sourceCache.delete(sourceCache.keys().next().value);sourceCache.set(p.sourceFile,parsed);
   }
   const t=parsed[match.turn-1];if(controller.signal.aborted||!target.isConnected||!t)return;
   target.textContent=C.snippet(t.text,query);target.dataset.verified='true';
  }catch{/* The linked preview remains usable if a source request fails. */}
 }));
}
function moreTools(){const d=$('#reader-more-tools');if(d)d.open=true;}
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-depth]');if(button?.dataset.depth==='share'){
  const page=current();if(!page)return;const address=new URL(location.href);address.searchParams.delete('q');address.searchParams.delete('speaker');
  let result=$('#depth-share-result');if(!result){result=document.createElement('div');result.id='depth-share-result';result.setAttribute('role','status');$('#research-actions')?.append(result);}
  try{await navigator.clipboard.writeText(address.href);result.textContent='Page link copied.';}catch{result.innerHTML='<label>Copy this page link<input type="text" readonly aria-label="Page link"></label>';const input=result.querySelector('input');input.value=address.href;input.focus();input.select();}
 }
 if(event.target.closest('.skip-link')&&current()?.slug==='home'){event.preventDefault();$('#depth-start')?.focus();$('#depth-start')?.scrollIntoView({block:'start'});return;}
 const a=event.target.closest('a[href^="#"]');if(a){const target=document.getElementById(a.getAttribute('href').slice(1));for(let node=target?.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;}
 if(event.target.closest('.wiki-family-strip a'))document.querySelectorAll('.depth-site-menu').forEach(d=>d.open=false);
});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();const toggle=$('#mobile-nav-toggle');if(toggle&&getComputedStyle(toggle).display!=='none'&&toggle.getAttribute('aria-expanded')!=='true')toggle.click();$('#page-search')?.focus();}if(event.key==='Escape')document.querySelectorAll('.depth-site-menu[open]').forEach(d=>d.open=false);});
const printOpen=[];window.addEventListener('beforeprint',()=>{document.querySelectorAll('.depth-source-notes,.depth-chronology-prose').forEach(d=>{if(!d.open){printOpen.push(d);d.open=true;}});});window.addEventListener('afterprint',()=>{printOpen.splice(0).forEach(d=>d.open=false);});
window.addEventListener('theology:loading',()=>{for(const c of controllers.values())c.abort();controllers.clear();});
window.TheologyDepth={ready,shell,enhance,edge,graphEdges,snippets,moreTools};
shell();
})();
