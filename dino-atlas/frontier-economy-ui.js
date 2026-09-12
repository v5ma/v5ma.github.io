import {OUTPOSTS,LIBRARY_TOTAL} from './frontier-data-expanded.js?v=ranch1';
import {ECONOMY_KEY,GOODS,RIVALS,emptyEconomy,sanitizeEconomy,cargoUsed,quote,buy,sell,advanceMarket,contractOffer,acceptContract,completeContract,goodById} from './frontier-economy-core.js?v=ranch1';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const outpostById=id=>OUTPOSTS.find(o=>o.id===id)||OUTPOSTS[0];
const distance=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.z||0)-(b?.z||0));
let store;try{store=localStorage;}catch{store=null;}
let economy=(()=>{try{return sanitizeEconomy(JSON.parse(store?.getItem(ECONOMY_KEY)||'null'));}catch{return emptyEconomy();}})();
function save(){try{store?.setItem(ECONOMY_KEY,JSON.stringify(sanitizeEconomy(economy)));}catch{}updateChip();}
function dispatch(type,detail={}){window.dispatchEvent(new CustomEvent('dino-spectacle',{detail:{type,...detail}}));}
function ranger(){return window.__dinoRanger?.state||null;}
function nearest(){const s=ranger(),p=s?.position||{x:0,z:51};return [...OUTPOSTS].sort((a,b)=>distance(p,a)-distance(p,b))[0];}
function tradeContext(){const s=ranger(),o=nearest(),unlocked=!s||s.outposts?.includes(o.id),near=!s||distance(s.position,o)<18;return {s,o,canTrade:!!(unlocked&&near)};}
function money(n){return Math.round(n).toLocaleString()+' cr';}

const style=document.createElement('style');style.textContent=`
#market-chip{position:fixed;right:20px;bottom:20px;z-index:22;padding:8px 11px;border:1px solid #c9b77a66;border-radius:9px;background:#122a24d9;color:#f2dfaa;font:700 11px/1.2 system-ui;letter-spacing:.08em;pointer-events:none;backdrop-filter:blur(8px)}
.market-head{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.market-stat{background:#173b31;border:1px solid #bfa96a44;padding:10px;border-radius:8px}.market-stat small{display:block;color:#b8c7ba;font-size:10px;letter-spacing:.08em}.market-stat b{font-size:18px;color:#f4dda3}.market-rival{padding:10px;border-left:3px solid #7adfff;background:#0f2f2a;margin:10px 0}.market-contract{padding:12px;border:1px solid #d9be7755;background:#1d372d;border-radius:8px;margin:12px 0}.market-contract strong{color:#f5d58d}.market-list{display:grid;gap:7px;max-height:43vh;overflow:auto;padding-right:4px}.market-row{display:grid;grid-template-columns:minmax(190px,1fr) auto auto auto;gap:8px;align-items:center;border:1px solid #91a98c44;background:#142f29;padding:9px;border-radius:8px}.market-row span small{display:block;color:#aebcaf;max-width:520px}.market-row .price{min-width:96px;text-align:right;color:#f2d798;font-weight:800}.market-row button{min-width:72px}.market-row button:disabled{opacity:.36}.market-note{color:#b8c8ba;font-size:12px}.market-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}@media(max-width:760px){.market-row{grid-template-columns:1fr auto auto}.market-row .price{grid-column:1/-1;text-align:left}.market-head{grid-template-columns:1fr}.market-list{max-height:48vh}}
.spectacle-flash{position:fixed;inset:-20%;z-index:18;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 56%,transparent 0 18%,#8fdcff55 24%,transparent 42%);mix-blend-mode:screen}.spectacle-flash.go{animation:dinoRipple .9s ease-out}@keyframes dinoRipple{0%{opacity:0;transform:scale(.35)}18%{opacity:1}100%{opacity:0;transform:scale(1.45)}}
`;document.head.appendChild(style);

const menuGrid=document.querySelector('#menu-dialog .menu-grid');if(menuGrid&&!document.getElementById('menu-market'))menuGrid.insertAdjacentHTML('beforeend','<button id="menu-market">Supply exchange</button>');
const outpostList=document.querySelector('#outpost-dialog .entry-list');if(outpostList&&!document.getElementById('outpost-market'))outpostList.insertAdjacentHTML('beforeend','<button id="outpost-market">Trade park supplies</button>');

