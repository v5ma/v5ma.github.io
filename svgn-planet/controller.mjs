/* Renderer-independent controller navigation, including recovery and new
 * contract dialogs. Standard Xbox mapping; no gameplay input leaks into UI. */
export const padState={connected:false,x:0,y:0,lookX:0,lookY:0,boost:false,brake:false,id:''};
const $=id=>document.getElementById(id),dead=v=>Math.abs(v)<.16?0:Math.sign(v)*(Math.abs(v)-.16)/.84;
let polls=0;let active=null,previous=[],lastScope=null,repeatDirection='',repeatAt=0,navigatedWelcome=false;
const emit=name=>window.dispatchEvent(new CustomEvent('nm-action',{detail:{name}}));
function clear(){for(const key of['x','y','lookX','lookY'])padState[key]=0;padState.boost=padState.brake=false;}
function visible(el){return !!el&&!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';}
function scope(){if(visible($('failure')))return $('failure');const dialogs=[...document.querySelectorAll('dialog[open]')];if(dialogs.length)return dialogs.at(-1);if(visible($('welcome')))return $('welcome');return null;}
function items(root){return [...root.querySelectorAll('button,select,input,a[href],textarea')].filter(visible);}
function focus(el){el?.focus({preventScroll:true});el?.scrollIntoView({block:'nearest',inline:'nearest'});}
function chooseFocus(root){if(root.id==='pause-dialog'&&visible($('confirm-reset')))return $('cancel-reset');return root.querySelector('[data-pad-default]:not(:disabled)')||root.querySelector('.primary:not(:disabled)')||items(root)[0];}
function changeSelect(el,delta){const options=[...el.options].filter(o=>!o.disabled),i=options.indexOf(el.selectedOptions[0]),next=options[(i+delta+options.length)%options.length];if(next){el.value=next.value;el.dispatchEvent(new Event('change',{bubbles:true}));}}
function changeRange(el,delta){const min=Number(el.min||0),max=Number(el.max||100),step=Number(el.step)||1;el.value=String(Math.max(min,Math.min(max,Number(el.value)+step*delta)));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
function navigate(root,direction){const list=items(root);if(!list.length)return;const el=document.activeElement;if(!list.includes(el)){focus(chooseFocus(root));return;}
 if(direction==='left'||direction==='right'){const delta=direction==='left'?-1:1;if(el.tagName==='SELECT'){changeSelect(el,delta);return;}if(el.tagName==='INPUT'&&el.type==='range'){changeRange(el,delta);return;}}
 const increment=direction==='up'||direction==='left'?-1:1;focus(list[(list.indexOf(el)+increment+list.length)%list.length]);if(root.id==='welcome')navigatedWelcome=true;
}
function accept(root){let el=document.activeElement;if(!items(root).includes(el)){focus(chooseFocus(root));el=document.activeElement;}if(!el)return;if(el.tagName==='SELECT')changeSelect(el,1);else if(el.tagName==='INPUT'&&el.type==='range')changeRange(el,1);else if(el.tagName==='TEXTAREA')el.scrollTop+=el.clientHeight*.65;else el.click();}
function back(root){if(root.id==='failure'){if(visible($('diagnostics')))$('diagnostics').hidden=true;focus($('retry'));return;}if(root.id==='welcome')return;if(root.id==='pause-dialog'&&visible($('confirm-reset'))){$('cancel-reset').click();return;}const close=root.querySelector('[data-pad-back]')||root.querySelector('#resume,#map-close,#help-close');if(close)close.click();else root.close();}
export function rumble(strength=.25,duration=95){try{active?.vibrationActuator?.playEffect('dual-rumble',{startDelay:0,duration,weakMagnitude:strength,strongMagnitude:strength*.45})?.catch(()=>{});}catch{}}
function status(text){const el=$('controller-status');if(el&&el.textContent!==text)el.textContent=text;}
function frame(now){
 requestAnimationFrame(frame);polls++;let pads=[];try{pads=[...(navigator.getGamepads?.()||[])].filter(p=>p?.connected&&(p.mapping==='standard'||/xbox/i.test(p.id)));}catch{}
 const used=pads.find(p=>p.buttons.some(b=>b.pressed)||p.axes.some(a=>Math.abs(a)>.3)),pad=used||pads.find(p=>p.index===active?.index)||pads[0];
 if(!pad){if(active){emit('disconnect');previous=[];}active=null;padState.connected=false;padState.id='';clear();document.body.classList.remove('using-gamepad');status('Connect an Xbox controller and press a button.');return;}
 if(active?.index!==pad.index)previous=[];active=pad;padState.connected=true;padState.id=pad.id;const buttons=pad.buttons.map(b=>b.pressed||b.value>.55),edge=i=>buttons[i]&&!previous[i];
 if(document.hidden||!document.hasFocus()){clear();previous=buttons;return;}if(used)document.body.classList.add('using-gamepad');
 const root=scope();if(root!==lastScope){lastScope=root;repeatDirection='';if(root)focus(chooseFocus(root));}
 if(root){
  clear();if(root.id==='welcome'&&!navigatedWelcome&&visible($('start'))&&document.activeElement!==$('start'))focus($('start'));
  const direction=buttons[12]||pad.axes[1]<-.6?'up':buttons[13]||pad.axes[1]>.6?'down':buttons[14]||pad.axes[0]<-.6?'left':buttons[15]||pad.axes[0]>.6?'right':'';
  if(direction&&(direction!==repeatDirection||now>=repeatAt)){navigate(root,direction);repeatAt=now+(direction===repeatDirection?130:390);repeatDirection=direction;}if(!direction)repeatDirection='';
  if(edge(0))accept(root);else if(edge(1))back(root);else if(edge(9)){if(root.id==='welcome')$('start')?.click();else back(root);}else if(edge(8)&&root.id==='map-dialog')back(root);
  const scroll=dead(pad.axes[3]||0);if(Math.abs(scroll)>.1)root.scrollTop+=scroll*15;
 }else{
  padState.x=dead(pad.axes[0]||0);padState.y=-dead(pad.axes[1]||0);const len=Math.max(1,Math.hypot(padState.x,padState.y));padState.x/=len;padState.y/=len;
  padState.lookX=dead(pad.axes[2]||0);padState.lookY=dead(pad.axes[3]||0);padState.boost=(pad.buttons[7]?.value||0)>.2;padState.brake=(pad.buttons[6]?.value||0)>.2||buttons[1];
  const actions={0:'hop',2:'interact',3:'ride',4:'throw',5:'camera',8:'map',9:'pause',10:'bell',11:'recenter',12:'map',13:'jobs',14:'previous-district',15:'next-district'};
  for(const [i,name]of Object.entries(actions))if(edge(Number(i)))emit(name);
 }
 status(root?'Xbox: D-pad navigates | Left/right adjusts | A selects | B returns':'Xbox: RT accelerate | LT/B brake | L3 bell | D-pad down jobs');previous=buttons;
}
window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
Object.defineProperty(window,'NeighborhoodController',{value:Object.freeze({inspect:()=>({...padState,polls,scope:scope()?.id||null,focus:document.activeElement?.id||null})})});requestAnimationFrame(frame);
