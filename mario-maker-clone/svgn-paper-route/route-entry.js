/* Explicit route + presentation choices over the original campaign and XR owner.
 * Never start a replacement run until the requested presentation has succeeded.
 */
import {STORE,MODES,preference,entryGate,entryURL,pendingEntry,clearEntryURL} from './route-entry-core.mjs';
const $=id=>document.getElementById(id),xr=()=>window.SkyCycleXR,fd=()=>window.SkyCycleFlightDeck;
let pref=preference(null),saveOK=true,busy=false,serial=0,lastOutcome='ready',lastRoute=null;
let supported={ar:false,vr:false},checked=false;
try{pref=preference(JSON.parse(localStorage.getItem(STORE)||'null'));}catch{saveOK=false;}
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./route-entry.css',import.meta.url);document.head.append(style);
const dialog=document.createElement('dialog');dialog.id='sc-route-entry';dialog.setAttribute('aria-labelledby','sc-entry-title');document.body.append(dialog);
function clearURL(){const clean=clearEntryURL(location.href);if(clean!==location.href)history.replaceState(history.state,'',clean);}
function dismiss(){serial++;busy=false;clearURL();lastOutcome='cancelled';dialog.close();}
dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
dialog.addEventListener('close',()=>{if(busy&&!dialog.open){serial++;busy=false;lastOutcome='cancelled';clearURL();}});
function message(title,body,action=null){
 dialog.replaceChildren();const h=document.createElement('h2');h.id='sc-entry-title';h.textContent=title;
 const p=document.createElement('p');p.id='sc-entry-message';p.textContent=body;p.setAttribute('role','status');
 const row=document.createElement('div');row.className='sc-entry-actions';
 const back=document.createElement('button');back.id='sc-entry-back';back.type='button';back.textContent=busy?'Cancel launch':'Back';back.onclick=dismiss;row.append(back);
 if(action){const b=document.createElement('button');b.id='sc-entry-confirm';b.type='button';b.textContent=action.label;b.onclick=action.run;row.append(b);}
 dialog.append(h,p,row);if(!dialog.open)dialog.showModal();back.focus({preventScroll:true});
}
function persist(mode){pref=preference({mode});try{localStorage.setItem(STORE,JSON.stringify(pref));saveOK=true;}catch{saveOK=false;}updateCards();}
function currentGate(id,mode){return entryGate({routes:window.DeliveryCampaign?.routes,id,mode,
 ready:window.PaperDeliveryCampaign?.status==='ready',protectedDraft:!!(window.RouteWorkshop?.active||window.RouteWorkshop?.testing||window.RouteWorkshop?.state?.dirty),
 busy,supported,webgl:!!window.__merged?.renderer?.backend?.isWebGLBackend,currentMode:xr()?.presenting?xr().diagnostics.mode:null});}