document.body.insertAdjacentHTML('beforeend',`
<div id="market-chip" aria-hidden="true"></div><div id="spectacle-flash" class="spectacle-flash" aria-hidden="true"></div>
<dialog id="market-dialog" aria-labelledby="market-title">
 <p class="eyebrow">ATLAS SUPPLY EXCHANGE / LEGAL PARK LOGISTICS</p><h2 id="market-title">Move what the reserve needs.</h2>
 <button class="primary" data-close>Return to the reserve / B</button>
 <div class="market-head"><div class="market-stat"><small>CREDITS</small><b id="market-credits"></b></div><div class="market-stat"><small>CARGO</small><b id="market-cargo"></b></div><div class="market-stat"><small>LOCAL HUB</small><b id="market-hub"></b></div></div>
 <p id="market-access" class="market-note"></p><div id="market-rival" class="market-rival"></div><div id="market-contract" class="market-contract"></div>
 <div class="market-actions"><button id="market-contract-action">Accept delivery contract</button><button id="market-shift">Wait one market shift</button></div>
 <div id="market-list" class="market-list"></div>
 <p class="market-note">Prices move by outpost, shift, and rival activity. Cargo space is finite. Culinary mushroom cultures and mycology substrate are ordinary legal greenhouse/research goods; this system does not trade hard drugs.</p>
 <p class="pad-help">D-pad or left stick navigates. A buys, sells, or accepts. B closes. Right stick scrolls. Travel between outposts to find better spreads.</p>
</dialog>`);

function updateChip(){const el=document.getElementById('market-chip');if(el)el.textContent=`${money(economy.credits)} / CARGO ${cargoUsed(economy)}/${economy.capacity}`;}
function rivalFor(o){const i=Math.max(0,OUTPOSTS.findIndex(x=>x.id===o.id));return RIVALS[(i+economy.tick)%RIVALS.length];}
function render(){
 const {s,o,canTrade}=tradeContext();economy.lastOutpost=o.id;const pressure=economy.rivalPressure[o.id]||0,rival=rivalFor(o);
 document.getElementById('market-credits').textContent=money(economy.credits);document.getElementById('market-cargo').textContent=`${cargoUsed(economy)} / ${economy.capacity} slots`;document.getElementById('market-hub').textContent=o.name;
 document.getElementById('market-access').textContent=canTrade?`Trading terminal online. Market shift ${economy.tick}. Buy here, then physically travel to another outpost to exploit price differences.`:`Radio quotes only. Move within 18 m of ${o.name} to buy, sell, accept, or deliver cargo.`;
 document.getElementById('market-rival').innerHTML=`<strong>${esc(rival.name)}</strong> is active in this region. Rival pressure is ${Math.round(pressure*100)}%, influencing local prices. Specialty: ${esc(rival.specialty)}.`;
 const c=economy.activeContract,offer=contractOffer(economy,o.id),contract=document.getElementById('market-contract'),action=document.getElementById('market-contract-action');
 if(c){const g=goodById(c.good),to=outpostById(c.to);contract.innerHTML=`ACTIVE DELIVERY: bring <strong>${c.qty} x ${esc(g.name)}</strong> to <strong>${esc(to.name)}</strong>. Completion reward: <strong>${money(c.reward)}</strong>. Cargo aboard: ${economy.cargo[c.good]||0}.`;action.textContent=c.to===o.id?'Deliver contract cargo':'Contract already active';action.disabled=!canTrade||c.to!==o.id||(economy.cargo[c.good]||0)<c.qty;action.dataset.mode='complete';}
 else {const g=goodById(offer.good),to=outpostById(offer.to);contract.innerHTML=`AVAILABLE RUN: source <strong>${offer.qty} x ${esc(g.name)}</strong> and deliver it to <strong>${esc(to.name)}</strong> for <strong>${money(offer.reward)}</strong>. You choose where to buy the cargo.`;action.textContent='Accept delivery contract';action.disabled=!canTrade;action.dataset.mode='accept';}
 document.getElementById('market-list').innerHTML=GOODS.map(g=>{const q=quote(economy,g.id,o.id),owned=economy.cargo[g.id]||0;return `<div class="market-row"><span><b>${esc(g.name)}</b><small>${esc(g.detail)} / ${g.slots} cargo slot${g.slots===1?'':'s'} each / owned ${owned}</small></span><div class="price">BUY ${money(q.buy)}<br>SELL ${money(q.sell)}</div><button data-buy="${g.id}" ${!canTrade||economy.credits<q.buy||cargoUsed(economy)+g.slots>economy.capacity?'disabled':''}>Buy / A</button><button data-sell="${g.id}" ${!canTrade||owned<1?'disabled':''}>Sell / A</button></div>`;}).join('');updateChip();save();
}
function openMarket(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());advanceMarket(economy,1);render();const d=document.getElementById('market-dialog');d.showModal();requestAnimationFrame(()=>d.querySelector('button:not(:disabled)')?.focus({preventScroll:true}));dispatch('rival',{name:rivalFor(nearest()).name});}

