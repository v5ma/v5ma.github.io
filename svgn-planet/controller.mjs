/* Independent of WebGL: recovery, confirmations and title UI stay usable when
   rendering is unavailable. Standard Gamepad mapping uses Xbox button labels. */
export const padState={connected:false,x:0,y:0,lookX:0,lookY:0,boost:false,brake:false,id:''};
const $=id=>document.getElementById(id),dead=v=>Math.abs(v)<.19?0:Math.sign(v)*(Math.abs(v)-.19)/.81;
let active=null,previous=[],lastScope=null,repeatDirection='',repeatAt=0,navigatedWelcome=false;
const emit=name=>window.dispatchEvent(new CustomEvent('nm-action',{detail:{name}}));
function clear(){for(const key of['x','y','lookX','lookY'])padState[key]=0;padState.boost=padState.brake=false;}
function visible(el){return !!el&&!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';}
function scope(){if(visible($('failure')))return $('failure');const dialogs=[...document.querySelectorAll('dialog[open]')];if(dialogs.length)return dialogs.at(-1);if(visible($('welcome')))return $('welcome');return null;}
function items(root){return [...root.querySelectorAll('button,select,input,a[href],textarea')].filter(visible);}
function focus(el){el?.focus({preventScroll:true});el?.scrollIntoView({block:'nearest',inline:'nearest'});}
function chooseFocus(root){const reset=$('confirm-reset');if(root.id==='pause-dialog'&&visible(reset))return $('cancel-reset');return root.querySelector('[data-pad-default]:not(:disabled)')||root.querySelector('.primary:not(:disabled)')||items(root)[0];}
function changeSelect(el,delta){const options=[...el.options].filter(o=>!o.disabled);const i=options.indexOf(el.selectedOptions[0]);const next=options[(i+delta+options.length)%options.length];if(next){el.value=next.value;el.dispatchEvent(new Event('change',{bubbles:true}));}}
function navigate(root,direction){const list=items(root);if(!list.length)return;let el=document.activeElement;if(!list.includes(el)){focus(chooseFocus(root));return;}if((direction==='left'||direction==='right')&&el.tagName==='SELECT'){changeSelect(el,direction==='left'?-1:1);return;}
 const increment=direction==='up'||direction==='left'?-1:1;focus(list[(list.indexOf(el)+increment+list.length)%list.length]);if(root.id==='welcome')navigatedWelcome=true;
}
function accept(root){let el=document.activeElement;if(!items(root).includes(el)){focus(chooseFocus(root));el=document.activeElement;}if(!el)return;if(el.tagName==='SELECT')changeSelect(el,1);else if(el.tagName==='TEXTAREA'){el.scrollTop+=el.clientHeight*.65;}else el.click();}
function back(root){if(root.id==='failure'){if(visible($('diagnostics')))$('diagnostics').hidden=true;focus($('retry'));return;}if(root.id==='welcome')return;if(root.id==='pause-dialog'&&visible($('confirm-reset'))){$('cancel-reset').click();focus($('reset'));return;}const close=root.querySelector('[data-pad-back]')||root.querySelector('#resume,#map-close,#help-close');if(close)close.click();else root.close();}
export function rumble(strength=.25,duration=95){try{const effect=active?.vibrationActuator?.playEffect('dual-rumble',{startDelay:0,duration,weakMagnitude:strength,strongMagnitude:strength*.45});effect?.catch(()=>{});}catch{}}
function frame(now){
 requestAnimationFrame(frame);
 let pads=[];try{pads=[...(navigator.getGamepads?.()||[])].filter(p=>p?.connected&&(p.mapping==='standard'||/xbox/i.test(p.id)));}catch{}
 const used=pads.find(p=>p.buttons.some(b=>b.pressed)||p.axes.some(a=>Math.abs(a)>.3));const pad=used||pads.find(p=>p.index===active?.index)||pads[0];
 if(!pad){if(active){emit('disconnect');previous=[];}active=null;padState.connected=false;padState.id='';clear();document.body.classList.remove('using-gamepad');if($('controller-status'))$('controller-status').textContent='Connect an Xbox controller and press a button.';return;}
 if(active?.index!==pad.index)previous=[];active=pad;padState.connected=true;padState.id=pad.id;
 const buttons=pad.buttons.map(b=>b.pressed||b.value>.55),edge=i=>buttons[i]&&!previous[i];
 if(document.hidden||!document.hasFocus()){clear();previous=buttons;return;}
 if(used)document.body.classList.add('using-gamepad');
 const root=scope();if(root!==lastScope){lastScope=root;repeatDirection='';if(root)focus(chooseFocus(root));}
 if(root){
  clear();if(root.id==='welcome'&&!navigatedWelcome&&visible($('start'))&&document.activeElement!==$('start'))focus($('start'));
  const direction=buttons[12]||pad.axes[1]<-.6?'up':buttons[13]||pad.axes[1]>.6?'down':buttons[14]||pad.axes[0]<-.6?'left':buttons[15]||pad.axes[0]>.6?'right':'';
  if(direction&&(direction!==repeatDirection||now>=repeatAt)){navigate(root,direction);repeatAt=now+(direction===repeatDirection?130:390);repeatDirection=direction;}if(!direction)repeatDirection='';
  if(edge(0))accept(root);else if(edge(1))back(root);else if(edge(9)){if(root.id==='welcome')$('start')?.click();else back(root);}else if(edge(8)&&root.id==='map-dialog')back(root);
  const scroll=dead(pad.axes[3]||0);if(Math.abs(scroll)>.1)root.scrollTop+=scroll*15;
 }else{
  padState.x=dead(pad.axes[0]||0);padState.y=-dead(pad.axes[1]||0);const len=Math.max(1,Math.hypot(padState.x,padState.y));padState.x/=len;padState.y/=len;
  padState.lookX=dead(pad.axes[2]||0);padState.lookY=dead(pad.axes[3]||0);padState.boost=(pad.buttons[7]?.value||0)>.2||buttons[10];padState.brake=(pad.buttons[6]?.value||0)>.18||buttons[1];
  const actions={0:'hop',2:'interact',3:'ride',4:'throw',5:'camera',8:'map',9:'pause',11:'recenter',12:'map',13:'help',14:'previous-district',15:'next-district'};
  for(const [i,name]of Object.entries(actions))if(edge(Number(i)))emit(name);
 }
 const status=$('controller-status');if(status)status.textContent=root?'Xbox: D-pad navigates | A selects | B returns':'Xbox connected | RT boost | LT/B brake';previous=buttons;
}
window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
Object.defineProperty(window,'NeighborhoodController',{value:Object.freeze({inspect:()=>({...padState,scope:scope()?.id||null,focus:document.activeElement?.id||null})})});
requestAnimationFrame(frame);
