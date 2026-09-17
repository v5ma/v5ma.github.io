'use strict';
(()=>{
 const ids=['query','book','corpus','theme'], get=id=>document.getElementById(id),cards=[...document.querySelectorAll('article.passage')];
 function render(){const q=get('query').value.trim().toLowerCase();let visible=0;for(const c of cards){const keep=(!q||c.textContent.toLowerCase().includes(q))&&ids.slice(1).every(id=>!get(id).value||c.dataset[id]===get(id).value);c.hidden=!keep;if(keep)visible++;}get('count').textContent=visible+' passage rows are visible.';get('empty').hidden=visible!==0;}
 function reset(){ids.forEach(id=>get(id).value='');render();}
 function hash(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const node=document.getElementById(id);if(!node)return;if(node.hidden)reset();node.scrollIntoView();}
 ids.forEach(id=>get(id).addEventListener(id==='query'?'input':'change',render));get('reset').addEventListener('click',reset);window.addEventListener('hashchange',hash);render();hash();
})();
