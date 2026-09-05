/* Theology-only enhancements around the existing SAN reader. No accounts or external scripts. */
(() => {
'use strict';
const C=window.TheologyResearchCore,esc=C.esc,$=s=>document.querySelector(s),key='theology:reading:v2';
const reader=()=>window.TheologyReader,pages=()=>reader()?.pages()||[],href=s=>'?page='+encodeURIComponent(s);
const a=(s,label)=>`<a href="${href(s)}" data-page="${esc(s)}">${esc(label||pages().find(p=>p.slug===s)?.title||s)}</a>`;
let info=null,full=null,fullPromise=null,sourceAbort=null,renderTicket=0,sourceTurns=[],activeSource=null,turnLimit=16,navLimit=40,catalogLimit=30,storageOK=true;
let preferences={version:1,saved:[]};
try{const p=JSON.parse(localStorage.getItem(key)||'null');if(p?.version===1&&Array.isArray(p.saved))preferences.saved=p.saved.filter(x=>typeof x==='string').slice(0,2000);}catch{storageOK=false;}
const announce=text=>{let el=$('#theology-status');if(!el){el=document.createElement('p');el.id='theology-status';el.setAttribute('role','status');el.className='research-sr';document.body.append(el);}el.textContent=text;};
function save(){try{localStorage.setItem(key,JSON.stringify(preferences));}catch{storageOK=false;announce('Storage is unavailable. This reading list is session-only; export it to keep it.');}}
const infoPromise=fetch('./data/research.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Research index unavailable');return r.json();}).then(x=>{info=x;reader()?.refresh();return x;}).catch(e=>{announce(e.message);return null;});
let mediaPromise=null;
function media(){return mediaPromise??=(fetch('./data/media.json').then(r=>r.ok?r.json():[]).catch(()=>[]));}
function ensureFull(){
 if(fullPromise)return fullPromise;
 fullPromise=fetch('./data/search.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Full-text index unavailable');return r.json();}).then(x=>{full=x;reader()?.refresh();if(reader()?.current()?.slug==='sources-index')renderCatalogue();announce('Full conversation text is now included in search.');return x;}).catch(()=>{fullPromise=null;announce('Full-text search could not load. Title and summary search remain available.');const s=$('#search-scope');if(s)s.textContent='Title/summary search only; full-text index could not load.';return null;});
 return fullPromise;
}
function initControls(){
 if($('#theology-kind'))return;
 const search=$('#page-search');if(!search)return;
 const wrapper=document.createElement('div');wrapper.className='research-filters';
 wrapper.innerHTML=`<label>Browse<select id="theology-kind"><option value="featured">Featured arguments</option><option value="all">All pages</option><option value="article">Developed articles</option><option value="chat">Source conversations</option><option value="saved">Saved pages</option></select></label><label>Topic<select id="theology-topic"><option value="">Every topic</option></select></label><label>Sort<select id="theology-sort"><option value="relevance">Relevance / A-Z</option><option value="title">Title A-Z</option><option value="date">Newest conversation</option><option value="linked">Most incoming links</option></select></label><p id="search-scope" class="research-small">Search titles and summaries. Full discussion text loads when you search.</p><button type="button" data-research="reset">Reset search and filters</button>`;
 search.after(wrapper);search.placeholder='Search ideas or conversation text';search.setAttribute('aria-label','Search the Theology library');
 for(const select of wrapper.querySelectorAll('select'))select.addEventListener('change',()=>{navLimit=40;reader()?.refresh();});
 infoPromise.then(d=>{if(d)$('#theology-topic').innerHTML='<option value="">Every topic</option>'+d.categories.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('');});
 search.addEventListener('input',()=>{navLimit=40;const q=search.value.trim();if(q)ensureFull();const u=new URL(location.href);if(q)u.searchParams.set('q',q);else u.searchParams.delete('q');history.replaceState({},'',u.pathname+u.search+u.hash);});
 const strip=$('.wiki-family-strip');
 if(strip){const links=document.createElement('span');links.className='research-nav-links';links.innerHTML=a('forecast-ledger','Forecast ledger')+a('sources-index','Conversations')+a('reading-paths','Reading paths')+a('image-collection','Images')+a('connections','Connections');strip.append(links);}
}
function navOptions(){return {topic:$('#theology-topic')?.value||'',kind:$('#theology-kind')?.value||'featured',sort:$('#theology-sort')?.value||'relevance',saved:preferences.saved};}
function navigation(list,current,query){
 initControls();const opts=navOptions(),all=C.select(list,query,opts,full);let visible=all.slice(0,navLimit);
 const linkItem=p=>`<li><a class="page-link page-no-thumbnail${current?.slug===p.slug?' active':''}" href="${href(p.slug)}" data-page="${esc(p.slug)}"${current?.slug===p.slug?' aria-current="page"':''}><span class="page-link-text"><span class="page-title">${esc(p.title)}</span><small class="page-meta">${esc(p.claimType||p.kind)}${p.featured?' / New investigation':''}${p.date?' / '+p.date:''}${preferences.saved.includes(p.slug)?' / Saved':''}</small></span></a></li>`;
 let html=visible.map(linkItem).join('');
 if(!query&&opts.kind==='featured'&&!opts.topic&&info){html='<li class="research-nav-label">Developed from the discussions</li>'+html+'<li class="research-nav-label">Browse by subject</li>'+info.categories.map(c=>`<li class="research-topic-link">${a('topic-'+c.id,c.title)}<small>${list.filter(p=>p.category===c.id&&p.sourceFile).length} conversations</small></li>`).join('');}
 if(!visible.length)html='<li class="research-empty">No matching pages. Try fewer words or reset the filters.</li>';
 if(all.length>visible.length)html+=`<li><button data-research="more-nav" type="button">Show ${Math.min(40,all.length-visible.length)} more</button></li>`;
 if($('#page-list'))$('#page-list').innerHTML=html;
 if($('#page-list-status'))$('#page-list-status').textContent=`${visible.length} of ${all.length} ${query?'matching ':''}pages`;
 const scope=$('#search-scope');if(scope)scope.textContent=query?(full?'Search covers complete source conversations and reader articles. All keywords must match.':'Searching titles and summaries; loading full discussion index...'):'Search titles and summaries. Full discussion text loads when you search.';
 if(query&&!full)ensureFull();
}
function topActions(page){
 const anchor=$('.article-header')||$('#article-summary');if(!anchor)return;
 $('#research-actions')?.remove();
 const div=document.createElement('section');div.id='research-actions';div.className='research-actions';div.setAttribute('aria-label','Page tools');
 const saved=preferences.saved.includes(page.slug);
 div.innerHTML=`<div class="research-labels"><span class="research-badge">${esc(page.kind||'Research note')}</span>${page.claimType?`<span class="research-badge claim-type">${esc(page.claimType)}</span>`:''}${page.date?`<span>Conversation: ${esc(page.date)} UTC</span>`:''}${page.readMinutes?`<span>${page.readMinutes} minute read</span>`:''}</div><div class="research-buttons"><button data-research="save" data-slug="${page.slug}" type="button" aria-pressed="${saved}">${saved?'Saved':'Save page'}</button><a href="./content/${esc(page.path)}" download>Markdown source</a><a href="${href('connections')}&focus=${encodeURIComponent(page.slug)}">View connections</a><button type="button" data-research="print">Print</button><button type="button" data-research="export">Export reading list</button><button type="button" data-research="restore">Restore reading list</button><input type="file" id="reading-restore" accept="application/json,.json" hidden></div>${!storageOK?'<p class="research-small">Storage unavailable: saved pages last only for this session. Export them to keep a copy.</p>':''}`;
 anchor.after(div);
}
function backlinks(page){
 $('#research-backlinks')?.remove();const list=(info?.backlinks[page.slug]||[]).filter(s=>s!=='home');
 const rail=$('.context-panel')||$('.article-panel');if(!rail)return;
 const section=document.createElement('section');section.id='research-backlinks';section.className='research-backlinks';section.innerHTML=`<h3>Linked from ${list.length} pages</h3>${list.length?`<ul>${list.slice(0,8).map(s=>`<li>${a(s)}</li>`).join('')}</ul>${list.length>8?`<details><summary>${list.length-8} more incoming links</summary><ul>${list.slice(8).map(s=>`<li>${a(s)}</li>`).join('')}</ul></details>`:''}`:'<p class="research-small">No incoming reader links yet.</p>'}`;rail.append(section);
}
function sourceCard(p){
 const url='../theology-sources/chats/'+encodeURIComponent(p.sourceFile);
 return `<section class="source-record"><div class="source-record-heading"><span class="research-badge">Original conversation</span><span>${p.turnCount} top-level turns / ${esc(p.date||'Undated')} UTC</span></div><h3>The question in the source</h3><p class="source-excerpt">${esc(p.primaryExcerpt||p.summary)}</p><div class="research-buttons"><button data-research="load-source" type="button">Read the full conversation</button><a href="${url}" target="_blank" rel="noopener noreferrer">Open original text file</a>${a('topic-'+p.category,'Browse this topic')}</div><details><summary>Source integrity and attribution</summary><p>The original ${p.sourceBytes.toLocaleString()} bytes are preserved. The display separates top-level export speakers; a user turn can contain pasted AI text or quoted material. Dates come from export metadata, not an independent priority record.</p><p>SHA-256: <code>${esc(p.sourceSha256)}</code></p></details><div id="source-transcript"></div></section>`;
}
function cards(list){return `<div class="research-cards">${list.map(p=>`<article class="research-card"><span class="research-small">${esc(p.claimType||p.kind)}${p.featured?' / New investigation':''}${p.date?' / '+p.date:''}</span><h3>${a(p.slug,p.title)}</h3><p>${esc(p.summary)}</p></article>`).join('')}</div>`;}
async function onPage(p){
 const ticket=++renderTicket;await infoPromise;if(ticket!==renderTicket||reader()?.current()?.slug!==p.slug)return;
 topActions(p);backlinks(p);
 // The shared shell's unrelated product routers do not belong in Theology.
 for(const id of ['northstar-cluster-list','wave-absorption-read-next-list','page-companion-route-list','graph-json-read-next-list','fit-candidate-list','product-graph-read-next-list']){
  const list=document.getElementById(id);if(list){list.hidden=true;const label=list.previousElementSibling;if(label?.classList.contains('panel-label'))label.hidden=true;}
 }
 const sequence=$('#article-navigation'),path=info?.paths.find(x=>x.pages.includes(p.slug));
 if(sequence){sequence.hidden=!path;sequence.innerHTML=path?'<div class="article-navigation-context"><span>'+esc(path.title)+'</span><span>'+(path.pages.indexOf(p.slug)+1)+' of '+path.pages.length+'</span></div><div class="research-buttons">'+path.pages.filter((s,i)=>Math.abs(i-path.pages.indexOf(p.slug))===1).map(s=>a(s)).join('')+'</div>':'';}

 const body=$('#article-body');if(!body)return;
 if(p.sourceFile){body.innerHTML=sourceCard(p);const cited=pages().filter(x=>x.references?.some(s=>s.slug===p.slug));if(cited.length){const s=document.createElement('section');s.className='research-section';s.innerHTML='<h3>Developed from this discussion</h3>'+cards(cited);body.append(s);}if(new URLSearchParams(location.search).has('turn'))loadSource(p);}
 if(p.slug==='home'){
  const intro=document.createElement('section');intro.className='research-welcome';intro.innerHTML=`<div><span class="research-kicker">From the conversations</span><h3>Ideas worth following.</h3><p>Not just a list of exports. Explore an argument, follow its sources, and see where the conversation changes direction.</p></div><div class="research-counts"><span><b>${info?.developedCount||8}</b>developed articles</span><span><b>${info?.sourceCount||354}</b>source conversations</span><span><b>${info?.categories.length||8}</b>topic collections</span></div>`;body.prepend(intro);
  // Keep generated Markdown accessible; the first article section becomes browsable cards.
  const heading=[...body.querySelectorAll('h2, h3')].find(h=>h.textContent==='Ideas developed from the conversations');
  if(heading){let n=heading.nextElementSibling;while(n&&n.tagName!==heading.tagName){const next=n.nextElementSibling;n.remove();n=next;}heading.insertAdjacentHTML('afterend',cards(pages().filter(x=>x.kind==='Developed article').sort((a,b)=>Number(!!b.featured)-Number(!!a.featured))));}
 }
 if(p.slug==='sources-index'){const host=document.createElement('section');host.id='source-catalogue';host.className='research-section';host.innerHTML=`<h2>Conversation catalogue</h2><div class="catalogue-controls"><label>Search the full discussions<input id="catalogue-search" type="search" placeholder="Try coherence, compassion, or Temple"></label><label>Topic<select id="catalogue-topic"><option value="">Every topic</option>${(info?.categories||[]).map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label><label>Order<select id="catalogue-sort"><option value="title">Title A-Z</option><option value="date">Newest conversation</option><option value="relevance">Relevance</option></select></label></div><p id="catalogue-count" class="research-small" role="status"></p><div id="catalogue-results"></div>`;body.append(host);catalogLimit=30;renderCatalogue();}
 if(p.slug==='connections')renderGraph();
 if(p.slug==='forecast-ledger')await renderLedger(p,ticket);
 if(p.slug==='image-collection'){
  const entries=await media();if(ticket!==renderTicket)return;
  const gallery=document.createElement('section');gallery.className='research-gallery';gallery.innerHTML=entries.length?entries.map(m=>figure(m,true)).join(''):'<p>Image records could not load. Reload the page to retry.</p>';body.append(gallery);bindImages();
 }else if(p.art){const entries=await media();if(ticket!==renderTicket)return;const item=entries.find(x=>x.id===p.art);if(item){const wrapper=document.createElement('div');wrapper.innerHTML=figure(item,false);body.prepend(wrapper.firstElementChild);bindImages();}}
 if(p.kind==='Developed article'){const line=document.createElement('details');line.className='research-attribution';line.innerHTML='<summary>About this article</summary><p>'+esc(p.attribution)+'</p>';$('#research-actions')?.append(line);}
 body.querySelectorAll('a[href]').forEach(link=>{if(/^https:\/\//.test(link.getAttribute('href'))){link.rel='noopener noreferrer';}});
 const title=$('#article-title');if(title)title.tabIndex=-1;
 announce((p.title||p.slug)+' loaded.');
}
function renderCatalogue(){
 const host=$('#catalogue-results');if(!host)return;
 const q=$('#catalogue-search')?.value||'',topic=$('#catalogue-topic')?.value||'',sort=$('#catalogue-sort')?.value||'title';
 const hits=C.select(pages(),q,{topic,kind:'chat',sort},full);
 $('#catalogue-count').textContent=`${hits.length} conversations. Showing ${Math.min(hits.length,catalogLimit)}.${q&&!full?' Loading full-text search...':''}`;
 host.innerHTML=hits.length?cards(hits.slice(0,catalogLimit))+(hits.length>catalogLimit?'<button type="button" data-research="more-catalogue">Show more conversations</button>':''):'<p>No conversations match these filters.</p>';
 if(q&&!full)ensureFull();
}
async function loadSource(p){
 if(!C.safeSourceFile(p.sourceFile))return;
 const host=$('#source-transcript');if(!host)return;
 sourceAbort?.abort();const controller=new AbortController();sourceAbort=controller;host.innerHTML='<p role="status">Loading and checking original conversation...</p>';
 try{
  const response=await fetch('../theology-sources/chats/'+encodeURIComponent(p.sourceFile),{signal:controller.signal});if(!response.ok)throw Error('Source returned '+response.status);
  const bytes=await response.arrayBuffer();if(bytes.byteLength>10*1024*1024)throw Error('Source is unexpectedly large.');
  if(crypto.subtle){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==p.sourceSha256)throw Error('Source hash differs from the recorded manifest.');}
  if(controller.signal.aborted||reader()?.current()?.slug!==p.slug)return;
  activeSource=p;sourceTurns=C.splitTranscript(new TextDecoder().decode(bytes));turnLimit=16;
  const requested=Number(new URLSearchParams(location.search).get('turn'));if(Number.isInteger(requested)&&requested>0&&requested<=sourceTurns.length)turnLimit=Math.max(turnLimit,requested);
  host.innerHTML=`<h3>Original conversation</h3><p class="research-small">Top-level speaker labels are preserved. Quoted or pasted dialogue inside a turn stays inside that turn.</p><div class="transcript-controls"><label>Find within this conversation<input id="turn-search" type="search" placeholder="Search words in the original text"></label><label>Speaker<select id="turn-speaker"><option value="all">Both speakers</option><option value="Micah Blumberg">Micah Blumberg</option><option value="Self Aware Networks GPT">AI replies</option></select></label></div><p id="turn-count" role="status" class="research-small"></p><div id="turn-list"></div>`;
  renderTurns();if(requested){requestAnimationFrame(()=>{const target=document.getElementById('turn-'+requested);if(target){target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start'});}});}announce('Original conversation loaded.');
 }catch(e){if(e.name!=='AbortError'&&reader()?.current()?.slug===p.slug)host.innerHTML='<p class="wiki-error">'+esc(e.message)+'</p><button type="button" data-research="load-source">Retry loading the conversation</button>';}
}
function renderTurns(){
 const list=$('#turn-list');if(!list)return;
 const q=$('#turn-search')?.value||'',speaker=$('#turn-speaker')?.value||'all',matches=C.filterTurns(sourceTurns,q,speaker);
 $('#turn-count').textContent=`${matches.length} matching turns; showing ${Math.min(turnLimit,matches.length)}.`;
 list.replaceChildren();
 for(const turn of matches.slice(0,turnLimit)){
  const item=document.createElement('article');item.className='chat-turn '+(turn.speaker==='Micah Blumberg'?'chat-owner':'chat-assistant');item.id='turn-'+turn.number;
  const header=document.createElement('header'),name=document.createElement('strong'),ref=document.createElement('a');name.textContent=turn.speaker;ref.textContent='Turn '+turn.number;ref.href=href(activeSource.slug)+'&turn='+turn.number+'#source-transcript';header.append(name,ref);item.append(header);
  const text=document.createElement('div');text.className='chat-text';text.textContent=turn.text.length>5000?turn.text.slice(0,5000):turn.text;item.append(text);
  if(turn.text.length>5000){const more=document.createElement('button');more.type='button';more.textContent='Read the entire turn ('+turn.text.length.toLocaleString()+' characters)';more.addEventListener('click',()=>{text.textContent=turn.text;more.remove();});item.append(more);}
  list.append(item);
 }
 if(matches.length>turnLimit){const b=document.createElement('button');b.type='button';b.dataset.research='more-turns';b.textContent='Show more turns';list.append(b);}
 if(!matches.length)list.textContent='No turns match that search and speaker filter.';
}
function figure(m,large){const src=m.localPath?'./'+m.localPath:'';return `<figure class="research-figure${large?' gallery-figure':''}">${src?`<img src="${esc(src)}" alt="${esc(m.alt||m.title)}" loading="lazy" decoding="async"><p class="image-unavailable" hidden>The image could not load. The museum record and caption remain available.</p>`:'<p>Image not bundled. Open the museum record to inspect the object.</p>'}<figcaption><strong>${esc(m.title||m.fallbackTitle)}</strong><span>${esc(m.artist||'')} ${esc(m.date||'')}</span><p>${esc(m.context)}</p><span>${esc(m.credit||'')} ${esc(m.license||'')}</span><a href="${esc(m.objectURL||'https://www.metmuseum.org/art/collection/search/'+m.objectId)}" target="_blank" rel="noopener noreferrer">Museum record and image credit</a></figcaption></figure>`;}
function bindImages(){$('#article-body')?.querySelectorAll('.research-figure img').forEach(img=>{img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.hidden=false;},{once:true});});}
let ledgerData=null;
async function renderLedger(p,ticket){
 const body=$('#article-body');
 try{
  if(!ledgerData){const r=await fetch('./data/forecast-ledger.json',{cache:'no-store'});if(!r.ok)throw Error('Ledger unavailable');ledgerData=await r.json();}
  if(ticket!==renderTicket||reader()?.current()?.slug!==p.slug)return;
  const section=document.createElement('section');section.id='forecast-explorer';section.className='forecast-explorer research-section';
  section.innerHTML='<h3>Dated records, not claimed successes</h3><p>'+esc(ledgerData.policy)+'</p><div class="catalogue-controls"><label>Find a record<input id="forecast-search" type="search" placeholder="Try fuel, peace or deterrence"></label><label>Record type<select id="forecast-type"><option value="all">All record types</option>'+[...new Set(ledgerData.entries.map(e=>e.recordType))].map(t=>'<option>'+esc(t)+'</option>').join('')+'</select></label><label>Order<select id="forecast-order"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div><div class="research-buttons"><button type="button" data-research="export-forecasts">Export complete source register</button></div><p id="forecast-count" class="research-small" role="status"></p><div id="forecast-results"></div>';
  // Preserve the static source register as a fallback and printable counterpart.
  const details=document.createElement('details');details.className='forecast-static';const summary=document.createElement('summary');summary.textContent='Read the complete static register';details.append(summary);
  while(body.firstChild)details.append(body.firstChild);
  body.append(section,details);drawLedger();
 }catch(e){if(ticket===renderTicket){const note=document.createElement('p');note.className='wiki-error';note.textContent='Interactive ledger could not load. The complete text below is still available.';body.prepend(note);}}
}
function drawLedger(){
 if(!ledgerData||!$('#forecast-results'))return;
 const query=$('#forecast-search').value,kind=$('#forecast-type').value,newest=$('#forecast-order').value==='newest';
 const hits=ledgerData.entries.filter(e=>(kind==='all'||e.recordType===kind)&&C.tokens(query).every(t=>C.normalize([e.title,e.claim,e.mechanism,e.date,e.dateBasis,e.sourceStatus].join(' ')).includes(t))).sort((a,b)=>newest?b.date.localeCompare(a.date):a.date.localeCompare(b.date));
 $('#forecast-count').textContent=hits.length+' of '+ledgerData.entries.length+' records. No outcomes have been scored.';
 const outline=$('#article-outline-list');if(outline)outline.innerHTML=hits.map(e=>'<li><a href="#forecast-'+esc(e.id)+'">'+esc(e.title)+'</a></li>').join('');
 $('#forecast-results').innerHTML=hits.length?hits.map(e=>'<article class="forecast-card" id="forecast-'+esc(e.id)+'"><div class="forecast-meta"><time datetime="'+e.date+'">'+e.date+'</time><span class="research-badge">'+esc(e.recordType)+'</span></div><h3>'+esc(e.title)+'</h3><p>'+esc(e.claim)+'</p><p class="forecast-status">'+esc(e.sourceStatus)+' / '+esc(e.evaluation)+'</p><dl><dt>Date basis</dt><dd>'+esc(e.dateBasis)+'</dd><dt>Horizon</dt><dd>'+esc(e.horizon)+'</dd><dt>Mechanism</dt><dd>'+esc(e.mechanism)+'</dd><dt>Conditions</dt><dd>'+esc(e.conditions)+'</dd><dt>Proposed evaluation</dt><dd>'+esc(e.criterion)+'</dd></dl>'+(e.sourceSlug?'<a href="'+href(e.sourceSlug)+'&turn='+e.turn+'#source-transcript" data-page="'+esc(e.sourceSlug)+'">Read the original author turn</a>':e.sourceURL?'<a href="'+esc(e.sourceURL)+'" target="_blank" rel="noopener noreferrer">Read the dated publication</a>':'<p class="research-small">Source recovery pending. Not a transcript export.</p>')+'</article>').join(''):'<p>No records match. Change the query or record type.</p>';
}
function renderGraph(){
 const body=$('#article-body'),list=pages(),preferred=new URLSearchParams(location.search).get('focus')||'apocalyptic-repair-theology';
 const selected=list.find(p=>p.slug===preferred)||list.find(p=>p.kind==='Developed article');if(!selected)return;
 const host=document.createElement('section');host.id='research-graph';host.className='research-section';body.append(host);
 host.innerHTML=`<label class="graph-label">Explore links around<select id="graph-page">${list.slice().sort((a,b)=>a.title.localeCompare(b.title)).map(p=>`<option value="${p.slug}"${p.slug===selected.slug?' selected':''}>${esc(p.title)}</option>`).join('')}</select></label><div id="graph-canvas"></div>`;drawGraph(selected.slug);
}
function drawGraph(slug){
 const p=pages().find(p=>p.slug===slug);if(!p)return;
 const incoming=info?.backlinks[slug]||[],out=p.related||[],all=[...new Set([...out,...incoming])].filter(s=>s!==slug),shown=all.slice(0,16);let lines='',nodes='';
 shown.forEach((s,i)=>{const angle=2*Math.PI*i/Math.max(1,shown.length)-Math.PI/2,x=300+210*Math.cos(angle),y=280+195*Math.sin(angle),label=pages().find(x=>x.slug===s)?.title||s;lines+=`<line x1="300" y1="280" x2="${x}" y2="${y}"/>`;nodes+=`<a href="${href(s)}" tabindex="0" aria-label="${esc(label)}"><title>${esc(label)}</title><circle cx="${x}" cy="${y}" r="7"/><text x="${x}" y="${y+21}" text-anchor="middle">${esc(label.length>25?label.slice(0,22)+'...':label)}</text></a>`;});
 $('#graph-canvas').innerHTML=`<svg class="research-graph-svg" viewBox="0 0 600 560" role="group" aria-label="Local link neighborhood; complete directional text follows."><g class="graph-lines">${lines}</g><g class="graph-nodes">${nodes}<a href="${href(slug)}"><circle class="graph-center" cx="300" cy="280" r="11"/><text x="300" y="255" text-anchor="middle">${esc(p.title.length>30?p.title.slice(0,27)+'...':p.title)}</text></a></g></svg><p class="research-small">${shown.length} of ${all.length} neighbors drawn. The complete links below retain direction. A link is a reading relationship, not a proof of equivalence.</p><div class="graph-text"><section><h3>This page links to ${out.length} pages</h3>${out.map(s=>'<p>'+a(s)+'</p>').join('')||'<p>No outgoing links.</p>'}</section><section><h3>${incoming.length} pages link here</h3>${incoming.map(s=>'<p>'+a(s)+'</p>').join('')||'<p>No incoming links.</p>'}</section></div>`;
 const u=new URL(location.href);u.searchParams.set('focus',slug);history.replaceState({},'',u.pathname+u.search);
}
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-research]');if(!button)return;const action=button.dataset.research;
 if(action==='save'){const slug=button.dataset.slug;if(!pages().some(p=>p.slug===slug))return;preferences.saved=preferences.saved.includes(slug)?preferences.saved.filter(s=>s!==slug):[...preferences.saved,slug];save();button.textContent=preferences.saved.includes(slug)?'Saved':'Save page';button.setAttribute('aria-pressed',String(preferences.saved.includes(slug)));reader()?.refresh();announce(button.textContent+(storageOK?'':'; session-only storage'));}
 if(action==='more-nav'){navLimit+=40;reader()?.refresh();}
 if(action==='reset'){for(const id of ['theology-topic','page-search'])$('#'+id).value='';$('#theology-kind').value='featured';$('#theology-sort').value='relevance';$('#page-search').dispatchEvent(new Event('input',{bubbles:true}));reader()?.refresh();}
 if(action==='load-source')loadSource(reader().current());
 if(action==='more-turns'){turnLimit+=16;renderTurns();}
 if(action==='more-catalogue'){catalogLimit+=30;renderCatalogue();}
 if(action==='print')window.print();
 if(action==='export-forecasts'&&ledgerData)download(JSON.stringify(ledgerData,null,2),'theology-forecast-ledger.json');
 if(action==='export')download(JSON.stringify(preferences,null,2),'theology-reading-list.json');
 if(action==='restore')$('#reading-restore')?.click();
});
let timer;
document.addEventListener('input',event=>{if(event.target.id==='forecast-search')drawLedger();if(event.target.id==='catalogue-search'){clearTimeout(timer);timer=setTimeout(()=>{catalogLimit=30;renderCatalogue();},180);}if(event.target.id==='turn-search'){turnLimit=16;renderTurns();}});
document.addEventListener('change',async event=>{
 const id=event.target.id;
 if(id==='forecast-type'||id==='forecast-order')drawLedger();
 if(id==='catalogue-topic'||id==='catalogue-sort'){catalogLimit=30;renderCatalogue();}
 if(id==='turn-speaker'){turnLimit=16;renderTurns();}
 if(id==='graph-page')drawGraph(event.target.value);
 if(id==='reading-restore'){
  const file=event.target.files?.[0];if(!file)return;
  try{if(file.size>500000)throw Error('Reading-list file is too large.');const p=C.validateState(JSON.parse(await file.text()),new Set(pages().map(x=>x.slug)));preferences.saved=[...new Set([...preferences.saved,...p.saved])];save();topActions(reader().current());reader()?.refresh();announce('Reading list restored without removing existing saved pages.');}
  catch(e){const note=document.createElement('p');note.className='wiki-error';note.textContent=e.message;$('#research-actions')?.append(note);announce(e.message);}
 }
});
window.addEventListener('theology:loading',()=>{++renderTicket;sourceAbort?.abort();$('#research-actions')?.remove();$('#research-backlinks')?.remove();});
window.addEventListener('theology:page',event=>{onPage(event.detail).catch(e=>announce('Reader tools could not finish: '+e.message));});
window.TheologyExtension={navigation};
initControls();
})();
