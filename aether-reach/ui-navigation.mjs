/* One dialog lifecycle and one focus model for keyboard, Xbox and spatial XR.
 * No native alert/confirm/prompt: their buttons cannot be driven by Gamepad API. */
import {RepeatInput} from './controller-profile.mjs';
const controls='button,input:not([type="hidden"]),select,textarea,a[href],summary';
const visible=e=>!e.disabled&&!e.hidden&&!e.closest('[hidden]')&&e.getAttribute('aria-disabled')!=='true'&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
export function focusKey(e,index=0){return e?.id||[e?.tagName,e?.dataset.buy,e?.dataset.kind,e?.dataset.track,e?.dataset.bind,e?.name,e?.textContent?.trim(),index].join('|');}
function labelFor(e){const own=(e.getAttribute('aria-label')||e.closest('label')?.textContent||e.textContent||'Control').trim(),value=e.type==='checkbox'?` [${e.checked?'on':'off'}]`:e.type==='range'?` [${e.value}]`:e.tagName==='SELECT'?` [${e.selectedOptions[0]?.textContent||e.value}]`:'';return own+value;}
export function menuItems(root){return root?[...root.querySelectorAll(controls)].filter(visible).map((element,index)=>({element,key:focusKey(element,index),label:labelFor(element),focused:document.activeElement===element})):[];}
export function createModalHost({beforeOpen,afterClose}){
 const stack=[];let closingAll=false;
 const dialogs=()=>[...document.querySelectorAll('dialog')];
 function top(){return [...stack].reverse().find(e=>e.dialog.open)?.dialog||dialogs().filter(d=>d.open).at(-1)||null;}
 function show(id){const dialog=typeof id==='string'?document.getElementById(id):id;if(!dialog||dialog.tagName!=='DIALOG')return false;if(dialog.open)return true;
  const element=document.activeElement;stack.push({dialog,element,key:element?.id});beforeOpen?.();dialog.showModal();const initial=dialog.querySelector('[data-initial-focus]');initial?.focus({preventScroll:true});return true;}
 function closeAll(){closingAll=true;for(const dialog of dialogs().reverse())if(dialog.open)dialog.close();stack.length=0;closingAll=false;}
 document.addEventListener('close',event=>{if(event.target.tagName!=='DIALOG')return;const at=stack.findIndex(e=>e.dialog===event.target),entry=at>=0?stack.splice(at,1)[0]:null,remaining=top();
  if(remaining){const target=entry?.element?.isConnected&&remaining.contains(entry.element)?entry.element:entry?.key?remaining.querySelector('#'+CSS.escape(entry.key)):null;(target||menuItems(remaining)[0]?.element)?.focus({preventScroll:true});}
  else if(!closingAll)afterClose?.();
 },true);
 const confirm=document.createElement('dialog');confirm.id='confirm-dialog';confirm.setAttribute('aria-labelledby','confirm-title');confirm.innerHTML='<p class="eyebrow">EXPEDITION CONFIRMATION</p><h2 id="confirm-title"></h2><p id="confirm-message"></p><div class="confirmation-actions"><button id="confirm-cancel" data-initial-focus>Cancel - keep exploring</button><button id="confirm-accept">Continue</button></div>';document.body.append(confirm);let pending=null;
 confirm.querySelector('#confirm-cancel').onclick=()=>{pending=null;confirm.close();};confirm.querySelector('#confirm-accept').onclick=()=>{const fn=pending;pending=null;confirm.addEventListener('close',()=>fn?.(),{once:true});confirm.close();};confirm.addEventListener('cancel',()=>pending=null);
 return {show,top,dialogs,closeAll,confirm(title,message,accept,fn){if(confirm.open)return;confirm.querySelector('#confirm-title').textContent=title;confirm.querySelector('#confirm-message').textContent=message;confirm.querySelector('#confirm-accept').textContent=accept;pending=fn;show(confirm);}};
}
export function createMenuNavigator({root,back,onFocus}){
 let current=null,index=0,key='',pendingFocus=false;const memory=new WeakMap(),vertical=new RepeatInput(),horizontal=new RepeatInput(.3,.09);
 const footer=document.createElement('div');footer.id='controller-menu-hints';footer.setAttribute('aria-live','polite');footer.hidden=true;document.body.append(footer);
 function focus(item,i,scroll=true){if(!item)return;index=i;key=item.key;item.element.focus({preventScroll:true});if(scroll)item.element.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});memory.set(current,{index,key});onFocus?.();}
 function read(){const next=root();if(!next){current=null;footer.hidden=true;return null;}const items=menuItems(next);
  if(current!==next){current=next;const remembered=memory.get(next);index=remembered?.index||0;key=remembered?.key||'';vertical.reset();horizontal.reset();pendingFocus=true;}
  if(footer.parentElement!==next)next.append(footer);
  let active=items.findIndex(i=>i.element===document.activeElement);
  if(active<0||pendingFocus){const found=items.findIndex(i=>i.key===key);active=found>=0?found:Math.min(index,Math.max(0,items.length-1));if(pendingFocus&&document.activeElement&&next.contains(document.activeElement)){active=Math.max(0,items.findIndex(i=>i.element===document.activeElement));}if(pendingFocus){const chosen=items.findIndex(i=>i.element.hasAttribute('data-initial-focus'));if(chosen>=0)active=chosen;}focus(items[active],active);pendingFocus=false;}
  else{index=active;key=items[active]?.key||'';memory.set(current,{index,key});}
  const focused=items[index]?.element,article=focused?.closest('article'),description=article?article.querySelector('p')?.textContent:next.querySelector('p:not(.eyebrow)')?.textContent;
  return {root:next,title:next.querySelector('h1,h2')?.textContent||'Menu',description:description||'',items:items.map(i=>({...i,focused:document.activeElement===i.element})),index};
 }
 function adjust(element,dir){if(element.type==='range'){const step=Number(element.step)||1,min=Number(element.min)||0,max=element.max===''?100:Number(element.max);element.value=String(Math.max(min,Math.min(max,Math.round((Number(element.value)+dir*step)*1e6)/1e6)));}
  else if(element.tagName==='SELECT'){const choices=[...element.options].filter(o=>!o.disabled),at=choices.indexOf(element.selectedOptions[0]);element.value=choices[Math.max(0,Math.min(choices.length-1,at+dir))]?.value||element.value;}
  else return false;element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));return true;
 }
 function move(m,dir,axis){const e=m.items[index]?.element,group=e?.closest('[data-nav-grid]');let next=index+dir;
  if(group){const cols=Number(group.dataset.navGrid)||3,members=m.items.map((v,i)=>({e:v.element,i})).filter(v=>group.contains(v.e)),at=members.findIndex(v=>v.i===index),candidate=at+dir*(axis==='y'?cols:1);if(candidate>=0&&candidate<members.length)next=members[candidate].i;else next=dir>0?members.at(-1).i+1:members[0].i-1;}
  next=Math.max(0,Math.min(m.items.length-1,next));if(next!==index)focus(m.items[next],next);
 }
 function tick(data,dt,now,xr=false){let m=read();if(!m)return;footer.hidden=xr;footer.textContent='D-pad / left stick: navigate   A: select   B: back   Left / right: adjust   Right stick / LT / RT: scroll   LB / RB: page';
  if(data.edges.back||data.edges.pause||(data.edges.map&&m.root.id==='map-dialog')){back(m);return;}
  const axis=data.menuAxis||data.move||[0,0],dy=data.held.next?-1:data.held.previous?1:axis[1],dx=data.held.field?-1:data.held.shop?1:axis[0];
  const y=vertical.update(dy,now),x=horizontal.update(dx,now);if(y)move(m,y,'y');if(x&&!adjust(m.items[index]?.element||{},x))move(m,x,'x');
  if(data.edges.pulse||data.edges.reverse){const next=Math.max(0,Math.min(m.items.length-1,index+(data.edges.reverse?5:-5)));focus(m.items[next],next);}
  const scroll=(data.look?.[1]||data.scroll||0)+(xr?0:(data.held.fire?1:0)-(data.held.aim?1:0));if(scroll){const scrollRoot=m.root.tagName==='DIALOG'?m.root:document.querySelector('.title-copy');scrollRoot?.scrollBy({top:scroll*Math.min(dt,.1)*650,behavior:'instant'});}
  if(data.edges.confirm||data.edges.jump){const e=m.items[index]?.element;if(e){memory.set(current,{index,key:focusKey(e,index)});if(e.tagName==='SELECT')adjust(e,1);else if(e.type!=='range')e.click();}}
 }
 return {read,tick,reset(){vertical.reset();horizontal.reset();},get current(){return current;}};
}
