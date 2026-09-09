'use strict';
const input=document.getElementById('article-search'),cards=[...document.querySelectorAll('[data-article]')],status=document.getElementById('search-status');
if(input){input.addEventListener('input',()=>{const terms=input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);let count=0;for(const card of cards){card.hidden=!terms.every(t=>(card.textContent+' '+card.dataset.keywords).toLowerCase().includes(t));if(!card.hidden)count++;}status.textContent=count+' of '+cards.length+' studies shown. Search covers titles, summaries and topic keywords.';});}
