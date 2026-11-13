export const themes=['white','black','sepia','slate','ocean','forest','plum','amber','rose','contrast'];
export function viewState(search,ids){
  const p=new URLSearchParams(search), raw=Number(p.get('text'));
  return {index:Math.max(0,ids.indexOf(p.get('card'))),theme:themes.includes(p.get('theme'))?p.get('theme'):'white',text:p.has('text')&&Number.isFinite(raw)?Math.min(40,Math.max(20,raw)):24};
}
export function step(index,delta,length){return (index+delta+length)%length;}
export function viewUrl(url,state,ids){const u=new URL(url);u.searchParams.set('card',ids[state.index]);u.searchParams.set('theme',state.theme);u.searchParams.set('text',String(state.text));return u;}
if(typeof document!=='undefined'){
  const cards=[...document.querySelectorAll('[data-card]')],ids=cards.map(c=>c.id);
  const choose=document.getElementById('choose'),theme=document.getElementById('theme'),size=document.getElementById('size');
  const formulation=document.getElementById('formulation');
  let state=viewState(location.search,ids);
  function render(save=true){
    cards.forEach((c,i)=>c.hidden=i!==state.index);
    document.documentElement.dataset.theme=state.theme;document.documentElement.style.setProperty('--text',state.text+'px');
    choose.value=ids[state.index];theme.value=state.theme;size.value=String(state.text);formulation.value=cards[state.index].dataset.source;
    document.getElementById('position').textContent=`Card ${state.index+1} of ${cards.length}`;
    if(save)history.replaceState(null,'',viewUrl(location.href,state,ids));
  }
  choose.addEventListener('change',()=>{state.index=ids.indexOf(choose.value);render();});
  formulation.addEventListener('change',()=>{const target=cards[state.index].dataset.target;const i=cards.findIndex(c=>c.dataset.target===target&&c.dataset.source===formulation.value);if(i>=0){state.index=i;render();}});
  theme.addEventListener('change',()=>{state.theme=theme.value;render();});
  size.addEventListener('change',()=>{const n=Number(size.value);state.text=Number.isFinite(n)?Math.min(40,Math.max(20,n)):24;render();});
  for(const [id,delta] of [['prev',-1],['next',1]])document.getElementById(id).addEventListener('click',()=>{state.index=step(state.index,delta,cards.length);render();});
  addEventListener('popstate',()=>{state=viewState(location.search,ids);render(false);});
  addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();state.index=step(state.index,e.key==='ArrowRight'?1:-1,cards.length);render();}});
  document.getElementById('full').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();document.getElementById('notice').textContent='';}catch{document.getElementById('notice').textContent='Fullscreen is unavailable here. Browser fullscreen or a maximized window can still be used.';}});
  document.getElementById('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(viewUrl(location.href,state,ids).href);document.getElementById('notice').textContent='Card link copied.';}catch{document.getElementById('notice').textContent='Copy this card’s URL from the address bar.';}});
  render(false);
}
