/* Standard Xbox layout. Polls while paused/title screens too. No synthetic
 * keyboard events: simulation actions and UI focus have separate paths. */
export const CLASSIC_PAD_LAYOUT={A:'Jump / confirm',B:'Dodge / back',X:'Interact / nearby',Y:'Mount / dismount',LB:'Throw left / previous tab',RB:'Throw right / next tab',LT:'Brace / brake',RT:'Staff / pedal harder',View:'Map',Menu:'Pause / close',LS:'Move / steer; click toggles sprint',RS:'Look; click centers camera',Up:'Open Doors guide',Down:'Original notebook',Left:'Lantern',Right:'Inspect; hold to operate'};
export const PAD_LAYOUT={A:'Jump or climb on foot; repeated taps sprint; duck while riding',B:'Dodge on foot / bicycle hop / back',X:'Interact; reload while aiming the sling; hold to interact in combat',Y:'Mount / dismount',LB:'Hold equipment wheel / previous menu tab',RB:'Cover on foot / handbrake while riding / next menu tab',LT:'Aim (staff braces) / brake or reverse',RT:'Use equipped tool / accelerate',View:'Map',Menu:'Pause / close',LS:'Camera-relative movement / steering; click sprint or horn',RS:'Look / wheel selection; click recenters',Up:'Guild dispatch',Down:'Notebook; hold for discipline wheel',Left:'Lantern / vehicle headlight; hold for music wheel',Right:'Inspect; hold to operate', 'LS + RS':'Special ability (40 focus)'};
export function deadzone(n,d=.18){if(!Number.isFinite(n)||Math.abs(n)<=d)return 0;return Math.sign(n)*Math.min(1,(Math.abs(n)-d)/(1-d));}
export function buttonEdges(previous,current){return current.map((v,i)=>!!v&&!previous[i]);}
export function createGamepad({getState,playing,active,actions,getPreferences=()=>({profile:'classic'})}){
 let previous=Array(17).fill(false),held=Array(17).fill(false),axes=[0,0,0,0],connected=false,id='',sprint=false,repeatAt=0,lastDir='',lastRoot=null,remembered=null,focusKey='',lastInput=0,lastA=-999,sprintUntil=0,downAt=0,leftAt=0,downUsed=true,leftUsed=true,xAt=0,xUsed=false,chord=false,pendingLS=0,pendingRS=0,moveYaw=0,stickLatch=false,releaseLatch=Array(17).fill(false);
 const badge=document.createElement('div');badge.id='gamepad-status';badge.setAttribute('role','status');badge.textContent='Xbox controller: press a button to connect';document.body.append(badge);
 const help=document.createElement('div');help.id='gamepad-hints';help.textContent='X interact | Y ride | RT staff | LT brace | B dodge | Menu pause';document.body.append(help);
 const visible=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none'&&!e.closest('[hidden]');
 let topDialog=null;document.addEventListener('focusin',e=>{const d=e.target.closest?.('dialog[open]');if(d)topDialog=d;});
 const root=()=>{if(topDialog?.open)return topDialog;const dialogs=[...document.querySelectorAll('dialog[open]')];if(dialogs.length)return dialogs.at(-1);const fail=document.getElementById('failure');if(visible(fail))return fail;const menu=document.getElementById('menu');return visible(menu)?menu:null;};
 const choices=r=>[...r.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(e=>visible(e)&&e.type!=='hidden');
 const key=e=>e?.id||[...e?.attributes||[]].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value).join('|')||e?.textContent?.trim();
 function focus(e){if(!e)return;if(e!==document.activeElement)actions.uiSound?.('ui-move');document.querySelectorAll('.pad-focus').forEach(n=>n.classList.remove('pad-focus'));e.classList.add('pad-focus');e.focus({preventScroll:true});e.scrollIntoView({block:'nearest',inline:'nearest'});remembered=e;focusKey=key(e);}
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
 function closeTop(){const r=root();if(r?.tagName==='DIALOG'){r.dispatchEvent(new Event('cancel',{cancelable:true}));if(r.open)r.close();lastRoot=null;releaseLatch=[...held];actions.uiSound?.('ui-back');return true;}return false;}
 function activate(){actions.uiSound?.('ui-select');const e=document.activeElement;if(!e)return;if(adjust(e,1))return;if((e.tagName==='INPUT'&&['text','search'].includes(e.type))||e.tagName==='TEXTAREA'){keyboard(e);return;}e.click();}
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
  if(!pad){axes=[0,0,0,0];previous=held=Array(17).fill(false);releaseLatch=Array(17).fill(false);pendingLS=pendingRS=0;if(was){sprint=false;sprintUntil=0;actions.cancelWheel?.();actions.pause();badge.textContent='Controller disconnected. Reconnect or use keyboard.';}document.body.classList.remove('pad-connected');return;}
  id=pad.id;document.body.classList.add('pad-connected');held=Array.from({length:17},(_,i)=>!!pad.buttons[i]&&(pad.buttons[i].pressed||pad.buttons[i].value>.5));axes=Array.from({length:4},(_,i)=>deadzone(pad.axes[i]));
  const edge=buttonEdges(previous,held),released=held.map((v,i)=>!v&&previous[i]);previous=[...held];releaseLatch=releaseLatch.map((v,i)=>v&&held[i]);
  if(stickLatch&&Math.hypot(axes[2],axes[3])<.2)stickLatch=false;
  badge.textContent='Xbox layout connected';if(edge.some(Boolean)){actions.gesture?.();lastInput=now;}if(axes.some(v=>Math.abs(v)>.1))lastInput=now;
  const cfg=getPreferences(),classic=cfg.profile==='classic',r=root();
  if(r){
   downUsed=leftUsed=true;pendingLS=pendingRS=0;actions.cancelWheel?.();help.textContent='D-pad / left stick navigate | A confirm | B back | LB/RB tabs | Right stick scroll';ensure(r);
   if(edge[1]||edge[9]||edge[8]){if(!closeTop()&&edge[9])actions.start();return;}
   const dir=held[12]||axes[1]<-.55?'up':held[13]||axes[1]>.55?'down':held[14]||axes[0]<-.55?'left':held[15]||axes[0]>.55?'right':'';
   if(dir&&(dir!==lastDir||now>=repeatAt)){navigate(r,dir);repeatAt=now+(dir!==lastDir?340:130);}lastDir=dir;
   if(edge[0])activate();if(edge[4])tabs(r,-1);if(edge[5])tabs(r,1);
   if(Math.abs(axes[3])>.1){const scroll=r.querySelector('[data-pad-scroll]')||r;scroll.scrollTop+=axes[3]*dt*460;}return;
  }
  lastRoot=null;lastDir='';
  const s=getState();help.textContent=classic?'X interact | Y ride | RT staff | LT brace/brake | B dodge | View map | Menu pause':s.mode==='foot'?(s.resonance?.tool==='sling'?'LT aim | RT sling | X reload while aiming | Hold X interact | LB equipment | B dodge':'X interact | A jump / tap to sprint | LT brace / aim | RT tool | LB equipment | RB cover'):'RT accelerate | LT brake / reverse | RB handbrake | Y dismount | LS horn | Hold left for music';
  if(!playing()){if(edge[0]||edge[9])actions.start();return;}
  if(edge[9]){actions.cancelWheel?.();actions.pause();return;}if(edge[8]){actions.cancelWheel?.();actions.map();return;}
  if(!active())return;
  const wheel=actions.wheelActive?.();
  if(wheel){
   if(edge[1]){actions.closeWheel?.(false);releaseLatch=[...held];stickLatch=true;return;}
   actions.updateWheel?.(axes[2],axes[3],edge[14]?-1:edge[15]?1:0,edge[12]?-1:edge[13]?1:0);
   const trigger=wheel==='tools'?4:wheel==='music'?14:13;
   if(edge[0]||released[trigger]){actions.closeWheel?.(true);releaseLatch=[...held];stickLatch=true;}
   return;
  }
  if(classic){
   if(edge[0])actions.jump();if(edge[1])actions.dodge();if(edge[2])actions.interact();if(edge[3])actions.vehicle();
   if(edge[4])actions.throwLeft();if(edge[5])actions.throwRight();if(edge[7]&&s.mode==='foot')actions.attack();if(edge[10])sprint=!sprint;if(edge[11])actions.recenter();
   if(edge[12])actions.guide();if(edge[13])actions.journal();if(edge[14])actions.magic();if(edge[15])actions.scan();return;
  }
  const press=i=>edge[i]&&!releaseLatch[i];
  if(press(4)){actions.openWheel?.('tools');return;}
  if(press(13)){downAt=now;downUsed=false;}if(held[13]&&!releaseLatch[13]&&!downUsed&&now-downAt>300){downUsed=true;actions.openWheel?.('disciplines');return;}if(released[13]&&!downUsed){actions.journal();return;}
  if(press(14)){leftAt=now;leftUsed=false;}if(held[14]&&!releaseLatch[14]&&!leftUsed&&now-leftAt>300){leftUsed=true;actions.openWheel?.('music');return;}if(released[14]&&!leftUsed){if(s.mode==='foot')actions.magic();else actions.headlight?.();}
  if(press(10))pendingLS=now;if(press(11))pendingRS=now;
  if(held[10]&&held[11]){if(!chord){chord=true;pendingLS=pendingRS=0;actions.special?.();}}else if(!held[10]&&!held[11])chord=false;
  if(pendingLS&&now-pendingLS>130){if(s.mode==='foot')sprint=!sprint;else actions.horn?.();pendingLS=0;}if(pendingRS&&now-pendingRS>130){actions.recenter();pendingRS=0;}
  if(press(0)&&s.mode==='foot'){if(cfg.repeatSprint!==false&&now-lastA<440)sprintUntil=now+1250;else actions.jump();lastA=now;}
  if(press(1)){if(s.resonance)s.resonance.cover=null;if(s.mode==='bike')actions.jump();else actions.dodge();}
  if(press(2)){xAt=now;xUsed=false;if(held[6]&&s.mode==='foot'&&s.resonance?.tool==='sling')actions.reload?.();else actions.interact();}
  if(held[2]&&held[6]&&s.mode==='foot'&&now-xAt>450&&!xUsed&&!releaseLatch[2]){xUsed=true;releaseLatch[2]=true;actions.interact();}
  if(press(3))actions.vehicle();if(press(5)&&s.mode==='foot')actions.cover?.();if(press(12))actions.dispatch?.();if(press(15))actions.scan();
 }
 function controls(dt){
  const s=getState();if(!connected||root()||!active()||actions.wheelActive?.())return {throttle:0,steer:0,look:0,lookY:0};
  const h=i=>held[i]&&!releaseLatch[i],lookX=stickLatch?0:axes[2],lookY=stickLatch?0:axes[3],classic=getPreferences().profile==='classic';
  if(classic)return {throttle:-axes[1],steer:axes[0],analog:!!axes[1],boost:sprint||(s.mode!=='foot'&&h(7)),brake:h(6)&&s.mode!=='foot',guard:h(6)&&s.mode==='foot',hack:h(15),look:-lookX*dt*2.8,lookY:lookY*dt*2.8};
  const cameraYaw=actions.heading?.()??s.yaw;
  if(s.mode==='foot'){
   const amount=Math.min(1,Math.hypot(axes[0],axes[1]));if(amount>.01)moveYaw=cameraYaw-Math.atan2(axes[0],-axes[1]);
   return {throttle:amount,steer:0,moveYaw:amount>.01?moveYaw:undefined,cameraYaw,analog:true,boost:sprint||performance.now()<sprintUntil,aim:h(6),fire:h(7),hack:h(15),look:-lookX*dt*2.5,lookY:lookY*dt*2.1,consoleCamera:true};
  }
  const reverse=h(6)&&!h(7)&&s.speed<.45;
  return {throttle:h(7)?1:reverse?-1:0,steer:axes[0],analog:false,boost:h(7),brake:h(6)&&!reverse,handbrake:h(5),duck:h(0),hack:h(15),cameraYaw,look:-lookX*dt*2.8,lookY:lookY*dt*2.5};
 }
 function rumble(kind='impact'){
  if(getPreferences().haptics===false)return;let p;try{p=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected&&p.mapping==='standard');}catch{return;}
  const effect=kind==='warning'?{duration:90,weakMagnitude:.18,strongMagnitude:.06}:kind==='success'?{duration:130,weakMagnitude:.3,strongMagnitude:.15}:{duration:120,weakMagnitude:.22,strongMagnitude:.32};
  try{p?.vibrationActuator?.playEffect?.('dual-rumble',{startDelay:0,...effect})?.catch(()=>{});}catch{}
 }
 return {poll,controls,closeTop,rumble,inspect:()=>({connected,id,profile:getPreferences().profile,wheel:actions.wheelActive?.()||null,axes:[...axes],buttons:[...held],sprint,focus:document.activeElement?.id||document.activeElement?.textContent?.trim().slice(0,90),modal:root()?.id||null,lastInput})};
}
