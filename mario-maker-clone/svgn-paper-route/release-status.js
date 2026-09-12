/* Explicit build and campaign readiness. Optional authoring tools must not decide
 * which campaign is loaded, and an unfinished download must not spawn old data. */
(function(){'use strict';
 const VERSION='0.17.0',BUILD='sky-cycle-route-compass-2026.09.12';
 // Register before the legacy DOMContentLoaded pause listener. Native dialogs
 // consume their own keyboard events without unpausing the route underneath.
 window.addEventListener('keydown',event=>window.SkyCycleFlightDeck?.handleKey(event),true);
 function boot(){
  document.title='Sky Cycle | Ride, explore, create';
  const brand=document.querySelector('#delivery-header .delivery-brand');if(brand)brand.innerHTML='Sky Cycle<span>A SVGN ORIGINAL</span>';
  const host=document.querySelector('#delivery-header .actions');if(!host)return;
  const label=document.createElement('span');label.id='rail-build';label.textContent='v'+VERSION;label.title=BUILD;
  const button=document.createElement('button');button.id='rail-update';button.textContent='Check update';host.append(label,button);
  let latest=null;
  function reload(){
   if(window.RouteWorkshop?.state.dirty&&!confirm('Save or export your unsaved Workshop draft before reloading. Reload now?'))return;
   location.reload();
  }
  button.onclick=async()=>{
   if(latest&&latest.build!==BUILD){
    if(window.RouteWorkshop?.state.dirty&&!confirm('Save or export your unsaved Workshop draft before reloading. Reload now?'))return;
    try{const r=await navigator.serviceWorker?.getRegistration();await r?.update();}catch{}
    location.reload();return;
   }
   button.disabled=true;button.textContent='Checking...';
   try{const response=await fetch('./release.json?t='+Date.now(),{cache:'no-store',credentials:'same-origin'});if(!response.ok)throw Error('release manifest unavailable');latest=await response.json();if(typeof latest.build!=='string')throw Error('invalid manifest');button.textContent=latest.build===BUILD?'Up to date':'Reload v'+latest.version;}
   catch{button.textContent='Retry update check';}finally{button.disabled=false;}
  };
  window.PaperDeliveryRelease=Object.freeze({version:VERSION,build:BUILD});

  // Installed synchronously in the initial DOM boot task, before any route can
  // be clicked. Keep original disabled states, including on recreated menus.
  let status='loading';const blocked=new Map();
  const selector='[data-course],[data-delivery="retry"],[data-delivery="next"],[data-mk="route"],[data-mk="test"],#beginner-blueprint';
  const notice=document.createElement('span');notice.id='campaign-load-state';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.textContent='Preparing routes...';host.append(notice);
  const retry=document.createElement('button');retry.id='campaign-load-retry';retry.className='delivery-btn';retry.textContent='Reload to retry';retry.hidden=true;retry.onclick=reload;host.append(retry);
  function lock(){for(const item of document.querySelectorAll(selector)){if(!blocked.has(item))blocked.set(item,item.disabled);item.disabled=true;}}
  const watch=new MutationObserver(()=>{if(status!=='ready')lock();});watch.observe(document.body,{childList:true,subtree:true});lock();
  function guard(event){if(status==='ready'||!event.target.closest?.(selector))return;event.preventDefault();event.stopImmediatePropagation();}
  document.addEventListener('click',guard,true);
  window.PaperDeliveryCampaign=Object.freeze({get status(){return status;}});
  import('./sky-relay.js').then(()=>{
   if(!window.SkyRelayReady)throw Error('Campaign registration did not complete');
   status='ready';watch.disconnect();document.removeEventListener('click',guard,true);
   for(const [item,disabled]of blocked)item.disabled=disabled;blocked.clear();notice.hidden=true;
  }).catch(error=>{
   // Do not retry a partially evaluated module or silently run an older course.
   // Existing drafts can still be saved/exported; reload is an explicit action.
   status='error';notice.textContent='The updated routes could not load.';retry.hidden=false;
   console.error('Campaign load failed:',error);
  }).finally(()=>{
   import('./prismatic-renderer.js').catch(error=>console.error('Optional material pass could not load:',error));
   import('./ride-lab-loader.js').catch(error=>console.error('Ride Lab could not load:',error));
   import('./flight-deck.js').then(()=>import('./route-compass.js')).catch(error=>console.error('Flight Deck or Route Compass could not load:',error));
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
