import {FAIRY_PROMOTIONS,PIECES,buyPromotionLicense,cloneState,coordToSquare,createGame,getLegalMoves,getPromotionOptions,isKingInCheck,pieceAt,playMove} from './warledger-engine.mjs';
import {loadSession,saveSession} from './warledger-session.mjs';
const saved=loadSession();let state=saved.state,undoStack=saved.undoStack,selectedSquare=null,selectedMoves=[],pendingPromotion=null,notice=saved.warning;
const $=s=>document.querySelector(s),cap=s=>s[0].toUpperCase()+s.slice(1),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const launch=document.createElement('button');launch.id='launch-ar';launch.type='button';launch.textContent='Play AR / 3D';launch.style.cssText='background:#284f43;color:#fff0cc;border-color:#94722a';launch.onclick=()=>{saveSession(state,undoStack);location.href='./ar.html?v=ar-blocks-20260922-1';};$('.actions').prepend(launch);
for(const [id,scenario] of [['reset-standard','standard'],['promotion-lab','promotionLab'],['stalemate-lab','stalemateLab'],['repetition-lab','repetitionLab']])$('#'+id).onclick=()=>loadScenario(scenario);
$('#undo').onclick=undoLastAction;$('#close-promotion').onclick=closePromotionDialog;
function render(){
 selectedMoves=selectedSquare?getLegalMoves(state).filter(m=>m.fromSquare===selectedSquare):[];
 const targets=new Map(selectedMoves.map(m=>[m.toSquare,m]));$('#board').replaceChildren();
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){
  const square=coordToSquare(r,c),entry=state.board[r][c],button=document.createElement('button');button.type='button';button.dataset.square=square;
  button.className=['square',(r+c)%2?'dark':'light',selectedSquare===square?'selected':'',targets.has(square)?'target':'',state.lastMove&&(state.lastMove.from===square||state.lastMove.to===square)?'last':'',entry?`piece-${entry.side}`:''].filter(Boolean).join(' ');
  button.setAttribute('aria-label',entry?`${square}: ${entry.side} ${PIECES[entry.type].name}`:square);button.onclick=()=>handleSquare(square);
  const label=document.createElement('span');label.className='coord';label.textContent=square;button.append(label);
  if(entry){const p=document.createElement('span');p.className='piece';p.textContent=PIECES[entry.type].code||entry.type;p.title=`${cap(entry.side)} ${PIECES[entry.type].name}`;button.append(p);}
  if(targets.has(square)){const dot=document.createElement('span');dot.className=targets.get(square).capture?'hit-dot capture-dot':'hit-dot';button.append(dot);}$('#board').append(button);
 }
 const title=state.gameOver?`${cap(state.gameOver.winner)} victory`:`${cap(state.sideToMove)} to move`;
 const detail=state.gameOver?state.gameOver.message:isKingInCheck(state,state.sideToMove)?`${cap(state.sideToMove)} is in check.`:'Battle active.';
 $('#status').innerHTML=`<div class="status-title">${esc(title)}</div><div class="status-detail">${esc(detail)}</div><div class="status-grid"><span>Repetition</span><strong>third maker loses</strong><span>Stalemate</span><strong>maker wins</strong><span>Promotions</span><strong>licenses unlock fairies</strong></div>`;
 $('#players').innerHTML=['white','black'].map(side=>{const active=side===state.sideToMove&&!state.gameOver;return `<section class="player-ledger${active?' active':''}"><div><h2>${cap(side)}</h2><span>${state.gameOver?.winner===side?'winner':active?'turn':'reserve'}</span></div><dl><dt>Battle score</dt><dd>${state.battleScore[side]}</dd><dt>Bank</dt><dd>${state.bank[side]}</dd><dt>Licenses</dt><dd>${FAIRY_PROMOTIONS.map(t=>`${PIECES[t].code||t}:${state.licenses[side][t]}`).join(' ')}</dd></dl></section>`;}).join('');
 $('#market').innerHTML=state.gameOver?'<p class="quiet">Market closed.</p>':FAIRY_PROMOTIONS.map(type=>{const p=PIECES[type];return `<button class="market-item" type="button" data-buy="${type}" ${state.bank[state.sideToMove]<p.licenseCost?'disabled':''}><span class="market-piece">${p.code||type}</span><span><strong>${p.name}</strong><small>${p.summary}</small></span><span class="cost">${p.licenseCost}</span></button>`;}).join('');
 document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyLicense(b.dataset.buy));
 $('#captures').innerHTML=['white','black'].map(side=>`<div class="capture-row"><span>${cap(side)}</span><strong>${state.captures[side].length?state.captures[side].map(e=>esc(`${e.type}+${e.value}`)).join(' '):'none'}</strong></div>`).join('');
 $('#move-log').innerHTML=state.moveLog.length?state.moveLog.slice(-16).map((e,i,a)=>`<li><span>${state.moveLog.length-a.length+i+1}</span><strong>${esc(e.notation)}</strong></li>`).join(''):'<li class="quiet">No moves yet.</li>';
 $('#notice').textContent=notice;$('#notice').hidden=!notice;saveSession(state,undoStack);
}
function handleSquare(square){
 if(pendingPromotion)return;const entry=pieceAt(state,square),m=selectedMoves.find(m=>m.toSquare===square);
 if(m){if(m.promotion){openPromotionDialog(m);return;}commitMove({from:m.fromSquare,to:m.toSquare});return;}
 selectedSquare=entry&&entry.side===state.sideToMove&&!state.gameOver?square:null;notice='';render();
}
function commitMove(input){
 const before=cloneState(state),result=playMove(state,input);if(!result.ok){notice=result.error||'Move rejected.';render();return false;}
 undoStack.push(before);undoStack=undoStack.slice(-60);state=result.state;selectedSquare=null;notice='';closePromotionDialog();render();return true;
}
function buyLicense(type){const before=cloneState(state),result=buyPromotionLicense(state,state.sideToMove,type);if(!result.ok){notice=result.error||'License rejected.';render();return false;}undoStack.push(before);undoStack=undoStack.slice(-60);state=result.state;notice=`${cap(state.sideToMove)} bought ${PIECES[type].name}.`;render();return true;}
function openPromotionDialog(move){
 pendingPromotion=move;$('#promotion-options').innerHTML=getPromotionOptions(state,state.sideToMove).map(o=>`<button type="button" class="promotion-choice" data-promotion="${o.type}" ${o.available?'':'disabled'}><span>${PIECES[o.type].code||o.type}</span><strong>${o.name}</strong><small>${o.cost?(o.available?'license ready':`locked, cost ${o.cost}`):'standard'}, value ${PIECES[o.type].value}</small></button>`).join('');
 document.querySelectorAll('[data-promotion]').forEach(b=>b.onclick=()=>commitMove({from:move.fromSquare,to:move.toSquare,promotionType:b.dataset.promotion}));$('#promotion-dialog').hidden=false;
}
function closePromotionDialog(){$('#promotion-dialog').hidden=true;$('#promotion-options').replaceChildren();pendingPromotion=null;}
function undoLastAction(){if(!undoStack.length){notice='Nothing to undo.';render();return;}state=undoStack.pop();selectedSquare=null;notice='';closePromotionDialog();render();}
function loadScenario(scenario){state=createGame(scenario);selectedSquare=null;undoStack=[];notice=state.note;closePromotionDialog();render();}
render();window.WarLedgerDebug={getState:()=>cloneState(state),getLegalMoves:()=>getLegalMoves(state),loadScenario,buy:buyLicense,move:(from,to,promotionType=null)=>commitMove({from,to,promotionType})};