document.getElementById('menu-market')?.addEventListener('click',openMarket);document.getElementById('outpost-market')?.addEventListener('click',openMarket);
document.getElementById('market-list').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const {o,canTrade}=tradeContext();if(!canTrade)return render();let r;if(b.dataset.buy)r=buy(economy,b.dataset.buy,o.id,1);else if(b.dataset.sell)r=sell(economy,b.dataset.sell,o.id,1);if(r?.ok){dispatch(b.dataset.buy?'trade-buy':'trade-sell',{good:b.dataset.buy||b.dataset.sell,outpost:o.id});advanceMarket(economy,1);}render();});
document.getElementById('market-contract-action').addEventListener('click',e=>{const {o,canTrade}=tradeContext();if(!canTrade)return render();const r=e.currentTarget.dataset.mode==='complete'?completeContract(economy,o.id):acceptContract(economy,o.id);if(r.ok)dispatch('contract',{outpost:o.id});render();});
document.getElementById('market-shift').addEventListener('click',()=>{advanceMarket(economy,1);render();});

// Keep the original controller/journal code compatible while reflecting the expanded library count in its hard-coded copy.
function syncLibraryCopy(){const s=ranger();const summary=document.getElementById('journal-summary');if(summary&&s)summary.textContent=`${s.species?.length||0} / ${LIBRARY_TOTAL} species recorded`;const body=document.getElementById('info-body');if(body&&body.textContent.includes(' of 14 species recorded'))for(const n of body.querySelectorAll('p'))if(n.textContent.includes(' of 14 species recorded'))n.textContent=n.textContent.replace(' of 14 species recorded',` of ${LIBRARY_TOTAL} species recorded`);}
setInterval(syncLibraryCopy,350);
window.addEventListener('dino-spectacle',e=>{if(document.getElementById('motion-toggle')?.checked||!['sonic','gravity','celebration'].includes(e.detail?.type))return;const flash=document.getElementById('spectacle-flash');flash.classList.remove('go');void flash.offsetWidth;flash.style.background=e.detail.type==='gravity'?'radial-gradient(circle at 50% 56%,transparent 0 14%,#b7a2ff66 20%,transparent 44%)':e.detail.type==='celebration'?'radial-gradient(circle at 50% 56%,transparent 0 18%,#ffc86f66 24%,transparent 46%)':'radial-gradient(circle at 50% 56%,transparent 0 18%,#8fdcff66 24%,transparent 44%)';flash.classList.add('go');});
window.__dinoEconomy={get state(){return JSON.parse(JSON.stringify(economy));},open:openMarket,render,grant:(amount,tag)=>{if(!Number.isFinite(amount)||amount<=0||tag&&economy.rewardLedger.includes(tag))return false;if(tag)economy.rewardLedger.push(tag);economy.credits=Math.min(9999999,economy.credits+Math.round(amount));save();return true;},crewDelivery:i=>{const id=['redwood','mesa','coast'][i];if(id){economy.rivalPressure[id]=Math.max(.04,(economy.rivalPressure[id]||0)-.12);save();}},advance:()=>{advanceMarket(economy,1);render();}};
updateChip();
