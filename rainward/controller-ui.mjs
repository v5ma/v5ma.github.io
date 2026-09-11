/* DOM controls stay native for mouse, touch and assistive technology. Controller
 * navigation never opens an OS select popup or calls a blocking browser dialog. */
export function createMenuNavigation(E){
 const memories=new Map(),repeat={y:{sign:0,time:0},x:{sign:0,time:0}};let lastRoot=null,focusedKey=null,usingPad=false;
 const selector='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]';
 const root=()=>document.querySelector('.sheet:not([hidden])');
 const items=r=>r?[...r.querySelectorAll(selector)].filter(el=>!el.closest('[hidden]')&&el.getClientRects().length>0):[];
 const key=el=>el?.id||el?.dataset?.padKey||null;
 const reset=()=>{for(const v of Object.values(repeat)){v.sign=0;v.time=0;}};
 function focus(el,scroll=true){if(!el)return;document.querySelectorAll('.pad-focus').forEach(n=>n.classList.remove('pad-focus'));el.focus({preventScroll:true});if(usingPad)el.classList.add('pad-focus');focusedKey=key(el);if(lastRoot&&focusedKey)memories.set(lastRoot.id,focusedKey);if(scroll)el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
 function enter(){const r=root();if(r===lastRoot)return r;lastRoot=r;reset();focusedKey=null;document.querySelectorAll('.pad-focus').forEach(n=>n.classList.remove('pad-focus'));if(!r)return null;
  const all=items(r),preferred=r.id==='confirm-panel'?'confirm-no':r.id==='pause'?'resume':memories.get(r.id)||({title:'start',pause:'resume',result:'result-next',fatal:'fatal-retry'})[r.id];focus(all.find(el=>key(el)===preferred)||all[0]);return r;
 }
 function current(r,all){if(all.includes(document.activeElement))return document.activeElement;return all.find(el=>key(el)===focusedKey)||all[0];}
 function move(sign){const r=enter(),all=items(r);if(!all.length)return;const i=all.indexOf(current(r,all));focus(all[(i+sign+all.length)%all.length]);}
 function adjust(sign){const r=enter(),all=items(r),el=current(r,all);if(!el)return;
  if(el.tagName==='SELECT'){const options=[...el.options].filter(o=>!o.disabled);if(!options.length)return;const i=options.indexOf(el.selectedOptions[0]);el.value=options[(i+sign+options.length)%options.length].value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));focus(el,false);}
  else if(el.type==='range'){const step=Number(el.step)||1,min=Number(el.min)||0,max=Number(el.max)||100;el.value=String(Math.max(min,Math.min(max,Number(el.value)+sign*step)));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));focus(el,false);}
  else move(sign);
 }
 function activate(){const r=enter(),all=items(r),el=current(r,all);if(!el)return;focus(el,false);if(el.tagName==='SELECT')adjust(1);else if(el.type!=='range')el.click();}
 function pulse(axis,value,dt,fn){const s=Math.abs(value)>.55?Math.sign(value):0,v=repeat[axis];if(!s){v.sign=0;v.time=0;return;}if(s!==v.sign){v.sign=s;v.time=.34;fn(s);}else{v.time-=dt;if(v.time<=0){v.time=.12;fn(s);}}}
 function update(pad,dt){const r=enter();const hint=document.getElementById('controller-menu-hint');if(hint)hint.hidden=!pad.connected||!r;
  if(!pad.connected||!r)return;
  if(pad.actions?.length||Math.abs(pad.nav||0)>.55||Math.abs(pad.navX||0)>.55||Math.abs(pad.scroll||0)>.2||pad.prevTab||pad.nextTab){usingPad=true;document.body.classList.add('using-controller');const all=items(r);focus(current(r,all),false);}
  if(pad.back){E.closePanel();return;}if(pad.actions?.includes('pause')){E.menuButton();return;}if(pad.actions?.includes('map')){E.viewButton();return;}
  if(pad.prevTab||pad.nextTab){E.tab(pad.nextTab?1:-1);return;}
  pulse('y',pad.nav||0,dt,move);pulse('x',pad.navX||0,dt,adjust);
  if(Math.abs(pad.scroll||0)>.15)r.scrollTop+=pad.scroll*dt*600;
  if(pad.confirm)activate();
 }
 document.addEventListener('pointerdown',()=>{usingPad=false;document.body.classList.remove('using-controller');document.querySelectorAll('.pad-focus').forEach(n=>n.classList.remove('pad-focus'));},true);
 document.addEventListener('keydown',event=>{if(E.mode==='play'||E.mode==='xr')return;if(!root())return;const code=event.code;let fn=null;
  if(code==='Escape'||code==='KeyP')fn=()=>E.closePanel();else if(code==='Tab')fn=()=>move(event.shiftKey?-1:1);else if(code==='ArrowDown'||code==='ArrowUp')fn=()=>move(code==='ArrowDown'?1:-1);else if(code==='ArrowRight'||code==='ArrowLeft')fn=()=>adjust(code==='ArrowRight'?1:-1);else if(code==='Enter'||code==='Space')fn=activate;
  if(fn){event.preventDefault();event.stopImmediatePropagation();usingPad=false;document.body.classList.remove('using-controller');if(!event.repeat||code.startsWith('Arrow'))fn();}
 },true);
 return {update,enter,reset(){lastRoot=null;reset();}};
}
