/* Standard Xbox layout. Polls while paused/title screens too. No synthetic
 * keyboard events: simulation actions and UI focus have separate paths. */
export const PAD_LAYOUT={A:'Jump / confirm',B:'Dodge / back',X:'Interact / nearby',Y:'Mount / dismount',LB:'Throw left / previous tab',RB:'Throw right / next tab',LT:'Brace / brake',RT:'Staff / pedal harder',View:'Map',Menu:'Pause / close',LS:'Move / steer; click toggles sprint',RS:'Look; click centers camera',Up:'Open Doors guide',Down:'Original notebook',Left:'Lantern',Right:'Inspect; hold to operate'};
export function deadzone(n,d=.18){if(!Number.isFinite(n)||Math.abs(n)<=d)return 0;return Math.sign(n)*Math.min(1,(Math.abs(n)-d)/(1-d));}
export function buttonEdges(previous,current){return current.map((v,i)=>!!v&&!previous[i]);}
export function createGamepad({getState,playing,active,actions}){
 let previous=Array(17).fill(false),held=Array(17).fill(false),axes=[0,0,0,0],connected=false,id='',sprint=false,repeatAt=0,lastDir='',lastRoot=null,remembered=null,focusKey='',lastInput=0;
 const badge=document.createElement('div');badge.id='gamepad-status';badge.setAttribute('role','status');badge.textContent='Xbox controller: press a button to connect';document.body.append(badge);
 const help=document.createElement('div');help.id='gamepad-hints';help.textContent='X interact | Y ride | RT staff | LT brace | B dodge | Menu pause';document.body.append(help);
 const visible=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none'&&!e.closest('[hidden]');
 let topDialog=null;document.addEventListener('focusin',e=>{const d=e.target.closest?.('dialog[open]');if(d)topDialog=d;});
 const root=()=>{if(topDialog?.open)return topDialog;const dialogs=[...document.querySelectorAll('dialog[open]')];if(dialogs.length)return dialogs.at(-1);const fail=document.getElementById('failure');if(visible(fail))return fail;const menu=document.getElementById('menu');return visible(menu)?menu:null;};
 const choices=r=>[...r.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(e=>visible(e)&&e.type!=='hidden');
 const key=e=>e?.id||[...e?.attributes||[]].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value).join('|')||e?.textContent?.trim();
 function focus(e){if(!e)return;document.querySelectorAll('.pad-focus').forEach(n=>n.classList.remove('pad-focus'));e.classList.add('pad-focus');e.focus({preventScroll:true});e.scrollIntoView({block:'nearest',inline:'nearest'});remembered=e;focusKey=key(e);}
 function ensure(r){const list=choices(r);if(r!==lastRoot){lastRoot=r;focusKey='';remembered=null;const primary=r.querySelector('#start:not(:disabled),[data-pad-default],.primary:not(:disabled)');focus(visible(primary)?primary:list[0]);}
  else if(!list.includes(document.activeElement))focus(list.find(e=>key(e)===focusKey)||list[0]);return list;
 }
 function adjust(e,dir){
  if(e?.tagName==='SELECT'){const opts=[...e.options].filter(o=>!o.disabled),i=opts.indexOf(e.selectedOptions[0]);e.value=opts[(i+dir+opts.length)%opts.length].value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;}
  if(e?.tagName==='INPUT'&&e.type==='range'){const n=Number(e.value)+(Number(e.step)||1)*dir;e.value=String(Math.max(Number(e.min)||0,Math.min(Number(e.max)||100,n)));e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;}return false;
 }
 function navigate(r,direction){
  const list=ensure(r),current=document.activeElement;
  if(['left','right'].includes(direction)&&adjust(current,direction==='right'?1:-1))return;
  const rect=current?.getBoundingClientRect(),horizontal=direction==='left'||direction==='right',sign=direction==='left'||direction==='up'?-1:1;
  if(!rect){focus(list[0]);return;}
  const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
  let best=null,bestScore=Infinity;
  for(const e of list){if(e===current)continue;const q=e.getBoundingClientRect(),dx=q.x+q.width/2-cx,dy=q.y+q.height/2-cy,forward=(horizontal?dx:dy)*sign,side=Math.abs(horizontal?dy:dx);if(forward<4)continue;const score=forward+side*2.8;if(score<bestScore){best=e;bestScore=score;}}
  if(!best){const i=list.indexOf(current);best=list[(i+sign+list.length)%list.length];}focus(best);
 }
 function closeTop(){const r=root();if(r?.tagName==='DIALOG'){r.dispatchEvent(new Event('cancel',{cancelable:true}));if(r.open)r.close();lastRoot=null;return true;}return false;}
 function activate(){const e=document.activeElement;if(!e)return;if(adjust(e,1))return;if((e.tagName==='INPUT'&&['text','search'].includes(e.type))||e.tagName==='TEXTAREA'){keyboard(e);return;}e.click();}
 function tabs(r,dir){const buttons=[...r.querySelectorAll('nav button,[role="tab"]')].filter(e=>visible(e)&&!e.disabled);if(!buttons.length){navigate(r,dir>0?'down':'up');return;}let i=buttons.findIndex(e=>e.getAttribute('aria-selected')==='true'||e.classList.contains('active')||e===document.activeElement);const next=buttons[(i+dir+buttons.length)%buttons.length];next.click();focus(next);}
 function keyboard(input){
  if(document.getElementById('pad-keyboard')?.open)return;
  const d=document.createElement('dialog');d.id='pad-keyboard';d.setAttribute('aria-label','Controller text entry');
  const title=document.createElement('h2');title.textContent='Controller text entry';const preview=document.createElement('p');preview.className='pad-key-preview';let text=input.value;const original=text;preview.textContent=text||'(empty)';
  const grid=document.createElement('div');grid.className='pad-key-grid';
  for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')){const b=document.createElement('button');b.textContent=ch;b.onclick=()=>{if(text.length<80)text+=ch.toLowerCase();preview.textContent=text;};grid.append(b);}
  const controls=document.createElement('div');controls.className='pad-key-controls';
  for(const [label,fn]of [['Space',()=>{if(text.length<80)text+=' ';}],['Backspace',()=>text=text.slice(0,-1)],['Clear',()=>text=''],['Done',()=>{input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));d.close();}],['Cancel',()=>{text=original;d.close();}]]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{fn();preview.textContent=text||'(empty)';};controls.append(b);}
  d.append(title,preview,grid,controls);document.body.append(d);d.addEventListener('close',()=>{d.remove();lastRoot=null;input.focus();});d.showModal();lastRoot=null;
 }
 function poll(now,dt){
  let pad=null;try{pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected&&p.mapping==='standard')||null;}catch{}
  const was=connected;connected=!!pad;
  if(!pad){axes=[0,0,0,0];previous=held=Array(17).fill(false);if(was){sprint=false;actions.pause();badge.textContent='Controller disconnected. Reconnect or use keyboard.';}document.body.classList.remove('pad-connected');return;}
  id=pad.id;document.body.classList.add('pad-connected');held=Array.from({length:17},(_,i)=>!!pad.buttons[i]&&(pad.buttons[i].pressed||pad.buttons[i].value>.5));axes=Array.from({length:4},(_,i)=>deadzone(pad.axes[i]));
  const edge=buttonEdges(previous,held);previous=[...held];badge.textContent='Xbox layout connected';
  if(edge.some(Boolean)||axes.some(v=>Math.abs(v)>.1))lastInput=now;
  const r=root();
  if(r){
   help.textContent='D-pad / left stick navigate | A confirm | B back | LB/RB tabs | Right stick scroll';
   ensure(r);
   if(edge[1]||edge[9]||edge[8]){if(!closeTop()&&edge[9])actions.start();return;}
   const dir=held[12]||axes[1]<-.55?'up':held[13]||axes[1]>.55?'down':held[14]||axes[0]<-.55?'left':held[15]||axes[0]>.55?'right':'';
   if(dir&&(dir!==lastDir||now>=repeatAt)){navigate(r,dir);repeatAt=now+(dir!==lastDir?340:130);}lastDir=dir;
   if(edge[0])activate();if(edge[4])tabs(r,-1);if(edge[5])tabs(r,1);
   if(Math.abs(axes[3])>.1){const scroll=r.querySelector('[data-pad-scroll]')||r;scroll.scrollTop+=axes[3]*dt*460;}
   return;
  }
  lastRoot=null;lastDir='';
  help.textContent='X interact | Y ride | RT staff | LT brace/brake | B dodge | View map | Menu pause';
  if(!playing()){if(edge[0]||edge[9])actions.start();return;}
  if(edge[9]){actions.pause();return;}if(edge[8]){actions.map();return;}
  if(!active())return;
  if(edge[0])actions.jump();if(edge[1])actions.dodge();if(edge[2])actions.interact();if(edge[3])actions.vehicle();
  if(edge[4])actions.throwLeft();if(edge[5])actions.throwRight();if(edge[7]&&getState().mode==='foot')actions.attack();if(edge[10])sprint=!sprint;if(edge[11])actions.recenter();
  if(edge[12])actions.guide();if(edge[13])actions.journal();if(edge[14])actions.magic();if(edge[15])actions.scan();
 }
 function controls(dt){const s=getState();if(!connected||root()||!active())return {throttle:0,steer:0,look:0,lookY:0};return {throttle:-axes[1],steer:axes[0],analog:!!axes[1],boost:sprint||(s.mode!=='foot'&&held[7]),brake:held[6]&&s.mode!=='foot',guard:held[6]&&s.mode==='foot',hack:held[15],look:-axes[2]*dt*2.8,lookY:axes[3]*dt*2.8};}
 return {poll,controls,closeTop,inspect:()=>({connected,id,axes:[...axes],buttons:[...held],sprint,focus:document.activeElement?.id||document.activeElement?.textContent?.trim().slice(0,90),modal:root()?.id||null,lastInput})};
}
