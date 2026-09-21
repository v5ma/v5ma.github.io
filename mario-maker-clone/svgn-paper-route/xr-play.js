/* Sky Cycle spatial workspace: one game, one renderer, explicit VR/AR sessions.
 * Native WebXR preserves the pinned Three node materials, saves and input owners.
 * DOM menus remain authoritative; XR mirrors their controls rather than inventing
 * another progression model. Canvas rays are ordinary editor pointer events.
 */
import * as T from './vendor/three.webgpu.js';
import {addOverlay,POINTER_ORDER} from './xr-overlay.mjs';
import {protectOpaqueXRFramebuffer} from './xr-webgl-compat.mjs';
import {createMenuInput,trackedController,aimChanged} from './xr-menu-input.mjs';
import {mappedPad,sourcesNeutral,pointInRects} from './xr-input-core.mjs';
import {controls,menuEntries,controlLabel,wrapText,paginate,editValue,visible,focusEntry} from './xr-ui-core.mjs';
import {createWorldAperture} from './xr-world-aperture.mjs';
import {stageSettings,sessionOptions,presentation,clipPlanes} from './xr-spatial-core.mjs';
const menuInput=createMenuInput();let menuCursor=0,menuNavigating=false,lastMenuAction=null;
const $=id=>document.getElementById(id),fd=()=>window.SkyCycleFlightDeck;
const panel=()=>fd()?.topPanel();
let session=null,starting=false,presenting=false,finishing=false,neutral=true,renderer=null,originalRender=null,originalScene=null,oldView=null;
let restoreFramebuffer=()=>{},oldClear=null,oldAlpha=1,xrScene=null,anchor=null,world=null,clip=null,camera=null,ui=null,texture=null,context=null,canvas=null;
let reference=null,rects=[],page=0,lastPanel=null,lastUI=0,lastFrame=null,recenter=true;
let keyboardDialog=null,aperture=null,rayFocus=null;
let sessionMode='immersive-vr',selectedMode='immersive-vr',spatial=stageSettings(),virtualRoot=null,typing=null,typingShift=false,typingSymbols=false;
let screen=null,screenTexture=null,screenCanvas=null,screenContext=null,screenSource=null,screenPointer=null,screenMode='diorama';
let held=new Set(),suppressed=new Set(),presses=new Map(),pulses=new Map(),visuals=new Map(),ctxDown=false,frameCount=0,eyeCount=0,errorText='',entryPanel=null;
let lastMenuKey='',uiMessage='',uiMessageUntil=0,focusLabel='',supportState={vr:false,ar:false},pendingHandoff=null;
const ctl=new T.Matrix4(),rotation=new T.Quaternion(),raycaster=new T.Raycaster(),vector=new T.Vector3(),forward=new T.Vector3(0,0,-1);
const lastHit=new T.Vector3(),poseForward=new T.Vector3();
const guide=document.createElement('dialog');guide.id='sky-xr-guide';guide.setAttribute('aria-labelledby','sky-xr-title');
guide.innerHTML='<h2 id="sky-xr-title">Sky Cycle / AR and VR</h2><p>Play the same cycling adventure as a stereoscopic miniature in VR or against your room in AR. The browser supplies passthrough; this game does not read camera pixels.</p><p>Left stick rides and brakes. Right A jumps, right trigger throws, right grip whips, left trigger boosts. Right B pauses or goes back; left Y opens Flight Deck. Point and trigger or hand-pinch to use menus. Either stick navigates menus. Gripping a controller never blocks Back. The action bar appears for hands only; controller play has no floating menu slab.</p><p>Routes, results, settings, text fields and Workshop tools share in-headset controls. The 2D game and editor use a floating live canvas. AR has a seated placement fallback: Recenter, scale, height, distance and rotation are always available. No room scan is required.</p><p>WebGL is required. A WebGPU browser handoff reloads the current route and must protect unsaved drafts. Switching AR/VR sessions returns here for another deliberate entry. Stay seated with clear space.</p><p id="sky-xr-status" role="status">Checking immersive support...</p><div class="xr-actions"><button id="sky-xr-enter" class="delivery-btn" disabled>Enter VR</button><button id="sky-xr-enter-ar" class="delivery-btn" disabled>Enter AR</button><button id="sky-xr-cancel" class="delivery-btn">Back</button></div>';
document.body.append(guide);
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./xr-workspace.css',import.meta.url);document.head.append(style);
const settingsDialog=document.createElement('dialog');settingsDialog.id='sky-xr-settings';
settingsDialog.innerHTML='<h2>Spatial setup</h2><p>The exhibit is placed relative to your seated view. These controls move only the presentation, never the rider or collision.</p>'+[['scale','Exhibit size',.6,1.8,.1,1],['height','Exhibit height',-.75,.75,.05,0],['distance','Exhibit distance',1.4,4,.1,2.4],['yaw','Exhibit rotation',-180,180,15,0]].map(([k,l,min,max,step,val])=>`<label for="xr-stage-${k}">${l}</label><input id="xr-stage-${k}" aria-label="${l}" type="range" min="${min}" max="${max}" step="${step}" value="${val}">`).join('')+'<button id="xr-stage-center">Recenter exhibit</button><button id="xr-stage-switch">Change AR / VR mode</button><button id="xr-stage-exit">Exit XR</button><form method="dialog"><button>Back</button></form>';
document.body.append(settingsDialog);
for(const k of ['scale','height','distance','yaw'])$('xr-stage-'+k).oninput=e=>{spatial=stageSettings({...spatial,[k]:e.target.value});};
$('xr-stage-exit').onclick=()=>{settingsDialog.close();endSession();};
$('xr-stage-center').onclick=()=>{recenter=true;};
$('xr-stage-switch').onclick=()=>{selectedMode=sessionMode==='immersive-ar'?'immersive-vr':'immersive-ar';pendingHandoff=()=>show();settingsDialog.close();endSession();};
$('sky-xr-cancel').onclick=()=>guide.close();guide.addEventListener('cancel',e=>{e.preventDefault();guide.close();});
function status(text){errorText=text;$('sky-xr-status').textContent=text;uiMessage=text;uiMessageUntil=performance.now()+6500;lastUI=0;}
async function support(){
  try {const checks=await Promise.allSettled(['immersive-vr','immersive-ar'].map(m=>navigator.xr?.isSessionSupported(m)||false));
    supportState={vr:checks[0].status==='fulfilled'&&checks[0].value,ar:checks[1].status==='fulfilled'&&checks[1].value};
    $('sky-xr-enter').disabled=!supportState.vr;$('sky-xr-enter-ar').disabled=!supportState.ar;
    status(!supportState.vr&&!supportState.ar?'Immersive XR is unavailable here. Desktop, touch and Xbox play remain available.':`VR ${supportState.vr?'available':'unavailable'} / AR ${supportState.ar?'available':'unavailable'}. Physical-device comfort and tracking qualification remain open.`);
  } catch(e){status('XR capability check failed: '+e.message);}
}
function show(){if(presenting){pause();settingsDialog.showModal();return;}if(!guide.open){pause();guide.showModal();$('sky-xr-cancel').focus();}support();}
function mount(){const deck=document.querySelector('#flight-deck .fd-actions');if(deck&&!$('sky-xr-tools')){const b=document.createElement('button');b.id='sky-xr-tools';b.hidden=!presenting;b.textContent='Game and editor menus';b.onclick=()=>{fd()?.releaseForTravel();$('flight-deck')?.close();openWorkspace();};deck.append(b);}for(const [id,selector]of[['sky-xr-open','#delivery-header .actions'],['sky-xr-pause','#delivery-pause .delivery-pause-card'],['sky-xr-deck','#flight-deck .fd-actions'],['sky-xr-workshop','#route-workshop .maker-actions']]){const root=document.querySelector(selector);if(root&&!$(id)){const b=document.createElement('button');b.id=id;b.className='delivery-btn';b.textContent='AR / VR';b.onclick=show;root.append(b);}}}
mount();
function pointerEvent(type,hit,source=screenPointer?.source){
  const target=screenPointer?.target||screenSource;if(!target||!hit)return;
  const box=target.getBoundingClientRect(),clientX=box.left+hit.x*box.width,clientY=box.top+hit.y*box.height;
  const init={bubbles:true,cancelable:true,clientX,clientY,button:0,buttons:type==='pointerup'||type==='pointercancel'?0:screenPointer?1:0,pointerId:701,pointerType:'pen',isPrimary:true};
  const pointerAccepted=target.dispatchEvent(new PointerEvent(type,init));
  // Pointer-aware curve tools can claim the gesture. Do not also start the
  // older mouse-paint path when its pointer handler prevented the default.
  if(type==='pointerdown'&&screenPointer)screenPointer.mouseCompat=target.id!=='maker-canvas'&&pointerAccepted;
  if(screenPointer?.mouseCompat){
    const terminal=type==='pointerup'||type==='pointercancel';
    if(terminal||pointerAccepted)target.dispatchEvent(new MouseEvent(terminal?'mouseup':type.replace('pointer','mouse'),{...init,buttons:terminal?0:init.buttons}));
    // Legacy mouse editing ends through its native mouseup/undo path on loss;
    // modern pointer editors retain their own pointercancel semantics.
    if(terminal)screenPointer.mouseCompat=false;
  }
}
function release(){
  if(screenPointer){pointerEvent('pointercancel',screenPointer.hit);screenPointer=null;}
  rayFocus=null;held.clear();presses.clear();pulses.clear();suppressed.clear();ctxDown=false;neutral=true;fd()?.resetInput();
}
function pause(){if(window.__delivery?.state&&!__delivery.state.menu&&!__delivery.paused)__delivery.act('pause');release();}
function endSession(){pause();session?.end().catch(e=>status(e.message));}
function disposeObject(root){const geometries=new Set(),materials=new Set();root?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
function makeStage(){
  xrScene=new T.Scene();xrScene.background=sessionMode==='immersive-ar'?null:new T.Color('#112239');
  anchor=new T.Group();xrScene.add(anchor);clip=new T.Group();clip.enabled=sessionMode==='immersive-ar';aperture=createWorldAperture(T);anchor.add(clip);
  world=new T.Group();clip.add(world);world.add(originalScene);camera=new T.PerspectiveCamera(55,1,.05,40);xrScene.add(camera);
  canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;context=canvas.getContext('2d');texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  ui=new T.Mesh(new T.PlaneGeometry(1.5,1.125),new T.MeshBasicNodeMaterial({map:texture}));addOverlay(T,anchor,ui);ui.position.set(0,-.15,-1.45);
  screenCanvas=document.createElement('canvas');screenCanvas.width=1440;screenCanvas.height=900;screenContext=screenCanvas.getContext('2d');
  screenTexture=new T.CanvasTexture(screenCanvas);screenTexture.colorSpace=T.SRGBColorSpace;
  screen=new T.Mesh(new T.PlaneGeometry(2.7,1.6875),new T.MeshBasicNodeMaterial({map:screenTexture,side:T.DoubleSide,fog:false,toneMapped:false}));anchor.add(screen);
  lastPanel=null;lastMenuKey='';lastUI=0;recenter=true;
}
function text(s,x,y,max,width=1060,font=23){context.font=`${font}px sans-serif`;const lines=wrapText(context,s,width,context.font);for(let i=0;i<Math.min(lines.length,max);i++)context.fillText(lines[i],x,y+i*(font+7));return Math.min(lines.length,max)*(font+7);}
function button(label,x,y,w,h,action,hover=null,control=null){context.fillStyle=focusLabel===label?'#365e70':'#18384c';context.fillRect(x,y,w,h);context.strokeStyle='#97dfd2';context.lineWidth=2;context.strokeRect(x,y,w,h);context.fillStyle='#f4fbff';text(label,x+14,y+29,2,w-24,22);rects.push({x,y,w,h,label,action,hover,control});}
function openWorkspace(){
  if(!presenting)return;
  if(typing)back();
  fd()?.releaseForTravel();
  // Root navigation cancels uncommitted dialogs; it never approves their action.
  for(const d of document.querySelectorAll('dialog[open]'))d.close();
  for(const id of ['ctrlov','hangov','machov','shopov','commov','lvlov','acctov','winov']){const p=$(id);if(p?.classList.contains('show'))fd()?.back(p);}
  pause();virtualRoot=window.RouteWorkshop?.active?$('route-workshop'):screenMode==='editor'?$('topbar'):document.querySelector('#delivery-header');page=0;lastPanel=null;lastUI=0;
}
function resumeWorkspace(){
  fd()?.releaseForTravel();if(typing)back();
  for(const d of document.querySelectorAll('dialog[open]'))d.close();
  for(const id of ['ctrlov','hangov','machov','shopov','commov','lvlov','acctov']){const p=$(id);if(p?.classList.contains('show'))fd()?.back(p);}
  virtualRoot=null;release();lastUI=0;
  if(!window.RouteWorkshop?.active&&typeof mode!=='undefined'&&mode==='play'&&!won)__delivery.act('resume');
}
function back(current=panel()){
  if(typing){typing=null;keyboardDialog?.close();release();lastUI=0;return true;}
  if(virtualRoot&&current===virtualRoot){virtualRoot=null;release();lastUI=0;return true;}
  return false;
}
function edit(el){
  typing={el,value:el.value,root:panel()};typingShift=false;typingSymbols=false;
  keyboardDialog=document.createElement('dialog');keyboardDialog.id='sky-xr-keyboard';keyboardDialog.className='xr-question';
  keyboardDialog.innerHTML='<h2>In-headset keyboard</h2><p>Point and select a key, or use controller focus and A. Apply commits the field; Cancel leaves it unchanged.</p><div class="xr-keyboard-keys"></div>';
  const owner=keyboardDialog;document.body.append(owner);owner.addEventListener('close',()=>{if(keyboardDialog===owner){typing=null;keyboardDialog=null;}owner.remove();release();lastUI=0;},{once:true});
  refreshKeyboard();keyboardDialog.showModal();keyboardDialog.querySelector('button')?.focus();release();lastUI=0;
}
function refreshKeyboard(){
  if(!keyboardDialog)return;const root=keyboardDialog.querySelector('.xr-keyboard-keys'),focus=document.activeElement?.dataset.xrKey;
  root.replaceChildren();const rows=typingSymbols?['1234567890','-_=+@#%&*','.,:;!?/()']:['qwertyuiop','asdfghjkl','zxcvbnm'];
  const keys=rows.join('').split('').map(k=>typingShift?k.toUpperCase():k);
  for(const label of [...keys,'Shift',typingSymbols?'Letters':'Symbols','Space','Backspace','Clear text','New line','Apply text','Cancel edit']){
    const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.xrKey=label;
    b.onclick=()=>{if(!typing)return;if(label==='Shift'){typingShift=!typingShift;refreshKeyboard();}else if(label==='Letters'||label==='Symbols'){typingSymbols=!typingSymbols;refreshKeyboard();}else if(label==='Apply text')applyEdit();else if(label==='Cancel edit')back();else typing.value=label==='Clear text'?'':editValue(typing.value,label,typing.el.maxLength);lastUI=0;};root.append(b);
  }
  [...root.children].find(b=>b.dataset.xrKey===focus)?.focus({preventScroll:true});
}
function applyEdit(){
  const e=typing;if(!e)return;
  if(!visible(e.el)||e.el.disabled){typing=null;keyboardDialog?.close();status('This field is no longer available.');return;}
  const old=e.el.value;e.el.value=e.value;
  if(!e.el.checkValidity()){e.el.value=old;status('The value does not match this field. Check its format or limits.');return;}
  typing=null;keyboardDialog?.close();e.el.dispatchEvent(new Event('input',{bubbles:true}));e.el.dispatchEvent(new Event('change',{bubbles:true}));release();lastUI=0;
}
function promptDialog(question,kind,initial,done){
  const d=document.createElement('dialog');d.className='xr-question';d.setAttribute('aria-label',kind==='confirm'?'Confirm action':'Enter text');
  const h=document.createElement('h2');h.textContent=kind==='confirm'?'Confirm action':kind==='notice'?'Game message':'Enter text';d.append(h);
  const t=document.createElement('p');t.textContent=question;d.append(t);
  let field=null;if(kind==='prompt'){field=document.createElement('textarea');field.setAttribute('aria-label','Response');field.value=initial||'';field.maxLength=65536;d.append(field);}
  const cancel=document.createElement('button');cancel.textContent='Cancel';const yes=document.createElement('button');yes.textContent=kind==='confirm'?'Confirm':kind==='notice'?'Done':'Apply response';d.append(cancel,yes);
  let accepted=false;cancel.onclick=()=>d.close();yes.onclick=()=>{accepted=true;const value=field?field.value:true;d.close();done(value);};
  d.addEventListener('close',()=>{d.remove();release();lastUI=0;if(!accepted)status('Cancelled. No approval was given.');},{once:true});document.body.append(d);d.showModal();cancel.focus();
}
function invoke(el,answers=[]){
  if(!visible(el)||el.disabled)return;
  // File/system dialogs cannot be rendered in the WebXR layer. Handoff is explicit.
  if(el.matches('[data-mk="import"],#rail-update,#btnFull,#btnCopy,#btnLink,.cbind')){external(el);return;}
  let request=null,index=0,changed=false;
  const native={confirm:window.confirm,prompt:window.prompt,alert:window.alert};
  const ask=(kind,question,initial)=>{
    const prior=answers[index++];
    if(prior){if(prior.kind!==kind||prior.question!==String(question)){changed=true;return kind==='confirm'?false:null;}return prior.value;}
    if(!request)request={kind,question:String(question),initial};
    return kind==='confirm'?false:null;
  };
  // These legacy synchronous guards return cancellation before destructive work.
  // Approval replays only this same connected control, with exact-question tokens.
  // Tokens are scoped to this synchronous call and are never saved or logged.
  window.confirm=q=>ask('confirm',q);window.prompt=(q,v)=>ask('prompt',q,v);window.alert=q=>{if(!request)request={kind:'alert',question:String(q)};};
  try{el.focus({preventScroll:true});el.click();}finally{Object.assign(window,native);}
  if(changed){status('The action changed while awaiting approval. Select it again.');return;}
  if(request){if(request.kind==='alert')promptDialog(request.question,'notice',null,()=>{});else promptDialog(request.question,request.kind,request.initial,value=>{if(visible(el)&&!el.disabled)invoke(el,[...answers,{...request,value}]);});}
  if(virtualRoot&&(!visible(virtualRoot)||el.matches('[data-delivery="routes"],[data-delivery="editor"],#workshop-edit-current,#maker-return,[data-mk="test"],[data-mk="legacy"],[data-mk="exit"],#btnPlay')))virtualRoot=null;
}
function activate(el){
  if(!presenting)return false;
  if(el.matches('input[type="range"],select'))return true;
  const entry=menuEntries(panel(),{invoke,edit,external}).find(e=>e.el===el && !e.label.endsWith('minus')&&!e.label.endsWith('plus'));
  if(entry)entry.action();else invoke(el);return true;
}
function activateRay(){
  if(!presenting||session?.visibilityState!=='visible'||!panel())return false;
  const r=rects.find(r=>r.label===rayFocus&&!r.hover&&typeof r.action==='function');
  if(!r)return false;r.action();lastUI=0;return true;
}
function focusControl(el){
  if(!presenting)return;
  if(typing){focusLabel=el.dataset.xrKey||'';lastUI=0;return;}
  const entries=menuEntries(panel(),{invoke,edit,external});const focused=focusEntry(entries,el,page);
  if(focused){page=focused.page;focusLabel=focused.label;lastUI=0;}
}
document.addEventListener('focusin',e=>{if(presenting){rayFocus=null;focusControl(e.target);}});
function external(el){
  promptDialog('This browser-owned action needs the normal browser view. Leave XR, then choose Continue in the browser? Your current game or draft is kept paused.','confirm',null,()=>{
    pendingHandoff=()=>{
      const d=document.createElement('dialog');d.className='xr-question';d.innerHTML='<h2>Continue in browser</h2><p>XR has ended. Your game and draft remain in this tab.</p><button>Continue</button><form method="dialog"><button>Cancel</button></form>';
      d.querySelector('button').onclick=()=>{d.close();if(el.isConnected&&!el.disabled)el.click();};d.addEventListener('close',()=>d.remove(),{once:true});document.body.append(d);d.showModal();
    };endSession();
  });
}
function reading(current){
  const walk=document.createTreeWalker(current,NodeFilter.SHOW_TEXT),parts=[];
  while(walk.nextNode()){
    const node=walk.currentNode,parent=node.parentElement;
    if(!parent||parent.closest('button,a,input,select,textarea,script,style,canvas,summary,[role="button"]')||!visible(parent))continue;
    const value=node.textContent.trim();if(value)parts.push(value);
  }
  return parts.join('\n');
}
function keyButton(label,x,y,w,h){const el=[...(keyboardDialog?.querySelectorAll('button')||[])].find(e=>e.dataset.xrKey===label);button(label,x,y,w,h,()=>el?.click(),()=>el?.focus({preventScroll:true}));}
function drawKeyboard(){
  const e=typing;context.fillStyle='#142b3c';context.fillRect(0,0,1200,900);context.fillStyle='#f4fbff';
  text('Edit '+controlLabel(e.el),35,44,1,1130,28);text(e.el.type==='password'?'Private text (hidden)':e.value.slice(-220)||'(empty)',35,94,4,1130,24);
  const rows=typingSymbols?['1234567890','-_=+@#%&*','.,:;!?/()']:['qwertyuiop','asdfghjkl','zxcvbnm'];
  rows.forEach((row,r)=>[...row].forEach((letter,i)=>{const key=typingShift?letter.toUpperCase():letter;keyButton(key,35+i*112,260+r*91,102,76);}));
  for(const [i,label]of ['Shift',typingSymbols?'Letters':'Symbols','Space','Backspace'].entries())keyButton(label,35+i*284,558,268,76);
  ['Clear text','New line','Apply text','Cancel edit'].forEach((label,i)=>keyButton(label,35+i*284,657,268,68));
}
function makeMenu(now,force=false){
  for(const e of document.querySelectorAll('#ctrlrows .cbind'))if(!e.hasAttribute('tabindex')){e.tabIndex=0;e.setAttribute('role','button');e.setAttribute('aria-label',(e.parentElement.firstElementChild?.textContent||'Binding')+' '+e.textContent+' / browser hardware binding');}

  const current=panel();const key=(current?.id||current?.className||'play')+'|'+screenMode+'|'+!!typing;
  if(current!==lastPanel||key!==lastMenuKey){lastPanel=current;lastMenuKey=key;page=0;menuCursor=0;menuNavigating=false;release();lastUI=0;}
  if(!force&&now-lastUI<150)return;lastUI=now;rects=[];
  ui.visible=!!current||!!typing||[...(session?.inputSources||[])].some(s=>s.hand)||screenMode==='workshop'||screenMode==='editor';
  if(!ui.visible)return;
  context.clearRect(0,0,1200,900);context.fillStyle='#f4fbff';
  if(typing){ui.position.set(0,-.08,-1.8);ui.scale.setScalar(.95);drawKeyboard();}
  else if(current){
    ui.position.set(0,-.08,-1.8);ui.scale.setScalar(.95);context.fillStyle='#132b40';context.fillRect(0,0,1200,900);context.fillStyle='#f4fbff';
    const title=current.querySelector('h1,h2,h3')?.textContent||current.getAttribute('aria-label')||(current.id==='delivery-header'?'All game menus':'Sky Cycle menu');text(title,35,44,1,820,29);
    const entries=menuEntries(current,{invoke,edit,external,valid:()=>panel()===current&&!typing});
    const paragraphs=wrapText(context,reading(current),1120,'22px sans-serif'),count=Math.max(1,Math.ceil(entries.length/6),Math.ceil(paragraphs.length/5));page=Math.min(page,count-1);
    paragraphs.slice(page*5,page*5+5).forEach((line,i)=>text(line,35,90+i*29,1,1120,22));
    entries.slice(page*6,page*6+6).forEach((e,i)=>button(e.label,35,252+i*77,1130,67,()=>{e.action();lastUI=0;},()=>e.el.focus({preventScroll:true}),e.el));
    button('Previous',35,724,330,62,()=>{page=(page-1+count)%count;release();});button(`Page ${page+1} / ${count} - Next`,380,724,435,62,()=>{page=(page+1)%count;release();});
    button(current===virtualRoot&&screenMode==='workshop'?'Resume editing':'Back',830,724,335,62,()=>{if(!back(current))fd()?.back(current);});
  } else {
    ui.position.set(0,-.43,-1.65);ui.scale.setScalar(.8);
    const editing=screenMode==='workshop'||screenMode==='editor';
    const items=screenMode==='editor'?[['Editor tools',openWorkspace],['Undo',()=>invoke($('btnUndo'))],['Redo',()=>invoke($('btnRedo'))],['Save code',()=>invoke($('btnSave'))],['Machines',()=>invoke($('btnLoad'))],['Controls',()=>invoke($('btnCtrl'))],['Playtest',()=>{invoke($('btnPlay'));virtualRoot=null;}],['All menus',openWorkspace],['Spatial setup',show]]:editing?[['Editor tools',()=>openWorkspace()],['Undo',()=>$('route-workshop')?.querySelector('[data-mk="undo"]')?.click()],['Redo',()=>$('route-workshop')?.querySelector('[data-mk="redo"]')?.click()],['Zoom in',()=>$('route-workshop')?.querySelector('[data-mk="zoomin"]')?.click()],['Zoom out',()=>$('route-workshop')?.querySelector('[data-mk="zoomout"]')?.click()],['Fit level',()=>$('route-workshop')?.querySelector('[data-mk="fit"]')?.click()],['Playtest',()=>invoke($('route-workshop')?.querySelector('[data-mk="test"]'))],['Select / move',()=>invoke($('route-workshop')?.querySelector('[data-tool="select"]'))],['Pan',()=>invoke($('route-workshop')?.querySelector('[data-tool="pan"]'))]]:
      [['Ride left','left'],['Ride right','right'],['Jump','jump'],['Paper','paper'],['Whip','whip'],['Boost','boost'],['Use nearby','use'],['Pause','pause'],['Portal atlas','portal']];
    context.fillStyle='#132b40';context.fillRect(20,510,1160,290);context.fillStyle='#f4fbff';
    text(editing?'WORKSHOP / point at the live canvas to select or drag':`SKY CYCLE / ${sessionMode==='immersive-ar'?'AR':'VR'} / ${typeof deliveries!=='undefined'?deliveries:0} deliveries`,35,538,1,1110,23);
    items.forEach(([label,action],i)=>button(label,35+(i%3)*382,556+Math.floor(i/3)*80,365,70,action));
  }
  if(current)button(window.RouteWorkshop?.active?'Resume editing now':'Resume play',895,10,270,62,resumeWorkspace);
  button('Recenter',35,822,255,62,()=>{recenter=true;});button('All menus',305,822,275,62,openWorkspace);button('Spatial setup',595,822,285,62,show);button('Exit XR',895,822,270,62,endSession);
  if(uiMessageUntil>now){context.fillStyle='#10283a';context.fillRect(20,790,1160,27);context.fillStyle='#f7e9b4';text(uiMessage,35,810,1,1110,16);}
  if(current){context.fillStyle='#10283a';context.fillRect(20,790,1160,27);context.fillStyle='#f7e9b4';text('v'+(window.PaperDeliveryRelease?.version||'0.27.0')+' | A/X select; B/Y back; triggers select; grips/sticks move | '+menuInput.diagnostics.last,35,810,1,1110,16);}
  texture.needsUpdate=true;
}
function tracked(source){let entry=visuals.get(source);if(entry)return entry;
 const root=new T.Group();xrScene.add(root);const ray=new T.Mesh(new T.CylinderGeometry(.002,.002,1,6),new T.MeshBasicNodeMaterial({color:source.handedness==='left'?'#79dacb':'#ffc878'}));ray.rotation.x=Math.PI/2;ray.position.z=-.5;root.add(ray);
 const grip=new T.Mesh(new T.SphereGeometry(.016,8,6),new T.MeshBasicNodeMaterial({color:'#e5f7ff'}));xrScene.add(grip);const joints=[];
 if(source.hand){const g=new T.SphereGeometry(1,6,4),mat=new T.MeshBasicNodeMaterial({color:'#a5e8dd'});for(let i=0;i<25;i++){const m=new T.Mesh(g,mat);xrScene.add(m);joints.push(m);}}
 const dot=new T.Mesh(new T.SphereGeometry(.009,8,6),new T.MeshBasicNodeMaterial({color:'#ffffff',depthTest:false}));addOverlay(T,xrScene,dot,POINTER_ORDER);entry={root,grip,joints,dot,ray};visuals.set(source,entry);return entry;
}
function poseObject(object,pose){object.visible=!!pose;if(pose){object.matrix.fromArray(pose.transform.matrix);object.matrix.decompose(object.position,object.quaternion,object.scale);}}
function updateTracking(frame){for(const [source,v] of visuals)if(![...session.inputSources].includes(source)){xrScene.remove(v.root,v.grip,v.dot.parent,...v.joints);disposeObject(v.dot);disposeObject(v.root);disposeObject(v.grip);for(const j of v.joints)disposeObject(j);visuals.delete(source);}
 for(const source of session.inputSources){const v=tracked(source);const rayPose=frame.getPose(source.targetRaySpace,reference),moved=!!rayPose&&aimChanged(v.aim,rayPose.transform.matrix);if(moved)v.aim=Array.from(rayPose.transform.matrix);poseObject(v.root,rayPose);poseObject(v.grip,source.gripSpace?frame.getPose(source.gripSpace,reference):null);const r=hit(source,frame)||((screenMode==='workshop'||screenMode==='editor')&&canvasHit(source,frame)?{label:'Live editor canvas'}:null);v.dot.visible=!!r;if(r){v.dot.position.copy(raycaster.ray.at(raycaster.ray.origin.distanceTo(lastHit),vector));const len=raycaster.ray.origin.distanceTo(lastHit);v.ray.scale.y=len;v.ray.position.z=-len/2;if(v.hover!==r.label||v.menuKey!==lastMenuKey||moved){v.hover=r.label;v.menuKey=lastMenuKey;menuNavigating=false;focusLabel=r.label;rayFocus=r.hover?null:r.label;r.hover?.();lastUI=0;}}else{v.hover=null;v.ray.scale.y=1.4;v.ray.position.z=-.7;}if(source.hand){let i=0;for(const joint of source.hand.values()){const j=v.joints[i++];if(!j)break;const p=frame.getJointPose?.(joint,reference);poseObject(j,p);if(p)j.scale.setScalar(Math.max(.003,Math.min(.015,p.radius||.005)));}for(;i<v.joints.length;i++)v.joints[i].visible=false;}}
}

function sourceRay(source,frame){
  if(!frame||!reference)return false;const pose=frame.getPose(source.targetRaySpace,reference);if(!pose)return false;
  ctl.fromArray(pose.transform.matrix);ctl.decompose(raycaster.ray.origin,rotation,vector);raycaster.ray.direction.copy(forward).applyQuaternion(rotation);xrScene.updateMatrixWorld(true);return true;
}
function hit(source,frame){
  if(!ui?.visible||!sourceRay(source,frame))return null;const h=raycaster.intersectObject(ui,false)[0];
  if(h){const r=pointInRects(h.uv.x*1200,(1-h.uv.y)*900,rects);if(r){lastHit.copy(h.point);return r;}}
  return null;
}
function canvasHit(source,frame){
  if(!screen?.visible||panel()||typing||!screenSource||!sourceRay(source,frame))return null;
  const h=raycaster.intersectObject(screen,false)[0];if(!h)return null;lastHit.copy(h.point);
  return {x:h.uv.x,y:1-h.uv.y};
}
function dispatchMenuInput(event,frame=lastFrame){
  if(!event||!presenting||session?.visibilityState!=='visible')return;
  const current=panel();const {command,source}=event;
  if(command==='back'||command==='pause'){
    if(current)fd()?.back(current);else if(typeof mode!=='undefined'&&mode==='play'&&!won)pause();else openWorkspace();
    lastUI=0;return;
  }
  if(!current)return;
  if(current!==lastPanel)makeMenu(performance.now(),true);
  if(!rects.length)return;
  const at=rects.findIndex(r=>r.label===focusLabel);if(at>=0)menuCursor=at;
  menuCursor=Math.min(menuCursor,rects.length-1);
  if(['previous','next','increase','decrease'].includes(command)){
    if((command==='increase'||command==='decrease')&&rects[menuCursor]?.control?.matches('input[type="range"],input[type="number"],select')){
      const el=rects[menuCursor].control;const suffix=command==='increase'?'plus':'minus';
      menuEntries(current,{invoke,edit,external}).find(e=>e.el===el&&e.label.endsWith(suffix))?.action();
    }else menuCursor=(menuCursor+(['previous','decrease'].includes(command)?-1:1)+rects.length)%rects.length;
    const r=rects[menuCursor];r.hover?.();focusLabel=r.label;menuNavigating=true;lastUI=0;return;
  }
  const pointed=(!menuNavigating||command==='select')?hit(source,frame):null;
  const r=pointed||rects[menuCursor];
  if(r&&typeof r.action==='function'){lastMenuAction={hand:source.handedness,command,target:r.label};r.action();lastUI=0;}
}
function selectStart(e){
  if(!presenting||session.visibilityState!=='visible')return;
  if(trackedController(e.inputSource)&&(panel()||typing)){
    dispatchMenuInput(menuInput.selectStart(e.inputSource,{menu:true,visible:true}),e.frame||lastFrame);return;
  }
  if(neutral||suppressed.has(e.inputSource))return;
  const r=hit(e.inputSource,e.frame||lastFrame);if(r)suppressed.add(e.inputSource);
  if(!r){const h=canvasHit(e.inputSource,e.frame||lastFrame);if(h&&(screenMode==='workshop'||screenMode==='editor')&&!screenPointer){suppressed.add(e.inputSource);screenPointer={source:e.inputSource,target:screenSource,hit:h};pointerEvent('pointerdown',h,e.inputSource);}return;}
  if(typeof r.action==='string'){
    if(panel())return;
    if(r.action==='use')window.SkyCycleBathhouse?.interact();
    else if(r.action==='portal')window.SkyCyclePortals?.show();
    else if(r.action==='pause')pause(); // preserved from the Canal Choice candidate: brief pinch cannot miss a poll
    else {presses.set(e.inputSource,{action:r.action});held.add(r.action);if(!['left','right'].includes(r.action))pulses.set(r.action,performance.now()+90);}
  }else r.action();lastUI=0;
}
function selectEnd(e){
  menuInput.selectEnd(e.inputSource);
  suppressed.delete(e.inputSource);presses.delete(e.inputSource);held=new Set([...presses.values()].map(p=>p.action));
  if(screenPointer?.source===e.inputSource){pointerEvent('pointerup',screenPointer.hit,e.inputSource);screenPointer=null;}
}
function updateStage(viewer){
  if(recenter){const tr=viewer.transform;anchor.position.set(tr.position.x,tr.position.y,tr.position.z);const q=tr.orientation;rotation.set(q.x,q.y,q.z,q.w);poseForward.copy(forward).applyQuaternion(rotation);anchor.userData.yaw=Math.atan2(-poseForward.x,-poseForward.z);recenter=false;}
  anchor.rotation.set(0,(anchor.userData.yaw||0)+spatial.yaw*Math.PI/180,0);anchor.updateMatrixWorld(true);
  aperture.update(anchor.matrixWorld,spatial,sessionMode==='immersive-ar');
  aperture.sync(originalScene);
  screenMode=presentation({workshop:!!window.RouteWorkshop?.active,legacyEditor:typeof mode!=='undefined'&&mode==='edit',view:window.__delivery?.state.view});
  const liveWorld=screenMode==='diorama';world.visible=liveWorld;screen.visible=!liveWorld;
  const scale=.0025*spatial.scale;world.scale.setScalar(scale);
  if(typeof player!=='undefined'&&player)world.position.set(-(player.x+13)*scale,spatial.height-.05+(player.y+15)*scale,-spatial.distance);
  screen.position.set(0,spatial.height+.1,-spatial.distance);screen.scale.setScalar(spatial.scale);
  if(liveWorld&&sessionMode!=='immersive-ar'&&originalScene.fog){if(!xrScene.fog)xrScene.fog=originalScene.fog.clone();xrScene.fog.near=originalScene.fog.near*scale;xrScene.fog.far=originalScene.fog.far*scale;}else xrScene.fog=null;
  screenSource=screenMode==='workshop'?$('maker-canvas'):screenMode==='editor'?$('cv'):$('delivery-canvas');
  if(!liveWorld&&screenSource?.width&&screenSource?.height){
    screenContext.fillStyle='#102333';screenContext.fillRect(0,0,1440,900);screenContext.drawImage(screenSource,0,0,1440,900);
    if(screenMode==='screen'){
      const fx=$('delivery-fx');if(fx?.width)screenContext.drawImage(fx,0,0,1440,900);
      screenContext.fillStyle='#102333';screenContext.fillRect(0,0,1440,48);screenContext.fillStyle='#f1f8f5';screenContext.font='24px sans-serif';
      screenContext.fillText(`${$('delivery-name')?.textContent||'Sky Cycle'}  |  ${$('delivery-count')?.textContent||''} deliveries  |  ${$('delivery-timer')?.textContent?.trim()||''}`,22,32);
    }
    screenTexture.needsUpdate=true;
  }
}
function frame(now,f){
  if(!presenting||!f)return;
  try{
    lastFrame=f;reference=renderer.xr.getReferenceSpace();const viewer=f.getViewerPose(reference);if(!viewer){pause();return;}
    const sources=[...session.inputSources];if(session.visibilityState!=='visible')pause();
    const physical=[...(navigator.getGamepads?.()||[])].filter(p=>p?.connected&&p.mapping==='standard').map(gamepad=>({gamepad}));
    if(neutral&&sourcesNeutral([...sources,...physical],{panel:!!panel()||!!typing}))neutral=false;
    if(screenPointer){const h=canvasHit(screenPointer.source,f);if(h){screenPointer.hit=h;pointerEvent('pointermove',h);}else {pointerEvent('pointercancel',screenPointer.hit);screenPointer=null;}}
    for(const source of sources)if(!f.getPose(source.targetRaySpace,reference)&&(presses.has(source)||source.gamepad?.axes?.some(v=>Math.abs(v)>.3))){pause();break;}
    const left=sources.find(s=>!s.hand&&s.handedness==='left'&&s.gamepad?.mapping==='xr-standard');const down=!!left?.gamepad?.buttons[4]?.pressed;
    if(!panel()&&!neutral&&down&&!ctxDown)window.SkyCycleBathhouse?.interact();ctxDown=down;
    if(virtualRoot&&!__delivery.paused&&!__delivery.state.menu)__delivery.act('pause');
    const commands=menuInput.sample(sources,{menu:!!panel()||!!typing,visible:session.visibilityState==='visible',now});
    if(commands.length)dispatchMenuInput(commands[0],f);
    if(!presenting)return;
    window.pollGamepad?.();window.tick();updateStage(viewer);makeMenu(now);updateTracking(f);
    renderer.setClearColor(sessionMode==='immersive-ar'?0x000000:0x112239,sessionMode==='immersive-ar'?0:1);
    originalRender.call(renderer,xrScene,camera);frameCount++;eyeCount=viewer.views.length;
  }catch(e){status('XR stopped safely: '+e.message);endSession();}
}
async function finish(){
  if(finishing||(!presenting&&!starting))return;finishing=true;presenting=false;starting=false;release();typing=null;keyboardDialog?.close();virtualRoot=null;
  try{
    if($('sky-xr-tools'))$('sky-xr-tools').hidden=true;
    await Promise.resolve(); // Let Three's synchronous session-end listener restore its owner first.
    if(renderer){await renderer.setAnimationLoop(null);renderer.xr.enabled=false;if(originalRender)renderer.render=originalRender;restoreFramebuffer();restoreFramebuffer=()=>{};if(oldClear)renderer.setClearColor(oldClear,oldAlpha);}
    if(originalScene){world?.remove(originalScene);originalScene.updateMatrixWorld(true);} // never dispose game-owned assets
    aperture?.dispose();aperture=null;
    if(xrScene)disposeObject(xrScene);texture?.dispose();screenTexture?.dispose();visuals.clear();
    session=null;reference=null;lastFrame=null;world=null;xrScene=null;ui=null;screen=null;screenSource=null;rects=[];
    pause();window.RouteWorkshop?.draw?.();status('XR ended. The game and draft are preserved; resume when ready.');
  } finally {finishing=false;$('sky-xr-enter').disabled=!supportState.vr;$('sky-xr-enter-ar').disabled=!supportState.ar;}
  const next=pendingHandoff;pendingHandoff=null;next?.();
}
async function enter(kind='immersive-vr'){
  if(starting||presenting||finishing)return false;selectedMode=kind;
  renderer=window.__merged?.renderer;
  if(!renderer||!window.__gpuReady){status('The 3D renderer is not ready. Ordinary play is still available.');return false;}
  if(!renderer.backend.isWebGLBackend){
    if(window.RouteWorkshop?.state.dirty||window.RouteWorkshop?.active||window.RouteWorkshop?.testing){status('Save the Workshop draft, then return to a campaign route before the WebGL reload. Nothing was changed.');return false;}
    const url=new URL(location.href);url.searchParams.set('xr','1');url.searchParams.set('xrMode',kind==='immersive-ar'?'ar':'vr');
    const route=window.DeliveryCampaign?.routes[window.__delivery?.state.route];if(route&&window.SkyCyclePortals?.destinations.some(d=>d.id===route.id))url.searchParams.set('destination',route.id);location.assign(url.href);return false;
  }
  starting=true;$('sky-xr-enter').disabled=true;$('sky-xr-enter-ar').disabled=true;let acquired=null;
  try{
    acquired=await navigator.xr.requestSession(kind,sessionOptions(kind));session=acquired;sessionMode=kind;
    originalScene=__merged.scene;originalRender=renderer.render;oldClear=renderer.getClearColor(new T.Color());oldAlpha=renderer.getClearAlpha();oldView=__delivery.state.view;
    restoreFramebuffer=protectOpaqueXRFramebuffer(renderer);guide.close();makeStage();release();menuInput.seed([...session.inputSources]);
    session.addEventListener('selectstart',selectStart);session.addEventListener('selectend',selectEnd);
    session.addEventListener('inputsourceschange',e=>{release();if(e.removed?.length)pause();});
    session.addEventListener('visibilitychange',()=>{if(session?.visibilityState!=='visible')pause();});session.addEventListener('end',finish,{once:true});
    // r177 captures the application callback in setSession and wraps it with XR camera/target setup.
    // Installing our callback afterward bypasses that wrapper and renders a blank headset.
    renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');await renderer.setAnimationLoop(frame);await renderer.xr.setSession(session);
    if(!session||!starting)return false;presenting=true;starting=false;if($('sky-xr-tools'))$('sky-xr-tools').hidden=false;renderer.render=function(scene,cam){if(!presenting)return originalRender.call(this,scene,cam);};
    status(kind==='immersive-ar'?'AR active. Recenter and Spatial setup position the game in your room.':'VR active. All menus and Spatial setup remain available.');
    return true;
  } catch(e){const reason='XR could not start: '+e.message;try{await acquired?.end();}catch{}if(starting||presenting)await finish();status(reason);return false;}
  finally{$('sky-xr-enter').disabled=!supportState.vr;$('sky-xr-enter-ar').disabled=!supportState.ar;}
}
// Route cards share the original XR lifecycle; no second renderer or input owner.
function leaveMode(){
 if(!presenting||finishing||pendingHandoff)return Promise.resolve(false);
 return new Promise(resolve=>{
  pendingHandoff=()=>resolve(true);pause();
  session.end().catch(e=>{pendingHandoff=null;status(e.message);resolve(false);});
 });
}
$('sky-xr-enter').onclick=()=>enter('immersive-vr');$('sky-xr-enter-ar').onclick=()=>enter('immersive-ar');
window.addEventListener('pagehide',()=>{pause();session?.end().catch(()=>{});});
window.SkyCycleXR=Object.freeze({version:'0.27.0',requestMode:enter,leaveMode,get presenting(){return presenting;},get inputVisible(){return presenting&&session?.visibilityState==='visible';},get menuPanel(){return presenting?virtualRoot:null;},back,activate,focusControl,show,activateRay,openMenu:openWorkspace,
 getGamepad(){
  if(!presenting||!session)return null;
  const activeHeld=new Set(held);for(const [key,until]of pulses)if(performance.now()<until)activeHeld.add(key);else pulses.delete(key);
  const out=mappedPad([...session.inputSources],{panel:!!panel()||!!typing,directMenu:true,suppressed,held:activeHeld,enabled:!neutral&&session.visibilityState==='visible',allowRecovery:session.visibilityState==='visible'});
  // A connected physical Xbox remains usable inside the headset, including saved remaps.
  const pad=[...(navigator.getGamepads?.()||[])].find(p=>p?.connected&&p.mapping==='standard');
  if(pad&&!neutral&&session.visibilityState==='visible'){for(let i=0;i<out.buttons.length;i++)if(pad.buttons[i]?.pressed)out.buttons[i]={pressed:true,value:pad.buttons[i].value||1};for(let i=0;i<out.axes.length;i++)if(Math.abs(pad.axes[i]||0)>.25)out.axes[i]=pad.axes[i];}
  return out;
 },get diagnostics(){return {presenting,starting,menuInput:menuInput.diagnostics,lastMenuAction,focusedButton:focusLabel,controllerInputs:[...(session?.inputSources||[])].filter(trackedController).map(s=>({hand:s.handedness,mapping:s.gamepad.mapping,profiles:[...s.profiles||[]],buttons:[...s.gamepad.buttons].map(b=>({pressed:b.pressed,touched:b.touched,value:b.value}))})),uiVisible:!!ui?.visible,aperture:aperture?.diagnostics||null,mode:sessionMode,presentation:screenMode,placement:{...spatial},frames:frameCount,eyes:eyeCount,trackedSources:visuals.size,handJoints:[...visuals.values()].reduce((n,v)=>n+v.joints.filter(j=>j.visible).length,0),neutral,error:errorText,buttons:rects.map(({label,x,y,w,h})=>({label,x,y,w,h})),page,uiMatrix:ui?.matrixWorld.elements.slice(),screenMatrix:screen?.matrixWorld.elements.slice(),screenVisible:!!screen?.visible,screenSource:screenSource?.id||null,ownedScene:!!world?.children.includes(originalScene),clipped:!!aperture?.diagnostics.active,transparent:sessionMode==='immersive-ar'&&xrScene?.background===null,typing:!!typing,menuRoot:virtualRoot?.id||null,pointerTarget:screenPointer?.target?.id||null,editorTool:window.RouteWorkshop?.state?.tool||null};}});
support();