function commitRoute(id,mode){
 // Revalidate after a permission dialog or session transition. Nothing accepts a
 // stale route index or discards a Workshop opened while the request was pending.
 const g=currentGate(id,mode);if(!g.ok){lastOutcome='blocked';message('Route unchanged',g.reason);return false;}
 fd()?.releaseForTravel();
 for(const d of document.querySelectorAll('dialog[open]'))d.close();
 __delivery.startRoute(g.index);
 if(__delivery.state.view!==(mode==='screen'?'2d':'3d'))__delivery.act('view');
 fd()?.resetInput();lastOutcome='started';lastRoute=id;clearURL();persist(mode);return true;
}
async function beginSession(id,mode){
 const g=currentGate(id,mode);if(!g.ok){lastOutcome='blocked';message('Route unchanged',g.reason);return;}
 if(!window.__gpuReady){message('Renderer not ready','The immersive renderer has not finished loading. Your route is unchanged.');return;}
 const token=++serial;busy=true;lastOutcome='requesting';
 message(`Enter ${mode.toUpperCase()} / ${g.route.name}`,'Approve the browser request to start this route. Cancelling keeps your current route.');
 // requestMode calls requestSession synchronously before its first await. Support
 // was queried ahead of this user activation, not inside the button handler.
 const accepted=await xr().requestMode('immersive-'+mode);
 if(token!==serial||!dialog.open){if(accepted)await xr().leaveMode();return;}
 busy=false;
 if(!accepted){lastOutcome='denied';message('Route unchanged','Immersive entry was not completed. Nothing was restarted and no other play mode was chosen.');return;}
 commitRoute(id,mode);
}
function confirmEntry(id,mode){
 const g=currentGate(id,mode);if(!g.ok){message('Route unchanged',g.reason);return;}
 message(`Ready for ${g.route.name}`,`Choose Enter ${mode.toUpperCase()} to request a new immersive session. Your current route stays unchanged until entry succeeds.`,
  {label:`Enter ${mode.toUpperCase()} on ${g.route.name}`,run:()=>launch(id,mode)});
}
function launch(id,mode){
 const g=currentGate(id,mode);
 if(!g.ok){lastOutcome='blocked';message('Route unchanged',g.reason);return;}
 if(g.action==='reload'){
  message(`Prepare ${mode.toUpperCase()} / ${g.route.name}`,'This renderer needs a WebGL reload for immersion. The current unfinished run will restart only after you confirm entry on the reloaded page. Saved progress remains. Cancel to keep this tab unchanged.',
   {label:`Reload for ${mode.toUpperCase()}`,run:()=>{const guard=currentGate(id,mode);if(!guard.ok){message('Route unchanged',guard.reason);return;}location.assign(entryURL(location.href,id,mode));}});return;
 }
 if(g.action==='switch'||g.action==='leave'){
  message(mode==='screen'?'Leave XR for screen play?':`Change to ${mode.toUpperCase()}?`,'The current immersive session must end first. The route and saved progress are preserved until the selected new route starts.',
   {label:mode==='screen'?'Leave XR and play on screen':'Leave current mode',run:async()=>{
    const token=++serial;busy=true;lastOutcome='leaving';const ended=await xr().leaveMode();
    if(token!==serial)return;busy=false;
    if(!ended){message('Route unchanged','XR could not finish closing. Use the existing Exit XR control and try again.');return;}
    if(mode==='screen')commitRoute(id,mode);else confirmEntry(id,mode);
   }});return;
 }
 if(g.action==='enter'){beginSession(id,mode);return;}
 commitRoute(id,mode);
}
function updateCards(){
 for(const b of document.querySelectorAll('[data-sc-mode]')){
  const mode=b.dataset.scMode,available=mode==='screen'||supported[mode];
  b.setAttribute('aria-disabled',available?'false':'true');b.dataset.preferred=String(pref.mode===mode);
  b.textContent=mode==='screen'?'Screen':`${mode.toUpperCase()}${checked&&!available?' unavailable':''}`;
 }
 for(const n of document.querySelectorAll('.sc-route-preference'))n.textContent=pref.mode?`Last used: ${pref.mode==='screen'?'Screen':pref.mode.toUpperCase()}${saveOK?'':' / this session only'}`:'Choose how to play';
}
function mount(){
 const menu=$('delivery-menu');if(!menu)return;
 // Let existing ordering/advanced visibility finish before grouping each original
 // button with semantic sibling controls. There are never buttons inside buttons.
 window.__ground?.menu?.();
 for(const card of menu.querySelectorAll('[data-course]')){
  if(card.parentElement?.classList.contains('sc-route-card'))continue;
  const route=window.DeliveryCampaign?.routes[Number(card.dataset.course)];if(!route)continue;
  const wrap=document.createElement('article');wrap.className='sc-route-card'+(card.classList.contains('expert-route')?' expert-route':'');
  wrap.dataset.scRoute=route.id;wrap.setAttribute('aria-label',route.name+' play choices');card.before(wrap);wrap.append(card);
  const label=document.createElement('span');label.className='sc-route-default';label.textContent='Play in current view';card.append(label);
  const row=document.createElement('div');row.className='sc-route-modes';
  for(const mode of MODES){const b=document.createElement('button');b.type='button';b.dataset.scMode=mode;b.dataset.scRoute=route.id;
   b.setAttribute('aria-label',`Play ${route.name} in ${mode==='screen'?'Screen':mode.toUpperCase()}`);
   b.onclick=()=>launch(route.id,mode);row.append(b);}
  const info=document.createElement('small');info.className='sc-route-preference';wrap.append(row,info);
 }
 updateCards();
}
const observer=new MutationObserver(mount);observer.observe($('delivery-menu'),{childList:true});mount();
async function detect(){
 const modes=await Promise.allSettled(['ar','vr'].map(m=>navigator.xr?.isSessionSupported('immersive-'+m)||false));
 supported={ar:modes[0].status==='fulfilled'&&!!modes[0].value,vr:modes[1].status==='fulfilled'&&!!modes[1].value};checked=true;updateCards();
 const pending=pendingEntry(location.href,DeliveryCampaign.routes);if(pending)confirmEntry(pending.id,pending.mode);
}
window.SkyCycleRouteEntry=Object.freeze({version:'0.27.0',get diagnostics(){return {busy,checked,supported:{...supported},preference:{...pref},saveOK,lastOutcome,lastRoute};}});
detect().catch(()=>{checked=true;updateCards();});
