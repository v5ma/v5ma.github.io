/* Same-origin book navigation. No accounts, remote models or browser-storage writes. */
(()=>{'use strict';
const pageLink=(slug,label)=>{const a=document.createElement('a');a.href='?page='+encodeURIComponent(slug);a.dataset.page=slug;a.textContent=label;return a;};
const element=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
let pending=null;
const load=()=>pending??=fetch('./data/connected-arguments.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Connected map unavailable');return r.json();}).then(d=>{if(d.schema!=='theology-connected-arguments/v1'||!Array.isArray(d.studies)||!Array.isArray(d.chapters))throw Error('Unrecognized map');return d;}).catch(e=>{pending=null;throw e;});
const diagrams=[
 {id:'carriers',title:'A founder, the carriers and the surviving account',note:'These are proposed historical relationships to investigate, not a measured chronology. Follow each card into its full argument.',nodes:[['jesus-teacher-of-righteousness-hypothesis','Founder identity','Proposed identification: which distinctive life and teaching are being remembered?'],['james-and-contested-succession','Successor authority','Proposed carrier: distinguish family, office and the authority to interpret.'],['onias-egypt-and-priestly-continuity','Institutional branches','Proposed route: communities may preserve different parts of an inheritance.'],['thomas-sayings-and-transmission','Sayings and collection','Textual distinction: a saying, its collection and its surviving copy are different objects.'],['manuscripts-movements-and-survival','Surviving witnesses','Material constraint: what is actually preserved, and through which channel?']],edges:['Founder to successor: a historical relationship requiring evidence.','Successor to branch: a possible transmission route, not proved genealogy.','Branch to collection: an authorship or transmission claim still to establish.','Witness to reconstruction: preserved evidence constrains, but does not dictate, the proposed history.']},
 {id:'dates',title:'Four dates that must not collapse into one',note:'This is a distinction among kinds of dates. It assigns no new historical years and establishes no order of transmission.',nodes:[['parallel-timelines','Narrated event','When does a story place the event? A narrative date is not automatically an independent observation.'],['tor-thomas-and-gnostic-transmission','Composition','When was this form of the work composed? Individual material may have a different history.'],['source-atlas','Surviving copy','When was this object produced? Its age does not by itself date every statement it contains.'],['evidence-workbench','Reception and interpretation','Who preserves or interprets the passage? A quotation through another writer needs its channel identified.']],edges:['Event and composition: related only through an explicit historical argument.','Composition and copy: a surviving witness sets constraints, not an automatic origin date.','Copy and interpretation: preservation and understanding have distinct histories.']},
 {id:'formation',title:'Two corrections inside a constructive process',note:'This is the proposed formative mechanism, not a measured neural pathway or proof that a current AI is conscious.',nodes:[['cognitive-gnosticism','Situation as perceived','Attention and interpretation shape which needs and threats become salient.'],['christ-as-an-inner-model','Interpreted exemplar','The inward model makes possible actions and reasons available for comparison.'],['divine-will-and-self-authorizing-power','Deliberation and conduct','The present desire does not automatically authorize the selected response.'],['apocalyptic-repair-theology','Consequences for others','Correction one: change conduct that fails the represented standard.'],['god-and-our-models-of-god','Revise the interpretation','Correction two: examine whether the represented standard itself concealed harm.']],edges:['Conduct to feedback: assess what the action did, not only what it intended.','Feedback to conduct: change a response in relation to the exemplar.','Feedback to interpretation: revise the model when its reading of care was inadequate.','Revised model to the next situation: formation changes what may be perceived and chosen.']}
];
async function enhance(p){
 const menu=document.querySelector('.depth-site-menu>div');if(menu&&!menu.querySelector('[data-page="connected-arguments"]'))menu.prepend(pageLink('connected-arguments','Book argument map'));
 const body=document.querySelector('#article-body');if(!body||body.dataset.connectedReady===p.slug)return;
 let data;try{data=await load();}catch{
  if(p.slug==='connected-arguments'){const n=element('p','The interactive map could not load. The complete bridge essays, chapter transitions and research questions remain below.','connected-notice');n.setAttribute('role','alert');body.prepend(n);}
  return;
 }
 if(!body.isConnected||window.TheologyReader?.current()?.slug!==p.slug)return;
 const applicable=data.studies.filter(s=>s.upstream.includes(p.slug));
 if(['home','book-contents'].includes(p.slug)){
  const box=element('aside',null,'connected-entry');box.append(pageLink('connected-arguments','Follow the book argument map'),element('p','Four bridge studies connect the historical investigations to inward formation, public power and repair. Each chapter has an inherited question and a next step.'));
  if(p.slug==='home')body.querySelector('.depth-route-banner')?.after(box);else body.prepend(box);
 }else if(applicable.length){
  const box=element('aside',null,'connected-entry');box.append(element('h2','Continue through a connecting argument'));for(const s of applicable){const q=element('p');q.append(pageLink(s.slug,s.title));box.append(q);}body.append(box);
 }
 if(p.slug==='connected-arguments'){
  const host=element('section',null,'connected-workspace');host.id='connected-workspace';host.setAttribute('aria-label','Interactive book argument map');
  host.append(element('h2','Find the next question'));
  const label=element('label','Choose a chapter');label.htmlFor='connected-chapter';const select=element('select');select.id='connected-chapter';for(const c of data.chapters){const o=element('option',c.title);o.value=c.chapter;select.append(o);}label.append(select);host.append(label);
  const detail=element('article',null,'connected-chapter-card');detail.id='connected-chapter-detail';host.append(detail);
  const request=new URLSearchParams(location.search).get('chapter');const found=data.chapters.find(c=>c.chapter===request);select.value=found?.chapter||data.chapters[0].chapter;
  const msg=element('p',request&&!found?'Unknown chapter in the address; the opening chapter is shown.':'','connected-notice');msg.id='connected-message';msg.setAttribute('role','status');host.append(msg);
  function chapter(update){
   const c=data.chapters.find(c=>c.chapter===select.value);detail.replaceChildren(element('p',c.part,'connected-kicker'),element('h3',c.title));
   for(const [title,text] of [['The inherited question',c.question],["The chapter's work",c.work],['The next question',c.nextQuestion]])detail.append(element('h4',title),element('p',text));
   const l=element('p');l.append(pageLink(c.bridge,'Read the connecting essay'));detail.append(l);
   const source=element('p');c.pages.forEach((id,i)=>{if(i)source.append(document.createTextNode(' / '));source.append(pageLink(id,window.TheologyReader.pages().find(p=>p.slug===id)?.title||id));});detail.append(source);
   const controls=element('div',null,'connected-step-controls');for(const [id,text] of [[c.previous,'Previous chapter'],[c.next,'Next chapter']]){const b=element('button',text);b.type='button';b.disabled=!id;b.onclick=()=>{select.value=id;chapter(true);};controls.append(b);}detail.append(controls);
   const u=new URL(location.href);u.searchParams.set('chapter',c.chapter);const share=element('a','Open this exact chapter handoff');share.id='connected-share';share.href=u.href;detail.append(share);
   if(update){msg.textContent='Showing '+c.title+'.';try{history.replaceState(history.state,'',u);}catch{msg.textContent+=' The address could not update; the chapter link still works.';}}
  }
  select.onchange=()=>chapter(true);chapter(false);
  host.append(element('h2','Three linked argument diagrams'));
  const tabs=element('div',null,'connected-step-controls');tabs.setAttribute('aria-label','Choose an argument diagram');const diagram=element('figure',null,'connected-diagram');diagram.id='connected-diagram';diagram.setAttribute('aria-labelledby','connected-diagram-caption');host.append(tabs,diagram);
  function draw(id){const d=diagrams.find(d=>d.id===id);diagram.replaceChildren();diagram.dataset.diagram=d.id;const caption=element('figcaption',d.title);caption.id='connected-diagram-caption';diagram.append(caption,element('p',d.note));const nodes=element('div',null,'connected-nodes');for(const [slug,title,text] of d.nodes){const card=element('article',null,'connected-node');card.append(pageLink(slug,title),element('p',text));nodes.append(card);}diagram.append(nodes);const edges=element('div',null,'connected-edges');edges.append(element('h4','What the connections mean'));for(const text of d.edges)edges.append(element('p',text));diagram.append(edges);for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.diagram===id));}
  for(const d of diagrams){const b=element('button',d.id==='carriers'?'Transmission':d.id==='dates'?'Dates and witnesses':'Formation and correction');b.type='button';b.dataset.diagram=d.id;b.onclick=()=>draw(d.id);tabs.append(b);}draw('carriers');
  host.append(element('p','The full essays, all seventeen chapter transitions, and eight research questions continue below. These diagrams supplement those arguments; they do not replace source evidence.','connected-notice'));body.prepend(host);host.dataset.ready='true';
 }
 body.dataset.connectedReady=p.slug;
}
window.TheologyBridges={enhance};
})();
