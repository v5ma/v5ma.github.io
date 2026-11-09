/* Dated editorial bridges. Do not edit or insert text into archived speaker turns. */
(function(){
'use strict';
const cfg=window.ALTERNATIVE_INHERITANCES;if(!cfg)return;
const base='./alternative-inheritances-20261109/',guide=base+cfg.slug+'.html';
const labels=Object.fromEntries(cfg.connections.map(c=>[c.slug,c.label]));
function link(label,url){const a=document.createElement('a');a.textContent=label;a.href=url;return a;}
function reader(slug){return './san-reader.html?page='+encodeURIComponent(slug);}
function remove(){document.querySelectorAll('[data-inheritance-bridge]').forEach(n=>n.remove());}
function apply(page){
 remove();const c=cfg.connections.find(x=>x.slug===page?.slug),body=document.getElementById('article-body');if(!c||!body)return;
 const note=document.createElement('aside');note.id='inheritance-context';note.dataset.inheritanceBridge='context';note.className='research-callout';note.setAttribute('aria-label','Editorial connection, November 9, 2026');
 const title=document.createElement('h3');title.textContent='Connected question: '+c.relationship;
 const date=document.createElement('p');date.className='research-small';date.textContent='Editorial addition · November 9, 2026 · Separate from the original article or conversation';
 const prose=document.createElement('div');prose.innerHTML=c.html;for(const a of prose.querySelectorAll('a')){const u=new URL(a.href,location.href);if(u.pathname.includes('/theology-wiki/san-reader.html'))a.href=reader(u.searchParams.get('page'));}
 const ref=document.createElement('p');ref.append(link('Read the source-based comparison and its limits',guide+'#'+c.section));note.append(title,date,prose,ref);
 // Developed article headings are stable editorial anchors. Conversation records get an outside panel.
 const heading=c.heading?[...body.querySelectorAll('h2,h3')].find(h=>h.textContent.trim()===c.heading&&!h.closest('#source-transcript')):null;
 if(heading){let next=heading.nextElementSibling;while(next&&!/^H[23]$/.test(next.tagName))next=next.nextElementSibling;if(next)next.before(note);else heading.parentElement.append(note);}else body.append(note);
 const panel=document.createElement('details');panel.id='inheritance-matrix';panel.dataset.inheritanceBridge='matrix';panel.className='research-callout';
 const summary=document.createElement('summary');summary.textContent='Threaded conversations: Alternative Inheritances';panel.append(summary);
 const intro=document.createElement('p');intro.textContent='Follow a two-way route. The relationship label states what is being compared; it does not establish a historical genealogy.';panel.append(intro);
 const list=document.createElement('ul');
 for(const row of cfg.matrix){const item=document.createElement('li'),strong=document.createElement('strong');strong.textContent=row.type+': ';item.append(strong,link(labels[row.from],reader(row.from)),document.createTextNode(' ↔ '),link(labels[row.to],reader(row.to)));const limit=document.createElement('p');limit.textContent=row.limit;item.append(limit);list.append(item);}panel.append(list,link('Open the full matrix and source notes',guide+'#cross-reference-matrix-alternative-inheritances'));body.append(panel);
}
function search(){const input=document.getElementById('page-search');if(!input)return;let box=document.getElementById('inheritance-search-results');const terms=input.value.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean),rows=terms.length?cfg.search.filter(s=>terms.every(t=>(s.heading+' '+s.text).toLocaleLowerCase().includes(t))).slice(0,4):[];
 if(!rows.length){box?.remove();return;}if(!box){box=document.createElement('section');box.id='inheritance-search-results';box.setAttribute('aria-label','Alternative inheritances full-text matches');input.parentElement.insertAdjacentElement('afterend',box);}box.replaceChildren();const h=document.createElement('h3');h.textContent='Alternative inheritances: full-text matches';box.append(h);for(const row of rows){const p=document.createElement('p');p.append(link(row.heading,base+row.url));box.append(p);}const small=document.createElement('small');small.textContent='Supplemental guide results, separate from main-reader filters.';box.append(small);
}
// Conversation cards may finish after the page event. Reconcile only the separate
// panels after a body replacement; never observe or change individual speaker turns.
let selected=null,loading=false,observer=null,watched=null,queued=false;
function reconcile(){queued=false;if(loading)return;const page=selected||window.TheologyReader?.current(),body=document.getElementById('article-body');if(!body)return;const c=cfg.connections.find(x=>x.slug===page?.slug);if(c&&body.querySelector('#inheritance-context')&&body.querySelector('#inheritance-matrix'))return;if(!c&&!body.querySelector('[data-inheritance-bridge]'))return;apply(page);}
function watch(){const body=document.getElementById('article-body');if(!body||body===watched)return;observer?.disconnect();watched=body;observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(reconcile);}});observer.observe(body,{childList:true});}
function ready(){selected=window.TheologyReader?.current();loading=false;watch();apply(selected);search();}
window.addEventListener('theology:loading',()=>{loading=true;selected=null;remove();});window.addEventListener('theology:page',e=>{selected=e.detail;loading=false;watch();apply(selected);});window.addEventListener('theology:ready',ready);document.addEventListener('input',e=>{if(e.target.id==='page-search')search();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
