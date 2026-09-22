import {vaultInventory,vaultText,vaultHint,atVaultGuild,nearVaultNode,reviewVaultAction,commitVaultAction} from './vault-core.mjs';
import {VAULT_BOUNDS,VAULT_NODES,VAULT_ROOMS,vaultSolids,inVaultArea,opticalOpen,serviceOpen,MIRROR_DIRECTIONS} from './vault-data.mjs';
export function createVaultUI({getState,playing,setPause,persist,onChange,frontier}){
 const dialog=document.createElement('dialog');dialog.id='vault-dialog';dialog.setAttribute('aria-label','Lantern Vault survey tools and notes');document.body.append(dialog);
 let notice='';
 function text(tag,value){const e=document.createElement(tag);e.textContent=value;dialog.append(e);return e;}
 function button(id,label,fn,disabled=false){const b=text('button',label);b.id=id;b.type='button';b.disabled=disabled;b.onclick=fn;return b;}
 function act(action){const s=getState(),review=reviewVaultAction(s,action),result=review.ok?commitVaultAction(s,review,persist):review;notice=result.ok?result.text:result.error;onChange(notice);if(dialog.open)render();return result.ok;}
 function render(){
  const s=getState(),v=s.vault;dialog.replaceChildren();text('h2','The Lantern Vault / Survey desk');
  text('p','Leonardo: "The old workshop kept its lamps for people, not for profit. Learn how it worked, and bring that knowledge home."');
  text('p',(vaultText(s)?.text||'Optional survey in Cinder Hollow, east of Gate Camp. Your original Vinci adventure remains available.'));
  if(notice)text('p',notice).setAttribute('role','status');
  if(!v.accepted)button('vault-accept','Borrow both survey tools / free',()=>act('accept'),!atVaultGuild(s)&&nearVaultNode(s)?.id!=='bench');
  else{
   text('h3','Tools and protected evidence');text('p','Selected: '+(v.tool==='lens'?'inspection lens':v.tool==='weight'?'counterweight':'empty hand')+'. Interact at a mechanism to use it. These tools are separate from your combat equipment.');
   for(const i of vaultInventory(v)){text('p',i.name+' / '+i.where+'. '+i.detail);if(i.id!=='plans')button('vault-equip-'+i.id,'Select '+i.name,()=>act('equip:'+i.id),v[i.id]!=='pack');}
   button('vault-equip-hand','Select empty hand',()=>act('equip:hand'));
   text('h3','Workshop state');text('p','Reflector: '+MIRROR_DIRECTIONS[v.mirror]+'. Optical gate: '+(opticalOpen(v)?'open':'closed')+'. Maintenance gate: '+(serviceOpen(v)?'open':'closed')+'. Return latch: '+(v.shortcut?'permanently open':'closed')+'.');
   text('h3','Field notes');text('p',v.notes.includes('inscription')?'Inscription: Raise the shutter; turn the light EAST toward the rising-sun receiver.':'The northern mineral-covered plate can be examined with the inspection lens.');
   text('p',v.notes.includes('account')?'Caretaker: The lamps served families who could not pay. The south gate uses the same counterweight as the shutter.':'The northern observation walk also contains the caretaker account.');
   if(v.record&&!v.reported)button('vault-report','Give Leonardo the plans / receive 40 florins once',()=>act('report'),!atVaultGuild(s));
   if(v.reported)text('p','COMPLETED: The Map House reading instrument is restored. Your reward cannot be claimed twice.');
  }
  button('vault-track',v.tracking?'Follow the original objective instead':'Track the survey objective',()=>act(v.tracking?'untrack':'track'));
  if((s.frontier?.zone==='town'&&Math.hypot(s.x,s.z+17)<4)||(s.frontier?.zone==='badlands'&&Math.hypot(s.x-300,s.z-20)<7))button('vault-expedition','Open original expedition gate controls',()=>{dialog.close();frontier();});
  const close=button('vault-close','Back / Close',()=>dialog.close());close.dataset.padDefault='';
 }
 dialog.addEventListener('close',()=>setPause(false));
 function open(){if(!playing())return false;setPause(true);render();if(!dialog.open)dialog.showModal();return true;}
 function interact(){const s=getState(),n=nearVaultNode(s);if(atVaultGuild(s)&&s.vault.tracking&&!s.road.tracking)return open();if(!n)return false;if(n.id==='bench')return open();act(n.action);return true;}
 function drawMap(canvas,full=false){
  const s=getState();if(!inVaultArea(s))return false;
  const g=canvas.getContext('2d'),w=canvas.width,h=canvas.height,k=Math.min((w-20)/66,(h-36)/38),X=x=>w/2+(x-358)*k,Z=z=>h/2+(z-25)*k;
  g.fillStyle='#193536';g.fillRect(0,0,w,h);g.fillStyle='#637b76';g.fillRect(X(328),Z(10),60*k,30*k);
  g.fillStyle='#dae0c0';for(const b of vaultSolids(s))g.fillRect(X(b.x-b.hx),Z(b.z-b.hz),b.hx*2*k,b.hz*2*k);
  if(full){g.font='11px Arial';g.textAlign='center';g.fillStyle='#ffffff';for(const r of VAULT_ROOMS)g.fillText(r.name,X(r.x),Z(r.z));}
  for(const n of VAULT_NODES){g.fillStyle=n.id==='record'?'#edc471':'#96d1de';g.beginPath();g.arc(X(n.x),Z(n.z),Math.max(2,k*.45),0,7);g.fill();}
  g.fillStyle='#ffffff';g.save();g.translate(X(s.x),Z(s.z));g.rotate(-s.yaw);g.beginPath();g.moveTo(0,6);g.lineTo(-4,-4);g.lineTo(4,-4);g.closePath();g.fill();g.restore();
  g.font=(full?'14':'10')+'px Arial';g.textAlign='center';g.fillText('LANTERN VAULT / SURVEY PLAN',w/2,17);g.fillText('West entrance / Gate Camp and Vinci',w/2,h-8);return true;
 }
 return {open,act,interact,drawMap,hint:()=>vaultHint(getState()),close(){if(!dialog.open)return false;dialog.close();return true;},inspect:()=>({open:dialog.open,notice})};
}
