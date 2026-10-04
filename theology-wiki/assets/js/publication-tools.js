/* Public version links only. No external runtime API, analytics, storage writes or content substitution. */
(() => {
'use strict';
const current=()=>window.TheologyReader?.current();
const local=slug=>'?page='+encodeURIComponent(slug);
function link(label,url){const a=document.createElement('a');a.textContent=label;a.href=url;if(url.startsWith('https:')){a.rel='noopener noreferrer';}return a;}
function internal(label,slug){const a=link(label,local(slug));a.dataset.page=slug;return a;}
function enhance(page){
 if(current()?.slug!==page.slug)return;
 document.getElementById('publication-record')?.remove();
 document.getElementById('conjecture-scope')?.remove();
 if(page.authorialScope){const section=document.createElement('section');section.id='conjecture-scope';section.className='publication-record';section.setAttribute('aria-label','Author clarification: conditional conjecture');const label=document.createElement('p');label.className='publication-label';label.textContent='Conditional conjecture, not a prescribed belief';const text=document.createElement('p');text.textContent=page.authorialScope;section.append(label,text);document.getElementById('article-body')?.before(section);}
 const proof=page.publication,host=document.getElementById('research-actions')||document.querySelector('.article-header');
 if(proof&&host){
  const panel=document.createElement('section');panel.id='publication-record';panel.className='publication-record';panel.setAttribute('aria-label','Publication history and exact versions');
  const title=document.createElement('p');title.className='publication-label';title.textContent='Time-stamped public backup';panel.append(title);
  const nav=document.createElement('nav');nav.setAttribute('aria-label','Article source and history');
  nav.append(link('Markdown on GitHub',proof.sourceUrl),link('Publication history',proof.historyUrl),link('Exact source version',proof.exactUrl),link('Markdown backup',proof.archiveUrl));panel.append(nav);
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Verify this edition and its source';details.append(summary);
  const note=document.createElement('p');note.textContent='Snapshot source revision '+proof.revision+'. Its recorded Git committer date is '+proof.sourceCommitterDate+'. These identify a saved edition, not the first appearance of every idea.';details.append(note);
  const hash=document.createElement('p');hash.className='publication-hash';hash.textContent='Reader source SHA-256: '+proof.sha256;details.append(hash);
  const refs=document.createElement('nav');refs.append(internal('Public backup and verification guide','publication-history'),link('Browse the complete Markdown corpus','https://github.com/v5ma/v5ma.github.io/tree/master/theology-wiki/public-corpus'));
  if(proof.canonicalSourceUrl)refs.append(link('Canonical writing source',proof.canonicalSourceUrl),link('Canonical writing history',proof.canonicalHistoryUrl));
  if(proof.transcriptExactUrl)refs.append(link('Exact original conversation',proof.transcriptExactUrl));details.append(refs);
  const button=document.createElement('button');button.type='button';button.textContent='Check source against archived hash';
  const status=document.createElement('p');status.setAttribute('role','status');status.className='publication-status';
  button.addEventListener('click',async()=>{button.disabled=true;status.textContent='Checking the reader Markdown against its archived hash.';try{
   if(!window.crypto?.subtle)throw Error('Cryptographic checking is unavailable in this browser. The recorded hash remains available for independent checking.');
   const rel=proof.sourcePath.replace(/^theology-wiki\//,'');if(rel===proof.sourcePath||rel.includes('..'))throw Error('Unrecognized source path.');
   const res=await fetch('./'+rel,{cache:'no-store'});if(!res.ok)throw Error('Source request returned '+res.status+'.');
   const digest=await crypto.subtle.digest('SHA-256',await res.arrayBuffer());const value=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
   status.textContent=value===proof.sha256?'Verified: the served Markdown matches this archived source hash.':'The served Markdown does not match this archived hash. The page or snapshot may have changed; inspect the history.';
  }catch(e){status.textContent=e.message;}finally{button.disabled=false;}});
  details.append(button,status);panel.append(details);host.after(panel);
 }
 const strip=document.querySelector('.wiki-family-strip');
 if(strip&&!document.getElementById('publication-nav')){const nav=document.createElement('span');nav.id='publication-nav';nav.className='publication-nav';nav.append(internal('Computational-God conjectures','computational-god-capabilities-bridge'),internal('Public backup','publication-history'));strip.append(nav);}
 if(page.slug==='home'){
  const body=document.getElementById('article-body');body?.querySelector('#publication-home')?.remove();
  const section=document.createElement('section');section.id='publication-home';section.className='publication-home';const heading=document.createElement('h2');heading.textContent='Conjectures about creation and consciousness, with a verifiable record';
  const text=document.createElement('p');text.textContent='Explore one possible view, conditional on the assumptions explained in the linked research papers and news articles, or inspect the time-stamped public Markdown backup.';
  const nav=document.createElement('nav');nav.append(internal('Explore the computational-God conjecture','computational-god-capabilities-bridge'),internal('Read the consciousness and theodicy discussion','computational-god-consciousness-and-theodicy'),internal('Inspect publication history and the public backup','publication-history'));section.append(heading,text,nav);body?.append(section);
 }
}
window.addEventListener('theology:loading',()=>{document.getElementById('publication-record')?.remove();document.getElementById('conjecture-scope')?.remove();});
window.TheologyPublication={enhance};
})();
