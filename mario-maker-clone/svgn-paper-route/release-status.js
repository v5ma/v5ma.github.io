/* Explicit installed-build reporting; updates never discard a draft silently. */
(function(){'use strict';
 const VERSION='0.14.0',BUILD='sky-post-2026.09.07';
 function boot(){const host=document.querySelector('#delivery-header .actions');if(!host)return;const label=document.createElement('span');label.id='rail-build';label.textContent='v'+VERSION;label.title=BUILD;const button=document.createElement('button');button.id='rail-update';button.textContent='Check update';host.append(label,button);
  let latest=null;
  button.onclick=async()=>{if(latest&&latest.build!==BUILD){if(window.RouteWorkshop?.state.dirty&&!confirm('Save or export your unsaved Workshop draft before reloading. Reload now?'))return;try{const r=await navigator.serviceWorker?.getRegistration();await r?.update();}catch{}location.reload();return;}
   button.disabled=true;button.textContent='Checking...';try{const response=await fetch('./release.json?t='+Date.now(),{cache:'no-store',credentials:'same-origin'});if(!response.ok)throw Error('release manifest unavailable');latest=await response.json();if(typeof latest.build!=='string')throw Error('invalid manifest');button.textContent=latest.build===BUILD?'Up to date':'Reload v'+latest.version;}catch{button.textContent='Retry update check';}finally{button.disabled=false;}
  };
  window.PaperDeliveryRelease=Object.freeze({version:VERSION,build:BUILD});
  import('./ride-lab-loader.js').catch(error=>console.error('Ride Lab could not load:',error));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
