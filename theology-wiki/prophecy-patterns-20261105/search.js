'use strict';
(function(){
 const input=document.getElementById('query'),scope=document.getElementById('scope'),status=document.getElementById('search-status'),results=document.getElementById('search-results');
 const normalize=s=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
 const data=window.PROPHECY_SEARCH;
 if(!Array.isArray(data)){status.textContent='Search data could not load. The complete texts remain available above.';return;}
 function terms(q){return normalize(q).trim().split(/\s+/).filter(Boolean).slice(0,20);}
 function highlight(el,text,words){if(!words.length){el.textContent=text;return;}const re=new RegExp(words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length).join('|'),'gi');let pos=0,m;while((m=re.exec(text))){el.append(document.createTextNode(text.slice(pos,m.index)));const mark=document.createElement('mark');mark.textContent=m[0];el.append(mark);pos=re.lastIndex;}el.append(document.createTextNode(text.slice(pos)));}
 function render(updateUrl=true){const words=terms(input.value);results.replaceChildren();if(updateUrl){try{const u=new URL(location.href);input.value.trim()?u.searchParams.set('q',input.value.trim()):u.searchParams.delete('q');scope.value?u.searchParams.set('scope',scope.value):u.searchParams.delete('scope');history.replaceState(null,'',u);}catch(_){/* file viewers may disallow history mutation */}}
  if(!words.length){status.textContent='Search runs on this device. It covers these three complete texts only.';return;}
  const found=data.filter(r=>(!scope.value||r.kind===scope.value)&&words.every(w=>normalize(r.title+' '+r.heading+' '+r.text).includes(w)));
  status.textContent=found.length?found.length+' matching section'+(found.length===1?'':'s')+'.':'No matching sections. Try fewer words or choose all three texts.';
  for(const r of found){const article=document.createElement('article');article.className='result';const meta=document.createElement('p');meta.className='meta';meta.textContent=r.title;const h=document.createElement('h3'),a=document.createElement('a');a.href=r.url;highlight(a,r.heading,words);h.append(a);const p=document.createElement('p');const idx=words.map(w=>normalize(r.text).indexOf(w)).filter(i=>i>=0).sort((a,b)=>a-b)[0]||0;const begin=Math.max(0,idx-90);let text=r.text.slice(begin,begin+340);if(begin)text='…'+text;if(begin+340<r.text.length)text+='…';highlight(p,text,words);article.append(meta,h,p);results.append(article);}
 }
 const params=new URLSearchParams(location.search);input.value=params.get('q')||'';scope.value=['chapter','research'].includes(params.get('scope'))?params.get('scope'):'';
 input.addEventListener('input',()=>render());scope.addEventListener('change',()=>render());document.getElementById('search-form').addEventListener('submit',e=>{e.preventDefault();render();});document.getElementById('reset').addEventListener('click',()=>{input.value='';scope.value='';render();input.focus();});input.addEventListener('keydown',e=>{if(e.key==='Escape'){input.value='';render();}});window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);input.value=p.get('q')||'';scope.value=['chapter','research'].includes(p.get('scope'))?p.get('scope'):'';render(false);});render(false);
})();
